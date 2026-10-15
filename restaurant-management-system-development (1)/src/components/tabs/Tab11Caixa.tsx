import React, { useMemo, useState } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  CheckCircle2,
  CreditCard,
  Lock,
  LockOpen,
  Receipt,
  TrendingUp,
  Wallet,
  Ban,
} from 'lucide-react';
import type {
  CancelamentoItem,
  CaixaMovimentoTipo,
  CaixaSessao,
  Employee,
  KitchenOrder,
  Sale,
  Table,
} from '../../types';
import { formatCurrency, formatDateTime, formatTimeShort } from '../../utils/formatters';
import { diferencaCaixa, findOpenCaixa, resumoCaixa } from '../../utils/caixa';
import { Badge, Card, Modal, PageHeader, buttonClass } from '../ui';
import { cn } from '../../utils/cn';

interface Tab11CaixaProps {
  sessions: CaixaSessao[];
  sales: Sale[];
  tables: Table[];
  kitchenOrders: KitchenOrder[];
  cancellations: CancelamentoItem[];
  operador: Employee;
  onOpenCaixa: (fundoInicial: number) => void;
  onAddMovimento: (tipo: CaixaMovimentoTipo, valor: number, motivo: string) => void;
  onCloseCaixa: (dinheiroContado: number, observacao: string) => void;
  onNavigateTab: (tabId: number) => void;
}

const parseMoney = (raw: string) => {
  const n = Number(raw.replace(',', '.'));
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};

const MOTIVOS_SANGRIA = ['Pagamento de fornecedor', 'Troca de cédulas', 'Retirada do gerente', 'Despesa miúda', 'Outro'];
const MOTIVOS_SUPRIMENTO = ['Reforço de troco', 'Ajuste de caixa', 'Outro'];

export const Tab11Caixa: React.FC<Tab11CaixaProps> = ({
  sessions,
  sales,
  tables,
  kitchenOrders,
  cancellations,
  operador,
  onOpenCaixa,
  onAddMovimento,
  onCloseCaixa,
  onNavigateTab,
}) => {
  const caixa = findOpenCaixa(sessions);
  const historico = useMemo(
    () => sessions.filter((s) => s.status === 'fechado').sort((a, b) => (b.fechamento || '').localeCompare(a.fechamento || '')),
    [sessions]
  );

  const [fundoInput, setFundoInput] = useState('100,00');
  const [movTipo, setMovTipo] = useState<CaixaMovimentoTipo | null>(null);
  const [movValor, setMovValor] = useState('');
  const [movMotivo, setMovMotivo] = useState('');
  const [closeOpen, setCloseOpen] = useState(false);
  const [contadoInput, setContadoInput] = useState('');
  const [closeObs, setCloseObs] = useState('');
  const [closeError, setCloseError] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const resumo = caixa ? resumoCaixa(caixa, sales) : null;
  const pendentesCozinha = kitchenOrders.filter((k) => k.status === 'novo' || k.status === 'preparo').length;
  const ocupadas = tables.filter((t) => t.status === 'ocupada').length;
  const solicitadas = tables.filter((t) => t.status === 'conta_solicitada').length;

  const cancelamentosSessao = caixa
    ? cancellations.filter((c) => c.dataHora >= caixa.abertura)
    : [];

  const vendasPorAtendente = useMemo(() => {
    if (!caixa) return [] as [string, number][];
    const map: Record<string, number> = {};
    sales
      .filter((s) => s.caixaId === caixa.id)
      .forEach((s) => {
        map[s.atendente || 'Não identificado'] = (map[s.atendente || 'Não identificado'] || 0) + s.totalLiquido;
      });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [caixa, sales]);

  const metodosOrdenados = resumo
    ? Object.entries(resumo.porMetodo).sort((a, b) => b[1] - a[1])
    : [];
  const maxMetodo = metodosOrdenados.reduce((m, [, v]) => Math.max(m, v), 0) || 1;

  // Fechamento: diferença em tempo real
  const contado = parseMoney(contadoInput);
  const esperado = resumo?.dinheiroEsperado ?? 0;
  const diferenca = Number.isFinite(contado) ? diferencaCaixa(contado, esperado) : null;

  const handleOpen = () => {
    const v = parseMoney(fundoInput);
    if (!Number.isFinite(v) || v < 0) {
      setErro('Informe um fundo de troco válido (0 ou mais).');
      return;
    }
    setErro(null);
    onOpenCaixa(v);
  };

  const openMov = (tipo: CaixaMovimentoTipo) => {
    setMovTipo(tipo);
    setMovValor('');
    setMovMotivo(tipo === 'sangria' ? MOTIVOS_SANGRIA[0] : MOTIVOS_SUPRIMENTO[0]);
    setErro(null);
  };

  const submitMov = () => {
    if (!movTipo) return;
    const v = parseMoney(movValor);
    if (!Number.isFinite(v) || v <= 0) {
      setErro('Informe um valor maior que zero.');
      return;
    }
    if (movTipo === 'sangria' && resumo && v > resumo.dinheiroEsperado) {
      setErro(`A sangria (${formatCurrency(v)}) é maior que o dinheiro disponível na gaveta (${formatCurrency(resumo.dinheiroEsperado)}).`);
      return;
    }
    onAddMovimento(movTipo, v, movMotivo);
    setMovTipo(null);
  };

  const openClose = () => {
    setContadoInput(esperado.toFixed(2).replace('.', ','));
    setCloseObs('');
    setCloseError(null);
    setCloseOpen(true);
  };

  const submitClose = () => {
    if (!Number.isFinite(contado) || contado < 0) {
      setCloseError('Informe o valor em dinheiro contado na gaveta.');
      return;
    }
    setCloseError(null);
    onCloseCaixa(contado, closeObs.trim());
    setCloseOpen(false);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<Wallet className="h-5 w-5" />}
        title="Caixa"
        description={
          caixa
            ? `Aberto por ${caixa.operador} às ${formatTimeShort(caixa.abertura)} — vendas do turno são contadas a partir daqui.`
            : 'Abra o caixa para começar a receber pagamentos do turno.'
        }
        actions={
          <>
            <button type="button" onClick={() => onNavigateTab(1)} className={buttonClass('ghost', 'sm')}>
              Frente de Caixa
            </button>
            <button type="button" onClick={() => onNavigateTab(2)} className={buttonClass('primary', 'sm')}>
              <CreditCard className="h-3.5 w-3.5" /> Pagamentos
            </button>
          </>
        }
      />

      {!caixa ? (
        /* ===== CAIXA FECHADO ===== */
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
          <Card className="p-5 sm:p-6 lg:col-span-2">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <Lock className="h-5 w-5" />
              </span>
              <div>
                <p className="font-extrabold text-zinc-900">Caixa fechado</p>
                <p className="text-xs text-zinc-500">Pagamentos ficam bloqueados até a abertura.</p>
              </div>
            </div>

            <div className="mt-5 space-y-2">
              <label htmlFor="fundo" className="block text-xs font-bold uppercase tracking-wide text-zinc-600">
                Fundo de troco inicial (R$)
              </label>
              <input
                id="fundo"
                inputMode="decimal"
                value={fundoInput}
                onChange={(e) => setFundoInput(e.target.value)}
                className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 font-mono text-lg font-bold text-zinc-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
              />
              <p className="text-xs text-zinc-500">Dinheiro miúdo separado para dar troco no início do turno.</p>
              {erro && <p className="text-xs font-semibold text-rose-600">{erro}</p>}
            </div>

            <button type="button" onClick={handleOpen} className={cn(buttonClass('success', 'lg'), 'mt-5 w-full')}>
              <LockOpen className="h-5 w-5" /> Abrir caixa
            </button>
            <p className="mt-3 text-center text-[11px] text-zinc-400">Operador: {operador.nome}</p>
          </Card>

          <Card className="p-5 sm:p-6 lg:col-span-3">
            <h3 className="font-extrabold text-zinc-900">Histórico de caixas</h3>
            <p className="mb-4 text-xs text-zinc-500">Últimos fechamentos com conferência.</p>
            <HistoricoTable sessions={historico} />
          </Card>
        </div>
      ) : (
        /* ===== CAIXA ABERTO ===== */
        <>
          {/* Indicadores */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard
              label="Dinheiro na gaveta"
              value={formatCurrency(resumo?.dinheiroEsperado ?? 0)}
              hint={`Fundo ${formatCurrency(caixa.fundoInicial)}`}
              icon={<Wallet className="h-4 w-4" />}
              tone="emerald"
            />
            <StatCard
              label="Vendas do turno"
              value={formatCurrency(resumo?.totalVendas ?? 0)}
              hint={`${resumo?.vendasCount ?? 0} venda(s)`}
              icon={<Receipt className="h-4 w-4" />}
              tone="sky"
            />
            <StatCard
              label="Ticket médio"
              value={resumo?.vendasCount ? formatCurrency(resumo.ticketMedio) : '—'}
              hint="Por venda concluída"
              icon={<TrendingUp className="h-4 w-4" />}
              tone="orange"
            />
            <StatCard
              label="Operação agora"
              value={`${ocupadas} mesas`}
              hint={`${solicitadas} conta(s) pedida(s) · ${pendentesCozinha} na cozinha`}
              icon={<CheckCircle2 className="h-4 w-4" />}
              tone="zinc"
              onClick={() => onNavigateTab(8)}
            />
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
            {/* Coluna esquerda: meios de pagamento e movimentos */}
            <div className="space-y-5 xl:col-span-2">
              <Card className="p-5">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-extrabold text-zinc-900">Recebimentos por meio de pagamento</h3>
                  <Badge tone="green">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Caixa aberto
                  </Badge>
                </div>
                {metodosOrdenados.length === 0 ? (
                  <EmptyState text="Nenhum pagamento recebido neste turno ainda." />
                ) : (
                  <ul className="space-y-3">
                    {metodosOrdenados.map(([metodo, valor]) => (
                      <li key={metodo}>
                        <div className="mb-1 flex items-center justify-between text-sm">
                          <span className="font-semibold text-zinc-800">{metodo}</span>
                          <span className="font-mono font-bold text-zinc-900">{formatCurrency(valor)}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                          <div
                            className={cn('h-2 rounded-full', metodo === 'Dinheiro' ? 'bg-emerald-500' : 'bg-orange-500')}
                            style={{ width: `${(valor / maxMetodo) * 100}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="font-extrabold text-zinc-900">Movimentos de dinheiro</h3>
                    <p className="text-xs text-zinc-500">Sangrias e suprimentos entram no cálculo da gaveta.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openMov('suprimento')} className={buttonClass('info', 'sm')}>
                      <ArrowDownToLine className="h-3.5 w-3.5" /> Suprimento
                    </button>
                    <button type="button" onClick={() => openMov('sangria')} className={buttonClass('danger', 'sm')}>
                      <ArrowUpFromLine className="h-3.5 w-3.5" /> Sangria
                    </button>
                  </div>
                </div>

                {caixa.movimentos.length === 0 ? (
                  <EmptyState text="Nenhuma sangria ou suprimento registrado." />
                ) : (
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                    {[...caixa.movimentos].reverse().map((m) => (
                      <div key={m.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                        <div className="flex min-w-0 items-center gap-3">
                          <span
                            className={cn(
                              'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                              m.tipo === 'sangria' ? 'bg-rose-50 text-rose-600' : 'bg-sky-50 text-sky-600'
                            )}
                          >
                            {m.tipo === 'sangria' ? <ArrowUpFromLine className="h-4 w-4" /> : <ArrowDownToLine className="h-4 w-4" />}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-semibold capitalize text-zinc-900">
                              {m.tipo} · <span className="font-normal text-zinc-600">{m.motivo}</span>
                            </p>
                            <p className="text-[11px] text-zinc-500">
                              {formatTimeShort(m.dataHora)} · {m.operador}
                            </p>
                          </div>
                        </div>
                        <span className={cn('shrink-0 font-mono font-bold', m.tipo === 'sangria' ? 'text-rose-600' : 'text-sky-700')}>
                          {m.tipo === 'sangria' ? '−' : '+'}
                          {formatCurrency(m.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="mb-4 font-extrabold text-zinc-900">Cancelamentos do turno</h3>
                {cancelamentosSessao.length === 0 ? (
                  <EmptyState text="Nenhum item cancelado desde a abertura do caixa." />
                ) : (
                  <div className="divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                    {cancelamentosSessao.slice(0, 20).map((c) => (
                      <div key={c.id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                        <div className="flex min-w-0 items-center gap-3">
                          <Ban className="h-4 w-4 shrink-0 text-rose-500" />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-zinc-900">
                              {c.quantidade}× {c.descricao}
                            </p>
                            <p className="truncate text-[11px] text-zinc-500">
                              Mesa {c.mesa} · {c.motivo} · {c.operador} · {formatTimeShort(c.dataHora)}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono font-bold text-rose-600">{formatCurrency(c.valor)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Coluna direita: fechamento e atendentes */}
            <div className="space-y-5">
              <Card className="p-5">
                <h3 className="font-extrabold text-zinc-900">Fechar caixa</h3>
                <p className="mb-4 text-xs text-zinc-500">
                  Conte o dinheiro da gaveta e informe o valor. O sistema calcula a diferença.
                </p>
                <dl className="space-y-2 rounded-xl bg-zinc-50 p-4 text-sm">
                  <Row label="Fundo inicial" value={formatCurrency(caixa.fundoInicial)} />
                  <Row label="Dinheiro recebido" value={formatCurrency(resumo?.dinheiroVendas ?? 0)} />
                  <Row label="Suprimentos" value={`+ ${formatCurrency(resumo?.suprimentos ?? 0)}`} />
                  <Row label="Sangrias" value={`− ${formatCurrency(resumo?.sangrias ?? 0)}`} />
                  <div className="my-1 border-t border-zinc-200" />
                  <Row label="Esperado na gaveta" value={formatCurrency(esperado)} strong />
                </dl>
                <button type="button" onClick={openClose} className={cn(buttonClass('dark', 'lg'), 'mt-4 w-full')}>
                  <Lock className="h-4 w-4" /> Conferir e fechar caixa
                </button>
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 font-extrabold text-zinc-900">Vendas por atendente</h3>
                {vendasPorAtendente.length === 0 ? (
                  <EmptyState text="Sem vendas neste turno." />
                ) : (
                  <ul className="space-y-2">
                    {vendasPorAtendente.map(([nome, valor], i) => (
                      <li key={nome} className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2">
                        <span className="flex min-w-0 items-center gap-2">
                          <span
                            className={cn(
                              'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                              i === 0 ? 'bg-amber-400 text-zinc-900' : i === 1 ? 'bg-zinc-400' : 'bg-rose-400'
                            )}
                          >
                            {i + 1}
                          </span>
                          <span className="truncate text-sm font-semibold text-zinc-800">{nome}</span>
                        </span>
                        <span className="font-mono text-sm font-bold text-zinc-900">{formatCurrency(valor)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="mb-3 font-extrabold text-zinc-900">Histórico de caixas</h3>
                <HistoricoTable sessions={historico} compact />
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Modal: sangria / suprimento */}
      <Modal
        open={movTipo !== null}
        onClose={() => setMovTipo(null)}
        title={movTipo === 'sangria' ? 'Registrar sangria' : 'Registrar suprimento'}
        icon={
          movTipo === 'sangria' ? (
            <ArrowUpFromLine className="h-5 w-5 text-rose-600" />
          ) : (
            <ArrowDownToLine className="h-5 w-5 text-sky-600" />
          )
        }
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setMovTipo(null)} className={buttonClass('ghost', 'md')}>
              Cancelar
            </button>
            <button
              type="button"
              onClick={submitMov}
              className={buttonClass(movTipo === 'sangria' ? 'danger' : 'info', 'md')}
            >
              Confirmar {movTipo === 'sangria' ? 'sangria' : 'suprimento'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-zinc-500">
            {movTipo === 'sangria'
              ? 'Retirada de dinheiro da gaveta (ex.: pagamento de fornecedor).'
              : 'Entrada de dinheiro na gaveta (ex.: reforço de troco).'}
          </p>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-600">Valor (R$)</label>
            <input
              autoFocus
              inputMode="decimal"
              value={movValor}
              onChange={(e) => setMovValor(e.target.value)}
              placeholder="0,00"
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 font-mono text-lg font-bold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-600">Motivo</label>
            <select
              value={movMotivo}
              onChange={(e) => setMovMotivo(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2.5 text-sm font-semibold"
            >
              {(movTipo === 'sangria' ? MOTIVOS_SANGRIA : MOTIVOS_SUPRIMENTO).map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          {erro && <p className="text-xs font-semibold text-rose-600">{erro}</p>}
        </div>
      </Modal>

      {/* Modal: conferência do fechamento */}
      <Modal
        open={closeOpen}
        onClose={() => setCloseOpen(false)}
        title="Fechamento de caixa"
        icon={<Lock className="h-5 w-5 text-zinc-800" />}
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setCloseOpen(false)} className={buttonClass('ghost', 'md')}>
              Voltar
            </button>
            <button type="button" onClick={submitClose} className={buttonClass('dark', 'md')}>
              Fechar caixa
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-zinc-50 p-4 text-sm">
            <Row label="Esperado na gaveta" value={formatCurrency(esperado)} strong />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-600">
              Dinheiro contado (R$)
            </label>
            <input
              autoFocus
              inputMode="decimal"
              value={contadoInput}
              onChange={(e) => setContadoInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 font-mono text-lg font-bold focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
            />
          </div>
          {diferenca !== null && (
            <div
              className={cn(
                'flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-bold',
                Math.abs(diferenca) < 0.005
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : diferenca > 0
                  ? 'border-sky-200 bg-sky-50 text-sky-800'
                  : 'border-rose-200 bg-rose-50 text-rose-800'
              )}
            >
              <span>
                {Math.abs(diferenca) < 0.005 ? 'Caixa conferido' : diferenca > 0 ? 'Sobra' : 'Falta'}
              </span>
              <span className="font-mono">{formatCurrency(Math.abs(diferenca))}</span>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-zinc-600">
              Observação (opcional)
            </label>
            <textarea
              rows={2}
              value={closeObs}
              onChange={(e) => setCloseObs(e.target.value)}
              placeholder="Ex.: diferença explicada por troco errado no balcão"
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm"
            />
          </div>
          {closeError && <p className="text-xs font-semibold text-rose-600">{closeError}</p>}
          <p className="text-[11px] text-zinc-500">
            Ao fechar, o caixa fica registrado no histórico com operador, horários e diferença.
            Vendas só podem ser feitas com um caixa aberto.
          </p>
        </div>
      </Modal>

    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  tone: 'emerald' | 'sky' | 'orange' | 'zinc';
  onClick?: () => void;
}> = ({ label, value, hint, icon, tone, onClick }) => {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-700',
    sky: 'bg-sky-50 text-sky-700',
    orange: 'bg-orange-50 text-orange-700',
    zinc: 'bg-zinc-100 text-zinc-700',
  } as const;
  const Wrapper = onClick ? 'button' : 'div';
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-zinc-200/80 bg-white p-4 text-left shadow-sm sm:p-5',
        onClick && 'transition hover:border-zinc-300 hover:shadow-md'
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">{label}</span>
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', tones[tone])}>{icon}</span>
      </div>
      <p className="truncate font-mono text-lg font-extrabold tracking-tight text-zinc-900 sm:text-2xl">{value}</p>
      <p className="mt-0.5 truncate text-xs text-zinc-500">{hint}</p>
    </Wrapper>
  );
};

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => (
  <div className="flex items-center justify-between gap-3">
    <dt className={cn(strong ? 'font-extrabold text-zinc-900' : 'text-zinc-600')}>{label}</dt>
    <dd className={cn('font-mono', strong ? 'text-base font-extrabold text-zinc-900' : 'font-semibold text-zinc-800')}>
      {value}
    </dd>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-400">{text}</div>
);

const HistoricoTable: React.FC<{ sessions: CaixaSessao[]; compact?: boolean }> = ({ sessions, compact }) => {
  if (sessions.length === 0) return <EmptyState text="Nenhum caixa fechado ainda." />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[320px] text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-[11px] uppercase tracking-wide text-zinc-500">
            <th className="py-2 pr-2 font-bold">Fechamento</th>
            {!compact && <th className="py-2 pr-2 font-bold">Operador</th>}
            <th className="py-2 pr-2 text-right font-bold">Vendas</th>
            <th className="py-2 text-right font-bold">Diferença</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {sessions.slice(0, compact ? 5 : 30).map((s) => {
            const dif = s.diferenca ?? 0;
            return (
              <tr key={s.id}>
                <td className="py-2.5 pr-2 text-xs text-zinc-700">{formatDateTime(s.fechamento)}</td>
                {!compact && <td className="py-2.5 pr-2 text-xs text-zinc-700">{s.operador}</td>}
                <td className="py-2.5 pr-2 text-right font-mono text-xs font-semibold">
                  {formatCurrency(s.resumo?.totalVendas ?? 0)}
                </td>
                <td
                  className={cn(
                    'py-2.5 text-right font-mono text-xs font-bold',
                    Math.abs(dif) < 0.005 ? 'text-emerald-700' : dif > 0 ? 'text-sky-700' : 'text-rose-600'
                  )}
                >
                  {Math.abs(dif) < 0.005 ? 'OK' : `${dif > 0 ? '+' : '−'} ${formatCurrency(Math.abs(dif))}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
