import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryButtonProps {
  nombre: string;
  icon: LucideIcon;
  isActive: boolean;
  onClick: () => void;
  color?: string;
}

export function CategoryButton({ nombre, icon: Icon, isActive, onClick, color }: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'category-btn w-full',
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      )}
      style={color && isActive ? { backgroundColor: color } : undefined}
    >
      <Icon className="h-6 w-6" />
      <span className="truncate">{nombre}</span>
    </button>
  );
}
