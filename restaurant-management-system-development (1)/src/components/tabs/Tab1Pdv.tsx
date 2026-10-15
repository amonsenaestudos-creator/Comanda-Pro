import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  DollarSign,
  Printer,
  HelpCircle,
  LogOut,
  Utensils,
  ChefHat,
  Tag,
  X,
  Hash,
  ShoppingBag,
} from 'lucide-react';
import { AppConfig, OrderItem, Product, Table } from '../../types';
import { formatCurrency } from '../../utils/formatters';

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
  config,
  selectedTableNumber: propTableNum,
  setSelectedTableNumber: setPropTableNum,
}) => {
  // Table selection: 1 to 50 or 0 for 'Balcão / Avulso'
  const [currentTableNum, setCurrentTableNum] = useState<number>(propTableNum || 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemObservation, setItemObservation] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [isPriceLookupOpen, setIsPriceLookupOpen] = useState(false);
  const [priceLookupSearch, setPriceLookupSearch] = useState('');
  const [kitchenAlert, setKitchenAlert] = useState<string | null>(null);
  const [mesaObservacaoInput, setMesaObservacaoInput] = useState('');

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync prop changes if selected from Mesa tab
  useEffect(() => {
    if (propTableNum) {
      setCurrentTableNum(propTableNum);
    }
  }, [propTableNum]);

  // Find active table data
  const currentTable = tables.find((t) => t.numero === currentTableNum);
  const currentItems = currentTable ? currentTable.itens : [];

  // Calculate totals
  const totalItemsCount = currentItems.reduce((acc, it) => acc + it.quantidade, 0);
  const totalValue = currentItems.reduce((acc, it) => acc + it.valorTotal, 0);

  // Filter products for search
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ean.includes(searchTerm);
    const matchesCat = activeCategory === 'TODOS' || p.setor === activeCategory;
    return matchesSearch && matchesCat;
  });

  // Unique categories
  const categories = ['TODOS', ...Array.from(new Set(products.map((p) => p.setor)))];

  // Price lookup modal items
  const lookupProducts = products.filter(
    (p) =>
      p.descricao.toLowerCase().includes(priceLookupSearch.toLowerCase()) ||
      p.ean.includes(priceLookupSearch)
  );

  // Sync mesa observation when table changes
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

    // Reset input fields
    setQuantity(1);
    setItemObservation('');
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
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

  const handleRemoveItem = (index: number) => {
    const updated = currentItems.filter((_, i) => i !== index);
    onSaveTableItems(currentTableNum, updated);
  };

  const handleClearTable = () => {
    if (currentItems.length === 0) return;
    if (window.confirm(`Deseja realmente LIMPAR todos os itens da Mesa #${currentTableNum}?`)) {
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

  return (
    <div className="space-y-4">
      {/* Top Section: Table Selector 1 - 50 + Status info */}
      <div className="bg-white rounded-xl shadow-xs border border-zinc-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-zinc-500 font-semibold uppercase tracking-wider">
                Mesa / Comanda Ativa
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-zinc-900">
                  Mesa {currentTableNum}
                </span>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    currentTable?.status === 'ocupada'
                      ? 'bg-rose-100 text-rose-800 border border-rose-300'
                      : currentTable?.status === 'conta_solicitada'
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  }`}
                >
                  {currentTable?.status === 'ocupada'
                    ? '● Ocupada'
                    : currentTable?.status === 'conta_solicitada'
                    ? '▲ Conta Solicitada'
                    : '○ Disponível'}
                </span>
                {currentTable?.garcom && (
                  <span className="text-xs text-zinc-500 hidden sm:inline">
                    &bull; Atendente: <strong>{currentTable.garcom}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Dropdown/Menu for Table 1 to 50 */}
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-zinc-600">
              Mudar Mesa (1 - 50):
            </label>
            <select
              value={currentTableNum}
              onChange={(e) => handleSelectTable(Number(e.target.value))}
              aria-label="Selecionar número da mesa de 1 a 50"
              className="px-3 py-1.5 text-sm font-bold bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-zinc-800"
            >
              {Array.from({ length: 50 }, (_, i) => i + 1).map((n) => {
                const t = tables.find((item) => item.numero === n);
                const isOccupied = t?.status === 'ocupada';
                const isRequested = t?.status === 'conta_solicitada';
                const statusSymbol = isOccupied ? '🔴' : isRequested ? '🟡' : '🟢';
                const valText = t && t.total > 0 ? ` (${formatCurrency(t.total)})` : '';
                return (
                  <option key={n} value={n}>
                    {statusSymbol} Mesa {n < 10 ? `0${n}` : n} {valText}
                  </option>
                );
              })}
            </select>

            {/* Quick Mesa 8 navigation */}
            <button
              onClick={() => onNavigateTab(8)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition flex items-center gap-1.5"
            >
              <span>Mapa do Salão</span>
            </button>

            {/* Price query modal button - Amarelo */}
            <button
              onClick={() => setIsPriceLookupOpen(true)}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-amber-400 hover:bg-amber-500 text-zinc-950 flex items-center gap-1.5 shadow-xs transition"
            >
              <HelpCircle className="w-3.5 h-3.5 text-zinc-900" />
              <span>Consultar Preço</span>
            </button>
          </div>
        </div>
      </div>

      {kitchenAlert && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-semibold animate-in fade-in">
          <div className="flex items-center gap-2">
            <ChefHat className="w-4 h-4 text-emerald-600" />
            <span>{kitchenAlert}</span>
          </div>
          <button
            onClick={() => onNavigateTab(9)}
            className="text-emerald-700 hover:underline"
          >
            Acompanhar na Cozinha &rarr;
          </button>
        </div>
      )}

      {/* Main 2-Column Layout: Left PDV Items Table, Right Fast Product Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Active Order Items (Col 7) */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-xs border border-zinc-200 flex flex-col min-h-[580px]">
          {/* Barcode & Search input bar */}
          <div className="p-3 bg-zinc-50 border-b border-zinc-200">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escanear código EAN ou digitar nome..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium text-zinc-800"
                />
              </div>

              {/* Quantity Selector: default 1 */}
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-zinc-500 font-semibold">Qtd:</span>
                <div className="flex items-center border border-zinc-300 rounded-lg bg-white overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1.5 hover:bg-zinc-200 text-zinc-700 font-extrabold text-base rounded-lg transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    aria-label="Quantidade do item"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-12 text-center text-sm font-bold text-zinc-900 border-x border-zinc-200 py-1 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-2.5 py-1.5 hover:bg-zinc-200 text-zinc-700 font-extrabold text-base rounded-lg transition"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Optional observation input */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                placeholder="Observação do item (Ex: Sem cebola, gelo e limão, bem passado...)"
                value={itemObservation}
                onChange={(e) => setItemObservation(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-orange-500 text-zinc-700"
              />
            </div>
          </div>

          {/* Quick Mesa Observation */}
          <div className="px-4 py-2.5 bg-amber-50/60 border-b border-amber-100 flex items-center gap-2">
            <label htmlFor="mesa-obs" className="text-xs font-extrabold text-amber-800 uppercase tracking-wide whitespace-nowrap">Obs. Mesa:</label>
            <input
              id="mesa-obs"
              type="text"
              value={mesaObservacaoInput}
              onChange={(e) => setMesaObservacaoInput(e.target.value)}
              onBlur={() => { if (onSaveTableObservation) onSaveTableObservation(currentTableNum, mesaObservacaoInput); }}
              placeholder="Ex: Cliente alérgico, aniversário, sem gelo..."
              className="flex-1 bg-white border border-amber-200 rounded-lg px-2.5 py-1 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-300 transition"
            />
            {currentTable?.observacaoMesa && (
              <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-medium truncate max-w-[160px]">{currentTable.observacaoMesa}</span>
            )}
          </div>

          {/* Table Header */}
          <div className="grid grid-cols-12 bg-zinc-100 px-4 py-2 text-[11px] font-bold text-zinc-600 uppercase tracking-wider border-b border-zinc-200">
            <span className="col-span-1 text-center">Qtd</span>
            <span className="col-span-6">Descrição Mercadoria</span>
            <span className="col-span-2 text-right">Unitário</span>
            <span className="col-span-2 text-right">Total</span>
            <span className="col-span-1 text-center">Ações</span>
          </div>

          {/* Items List */}
          <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 min-h-[280px] max-h-[360px]">
            {currentItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <Utensils className="w-12 h-12 text-zinc-300 mb-2 stroke-[1.5]" />
                <p className="font-semibold text-sm text-zinc-500">
                  Comanda da Mesa #{currentTableNum} vazia
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Selecione os produtos ao lado ou busque por código/nome.
                </p>
              </div>
            ) : (
              currentItems.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="grid grid-cols-12 items-center px-4 py-2.5 text-xs hover:bg-orange-50/40 transition-colors"
                >
                  <div className="col-span-1 flex items-center justify-center">
                    <span className="font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded text-xs border border-zinc-200">
                      {item.quantidade}
                    </span>
                  </div>
                  <div className="col-span-6 pr-2">
                    <div className="font-semibold text-zinc-900 leading-tight">
                      {item.descricao}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">
                      EAN: {item.ean} {item.setor ? `&bull; ${item.setor}` : ''}
                    </div>
                    {item.observacao && (
                      <div className="text-[10px] text-amber-700 font-medium">
                        Obs: {item.observacao}
                      </div>
                    )}
                  </div>
                  <div className="col-span-2 text-right font-medium text-zinc-600">
                    {formatCurrency(item.precoUnitario)}
                  </div>
                  <div className="col-span-2 text-right font-bold text-zinc-900">
                    {formatCurrency(item.valorTotal)}
                  </div>
                  <div className="col-span-1 flex items-center justify-center space-x-1">
                    <button
                      onClick={() => handleUpdateItemQuantity(idx, -1)}
                      title="Diminuir"
                      className="p-1 hover:bg-zinc-200 rounded text-zinc-600"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleRemoveItem(idx)}
                      title="Excluir item"
                      className="p-1 hover:bg-rose-100 rounded text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Totals and Summary Block */}
          <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 text-white p-5 border-t border-zinc-700/60 shadow-[inset_0_2px_12px_rgba(0,0,0,0.15)]">
            <div className="flex justify-between items-center mb-3 text-xs text-zinc-400 font-medium">
              <div className="flex items-center gap-3">
                <span>Mesa <strong className="text-white">#{currentTableNum}</strong></span>
                <span className="w-1 h-1 rounded-full bg-zinc-600"></span>
                <span>Total de Itens: <strong className="text-white">{totalItemsCount} un</strong></span>
              </div>
              <span>Comanda Pro v2.0</span>
            </div>

            <div className="flex justify-between items-baseline mb-5">
              <div>
                <span className="text-xs font-semibold tracking-widest text-zinc-400 uppercase block mb-0.5">Total a Pagar</span>
                <span className="text-sm font-medium text-zinc-300">Subtotal + taxa de serviço</span>
              </div>
              <span className="text-4xl font-extrabold text-orange-300 tracking-tighter font-mono drop-shadow-md leading-none">
                {formatCurrency(totalValue)}
              </span>
            </div>

            {/* Action Buttons: clean, large, clear */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Verde: Pagar */}
              <button
                onClick={handlePay}
                disabled={currentItems.length === 0}
                className="py-3 px-3 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all"
              >
                <DollarSign className="w-4 h-4" />
                <span>Pagar (F2)</span>
              </button>

              {/* Azul: Impressão isolada de cada mesa */}
              <button
                onClick={() => onPrintTableTicket(currentTableNum, currentItems)}
                disabled={currentItems.length === 0}
                className="py-3 px-3 rounded-xl font-extrabold text-sm bg-sky-600 hover:bg-sky-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 shadow-lg shadow-sky-900/20 transition-all"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Mesa</span>
              </button>

              {/* Amarelo/Orange: Enviar Cozinha */}
              <button
                onClick={handleSendToKitchenAction}
                disabled={currentItems.length === 0}
                className="py-3 px-3 rounded-xl font-extrabold text-sm bg-amber-400 hover:bg-amber-300 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-zinc-950 flex items-center justify-center gap-2 shadow-lg shadow-amber-900/10 transition-all"
              >
                <ChefHat className="w-4 h-4 text-zinc-950" />
                <span>P/ Cozinha</span>
              </button>

              {/* Vermelho: Limpar */}
              <button
                onClick={handleClearTable}
                disabled={currentItems.length === 0}
                className="py-3 px-3 rounded-xl font-extrabold text-sm bg-rose-600 hover:bg-rose-500 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center gap-2 shadow-lg shadow-rose-900/20 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Fast Product Catalog & Quick Add (Col 5) */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-xs border border-zinc-200 p-4 flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-orange-600" />
              <h3 className="font-bold text-sm text-zinc-900">
                Cardápio Rápido / Toque
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500">
              {filteredProducts.length} itens disponíveis
            </span>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto py-2.5 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Products Grid */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-2.5 pr-1 max-h-[500px]">
            {filteredProducts.map((prod) => (
              <div
                key={prod.id}
                onClick={() => handleAddItem(prod)}
                className="p-3 rounded-lg border border-zinc-200 hover:border-orange-500 bg-zinc-50/70 hover:bg-orange-50/30 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs hover:shadow-xs"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">
                      {prod.setor}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      Estq: {prod.estoque}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs text-zinc-900 group-hover:text-orange-900 line-clamp-2">
                    {prod.descricao}
                  </h4>
                </div>

                <div className="mt-3 flex items-center justify-between pt-2 border-t border-zinc-200/80">
                  <span className="font-extrabold text-sm text-emerald-700">
                    {formatCurrency(prod.precoVenda)}
                  </span>
                  <div className="w-6 h-6 rounded-md bg-white border border-zinc-200 group-hover:bg-orange-600 group-hover:text-white flex items-center justify-center text-zinc-700 transition">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Bar: Sair button & Quick Switch */}
          <div className="pt-3 mt-3 border-t border-zinc-200 flex items-center justify-between text-xs text-zinc-500">
            <span>Comanda Pro &bull; Atendimento Ágil</span>
            <button
              onClick={() => onNavigateTab(8)}
              className="text-zinc-600 hover:text-rose-600 font-semibold flex items-center gap-1 transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sair p/ Mesas</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Consulta de Mercadoria / Preço (Amarelo) */}
      {isPriceLookupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full p-5 border border-zinc-200">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-base text-zinc-900">
                  Consulta Rápida de Mercadoria / Preço
                </h3>
              </div>
              <button
                onClick={() => setIsPriceLookupOpen(false)}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-3" />
              <input
                type="text"
                autoFocus
                placeholder="Digite nome do produto ou bipe o código EAN..."
                value={priceLookupSearch}
                onChange={(e) => setPriceLookupSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-zinc-50 border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div className="mt-4 max-h-[340px] overflow-y-auto divide-y divide-zinc-100">
              {lookupProducts.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  Nenhum produto encontrado com o termo pesquisado.
                </div>
              ) : (
                lookupProducts.map((p) => (
                  <div
                    key={p.id}
                    className="py-2.5 flex items-center justify-between hover:bg-zinc-50 px-2 rounded"
                  >
                    <div>
                      <div className="font-bold text-xs text-zinc-900">{p.descricao}</div>
                      <div className="text-[11px] text-zinc-500 font-mono">
                        Cód EAN: {p.ean} &bull; Setor: {p.setor} &bull; Estoque: {p.estoque} UN
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-extrabold text-base text-emerald-700">
                        {formatCurrency(p.precoVenda)}
                      </span>
                      <button
                        onClick={() => {
                          handleAddItem(p, 1);
                          setIsPriceLookupOpen(false);
                        }}
                        className="px-2.5 py-1 text-xs font-bold rounded bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        + Lançar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-200 flex justify-end">
              <button
                onClick={() => setIsPriceLookupOpen(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
              >
                Fechar Consulta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
