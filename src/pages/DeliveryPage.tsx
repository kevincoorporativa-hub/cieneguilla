import { useState } from 'react';
import { Truck, MapPin, Phone, Clock, CheckCircle, User, Package, UserCheck } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  useDeliveryOrders,
  useDeliveryDrivers,
  useAssignDriver,
  useUpdateDeliveryStatus,
  useMarkPickedUp,
  useMarkDelivered,
  DeliveryStatus,
} from '@/hooks/useDelivery';

type FilterStatus = DeliveryStatus | 'all';

function getStatusColor(status: DeliveryStatus) {
  switch (status) {
    case 'open': return 'bg-warning text-warning-foreground';
    case 'preparing': return 'bg-primary text-primary-foreground';
    case 'ready': return 'bg-secondary text-secondary-foreground';
    case 'paid': return 'bg-success text-success-foreground';
    case 'cancelled': return 'bg-destructive text-destructive-foreground';
  }
}

function getStatusLabel(status: DeliveryStatus) {
  switch (status) {
    case 'open': return 'Pendiente';
    case 'preparing': return 'En preparación';
    case 'ready': return 'En camino';
    case 'paid': return 'Entregado';
    case 'cancelled': return 'Cancelado';
  }
}

export default function DeliveryPage() {
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>('all');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Fetch data
  const { data: orders = [], isLoading: loadingOrders } = useDeliveryOrders(
    selectedStatus === 'all' ? undefined : selectedStatus
  );
  const { data: drivers = [], isLoading: loadingDrivers } = useDeliveryDrivers();

  // Mutations
  const assignDriver = useAssignDriver();
  const updateStatus = useUpdateDeliveryStatus();
  const markPickedUp = useMarkPickedUp();
  const markDelivered = useMarkDelivered();

  const pendingCount = orders.filter(o => o.status === 'open').length;
  const inProgressCount = orders.filter(o => o.status === 'preparing' || o.status === 'ready').length;

  const handleOpenAssignModal = (orderId: string) => {
    setSelectedOrderId(orderId);
    setSelectedDriverId('');
    setAssignModalOpen(true);
  };

  const handleAssignDriver = async () => {
    if (!selectedOrderId || !selectedDriverId) {
      toast.error('Seleccione un repartidor');
      return;
    }

    try {
      await assignDriver.mutateAsync({
        orderId: selectedOrderId,
        driverUserId: selectedDriverId,
      });
      toast.success('Repartidor asignado correctamente');
      setAssignModalOpen(false);
    } catch (error: any) {
      toast.error('Error al asignar repartidor', { description: error.message });
    }
  };

  const handleStartPreparing = async (orderId: string) => {
    try {
      await updateStatus.mutateAsync({ orderId, status: 'preparing' });
      toast.success('Pedido en preparación');
    } catch (error: any) {
      toast.error('Error al actualizar estado', { description: error.message });
    }
  };

  const handleSendDelivery = async (orderId: string) => {
    try {
      await markPickedUp.mutateAsync(orderId);
      toast.success('Pedido enviado');
    } catch (error: any) {
      toast.error('Error al enviar pedido', { description: error.message });
    }
  };

  const handleMarkDelivered = async (orderId: string) => {
    try {
      await markDelivered.mutateAsync(orderId);
      toast.success('Pedido entregado');
    } catch (error: any) {
      toast.error('Error al marcar como entregado', { description: error.message });
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
            <p className="text-muted-foreground">Gestiona los pedidos de entrega</p>
          </div>
          <div className="flex gap-4">
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
        <div className="flex gap-3">
          {(['all', 'open', 'preparing', 'ready', 'paid'] as const).map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              className="btn-pos"
              onClick={() => setSelectedStatus(status)}
            >
              {status === 'all' ? 'Todos' : getStatusLabel(status as DeliveryStatus)}
            </Button>
          ))}
        </div>

        {/* Orders Grid */}
        {isLoading ? (
          <div className="grid grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-6">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-pos-lg">
                      Ticket #{order.order_number}
                    </CardTitle>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.status)}`}>
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
                        <span>{order.customer.phone}</span>
                      </div>
                    )}
                    {order.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                        <div>
                          <span className="text-sm">{order.address.address}</span>
                          {order.address.reference && (
                            <p className="text-xs text-muted-foreground">{order.address.reference}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time info */}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-5 w-5" />
                    <span className="text-sm">
                      Pedido: {format(new Date(order.created_at), 'HH:mm', { locale: es })}
                    </span>
                  </div>

                  {/* Assigned driver */}
                  {order.delivery_assignment?.driver && (
                    <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      <Truck className="h-5 w-5 text-primary" />
                      <span className="font-medium">
                        {order.delivery_assignment.driver.first_name} {order.delivery_assignment.driver.last_name}
                      </span>
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
                    {order.status === 'open' && (
                      <Button 
                        className="btn-pos col-span-2 bg-primary"
                        onClick={() => handleStartPreparing(order.id)}
                        disabled={updateStatus.isPending}
                      >
                        Iniciar Preparación
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <>
                        <Button 
                          variant="outline" 
                          className="btn-pos"
                          onClick={() => handleOpenAssignModal(order.id)}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Asignar
                        </Button>
                        <Button 
                          className="btn-pos bg-secondary"
                          onClick={() => handleSendDelivery(order.id)}
                          disabled={!order.delivery_assignment?.driver_user_id || markPickedUp.isPending}
                        >
                          <Truck className="h-5 w-5 mr-2" />
                          Enviar
                        </Button>
                      </>
                    )}
                    {order.status === 'ready' && (
                      <Button 
                        className="btn-pos col-span-2 bg-success"
                        onClick={() => handleMarkDelivered(order.id)}
                        disabled={markDelivered.isPending}
                      >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Marcar Entregado
                      </Button>
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
            <p className="text-sm mt-2">Los pedidos de delivery aparecerán aquí</p>
          </div>
        )}
      </div>

      {/* Assign Driver Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Asignar Repartidor
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seleccionar Repartidor</label>
              <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleccionar repartidor..." />
                </SelectTrigger>
                <SelectContent>
                  {loadingDrivers ? (
                    <SelectItem value="" disabled>Cargando...</SelectItem>
                  ) : drivers.length === 0 ? (
                    <SelectItem value="" disabled>No hay repartidores disponibles</SelectItem>
                  ) : (
                    drivers.map(driver => (
                      <SelectItem key={driver.user_id} value={driver.user_id}>
                        {driver.first_name} {driver.last_name}
                        {driver.phone && ` - ${driver.phone}`}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setAssignModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button 
                className="flex-1 bg-primary"
                onClick={handleAssignDriver}
                disabled={!selectedDriverId || assignDriver.isPending}
              >
                {assignDriver.isPending ? 'Asignando...' : 'Asignar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
