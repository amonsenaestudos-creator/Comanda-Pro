import React from 'react';
import { Phone, ShieldCheck, HelpCircle } from 'lucide-react';

interface FooterProps {
  onOpenHelp?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="bg-zinc-900 border-t border-zinc-800 text-zinc-400 text-xs py-2.5 px-4 sm:px-6 select-none mt-auto">
      <div className="max-w-[1920px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-orange-500" />
          <span className="font-medium text-zinc-300">Comanda Pro v2.0 - 2026</span>
          <span className="hidden md:inline text-zinc-600">|</span>
          <span className="text-zinc-400">
            Todos os direitos reservados:{' '}
            <strong className="text-zinc-200">Conta Bahia Contabilidade</strong>
          </span>
          <a
            href="tel:7121366312"
            className="inline-flex items-center gap-1 text-orange-400 hover:text-orange-300 font-mono font-medium ml-1 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/60 transition"
          >
            <Phone className="w-3 h-3" />
            71 2136-6312
          </a>
        </div>

        <div className="flex items-center space-x-4 text-[11px] text-zinc-500">
          <span>Sistema Frente de Caixa, Mesas & Comandas</span>
          <span className="hidden sm:inline">&bull;</span>
          <span className="flex items-center gap-1 text-zinc-400">
            <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
            Suporte Fiscal & Contábil
          </span>
        </div>
      </div>
    </footer>
  );
};
