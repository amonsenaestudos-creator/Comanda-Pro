import { useState, useEffect, useMemo, useRef } from 'react';
import {
  AppConfig,
  AppIntegration,
  CaixaAppearance,
  ComandaAvulsa,
  Customer,
  Deliverer,
  Employee,
  KitchenOrder,
  OrderItem,
  Product,
  Sale,
  Supplier,
  Table,
} from './types';
import {
  DEFAULT_CONFIG,
  DEFAULT_SECTORS,
  INITIAL_APPS,
  INITIAL_CUSTOMERS,
  INITIAL_DELIVERERS,
  INITIAL_EMPLOYEES,
  INITIAL_PRODUCTS,
  INITIAL_SUPPLIERS,
  OperacoesStore,
  STORAGE_KEYS,
  createInitialKitchenOrders,
  createInitialSales,
  createInitialTables,
  getStored,
  normalizeConfig,
  normalizeOperacoes,
  resolveAppearance,
  resolveHiddenTabs,
  setStored,
} from './utils/storage';
import { completeSale, orderSubtotal } from './utils/checkout';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { PrintTicketModal, TicketType } from './components/PrintTicketModal';
import { AccessGate } from './components/AccessGate';
import { useAccessLicense } from './hooks/useAccessLicense';

// 10 Tabs
import { Tab1Pdv } from './components/tabs/Tab1Pdv';
import { Tab2Pagamento } from './components/tabs/Tab2Pagamento';
import { Tab3Relatorios } from './components/tabs/Tab3Relatorios';
import { Tab4Configuracao } from './components/tabs/Tab4Configuracao';
import { Tab5Estoque } from './components/tabs/Tab5Estoque';
import { Tab6Financeiro } from './components/tabs/Tab6Financeiro';
import { Tab7Graficos } from './components/tabs/Tab7Graficos';
import { Tab8Mesas } from './components/tabs/Tab8Mesas';
import { Tab9CozinhaDelivery } from './components/tabs/Tab9CozinhaDelivery';
import { Tab10Cadastros } from './components/tabs/Tab10Cadastros';
import { Tab11ResumoRapido } from './components/tabs/Tab11ResumoRapido';

/** Identificador exibido na cozinha para comandas avulsas. */
const identificadorComanda = (comanda?: ComandaAvulsa): string | null =>
  comanda ? `${comanda.tipo} #${comanda.numero}` : null;

export function App() {
  const accessLicense = useAccessLicense();

  const [storageError, setStorageError] = useState(false);
  const [externalChange, setExternalChange] = useState(false);
  useEffect(() => {
    const onError = () => setStorageError(true);
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEYS.OPERATIONS || e.key === null) setExternalChange(true); };
    window.addEventListener('comandapro-storage-error', onError);
    window.addEventListener('storage', onStorage);
    return () => { window.removeEventListener('comandapro-storage-error', onError); window.removeEventListener('storage', onStorage); };
  }, []);

  // A single snapshot prevents a completed sale from being stored without its stock/table update.
  const [initialOperations] = useState<Partial<OperacoesStore> | null>(() =>
    getStored<Partial<OperacoesStore> | null>(STORAGE_KEYS.OPERATIONS, null)
  );
  const initialComandas = normalizeOperacoes(initialOperations);

  // Application State
  const [activeTab, setActiveTab] = useState<number>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [config, setConfig] = useState<AppConfig>(() =>
    normalizeConfig(getStored<Partial<AppConfig>>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG))
  );

  const aparencia = resolveAppearance(config.aparencia);
  const hiddenTabs = useMemo(
    () => resolveHiddenTabs(config.aparencia),
    [config.aparencia]
  );

  const handleUpdateAppearance = (patch: Partial<CaixaAppearance>) => {
    setConfig((prev) => ({
      ...prev,
      aparencia: { ...resolveAppearance(prev.aparencia), ...patch },
    }));
  };

  // Quando o conjunto de abas escondidas MUDA (ex: ligou o Modo Caixa), sai da aba
  // que deixou de existir no menu. Navegar manualmente para uma aba escondida
  // (atalhos do topo) continua permitido. Configuração (4) fica aberta de propósito,
  // para o usuário conseguir desligar o modo.
  const previousHiddenRef = useRef<string>(hiddenTabs.join(','));
  useEffect(() => {
    const key = hiddenTabs.join(',');
    const changed = key !== previousHiddenRef.current;
    previousHiddenRef.current = key;
    if (changed && hiddenTabs.includes(activeTab) && activeTab !== 4) {
      setActiveTab(1);
    }
  }, [hiddenTabs, activeTab]);

  // Aplica o tema também no <html>, para fundo, barra de rolagem e color-scheme.
  useEffect(() => {
    const root = document.documentElement;
    const themeClasses = ['cp-dark', 'cp-fs-grande', 'cp-fs-extra', 'cp-compacta'];
    root.classList.remove(...themeClasses);
    if (aparencia.tema === 'escuro') root.classList.add('cp-dark');
    if (aparencia.escalaFonte === 'grande') root.classList.add('cp-fs-grande');
    if (aparencia.escalaFonte === 'extra') root.classList.add('cp-fs-extra');
    if (aparencia.densidade === 'compacta') root.classList.add('cp-compacta');
  }, [
    aparencia.tema,
    aparencia.escalaFonte,
    aparencia.densidade,
  ]);

  const [products, setProducts] = useState<Product[]>(() =>
    initialOperations?.products ?? getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS)
  );

  const [sectors, setSectors] = useState<string[]>(() =>
    getStored<string[]>(STORAGE_KEYS.SECTORS, DEFAULT_SECTORS)
  );

  const [tables, setTables] = useState<Table[]>(() =>
    initialOperations?.tables ?? getStored<Table[]>(STORAGE_KEYS.TABLES, createInitialTables())
  );

  const [sales, setSales] = useState<Sale[]>(() =>
    initialOperations?.sales ?? getStored<Sale[]>(STORAGE_KEYS.SALES, createInitialSales())
  );

  const [customers, setCustomers] = useState<Customer[]>(() =>
    getStored<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS)
  );

  const [deliverers, setDeliverers] = useState<Deliverer[]>(() =>
    getStored<Deliverer[]>(STORAGE_KEYS.DELIVERERS, INITIAL_DELIVERERS)
  );

  const [employees, setEmployees] = useState<Employee[]>(() =>
    getStored<Employee[]>(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES)
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    getStored<Supplier[]>(STORAGE_KEYS.SUPPLIERS, INITIAL_SUPPLIERS)
  );

  const [apps, setApps] = useState<AppIntegration[]>(() =>
    getStored<AppIntegration[]>(STORAGE_KEYS.APPS, INITIAL_APPS)
  );

  const [kitchenOrders, setKitchenOrders] = useState<KitchenOrder[]>(() =>
    getStored<KitchenOrder[]>(STORAGE_KEYS.KITCHEN_ORDERS, createInitialKitchenOrders())
  );

  // Comandas avulsas (Balcão/Delivery) + numeração sequencial
  const [comandas, setComandas] = useState<ComandaAvulsa[]>(
    () => initialComandas.comandas
  );
  const [proximoNumeroComanda, setProximoNumeroComanda] = useState<number>(
    () => initialComandas.proximoNumeroComanda
  );

  // Active Context for PDV and Payment
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);
  /** Qual comanda o caixa tem aberta no PDV (mesa ou avulsa) — usada pelo F2. */
  const [contextoPdv, setContextoPdv] = useState<
    { tipo: 'mesa'; numero: number } | { tipo: 'avulsa'; id: string | null }
  >({ tipo: 'mesa', numero: 1 });
  const [currentOrderForPayment, setCurrentOrderForPayment] = useState<{
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
  } | null>(null);

  // Print Ticket Modal State
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    ticketType: TicketType;
    mesa?: number | string;
    clienteNome?: string;
    clienteTelefone?: string;
    clienteEndereco?: string;
    atendente?: string;
    itens: OrderItem[];
    subtotal: number;
    taxaServicoValor?: number;
    taxaServicoPercent?: number;
    descontoValor?: number;
    totalLiquido: number;
    pagamentos?: Sale['pagamentos'];
    troco?: number;
    codigoVenda?: string;
    observacoes?: string;
    dataHora?: string;
  }>({
    isOpen: false,
    ticketType: 'cupom_venda',
    itens: [],
    subtotal: 0,
    totalLiquido: 0,
  });

  useEffect(() => {
    if (!externalChange) setStored(STORAGE_KEYS.OPERATIONS, { products, tables, sales, comandas, proximoNumeroComanda });
  }, [products, tables, sales, comandas, proximoNumeroComanda, externalChange]);

  const navigateTab = (tabId: number) => {
    if (tabId === 2 && activeTab !== 2) {
      if (contextoPdv.tipo === 'mesa') {
        const table = tables.find(t => t.numero === contextoPdv.numero);
        setCurrentOrderForPayment(table?.itens.length ? {
          mesa: table.numero,
          itens: table.itens,
          subtotal: orderSubtotal(table.itens),
          atendente: table.garcom,
          tipoAtendimento: 'Mesa',
          numeroComanda: table.numeroComanda,
          clienteNome: table.cliente,
          clienteTelefone: table.clienteTelefone,
          cupomCodigo: table.cupom,
        } : null);
      } else {
        const comanda = contextoPdv.id
          ? comandas.find(c => c.id === contextoPdv.id)
          : undefined;
        setCurrentOrderForPayment(comanda?.itens.length ? {
          mesa: comanda.id,
          itens: comanda.itens,
          subtotal: orderSubtotal(comanda.itens),
          atendente: comanda.garcom,
          tipoAtendimento: comanda.tipo,
          numeroComanda: comanda.numero,
          comandaId: comanda.id,
          clienteNome: comanda.clienteNome,
          clienteTelefone: comanda.clienteTelefone,
          enderecoEntrega: comanda.endereco,
          cupomCodigo: comanda.cupom,
        } : null);
      }
    }
    setActiveTab(tabId);
  };

  // LocalStorage sync effects
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.CONFIG, config); }, [config, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.PRODUCTS, products); }, [products, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.SECTORS, sectors); }, [sectors, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.TABLES, tables); }, [tables, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.SALES, sales); }, [sales, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.CUSTOMERS, customers); }, [customers, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.DELIVERERS, deliverers); }, [deliverers, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.EMPLOYEES, employees); }, [employees, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.SUPPLIERS, suppliers); }, [suppliers, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.APPS, apps); }, [apps, externalChange]);
  useEffect(() => { if (!externalChange) setStored(STORAGE_KEYS.KITCHEN_ORDERS, kitchenOrders); }, [kitchenOrders, externalChange]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (printModalState.isOpen && e.key !== 'Escape') return;
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab(1);
      } else if (e.key === 'F2') {
        e.preventDefault();
        navigateTab(2);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setActiveTab(11);
      } else if (e.key === 'Escape') {
        if (printModalState.isOpen) {
          setPrintModalState((prev) => ({ ...prev, isOpen: false }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printModalState.isOpen, tables, selectedTableNumber, activeTab]);

  // Save items in table
  const handleSaveTableItems = (
    tableNum: number,
    items: OrderItem[],
    waiterName?: string
  ) => {
    const total = items.reduce((acc, it) => acc + it.valorTotal, 0);
    // Primeiro lançamento da mesa recebe o número sequencial da comanda.
    const tAtual = tables.find((t) => t.numero === tableNum);
    const precisaNumero = items.length > 0 && !!tAtual && !tAtual.numeroComanda;
    setTables((prev) =>
      prev.map((t) => {
        if (t.numero === tableNum) {
          return {
            ...t,
            itens: items,
            total,
            status: items.length > 0 ? (t.status === 'livre' ? 'ocupada' : t.status) : 'livre',
            garcom: waiterName || t.garcom || employees[0]?.nome,
            abertura: items.length > 0 ? (t.abertura || new Date().toISOString()) : undefined,
            ...(precisaNumero ? { numeroComanda: proximoNumeroComanda } : {}),
            ...(items.length === 0 ? { garcom: undefined, cliente: undefined, observacaoMesa: undefined, clienteTelefone: undefined, cupom: undefined, numeroComanda: undefined } : {}),
          };
        }
        return t;
      })
    );
    if (precisaNumero) {
      setProximoNumeroComanda((n) => n + 1);
    }
  };

  // Dados de contexto da mesa (cliente, telefone, cupom) sem mexer nos itens
  const handleUpdateTableContext = (
    tableNum: number,
    patch: Partial<Pick<Table, 'cliente' | 'clienteTelefone' | 'cupom'>>
  ) => {
    setTables((prev) =>
      prev.map((t) => (t.numero === tableNum ? { ...t, ...patch } : t))
    );
  };

  // Aplica cupom de desconto em uma comanda avulsa
  const handleUpdateComandaContext = (
    comandaId: string,
    patch: Partial<Pick<ComandaAvulsa, 'cupom' | 'clienteNome' | 'clienteTelefone' | 'endereco' | 'garcom'>>
  ) => {
    setComandas((prev) =>
      prev.map((c) => (c.id === comandaId ? { ...c, ...patch } : c))
    );
  };

  // Cria uma comanda avulsa (Balcão ou Delivery) e devolve o objeto criado
  const handleCreateComandaAvulsa = (dados: {
    tipo: 'Balcão' | 'Delivery';
    clienteNome?: string;
    clienteTelefone?: string;
    endereco?: string;
    garcom?: string;
  }): ComandaAvulsa => {
    const nova: ComandaAvulsa = {
      id: `CMD-${crypto.randomUUID()}`,
      numero: proximoNumeroComanda,
      tipo: dados.tipo,
      clienteNome: dados.clienteNome?.trim() || undefined,
      clienteTelefone: dados.clienteTelefone?.trim() || undefined,
      endereco: dados.tipo === 'Delivery' ? dados.endereco?.trim() || undefined : undefined,
      garcom: dados.garcom || employees[0]?.nome,
      itens: [],
      subtotal: 0,
      abertura: new Date().toISOString(),
    };
    setComandas((prev) => [nova, ...prev]);
    setProximoNumeroComanda((n) => n + 1);
    return nova;
  };

  // Salva (upsert) uma comanda avulsa inteira
  const handleSaveComanda = (comanda: ComandaAvulsa) => {
    setComandas((prev) => {
      const idx = prev.findIndex((c) => c.id === comanda.id);
      if (idx < 0) return [comanda, ...prev];
      const next = [...prev];
      next[idx] = comanda;
      return next;
    });
  };

  // Cancela/exclui uma comanda avulsa (só se vazia ou confirmado)
  const handleDeleteComanda = (comandaId: string) => {
    setComandas((prev) => prev.filter((c) => c.id !== comandaId));
  };

  // Move a comanda de uma mesa para outra (mesa destino precisa estar livre)
  const handleTransferTable = (deNumero: number, paraNumero: number): boolean => {
    const origem = tables.find((t) => t.numero === deNumero);
    const destino = tables.find((t) => t.numero === paraNumero);
    if (!origem || !destino) return false;
    if (origem.itens.length === 0) {
      alert('A mesa de origem não tem itens para mover.');
      return false;
    }
    if (destino.itens.length > 0) {
      alert(`A Mesa #${paraNumero} já tem uma comanda aberta. Libere ou pague a destino antes de mover.`);
      return false;
    }
    setTables((prev) =>
      prev.map((t) => {
        if (t.numero === deNumero) {
          return { numero: t.numero, status: 'livre', itens: [], total: 0 };
        }
        if (t.numero === paraNumero) {
          return {
            ...t,
            itens: origem.itens,
            total: origem.total,
            status: origem.status === 'livre' ? 'ocupada' : origem.status,
            garcom: origem.garcom || t.garcom,
            cliente: origem.cliente,
            clienteTelefone: origem.clienteTelefone,
            abertura: origem.abertura || new Date().toISOString(),
            observacaoMesa: origem.observacaoMesa,
            cozinhaEnviada: origem.cozinhaEnviada,
            cupom: origem.cupom,
            numeroComanda: origem.numeroComanda,
          };
        }
        return t;
      })
    );
    return true;
  };

  // Registra cancelamento de itens já enviados à cozinha (auditoria visível)
  const handleCancelKitchenItems = (
    contexto: { mesa?: number; comandaId?: string },
    cancelados: { descricao: string; quantidade: number; motivo?: string }[]
  ) => {
    const identificador =
      typeof contexto.mesa === 'number'
        ? `Mesa #${contexto.mesa}`
        : contexto.comandaId
        ? identificadorComanda(comandas.find((c) => c.id === contexto.comandaId))
        : null;
    if (!identificador || cancelados.length === 0) return;
    const agora = new Date().toISOString();
    setKitchenOrders((prev) =>
      prev
        .filter((k) => (k.status === 'novo' || k.status === 'preparo') && k.origemIdentificador === identificador)
        .map((k) => ({
          ...k,
          cancelamentos: [
            ...(k.cancelamentos || []),
            ...cancelados.map((c) => ({ ...c, dataHora: agora })),
          ],
        }))
    );
  };

  // Ajusta o controle de "já enviado à cozinha" depois de um cancelamento
  const handleAdjustSentItems = (
    contexto: { mesa?: number; comandaId?: string },
    itemId: string,
    novaQuantidade: number
  ) => {
    if (typeof contexto.mesa === 'number') {
      setTables((prev) =>
        prev.map((t) =>
          t.numero === contexto.mesa
            ? {
                ...t,
                cozinhaEnviada: {
                  ...t.cozinhaEnviada,
                  [itemId]: Math.max(0, novaQuantidade),
                },
              }
            : t
        )
      );
    } else if (contexto.comandaId) {
      setComandas((prev) =>
        prev.map((c) =>
          c.id === contexto.comandaId
            ? {
                ...c,
                cozinhaEnviada: {
                  ...c.cozinhaEnviada,
                  [itemId]: Math.max(0, novaQuantidade),
                },
              }
            : c
        )
      );
    }
  };

  // Divide a comanda: itens marcados vão para uma nova comanda de Balcão
  const handleDividirComanda = (
    origem: { mesa?: number; comandaId?: string },
    itensSeparados: OrderItem[]
  ): ComandaAvulsa | null => {
    if (itensSeparados.length === 0) {
      alert('Selecione ao menos um item para separar.');
      return null;
    }
    const numero = proximoNumeroComanda;
    const nova: ComandaAvulsa = {
      id: `CMD-${crypto.randomUUID()}`,
      numero,
      tipo: 'Balcão',
      itens: itensSeparados,
      subtotal: itensSeparados.reduce((acc, it) => acc + it.valorTotal, 0),
      garcom:
        typeof origem.mesa === 'number'
          ? tables.find((t) => t.numero === origem.mesa)?.garcom
          : comandas.find((c) => c.id === origem.comandaId)?.garcom,
      abertura: new Date().toISOString(),
    };
    setComandas((prev) => [nova, ...prev]);
    setProximoNumeroComanda((n) => n + 1);
    return nova;
  };

  // Update table status
  const handleUpdateTableStatus = (tableNum: number, status: Table['status']) => {
    setTables((prev) =>
      prev.map((t) => (t.numero === tableNum ? { ...t, status } : t))
    );
  };

  // Release table completely
  const handleReleaseTable = (tableNum: number) => {
    const table = tables.find(t => t.numero === tableNum);
    if (table?.itens.length) { alert('Esta mesa tem itens não pagos. Use Fechar / Pagar ou cancele os itens no caixa antes de liberar.'); return; }
    setTables((prev) =>
      prev.map((t) =>
        t.numero === tableNum
          ? {
              numero: tableNum,
              status: 'livre',
              itens: [],
              total: 0,
            }
          : t
      )
    );
  };

  // Save table observation (quick note)
  const handleSaveTableObservation = (tableNum: number, note: string) => {
    setTables((prev) =>
      prev.map((t) => (t.numero === tableNum ? { ...t, observacaoMesa: note } : t))
    );
  };

  // Navigate to Payment from PDV or Tables
  const handleGoToPayment = (orderData: {
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
  }) => {
    setCurrentOrderForPayment(orderData);
    setActiveTab(2);
  };

  // Finish Sale
  const saleInProgress = useRef(false);
  const handleFinishSale = (newSale: Sale): boolean => {
    if (saleInProgress.current || externalChange) {
      alert('Outra aba alterou o caixa ou uma venda está em andamento. Recarregue antes de continuar.');
      return false;
    }
    saleInProgress.current = true;
    try {
      const next = completeSale(newSale, sales, tables, products, comandas);
      // Do not release a table or report success unless the entire transaction is persisted.
      if (!setStored(STORAGE_KEYS.OPERATIONS, next)) throw new Error('Não foi possível salvar a venda. A mesa não foi liberada. Faça backup e verifique o armazenamento do navegador.');
      setSales(next.sales); setTables(next.tables); setProducts(next.products); setComandas(next.comandas);
      handleOpenReceiptPrint(newSale);
      setCurrentOrderForPayment(null);
      return true;
    } catch (error) { alert((error as Error).message); return false; }
    finally { saleInProgress.current = false; }
  };

  // Print Table Pre-bill (isolated table printing; também serve a comandas avulsas)
  const handlePrintTableTicket = (
    mesaNum: number | string,
    items: OrderItem[]
  ) => {
    const sub = items.reduce((acc, it) => acc + it.valorTotal, 0);
    const tableObj = typeof mesaNum === 'number' ? tables.find((t) => t.numero === mesaNum) : null;
    const comandaObj = typeof mesaNum === 'number' ? undefined : comandas.find((c) => c.id === mesaNum);
    const taxaServicoPercent = config.taxaServicoPadraoPercent ?? 10;
    const taxaServicoValor = Number(((sub * taxaServicoPercent) / 100).toFixed(2));
    const totalLiquido = sub + taxaServicoValor;

    setPrintModalState({
      isOpen: true,
      ticketType: 'conferencia_mesa',
      mesa: tableObj ? mesaNum : (comandaObj ? `${comandaObj.tipo} #${comandaObj.numero}` : mesaNum),
      atendente: tableObj?.garcom || comandaObj?.garcom || config.usuarioAtual,
      itens: items,
      subtotal: sub,
      taxaServicoPercent,
      taxaServicoValor,
      totalLiquido,
    });
  };

  // Print Finished Sale Receipt
  const handleOpenReceiptPrint = (sale: Sale) => {
    setPrintModalState({
      isOpen: true,
      ticketType: 'cupom_venda',
      mesa:
        typeof sale.mesa === 'number'
          ? sale.mesa
          : sale.numeroComanda
          ? `${sale.tipoAtendimento} #${sale.numeroComanda}`
          : sale.mesa,
      clienteNome: sale.clienteNome,
      atendente: sale.atendente,
      itens: sale.itens,
      subtotal: sale.subtotal,
      taxaServicoPercent: sale.taxaServicoPercent,
      taxaServicoValor: sale.taxaServicoValor,
      descontoValor: sale.descontoValor,
      totalLiquido: sale.totalLiquido,
      pagamentos: sale.pagamentos,
      troco: sale.troco,
      codigoVenda: sale.id,
      dataHora: sale.dataHora,
      observacoes: sale.observacoes,
    });
  };

  // Print Kitchen Ticket
  const handlePrintKitchenOrder = (kOrder: KitchenOrder) => {
    setPrintModalState({
      isOpen: true,
      ticketType: 'cozinha',
      mesa: kOrder.origemIdentificador,
      clienteNome: kOrder.clienteNome,
      clienteTelefone: kOrder.clienteTelefone,
      clienteEndereco: kOrder.clienteEndereco,
      itens: kOrder.itens,
      subtotal: kOrder.total,
      totalLiquido: kOrder.total,
      codigoVenda: kOrder.numeroPedido,
      dataHora: kOrder.dataHora,
      observacoes: kOrder.observacoes,
    });
  };

  // Send to kitchen directly from PDV (mesa ou comanda avulsa)
  const handleSendToKitchenFromPdv = (orderData: {
    mesa: number | string;
    itens: OrderItem[];
    observacao?: string;
  }) => {
    const tableObj = typeof orderData.mesa === 'number' ? tables.find((t) => t.numero === orderData.mesa) : null;
    const comandaObj = typeof orderData.mesa === 'number' ? undefined : comandas.find((c) => c.id === orderData.mesa);
    const enviadas = tableObj?.cozinhaEnviada ?? comandaObj?.cozinhaEnviada ?? {};
    const pendingItems = orderData.itens.map(item => {
      const qty = Math.max(0, item.quantidade - (enviadas[item.id] ?? 0));
      return { ...item, quantidade: qty, valorTotal: Number((qty * item.precoUnitario).toFixed(2)) };
    }).filter(item => item.quantidade > 0);
    if (!pendingItems.length) { alert('Todos os itens desta comanda já foram enviados para a cozinha.'); return false; }

    const origem: KitchenOrder['origem'] = tableObj ? 'Mesa' : comandaObj?.tipo === 'Delivery' ? 'Delivery' : 'Balcão';
    const identificador = tableObj
      ? `Mesa #${tableObj.numero}`
      : identificadorComanda(comandaObj) ?? 'Balcão';
    const clienteNome = tableObj?.cliente ?? comandaObj?.clienteNome ?? identificador;
    const novoNumero = origem === 'Mesa' ? `MESA-${tableObj!.numero}` : `AVL-${comandaObj!.numero}`;

    const newKOrder: KitchenOrder = {
      id: `k-${Date.now()}`,
      numeroPedido: novoNumero,
      origem,
      origemIdentificador: identificador,
      clienteNome,
      clienteTelefone: tableObj?.clienteTelefone ?? comandaObj?.clienteTelefone,
      clienteEndereco: comandaObj?.endereco,
      itens: pendingItems,
      total: pendingItems.reduce((acc, it) => acc + it.valorTotal, 0),
      dataHora: new Date().toISOString(),
      status: 'novo',
      observacoes: orderData.observacao,
    };
    setKitchenOrders((prev) => [newKOrder, ...prev]);
    const envioMap = Object.fromEntries(
      orderData.itens.map(item => [item.id, Math.max(item.quantidade, enviadas[item.id] ?? 0)])
    );
    if (tableObj) {
      setTables(prev => prev.map(t => t.numero === tableObj.numero ? {
        ...t, cozinhaEnviada: { ...t.cozinhaEnviada, ...envioMap },
      } : t));
    } else if (comandaObj) {
      setComandas(prev => prev.map(c => c.id === comandaObj.id ? {
        ...c, cozinhaEnviada: { ...c.cozinhaEnviada, ...envioMap },
      } : c));
    }
    return true;
  };

  // Clear daily sales (Zerar Caixa)
  const handleClearDailySales = () => {
    const backup = Object.fromEntries(Object.keys(localStorage).filter(k => k.startsWith('comandapro_')).map(k => [k, localStorage.getItem(k)]));
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data: backup }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a'); anchor.href = url;
    anchor.download = `comandapro-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const occupiedTablesCount = tables.filter((t) => t.status === 'ocupada').length;
  const kitchenPendingCount = kitchenOrders.filter((k) => k.status === 'novo' || k.status === 'preparo').length;

  if (accessLicense.status !== 'active' || !accessLicense.license) {
    return (
      <AccessGate
        status={accessLicense.status}
        message={accessLicense.message}
        onActivate={accessLicense.activate}
      />
    );
  }

  return (
    <div
   className={`min-h-screen flex flex-col antialiased selection:bg-orange-500 selection:text-white cp-theme ${
    aparencia.tema === 'escuro' ? 'cp-dark' : ''
   } ${
    aparencia.escalaFonte === 'grande'
     ? 'cp-fs-grande'
     : aparencia.escalaFonte === 'extra'
     ? 'cp-fs-extra'
     : ''
   } ${aparencia.densidade === 'compacta' ? 'cp-compacta' : ''}`}
    >
      {(storageError || externalChange) && <div role="alert" className="bg-rose-700 text-white p-3 text-sm font-semibold">
        {externalChange ? 'O caixa foi alterado em outra aba. Recarregue esta página antes de continuar; use somente uma aba por caixa.' : 'Falha ao salvar dados neste navegador. Não feche a página. Faça backup e verifique o espaço disponível.'}
      </div>}
      {/* Top Header Bar */}
      <Header
        config={config}
        tables={tables}
        sales={sales}
        licenseVerifiedAt={accessLicense.license.verifiedAt}
        licenseOffline={accessLicense.offline}
      />

      {/* Main Body: Left Sidebar + Tab Workspace */}
      <div inert={externalChange} className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={navigateTab}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          occupiedTablesCount={occupiedTablesCount}
          kitchenPendingCount={kitchenPendingCount}
          hiddenTabs={hiddenTabs}
          onShowAllTabs={() =>
            handleUpdateAppearance({ abasOcultas: [], modoCaixa: false })
          }
        />

        {/* Dynamic Tab Workspace */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1920px] mx-auto p-3 sm:p-5 lg:p-6">
            {activeTab === 1 && (
              <Tab1Pdv
                products={products}
                tables={tables}
                comandas={comandas}
                employees={employees}
                sales={sales}
                proximoNumeroComanda={proximoNumeroComanda}
                onSaveTableItems={handleSaveTableItems}
                onGoToPayment={handleGoToPayment}
                onSendToKitchen={handleSendToKitchenFromPdv}
                onPrintTableTicket={handlePrintTableTicket}
                onNavigateTab={navigateTab}
                config={config}
                selectedTableNumber={selectedTableNumber}
                setSelectedTableNumber={setSelectedTableNumber}
                onSaveTableObservation={handleSaveTableObservation}
                onUpdateTableContext={handleUpdateTableContext}
                onCreateComandaAvulsa={handleCreateComandaAvulsa}
                onSaveComanda={handleSaveComanda}
                onDeleteComanda={handleDeleteComanda}
                onUpdateComandaContext={handleUpdateComandaContext}
                onTransferTable={handleTransferTable}
                onDividirComanda={handleDividirComanda}
                onCancelKitchenItems={handleCancelKitchenItems}
                onAdjustSentItems={handleAdjustSentItems}
                onContextChange={setContextoPdv}
                onUpdateTableStatus={handleUpdateTableStatus}
                onUpdateAppearance={handleUpdateAppearance}
              />
            )}

            {activeTab === 2 && (
              <Tab2Pagamento
                currentOrder={currentOrderForPayment}
                employees={employees}
                config={config}
                onFinishSale={handleFinishSale}
                onNavigateTab={navigateTab}
                onOpenReceiptPrint={handleOpenReceiptPrint}
              />
            )}

            {activeTab === 3 && (
              <Tab3Relatorios
                sales={sales}
                config={config}
                onClearDailySales={handleClearDailySales}
                onOpenReceiptPrint={handleOpenReceiptPrint}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 4 && (
              <Tab4Configuracao
                config={config}
                onSaveConfig={(updated) => setConfig(updated)}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 5 && (
              <Tab5Estoque
                products={products}
                sectors={sectors}
                config={config}
                onSaveProducts={(prods) => setProducts(prods)}
                onSaveSectors={(sec) => setSectors(sec)}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 6 && (
              <Tab6Financeiro
                sales={sales}
                config={config}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 7 && (
              <Tab7Graficos
                sales={sales}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 8 && (
              <Tab8Mesas
                tables={tables}
                config={config}
                onSelectTableForPdv={(tableNum) => {
                  setSelectedTableNumber(tableNum);
                  setActiveTab(1);
                }}
                onGoToPayment={handleGoToPayment}
                onPrintTableTicket={handlePrintTableTicket}
                onUpdateTableStatus={handleUpdateTableStatus}
                onReleaseTable={handleReleaseTable}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 9 && (
              <Tab9CozinhaDelivery
                orders={kitchenOrders}
                products={products}
                customers={customers}
                deliverers={deliverers}
                onSaveOrders={(orders) => setKitchenOrders(orders)}
                onPrintKitchenOrder={handlePrintKitchenOrder}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 11 && (
              <Tab11ResumoRapido
                sales={sales}
                tables={tables}
                kitchenOrders={kitchenOrders}
                onNavigateTab={navigateTab}
              />
            )}

            {activeTab === 10 && (
              <Tab10Cadastros
                customers={customers}
                deliverers={deliverers}
                apps={apps}
                suppliers={suppliers}
                employees={employees}
                onSaveCustomers={(data) => setCustomers(data)}
                onSaveDeliverers={(data) => setDeliverers(data)}
                onSaveApps={(data) => setApps(data)}
                onSaveSuppliers={(data) => setSuppliers(data)}
                onSaveEmployees={(data) => setEmployees(data)}
                onNavigateTab={navigateTab}
              />
            )}
          </div>
        </main>
      </div>

      {/* Printable Thermal Receipt / Kitchen Ticket Modal */}
      <PrintTicketModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState((prev) => ({ ...prev, isOpen: false }))}
        ticketType={printModalState.ticketType}
        config={config}
        mesa={printModalState.mesa}
        clienteNome={printModalState.clienteNome}
        clienteTelefone={printModalState.clienteTelefone}
        clienteEndereco={printModalState.clienteEndereco}
        atendente={printModalState.atendente}
        itens={printModalState.itens}
        subtotal={printModalState.subtotal}
        taxaServicoValor={printModalState.taxaServicoValor}
        taxaServicoPercent={printModalState.taxaServicoPercent}
        descontoValor={printModalState.descontoValor}
        totalLiquido={printModalState.totalLiquido}
        pagamentos={printModalState.pagamentos}
        troco={printModalState.troco}
        codigoVenda={printModalState.codigoVenda}
        observacoes={printModalState.observacoes}
        dataHora={printModalState.dataHora}
      />

      {/* Footer with Conta Bahia Contabilidade & v2.0 */}
      <Footer />
    </div>
  );
}

export default App;
