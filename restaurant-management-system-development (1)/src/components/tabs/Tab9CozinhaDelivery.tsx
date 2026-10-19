import React, { useState } from 'react';
import {
  ChefHat,
  Plus,
  Printer,
  Clock,
  ArrowRight,
  CheckCircle,
  Truck,
  Flame,
  CheckCheck,
  X,
  Phone,
  MapPin,
  User,
  ShoppingBag,
  Ban,
} from 'lucide-react';
import {
  Customer,
  Deliverer,
  KitchenOrder,
  KitchenOrderStatus,
  OrderItem,
  Product,
} from '../../types';
import { formatCurrency, formatTimeShort } from '../../utils/formatters';

interface Tab9CozinhaDeliveryProps {
  orders: KitchenOrder[];
  products: Product[];
  customers: Customer[];
  deliverers: Deliverer[];
  onSaveOrders: (orders: KitchenOrder[]) => void;
  onPrintKitchenOrder: (order: KitchenOrder) => void;
  onNavigateTab: (tabId: number) => void;
}

export const Tab9CozinhaDelivery: React.FC<Tab9CozinhaDeliveryProps> = ({
  orders,
  products,
  customers,
  deliverers,
  onSaveOrders,
  onPrintKitchenOrder,
  onNavigateTab,
}) => {
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  // New Order Form State
  const [orderOrigin, setOrderOrigin] = useState<'iFood' | 'WhatsApp' | 'UberEats' | 'Balcão' | 'Delivery'>('WhatsApp');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedDelivererId, setSelectedDelivererId] = useState<string>('');
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [orderNotes, setOrderNotes] = useState<string>('');

  // Item Selector State in Form
  const [selectedProdId, setSelectedProdId] = useState<string>(products[0]?.id || '');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemObs, setItemObs] = useState<string>('');

  // Kanban Columns
  const columns: { status: KitchenOrderStatus; label: string; icon: React.ElementType; color: string; border: string }[] = [
    { status: 'novo', label: 'Novos', icon: Clock, color: 'bg-sky-50 text-sky-800', border: 'border-sky-300' },
    { status: 'preparo', label: 'Em Preparo', icon: Flame, color: 'bg-amber-50 text-amber-800', border: 'border-amber-400' },
    { status: 'pronto', label: 'Prontos para Entrega / Retirada', icon: Truck, color: 'bg-orange-50 text-orange-800', border: 'border-orange-400' },
    { status: 'concluido', label: 'Concluídos', icon: CheckCheck, color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-300' },
  ];

  // Move status handler
  const handleUpdateStatus = (orderId: string, nextStatus: KitchenOrderStatus) => {
    const updated = orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o));
    onSaveOrders(updated);
  };

  // Add Item to Order Form
  const handleAddItemToForm = () => {
    const prod = products.find((p) => p.id === selectedProdId);
    if (!prod || itemQty <= 0) return;

    const newItem: OrderItem = {
      id: `it-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      productId: prod.id,
      ean: prod.ean,
      descricao: prod.descricao,
      unidade: prod.unidade || 'UN',
      precoUnitario: prod.precoVenda,
      quantidade: itemQty,
      valorTotal: Number((prod.precoVenda * itemQty).toFixed(2)),
      observacao: itemObs || undefined,
      setor: prod.setor,
    };

    setOrderItems([...orderItems, newItem]);
    setItemQty(1);
    setItemObs('');
  };

  const handleRemoveFormItem = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  // Submit New Order
  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderItems.length === 0) {
      alert('Adicione pelo menos um item ao pedido!');
      return;
    }

    const customer = customers.find((c) => c.id === selectedCustomerId);
    const deliverer = deliverers.find((d) => d.id === selectedDelivererId);

    const total = orderItems.reduce((acc, it) => acc + it.valorTotal, 0);
    const numSeq = Math.floor(100 + Math.random() * 900);

    const newOrder: KitchenOrder = {
      id: `k-${Date.now()}`,
      numeroPedido: `PED-${numSeq}`,
      origem: orderOrigin,
      origemIdentificador: `${orderOrigin} #${numSeq}`,
      clienteNome: customer?.nome || 'Cliente Balcão / Avulso',
      clienteTelefone: customer?.telefone,
      clienteEndereco: customer?.endereco,
      clienteCep: customer?.cep,
      entregadorNome: deliverer ? `${deliverer.nome} (${deliverer.veiculo || 'Moto'})` : undefined,
      itens: orderItems,
      total,
      dataHora: new Date().toISOString(),
      status: 'novo',
      observacoes: orderNotes || undefined,
    };

    onSaveOrders([newOrder, ...orders]);
    setIsNewOrderModalOpen(false);
    setOrderItems([]);
    setOrderNotes('');
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="cp-card p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-zinc-900 flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <span>Pedidos para Aplicativos, Cozinha & Delivery (KDS Kanban)</span>
            </h2>
            <p className="text-xs text-zinc-500">
              Fluxo integrado de produção gastronômica para iFood, WhatsApp, UberEats, Balcão e Mesas com impressão direta.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão Verde: Novo Pedido Delivery */}
            <button
              onClick={() => setIsNewOrderModalOpen(true)}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Pedido Delivery / App</span>
            </button>
          </div>
        </div>

        {/* Shortcuts bar */}
        <div className="mt-3 pt-3 border-t border-zinc-100 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="font-semibold text-zinc-600">Atalhos rápidos:</span>
          <button
            onClick={() => onNavigateTab(1)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Frente de Caixa (PDV) <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(8)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Mesas do Salão <ArrowRight className="w-3 h-3" />
          </button>
          <span>&bull;</span>
          <button
            onClick={() => onNavigateTab(10)}
            className="hover:text-orange-600 underline flex items-center gap-0.5"
          >
            Cadastros de Entregadores <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Kanban Board 4 Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const ColIcon = col.icon;
          const colOrders = orders.filter((o) => o.status === col.status);

          return (
            <div
              key={col.status}
              className="bg-zinc-100/80 rounded-xl p-3 border border-zinc-200 flex flex-col min-h-[580px]"
            >
              {/* Column Header */}
              <div
                className={`p-2.5 rounded-lg border ${col.border} ${col.color} flex items-center justify-between mb-3`}
              >
                <div className="flex items-center gap-2">
                  <ColIcon className="w-4 h-4" />
                  <span className="font-extrabold text-xs uppercase tracking-wide">
                    {col.label}
                  </span>
                </div>
                <span className="font-mono font-bold text-xs bg-white/80 px-2 py-0.5 rounded">
                  {colOrders.length}
                </span>
              </div>

              {/* Column Cards */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {colOrders.length === 0 ? (
                  <div className="text-center py-12 text-zinc-400 text-xs italic">
                    Nenhum pedido nesta etapa.
                  </div>
                ) : (
                  colOrders.map((order) => (
                    <div
                      key={order.id}
                      className="cp-card p-3.5 transition flex flex-col justify-between"
                    >
                      {/* Top badge */}
                      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 mb-2">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded font-extrabold text-[10px] uppercase ${
               order.origem === 'iFood'
                ? 'bg-red-100 text-red-800'
                : order.origem === 'WhatsApp'
                ? 'bg-emerald-100 text-emerald-800'
                : order.origem === 'UberEats'
                ? 'bg-green-100 text-green-900'
                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {order.origemIdentificador || order.origem}
                          </span>
                          <span className="font-mono font-bold text-zinc-800 text-xs">
                            {order.numeroPedido}
                          </span>
                        </div>

                        <div className="text-[10px] text-zinc-500 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          <span>{formatTimeShort(order.dataHora)}</span>
                        </div>
                      </div>

                      {/* Customer & Delivery address */}
                      <div className="space-y-1 mb-2.5 text-xs">
                        <div className="font-bold text-zinc-900 flex items-center gap-1">
                          <User className="w-3 h-3 text-zinc-400" />
                          <span>{order.clienteNome}</span>
                        </div>

                        {order.clienteTelefone && (
                          <div className="text-zinc-600 text-[11px] flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            <span>{order.clienteTelefone}</span>
                          </div>
                        )}

                        {order.clienteEndereco && (
                          <div className="text-zinc-600 text-[10px] flex items-start gap-1 bg-zinc-50 p-1.5 rounded border border-zinc-100">
                            <MapPin className="w-3 h-3 text-zinc-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{order.clienteEndereco}</span>
                          </div>
                        )}

                        {order.entregadorNome && (
                          <div className="text-[11px] text-zinc-700 font-medium flex items-center gap-1 pt-1">
                            <Truck className="w-3 h-3 text-orange-600" />
                            <span>Entregador: {order.entregadorNome}</span>
                          </div>
                        )}
                      </div>

                      {/* Items */}
                      <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/80 text-xs mb-3 space-y-1">
                        {order.itens.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-baseline">
                            <span className="font-medium text-zinc-800">
                              <strong className="text-zinc-950 font-bold">{it.quantidade}x</strong>{' '}
                              {it.descricao}
                            </span>
                            <span className="font-mono text-zinc-600 text-[11px]">
                              {formatCurrency(it.valorTotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.observacoes && (
                        <div className="text-[10px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200 mb-3 font-semibold">
                          Obs: {order.observacoes}
                        </div>
                      )}

                      {/* Cancelamentos registrados pelo caixa */}
                      {(order.cancelamentos || []).length > 0 && (
                        <div className="text-[10px] text-rose-800 bg-rose-50 p-1.5 rounded border border-rose-200 mb-3 font-semibold">
                          <div className="flex items-center gap-1 mb-1">
                            <Ban className="w-3 h-3" />
                            <span>CANCELADOS PELO CAIXA (não produzir):</span>
                          </div>
                          {order.cancelamentos!.map((c, i) => (
                            <div key={i} className="pl-4">
                              {c.quantidade}x {c.descricao}
                              {c.motivo ? ` — ${c.motivo}` : ''}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Card Bottom: Total, Print, Move next */}
                      <div className="flex items-center justify-between pt-2 border-t border-zinc-100">
                        <span className="font-mono font-extrabold text-sm text-zinc-900">
                          {formatCurrency(order.total)}
                        </span>

                        <div className="flex items-center gap-1.5">
                          {/* Botão Azul: Imprimir Pedido na Cozinha */}
                          <button
                            onClick={() => onPrintKitchenOrder(order)}
                            title="Imprimir Comanda de Cozinha"
                            className="p-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                          {/* Move to next step */}
                          {order.status === 'novo' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'preparo')}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 flex items-center gap-1"
                            >
                              <span>Preparar</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {order.status === 'preparo' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'pronto')}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-1"
                            >
                              <span>Pronto</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                          {order.status === 'pronto' && (
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'concluido')}
                              className="px-2.5 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1"
                            >
                              <span>Concluir</span>
                              <CheckCircle className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: New Delivery / App Order */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="cp-card shadow-2xl max-w-xl w-full p-5">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-200">
              <div className="flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-orange-600" />
                <h3 className="font-bold text-sm text-zinc-900">
                  Lançar Pedido de Delivery / Cozinha
                </h3>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 mt-4 text-xs">
              {/* Canal / Origem */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">Canal de Origem:</label>
                  <select
                    value={orderOrigin}
                    onChange={(e) => setOrderOrigin(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg font-bold"
                  >
                    <option value="WhatsApp">WhatsApp Delivery</option>
                    <option value="iFood">iFood Pedidos</option>
                    <option value="UberEats">UberEats</option>
                    <option value="Balcão">Balcão / Retirada</option>
                    <option value="Delivery">Delivery Próprio (PDV)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-zinc-700 block mb-1">
                    Cliente (Cadastrado):
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                  >
                    <option value="">Selecione um cliente...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.telefone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Entregador */}
              <div>
                <label className="font-bold text-zinc-700 block mb-1">
                  Entregador Designado:
                </label>
                <select
                  value={selectedDelivererId}
                  onChange={(e) => setSelectedDelivererId(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-50 border border-zinc-300 rounded-lg"
                >
                  <option value="">Nenhum / Retirada no Balcão</option>
                  {deliverers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nome} - {d.veiculo || 'Moto'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Inserção de Mercadorias */}
              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg space-y-2">
                <label className="font-bold text-zinc-800 block">Adicionar Produtos ao Pedido:</label>
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6">
                    <select
                      value={selectedProdId}
                      onChange={(e) => setSelectedProdId(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-zinc-300 rounded-lg text-xs"
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.descricao} ({formatCurrency(p.precoVenda)})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={itemQty}
                      onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2 py-1.5 text-center bg-white border border-zinc-300 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div className="col-span-4">
                    <button
                      type="button"
                      onClick={handleAddItemToForm}
                      className="w-full py-1.5 px-3 text-xs font-bold rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  placeholder="Observação do item (Ex: Bem passado, sem maionese...)"
                  value={itemObs}
                  onChange={(e) => setItemObs(e.target.value)}
                  className="w-full px-2.5 py-1 bg-white border border-zinc-300 rounded-lg text-[11px]"
                />
              </div>

              {/* Added items list */}
              <div className="max-h-36 overflow-y-auto divide-y divide-zinc-100 border border-zinc-200 rounded-lg p-2">
                {orderItems.length === 0 ? (
                  <div className="text-center py-4 text-zinc-400 text-xs">
                    Nenhum produto adicionado ainda.
                  </div>
                ) : (
                  orderItems.map((it, idx) => (
                    <div key={idx} className="py-1 flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-zinc-900">{it.quantidade}x</strong> {it.descricao}
                        {it.observacao && (
                          <div className="text-[10px] text-amber-700 font-medium">
                            {it.observacao}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-zinc-800">
                          {formatCurrency(it.valorTotal)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFormItem(idx)}
                          className="text-rose-600 p-1 hover:bg-rose-50 rounded"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className="font-semibold text-zinc-700 block mb-1">
                  Observações Gerais do Pedido:
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções de entrega, ponto de referência..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full p-2 bg-zinc-50 border border-zinc-300 rounded-lg text-xs"
                />
              </div>

              {/* Modal footer */}
              <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
                <div className="font-mono text-sm font-extrabold text-zinc-900">
                  Total: {formatCurrency(orderItems.reduce((acc, it) => acc + it.valorTotal, 0))}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewOrderModalOpen(false)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Criar Pedido</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
