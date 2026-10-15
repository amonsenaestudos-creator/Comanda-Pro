import { useCallback, useEffect, useState } from 'react';
import {
  activateWithKey,
  clearSavedActivation,
  getCachedLicense,
  InvalidAccessKeyError,
  isLicenseBackendConfigured,
  LicenseConfigurationError,
  refreshSavedLicense,
  type LicenseInfo,
} from '../services/license';

export type AccessStatus = 'checking' | 'locked' | 'configuration-error' | 'active';

export interface AccessLicenseState {
  status: AccessStatus;
  license: LicenseInfo | null;
  offline: boolean;
  message: string | null;
  activate: (key: string) => Promise<boolean>;
  /** Licença fictícia usada só no `npm run dev` quando não há Firebase configurado. */
  demoMode?: boolean;
}

const RECHECK_INTERVAL_MS = 5 * 60 * 1000;

function getActivationErrorMessage(error: unknown): string {
  if (error instanceof InvalidAccessKeyError || error instanceof LicenseConfigurationError) {
    return error.message;
  }

  const firebaseError = error as { code?: unknown; message?: unknown };
  const code = typeof firebaseError?.code === 'string' ? firebaseError.code : '';
  if (code === 'functions/resource-exhausted') {
    return 'Esta licença atingiu o limite de computadores ativados. Entre em contato com a Conta Bahia para liberar este caixa.';
  }
  if (code === 'functions/permission-denied' || code === 'functions/unauthenticated') {
    return 'A verificação de segurança do aplicativo falhou. Confirme a configuração do Firebase App Check.';
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'Sem conexão com a internet. Conecte o caixa à internet e tente novamente.';
  }
  return 'Não foi possível validar a chave agora. Verifique a internet e tente novamente; se o problema continuar, fale com a Conta Bahia.';
}

export function useAccessLicense(): AccessLicenseState {
  const [status, setStatus] = useState<AccessStatus>('checking');
  const [license, setLicense] = useState<LicenseInfo | null>(null);
  const [offline, setOffline] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  // true apenas no modo demonstração do `npm run dev` (sem Firebase configurado)
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const finishAsActive = (activeLicense: LicenseInfo, isOffline: boolean) => {
      if (cancelled) return;
      setLicense(activeLicense);
      setOffline(isOffline);
      setMessage(
        isOffline
          ? 'Sem conexão com o servidor. O caixa ficará liberado apenas até o fim da licença offline.'
          : null
      );
      setStatus('active');
    };

    const initializeAccess = async () => {
      if (isLicenseBackendConfigured()) {
        try {
          const onlineLicense = await refreshSavedLicense();
          if (cancelled) return;
          if (onlineLicense) {
            finishAsActive(onlineLicense, false);
          } else {
            setStatus('locked');
          }
          return;
        } catch {
          const cachedLicense = await getCachedLicense();
          if (cancelled) return;
          if (cachedLicense) {
            finishAsActive(cachedLicense, true);
          } else {
            setMessage(
              'É necessário estar conectado à internet para validar ou renovar o acesso deste caixa.'
            );
            setStatus('locked');
          }
          return;
        }
      }

      const cachedLicense = await getCachedLicense();
      if (cancelled) return;
      if (cachedLicense) {
        finishAsActive(cachedLicense, true);
      } else if (import.meta.env.DEV) {
        // SOMENTE EM `npm run dev`: sem Firebase configurado a interface abre em
        // modo demonstração, para testar telas. O build de produção (vite build)
        // não recebe este atalho e continua exigindo a chave de ativação.
        const demoExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        setDemoMode(true);
        finishAsActive(
          {
            restaurantName: 'Demonstração local (sem licença)',
            expiresAt: demoExpiresAt,
            leaseExpiresAt: demoExpiresAt,
            periodId: demoExpiresAt.slice(0, 7),
          },
          true
        );
      } else {
        setMessage(
          'A ativação ainda não está configurada. Peça à Conta Bahia para configurar o Firebase antes de liberar o sistema.'
        );
        setStatus('configuration-error');
      }
    };

    void initializeAccess();
    return () => {
      cancelled = true;
    };
  }, []);

  const activate = useCallback(async (key: string) => {
    setMessage(null);
    try {
      const activatedLicense = await activateWithKey(key);
      setLicense(activatedLicense);
      setOffline(false);
      setStatus('active');
      setMessage(null);
      return true;
    } catch (error) {
      setMessage(getActivationErrorMessage(error));
      return false;
    }
  }, []);

  useEffect(() => {
    if (status !== 'active' || !license || demoMode) return;

    let cancelled = false;
    let requestInProgress = false;

    const lockExpiredLease = () => {
      clearSavedActivation();
      setLicense(null);
      setOffline(false);
      setMessage('A licença venceu ou não pôde ser confirmada. Informe a nova chave mensal para continuar.');
      setStatus('locked');
    };

    const recheck = async () => {
      if (cancelled || requestInProgress) return;
      requestInProgress = true;
      try {
        const renewedLicense = await refreshSavedLicense();
        if (cancelled) return;
        if (!renewedLicense) {
          setLicense(null);
          setOffline(false);
          setMessage('A licença não está mais ativa. Informe a chave mensal atual para continuar.');
          setStatus('locked');
          return;
        }
        setLicense(renewedLicense);
        setOffline(false);
        setMessage(null);
      } catch {
        if (cancelled) return;
        if (Date.now() >= new Date(license.leaseExpiresAt).getTime()) {
          lockExpiredLease();
          return;
        }
        setOffline(true);
        setMessage(
          'Sem conexão com o servidor. O caixa continuará disponível somente durante o prazo da licença offline.'
        );
      } finally {
        requestInProgress = false;
      }
    };

    const interval = window.setInterval(() => void recheck(), RECHECK_INTERVAL_MS);
    const expirationTimer = window.setTimeout(
      () => {
        if (Date.now() >= new Date(license.leaseExpiresAt).getTime()) lockExpiredLease();
      },
      Math.max(0, new Date(license.leaseExpiresAt).getTime() - Date.now())
    );
    const onVisible = () => {
      if (document.visibilityState === 'visible') void recheck();
    };

    window.addEventListener('online', recheck);
    window.addEventListener('focus', recheck);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.clearTimeout(expirationTimer);
      window.removeEventListener('online', recheck);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, license, demoMode]);

  return { status, license, offline, message, activate, demoMode };
}
