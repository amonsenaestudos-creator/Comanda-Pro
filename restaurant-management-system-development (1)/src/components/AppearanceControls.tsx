import React from 'react';
import {
  Sun,
  Moon,
  Type,
  Rows3,
  LayoutGrid,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { CaixaAppearance, Densidade, EscalaFonte, TemaModo, TamanhoItemCardapio } from '../types';

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
  icon?: React.ElementType;
}

interface SegmentedProps<T extends string> {
  label: string;
  hint?: string;
  value: T;
  options: Option<T>[];
  onSelect: (value: T) => void;
}

export function Segmented<T extends string>({
  label,
  hint,
  value,
  options,
  onSelect,
}: SegmentedProps<T>) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 mb-1.5">
        <span className="text-xs font-bold text-zinc-800">{label}</span>
        {hint && <span className="text-[10px] text-zinc-400">{hint}</span>}
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onSelect(opt.value)}
              aria-pressed={isActive}
              className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border text-xs font-bold transition ${
                isActive
                  ? 'bg-orange-600 border-orange-600 text-white shadow-sm'
                  : 'bg-white border-zinc-300 text-zinc-600 hover:bg-zinc-100'
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface ToggleRowProps {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function ToggleRow({ label, hint, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 py-1.5 text-left group"
    >
      <span className="min-w-0">
        <span className="block text-xs font-semibold text-zinc-800 group-hover:text-zinc-950">
          {label}
        </span>
        {hint && <span className="block text-[10px] text-zinc-400 leading-tight">{hint}</span>}
      </span>
      <span
        className={`shrink-0 w-9 h-5 rounded-full border transition-colors relative ${
          checked ? 'bg-emerald-500 border-emerald-600' : 'bg-zinc-200 border-zinc-300'
        }`}
      >
        <span
          className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ${
            checked ? 'left-[1.15rem]' : 'left-0.5'
          }`}
        />
      </span>
    </button>
  );
}

interface AppearanceControlsProps {
  aparencia: CaixaAppearance;
  onChange: (patch: Partial<CaixaAppearance>) => void;
  /** Esconde os controles que só interessam na aba Configuração completa. */
  showFullControls?: boolean;
}

/**
 * Controles de aparência/usabilidade usados tanto na Frente de Caixa (popover
 * "Ajustes rápidos") quanto na aba Configuração — uma única fonte de verdade.
 */
export const AppearanceControls: React.FC<AppearanceControlsProps> = ({
  aparencia,
  onChange,
  showFullControls = true,
}) => {
  const temaOptions: Option<TemaModo>[] = [
    { value: 'claro', label: 'Claro', icon: Sun },
    { value: 'escuro', label: 'Escuro', icon: Moon },
  ];

  const fonteOptions: Option<EscalaFonte>[] = [
    { value: 'padrao', label: 'Padrão' },
    { value: 'grande', label: 'Grande', icon: Type },
    { value: 'extra', label: 'Extra' },
  ];

  const densidadeOptions: Option<Densidade>[] = [
    { value: 'confortavel', label: 'Confortável', icon: Rows3 },
    { value: 'compacta', label: 'Compacto', icon: Minimize2 },
  ];

  const tileOptions: Option<TamanhoItemCardapio>[] = [
    { value: 'pequeno', label: 'Pequeno', icon: Minimize2 },
    { value: 'medio', label: 'Médio', icon: LayoutGrid },
    { value: 'grande', label: 'Grande', icon: Maximize2 },
  ];

  return (
    <div className="space-y-4">
      <Segmented
        label="Tema da tela"
        hint="Escuro é melhor no balcão à noite"
        value={aparencia.tema}
        options={temaOptions}
        onSelect={(tema) => onChange({ tema })}
      />
      <Segmented
        label="Tamanho da letra"
        hint="Total e preços ficam maiores"
        value={aparencia.escalaFonte}
        options={fonteOptions}
        onSelect={(escalaFonte) => onChange({ escalaFonte })}
      />
      <Segmented
        label="Espaçamento"
        value={aparencia.densidade}
        options={densidadeOptions}
        onSelect={(densidade) => onChange({ densidade })}
      />
      <Segmented
        label="Botões do cardápio"
        hint="Tamanho de cada produto"
        value={aparencia.tamanhoItemCardapio}
        options={tileOptions}
        onSelect={(tamanhoItemCardapio) => onChange({ tamanhoItemCardapio })}
      />

      {showFullControls && (
        <>
          <div className="pt-1">
            <ToggleRow
              label="Modo Caixa (menu limpo)"
              hint="No menu lateral mostra só Caixa, Pagamento, Fechamento e Resumo"
              checked={aparencia.modoCaixa}
              onChange={(modoCaixa) => onChange({ modoCaixa })}
            />
          </div>

          <div className="border-t border-zinc-200 pt-3 space-y-0.5">
            <p className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider mb-1">
              O que aparece na comanda
            </p>
            <ToggleRow
              label="Estoque do produto"
              checked={aparencia.mostrarEstoque}
              onChange={(mostrarEstoque) => onChange({ mostrarEstoque })}
            />
            <ToggleRow
              label="Código EAN"
              hint="Some com a linha de código nos itens e nas buscas"
              checked={aparencia.mostrarEan}
              onChange={(mostrarEan) => onChange({ mostrarEan })}
            />
            <ToggleRow
              label="Setor / categoria"
              checked={aparencia.mostrarSetor}
              onChange={(mostrarSetor) => onChange({ mostrarSetor })}
            />
            <ToggleRow
              label="Preço unitário na comanda"
              checked={aparencia.mostrarUnitarioNoItem}
              onChange={(mostrarUnitarioNoItem) => onChange({ mostrarUnitarioNoItem })}
            />
            <ToggleRow
              label="Observação do item (ex: sem cebola)"
              checked={aparencia.mostrarObsItem}
              onChange={(mostrarObsItem) => onChange({ mostrarObsItem })}
            />
            <ToggleRow
              label="Observação da mesa"
              checked={aparencia.mostrarObsMesa}
              onChange={(mostrarObsMesa) => onChange({ mostrarObsMesa })}
            />
            <ToggleRow
              label="Botão enviar para a Cozinha"
              checked={aparencia.mostrarBotaoCozinha}
              onChange={(mostrarBotaoCozinha) => onChange({ mostrarBotaoCozinha })}
            />
            <ToggleRow
              label="Botão imprimir comanda da mesa"
              checked={aparencia.mostrarBotaoImprimir}
              onChange={(mostrarBotaoImprimir) => onChange({ mostrarBotaoImprimir })}
            />
            <ToggleRow
              label="Busca com cursor ligado ao abrir"
              hint="Já pode digitar ou bipar o código sem clicar no campo"
              checked={aparencia.focoBuscaAoAbrir}
              onChange={(focoBuscaAoAbrir) => onChange({ focoBuscaAoAbrir })}
            />
            <ToggleRow
              label="Enter lança o primeiro da busca"
              hint="Tecla mais rápida para produto conhecido"
              checked={aparencia.enterAdicionaPrimeiro}
              onChange={(enterAdicionaPrimeiro) => onChange({ enterAdicionaPrimeiro })}
            />
            <ToggleRow
              label="Confirmar antes de limpar a mesa"
              checked={aparencia.confirmarLimpar}
              onChange={(confirmarLimpar) => onChange({ confirmarLimpar })}
            />
          </div>

          <div className="border-t border-zinc-200 pt-3">
            <label className="text-xs font-bold text-zinc-800 block mb-1" htmlFor="qtd-rapida">
              Quantidades rápidas
            </label>
            <p className="text-[10px] text-zinc-400 mb-1.5">
              Botões de um toque para lançar mais de um item. Separe por vírgula.
            </p>
            <input
              id="qtd-rapida"
              type="text"
              defaultValue={aparencia.quantidadesRapidas.join(', ')}
              onBlur={(e) => {
                const parsed = e.target.value
                  .split(',')
                  .map((v) => parseInt(v.trim(), 10))
                  .filter((v) => Number.isFinite(v) && v > 0 && v <= 999)
                  .slice(0, 6);
                onChange({ quantidadesRapidas: parsed.length ? parsed : [1] });
              }}
              className="w-full px-2.5 py-1.5 text-xs font-mono cp-input"
            />
          </div>
        </>
      )}
    </div>
  );
};

