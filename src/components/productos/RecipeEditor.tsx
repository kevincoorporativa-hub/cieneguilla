import { useState, useEffect } from 'react';
import { Plus, Trash2, ChefHat, Save } from 'lucide-react';
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
import { toast } from 'sonner';
import { useIngredients } from '@/hooks/useIngredients';
import { useProductRecipe, useSaveRecipe, RecipeItem } from '@/hooks/useRecipes';

interface RecipeEditorProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productPrice: number;
}

interface RecipeRow {
  ingredient_id: string;
  quantity_needed: string;
}

export function RecipeEditor({ isOpen, onClose, productId, productName, productPrice }: RecipeEditorProps) {
  const { data: ingredients = [] } = useIngredients();
  const { data: existingRecipe = [], isLoading } = useProductRecipe(productId);
  const saveRecipe = useSaveRecipe();

  const [rows, setRows] = useState<RecipeRow[]>([]);

  // Load existing recipe when opened
  useEffect(() => {
    if (isOpen && existingRecipe.length > 0) {
      setRows(
        existingRecipe.map((item) => ({
          ingredient_id: item.ingredient_id,
          quantity_needed: item.quantity_needed.toString(),
        }))
      );
    } else if (isOpen && existingRecipe.length === 0 && !isLoading) {
      setRows([{ ingredient_id: '', quantity_needed: '' }]);
    }
  }, [isOpen, existingRecipe, isLoading]);

  const addRow = () => {
    setRows([...rows, { ingredient_id: '', quantity_needed: '' }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof RecipeRow, value: string) => {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  };

  // Calculate recipe cost
  const recipeCost = rows.reduce((sum, row) => {
    if (!row.ingredient_id || !row.quantity_needed) return sum;
    const ingredient = ingredients.find((i) => i.id === row.ingredient_id);
    if (!ingredient) return sum;
    return sum + ingredient.cost_per_unit * parseFloat(row.quantity_needed || '0');
  }, 0);

  const profit = productPrice - recipeCost;
  const marginPercent = productPrice > 0 ? ((profit / productPrice) * 100).toFixed(1) : '0';

  const handleSave = async () => {
    // Filter valid rows
    const validItems = rows.filter(
      (r) => r.ingredient_id && r.quantity_needed && parseFloat(r.quantity_needed) > 0
    );

    // Check for duplicates
    const ingredientIds = validItems.map((r) => r.ingredient_id);
    const hasDuplicates = ingredientIds.length !== new Set(ingredientIds).size;
    if (hasDuplicates) {
      toast.error('No puede tener el mismo insumo duplicado en la receta');
      return;
    }

    try {
      await saveRecipe.mutateAsync({
        productId,
        items: validItems.map((r) => ({
          ingredient_id: r.ingredient_id,
          quantity_needed: parseFloat(r.quantity_needed),
        })),
      });
      toast.success('Receta guardada correctamente');
      onClose();
    } catch (error: any) {
      toast.error('Error al guardar receta', { description: error.message });
    }
  };

  // Available ingredients (exclude already selected ones)
  const getAvailableIngredients = (currentIndex: number) => {
    const selectedIds = rows
      .filter((_, i) => i !== currentIndex)
      .map((r) => r.ingredient_id)
      .filter(Boolean);
    return ingredients.filter((i) => !selectedIds.includes(i.id));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-pos-xl">
            <ChefHat className="h-6 w-6 text-primary" />
            Receta: {productName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Cost summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-muted rounded-xl text-center">
              <p className="text-sm text-muted-foreground">Precio Venta</p>
              <p className="text-lg font-bold">S/ {productPrice.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-destructive/10 rounded-xl text-center">
              <p className="text-sm text-muted-foreground">Costo Receta</p>
              <p className="text-lg font-bold text-destructive">S/ {recipeCost.toFixed(2)}</p>
            </div>
            <div className={`p-3 rounded-xl text-center ${profit >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
              <p className="text-sm text-muted-foreground">Ganancia ({marginPercent}%)</p>
              <p className={`text-lg font-bold ${profit >= 0 ? 'text-success' : 'text-destructive'}`}>
                S/ {profit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Ingredients list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-pos-base">Ingredientes</label>
              <Button variant="outline" size="sm" onClick={addRow}>
                <Plus className="h-4 w-4 mr-1" />
                Agregar insumo
              </Button>
            </div>

            {/* Header */}
            <div className="grid grid-cols-[1fr_120px_100px_40px] gap-2 text-sm font-medium text-muted-foreground px-1">
              <span>Insumo</span>
              <span>Cantidad</span>
              <span>Costo</span>
              <span></span>
            </div>

            {rows.map((row, index) => {
              const ingredient = ingredients.find((i) => i.id === row.ingredient_id);
              const lineCost = ingredient
                ? ingredient.cost_per_unit * parseFloat(row.quantity_needed || '0')
                : 0;

              return (
                <div key={index} className="grid grid-cols-[1fr_120px_100px_40px] gap-2 items-center">
                  <Select
                    value={row.ingredient_id}
                    onValueChange={(v) => updateRow(index, 'ingredient_id', v)}
                  >
                    <SelectTrigger className="h-11 rounded-xl">
                      <SelectValue placeholder="Seleccionar insumo..." />
                    </SelectTrigger>
                    <SelectContent className="bg-background z-50">
                      {getAvailableIngredients(index).map((ing) => (
                        <SelectItem key={ing.id} value={ing.id}>
                          {ing.name} ({ing.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.quantity_needed}
                      onChange={(e) => updateRow(index, 'quantity_needed', e.target.value)}
                      placeholder="0.00"
                      className="h-11 rounded-xl pr-10"
                    />
                    {ingredient && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                        {ingredient.unit}
                      </span>
                    )}
                  </div>

                  <span className="text-sm font-medium text-center">
                    S/ {lineCost.toFixed(2)}
                  </span>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => removeRow(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              );
            })}

            {rows.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="h-12 w-12 mx-auto mb-2 opacity-30" />
                <p>Sin ingredientes. Agrega insumos a la receta.</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 rounded-xl bg-primary"
              onClick={handleSave}
              disabled={saveRecipe.isPending}
            >
              <Save className="h-5 w-5 mr-2" />
              {saveRecipe.isPending ? 'Guardando...' : 'Guardar Receta'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
