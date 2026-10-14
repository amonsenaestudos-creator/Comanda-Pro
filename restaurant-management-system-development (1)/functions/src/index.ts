import {
  createHash,
  createHmac,
  createPrivateKey,
  randomBytes,
  sign as signBytes,
  type KeyObject,
} from 'node:crypto';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { initializeApp } from 'firebase-admin/app';
import { defineSecret } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';

initializeApp();

const db = getFirestore();
const LICENSE_PEPPER = defineSecret('LICENSE_PEPPER');
const LICENSE_SIGNING_PRIVATE_KEY = defineSecret('LICENSE_SIGNING_PRIVATE_KEY');
const FUNCTION_REGION = 'southamerica-east1';
const OFFLINE_LEASE_SECONDS = 12 * 60 * 60;
const KEY_PATTERN = /^CP[A-HJ-NP-Z2-9]{20}$/;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface LeaseInput {
  subscriptionId: string;
  restaurantName: string;
  periodId: string;
  deviceHash: string;
  expiresAtMs: number;
}

interface ValidatedLicense {
  active: true;
  subscriptionId: string;
  restaurantName: string;
  periodId: string;
  deviceHash: string;
  expiresAtMs: number;
}

function getPepper(): string {
  const pepper = LICENSE_PEPPER.value();
  if (pepper.length < 32) {
    throw new HttpsError('internal', 'A configuração segura das licenças está incompleta.');
  }
  return pepper;
}

function deriveDocumentId(pepper: string, purpose: string, value: string): string {
  return createHmac('sha256', pepper).update(`${purpose}\0${value}`).digest('hex');
}

function sha256Hex(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function normalizedKey(value: unknown): string | null {
  if (typeof value !== 'string' || value.length > 80) return null;
  const normalized = value.trim().toUpperCase().replace(/[\s-]/g, '');
  return KEY_PATTERN.test(normalized) ? normalized : null;
}

function validDeviceId(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

function timestampMillis(value: unknown): number {
  return value instanceof Timestamp ? value.toMillis() : 0;
}

function createSignedLease(input: LeaseInput): string {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const licenseExpiresSeconds = Math.floor(input.expiresAtMs / 1000);
  const leaseExpiresSeconds = Math.min(
    licenseExpiresSeconds,
    nowSeconds + OFFLINE_LEASE_SECONDS
  );

  if (leaseExpiresSeconds <= nowSeconds) {
    throw new HttpsError('failed-precondition', 'A licença expirou. Solicite a chave mensal atual.');
  }

  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(
    JSON.stringify({
      iss: 'conta-bahia-contabilidade',
      aud: 'comanda-pro',
      sub: input.subscriptionId,
      restaurantName: input.restaurantName,
      periodId: input.periodId,
      deviceHash: input.deviceHash,
      licenseExp: licenseExpiresSeconds,
      iat: nowSeconds,
      exp: leaseExpiresSeconds,
    })
  ).toString('base64url');
  const content = `${header}.${claims}`;
  const signature = signBytes('RSA-SHA256', Buffer.from(content), getSigningKey()).toString('base64url');
  return `${content}.${signature}`;
}

let signingKey: KeyObject | null = null;

function getSigningKey(): KeyObject {
  if (signingKey) return signingKey;
  const encodedKey = LICENSE_SIGNING_PRIVATE_KEY.value();
  if (!encodedKey) {
    throw new HttpsError('internal', 'A assinatura segura das licenças não está configurada.');
  }
  try {
    signingKey = createPrivateKey({
      key: Buffer.from(encodedKey, 'base64'),
      format: 'der',
      type: 'pkcs8',
    });
    return signingKey;
  } catch {
    throw new HttpsError('internal', 'A chave privada de assinatura da licença está inválida.');
  }
}

function invalidKeyResponse() {
  return {
    active: false,
    message: 'Chave inválida, expirada ou inativa. Confira a chave mensal enviada pela Conta Bahia.',
  };
}

function signedResponse(license: ValidatedLicense, activationToken?: string) {
  const response: {
    active: true;
    signedLease: string;
    activationToken?: string;
    expiresAt: string;
    restaurantName: string;
    periodId: string;
  } = {
    active: true,
    signedLease: createSignedLease(license),
    expiresAt: new Date(license.expiresAtMs).toISOString(),
    restaurantName: license.restaurantName,
    periodId: license.periodId,
  };
  if (activationToken) response.activationToken = activationToken;
  return response;
}

export const ativarComanda = onCall(
  {
    region: FUNCTION_REGION,
    enforceAppCheck: true,
    maxInstances: 10,
    secrets: [LICENSE_PEPPER, LICENSE_SIGNING_PRIVATE_KEY],
  },
  async (request) => {
    try {
      const input = request.data as { key?: unknown; deviceId?: unknown };
      const key = normalizedKey(input?.key);
      if (!key || !validDeviceId(input?.deviceId)) return invalidKeyResponse();

      const pepper = getPepper();
      const keyHash = deriveDocumentId(pepper, 'license-key', key);
      const activationToken = randomBytes(32).toString('base64url');
      const activationTokenHash = deriveDocumentId(pepper, 'activation-token', activationToken);
      const deviceHash = sha256Hex(input.deviceId);
      const licenseRef = db.collection('chavesLicenca').doc(keyHash);

      const validated = await db.runTransaction(async (transaction) => {
        const licenseSnapshot = await transaction.get(licenseRef);
        if (!licenseSnapshot.exists) return null;
        const licenseData = licenseSnapshot.data();
        if (!licenseData || licenseData.status !== 'active') return null;

        const subscriptionId = String(licenseData.subscriptionId ?? '');
        if (!subscriptionId || subscriptionId.includes('/')) return null;

        const subscriptionRef = db.collection('assinaturas').doc(subscriptionId);
        const subscriptionSnapshot = await transaction.get(subscriptionRef);
        if (!subscriptionSnapshot.exists) return null;
        const subscriptionData = subscriptionSnapshot.data();
        if (!subscriptionData) return null;

        const deviceDocumentId = deriveDocumentId(
          pepper,
          `device:${subscriptionId}`,
          deviceHash
        );
        const deviceRef = subscriptionRef.collection('dispositivos').doc(deviceDocumentId);
        const deviceSnapshot = await transaction.get(deviceRef);

        const now = Date.now();
        const keyValidFrom = timestampMillis(licenseData.validFrom);
        const keyExpiresAt = timestampMillis(licenseData.expiresAt);
        const subscriptionExpiresAt = timestampMillis(subscriptionData.validUntil);
        const expiresAtMs = Math.min(keyExpiresAt, subscriptionExpiresAt);
        const periodId = String(licenseData.periodId ?? '');
        const restaurantName = String(subscriptionData.restaurantName ?? 'Restaurante');

        if (
          subscriptionData.active !== true ||
          subscriptionData.currentKeyHash !== keyHash ||
          subscriptionData.currentPeriodId !== periodId ||
          !periodId ||
          keyValidFrom <= 0 ||
          now < keyValidFrom ||
          expiresAtMs <= now
        ) {
          return null;
        }

        const bindingData = deviceSnapshot.data();
        const alreadyBound = deviceSnapshot.exists && bindingData?.active === true;
        const maxDevicesValue = Number(subscriptionData.maxDevices ?? 1);
        const maxDevices = Number.isSafeInteger(maxDevicesValue)
          ? Math.min(Math.max(maxDevicesValue, 1), 100)
          : 1;
        const activeDeviceCountValue = Number(subscriptionData.activeDeviceCount ?? 0);
        const activeDeviceCount = Number.isSafeInteger(activeDeviceCountValue)
          ? Math.max(activeDeviceCountValue, 0)
          : 0;

        if (!alreadyBound && activeDeviceCount >= maxDevices) {
          throw new HttpsError(
            'resource-exhausted',
            'Esta licença atingiu o limite de caixas. Solicite à Conta Bahia a liberação deste dispositivo.'
          );
        }

        const activationRef = db.collection('ativacoesComanda').doc(activationTokenHash);
        transaction.set(
          deviceRef,
          {
            active: true,
            deviceHash,
            activeTokenHash: activationTokenHash,
            periodId,
            updatedAt: FieldValue.serverTimestamp(),
            activatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        if (!alreadyBound) {
          transaction.set(
            subscriptionRef,
            { activeDeviceCount: activeDeviceCount + 1, updatedAt: FieldValue.serverTimestamp() },
            { merge: true }
          );
        }
        transaction.create(activationRef, {
          active: true,
          subscriptionId,
          keyHash,
          deviceDocumentId,
          deviceHash,
          periodId,
          createdAt: FieldValue.serverTimestamp(),
        });

        return {
          active: true as const,
          subscriptionId,
          restaurantName,
          periodId,
          deviceHash,
          expiresAtMs,
        };
      });

      if (!validated) return invalidKeyResponse();
      return signedResponse(validated, activationToken);
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Falha ao ativar a licença do Comanda Pro.', {
        code: error instanceof Error ? error.name : 'unknown',
      });
      throw new HttpsError('internal', 'Não foi possível verificar a chave agora. Tente novamente.');
    }
  }
);

export const consultarAtivacaoComanda = onCall(
  {
    region: FUNCTION_REGION,
    enforceAppCheck: true,
    maxInstances: 10,
    secrets: [LICENSE_PEPPER, LICENSE_SIGNING_PRIVATE_KEY],
  },
  async (request) => {
    try {
      const input = request.data as { activationToken?: unknown; deviceId?: unknown };
      if (
        typeof input?.activationToken !== 'string' ||
        !/^[A-Za-z0-9_-]{40,60}$/.test(input.activationToken) ||
        !validDeviceId(input?.deviceId)
      ) {
        return { active: false };
      }

      const pepper = getPepper();
      const activationTokenHash = deriveDocumentId(
        pepper,
        'activation-token',
        input.activationToken
      );
      const activationRef = db.collection('ativacoesComanda').doc(activationTokenHash);
      const activationSnapshot = await activationRef.get();
      if (!activationSnapshot.exists) return { active: false };
      const activationData = activationSnapshot.data();
      if (!activationData || activationData.active !== true) return { active: false };

      const subscriptionId = String(activationData.subscriptionId ?? '');
      const keyHash = String(activationData.keyHash ?? '');
      const periodId = String(activationData.periodId ?? '');
      const storedDeviceHash = String(activationData.deviceHash ?? '');
      const deviceHash = sha256Hex(input.deviceId);
      if (!subscriptionId || subscriptionId.includes('/') || deviceHash !== storedDeviceHash) {
        return { active: false };
      }

      const subscriptionRef = db.collection('assinaturas').doc(subscriptionId);
      const licenseRef = db.collection('chavesLicenca').doc(keyHash);
      const deviceRef = subscriptionRef
        .collection('dispositivos')
        .doc(String(activationData.deviceDocumentId ?? ''));
      const [subscriptionSnapshot, licenseSnapshot, deviceSnapshot] = await Promise.all([
        subscriptionRef.get(),
        licenseRef.get(),
        deviceRef.get(),
      ]);
      if (!subscriptionSnapshot.exists || !licenseSnapshot.exists || !deviceSnapshot.exists) {
        return { active: false };
      }

      const subscriptionData = subscriptionSnapshot.data();
      const licenseData = licenseSnapshot.data();
      const deviceData = deviceSnapshot.data();
      if (!subscriptionData || !licenseData || !deviceData) return { active: false };

      const now = Date.now();
      const expiresAtMs = Math.min(
        timestampMillis(subscriptionData.validUntil),
        timestampMillis(licenseData.expiresAt)
      );
      if (
        subscriptionData.active !== true ||
        subscriptionData.currentKeyHash !== keyHash ||
        subscriptionData.currentPeriodId !== periodId ||
        licenseData.status !== 'active' ||
        licenseData.periodId !== periodId ||
        deviceData.active !== true ||
        deviceData.activeTokenHash !== activationTokenHash ||
        expiresAtMs <= now ||
        timestampMillis(licenseData.validFrom) > now
      ) {
        return { active: false };
      }

      return signedResponse(
        {
          active: true,
          subscriptionId,
          restaurantName: String(subscriptionData.restaurantName ?? 'Restaurante'),
          periodId,
          deviceHash,
          expiresAtMs,
        }
      );
    } catch (error) {
      if (error instanceof HttpsError) throw error;
      logger.error('Falha ao renovar a licença do Comanda Pro.', {
        code: error instanceof Error ? error.name : 'unknown',
      });
      throw new HttpsError('internal', 'Não foi possível renovar a verificação da licença.');
    }
  }
);
