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
        'category-btn w-full select-none',
        isActive
          ? 'bg-primary text-primary-foreground shadow-lg'
          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
      )}
      style={{
        ...(color && isActive ? { backgroundColor: color } : {}),
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <Icon className="h-5 w-5 lg:h-5 lg:w-5" />
      <span className="truncate text-xs lg:text-sm">{nombre}</span>
    </button>
  );
}
