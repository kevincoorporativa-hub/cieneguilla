import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Calendar,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ExportDropdown } from '@/components/shared/ExportDropdown';
import { exportToExcel, exportToPDF, exportMultipleToPDF } from '@/utils/exportUtils';
import { usePurchases, useSales, useCuadreSummary } from '@/hooks/useCuadre';

function getOrderTypeBadge(type: string) {
  switch (type) {
    case 'local': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Local</span>;
    case 'delivery': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground">Delivery</span>;
    case 'takeaway': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning">Para llevar</span>;
    default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">{type}</span>;
  }
}

export default function CuadrePage() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = `${today.substring(0, 7)}-01`;

  const [startDate, setStartDate] = useState(firstOfMonth);
  const [endDate, setEndDate] = useState(today);

  const { data: purchases = [], isLoading: loadingPurchases } = usePurchases(startDate, endDate);
  const { data: sales = [], isLoading: loadingSales } = useSales(startDate, endDate);
  const summary = useCuadreSummary(startDate, endDate);

  const isLoading = loadingPurchases || loadingSales;

  const handleExportExcel = () => {
    const purchasesData = {
      headers: ['Fecha', 'Insumo', 'Categoría', 'Cantidad', 'Costo Unit.', 'Total'],
      rows: purchases.map(p => [
        new Date(p.created_at).toLocaleDateString('es-PE'),
        p.ingredient_name,
        p.category,
        p.quantity,
        `S/ ${p.unit_cost.toFixed(2)}`,
        `S/ ${p.total_cost.toFixed(2)}`,
      ]),
      title: 'Compras de Insumos',
      subtitle: `Del ${startDate} al ${endDate}`,
    };

    const salesData = {
      headers: ['Fecha', 'N° Orden', 'Tipo', 'Items', 'Total'],
      rows: sales.map(s => [
        new Date(s.created_at).toLocaleDateString('es-PE'),
        s.order_number,
        s.order_type === 'local' ? 'Local' : s.order_type === 'delivery' ? 'Delivery' : 'Para llevar',
        s.items_count,
        `S/ ${s.total.toFixed(2)}`,
      ]),
      title: 'Ventas',
      subtitle: `Del ${startDate} al ${endDate}`,
    };

    exportToExcel({
      headers: ['Concepto', 'Monto'],
      rows: [
        ['Total Compras (Insumos)', `S/ ${summary.totalCompras.toFixed(2)}`],
        ['Total Ventas', `S/ ${summary.totalVentas.toFixed(2)}`],
        ['Utilidad Estimada', `S/ ${summary.utilidad.toFixed(2)}`],
        ['Margen (%)', `${summary.margenPorcentaje.toFixed(1)}%`],
        ['', ''],
        ...purchasesData.rows.map(r => [r[1] as string, r[5] as string]),
      ],
      title: 'Cuadre Financiero',
      subtitle: `Del ${startDate} al ${endDate}`,
    }, `cuadre_${startDate}_${endDate}`);
  };

  const handleExportPDF = () => {
    exportMultipleToPDF([
      {
        headers: ['Concepto', 'Monto'],
        rows: [
          ['Total Compras (Insumos)', `S/ ${summary.totalCompras.toFixed(2)}`],
          ['Total Ventas', `S/ ${summary.totalVentas.toFixed(2)}`],
          ['Utilidad Estimada', `S/ ${summary.utilidad.toFixed(2)}`],
          ['Margen (%)', `${summary.margenPorcentaje.toFixed(1)}%`],
        ],
        title: 'Cuadre Financiero - Resumen',
        subtitle: `Del ${startDate} al ${endDate}`,
      },
      {
        headers: ['Fecha', 'Insumo', 'Categoría', 'Cantidad', 'Costo Unit.', 'Total'],
        rows: purchases.map(p => [
          new Date(p.created_at).toLocaleDateString('es-PE'),
          p.ingredient_name,
          p.category,
          p.quantity,
          `S/ ${p.unit_cost.toFixed(2)}`,
          `S/ ${p.total_cost.toFixed(2)}`,
        ]),
        title: 'Detalle de Compras',
        subtitle: `Del ${startDate} al ${endDate}`,
      },
      {
        headers: ['Fecha', 'N° Orden', 'Tipo', 'Items', 'Total'],
        rows: sales.map(s => [
          new Date(s.created_at).toLocaleDateString('es-PE'),
          s.order_number,
          s.order_type === 'local' ? 'Local' : s.order_type === 'delivery' ? 'Delivery' : 'Para llevar',
          s.items_count,
          `S/ ${s.total.toFixed(2)}`,
        ]),
        title: 'Detalle de Ventas',
        subtitle: `Del ${startDate} al ${endDate}`,
      },
    ], `cuadre_${startDate}_${endDate}`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Cuadre</h1>
            <p className="text-muted-foreground">Comparación de compras vs ventas</p>
          </div>
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            disabled={isLoading}
          />
        </div>

        {/* Date Range Filter */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-sm">Rango:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 rounded-lg w-44"
                />
                <span className="text-muted-foreground">hasta</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 rounded-lg w-44"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStartDate(today); setEndDate(today); }}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const d = new Date();
                    const day = d.getDay();
                    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                    const monday = new Date(d.setDate(diff));
                    setStartDate(monday.toISOString().split('T')[0]);
                    setEndDate(new Date().toISOString().split('T')[0]);
                  }}
                >
                  Esta semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setStartDate(firstOfMonth); setEndDate(today); }}
                >
                  Este mes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-2 border-destructive/20 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                    <ArrowUpCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Compras</p>
                    <p className="text-xl font-bold text-destructive">S/ {summary.totalCompras.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{summary.cantidadCompras} registros</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-success/20 bg-success/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <ArrowDownCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Total Ventas</p>
                    <p className="text-xl font-bold text-success">S/ {summary.totalVentas.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{summary.cantidadVentas} órdenes</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className={`border-2 ${summary.utilidad >= 0 ? 'border-success/20 bg-success/5' : 'border-destructive/20 bg-destructive/5'}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${summary.utilidad >= 0 ? 'bg-success/10' : 'bg-destructive/10'}`}>
                    {summary.utilidad >= 0
                      ? <TrendingUp className="h-5 w-5 text-success" />
                      : <TrendingDown className="h-5 w-5 text-destructive" />
                    }
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Utilidad Estimada</p>
                    <p className={`text-xl font-bold ${summary.utilidad >= 0 ? 'text-success' : 'text-destructive'}`}>
                      S/ {summary.utilidad.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">Margen</p>
                    <p className="text-xl font-bold text-primary">
                      {summary.margenPorcentaje.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detail Tabs */}
        <Tabs defaultValue="compras" className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted rounded-xl">
            <TabsTrigger value="compras" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Package className="h-5 w-5 mr-2" />
              Compras ({purchases.length})
            </TabsTrigger>
            <TabsTrigger value="ventas" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Ventas ({sales.length})
            </TabsTrigger>
          </TabsList>

          {/* Purchases Table */}
          <TabsContent value="compras">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Detalle de Compras
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingPurchases ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Fecha</TableHead>
                        <TableHead className="font-bold">Insumo</TableHead>
                        <TableHead className="font-bold">Categoría</TableHead>
                        <TableHead className="font-bold text-right">Cantidad</TableHead>
                        <TableHead className="font-bold text-right">Costo Unit.</TableHead>
                        <TableHead className="font-bold text-right">Total</TableHead>
                        <TableHead className="font-bold">Nota</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {purchases.map(p => (
                        <TableRow key={p.id} className="hover:bg-muted/50">
                          <TableCell className="text-muted-foreground">
                            {new Date(p.created_at).toLocaleDateString('es-PE')}
                          </TableCell>
                          <TableCell className="font-semibold">{p.ingredient_name}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-muted">{p.category}</span>
                          </TableCell>
                          <TableCell className="text-right font-medium">{p.quantity}</TableCell>
                          <TableCell className="text-right">S/ {p.unit_cost.toFixed(2)}</TableCell>
                          <TableCell className="text-right font-bold text-destructive">S/ {p.total_cost.toFixed(2)}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{p.notes || '—'}</TableCell>
                        </TableRow>
                      ))}
                      {purchases.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No hay compras en el rango seleccionado
                          </TableCell>
                        </TableRow>
                      )}
                      {purchases.length > 0 && (
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell colSpan={5} className="text-right">TOTAL COMPRAS:</TableCell>
                          <TableCell className="text-right text-destructive text-lg">
                            S/ {summary.totalCompras.toFixed(2)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sales Table */}
          <TabsContent value="ventas">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Detalle de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingSales ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="font-bold">Fecha</TableHead>
                        <TableHead className="font-bold">N° Orden</TableHead>
                        <TableHead className="font-bold">Tipo</TableHead>
                        <TableHead className="font-bold text-right">Items</TableHead>
                        <TableHead className="font-bold text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map(s => (
                        <TableRow key={s.id} className="hover:bg-muted/50">
                          <TableCell className="text-muted-foreground">
                            {new Date(s.created_at).toLocaleDateString('es-PE')}
                          </TableCell>
                          <TableCell className="font-semibold">#{s.order_number}</TableCell>
                          <TableCell>{getOrderTypeBadge(s.order_type)}</TableCell>
                          <TableCell className="text-right">{s.items_count}</TableCell>
                          <TableCell className="text-right font-bold text-success">S/ {s.total.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                      {sales.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            No hay ventas en el rango seleccionado
                          </TableCell>
                        </TableRow>
                      )}
                      {sales.length > 0 && (
                        <TableRow className="bg-muted/50 font-bold">
                          <TableCell colSpan={4} className="text-right">TOTAL VENTAS:</TableCell>
                          <TableCell className="text-right text-success text-lg">
                            S/ {summary.totalVentas.toFixed(2)}
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
      </div>
    </MainLayout>
  );
}
