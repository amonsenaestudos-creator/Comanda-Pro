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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export interface TabItem {
  id: number;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
  color?: string;
}

interface SidebarProps {
  activeTab: number;
  onSelectTab: (tabId: number) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  occupiedTablesCount: number;
  kitchenPendingCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  setCollapsed,
  occupiedTablesCount,
  kitchenPendingCount,
}) => {
  const tabs: TabItem[] = [
    {
      id: 1,
      label: 'Frente de Caixa',
      sublabel: 'PDV & Comandas',
      icon: ShoppingCart,
    },
    {
      id: 2,
      label: 'Tela Pagamentos',
      sublabel: 'Checkout & PIX',
      icon: CreditCard,
    },
    {
      id: 3,
      label: 'Relatórios de Venda',
      sublabel: 'Histórico & Fechamento',
      icon: FileText,
    },
    {
      id: 4,
      label: 'Configuração',
      sublabel: 'Empresa & BrasilAPI',
      icon: Settings,
    },
    {
      id: 5,
      label: 'Estoques & Base',
      sublabel: 'Import CSV & Cardápio',
      icon: Package,
    },
    {
      id: 6,
      label: 'Financeiro',
      sublabel: 'Cartões & Conciliação',
      icon: DollarSign,
    },
    {
      id: 7,
      label: 'Gráficos (%)',
      sublabel: 'Dashboard & Vendas',
      icon: BarChart3,
    },
    {
      id: 8,
      label: 'Gestão de Mesas',
      sublabel: 'Mesas 1 a 50 (Salão)',
      icon: LayoutGrid,
      badge: occupiedTablesCount > 0 ? occupiedTablesCount : undefined,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      id: 9,
      label: 'Cozinha & Delivery',
      sublabel: 'Kanban & Produção',
      icon: ChefHat,
      badge: kitchenPendingCount > 0 ? kitchenPendingCount : undefined,
      badgeColor: 'bg-orange-500 text-white',
    },
    {
      id: 10,
      label: 'Cadastros',
      sublabel: 'Clientes & Equipe',
      icon: Users,
    },
  ];

  return (
    <aside
      className={`bg-zinc-950 text-zinc-300 border-r border-zinc-800 transition-all duration-200 ease-in-out flex flex-col select-none relative z-30 shrink-0 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header toggle */}
      <div className="flex items-center justify-between p-3 border-b border-zinc-800/80">
        {!collapsed && (
          <div className="flex items-center space-x-2 px-1">
            <span className="text-[11px] font-bold tracking-wider text-zinc-400 uppercase">
              Menu Principal
            </span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={`p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition mx-auto ${
            collapsed ? '' : 'ml-auto'
          }`}
          title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              title={collapsed ? `Aba ${tab.id}: ${tab.label}` : undefined}
              className={`w-full group flex items-center rounded-lg transition-all duration-150 text-left relative ${
                collapsed ? 'justify-center p-2.5' : 'px-3 py-2.5 space-x-3'
              } ${
                isActive
                  ? 'bg-orange-600 text-white font-semibold shadow-md shadow-orange-950/40'
                  : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80'
              }`}
            >
              <div
                className={`flex items-center justify-center shrink-0 ${
                  isActive ? 'text-white' : 'text-zinc-400 group-hover:text-orange-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0 pr-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs truncate ${
                        isActive ? 'text-white font-bold' : 'text-zinc-200'
                      }`}
                    >
                      <span className="text-zinc-400 font-mono mr-1.5 text-[10px]">
                        #{tab.id}
                      </span>
                      {tab.label}
                    </span>
                    {tab.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          tab.badgeColor || 'bg-orange-500 text-white'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] truncate ${
                      isActive ? 'text-orange-100' : 'text-zinc-400'
                    }`}
                  >
                    {tab.sublabel}
                  </div>
                </div>
              )}

              {/* Collapsed dot/badge indicator */}
              {collapsed && tab.badge !== undefined && (
                <span
                  className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full ${
                    tab.badgeColor?.split(' ')[0] || 'bg-orange-500'
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Status Info in Footer of Sidebar */}
      {!collapsed && (
        <div className="p-3 bg-zinc-900/60 border-t border-zinc-800/80 text-[11px] text-zinc-400">
          <div className="flex justify-between items-center mb-1">
            <span className="text-zinc-400">Mesas 1 a 50:</span>
            <span className="font-semibold text-zinc-300">
              {occupiedTablesCount}/50 ativas
            </span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-orange-500 h-1.5 rounded-full transition-all"
              style={{ width: `${(occupiedTablesCount / 50) * 100}%` }}
            />
          </div>
        </div>
      )}
    </aside>
  );
};
