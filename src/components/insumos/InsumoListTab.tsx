import { useState } from 'react';
import { Search, Package, Plus, Pencil, Trash2 } from 'lucide-react';
import { formatCost, formatQuantity } from '@/utils/formatDecimals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { Ingredient, useUpdateIngredient } from '@/hooks/useIngredients';
import { getStockBadge } from './InsumoHelpers';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface Props {
  ingredients: Ingredient[];
  isLoading: boolean;
  onNewItem: () => void;
}

export function InsumoListTab({ ingredients, isLoading, onNewItem }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editItem, setEditItem] = useState<Ingredient | null>(null);
  const [deleteItem, setDeleteItem] = useState<Ingredient | null>(null);
  const [editForm, setEditForm] = useState({ name: '', unit: '', min_stock: '', cost_per_unit: '', category: '', supplier: '' });
  const updateIngredient = useUpdateIngredient();
  const queryClient = useQueryClient();

  const filtered = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = ingredients.filter((i) => i.current_stock <= i.min_stock && i.current_stock > 0);
  const outOfStockItems = ingredients.filter((i) => i.current_stock === 0);
  const normalStock = ingredients.filter((i) => i.current_stock > i.min_stock);

  const handleEdit = (item: Ingredient) => {
    setEditForm({
      name: item.name,
      unit: item.unit,
      min_stock: String(item.min_stock),
      cost_per_unit: String(item.cost_per_unit),
      category: item.category,
      supplier: item.supplier || '',
    });
    setEditItem(item);
  };

  const handleSaveEdit = async () => {
    if (!editItem || !editForm.name) return;
    try {
      await updateIngredient.mutateAsync({
        id: editItem.id,
        name: editForm.name,
        unit: editForm.unit,
        min_stock: parseFloat(editForm.min_stock) || 0,
        cost_per_unit: parseFloat(editForm.cost_per_unit) || 0,
        category: editForm.category,
        supplier: editForm.supplier || undefined,
      });
      toast.success('Insumo actualizado');
      setEditItem(null);
    } catch (error: any) {
      toast.error('Error al actualizar', { description: error.message });
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    try {
      await updateIngredient.mutateAsync({ id: deleteItem.id, active: false });
      toast.success('Insumo eliminado');
      setDeleteItem(null);
    } catch (error: any) {
      toast.error('Error al eliminar', { description: error.message });
    }
  };

  const formatPrecioTotal = (stock: number, costPerUnit: number) => {
    const total = stock * costPerUnit;
    return total.toFixed(2);
  };

  const getExportData = () => ({
    headers: ['Insumo', 'Categoría', 'Stock', 'Unidad', 'Mínimo', 'Costo Unit.', 'Precio Total', 'Proveedor'],
    rows: filtered.map((i) => [
      i.name,
      i.category,
      i.current_stock,
      i.unit,
      i.min_stock,
      `S/ ${formatCost(i.cost_per_unit)}`,
      `S/ ${formatPrecioTotal(i.current_stock, i.cost_per_unit)}`,
      i.supplier || '—',
    ]),
    title: 'Lista de Insumos',
    subtitle: `Total: ${filtered.length} insumos | Generado: ${new Date().toLocaleDateString('es-PE')}`,
  });

  return (
    <div className="space-y-6">
      {/* Search + Export */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar insumos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-pos-base rounded-xl"
              />
            </div>
            <ExportDropdown
              onExportExcel={() => exportToExcel(getExportData(), 'insumos')}
              onExportPDF={() => exportToPDF(getExportData(), 'insumos')}
            />
            <Button className="btn-pos h-12" onClick={onNewItem}>
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Insumo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{ingredients.length}</p>
            <p className="text-sm text-muted-foreground">Total insumos</p>
          </div>
        </Card>
        <Card className="border-2 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{normalStock.length}</p>
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

      {/* Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Insumos ({filtered.length})
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
                  <TableHead className="text-pos-base font-bold">Categoría</TableHead>
                  <TableHead className="text-pos-base font-bold">Stock</TableHead>
                  <TableHead className="text-pos-base font-bold">Unidad</TableHead>
                  <TableHead className="text-pos-base font-bold">Mínimo</TableHead>
                  <TableHead className="text-pos-base font-bold">Costo Unit.</TableHead>
                  <TableHead className="text-pos-base font-bold">Precio Total</TableHead>
                  <TableHead className="text-pos-base font-bold">Proveedor</TableHead>
                  <TableHead className="text-pos-base font-bold text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/50">
                    <TableCell className="font-semibold text-pos-base">{item.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-bold bg-muted">{item.category}</span>
                    </TableCell>
                    <TableCell>{getStockBadge(item.current_stock, item.min_stock)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell className="text-muted-foreground">{item.min_stock}</TableCell>
                    <TableCell className="text-muted-foreground">S/ {formatCost(item.cost_per_unit)}</TableCell>
                    <TableCell className="font-semibold">S/ {formatPrecioTotal(item.current_stock, item.cost_per_unit)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.supplier || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="icon" className="text-primary hover:text-primary/80" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive/80" onClick={() => setDeleteItem(item)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No se encontraron insumos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pos-xl flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Editar Insumo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-pos-base font-semibold">Nombre</label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-12 text-pos-base rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Categoría</label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                  <SelectTrigger className="h-12 text-pos-base rounded-xl"><SelectValue /></SelectTrigger>
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
                <Select value={editForm.unit} onValueChange={(v) => setEditForm({ ...editForm, unit: v })}>
                  <SelectTrigger className="h-12 text-pos-base rounded-xl"><SelectValue /></SelectTrigger>
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
                <Input type="number" value={editForm.min_stock} onChange={(e) => setEditForm({ ...editForm, min_stock: e.target.value })} className="h-12 text-pos-base rounded-xl" />
              </div>
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Costo Unitario (S/)</label>
                <Input type="number" step="any" value={editForm.cost_per_unit} onChange={(e) => setEditForm({ ...editForm, cost_per_unit: e.target.value })} className="h-12 text-pos-base rounded-xl" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-pos-base font-semibold">Proveedor (opcional)</label>
              <Input value={editForm.supplier} onChange={(e) => setEditForm({ ...editForm, supplier: e.target.value })} className="h-12 text-pos-base rounded-xl" />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setEditItem(null)}>Cancelar</Button>
              <Button className="flex-1 h-12 rounded-xl bg-primary" onClick={handleSaveEdit} disabled={updateIngredient.isPending}>
                {updateIngredient.isPending ? 'Guardando...' : 'Guardar Cambios'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar insumo?</AlertDialogTitle>
            <AlertDialogDescription>
              Se desactivará "{deleteItem?.name}". Esta acción se puede revertir desde la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
