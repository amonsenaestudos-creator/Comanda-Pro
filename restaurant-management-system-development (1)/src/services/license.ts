import { httpsCallable } from '@firebase/functions';
import { functionsClient, hasLicenseBackendConfig } from './firebase';

const ACTIVATION_TOKEN_KEY = 'comandapro_activation_token_v1';
const SIGNED_LEASE_KEY = 'comandapro_signed_lease_v1';
const INSTALLATION_ID_KEY = 'comandapro_installation_id_v1';
const MAX_OFFLINE_LEASE_SECONDS = 12 * 60 * 60;

export interface LicenseInfo {
  restaurantName: string;
  expiresAt: string;
  leaseExpiresAt: string;
  periodId: string;
}

interface LeaseClaims {
  iss: string;
  aud: string;
  sub: string;
  restaurantName: string;
  periodId: string;
  deviceHash: string;
  licenseExp: number;
  iat: number;
  exp: number;
}

interface ActivateResponse {
  active: boolean;
  activationToken?: string;
  signedLease?: string;
  message?: string;
}

interface CheckResponse {
  active: boolean;
  signedLease?: string;
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

let temporaryInstallationId: string | null = null;

export function getInstallationId(): string {
  try {
    const savedId = localStorage.getItem(INSTALLATION_ID_KEY);
    if (savedId && /^[0-9a-f-]{36}$/i.test(savedId)) return savedId;

    const newId = crypto.randomUUID();
    localStorage.setItem(INSTALLATION_ID_KEY, newId);
    return newId;
  } catch {
    // Keep this stable for the lifetime of the tab if browser storage is blocked.
    temporaryInstallationId ??= crypto.randomUUID();
    return temporaryInstallationId;
  }
}

function getSavedActivationToken(): string | null {
  try {
    return localStorage.getItem(ACTIVATION_TOKEN_KEY);
  } catch {
    return null;
  }
}

function getSavedSignedLease(): string | null {
  try {
    return localStorage.getItem(SIGNED_LEASE_KEY);
  } catch {
    return null;
  }
}

function saveActivationCredentials(token: string, signedLease: string): void {
  try {
    localStorage.setItem(ACTIVATION_TOKEN_KEY, token);
    localStorage.setItem(SIGNED_LEASE_KEY, signedLease);
  } catch {
    clearSavedActivation();
    throw new LicenseConfigurationError(
      'O navegador não permitiu salvar a ativação. Habilite o armazenamento local para este site e tente novamente.'
    );
  }
}

export function clearSavedActivation(): void {
  try {
    localStorage.removeItem(ACTIVATION_TOKEN_KEY);
    localStorage.removeItem(SIGNED_LEASE_KEY);
  } catch {
    // Nothing else is needed if browser storage is unavailable.
  }
}

function decodeBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeBase64(value: string): Uint8Array {
  const cleanValue = value.replace(/\s/g, '');
  const binary = atob(cleanValue);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buffer).set(bytes);
  return buffer;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    toArrayBuffer(new TextEncoder().encode(value))
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function isLeaseClaims(value: unknown): value is LeaseClaims {
  if (!value || typeof value !== 'object') return false;
  const claims = value as Partial<LeaseClaims>;
  return (
    typeof claims.iss === 'string' &&
    typeof claims.aud === 'string' &&
    typeof claims.sub === 'string' &&
    typeof claims.restaurantName === 'string' &&
    typeof claims.periodId === 'string' &&
    typeof claims.deviceHash === 'string' &&
    typeof claims.licenseExp === 'number' &&
    typeof claims.iat === 'number' &&
    typeof claims.exp === 'number'
  );
}

export async function verifySignedLease(
  signedLease: string,
  installationId = getInstallationId()
): Promise<LicenseInfo | null> {
  const publicKeyBase64 = import.meta.env.VITE_LICENSE_PUBLIC_KEY_DER_BASE64;
  if (typeof crypto === 'undefined' || !publicKeyBase64 || !crypto.subtle) return null;

  try {
    const parts = signedLease.split('.');
    if (parts.length !== 3) return null;

    const [encodedHeader, encodedClaims, encodedSignature] = parts;
    const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedHeader))) as {
      alg?: string;
      typ?: string;
    };
    if (header.alg !== 'RS256' || header.typ !== 'JWT') return null;

    const claimsValue: unknown = JSON.parse(
      new TextDecoder().decode(decodeBase64Url(encodedClaims))
    );
    if (!isLeaseClaims(claimsValue)) return null;
    const claims = claimsValue;

    const publicKey = await crypto.subtle.importKey(
      'spki',
      toArrayBuffer(decodeBase64(publicKeyBase64)),
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );
    const isSignatureValid = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      toArrayBuffer(decodeBase64Url(encodedSignature)),
      toArrayBuffer(new TextEncoder().encode(`${encodedHeader}.${encodedClaims}`))
    );
    if (!isSignatureValid) return null;

    const nowSeconds = Math.floor(Date.now() / 1000);
    if (
      claims.iss !== 'conta-bahia-contabilidade' ||
      claims.aud !== 'comanda-pro' ||
      claims.exp <= nowSeconds ||
      claims.licenseExp <= nowSeconds ||
      claims.iat > nowSeconds + 60 ||
      claims.exp <= claims.iat ||
      claims.exp > claims.licenseExp ||
      claims.exp - claims.iat > MAX_OFFLINE_LEASE_SECONDS + 60
    ) {
      return null;
    }

    const expectedDeviceHash = await sha256Hex(installationId);
    if (claims.deviceHash !== expectedDeviceHash) return null;

    return {
      restaurantName: claims.restaurantName,
      periodId: claims.periodId,
      expiresAt: new Date(claims.licenseExp * 1000).toISOString(),
      leaseExpiresAt: new Date(claims.exp * 1000).toISOString(),
    };
  } catch {
    return null;
  }
}

export async function getCachedLicense(): Promise<LicenseInfo | null> {
  const signedLease = getSavedSignedLease();
  if (!signedLease) return null;

  const license = await verifySignedLease(signedLease);
  if (!license) clearSavedActivation();
  return license;
}

export async function activateWithKey(key: string): Promise<LicenseInfo> {
  if (!hasLicenseBackendConfig || !functionsClient) {
    throw new LicenseConfigurationError(
      'A conexão segura com o Firebase ainda não está configurada. Peça à Conta Bahia para concluir a configuração.'
    );
  }

  const normalizedKey = key.trim().toUpperCase();
  if (!normalizedKey) throw new InvalidAccessKeyError('Digite a chave mensal recebida da Conta Bahia.');

  const activate = httpsCallable<{ key: string; deviceId: string }, ActivateResponse>(
    functionsClient,
    'ativarComanda'
  );
  const result = await activate({ key: normalizedKey, deviceId: getInstallationId() });

  if (!result.data.active || !result.data.activationToken || !result.data.signedLease) {
    throw new InvalidAccessKeyError(result.data.message);
  }

  const license = await verifySignedLease(result.data.signedLease);
  if (!license) {
    throw new LicenseConfigurationError(
      'A assinatura de segurança não pôde ser confirmada. Verifique a chave pública configurada no sistema.'
    );
  }

  saveActivationCredentials(result.data.activationToken, result.data.signedLease);
  return license;
}

export async function refreshSavedLicense(): Promise<LicenseInfo | null> {
  if (!hasLicenseBackendConfig || !functionsClient) {
    throw new LicenseConfigurationError(
      'A conexão de validação com o Firebase não está configurada.'
    );
  }

  const activationToken = getSavedActivationToken();
  if (!activationToken) return null;

  const check = httpsCallable<
    { activationToken: string; deviceId: string },
    CheckResponse
  >(functionsClient, 'consultarAtivacaoComanda');
  const result = await check({
    activationToken,
    deviceId: getInstallationId(),
  });

  if (!result.data.active || !result.data.signedLease) {
    clearSavedActivation();
    return null;
  }

  const license = await verifySignedLease(result.data.signedLease);
  if (!license) {
    clearSavedActivation();
    throw new LicenseConfigurationError(
      'A assinatura recebida do servidor não pôde ser confirmada. Verifique a configuração da chave pública.'
    );
  }

  try {
    saveActivationCredentials(activationToken, result.data.signedLease);
  } catch {
    // The existing signed lease remains usable for its limited validity window.
  }
  return license;
}

export function isLicenseBackendConfigured(): boolean {
  return hasLicenseBackendConfig;
}
