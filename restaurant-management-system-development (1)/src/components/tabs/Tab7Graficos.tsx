import React, { useState } from 'react';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Layers,
  Award,
  ArrowRight,
  DollarSign,
} from 'lucide-react';
import { Sale } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Tab7GraficosProps {
  sales: Sale[];
  onNavigateTab: (tabId: number) => void;
}

export const Tab7Graficos: React.FC<Tab7GraficosProps> = ({
  sales,
  onNavigateTab,
}) => {
  const [timeFilter, setTimeFilter] = useState<'hoje' | 'semana' | 'mes' | 'tudo'>('tudo');

  const totalSalesRevenue = sales.reduce((acc, s) => acc + s.totalLiquido, 0);

  // 1. Gráfico Meios de Pagamentos (%)
  const paymentTotals: Record<string, number> = {};
  sales.forEach((s) => {
    s.pagamentos.forEach((p) => {
      paymentTotals[p.metodo] = (paymentTotals[p.metodo] || 0) + p.valor;
    });
  });

  const paymentList = Object.entries(paymentTotals)
    .map(([metodo, valor]) => ({
      metodo,
      valor,
      percent: totalSalesRevenue > 0 ? Number(((valor / totalSalesRevenue) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  // 2. Gráfico por Setor (%)
  const sectorTotals: Record<string, number> = {};
  let totalSectorItemsValue = 0;
  sales.forEach((s) => {
    s.itens.forEach((it) => {
      const sec = it.setor || 'Geral';
      sectorTotals[sec] = (sectorTotals[sec] || 0) + it.valorTotal;
      totalSectorItemsValue += it.valorTotal;
    });
  });

  const sectorList = Object.entries(sectorTotals)
    .map(([setor, valor]) => ({
      setor,
      valor,
      percent:
        totalSectorItemsValue > 0
          ? Number(((valor / totalSectorItemsValue) * 100).toFixed(1))
          : 0,
    }))
    .sort((a, b) => b.valor - a.valor);

  // 3. Dez Mercadorias mais vendidas (Top 10)
  const productSalesMap: Record<string, { descricao: string; setor: string; qtd: number; valorTotal: number }> = {};
  sales.forEach((s) => {
    s.itens.forEach((it) => {
      if (!productSalesMap[it.descricao]) {
        productSalesMap[it.descricao] = {
          descricao: it.descricao,
          setor: it.setor || 'Geral',
          qtd: 0,
          valorTotal: 0,
        };
      }
      productSalesMap[it.descricao].qtd += it.quantidade;
      productSalesMap[it.descricao].valorTotal += it.valorTotal;
    });
  });

  const top10Products = Object.values(productSalesMap)
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 10);

  const maxProductQtd = top10Products.length > 0 ? Math.max(...top10Products.map((p) => p.qtd)) : 1;

  // 4. Vendas Diárias (Horários aproximados do dia)
  const hourlyData = [
    { hora: '11:00', valor: 280, pct: 45 },
    { hora: '12:00', valor: 620, pct: 90 },
    { hora: '13:00', valor: 540, pct: 80 },
    { hora: '14:00', valor: 210, pct: 30 },
    { hora: '18:00', valor: 390, pct: 55 },
    { hora: '19:00', valor: 710, pct: 100 },
    { hora: '20:00', valor: 680, pct: 95 },
    { hora: '21:00', valor: 490, pct: 70 },
  ];

  // 5. Vendas Semanal (Seg a Dom)
  const weeklyData = [
    { dia: 'Segunda', valor: 1450, meta: 1200, pct: 60 },
    { dia: 'Terça', valor: 1680, meta: 1300, pct: 70 },
    { dia: 'Quarta', valor: 1890, meta: 1500, pct: 78 },
    { dia: 'Quinta', valor: 2100, meta: 1800, pct: 85 },
    { dia: 'Sexta', valor: 2850, meta: 2200, pct: 100 },
    { dia: 'Sábado', valor: 3200, meta: 2500, pct: 110 },
    { dia: 'Domingo', valor: 2600, meta: 2000, pct: 92 },
  ];

  // 6. Vendas Mensal (Últimos 6 meses)
  const monthlyData = [
    { mes: 'Out/25', valor: 42500, pct: 75 },
    { mes: 'Nov/25', valor: 46800, pct: 82 },
    { mes: 'Dez/25', valor: 58200, pct: 100 },
    { mes: 'Jan/26', valor: 49300, pct: 85 },
    { mes: 'Fev/26', valor: 51200, pct: 88 },
    { mes: 'Mar/26 (Atual)', valor: 54100, pct: 93 },
  ];

  const colorPalette = [
    '#f97316', // Orange
    '#0284c7', // Sky
    '#10b981', // Emerald
    '#8b5cf6', // Purple
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#64748b', // Slate
    '#14b8a6', // Teal
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="cp-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-600" />
              <span>Painel de Gráficos & Indicadores de Performance (%)</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Visão executiva das vendas por canal, setor, períodos diário/semanal/mensal e ranking dos 10 mais vendidos.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setTimeFilter('hoje')}
                className={`px-3 py-1 rounded-md transition ${
                  timeFilter === 'hoje' ? 'bg-white text-orange-600 font-bold' : 'text-zinc-600'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setTimeFilter('semana')}
                className={`px-3 py-1 rounded-md transition ${
                  timeFilter === 'semana' ? 'bg-white text-orange-600 font-bold' : 'text-zinc-600'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setTimeFilter('mes')}
                className={`px-3 py-1 rounded-md transition ${
                  timeFilter === 'mes' ? 'bg-white text-orange-600 font-bold' : 'text-zinc-600'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setTimeFilter('tudo')}
                className={`px-3 py-1 rounded-md transition ${
                  timeFilter === 'tudo' ? 'bg-white text-orange-600 font-bold' : 'text-zinc-600'
                }`}
              >
                Geral
              </button>
            </div>
          </div>
        </div>

        {/* Shortcuts bar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-600">Atalhos rápidos:</span>
          <button
            onClick={() => onNavigateTab(1)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Frente de Caixa <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(3)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Relatórios Detalhados <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(6)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Contas a Receber <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(8)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Mapa de Mesas <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Row 1: Gráfico Meios de Pagamento (%) & Gráfico por Setor (%) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gráfico Meios de Pagamento */}
        <div className="cp-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Gráfico: Meios de Pagamentos (%)
              </h3>
            </div>
            <span className="text-xs font-mono font-bold text-zinc-700">
              {formatCurrency(totalSalesRevenue)}
            </span>
          </div>

          <div className="space-y-3">
            {paymentList.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                Nenhum dado de pagamento registrado.
              </div>
            ) : (
              paymentList.map((p, idx) => {
                const color = colorPalette[idx % colorPalette.length];
                return (
                  <div key={p.metodo} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        {p.metodo}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-zinc-500">{formatCurrency(p.valor)}</span>
                        <span className="font-extrabold text-zinc-900 bg-zinc-100 px-1.5 py-0.2 rounded text-[11px]">
                          {p.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, p.percent)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gráfico Setores (%) */}
        <div className="cp-card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Gráfico: Participação por Setor (%)
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-500">
              Categorias do Cardápio
            </span>
          </div>

          <div className="space-y-3">
            {sectorList.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-xs">
                Nenhum dado de vendas por setor.
              </div>
            ) : (
              sectorList.map((sec, idx) => {
                const color = colorPalette[(idx + 2) % colorPalette.length];
                return (
                  <div key={sec.setor} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-zinc-800 flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: color }}
                        />
                        {sec.setor}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-zinc-500">{formatCurrency(sec.valor)}</span>
                        <span className="font-extrabold text-zinc-900 bg-zinc-100 px-1.5 py-0.2 rounded text-[11px]">
                          {sec.percent}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(4, sec.percent)}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Vendas Diárias & Vendas Semanal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Vendas Diárias (Horários) Col 5 */}
        <div className="cp-card lg:col-span-5 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Gráfico: Pico de Vendas Diárias
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">Fluxo por faixa de horário</span>
          </div>

          <div className="h-44 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-zinc-200">
            {hourlyData.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[10px] font-mono text-zinc-400 group-hover:text-orange-600 transition">
                  {h.valor}
                </span>
                <div className="w-full bg-zinc-100 rounded-t-md h-32 flex items-end overflow-hidden">
                  <div
                    className="w-full bg-orange-500 group-hover:bg-orange-600 transition-all rounded-t-md"
                    style={{ height: `${h.pct}%` }}
                    title={`Horário ${h.hora}: R$ ${h.valor}`}
                  />
                </div>
                <span className="text-[10px] font-mono font-semibold text-zinc-600 mt-1">
                  {h.hora}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Vendas Semanal (Seg a Dom) Col 7 */}
        <div className="cp-card lg:col-span-7 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Gráfico: Desempenho Vendas Semanal
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">
              Meta vs Realizado
            </span>
          </div>

          <div className="space-y-2.5">
            {weeklyData.map((w, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-zinc-700 w-20">{w.dia}</span>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-zinc-500 text-[11px]">
                      Meta: {formatCurrency(w.meta)}
                    </span>
                    <span className="font-bold text-zinc-900 text-xs">
                      {formatCurrency(w.valor)}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        w.pct >= 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      {w.pct}%
                    </span>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      w.pct >= 100 ? 'bg-emerald-600' : 'bg-sky-600'
                    }`}
                    style={{ width: `${Math.min(100, w.pct)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Row 3: Gráfico Vendas Mensal & Gráfico Dez Mercadorias Mais Vendidas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Vendas Mensal (Col 4) */}
        <div className="cp-card lg:col-span-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Gráfico: Vendas Mensal
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">Histórico 6M</span>
          </div>

          <div className="space-y-3">
            {monthlyData.map((m, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-zinc-800">{m.mes}</span>
                  <span className="font-mono font-extrabold text-orange-600">
                    {formatCurrency(m.valor)}
                  </span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all"
                    style={{ width: `${m.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dez Mercadorias Mais Vendidas (Col 8) */}
        <div className="cp-card lg:col-span-8 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              <h3 className="font-bold text-sm text-zinc-900">
                Gráfico: 10 Mercadorias Mais Vendidas
              </h3>
            </div>
            <span className="text-xs text-zinc-500 font-mono">
              Top 10 Itens por Volume
            </span>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {top10Products.length === 0 ? (
              <div className="text-center py-10 text-zinc-400 text-xs">
                Nenhum item vendido ainda para compor o Top 10.
              </div>
            ) : (
              top10Products.map((p, idx) => {
                const pctBar = Math.round((p.qtd / maxProductQtd) * 100);
                return (
                  <div
                    key={p.descricao}
                    className="p-2.5 rounded-lg border border-zinc-200 bg-zinc-50/50 hover:bg-orange-50/30 transition flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
              idx === 0
               ? 'bg-amber-400 text-zinc-950 font-black'
               : idx === 1
               ? 'bg-zinc-300 text-zinc-900'
               : idx === 2
               ? 'bg-amber-700 text-white'
               : 'bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <span className="font-bold text-zinc-900">{p.descricao}</span>
                        <span className="text-[10px] bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded font-semibold hidden sm:inline">
                          {p.setor}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="font-bold text-zinc-800 text-xs">
                          {p.qtd} un vendidas
                        </span>
                        <span className="font-extrabold text-emerald-700 text-xs">
                          {formatCurrency(p.valorTotal)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-orange-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${pctBar}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
