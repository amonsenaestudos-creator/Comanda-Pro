import { useState, useEffect, useCallback } from 'react';
import {
  AppConfig,
  AppIntegration,
  CancelamentoMotivo,
  CaixaMovimentoTipo,
  CaixaSessao,
  CancelamentoItem,
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
  STORAGE_KEYS,
  createInitialKitchenOrders,
  createInitialSales,
  createInitialTables,
  getSessionStored,
  getStored,
  setSessionStored,
  setStored,
} from './utils/storage';
import { findOpenCaixa, newId, resumoCaixa } from './utils/caixa';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Footer } from './components/Footer';
import { PrintTicketModal, TicketType } from './components/PrintTicketModal';
import { AccessGate } from './components/AccessGate';
import { LoginOperador } from './components/LoginOperador';
import { useAccessLicense } from './hooks/useAccessLicense';

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
import { Tab11Caixa } from './components/tabs/Tab11Caixa';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function App() {
  const accessLicense = useAccessLicense();

  // Operador (funcionário) logado — obrigatório para usar o sistema
  const [operador, setOperador] = useState<Employee | null>(() =>
    getSessionStored<Employee | null>(STORAGE_KEYS.OPERATOR_SESSION, null)
  );

  const [activeTab, setActiveTab] = useState<number>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  const [config, setConfig] = useState<AppConfig>(() =>
    getStored<AppConfig>(STORAGE_KEYS.CONFIG, DEFAULT_CONFIG)
  );

  const [products, setProducts] = useState<Product[]>(() =>
    getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS)
  );

  const [sectors, setSectors] = useState<string[]>(() =>
    getStored<string[]>(STORAGE_KEYS.SECTORS, DEFAULT_SECTORS)
  );

  const [tables, setTables] = useState<Table[]>(() =>
    getStored<Table[]>(STORAGE_KEYS.TABLES, createInitialTables())
  );

  const [sales, setSales] = useState<Sale[]>(() =>
    getStored<Sale[]>(STORAGE_KEYS.SALES, createInitialSales())
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

  const [caixaSessions, setCaixaSessions] = useState<CaixaSessao[]>(() =>
    getStored<CaixaSessao[]>(STORAGE_KEYS.CAIXA_SESSIONS, [])
  );

  const [cancellations, setCancellations] = useState<CancelamentoItem[]>(() =>
    getStored<CancelamentoItem[]>(STORAGE_KEYS.CANCELLATIONS, [])
  );

  // Active Context for PDV and Payment
  const [selectedTableNumber, setSelectedTableNumber] = useState<number>(1);
  const [currentOrderForPayment, setCurrentOrderForPayment] = useState<{
    mesa: number | string;
    itens: OrderItem[];
    subtotal: number;
    atendente?: string;
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
  }>({
    isOpen: false,
    ticketType: 'cupom_venda',
    itens: [],
    subtotal: 0,
    totalLiquido: 0,
  });

  // LocalStorage sync effects
  useEffect(() => setStored(STORAGE_KEYS.CONFIG, config), [config]);
  useEffect(() => setStored(STORAGE_KEYS.PRODUCTS, products), [products]);
  useEffect(() => setStored(STORAGE_KEYS.SECTORS, sectors), [sectors]);
  useEffect(() => setStored(STORAGE_KEYS.TABLES, tables), [tables]);
  useEffect(() => setStored(STORAGE_KEYS.SALES, sales), [sales]);
  useEffect(() => setStored(STORAGE_KEYS.CUSTOMERS, customers), [customers]);
  useEffect(() => setStored(STORAGE_KEYS.DELIVERERS, deliverers), [deliverers]);
  useEffect(() => setStored(STORAGE_KEYS.EMPLOYEES, employees), [employees]);
  useEffect(() => setStored(STORAGE_KEYS.SUPPLIERS, suppliers), [suppliers]);
  useEffect(() => setStored(STORAGE_KEYS.APPS, apps), [apps]);
  useEffect(() => setStored(STORAGE_KEYS.KITCHEN_ORDERS, kitchenOrders), [kitchenOrders]);
  useEffect(() => setStored(STORAGE_KEYS.CAIXA_SESSIONS, caixaSessions), [caixaSessions]);
  useEffect(() => setStored(STORAGE_KEYS.CANCELLATIONS, cancellations), [cancellations]);
  useEffect(() => setSessionStored(STORAGE_KEYS.OPERATOR_SESSION, operador), [operador]);

  const caixaAberto = findOpenCaixa(caixaSessions);

  // Global Keyboard Shortcuts (F1 PDV, F2 Pagamento, F11 Caixa)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!operador) return;
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab(1);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab(2);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setActiveTab(11);
      } else if (e.key === 'Escape') {
        if (printModalState.isOpen) {
          setPrintModalState((prev) => ({ ...prev, isOpen: false }));
        }
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printModalState.isOpen, operador]);

  // Operador: entrada e saída
  const handleLogin = useCallback((emp: Employee) => {
    setOperador(emp);
    setActiveTab(1);
  }, []);

  const handleLogout = () => {
    if (window.confirm('Trocar de operador? Os dados em aberto continuam salvos.')) {
      setOperador(null);
      setMobileMenuOpen(false);
    }
  };

  // Save items in table (lançamento de itens da comanda)
  const handleSaveTableItems = (tableNum: number, items: OrderItem[], waiterName?: string) => {
    const total = items.reduce((acc, it) => acc + it.valorTotal, 0);
    setTables((prev) =>
      prev.map((t) => {
        if (t.numero !== tableNum) return t;
        if (items.length === 0) {
          return { numero: tableNum, status: 'livre', itens: [], total: 0, observacaoMesa: t.observacaoMesa };
        }
        return {
          ...t,
          itens: items,
          total,
          status: t.status === 'livre' ? 'ocupada' : t.status,
          garcom: waiterName || t.garcom || operador?.nome,
          abertura: t.abertura || new Date().toISOString(),
        };
      })
    );
  };

  // Cancela parte ou todo um item da mesa e registra o motivo (controle gerencial)
  const handleCancelItem = (
    tableNum: number,
    item: OrderItem,
    quantidade: number,
    motivo: CancelamentoMotivo
  ) => {
    setTables((prev) =>
      prev.map((t) => {
        if (t.numero !== tableNum) return t;
        const alvo = t.itens.find((it) => it.id === item.id);
        if (!alvo) return t;
        const qtyCancel = Math.min(Math.max(1, quantidade), alvo.quantidade);
        const restante = alvo.quantidade - qtyCancel;
        const novosItens: OrderItem[] =
          restante <= 0
            ? t.itens.filter((it) => it.id !== alvo.id)
            : t.itens.map((it) =>
                it.id === alvo.id
                  ? { ...it, quantidade: restante, valorTotal: round2(restante * it.precoUnitario) }
                  : it
              );
        const total = round2(novosItens.reduce((acc, it) => acc + it.valorTotal, 0));
        if (novosItens.length === 0) {
          return { numero: tableNum, status: 'livre', itens: [], total: 0, observacaoMesa: t.observacaoMesa };
        }
        return { ...t, itens: novosItens, total };
      })
    );

    const qtyCancel = Math.min(Math.max(1, quantidade), item.quantidade);
    setCancellations((prev) => [
      {
        id: newId('canc'),
        dataHora: new Date().toISOString(),
        mesa: tableNum,
        descricao: item.descricao,
        quantidade: qtyCancel,
        valor: round2(qtyCancel * item.precoUnitario),
        motivo,
        operador: operador?.nome || config.usuarioAtual,
      },
      ...prev,
    ]);
  };

  // Transfere a comanda inteira de uma mesa ocupada para uma mesa livre
  const handleTransferTable = (from: number, to: number) => {
    if (from === to) return;
    setTables((prev) => {
      const src = prev.find((t) => t.numero === from);
      const dst = prev.find((t) => t.numero === to);
      if (!src || !dst || src.itens.length === 0 || dst.status !== 'livre' || dst.itens.length > 0) {
        return prev;
      }
      return prev.map((t) => {
        if (t.numero === to) return { ...src, numero: to };
        if (t.numero === from) return { numero: from, status: 'livre', itens: [], total: 0 };
        return t;
      });
    });
    setSelectedTableNumber(to);
  };

  // Update table status
  const handleUpdateTableStatus = (tableNum: number, status: Table['status']) => {
    setTables((prev) => prev.map((t) => (t.numero === tableNum ? { ...t, status } : t)));
  };

  // Release table completely
  const handleReleaseTable = (tableNum: number) => {
    setTables((prev) =>
      prev.map((t) =>
        t.numero === tableNum ? { numero: tableNum, status: 'livre', itens: [], total: 0 } : t
      )
    );
  };

  // Save table observation (quick note)
  const handleSaveTableObservation = (tableNum: number, note: string) => {
    setTables((prev) => prev.map((t) => (t.numero === tableNum ? { ...t, observacaoMesa: note } : t)));
  };

  // Navigate to Payment from PDV or Tables
  const handleGoToPayment = (orderData: {
    mesa: number | string;
    itens: OrderItem[];
    subtotal: number;
    atendente?: string;
  }) => {
    setCurrentOrderForPayment(orderData);
    setActiveTab(2);
  };

  // ----- Caixa -----
  const handleOpenCaixa = (fundoInicial: number) => {
    if (caixaAberto) return;
    const sessao: CaixaSessao = {
      id: newId('caixa'),
      status: 'aberto',
      operador: operador?.nome || config.usuarioAtual,
      abertura: new Date().toISOString(),
      fundoInicial: round2(fundoInicial),
      movimentos: [],
    };
    setCaixaSessions((prev) => [sessao, ...prev]);
  };

  const handleAddMovimento = (tipo: CaixaMovimentoTipo, valor: number, motivo: string) => {
    if (!caixaAberto) return;
    const id = caixaAberto.id;
    setCaixaSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              movimentos: [
                ...s.movimentos,
                {
                  id: newId('mov'),
                  tipo,
                  valor: round2(valor),
                  motivo,
                  dataHora: new Date().toISOString(),
                  operador: operador?.nome || config.usuarioAtual,
                },
              ],
            }
          : s
      )
    );
  };

  const handleCloseCaixa = (dinheiroContado: number, observacao: string) => {
    if (!caixaAberto) return;
    const resumo = resumoCaixa(caixaAberto, sales);
    const diferenca = round2(dinheiroContado - resumo.dinheiroEsperado);
    const id = caixaAberto.id;
    setCaixaSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              status: 'fechado',
              fechamento: new Date().toISOString(),
              dinheiroContado: round2(dinheiroContado),
              dinheiroEsperado: resumo.dinheiroEsperado,
              diferenca,
              observacaoFechamento: observacao || undefined,
              resumo: {
                vendasCount: resumo.vendasCount,
                totalVendas: resumo.totalVendas,
                porMetodo: resumo.porMetodo,
                sangrias: resumo.sangrias,
                suprimentos: resumo.suprimentos,
              },
            }
          : s
      )
    );
  };

  // Finish Sale
  const handleFinishSale = (newSale: Sale) => {
    setSales((prev) => [newSale, ...prev]);

    // If sale was associated with a table (1 to 50), release the table
    if (typeof newSale.mesa === 'number') {
      handleReleaseTable(newSale.mesa);
    }

    // Open receipt modal automatically for confirmation & print
    handleOpenReceiptPrint(newSale);

    // Reset current order
    setCurrentOrderForPayment(null);
  };

  // Print Table Pre-bill (isolated table printing)
  const handlePrintTableTicket = (mesaNum: number | string, items: OrderItem[]) => {
    const sub = items.reduce((acc, it) => acc + it.valorTotal, 0);
    const tableObj = typeof mesaNum === 'number' ? tables.find((t) => t.numero === mesaNum) : null;
    const taxaServicoPercent = config.taxaServicoPadraoPercent || 10;
    const taxaServicoValor = Number(((sub * taxaServicoPercent) / 100).toFixed(2));
    const totalLiquido = sub + taxaServicoValor;

    setPrintModalState({
      isOpen: true,
      ticketType: 'conferencia_mesa',
      mesa: mesaNum,
      atendente: tableObj?.garcom || operador?.nome || config.usuarioAtual,
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
      mesa: sale.mesa,
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
      observacoes: kOrder.observacoes,
    });
  };

  // Send to kitchen directly from PDV
  const handleSendToKitchenFromPdv = (orderData: {
    mesa: number | string;
    itens: OrderItem[];
    observacao?: string;
  }) => {
    const tableObj = typeof orderData.mesa === 'number' ? tables.find((t) => t.numero === orderData.mesa) : null;
    const newKOrder: KitchenOrder = {
      id: `k-${Date.now()}`,
      numeroPedido: `MESA-${orderData.mesa}`,
      origem: 'Mesa',
      origemIdentificador: `Mesa #${orderData.mesa}`,
      clienteNome: tableObj?.cliente || `Mesa ${orderData.mesa}`,
      itens: orderData.itens,
      total: orderData.itens.reduce((acc, it) => acc + it.valorTotal, 0),
      dataHora: new Date().toISOString(),
      status: 'novo',
      observacoes: orderData.observacao,
    };
    setKitchenOrders((prev) => [newKOrder, ...prev]);
  };

  // Clear daily sales (Zerar Caixa) — os caixas fechados guardam snapshot, então o histórico continua correto
  const handleClearDailySales = () => {
    setSales([]);
  };

  const occupiedTablesCount = tables.filter((t) => t.status === 'ocupada' || t.status === 'conta_solicitada').length;
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

  if (!operador) {
    return (
      <LoginOperador
        employees={employees}
        fallbackName={config.usuarioAtual}
        onLogin={handleLogin}
      />
    );
  }

  // Configuração "operacional": o operador logado é o atendente padrão nas telas de venda
  const configOperacional: AppConfig = { ...config, usuarioAtual: operador.nome };

  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-100 text-zinc-900 antialiased selection:bg-orange-500 selection:text-white">
      <Header
        config={config}
        tables={tables}
        onNavigateTab={(tabId) => setActiveTab(tabId)}
        licenseExpiresAt={accessLicense.license.expiresAt}
        licenseOffline={accessLicense.offline}
        operador={operador}
        caixaAberto={caixaAberto}
        onToggleMenu={() => setMobileMenuOpen(true)}
        onLogout={handleLogout}
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
          occupiedTablesCount={occupiedTablesCount}
          kitchenPendingCount={kitchenPendingCount}
        />

        <main className="min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-6">
            {activeTab === 1 && (
              <Tab1Pdv
                products={products}
                tables={tables}
                onSaveTableItems={handleSaveTableItems}
                onGoToPayment={handleGoToPayment}
                onSendToKitchen={handleSendToKitchenFromPdv}
                onPrintTableTicket={handlePrintTableTicket}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
                onCancelItem={handleCancelItem}
                caixaAberto={Boolean(caixaAberto)}
                config={configOperacional}
                selectedTableNumber={selectedTableNumber}
                setSelectedTableNumber={setSelectedTableNumber}
                onSaveTableObservation={handleSaveTableObservation}
              />
            )}

            {activeTab === 2 && (
              <Tab2Pagamento
                currentOrder={currentOrderForPayment}
                employees={employees}
                config={configOperacional}
                onFinishSale={handleFinishSale}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
                onOpenReceiptPrint={handleOpenReceiptPrint}
                caixaId={caixaAberto?.id}
              />
            )}

            {activeTab === 3 && (
              <Tab3Relatorios
                sales={sales}
                config={config}
                onClearDailySales={handleClearDailySales}
                onOpenReceiptPrint={handleOpenReceiptPrint}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 4 && (
              <Tab4Configuracao
                config={config}
                onSaveConfig={(updated) => setConfig(updated)}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 5 && (
              <Tab5Estoque
                products={products}
                sectors={sectors}
                config={config}
                onSaveProducts={(prods) => setProducts(prods)}
                onSaveSectors={(sec) => setSectors(sec)}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 6 && (
              <Tab6Financeiro
                sales={sales}
                config={config}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 7 && (
              <Tab7Graficos
                sales={sales}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 8 && (
              <Tab8Mesas
                tables={tables}
                config={configOperacional}
                onSelectTableForPdv={(tableNum) => {
                  setSelectedTableNumber(tableNum);
                  setActiveTab(1);
                }}
                onGoToPayment={handleGoToPayment}
                onPrintTableTicket={handlePrintTableTicket}
                onUpdateTableStatus={handleUpdateTableStatus}
                onReleaseTable={handleReleaseTable}
                onTransferTable={handleTransferTable}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
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
                onNavigateTab={(tabId) => setActiveTab(tabId)}
              />
            )}

            {activeTab === 11 && (
              <Tab11Caixa
                sessions={caixaSessions}
                sales={sales}
                tables={tables}
                kitchenOrders={kitchenOrders}
                cancellations={cancellations}
                operador={operador}
                onOpenCaixa={handleOpenCaixa}
                onAddMovimento={handleAddMovimento}
                onCloseCaixa={handleCloseCaixa}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
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
                onNavigateTab={(tabId) => setActiveTab(tabId)}
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
      />

      <Footer />
    </div>
  );
}

export default App;
