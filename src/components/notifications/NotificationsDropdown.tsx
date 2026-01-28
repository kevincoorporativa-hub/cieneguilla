import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, Package, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExpiringProducts, useLowStockProducts } from '@/hooks/useProductInventory';

interface NotificationItem {
  id: string;
  type: 'expired' | 'expiring_soon' | 'low_stock';
  title: string;
  description: string;
  daysRemaining?: number;
  quantity?: number;
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  
  const { data: expiringProducts = [], isLoading: loadingExpiring, refetch: refetchExpiring } = useExpiringProducts(20);
  const { data: lowStockProducts = [], isLoading: loadingLowStock, refetch: refetchLowStock } = useLowStockProducts();

  useEffect(() => {
    const items: NotificationItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Process expiring products
    expiringProducts.forEach((product: any) => {
      const expDate = new Date(product.expiration_date);
      expDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      items.push({
        id: `exp-${product.id}`,
        type: diffDays < 0 ? 'expired' : 'expiring_soon',
        title: product.name,
        description: diffDays < 0 
          ? `Venció hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`
          : `Vence en ${diffDays} día${diffDays !== 1 ? 's' : ''}`,
        daysRemaining: diffDays,
      });
    });

    // Process low stock products
    lowStockProducts.forEach((stock: any) => {
      if (stock.product) {
        items.push({
          id: `stock-${stock.id}`,
          type: 'low_stock',
          title: stock.product.name,
          description: `Stock bajo: ${stock.quantity} unidades`,
          quantity: stock.quantity,
        });
      }
    });

    // Sort: expired first, then by days remaining
    items.sort((a, b) => {
      if (a.type === 'expired' && b.type !== 'expired') return -1;
      if (a.type !== 'expired' && b.type === 'expired') return 1;
      if (a.daysRemaining !== undefined && b.daysRemaining !== undefined) {
        return a.daysRemaining - b.daysRemaining;
      }
      return 0;
    });

    setNotifications(items);
  }, [expiringProducts, lowStockProducts]);

  const handleRefresh = () => {
    refetchExpiring();
    refetchLowStock();
  };

  const expiredCount = notifications.filter(n => n.type === 'expired').length;
  const expiringCount = notifications.filter(n => n.type === 'expiring_soon').length;
  const lowStockCount = notifications.filter(n => n.type === 'low_stock').length;
  const totalNotifications = notifications.length;

  const isLoading = loadingExpiring || loadingLowStock;

  const getNotificationStyle = (type: NotificationItem['type']) => {
    switch (type) {
      case 'expired':
        return 'bg-destructive/10 border-destructive/30';
      case 'expiring_soon':
        return 'bg-warning/10 border-warning/30';
      case 'low_stock':
        return 'bg-accent/10 border-accent/30';
    }
  };

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4 text-destructive" />;
      case 'expiring_soon':
        return <Clock className="h-4 w-4 text-warning" />;
      case 'low_stock':
        return <Package className="h-4 w-4 text-accent" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {totalNotifications > 99 ? '99+' : totalNotifications}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h4 className="font-bold text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </h4>
            <p className="text-sm text-muted-foreground">
              {totalNotifications} alerta{totalNotifications !== 1 ? 's' : ''}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-muted-foreground">
              Cargando alertas...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay notificaciones</p>
              <p className="text-xs">Todo está en orden 🎉</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {/* Productos vencidos */}
              {expiredCount > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-destructive px-2 py-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    PRODUCTOS VENCIDOS ({expiredCount})
                  </p>
                  {notifications
                    .filter(n => n.type === 'expired')
                    .map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border mb-2 ${getNotificationStyle(notification.type)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-destructive text-destructive-foreground">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-xs text-destructive font-medium">
                              {notification.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Productos por vencer */}
              {expiringCount > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-semibold text-warning px-2 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    POR VENCER ({expiringCount})
                  </p>
                  {notifications
                    .filter(n => n.type === 'expiring_soon')
                    .map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border mb-2 ${getNotificationStyle(notification.type)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-warning text-warning-foreground">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-xs text-warning font-medium">
                              {notification.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Stock bajo */}
              {lowStockCount > 0 && (
                <div>
                  <p className="text-xs font-semibold text-accent px-2 py-1 flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    STOCK BAJO ({lowStockCount})
                  </p>
                  {notifications
                    .filter(n => n.type === 'low_stock')
                    .map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border mb-2 ${getNotificationStyle(notification.type)}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-full bg-accent text-accent-foreground">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{notification.title}</p>
                            <p className="text-xs font-medium">
                              {notification.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="p-3 border-t bg-muted/50">
          <Button variant="outline" size="sm" className="w-full text-sm">
            Ver inventario completo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
