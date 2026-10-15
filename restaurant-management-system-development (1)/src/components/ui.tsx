import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

/** Cartão padrão: fundo branco, borda suave e cantos arredondados. */
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div
    className={cn('rounded-2xl border border-zinc-200/80 bg-white shadow-sm', className)}
    {...props}
  />
);

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/** Cabeçalho de cada aba: título, descrição curta e ações à direita (quebram em telas pequenas). */
export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, icon, actions }) => (
  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="flex min-w-0 items-start gap-3">
      {icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white shadow-sm shadow-orange-900/20">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h2 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
      </div>
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const sizeClass = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

/**
 * Modal acessível: fecha com Esc e clique no fundo, trava o scroll do corpo
 * e ocupa a tela inteira no celular (vira "folha" de baixo para cima).
 */
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, icon, footer, size = 'md', children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-zinc-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl',
          sizeClass[size]
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon}
            <h3 className="truncate text-base font-extrabold text-zinc-900">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-zinc-200 bg-zinc-50/70 px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
};

/** Botão padrão com variantes de cor usadas no sistema. */
export const buttonClass = (variant: 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'ghost' | 'dark' = 'primary', size: 'sm' | 'md' | 'lg' = 'md') =>
  cn(
    'inline-flex items-center justify-center gap-1.5 rounded-xl font-bold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
    size === 'sm' && 'px-3 py-1.5 text-xs',
    size === 'md' && 'px-4 py-2.5 text-sm',
    size === 'lg' && 'px-5 py-3.5 text-base',
    variant === 'primary' && 'bg-orange-600 text-white shadow-sm shadow-orange-900/20 hover:bg-orange-700',
    variant === 'success' && 'bg-emerald-600 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-700',
    variant === 'danger' && 'bg-rose-600 text-white shadow-sm shadow-rose-900/20 hover:bg-rose-700',
    variant === 'info' && 'bg-sky-600 text-white shadow-sm shadow-sky-900/20 hover:bg-sky-700',
    variant === 'warning' && 'bg-amber-400 text-zinc-950 shadow-sm shadow-amber-900/10 hover:bg-amber-300',
    variant === 'dark' && 'bg-zinc-900 text-white hover:bg-zinc-800',
    variant === 'ghost' && 'border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50'
  );

/** Etiqueta de status colorida (ex.: Livre, Ocupada, Caixa aberto). */
export const Badge: React.FC<{ tone?: 'green' | 'red' | 'amber' | 'zinc' | 'sky' | 'orange'; children: React.ReactNode; className?: string }> = ({
  tone = 'zinc',
  children,
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-bold',
      tone === 'green' && 'border-emerald-200 bg-emerald-50 text-emerald-800',
      tone === 'red' && 'border-rose-200 bg-rose-50 text-rose-800',
      tone === 'amber' && 'border-amber-200 bg-amber-50 text-amber-800',
      tone === 'sky' && 'border-sky-200 bg-sky-50 text-sky-800',
      tone === 'orange' && 'border-orange-200 bg-orange-50 text-orange-800',
      tone === 'zinc' && 'border-zinc-200 bg-zinc-100 text-zinc-700',
      className
    )}
  >
    {children}
  </span>
);
