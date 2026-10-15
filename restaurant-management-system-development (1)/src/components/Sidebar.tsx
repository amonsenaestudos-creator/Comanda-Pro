import React from 'react';
import { cn } from '../utils/cn';
import {
  ShoppingCart,
  CreditCard,
  FileText,
  Settings,
  Package,
  DollarSign,
  BarChart3,
  LayoutGrid,
  ChefHat,
  Users,
  Sparkles,
  Eye,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface TabItem {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  group: 'Caixa' | 'Gestão';
  badge?: number | string;
}

interface SidebarProps {
  activeTab: number;
  onSelectTab: (tabId: number) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  occupiedTablesCount: number;
  kitchenPendingCount: number;
  /** Abas escondidas pelo "Modo Caixa" ou pela configuração de aparência. */
  hiddenTabs?: number[];
  onShowAllTabs?: () => void;
}

const BASE_TABS: TabItem[] = [
  { id: 1, label: 'Frente de Caixa', sublabel: 'PDV & comandas', icon: ShoppingCart, group: 'Caixa' },
  { id: 2, label: 'Pagamentos', sublabel: 'Checkout & PIX', icon: CreditCard, group: 'Caixa' },
  { id: 3, label: 'Vendas & Fechamento', sublabel: 'Histórico e fechamento de caixa', icon: FileText, group: 'Caixa' },
  { id: 11, label: 'Resumo do Caixa', sublabel: 'Visão rápida do dia', icon: Sparkles, group: 'Caixa' },
  { id: 8, label: 'Mesas', sublabel: 'Salão, mesas 1 a 50', icon: LayoutGrid, group: 'Gestão' },
  { id: 9, label: 'Cozinha & Delivery', sublabel: 'Kanban de produção', icon: ChefHat, group: 'Gestão' },
  { id: 5, label: 'Estoque & Cardápio', sublabel: 'Produtos, setores e importação', icon: Package, group: 'Gestão' },
  { id: 6, label: 'Financeiro', sublabel: 'Cartões & conciliação', icon: DollarSign, group: 'Gestão' },
  { id: 7, label: 'Gráficos', sublabel: 'Dashboard de vendas', icon: BarChart3, group: 'Gestão' },
  { id: 10, label: 'Cadastros', sublabel: 'Clientes, equipe e parceiros', icon: Users, group: 'Gestão' },
  { id: 4, label: 'Configuração', sublabel: 'Empresa, taxas, cupom e tela do caixa', icon: Settings, group: 'Gestão' },
];

/** Rótulos das abas, reutilizados na tela de Configuração. */
export const TAB_LABELS: Record<number, { label: string; sublabel: string }> = BASE_TABS.reduce(
  (acc, tab) => {
    acc[tab.id] = { label: tab.label, sublabel: tab.sublabel };
    return acc;
  },
  {} as Record<number, { label: string; sublabel: string }>
);

const GROUPS: TabItem['group'][] = ['Caixa', 'Gestão'];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  setCollapsed,
  occupiedTablesCount,
  kitchenPendingCount,
  hiddenTabs = [],
  onShowAllTabs,
}) => {
  const tabs: TabItem[] = BASE_TABS.map((tab) => {
    if (tab.id === 8) {
      return { ...tab, badge: occupiedTablesCount > 0 ? occupiedTablesCount : undefined };
    }
    if (tab.id === 9) {
      return { ...tab, badge: kitchenPendingCount > 0 ? kitchenPendingCount : undefined };
    }
    return tab;
  });

  const visibleTabs = tabs.filter((tab) => !hiddenTabs.includes(tab.id));

  return (
    <aside
      className={`bg-zinc-950 text-zinc-300 border-r border-zinc-800/70 transition-[width] duration-150 ease-out flex flex-col select-none relative z-30 shrink-0 ${
        collapsed ? 'w-14' : 'w-56'
      }`}
    >
      {/* Alternar recolhido */}
      <div className="flex items-center justify-end h-12 px-2 border-b border-zinc-800/70">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-100 hover:bg-zinc-900 transition"
          title={collapsed ? 'Expandir menu' : 'Recolher menu'}
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navegação */}
      <nav className="flex-1 overflow-y-auto px-2 pb-2">
        {GROUPS.map((group) => {
          const groupTabs = visibleTabs.filter((tab) => tab.group === group);
          if (groupTabs.length === 0) return null;
          return (
            <div key={group} className="mt-3">
              {!collapsed && (
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-600">
                  {group}
                </p>
              )}
              <div className="space-y-0.5">
                {groupTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => onSelectTab(tab.id)}
                      title={collapsed ? tab.label : tab.sublabel}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'w-full group flex items-center rounded-lg transition-colors text-left relative',
                        collapsed ? 'justify-center p-2' : 'gap-2.5 px-2 py-2',
                        isActive
                          ? 'bg-zinc-800/80 text-white'
                          : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-orange-500" />
                      )}
                      <Icon
                        className={`w-4 h-4 shrink-0 ${
                          isActive ? 'text-orange-400' : 'text-zinc-500 group-hover:text-zinc-300'
                        }`}
                      />
                      {!collapsed && (
                        <>
                          <span className="text-[13px] truncate flex-1 font-medium">{tab.label}</span>
                          {tab.badge !== undefined && (
                            <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700">
                              {tab.badge}
                            </span>
                          )}
                        </>
                      )}
                      {collapsed && tab.badge !== undefined && (
                        <span className="absolute top-1 right-1.5 w-1.5 h-1.5 rounded-full bg-orange-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Rodapé: recupera telas escondidas, quando for o caso */}
      {hiddenTabs.length > 0 && onShowAllTabs && (
        <div className="p-2 border-t border-zinc-800/70">
          <button
            type="button"
            onClick={onShowAllTabs}
            title="Mostrar outra vez as telas escondidas do menu"
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[11px] font-semibold transition ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-orange-400 shrink-0" />
            {!collapsed && (
              <span>
                Mostrar {hiddenTabs.length} tela{hiddenTabs.length > 1 ? 's' : ''} escondida
                {hiddenTabs.length > 1 ? 's' : ''}
              </span>
            )}
          </button>
        </div>
      )}
    </aside>
  );
};
