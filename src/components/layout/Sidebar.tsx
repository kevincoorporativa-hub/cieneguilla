import { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Truck, 
  FileText, 
  Receipt, 
  Users,
  Settings,
  LogOut,
  Pizza,
  ChevronLeft,
  ChevronRight,
  Boxes,
  Layers
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OnlineIndicator } from '@/components/pos/OnlineIndicator';
import { Button } from '@/components/ui/button';

const navItems = [
  { to: '/', icon: ShoppingCart, label: 'Punto de Venta' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/productos', icon: Package, label: 'Productos' },
  { to: '/combos', icon: Layers, label: 'Combos' },
  { to: '/inventario', icon: Boxes, label: 'Inventario' },
  { to: '/delivery', icon: Truck, label: 'Delivery' },
  { to: '/caja', icon: Receipt, label: 'Caja' },
  { to: '/tickets', icon: FileText, label: 'Tickets' },
  { to: '/reportes', icon: FileText, label: 'Reportes' },
  { to: '/usuarios', icon: Users, label: 'Usuarios' },
  { to: '/configuracion', icon: Settings, label: 'Configuración' },
];

export function Sidebar() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside className={cn(
      "bg-sidebar flex flex-col h-screen border-r border-sidebar-border transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Logo */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Pizza className="h-7 w-7 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <h1 className="text-xl font-bold text-sidebar-foreground">PizzaPOS</h1>
              <p className="text-xs text-sidebar-foreground/70">Sistema de Ventas</p>
            </div>
          )}
        </div>
      </div>

      {/* Collapse button */}
      <div className="px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent",
            !isCollapsed && "justify-end"
          )}
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl font-medium transition-all',
                isCollapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon className="h-6 w-6 shrink-0" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!isCollapsed && <OnlineIndicator />}
        <button className={cn(
          "flex items-center gap-3 w-full px-3 py-3 rounded-xl text-sidebar-foreground hover:bg-sidebar-accent transition-all",
          isCollapsed && "justify-center"
        )}>
          <LogOut className="h-6 w-6 shrink-0" />
          {!isCollapsed && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
