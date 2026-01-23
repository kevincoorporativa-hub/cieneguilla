import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ExpiringProduct {
  id: string;
  nombre: string;
  fechaVencimiento: Date;
  diasRestantes: number;
  status: 'expired' | 'warning' | 'soon';
}

// Demo data - productos por vencer
const getExpiringProducts = (): ExpiringProduct[] => {
  const today = new Date();
  
  return [
    {
      id: '1',
      nombre: 'Coca Cola 1L',
      fechaVencimiento: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000), // Hace 2 días (vencido)
      diasRestantes: -2,
      status: 'expired',
    },
    {
      id: '2',
      nombre: 'Cerveza Pilsen',
      fechaVencimiento: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000), // En 5 días
      diasRestantes: 5,
      status: 'warning',
    },
    {
      id: '3',
      nombre: 'Sprite 500ml',
      fechaVencimiento: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000), // En 10 días
      diasRestantes: 10,
      status: 'warning',
    },
    {
      id: '4',
      nombre: 'Fanta Naranja',
      fechaVencimiento: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000), // En 15 días
      diasRestantes: 15,
      status: 'soon',
    },
    {
      id: '5',
      nombre: 'Inka Kola 2L',
      fechaVencimiento: new Date(today.getTime() + 18 * 24 * 60 * 60 * 1000), // En 18 días
      diasRestantes: 18,
      status: 'soon',
    },
  ];
};

export function NotificationsDropdown() {
  const [expiringProducts, setExpiringProducts] = useState<ExpiringProduct[]>([]);

  useEffect(() => {
    // Cargar productos por vencer
    setExpiringProducts(getExpiringProducts());
  }, []);

  const expiredCount = expiringProducts.filter(p => p.status === 'expired').length;
  const warningCount = expiringProducts.filter(p => p.status === 'warning' || p.status === 'soon').length;
  const totalNotifications = expiredCount + warningCount;

  const getStatusColor = (status: ExpiringProduct['status']) => {
    switch (status) {
      case 'expired':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-warning text-warning-foreground';
      case 'soon':
        return 'bg-accent text-accent-foreground';
    }
  };

  const getStatusIcon = (status: ExpiringProduct['status']) => {
    switch (status) {
      case 'expired':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <Clock className="h-4 w-4" />;
      case 'soon':
        return <Package className="h-4 w-4" />;
    }
  };

  const getStatusLabel = (product: ExpiringProduct) => {
    if (product.status === 'expired') {
      return `Venció hace ${Math.abs(product.diasRestantes)} día${Math.abs(product.diasRestantes) !== 1 ? 's' : ''}`;
    }
    return `Vence en ${product.diasRestantes} día${product.diasRestantes !== 1 ? 's' : ''}`;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-6 w-6" />
          {totalNotifications > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
              {totalNotifications}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <h4 className="font-bold text-lg flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </h4>
          <p className="text-sm text-muted-foreground">
            {totalNotifications} alerta{totalNotifications !== 1 ? 's' : ''} de productos
          </p>
        </div>

        <ScrollArea className="h-[300px]">
          {expiringProducts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No hay notificaciones
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
                  {expiringProducts
                    .filter(p => p.status === 'expired')
                    .map(product => (
                      <div
                        key={product.id}
                        className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 mb-2"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${getStatusColor(product.status)}`}>
                            {getStatusIcon(product.status)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{product.nombre}</p>
                            <p className="text-xs text-destructive font-medium">
                              {getStatusLabel(product)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.fechaVencimiento.toLocaleDateString('es-PE')}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Productos por vencer (20 días o menos) */}
              {expiringProducts.filter(p => p.status !== 'expired').length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-warning px-2 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    POR VENCER (próximos 20 días)
                  </p>
                  {expiringProducts
                    .filter(p => p.status !== 'expired')
                    .sort((a, b) => a.diasRestantes - b.diasRestantes)
                    .map(product => (
                      <div
                        key={product.id}
                        className={`p-3 rounded-lg mb-2 ${
                          product.status === 'warning' 
                            ? 'bg-warning/10 border border-warning/30' 
                            : 'bg-accent/10 border border-accent/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${getStatusColor(product.status)}`}>
                            {getStatusIcon(product.status)}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-sm">{product.nombre}</p>
                            <p className={`text-xs font-medium ${
                              product.status === 'warning' ? 'text-warning' : 'text-accent'
                            }`}>
                              {getStatusLabel(product)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.fechaVencimiento.toLocaleDateString('es-PE')}
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
            Ver todos los productos por vencer
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
