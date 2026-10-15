import React from 'react';
import { TrendingUp, Receipt, Users, CookingPot, ArrowRight } from 'lucide-react';
import { Sale, Table, KitchenOrder } from '../../types';
import { formatCurrency, localDayKey } from '../../utils/formatters';

interface Props {
  sales: Sale[];
  tables: Table[];
  kitchenOrders: KitchenOrder[];
  onNavigateTab: (tabId: number) => void;
}

export const Tab11ResumoRapido: React.FC<Props> = ({ sales, tables, kitchenOrders, onNavigateTab }) => {
  const hoje = localDayKey();
  const isHoje = (s: Sale) => localDayKey(s.dataHora) === hoje;
  const todaySales = sales.filter(isHoje);
  const totalHoje = todaySales.reduce((sum, s) => sum + (s.totalLiquido || s.subtotal || 0), 0);
  const ocupadas = tables.filter((t) => t.status === 'ocupada').length;
  const pendentesCozinha = kitchenOrders.filter((k) => k.status === 'novo' || k.status === 'preparo').length;

  const cards = [
    {
      label: 'Vendas hoje',
      value: formatCurrency(totalHoje),
      sub: `${todaySales.length} venda${todaySales.length !== 1 ? 's' : ''} fechada${todaySales.length !== 1 ? 's' : ''}`,
      icon: Receipt,
      color: 'text-emerald-600',
      action: () => onNavigateTab(3),
    },
    {
      label: 'Mesas ocupadas',
      value: String(ocupadas),
      sub: 'Em atendimento agora',
      icon: Users,
      color: 'text-amber-500',
      action: () => onNavigateTab(8),
    },
    {
      label: 'Cozinha',
      value: String(pendentesCozinha),
      sub: 'Pendentes ou em preparo',
      icon: CookingPot,
      color: 'text-rose-500',
      action: () => onNavigateTab(9),
    },
    {
      label: 'Ticket médio',
      value: todaySales.length ? formatCurrency(totalHoje / todaySales.length) : '\u2014',
      sub: 'Média das vendas de hoje',
      icon: TrendingUp,
      color: 'text-sky-600',
      action: () => onNavigateTab(7),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold cp-text tracking-tight">Resumo do caixa</h2>
          <p className="cp-small cp-faint mt-0.5">Clique em um número para abrir a tela correspondente.</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="cp-label cp-faint font-bold">Hoje</div>
          <div className="cp-item cp-text font-mono font-bold">{new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={c.action}
            className="cp-card p-4 text-left group transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="cp-label cp-faint font-bold flex items-center gap-1.5">
                <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
                {c.label}
              </span>
              <ArrowRight className="w-4 h-4 cp-faint group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="cp-total cp-text font-black font-mono mt-2">{c.value}</div>
            <div className="cp-small cp-faint mt-1">{c.sub}</div>
          </button>
        ))}
      </div>

      {/* Top garçons / vendas por mesa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="cp-card p-4">
          <h3 className="cp-item cp-text font-bold mb-3">Top Garçons (Hoje)</h3>
          <div className="space-y-1.5">
            {(() => {
              const map: Record<string, number> = {};
              sales.forEach((s) => {
                if (isHoje(s)) {
                  const a = s.atendente || 'Não identificado';
                  map[a] = (map[a] || 0) + (s.totalLiquido || s.subtotal || 0);
                }
              });
              const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,3);
              if (!sorted.length) return <div className="cp-small cp-faint py-2">Nenhuma venda hoje.</div>;
              return sorted.map(([nome, val], i) => (
                <div key={nome} className="cp-inset flex items-center justify-between rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="cp-small cp-faint font-mono w-4">{i+1}</span>
                    <span className="cp-item cp-text font-semibold">{nome}</span>
                  </div>
                  <span className="cp-num cp-text font-bold font-mono">{formatCurrency(val)}</span>
                </div>
              ));
            })()}
          </div>
        </div>
        <div className="cp-card p-4">
          <h3 className="cp-item cp-text font-bold mb-3">Vendas por Mesa</h3>
          <div className="space-y-1.5">
            {(() => {
              const map: Record<string, number> = {};
              sales.forEach((s) => {
                if (isHoje(s)) {
                  const m = typeof s.mesa === 'number' ? `Mesa ${s.mesa}` : s.mesa || 'Balcão';
                  map[m] = (map[m] || 0) + (s.totalLiquido || s.subtotal || 0);
                }
              });
              const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,4);
              if (!sorted.length) return <div className="cp-small cp-faint py-2">Nenhuma venda hoje.</div>;
              return sorted.map(([mesa, val], i) => (
                <div key={mesa} className="cp-inset flex items-center justify-between rounded-lg px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <span className="cp-small cp-faint font-mono w-4">{i+1}</span>
                    <span className="cp-item cp-text font-semibold">{mesa}</span>
                  </div>
                  <span className="cp-num cp-text font-bold font-mono">{formatCurrency(val)}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>
    </div>
  );
};
