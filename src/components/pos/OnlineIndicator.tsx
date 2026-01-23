import { Wifi, WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export function OnlineIndicator() {
  const isOnline = useOnlineStatus();

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm ${
        isOnline ? 'status-online' : 'status-offline'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="h-5 w-5" />
          <span>En línea</span>
        </>
      ) : (
        <>
          <WifiOff className="h-5 w-5 animate-pulse-slow" />
          <span>Sin conexión</span>
        </>
      )}
    </div>
  );
}
