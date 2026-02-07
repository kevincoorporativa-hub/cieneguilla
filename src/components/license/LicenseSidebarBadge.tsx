import { Key, AlertTriangle } from 'lucide-react';
import { useLicenseStatus } from '@/hooks/useLicense';
import { cn } from '@/lib/utils';

interface LicenseSidebarBadgeProps {
  collapsed?: boolean;
}

export function LicenseSidebarBadge({ collapsed = false }: LicenseSidebarBadgeProps) {
  const { isLoading, isExpired, daysRemaining, isWarning, isCritical } = useLicenseStatus();

  if (isLoading) return null;

  const getColor = () => {
    if (isExpired) return 'text-destructive bg-destructive/10';
    if (isCritical) return 'text-destructive bg-destructive/10';
    if (isWarning) return 'text-warning bg-warning/10';
    return 'text-success bg-success/10';
  };

  const getDotColor = () => {
    if (isExpired) return 'bg-destructive';
    if (isCritical) return 'bg-destructive animate-pulse';
    if (isWarning) return 'bg-warning animate-pulse';
    return 'bg-success';
  };

  if (collapsed) {
    return (
      <div className="flex justify-center py-1" title={`Licencia: ${daysRemaining} días restantes`}>
        <div className={cn('w-2.5 h-2.5 rounded-full', getDotColor())} />
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg text-xs lg:text-sm', getColor())}>
      {isExpired || isCritical ? (
        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Key className="h-3.5 w-3.5 shrink-0" />
      )}
      <span className="font-medium truncate">
        {isExpired
          ? 'Licencia vencida'
          : `Licencia: ${daysRemaining}d`}
      </span>
    </div>
  );
}
