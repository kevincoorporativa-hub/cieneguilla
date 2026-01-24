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
  User
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
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import {
  useIngredients,
  useStockMoves,
  useCreateIngredient,
  useCreateStockMove,
  Ingredient,
  StockMove,
} from '@/hooks/useIngredients';
import { useStores } from '@/hooks/useStores';

type MovementType = 'purchase' | 'adjustment' | 'waste';

function getStockBadge(stock: number, minStock: number) {
  if (stock === 0) return <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive text-destructive-foreground">Sin stock</span>;
  if (stock <= minStock) return <span className="px-3 py-1 rounded-full text-sm font-bold bg-warning text-warning-foreground">{stock}</span>;
  return <span className="px-3 py-1 rounded-full text-sm font-bold bg-success text-success-foreground">{stock}</span>;
}

function getMovementIcon(tipo: StockMove['move_type']) {
  switch (tipo) {
    case 'purchase': return <ArrowDownCircle className="h-5 w-5 text-success" />;
    case 'sale': return <ArrowUpCircle className="h-5 w-5 text-destructive" />;
    case 'adjustment': return <RefreshCw className="h-5 w-5 text-warning" />;
    case 'waste': return <AlertTriangle className="h-5 w-5 text-destructive" />;
  }
}

function getMovementBadge(tipo: StockMove['move_type']) {
  switch (tipo) {
    case 'purchase': return <span className="px-3 py-1 rounded-full text-sm font-bold bg-success/10 text-success">Ingreso</span>;
    case 'sale': return <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive/10 text-destructive">Salida</span>;
    case 'adjustment': return <span className="px-3 py-1 rounded-full text-sm font-bold bg-warning/10 text-warning">Ajuste</span>;
    case 'waste': return <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive/10 text-destructive">Merma</span>;
  }
}

export default function InventarioPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('purchase');
  const [movementQuantity, setMovementQuantity] = useState('');
  const [movementReason, setMovementReason] = useState('');

  // New item form
  const [newItemForm, setNewItemForm] = useState({
    nombre: '',
    unidad: 'kg',
    stockMinimo: '',
    costoUnitario: '',
  });

  // Hooks
  const { data: ingredients = [], isLoading: loadingIngredients } = useIngredients();
  const { data: movements = [], isLoading: loadingMoves } = useStockMoves();
  const { data: stores = [] } = useStores();
  const createIngredient = useCreateIngredient();
  const createStockMove = useCreateStockMove();

  const filteredInventory = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = ingredients.filter((item) => item.current_stock <= item.min_stock && item.current_stock > 0);
  const outOfStockItems = ingredients.filter((item) => item.current_stock === 0);

  const handleOpenMovement = (item: Ingredient, type: MovementType) => {
    setSelectedItem(item);
    setMovementType(type);
    setMovementQuantity('');
    setMovementReason('');
    setIsMovementModalOpen(true);
  };

  const handleSaveMovement = async () => {
    if (!selectedItem || !movementQuantity || !movementReason) {
      toast.error('Complete todos los campos');
      return;
    }

    const cantidad = parseFloat(movementQuantity);
    const storeId = selectedItem.store_id || stores[0]?.id;

    if (!storeId) {
      toast.error('No hay tienda configurada');
      return;
    }

    try {
      let quantity = cantidad;
      if (movementType === 'waste') {
        quantity = -cantidad;
      } else if (movementType === 'adjustment') {
        // For adjustment, the quantity can be positive or negative
        quantity = cantidad;
      }

      await createStockMove.mutateAsync({
        ingredient_id: selectedItem.id,
        store_id: storeId,
        move_type: movementType,
        quantity: quantity,
        notes: movementReason,
      });

      toast.success('Movimiento registrado correctamente');
      setIsMovementModalOpen(false);
    } catch (error: any) {
      toast.error('Error al registrar movimiento', { description: error.message });
    }
  };

  const handleSaveNewItem = async () => {
    if (!newItemForm.nombre || !newItemForm.unidad) {
      toast.error('Complete los campos requeridos');
      return;
    }

    try {
      await createIngredient.mutateAsync({
        name: newItemForm.nombre,
        unit: newItemForm.unidad,
        min_stock: parseFloat(newItemForm.stockMinimo) || 0,
        cost_per_unit: parseFloat(newItemForm.costoUnitario) || 0,
      });

      toast.success('Insumo creado correctamente');
      setIsNewItemModalOpen(false);
      setNewItemForm({ nombre: '', unidad: 'kg', stockMinimo: '', costoUnitario: '' });
    } catch (error: any) {
      toast.error('Error al crear insumo', { description: error.message });
    }
  };

  const isLoading = loadingIngredients;

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
                  <p className="text-2xl font-bold text-primary">{ingredients.length}</p>
                  <p className="text-sm text-muted-foreground">Total insumos</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">{ingredients.filter(i => i.current_stock > i.min_stock).length}</p>
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
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-pos-base font-bold">Insumo</TableHead>
                        <TableHead className="text-pos-base font-bold">Stock</TableHead>
                        <TableHead className="text-pos-base font-bold">Unidad</TableHead>
                        <TableHead className="text-pos-base font-bold">Mínimo</TableHead>
                        <TableHead className="text-pos-base font-bold">Costo Unit.</TableHead>
                        <TableHead className="text-pos-base font-bold text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInventory.map((item) => (
                        <TableRow key={item.id} className="hover:bg-muted/50">
                          <TableCell className="font-semibold text-pos-base">{item.name}</TableCell>
                          <TableCell>{getStockBadge(item.current_stock, item.min_stock)}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                          <TableCell className="text-muted-foreground">{item.min_stock}</TableCell>
                          <TableCell className="text-muted-foreground">S/ {item.cost_per_unit.toFixed(2)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-10 px-3 text-success border-success hover:bg-success/10"
                                onClick={() => handleOpenMovement(item, 'purchase')}
                              >
                                <ArrowDownCircle className="h-4 w-4 mr-1" />
                                Ingreso
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-10 px-3 text-destructive border-destructive hover:bg-destructive/10"
                                onClick={() => handleOpenMovement(item, 'waste')}
                              >
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                                Salida
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-10 px-3 text-warning border-warning hover:bg-warning/10"
                                onClick={() => handleOpenMovement(item, 'adjustment')}
                              >
                                <RefreshCw className="h-4 w-4 mr-1" />
                                Ajuste
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredInventory.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No se encontraron insumos
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kardex" className="space-y-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Movimientos
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingMoves ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-pos-base font-bold">Fecha</TableHead>
                        <TableHead className="text-pos-base font-bold">Insumo</TableHead>
                        <TableHead className="text-pos-base font-bold">Tipo</TableHead>
                        <TableHead className="text-pos-base font-bold">Cantidad</TableHead>
                        <TableHead className="text-pos-base font-bold">Motivo</TableHead>
                        <TableHead className="text-pos-base font-bold">Usuario</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {movements.map((move) => (
                        <TableRow key={move.id} className="hover:bg-muted/50">
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              {new Date(move.created_at).toLocaleDateString('es-PE')}
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold">{move.ingredient_name || '—'}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMovementIcon(move.move_type)}
                              {getMovementBadge(move.move_type)}
                            </div>
                          </TableCell>
                          <TableCell className={`font-bold ${move.quantity >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {move.quantity >= 0 ? '+' : ''}{move.quantity}
                          </TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">
                            {move.notes || '—'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <User className="h-4 w-4" />
                              {move.user_name || '—'}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {movements.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No hay movimientos registrados
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Movement Modal */}
        <Dialog open={isMovementModalOpen} onOpenChange={setIsMovementModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                {movementType === 'purchase' && <ArrowDownCircle className="h-6 w-6 text-success" />}
                {movementType === 'waste' && <ArrowUpCircle className="h-6 w-6 text-destructive" />}
                {movementType === 'adjustment' && <RefreshCw className="h-6 w-6 text-warning" />}
                {movementType === 'purchase' ? 'Ingreso de Stock' : movementType === 'waste' ? 'Salida de Stock' : 'Ajuste de Stock'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-xl">
                <p className="font-semibold text-pos-lg">{selectedItem?.name}</p>
                <p className="text-muted-foreground">Stock actual: {selectedItem?.current_stock} {selectedItem?.unit}</p>
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">
                  {movementType === 'adjustment' ? 'Cantidad (+ agregar, - restar)' : 'Cantidad'}
                </label>
                <Input
                  type="number"
                  value={movementQuantity}
                  onChange={(e) => setMovementQuantity(e.target.value)}
                  placeholder={movementType === 'adjustment' ? 'Ej: 5 o -3' : '0'}
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Motivo / Descripción</label>
                <Textarea
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Describe el motivo del movimiento..."
                  className="min-h-24 text-pos-base rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setIsMovementModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className={`flex-1 h-12 rounded-xl ${
                    movementType === 'purchase' ? 'bg-success hover:bg-success/90' :
                    movementType === 'waste' ? 'bg-destructive hover:bg-destructive/90' :
                    'bg-warning hover:bg-warning/90'
                  }`}
                  onClick={handleSaveMovement}
                  disabled={createStockMove.isPending}
                >
                  {createStockMove.isPending ? 'Guardando...' : 'Confirmar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* New Item Modal */}
        <Dialog open={isNewItemModalOpen} onOpenChange={setIsNewItemModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-pos-xl flex items-center gap-2">
                <Package className="h-6 w-6" />
                Nuevo Insumo
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Nombre del insumo</label>
                <Input
                  value={newItemForm.nombre}
                  onChange={(e) => setNewItemForm({ ...newItemForm, nombre: e.target.value })}
                  placeholder="Ej: Harina de Trigo"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Unidad</label>
                  <Select value={newItemForm.unidad} onValueChange={(v) => setNewItemForm({ ...newItemForm, unidad: v })}>
                    <SelectTrigger className="h-12 text-pos-base rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">Kilogramos (kg)</SelectItem>
                      <SelectItem value="g">Gramos (g)</SelectItem>
                      <SelectItem value="lt">Litros (lt)</SelectItem>
                      <SelectItem value="ml">Mililitros (ml)</SelectItem>
                      <SelectItem value="unidad">Unidades</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Costo Unitario (S/)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newItemForm.costoUnitario}
                  onChange={(e) => setNewItemForm({ ...newItemForm, costoUnitario: e.target.value })}
                  placeholder="0.00"
                  className="h-12 text-pos-base rounded-xl"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 rounded-xl"
                  onClick={() => setIsNewItemModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 h-12 rounded-xl bg-primary"
                  onClick={handleSaveNewItem}
                  disabled={createIngredient.isPending}
                >
                  {createIngredient.isPending ? 'Creando...' : 'Crear Insumo'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
