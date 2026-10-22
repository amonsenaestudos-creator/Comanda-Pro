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
  UtensilsCrossed,
  LayoutGrid,
  X,
  Tag,
  Settings2,
  ChevronLeft,
  ChevronRight,
  Keyboard,
  Sandwich,
  CupSoda,
  IceCreamBowl,
  CakeSlice,
  CookingPot,
  Salad,
  Store,
  Bike,
  User,
  Phone,
  MapPin,
  TicketPercent,
  ArrowRightLeft,
  Split,
  ClipboardList,
  CircleDollarSign,
  ShoppingBag,
  ReceiptText,
  Hash,
  Ban,
  CheckCircle2,
  Clock,
  HandCoins,
  Send,
} from 'lucide-react';
import {
  AppConfig,
  CaixaAppearance,
  ComandaAvulsa,
  Employee,
  OrderItem,
  Product,
  Sale,
  Table,
} from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { orderSubtotal } from '../../utils/checkout';
import { AppearanceControls } from '../AppearanceControls';
import { cn } from '../../utils/cn';

interface Tab1PdvProps {
  products: Product[];
  tables: Table[];
  comandas: ComandaAvulsa[];
  employees: Employee[];
  sales: Sale[];
  /** Próximo número sequencial de comanda (exibição no botão "Abrir"). */
  proximoNumeroComanda: number;
  onSaveTableItems: (tableNum: number, items: OrderItem[], waiterName?: string) => void;
  onGoToPayment: (orderData: {
    mesa: number | string;
    itens: OrderItem[];
    subtotal: number;
    atendente?: string;
    tipoAtendimento?: Sale['tipoAtendimento'];
    numeroComanda?: number;
    comandaId?: string;
    clienteNome?: string;
    clienteTelefone?: string;
    enderecoEntrega?: string;
    cupomCodigo?: string;
  }) => void;
  onSendToKitchen: (orderData: {
    mesa: number | string;
    itens: OrderItem[];
    observacao?: string;
  }) => boolean;
  onPrintTableTicket: (mesaNum: number | string, items: OrderItem[]) => void;
  onNavigateTab: (tabId: number) => void;
  onSaveTableObservation?: (tableNum: number, note: string) => void;
  config: AppConfig;
  selectedTableNumber?: number;
  setSelectedTableNumber?: (tableNum: number) => void;
  /** Contexto ativo (mesa ou comanda avulsa), para o F2 global. */
  onContextChange?: (ctx: { tipo: 'mesa'; numero: number } | { tipo: 'avulsa'; id: string | null }) => void;
  onUpdateTableStatus?: (tableNum: number, status: Table['status']) => void;
  onUpdateTableContext?: (
    tableNum: number,
    patch: Partial<Pick<Table, 'cliente' | 'clienteTelefone' | 'cupom'>>
  ) => void;
  onCreateComandaAvulsa: (dados: {
    tipo: 'Balcão' | 'Delivery';
    clienteNome?: string;
    clienteTelefone?: string;
    endereco?: string;
    garcom?: string;
  }) => ComandaAvulsa;
  onSaveComanda: (comanda: ComandaAvulsa) => void;
  onDeleteComanda: (comandaId: string) => void;
  onUpdateComandaContext: (
    comandaId: string,
    patch: Partial<Pick<ComandaAvulsa, 'cupom' | 'clienteNome' | 'clienteTelefone' | 'endereco' | 'garcom'>>
  ) => void;
  onTransferTable: (deNumero: number, paraNumero: number) => boolean;
  onDividirComanda: (
    origem: { mesa?: number; comandaId?: string },
    itensSeparados: OrderItem[]
  ) => ComandaAvulsa | null;
  onCancelKitchenItems: (
    contexto: { mesa?: number; comandaId?: string },
    cancelados: { descricao: string; quantidade: number; motivo?: string }[]
  ) => void;
  onAdjustSentItems: (
    contexto: { mesa?: number; comandaId?: string },
    itemId: string,
    novaQuantidade: number
  ) => void;
  /** Ajustes rápidos de tema/letra/densidade, feitos direto no caixa. */
  onUpdateAppearance?: (patch: Partial<CaixaAppearance>) => void;
}

const TIPOS_ATENDIMENTO: {
  id: Sale['tipoAtendimento'];
  label: string;
  icon: React.ElementType;
}[] = [
  { id: 'Mesa', label: 'Mesa', icon: UtensilsCrossed },
  { id: 'Balcão', label: 'Balcão', icon: Store },
  { id: 'Delivery', label: 'Delivery', icon: Bike },
];

const categoryIcon = (category: string) => {
  if (/bebida|suco/i.test(category)) return CupSoda;
  if (/hambúrguer|salgado/i.test(category)) return Sandwich;
  if (/açaí|sorvete/i.test(category)) return IceCreamBowl;
  if (/doce/i.test(category)) return CakeSlice;
  if (/porç/i.test(category)) return CookingPot;
  return Salad;
};

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

const diaLocal = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

export const Tab1Pdv: React.FC<Tab1PdvProps> = ({
  products,
  tables,
  comandas,
  employees,
  sales,
  proximoNumeroComanda,
  onSaveTableItems,
  onGoToPayment,
  onSendToKitchen,
  onPrintTableTicket,
  onNavigateTab,
  onSaveTableObservation,
  config,
  selectedTableNumber: propTableNum,
  setSelectedTableNumber: setPropTableNum,
  onContextChange,
  onUpdateTableStatus,
  onUpdateTableContext,
  onCreateComandaAvulsa,
  onSaveComanda,
  onDeleteComanda,
  onUpdateComandaContext,
  onTransferTable,
  onDividirComanda,
  onCancelKitchenItems,
  onAdjustSentItems,
  onUpdateAppearance,
}) => {
  const a = config.aparencia || APARENCIA_PADRAO;
  const compact = a.densidade === 'compacta';

  const [atendimento, setAtendimento] = useState<Sale['tipoAtendimento']>('Mesa');
  const [currentTableNum, setCurrentTableNum] = useState<number>(propTableNum || 1);
  const [activeComandaId, setActiveComandaId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [itemObservation, setItemObservation] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('TODOS');
  const [isPriceLookupOpen, setIsPriceLookupOpen] = useState(false);
  const [priceLookupSearch, setPriceLookupSearch] = useState('');
  const [kitchenAlert, setKitchenAlert] = useState<string | null>(null);
  const [mesaObservacaoInput, setMesaObservacaoInput] = useState('');
  const [showAjustes, setShowAjustes] = useState(false);

  // Comandas avulsas / ferramentas
  const [cupomInput, setCupomInput] = useState('');
  const [modalNovaComanda, setModalNovaComanda] = useState(false);
  const [modalTransferir, setModalTransferir] = useState(false);
  const [modalDividir, setModalDividir] = useState(false);
  const [dividirSelecionados, setDividirSelecionados] = useState<Set<string>>(new Set());
  const [novaComandaForm, setNovaComandaForm] = useState({
    clienteNome: '',
    clienteTelefone: '',
    endereco: '',
    garcom: '',
  });
  const [transferDestino, setTransferDestino] = useState<number | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (propTableNum) {
      setCurrentTableNum(propTableNum);
    }
  }, [propTableNum]);

  // ---------- Contexto ativo (mesa ou comanda avulsa) ----------
  const mesaAtual =
    atendimento === 'Mesa'
      ? tables.find((t) => t.numero === currentTableNum)
      : undefined;
  const comandaAtual =
    atendimento !== 'Mesa'
      ? comandas.find((c) => c.id === activeComandaId)
      : undefined;

  const currentItems = mesaAtual ? mesaAtual.itens : (comandaAtual?.itens ?? []);
  const cozinhaEnviada = mesaAtual?.cozinhaEnviada ?? comandaAtual?.cozinhaEnviada ?? {};

  const totalItemsCount = currentItems.reduce((acc, it) => acc + it.quantidade, 0);
  const totalValue = orderSubtotal(currentItems);

  const cupomCodigo = (mesaAtual?.cupom ?? comandaAtual?.cupom ?? '').trim().toUpperCase();
  const cupomResolvido = useMemo(() => {
    if (!cupomCodigo) return null;
    const found = (config.cupons || []).find(
      (c) => c.ativo && c.codigo.trim().toUpperCase() === cupomCodigo
    );
    return found ? { codigo: found.codigo, percentual: found.percentual } : null;
  }, [cupomCodigo, config.cupons]);
  const descontoCupomValor = cupomResolvido
    ? Number(((totalValue * cupomResolvido.percentual) / 100).toFixed(2))
    : 0;
  const totalComDesconto = Number(Math.max(0, totalValue - descontoCupomValor).toFixed(2));

  // Informa ao App qual comanda está aberta (atalho F2 paga a certa)
  useEffect(() => {
    onContextChange?.(
      atendimento === 'Mesa'
        ? { tipo: 'mesa', numero: currentTableNum }
        : { tipo: 'avulsa', id: comandaAtual?.id ?? null }
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atendimento, currentTableNum, activeComandaId, comandas]);

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
  }, [currentTableNum, activeComandaId, a.focoBuscaAoAbrir]);

  // Mantém a aba ativa visível na régua de comandas.
  useEffect(() => {
    const activeChip = stripRef.current?.querySelector<HTMLElement>('.cp-order-tab-on');
    activeChip?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [atendimento, currentTableNum, activeComandaId, tables, comandas]);

  useEffect(() => {
    const tableObj = tables.find((t) => t.numero === currentTableNum);
    setMesaObservacaoInput(tableObj?.observacaoMesa || '');
  }, [currentTableNum, tables]);

  // Ao trocar para Balcão/Delivery sem comanda, sugere abrir uma nova.
  useEffect(() => {
    if (atendimento !== 'Mesa' && !comandaAtual && comandas.some((c) => c.tipo === atendimento)) {
      // Há comandas do tipo, mas nenhuma selecionada: seleciona a primeira.
      const primeira = comandas.find((c) => c.tipo === atendimento);
      if (primeira) setActiveComandaId(primeira.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atendimento, comandas]);

  const handleSelectTable = (num: number) => {
    setCurrentTableNum(num);
    if (setPropTableNum) setPropTableNum(num);
  };

  const handleStepTable = (delta: number) => {
    if (atendimento !== 'Mesa') {
      // Alt + setas navega entre as comandas avulsas do tipo ativo
      const lista = comandas.filter((c) => c.tipo === atendimento);
      if (lista.length === 0) return;
      const idx = lista.findIndex((c) => c.id === activeComandaId);
      const next = lista[(idx + delta + lista.length) % lista.length];
      if (next && next.id !== activeComandaId) setActiveComandaId(next.id);
      return;
    }
    const numbers = tables.map((t) => t.numero).sort((a, b) => a - b);
    const next =
      numbers[Math.min(numbers.length - 1, Math.max(0, numbers.indexOf(currentTableNum) + delta))] ??
      currentTableNum;
    if (next !== currentTableNum) handleSelectTable(next);
  };

  // ---------- Persistência genérica do contexto ativo ----------
  const salvarItens = (itens: OrderItem[]) => {
    if (mesaAtual) {
      onSaveTableItems(currentTableNum, itens);
    } else if (comandaAtual) {
      onSaveComanda({ ...comandaAtual, itens, subtotal: orderSubtotal(itens) });
    }
  };

  const estoqueReservado = (prodId: string) =>
    tables
      .flatMap((t) => t.itens)
      .concat(comandas.flatMap((c) => c.itens))
      .filter((i) => i.productId === prodId)
      .reduce((sum, i) => sum + i.quantidade, 0);

  const handleAddItem = (prod: Product, customQty?: number) => {
    const qtyToAdd = customQty ?? quantity;
    if (
      !Number.isFinite(qtyToAdd) ||
      qtyToAdd <= 0 ||
      !Number.isFinite(prod.precoVenda) ||
      prod.precoVenda < 0
    )
      return;
    // Em Balcão/Delivery sem comanda aberta, começar uma nova na hora.
    if (!mesaAtual && !comandaAtual) {
      setModalNovaComanda(true);
      return;
    }
    const reserved = estoqueReservado(prod.id);
    if (!Number.isFinite(prod.estoque) || reserved + qtyToAdd > prod.estoque) {
      alert('Estoque insuficiente. Considere também os itens nas outras comandas abertas.');
      return;
    }

    const existingIdx = currentItems.findIndex(
      (it) => it.productId === prod.id && (it.observacao || '') === itemObservation.trim()
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
        observacao: itemObservation.trim() || undefined,
        setor: prod.setor,
      };
      updatedItems = [...currentItems, newItem];
    }

    salvarItens(updatedItems);

    setQuantity(1);
    setItemObservation('');
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleCancelarEnviado = (item: OrderItem, qtyCancelar: number) => {
    const motivo = window.prompt(
      `Motivo do cancelamento de ${qtyCancelar}x ${item.descricao} (visível para a cozinha):`,
      'Cancelado pelo operador'
    );
    if (motivo === null) return; // operação abortada
    onCancelKitchenItems(
      mesaAtual ? { mesa: mesaAtual.numero } : { comandaId: comandaAtual!.id },
      [{ descricao: item.descricao, quantidade: qtyCancelar, motivo: motivo || undefined }]
    );
    const jaEnviado = cozinhaEnviada[item.id] ?? 0;
    onAdjustSentItems(
      mesaAtual ? { mesa: mesaAtual.numero } : { comandaId: comandaAtual!.id },
      item.id,
      Math.max(0, jaEnviado - qtyCancelar)
    );
  };

  const handleRemoveItem = (index: number) => {
    const item = currentItems[index];
    const enviado = cozinhaEnviada[item.id] ?? 0;
    if (enviado > 0) {
      const ok = window.confirm(
        `"${item.descricao}" já foi enviado à cozinha (${enviado}x). Remover mesmo assim? O cancelamento será registrado na produção.`
      );
      if (!ok) return;
      handleCancelarEnviado(item, enviado);
    }
    salvarItens(currentItems.filter((_, i) => i !== index));
  };

  const handleUpdateItemQuantity = (index: number, delta: number) => {
    const updated = [...currentItems];
    const item = updated[index];
    const newQty = item.quantidade + delta;
    const enviado = cozinhaEnviada[item.id] ?? 0;

    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }

    if (delta < 0 && newQty < enviado) {
      const cancelar = enviado - newQty;
      const ok = window.confirm(
        `${cancelar}x "${item.descricao}" já foram enviados à cozinha. Registrar cancelamento da diferença?`
      );
      if (!ok) return;
      handleCancelarEnviado(item, cancelar);
    }

    const reserved = estoqueReservado(item.productId);
    const product = products.find((p) => p.id === item.productId);
    if (delta > 0 && (!product || reserved + delta > product.estoque)) {
      alert('Estoque insuficiente.');
      return;
    }
    updated[index] = {
      ...item,
      quantidade: newQty,
      valorTotal: Number((newQty * item.precoUnitario).toFixed(2)),
    };
    salvarItens(updated);
  };

  const handleClearTable = () => {
    if (currentItems.length === 0) return;
    if (mesaAtual) {
      if (
        !a.confirmarLimpar ||
        window.confirm(`Deseja realmente LIMPAR todos os itens da Mesa #${currentTableNum}?`)
      ) {
        onSaveTableItems(currentTableNum, []);
      }
    } else if (comandaAtual) {
      if (window.confirm('Deseja realmente LIMPAR todos os itens desta comanda?')) {
        onSaveComanda({ ...comandaAtual, itens: [], subtotal: 0 });
      }
    }
  };

  const handleSendToKitchenAction = () => {
    if (currentItems.length === 0) {
      alert('Nenhum item na comanda para enviar à produção!');
      return;
    }
    const identificacao = mesaAtual
      ? `Mesa #${currentTableNum}`
      : `${comandaAtual!.tipo} #${comandaAtual!.numero}`;
    const sent = onSendToKitchen({
      mesa: mesaAtual ? currentTableNum : comandaAtual!.id,
      itens: currentItems,
      observacao: `Pedido ${identificacao}`,
    });
    if (!sent) return;
    setKitchenAlert(`Pedido de ${identificacao} enviado para a Cozinha!`);
    setTimeout(() => setKitchenAlert(null), 3500);
  };

  const handlePay = () => {
    if (currentItems.length === 0) {
      alert('Não há itens para pagar nesta comanda!');
      return;
    }
    if (mesaAtual) {
      onGoToPayment({
        mesa: currentTableNum,
        itens: currentItems,
        subtotal: totalValue,
        atendente: mesaAtual.garcom || config.usuarioAtual,
        tipoAtendimento: 'Mesa',
        numeroComanda: mesaAtual.numeroComanda,
        clienteNome: mesaAtual.cliente,
        clienteTelefone: mesaAtual.clienteTelefone,
        cupomCodigo: cupomResolvido?.codigo,
      });
    } else if (comandaAtual) {
      onGoToPayment({
        mesa: comandaAtual.id,
        itens: currentItems,
        subtotal: totalValue,
        atendente: comandaAtual.garcom || config.usuarioAtual,
        tipoAtendimento: comandaAtual.tipo,
        numeroComanda: comandaAtual.numero,
        comandaId: comandaAtual.id,
        clienteNome: comandaAtual.clienteNome,
        clienteTelefone: comandaAtual.clienteTelefone,
        enderecoEntrega: comandaAtual.endereco,
        cupomCodigo: cupomResolvido?.codigo,
      });
    }
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
      ? 'grid-cols-2 xl:grid-cols-3'
      : 'grid-cols-2';

  const quickQty = a.quantidadesRapidas.length ? a.quantidadesRapidas : [1];
  const panelPad = compact ? 'p-2.5' : 'p-4';

  // Status da comanda ativa (estilo "OnProgress" das referências)
  const qtyTotal = currentItems.reduce((acc, it) => acc + it.quantidade, 0);
  const qtyEnviado = currentItems.reduce(
    (acc, it) => acc + Math.min(it.quantidade, cozinhaEnviada[it.id] ?? 0),
    0
  );
  const tudoEnviado = qtyTotal > 0 && qtyEnviado >= qtyTotal;

  const statusInfo = !currentItems.length
    ? { label: 'Livre', cls: 'bg-emerald-100 text-emerald-700 border-emerald-300' }
    : mesaAtual?.status === 'conta_solicitada'
    ? { label: 'Conta pedida', cls: 'bg-amber-100 text-amber-700 border-amber-300' }
    : tudoEnviado
    ? { label: 'Enviado à cozinha', cls: 'bg-sky-100 text-sky-700 border-sky-300' }
    : { label: 'Em andamento', cls: 'bg-orange-100 text-orange-700 border-orange-300' };

  const clienteAtivo = mesaAtual?.cliente ?? comandaAtual?.clienteNome;
  const garcomAtivo = mesaAtual?.garcom ?? comandaAtual?.garcom;
  const numeroComandaAtivo = mesaAtual?.numeroComanda ?? comandaAtual?.numero;

  // ---------- Cupom ----------
  const handleAplicarCupom = () => {
    const codigo = cupomInput.trim().toUpperCase();
    if (!codigo) return;
    const found = (config.cupons || []).find(
      (c) => c.ativo && c.codigo.trim().toUpperCase() === codigo
    );
    if (!found) {
      alert('Cupom inválido ou inativo. Verifique o código com o gerente.');
      return;
    }
    if (mesaAtual) onUpdateTableContext?.(currentTableNum, { cupom: found.codigo });
    else if (comandaAtual) onUpdateComandaContext(comandaAtual.id, { cupom: found.codigo });
    setCupomInput('');
  };
  const handleRemoverCupom = () => {
    if (mesaAtual) onUpdateTableContext?.(currentTableNum, { cupom: '' });
    else if (comandaAtual) onUpdateComandaContext(comandaAtual.id, { cupom: '' });
  };

  // ---------- Comandas avulsas ----------
  const handleCriarComanda = () => {
    const nova = onCreateComandaAvulsa({
      tipo: atendimento === 'Delivery' ? 'Delivery' : 'Balcão',
      clienteNome: novaComandaForm.clienteNome,
      clienteTelefone: novaComandaForm.clienteTelefone,
      endereco: novaComandaForm.endereco,
      garcom: novaComandaForm.garcom || undefined,
    });
    setActiveComandaId(nova.id);
    setModalNovaComanda(false);
    setNovaComandaForm({ clienteNome: '', clienteTelefone: '', endereco: '', garcom: '' });
  };

  const handleExcluirComanda = () => {
    if (!comandaAtual) return;
    if (
      comandaAtual.itens.length > 0 &&
      !window.confirm(
        'Esta comanda tem itens lançados que não serão cobrados. Excluir mesmo assim?'
      )
    ) {
      return;
    }
    onDeleteComanda(comandaAtual.id);
    setActiveComandaId(null);
  };

  // ---------- Transferir (mover comanda entre mesas) ----------
  const mesasLivres = tables.filter((t) => t.numero !== currentTableNum && t.itens.length === 0);
  const handleConfirmarTransferir = () => {
    if (transferDestino == null) return;
    const ok = onTransferTable(currentTableNum, transferDestino);
    if (ok) {
      handleSelectTable(transferDestino);
      setModalTransferir(false);
      setTransferDestino(null);
    }
  };

  // ---------- Dividir comanda ----------
  const itensSelecionados = currentItems.filter((it) => dividirSelecionados.has(it.id));
  const valorSelecionado = orderSubtotal(itensSelecionados);
  const handleConfirmarDividir = () => {
    if (itensSelecionados.length === 0) {
      alert('Selecione ao menos um item para separar.');
      return;
    }
    const nova = onDividirComanda(
      mesaAtual ? { mesa: currentTableNum } : { comandaId: comandaAtual!.id },
      itensSelecionados
    );
    if (!nova) return;
    salvarItens(currentItems.filter((it) => !dividirSelecionados.has(it.id)));
    setDividirSelecionados(new Set());
    setModalDividir(false);
    setAtendimento('Balcão');
    setActiveComandaId(nova.id);
  };

  // ---------- Estatísticas (cartões estilo "Total Sale") ----------
  const vendasHoje = sales.filter((s) => diaLocal(s.dataHora) === diaLocal(new Date().toISOString()));
  const totalHoje = vendasHoje.reduce((acc, s) => acc + s.totalLiquido, 0);
  const ticketMedio = vendasHoje.length ? totalHoje / vendasHoje.length : 0;
  const comandasAbertas =
    tables.filter((t) => t.status !== 'livre' || t.itens.length > 0).length + comandas.length;

  const stats = [
    {
      label: 'Vendas hoje',
      valor: formatCurrency(totalHoje),
      sub: `${vendasHoje.length} venda${vendasHoje.length === 1 ? '' : 's'}`,
      icon: CircleDollarSign,
      cls: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    },
    {
      label: 'Comandas abertas',
      valor: String(comandasAbertas),
      sub: 'mesas + balcão/delivery',
      icon: ClipboardList,
      cls: 'text-sky-600 bg-sky-50 border-sky-200',
    },
    {
      label: 'Itens na comanda',
      valor: String(totalItemsCount),
      sub: `${currentItems.length} linha${currentItems.length === 1 ? '' : 's'}`,
      icon: ShoppingBag,
      cls: 'text-amber-600 bg-amber-50 border-amber-200',
    },
    {
      label: 'Ticket médio',
      valor: formatCurrency(ticketMedio),
      sub: 'hoje',
      icon: ReceiptText,
      cls: 'text-violet-600 bg-violet-50 border-violet-200',
    },
  ];

  const tituloContexto = mesaAtual
    ? `Mesa ${String(currentTableNum).padStart(2, '0')}`
    : comandaAtual
    ? `${comandaAtual.tipo} #${comandaAtual.numero}`
    : `Sem comanda de ${atendimento.toLowerCase()} aberta`;

  return (
    <div className="cp-pdv space-y-3">
      {/* ============================ CARTÕES DE ESTATÍSTICAS ============================ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="cp-card cp-stat px-3 py-2.5 flex items-center gap-3 transition-colors">
              <span className={cn('w-9 h-9 rounded-lg border flex items-center justify-center shrink-0', s.cls)}>
                <Icon className="w-4.5 h-4.5" />
              </span>
              <div className="min-w-0">
                <div className="cp-label cp-faint font-bold">{s.label}</div>
                <div className="cp-num font-black font-mono cp-text leading-tight">{s.valor}</div>
                <div className="cp-small cp-faint truncate">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ================================ BARRA DO CAIXA ================================ */}
      <div className={cn('cp-card sticky top-0 z-20', panelPad)}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* Tipo de atendimento (Delivery / Dine In / Takeaway das referências) */}
          <div className="cp-seg flex items-center gap-1 cp-soft rounded-xl border cp-line p-1" role="tablist" aria-label="Tipo de atendimento">
            {TIPOS_ATENDIMENTO.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={atendimento === id}
                onClick={() => setAtendimento(id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg cp-small font-bold transition',
                  atendimento === id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'cp-muted hover:cp-text'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Comanda ativa */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStepTable(-1)}
              className="cp-chip p-1.5 rounded-lg"
              title="Comanda anterior (Alt + ←)"
              aria-label="Comanda anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center px-1 min-w-[6.5rem]">
              <div className="cp-label cp-faint font-bold">
                {atendimento === 'Mesa' ? 'Mesa / Comanda' : 'Comanda'}
              </div>
              <div className="cp-text cp-pdv-main-table-number font-black leading-none">
                {numeroComandaAtivo ? `#${numeroComandaAtivo}` : '—'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleStepTable(1)}
              className="cp-chip p-1.5 rounded-lg"
              title="Próxima comanda (Alt + →)"
              aria-label="Próxima comanda"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                'text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1',
                statusInfo.cls
              )}
            >
              <Clock className="w-3 h-3" />
              {statusInfo.label}
            </span>
            {clienteAtivo && (
              <span className="text-[11px] cp-faint hidden xl:inline">
                Cliente: <strong className="cp-muted">{clienteAtivo}</strong>
              </span>
            )}
            {garcomAtivo && (
              <span className="text-[11px] cp-faint hidden xl:inline">
                Atendente: <strong className="cp-muted">{garcomAtivo}</strong>
              </span>
            )}
            {atendimento === 'Mesa' && (
              <button
                type="button"
                onClick={() => onNavigateTab(8)}
                className="cp-chip px-2.5 py-1 cp-small flex items-center gap-1.5"
                title="Abrir mapa do salão"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mapa do salão</span>
              </button>
            )}
          </div>

          {/* Total + ação principal */}
          <div className="ml-auto flex items-end gap-3 sm:gap-5">
            <div className="text-right">
              <div className="cp-label cp-faint font-bold">Total da comanda</div>
              <div className="cp-total font-black font-mono cp-accent">
                {formatCurrency(totalComDesconto)}
              </div>
              <div className="cp-small cp-faint mt-0.5">
                {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'}
                {descontoCupomValor > 0 && (
                  <span className="text-emerald-600 font-bold">
                    {' '}
                    &bull; cupom -{formatCurrency(descontoCupomValor)}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handlePay}
              disabled={currentItems.length === 0}
              className="cp-btn bg-emerald-600 text-white min-w-[10.5rem]"
            >
              <DollarSign className="w-5 h-5" />
              <span>Pagar</span>
              <kbd className="text-[10px] bg-black/25 rounded px-1 py-0.5 font-mono">F2</kbd>
            </button>
          </div>
        </div>

        {/* Régua de comandas abertas (abas estilo referência) */}
        <div
          ref={stripRef}
          className="mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar pb-0.5"
          aria-label="Comandas abertas"
        >
          {atendimento === 'Mesa' ? (
            tables.map((t) => {
              const isActive = t.numero === currentTableNum;
              const hasItems = t.itens.length > 0;
              const status =
                t.status === 'ocupada' || hasItems
                  ? 'ocupada'
                  : t.status === 'conta_solicitada'
                  ? 'conta'
                  : 'livre';
              return (
                <button
                  key={t.numero}
                  type="button"
                  data-mesa={t.numero}
                  aria-current={isActive}
                  onClick={() => handleSelectTable(t.numero)}
                  title={`Mesa ${t.numero} — ${hasItems ? formatCurrency(t.total) : 'sem itens'}`}
                  className={cn(
                    'cp-pdv-table-chip shrink-0 rounded-lg border font-extrabold transition-all relative',
                    isActive
                      ? 'cp-order-tab-on bg-orange-600 border-orange-600 text-white'
                      : status === 'ocupada'
                      ? 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                      : status === 'conta'
                      ? 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                      : 'cp-chip'
                  )}
                >
                  {t.numero < 10 ? `0${t.numero}` : t.numero}
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
            })
          ) : (
            <>
              {comandas
                .filter((c) => c.tipo === atendimento)
                .map((c) => {
                  const isActive = c.id === activeComandaId;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-current={isActive}
                      onClick={() => setActiveComandaId(c.id)}
                      title={`${c.tipo} #${c.numero} — ${c.clienteNome || 'sem cliente'} — ${formatCurrency(c.subtotal)}`}
                      className={cn(
                        'shrink-0 rounded-lg border px-3 py-1.5 text-left transition-all',
                        isActive
                          ? 'cp-order-tab-on bg-orange-600 border-orange-600 text-white'
                          : 'cp-chip flex flex-col !items-start !rounded-lg'
                      )}
                    >
                      <span className="font-black text-[11px] leading-tight">
                        #{c.numero} {c.tipo}
                        {c.clienteNome ? ` · ${c.clienteNome.split(' ')[0]}` : ''}
                      </span>
                      <span className="font-mono text-[10px] opacity-80">
                        {formatCurrency(c.subtotal)}
                      </span>
                    </button>
                  );
                })}
              <button
                type="button"
                onClick={() => setModalNovaComanda(true)}
                className="cp-chip shrink-0 flex items-center gap-1.5 !border-dashed"
                title={`Abrir nova comanda de ${atendimento}`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova comanda</span>
              </button>
            </>
          )}
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
              {qtyTotal > 0 && qtyEnviado < qtyTotal && (
                <span className="text-[10px] font-mono bg-black/15 rounded px-1.5 py-0.5">
                  {qtyTotal - qtyEnviado} pendentes
                </span>
              )}
            </button>
          )}
          {a.mostrarBotaoImprimir && (
            <button
              onClick={() =>
                onPrintTableTicket(
                  mesaAtual ? currentTableNum : comandaAtual!.id,
                  currentItems
                )
              }
              disabled={currentItems.length === 0}
              className="cp-btn cp-pdv-print-action bg-sky-600 text-white"
            >
              <Printer className="w-5 h-5" />
              <span>Imprimir comanda</span>
            </button>
          )}
          {atendimento === 'Mesa' && mesaAtual && (
            <button
              onClick={() =>
                onUpdateTableStatus?.(
                  currentTableNum,
                  mesaAtual.status === 'conta_solicitada' ? 'ocupada' : 'conta_solicitada'
                )
              }
              className="cp-btn cp-soft cp-muted border cp-line"
              title="Sinaliza que o cliente pediu a conta"
            >
              <HandCoins className="w-4 h-4" />
              <span>{mesaAtual.status === 'conta_solicitada' ? 'Conta pedida ✓' : 'Pedir conta'}</span>
            </button>
          )}
          {atendimento === 'Mesa' && (
            <button
              onClick={() => setModalTransferir(true)}
              disabled={currentItems.length === 0}
              className="cp-btn cp-soft cp-muted border cp-line"
              title="Mover a comanda inteira para outra mesa"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Mover mesa</span>
            </button>
          )}
          <button
            onClick={() => {
              setDividirSelecionados(new Set());
              setModalDividir(true);
            }}
            disabled={currentItems.length === 0}
            className="cp-btn cp-soft cp-muted border cp-line"
            title="Separar itens em uma nova comanda de balcão"
          >
            <Split className="w-4 h-4" />
            <span>Dividir comanda</span>
          </button>
          <button
            onClick={handleClearTable}
            disabled={currentItems.length === 0}
            className="cp-btn cp-soft cp-muted border cp-line"
          >
            <Trash2 className="w-4 h-4" />
            <span>Limpar comanda</span>
          </button>
          {atendimento !== 'Mesa' && comandaAtual && (
            <button
              onClick={handleExcluirComanda}
              className="cp-btn cp-soft cp-muted border cp-line"
              title="Cancelar esta comanda avulsa (sem cobrança)"
            >
              <Ban className="w-4 h-4" />
              <span>Cancelar comanda</span>
            </button>
          )}

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
        {/* ---------------- Comanda do contexto ativo ---------------- */}
        <div
          className={cn(
            'lg:col-span-5 lg:order-2 min-w-0 cp-card cp-order-panel flex flex-col',
            compact ? 'min-h-[420px]' : 'min-h-[500px]'
          )}
        >
          <div className={cn('flex flex-wrap items-center justify-between gap-3 border-b cp-line', panelPad)}>
            <h3 className="font-bold cp-text flex items-center gap-2 text-sm">
              <Utensils className="w-4 h-4 cp-accent" />
              <span>
                {tituloContexto}
                {numeroComandaAtivo ? ` · Comanda #${numeroComandaAtivo}` : ''}
              </span>
              <span className="cp-soft cp-faint cp-small font-bold px-2 py-0.5 rounded-full border cp-line">
                {currentItems.length} {currentItems.length === 1 ? 'produto' : 'produtos'}
              </span>
            </h3>

            {a.mostrarObsMesa && mesaAtual && (
              <div className="flex items-center gap-1.5 min-w-0">
                <Tag className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <input
                  type="text"
                  value={mesaObservacaoInput}
                  onChange={(e) => setMesaObservacaoInput(e.target.value)}
                  onBlur={() => onSaveTableObservation?.(currentTableNum, mesaObservacaoInput)}
                  placeholder="Obs. da mesa (aniversário, alergia...)"
                  aria-label="Observação da mesa"
                  className="cp-input w-full max-w-64 px-2.5 py-1 cp-small"
                />
              </div>
            )}
          </div>

          {/* Dados do cliente / entrega */}
          {(mesaAtual || comandaAtual) && (
            <div className={cn('flex flex-wrap items-center gap-2 border-b cp-line cp-inset', panelPad)}>
              <div className="flex items-center gap-1.5 min-w-[10rem] flex-1">
                <User className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                  type="text"
                  value={clienteAtivo ?? ''}
                  placeholder="Nome do cliente"
                  aria-label="Nome do cliente"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (mesaAtual) onUpdateTableContext?.(currentTableNum, { cliente: v });
                    else if (comandaAtual) onUpdateComandaContext(comandaAtual.id, { clienteNome: v });
                  }}
                  className="cp-input w-full px-2.5 py-1 cp-small"
                />
              </div>
              <div className="flex items-center gap-1.5 min-w-[9rem] flex-1">
                <Phone className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <input
                  type="tel"
                  value={mesaAtual?.clienteTelefone ?? comandaAtual?.clienteTelefone ?? ''}
                  placeholder="Telefone / WhatsApp"
                  aria-label="Telefone do cliente"
                  onChange={(e) => {
                    const v = e.target.value;
                    if (mesaAtual) onUpdateTableContext?.(currentTableNum, { clienteTelefone: v });
                    else if (comandaAtual) onUpdateComandaContext(comandaAtual.id, { clienteTelefone: v });
                  }}
                  className="cp-input w-full px-2.5 py-1 cp-small"
                />
              </div>
              {atendimento === 'Delivery' && (
                <div className="flex items-center gap-1.5 w-full">
                  <MapPin className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    value={comandaAtual?.endereco ?? ''}
                    placeholder="Endereço de entrega (rua, nº, bairro)"
                    aria-label="Endereço de entrega"
                    onChange={(e) =>
                      comandaAtual &&
                      onUpdateComandaContext(comandaAtual.id, { endereco: e.target.value })
                    }
                    className="cp-input w-full px-2.5 py-1 cp-small"
                  />
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto max-h-[440px]">
            {currentItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 cp-faint text-center px-6">
                <Utensils className="w-12 h-12 mb-3 opacity-40" />
                <p className="cp-muted font-extrabold text-xl">
                  {atendimento === 'Mesa' ? 'Caixa livre' : 'Nenhuma comanda aberta'}
                </p>
                <p className="cp-small mt-1 max-w-sm">
                  {atendimento === 'Mesa' ? (
                    <>
                      Toque num produto ao lado, bipe o código de barras ou digite e aperte{' '}
                      <kbd className="cp-soft border cp-line rounded px-1 font-mono">Enter</kbd> para
                      lançar o primeiro resultado.
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setModalNovaComanda(true)}
                      className="cp-btn bg-orange-600 text-white mt-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Abrir comanda de {atendimento}</span>
                    </button>
                  )}
                </p>
              </div>
            ) : (
              currentItems.map((item, idx) => {
                const enviado = cozinhaEnviada[item.id] ?? 0;
                return (
                  <div
                    key={item.id || idx}
                    className={cn(
                      'cp-row flex flex-wrap xl:flex-nowrap items-center gap-2 px-3 hover:bg-orange-50/40 transition-colors',
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
                      <span className="cp-num w-11 text-center font-black cp-text">{item.quantidade}</span>
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
                        {enviado > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-sky-600 font-bold">
                            <Send className="w-3 h-3" />
                            {enviado}x enviado{enviado > 1 ? 's' : ''}
                          </span>
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
                        <div className="cp-small cp-pdv-unit-price cp-muted font-mono">
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
                );
              })
            )}
          </div>

          {/* Cupom de desconto + totais */}
          <div className={cn('mt-auto border-t cp-line cp-inset space-y-2.5', panelPad)}>
            <div className="flex items-center gap-1.5">
              <TicketPercent className="w-4 h-4 text-emerald-600 shrink-0" />
              {cupomResolvido ? (
                <div className="flex-1 flex items-center justify-between gap-2">
                  <span className="cp-small font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                    Cupom {cupomResolvido.codigo} (-{cupomResolvido.percentual}%)
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoverCupom}
                    className="p-1 rounded cp-faint hover:text-rose-600"
                    title="Remover cupom"
                    aria-label="Remover cupom de desconto"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <>
                  <input
                    type="text"
                    value={cupomInput}
                    onChange={(e) => setCupomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAplicarCupom();
                    }}
                    placeholder="Cupom de desconto (ex: SABOR10)"
                    aria-label="Cupom de desconto"
                    className="cp-input flex-1 px-2.5 py-1 cp-small uppercase"
                  />
                  <button
                    type="button"
                    onClick={handleAplicarCupom}
                    disabled={!cupomInput.trim()}
                    className="cp-btn cp-soft cp-muted border cp-line !py-1.5 !px-3 cp-small"
                  >
                    Aplicar
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center justify-between text-xs cp-muted">
              <span>Subtotal ({totalItemsCount} {totalItemsCount === 1 ? 'item' : 'itens'})</span>
              <span className="font-mono font-bold cp-text">{formatCurrency(totalValue)}</span>
            </div>
            {descontoCupomValor > 0 && (
              <div className="flex items-center justify-between text-xs text-emerald-700 font-semibold">
                <span>Desconto cupom {cupomResolvido?.codigo}</span>
                <span className="font-mono">-{formatCurrency(descontoCupomValor)}</span>
              </div>
            )}

            {/* Quantidade rápida, observação do item */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] cp-faint font-bold uppercase mr-0.5">Qtd</span>
                {quickQty.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => setQuantity(q)}
                    aria-pressed={quantity === q}
                    className={cn(
                      'cp-pdv-quick-qty rounded-lg font-black border transition',
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
                    className="w-14 text-center cp-num font-black cp-text bg-transparent focus:outline-none"
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
            </div>

            <button
              onClick={handlePay}
              disabled={!currentItems.length}
              className="cp-checkout-action cp-btn w-full bg-emerald-600 text-white justify-between"
            >
              <span>
                Processar Pagamento <span className="opacity-70 text-xs ml-1">F2</span>
              </span>
              <span className="font-mono">{formatCurrency(totalComDesconto)}</span>
            </button>
          </div>
        </div>

        {/* ---------------- Cardápio rápido ---------------- */}
        <div className="lg:col-span-7 lg:order-1 min-w-0 cp-card flex flex-col overflow-hidden">
          <div className={cn('border-b cp-line space-y-2.5', panelPad)}>
            <div className="flex items-center justify-between">
              <div>
                <p className="cp-label cp-accent font-bold mb-1">Escolha e adicione</p>
                <h3 className="font-extrabold cp-text text-xl">Nosso cardápio</h3>
              </div>
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
                    'px-3 py-2 cp-small whitespace-nowrap shrink-0 flex items-center gap-2',
                    activeCategory === cat ? 'cp-chip cp-chip-on' : 'cp-chip'
                  )}
                >
                  {React.createElement(cat === 'TODOS' ? LayoutGrid : categoryIcon(cat), { className: 'w-4 h-4' })}
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
                    disabled={prod.estoque <= 0}
                    className="cp-tile cp-product-tile text-left flex flex-col justify-between gap-2 disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    <div className="cp-product-art" aria-hidden="true">
                      {React.createElement(categoryIcon(prod.setor), { className: 'w-12 h-12', strokeWidth: 1.4 })}
                      <span className="cp-product-add"><Plus className="w-4 h-4" /></span>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="cp-item cp-text font-bold leading-tight line-clamp-2 text-left">
                        {prod.descricao}
                      </span>
                      {a.mostrarEstoque && (
                        <span
                          className={cn(
                            'cp-pdv-stock-badge shrink-0 font-black px-2 py-0.5 rounded border',
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
                        <span className="cp-pdv-selected-qty font-black text-orange-600 bg-orange-100 rounded px-1 py-0.5">
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

      {/* ================= MODAL: NOVA COMANDA (BALCÃO / DELIVERY) ================= */}
      {modalNovaComanda && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="cp-card max-w-md w-full p-5 shadow-2xl" role="dialog" aria-label="Abrir nova comanda">
            <div className="flex items-center justify-between pb-3 border-b cp-line">
              <h3 className="font-bold text-base cp-text flex items-center gap-2">
                <Hash className="w-4 h-4 cp-accent" />
                Nova comanda de {atendimento}
              </h3>
              <button onClick={() => setModalNovaComanda(false)} className="p-1 rounded cp-faint" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <label className="cp-label cp-faint font-bold block mb-1" htmlFor="nc-nome">Nome do cliente</label>
                <input
                  id="nc-nome"
                  type="text"
                  autoFocus
                  value={novaComandaForm.clienteNome}
                  onChange={(e) => setNovaComandaForm({ ...novaComandaForm, clienteNome: e.target.value })}
                  placeholder="Ex.: Hilal Achmad"
                  className="cp-input w-full px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="cp-label cp-faint font-bold block mb-1" htmlFor="nc-fone">Telefone / WhatsApp</label>
                <input
                  id="nc-fone"
                  type="tel"
                  value={novaComandaForm.clienteTelefone}
                  onChange={(e) => setNovaComandaForm({ ...novaComandaForm, clienteTelefone: e.target.value })}
                  placeholder="(71) 98888-7777"
                  className="cp-input w-full px-3 py-2 text-sm"
                />
              </div>
              {atendimento === 'Delivery' && (
                <div>
                  <label className="cp-label cp-faint font-bold block mb-1" htmlFor="nc-end">Endereço de entrega</label>
                  <input
                    id="nc-end"
                    type="text"
                    value={novaComandaForm.endereco}
                    onChange={(e) => setNovaComandaForm({ ...novaComandaForm, endereco: e.target.value })}
                    placeholder="Rua, nº, bairro, cidade"
                    className="cp-input w-full px-3 py-2 text-sm"
                  />
                </div>
              )}
              <div>
                <label className="cp-label cp-faint font-bold block mb-1" htmlFor="nc-garcom">Atendente</label>
                <select
                  id="nc-garcom"
                  value={novaComandaForm.garcom}
                  onChange={(e) => setNovaComandaForm({ ...novaComandaForm, garcom: e.target.value })}
                  className="cp-input w-full px-3 py-2 text-sm"
                >
                  <option value="">{config.usuarioAtual || 'Operador atual'}</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.nome}>
                      {emp.nome} ({emp.funcao})
                    </option>
                  ))}
                </select>
              </div>
            </div>
    <button onClick={handleCriarComanda} className="cp-btn bg-orange-600 text-white w-full mt-5">
      <CheckCircle2 className="w-5 h-5" />
      <span>Abrir comanda #{proximoNumeroComanda}</span>
    </button>
          </div>
        </div>
      )}

      {/* ================= MODAL: MOVER COMANDA DE MESA ================= */}
      {modalTransferir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="cp-card max-w-md w-full p-5 shadow-2xl" role="dialog" aria-label="Mover comanda de mesa">
            <div className="flex items-center justify-between pb-3 border-b cp-line">
              <h3 className="font-bold text-base cp-text flex items-center gap-2">
                <ArrowRightLeft className="w-4 h-4 cp-accent" />
                Mover comanda da Mesa {currentTableNum}
              </h3>
              <button onClick={() => setModalTransferir(false)} className="p-1 rounded cp-faint" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="cp-small cp-muted mt-2">
              Itens, cliente, atendente e envios da cozinha acompanham a comanda. A mesa destino precisa estar livre.
            </p>
            <div className="mt-3 max-h-64 overflow-y-auto grid grid-cols-5 gap-1.5">
              {mesasLivres.map((t) => (
                <button
                  key={t.numero}
                  type="button"
                  onClick={() => setTransferDestino(t.numero)}
                  aria-pressed={transferDestino === t.numero}
                  className={cn(
                    'cp-pdv-table-chip rounded-lg border font-extrabold transition',
                    transferDestino === t.numero
                      ? 'bg-orange-600 border-orange-600 text-white'
                      : 'cp-chip'
                  )}
                >
                  {t.numero < 10 ? `0${t.numero}` : t.numero}
                </button>
              ))}
            </div>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setModalTransferir(false)} className="cp-btn cp-soft cp-muted border cp-line flex-1">
                Voltar
              </button>
              <button
                onClick={handleConfirmarTransferir}
                disabled={transferDestino == null}
                className="cp-btn bg-orange-600 text-white flex-1"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>
                  Mover para Mesa{' '}
                  {transferDestino != null ? String(transferDestino).padStart(2, '0') : '—'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: DIVIDIR COMANDA ================= */}
      {modalDividir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="cp-card max-w-lg w-full p-5 shadow-2xl" role="dialog" aria-label="Dividir comanda">
            <div className="flex items-center justify-between pb-3 border-b cp-line">
              <h3 className="font-bold text-base cp-text flex items-center gap-2">
                <Split className="w-4 h-4 cp-accent" />
                Dividir comanda — separar itens
              </h3>
              <button onClick={() => setModalDividir(false)} className="p-1 rounded cp-faint" aria-label="Fechar">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="cp-small cp-muted mt-2">
              Marque os itens que vão para uma <strong>nova comanda de Balcão</strong> (ex.: divisão por pessoas).
            </p>
            <div className="mt-3 max-h-64 overflow-y-auto divide-y divide-zinc-100 cp-line">
              {currentItems.map((it) => (
                <label key={it.id} className="flex items-center gap-2 py-2 px-1 hover:bg-orange-50/40 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dividirSelecionados.has(it.id)}
                    onChange={(e) => {
                      const next = new Set(dividirSelecionados);
                      if (e.target.checked) next.add(it.id);
                      else next.delete(it.id);
                      setDividirSelecionados(next);
                    }}
                    className="rounded text-orange-600"
                  />
                  <span className="flex-1 cp-item cp-text font-semibold">
                    {it.quantidade}x {it.descricao}
                    {it.observacao && <span className="cp-faint"> — {it.observacao}</span>}
                  </span>
                  <span className="font-mono font-bold cp-small cp-text">{formatCurrency(it.valorTotal)}</span>
                </label>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t cp-line flex items-center justify-between">
              <span className="cp-small cp-muted font-bold">
                Separados: {itensSelecionados.reduce((a, i) => a + i.quantidade, 0)} itens
              </span>
              <span className="cp-total font-black font-mono cp-accent">{formatCurrency(valorSelecionado)}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button onClick={() => setModalDividir(false)} className="cp-btn cp-soft cp-muted border cp-line flex-1">
                Voltar
              </button>
              <button
                onClick={handleConfirmarDividir}
                disabled={itensSelecionados.length === 0}
                className="cp-btn bg-orange-600 text-white flex-1"
              >
                <Split className="w-4 h-4" />
                <span>Separar em nova comanda</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
