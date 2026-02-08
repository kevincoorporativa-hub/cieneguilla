import { useState } from 'react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  RefreshCw,
  Search,
  Package,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
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
import { Ingredient, useCreateStockMove } from '@/hooks/useIngredients';
import { useStores } from '@/hooks/useStores';
import { getStockBadge } from './InsumoHelpers';

type MovementType = 'purchase' | 'adjustment' | 'waste';

interface Props {
  ingredients: Ingredient[];
}

export function MovimientosTab({ ingredients }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Ingredient | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('purchase');
  const [quantity, setQuantity] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('');

  const { data: stores = [] } = useStores();
  const createStockMove = useCreateStockMove();

  const filtered = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenMovement = (item: Ingredient, type: MovementType) => {
    setSelectedItem(item);
    setMovementType(type);
    setQuantity('');
    setUnitCost('');
    setReason('');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedItem || !quantity || !reason) {
      toast.error('Complete todos los campos');
      return;
    }

    const cantidad = parseFloat(quantity);
    const storeId = selectedItem.store_id || stores[0]?.id;

    if (!storeId) {
      toast.error('No hay tienda configurada');
      return;
    }

    try {
      let qty = cantidad;
      if (movementType === 'waste') qty = -cantidad;

      const cost = parseFloat(unitCost) || 0;

      await createStockMove.mutateAsync({
        ingredient_id: selectedItem.id,
        store_id: storeId,
        move_type: movementType,
        quantity: qty,
        notes: reason,
        unit_cost: cost,
      });

      toast.success('Movimiento registrado correctamente');
      setIsModalOpen(false);
    } catch (error: any) {
      toast.error('Error al registrar movimiento', { description: error.message });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Buscar insumo para registrar movimiento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-pos-base rounded-xl"
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-2 border-success/30 bg-success/5 hover:bg-success/10 transition-colors cursor-default">
          <CardContent className="p-5 text-center">
            <ArrowDownCircle className="h-10 w-10 text-success mx-auto mb-2" />
            <h3 className="font-bold text-lg text-success">Ingreso</h3>
            <p className="text-sm text-muted-foreground">Compras y entradas de stock</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-destructive/30 bg-destructive/5 hover:bg-destructive/10 transition-colors cursor-default">
          <CardContent className="p-5 text-center">
            <ArrowUpCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <h3 className="font-bold text-lg text-destructive">Salida</h3>
            <p className="text-sm text-muted-foreground">Merma y pérdidas</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-warning/30 bg-warning/5 hover:bg-warning/10 transition-colors cursor-default">
          <CardContent className="p-5 text-center">
            <RefreshCw className="h-10 w-10 text-warning mx-auto mb-2" />
            <h3 className="font-bold text-lg text-warning">Ajuste</h3>
            <p className="text-sm text-muted-foreground">Correcciones de inventario</p>
          </CardContent>
        </Card>
      </div>

      {/* Ingredient List with Actions */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Seleccione un insumo ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 rounded-xl border-2 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-pos-base truncate">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category} · {item.unit} · Mín: {item.min_stock}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {getStockBadge(item.current_stock, item.min_stock)}
                  </div>
                </div>
                <div className="flex gap-2 ml-4 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 text-success border-success hover:bg-success/10"
                    onClick={() => handleOpenMovement(item, 'purchase')}
                  >
                    <ArrowDownCircle className="h-4 w-4 mr-1" />
                    Ingreso
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 text-destructive border-destructive hover:bg-destructive/10"
                    onClick={() => handleOpenMovement(item, 'waste')}
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-1" />
                    Salida
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 px-4 text-warning border-warning hover:bg-warning/10"
                    onClick={() => handleOpenMovement(item, 'adjustment')}
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Ajuste
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron insumos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Movement Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-pos-xl flex items-center gap-2">
              {movementType === 'purchase' && <ArrowDownCircle className="h-6 w-6 text-success" />}
              {movementType === 'waste' && <ArrowUpCircle className="h-6 w-6 text-destructive" />}
              {movementType === 'adjustment' && <RefreshCw className="h-6 w-6 text-warning" />}
              {movementType === 'purchase'
                ? 'Ingreso de Stock'
                : movementType === 'waste'
                ? 'Salida de Stock'
                : 'Ajuste de Stock'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-xl">
              <p className="font-semibold text-pos-lg">{selectedItem?.name}</p>
              <p className="text-muted-foreground">
                Stock actual: {selectedItem?.current_stock} {selectedItem?.unit}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-pos-base font-semibold">
                {movementType === 'adjustment' ? 'Cantidad (+ agregar, - restar)' : 'Cantidad'}
              </label>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={movementType === 'adjustment' ? 'Ej: 5 o -3' : '0'}
                className="h-12 text-pos-base rounded-xl"
              />
            </div>

            {movementType === 'purchase' && (
              <div className="space-y-2">
                <label className="text-pos-base font-semibold">Costo Unitario (S/)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value)}
                  placeholder="0.00"
                  className="h-12 text-pos-base rounded-xl"
                />
                {quantity && unitCost && (
                  <p className="text-sm text-muted-foreground">
                    Total: S/ {(parseFloat(quantity) * parseFloat(unitCost)).toFixed(2)}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-pos-base font-semibold">Motivo / Descripción</label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe el motivo del movimiento..."
                className="min-h-24 text-pos-base rounded-xl"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className={`flex-1 h-12 rounded-xl ${
                  movementType === 'purchase'
                    ? 'bg-success hover:bg-success/90'
                    : movementType === 'waste'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-warning hover:bg-warning/90'
                }`}
                onClick={handleSave}
                disabled={createStockMove.isPending}
              >
                {createStockMove.isPending ? 'Guardando...' : 'Confirmar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
