import { doc, getDoc } from '@firebase/firestore';
import { firestoreDb, hasLicenseBackendConfig } from './firebase';
import { avaliarLicenca } from './licenseRules';

const SAVED_KEY_STORAGE = 'comandapro_license_key_v2';
const SAVED_STATUS_STORAGE = 'comandapro_license_cache_v2';
/** Tolerância de internet caída: caixa já liberado segue funcionando por até 24h. */
const MAX_OFFLINE_SECONDS = 24 * 60 * 60;

export interface LicenseInfo {
  restaurantName: string;
  /** Data/hora (ISO) da última vez que o servidor confirmou `ativa: true`. */
  verifiedAt: string;
  /** Fim da tolerância offline (ISO). Depois disso é preciso reconectar para revalidar. */
  offlineUntil: string;
  /** Sempre true quando a licença é entregue ao app: o bloqueio é feito antes disso. */
  ativa: true;
}

interface StoredLicenseCache {
  restaurantName: string;
  /** epoch em segundos da última confirmação online */
  verifiedAt: number;
}

export class InvalidAccessKeyError extends Error {
  constructor(message = 'Chave inválida ou desativada. O caixa só funciona com o campo ativa/activa: true.') {
    super(message);
    this.name = 'InvalidAccessKeyError';
  }
}

export class LicenseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LicenseConfigurationError';
  }
}

export function cleanKey(key: string): string {
  return key.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
}

export function getSavedKey(): string | null {
  try {
    return localStorage.getItem(SAVED_KEY_STORAGE);
  } catch {
    return null;
  }
}

export function saveKey(key: string): void {
  try {
    localStorage.setItem(SAVED_KEY_STORAGE, cleanKey(key));
  } catch {
    // Falha silenciosa se armazenamento estiver desativado
  }
}

function getSavedCache(): StoredLicenseCache | null {
  try {
    const raw = localStorage.getItem(SAVED_STATUS_STORAGE);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredLicenseCache>;
    if (typeof parsed?.verifiedAt !== 'number') return null;
    return {
      restaurantName: parsed.restaurantName || 'Comanda Pro',
      verifiedAt: parsed.verifiedAt,
    };
  } catch {
    return null;
  }
}

function saveCache(cache: StoredLicenseCache): void {
  try {
    localStorage.setItem(SAVED_STATUS_STORAGE, JSON.stringify(cache));
  } catch {
    // Falha silenciosa
  }
}

export function clearSavedActivation(): void {
  try {
    localStorage.removeItem(SAVED_KEY_STORAGE);
    localStorage.removeItem(SAVED_STATUS_STORAGE);
  } catch {
    // Falha silenciosa
  }
}

export function isLicenseBackendConfigured(): boolean {
  return hasLicenseBackendConfig;
}

function montarLicenca(restaurantName: string, verifiedAtSec: number): LicenseInfo {
  const offlineUntilSec = verifiedAtSec + MAX_OFFLINE_SECONDS;
  return {
    restaurantName,
    verifiedAt: new Date(verifiedAtSec * 1000).toISOString(),
    offlineUntil: new Date(offlineUntilSec * 1000).toISOString(),
    ativa: true,
  };
}

/**
 * Licença guardada neste computador, aceita apenas dentro da tolerância offline.
 * Não existe mais validade por data: se `ativa` foi trocado para false no
 * Firestore, o bloqueio chega na próxima verificação online (ou ao expirar a
 * tolerância offline).
 */
export async function getCachedLicense(): Promise<LicenseInfo | null> {
  const cache = getSavedCache();
  if (!cache) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (nowSec > cache.verifiedAt + MAX_OFFLINE_SECONDS) return null;

  return montarLicenca(cache.restaurantName, cache.verifiedAt);
}

/**
 * Consulta o documento `licencas/{chave}` e libera o caixa somente se o campo
 * `ativa` (também aceita a grafia `activa`, com "c") for verdadeiro.
 * Os campos `validade`/datas são ignorados de propósito.
 */
export async function checkLicenseOnline(key: string): Promise<LicenseInfo> {
  if (!hasLicenseBackendConfig || !firestoreDb) {
    throw new LicenseConfigurationError(
      'A conexão com o Firebase não está configurada no sistema. Verifique as credenciais no .env.'
    );
  }

  const normalizedKey = cleanKey(key);
  if (!normalizedKey) {
    throw new InvalidAccessKeyError('Informe a chave de ativação.');
  }

  try {
    const docRef = doc(firestoreDb, 'licencas', normalizedKey);
    const docSnap = await getDoc(docRef);

    const veredito = avaliarLicenca(docSnap.exists() ? docSnap.data() : null);
    if (!veredito.ok) {
      throw new InvalidAccessKeyError(veredito.reason);
    }

    const nowSec = Math.floor(Date.now() / 1000);
    const licenseInfo = montarLicenca(veredito.restaurantName, nowSec);

    saveKey(normalizedKey);
    saveCache({ restaurantName: veredito.restaurantName, verifiedAt: nowSec });

    return licenseInfo;
  } catch (error) {
    if (error instanceof InvalidAccessKeyError || error instanceof LicenseConfigurationError) {
      throw error;
    }
    const err = error as { code?: string; message?: string };
    if (err?.code === 'permission-denied') {
      throw new InvalidAccessKeyError(
        'Sem permissão de leitura no Firestore. Confirme as regras de acesso da coleção licencas.'
      );
    }
    throw error;
  }
}

export async function activateWithKey(key: string): Promise<LicenseInfo> {
  return checkLicenseOnline(key);
}

/**
 * Revalidação periódica. Retorna a licença atualizada, `null` quando o servidor
 * respondeu que a chave não está mais ativa (bloqueio) e lança erro apenas em
 * falha de rede/conexão (que cai na tolerância offline).
 */
export async function refreshSavedLicense(): Promise<LicenseInfo | null> {
  const savedKey = getSavedKey();
  if (!savedKey) return null;

  try {
    return await checkLicenseOnline(savedKey);
  } catch (error) {
    if (error instanceof InvalidAccessKeyError) {
      clearSavedActivation();
      return null;
    }
    throw error;
  }
}
