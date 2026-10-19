import React, { useEffect, useState } from 'react';
import { CircleDollarSign, UtensilsCrossed } from 'lucide-react';
import { cn } from '../utils/cn';
import { AppConfig, Sale, Table } from '../types';
import { formatCurrency, formatDateShort, formatTimeShort } from '../utils/formatters';

interface HeaderProps {
  config: AppConfig;
  tables: Table[];
  sales: Sale[];
  /** Data/hora (ISO) da última confirmação de `ativa: true` no servidor. */
  licenseVerifiedAt: string | null;
  licenseOffline: boolean;
}

/**
 * Barra superior enxuta: identidade do caixa, o número que importa (mesas
 * ocupadas / contas pedidas / vendas do dia), relógio e operador.
 * Navegação ficou no menu.
 */
export const Header: React.FC<HeaderProps> = ({
  config,
  tables,
  sales,
  licenseVerifiedAt,
  licenseOffline,
}) => {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const occupiedCount = tables.filter((t) => t.status === 'ocupada').length;
  const billRequestedCount = tables.filter((t) => t.status === 'conta_solicitada').length;

  // Vendas do dia local (o caixa fecha pela data do estabelecimento)
  const diaLocal = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');
  const hoje = diaLocal(new Date().toISOString());
  const vendasHoje = sales.filter((s) => diaLocal(s.dataHora) === hoje);
  const totalHoje = vendasHoje.reduce((acc, s) => acc + s.totalLiquido, 0);

  const verificacaoLabel = licenseVerifiedAt
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(
        new Date(licenseVerifiedAt)
      )
    : 'não confirmada';

  return (
    <header className="bg-zinc-950 text-zinc-200 border-b border-zinc-800 sticky top-0 z-40 select-none">
      <div className="max-w-[1920px] mx-auto px-3 sm:px-5 h-12 flex items-center gap-4">
        {/* Marca */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-6 h-6 rounded-md bg-orange-600 text-white flex items-center justify-center">
            <UtensilsCrossed className="w-3.5 h-3.5" aria-hidden="true" />
          </span>
          <span className="font-bold text-sm tracking-tight text-white">Comanda Pro</span>
        </div>

        {/* Loja */}
        <div className="min-w-0 flex-1 hidden sm:flex items-baseline gap-2 border-l border-zinc-800 pl-4">
          <span className="text-sm font-semibold text-zinc-100 truncate">
            {config.dadosEmpresa.nomeFantasia || config.dadosEmpresa.razaoSocial}
          </span>
          <span className="text-[11px] text-zinc-500 font-mono truncate">
            {config.dadosEmpresa.cidade}/{config.dadosEmpresa.uf}
          </span>
        </div>

        {/* Operação + relógio + operador */}
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-3 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1.5" title="Mesas ocupadas">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="font-mono text-zinc-200">{occupiedCount}</span>
              <span className="hidden lg:inline">ocupadas</span>
            </span>
            {billRequestedCount > 0 && (
              <span className="flex items-center gap-1.5" title="Contas solicitadas">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="font-mono text-amber-300">{billRequestedCount}</span>
                <span className="hidden lg:inline">contas pedidas</span>
              </span>
            )}
            <span
              className="flex items-center gap-1.5"
              title={`${vendasHoje.length} venda${vendasHoje.length === 1 ? '' : 's'} concluída${vendasHoje.length === 1 ? '' : 's'} hoje`}
            >
              <CircleDollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-emerald-300 font-bold">
                {formatCurrency(totalHoje)}
              </span>
              <span className="hidden lg:inline">hoje</span>
            </span>
          </div>

          <div
            className="hidden md:flex items-center gap-1.5 text-[11px] text-zinc-400"
            title={
              licenseOffline
                ? `Sem resposta do servidor. Caixa liberado pela tolerância offline. Última confirmação: ${verificacaoLabel}.`
                : `Licença confirmada no servidor em ${verificacaoLabel} (chave com ativa: true).`
            }
          >
            <span
              className={cn(
                'w-1.5 h-1.5 rounded-full',
                licenseOffline ? 'bg-amber-400' : 'bg-emerald-500'
              )}
            />
            <span>{licenseOffline ? 'Licença offline' : 'Licença ativa'}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm text-zinc-100 tabular-nums">
              {formatTimeShort(now)}
            </span>
            <span className="text-[11px] text-zinc-500 font-mono hidden lg:inline">
              {formatDateShort(now)}
            </span>
          </div>

          <div className="flex items-center gap-2 border-l border-zinc-800 pl-4 max-w-[14rem]">
            <span className="text-xs text-zinc-300 truncate">{config.usuarioAtual || 'Operador 01'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
