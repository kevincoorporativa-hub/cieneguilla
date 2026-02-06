import { Database, ChevronDown, AlertTriangle, CheckCircle, HardDrive } from 'lucide-react';
import { useDatabaseSize } from '@/hooks/useDatabaseSize';
import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export function StorageBar() {
  const { data, isLoading, refetch } = useDatabaseSize();

  const percentage = data?.percentage ?? 0;
  const sizeUsed = data?.size_pretty ?? '...';
  const sizeLimit = data?.limit_pretty ?? '500 MB';

  // Color and status based on usage
  const getStatus = () => {
    if (percentage >= 90) return { 
      color: 'bg-destructive', 
      bgColor: 'bg-destructive/10',
      textColor: 'text-destructive',
      borderColor: 'border-destructive/30',
      icon: AlertTriangle,
      label: '¡Almacenamiento crítico!',
      message: `Libera espacio para continuar operando normalmente.`
    };
    if (percentage >= 70) return { 
      color: 'bg-warning', 
      bgColor: 'bg-warning/10',
      textColor: 'text-warning',
      borderColor: 'border-warning/30',
      icon: AlertTriangle,
      label: 'Almacenamiento alto',
      message: 'Considera liberar espacio pronto.'
    };
    return { 
      color: 'bg-primary', 
      bgColor: 'bg-primary/5',
      textColor: 'text-primary',
      borderColor: 'border-primary/20',
      icon: CheckCircle,
      label: 'Almacenamiento disponible',
      message: 'Tu base de datos tiene espacio suficiente.'
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 py-2 h-auto hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <HardDrive className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium truncate">Almacenamiento</span>
                <ChevronDown className="h-3 w-3 shrink-0 text-sidebar-foreground/50" />
              </div>
              {/* Mini progress bar */}
              <div className="h-1.5 bg-sidebar-accent rounded-full overflow-hidden mt-1">
                <div 
                  className={cn(
                    "h-full transition-all duration-500 rounded-full",
                    status.color,
                    isLoading && "animate-pulse bg-sidebar-foreground/20"
                  )}
                  style={{ width: isLoading ? '30%' : `${Math.max(percentage, 3)}%` }}
                />
              </div>
            </div>
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        side="top" 
        align="start"
        sideOffset={8}
      >
        {/* Header con status */}
        <div className={cn(
          "p-4 rounded-t-lg border-b",
          status.bgColor,
          status.borderColor
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              "p-2 rounded-full",
              status.bgColor
            )}>
              <StatusIcon className={cn("h-5 w-5", status.textColor)} />
            </div>
            <div className="flex-1">
              <h4 className={cn("font-semibold", status.textColor)}>
                {status.label}
              </h4>
              <p className="text-sm text-muted-foreground mt-0.5">
                {status.message}
              </p>
            </div>
          </div>
        </div>

        {/* Storage details */}
        <div className="p-4 space-y-4">
          {/* Main progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Almacenamiento usado</span>
              <span className="font-semibold">
                {isLoading ? '...' : `${sizeUsed} de ${sizeLimit}`}
              </span>
            </div>
            
            {/* Big progress bar */}
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-700 rounded-full",
                  status.color,
                  isLoading && "animate-pulse bg-muted-foreground/20"
                )}
                style={{ width: isLoading ? '30%' : `${Math.max(percentage, 2)}%` }}
              />
            </div>
            
            {/* Percentage */}
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{isLoading ? '...' : `${percentage.toFixed(1)}% usado`}</span>
              <span>Límite: {sizeLimit}</span>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <Database className="h-4 w-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-medium text-foreground mb-1">Base de datos PostgreSQL</p>
                <p>El almacenamiento incluye todas las tablas, índices y datos del sistema.</p>
              </div>
            </div>
          </div>

          {/* Refresh button */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            {isLoading ? 'Actualizando...' : 'Actualizar información'}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
