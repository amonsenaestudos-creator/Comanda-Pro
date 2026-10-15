import {
  AppConfig,
  AppIntegration,
  Customer,
  Deliverer,
  Employee,
  KitchenOrder,
  Product,
  Sale,
  Supplier,
  Table,
} from '../types';

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
    pin: '1234',
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
    pin: '2222',
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
    pin: '3333',
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
    pin: '4444',
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

export function createInitialTables(): Table[] {
  const tables: Table[] = [];
  for (let i = 1; i <= 50; i++) {
    tables.push({
      numero: i,
      status: 'livre',
      itens: [],
      total: 0,
    });
  }

  // Preload a few active tables for instant rich testing
  // Mesa 3 - Ocupada
  tables[2] = {
    numero: 3,
    status: 'ocupada',
    garcom: 'Juliana Pires Rocha',
    cliente: 'Mesa Família Costa (4 pessoas)',
    abertura: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    itens: [
      {
        id: 'item-3-1',
        productId: 'prod-1',
        ean: '7891000100011',
        descricao: 'X-Burger Artesanal com Fritas',
        unidade: 'UN',
        precoUnitario: 34.9,
        quantidade: 2,
        valorTotal: 69.8,
        observacao: 'Ponto da carne ao ponto + sem cebola em 1',
        setor: 'Hambúrgueres',
      },
      {
        id: 'item-3-2',
        productId: 'prod-3',
        ean: '7891000100035',
        descricao: 'Coca-Cola Lata 350ml Original',
        unidade: 'UN',
        precoUnitario: 7.5,
        quantidade: 2,
        valorTotal: 15.0,
        observacao: 'Com gelo e limão',
        setor: 'Bebidas',
      },
      {
        id: 'item-3-3',
        productId: 'prod-7',
        ean: '7891000100073',
        descricao: 'Porção Batata Rústica c/ Alecrim e Páprica 400g',
        unidade: 'UN',
        precoUnitario: 28.0,
        quantidade: 1,
        valorTotal: 28.0,
        observacao: 'Molho especial à parte',
        setor: 'Porções',
      },
    ],
    total: 112.8,
  };

  // Mesa 7 - Ocupada
  tables[6] = {
    numero: 7,
    status: 'ocupada',
    garcom: 'Matheus Costa Santana',
    cliente: 'Casal Casemiro',
    abertura: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    itens: [
      {
        id: 'item-7-1',
        productId: 'prod-12',
        ean: '7891000100127',
        descricao: 'Filé Mignon à Parmegiana Executivo',
        unidade: 'UN',
        precoUnitario: 46.0,
        quantidade: 2,
        valorTotal: 92.0,
        setor: 'Alimentos',
      },
      {
        id: 'item-7-2',
        productId: 'prod-8',
        ean: '7891000100080',
        descricao: 'Cerveja Artesanal IPA 500ml Garrafa',
        unidade: 'UN',
        precoUnitario: 18.0,
        quantidade: 2,
        valorTotal: 36.0,
        setor: 'Bebidas',
      },
    ],
    total: 128.0,
  };

  // Mesa 12 - Conta Solicitada (Amarelo)
  tables[11] = {
    numero: 12,
    status: 'conta_solicitada',
    garcom: 'Juliana Pires Rocha',
    cliente: 'Dr. Fernando',
    abertura: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    itens: [
      {
        id: 'item-12-1',
        productId: 'prod-2',
        ean: '7891000100028',
        descricao: 'Smash Burger Duplo Bacon Cheddar',
        unidade: 'UN',
        precoUnitario: 38.0,
        quantidade: 1,
        valorTotal: 38.0,
        setor: 'Hambúrgueres',
      },
      {
        id: 'item-12-2',
        productId: 'prod-4',
        ean: '7891000100042',
        descricao: 'Suco Natural Laranja 500ml',
        unidade: 'UN',
        precoUnitario: 10.0,
        quantidade: 1,
        valorTotal: 10.0,
        setor: 'Sucos',
      },
      {
        id: 'item-12-3',
        productId: 'prod-9',
        ean: '7891000100097',
        descricao: 'Petit Gâteau de Chocolate c/ Sorvete Creme',
        unidade: 'UN',
        precoUnitario: 22.0,
        quantidade: 1,
        valorTotal: 22.0,
        setor: 'Doces',
      },
    ],
    total: 70.0,
  };

  // Mesa 18 - Ocupada
  tables[17] = {
    numero: 18,
    status: 'ocupada',
    garcom: 'Matheus Costa Santana',
    abertura: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    itens: [
      {
        id: 'item-18-1',
        productId: 'prod-5',
        ean: '7891000100059',
        descricao: 'Açaí na Tigela 500ml Turbinado (Granola+Banana+Nutella)',
        unidade: 'UN',
        precoUnitario: 26.5,
        quantidade: 2,
        valorTotal: 53.0,
        setor: 'Açaí',
      },
    ],
    total: 53.0,
  };

  return tables;
}

export function createInitialSales(): Sale[] {
  const now = new Date();
  const sales: Sale[] = [
    {
      id: 'VENDA-2026-001',
      dataHora: new Date(now.getTime() - 4 * 3600 * 1000).toISOString(),
      mesa: 5,
      tipoAtendimento: 'Mesa',
      itens: [
        {
          id: 'v1-1',
          productId: 'prod-1',
          ean: '7891000100011',
          descricao: 'X-Burger Artesanal com Fritas',
          unidade: 'UN',
          precoUnitario: 34.9,
          quantidade: 2,
          valorTotal: 69.8,
          setor: 'Hambúrgueres',
        },
        {
          id: 'v1-2',
          productId: 'prod-3',
          ean: '7891000100035',
          descricao: 'Coca-Cola Lata 350ml Original',
          unidade: 'UN',
          precoUnitario: 7.5,
          quantidade: 2,
          valorTotal: 15.0,
          setor: 'Bebidas',
        },
      ],
      subtotal: 84.8,
      taxaServicoPercent: 10,
      taxaServicoValor: 8.48,
      descontoPercent: 0,
      descontoValor: 0,
      totalLiquido: 93.28,
      pagamentos: [{ metodo: 'PIX', valor: 93.28 }],
      atendente: 'Juliana Pires Rocha',
      clienteNome: 'Roberto Santos',
      impostosEstimados: 5.13,
    },
    {
      id: 'VENDA-2026-002',
      dataHora: new Date(now.getTime() - 3 * 3600 * 1000).toISOString(),
      mesa: 'Balcão',
      tipoAtendimento: 'Balcão',
      itens: [
        {
          id: 'v2-1',
          productId: 'prod-6',
          ean: '7891000100066',
          descricao: 'Coxinha Gourmet Frango c/ Catupiry 150g',
          unidade: 'UN',
          precoUnitario: 9.5,
          quantidade: 2,
          valorTotal: 19.0,
          setor: 'Salgados',
        },
        {
          id: 'v2-2',
          productId: 'prod-4',
          ean: '7891000100042',
          descricao: 'Suco Natural Laranja 500ml',
          unidade: 'UN',
          precoUnitario: 10.0,
          quantidade: 1,
          valorTotal: 10.0,
          setor: 'Sucos',
        },
      ],
      subtotal: 29.0,
      taxaServicoPercent: 0,
      taxaServicoValor: 0,
      descontoPercent: 0,
      descontoValor: 0,
      totalLiquido: 29.0,
      pagamentos: [{ metodo: 'Dinheiro', valor: 29.0 }],
      troco: 21.0,
      atendente: 'Carlos Eduardo Silva',
      impostosEstimados: 1.59,
    },
    {
      id: 'VENDA-2026-003',
      dataHora: new Date(now.getTime() - 2 * 3600 * 1000).toISOString(),
      mesa: 9,
      tipoAtendimento: 'Mesa',
      itens: [
        {
          id: 'v3-1',
          productId: 'prod-2',
          ean: '7891000100028',
          descricao: 'Smash Burger Duplo Bacon Cheddar',
          unidade: 'UN',
          precoUnitario: 38.0,
          quantidade: 3,
          valorTotal: 114.0,
          setor: 'Hambúrgueres',
        },
        {
          id: 'v3-2',
          productId: 'prod-8',
          ean: '7891000100080',
          descricao: 'Cerveja Artesanal IPA 500ml Garrafa',
          unidade: 'UN',
          precoUnitario: 18.0,
          quantidade: 3,
          valorTotal: 54.0,
          setor: 'Bebidas',
        },
      ],
      subtotal: 168.0,
      taxaServicoPercent: 10,
      taxaServicoValor: 16.8,
      descontoPercent: 5,
      descontoValor: 9.24,
      totalLiquido: 175.56,
      pagamentos: [
        { metodo: 'Cartão Crédito', valor: 100.0 },
        { metodo: 'Cartão Débito', valor: 75.56 },
      ],
      atendente: 'Matheus Costa Santana',
      clienteNome: 'Mariana Duarte',
      impostosEstimados: 9.65,
    },
    {
      id: 'VENDA-2026-004',
      dataHora: new Date(now.getTime() - 1 * 3600 * 1000).toISOString(),
      mesa: 'iFood #1092',
      tipoAtendimento: 'Delivery',
      itens: [
        {
          id: 'v4-1',
          productId: 'prod-1',
          ean: '7891000100011',
          descricao: 'X-Burger Artesanal com Fritas',
          unidade: 'UN',
          precoUnitario: 34.9,
          quantidade: 2,
          valorTotal: 69.8,
          setor: 'Hambúrgueres',
        },
        {
          id: 'v4-2',
          productId: 'prod-5',
          ean: '7891000100059',
          descricao: 'Açaí na Tigela 500ml Turbinado (Granola+Banana+Nutella)',
          unidade: 'UN',
          precoUnitario: 26.5,
          quantidade: 1,
          valorTotal: 26.5,
          setor: 'Açaí',
        },
      ],
      subtotal: 96.3,
      taxaServicoPercent: 0,
      taxaServicoValor: 0,
      descontoPercent: 0,
      descontoValor: 0,
      totalLiquido: 96.3,
      pagamentos: [{ metodo: 'iFood', valor: 96.3 }],
      atendente: 'Carlos Eduardo Silva',
      clienteNome: 'Fernanda Lima Ribeiro',
      impostosEstimados: 5.3,
    },
  ];

  return sales;
}

export function createInitialKitchenOrders(): KitchenOrder[] {
  const now = new Date();
  return [
    {
      id: 'k-1',
      numeroPedido: 'PED-401',
      origem: 'Mesa',
      origemIdentificador: 'Mesa 03',
      clienteNome: 'Mesa Família Costa',
      dataHora: new Date(now.getTime() - 35 * 60 * 1000).toISOString(),
      status: 'preparo',
      total: 112.8,
      observacoes: 'Hambúrgueres ao ponto. Sem cebola em 1.',
      itens: [
        {
          id: 'ki-1',
          productId: 'prod-1',
          ean: '7891000100011',
          descricao: 'X-Burger Artesanal com Fritas',
          unidade: 'UN',
          precoUnitario: 34.9,
          quantidade: 2,
          valorTotal: 69.8,
          setor: 'Hambúrgueres',
        },
        {
          id: 'ki-2',
          productId: 'prod-7',
          ean: '7891000100073',
          descricao: 'Porção Batata Rústica c/ Alecrim e Páprica 400g',
          unidade: 'UN',
          precoUnitario: 28.0,
          quantidade: 1,
          valorTotal: 28.0,
          setor: 'Porções',
        },
      ],
    },
    {
      id: 'k-2',
      numeroPedido: 'PED-402',
      origem: 'iFood',
      origemIdentificador: 'iFood #2891',
      clienteNome: 'Marcos Oliveira Santos',
      clienteTelefone: '(71) 99123-4567',
      clienteEndereco: 'Rua das Hortênsias, 142 - Apto 302 - Pituba',
      clienteCep: '41810-010',
      entregadorNome: 'Tiago Souza da Silva (Moto)',
      dataHora: new Date(now.getTime() - 15 * 60 * 1000).toISOString(),
      status: 'novo',
      total: 72.9,
      observacoes: 'Enviar sachês extras de maionese verde da casa',
      itens: [
        {
          id: 'ki-3',
          productId: 'prod-2',
          ean: '7891000100028',
          descricao: 'Smash Burger Duplo Bacon Cheddar',
          unidade: 'UN',
          precoUnitario: 38.0,
          quantidade: 1,
          valorTotal: 38.0,
          setor: 'Hambúrgueres',
        },
        {
          id: 'ki-4',
          productId: 'prod-1',
          ean: '7891000100011',
          descricao: 'X-Burger Artesanal com Fritas',
          unidade: 'UN',
          precoUnitario: 34.9,
          quantidade: 1,
          valorTotal: 34.9,
          setor: 'Hambúrgueres',
        },
      ],
    },
    {
      id: 'k-3',
      numeroPedido: 'PED-403',
      origem: 'WhatsApp',
      origemIdentificador: 'WhatsApp #552',
      clienteNome: 'Roberto Cavalcanti Mendes',
      clienteTelefone: '(71) 99344-1122',
      clienteEndereco: 'Alameda das Espatódeas, 55 - Caminho das Árvores',
      clienteCep: '41820-460',
      entregadorNome: 'Lucas Barreto Lima (Moto)',
      dataHora: new Date(now.getTime() - 25 * 60 * 1000).toISOString(),
      status: 'pronto',
      total: 53.0,
      observacoes: 'Levar máquina de cartão crédito',
      itens: [
        {
          id: 'ki-5',
          productId: 'prod-5',
          ean: '7891000100059',
          descricao: 'Açaí na Tigela 500ml Turbinado (Granola+Banana+Nutella)',
          unidade: 'UN',
          precoUnitario: 26.5,
          quantidade: 2,
          valorTotal: 53.0,
          setor: 'Açaí',
        },
      ],
    },
  ];
}

const STORAGE_KEYS = {
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
  CAIXA_SESSIONS: 'comandapro_caixa_sessions_v2',
  CANCELLATIONS: 'comandapro_cancellations_v2',
  /** Operador logado. Fica em sessionStorage: some ao fechar a aba do navegador. */
  OPERATOR_SESSION: 'comandapro_operator_session_v2',
};

/** Lê um valor do sessionStorage (dura só enquanto a aba estiver aberta). */
export const getSessionStored = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
};

export const setSessionStored = <T>(key: string, val: T | null): void => {
  try {
    if (val === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Erro ao salvar na sessão:', err);
  }
};

export const getStored = <T>(key: string, defaultVal: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
};

export const setStored = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error('Erro ao salvar no localStorage:', err);
  }
};

export { STORAGE_KEYS };
