import { useState } from 'react';
import { Search, Package, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { Ingredient } from '@/hooks/useIngredients';
import { getStockBadge } from './InsumoHelpers';

interface Props {
  ingredients: Ingredient[];
  isLoading: boolean;
  onNewItem: () => void;
}

export function InsumoListTab({ ingredients, isLoading, onNewItem }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = ingredients.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = ingredients.filter((i) => i.current_stock <= i.min_stock && i.current_stock > 0);
  const outOfStockItems = ingredients.filter((i) => i.current_stock === 0);
  const normalStock = ingredients.filter((i) => i.current_stock > i.min_stock);

  const getExportData = () => ({
    headers: ['Insumo', 'Categoría', 'Stock', 'Unidad', 'Mínimo', 'Costo Unit.', 'Precio Total', 'Proveedor'],
    rows: filtered.map((i) => [
      i.name,
      i.category,
      i.current_stock,
      i.unit,
      i.min_stock,
      `S/ ${i.cost_per_unit.toFixed(2)}`,
      `S/ ${(i.current_stock * i.cost_per_unit).toFixed(2)}`,
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
                    <TableCell className="text-muted-foreground">S/ {item.cost_per_unit.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">S/ {(item.current_stock * item.cost_per_unit).toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{item.supplier || '—'}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No se encontraron insumos
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
