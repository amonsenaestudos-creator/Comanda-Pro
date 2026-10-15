import type { CaixaMovimento, CaixaSessao, Sale } from '../types';

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export const newId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

export const findOpenCaixa = (sessoes: CaixaSessao[]): CaixaSessao | undefined =>
  sessoes.find((s) => s.status === 'aberto');

export interface ResumoCaixa {
  vendasCount: number;
  totalVendas: number;
  porMetodo: Record<string, number>;
  dinheiroVendas: number;
  suprimentos: number;
  sangrias: number;
  fundoInicial: number;
  /** Dinheiro que deveria estar na gaveta agora. */
  dinheiroEsperado: number;
  ticketMedio: number;
}

/**
 * Calcula o resumo de uma sessão de caixa.
 * Dinheiro na gaveta = fundo + pagamentos em dinheiro (já líquidos de troco)
 *                      + suprimentos - sangrias.
 */
export function resumoCaixa(sessao: CaixaSessao, sales: Sale[]): ResumoCaixa {
  const vendas = sales.filter((s) => s.caixaId === sessao.id);
  const porMetodo: Record<string, number> = {};
  let totalVendas = 0;

  for (const venda of vendas) {
    totalVendas += venda.totalLiquido;
    for (const pag of venda.pagamentos) {
      porMetodo[pag.metodo] = round2((porMetodo[pag.metodo] || 0) + pag.valor);
    }
  }

  const sumMov = (tipo: CaixaMovimento['tipo']) =>
    round2(
      sessao.movimentos.filter((m) => m.tipo === tipo).reduce((acc, m) => acc + m.valor, 0)
    );

  const suprimentos = sumMov('suprimento');
  const sangrias = sumMov('sangria');
  const dinheiroVendas = porMetodo['Dinheiro'] || 0;
  const dinheiroEsperado = round2(sessao.fundoInicial + dinheiroVendas + suprimentos - sangrias);

  return {
    vendasCount: vendas.length,
    totalVendas: round2(totalVendas),
    porMetodo,
    dinheiroVendas,
    suprimentos,
    sangrias,
    fundoInicial: sessao.fundoInicial,
    dinheiroEsperado,
    ticketMedio: vendas.length ? round2(totalVendas / vendas.length) : 0,
  };
}

/** Diferença entre o contado e o esperado (positivo = sobra, negativo = falta). */
export const diferencaCaixa = (contado: number, esperado: number) => round2(contado - esperado);
