import React from 'react';
import { Phone } from 'lucide-react';

/** Rodapé discreto: só a marca e o contato de suporte. */
export const Footer: React.FC = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800/70 text-zinc-500 py-2 px-4 sm:px-5 select-none mt-auto">
      <div className="max-w-[1920px] mx-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-[11px]">
        <span>
          Comanda Pro &middot; suporte contábil{' '}
          <strong className="text-zinc-300 font-semibold">Conta Bahia</strong>
        </span>
        <a
          href="tel:7121366312"
          className="inline-flex items-center gap-1.5 font-mono hover:text-zinc-300 transition-colors"
        >
          <Phone className="w-3 h-3" />
          71 2136-6312
        </a>
      </div>
    </footer>
  );
};
