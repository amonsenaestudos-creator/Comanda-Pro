import { useState, type FormEvent } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UtensilsCrossed,
  Wifi,
} from 'lucide-react';
import type { AccessStatus } from '../hooks/useAccessLicense';

interface AccessGateProps {
  status: AccessStatus;
  message: string | null;
  onActivate: (key: string) => Promise<boolean>;
}

const supportUrl = 'https://amonsenaestudos-creator.github.io/ContaBahia/#inicio';

export function AccessGate({ status, message, onActivate }: AccessGateProps) {
  const [key, setKey] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting || !key.trim()) return;

    setSubmitting(true);
    try {
      const activated = await onActivate(key.trim());
      if (activated) setKey('');
    } finally {
      setSubmitting(false);
    }
  };

  const isChecking = status === 'checking';
  const isConfigurationError = status === 'configuration-error';
  const isReadyToActivate = !isChecking && !isConfigurationError;

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10 text-zinc-100 selection:bg-orange-500 selection:text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-36 -top-40 h-[30rem] w-[30rem] rounded-full bg-orange-600/10 blur-3xl" />
        <div className="absolute -bottom-56 -right-24 h-[34rem] w-[34rem] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <section className="relative w-full max-w-lg">
        <div className="mb-7 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600">
            <UtensilsCrossed className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-white">Comanda Pro</p>
            <p className="text-xs font-semibold uppercase tracking-[0.19em] text-zinc-400">
              Conta Bahia Contabilidade
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/95 shadow-2xl shadow-black/40">
          <div className="border-b border-zinc-800 bg-zinc-900/80 px-6 py-5 sm:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                {isChecking ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                ) : isConfigurationError ? (
                  <CircleAlert className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <LockKeyhole className="h-5 w-5" aria-hidden="true" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-400">
                  Acesso protegido
                </p>
                <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  {isChecking
                    ? 'Verificando licença'
                    : isConfigurationError
                      ? 'Ativação indisponível'
                      : 'Ative seu caixa'}
                </h1>
              </div>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            {isChecking ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-4 text-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-orange-400" aria-hidden="true" />
                <p className="max-w-sm text-sm leading-6 text-zinc-300">
                  Estamos conferindo a licença com segurança. Isso pode levar alguns segundos.
                </p>
              </div>
            ) : isConfigurationError ? (
              <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-4 sm:p-5">
                <div className="flex gap-3">
                  <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-amber-100">O sistema continua bloqueado</p>
                    <p className="mt-1.5 text-sm leading-6 text-amber-100/80">
                      {message ||
                        'A verificação segura ainda não foi configurada. Entre em contato com a Conta Bahia para concluir a configuração do Firebase.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <p className="text-sm leading-6 text-zinc-300">
                  Digite a chave enviada pela Conta Bahia. O caixa funciona enquanto o campo
                  <code>ativa</code> (ou <code>activa</code>) da licença for verdadeiro.
                </p>

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-3.5">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-400" aria-hidden="true" />
                  <p className="text-xs leading-5 text-emerald-100/80">
                    A chave é conferida no Firestore a cada 2 minutos. Se o campo <code>ativa</code>/<code>activa</code>
                    for marcado como false no Firebase Console, este caixa é bloqueado em seguida.
                  </p>
                </div>

                <form className="mt-6" onSubmit={handleSubmit}>
                  <label htmlFor="access-key" className="mb-2 block text-sm font-bold text-zinc-100">
                    Chave de acesso
                  </label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" aria-hidden="true" />
                    <input
                      id="access-key"
                      name="access-key"
                      type="text"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      maxLength={40}
                      value={key}
                      onChange={(event) => setKey(event.target.value.toUpperCase())}
                      placeholder="CP-ABCDE-23456-ABCDE-23456"
                      disabled={submitting}
                      required
                      aria-describedby={message ? 'activation-feedback' : 'key-hint'}
                      className="h-14 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-12 pr-4 font-mono text-sm font-semibold tracking-[0.08em] text-white outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-zinc-600 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/15 disabled:cursor-wait disabled:opacity-60"
                    />
                  </div>
                  <p id="key-hint" className="mt-2 text-xs text-zinc-500">
                    A chave não diferencia maiúsculas de minúsculas; espaços e hífens são aceitos.
                  </p>

                  {message && (
                    <div
                      id="activation-feedback"
                      role="alert"
                      className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3.5 py-3 text-sm leading-5 text-rose-100"
                    >
                      <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" aria-hidden="true" />
                      <span>{message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting || !key.trim() || !isReadyToActivate}
                    className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 text-sm font-extrabold text-white transition hover:bg-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/30 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-400 disabled:shadow-none"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
                        Validando chave…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Validar e ativar o sistema
                      </>
                    )}
                  </button>
                </form>

                <div className="my-6 border-t border-zinc-800" />

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Wifi className="h-4 w-4 text-zinc-500" aria-hidden="true" />
                    <span>É necessária uma conexão para validar a chave.</span>
                  </div>
                  <a
                    href={supportUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-orange-300 transition hover:text-orange-200"
                  >
                    Falar com a Conta Bahia
                    <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </a>
                </div>
              </>
            )}
          </div>

     <div className="flex items-center justify-center gap-2 border-t border-zinc-800 bg-zinc-950/50 px-5 py-3 text-[11px] font-medium text-zinc-500">
            <ShieldCheck className="h-3.5 w-3.5 text-zinc-600" aria-hidden="true" />
            Quem liga e desliga o caixa é o campo ativa/activa da licença, controlado pela Conta Bahia
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] leading-5 text-zinc-600">
          Comanda Pro · Sistema de Frente de Caixa, Mesas e Comandas
        </p>
      </section>
    </main>
  );
}
