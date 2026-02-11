import { useState } from 'react';
import { Package, ArrowDownCircle, History, AlertTriangle, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { toast } from 'sonner';
import {
  useIngredients,
  useStockMoves,
  useCreateIngredient,
} from '@/hooks/useIngredients';
import { InsumoListTab } from '@/components/insumos/InsumoListTab';
import { MovimientosTab } from '@/components/insumos/MovimientosTab';
import { KardexTab } from '@/components/insumos/KardexTab';

export default function InventarioPage() {
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [newItemForm, setNewItemForm] = useState({
    nombre: '',
    unidad: 'kg',
    stockMinimo: '',
    costoUnitario: '',
    categoria: 'general',
    proveedor: '',
    fechaCompra: '',
  });

  const { data: ingredients = [], isLoading: loadingIngredients } = useIngredients();
  const { data: movements = [], isLoading: loadingMoves } = useStockMoves();
  const createIngredient = useCreateIngredient();

  const lowStockItems = ingredients.filter((i) => i.current_stock <= i.min_stock && i.current_stock > 0);
  const outOfStockItems = ingredients.filter((i) => i.current_stock === 0);

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
        category: newItemForm.categoria,
        supplier: newItemForm.proveedor || undefined,
        purchase_date: newItemForm.fechaCompra || undefined,
      });

      toast.success('Insumo creado correctamente');
      setIsNewItemModalOpen(false);
      setNewItemForm({
        nombre: '',
        unidad: 'kg',
        stockMinimo: '',
        costoUnitario: '',
        categoria: 'general',
        proveedor: '',
        fechaCompra: '',
      });
    } catch (error: any) {
      toast.error('Error al crear insumo', { description: error.message });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-pos-2xl font-bold">Insumos</h1>
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
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="insumos" className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted rounded-xl">
            <TabsTrigger
              value="insumos"
              className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Package className="h-5 w-5 mr-2" />
              Insumos
            </TabsTrigger>
            <TabsTrigger
              value="movimientos"
              className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <ArrowDownCircle className="h-5 w-5 mr-2" />
              Ingreso / Salida / Ajuste
            </TabsTrigger>
            <TabsTrigger
              value="kardex"
              className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <History className="h-5 w-5 mr-2" />
              Kardex / Movimientos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insumos">
            <InsumoListTab
              ingredients={ingredients}
              isLoading={loadingIngredients}
              onNewItem={() => setIsNewItemModalOpen(true)}
            />
          </TabsContent>

          <TabsContent value="movimientos">
            <MovimientosTab ingredients={ingredients} />
          </TabsContent>

          <TabsContent value="kardex">
            <KardexTab movements={movements} isLoading={loadingMoves} />
          </TabsContent>
        </Tabs>

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
                  <label className="text-pos-base font-semibold">Categoría</label>
                  <Select
                    value={newItemForm.categoria}
                    onValueChange={(v) => setNewItemForm({ ...newItemForm, categoria: v })}
                  >
                    <SelectTrigger className="h-12 text-pos-base rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="lacteos">Lácteos</SelectItem>
                      <SelectItem value="carnes">Carnes</SelectItem>
                      <SelectItem value="verduras">Verduras</SelectItem>
                      <SelectItem value="frutas">Frutas</SelectItem>
                      <SelectItem value="harinas">Harinas</SelectItem>
                      <SelectItem value="salsas">Salsas</SelectItem>
                      <SelectItem value="bebidas">Bebidas</SelectItem>
                      <SelectItem value="especias">Especias</SelectItem>
                      <SelectItem value="empaques">Empaques</SelectItem>
                      <SelectItem value="limpieza">Limpieza</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Unidad</label>
                  <Select
                    value={newItemForm.unidad}
                    onValueChange={(v) => setNewItemForm({ ...newItemForm, unidad: v })}
                  >
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
                  <label className="text-pos-base font-semibold">Costo Unitario (S/)</label>
                  <Input
                    type="number"
                    step="any"
                    value={newItemForm.costoUnitario}
                    onChange={(e) => setNewItemForm({ ...newItemForm, costoUnitario: e.target.value })}
                    placeholder="0.00"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Proveedor (opcional)</label>
                  <Input
                    value={newItemForm.proveedor}
                    onChange={(e) => setNewItemForm({ ...newItemForm, proveedor: e.target.value })}
                    placeholder="Nombre del proveedor"
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-pos-base font-semibold">Fecha de compra</label>
                  <Input
                    type="date"
                    value={newItemForm.fechaCompra}
                    onChange={(e) => setNewItemForm({ ...newItemForm, fechaCompra: e.target.value })}
                    className="h-12 text-pos-base rounded-xl"
                  />
                </div>
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
