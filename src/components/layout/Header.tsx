import { User, Calendar, Shield, UserCheck } from 'lucide-react';
import { OperationMode } from '@/types/pos';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  mode: OperationMode;
  onModeChange: (mode: OperationMode) => void;
}

export function Header({ mode, onModeChange }: HeaderProps) {
  const { user, role } = useAuth();
  
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Get display name from user email
  const displayName = user?.email?.split('@')[0] || 'Usuario';
  
  // Get role display
  const getRoleDisplay = () => {
    switch (role) {
      case 'admin': return { label: 'Administrador', icon: Shield, color: 'text-primary' };
      case 'manager': return { label: 'Gerente', icon: Shield, color: 'text-primary' };
      case 'cashier': return { label: 'Cajero', icon: UserCheck, color: 'text-success' };
      case 'kitchen': return { label: 'Cocina', icon: User, color: 'text-warning' };
      case 'delivery': return { label: 'Repartidor', icon: User, color: 'text-secondary' };
      default: return { label: 'Usuario', icon: User, color: 'text-muted-foreground' };
    }
  };
  
  const roleInfo = getRoleDisplay();

  return (
    <header className="h-14 lg:h-16 xl:h-20 bg-card border-b border-border px-3 lg:px-4 xl:px-6 flex items-center justify-between gap-2">
      {/* Mode selector */}
      <div className="flex items-center gap-2 lg:gap-4">
        <div className="flex bg-muted rounded-lg lg:rounded-xl p-0.5 lg:p-1">
          <button
            onClick={() => onModeChange('pizzeria')}
            className={`px-3 lg:px-4 xl:px-6 py-1.5 lg:py-2 xl:py-3 rounded-md lg:rounded-lg text-xs lg:text-sm xl:text-base font-semibold transition-all ${
              mode === 'pizzeria'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🍕 <span className="hidden sm:inline">Pizzería / Bar</span><span className="sm:hidden">Pizza</span>
          </button>
          <button
            onClick={() => onModeChange('restaurante')}
            className={`px-3 lg:px-4 xl:px-6 py-1.5 lg:py-2 xl:py-3 rounded-md lg:rounded-lg text-xs lg:text-sm xl:text-base font-semibold transition-all ${
              mode === 'restaurante'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🍽️ <span className="hidden sm:inline">Restaurante</span><span className="sm:hidden">Rest.</span>
          </button>
        </div>
      </div>

      {/* Date and time - hidden on small screens */}
      <div className="hidden lg:flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-4 w-4 xl:h-5 xl:w-5" />
        <span className="text-sm xl:text-base capitalize">{today}</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-2 lg:gap-4">
        <NotificationsDropdown />
        <div className="flex items-center gap-2 lg:gap-3 px-2 lg:px-3 xl:px-4 py-1.5 lg:py-2 bg-muted rounded-lg lg:rounded-xl">
          <div className="w-8 h-8 lg:w-9 lg:h-9 xl:w-10 xl:h-10 rounded-full bg-primary flex items-center justify-center">
            <User className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-sm lg:text-base capitalize">{displayName}</p>
            <p className={`text-xs lg:text-sm flex items-center gap-1 ${roleInfo.color}`}>
              <roleInfo.icon className="h-3 w-3" />
              {roleInfo.label}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
