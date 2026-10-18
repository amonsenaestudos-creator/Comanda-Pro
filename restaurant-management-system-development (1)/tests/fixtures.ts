import { OrderItem, Product, Sale, Table } from '../src/types';
export const item: OrderItem = { id: 'i1', productId: 'p1', ean: '123', descricao: 'Hambúrguer', unidade: 'UN', precoUnitario: 10, quantidade: 2, valorTotal: 20, setor: 'Alimentos' };
export const product: Product = { id: 'p1', ean: '123', descricao: 'Hambúrguer', unidade: 'UN', precoVenda: 10, setor: 'Alimentos', estoque: 5 };
export const table: Table = { numero: 1, status: 'ocupada', itens: [item], total: 20 };
export const sale: Sale = { id: 'v1', dataHora: '2026-10-18T12:00:00Z', mesa: 1, tipoAtendimento: 'Mesa', itens: [item], subtotal: 20, taxaServicoPercent: 0, taxaServicoValor: 0, descontoPercent: 0, descontoValor: 0, totalLiquido: 20, pagamentos: [{ metodo: 'PIX', valor: 20 }], atendente: 'Ana', impostosEstimados: 0 };

