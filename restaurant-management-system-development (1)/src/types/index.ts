export type PaymentMethod =
  | 'PIX'
  | 'Dinheiro'
  | 'Cartão Débito'
  | 'Cartão Crédito'
  | 'Boleto'
  | 'Vale'
  | 'Troca'
  | 'Cheque'
  | 'Cripto'
  | 'Doação'
  | 'iFood'
  | 'UberEats'
  | 'Outros';

export interface Product {
  id: string;
  ean: string;
  descricao: string;
  unidade: string;
  precoVenda: number;
  custo?: number;
  setor: string;
  estoque: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  ean: string;
  descricao: string;
  unidade: string;
  precoUnitario: number;
  quantidade: number;
  valorTotal: number;
  observacao?: string;
  setor: string;
}

export type TableStatus = 'livre' | 'ocupada' | 'conta_solicitada';

export interface Table {
  numero: number;
  status: TableStatus;
  itens: OrderItem[];
  garcom?: string;
  cliente?: string;
  abertura?: string;
  total: number;
  observacaoMesa?: string;
}

export interface PaymentSplit {
  metodo: PaymentMethod;
  valor: number;
  detalhe?: string;
}

export interface Sale {
  id: string;
  dataHora: string;
  mesa?: number | string;
  tipoAtendimento: 'Mesa' | 'Balcão' | 'Delivery';
  itens: OrderItem[];
  subtotal: number;
  taxaServicoPercent: number;
  taxaServicoValor: number;
  descontoPercent: number;
  descontoValor: number;
  totalLiquido: number;
  troco?: number;
  pagamentos: PaymentSplit[];
  atendente: string;
  clienteNome?: string;
  clienteDoc?: string;
  impostosEstimados: number;
  observacoes?: string;
}

export interface CompanyData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  telefone: string;
  whatsapp: string;
  instagram: string;
  email: string;
}

export interface CommissionRates {
  cartaoCredito: number;
  cartaoDebito: number;
  pix: number;
  aplicativos: number;
  outros: number;
}

export interface AppConfig {
  dadosEmpresa: CompanyData;
  taxasComissao: CommissionRates;
  descontoMaximoPercent: number;
  taxaServicoPadraoPercent: number;
  aliquotaImpostoPercent: number;
  mensagemRodape: string;
  chavePix: string;
  usuarioAtual: string;
}

export interface Customer {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  cep: string;
  cpfCnpj: string;
}

export interface Deliverer {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  cep: string;
  cpf: string;
  veiculo?: string;
}

export interface AppIntegration {
  id: string;
  razaoSocial: string;
  telefone: string;
  endereco: string;
  cep: string;
  cpfCnpj: string;
  taxaComissao: number;
}

export interface Supplier {
  id: string;
  razaoSocial: string;
  telefone: string;
  endereco: string;
  cep: string;
  cpfCnpj: string;
  contato?: string;
}

export interface Employee {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
  cep: string;
  cpf: string;
  funcao: string;
  dataAdmissao: string;
}

export type KitchenOrderStatus = 'novo' | 'preparo' | 'pronto' | 'concluido';

export interface KitchenOrder {
  id: string;
  numeroPedido: string;
  origem: 'Mesa' | 'iFood' | 'UberEats' | 'WhatsApp' | 'Balcão';
  origemIdentificador: string; // Ex: "Mesa 12" ou "WhatsApp #902"
  clienteNome: string;
  clienteTelefone?: string;
  clienteEndereco?: string;
  clienteCep?: string;
  entregadorNome?: string;
  itens: OrderItem[];
  total: number;
  dataHora: string;
  status: KitchenOrderStatus;
  observacoes?: string;
}
