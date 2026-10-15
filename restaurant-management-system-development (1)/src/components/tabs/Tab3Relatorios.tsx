import React, { useState } from 'react';
import {
  FileText,
  Printer,
  Calendar,
  Filter,
  RefreshCw,
  Search,
  Receipt,
  Eye,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AppConfig, Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface Tab3RelatoriosProps {
  sales: Sale[];
  config: AppConfig;
  onClearDailySales: () => void;
  onOpenReceiptPrint: (sale: Sale) => void;
  onNavigateTab: (tabId: number) => void;
}

export const Tab3Relatorios: React.FC<Tab3RelatoriosProps> = ({
  sales,
  config,
  onClearDailySales,
  onOpenReceiptPrint,
  onNavigateTab,
}) => {
  const [filterDate, setFilterDate] = useState<string>('');
  const [filterMethod, setFilterMethod] = useState<string>('TODOS');
  const [filterProduct, setFilterProduct] = useState<string>('');
  const [selectedSaleDetail, setSelectedSaleDetail] = useState<Sale | null>(null);

  // Filter sales
  const filteredSales = sales.filter((sale) => {
    // Date filter
    if (filterDate) {
      const sDate = sale.dataHora.slice(0, 10);
      if (sDate !== filterDate) return false;
    }

    // Payment method filter
    if (filterMethod !== 'TODOS') {
      const hasMethod = sale.pagamentos.some((p) => p.metodo === filterMethod);
      if (!hasMethod) return false;
    }

    // Product search filter
    if (filterProduct.trim() !== '') {
      const hasProduct = sale.itens.some((it) =>
        it.descricao.toLowerCase().includes(filterProduct.toLowerCase())
      );
      if (!hasProduct) return false;
    }

    return true;
  });

  // Financial aggregates
  const totalGross = filteredSales.reduce((acc, s) => acc + s.subtotal, 0);
  const totalServiceFees = filteredSales.reduce((acc, s) => acc + s.taxaServicoValor, 0);
  const totalNet = filteredSales.reduce((acc, s) => acc + s.totalLiquido, 0);
  const totalTaxes = filteredSales.reduce((acc, s) => acc + (s.impostosEstimados || 0), 0);

  const handlePrintReport = () => {
    window.print();
  };

  const handleClearConfirm = () => {
    if (
      window.confirm(
        'ATENÇÃO: Deseja ZERAR O CAIXA / INICIAR NOVO DIA?\nIsso resetará o histórico de vendas diário para uma nova jornada de trabalho.'
      )
    ) {
      onClearDailySales();
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner and Quick Shortcuts */}
      <div className="cp-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span>Relatórios de Vendas & Fechamento Fiscal</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Histórico completo de pedidos, auditoria de pagamentos e apuração de tributos (Alíquota:{' '}
              {config.aliquotaImpostoPercent}%).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Azul: Imprimir Relatórios */}
            <button
              onClick={handlePrintReport}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório</span>
            </button>

            {/* Botão Vermelho: Zerar Caixa / Novo Dia */}
            <button
              onClick={handleClearConfirm}
              className="px-3.5 py-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Zerar Caixa / Novo Dia</span>
            </button>
          </div>
        </div>

        {/* Shortcuts bar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-600">Atalhos rápidos:</span>
          <button
            onClick={() => onNavigateTab(1)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            PDV <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(6)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Conciliação Financeira <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(7)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Gráficos (%) <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(4)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Configurações <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* KPI Cards: Total Vendas, Subtotal, Serviços, Descontos, Impostos a Pagar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="cp-card p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">
            Vendas Concluídas
          </div>
          <div className="text-xl font-extrabold text-zinc-900 mt-1 font-mono">
            {filteredSales.length}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Tickets emitidos</div>
        </div>

        <div className="cp-card p-3.5">
          <div className="text-[11px] font-semibold text-zinc-500 uppercase">
            Subtotal Bruto
          </div>
          <div className="text-xl font-extrabold text-zinc-900 mt-1 font-mono">
            {formatCurrency(totalGross)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Sem taxas e descontos</div>
        </div>

        <div className="cp-card p-3.5">
          <div className="text-[11px] font-semibold text-emerald-600 uppercase">
            Taxa de Serviço
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">
            +{formatCurrency(totalServiceFees)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">Comissão dos garçons</div>
        </div>

        <div className="cp-card p-3.5 border-orange-200">
          <div className="text-[11px] font-bold text-orange-700 uppercase">
            Faturamento Líquido
          </div>
          <div className="text-xl font-extrabold text-orange-600 mt-1 font-mono">
            {formatCurrency(totalNet)}
          </div>
          <div className="text-[10px] text-zinc-500 mt-0.5">Total recebido em caixa</div>
        </div>

        <div className="cp-card p-3.5">
          <div className="text-[11px] font-semibold text-rose-600 uppercase">
            Impostos a Pagar
          </div>
          <div className="text-xl font-extrabold text-rose-700 mt-1 font-mono">
            {formatCurrency(totalTaxes)}
          </div>
          <div className="text-[10px] text-zinc-400 mt-0.5">
            Aprox. ({config.aliquotaImpostoPercent}%) Simples
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="cp-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3 items-end">
          {/* Data */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 block mb-1">
              Filtrar por Data:
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>
          </div>

          {/* Meio de Pagamento */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 block mb-1">
              Forma de Pagamento:
            </label>
            <div className="relative">
              <Filter className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <select
                value={filterMethod}
                onChange={(e) => setFilterMethod(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              >
                <option value="TODOS">Todos os Meios</option>
                <option value="PIX">PIX</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Cartão Débito">Cartão Débito</option>
                <option value="Cartão Crédito">Cartão Crédito</option>
                <option value="iFood">iFood</option>
                <option value="UberEats">UberEats</option>
                <option value="Boleto">Boleto</option>
                <option value="Vale">Vale</option>
              </select>
            </div>
          </div>

          {/* Mercadoria Search */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 block mb-1">
              Filtrar por Mercadoria:
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Ex: Burger, Suco, Açaí..."
                value={filterProduct}
                onChange={(e) => setFilterProduct(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
              />
            </div>
          </div>

          {/* Reset Filters */}
          <div>
            <button
              onClick={() => {
                setFilterDate('');
                setFilterMethod('TODOS');
                setFilterProduct('');
              }}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sales Listing Table */}
      <div className="cp-card overflow-hidden">
        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
          <span className="font-bold text-xs text-zinc-700 uppercase tracking-wide">
            Listagem Detalhada de Vendas Realizadas
          </span>
          <span className="text-xs text-zinc-500 font-mono">
            {filteredSales.length} registro(s) encontrado(s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-100/70 text-zinc-600 font-bold uppercase text-[10px] tracking-wider border-b border-zinc-200">
              <tr>
                <th className="py-2.5 px-3">Cód Venda</th>
                <th className="py-2.5 px-3">Data / Hora</th>
                <th className="py-2.5 px-3">Mesa / Canal</th>
                <th className="py-2.5 px-3">Atendente</th>
                <th className="py-2.5 px-3">Meios de Pagamento</th>
                <th className="py-2.5 px-3 text-right">Subtotal</th>
                <th className="py-2.5 px-3 text-right">Desconto</th>
                <th className="py-2.5 px-3 text-right">Total Líquido</th>
                <th className="py-2.5 px-3 text-right">Imposto Est.</th>
                <th className="py-2.5 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-normal">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-zinc-400">
                    Nenhuma venda encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-orange-50/30 transition-colors">
                    <td className="py-2 px-3 font-mono font-bold text-zinc-800">
                      {sale.id}
                    </td>
                    <td className="py-2 px-3 text-zinc-600 whitespace-nowrap">
                      {formatDateTime(sale.dataHora)}
                    </td>
                    <td className="py-2 px-3">
                      <span className="bg-zinc-100 text-zinc-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                        {typeof sale.mesa === 'number' ? `Mesa ${sale.mesa}` : sale.mesa || 'Balcão'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-zinc-700">{sale.atendente}</td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {sale.pagamentos.map((p, idx) => (
                          <span
                            key={idx}
                            className="bg-zinc-100 border border-zinc-200 text-zinc-700 text-[10px] px-1.5 py-0.2 rounded font-medium"
                          >
                            {p.metodo} ({formatCurrency(p.valor)})
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-600 font-mono">
                      {formatCurrency(sale.subtotal)}
                    </td>
                    <td className="py-2 px-3 text-right text-rose-600 font-mono">
                      {sale.descontoValor > 0 ? `-${formatCurrency(sale.descontoValor)}` : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-extrabold text-zinc-900 font-mono text-sm">
                      {formatCurrency(sale.totalLiquido)}
                    </td>
                    <td className="py-2 px-3 text-right text-zinc-500 font-mono">
                      {formatCurrency(sale.impostosEstimados)}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => setSelectedSaleDetail(sale)}
                          title="Ver Detalhes dos Itens"
                          className="p-1.5 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenReceiptPrint(sale)}
                          title="Imprimir Cupom da Venda"
                          className="p-1.5 rounded-md bg-sky-100 hover:bg-sky-200 text-sky-800 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="cp-card shadow-2xl max-w-lg w-full p-5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm text-zinc-900">
                  Detalhes do Pedido #{selectedSaleDetail.id}
                </h3>
              </div>
              <span className="text-xs bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded font-mono">
                {formatDateTime(selectedSaleDetail.dataHora)}
              </span>
            </div>

            <div className="py-3 divide-y divide-zinc-100 max-h-64 overflow-y-auto">
              {selectedSaleDetail.itens.map((it, idx) => (
                <div key={idx} className="py-2 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-zinc-900">{it.quantidade}x</span>{' '}
                    <span className="text-zinc-800">{it.descricao}</span>
                    <div className="text-[10px] text-zinc-400">
                      Unit: {formatCurrency(it.precoUnitario)} &bull; Setor: {it.setor}
                    </div>
                  </div>
                  <span className="font-bold font-mono text-zinc-900">
                    {formatCurrency(it.valorTotal)}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-zinc-50 p-3 rounded-lg border border-zinc-200 text-xs space-y-1 mt-2 font-mono">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSaleDetail.subtotal)}</span>
              </div>
              {selectedSaleDetail.taxaServicoValor > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Taxa de Serviço:</span>
                  <span>+{formatCurrency(selectedSaleDetail.taxaServicoValor)}</span>
                </div>
              )}
              {selectedSaleDetail.descontoValor > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Desconto:</span>
                  <span>-{formatCurrency(selectedSaleDetail.descontoValor)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-zinc-200 text-zinc-900">
                <span>Total Pago:</span>
                <span>{formatCurrency(selectedSaleDetail.totalLiquido)}</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center">
              <button
                onClick={() => {
                  onOpenReceiptPrint(selectedSaleDetail);
                  setSelectedSaleDetail(null);
                }}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reimprimir Comprovante</span>
              </button>

              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
