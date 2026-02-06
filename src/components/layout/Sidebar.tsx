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
  Layers,
  X
} from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { OnlineIndicator } from '@/components/pos/OnlineIndicator';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { toast } from 'sonner';

const navItems = [
  { to: '/', icon: ShoppingCart, label: 'Punto de Venta', adminOnly: false },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false },
  { to: '/productos', icon: Package, label: 'Productos', adminOnly: false },
  { to: '/combos', icon: Layers, label: 'Combos', adminOnly: false },
  { to: '/inventario', icon: Boxes, label: 'Insumos', adminOnly: false },
  { to: '/delivery', icon: Truck, label: 'Delivery', adminOnly: false },
  { to: '/caja', icon: Receipt, label: 'Caja', adminOnly: false },
  { to: '/tickets', icon: FileText, label: 'Tickets', adminOnly: false },
  { to: '/reportes', icon: FileText, label: 'Reportes', adminOnly: false },
   { to: '/ajustes', icon: Settings, label: 'Ajustes', adminOnly: false },
  { to: '/usuarios', icon: Users, label: 'Usuarios', adminOnly: true },
  { to: '/configuracion', icon: Settings, label: 'Configuración', adminOnly: true },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, isAdmin } = useAuth();
  const { 
    isCollapsed, 
    isFloating, 
    isMobileOpen, 
    setIsCollapsed, 
    closeMobileSidebar 
  } = useSidebarContext();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Sesión cerrada');
      navigate('/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const handleNavClick = () => {
    // Close mobile sidebar when navigating
    if (isFloating) {
      closeMobileSidebar();
    }
  };

  const sidebarContent = (
    <aside className={cn(
      "bg-sidebar flex flex-col h-screen border-r border-sidebar-border transition-all duration-300",
      isFloating 
        ? "w-56" 
        : isCollapsed 
          ? "w-14 lg:w-16 xl:w-20" 
          : "w-48 lg:w-56 xl:w-64"
    )}>
      {/* Logo */}
      <div className="p-2 lg:p-3 xl:p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12 rounded-lg xl:rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Pizza className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-primary-foreground" />
          </div>
          {(!isCollapsed || isFloating) && (
            <div className="overflow-hidden flex-1">
              <h1 className="text-base lg:text-lg xl:text-xl font-bold text-sidebar-foreground">PizzaPOS</h1>
              <p className="text-[10px] lg:text-xs text-sidebar-foreground/70">Sistema de Ventas</p>
            </div>
          )}
          {/* Close button for mobile */}
          {isFloating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={closeMobileSidebar}
              className="text-sidebar-foreground hover:bg-sidebar-accent h-8 w-8 p-0"
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Collapse button - only on desktop */}
      {!isFloating && (
        <div className="px-2 lg:px-3 py-1 lg:py-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={cn(
              "w-full justify-center text-sidebar-foreground hover:bg-sidebar-accent h-7 lg:h-8",
              !isCollapsed && "justify-end"
            )}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4 lg:h-5 lg:w-5" /> : <ChevronLeft className="h-4 w-4 lg:h-5 lg:w-5" />}
          </Button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-1 lg:p-2 space-y-0.5 lg:space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map((item) => {
            const isActive = location.pathname === item.to;
            const showLabel = !isCollapsed || isFloating;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={handleNavClick}
                className={cn(
                  'flex items-center gap-2 lg:gap-3 px-2 lg:px-3 py-2 lg:py-2.5 xl:py-3 rounded-lg xl:rounded-xl font-medium transition-all text-xs lg:text-sm xl:text-base touch-active',
                  !showLabel && 'justify-center',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                )}
                title={!showLabel ? item.label : undefined}
              >
                <item.icon className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 shrink-0" />
                {showLabel && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
      </nav>

      {/* Footer */}
      <div className="p-2 lg:p-3 border-t border-sidebar-border space-y-1 lg:space-y-2">
        {(!isCollapsed || isFloating) && <OnlineIndicator />}
        <button 
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2 lg:gap-3 w-full px-2 lg:px-3 py-2 lg:py-2.5 xl:py-3 rounded-lg xl:rounded-xl text-sidebar-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-xs lg:text-sm xl:text-base touch-active",
            !isCollapsed && !isFloating ? "" : isCollapsed && !isFloating ? "justify-center" : ""
          )}
        >
          <LogOut className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 shrink-0" />
          {(!isCollapsed || isFloating) && <span className="font-medium">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );

  // Mobile/Tablet floating sidebar
  if (isFloating) {
    return (
      <>
        {/* Overlay */}
        {isMobileOpen && (
          <div 
            className="sidebar-overlay"
            onClick={closeMobileSidebar}
          />
        )}
        {/* Sliding sidebar */}
        <div className={cn(
          "sidebar-mobile",
          isMobileOpen ? "open" : "closed"
        )}>
          {sidebarContent}
        </div>
      </>
    );
  }

  return sidebarContent;
}
