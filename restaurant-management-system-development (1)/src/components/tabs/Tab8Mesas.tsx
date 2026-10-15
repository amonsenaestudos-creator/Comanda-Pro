import React, { useState } from 'react';
import {
  LayoutGrid,
  Search,
  Printer,
  Plus,
  ArrowRight,
  Clock,
  User,
  X,
  CreditCard,
  ArrowRightLeft,
} from 'lucide-react';
import { AppConfig, Table } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Modal, buttonClass } from '../ui';

interface Tab8MesasProps {
  tables: Table[];
  config: AppConfig;
  onSelectTableForPdv: (tableNum: number) => void;
  onGoToPayment: (orderData: {
    mesa: number | string;
    itens: Table['itens'];
    subtotal: number;
    atendente?: string;
  }) => void;
  onPrintTableTicket: (mesaNum: number | string, items: Table['itens']) => void;
  onUpdateTableStatus: (tableNum: number, status: Table['status']) => void;
  onReleaseTable: (tableNum: number) => void;
  /** Move todos os itens e o atendente de uma mesa ocupada para uma mesa livre. */
  onTransferTable: (from: number, to: number) => void;
  onNavigateTab: (tabId: number) => void;
}

export const Tab8Mesas: React.FC<Tab8MesasProps> = ({
  tables,
  onSelectTableForPdv,
  onGoToPayment,
  onPrintTableTicket,
  onUpdateTableStatus,
  onReleaseTable,
  onTransferTable,
  onNavigateTab,
}) => {
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferTo, setTransferTo] = useState<number | null>(null);
  const freeTables = tables.filter((t) => t.status === 'livre' && t.itens.length === 0);
  const [filterStatus, setFilterStatus] = useState<'todos' | 'livre' | 'ocupada' | 'conta_solicitada'>('todos');
  const [searchTableNum, setSearchTableNum] = useState<string>('');
  const [selectedTableDetail, setSelectedTableDetail] = useState<Table | null>(null);

  // Filter tables
  const filteredTables = tables.filter((t) => {
    if (filterStatus !== 'todos' && t.status !== filterStatus) return false;
    if (searchTableNum.trim() !== '') {
      if (!String(t.numero).includes(searchTableNum.trim())) return false;
    }
    return true;
  });

  // Counts
  const occupiedCount = tables.filter((t) => t.status === 'ocupada').length;
  const requestedCount = tables.filter((t) => t.status === 'conta_solicitada').length;
  const freeCount = tables.filter((t) => t.status === 'livre').length;
  const totalSaloonRevenue = tables.reduce((acc, t) => acc + (t.total || 0), 0);

  const handleOpenDetail = (t: Table) => {
    setSelectedTableDetail(t);
  };

  const handlePayTable = (t: Table) => {
    if (t.itens.length === 0) {
      alert(`A Mesa #${t.numero} não possui itens consumidos.`);
      return;
    }
    onGoToPayment({
      mesa: t.numero,
      itens: t.itens,
      subtotal: t.total,
      atendente: t.garcom,
    });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-orange-600" />
              <span>Gestão de Mesas & Comandas (Salão - Mesas 1 a 50)</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Controle em tempo real de ocupação, contas solicitadas e fechamento de conta isolado por mesa.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Livres: {freeCount}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
              <span>Ocupadas: {occupiedCount}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-xs font-bold text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              <span>Conta Solicitada: {requestedCount}</span>
            </div>

            <div className="px-3 py-1.5 rounded-lg bg-zinc-900 text-orange-400 font-mono text-xs font-bold border border-zinc-800">
              Consumo Salão: {formatCurrency(totalSaloonRevenue)}
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
            Frente de Caixa (PDV) <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(2)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Tela Pagamentos <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(9)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Cozinha & Pedidos <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Filter and Status Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Buttons */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilterStatus('todos')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                filterStatus === 'todos'
                  ? 'bg-zinc-900 text-white shadow-xs'
                  : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              Todas (50)
            </button>
            <button
              onClick={() => setFilterStatus('livre')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                filterStatus === 'livre'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Livres ({freeCount})
            </button>
            <button
              onClick={() => setFilterStatus('ocupada')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                filterStatus === 'ocupada'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              Ocupadas ({occupiedCount})
            </button>
            <button
              onClick={() => setFilterStatus('conta_solicitada')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                filterStatus === 'conta_solicitada'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Conta Solicitada ({requestedCount})
            </button>
          </div>

          {/* Quick Table Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar Nº Mesa (Ex: 3, 12, 45)..."
              value={searchTableNum}
              onChange={(e) => setSearchTableNum(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
            />
          </div>
        </div>
      </div>

      {/* Mesas 1 to 50 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-3">
        {filteredTables.map((table) => {
          const isOccupied = table.status === 'ocupada';
          const isRequested = table.status === 'conta_solicitada';
          const isFree = table.status === 'livre';

          // Color themes according to requirements:
          // Verde: Livre
          // Vermelho: Ocupada
          // Amarelo: Conta Solicitada
          const borderColor = isOccupied
            ? 'border-rose-400 hover:border-rose-600'
            : isRequested
            ? 'border-amber-400 hover:border-amber-600'
            : 'border-emerald-300 hover:border-emerald-500';

          const bgHeader = isOccupied
            ? 'bg-rose-600 text-white'
            : isRequested
            ? 'bg-amber-500 text-zinc-950'
            : 'bg-emerald-600 text-white';

          const statusBadge = isOccupied
            ? 'Ocupada'
            : isRequested
            ? 'Conta Pedida'
            : 'Livre';

          return (
            <div
              key={table.numero}
              onClick={() => handleOpenDetail(table)}
              className={`bg-white rounded-xl border-2 ${borderColor} shadow-xs hover:shadow-md cursor-pointer transition-all duration-150 flex flex-col justify-between overflow-hidden group`}
            >
              {/* Card Top */}
              <div className={`px-2.5 py-1.5 flex items-center justify-between font-extrabold ${bgHeader}`}>
                <span className="text-xs tracking-wider">
                  MESA {table.numero < 10 ? `0${table.numero}` : table.numero}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-tight opacity-90">
                  {statusBadge}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-2.5 flex-1 flex flex-col justify-between text-center min-h-[90px]">
                {isFree ? (
                  <div className="flex flex-col items-center justify-center py-2 text-zinc-400">
                    <span className="text-xs font-semibold text-emerald-700">Mesa Livre</span>
                    <span className="text-[10px] text-zinc-400">Pronta p/ cliente</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-sm font-black font-mono text-zinc-900">
                      {formatCurrency(table.total)}
                    </div>
                    <div className="text-[10px] text-zinc-500 font-medium">
                      {table.itens.length} {table.itens.length === 1 ? 'item' : 'itens'}
                    </div>
                    {table.garcom && (
                      <div className="text-[9px] text-zinc-400 truncate max-w-full">
                        {table.garcom.split(' ')[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Action Button at footer */}
                <div className="mt-2 pt-1 border-t border-zinc-100 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-orange-600 group-hover:underline flex items-center gap-0.5">
                    Ver Detalhes &rarr;
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mesa Consumption Modal (Destaque ao clicar nas mesas para ver descrição do consumo) */}
      {selectedTableDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-5 border border-zinc-200 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
                    selectedTableDetail.status === 'ocupada'
                      ? 'bg-rose-600 text-white'
                      : selectedTableDetail.status === 'conta_solicitada'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-emerald-600 text-white'
                  }`}
                >
                  #{selectedTableDetail.numero}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-zinc-900 leading-tight">
                    Mesa {selectedTableDetail.numero} - Detalhes do Consumo
                  </h3>
                  <div className="text-[11px] text-zinc-500 flex items-center gap-2">
                    <span className="font-semibold uppercase">
                      Status: {selectedTableDetail.status.replace('_', ' ')}
                    </span>
                    {selectedTableDetail.abertura && (
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(selectedTableDetail.abertura)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedTableDetail(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Waiter & Client Info */}
            <div className="py-2.5 px-3 bg-zinc-50 rounded-lg border border-zinc-200 my-3 flex flex-wrap justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 text-zinc-700">
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Atendente:</span>
                <strong className="text-zinc-900">
                  {selectedTableDetail.garcom || 'Não vinculado'}
                </strong>
              </div>
              {selectedTableDetail.cliente && (
                <div className="text-zinc-600">
                  Cliente: <strong>{selectedTableDetail.cliente}</strong>
                </div>
              )}
            </div>

            {/* Consumption items table */}
            <div className="text-xs max-h-56 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-lg p-2">
              {selectedTableDetail.itens.length === 0 ? (
                <div className="text-center py-8 text-zinc-400">
                  Nenhum item lançado nesta mesa até o momento.
                </div>
              ) : (
                selectedTableDetail.itens.map((it, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-bold text-zinc-900">
                        {it.quantidade}x {it.descricao}
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        Preço unit: {formatCurrency(it.precoUnitario)}{' '}
                        {it.observacao && (
                          <span className="text-amber-700 font-semibold">
                            &bull; Obs: {it.observacao}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="font-extrabold font-mono text-zinc-900">
                      {formatCurrency(it.valorTotal)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Footer */}
            <div className="mt-3 p-3 bg-zinc-900 text-white rounded-lg flex items-center justify-between">
              <span className="text-xs uppercase font-bold text-zinc-300">
                Subtotal Consumido:
              </span>
              <span className="text-xl font-extrabold font-mono text-orange-400">
                {formatCurrency(selectedTableDetail.total)}
              </span>
            </div>

            {/* Status Switcher Toolbar */}
            <div className="mt-3 pt-3 border-t border-zinc-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-zinc-600">Mudar Status da Mesa:</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTableDetail.numero, 'livre');
                    setSelectedTableDetail({ ...selectedTableDetail, status: 'livre' });
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                    selectedTableDetail.status === 'livre'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  Livre
                </button>
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTableDetail.numero, 'ocupada');
                    setSelectedTableDetail({ ...selectedTableDetail, status: 'ocupada' });
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                    selectedTableDetail.status === 'ocupada'
                      ? 'bg-rose-600 text-white'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  Ocupada
                </button>
                <button
                  onClick={() => {
                    onUpdateTableStatus(selectedTableDetail.numero, 'conta_solicitada');
                    setSelectedTableDetail({ ...selectedTableDetail, status: 'conta_solicitada' });
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold ${
                    selectedTableDetail.status === 'conta_solicitada'
                      ? 'bg-amber-500 text-zinc-950'
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                  }`}
                >
                  Conta Solicitada
                </button>
              </div>
            </div>

            {/* Main Action Buttons: Verde (Atender/Lançar), Azul (Imprimir Pré-Conta), Verde (Fechar e Pagar), Vermelho (Liberar Mesa) */}
            <div className="mt-4 pt-3 border-t border-zinc-200 grid grid-cols-2 sm:grid-cols-5 gap-2">
              {/* Verde: Lançar Itens no PDV */}
              <button
                onClick={() => {
                  onSelectTableForPdv(selectedTableDetail.numero);
                  setSelectedTableDetail(null);
                }}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center gap-1 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Lançar PDV</span>
              </button>

              {/* Azul: Impressão isolada de cada mesa */}
              <button
                onClick={() => {
                  onPrintTableTicket(selectedTableDetail.numero, selectedTableDetail.itens);
                }}
                disabled={selectedTableDetail.itens.length === 0}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Mesa</span>
              </button>

              {/* Verde: Fechar e Pagar */}
              <button
                onClick={() => {
                  handlePayTable(selectedTableDetail);
                  setSelectedTableDetail(null);
                }}
                disabled={selectedTableDetail.itens.length === 0}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs transition"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Fechar / Pagar</span>
              </button>

              {/* Transferir consumo para outra mesa livre */}
              <button
                onClick={() => {
                  setTransferTo(null);
                  setTransferOpen(true);
                }}
                disabled={selectedTableDetail.itens.length === 0}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white disabled:opacity-50 flex items-center justify-center gap-1 shadow-xs transition"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                <span>Transferir</span>
              </button>

              {/* Vermelho: Liberar Mesa */}
              <button
                onClick={() => {
                  if (window.confirm(`Deseja realmente LIBERAR a Mesa #${selectedTableDetail.numero}?`)) {
                    onReleaseTable(selectedTableDetail.numero);
                    setSelectedTableDetail(null);
                  }
                }}
                className="py-2 px-2 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1 shadow-xs transition"
              >
                <X className="w-3.5 h-3.5" />
                <span>Liberar Mesa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: transferir mesa */}
      <Modal
        open={transferOpen && selectedTableDetail !== null}
        onClose={() => setTransferOpen(false)}
        title={`Transferir Mesa ${selectedTableDetail?.numero ?? ''}`}
        icon={<ArrowRightLeft className="h-5 w-5 text-zinc-800" />}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setTransferOpen(false)} className={buttonClass('ghost', 'md')}>
              Cancelar
            </button>
            <button
              type="button"
              disabled={transferTo === null}
              onClick={() => {
                if (!selectedTableDetail || transferTo === null) return;
                onTransferTable(selectedTableDetail.numero, transferTo);
                setTransferOpen(false);
                setSelectedTableDetail(null);
              }}
              className={buttonClass('dark', 'md')}
            >
              Transferir para Mesa {transferTo ?? '—'}
            </button>
          </div>
        }
      >
        <p className="mb-3 text-xs text-zinc-500">
          Escolha uma mesa livre. Itens, atendente e horário de abertura seguem para a nova mesa.
        </p>
        {freeTables.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 p-6 text-center text-sm text-zinc-400">
            Não há mesas livres no momento.
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {freeTables.map((t) => (
              <button
                key={t.numero}
                type="button"
                onClick={() => setTransferTo(t.numero)}
                className={`rounded-xl border py-2.5 text-sm font-extrabold transition ${
                  transferTo === t.numero
                    ? 'border-orange-600 bg-orange-600 text-white shadow-sm'
                    : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:border-emerald-500'
                }`}
              >
                {String(t.numero).padStart(2, '0')}
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};
