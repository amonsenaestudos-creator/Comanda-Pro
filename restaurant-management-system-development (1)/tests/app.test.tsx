import React from 'react';
import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { App } from '../src/App';
import { DEFAULT_CONFIG, STORAGE_KEYS, createInitialSales, createInitialTables, createInitialKitchenOrders } from '../src/utils/storage';
import { item, product, table } from './fixtures';

vi.mock('../src/hooks/useAccessLicense', () => ({ useAccessLicense: () => ({ status: 'active', license: { verifiedAt: '2026-10-18T12:00:00Z' }, offline: false }) }));
function prepare() {
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ ...DEFAULT_CONFIG, taxaServicoPadraoPercent: 0 }));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([product]));
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify([table, { numero: 2, status: 'livre', itens: [], total: 0 }]));
  localStorage.setItem(STORAGE_KEYS.SALES, '[]');
}
it('instalações novas não começam com vendas e pedidos fictícios', () => {
  expect(createInitialSales()).toEqual([]);
  expect(createInitialKitchenOrders()).toEqual([]);
  expect(createInitialTables().every(t => t.status === 'livre' && t.itens.length === 0)).toBe(true);
});
it('F2 carrega a mesa, conclui e persiste venda + estoque + liberação, sem repetir após recarga', async () => {
  prepare();
  const { unmount } = render(<App />);
  fireEvent.keyDown(window, { key: 'F2' });
  expect(screen.getByText('Checkout & Pagamento')).toBeTruthy();
  fireEvent.click(screen.getByText('Adicionar Parcela'));
  fireEvent.click(screen.getByText('Concluir Venda'));
  await waitFor(() => expect(screen.getByRole('dialog', { name: 'Impressão de comprovante' })).toBeTruthy());
  const state = JSON.parse(localStorage.getItem(STORAGE_KEYS.OPERATIONS)!);
  expect(state.sales).toHaveLength(1);
  expect(state.sales[0].itens).toEqual([item]);
  expect(state.products[0].estoque).toBe(3);
  expect(state.tables[0].itens).toEqual([]);
  unmount(); render(<App />);
  fireEvent.keyDown(window, { key: 'F2' });
  expect(screen.getByText('Nenhuma Venda Selecionada para Pagamento')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.OPERATIONS)!).sales).toHaveLength(1);
});
it('falha de armazenamento não libera mesa nem confirma a venda', async () => {
  prepare(); render(<App />);
  fireEvent.keyDown(window, { key: 'F2' });
  fireEvent.click(screen.getByText('Adicionar Parcela'));
  const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Quota exceeded', 'QuotaExceededError'); });
  fireEvent.click(screen.getByText('Concluir Venda'));
  expect(alert).toHaveBeenCalledWith(expect.stringContaining('Não foi possível salvar a venda'));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.OPERATIONS)!).tables[0].itens).toHaveLength(1);
  expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.OPERATIONS)!).sales).toHaveLength(0);
});
it('reenvia à cozinha somente os acréscimos', () => {
  prepare(); render(<App />);
  const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
  fireEvent.click(screen.getByText('Para a cozinha'));
  fireEvent.click(screen.getByText('Para a cozinha'));
  expect(alert).toHaveBeenCalledWith(expect.stringContaining('já foram enviados'));
  fireEvent.click(screen.getByLabelText('Aumentar quantidade de Hambúrguer'));
  fireEvent.click(screen.getByText('Para a cozinha'));
  const orders = JSON.parse(localStorage.getItem(STORAGE_KEYS.KITCHEN_ORDERS)!);
  expect(orders).toHaveLength(2);
  expect(orders[0].itens[0].quantidade).toBe(1);
  expect(orders[1].itens[0].quantidade).toBe(2);
});
