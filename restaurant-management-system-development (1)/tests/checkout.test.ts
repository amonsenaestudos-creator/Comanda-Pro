import { describe, expect, it } from 'vitest';
import { completeSale, orderSubtotal, validatePayments } from '../src/utils/checkout';
import { buildPixPayload, crc16 } from '../src/utils/pix';

import { item, product, table, sale } from './fixtures';

describe('checkout em centavos', () => {
  it('arredonda por linha e não perde um centavo', () => {
    expect(orderSubtotal([{ ...item, precoUnitario: 0.1, quantidade: 3 }])).toBe(0.3);
    expect(validatePayments(0.3, [{ metodo: 'PIX', valor: 0.1 }, { metodo: 'Dinheiro', valor: 0.2 }])).toBeNull();
    expect(validatePayments(20, [{ metodo: 'PIX', valor: 19.99 }])).not.toBeNull();
  });
  it('rejeita pagamento excessivo, infinito e dinheiro insuficiente', () => {
    expect(validatePayments(20, [{ metodo: 'PIX', valor: 21 }])).not.toBeNull();
    expect(validatePayments(20, [{ metodo: 'PIX', valor: Infinity }])).not.toBeNull();
    expect(validatePayments(20, [{ metodo: 'Dinheiro', valor: 20 }], 10)).not.toBeNull();
  });
  it('conclui sem mutar os dados originais e baixa o estoque uma vez', () => {
    const next = completeSale(sale, [], [table, { ...table, numero: 2 }], [product]);
    expect(next.products[0].estoque).toBe(3);
    expect(next.tables[0].status).toBe('livre');
    expect(next.tables[1].itens).toHaveLength(1);
    expect(product.estoque).toBe(5);
    expect(() => completeSale(sale, next.sales, next.tables, next.products)).toThrow('já foi registrada');
  });
  it('rejeita estoque insuficiente, comanda obsoleta e total adulterado', () => {
    expect(() => completeSale(sale, [], [table], [{ ...product, estoque: 1 }])).toThrow('Estoque insuficiente');
    expect(() => completeSale(sale, [], [{ ...table, itens: [] }], [product])).toThrow('mesa foi alterada');
    expect(() => completeSale({ ...sale, subtotal: 0 }, [], [table], [product])).toThrow('total');
  });
});

describe('PIX BR Code', () => {
  it('usa CRC16/CCITT-FALSE conhecido', () => expect(crc16('123456789')).toBe('29B1'));
  it('codifica campos com comprimento dinâmico e CRC válido', () => {
    const payload = buildPixPayload('financeiro@example.com', 'Açaí da Praça', 'Dias d’Ávila', 12.34);
    expect(payload).toContain('br.gov.bcb.pix');
    expect(payload).toContain('540512.34');
    expect(payload).toContain('ACAI DA PRACA');
    expect(payload.slice(-4)).toBe(crc16(payload.slice(0, -4)));
    let offset = 0;
    while (offset < payload.length) {
      const length = Number(payload.slice(offset + 2, offset + 4));
      expect(Number.isFinite(length)).toBe(true);
      offset += 4 + length;
    }
    expect(offset).toBe(payload.length);
  });
  it('não cobra com chave ausente ou valor inválido', () => {
    expect(() => buildPixPayload('', 'Loja', 'Salvador', 10)).toThrow();
    expect(() => buildPixPayload('a@b.com', 'Loja', 'Salvador', NaN)).toThrow();
  });
});
