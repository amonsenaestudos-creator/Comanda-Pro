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
  cozinhaEnviada?: Record<string, number>;
  /** Telefone do cliente da mesa (aviso/retorno). */
  clienteTelefone?: string;
  /** Número sequencial da comanda aberta nesta mesa. */
  numeroComanda?: number;
  /** Cupom de desconto aplicado na comanda. */
  cupom?: string;
}

/** Comanda avulsa: atendimento de Balcão ou Delivery, sem mesa. */
export interface ComandaAvulsa {
  id: string;
  numero: number;
  tipo: 'Balcão' | 'Delivery';
  itens: OrderItem[];
  subtotal: number;
  garcom?: string;
  clienteNome?: string;
  clienteTelefone?: string;
  endereco?: string;
  abertura: string;
  observacao?: string;
  cozinhaEnviada?: Record<string, number>;
  cupom?: string;
}

/** Código promocional aplicável na frente de caixa. */
export interface CupomDesconto {
  codigo: string;
  percentual: number;
  ativo: boolean;
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
  /** Id da comanda avulsa (Balcão/Delivery) que gerou a venda. */
  comandaId?: string;
  /** Número da comanda exibido no cupom. */
  numeroComanda?: number;
  clienteTelefone?: string;
  enderecoEntrega?: string;
  cupomCodigo?: string;
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

/** Aparência e usabilidade da Frente de Caixa (o "caixa"). */
export type TemaModo = 'claro' | 'escuro';
export type EscalaFonte = 'padrao' | 'grande' | 'extra';
export type Densidade = 'confortavel' | 'compacta';
export type TamanhoItemCardapio = 'pequeno' | 'medio' | 'grande';

export interface CaixaAppearance {
  tema: TemaModo;
  escalaFonte: EscalaFonte;
  densidade: Densidade;
  tamanhoItemCardapio: TamanhoItemCardapio;
  /** Mostrar só as telas que o caixa usa (PDV, Pagamento, Fechamento, Resumo). */
  modoCaixa: boolean;
  /** Abas escondidas do menu lateral ( ids das tabs ). */
  abasOcultas: number[];
  mostrarEstoque: boolean;
  mostrarEan: boolean;
  mostrarSetor: boolean;
  mostrarUnitarioNoItem: boolean;
  mostrarObsItem: boolean;
  mostrarObsMesa: boolean;
  mostrarBotaoCozinha: boolean;
  mostrarBotaoImprimir: boolean;
  mostrarConsultaPreco: boolean;
  /** Botões de quantidade rápida ao lado do campo Qtd. */
  quantidadesRapidas: number[];
  /** Cursor já no campo de busca ao abrir o PDV (agiliza o leitor de código). */
  focoBuscaAoAbrir: boolean;
  /** Enter lança o primeiro produto da busca. */
  enterAdicionaPrimeiro: boolean;
  /** Pedir confirmação antes de limpar a comanda da mesa. */
  confirmarLimpar: boolean;
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
  aparencia: CaixaAppearance;
  /** Cupons de desconto promocionais aplicáveis no PDV. */
  cupons: CupomDesconto[];
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

/** Registro de cancelamento de item já enviado à produção. */
export interface CancelamentoItem {
  descricao: string;
  quantidade: number;
  motivo?: string;
  dataHora: string;
}

export interface KitchenOrder {
  id: string;
  numeroPedido: string;
  origem: 'Mesa' | 'iFood' | 'UberEats' | 'WhatsApp' | 'Balcão' | 'Delivery';
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
  /** Itens cancelados depois de enviados (auditoria para a cozinha). */
  cancelamentos?: CancelamentoItem[];
}
