import React, { useState } from 'react';
import { ArrowLeft, Delete, LockKeyhole, UtensilsCrossed, UserRound } from 'lucide-react';
import type { Employee } from '../types';
import { cn } from '../utils/cn';

interface LoginOperadorProps {
  employees: Employee[];
  /** Nome usado quando não há colaboradores cadastrados. */
  fallbackName: string;
  onLogin: (operador: Employee) => void;
}

const initials = (nome: string) =>
  nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

/**
 * Tela de entrada da equipe: escolhe o colaborador e digita a senha.
 * Sistema restrito a funcionários e ao caixa — não há acesso para clientes.
 */
export const LoginOperador: React.FC<LoginOperadorProps> = ({ employees, fallbackName, onLogin }) => {
  const [selected, setSelected] = useState<Employee | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const fallbackOperator: Employee = {
    id: 'operador-geral',
    nome: fallbackName || 'Operador Geral',
    telefone: '',
    endereco: '',
    cep: '',
    cpf: '',
    funcao: 'Operador de Caixa',
    dataAdmissao: new Date().toISOString().slice(0, 10),
  };

  const list = employees.length > 0 ? employees : [];

  const fail = (msg: string) => {
    setError(msg);
    setPin('');
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const pick = (emp: Employee) => {
    setError(null);
    setPin('');
    if (!emp.pin) {
      // Colaborador sem senha cadastrada: entra direto (recomendado cadastrar uma senha).
      onLogin(emp);
      return;
    }
    setSelected(emp);
  };

  const pressDigit = (d: string) => {
    if (!selected?.pin) return;
    const max = selected.pin.length;
    if (pin.length >= max) return;
    const next = pin + d;
    setPin(next);
    setError(null);
    if (next.length === max) {
      if (next === selected.pin) {
        onLogin(selected);
      } else {
        fail('Senha incorreta. Tente novamente.');
      }
    }
  };

  const backspace = () => setPin((p) => p.slice(0, -1));

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-4 text-zinc-100">
      <div className="w-full max-w-3xl">
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-600 shadow-lg shadow-orange-950/40">
            <UtensilsCrossed className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-white">Comanda Pro</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">Acesso da equipe</p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-2xl shadow-black/40 backdrop-blur sm:p-8">
          {!selected ? (
            <>
              <h1 className="text-xl font-extrabold tracking-tight text-white">Quem está operando o caixa?</h1>
              <p className="mt-1 text-sm text-zinc-400">Selecione seu nome para entrar.</p>

              {list.length === 0 ? (
                <div className="mt-6 space-y-4 rounded-2xl border border-dashed border-white/15 p-6 text-center">
                  <UserRound className="mx-auto h-10 w-10 text-zinc-500" />
                  <p className="text-sm text-zinc-300">Nenhum colaborador cadastrado ainda.</p>
                  <button
                    type="button"
                    onClick={() => onLogin(fallbackOperator)}
                    className="rounded-xl bg-orange-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-500"
                  >
                    Entrar como {fallbackOperator.nome}
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {list.map((emp) => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => pick(emp)}
                      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-orange-500/60 hover:bg-orange-500/10 active:scale-[0.99]"
                    >
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm font-extrabold text-orange-300 ring-1 ring-white/10 group-hover:bg-orange-600 group-hover:text-white">
                        {initials(emp.nome)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-white">{emp.nome}</span>
                        <span className="block truncate text-xs text-zinc-400">{emp.funcao}</span>
                      </span>
                      {emp.pin ? (
                        <LockKeyhole className="h-4 w-4 shrink-0 text-zinc-500" aria-label="Protegido por senha" />
                      ) : null}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="mx-auto max-w-xs">
              <button
                type="button"
                onClick={() => {
                  setSelected(null);
                  setPin('');
                  setError(null);
                }}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-400 transition hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" /> Trocar operador
              </button>

              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-600 text-lg font-extrabold text-white">
                  {initials(selected.nome)}
                </span>
                <p className="mt-3 font-bold text-white">{selected.nome}</p>
                <p className="text-xs text-zinc-400">Digite sua senha de {selected.pin?.length} dígitos</p>
              </div>

              <div className={cn('mt-5 flex justify-center gap-3', shake && 'animate-[shake_0.35s]')}>
                {Array.from({ length: selected.pin?.length ?? 4 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      'h-4 w-4 rounded-full border-2 transition',
                      i < pin.length ? 'border-orange-500 bg-orange-500' : 'border-zinc-600'
                    )}
                  />
                ))}
              </div>
              <p className="mt-3 h-5 text-center text-xs font-semibold text-rose-400" role="alert">
                {error}
              </p>

              <div className="mt-2 grid grid-cols-3 gap-3">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => pressDigit(d)}
                    className="h-16 rounded-2xl bg-white/5 text-2xl font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
                  >
                    {d}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin('')}
                  className="h-16 rounded-2xl bg-white/5 text-xs font-bold uppercase tracking-wider text-zinc-400 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => pressDigit('0')}
                  className="h-16 rounded-2xl bg-white/5 text-2xl font-bold text-white ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={backspace}
                  aria-label="Apagar último dígito"
                  className="flex h-16 items-center justify-center rounded-2xl bg-white/5 text-zinc-300 ring-1 ring-white/10 transition hover:bg-white/10 active:scale-95"
                >
                  <Delete className="h-6 w-6" />
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-500">
          Acesso restrito à equipe do estabelecimento e ao caixa.
        </p>
      </div>
    </main>
  );
};
