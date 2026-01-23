import { User, Calendar } from 'lucide-react';
import { OperationMode } from '@/types/pos';
import { NotificationsDropdown } from '@/components/notifications/NotificationsDropdown';

interface HeaderProps {
  mode: OperationMode;
  onModeChange: (mode: OperationMode) => void;
  userName: string;
}

export function Header({ mode, onModeChange, userName }: HeaderProps) {
  const today = new Date().toLocaleDateString('es-PE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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
            <p className="font-bold text-pos-base">{userName}</p>
            <p className="text-sm text-muted-foreground">Vendedor</p>
          </div>
        </div>
      </div>
    </header>
  );
}
