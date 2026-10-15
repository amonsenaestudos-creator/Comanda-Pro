import React from 'react';
import { Printer, X, Check, Copy } from 'lucide-react';
import { AppConfig, OrderItem, PaymentSplit } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export type TicketType = 'cupom_venda' | 'conferencia_mesa' | 'cozinha';

interface PrintTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticketType: TicketType;
  config: AppConfig;
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
  pagamentos?: PaymentSplit[];
  troco?: number;
  codigoVenda?: string;
  observacoes?: string;
}

export const PrintTicketModal: React.FC<PrintTicketModalProps> = ({
  isOpen,
  onClose,
  ticketType,
  config,
  mesa,
  clienteNome,
  clienteTelefone,
  clienteEndereco,
  atendente,
  itens,
  subtotal,
  taxaServicoValor = 0,
  taxaServicoPercent = 0,
  descontoValor = 0,
  totalLiquido,
  pagamentos = [],
  troco = 0,
  codigoVenda,
  observacoes,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const copyAsText = () => {
    const textLines = [
      `========================================`,
      `       ${config.dadosEmpresa.nomeFantasia || config.dadosEmpresa.razaoSocial}`,
      `         CNPJ: ${config.dadosEmpresa.cnpj}`,
      `     Tel: ${config.dadosEmpresa.telefone}`,
      `========================================`,
      `TIPO: ${ticketType === 'cupom_venda' ? 'COMPROVANTE DE VENDA' : ticketType === 'conferencia_mesa' ? 'CONFERÊNCIA DE MESA' : 'PEDIDO COZINHA'}`,
      `DATA/HORA: ${formatDateTime(new Date())}`,
      mesa !== undefined ? `MESA / COMANDA: ${mesa}` : '',
      atendente ? `ATENDENTE: ${atendente}` : '',
      clienteNome ? `CLIENTE: ${clienteNome}` : '',
      `----------------------------------------`,
      `QTD  DESCRIÇÃO                  VALOR`,
      `----------------------------------------`,
      ...itens.map(
        (it) =>
          `${it.quantidade}x ${it.descricao.slice(0, 22).padEnd(23)} ${formatCurrency(it.valorTotal)}`
      ),
      `----------------------------------------`,
      `SUBTOTAL: ${formatCurrency(subtotal)}`,
      taxaServicoValor > 0 ? `TAXA DE SERVIÇO (${taxaServicoPercent}%): ${formatCurrency(taxaServicoValor)}` : '',
      descontoValor > 0 ? `DESCONTO: -${formatCurrency(descontoValor)}` : '',
      `TOTAL: ${formatCurrency(totalLiquido)}`,
      pagamentos.length > 0 ? `FORMA DE PAGAMENTO: ${pagamentos.map(p => `${p.metodo} (${formatCurrency(p.valor)})`).join(', ')}` : '',
      troco > 0 ? `TROCO: ${formatCurrency(troco)}` : '',
      `========================================`,
      config.mensagemRodape,
      `Todos os direitos reservados: Conta Bahia Contabilidade - 71 2136-6312`,
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard.writeText(textLines);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto no-print">
      <div className="cp-card shadow-2xl max-w-md w-full overflow-hidden flex flex-col duration-150">
        {/* Modal Top bar */}
        <div className="bg-zinc-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-sm">
              {ticketType === 'cupom_venda' && 'Comprovante Térmico de Venda'}
              {ticketType === 'conferencia_mesa' && `Pré-Conta / Mesa ${mesa || ''}`}
              {ticketType === 'cozinha' && 'Ticket de Produção (Cozinha/KDS)'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition p-1 rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Toolbar */}
        <div className="bg-zinc-100 p-2.5 flex items-center justify-between gap-2 border-b border-zinc-200">
          <div className="text-xs text-zinc-600 font-medium">
            Formato: 80mm / 58mm Térmica
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copyAsText}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-md border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copiado!' : 'Copiar Texto'}
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-1.5 text-xs font-bold rounded-md bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Agora
            </button>
          </div>
        </div>

        {/* Ticket Visual Container */}
        <div className="p-4 bg-zinc-200 max-h-[70vh] overflow-y-auto flex justify-center">
          <div className="printable-area bg-white text-zinc-950 p-4 rounded border border-dashed border-zinc-300 font-mono text-xs w-[320px]">
            {/* Header */}
            <div className="text-center pb-2 border-b border-dashed border-zinc-400">
              <div className="font-extrabold text-sm uppercase tracking-wide">
                {config.dadosEmpresa.nomeFantasia || 'COMANDA PRO RESTÔ'}
              </div>
              <div className="text-[10px] text-zinc-700">
                {config.dadosEmpresa.razaoSocial}
              </div>
              <div className="text-[10px] text-zinc-700">
                CNPJ: {config.dadosEmpresa.cnpj}
              </div>
              <div className="text-[10px] text-zinc-700">
                {config.dadosEmpresa.endereco}, {config.dadosEmpresa.numero} - {config.dadosEmpresa.bairro}
              </div>
              <div className="text-[10px] text-zinc-700">
                {config.dadosEmpresa.cidade}/{config.dadosEmpresa.uf} - Tel: {config.dadosEmpresa.telefone}
              </div>
            </div>

            {/* Ticket Info */}
            <div className="py-2 border-b border-dashed border-zinc-400 text-[11px] space-y-0.5">
              <div className="font-bold text-center text-xs py-0.5 bg-zinc-100 rounded">
                {ticketType === 'cupom_venda' && '*** DOCUMENTO AUXILIAR DE VENDA ***'}
                {ticketType === 'conferencia_mesa' && '*** CONFERÊNCIA DE CONTA (MESA) ***'}
                {ticketType === 'cozinha' && '*** COMANDA DE COZINHA / PRODUÇÃO ***'}
              </div>
              <div className="flex justify-between">
                <span>DATA: {formatDateTime(new Date())}</span>
              </div>
              {codigoVenda && (
                <div className="flex justify-between">
                  <span>CÓDIGO:</span>
                  <span className="font-bold">{codigoVenda}</span>
                </div>
              )}
              {mesa !== undefined && (
                <div className="flex justify-between">
                  <span>MESA / COMANDA:</span>
                  <span className="font-bold text-sm bg-zinc-200 px-1 rounded">
                    Mesa #{mesa}
                  </span>
                </div>
              )}
              {atendente && (
                <div className="flex justify-between">
                  <span>ATENDENTE:</span>
                  <span>{atendente}</span>
                </div>
              )}
              {clienteNome && (
                <div className="flex justify-between">
                  <span>CLIENTE:</span>
                  <span className="font-medium truncate max-w-[170px]">{clienteNome}</span>
                </div>
              )}
              {clienteTelefone && (
                <div className="flex justify-between">
                  <span>TEL:</span>
                  <span>{clienteTelefone}</span>
                </div>
              )}
              {clienteEndereco && (
                <div className="text-[10px] text-zinc-700 bg-zinc-50 p-1 rounded mt-1">
                  ENTREGA: {clienteEndereco}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="py-2 border-b border-dashed border-zinc-400">
              <div className="flex justify-between font-bold text-[10px] text-zinc-600 pb-1 mb-1 border-b border-zinc-200">
                <span>ITENS / DESCRIÇÃO</span>
                <span>TOTAL</span>
              </div>
              <div className="space-y-1.5">
                {itens.map((item, idx) => (
                  <div key={idx} className="text-[11px] leading-tight">
                    <div className="flex justify-between items-baseline font-medium">
                      <span>
                        {item.quantidade}x {item.descricao}
                      </span>
                      <span>{formatCurrency(item.valorTotal)}</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 pl-4">
                      {item.quantidade} UN x {formatCurrency(item.precoUnitario)}
                    </div>
                    {item.observacao && (
                      <div className="text-[10px] text-rose-700 font-semibold pl-4">
                        &gt;&gt; OBS: {item.observacao}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Financial summary */}
            <div className="py-2 border-b border-dashed border-zinc-400 space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span>SUBTOTAL:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxaServicoValor > 0 && (
                <div className="flex justify-between">
                  <span>TAXA DE SERVIÇO ({taxaServicoPercent}%):</span>
                  <span>+{formatCurrency(taxaServicoValor)}</span>
                </div>
              )}
              {descontoValor > 0 && (
                <div className="flex justify-between text-rose-600 font-medium">
                  <span>DESCONTO:</span>
                  <span>-{formatCurrency(descontoValor)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm pt-1 border-t border-zinc-300">
                <span>TOTAL A PAGAR:</span>
                <span className="text-zinc-950">{formatCurrency(totalLiquido)}</span>
              </div>
            </div>

            {/* Payments breakdown */}
            {pagamentos.length > 0 && (
              <div className="py-2 border-b border-dashed border-zinc-400 text-[11px] space-y-0.5">
                <div className="font-bold text-[10px] text-zinc-600">PAGAMENTOS REALIZADOS:</div>
                {pagamentos.map((p, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{p.metodo}:</span>
                    <span className="font-semibold">{formatCurrency(p.valor)}</span>
                  </div>
                ))}
                {troco > 0 && (
                  <div className="flex justify-between font-bold text-emerald-700 pt-0.5">
                    <span>TROCO:</span>
                    <span>{formatCurrency(troco)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Notes if any */}
            {observacoes && (
              <div className="py-1 text-[10px] italic text-zinc-600">
                Obs: {observacoes}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 text-center text-[10px] text-zinc-600 space-y-1">
              <div className="whitespace-pre-line leading-relaxed">
                {config.mensagemRodape}
              </div>
              <div className="font-bold pt-1 border-t border-zinc-200 text-zinc-800">
                Todos os direitos reservados:
                <br />
                Conta Bahia Contabilidade - 71 2136-6312
              </div>
              <div className="text-[9px] text-zinc-400">
                Comanda Pro 2.0 &bull; 2026
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Buttons */}
        <div className="bg-zinc-50 p-3 flex justify-end gap-2 border-t border-zinc-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-700 transition"
          >
            Fechar Janela
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 transition"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>
    </div>
  );
};
