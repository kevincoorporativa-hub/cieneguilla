import { Database } from 'lucide-react';
import { useDatabaseSize } from '@/hooks/useDatabaseSize';
import { cn } from '@/lib/utils';

export function StorageBar() {
  const { data, isLoading } = useDatabaseSize();

  const percentage = data?.percentage ?? 0;
  const sizeUsed = data?.size_pretty ?? '...';
  const sizeLimit = data?.limit_pretty ?? '500 MB';

  // Color based on usage
  const getBarColor = () => {
    if (percentage >= 90) return 'bg-destructive';
    if (percentage >= 70) return 'bg-warning';
    return 'bg-primary';
  };

  return (
    <div className="px-2 py-2 space-y-1.5">
      <div className="flex items-center gap-2 text-xs text-sidebar-foreground/70">
        <Database className="h-3.5 w-3.5" />
        <span className="font-medium">Almacenamiento</span>
      </div>
      
      {/* Progress bar container */}
      <div className="h-2 bg-sidebar-accent rounded-full overflow-hidden">
        <div 
          className={cn(
            "h-full transition-all duration-500 rounded-full",
            getBarColor(),
            isLoading && "animate-pulse bg-sidebar-foreground/20"
          )}
          style={{ width: isLoading ? '30%' : `${Math.max(percentage, 2)}%` }}
        />
      </div>
      
      {/* Usage text */}
      <div className="text-[10px] text-sidebar-foreground/60">
        {isLoading ? (
          <span className="animate-pulse">Calculando...</span>
        ) : (
          <span>{sizeUsed} de {sizeLimit} usados</span>
        )}
      </div>
    </div>
  );
}
