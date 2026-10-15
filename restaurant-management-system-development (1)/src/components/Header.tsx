import React, { useEffect, useState } from 'react';
import {
  Clock,
  User,
  Store,
  Wifi,
  Layers,
  UtensilsCrossed,
  ShieldCheck,
} from 'lucide-react';
import { AppConfig, Table } from '../types';
import { formatDateTime } from '../utils/formatters';

interface HeaderProps {
  config: AppConfig;
  tables: Table[];
  onNavigateTab: (tabIndex: number) => void;
  activeTab: number;
  licenseExpiresAt: string;
  licenseOffline: boolean;
  /** Só aparece no `npm run dev` sem Firebase: exibe o rótulo de demonstração. */
  demoMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  tables,
  onNavigateTab,
  licenseExpiresAt,
  licenseOffline,
  demoMode = false,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState<string>(
    formatDateTime(new Date())
  );
  const licenseExpiryLabel = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
  }).format(new Date(licenseExpiresAt));

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(formatDateTime(new Date()));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const occupiedCount = tables.filter((t) => t.status === 'ocupada').length;
  const billRequestedCount = tables.filter((t) => t.status === 'conta_solicitada').length;

  return (
    <header className="bg-zinc-900 text-white border-b border-zinc-800 shadow-md sticky top-0 z-40 select-none">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & Company Identity */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5 bg-orange-600 text-white px-3 py-1.5 rounded-lg shadow-sm">
            <UtensilsCrossed className="w-5 h-5 text-orange-100" />
            <div>
              <div className="font-extrabold text-base tracking-tight leading-none flex items-center gap-1.5">
                <span>Comanda Pro</span>
                <span className="text-[10px] bg-black/40 text-orange-200 px-1.5 py-0.5 rounded font-mono font-medium">
                  v2.0
                </span>
              </div>
            </div>
          </div>

          <div className="hidden md:flex flex-col border-l border-zinc-700 pl-4">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-orange-400" />
              <span className="font-bold text-sm tracking-wide text-zinc-100 uppercase truncate max-w-[280px] lg:max-w-[420px]">
                {config.dadosEmpresa.nomeFantasia || config.dadosEmpresa.razaoSocial}
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              CNPJ: {config.dadosEmpresa.cnpj} &bull; {config.dadosEmpresa.cidade}/{config.dadosEmpresa.uf}
            </div>
          </div>
        </div>

        {/* Quick Operational Counters */}
        <div className="hidden lg:flex items-center gap-2">
          <button
            onClick={() => onNavigateTab(8)}
            title="Ver mesas ocupadas"
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-750 px-3 py-1.5 rounded-md text-xs border border-zinc-700 transition"
          >
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            <span className="text-zinc-300">Mesas Ocupadas:</span>
            <span className="font-bold text-white bg-rose-950/70 text-rose-300 px-1.5 py-0.2 rounded border border-rose-800/40">
              {occupiedCount}
            </span>
          </button>

          {billRequestedCount > 0 && (
            <button
              onClick={() => onNavigateTab(8)}
              title="Ver contas solicitadas"
              className="flex items-center gap-2 bg-amber-950/40 text-amber-300 border border-amber-600/50 px-3 py-1.5 rounded-md text-xs font-medium animate-pulse"
            >
              <span>{billRequestedCount} Conta{billRequestedCount > 1 ? 's' : ''} Solicitada{billRequestedCount > 1 ? 's' : ''}!</span>
            </button>
          )}

          <button
            onClick={() => onNavigateTab(9)}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-750 px-2.5 py-1.5 rounded-md text-xs border border-zinc-700 text-zinc-300 transition"
          >
            <Layers className="w-3.5 h-3.5 text-orange-400" />
            <span>Cozinha / KDS</span>
          </button>
        </div>

        {/* Live Date/Time & Active User */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          {/* License status and monthly expiration */}
          <div
            title={
              licenseOffline
                ? `Verificação offline. Licença válida até ${licenseExpiryLabel}.`
                : `Licença verificada. Válida até ${licenseExpiryLabel}.`
            }
            className={`hidden md:flex items-center gap-2 rounded-lg border px-2.5 py-1.5 ${
              licenseOffline
                ? 'border-amber-700/60 bg-amber-950/40 text-amber-300'
                : 'border-emerald-800/70 bg-emerald-950/40 text-emerald-300'
            }`}
          >
            {demoMode && (
              <span className="text-[9px] font-black uppercase tracking-wide bg-amber-400 text-zinc-900 px-1.5 py-0.5 rounded">
                Demonstração
              </span>
            )}
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="flex flex-col text-left leading-tight">
              <span className="text-[10px] font-bold uppercase tracking-wide">
                {demoMode ? 'Modo dev' : licenseOffline ? 'Offline' : 'Licença ativa'}
              </span>
              <span className="text-[10px] opacity-80">Até {licenseExpiryLabel}</span>
            </span>
          </div>

          {/* Live Date & Time Highlight */}
          <div className="flex items-center space-x-2 bg-zinc-950 px-3.5 py-1.5 rounded-lg border border-zinc-800 text-orange-400 shadow-inner">
            <Clock className="w-4 h-4 text-orange-500 animate-pulse" />
            <div className="font-mono text-xs sm:text-sm font-semibold tracking-wide">
              {currentDateTime}
            </div>
          </div>

          {/* User Badge */}
          <div className="flex items-center space-x-2 bg-zinc-800/90 hover:bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700/80">
            <div className="w-6 h-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-xs border border-orange-500/30">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-zinc-200 leading-tight">
                {config.usuarioAtual || 'Operador 01'}
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Wifi className="w-2.5 h-2.5" /> Online 2026
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
