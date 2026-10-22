import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PrintTicketModal } from '../src/components/PrintTicketModal';
import { Tab2Pagamento } from '../src/components/tabs/Tab2Pagamento';
import { Tab1Pdv } from '../src/components/tabs/Tab1Pdv';
import { DEFAULT_CONFIG } from '../src/utils/storage';
import { item, product, table } from './fixtures';
const order = { mesa: 1, itens: [item], subtotal: 20 };

describe('impressão', () => {
  it('renderiza fora do app, permite 58mm e preserva a data original', () => {
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const { container } = render(<PrintTicketModal isOpen onClose={() => {}} ticketType="cupom_venda" config={DEFAULT_CONFIG} itens={[item]} subtotal={20} totalLiquido={20} dataHora="2020-01-01T12:00:00Z" />);
    expect(container.querySelector('.printable-area')).toBeNull();
    const ticket = document.body.querySelector('.printable-area')!;
    expect(ticket.closest('.no-print')).toBeNull();
    expect(ticket.textContent).toContain('01/01/2020');
    fireEvent.change(screen.getByLabelText('Largura da bobina'), { target: { value: '58' } });
    expect((ticket as HTMLElement).style.width).toBe('58mm');
    fireEvent.click(screen.getByText('Imprimir Agora'));
    expect(print).toHaveBeenCalledOnce();
  });
});

describe('pagamento', () => {
  const props = { currentOrder: order, employees: [], config: { ...DEFAULT_CONFIG, taxaServicoPadraoPercent: 0, descontoMaximoPercent: 0 }, onNavigateTab: vi.fn(), onOpenReceiptPrint: vi.fn() };
  it('respeita taxa zero e não aceita faltar um centavo', async () => {
    const finish = vi.fn(() => true); const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<Tab2Pagamento {...props} onFinishSale={finish} />);
    fireEvent.click(screen.getByText('Concluir Venda'));
    expect(finish).not.toHaveBeenCalled(); expect(alert).toHaveBeenCalled();
    fireEvent.click(screen.getByText('Adicionar Parcela'));
    fireEvent.click(screen.getByText('Concluir Venda'));
    expect(finish).toHaveBeenCalledOnce();
    expect(finish.mock.calls[0][0]).toMatchObject({ totalLiquido: 20, taxaServicoValor: 0, mesa: 1 });
    fireEvent.click(screen.getByText('Concluir Venda'));
    expect(finish).toHaveBeenCalledOnce();
  });
  it('limpa parcelas ao mudar o total e ao trocar de mesa', async () => {
    const finish = vi.fn(() => true);
    const { rerender } = render(<Tab2Pagamento {...props} onFinishSale={finish} />);
    fireEvent.click(screen.getByText('Adicionar Parcela'));
    expect(screen.getByText('Pagamentos Registrados (1)')).toBeTruthy();
    rerender(<Tab2Pagamento {...props} currentOrder={{ ...order, mesa: 2 }} onFinishSale={finish} />);
    await waitFor(() => expect(screen.getByText('Pagamentos Registrados (0)')).toBeTruthy());
  });
});

describe('lançamento de itens', () => {
  it('não mistura observações diferentes nem permite ultrapassar o estoque', () => {
    const save = vi.fn(); const alert = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<Tab1Pdv products={[product]} tables={[{ ...table, itens: [{ ...item, observacao: 'sem cebola' }] }]} comandas={[]} employees={[]} sales={[]} proximoNumeroComanda={1} onSaveTableItems={save} onGoToPayment={() => {}} onSendToKitchen={() => true} onPrintTableTicket={() => {}} onNavigateTab={() => {}} config={DEFAULT_CONFIG} onCreateComandaAvulsa={() => ({ id: 'x', numero: 1, tipo: 'Balcão', itens: [], subtotal: 0, abertura: '' }) as any} onSaveComanda={() => {}} onDeleteComanda={() => {}} onUpdateComandaContext={() => {}} onTransferTable={() => false} onDividirComanda={() => null} onCancelKitchenItems={() => {}} onAdjustSentItems={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Hambúrguer.*5/ }));
    expect(save.mock.calls[0][1]).toHaveLength(2);
    fireEvent.change(screen.getByLabelText('Quantidade do item'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /Hambúrguer.*5/ }));
    expect(save).toHaveBeenCalledOnce(); expect(alert).toHaveBeenCalled();
  });
});
