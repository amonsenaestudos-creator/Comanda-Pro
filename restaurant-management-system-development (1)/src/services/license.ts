import { doc, getDoc, Timestamp } from '@firebase/firestore';
import { firestoreDb, hasLicenseBackendConfig } from './firebase';

const SAVED_KEY_STORAGE = 'comandapro_license_key_v2';
const SAVED_STATUS_STORAGE = 'comandapro_license_cache_v2';
const MAX_OFFLINE_SECONDS = 24 * 60 * 60; // Permite até 24h offline para caixas já validados

export interface LicenseInfo {
  restaurantName: string;
  expiresAt: string;
  leaseExpiresAt: string;
  periodId: string;
}

interface StoredLicenseCache {
  restaurantName: string;
  expiresAt: string;
  verifiedAt: number;
}

export class InvalidAccessKeyError extends Error {
  constructor(message = 'A chave informada é inválida, expirada ou inativa.') {
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
    return JSON.parse(raw) as StoredLicenseCache;
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

export async function getCachedLicense(): Promise<LicenseInfo | null> {
  const cache = getSavedCache();
  if (!cache) return null;

  const now = Math.floor(Date.now() / 1000);
  const cacheExpiresAtSec = Math.floor(new Date(cache.expiresAt).getTime() / 1000);

  // Se já expirou a validade da licença
  if (now > cacheExpiresAtSec) {
    clearSavedActivation();
    return null;
  }

  // Se passou do tempo máximo permitido offline (24 horas desde a última verificação)
  const offlineMax = cache.verifiedAt + MAX_OFFLINE_SECONDS;
  if (now > offlineMax) {
    return null;
  }

  const leaseExp = Math.min(cacheExpiresAtSec, offlineMax);

  return {
    restaurantName: cache.restaurantName || 'Comanda Pro',
    expiresAt: cache.expiresAt,
    leaseExpiresAt: new Date(leaseExp * 1000).toISOString(),
    periodId: new Date(cache.expiresAt).toISOString().slice(0, 7),
  };
}

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

    if (!docSnap.exists()) {
      throw new InvalidAccessKeyError('Chave de licença não encontrada ou não cadastrada.');
    }

    const data = docSnap.data();

    // Verificação de bloqueio
    if (data.ativa === false || data.bloqueada === true) {
      throw new InvalidAccessKeyError(
        data.motivoBloqueio || 'Esta chave foi desativada ou bloqueada pela administração.'
      );
    }

    // Validade
    let expiresAtDate: Date;
    if (data.validade instanceof Timestamp) {
      expiresAtDate = data.validade.toDate();
    } else if (typeof data.validade === 'string') {
      expiresAtDate = new Date(data.validade);
    } else if (typeof data.validade === 'number') {
      expiresAtDate = new Date(data.validade);
    } else {
      // Padrão: 30 dias se não definido
      expiresAtDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    if (isNaN(expiresAtDate.getTime()) || Date.now() > expiresAtDate.getTime()) {
      throw new InvalidAccessKeyError('Esta licença expirou. Renove sua assinatura para continuar.');
    }

    const expiresAt = expiresAtDate.toISOString();
    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAtSec = Math.floor(expiresAtDate.getTime() / 1000);
    const leaseExp = Math.min(expiresAtSec, nowSec + MAX_OFFLINE_SECONDS);

    const licenseInfo: LicenseInfo = {
      restaurantName: data.cliente || data.nomeFantasia || 'Restaurante Licenciado',
      expiresAt,
      leaseExpiresAt: new Date(leaseExp * 1000).toISOString(),
      periodId: expiresAt.slice(0, 7),
    };

    saveKey(normalizedKey);
    saveCache({
      restaurantName: licenseInfo.restaurantName,
      expiresAt,
      verifiedAt: nowSec,
    });

    return licenseInfo;
  } catch (error) {
    if (error instanceof InvalidAccessKeyError || error instanceof LicenseConfigurationError) {
      throw error;
    }
    const err = error as { code?: string; message?: string };
    if (err?.code === 'permission-denied') {
      throw new InvalidAccessKeyError('Acesso negado às regras do banco de dados.');
    }
    throw error;
  }
}

export async function activateWithKey(key: string): Promise<LicenseInfo> {
  return checkLicenseOnline(key);
}

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
    // Falha de rede: tenta usar o cache offline
    throw error;
  }
}
