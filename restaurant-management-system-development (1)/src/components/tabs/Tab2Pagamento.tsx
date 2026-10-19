import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  CreditCard,
  QrCode,
  ArrowLeft,
  CheckCircle2,
  Trash2,
  Printer,
  User,
  Percent,
  Plus,
  Coins,
  Receipt,
  Smartphone,
  Copy,
  Check,
  Banknote,
  Wallet,
  Barcode,
  Ticket,
  TicketPercent,
  RefreshCw,
  PenLine,
  Bitcoin,
  Heart,
  Bike,
  Utensils,
  Briefcase,
} from 'lucide-react';
import {
  AppConfig,
  Employee,
  OrderItem,
  PaymentMethod,
  PaymentSplit,
  Sale,
} from '../../types';
import QRCode from 'qrcode';
import { buildPixPayload } from '../../utils/pix';
import { cents, money, orderSubtotal, validatePayments } from '../../utils/checkout';
import { formatCurrency } from '../../utils/formatters';

interface Tab2PagamentoProps {
  currentOrder: {
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
  } | null;
  employees: Employee[];
  config: AppConfig;
  onFinishSale: (sale: Sale) => boolean;
  onNavigateTab: (tabId: number) => void;
  onOpenReceiptPrint: (sale: Sale) => void;
}

export const Tab2Pagamento: React.FC<Tab2PagamentoProps> = ({
  currentOrder,
  employees,
  config,
  onFinishSale,
  onNavigateTab,
  onOpenReceiptPrint,
}) => {
  const [comandaNumero, setComandaNumero] = useState<string>('');
  const [atendente, setAtendente] = useState<string>(
    currentOrder?.atendente || config.usuarioAtual || 'Carlos Eduardo Silva'
  );
  const [clienteNome, setClienteNome] = useState<string>('');
  const [clienteDoc, setClienteDoc] = useState<string>('');

  // Service charge
  const [hasServiceCharge, setHasServiceCharge] = useState<boolean>(true);
  const [serviceChargePercent, setServiceChargePercent] = useState<number>(
    config.taxaServicoPadraoPercent ?? 10
  );

  // Discount
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Partial payments
  const [splits, setSplits] = useState<PaymentSplit[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('PIX');
  const [inputAmount, setInputAmount] = useState<string>('');
  const [cashGiven, setCashGiven] = useState<string>('');

  // PIX QR Code Modal
  const [isPixModalOpen, setIsPixModalOpen] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixImage, setPixImage] = useState('');
  const [pixPayload, setPixPayload] = useState('');
  const [pixError, setPixError] = useState('');
  const finishing = useRef(false);

  // Finished sale state to allow printing receipt right after
  const [lastFinishedSale, setLastFinishedSale] = useState<Sale | null>(null);

  // Cupom trazido da frente de caixa (desconto % pré-definido na Configuração)
  const cupomResolvido = useMemo(() => {
    const codigo = currentOrder?.cupomCodigo?.trim().toUpperCase();
    if (!codigo) return null;
    const found = (config.cupons || []).find(
      (c) => c.ativo && c.codigo.trim().toUpperCase() === codigo
    );
    return found ? { codigo: found.codigo, percentual: found.percentual } : null;
  }, [currentOrder, config.cupons]);

  // Never carry payments or customer details to another order.
  useEffect(() => {
    if (!currentOrder) return;
    setSplits([]); setCashGiven('');
    setDiscountPercent(cupomResolvido?.percentual ?? 0);
    setClienteNome(currentOrder.clienteNome || '');
    setClienteDoc(''); setLastFinishedSale(null);
    setHasServiceCharge(true);
    setServiceChargePercent(config.taxaServicoPadraoPercent ?? 10);
    finishing.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder]);

  // Sync order data when opened
  useEffect(() => {
    if (currentOrder?.mesa) {
      setComandaNumero(String(currentOrder.mesa));
    }
    if (currentOrder?.atendente) {
      setAtendente(currentOrder.atendente);
    }
  }, [currentOrder]);

  const subtotal = currentOrder ? orderSubtotal(currentOrder.itens) : 0;
  const taxaServicoValor = hasServiceCharge
    ? Number(((subtotal * serviceChargePercent) / 100).toFixed(2))
    : 0;

  const baseWithService = subtotal + taxaServicoValor;
  const descontoValor = Number(((baseWithService * discountPercent) / 100).toFixed(2));
  const totalLiquido = Number(Math.max(0, baseWithService - descontoValor).toFixed(2));

  useEffect(() => { setSplits([]); setCashGiven(''); }, [hasServiceCharge, serviceChargePercent, discountPercent]);

  // Payment totals
  const totalPaid = money(splits.reduce((acc, s) => acc + s.valor, 0));
  const remaining = Number(Math.max(0, totalLiquido - totalPaid).toFixed(2));

  // Auto fill inputAmount with remaining
  useEffect(() => {
    if (remaining > 0) {
      setInputAmount(remaining.toFixed(2));
    } else {
      setInputAmount('0.00');
    }
  }, [remaining, totalLiquido]);

  // Cash change calculation
  const cashPaid = splits
    .filter((s) => s.metodo === 'Dinheiro')
    .reduce((acc, s) => acc + s.valor, 0);
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const trocoCalculado =
    cashPaid > 0 && cashGivenNum > cashPaid ? Number((cashGivenNum - cashPaid).toFixed(2)) : 0;

  const paymentMethods: { method: PaymentMethod; Icon: React.ElementType }[] = [
    { method: 'PIX', Icon: QrCode },
    { method: 'Dinheiro', Icon: Banknote },
    { method: 'Cartão Débito', Icon: CreditCard },
    { method: 'Cartão Crédito', Icon: Wallet },
    { method: 'Boleto', Icon: Barcode },
    { method: 'Vale', Icon: Ticket },
    { method: 'Troca', Icon: RefreshCw },
    { method: 'Cheque', Icon: PenLine },
    { method: 'Cripto', Icon: Bitcoin },
    { method: 'Doação', Icon: Heart },
    { method: 'iFood', Icon: Bike },
    { method: 'UberEats', Icon: Utensils },
    { method: 'Outros', Icon: Briefcase },
  ];

  const handleAddSplit = () => {
    const val = parseFloat(inputAmount);
    if (isNaN(val) || cents(val) <= 0) {
      alert('Informe um valor de pagamento válido!');
      return;
    }

    if (!Number.isFinite(val) || cents(val) > cents(remaining) || remaining <= 0) {
      alert('Informe somente o saldo a pagar. Para dinheiro entregue a mais, use o campo de troco.');
      return;
    }
    setSplits(prev => [...prev, { metodo: selectedMethod, valor: money(val) }]);
  };

  const handleRemoveSplit = (idx: number) => {
    setSplits(splits.filter((_, i) => i !== idx));
  };

  const handleClearAll = () => {
    if (window.confirm('Deseja limpar todos os pagamentos lançados?')) {
      setSplits([]);
      setCashGiven('');
      setDiscountPercent(0);
    }
  };

  const handleFinishSale = () => {
    if (!currentOrder || currentOrder.itens.length === 0) {
      alert('Nenhum item na comanda atual para finalizar!');
      return;
    }

    if (finishing.current) return;
    const paymentError = validatePayments(totalLiquido, splits, cashGiven === '' ? undefined : Number(cashGiven));
    if (paymentError) { alert(paymentError); return; }
    if (discountPercent > (config.descontoMaximoPercent ?? 15)) { alert('Desconto acima do limite configurado.'); return; }
    const saleId = `VND-${crypto.randomUUID()}`;
    const impostos = Number(
      ((totalLiquido * (config.aliquotaImpostoPercent ?? 5.5)) / 100).toFixed(2)
    );

    const newSale: Sale = {
      id: saleId,
      dataHora: new Date().toISOString(),
      mesa: currentOrder.mesa,
      tipoAtendimento:
        currentOrder.tipoAtendimento ??
        (typeof currentOrder.mesa === 'number'
          ? 'Mesa'
          : String(currentOrder.mesa).toLowerCase().includes('delivery')
          ? 'Delivery'
          : 'Balcão'),
      itens: currentOrder.itens,
      subtotal,
      taxaServicoPercent: hasServiceCharge ? serviceChargePercent : 0,
      taxaServicoValor,
      descontoPercent: discountPercent,
      descontoValor,
      totalLiquido,
      pagamentos: splits.length > 0 ? splits : [{ metodo: selectedMethod, valor: totalLiquido }],
      troco: trocoCalculado > 0 ? trocoCalculado : undefined,
      atendente: atendente || config.usuarioAtual,
      clienteNome: clienteNome || currentOrder.clienteNome || undefined,
      clienteDoc: clienteDoc || undefined,
      impostosEstimados: impostos,
      comandaId: currentOrder.comandaId,
      numeroComanda: currentOrder.numeroComanda,
      clienteTelefone: currentOrder.clienteTelefone,
      enderecoEntrega: currentOrder.enderecoEntrega,
      cupomCodigo: cupomResolvido?.codigo,
    };

    finishing.current = true;
    if (onFinishSale(newSale)) {
      setLastFinishedSale(newSale);
      setSplits([]); setCashGiven('');
    } else { finishing.current = false; }
  };

  const pixAmount = Math.min(Number(inputAmount) || remaining, remaining);
  useEffect(() => {
    if (!isPixModalOpen) return;
    let cancelled = false;
    setPixError(''); setPixImage(''); setPixPayload('');
    try {
      const payload = buildPixPayload(config.chavePix, config.dadosEmpresa.nomeFantasia, config.dadosEmpresa.cidade, pixAmount);
      QRCode.toDataURL(payload, { width: 256, margin: 4, errorCorrectionLevel: 'M' }).then(image => {
        if (!cancelled) { setPixImage(image); setPixPayload(payload); }
      }).catch(() => { if (!cancelled) setPixError('Não foi possível gerar o QR Code.'); });
    } catch (error) { setPixError((error as Error).message); }
    return () => { cancelled = true; };
  }, [isPixModalOpen, pixAmount, config.chavePix, config.dadosEmpresa.nomeFantasia, config.dadosEmpresa.cidade]);

  const copyPixCode = async () => {
    try {
      await navigator.clipboard.writeText(pixPayload);
      setPixCopied(true);
      setTimeout(() => setPixCopied(false), 2000);
    } catch { alert('Não foi possível copiar. Verifique as permissões do navegador.'); }
  };

  // If no active order
  if (!currentOrder || currentOrder.itens.length === 0) {
    return (
      <div className="cp-card p-8 text-center max-w-lg mx-auto my-8">
        <Receipt className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-zinc-800 mb-2">
          Nenhuma Venda Selecionada para Pagamento
        </h3>
        <p className="text-xs text-zinc-500 mb-6">
          Abra a Frente de Caixa (ou o mapa de Mesas), lance os itens e toque em <strong>Pagar</strong>.
        </p>
        <div className="flex justify-center gap-3 flex-wrap">
          {lastFinishedSale && <button onClick={() => onOpenReceiptPrint(lastFinishedSale)} className="cp-btn bg-sky-600 text-white">Reimprimir última venda</button>}
          <button
            onClick={() => onNavigateTab(1)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Ir para Frente de Caixa
          </button>
          <button
            onClick={() => onNavigateTab(8)}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-900 text-white"
          >
            Ver Mapa de Mesas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner Navigation & Order Context */}
      <div className="cp-card p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          {/* Botão Volta PDV (Azul) */}
          <button
            onClick={() => onNavigateTab(1)}
            className="px-3 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para o caixa</span>
          </button>

          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-orange-600" />
              <span>Checkout & Pagamento</span>
              <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono font-bold">
                {currentOrder.tipoAtendimento ??
                  (typeof currentOrder.mesa === 'number' ? 'Mesa' : 'Comanda')}{' '}
                #{(currentOrder.numeroComanda ?? comandaNumero) || currentOrder.mesa}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-500">
              {currentOrder.itens.length} itens lançados na comanda &bull; Subtotal:{' '}
              {formatCurrency(subtotal)}
              {currentOrder.clienteNome && (
                <span className="ml-2 font-semibold text-zinc-600">
                  &bull; Cliente: {currentOrder.clienteNome}
                </span>
              )}
              {currentOrder.enderecoEntrega && (
                <span className="ml-2 font-semibold text-zinc-600">
                  &bull; Entrega: {currentOrder.enderecoEntrega}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Atendente Selection */}
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-zinc-400" />
          <label className="text-xs font-semibold text-zinc-600">Atendente:</label>
          <select
            value={atendente}
            onChange={(e) => setAtendente(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-medium bg-zinc-50 border border-zinc-300 rounded-lg text-zinc-800"
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.nome}>
                {emp.nome} ({emp.funcao})
              </option>
            ))}
            <option value="Operador Geral">Operador Geral</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Left Financial Summary, Right Payment Methods & Splits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Totals, Discounts, Service Fee (Col 5) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="cp-card p-4">
            <h3 className="font-bold text-sm text-zinc-900 pb-2 border-b border-zinc-200 mb-3 flex items-center justify-between">
              <span>Discriminação de Valores</span>
              <span className="text-xs font-mono text-zinc-500">
                {currentOrder.itens.length} itens
              </span>
            </h3>

            {/* Quick Items list preview */}
            <div className="max-h-36 overflow-y-auto divide-y divide-zinc-100 text-xs mb-3 pr-1">
              {currentOrder.itens.map((it, idx) => (
                <div key={idx} className="py-1.5 flex justify-between items-center">
                  <span className="text-zinc-700">
                    <strong className="text-zinc-900">{it.quantidade}x</strong> {it.descricao}
                  </span>
                  <span className="font-semibold text-zinc-800 font-mono">
                    {formatCurrency(it.valorTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Subtotal */}
            <div className="space-y-2 pt-2 border-t border-zinc-200 text-xs">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Subtotal dos Produtos:</span>
                <span className="font-bold font-mono text-zinc-800 text-sm">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Service Fee Toggle & Rate */}
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-zinc-700 font-medium">
                    <input
                      type="checkbox"
                      checked={hasServiceCharge}
                      onChange={(e) => setHasServiceCharge(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500 w-4 h-4"
                    />
                    <span>Taxa de Serviço Garçom</span>
                  </label>
                  <span className="font-mono font-bold text-zinc-800">
                    +{formatCurrency(taxaServicoValor)}
                  </span>
                </div>
                {hasServiceCharge && (
                  <div className="flex items-center justify-end gap-2 text-[11px] text-zinc-500">
                    <span>Ajustar %:</span>
                    <input
                      type="number"
                      min="0"
                      max="30"
                      value={serviceChargePercent}
                      onChange={(e) =>
                        setServiceChargePercent(Math.min(30, Math.max(0, parseFloat(e.target.value) || 0)))
                      }
                      className="w-14 px-1.5 py-0.5 text-center bg-white border border-zinc-300 rounded text-xs font-bold"
                    />
                    <span>%</span>
                  </div>
                )}
              </div>

              {/* Discount Selector */}
              <div className="p-2.5 bg-zinc-50 rounded-lg border border-zinc-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-zinc-700 font-medium">
                    <Percent className="w-3.5 h-3.5 text-rose-500" />
                    <span>Desconto Concedido</span>
                  </span>
                  <span className="font-mono font-bold text-rose-600">
                    -{formatCurrency(descontoValor)}
                  </span>
                </div>
                {cupomResolvido && (
                  <div className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1">
                    <TicketPercent className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-[11px] font-bold">
                      Cupom {cupomResolvido.codigo} aplicado (-{cupomResolvido.percentual}%)
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">
                    Máx: {config.descontoMaximoPercent ?? 15}%
                  </span>
                  <div className="flex items-center gap-1">
                    {Array.from(new Set([0, 5, 10, config.descontoMaximoPercent ?? 15])).filter(pct => pct <= (config.descontoMaximoPercent ?? 15)).map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPercent(pct)}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border transition ${
                          discountPercent === pct ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-100'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Final Liquid Total */}
              <div className="pt-3 border-t border-zinc-200">
                <div className="flex justify-between items-baseline">
                  <span className="text-sm font-extrabold text-zinc-900 uppercase">
                    Total Líquido:
                  </span>
                  <span className="text-2xl font-black text-orange-600 font-mono">
                    {formatCurrency(totalLiquido)}
                  </span>
                </div>
              </div>

              {/* Status Paid vs Remaining */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-center">
                  <div className="text-[10px] text-emerald-700 font-semibold uppercase">
                    Total Lançado
                  </div>
                  <div className="text-sm font-bold text-emerald-800 font-mono">
                    {formatCurrency(totalPaid)}
                  </div>
                </div>

                <div
                  className={`rounded-lg p-2 text-center border ${
                    remaining > 0 ? 'bg-rose-50 border-rose-200' : 'bg-zinc-100 border-zinc-200'
                  }`}
                >
                  <div
                    className={`text-[10px] font-semibold uppercase ${
                      remaining > 0 ? 'text-rose-700' : 'text-zinc-600'
                    }`}
                  >
                    Falta a Pagar
                  </div>
                  <div
                    className={`text-sm font-bold font-mono ${ remaining > 0 ? 'text-rose-700' : 'text-zinc-500' }`}
                  >
                    {formatCurrency(remaining)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Optional customer document on receipt */}
          <div className="cp-card p-4">
            <h4 className="text-xs font-bold text-zinc-800 mb-2">
              Identificação do Cliente no Cupom (Opcional)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nome do Cliente"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg"
              />
              <input
                type="text"
                placeholder="CPF ou CNPJ (opcional)"
                value={clienteDoc}
                onChange={(e) => setClienteDoc(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-zinc-50 border border-zinc-300 rounded-lg font-mono"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Payment Methods, Mixed Splits, Cash Troco, Conclude (Col 7) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="cp-card p-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 mb-3">
              <h3 className="font-bold text-sm cp-text flex items-baseline gap-2">
                <span>Meio de pagamento</span>
                <span className="cp-small cp-faint font-medium">pode ser dividido</span>
              </h3>
              {/* Botão Amarelo: Exibir QR-Code PIX */}
              <button
                type="button"
                onClick={() => setIsPixModalOpen(true)}
                className="px-3 py-1.5 text-xs font-bold rounded-lg bg-teal-600 hover:bg-teal-700 text-white flex items-center gap-1.5 transition"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>QR-Code PIX</span>
              </button>
            </div>

            {/* Meios de pagamento */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 mb-4">
              {paymentMethods.map(({ method, Icon }) => {
                const isSelected = selectedMethod === method;
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setSelectedMethod(method)}
                    aria-pressed={isSelected}
                    className={`px-2 py-2 rounded-lg border text-center flex items-center justify-center gap-1.5 transition-colors ${
                      isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="text-[11px] font-semibold leading-tight truncate">
                      {method}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Split Input Box */}
            <div className="cp-inset p-3 rounded-lg flex flex-wrap items-center gap-2 mb-4">
              <div className="flex-1 min-w-[140px]">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                  Método Selecionado
                </label>
                <div className="font-extrabold text-xs text-orange-600 bg-white border border-zinc-200 px-3 py-2 rounded-lg">
                  {selectedMethod}
                </div>
              </div>

              <div className="w-36">
                <label className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">
                  Valor a Lançar (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={inputAmount}
                  onChange={(e) => setInputAmount(e.target.value)}
                  className="w-full px-3 py-1.5 text-sm font-bold font-mono bg-white border border-zinc-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-orange-500 text-zinc-900"
                />
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleAddSplit}
                  disabled={remaining <= 0 && splits.length > 0}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1 disabled:opacity-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Parcela</span>
                </button>
              </div>
            </div>

            {/* If Dinheiro: Troco Calculator */}
            {selectedMethod === 'Dinheiro' && (
              <div className="cp-inset rounded-lg p-3 mb-4 space-y-2 border-emerald-200">
                <div className="flex items-center gap-2 cp-item font-bold cp-text">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  <span>Troco em dinheiro</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <label className="cp-small cp-muted font-semibold block mb-0.5">
                      Valor entregue pelo cliente
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ex: 50.00, 100.00"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="cp-input w-full px-3 py-1.5 text-xs font-bold font-mono"
                    />
                  </div>
                  <div className="w-36 text-right">
                    <span className="cp-small cp-muted font-semibold block mb-0.5">
                      Troco a devolver
                    </span>
                    <span className="cp-total text-emerald-600 font-black font-mono">
                      {formatCurrency(trocoCalculado)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* List of Added Splits */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-700 mb-2">
                <span>Pagamentos Registrados ({splits.length})</span>
                {splits.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="text-rose-600 hover:underline text-[11px]"
                  >
                    Limpar Todos
                  </button>
                )}
              </div>

              {splits.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-zinc-200 rounded-lg text-xs text-zinc-400">
                  Clique em "Adicionar Parcela" ou escolha o meio para lançar o pagamento total ({formatCurrency(totalLiquido)}).
                </div>
              ) : (
                <div className="space-y-1.5">
                  {splits.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-lg text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span className="font-semibold text-zinc-900">{s.metodo}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-zinc-900">
                          {formatCurrency(s.valor)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSplit(idx)}
                          className="text-rose-600 hover:bg-rose-100 p-1 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Main Action Buttons: Required Colors [Verde, Vermelho, Azul, Amarelo] */}
            <div className="mt-6 pt-4 border-t border-zinc-200 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Botão Vermelho: Limpar */}
              <button
                type="button"
                onClick={handleClearAll}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Limpar</span>
              </button>

              {/* Botão Azul: Imprimir Comprovante Avulso / Teste */}
              <button
                type="button"
                onClick={() => {
                  if (lastFinishedSale) {
                    onOpenReceiptPrint(lastFinishedSale);
                  } else {
                    alert('Conclua o pagamento para emitir o comprovante oficial!');
                  }
                }}
                disabled={!lastFinishedSale}
                className="py-3 px-4 rounded-xl font-bold text-xs bg-sky-600 hover:bg-sky-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Cupom</span>
              </button>

              {/* Botão Verde: Concluir Venda */}
              <button
                type="button"
                onClick={handleFinishSale}
                className="col-span-2 sm:col-span-1 py-3 px-4 rounded-xl font-extrabold text-sm bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Concluir Venda</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* PIX QR Code Modal */}
      {isPixModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="cp-card shadow-2xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-3">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-lg text-zinc-900">
              Pagamento via PIX Instantâneo
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Escaneie o QR Code ou copie o código Pix abaixo
            </p>

            {pixError ? <p role="alert" className="text-rose-600 text-sm my-4">{pixError}</p> :
              pixImage ? <img src={pixImage} alt="QR Code PIX para pagamento" className="w-64 mx-auto mb-3" /> : <p>Gerando QR Code…</p>}
            <p className="text-xs text-zinc-500 mb-3">Confirme o recebimento no banco antes de registrar a parcela. O sistema não confirma PIX automaticamente.</p>

            <div className="bg-zinc-100 p-2.5 rounded-lg mb-4 text-left">
              <div className="text-[11px] text-zinc-500 font-semibold">Valor desta parcela PIX:</div>
              <div className="text-xl font-extrabold text-teal-700 font-mono">
                {formatCurrency(pixAmount)}
              </div>
              <div className="text-[10px] text-zinc-500 mt-1 truncate">
                Chave: {config.chavePix}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={copyPixCode}
                disabled={!pixPayload}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center gap-2 transition"
              >
                {pixCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{pixCopied ? 'Chave / Código Copiado!' : 'Copiar Código PIX (Copia e Cola)'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsPixModalOpen(false)}
                className="w-full py-2 text-xs font-semibold rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-700"
              >
                Fechar Janela PIX
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
