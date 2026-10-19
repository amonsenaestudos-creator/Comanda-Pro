import React, { useState } from 'react';
import {
  DollarSign,
  FileSpreadsheet,
  ArrowRight,
  CreditCard,
  Percent,
  CheckCircle,
  Building,
} from 'lucide-react';
import { AppConfig, Sale } from '../../types';
import { formatCurrency, formatDateTime, rotuloOrigemVenda } from '../../utils/formatters';

interface Tab6FinanceiroProps {
  sales: Sale[];
  config: AppConfig;
  onNavigateTab: (tabId: number) => void;
}

export const Tab6Financeiro: React.FC<Tab6FinanceiroProps> = ({
  sales,
  config,
  onNavigateTab,
}) => {
  const [filterPeriod, setFilterPeriod] = useState<'hoje' | 'todos'>('todos');
  const [exportFeedback, setExportFeedback] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const activeSales =
    filterPeriod === 'hoje'
      ? sales.filter((s) => s.dataHora.slice(0, 10) === todayStr)
      : sales;

  // Breakdown by payment channel
  interface MethodSummary {
    metodo: string;
    totalBruto: number;
    taxaPercent: number;
    comissaoOperadora: number;
    totalLiquidoReceber: number;
    transacoesCount: number;
  }

  const rates = config.taxasComissao;

  const getRateForMethod = (m: string): number => {
    switch (m) {
      case 'Cartão Crédito':
        return rates.cartaoCredito || 3.2;
      case 'Cartão Débito':
        return rates.cartaoDebito || 1.8;
      case 'PIX':
        return rates.pix || 0.5;
      case 'iFood':
      case 'UberEats':
        return rates.aplicativos || 15.0;
      default:
        return 0.0;
    }
  };

  const methodsMap: Record<string, { totalBruto: number; count: number }> = {
    'Cartão Crédito': { totalBruto: 0, count: 0 },
    'Cartão Débito': { totalBruto: 0, count: 0 },
    PIX: { totalBruto: 0, count: 0 },
    iFood: { totalBruto: 0, count: 0 },
    UberEats: { totalBruto: 0, count: 0 },
    Dinheiro: { totalBruto: 0, count: 0 },
    Outros: { totalBruto: 0, count: 0 },
  };

  activeSales.forEach((sale) => {
    sale.pagamentos.forEach((p) => {
      const key = methodsMap[p.metodo] ? p.metodo : 'Outros';
      methodsMap[key].totalBruto += p.valor;
      methodsMap[key].count += 1;
    });
  });

  const methodSummaries: MethodSummary[] = Object.keys(methodsMap).map((m) => {
    const bruto = methodsMap[m].totalBruto;
    const taxa = getRateForMethod(m);
    const comissao = Number(((bruto * taxa) / 100).toFixed(2));
    const liq = Number((bruto - comissao).toFixed(2));
    return {
      metodo: m,
      totalBruto: bruto,
      taxaPercent: taxa,
      comissaoOperadora: comissao,
      totalLiquidoReceber: liq,
      transacoesCount: methodsMap[m].count,
    };
  });

  const totalBrutoGeral = methodSummaries.reduce((acc, m) => acc + m.totalBruto, 0);
  const totalComissoesPagar = methodSummaries.reduce((acc, m) => acc + m.comissaoOperadora, 0);
  const totalLiquidoGeral = methodSummaries.reduce((acc, m) => acc + m.totalLiquidoReceber, 0);

  // Export Bank Reconciliation CSV
  const handleExportReconciliationCsv = () => {
    const headers =
      'DataHora;IdVenda;MesaOuCanal;MetodoPagamento;ValorBruto;TaxaPercent;ComissaoOperadora;ValorLiquidoReceber;Atendente\n';

    const rows = activeSales
      .flatMap((s) =>
        s.pagamentos.map((p) => {
          const taxa = getRateForMethod(p.metodo);
          const comissao = ((p.valor * taxa) / 100).toFixed(2);
          const liq = (p.valor - parseFloat(comissao)).toFixed(2);
          return `${s.dataHora};${s.id};${rotuloOrigemVenda(s)};${p.metodo};${p.valor.toFixed(2)};${taxa}%;${comissao};${liq};${s.atendente}`;
        })
      )
      .join('\n');

    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Conciliacao_Bancaria_${config.dadosEmpresa.nomeFantasia.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    setExportFeedback(true);
    setTimeout(() => setExportFeedback(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="cp-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-orange-600" />
              <span>Controle Financeiro, Cartões & Conciliação Bancária</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Apuração de contas a receber por operadora de cartão, comissões de delivery e exportação de conciliação (.csv).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-zinc-100 p-1 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setFilterPeriod('hoje')}
                className={`px-3 py-1 rounded-md transition ${
                  filterPeriod === 'hoje' ? 'bg-white text-orange-600 font-bold' : 'text-zinc-600'
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setFilterPeriod('todos')}
                className={`px-3 py-1 rounded-md transition ${
                  filterPeriod === 'todos' ? 'bg-white text-orange-600 font-bold' : 'text-zinc-600'
                }`}
              >
                Todo Histórico
              </button>
            </div>

            {/* Botão Azul: Exportação Conciliação Bancária .CSV */}
            <button
              onClick={handleExportReconciliationCsv}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Conciliação (.CSV)</span>
            </button>
          </div>
        </div>

        {/* Shortcuts bar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-600">Atalhos rápidos:</span>
          <button
            onClick={() => onNavigateTab(3)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Relatórios de Vendas <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(7)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Dashboard Gráficos <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(4)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Ajustar Taxas de Cartão <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {exportFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-bold">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Arquivo de conciliação bancária (.csv) gerado e baixado com sucesso!</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="cp-card p-4">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span className="font-semibold uppercase">Total Bruto Processado</span>
            <CreditCard className="w-4 h-4 text-zinc-400" />
          </div>
          <div className="text-2xl font-black text-zinc-900 font-mono">
            {formatCurrency(totalBrutoGeral)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            Soma de todas as entradas registradas
          </div>
        </div>

        <div className="cp-card p-4 border-rose-200">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-semibold uppercase">Comissões a Pagar Operadoras</span>
            <Percent className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-600 font-mono">
            -{formatCurrency(totalComissoesPagar)}
          </div>
          <div className="text-[11px] text-rose-600/70 mt-1">
            Taxas retidas (Cartão crédito, débito, apps)
          </div>
        </div>

        <div className="cp-card p-4 border-emerald-200">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span className="font-bold uppercase">Líquido a Receber / Conta</span>
            <Building className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            {formatCurrency(totalLiquidoGeral)}
          </div>
          <div className="text-[11px] text-emerald-600/70 mt-1">
            Valor real creditado no caixa/banco da empresa
          </div>
        </div>
      </div>

      {/* Accounts Receivable Table by Payment Method */}
      <div className="cp-card overflow-hidden">
        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
          <span className="font-bold text-xs text-zinc-700 uppercase tracking-wide">
            Contas a Receber & Comissões por Meio de Pagamento
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            Configuração ativa de taxas &bull; 2026
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/70 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-4">Meio de Pagamento</th>
                <th className="py-2.5 px-4 text-center">Transações</th>
                <th className="py-2.5 px-4 text-right">Valor Bruto</th>
                <th className="py-2.5 px-4 text-right">Taxa Operadora (%)</th>
                <th className="py-2.5 px-4 text-right text-rose-700">Comissão a Pagar</th>
                <th className="py-2.5 px-4 text-right text-emerald-700">Valor Líquido a Receber</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {methodSummaries.map((s) => (
                <tr key={s.metodo} className="hover:bg-zinc-50 transition-colors">
                  <td className="py-3 px-4 font-bold text-zinc-900 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                    <span>{s.metodo}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-mono text-zinc-600">
                    {s.transacoesCount}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-zinc-800">
                    {formatCurrency(s.totalBruto)}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-zinc-600">
                    {s.taxaPercent}%
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-600">
                    {s.comissaoOperadora > 0 ? `-${formatCurrency(s.comissaoOperadora)}` : 'R$ 0,00'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-black text-emerald-700 text-sm">
                    {formatCurrency(s.totalLiquidoReceber)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-zinc-100 font-bold text-xs border-t border-zinc-200">
              <tr>
                <td className="py-3 px-4 uppercase text-zinc-900">Total Consolidado</td>
                <td className="py-3 px-4 text-center font-mono">
                  {methodSummaries.reduce((acc, m) => acc + m.transacoesCount, 0)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-zinc-900">
                  {formatCurrency(totalBrutoGeral)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-zinc-500">-</td>
                <td className="py-3 px-4 text-right font-mono text-rose-700">
                  -{formatCurrency(totalComissoesPagar)}
                </td>
                <td className="py-3 px-4 text-right font-mono text-emerald-800 font-black text-sm">
                  {formatCurrency(totalLiquidoGeral)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Transaction History for Auditing */}
      <div className="cp-card p-4">
        <h4 className="font-bold text-xs text-zinc-800 uppercase tracking-wide mb-3">
          Demonstrativo Individual de Vendas com Desconto de Taxas
        </h4>
        <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100 text-xs">
          {activeSales.slice(0, 10).map((s) => (
            <div key={s.id} className="py-2 flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-zinc-800">{s.id}</span> &bull;{' '}
                <span className="text-zinc-500">{formatDateTime(s.dataHora)}</span> &bull;{' '}
                <span className="font-medium text-zinc-700">
                  {rotuloOrigemVenda(s)}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono">
                <span className="text-zinc-600">Bruto: {formatCurrency(s.totalLiquido)}</span>
                <span className="font-bold text-emerald-700">
                  Líq: {formatCurrency(s.totalLiquido * (1 - (config.taxasComissao.cartaoCredito || 3) / 100))}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
