import { Sale } from '../types';

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(val || 0);
};

export const formatDateTime = (dateStr?: string | Date): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

export const formatDateShort = (dateStr?: string | Date): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
};

export const formatTimeShort = (dateStr?: string | Date): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const maskCnpjCpf = (val: string): string => {
  const clean = val.replace(/\D/g, '');
  if (clean.length <= 11) {
    return clean
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);
};

export const maskPhone = (val: string): string => {
  const clean = val.replace(/\D/g, '');
  if (clean.length <= 10) {
    return clean
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return clean
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .substring(0, 15);
};

export const maskCep = (val: string): string => {
  return val.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
};

/**
 * Chave do dia no fuso local (AAAAMMDD). Diferente de toISOString(), que é UTC
 * e jogaria a venda da noite para o dia seguinte no horário de Brasília.
 */
export const localDayKey = (dateStr?: string | Date): string => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (isNaN(d.getTime())) return '';
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
};

/** Rótulo amigável da origem da venda (mesa, balcão ou delivery). */
export const rotuloOrigemVenda = (sale: Sale): string => {
  if (typeof sale.mesa === 'number') return `Mesa ${sale.mesa}`;
  if (sale.numeroComanda) {
    return `${sale.tipoAtendimento === 'Delivery' ? 'Delivery' : 'Balcão'} #${sale.numeroComanda}`;
  }
  return sale.tipoAtendimento || 'Balcão';
};
