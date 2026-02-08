import { useState } from 'react';
import { History, Calendar, User, Search, Filter, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { exportToExcel, exportToPDF } from '@/utils/exportUtils';
import { StockMove } from '@/hooks/useIngredients';
import { getMovementIcon, getMovementBadge, getMovementLabel } from './InsumoHelpers';

interface Props {
  movements: StockMove[];
  isLoading: boolean;
}

export function KardexTab({ movements, isLoading }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = movements.filter((m) => {
    const matchesSearch =
      (m.ingredient_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || m.move_type === filterType;
    return matchesSearch && matchesType;
  });

  // Summary stats
  const totalIngresos = movements.filter((m) => m.move_type === 'purchase').length;
  const totalSalidas = movements.filter((m) => m.move_type === 'waste' || m.move_type === 'sale').length;
  const totalAjustes = movements.filter((m) => m.move_type === 'adjustment').length;
  const totalCostoPurchase = movements
    .filter((m) => m.move_type === 'purchase')
    .reduce((sum, m) => sum + m.total_cost, 0);

  const getExportData = () => ({
    headers: ['Fecha', 'Insumo', 'Tipo', 'Cantidad', 'Costo Unit.', 'Costo Total', 'Motivo', 'Usuario'],
    rows: filtered.map((m) => [
      new Date(m.created_at).toLocaleDateString('es-PE'),
      m.ingredient_name || '—',
      getMovementLabel(m.move_type),
      `${m.quantity >= 0 ? '+' : ''}${m.quantity}`,
      `S/ ${m.unit_cost.toFixed(2)}`,
      `S/ ${m.total_cost.toFixed(2)}`,
      m.notes || '—',
      m.user_name || '—',
    ]),
    title: 'Kardex - Historial de Movimientos',
    subtitle: `${filtered.length} movimientos | Generado: ${new Date().toLocaleDateString('es-PE')}`,
  });

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-2 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{movements.length}</p>
            <p className="text-sm text-muted-foreground">Total movimientos</p>
          </div>
        </Card>
        <Card className="border-2 border-success/30 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{totalIngresos}</p>
            <p className="text-sm text-muted-foreground">Ingresos</p>
          </div>
        </Card>
        <Card className="border-2 border-destructive/30 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-destructive">{totalSalidas}</p>
            <p className="text-sm text-muted-foreground">Salidas / Merma</p>
          </div>
        </Card>
        <Card className="border-2 border-warning/30 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{totalAjustes}</p>
            <p className="text-sm text-muted-foreground">Ajustes</p>
          </div>
        </Card>
      </div>

      {/* Total investment */}
      {totalCostoPurchase > 0 && (
        <Card className="border-2 bg-primary/5 border-primary/20">
          <CardContent className="p-4 flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Inversión total en compras</p>
              <p className="text-xl font-bold text-primary">S/ {totalCostoPurchase.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters + Export */}
      <Card className="border-2">
        <CardContent className="p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por insumo o motivo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-pos-base rounded-xl"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="h-12 w-44 text-pos-base rounded-xl">
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="purchase">Ingresos</SelectItem>
                  <SelectItem value="waste">Salidas / Merma</SelectItem>
                  <SelectItem value="sale">Ventas</SelectItem>
                  <SelectItem value="adjustment">Ajustes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <ExportDropdown
              onExportExcel={() => exportToExcel(getExportData(), 'kardex-movimientos')}
              onExportPDF={() => exportToPDF(getExportData(), 'kardex-movimientos')}
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Movimientos ({filtered.length})
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
                  <TableHead className="text-pos-base font-bold">Fecha</TableHead>
                  <TableHead className="text-pos-base font-bold">Insumo</TableHead>
                  <TableHead className="text-pos-base font-bold">Tipo</TableHead>
                  <TableHead className="text-pos-base font-bold">Cantidad</TableHead>
                  <TableHead className="text-pos-base font-bold">Costo Unit.</TableHead>
                  <TableHead className="text-pos-base font-bold">Costo Total</TableHead>
                  <TableHead className="text-pos-base font-bold">Motivo</TableHead>
                  <TableHead className="text-pos-base font-bold">Usuario</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((move) => (
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
                    <TableCell
                      className={`font-bold ${
                        move.quantity >= 0 ? 'text-success' : 'text-destructive'
                      }`}
                    >
                      {move.quantity >= 0 ? '+' : ''}
                      {move.quantity}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      S/ {move.unit_cost.toFixed(2)}
                    </TableCell>
                    <TableCell className="font-semibold">
                      S/ {move.total_cost.toFixed(2)}
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
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No hay movimientos registrados
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
