import { useMemo } from 'react';
import { Package, DollarSign, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { TopProduct } from '@/hooks/useReports';
import type { RecipeCostData } from '@/hooks/useRecipeCostReport';

interface ProductosReportProps {
  topProducts: TopProduct[];
  recipeCosts?: RecipeCostData[];
  isLoading: boolean;
}

function getMarginBadge(margin: number) {
  if (margin >= 60) return <Badge className="bg-success/20 text-success border-success/30">Excelente</Badge>;
  if (margin >= 40) return <Badge className="bg-warning/20 text-warning border-warning/30">Bueno</Badge>;
  if (margin >= 20) return <Badge className="bg-accent/20 text-accent border-accent/30">Regular</Badge>;
  return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Bajo</Badge>;
}

export function ProductosReport({ topProducts, recipeCosts = [], isLoading }: ProductosReportProps) {
  // Build a map from product_id → recipe cost info
  const recipeCostMap = useMemo(() => {
    const map: Record<string, RecipeCostData> = {};
    for (const rc of recipeCosts) {
      map[rc.product_id] = rc;
    }
    return map;
  }, [recipeCosts]);

  const hasAnyRecipe = recipeCosts.length > 0;

  const productChartData = useMemo(() =>
    topProducts.map(p => ({
      nombre: p.product_name.length > 15 ? p.product_name.slice(0, 15) + '...' : p.product_name,
      fullName: p.product_name,
      cantidad: Number(p.total_quantity),
      total: Number(p.total_sales),
    })),
    [topProducts]
  );

  // Summary stats
  const summary = useMemo(() => {
    if (topProducts.length === 0) return null;
    const totalSales = topProducts.reduce((s, p) => s + Number(p.total_sales), 0);
    const totalQty = topProducts.reduce((s, p) => s + Number(p.total_quantity), 0);
    let totalCost = 0;
    for (const p of topProducts) {
      const recipe = recipeCostMap[p.product_id];
      if (recipe) {
        totalCost += Number(recipe.recipe_cost) * Number(p.total_quantity);
      }
    }
    const totalProfit = totalSales - totalCost;
    const avgMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    return { totalSales, totalQty, totalCost, totalProfit, avgMargin, hasCosts: totalCost > 0 };
  }, [topProducts, recipeCostMap]);

  return (
    <div className="space-y-6">
      {/* Summary cards when recipe data is available */}
      {summary && summary.hasCosts && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-2 border-primary/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="h-7 w-7 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground">Uds. Vendidas</p>
                <p className="text-2xl font-bold">{summary.totalQty}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-success/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <DollarSign className="h-7 w-7 mx-auto mb-2 text-success" />
                <p className="text-sm text-muted-foreground">Ingresos</p>
                <p className="text-2xl font-bold">S/ {summary.totalSales.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-destructive/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <Package className="h-7 w-7 mx-auto mb-2 text-destructive" />
                <p className="text-sm text-muted-foreground">Costo Insumos</p>
                <p className="text-2xl font-bold">S/ {summary.totalCost.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 border-success/30">
            <CardContent className="pt-6">
              <div className="text-center">
                <TrendingUp className="h-7 w-7 mx-auto mb-2 text-success" />
                <p className="text-sm text-muted-foreground">Ganancia Estimada</p>
                <p className="text-2xl font-bold text-success">S/ {summary.totalProfit.toFixed(2)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Productos Más Vendidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10" />)}
              </div>
            ) : topProducts.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos de productos</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Total</TableHead>
                    {hasAnyRecipe && (
                      <>
                        <TableHead className="text-right">Costo</TableHead>
                        <TableHead className="text-right">Ganancia</TableHead>
                        <TableHead className="text-center">Margen</TableHead>
                      </>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product, index) => {
                    const recipe = recipeCostMap[product.product_id];
                    const totalCost = recipe ? Number(recipe.recipe_cost) * Number(product.total_quantity) : 0;
                    const profit = Number(product.total_sales) - totalCost;
                    const margin = Number(product.total_sales) > 0 ? (profit / Number(product.total_sales)) * 100 : 0;

                    return (
                      <TableRow key={product.product_id}>
                        <TableCell className="font-bold">{index + 1}</TableCell>
                        <TableCell className="font-semibold">{product.product_name}</TableCell>
                        <TableCell>{product.total_quantity}</TableCell>
                        <TableCell className="font-bold text-primary">
                          S/ {Number(product.total_sales).toFixed(2)}
                        </TableCell>
                        {hasAnyRecipe && (
                          <>
                            <TableCell className="text-right">
                              {recipe ? (
                                <span className="text-destructive font-medium">S/ {totalCost.toFixed(2)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {recipe ? (
                                <span className="text-success font-bold">S/ {profit.toFixed(2)}</span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              {recipe ? getMarginBadge(margin) : <span className="text-muted-foreground text-xs">Sin receta</span>}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader>
            <CardTitle>Gráfico de Ventas por Producto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px]" />
            ) : productChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>No hay datos</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" />
                  <YAxis dataKey="nombre" type="category" width={120} fontSize={12} />
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} unidades`,
                      props.payload.fullName
                    ]}
                  />
                  <Bar dataKey="cantidad" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
