import { getApp, getApps, initializeApp } from '@firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from '@firebase/app-check';
import { getFunctions, type Functions } from '@firebase/functions';

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

export const hasAppCheckConfig = Boolean(env.VITE_RECAPTCHA_V3_SITE_KEY);
export const hasLicensePublicKey = Boolean(env.VITE_LICENSE_PUBLIC_KEY_DER_BASE64);

let functionsClient: Functions | null = null;

if (hasFirebaseClientConfig && hasAppCheckConfig) {
  const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

  // Firebase App Check's debug token is for local development only. Never set
  // VITE_APPCHECK_DEBUG_TOKEN in a production build.
  if (env.DEV && env.VITE_APPCHECK_DEBUG_TOKEN) {
    const debugWindow = window as Window & {
      FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean | string;
    };
    debugWindow.FIREBASE_APPCHECK_DEBUG_TOKEN =
      env.VITE_APPCHECK_DEBUG_TOKEN === 'true'
        ? true
        : env.VITE_APPCHECK_DEBUG_TOKEN;
  }

  initializeAppCheck(firebaseApp, {
    provider: new ReCaptchaV3Provider(env.VITE_RECAPTCHA_V3_SITE_KEY),
    isTokenAutoRefreshEnabled: true,
  });

  functionsClient = getFunctions(
    firebaseApp,
    env.VITE_FIREBASE_FUNCTIONS_REGION || 'southamerica-east1'
  );
}

export const hasLicenseBackendConfig = Boolean(
  hasFirebaseClientConfig && hasAppCheckConfig && hasLicensePublicKey
);

export { functionsClient };
