import React, { useState, useEffect } from 'react';
import { Monitor, Clock, CheckCircle2, UtensilsCrossed, User } from 'lucide-react';
import { Table, AppConfig } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface Props {
  tables: Table[];
  selectedTableNumber?: number;
  config: AppConfig;
}

export const Tab12Cliente: React.FC<Props> = ({ tables, selectedTableNumber = 1, config }) => {
  const [mesa, setMesa] = useState<number>(selectedTableNumber || 1);
  const [currentTable, setCurrentTable] = useState<Table | undefined>(
    tables.find((t) => t.numero === mesa)
  );

  useEffect(() => {
    setMesa(selectedTableNumber || 1);
  }, [selectedTableNumber]);

  useEffect(() => {
    setCurrentTable(tables.find((t) => t.numero === mesa));
  }, [mesa, tables]);

  const items = currentTable?.itens || [];
  const total = items.reduce((s, i) => s + i.valorTotal, 0);
  const aberto = currentTable?.abertura ? new Date(currentTable.abertura).toLocaleTimeString('pt-BR') : '--:--';

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-orange-50/30 p-4">
      <div className="w-full max-w-xl bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-zinc-100 overflow-hidden ring-1 ring-black/5">
        {/* Header do display */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 text-white px-6 py-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <UtensilsCrossed className="w-5 h-5 text-orange-300" />
              <span className="font-extrabold text-lg tracking-tight">Comanda Pro</span>
            </div>
            <div className="text-xs text-zinc-400 font-medium">Visual do Cliente — Mesa #{mesa}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-zinc-400">Abertura</div>
            <div className="font-mono font-bold text-sm">{aberto}</div>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          {/* Seletor de mesa (simples) */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <button
                key={n}
                onClick={() => setMesa(n)}
                className={`min-w-[3rem] h-10 rounded-xl text-sm font-extrabold transition shadow-sm ${
                  mesa === n
                    ? 'bg-orange-500 text-white shadow-orange-500/30'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <h2 className="text-2xl font-extrabold text-zinc-900 tracking-tight mb-1">Sua Comanda</h2>
          <div className="text-zinc-500 text-sm mb-6">Mesa <strong className="text-zinc-900">#{mesa}</strong> • {currentTable?.status === 'ocupada' ? 'Em atendimento' : 'Aguardando'}</div>

          {items.length === 0 ? (
            <div className="bg-zinc-50 rounded-2xl p-8 text-center border border-dashed border-zinc-200">
              <Monitor className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
              <div className="font-bold text-zinc-700">Aguardando pedido</div>
              <div className="text-xs text-zinc-400 mt-1">O garçom ainda não enviou itens para esta mesa.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((it, idx) => (
                <div key={it.id || idx} className="flex items-start gap-4 bg-zinc-50 rounded-xl p-4 border border-zinc-100 hover:border-orange-200 transition">
                  <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg font-extrabold text-zinc-900 shrink-0">
                    {it.quantidade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-zinc-900 leading-snug truncate">{it.descricao}</div>
                    <div className="text-xs text-zinc-400 font-medium">{it.unidade || 'UN'} • {it.ean ? `EAN ${it.ean}` : ''}</div>
                    {it.observacao && (
                      <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-0.5 mt-1 font-medium inline-block">Obs: {it.observacao}</div>
                    )}
                  </div>
                  <div className="font-mono font-extrabold text-zinc-900 text-sm whitespace-nowrap">{formatCurrency(it.valorTotal)}</div>
                </div>
              ))}
            </div>
          )}

          {/* Observação da mesa */}
          {currentTable?.observacaoMesa && (
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-sm text-amber-900 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Observação: {currentTable.observacaoMesa}
            </div>
          )}

          {/* Total */}
          <div className="mt-8 pt-6 border-t border-zinc-200 flex items-end justify-between">
            <div>
              <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Total Estimado</div>
              <div className="text-xs text-zinc-400">Taxa de serviço pode ser aplicada ao fechar</div>
            </div>
            <div className="text-4xl font-extrabold text-zinc-900 tracking-tighter font-mono">{formatCurrency(total)}</div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-zinc-400 font-medium">
            <Clock className="w-4 h-4" /> Esta tela é apenas para consulta — fale com o garçom para fechar.
          </div>
        </div>
      </div>
    </div>
  );
};
