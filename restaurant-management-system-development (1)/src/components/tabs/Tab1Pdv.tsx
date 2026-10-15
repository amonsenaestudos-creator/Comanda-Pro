import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Printer,
  ChefHat,
  HelpCircle,
  Utensils,
  LayoutGrid,
  X,
  Tag,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Keyboard,
} from 'lucide-react';
import { AppConfig, OrderItem, Product, Table, CaixaAppearance } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { AppearanceControls } from '../AppearanceControls';
import { cn } from '../../utils/cn';

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
  config: AppConfig;
  selectedTableNumber?: number;
  setSelectedTableNumber?: (tableNum: number) => void;
  /** Ajustes rápidos de tema/letra/densidade, feitos direto no caixa. */
  onUpdateAppearance?: (patch: Partial<CaixaAppearance>) => void;
}

const APARENCIA_PADRAO: CaixaAppearance = {
  tema: 'claro',
  escalaFonte: 'padrao',
  densidade: 'confortavel',
  tamanhoItemCardapio: 'medio',
  modoCaixa: false,
  abasOcultas: [],
  mostrarEstoque: true,
  mostrarEan: false,
  mostrarSetor: true,
  mostrarUnitarioNoItem: true,
  mostrarObsItem: true,
  mostrarObsMesa: true,
  mostrarBotaoCozinha: true,
  mostrarBotaoImprimir: true,
  mostrarConsultaPreco: false,
  quantidadesRapidas: [1, 2, 3, 5],
  focoBuscaAoAbrir: true,
  enterAdicionaPrimeiro: true,
  confirmarLimpar: true,
};

export const Tab1Pdv: React.FC<Tab1PdvProps> = ({
  products,
  tables,
  onSaveTableItems,
  onGoToPayment,
  onSendToKitchen,
  onPrintTableTicket,
  onNavigateTab,
  onSaveTableObservation,
  config,
  selectedTableNumber: propTableNum,
  setSelectedTableNumber: setPropTableNum,
  onUpdateAppearance,
}) => {
  const a = config.aparencia || APARENCIA_PADRAO;
  const compact = a.densidade === 'compacta';

  const [currentTableNum, setCurrentTableNum] = useState<number>(propTableNum || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemObservation, setItemObservation] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [isPriceLookupOpen, setIsPriceLookupOpen] = useState(false);
  const [priceLookupSearch, setPriceLookupSearch] = useState('');
  const [kitchenAlert, setKitchenAlert] = useState<string | null>(null);
  const [mesaObservacaoInput, setMesaObservacaoInput] = useState('');
  const [showAjustes, setShowAjustes] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propTableNum) {
      setCurrentTableNum(propTableNum);
    }
  }, [propTableNum]);

  const currentTable = tables.find((t) => t.numero === currentTableNum);
  const currentItems = currentTable ? currentTable.itens : [];

  const totalItemsCount = currentItems.reduce((acc, it) => acc + it.quantidade, 0);
  const totalValue = currentItems.reduce((acc, it) => acc + it.valorTotal, 0);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        term === '' || p.descricao.toLowerCase().includes(term) || p.ean.includes(term);
      const matchesCat = activeCategory === 'TODOS' || p.setor === activeCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, activeCategory]);

  const categories = useMemo(
    () => ['TODOS', ...Array.from(new Set(products.map((p) => p.setor)))],
    [products]
  );

  const lookupProducts = useMemo(() => {
    const term = priceLookupSearch.trim().toLowerCase();
    return products.filter(
      (p) => p.descricao.toLowerCase().includes(term) || p.ean.includes(term)
    );
  }, [products, priceLookupSearch]);

  // Cursor já no campo de busca: dá para bipar o código sem clicar em nada.
  useEffect(() => {
    if (a.focoBuscaAoAbrir) {
      searchInputRef.current?.focus();
    }
  }, [currentTableNum, a.focoBuscaAoAbrir]);

  // Mantém a mesa ativa dentro da régua de mesas.
  useEffect(() => {
    const activeChip = stripRef.current?.querySelector<HTMLElement>(
      `[data-mesa="${currentTableNum}"]`
    );
    activeChip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [currentTableNum]);

  useEffect(() => {
    const tableObj = tables.find((t) => t.numero === currentTableNum);
    setMesaObservacaoInput(tableObj?.observacaoMesa || '');
  }, [currentTableNum, tables]);

  const handleSelectTable = (num: number) => {
    setCurrentTableNum(num);
    if (setPropTableNum) {
      setPropTableNum(num);
    }
  };

  const handleStepTable = (delta: number) => {
    const next = Math.min(50, Math.max(1, currentTableNum + delta));
    if (next !== currentTableNum) handleSelectTable(next);
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

  const handleRemoveItem = (index: number) => {
    const updated = currentItems.filter((_, i) => i !== index);
    onSaveTableItems(currentTableNum, updated);
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    const updated = [...currentItems];
    const item = updated[index];
    const newQty = item.quantidade + delta;

    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    updated[index] = {
      ...item,
      quantidade: newQty,
      valorTotal: Number((newQty * item.precoUnitario).toFixed(2)),
    };
    onSaveTableItems(currentTableNum, updated);
  };

  const handleClearTable = () => {
    if (currentItems.length === 0) return;
    if (
      !a.confirmarLimpar ||
      window.confirm(`Deseja realmente LIMPAR todos os itens da Mesa #${currentTableNum}?`)
    ) {
      onSaveTableItems(currentTableNum, []);
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
    onGoToPayment({
      mesa: currentTableNum,
      itens: currentItems,
      subtotal: totalValue,
      atendente: currentTable?.garcom || config.usuarioAtual,
    });
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setSearchTerm('');
      return;
    }
    if (e.key === 'Enter' && a.enterAdicionaPrimeiro && filteredProducts.length > 0) {
      e.preventDefault();
      handleAddItem(filteredProducts[0]);
    }
  };

  // Alt + setas troca de mesa sem tirar a mão do teclado.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        e.preventDefault();
        handleStepTable(e.key === 'ArrowRight' ? 1 : -1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTableNum]);

  useEffect(() => {
    if (!showAjustes) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowAjustes(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showAjustes]);

  const tileCols =
    a.tamanhoItemCardapio === 'grande'
      ? 'grid-cols-1'
      : a.tamanhoItemCardapio === 'pequeno'
      ? 'grid-cols-3'
      : 'grid-cols-2';

  const quickQty = a.quantidadesRapidas.length ? a.quantidadesRapidas : [1];
  const panelPad = compact ? 'p-2.5' : 'p-4';

  const statusInfo =
    currentTable?.status === 'ocupada'
      ? { label: 'Ocupada', cls: 'bg-rose-100 text-rose-700 border-rose-300' }
      : currentTable?.status === 'conta_solicitada'
      ? { label: 'Conta pedida', cls: 'bg-amber-100 text-amber-700 border-amber-300' }
      : { label: 'Livre', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' };

  return (
    <div className="space-y-3">
      {/* ================================ BARRA DO CAIXA ================================ */}
      <div className={cn('cp-card sticky top-0 z-20', panelPad)}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* Seletor de mesa */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStepTable(-1)}
              className="cp-chip p-1.5 rounded-lg"
              title="Mesa anterior (Alt + ←)"
              aria-label="Mesa anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center px-1 min-w-[6.5rem]">
              <div className="cp-label cp-faint font-bold">Mesa / Comanda</div>
              <div className="cp-text font-black leading-none text-2xl">
                {String(currentTableNum).padStart(2, '0')}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleStepTable(1)}
              className="cp-chip p-1.5 rounded-lg"
              title="Próxima mesa (Alt + →)"
              aria-label="Próxima mesa"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                statusInfo.cls
              )}
            >
              {statusInfo.label}
            </span>
            {currentTable?.garcom && (
              <span className="text-[11px] cp-faint hidden xl:inline">
                Atendente: <strong className="cp-muted">{currentTable.garcom}</strong>
              </span>
            )}
            <button
              type="button"
              onClick={() => onNavigateTab(8)}
              className="cp-chip px-2.5 py-1 cp-small flex items-center gap-1.5"
              title="Abrir mapa do salão"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mapa do salão</span>
            </button>
          </div>

          {/* Total + ação principal */}
          <div className="ml-auto flex items-end gap-3 sm:gap-5">
            <div className="text-right">
              <div className="cp-label cp-faint font-bold">Total da comanda</div>
              <div className="cp-total font-black font-mono cp-accent">{formatCurrency(totalValue)}</div>
              <div className="cp-small cp-faint mt-0.5">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'} &bull; taxa de serviço
                entra no pagamento
              </div>
            </div>
            <button
              onClick={handlePay}
              disabled={currentItems.length === 0}
              className="cp-btn bg-emerald-600 text-white shadow-lg shadow-emerald-900/20 min-w-[9.5rem]"
            >
              <DollarSign className="w-5 h-5" />
              <span>Pagar</span>
              <kbd className="text-[10px] bg-black/25 rounded px-1 py-0.5 font-mono">F2</kbd>
            </button>
          </div>
        </div>

        {/* Régua de mesas (no lugar do dropdown com 50 linhas) */}
        <div
          ref={stripRef}
          className="mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5"
          aria-label="Escolher mesa"
        >
          {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => {
            const t = tables.find((item) => item.numero === n);
            const isActive = n === currentTableNum;
            const status =
              t?.status === 'ocupada'
                ? 'ocupada'
                : t?.status === 'conta_solicitada'
                ? 'conta'
                : 'livre';
            return (
              <button
                key={n}
                type="button"
                data-mesa={n}
                aria-current={isActive}
                onClick={() => handleSelectTable(n)}
                title={`Mesa ${n} — ${t && t.total > 0 ? formatCurrency(t.total) : 'sem itens'}`}
                className={cn(
                  'shrink-0 w-9 rounded-lg border font-extrabold text-xs transition-all relative',
                  compact ? 'py-1' : 'py-1.5',
                  isActive
                    ? 'bg-orange-600 border-orange-600 text-white shadow-md'
                    : status === 'ocupada'
                    ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                    : status === 'conta'
                    ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                    : 'cp-chip'
                )}
              >
                {n < 10 ? `0${n}` : n}
                {status !== 'livre' && (
                  <span
                    className={cn(
                      'absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full',
                      status === 'ocupada' ? 'bg-rose-500' : 'bg-amber-500'
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Ações secundárias + ajustes rápidos */}
        <div className="mt-3 pt-3 border-t cp-line flex flex-wrap items-center gap-2">
          {a.mostrarBotaoCozinha && (
            <button
              onClick={handleSendToKitchenAction}
              disabled={currentItems.length === 0}
              className="cp-btn bg-amber-400 text-zinc-950"
            >
              <ChefHat className="w-4 h-4" />
              <span>Para a cozinha</span>
            </button>
          )}
          {a.mostrarBotaoImprimir && (
            <button
              onClick={() => onPrintTableTicket(currentTableNum, currentItems)}
              disabled={currentItems.length === 0}
              className="cp-btn bg-sky-600 text-white"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir comanda</span>
            </button>
          )}
          <button
            onClick={handleClearTable}
            disabled={currentItems.length === 0}
            className="cp-btn cp-soft cp-muted border cp-line"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar mesa</span>
          </button>

          {a.mostrarConsultaPreco && (
            <button
              onClick={() => setIsPriceLookupOpen(true)}
              className="cp-btn cp-soft cp-muted border cp-line"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Consultar preço</span>
            </button>
          )}

          {onUpdateAppearance && (
            <div className="relative ml-auto">
              <button
                onClick={() => setShowAjustes((v) => !v)}
                className={cn(
                  'cp-btn border cp-line',
                  showAjustes
                    ? 'bg-orange-600 border-orange-600 text-white'
                    : 'cp-soft cp-muted'
                )}
                title="Ajustes rápidos da tela do caixa"
              >
                <Settings2 className="w-4 h-4" />
                <span>Ajustes rápidos</span>
              </button>

              {showAjustes && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowAjustes(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 z-40 w-[22rem] max-h-[70vh] overflow-y-auto cp-card p-4 shadow-2xl">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-extrabold cp-text">Ajustes do caixa</h4>
                      <button
                        onClick={() => setShowAjustes(false)}
                        className="p-1 rounded cp-faint"
                        aria-label="Fechar ajustes"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <AppearanceControls
                      aparencia={a}
                      onChange={(patch) => onUpdateAppearance(patch)}
                    />
                    <button
                      onClick={() => {
                        setShowAjustes(false);
                        onNavigateTab(4);
                      }}
                      className="mt-4 w-full cp-btn cp-soft cp-muted border cp-line"
                    >
                      <Settings2 className="w-4 h-4" />
                      <span>Mais configurações (taxas, cupom, estoque)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {kitchenAlert && (
        <div className="cp-card px-4 py-2.5 flex items-center justify-between cp-small font-semibold text-emerald-700">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-emerald-600" />
            <span>{kitchenAlert}</span>
          </div>
          <button onClick={() => onNavigateTab(9)} className="text-emerald-600 hover:underline">
            Acompanhar na cozinha &rarr;
          </button>
        </div>
      )}

      {/* =========================== COMANDA + CARDÁPIO =========================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* ---------------- Comanda da mesa ---------------- */}
        <div
          className={cn(
            'lg:col-span-7 cp-card flex flex-col',
            compact ? 'min-h-[420px]' : 'min-h-[500px]'
          )}
        >
          <div className={cn('flex items-center justify-between gap-3 border-b cp-line', panelPad)}>
            <h3 className="font-bold cp-text flex items-center gap-2 text-sm">
              <Utensils className="w-4 h-4 cp-accent" />
              <span>Comanda da mesa {String(currentTableNum).padStart(2, '0')}</span>
              <span className="cp-soft cp-faint cp-small font-bold px-2 py-0.5 rounded-full border cp-line">
                {currentItems.length} {currentItems.length === 1 ? 'produto' : 'produtos'}
              </span>
            </h3>

            {a.mostrarObsMesa && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <input
                  type="text"
                  value={mesaObservacaoInput}
                  onChange={(e) => setMesaObservacaoInput(e.target.value)}
                  onBlur={() => onSaveTableObservation?.(currentTableNum, mesaObservacaoInput)}
                  placeholder="Obs. da mesa (aniversário, alergia...)"
                  aria-label="Observação da mesa"
                  className="cp-input w-40 sm:w-64 px-2.5 py-1 cp-small"
                />
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[440px]">
            {currentItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 cp-faint text-center px-6">
                <Utensils className="w-12 h-12 mb-3 opacity-40" />
                <p className="cp-muted font-bold cp-item">Comanda vazia</p>
                <p className="cp-small mt-1 max-w-sm">
                  Toque num produto ao lado, bipe o código de barras ou digite e aperte{' '}
                  <kbd className="cp-soft border cp-line rounded px-1 font-mono">Enter</kbd> para
                  lançar o primeiro resultado.
                </p>
              </div>
            ) : (
              currentItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className={cn(
                    'cp-row flex items-center gap-3 px-3 sm:px-4 hover:bg-orange-50/40 transition-colors',
                    compact ? 'py-1' : 'py-1.5'
                  )}
                >
                  <div className="flex items-center gap-0.5 cp-soft rounded-lg border cp-line shrink-0">
                    <button
                      onClick={() => handleUpdateItemQuantity(idx, -1)}
                      className="p-1 hover:opacity-70 rounded-l-lg cp-muted"
                      title="Diminuir"
                      aria-label={`Diminuir quantidade de ${item.descricao}`}
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="cp-num w-7 text-center font-black cp-text">{item.quantidade}</span>
                    <button
                      onClick={() => handleUpdateItemQuantity(idx, 1)}
                      className="p-1 hover:opacity-70 rounded-r-lg cp-muted"
                      title="Aumentar"
                      aria-label={`Aumentar quantidade de ${item.descricao}`}
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="cp-item cp-text font-semibold leading-tight truncate">
                      {item.descricao}
                    </div>
                    <div className="cp-small cp-faint flex items-center gap-1.5 flex-wrap">
                      {a.mostrarSetor && <span>{item.setor}</span>}
                      {a.mostrarEan && (
                        <>
                          <span>&bull;</span>
                          <span className="font-mono">{item.ean}</span>
                        </>
                      )}
                      {item.observacao && (
                        <>
                          <span>&bull;</span>
                          <span className="text-amber-600 font-bold">Obs: {item.observacao}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {a.mostrarUnitarioNoItem && (
                    <div className="hidden sm:block text-right shrink-0">
                      <div className="text-[9px] cp-faint uppercase font-bold">unit.</div>
                      <div className="cp-small cp-muted font-mono">
                        {formatCurrency(item.precoUnitario)}
                      </div>
                    </div>
                  )}

                  <div className="cp-num font-black font-mono cp-text text-right w-24 shrink-0">
                    {formatCurrency(item.valorTotal)}
                  </div>

                  <button
                    onClick={() => handleRemoveItem(idx)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-100 transition shrink-0"
                    title="Excluir item"
                    aria-label={`Excluir ${item.descricao}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Rodapé: quantidade rápida, observação do item e total */}
          <div className={cn('mt-auto border-t cp-line cp-inset', panelPad)}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] cp-faint font-bold uppercase mr-0.5">Qtd</span>
                {quickQty.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    aria-pressed={quantity === q}
                    className={cn(
                      'w-9 py-1 rounded-lg text-sm font-black border transition',
                      quantity === q
                        ? 'bg-orange-600 border-orange-600 text-white'
                        : 'cp-chip'
                    )}
                  >
                    {q}
                  </button>
                ))}
                <div className="flex items-center gap-0.5 cp-soft rounded-lg border cp-line ml-1">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-1.5 hover:opacity-70 rounded-l-lg cp-muted"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    min={1}
                    aria-label="Quantidade do item"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-11 text-center cp-num font-black cp-text bg-transparent focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-1.5 hover:opacity-70 rounded-r-lg cp-muted"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {a.mostrarObsItem && (
                <input
                  type="text"
                  value={itemObservation}
                  onChange={(e) => setItemObservation(e.target.value)}
                  placeholder="Obs. do próximo item (sem cebola, sem gelo...)"
                  aria-label="Observação do item"
                  className="cp-input px-2.5 py-1.5 cp-small flex-1 min-w-[12rem]"
                />
              )}

              <div className="text-right">
                <div className="cp-label cp-faint font-bold">
                  {currentItems.length} {currentItems.length === 1 ? 'linha' : 'linhas'} &bull;{' '}
                  {totalItemsCount} un
                </div>
                <div className="cp-total cp-text font-black font-mono">{formatCurrency(totalValue)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Cardápio rápido ---------------- */}
        <div className="lg:col-span-5 cp-card flex flex-col overflow-hidden">
          <div className={cn('border-b cp-line space-y-2.5', panelPad)}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold cp-text text-sm">Cardápio</h3>
              <span className="cp-small cp-faint font-semibold">
                {filteredProducts.length} {filteredProducts.length === 1 ? 'produto' : 'produtos'}
              </span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 cp-faint absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Buscar ou bipar o código de barras..."
                aria-label="Buscar produto"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={cn('cp-input w-full pl-9 pr-9 font-semibold cp-num', compact ? 'py-1.5' : 'py-2.5')}
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    searchInputRef.current?.focus();
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded cp-faint"
                  aria-label="Limpar busca"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 px-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    'px-2.5 py-1 cp-small whitespace-nowrap shrink-0',
                    activeCategory === cat ? 'cp-chip cp-chip-on' : 'cp-chip'
                  )}
                >
                  {cat === 'TODOS' ? 'Tudo' : cat}
                </button>
              ))}
            </div>
          </div>

          <div className={cn('flex-1 overflow-y-auto grid gap-2 content-start p-3', tileCols)}>
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center cp-faint cp-small font-semibold">
                Nenhum produto encontrado para &ldquo;{searchTerm}&rdquo;.
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const estoqueBaixo = a.mostrarEstoque && prod.estoque <= 5;
                return (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleAddItem(prod)}
                    className="cp-tile text-left flex flex-col justify-between gap-1"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="cp-item cp-text font-bold leading-tight line-clamp-2 text-left">
                        {prod.descricao}
                      </span>
                      {a.mostrarEstoque && (
                        <span
                          className={cn(
                            'shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded border',
                            estoqueBaixo
                              ? 'bg-rose-100 text-rose-600 border-rose-200'
                              : 'cp-soft cp-faint border-transparent'
                          )}
                          title="Estoque atual"
                        >
                          {prod.estoque}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 mt-1 border-t cp-line w-full">
                      {a.mostrarSetor ? (
                        <span className="text-[9px] cp-faint font-bold uppercase tracking-wider truncate">
                          {prod.setor}
                        </span>
                      ) : (
                        <span />
                      )}
                      {quantity > 1 && (
                        <span className="text-[9px] font-black text-orange-600 bg-orange-100 rounded px-1 py-0.5">
                          x{quantity}
                        </span>
                      )}
                      <span className="cp-price cp-text font-black font-mono ml-auto">
                        {formatCurrency(prod.precoVenda)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="px-3 py-2 border-t cp-line flex items-center gap-1.5 cp-small cp-faint font-semibold">
            <Keyboard className="w-3.5 h-3.5 shrink-0" />
            <span>
              {a.enterAdicionaPrimeiro && (
                <>
                  <kbd className="cp-soft border cp-line rounded px-1 font-mono">Enter</kbd> lança
                  &nbsp;&bull;&nbsp;
                </>
              )}
              <kbd className="cp-soft border cp-line rounded px-1 font-mono">F2</kbd> paga
              &nbsp;&bull;&nbsp;
              <kbd className="cp-soft border cp-line rounded px-1 font-mono">Alt</kbd>+
              <kbd className="cp-soft border cp-line rounded px-1 font-mono">←/→</kbd> troca de mesa
            </span>
          </div>
        </div>
      </div>

      {/* ================= MODAL DE CONSULTA DE PREÇO (opcional) ================= */}
      {isPriceLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="cp-card max-w-xl w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b cp-line">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base cp-text">Consulta rápida de mercadoria / preço</h3>
              </div>
              <button
                onClick={() => setIsPriceLookupOpen(false)}
                className="p-1 rounded cp-faint"
                aria-label="Fechar consulta"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 relative">
              <Search className="w-4 h-4 cp-faint absolute left-3 top-3" />
              <input
                type="text"
                autoFocus
                placeholder="Digite o nome do produto ou bipe o código EAN..."
                value={priceLookupSearch}
                onChange={(e) => setPriceLookupSearch(e.target.value)}
                className="cp-input w-full pl-9 pr-3 py-2 text-sm font-medium"
              />
            </div>

            <div className="mt-4 max-h-[340px] overflow-y-auto divide-y divide-zinc-100">
              {lookupProducts.length === 0 ? (
                <div className="text-center py-8 cp-faint text-xs">
                  Nenhum produto encontrado com o termo pesquisado.
                </div>
              ) : (
                lookupProducts.map((p) => (
                  <div
                    key={p.id}
                    className="py-2.5 flex items-center justify-between hover:bg-orange-50/40 px-2 rounded"
                  >
                    <div className="min-w-0">
                      <div className="font-bold cp-item cp-text truncate">{p.descricao}</div>
                      <div className="cp-small cp-faint font-mono">
                        {a.mostrarEan && <>EAN {p.ean} &bull; </>}
                        {p.setor} &bull; Estoque {p.estoque} UN
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3 shrink-0">
                      <span className="cp-price cp-text font-black font-mono">
                        {formatCurrency(p.precoVenda)}
                      </span>
                      <button
                        onClick={() => {
                          handleAddItem(p, 1);
                          setIsPriceLookupOpen(false);
                        }}
                        className="px-2.5 py-1 cp-small font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        + Lançar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t cp-line flex justify-end">
              <button
                onClick={() => setIsPriceLookupOpen(false)}
                className="px-4 py-2 cp-small font-bold rounded-lg cp-soft cp-muted"
              >
                Fechar consulta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
