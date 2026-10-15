import React from 'react';
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
  Wallet,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { cn } from '../utils/cn';

export interface TabItem {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: number;
  badgeTone?: 'rose' | 'orange';
  shortcut?: string;
}

interface SidebarProps {
  activeTab: number;
  onSelectTab: (tabId: number) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  occupiedTablesCount: number;
  kitchenPendingCount: number;
}

interface TabGroup {
  title: string;
  items: TabItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
  occupiedTablesCount,
  kitchenPendingCount,
}) => {
  const groups: TabGroup[] = [
    {
      title: 'Operação',
      items: [
        { id: 1, label: 'Frente de Caixa', sublabel: 'PDV e comandas', icon: ShoppingCart, shortcut: 'F1' },
        { id: 8, label: 'Mesas', sublabel: 'Salão 1 a 50', icon: LayoutGrid, badge: occupiedTablesCount, badgeTone: 'rose' },
        { id: 2, label: 'Pagamento', sublabel: 'Checkout e PIX', icon: CreditCard, shortcut: 'F2' },
        { id: 9, label: 'Cozinha & Delivery', sublabel: 'Pedidos e entregas', icon: ChefHat, badge: kitchenPendingCount, badgeTone: 'orange' },
      ],
    },
    {
      title: 'Caixa',
      items: [
        { id: 11, label: 'Caixa', sublabel: 'Abertura, sangria e fechamento', icon: Wallet, shortcut: 'F11' },
        { id: 3, label: 'Relatórios', sublabel: 'Vendas e fechamento', icon: FileText },
        { id: 6, label: 'Financeiro', sublabel: 'Cartões e conciliação', icon: DollarSign },
      ],
    },
    {
      title: 'Gestão',
      items: [
        { id: 10, label: 'Cadastros', sublabel: 'Clientes e equipe', icon: Users },
        { id: 5, label: 'Estoque & Cardápio', sublabel: 'Produtos e importação', icon: Package },
        { id: 7, label: 'Gráficos', sublabel: 'Dashboard de vendas', icon: BarChart3 },
        { id: 4, label: 'Configuração', sublabel: 'Empresa e impostos', icon: Settings },
      ],
    },
  ];

  const select = (id: number) => {
    onSelectTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Fundo escuro do menu no celular */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-[1px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        aria-label="Menu principal"
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-300 shadow-2xl transition-transform duration-200 ease-out',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:z-30 lg:translate-x-0 lg:shadow-none lg:transition-[width] lg:duration-200',
          collapsed ? 'lg:w-[68px]' : 'lg:w-60'
        )}
      >
        {/* Topo do menu */}
        <div className={cn('flex h-14 items-center border-b border-zinc-800/80 px-3 md:h-16', collapsed ? 'lg:justify-center' : 'justify-between')}>
          {(!collapsed || mobileOpen) && (
            <span className="px-1 text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-500">Menu</span>
          )}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cn(
              'hidden rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-800 hover:text-white lg:flex',
              !collapsed && 'ml-auto'
            )}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navegação */}
        <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-3">
          {groups.map((group) => (
            <div key={group.title}>
              {!collapsed || mobileOpen ? (
                <p className="mb-1.5 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-600">
                  {group.title}
                </p>
              ) : (
                <div className="mx-3 mb-2 border-t border-zinc-800" />
              )}
              <ul className="space-y-0.5">
                {group.items.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  const showLabels = !collapsed || mobileOpen;
                  return (
                    <li key={tab.id}>
                      <button
                        type="button"
                        onClick={() => select(tab.id)}
                        title={!showLabels ? tab.label : tab.shortcut ? `${tab.label} (${tab.shortcut})` : tab.label}
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'group relative flex w-full items-center rounded-xl text-left transition',
                          showLabels ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5',
                          isActive
                            ? 'bg-orange-600 text-white shadow-md shadow-orange-950/40'
                            : 'text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100'
                        )}
                      >
                        <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-white' : 'text-zinc-500 group-hover:text-orange-400')} />

                        {showLabels && (
                          <>
                            <span className="min-w-0 flex-1">
                              <span className={cn('block truncate text-sm', isActive ? 'font-bold text-white' : 'font-semibold text-zinc-200')}>
                                {tab.label}
                              </span>
                              <span className={cn('block truncate text-[11px]', isActive ? 'text-orange-100/90' : 'text-zinc-500')}>
                                {tab.sublabel}
                              </span>
                            </span>
                            {tab.shortcut && (
                              <kbd className={cn('hidden rounded px-1 font-mono text-[10px] xl:inline', isActive ? 'bg-black/20 text-orange-50' : 'bg-zinc-800 text-zinc-500')}>
                                {tab.shortcut}
                              </kbd>
                            )}
                            {tab.badge !== undefined && tab.badge > 0 && (
                              <span
                                className={cn(
                                  'min-w-[1.25rem] rounded-full px-1.5 text-center text-[10px] font-bold leading-5 text-white',
                                  tab.badgeTone === 'orange' ? 'bg-orange-500' : 'bg-rose-500',
                                  isActive && 'bg-white/25'
                                )}
                              >
                                {tab.badge}
                              </span>
                            )}
                          </>
                        )}

                        {!showLabels && tab.badge !== undefined && tab.badge > 0 && (
                          <span
                            className={cn(
                              'absolute right-1 top-1 h-2.5 w-2.5 rounded-full ring-2 ring-zinc-950',
                              tab.badgeTone === 'orange' ? 'bg-orange-500' : 'bg-rose-500'
                            )}
                          />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Rodapé: ocupação do salão */}
        {(!collapsed || mobileOpen) && (
          <div className="border-t border-zinc-800/80 bg-zinc-900/60 p-3">
            <div className="mb-1.5 flex items-center justify-between text-[11px] text-zinc-400">
              <span>Ocupação do salão</span>
              <span className="font-semibold text-zinc-200">{occupiedTablesCount}/50</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-1.5 rounded-full bg-orange-500 transition-all"
                style={{ width: `${(occupiedTablesCount / 50) * 100}%` }}
              />
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
