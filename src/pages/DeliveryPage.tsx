import { useState } from 'react';
import { Truck, MapPin, Phone, Clock, CheckCircle, User } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OrderStatus } from '@/types/pos';

interface DeliveryOrder {
  id: string;
  ticketNumber: string;
  cliente: string;
  telefono: string;
  direccion: string;
  total: number;
  estado: OrderStatus;
  repartidor?: string;
  horaPedido: Date;
  horaSalida?: Date;
}

const demoOrders: DeliveryOrder[] = [
  {
    id: '1',
    ticketNumber: 'T-001',
    cliente: 'Juan Pérez',
    telefono: '987654321',
    direccion: 'Av. Los Pinos 123, San Isidro',
    total: 75.00,
    estado: 'pendiente',
    horaPedido: new Date(),
  },
  {
    id: '2',
    ticketNumber: 'T-002',
    cliente: 'María García',
    telefono: '912345678',
    direccion: 'Jr. Las Flores 456, Miraflores',
    total: 120.00,
    estado: 'preparacion',
    horaPedido: new Date(Date.now() - 15 * 60000),
  },
  {
    id: '3',
    ticketNumber: 'T-003',
    cliente: 'Carlos López',
    telefono: '965432187',
    direccion: 'Calle Los Olivos 789, La Molina',
    total: 95.00,
    estado: 'en_camino',
    repartidor: 'Pedro Ruiz',
    horaPedido: new Date(Date.now() - 30 * 60000),
    horaSalida: new Date(Date.now() - 10 * 60000),
  },
];

const repartidores = [
  { id: '1', nombre: 'Pedro Ruiz', activo: true },
  { id: '2', nombre: 'Luis Gómez', activo: true },
  { id: '3', nombre: 'Miguel Torres', activo: false },
];

function getStatusColor(estado: OrderStatus) {
  switch (estado) {
    case 'pendiente': return 'bg-warning text-warning-foreground';
    case 'preparacion': return 'bg-primary text-primary-foreground';
    case 'en_camino': return 'bg-secondary text-secondary-foreground';
    case 'entregado': return 'bg-success text-success-foreground';
    case 'cancelado': return 'bg-destructive text-destructive-foreground';
  }
}

function getStatusLabel(estado: OrderStatus) {
  switch (estado) {
    case 'pendiente': return 'Pendiente';
    case 'preparacion': return 'En preparación';
    case 'en_camino': return 'En camino';
    case 'entregado': return 'Entregado';
    case 'cancelado': return 'Cancelado';
  }
}

export default function DeliveryPage() {
  const [orders] = useState(demoOrders);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  const filteredOrders = selectedStatus === 'all' 
    ? orders 
    : orders.filter((o) => o.estado === selectedStatus);

  const pendingCount = orders.filter((o) => o.estado === 'pendiente').length;
  const inProgressCount = orders.filter((o) => o.estado === 'preparacion' || o.estado === 'en_camino').length;

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
          {['all', 'pendiente', 'preparacion', 'en_camino', 'entregado'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              className="btn-pos"
              onClick={() => setSelectedStatus(status as OrderStatus | 'all')}
            >
              {status === 'all' ? 'Todos' : getStatusLabel(status as OrderStatus)}
            </Button>
          ))}
        </div>

        {/* Orders Grid */}
        <div className="grid grid-cols-3 gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-pos-lg">{order.ticketNumber}</CardTitle>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(order.estado)}`}>
                    {getStatusLabel(order.estado)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Client info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="font-semibold">{order.cliente}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-muted-foreground" />
                    <span>{order.telefono}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    <span className="text-sm">{order.direccion}</span>
                  </div>
                </div>

                {/* Time info */}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">
                    Pedido: {order.horaPedido.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* Repartidor */}
                {order.repartidor && (
                  <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                    <Truck className="h-5 w-5 text-primary" />
                    <span className="font-medium">{order.repartidor}</span>
                  </div>
                )}

                {/* Total */}
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-semibold">Total:</span>
                  <span className="text-pos-xl font-bold text-primary">S/ {order.total.toFixed(2)}</span>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-2">
                  {order.estado === 'pendiente' && (
                    <Button className="btn-pos col-span-2 bg-primary">
                      Iniciar Preparación
                    </Button>
                  )}
                  {order.estado === 'preparacion' && (
                    <>
                      <Button variant="outline" className="btn-pos">
                        Asignar Repartidor
                      </Button>
                      <Button className="btn-pos bg-secondary">
                        <Truck className="h-5 w-5 mr-2" />
                        Enviar
                      </Button>
                    </>
                  )}
                  {order.estado === 'en_camino' && (
                    <Button className="btn-pos col-span-2 bg-success">
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Marcar Entregado
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Truck className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-pos-lg font-medium">No hay pedidos de delivery</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}