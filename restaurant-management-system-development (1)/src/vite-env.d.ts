/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_FIREBASE_API_KEY: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN: string;
  readonly VITE_FIREBASE_PROJECT_ID: string;
  readonly VITE_FIREBASE_APP_ID: string;
  readonly VITE_FIREBASE_FUNCTIONS_REGION: string;
  readonly VITE_RECAPTCHA_V3_SITE_KEY: string;
  readonly VITE_LICENSE_PUBLIC_KEY_DER_BASE64: string;
  readonly VITE_APPCHECK_DEBUG_TOKEN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
