import { ComandaAvulsa, OrderItem, PaymentSplit, Product, Sale, Table } from '../types';

export const cents = (value: number): number => Math.round((value + Number.EPSILON) * 100);
export const money = (value: number): number => cents(value) / 100;
export const orderSubtotal = (items: OrderItem[]): number =>
  items.reduce((sum, item) => sum + cents(item.precoUnitario * item.quantidade), 0) / 100;

export function validatePayments(total: number, splits: PaymentSplit[], cashGiven?: number): string | null {
  if (!Number.isFinite(total) || total < 0) return 'Total da venda inválido.';
  if (splits.some(p => !Number.isFinite(p.valor) || p.valor <= 0)) return 'Pagamento inválido.';
  if (splits.reduce((sum, p) => sum + cents(p.valor), 0) !== cents(total)) {
    return 'Os pagamentos devem corresponder exatamente ao total. Revise as parcelas.';
  }
  const cash = splits.filter(p => p.metodo === 'Dinheiro').reduce((sum, p) => sum + cents(p.valor), 0);
  if (cash > 0 && cashGiven !== undefined && (!Number.isFinite(cashGiven) || cents(cashGiven) < cash)) {
    return 'O valor entregue em dinheiro é menor que a parcela em dinheiro.';
  }
  return null;
}

/** Validates again at the application boundary, not only in the checkout UI. */
export function completeSale(
  sale: Sale,
  sales: Sale[],
  tables: Table[],
  products: Product[],
  comandas: ComandaAvulsa[] = []
) {
  if (sales.some(s => s.id === sale.id)) throw new Error('Esta venda já foi registrada.');
  if (!sale.itens.length || sale.itens.some(i => !Number.isFinite(i.quantidade) || i.quantidade <= 0 || !Number.isFinite(i.precoUnitario) || i.precoUnitario < 0 || cents(i.valorTotal) !== cents(i.precoUnitario * i.quantidade))) {
    throw new Error('A comanda contém itens ou valores inválidos.');
  }
  if (cents(orderSubtotal(sale.itens)) !== cents(sale.subtotal) ||
      ![sale.taxaServicoValor, sale.descontoValor, sale.totalLiquido].every(n => Number.isFinite(n) && n >= 0) ||
      cents(sale.subtotal + sale.taxaServicoValor - sale.descontoValor) !== cents(sale.totalLiquido)) {
    throw new Error('O total da venda não confere com os itens.');
  }
  const error = validatePayments(sale.totalLiquido, sale.pagamentos);
  if (error) throw new Error(error);
  if (typeof sale.mesa === 'number') {
    const table = tables.find(t => t.numero === sale.mesa);
    if (!table || JSON.stringify(table.itens) !== JSON.stringify(sale.itens)) {
      throw new Error('A mesa foi alterada. Volte ao caixa e abra o pagamento novamente.');
    }
  }
  // Comanda avulsa (Balcão/Delivery): precisa continuar aberta e íntegra.
  if (sale.comandaId && typeof sale.mesa !== 'number') {
    const comanda = comandas.find(c => c.id === sale.comandaId);
    if (!comanda || JSON.stringify(comanda.itens) !== JSON.stringify(sale.itens)) {
      throw new Error('A comanda foi alterada. Volte ao caixa e abra o pagamento novamente.');
    }
  }
  const quantities = new Map<string, number>();
  sale.itens.forEach(i => quantities.set(i.productId, (quantities.get(i.productId) ?? 0) + i.quantidade));
  for (const [id, qty] of quantities) {
    const product = products.find(p => p.id === id);
    if (!product || !Number.isFinite(product.estoque) || product.estoque < qty) {
      throw new Error(`Estoque insuficiente ou produto removido: ${product?.descricao ?? id}. Revise o estoque antes de concluir.`);
    }
  }
  return {
    sales: [sale, ...sales],
    tables: tables.map(t => t.numero === sale.mesa ? { numero: t.numero, status: 'livre' as const, itens: [], total: 0 } : t),
    products: products.map(p => ({ ...p, estoque: Number((p.estoque - (quantities.get(p.id) ?? 0)).toFixed(6)) })),
    comandas: comandas.filter(c => c.id !== sale.comandaId),
  };
}
