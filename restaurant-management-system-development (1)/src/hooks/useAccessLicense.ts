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
}

/**
 * O caixa é revalidado no Firestore a cada 2 minutos (e também quando a janela
 * volta a ficar visível / recebe foco). Assim, trocar `ativa` para false no
 * Firebase Console bloqueia o computador em poucos minutos.
 */
const RECHECK_INTERVAL_MS = 2 * 60 * 1000;

const MSG_BLOQUEADO_POR_DESATIVACAO =
  'A licença deste caixa foi desativada no servidor (ativa: false). Fale com a Conta Bahia para reativar.';

const MSG_SEM_CONFIRMACAO =
  'O caixa estava liberado, mas a licença não pôde ser confirmada e a tolerância offline acabou. Reconecte a internet e informe a chave novamente.';

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

  useEffect(() => {
    let cancelled = false;

    const finishAsActive = (activeLicense: LicenseInfo, isOffline: boolean) => {
      if (cancelled) return;
      setLicense(activeLicense);
      setOffline(isOffline);
      setMessage(
        isOffline
          ? 'Sem conexão com o servidor. O caixa fica liberado pela tolerância offline e precisa reconectar para continuar.'
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
              'É necessário estar conectado à internet para confirmar que a licença está ativa.'
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
    if (status !== 'active' || !license) return;

    let cancelled = false;
    let requestInProgress = false;
    const offlineUntilMs = new Date(license.offlineUntil).getTime();

    const lock = (reason: string) => {
      clearSavedActivation();
      setLicense(null);
      setOffline(false);
      setMessage(reason);
      setStatus('locked');
    };

    const recheck = async () => {
      if (cancelled || requestInProgress) return;
      requestInProgress = true;
      try {
        const confirmedLicense = await refreshSavedLicense();
        if (cancelled) return;
        if (!confirmedLicense) {
          // O servidor respondeu e a chave não está mais liberada (ativa: false).
          lock(MSG_BLOQUEADO_POR_DESATIVACAO);
          return;
        }
        setLicense(confirmedLicense);
        setOffline(false);
        setMessage(null);
      } catch {
        if (cancelled) return;
        // Falha de rede: mantém o caixa aberto só dentro da tolerância offline.
        if (Date.now() >= offlineUntilMs) {
          lock(MSG_SEM_CONFIRMACAO);
          return;
        }
        setOffline(true);
        setMessage(
          'Sem conexão com o servidor. O caixa continua liberado pela tolerância offline.'
        );
      } finally {
        requestInProgress = false;
      }
    };

    const interval = window.setInterval(() => void recheck(), RECHECK_INTERVAL_MS);
    // Se a tolerância offline estourar sem conseguir revalidar, bloqueia na hora.
    const offlineDeadlineTimer = window.setTimeout(
      () => void recheck(),
      Math.max(0, offlineUntilMs - Date.now())
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
      window.clearTimeout(offlineDeadlineTimer);
      window.removeEventListener('online', recheck);
      window.removeEventListener('focus', recheck);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, license]);

  return { status, license, offline, message, activate };
}
