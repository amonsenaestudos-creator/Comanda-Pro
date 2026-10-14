import { createHmac, randomBytes } from 'node:crypto';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';

const COLLECTION_SUBSCRIPTIONS = 'assinaturas';
const COLLECTION_KEYS = 'chavesLicenca';
const KEY_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function readOptions(args) {
  const options = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (!argument.startsWith('--')) continue;
    const [name, inlineValue] = argument.slice(2).split('=', 2);
    const value = inlineValue ?? args[index + 1];
    if (value === undefined || value.startsWith('--')) {
      throw new Error(`Falta o valor da opção --${name}.`);
    }
    options[name] = value;
    if (inlineValue === undefined) index += 1;
  }
  return options;
}

function requiredOption(options, name) {
  const value = options[name]?.trim();
  if (!value) throw new Error(`Informe --${name}.`);
  return value;
}

function getPepper() {
  const pepper = process.env.LICENSE_PEPPER;
  if (!pepper || pepper.length < 32) {
    throw new Error(
      'Defina LICENSE_PEPPER no ambiente local. Use exatamente o segredo cadastrado no Firebase Secret Manager.'
    );
  }
  return pepper;
}

function getDatabase() {
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT;
  initializeApp({
    credential: applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
  return getFirestore();
}

function hashLicenseKey(key, pepper) {
  return createHmac('sha256', pepper).update(`license-key\0${key}`).digest('hex');
}

function createAccessKey() {
  const random = randomBytes(20);
  const body = Array.from(random, (value) => KEY_ALPHABET[value & 31]).join('');
  return `CP-${body.match(/.{1,5}/g).join('-')}`;
}

function parseExpiration(value) {
  if (!/\d{4}-\d{2}-\d{2}T/.test(value) || !/(Z|[+-]\d{2}:\d{2})$/i.test(value)) {
    throw new Error(
      '--expires-at deve ser uma data ISO com fuso, por exemplo 2026-11-01T03:00:00.000Z.'
    );
  }
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) {
    throw new Error('--expires-at precisa ser uma data futura válida.');
  }
  return date;
}

async function createMonthlyKey(options, db, pepper) {
  const restaurantName = requiredOption(options, 'name');
  const periodId = requiredOption(options, 'period');
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(periodId)) {
    throw new Error('--period deve estar no formato AAAA-MM, por exemplo 2026-10.');
  }

  const expiresAt = parseExpiration(requiredOption(options, 'expires-at'));
  const requestedMaxDevices = Number(options['max-devices'] ?? 1);
  if (!Number.isInteger(requestedMaxDevices) || requestedMaxDevices < 1 || requestedMaxDevices > 100) {
    throw new Error('--max-devices deve ser um número inteiro entre 1 e 100.');
  }

  const subscriptionId = options['subscription-id']?.trim();
  const subscriptionRef = subscriptionId
    ? db.collection(COLLECTION_SUBSCRIPTIONS).doc(subscriptionId)
    : db.collection(COLLECTION_SUBSCRIPTIONS).doc();
  const newKey = createAccessKey();
  const normalizedKey = newKey.replace(/[-\s]/g, '').toUpperCase();
  const keyHash = hashLicenseKey(normalizedKey, pepper);
  const keyRef = db.collection(COLLECTION_KEYS).doc(keyHash);
  const keyValidFrom = Timestamp.now();
  const keyExpiresAt = Timestamp.fromDate(expiresAt);

  await db.runTransaction(async (transaction) => {
    const subscriptionSnapshot = await transaction.get(subscriptionRef);
    const previousKeyHash = subscriptionSnapshot.data()?.currentKeyHash;
    const previousKeyRef =
      typeof previousKeyHash === 'string' && previousKeyHash !== keyHash
        ? db.collection(COLLECTION_KEYS).doc(previousKeyHash)
        : null;
    const previousKeySnapshot = previousKeyRef
      ? await transaction.get(previousKeyRef)
      : null;

    if (previousKeyRef && previousKeySnapshot?.exists) {
      transaction.set(
        previousKeyRef,
        { status: 'replaced', replacedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }

    transaction.set(keyRef, {
      status: 'active',
      subscriptionId: subscriptionRef.id,
      periodId,
      validFrom: keyValidFrom,
      expiresAt: keyExpiresAt,
      createdAt: FieldValue.serverTimestamp(),
    });

    transaction.set(
      subscriptionRef,
      {
        active: true,
        restaurantName,
        currentKeyHash: keyHash,
        currentPeriodId: periodId,
        validUntil: keyExpiresAt,
        maxDevices: requestedMaxDevices,
        activeDeviceCount: Number(subscriptionSnapshot.data()?.activeDeviceCount ?? 0),
        createdAt: subscriptionSnapshot.exists
          ? subscriptionSnapshot.data()?.createdAt ?? FieldValue.serverTimestamp()
          : FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  console.log('\nCHAVE MENSAL GERADA — copie e envie por um canal seguro\n');
  console.log(`Restaurante: ${restaurantName}`);
  console.log(`ID da assinatura (guarde para renovações): ${subscriptionRef.id}`);
  console.log(`Período: ${periodId}`);
  console.log(`Válida até: ${expiresAt.toISOString()}`);
  console.log(`Limite de caixas: ${requestedMaxDevices}`);
  console.log(`\n${newKey}\n`);
  console.log('A chave em texto puro não foi gravada no Firestore. Ela não poderá ser recuperada depois.');
}

async function revokeSubscription(options, db) {
  const subscriptionId = requiredOption(options, 'subscription-id');
  const subscriptionRef = db.collection(COLLECTION_SUBSCRIPTIONS).doc(subscriptionId);
  await db.runTransaction(async (transaction) => {
    const subscriptionSnapshot = await transaction.get(subscriptionRef);
    if (!subscriptionSnapshot.exists) throw new Error('Assinatura não encontrada.');
    const currentKeyHash = subscriptionSnapshot.data()?.currentKeyHash;
    const keyRef = typeof currentKeyHash === 'string'
      ? db.collection(COLLECTION_KEYS).doc(currentKeyHash)
      : null;
    const keySnapshot = keyRef ? await transaction.get(keyRef) : null;

    transaction.set(
      subscriptionRef,
      { active: false, revokedAt: FieldValue.serverTimestamp(), updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    if (keyRef && keySnapshot?.exists) {
      transaction.set(keyRef, { status: 'revoked', revokedAt: FieldValue.serverTimestamp() }, { merge: true });
    }
  });
  console.log(`Assinatura ${subscriptionId} revogada. A próxima verificação online bloqueará os caixas.`);
}

async function resetDevices(options, db) {
  const subscriptionId = requiredOption(options, 'subscription-id');
  const subscriptionRef = db.collection(COLLECTION_SUBSCRIPTIONS).doc(subscriptionId);
  const subscriptionSnapshot = await subscriptionRef.get();
  if (!subscriptionSnapshot.exists) throw new Error('Assinatura não encontrada.');

  const devicesSnapshot = await subscriptionRef.collection('dispositivos').get();
  const documents = devicesSnapshot.docs;
  for (let start = 0; start < documents.length; start += 450) {
    const batch = db.batch();
    for (const device of documents.slice(start, start + 450)) {
      batch.set(
        device.ref,
        { active: false, activeTokenHash: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    if (start === 0) {
      batch.set(
        subscriptionRef,
        { activeDeviceCount: 0, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    }
    await batch.commit();
  }
  if (documents.length === 0) {
    await subscriptionRef.set(
      { activeDeviceCount: 0, updatedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
  }
  console.log(`Dispositivos liberados para a assinatura ${subscriptionId}.`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  if (!['create', 'revoke', 'reset-devices'].includes(command)) {
    throw new Error(
      'Uso: npm run license -- <create|revoke|reset-devices> [opções]. Consulte README.md.'
    );
  }

  const options = readOptions(args);
  const db = getDatabase();

  if (command === 'create') {
    await createMonthlyKey(options, db, getPepper());
  } else if (command === 'revoke') {
    await revokeSubscription(options, db);
  } else {
    await resetDevices(options, db);
  }
}

main().catch((error) => {
  console.error(`\nErro: ${error instanceof Error ? error.message : 'operação não concluída.'}`);
  process.exitCode = 1;
});
