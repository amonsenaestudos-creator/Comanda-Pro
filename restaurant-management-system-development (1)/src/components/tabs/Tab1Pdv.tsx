import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Printer,
  HelpCircle,
  ChefHat,
  Tag,
  ShoppingBag,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Ban,
  Receipt,
  CheckCircle2,
} from 'lucide-react';
import { AppConfig, CancelamentoMotivo, OrderItem, Product, Table } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { Badge, Modal, PageHeader, buttonClass } from '../ui';
import { cn } from '../../utils/cn';

const MOTIVOS_CANCELAMENTO: CancelamentoMotivo[] = [
  'Erro de lançamento',
  'Cliente desistiu',
  'Produto em falta',
  'Pedido errado da cozinha',
  'Outro',
];

interface Tab1PdvProps {
  products: Product[];
  tables: Table[];
  onSaveTableItems: (tableNum: number, items: OrderItem[], waiterName?: string) => void;
  onGoToPayment: (orderData: {
    mesa: number | string;
    itens: OrderItem[];
    subtotal: number;
    atendente?: string;
  }) => void;
  onSendToKitchen: (orderData: {
    mesa: number | string;
    itens: OrderItem[];
    observacao?: string;
  }) => void;
  onPrintTableTicket: (mesaNum: number | string, items: OrderItem[]) => void;
  onNavigateTab: (tabId: number) => void;
  onSaveTableObservation?: (tableNum: number, note: string) => void;
  /** Cancela parte ou todo um item da mesa e grava o motivo no controle gerencial. */
  onCancelItem: (tableNum: number, item: OrderItem, quantidade: number, motivo: CancelamentoMotivo) => void;
  caixaAberto: boolean;
  config: AppConfig;
  selectedTableNumber?: number;
  setSelectedTableNumber?: (tableNum: number) => void;
}

export const Tab1Pdv: React.FC<Tab1PdvProps> = ({
  products,
  tables,
  onSaveTableItems,
  onGoToPayment,
  onSendToKitchen,
  onPrintTableTicket,
  onNavigateTab,
  onSaveTableObservation,
  onCancelItem,
  caixaAberto,
  config,
  selectedTableNumber: propTableNum,
  setSelectedTableNumber: setPropTableNum,
}) => {
  const [currentTableNum, setCurrentTableNum] = useState<number>(propTableNum || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemObservation, setItemObservation] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [isPriceLookupOpen, setIsPriceLookupOpen] = useState(false);
  const [priceLookupSearch, setPriceLookupSearch] = useState('');
  const [kitchenAlert, setKitchenAlert] = useState<string | null>(null);
  const [mesaObservacaoInput, setMesaObservacaoInput] = useState('');
  const [cancelTarget, setCancelTarget] = useState<OrderItem | null>(null);
  const [cancelQty, setCancelQty] = useState(1);
  const [cancelMotivo, setCancelMotivo] = useState<CancelamentoMotivo>('Erro de lançamento');

  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (propTableNum) setCurrentTableNum(propTableNum);
  }, [propTableNum]);

  const currentTable = tables.find((t) => t.numero === currentTableNum);
  const currentItems = useMemo(() => currentTable?.itens ?? [], [currentTable]);
  const totalItemsCount = currentItems.reduce((acc, it) => acc + it.quantidade, 0);
  const totalValue = currentItems.reduce((acc, it) => acc + it.valorTotal, 0);

  const categories = useMemo(
    () => ['TODOS', ...Array.from(new Set(products.map((p) => p.setor)))],
    [products]
  );

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = term === '' || p.descricao.toLowerCase().includes(term) || p.ean.includes(searchTerm.trim());
    const matchesCat = activeCategory === 'TODOS' || p.setor === activeCategory;
    return matchesSearch && matchesCat;
  });

  const lookupProducts = products.filter(
    (p) =>
      p.descricao.toLowerCase().includes(priceLookupSearch.toLowerCase()) ||
      p.ean.includes(priceLookupSearch)
  );

  useEffect(() => {
    setMesaObservacaoInput(currentTable?.observacaoMesa || '');
  }, [currentTableNum, currentTable?.observacaoMesa]);

  const handleSelectTable = (num: number) => {
    if (num < 1 || num > 50) return;
    setCurrentTableNum(num);
    if (setPropTableNum) setPropTableNum(num);
  };

  const handleAddItem = (prod: Product, customQty?: number) => {
    const qtyToAdd = customQty || quantity;
    if (qtyToAdd <= 0) return;

    const existingIdx = currentItems.findIndex(
      (it) => it.productId === prod.id && (!itemObservation || it.observacao === itemObservation)
    );

    let updatedItems: OrderItem[];
    if (existingIdx >= 0) {
      updatedItems = [...currentItems];
      const exist = updatedItems[existingIdx];
      const newQty = exist.quantidade + qtyToAdd;
      updatedItems[existingIdx] = {
        ...exist,
        quantidade: newQty,
        valorTotal: Number((newQty * exist.precoUnitario).toFixed(2)),
      };
    } else {
      const newItem: OrderItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        productId: prod.id,
        ean: prod.ean,
        descricao: prod.descricao,
        unidade: prod.unidade || 'UN',
        precoUnitario: prod.precoVenda,
        quantidade: qtyToAdd,
        valorTotal: Number((qtyToAdd * prod.precoVenda).toFixed(2)),
        observacao: itemObservation || undefined,
        setor: prod.setor,
      };
      updatedItems = [...currentItems, newItem];
    }

    onSaveTableItems(currentTableNum, updatedItems);
    setQuantity(1);
    setItemObservation('');
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    const item = currentItems[index];
    const newQty = item.quantidade + delta;
    if (newQty <= 0) {
      openCancel(item);
      return;
    }
    const updated = [...currentItems];
    updated[index] = {
      ...item,
      quantidade: newQty,
      valorTotal: Number((newQty * item.precoUnitario).toFixed(2)),
    };
    onSaveTableItems(currentTableNum, updated);
  };

  const openCancel = (item: OrderItem) => {
    setCancelTarget(item);
    setCancelQty(item.quantidade);
    setCancelMotivo('Erro de lançamento');
  };

  const confirmCancel = () => {
    if (!cancelTarget) return;
    const qty = Math.min(Math.max(1, cancelQty), cancelTarget.quantidade);
    onCancelItem(currentTableNum, cancelTarget, qty, cancelMotivo);
    setCancelTarget(null);
  };

  const handleClearTable = () => {
    if (currentItems.length === 0) return;
    if (window.confirm(`Deseja realmente LIMPAR todos os itens da Mesa #${currentTableNum}? Os itens ficarão registrados como cancelados.`)) {
      currentItems.forEach((it) => onCancelItem(currentTableNum, it, it.quantidade, 'Limpeza da mesa'));
    }
  };

  const handleSendToKitchenAction = () => {
    if (currentItems.length === 0) {
      alert('Nenhum item na comanda para enviar à produção!');
      return;
    }
    onSendToKitchen({
      mesa: currentTableNum,
      itens: currentItems,
      observacao: `Pedido Mesa #${currentTableNum}`,
    });
    setKitchenAlert(`Pedido da Mesa #${currentTableNum} enviado para a Cozinha!`);
    setTimeout(() => setKitchenAlert(null), 3500);
  };

  const handlePay = () => {
    if (currentItems.length === 0) {
      alert('Não há itens para pagar nesta mesa!');
      return;
    }
    if (!caixaAberto) {
      alert('O caixa está fechado. Abra o caixa antes de receber pagamentos.');
      onNavigateTab(11);
      return;
    }
    onGoToPayment({
      mesa: currentTableNum,
      itens: currentItems,
      subtotal: totalValue,
      atendente: currentTable?.garcom || config.usuarioAtual,
    });
  };

  const statusLabel =
    currentTable?.status === 'ocupada' ? 'Ocupada' : currentTable?.status === 'conta_solicitada' ? 'Conta pedida' : 'Livre';
  const statusTone = currentTable?.status === 'ocupada' ? 'red' : currentTable?.status === 'conta_solicitada' ? 'amber' : 'green';

  const actionDisabled = currentItems.length === 0;

  return (
    <div className="space-y-4">
      <PageHeader
        icon={<ShoppingBag className="h-5 w-5" />}
        title="Frente de Caixa"
        description="Lance os pedidos da mesa, envie para a cozinha e leve para o pagamento."
        actions={
          !caixaAberto ? (
            <button type="button" onClick={() => onNavigateTab(11)} className={buttonClass('warning', 'sm')}>
              Caixa fechado — abrir
            </button>
          ) : (
            <Badge tone="green">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Caixa aberto
            </Badge>
          )
        }
      />

      {/* Seletor de mesa */}
      <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm sm:p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => handleSelectTable(currentTableNum - 1)}
            disabled={currentTableNum <= 1}
            aria-label="Mesa anterior"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-lg font-extrabold text-zinc-900 sm:text-xl">Mesa {String(currentTableNum).padStart(2, '0')}</span>
              <Badge tone={statusTone}>{statusLabel}</Badge>
              {currentTable?.garcom && (
                <span className="truncate text-xs text-zinc-500">
                  · Atendente <strong className="text-zinc-700">{currentTable.garcom}</strong>
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'} na comanda
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleSelectTable(currentTableNum + 1)}
            disabled={currentTableNum >= 50}
            aria-label="Próxima mesa"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-40"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="select-mesa">
            Selecionar mesa
          </label>
          <select
            id="select-mesa"
            value={currentTableNum}
            onChange={(e) => handleSelectTable(Number(e.target.value))}
            className="min-w-0 flex-1 rounded-xl border border-zinc-300 bg-zinc-50 px-3 py-2 text-sm font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-orange-500 sm:flex-none"
          >
            {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => {
              const t = tables.find((item) => item.numero === n);
              const symbol = t?.status === 'ocupada' ? '🔴' : t?.status === 'conta_solicitada' ? '🟡' : '🟢';
              const valText = t && t.total > 0 ? ` · ${formatCurrency(t.total)}` : '';
              return (
                <option key={n} value={n}>
                  {symbol} Mesa {n < 10 ? `0${n}` : n}
                  {valText}
                </option>
              );
            })}
          </select>
          <button type="button" onClick={() => onNavigateTab(8)} className={buttonClass('ghost', 'sm')}>
            <LayoutGrid className="h-3.5 w-3.5" /> Salão
          </button>
          <button type="button" onClick={() => setIsPriceLookupOpen(true)} className={buttonClass('warning', 'sm')}>
            <HelpCircle className="h-3.5 w-3.5" /> Consultar preço
          </button>
        </div>
      </div>

      {kitchenAlert && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800">
          <div className="flex min-w-0 items-center gap-2">
            <ChefHat className="h-4 w-4 shrink-0 text-emerald-600" />
            <span className="truncate">{kitchenAlert}</span>
          </div>
          <button type="button" onClick={() => onNavigateTab(9)} className="shrink-0 text-emerald-700 hover:underline">
            Acompanhar →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Comanda */}
        <section className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white shadow-sm lg:col-span-7 lg:min-h-[420px]">
          <div className="space-y-3 border-b border-zinc-200 bg-zinc-50/70 p-3 sm:p-4">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && filteredProducts.length > 0) {
                      e.preventDefault();
                      handleAddItem(filteredProducts[0]);
                    }
                  }}
                  placeholder="Buscar produto ou bipar EAN (Enter adiciona)"
                  className="w-full rounded-xl border border-zinc-300 bg-white py-2.5 pl-9 pr-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-xl border border-zinc-300 bg-white">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    aria-label="Diminuir quantidade"
                    className="flex h-10 w-10 items-center justify-center text-zinc-600 hover:text-zinc-900"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-mono text-sm font-bold">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    aria-label="Aumentar quantidade"
                    className="flex h-10 w-10 items-center justify-center text-zinc-600 hover:text-zinc-900"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <input
                type="text"
                value={itemObservation}
                onChange={(e) => setItemObservation(e.target.value)}
                placeholder="Observação do item (ex.: sem cebola)"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <input
                type="text"
                value={mesaObservacaoInput}
                onChange={(e) => setMesaObservacaoInput(e.target.value)}
                onBlur={() => onSaveTableObservation?.(currentTableNum, mesaObservacaoInput)}
                placeholder="Observação da mesa (ex.: aniversário)"
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
            </div>
          </div>

          {/* Itens */}
          <div className="flex-1 lg:max-h-[calc(100vh-22rem)] lg:overflow-y-auto">
            {currentItems.length === 0 ? (
              <div className="flex h-full min-h-[240px] flex-col items-center justify-center gap-2 p-8 text-center">
                <Receipt className="h-10 w-10 text-zinc-300" />
                <p className="font-bold text-zinc-700">Comanda vazia</p>
                <p className="max-w-xs text-xs text-zinc-400">Toque em um produto do cardápio ou busque pelo nome/EAN para lançar.</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {currentItems.map((it, idx) => (
                  <li key={it.id || idx} className="flex items-center gap-3 px-3 py-3 sm:px-4">
                    <div className="flex shrink-0 items-center rounded-lg border border-zinc-200 bg-white">
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, -1)}
                        aria-label={`Diminuir ${it.descricao}`}
                        className="flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center font-mono text-sm font-extrabold">{it.quantidade}</span>
                      <button
                        type="button"
                        onClick={() => handleUpdateItemQuantity(idx, 1)}
                        aria-label={`Aumentar ${it.descricao}`}
                        className="flex h-8 w-8 items-center justify-center text-zinc-500 hover:text-zinc-900"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold leading-snug text-zinc-900">{it.descricao}</p>
                      <p className="text-[11px] text-zinc-500">
                        {formatCurrency(it.precoUnitario)} un. · {it.setor}
                      </p>
                      {it.observacao && (
                        <span className="mt-1 inline-block rounded-md border border-amber-100 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-800">
                          {it.observacao}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 font-mono text-sm font-extrabold text-zinc-900">{formatCurrency(it.valorTotal)}</span>
                    <button
                      type="button"
                      onClick={() => openCancel(it)}
                      aria-label={`Cancelar ${it.descricao}`}
                      title="Cancelar item"
                      className="shrink-0 rounded-lg p-2 text-zinc-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Total e ações (fixas no celular) */}
          <div className="sticky bottom-0 z-10 space-y-3 border-t border-zinc-200 bg-white p-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] sm:p-4 lg:static lg:shadow-none">
            <div className="flex items-end justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">Total da comanda</span>
              <span className="font-mono text-2xl font-black tracking-tight text-zinc-900">{formatCurrency(totalValue)}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <button type="button" onClick={handlePay} disabled={actionDisabled} className={buttonClass('success', 'md')}>
                <DollarSign className="h-4 w-4" /> Pagar
              </button>
              <button
                type="button"
                onClick={() => onPrintTableTicket(currentTableNum, currentItems)}
                disabled={actionDisabled}
                className={buttonClass('info', 'md')}
              >
                <Printer className="h-4 w-4" /> Pré-conta
              </button>
              <button type="button" onClick={handleSendToKitchenAction} disabled={actionDisabled} className={buttonClass('warning', 'md')}>
                <ChefHat className="h-4 w-4" /> Cozinha
              </button>
              <button type="button" onClick={handleClearTable} disabled={actionDisabled} className={buttonClass('danger', 'md')}>
                <Ban className="h-4 w-4" /> Limpar
              </button>
            </div>
          </div>
        </section>

        {/* Cardápio */}
        <section className="flex flex-col rounded-2xl border border-zinc-200/80 bg-white p-3 shadow-sm sm:p-4 lg:col-span-5">
          <div className="flex items-center justify-between pb-3">
            <h3 className="flex items-center gap-2 text-sm font-extrabold text-zinc-900">
              <Tag className="h-4 w-4 text-orange-600" /> Cardápio
            </h3>
            <span className="text-[11px] text-zinc-500">{filteredProducts.length} itens</span>
          </div>

          <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition',
                  activeCategory === cat ? 'bg-orange-600 text-white shadow-sm' : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid min-h-[200px] grid-cols-2 lg:max-h-[calc(100vh-18rem)] gap-2.5 overflow-y-auto pr-1 md:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
            {filteredProducts.length === 0 && (
              <p className="col-span-full py-8 text-center text-xs text-zinc-400">Nenhum produto encontrado.</p>
            )}
            {filteredProducts.map((prod) => (
              <button
                key={prod.id}
                type="button"
                onClick={() => handleAddItem(prod)}
                className="group flex min-h-[104px] flex-col justify-between rounded-xl border border-zinc-200 bg-zinc-50/60 p-3 text-left transition hover:border-orange-400 hover:bg-orange-50/40 hover:shadow-sm active:scale-[0.98]"
              >
                <div>
                  <div className="mb-1 flex items-center justify-between gap-1">
                    <span className="truncate text-[10px] font-bold uppercase tracking-wider text-orange-600">{prod.setor}</span>
                    <span className={cn('shrink-0 font-mono text-[10px]', prod.estoque <= 5 ? 'font-bold text-rose-600' : 'text-zinc-400')}>
                      {prod.estoque} un
                    </span>
                  </div>
                  <h4 className="line-clamp-2 text-xs font-bold leading-snug text-zinc-900">{prod.descricao}</h4>
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-zinc-200/80 pt-2">
                  <span className="font-mono text-sm font-extrabold text-emerald-700">{formatCurrency(prod.precoVenda)}</span>
                  <span className="flex h-6 w-6 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 transition group-hover:border-orange-600 group-hover:bg-orange-600 group-hover:text-white">
                    <Plus className="h-3.5 w-3.5" />
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* Modal: cancelamento de item */}
      <Modal
        open={cancelTarget !== null}
        onClose={() => setCancelTarget(null)}
        title="Cancelar item"
        icon={<Ban className="h-5 w-5 text-rose-600" />}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCancelTarget(null)} className={buttonClass('ghost', 'md')}>
              Voltar
            </button>
            <button type="button" onClick={confirmCancel} className={buttonClass('danger', 'md')}>
              <CheckCircle2 className="h-4 w-4" /> Confirmar cancelamento
            </button>
          </div>
        }
      >
        {cancelTarget && (
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-50 p-3">
              <p className="text-sm font-bold text-zinc-900">{cancelTarget.descricao}</p>
              <p className="text-xs text-zinc-500">
                Mesa {currentTableNum} · {formatCurrency(cancelTarget.precoUnitario)} un.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-600">Quantidade a cancelar</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setCancelQty((q) => Math.max(1, q - 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 hover:bg-zinc-50"
                  aria-label="Diminuir"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-mono text-lg font-extrabold">{cancelQty}</span>
                <button
                  type="button"
                  onClick={() => setCancelQty((q) => Math.min(cancelTarget.quantidade, q + 1))}
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-300 hover:bg-zinc-50"
                  aria-label="Aumentar"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <span className="text-xs text-zinc-500">de {cancelTarget.quantidade}</span>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-600">Motivo</label>
              <select
                value={cancelMotivo}
                onChange={(e) => setCancelMotivo(e.target.value as CancelamentoMotivo)}
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold"
              >
                {MOTIVOS_CANCELAMENTO.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-[11px] text-zinc-500">
              O cancelamento fica registrado no caixa com o nome do operador ({config.usuarioAtual}).
            </p>
          </div>
        )}
      </Modal>

      {/* Modal: consulta de preço */}
      <Modal
        open={isPriceLookupOpen}
        onClose={() => setIsPriceLookupOpen(false)}
        title="Consulta de preço"
        icon={<Tag className="h-5 w-5 text-amber-500" />}
        size="md"
        footer={
          <div className="flex justify-end">
            <button type="button" onClick={() => setIsPriceLookupOpen(false)} className={buttonClass('ghost', 'md')}>
              Fechar
            </button>
          </div>
        }
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            autoFocus
            placeholder="Nome do produto ou EAN"
            value={priceLookupSearch}
            onChange={(e) => setPriceLookupSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-300 bg-zinc-50 py-2.5 pl-9 pr-3 text-sm focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        </div>
        <div className="mt-3 divide-y divide-zinc-100">
          {lookupProducts.length === 0 ? (
            <p className="py-8 text-center text-xs text-zinc-400">Nenhum produto encontrado.</p>
          ) : (
            lookupProducts.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-zinc-900">{p.descricao}</p>
                  <p className="font-mono text-[11px] text-zinc-500">
                    EAN {p.ean} · {p.setor} · Estoque {p.estoque}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-mono text-sm font-extrabold text-emerald-700">{formatCurrency(p.precoVenda)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      handleAddItem(p, 1);
                      setIsPriceLookupOpen(false);
                    }}
                    className={buttonClass('success', 'sm')}
                  >
                    <Plus className="h-3.5 w-3.5" /> Lançar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

    </div>
  );
};
