import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from '../src/App';
import { DEFAULT_CONFIG, STORAGE_KEYS } from '../src/utils/storage';
import { item, product, table } from './fixtures';

vi.mock('../src/hooks/useAccessLicense', () => ({ useAccessLicense: () => ({ status: 'active', license: { verifiedAt: '2026-10-18T12:00:00Z' }, offline: false }) }));

const readOps = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.OPERATIONS)!);
const readKitchen = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.KITCHEN_ORDERS)!);

function prepare(extra: Record<string, unknown> = {}) {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify({ ...DEFAULT_CONFIG, taxaServicoPadraoPercent: 0, ...extra }));
  localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([product]));
  localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify([table, { numero: 2, status: 'livre', itens: [], total: 0 }]));
  localStorage.setItem(STORAGE_KEYS.SALES, '[]');
}

const finalizarPagamento = () => {
  fireEvent.click(screen.getByText('Adicionar Parcela'));
  fireEvent.click(screen.getByText('Concluir Venda'));
};

describe('PDV completo', () => {
  it('abre comanda de Balcão, lança item, aplica cupom e finaliza como venda de balcão', async () => {
    prepare();
    render(<App />);

    // Modo Balcão + nova comanda
    fireEvent.click(screen.getByRole('tab', { name: /Balcão/i }));
    fireEvent.click(screen.getByText('Nova comanda'));
    fireEvent.change(screen.getByLabelText('Nome do cliente'), { target: { value: 'Hilal Achmad' } });
    fireEvent.click(screen.getByText(/Abrir comanda #1/));

    // Lança o produto
    fireEvent.click(screen.getByRole('button', { name: /Hambúrguer.*5/ }));

    // Cupom de desconto (SABOR10 = 10% do DEFAULT_CONFIG)
    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'sabor10' } });
    fireEvent.click(screen.getByText('Aplicar', { exact: false }));
    expect(screen.getByText(/Cupom SABOR10/)).toBeTruthy();

    // Paga e conclui
    fireEvent.click(screen.getByText('Processar Pagamento'));
    finalizarPagamento();
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Impressão de comprovante' })).toBeTruthy());

    const ops = readOps();
    expect(ops.sales).toHaveLength(1);
    expect(ops.sales[0].tipoAtendimento).toBe('Balcão');
    expect(ops.sales[0].numeroComanda).toBe(1);
    expect(ops.sales[0].clienteNome).toBe('Hilal Achmad');
    expect(ops.sales[0].cupomCodigo).toBe('SABOR10');
    expect(ops.sales[0].descontoPercent).toBe(10);
    expect(ops.sales[0].descontoValor).toBe(1); // 10% de R$ 10,00 (1 item)
    expect(ops.sales[0].totalLiquido).toBe(9);
    // Comanda avulsa é consumida na venda
    expect(ops.comandas).toHaveLength(0);
    // Estoque baixado (5 - 1 item vendido)
    expect(ops.products[0].estoque).toBe(4);
  });

  it('cria comanda de Delivery com endereço e o endereço vai na venda', async () => {
    prepare();
    render(<App />);

    fireEvent.click(screen.getByRole('tab', { name: /Delivery/i }));
    fireEvent.click(screen.getByText('Nova comanda'));
    fireEvent.change(screen.getByLabelText('Nome do cliente'), { target: { value: 'Fernanda Lima' } });
    fireEvent.change(screen.getByLabelText('Endereço de entrega'), { target: { value: 'Rua Ceará, 850 - Itaigara' } });
    fireEvent.click(screen.getByText(/Abrir comanda #1/));

    fireEvent.click(screen.getByRole('button', { name: /Hambúrguer.*5/ }));
    fireEvent.click(screen.getByText('Processar Pagamento'));
    finalizarPagamento();
    await waitFor(() => expect(screen.getByRole('dialog', { name: 'Impressão de comprovante' })).toBeTruthy());

    const venda = readOps().sales[0];
    expect(venda.tipoAtendimento).toBe('Delivery');
    expect(venda.enderecoEntrega).toBe('Rua Ceará, 850 - Itaigara');
    expect(venda.clienteNome).toBe('Fernanda Lima');
  });

  it('move a comanda de uma mesa livre para outra mantendo itens', () => {
    prepare();
    render(<App />);

    // Mesa 1 já vem com item do fixture
    fireEvent.click(screen.getByText('Mover mesa'));
    const dialog = screen.getByRole('dialog', { name: /Mover comanda/ });
    fireEvent.click(within(dialog).getByText('02', { exact: true }));
    fireEvent.click(within(dialog).getByText('Mover para Mesa 02'));

    const ops = readOps();
    expect(ops.tables[0].itens).toHaveLength(0);
    expect(ops.tables[0].status).toBe('livre');
    expect(ops.tables[1].itens).toHaveLength(1);
    expect(ops.tables[1].status).toBe('ocupada');
  });

  it('divide a comanda: itens marcados viram nova comanda de balcão', () => {
    prepare();
    // Duas linhas na mesa: mesmo produto com observações diferentes
    const comDuasLinhas = {
      ...table,
      itens: [
        { ...item, observacao: 'sem cebola' },
        { ...item, id: 'i2', observacao: 'sem gelo' },
      ],
      total: 40,
    };
    localStorage.setItem(STORAGE_KEYS.TABLES, JSON.stringify([comDuasLinhas, { numero: 2, status: 'livre', itens: [], total: 0 }]));
    render(<App />);

    fireEvent.click(screen.getByText('Dividir comanda'));
    const checks = screen.getAllByRole('checkbox');
    fireEvent.click(checks[0]);
    fireEvent.click(screen.getByText('Separar em nova comanda'));

    const ops = readOps();
    // Mesa fica com 1 linha; nova comanda de balcão com a outra
    expect(ops.tables[0].itens).toHaveLength(1);
    expect(ops.comandas).toHaveLength(1);
    expect(ops.comandas[0].itens).toHaveLength(1);
    expect(ops.comandas[0].tipo).toBe('Balcão');
    expect(ops.comandas[0].numero).toBe(1);
  });

  it('cancela item já enviado à cozinha e registra o cancelamento no KDS', () => {
    prepare();
    render(<App />);
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const prompt = vi.spyOn(window, 'prompt').mockReturnValue('Cliente desistiu');

    // Envia à cozinha
    fireEvent.click(screen.getByText('Para a cozinha'));
    expect(readKitchen()).toHaveLength(1);

    // Remove o item (já enviado) -> confirma cancelamento
    fireEvent.click(screen.getByLabelText('Excluir Hambúrguer'));
    expect(confirm).toHaveBeenCalled();
    expect(prompt).toHaveBeenCalled();

    const kOrders = readKitchen();
    expect(kOrders[0].cancelamentos).toHaveLength(1);
    expect(kOrders[0].cancelamentos[0].descricao).toBe('Hambúrguer');
    expect(kOrders[0].cancelamentos[0].quantidade).toBe(2);

    // Controle de envio zerado: pode enviar de novo sem alerta de "já enviados"
    const ops = readOps();
    expect(ops.tables[0].itens).toHaveLength(0);
    confirm.mockRestore();
    prompt.mockRestore();
  });

  it('numera comandas em sequência (mesa e balcão compartilham o contador)', () => {
    prepare();
    render(<App />);

    // Primeiro lançamento na mesa 1 recebe comanda #1
    fireEvent.click(screen.getByRole('button', { name: /Hambúrguer.*5/ }));
    expect(readOps().tables[0].numeroComanda).toBe(1);

    // Abre comanda de balcão: próximo número é 2
    fireEvent.click(screen.getByRole('tab', { name: /Balcão/i }));
    fireEvent.click(screen.getByText('Nova comanda'));
    fireEvent.click(screen.getByText(/Abrir comanda #2/));
    const ops = readOps();
    expect(ops.comandas).toHaveLength(1);
    expect(ops.comandas[0].numero).toBe(2);
  });

  it('rejeita cupom inválido e não aplica desconto', () => {
    prepare();
    render(<App />);
    const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});

    fireEvent.click(screen.getByRole('button', { name: /Hambúrguer.*5/ }));
    fireEvent.change(screen.getByLabelText('Cupom de desconto'), { target: { value: 'NAOEXISTE' } });
    fireEvent.click(screen.getByText('Aplicar', { exact: false }));
    expect(alert).toHaveBeenCalledWith(expect.stringContaining('Cupom inválido'));
    alert.mockRestore();
  });
});
