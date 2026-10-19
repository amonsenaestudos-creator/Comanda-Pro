import {
  AppConfig,
  AppIntegration,
  CaixaAppearance,
  ComandaAvulsa,
  Customer,
  Deliverer,
  Employee,
  KitchenOrder,
  Product,
  Sale,
  Supplier,
  Table,
} from '../types';

/**
 * Abas que continuam visíveis quando o "Modo Caixa" está ligado.
 * 1 = Frente de Caixa | 2 = Pagamentos | 3 = Relatórios/Fechamento | 11 = Resumo do Caixa
 */
export const CAIXA_TABS = [1, 2, 3, 11];

/** Todas as abas que podem ser escondidas do menu lateral. */
export const HIDABLE_TABS = [4, 5, 6, 7, 8, 9, 10];

export const DEFAULT_APARENCIA: CaixaAppearance = {
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

/** Garante que um config antigo do localStorage receba os campos novos. */
export const resolveAppearance = (stored?: Partial<CaixaAppearance> | null): CaixaAppearance => ({
  ...DEFAULT_APARENCIA,
  ...(stored || {}),
});

export const normalizeConfig = (stored?: Partial<AppConfig> | null): AppConfig => {
  const storedData = (stored || {}) as Partial<AppConfig>;
  return {
    ...DEFAULT_CONFIG,
    ...storedData,
    dadosEmpresa: { ...DEFAULT_CONFIG.dadosEmpresa, ...(storedData.dadosEmpresa || {}) },
    taxasComissao: { ...DEFAULT_CONFIG.taxasComissao, ...(storedData.taxasComissao || {}) },
    aparencia: resolveAppearance(storedData.aparencia),
    cupons: Array.isArray(storedData.cupons) ? storedData.cupons : DEFAULT_CONFIG.cupons,
  };
};

/** Lista final de abas escondidas (modo caixa + escolha manual). */
export const resolveHiddenTabs = (aparencia?: Partial<CaixaAppearance> | null): number[] => {
  const resolved = resolveAppearance(aparencia);
  const manual = (resolved.abasOcultas || []).filter((id) => HIDABLE_TABS.includes(id));
  if (!resolved.modoCaixa) return manual;
  const hiddenByCaixaMode = HIDABLE_TABS.filter((id) => !CAIXA_TABS.includes(id));
  return Array.from(new Set([...manual, ...hiddenByCaixaMode]));
};

export const DEFAULT_CONFIG: AppConfig = {
  dadosEmpresa: {
    cnpj: '06.990.590/0001-23', // Exemplo demonstrativo (Google Brasil ou empresa de teste)
    razaoSocial: 'SABOR & ARTE GASTRONOMIA E EVENTOS LTDA',
    nomeFantasia: 'COMANDAPRO BURGER & RESTO',
    endereco: 'Avenida Tancredo Neves',
    numero: '1632',
    complemento: 'Torre Norte - Sala 801',
    bairro: 'Caminho das Árvores',
    cidade: 'Salvador',
    uf: 'BA',
    cep: '41820-020',
    telefone: '(71) 2136-6312',
    whatsapp: '(71) 98855-4321',
    instagram: '@comandapro_oficial',
    email: 'contato@comandapro.com.br',
  },
  taxasComissao: {
    cartaoCredito: 3.2,
    cartaoDebito: 1.8,
    pix: 0.5,
    aplicativos: 15.0,
    outros: 0.0,
  },
  descontoMaximoPercent: 15,
  taxaServicoPadraoPercent: 10,
  aliquotaImpostoPercent: 5.5,
  mensagemRodape:
    'Obrigado pela preferência! Volte sempre ao ComandaPro Gourmet.\nDocumento Auxiliar de Venda - Não é documento fiscal.',
  chavePix: 'financeiro@comandapro.com.br',
  usuarioAtual: 'Operador 01 - Carlos Eduardo',
  aparencia: DEFAULT_APARENCIA,
  cupons: [{ codigo: 'SABOR10', percentual: 10, ativo: true }],
};

export const DEFAULT_SECTORS = [
  'Alimentos',
  'Bebidas',
  'Salgados',
  'Sucos',
  'Doces',
  'Hambúrgueres',
  'Açaí',
  'Porções',
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    ean: '7891000100011',
    descricao: 'X-Burger Artesanal com Fritas',
    unidade: 'UN',
    precoVenda: 34.9,
    custo: 14.5,
    setor: 'Hambúrgueres',
    estoque: 85,
  },
  {
    id: 'prod-2',
    ean: '7891000100028',
    descricao: 'Smash Burger Duplo Bacon Cheddar',
    unidade: 'UN',
    precoVenda: 38.0,
    custo: 16.0,
    setor: 'Hambúrgueres',
    estoque: 62,
  },
  {
    id: 'prod-3',
    ean: '7891000100035',
    descricao: 'Coca-Cola Lata 350ml Original',
    unidade: 'UN',
    precoVenda: 7.5,
    custo: 3.2,
    setor: 'Bebidas',
    estoque: 140,
  },
  {
    id: 'prod-4',
    ean: '7891000100042',
    descricao: 'Suco Natural Laranja 500ml',
    unidade: 'UN',
    precoVenda: 10.0,
    custo: 3.5,
    setor: 'Sucos',
    estoque: 50,
  },
  {
    id: 'prod-5',
    ean: '7891000100059',
    descricao: 'Açaí na Tigela 500ml Turbinado (Granola+Banana+Nutella)',
    unidade: 'UN',
    precoVenda: 26.5,
    custo: 9.8,
    setor: 'Açaí',
    estoque: 40,
  },
  {
    id: 'prod-6',
    ean: '7891000100066',
    descricao: 'Coxinha Gourmet Frango c/ Catupiry 150g',
    unidade: 'UN',
    precoVenda: 9.5,
    custo: 3.8,
    setor: 'Salgados',
    estoque: 35,
  },
  {
    id: 'prod-7',
    ean: '7891000100073',
    descricao: 'Porção Batata Rústica c/ Alecrim e Páprica 400g',
    unidade: 'UN',
    precoVenda: 28.0,
    custo: 8.5,
    setor: 'Porções',
    estoque: 45,
  },
  {
    id: 'prod-8',
    ean: '7891000100080',
    descricao: 'Cerveja Artesanal IPA 500ml Garrafa',
    unidade: 'UN',
    precoVenda: 18.0,
    custo: 9.0,
    setor: 'Bebidas',
    estoque: 72,
  },
  {
    id: 'prod-9',
    ean: '7891000100097',
    descricao: 'Petit Gâteau de Chocolate c/ Sorvete Creme',
    unidade: 'UN',
    precoVenda: 22.0,
    custo: 7.5,
    setor: 'Doces',
    estoque: 25,
  },
  {
    id: 'prod-10',
    ean: '7891000100103',
    descricao: 'Água Mineral sem Gás 500ml',
    unidade: 'UN',
    precoVenda: 4.5,
    custo: 1.2,
    setor: 'Bebidas',
    estoque: 120,
  },
  {
    id: 'prod-11',
    ean: '7891000100110',
    descricao: 'Pastel Especial de Carne Seca com Queijo Coalho',
    unidade: 'UN',
    precoVenda: 14.0,
    custo: 5.2,
    setor: 'Salgados',
    estoque: 30,
  },
  {
    id: 'prod-12',
    ean: '7891000100127',
    descricao: 'Filé Mignon à Parmegiana Executivo',
    unidade: 'UN',
    precoVenda: 46.0,
    custo: 18.0,
    setor: 'Alimentos',
    estoque: 28,
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cli-1',
    nome: 'Marcos Oliveira Santos',
    telefone: '(71) 99123-4567',
    endereco: 'Rua das Hortênsias, 142 - Apto 302 - Pituba',
    cep: '41810-010',
    cpfCnpj: '012.345.678-90',
  },
  {
    id: 'cli-2',
    nome: 'Fernanda Lima Ribeiro',
    telefone: '(71) 98765-4321',
    endereco: 'Rua Ceará, 850 - Itaigara',
    cep: '41830-450',
    cpfCnpj: '987.654.321-00',
  },
  {
    id: 'cli-3',
    nome: 'Roberto Cavalcanti Mendes',
    telefone: '(71) 99344-1122',
    endereco: 'Alameda das Espatódeas, 55 - Caminho das Árvores',
    cep: '41820-460',
    cpfCnpj: '456.789.123-44',
  },
];

export const INITIAL_DELIVERERS: Deliverer[] = [
  {
    id: 'ent-1',
    nome: 'Tiago Souza da Silva',
    telefone: '(71) 98111-2233',
    endereco: 'Brotas, Salvador - BA',
    cep: '40285-000',
    cpf: '333.444.555-66',
    veiculo: 'Honda CG 160 Titan (Moto)',
  },
  {
    id: 'ent-2',
    nome: 'Lucas Barreto Lima',
    telefone: '(71) 98222-3344',
    endereco: 'Boca do Rio, Salvador - BA',
    cep: '41705-000',
    cpf: '444.555.666-77',
    veiculo: 'Yamaha Fazer 250 (Moto)',
  },
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    nome: 'Carlos Eduardo Silva',
    telefone: '(71) 98877-6655',
    endereco: 'Rio Vermelho, Salvador - BA',
    cep: '41940-000',
    cpf: '123.456.789-10',
    funcao: 'Operador de Caixa & Gerente',
    dataAdmissao: '2023-03-15',
  },
  {
    id: 'emp-2',
    nome: 'Juliana Pires Rocha',
    telefone: '(71) 98711-2299',
    endereco: 'Barra, Salvador - BA',
    cep: '40140-000',
    cpf: '234.567.890-21',
    funcao: 'Garçom / Atendente',
    dataAdmissao: '2024-01-10',
  },
  {
    id: 'emp-3',
    nome: 'Matheus Costa Santana',
    telefone: '(71) 98933-4455',
    endereco: 'Imbuí, Salvador - BA',
    cep: '41720-000',
    cpf: '345.678.901-32',
    funcao: 'Garçom / Salão',
    dataAdmissao: '2024-06-01',
  },
  {
    id: 'emp-4',
    nome: 'Chef Antônio Braga',
    telefone: '(71) 98455-6677',
    endereco: 'Federação, Salvador - BA',
    cep: '40230-000',
    cpf: '456.789.012-43',
    funcao: 'Chefe de Cozinha',
    dataAdmissao: '2022-11-20',
  },
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    razaoSocial: 'DISTRIBUIDORA DE BEBIDAS DO NORDESTE LTDA',
    telefone: '(71) 3344-9988',
    endereco: 'Rodovia BA-526, Km 12 - Simões Filho - BA',
    cep: '43700-000',
    cpfCnpj: '12.345.678/0001-90',
    contato: 'Gilberto - Vendas Bebidas',
  },
  {
    id: 'sup-2',
    razaoSocial: 'FRIGORÍFICO E CARNES GOURMET BRASIL S/A',
    telefone: '(71) 3211-5500',
    endereco: 'Av. Heitor Dias, 2400 - Salvador - BA',
    cep: '40253-000',
    cpfCnpj: '98.765.432/0001-10',
    contato: 'Patrícia - Carnes Nobres',
  },
];

export const INITIAL_APPS: AppIntegration[] = [
  {
    id: 'app-1',
    razaoSocial: 'iFood Brasil Agência de Restaurantes Online S.A.',
    telefone: '0800-000-1234',
    endereco: 'Av. Paulista, 1000 - São Paulo - SP',
    cep: '01310-100',
    cpfCnpj: '14.380.200/0001-21',
    taxaComissao: 12.0,
  },
  {
    id: 'app-2',
    razaoSocial: 'Uber Eats do Brasil Tecnologia Ltda',
    telefone: '0800-000-5678',
    endereco: 'Av. Brigadeiro Faria Lima, 2000 - SP',
    cep: '01451-000',
    cpfCnpj: '17.895.646/0001-87',
    taxaComissao: 14.5,
  },
  {
    id: 'app-3',
    razaoSocial: 'WhatsApp Pedidos Diretos / Balcão',
    telefone: '(71) 98855-4321',
    endereco: 'Canal Próprio Restaurante',
    cep: '41820-020',
    cpfCnpj: '06.990.590/0001-23',
    taxaComissao: 0.0,
  },
];

/** A instalação nova não pode fabricar vendas, contas ocupadas ou produção. */
export function createInitialTables(): Table[] {
  return Array.from({ length: 50 }, (_, i) => ({ numero: i + 1, status: 'livre', itens: [], total: 0 }));
}
export function createInitialSales(): Sale[] { return []; }
export function createInitialKitchenOrders(): KitchenOrder[] { return []; }
export function createInitialComandas(): ComandaAvulsa[] { return []; }
export function createInitialComandaCounter(): number { return 1; }

/** Snapshot operacional: produtos, mesas, comandas avulsas, vendas e contador de comandas. */
export interface OperacoesStore {
  products: Product[];
  tables: Table[];
  sales: Sale[];
  comandas: ComandaAvulsa[];
  proximoNumeroComanda: number;
}

/** Dados antigos (sem comandas) continuam abrindo normalmente. */
export const normalizeOperacoes = (
  stored?: Partial<OperacoesStore> | null
): OperacoesStore => {
  const contador = Number(stored?.proximoNumeroComanda);
  return {
    products: stored?.products ?? [],
    tables: stored?.tables ?? createInitialTables(),
    sales: stored?.sales ?? [],
    comandas: Array.isArray(stored?.comandas) ? stored.comandas : [],
    proximoNumeroComanda: Number.isFinite(contador) && contador > 0 ? contador : 1,
  };
};

const STORAGE_KEYS = {
  OPERATIONS: 'comandapro_operations_v1',
  CONFIG: 'comandapro_config_v2',
  SECTORS: 'comandapro_sectors_v2',
  PRODUCTS: 'comandapro_products_v2',
  TABLES: 'comandapro_tables_v2',
  SALES: 'comandapro_sales_v2',
  CUSTOMERS: 'comandapro_customers_v2',
  DELIVERERS: 'comandapro_deliverers_v2',
  EMPLOYEES: 'comandapro_employees_v2',
  SUPPLIERS: 'comandapro_suppliers_v2',
  APPS: 'comandapro_apps_v2',
  KITCHEN_ORDERS: 'comandapro_kitchen_orders_v2',
};

export const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    const parsed = JSON.parse(raw);
    if (parsed === null || (Array.isArray(defaultVal) && !Array.isArray(parsed))) return defaultVal;
    return parsed;
  } catch {
    return defaultVal;
  }
};

export const setStored = <T>(key: string, val: T): boolean => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
    return true;
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
    window.dispatchEvent(new Event('comandapro-storage-error'));
    return false;
  }
};

export { STORAGE_KEYS };
