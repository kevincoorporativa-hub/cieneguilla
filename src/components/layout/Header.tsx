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
    <header className="h-20 bg-card border-b border-border px-6 flex items-center justify-between">
      {/* Mode selector */}
      <div className="flex items-center gap-4">
        <div className="flex bg-muted rounded-xl p-1">
          <button
            onClick={() => onModeChange('pizzeria')}
            className={`px-6 py-3 rounded-lg text-pos-base font-semibold transition-all ${
              mode === 'pizzeria'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🍕 Pizzería / Bar
          </button>
          <button
            onClick={() => onModeChange('restaurante')}
            className={`px-6 py-3 rounded-lg text-pos-base font-semibold transition-all ${
              mode === 'restaurante'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            🍽️ Restaurante
          </button>
        </div>
      </div>

      {/* Date and time */}
      <div className="flex items-center gap-2 text-muted-foreground">
        <Calendar className="h-5 w-5" />
        <span className="text-pos-base capitalize">{today}</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-4">
        <NotificationsDropdown />
        <div className="flex items-center gap-3 px-4 py-2 bg-muted rounded-xl">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <User className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-bold text-pos-base capitalize">{displayName}</p>
            <p className={`text-sm flex items-center gap-1 ${roleInfo.color}`}>
              <roleInfo.icon className="h-3 w-3" />
              {roleInfo.label}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
