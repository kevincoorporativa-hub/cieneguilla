import { Menu } from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';

export function FloatingSidebarButton() {
  const { isFloating, isMobileOpen, openMobileSidebar } = useSidebarContext();

  // Only show on small screens when sidebar is hidden
  if (!isFloating || isMobileOpen) return null;

  return (
    <button
      onClick={openMobileSidebar}
      className="floating-sidebar-btn"
      aria-label="Abrir menú"
    >
      <Menu className="h-6 w-6" />
    </button>
  );
}
