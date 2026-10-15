import { getApp, getApps, initializeApp } from '@firebase/app';
import { getFirestore, type Firestore } from '@firebase/firestore';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const hasFirebaseClientConfig = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

let firestoreDb: Firestore | null = null;

if (hasFirebaseClientConfig) {
  const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  firestoreDb = getFirestore(firebaseApp);
}

export const hasLicenseBackendConfig = hasFirebaseClientConfig;

export { firestoreDb };
