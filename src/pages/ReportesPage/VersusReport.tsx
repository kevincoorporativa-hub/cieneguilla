import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, Calendar } from 'lucide-react';
import { PurchaseItem, SaleItem, useAllPurchases } from '@/hooks/useCuadre';

function getOrderTypeBadge(type: string) {
  switch (type) {
    case 'local': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Local</span>;
    case 'delivery': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground">Delivery</span>;
    case 'takeaway': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning">Para llevar</span>;
    default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">{type}</span>;
  }
}

function getSourceBadge(source: 'insumo' | 'producto') {
  return source === 'insumo'
    ? <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Insumo</span>
    : <span className="px-2 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground">Producto</span>;
}

interface VersusReportProps {
  sales: SaleItem[];
  isLoadingSales: boolean;
  globalStartDate: string;
  globalEndDate: string;
}

export function VersusReport({ sales, isLoadingSales, globalStartDate, globalEndDate }: VersusReportProps) {
  const [tab, setTab] = useState<string>('compras');

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const firstOfMonth = `${today.substring(0, 7)}-01`;

  // Independent date range for purchases
  const [purchaseStart, setPurchaseStart] = useState(firstOfMonth);
  const [purchaseEnd, setPurchaseEnd] = useState(today);

  const { data: purchases = [], isLoading: isLoadingPurchases } = useAllPurchases(purchaseStart, purchaseEnd);

  const totalCompras = purchases.reduce((sum, p) => sum + p.total_cost, 0);
  const totalVentas = sales.reduce((sum, s) => sum + s.total, 0);

  return (
    <Tabs value={tab} onValueChange={setTab} className="space-y-4">
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

      {/* Purchases Tab */}
      <TabsContent value="compras" className="space-y-4">
        {/* Purchase-specific date range filter */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold text-sm">Rango de compras:</span>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={purchaseStart}
                  onChange={(e) => setPurchaseStart(e.target.value)}
                  className="h-10 rounded-lg w-40"
                />
                <span className="text-muted-foreground text-sm">hasta</span>
                <Input
                  type="date"
                  value={purchaseEnd}
                  onChange={(e) => setPurchaseEnd(e.target.value)}
                  className="h-10 rounded-lg w-40"
                />
              </div>
              <div className="flex gap-2 ml-auto">
                <Button variant="outline" size="sm" onClick={() => { setPurchaseStart(today); setPurchaseEnd(today); }}>
                  Hoy
                </Button>
                <Button variant="outline" size="sm" onClick={() => {
                  const d = new Date();
                  const day = d.getDay();
                  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(d.getFullYear(), d.getMonth(), diff);
                  const monStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
                  setPurchaseStart(monStr);
                  setPurchaseEnd(today);
                }}>
                  Semana
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setPurchaseStart(firstOfMonth); setPurchaseEnd(today); }}>
                  Mes
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detalle de Compras
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingPurchases ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold">Fecha</TableHead>
                    <TableHead className="font-bold">Nombre</TableHead>
                    <TableHead className="font-bold">Tipo</TableHead>
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
                      <TableCell className="font-semibold">{p.item_name}</TableCell>
                      <TableCell>{getSourceBadge(p.source)}</TableCell>
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
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No hay compras en el rango seleccionado
                      </TableCell>
                    </TableRow>
                  )}
                  {purchases.length > 0 && (
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={6} className="text-right">TOTAL COMPRAS:</TableCell>
                      <TableCell className="text-right text-destructive text-lg">
                        S/ {totalCompras.toFixed(2)}
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

      {/* Sales Tab */}
      <TabsContent value="ventas">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Detalle de Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSales ? (
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
                        S/ {totalVentas.toFixed(2)}
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
  );
}
