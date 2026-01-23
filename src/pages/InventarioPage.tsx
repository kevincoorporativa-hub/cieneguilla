import { useState } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  RefreshCw,
  History,
  AlertTriangle,
  Calendar,
  User,
  X,
  Check
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { InventoryItem, InventoryMovement, MovementType } from '@/types/pos';
import { toast } from 'sonner';

const demoInventory: InventoryItem[] = [
  { id: '1', nombre: 'Harina de Trigo', categoria: 'Harinas', unidad: 'kg', stock: 50, stockMinimo: 20, stockMaximo: 100, createdAt: new Date('2024-01-10'), updatedAt: new Date('2026-01-15') },
  { id: '2', nombre: 'Queso Mozzarella', categoria: 'Lácteos', unidad: 'kg', stock: 15, stockMinimo: 10, stockMaximo: 50, createdAt: new Date('2024-01-12'), updatedAt: new Date('2026-01-16') },
  { id: '3', nombre: 'Pepperoni', categoria: 'Carnes', unidad: 'kg', stock: 8, stockMinimo: 5, stockMaximo: 25, createdAt: new Date('2024-01-15'), updatedAt: new Date('2026-01-14') },
  { id: '4', nombre: 'Salsa de Tomate', categoria: 'Salsas', unidad: 'lt', stock: 25, stockMinimo: 15, stockMaximo: 60, createdAt: new Date('2024-01-18'), updatedAt: new Date('2026-01-17') },
  { id: '5', nombre: 'Carbón Vegetal', categoria: 'Combustibles', unidad: 'kg', stock: 30, stockMinimo: 20, stockMaximo: 80, createdAt: new Date('2024-02-01'), updatedAt: new Date('2026-01-10') },
  { id: '6', nombre: 'Aceite de Oliva', categoria: 'Aceites', unidad: 'lt', stock: 5, stockMinimo: 8, stockMaximo: 20, createdAt: new Date('2024-02-05'), updatedAt: new Date('2026-01-12') },
  { id: '7', nombre: 'Champiñones', categoria: 'Vegetales', unidad: 'kg', stock: 3, stockMinimo: 5, stockMaximo: 15, createdAt: new Date('2024-02-08'), updatedAt: new Date('2026-01-13') },
  { id: '8', nombre: 'Jamón', categoria: 'Carnes', unidad: 'kg', stock: 0, stockMinimo: 5, stockMaximo: 20, createdAt: new Date('2024-02-10'), updatedAt: new Date('2026-01-11') },
];

const demoMovements: InventoryMovement[] = [
  { id: '1', insumoId: '1', tipo: 'ingreso', cantidad: 25, stockAnterior: 25, stockFinal: 50, motivo: 'Compra a proveedor ABC - Factura #001234', usuarioId: 'Carlos García', precioUnitario: 3.50, montoTotal: 87.50, fechaMovimiento: new Date('2026-01-17'), createdAt: new Date('2026-01-17T09:30:00') },
  { id: '2', insumoId: '2', tipo: 'salida', cantidad: 5, stockAnterior: 20, stockFinal: 15, motivo: 'Consumo producción diaria', usuarioId: 'Carlos García', fechaMovimiento: new Date('2026-01-17'), createdAt: new Date('2026-01-17T10:15:00') },
  { id: '3', insumoId: '4', tipo: 'ingreso', cantidad: 15, stockAnterior: 10, stockFinal: 25, motivo: 'Compra urgente - Proveedor XYZ', usuarioId: 'Ana Torres', precioUnitario: 8.00, montoTotal: 120.00, fechaMovimiento: new Date('2026-01-16'), createdAt: new Date('2026-01-16T14:00:00') },
  { id: '4', insumoId: '6', tipo: 'ajuste', cantidad: -3, stockAnterior: 8, stockFinal: 5, motivo: 'Ajuste por inventario físico - faltante detectado', usuarioId: 'Admin', fechaMovimiento: new Date('2026-01-15'), createdAt: new Date('2026-01-15T18:00:00') },
  { id: '5', insumoId: '3', tipo: 'salida', cantidad: 2, stockAnterior: 10, stockFinal: 8, motivo: 'Preparación de pizzas especiales', usuarioId: 'Carlos García', fechaMovimiento: new Date('2026-01-14'), createdAt: new Date('2026-01-14T16:30:00') },
  { id: '6', insumoId: '5', tipo: 'ingreso', cantidad: 20, stockAnterior: 10, stockFinal: 30, motivo: 'Reposición semanal - Factura #005678', usuarioId: 'Ana Torres', precioUnitario: 5.00, montoTotal: 100.00, fechaMovimiento: new Date('2026-01-13'), createdAt: new Date('2026-01-13T08:00:00') },
  { id: '7', insumoId: '7', tipo: 'salida', cantidad: 2, stockAnterior: 5, stockFinal: 3, motivo: 'Merma por deterioro', usuarioId: 'Carlos García', fechaMovimiento: new Date('2026-01-12'), createdAt: new Date('2026-01-12T11:45:00') },
  { id: '8', insumoId: '8', tipo: 'salida', cantidad: 5, stockAnterior: 5, stockFinal: 0, motivo: 'Consumo total en evento especial', usuarioId: 'Ana Torres', fechaMovimiento: new Date('2026-01-11'), createdAt: new Date('2026-01-11T20:00:00') },
];

function getStockBadge(stock: number, minimo: number, maximo: number) {
  const percentage = (stock / maximo) * 100;
  if (stock === 0) return <span className="px-3 py-1 rounded-full text-sm font-bold stock-empty">Sin stock</span>;
  if (stock <= minimo) return <span className="px-3 py-1 rounded-full text-sm font-bold stock-low">{stock}</span>;
  if (percentage < 50) return <span className="px-3 py-1 rounded-full text-sm font-bold stock-medium">{stock}</span>;
  return <span className="px-3 py-1 rounded-full text-sm font-bold stock-high">{stock}</span>;
}

function getMovementIcon(tipo: MovementType) {
  switch (tipo) {
    case 'ingreso': return <ArrowDownCircle className="h-5 w-5 text-success" />;
    case 'salida': return <ArrowUpCircle className="h-5 w-5 text-destructive" />;
    case 'ajuste': return <RefreshCw className="h-5 w-5 text-warning" />;
  }
}

function getMovementBadge(tipo: MovementType) {
  switch (tipo) {
    case 'ingreso': return <span className="px-3 py-1 rounded-full text-sm font-bold bg-success/10 text-success">Ingreso</span>;
    case 'salida': return <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive/10 text-destructive">Salida</span>;
    case 'ajuste': return <span className="px-3 py-1 rounded-full text-sm font-bold bg-warning/10 text-warning">Ajuste</span>;
  }
}

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [inventory, setInventory] = useState<InventoryItem[]>(demoInventory);
  const [movements, setMovements] = useState<InventoryMovement[]>(demoMovements);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('ingreso');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [movementDate, setMovementDate] = useState(new Date().toISOString().split('T')[0]);
  const [movementPrice, setMovementPrice] = useState('');

  // New item form
  const [newItemForm, setNewItemForm] = useState({
    nombre: '',
    categoria: '',
    unidad: 'kg',
    stockMinimo: '',
    stockMaximo: '',
  });

  const filteredInventory = inventory.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = inventory.filter((item) => item.stock <= item.stockMinimo && item.stock > 0);
  const outOfStockItems = inventory.filter((item) => item.stock === 0);

  const handleOpenMovement = (item: InventoryItem, type: MovementType) => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementQuantity('');
    setMovementReason('');
    setMovementDate(new Date().toISOString().split('T')[0]);
    setMovementPrice('');
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = () => {
    if (!selectedItem || !movementQuantity || !movementReason) {
      toast.error('Complete todos los campos');
      return;
    }

    const cantidad = parseInt(movementQuantity);
    const stockAnterior = selectedItem.stock;
    let stockFinal = stockAnterior;

    if (movementType === 'ingreso') {
      stockFinal = stockAnterior + cantidad;
    } else if (movementType === 'salida') {
      stockFinal = Math.max(0, stockAnterior - cantidad);
    } else {
      stockFinal = Math.max(0, stockAnterior + cantidad);
    }

    const precioUnitario = movementPrice ? parseFloat(movementPrice) : undefined;
    const montoTotal = precioUnitario ? precioUnitario * cantidad : undefined;

    const newMovement: InventoryMovement = {
      id: crypto.randomUUID(),
      insumoId: selectedItem.id,
      tipo: movementType,
      cantidad: movementType === 'salida' ? -cantidad : cantidad,
      stockAnterior,
      stockFinal,
      motivo: movementReason,
      usuarioId: 'Carlos García',
      precioUnitario,
      montoTotal,
      fechaMovimiento: new Date(movementDate),
      createdAt: new Date(),
    };

    setMovements([newMovement, ...movements]);
    setInventory(inventory.map(i => 
      i.id === selectedItem.id 
        ? { ...i, stock: stockFinal, updatedAt: new Date() }
        : i
    ));

    toast.success('Movimiento registrado correctamente');
    setIsMovementModalOpen(false);
  };

  const handleSaveNewItem = () => {
    if (!newItemForm.nombre || !newItemForm.categoria) {
      toast.error('Complete los campos requeridos');
      return;
    }

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      nombre: newItemForm.nombre,
      categoria: newItemForm.categoria,
      unidad: newItemForm.unidad,
      stock: 0,
      stockMinimo: parseInt(newItemForm.stockMinimo) || 10,
      stockMaximo: parseInt(newItemForm.stockMaximo) || 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setInventory([...inventory, newItem]);
    toast.success('Insumo creado correctamente');
    setIsNewItemModalOpen(false);
    setNewItemForm({ nombre: '', categoria: '', unidad: 'kg', stockMinimo: '', stockMaximo: '' });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Inventario</h1>
            <p className="text-muted-foreground">Control de insumos y materiales</p>
          </div>
          <div className="flex gap-3">
            {lowStockItems.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-warning/10 text-warning rounded-xl">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">{lowStockItems.length} con stock bajo</span>
              </div>
            )}
            {outOfStockItems.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive rounded-xl">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold">{outOfStockItems.length} sin stock</span>
              </div>
            )}
            <Button className="btn-pos" onClick={() => setIsNewItemModalOpen(true)}>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Insumo
            </Button>
          </div>
        </div>

        <Tabs defaultValue="inventario" className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted rounded-xl">
            <TabsTrigger value="inventario" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-5 w-5 mr-2" />
              Inventario
            </TabsTrigger>
            <TabsTrigger value="kardex" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-5 w-5 mr-2" />
              Kardex / Movimientos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventario" className="space-y-6">
            {/* Search */}
            <Card className="border-2">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Buscar insumos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 text-pos-base rounded-xl"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">{inventory.length}</p>
                  <p className="text-sm text-muted-foreground">Total insumos</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{inventory.filter(i => i.stock > i.stockMinimo).length}</p>
                  <p className="text-sm text-muted-foreground">Stock normal</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{lowStockItems.length}</p>
                  <p className="text-sm text-muted-foreground">Stock bajo</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">{outOfStockItems.length}</p>
                  <p className="text-sm text-muted-foreground">Sin stock</p>
                </div>
              </Card>
            </div>

            {/* Inventory Table */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Lista de Insumos ({filteredInventory.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-pos-base font-bold">Insumo</TableHead>
                      <TableHead className="text-pos-base font-bold">Categoría</TableHead>
                      <TableHead className="text-pos-base font-bold">Stock</TableHead>
                      <TableHead className="text-pos-base font-bold">Unidad</TableHead>
                      <TableHead className="text-pos-base font-bold">Mín / Máx</TableHead>
                      <TableHead className="text-pos-base font-bold">Fecha Ingreso</TableHead>
                      <TableHead className="text-pos-base font-bold">Últ. Movimiento</TableHead>
                      <TableHead className="text-pos-base font-bold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id} className="hover:bg-muted/50">
                        <TableCell className="font-semibold text-pos-base">{item.nombre}</TableCell>
                        <TableCell>{item.categoria}</TableCell>
                        <TableCell>{getStockBadge(item.stock, item.stockMinimo, item.stockMaximo)}</TableCell>
                        <TableCell>{item.unidad}</TableCell>
                        <TableCell className="text-muted-foreground">{item.stockMinimo} / {item.stockMaximo}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {item.createdAt.toLocaleDateString('es-PE')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {item.updatedAt.toLocaleDateString('es-PE')}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-10 px-3 text-success border-success hover:bg-success/10"
                              onClick={() => handleOpenMovement(item, 'ingreso')}
                            >
                              <ArrowDownCircle className="h-4 w-4 mr-1" />
                              Ingreso
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-10 px-3 text-destructive border-destructive hover:bg-destructive/10"
                              onClick={() => handleOpenMovement(item, 'salida')}
                            >
                              <ArrowUpCircle className="h-4 w-4 mr-1" />
                              Salida
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-10 px-3 text-warning border-warning hover:bg-warning/10"
                              onClick={() => handleOpenMovement(item, 'ajuste')}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Ajuste
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kardex" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Movimientos ({movements.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-pos-base font-bold">Fecha Mov.</TableHead>
                      <TableHead className="text-pos-base font-bold">Tipo</TableHead>
                      <TableHead className="text-pos-base font-bold">Insumo</TableHead>
                      <TableHead className="text-pos-base font-bold">Cantidad</TableHead>
                      <TableHead className="text-pos-base font-bold">P. Unit.</TableHead>
                      <TableHead className="text-pos-base font-bold">Monto Total</TableHead>
                      <TableHead className="text-pos-base font-bold">Stock</TableHead>
                      <TableHead className="text-pos-base font-bold">Motivo</TableHead>
                      <TableHead className="text-pos-base font-bold">Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mov) => {
                      const item = inventory.find((i) => i.id === mov.insumoId);
                      return (
                        <TableRow key={mov.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{mov.fechaMovimiento.toLocaleDateString('es-PE')}</p>
                                <p className="text-xs text-muted-foreground">
                                  Reg: {mov.createdAt.toLocaleDateString('es-PE')}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMovementIcon(mov.tipo)}
                              {getMovementBadge(mov.tipo)}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{item?.nombre}</TableCell>
                          <TableCell className={`font-bold ${mov.tipo === 'ingreso' ? 'text-success' : mov.tipo === 'salida' ? 'text-destructive' : 'text-warning'}`}>
                            {mov.tipo === 'ingreso' ? '+' : mov.tipo === 'salida' ? '-' : ''}{Math.abs(mov.cantidad)} {item?.unidad}
                          </TableCell>
                          <TableCell>
                            {mov.precioUnitario ? (
                              <span className="font-medium">S/ {mov.precioUnitario.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {mov.montoTotal ? (
                              <span className="font-bold text-primary">S/ {mov.montoTotal.toFixed(2)}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            {mov.stockAnterior} → <span className="font-bold">{mov.stockFinal}</span>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate text-muted-foreground text-sm" title={mov.motivo}>
                            {mov.motivo}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{mov.usuarioId}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Movement Modal */}
        <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                {movementType === 'ingreso' && <ArrowDownCircle className="h-6 w-6 text-success" />}
                {movementType === 'salida' && <ArrowUpCircle className="h-6 w-6 text-destructive" />}
                {movementType === 'ajuste' && <RefreshCw className="h-6 w-6 text-warning" />}
                Registrar {movementType.charAt(0).toUpperCase() + movementType.slice(1)}
              </DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-xl">
                  <p className="font-bold text-pos-lg">{selectedItem.nombre}</p>
                  <p className="text-muted-foreground">Stock actual: {selectedItem.stock} {selectedItem.unidad}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-pos-base font-semibold flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fecha del movimiento
                  </label>
                  <Input
                    type="date"
                    value={movementDate}
                    onChange={(e) => setMovementDate(e.target.value)}
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Cantidad</label>
                    <Input
                      type="number"
                      value={movementQuantity}
                      onChange={(e) => setMovementQuantity(e.target.value)}
                      placeholder="0"
                      className="h-14 text-pos-lg rounded-xl"
                    />
                  </div>
                  {movementType === 'ingreso' && (
                    <div className="space-y-2">
                      <label className="text-pos-base font-semibold">Precio Unitario (S/)</label>
                      <Input
                        type="number"
                        step="0.01"
                        value={movementPrice}
                        onChange={(e) => setMovementPrice(e.target.value)}
                        placeholder="0.00"
                        className="h-14 text-pos-lg rounded-xl"
                      />
                    </div>
                  )}
                </div>

                {movementType === 'ingreso' && movementQuantity && movementPrice && (
                  <div className="p-3 bg-success/10 rounded-xl text-success font-semibold text-center">
                    Monto Total: S/ {(parseFloat(movementQuantity) * parseFloat(movementPrice)).toFixed(2)}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Motivo / Descripción</label>
                  <Textarea
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    placeholder="Ej: Compra a proveedor, consumo producción, ajuste por inventario..."
                    className="min-h-[80px] rounded-xl"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsMovementModalOpen(false)}>
                    <X className="h-5 w-5 mr-2" />
                    Cancelar
                  </Button>
                  <Button 
                    className={`flex-1 btn-pos ${
                      movementType === 'ingreso' ? 'bg-success hover:bg-success/90' : 
                      movementType === 'salida' ? 'bg-destructive hover:bg-destructive/90' : 
                      'bg-warning hover:bg-warning/90'
                    }`}
                    disabled={!movementQuantity || !movementReason}
                    onClick={handleSaveMovement}
                  >
                    <Check className="h-5 w-5 mr-2" />
                    Confirmar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* New Item Modal */}
        <Dialog open={isNewItemModalOpen} onOpenChange={setIsNewItemModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <Plus className="h-6 w-6" />
                Nuevo Insumo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Nombre</label>
                <Input
                  value={newItemForm.nombre}
                  onChange={(e) => setNewItemForm({ ...newItemForm, nombre: e.target.value })}
                  placeholder="Nombre del insumo"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Categoría</label>
                  <Input
                    value={newItemForm.categoria}
                    onChange={(e) => setNewItemForm({ ...newItemForm, categoria: e.target.value })}
                    placeholder="Ej: Harinas, Carnes..."
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Unidad</label>
                  <Select value={newItemForm.unidad} onValueChange={(v) => setNewItemForm({ ...newItemForm, unidad: v })}>
                    <SelectTrigger className="h-12 text-pos-base rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                      <SelectItem value="lt">Litros (lt)</SelectItem>
                      <SelectItem value="und">Unidades (und)</SelectItem>
                      <SelectItem value="gr">Gramos (gr)</SelectItem>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Stock Mínimo</label>
                  <Input
                    type="number"
                    value={newItemForm.stockMinimo}
                    onChange={(e) => setNewItemForm({ ...newItemForm, stockMinimo: e.target.value })}
                    placeholder="10"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Stock Máximo</label>
                  <Input
                    type="number"
                    value={newItemForm.stockMaximo}
                    onChange={(e) => setNewItemForm({ ...newItemForm, stockMaximo: e.target.value })}
                    placeholder="100"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1 btn-pos" onClick={() => setIsNewItemModalOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 btn-pos bg-primary"
                  disabled={!newItemForm.nombre || !newItemForm.categoria}
                  onClick={handleSaveNewItem}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Crear Insumo
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
