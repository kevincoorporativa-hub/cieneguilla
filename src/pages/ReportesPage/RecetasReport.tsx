import { useMemo } from 'react';
import { formatCost } from '@/utils/formatDecimals';
import { ChefHat, TrendingUp, Package, DollarSign, ShoppingCart, Gift } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie,
} from 'recharts';
import type { RecipeCostData, IngredientConsumption, RecipeProductSale } from '@/hooks/useRecipeCostReport';

interface RecetasReportProps {
  recipeCosts: RecipeCostData[];
  ingredientConsumption: IngredientConsumption[];
  recipeProductSales: RecipeProductSale[];
  isLoading: boolean;
}

function getMarginColor(margin: number): string {
  if (margin >= 60) return 'hsl(142, 76%, 36%)';
  if (margin >= 40) return 'hsl(48, 96%, 53%)';
  if (margin >= 20) return 'hsl(25, 95%, 53%)';
  return 'hsl(0, 84%, 60%)';
}

function getMarginBadge(margin: number) {
  if (margin >= 60) return <Badge className="bg-success/20 text-success border-success/30">Excelente</Badge>;
  if (margin >= 40) return <Badge className="bg-warning/20 text-warning border-warning/30">Bueno</Badge>;
  if (margin >= 20) return <Badge className="bg-accent/20 text-accent border-accent/30">Regular</Badge>;
  return <Badge className="bg-destructive/20 text-destructive border-destructive/30">Bajo</Badge>;
}

export function RecetasReport({ recipeCosts, ingredientConsumption, recipeProductSales, isLoading }: RecetasReportProps) {
  const salesSummary = useMemo(() => {
    if (recipeProductSales.length === 0) return null;
    const totalRevenue = recipeProductSales.reduce((s, r) => s + r.total_revenue, 0);
    const totalCost = recipeProductSales.reduce((s, r) => s + r.total_recipe_cost, 0);
    const totalProfit = recipeProductSales.reduce((s, r) => s + r.total_profit, 0);
    const totalUnits = recipeProductSales.reduce((s, r) => s + r.units_sold, 0);
    const totalDirect = recipeProductSales.reduce((s, r) => s + r.direct_units, 0);
    const totalCombo = recipeProductSales.reduce((s, r) => s + r.combo_units, 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    return { totalRevenue, totalCost, totalProfit, totalUnits, totalDirect, totalCombo, avgMargin };
  }, [recipeProductSales]);

  const staticStats = useMemo(() => {
    if (recipeCosts.length === 0) return null;
    const avgMargin = recipeCosts.reduce((s, r) => s + Number(r.margin_percent), 0) / recipeCosts.length;
    return { avgMargin };
  }, [recipeCosts]);

  const marginChartData = useMemo(() =>
    recipeCosts.map(r => ({
      nombre: r.product_name.length > 12 ? r.product_name.slice(0, 12) + '...' : r.product_name,
      fullName: r.product_name,
      margen: Number(r.margin_percent),
      costo: Number(r.recipe_cost),
      precio: Number(r.base_price),
      ganancia: Number(r.profit),
    })),
    [recipeCosts]
  );

  const salesChartData = useMemo(() =>
    recipeProductSales.map(r => ({
      nombre: r.product_name.length > 12 ? r.product_name.slice(0, 12) + '...' : r.product_name,
      fullName: r.product_name,
      ingresos: r.total_revenue,
      costoInsumos: r.total_recipe_cost,
      ganancia: r.total_profit,
    })),
    [recipeProductSales]
  );

  const consumptionPieData = useMemo(() =>
    ingredientConsumption.slice(0, 8).map(ic => ({
      name: ic.ingredient_name,
      value: ic.total_consumed,
      unit: ic.unit,
    })),
    [ingredientConsumption]
  );

  const COLORS = [
    'hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(142, 76%, 36%)',
    'hsl(48, 96%, 53%)', 'hsl(25, 95%, 53%)', 'hsl(262, 83%, 58%)',
    'hsl(199, 89%, 48%)', 'hsl(0, 84%, 60%)',
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <SummaryCard icon={ShoppingCart} label="Unidades Vendidas" color="primary" isLoading={isLoading}>
          <p className="text-2xl font-bold">{salesSummary?.totalUnits || 0}</p>
          {salesSummary && salesSummary.totalCombo > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {salesSummary.totalDirect} directas · {salesSummary.totalCombo} combos
            </p>
          )}
        </SummaryCard>

        <SummaryCard icon={DollarSign} label="Ingresos Totales" color="success" isLoading={isLoading}>
          <p className="text-2xl font-bold">S/ {(salesSummary?.totalRevenue || 0).toFixed(2)}</p>
        </SummaryCard>

        <SummaryCard icon={Package} label="Costo Insumos" color="destructive" isLoading={isLoading}>
          <p className="text-2xl font-bold">S/ {(salesSummary?.totalCost || 0).toFixed(2)}</p>
        </SummaryCard>

        <SummaryCard icon={TrendingUp} label="Ganancia Real" color="success" isLoading={isLoading}>
          <p className="text-2xl font-bold text-success">S/ {(salesSummary?.totalProfit || 0).toFixed(2)}</p>
        </SummaryCard>

        <SummaryCard icon={ChefHat} label="Margen Promedio" color="primary" isLoading={isLoading}>
          <p className="text-2xl font-bold">{(salesSummary?.avgMargin || staticStats?.avgMargin || 0).toFixed(1)}%</p>
        </SummaryCard>
      </div>

      {/* Profitability Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-success" />
            Ventas con Receta — Rentabilidad Real
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SkeletonRows count={5} />
          ) : recipeProductSales.length === 0 ? (
            <EmptyState message="No hay ventas de productos con receta en este período" hint="Configura recetas y realiza ventas para ver la rentabilidad" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-center">Uds. Vendidas</TableHead>
                  <TableHead className="text-center">
                    <span className="flex items-center justify-center gap-1">
                      <Gift className="h-3.5 w-3.5" /> Combo / Directa
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Ingresos</TableHead>
                  <TableHead className="text-right">Costo x Ud.</TableHead>
                  <TableHead className="text-right">Costo Total</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
                  <TableHead className="text-center">Margen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipeProductSales.map((sale) => {
                  const comboPercent = sale.units_sold > 0 ? (sale.combo_units / sale.units_sold * 100) : 0;
                  return (
                    <TableRow key={sale.product_id}>
                      <TableCell className="font-semibold">{sale.product_name}</TableCell>
                      <TableCell className="text-center font-bold">{sale.units_sold}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col items-center text-xs">
                          <span>{sale.combo_units} combo · {sale.direct_units} directa</span>
                          {sale.combo_units > 0 && (
                            <span className="text-muted-foreground">({comboPercent.toFixed(0)}% combo)</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">S/ {sale.total_revenue.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">S/ {formatCost(sale.unit_recipe_cost)}</TableCell>
                      <TableCell className="text-right text-destructive font-medium">S/ {sale.total_recipe_cost.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-success font-bold">S/ {sale.total_profit.toFixed(2)}</TableCell>
                      <TableCell className="text-center">{getMarginBadge(sale.margin_percent)}</TableCell>
                    </TableRow>
                  );
                })}
                {salesSummary && (
                  <TableRow className="border-t-2 font-bold bg-muted/50">
                    <TableCell>TOTAL</TableCell>
                    <TableCell className="text-center">{salesSummary.totalUnits}</TableCell>
                    <TableCell className="text-center text-xs">
                      {salesSummary.totalCombo} combo · {salesSummary.totalDirect} directa
                    </TableCell>
                    <TableCell className="text-right">S/ {salesSummary.totalRevenue.toFixed(2)}</TableCell>
                    <TableCell className="text-right">—</TableCell>
                    <TableCell className="text-right text-destructive">S/ {salesSummary.totalCost.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-success">S/ {salesSummary.totalProfit.toFixed(2)}</TableCell>
                    <TableCell className="text-center">{getMarginBadge(salesSummary.avgMargin)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Ingresos vs Costo de Insumos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px]" /> : salesChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground"><p>Sin datos de ventas</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="nombre" fontSize={11} />
                  <YAxis fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }}
                    formatter={(value: number, name: string) => {
                      const labels: Record<string, string> = { ingresos: 'Ingresos', costoInsumos: 'Costo Insumos', ganancia: 'Ganancia' };
                      return [`S/ ${value.toFixed(2)}`, labels[name] || name];
                    }}
                  />
                  <Bar dataKey="ingresos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="ingresos" />
                  <Bar dataKey="costoInsumos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="costoInsumos" />
                  <Bar dataKey="ganancia" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="ganancia" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ingredient Consumption Pie */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Insumos Más Consumidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-[300px]" /> : consumptionPieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground"><p>No hay consumo registrado</p></div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={consumptionPieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" nameKey="name">
                      {consumptionPieData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1 mt-2">
                  {consumptionPieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value.toFixed(1)} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Margin Analysis Chart */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Margen por Producto (Análisis de Receta)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-[300px]" /> : marginChartData.length === 0 ? (
            <EmptyState message="No hay recetas configuradas" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marginChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} unit="%" />
                <YAxis dataKey="nombre" type="category" width={110} fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem' }}
                  formatter={(value: number, _name: string, props: any) => [
                    `${value}%`,
                    `${props.payload.fullName} — Costo: S/${formatCost(props.payload.costo)} | Precio: S/${props.payload.precio.toFixed(2)}`
                  ]}
                  labelFormatter={() => ''}
                />
                <Bar dataKey="margen" radius={[0, 8, 8, 0]}>
                  {marginChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getMarginColor(entry.margen)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Detailed Cost Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Detalle de Costos por Receta (Por Unidad)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <SkeletonRows count={5} /> : recipeCosts.length === 0 ? (
            <EmptyState message="No hay productos con receta configurada" hint="Ve a Productos → activa 'Usa Recetas' en una categoría y asigna insumos" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio Venta</TableHead>
                  <TableHead className="text-right">Costo Receta</TableHead>
                  <TableHead className="text-right">Ganancia x Ud.</TableHead>
                  <TableHead className="text-right">Margen</TableHead>
                  <TableHead className="text-center">Insumos</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipeCosts.map((rc) => (
                  <TableRow key={rc.product_id}>
                    <TableCell className="font-semibold">{rc.product_name}</TableCell>
                    <TableCell className="text-right">S/ {Number(rc.base_price).toFixed(2)}</TableCell>
                    <TableCell className="text-right text-destructive font-medium">S/ {formatCost(Number(rc.recipe_cost))}</TableCell>
                    <TableCell className="text-right text-success font-bold">S/ {formatCost(Number(rc.profit))}</TableCell>
                    <TableCell className="text-right font-bold">{Number(rc.margin_percent).toFixed(1)}%</TableCell>
                    <TableCell className="text-center">{rc.ingredient_count}</TableCell>
                    <TableCell className="text-center">{getMarginBadge(Number(rc.margin_percent))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ingredient Consumption Table */}
      {ingredientConsumption.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Consumo Detallado de Insumos por Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-right">Consumo Total</TableHead>
                  <TableHead className="text-center">Unidad</TableHead>
                  <TableHead className="text-right">Nº Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientConsumption.map((ic) => (
                  <TableRow key={ic.ingredient_id}>
                    <TableCell className="font-semibold">{ic.ingredient_name}</TableCell>
                    <TableCell className="text-right font-bold">{ic.total_consumed.toFixed(2)}</TableCell>
                    <TableCell className="text-center text-muted-foreground">{ic.unit}</TableCell>
                    <TableCell className="text-right">{ic.move_count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Helper sub-components ---

function SummaryCard({ icon: Icon, label, color, isLoading, children }: {
  icon: any; label: string; color: string; isLoading: boolean; children: React.ReactNode;
}) {
  return (
    <Card className={`border-2 border-${color}/30`}>
      <CardContent className="pt-6">
        <div className="text-center">
          <Icon className={`h-8 w-8 mx-auto mb-2 text-${color}`} />
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? <Skeleton className="h-8 w-16 mx-auto mt-1" /> : children}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonRows({ count }: { count: number }) {
  return (
    <div className="space-y-2">
      {[...Array(count)].map((_, i) => <Skeleton key={i} className="h-10" />)}
    </div>
  );
}

function EmptyState({ message, hint }: { message: string; hint?: string }) {
  return (
    <div className="py-8 text-center text-muted-foreground">
      <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
      <p>{message}</p>
      {hint && <p className="text-sm mt-2">{hint}</p>}
    </div>
  );
}
