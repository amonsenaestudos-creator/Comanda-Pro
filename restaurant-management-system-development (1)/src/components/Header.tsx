import React, { useEffect, useState } from 'react';
import { Clock, LogOut, Menu, ShieldCheck, Store, UtensilsCrossed } from 'lucide-react';
import { AppConfig, CaixaSessao, Employee, Table } from '../types';
import { formatDateShort } from '../utils/formatters';

interface HeaderProps {
  config: AppConfig;
  tables: Table[];
  onNavigateTab: (tabIndex: number) => void;
  licenseExpiresAt: string;
  licenseOffline: boolean;
  operador: Employee;
  caixaAberto?: CaixaSessao;
  onToggleMenu: () => void;
  onLogout: () => void;
}

const useClock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return now;
};

export const Header: React.FC<HeaderProps> = ({
  config,
  tables,
  onNavigateTab,
  licenseExpiresAt,
  licenseOffline,
  operador,
  caixaAberto,
  onToggleMenu,
  onLogout,
}) => {
  const now = useClock();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const licenseExpiryLabel = formatDateShort(licenseExpiresAt);

  const occupiedCount = tables.filter((t) => t.status === 'ocupada').length;
  const billRequestedCount = tables.filter((t) => t.status === 'conta_solicitada').length;
  const empresa = config.dadosEmpresa.nomeFantasia || config.dadosEmpresa.razaoSocial;
  const iniciais = operador.nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900 text-white shadow-sm select-none">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-4 md:h-16 lg:px-6">
        {/* Menu (celular/tablet) */}
        <button
          type="button"
          onClick={onToggleMenu}
          aria-label="Abrir menu"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-zinc-800 hover:text-white lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Marca */}
        <button
          type="button"
          onClick={() => onNavigateTab(1)}
          className="flex shrink-0 items-center gap-2 rounded-lg transition hover:opacity-90"
          title="Ir para o PDV"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-600 shadow-sm shadow-orange-950/40">
            <UtensilsCrossed className="h-4 w-4 text-white" />
          </span>
          <span className="hidden flex-col items-start leading-none min-[400px]:flex">
            <span className="text-sm font-extrabold tracking-tight">Comanda Pro</span>
            <span className="mt-0.5 hidden font-mono text-[10px] text-zinc-400 sm:block">v2.1</span>
          </span>
        </button>

        {/* Empresa (desktop) */}
        <div className="ml-2 hidden min-w-0 items-center gap-2 border-l border-zinc-700 pl-4 xl:flex">
          <Store className="h-4 w-4 shrink-0 text-orange-400" />
          <span className="max-w-[260px] truncate text-xs font-bold uppercase tracking-wide text-zinc-200">{empresa}</span>
        </div>

        {/* Indicadores operacionais */}
        <div className="ml-auto flex items-center gap-1.5 md:ml-2 lg:flex-1 lg:justify-center">
          <button
            type="button"
            onClick={() => onNavigateTab(11)}
            title={caixaAberto ? 'Caixa aberto — ver caixa' : 'Caixa fechado — abrir caixa'}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition ${
              caixaAberto
                ? 'border-emerald-700/60 bg-emerald-950/50 text-emerald-300 hover:bg-emerald-950'
                : 'border-rose-700/60 bg-rose-950/50 text-rose-300 hover:bg-rose-950'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${caixaAberto ? 'bg-emerald-400' : 'bg-rose-400'}`} />
            <span className="hidden sm:inline">{caixaAberto ? 'Caixa aberto' : 'Caixa fechado'}</span>
            <span className="sm:hidden">{caixaAberto ? 'Aberto' : 'Fechado'}</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab(8)}
            title="Ver mesas ocupadas"
            className="hidden items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-700 sm:flex"
          >
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            Mesas
            <span className="rounded bg-rose-950 px-1.5 font-mono font-bold text-rose-300">{occupiedCount}</span>
          </button>

          {billRequestedCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigateTab(8)}
              title="Ver contas solicitadas"
              className="flex items-center gap-1.5 rounded-lg border border-amber-600/60 bg-amber-950/50 px-2.5 py-1.5 text-xs font-bold text-amber-300 animate-pulse"
            >
              {billRequestedCount} <span className="hidden sm:inline">conta{billRequestedCount > 1 ? 's' : ''} pedida{billRequestedCount > 1 ? 's' : ''}</span>
            </button>
          )}

          <div
            title={
              licenseOffline
                ? `Verificação offline. Licença válida até ${licenseExpiryLabel}.`
                : `Licença verificada. Válida até ${licenseExpiryLabel}.`
            }
            className={`hidden items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold 2xl:flex ${
              licenseOffline
                ? 'border-amber-700/60 bg-amber-950/40 text-amber-300'
                : 'border-emerald-800/70 bg-emerald-950/40 text-emerald-300'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            {licenseOffline ? 'Offline' : 'Licença ativa'} · até {licenseExpiryLabel}
          </div>
        </div>

        {/* Relógio e operador */}
        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 font-mono text-xs font-semibold text-orange-300 md:flex">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span>{formatDateShort(now)}</span>
            <span className="text-zinc-500">·</span>
            <span>{time}</span>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-800/90 py-1 pl-1 pr-1 sm:pr-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-orange-600 text-[11px] font-extrabold text-white">
              {iniciais || '?'}
            </span>
            <div className="hidden min-w-0 flex-col leading-tight sm:flex">
              <span className="max-w-[140px] truncate text-xs font-bold text-zinc-100">{operador.nome}</span>
              <span className="max-w-[140px] truncate text-[10px] text-zinc-400">{operador.funcao}</span>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Trocar de operador"
              aria-label="Trocar de operador"
              className="flex h-7 w-7 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-700 hover:text-rose-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
      {/* Linha de status compacta só no celular */}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-800 px-3 py-1 text-[10px] text-zinc-400 md:hidden">
        <span className="truncate">{empresa}</span>
        <span className="shrink-0 font-mono">{time}</span>
      </div>
    </header>
  );
};
