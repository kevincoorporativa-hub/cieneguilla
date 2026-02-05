import { useState, useMemo } from 'react';
import { Truck, MapPin, Phone, Clock, CheckCircle, User, Package, Eye, XCircle, Navigation, CalendarIcon } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useDeliveryOrders,
  useUpdateDeliveryStatus,
  useMarkDelivered,
  DeliveryStatus,
  DeliveryOrder,
} from '@/hooks/useDelivery';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

type FilterStatus = DeliveryStatus | 'all';

function getStatusColor(status: DeliveryStatus) {
  switch (status) {
    case 'open': return 'bg-warning text-warning-foreground';
    case 'preparing': return 'bg-orange-500 text-white'; // kept for backwards compat
    case 'ready': return 'bg-orange-500 text-white';
    case 'paid': return 'bg-success text-success-foreground';
    case 'cancelled': return 'bg-destructive text-destructive-foreground';
  }
}

function getStatusLabel(status: DeliveryStatus) {
  switch (status) {
    case 'open': return 'Pendiente';
    case 'preparing': return 'En camino'; // simplified flow
    case 'ready': return 'En camino';
    case 'paid': return 'Entregado';
    case 'cancelled': return 'Cancelado';
  }
}

function getStatusIcon(status: DeliveryStatus) {
  switch (status) {
    case 'open': return <Clock className="h-4 w-4" />;
    case 'preparing': return <Truck className="h-4 w-4" />; // simplified flow
    case 'ready': return <Truck className="h-4 w-4" />;
    case 'paid': return <CheckCircle className="h-4 w-4" />;
    case 'cancelled': return <XCircle className="h-4 w-4" />;
  }
}

// Hook to fetch order items
function useOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          id,
          quantity,
          unit_price,
          subtotal,
          notes,
          product:products(name),
          combo:combos(name)
        `)
        .eq('order_id', orderId);

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export default function DeliveryPage() {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  // Use current local date without timezone issues
  const [dateFilter, setDateFilter] = useState<Date | undefined>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<DeliveryOrder | null>(null);

  // Fetch data
  const dateFilterString = dateFilter ? format(dateFilter, 'yyyy-MM-dd') : undefined;
  const { data: orders = [], isLoading: loadingOrders } = useDeliveryOrders(
    selectedStatus === 'all' ? undefined : selectedStatus,
    dateFilterString
  );
  const { data: orderItems = [] } = useOrderItems(selectedOrder?.id || null);

  // Mutations
  const updateStatus = useUpdateDeliveryStatus();
  const markDelivered = useMarkDelivered();

  // Counts based on all orders (not filtered by status)
  const pendingCount = useMemo(() => orders.filter(o => o.status === 'open').length, [orders]);
  const inProgressCount = useMemo(() => orders.filter(o => o.status === 'ready').length, [orders]);
  const deliveredCount = useMemo(() => orders.filter(o => o.status === 'paid').length, [orders]);

  const handleOpenDetailModal = (order: DeliveryOrder) => {
    setSelectedOrder(order);
    setDetailModalOpen(true);
  };

  const handleStartPreparing = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: 'ready' });
      toast.success('Pedido en camino');
    } catch (error: any) {
      toast.error('Error al actualizar estado', { description: error.message });
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await markDelivered.mutateAsync(orderId);
      toast.success('Pedido entregado exitosamente');
      setDetailModalOpen(false);
    } catch (error: any) {
      toast.error('Error al marcar como entregado', { description: error.message });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: 'cancelled' });
      toast.success('Pedido cancelado');
      setDetailModalOpen(false);
    } catch (error: any) {
      toast.error('Error al cancelar pedido', { description: error.message });
    }
  };

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter(o => o.status === selectedStatus);

  const isLoading = loadingOrders;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Delivery</h1>
            <p className="text-muted-foreground">
              Gestiona los pedidos de entrega
              {dateFilter && ` - ${format(dateFilter, "dd 'de' MMMM yyyy", { locale: es })}`}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            <Card className="border-2 px-6 py-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-warning">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Pendientes</p>
              </div>
            </Card>
            <Card className="border-2 px-6 py-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{inProgressCount}</p>
                <p className="text-sm text-muted-foreground">En proceso</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3 flex-wrap items-center">
          {/* Status filters */}
          <Button
            variant={selectedStatus === 'open' ? 'default' : 'outline'}
            className={`btn-pos ${selectedStatus === 'open' ? '' : 'hover:bg-muted'}`}
            onClick={() => setSelectedStatus('open')}
          >
            {getStatusIcon('open')}
            <span className="ml-1">Pendiente</span>
            <Badge variant="secondary" className="ml-2 text-xs">{pendingCount}</Badge>
          </Button>
          <Button
            variant={selectedStatus === 'ready' ? 'default' : 'outline'}
            className={`btn-pos ${selectedStatus === 'ready' ? '' : 'hover:bg-muted'}`}
            onClick={() => setSelectedStatus('ready')}
          >
            {getStatusIcon('ready')}
            <span className="ml-1">En camino</span>
            <Badge variant="secondary" className="ml-2 text-xs">{inProgressCount}</Badge>
          </Button>
          <Button
            variant={selectedStatus === 'paid' ? 'default' : 'outline'}
            className={`btn-pos ${selectedStatus === 'paid' ? '' : 'hover:bg-muted'}`}
            onClick={() => setSelectedStatus('paid')}
          >
            {getStatusIcon('paid')}
            <span className="ml-1">Entregado</span>
            <Badge variant="secondary" className="ml-2 text-xs">{deliveredCount}</Badge>
          </Button>
          <Button
            variant={selectedStatus === 'all' ? 'default' : 'outline'}
            className={`btn-pos ${selectedStatus === 'all' ? '' : 'hover:bg-muted'}`}
            onClick={() => setSelectedStatus('all')}
          >
            Todos
          </Button>

          <div className="h-6 w-px bg-border mx-2" />

          {/* Date filter at the end */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[200px] justify-start text-left font-normal",
                  !dateFilter && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFilter ? format(dateFilter, "dd/MM/yyyy", { locale: es }) : "Todas las fechas"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFilter}
                onSelect={setDateFilter}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          {dateFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDateFilter(undefined)}
              className="text-muted-foreground"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Ver todo
            </Button>
          )}
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-pos-lg">
                      Ticket #{order.order_number}
                    </CardTitle>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Client info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-muted-foreground" />
                      <span className="font-semibold">
                        {order.customer?.name || 'Cliente sin nombre'}
                      </span>
                    </div>
                    {order.customer?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                        <a href={`tel:${order.customer.phone}`} className="text-primary hover:underline">
                          {order.customer.phone}
                        </a>
                      </div>
                    )}
                    {order.address && (
                      <div className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                        <MapPin className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{order.address.address}</p>
                          {order.address.reference && (
                            <p className="text-xs text-muted-foreground">Ref: {order.address.reference}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time info */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">
                      Pedido: {format(new Date(order.created_at), "HH:mm 'hrs'", { locale: es })}
                    </span>
                  </div>

                  {/* Assigned driver */}
                  {order.delivery_assignment?.driver && (
                    <div className="flex items-center gap-2 p-2 bg-primary/10 rounded-lg border border-primary/20">
                      <Truck className="h-5 w-5 text-primary" />
                      <span className="font-medium text-primary">
                        {order.delivery_assignment.driver.first_name} {order.delivery_assignment.driver.last_name}
                      </span>
                    </div>
                  )}

                  {/* Timestamps */}
                  {order.delivery_assignment?.picked_up_at && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Navigation className="h-4 w-4" />
                      <span>Salió: {format(new Date(order.delivery_assignment.picked_up_at), "HH:mm", { locale: es })}</span>
                    </div>
                  )}
                  {order.delivery_assignment?.delivered_at && (
                    <div className="flex items-center gap-2 text-sm text-success">
                      <CheckCircle className="h-4 w-4" />
                      <span>Entregado: {format(new Date(order.delivery_assignment.delivered_at), "HH:mm", { locale: es })}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="font-semibold">Total:</span>
                    <span className="text-pos-xl font-bold text-primary">
                      S/ {Number(order.total).toFixed(2)}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* View Details button - always visible */}
                    <Button 
                      variant="outline"
                      className="btn-pos"
                      onClick={() => handleOpenDetailModal(order)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Ver Detalle
                    </Button>

                    {order.status === 'open' && (
                      <Button 
                        className="btn-pos bg-orange-500 hover:bg-orange-600"
                        onClick={() => handleStartPreparing(order.id)}
                        disabled={updateStatus.isPending}
                      >
                        <Truck className="h-4 w-4 mr-1" />
                        En Camino
                      </Button>
                    )}
                    
                    {order.status === 'ready' && (
                      <Button 
                        className="btn-pos bg-success hover:bg-success/90"
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={markDelivered.isPending}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Entregado
                      </Button>
                    )}
                    
                    {order.status === 'paid' && (
                      <div className="flex items-center justify-center gap-1 text-success font-medium">
                        <CheckCircle className="h-5 w-5" />
                        Completado
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Truck className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-pos-lg font-medium">No hay pedidos de delivery</p>
            <p className="text-sm mt-2">
              {dateFilter 
                ? `No hay pedidos para el ${format(dateFilter, "dd/MM/yyyy", { locale: es })}`
                : 'Los pedidos de delivery aparecerán aquí'
              }
            </p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Ticket #{selectedOrder?.order_number}
              </span>
              {selectedOrder && (
                <span className={`px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {getStatusLabel(selectedOrder.status)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4 py-4">
              {/* Customer Info */}
              <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Cliente
                </h4>
                <p className="font-medium">{selectedOrder.customer?.name || 'Cliente sin nombre'}</p>
                {selectedOrder.customer?.phone && (
                  <p className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4" />
                    <a href={`tel:${selectedOrder.customer.phone}`} className="text-primary hover:underline">
                      {selectedOrder.customer.phone}
                    </a>
                  </p>
                )}
              </div>

              {/* Address */}
              {selectedOrder.address && (
                <div className="space-y-2 p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                  <h4 className="font-semibold flex items-center gap-2 text-destructive">
                    <MapPin className="h-4 w-4" />
                    Dirección de Entrega
                  </h4>
                  <p className="font-medium">{selectedOrder.address.address}</p>
                  {selectedOrder.address.reference && (
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium">Referencia:</span> {selectedOrder.address.reference}
                    </p>
                  )}
                </div>
              )}

              {/* Order Items */}
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Productos
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {orderItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                      <div>
                        <span className="font-medium">
                          {item.quantity}x {item.product?.name || item.combo?.name || 'Producto'}
                        </span>
                        {item.notes && (
                          <p className="text-xs text-muted-foreground">{item.notes}</p>
                        )}
                      </div>
                      <span className="font-semibold">S/ {Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Driver Info */}
              {selectedOrder.delivery_assignment?.driver && (
                <div className="space-y-2 p-4 bg-primary/10 rounded-lg border border-primary/20">
                  <h4 className="font-semibold flex items-center gap-2 text-primary">
                    <Truck className="h-4 w-4" />
                    Repartidor Asignado
                  </h4>
                  <p className="font-medium">
                    {selectedOrder.delivery_assignment.driver.first_name} {selectedOrder.delivery_assignment.driver.last_name}
                  </p>
                  {selectedOrder.delivery_assignment.picked_up_at && (
                    <p className="text-sm">
                      <Navigation className="h-3 w-3 inline mr-1" />
                      Salió: {format(new Date(selectedOrder.delivery_assignment.picked_up_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  )}
                  {selectedOrder.delivery_assignment.delivered_at && (
                    <p className="text-sm text-success">
                      <CheckCircle className="h-3 w-3 inline mr-1" />
                      Entregado: {format(new Date(selectedOrder.delivery_assignment.delivered_at), "dd/MM/yyyy HH:mm", { locale: es })}
                    </p>
                  )}
                </div>
              )}

              {/* Timestamps */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Creado: {format(new Date(selectedOrder.created_at), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <span className="text-lg font-bold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  S/ {Number(selectedOrder.total).toFixed(2)}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                {selectedOrder.status === 'open' && (
                  <>
                    <Button 
                      variant="destructive"
                      className="flex-1"
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button 
                      className="flex-1 bg-orange-500 hover:bg-orange-600"
                      onClick={() => {
                        handleStartPreparing(selectedOrder.id);
                        setDetailModalOpen(false);
                      }}
                    >
                      <Truck className="h-4 w-4 mr-1" />
                      En Camino
                    </Button>
                  </>
                )}
                
                {selectedOrder.status === 'ready' && (
                  <Button 
                    className="flex-1 bg-success hover:bg-success/90"
                    onClick={() => handleMarkDelivered(selectedOrder.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Marcar como Entregado
                  </Button>
                )}
                
                {(selectedOrder.status === 'paid' || selectedOrder.status === 'cancelled') && (
                  <Button 
                    variant="outline"
                    className="flex-1"
                    onClick={() => setDetailModalOpen(false)}
                  >
                    Cerrar
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

    </MainLayout>
  );
}
