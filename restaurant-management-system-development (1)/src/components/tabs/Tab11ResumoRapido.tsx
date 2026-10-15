import React from 'react';
import { TrendingUp, Receipt, Users, CookingPot, ArrowRight } from 'lucide-react';
import { Sale, Table, KitchenOrder, AppConfig } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  sales: Sale[];
  tables: Table[];
  kitchenOrders: KitchenOrder[];
  config: AppConfig;
  onNavigateTab: (tabId: number) => void;
}

export const Tab11ResumoRapido: React.FC<Props> = ({ sales, tables, kitchenOrders, config, onNavigateTab }) => {
  const today = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((s) => s.dataHora?.slice(0, 10) === today || s.createdAt?.slice(0, 10) === today);
  const totalHoje = todaySales.reduce((sum, s) => sum + (s.totalLiquido || s.subtotal || 0), 0);
  const ocupadas = tables.filter((t) => t.status === 'ocupada').length;
  const pendentesCozinha = kitchenOrders.filter((k) => k.status === 'novo' || k.status === 'preparo').length;

  const cards = [
    {
      label: 'Vendas Hoje',
      value: formatCurrency(totalHoje),
      sub: `${todaySales.length} venda${todaySales.length !== 1 ? 's' : ''}`,
      icon: Receipt,
      color: 'bg-emerald-600',
      hover: 'hover:border-emerald-300',
      action: () => onNavigateTab(3),
    },
    {
      label: 'Mesas Ocupadas',
      value: String(ocupadas),
      sub: 'Atenção necessária',
      icon: Users,
      color: 'bg-amber-500',
      hover: 'hover:border-amber-300',
      action: () => onNavigateTab(8),
    },
    {
      label: 'Pedidos Cozinha',
      value: String(pendentesCozinha),
      sub: 'Pendentes / Em preparo',
      icon: CookingPot,
      color: 'bg-rose-500',
      hover: 'hover:border-rose-300',
      action: () => onNavigateTab(9),
    },
    {
      label: 'Ticket Médio',
      value: todaySales.length ? formatCurrency(totalHoje / todaySales.length) : '—',
      sub: 'Baseado nas vendas de hoje',
      icon: TrendingUp,
      color: 'bg-sky-600',
      hover: 'hover:border-sky-300',
      action: () => onNavigateTab(7),
    },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight">Resumo do Caixa</h2>
          <p className="text-zinc-500 text-sm mt-1">Visão rápida para o operador — clique em um card para navegar.</p>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Hoje</div>
          <div className="text-xl font-mono font-extrabold text-zinc-900">{new Date().toLocaleDateString('pt-BR')}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        {cards.map((c) => (
          <button
            key={c.label}
            onClick={c.action}
            className={`text-left bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-200 relative overflow-hidden group ${c.hover}`}
          >
            <div className={`absolute top-0 right-0 w-28 h-28 -mr-8 -mt-8 rounded-full ${c.color} opacity-10 group-hover:scale-110 transition-transform duration-300`} />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className={`${c.color} text-white p-2.5 rounded-xl shadow-md shadow-black/10`}>
                <c.icon className="w-6 h-6" />
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-300 group-hover:translate-x-1 group-hover:text-zinc-500 transition-all" />
            </div>
            <div className="text-3xl font-extrabold text-zinc-900 tracking-tight mb-1">{c.value}</div>
            <div className="text-sm font-bold text-zinc-800">{c.label}</div>
            <div className="text-xs text-zinc-400 font-medium mt-1">{c.sub}</div>
          </button>
        ))}
      </div>

      {/* Top Garçons / Setores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-zinc-900 mb-4">Top Garçons (Hoje)</h3>
          <div className="space-y-3">
            {(() => {
              const today = new Date().toISOString().slice(0,10);
              const map: Record<string, number> = {};
              sales.forEach((s) => {
                if ((s.dataHora?.slice(0,10) === today || s.createdAt?.slice(0,10) === today)) {
                  const a = s.atendente || 'Não identificado';
                  map[a] = (map[a] || 0) + (s.totalLiquido || s.subtotal || 0);
                }
              });
              const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,3);
              if (!sorted.length) return <div className="text-sm text-zinc-400">Nenhuma venda ainda hoje.</div>;
              return sorted.map(([nome, val], i) => (
                <div key={nome} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white ${i===0?'bg-amber-400':i===1?'bg-zinc-400':'bg-rose-400'}`}>{i+1}</span>
                    <span className="text-sm font-bold text-zinc-800">{nome}</span>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-zinc-900">{formatCurrency(val)}</span>
                </div>
              ));
            })()}
          </div>
        </div>
        <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-zinc-900 mb-4">Vendas por Mesa</h3>
          <div className="space-y-3">
            {(() => {
              const today = new Date().toISOString().slice(0,10);
              const map: Record<string, number> = {};
              sales.forEach((s) => {
                if ((s.dataHora?.slice(0,10) === today || s.createdAt?.slice(0,10) === today)) {
                  const m = typeof s.mesa === 'number' ? `Mesa ${s.mesa}` : s.mesa || 'Balcão';
                  map[m] = (map[m] || 0) + (s.totalLiquido || s.subtotal || 0);
                }
              });
              const sorted = Object.entries(map).sort((a,b) => b[1]-a[1]).slice(0,4);
              if (!sorted.length) return <div className="text-sm text-zinc-400">Nenhuma venda ainda hoje.</div>;
              return sorted.map(([mesa, val], i) => (
                <div key={mesa} className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-2 border border-zinc-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white ${i===0?'bg-amber-400':i===1?'bg-zinc-400':'bg-rose-400'}`}>{i+1}</span>
                    <span className="text-sm font-bold text-zinc-800">{mesa}</span>
                  </div>
                  <span className="text-sm font-mono font-extrabold text-zinc-900">{formatCurrency(val)}</span>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl p-6 sm:p-8 text-white shadow-2xl shadow-zinc-900/20 border border-zinc-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-extrabold tracking-tight">Status Operacional</h3>
            <p className="text-zinc-400 text-sm">Dados em tempo real do sistema.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNavigateTab(1)} className="bg-orange-500 hover:bg-orange-400 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-900/20 transition">Abrir PDV</button>
            <button onClick={() => onNavigateTab(8)} className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-4 py-2 rounded-xl font-bold text-sm transition">Ver Mesas</button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Mesas Total', v: tables.length, s: 'Configuradas' },
            { label: 'Ocupa. Atual', v: ocupadas, s: 'Em atendimento' },
            { label: 'Vendas Hoje', v: todaySales.length, s: 'Transações' },
            { label: 'Cozinha', v: pendentesCozinha, s: 'Pendentes' },
          ].map((s) => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-widest">{s.label}</div>
              <div className="text-2xl font-extrabold mt-1">{s.v}</div>
              <div className="text-xs text-zinc-300">{s.s}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
