import { useState, useEffect } from 'react';
import {
  AppConfig,
  AppIntegration,
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
  getStored,
  setStored,
} from './utils/storage';
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

export function App() {
  const accessLicense = useAccessLicense();

  // Application State
  const [activeTab, setActiveTab] = useState<number>(1);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

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

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab(1);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab(2);
      } else if (e.key === 'Escape') {
        if (printModalState.isOpen) {
          setPrintModalState((prev) => ({ ...prev, isOpen: false }));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [printModalState.isOpen]);

  // Save items in table
  const handleSaveTableItems = (
    tableNum: number,
    items: OrderItem[],
    waiterName?: string
  ) => {
    const total = items.reduce((acc, it) => acc + it.valorTotal, 0);
    setTables((prev) =>
      prev.map((t) => {
        if (t.numero === tableNum) {
          return {
            ...t,
            itens: items,
            total,
            status: items.length > 0 ? (t.status === 'livre' ? 'ocupada' : t.status) : 'livre',
            garcom: waiterName || t.garcom || employees[0]?.nome,
            abertura: t.abertura || (items.length > 0 ? new Date().toISOString() : undefined),
          };
        }
        return t;
      })
    );
  };

  // Update table status
  const handleUpdateTableStatus = (tableNum: number, status: Table['status']) => {
    setTables((prev) =>
      prev.map((t) => (t.numero === tableNum ? { ...t, status } : t))
    );
  };

  // Release table completely
  const handleReleaseTable = (tableNum: number) => {
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
  const handlePrintTableTicket = (
    mesaNum: number | string,
    items: OrderItem[]
  ) => {
    const sub = items.reduce((acc, it) => acc + it.valorTotal, 0);
    const tableObj = typeof mesaNum === 'number' ? tables.find((t) => t.numero === mesaNum) : null;
    const taxaServicoPercent = config.taxaServicoPadraoPercent || 10;
    const taxaServicoValor = Number(((sub * taxaServicoPercent) / 100).toFixed(2));
    const totalLiquido = sub + taxaServicoValor;

    setPrintModalState({
      isOpen: true,
      ticketType: 'conferencia_mesa',
      mesa: mesaNum,
      atendente: tableObj?.garcom || config.usuarioAtual,
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

  // Clear daily sales (Zerar Caixa)
  const handleClearDailySales = () => {
    setSales([]);
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
    <div className="min-h-screen bg-zinc-100 flex flex-col text-zinc-900 antialiased selection:bg-orange-500 selection:text-white">
      {/* Top Header Bar */}
      <Header
        config={config}
        tables={tables}
        onNavigateTab={(tabId) => setActiveTab(tabId)}
        activeTab={activeTab}
        licenseExpiresAt={accessLicense.license.expiresAt}
        licenseOffline={accessLicense.offline}
      />

      {/* Main Body: Left Sidebar + Tab Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          occupiedTablesCount={occupiedTablesCount}
          kitchenPendingCount={kitchenPendingCount}
        />

        {/* Dynamic Tab Workspace */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6">
          <div className="max-w-[1920px] mx-auto">
            {activeTab === 1 && (
              <Tab1Pdv
                products={products}
                tables={tables}
                onSaveTableItems={handleSaveTableItems}
                onGoToPayment={handleGoToPayment}
                onSendToKitchen={handleSendToKitchenFromPdv}
                onPrintTableTicket={handlePrintTableTicket}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
                config={config}
                selectedTableNumber={selectedTableNumber}
                setSelectedTableNumber={setSelectedTableNumber}
              />
            )}

            {activeTab === 2 && (
              <Tab2Pagamento
                currentOrder={currentOrderForPayment}
                employees={employees}
                config={config}
                onFinishSale={handleFinishSale}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
                onOpenReceiptPrint={handleOpenReceiptPrint}
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
                config={config}
                onSelectTableForPdv={(tableNum) => {
                  setSelectedTableNumber(tableNum);
                  setActiveTab(1);
                }}
                onGoToPayment={handleGoToPayment}
                onPrintTableTicket={handlePrintTableTicket}
                onUpdateTableStatus={handleUpdateTableStatus}
                onReleaseTable={handleReleaseTable}
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

      {/* Footer with Conta Bahia Contabilidade & v2.0 */}
      <Footer />
    </div>
  );
}

export default App;
