import { useMemo } from 'react';
import { ChefHat, TrendingUp, TrendingDown, AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import type { RecipeCostData, IngredientConsumption } from '@/hooks/useRecipeCostReport';

interface RecetasReportProps {
  recipeCosts: RecipeCostData[];
  ingredientConsumption: IngredientConsumption[];
  isLoading: boolean;
}

function getMarginColor(margin: number): string {
  if (margin >= 60) return 'hsl(142, 76%, 36%)'; // green
  if (margin >= 40) return 'hsl(48, 96%, 53%)';  // yellow
  if (margin >= 20) return 'hsl(25, 95%, 53%)';  // orange
  return 'hsl(0, 84%, 60%)';                      // red
}

function getMarginBadge(margin: number) {
  if (margin >= 60) return <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">Excelente</Badge>;
  if (margin >= 40) return <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">Bueno</Badge>;
  if (margin >= 20) return <Badge className="bg-orange-500/20 text-orange-700 dark:text-orange-400 border-orange-500/30">Regular</Badge>;
  return <Badge className="bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30">Bajo</Badge>;
}

export function RecetasReport({ recipeCosts, ingredientConsumption, isLoading }: RecetasReportProps) {
  // Summary stats
  const stats = useMemo(() => {
    if (recipeCosts.length === 0) return null;
    const avgMargin = recipeCosts.reduce((s, r) => s + Number(r.margin_percent), 0) / recipeCosts.length;
    const totalRecipeCost = recipeCosts.reduce((s, r) => s + Number(r.recipe_cost), 0);
    const totalRevenue = recipeCosts.reduce((s, r) => s + Number(r.base_price), 0);
    const lowestMargin = recipeCosts[0]; // sorted ascending
    const highestMargin = recipeCosts[recipeCosts.length - 1];
    return { avgMargin, totalRecipeCost, totalRevenue, lowestMargin, highestMargin };
  }, [recipeCosts]);

  // Chart data for margins
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

  // Pie chart for top consumed ingredients
  const consumptionPieData = useMemo(() =>
    ingredientConsumption.slice(0, 8).map(ic => ({
      name: ic.ingredient_name,
      value: ic.total_consumed,
      unit: ic.unit,
    })),
    [ingredientConsumption]
  );

  const COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(142, 76%, 36%)',
    'hsl(48, 96%, 53%)',
    'hsl(25, 95%, 53%)',
    'hsl(262, 83%, 58%)',
    'hsl(199, 89%, 48%)',
    'hsl(0, 84%, 60%)',
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <ChefHat className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">Productos con Receta</p>
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto mt-1" /> : (
                <p className="text-2xl font-bold">{recipeCosts.length}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Margen Promedio</p>
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto mt-1" /> : (
                <p className="text-2xl font-bold">{stats?.avgMargin.toFixed(1) || 0}%</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <TrendingDown className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <p className="text-sm text-muted-foreground">Menor Margen</p>
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto mt-1" /> : (
                <div>
                  <p className="text-lg font-bold">{stats?.lowestMargin?.margin_percent || 0}%</p>
                  <p className="text-xs text-muted-foreground truncate">{stats?.lowestMargin?.product_name}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm text-muted-foreground">Insumos Usados</p>
              {isLoading ? <Skeleton className="h-8 w-16 mx-auto mt-1" /> : (
                <p className="text-2xl font-bold">{ingredientConsumption.length}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Margin Chart + Cost Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Margin Chart */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Margen por Producto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px]" />
            ) : marginChartData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay recetas configuradas</p>
                </div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={marginChartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis dataKey="nombre" type="category" width={110} fontSize={11} />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value}%`,
                      `${props.payload.fullName} — Costo: S/${props.payload.costo.toFixed(2)} | Precio: S/${props.payload.precio.toFixed(2)}`
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

        {/* Ingredient Consumption Pie */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Insumos Más Consumidos (Ventas)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px]" />
            ) : consumptionPieData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <p>No hay consumo de insumos registrado</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={consumptionPieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    nameKey="name"
                    label={({ name, value, unit }) => `${name}: ${value} ${unit}`}
                    labelLine={false}
                  >
                    {consumptionPieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string) => [`${value}`, name]} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cost Table */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5" />
            Detalle de Costos por Receta
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : recipeCosts.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <ChefHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay productos con receta configurada</p>
              <p className="text-sm mt-2">Ve a Productos → activa "Usa Recetas" en una categoría y asigna insumos</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Precio Venta</TableHead>
                  <TableHead className="text-right">Costo Receta</TableHead>
                  <TableHead className="text-right">Ganancia</TableHead>
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
                    <TableCell className="text-right text-destructive font-medium">
                      S/ {Number(rc.recipe_cost).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right text-green-600 dark:text-green-400 font-bold">
                      S/ {Number(rc.profit).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {Number(rc.margin_percent).toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-center">{rc.ingredient_count}</TableCell>
                    <TableCell className="text-center">
                      {getMarginBadge(Number(rc.margin_percent))}
                    </TableCell>
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
              Consumo de Insumos por Ventas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Insumo</TableHead>
                  <TableHead className="text-right">Consumo Total</TableHead>
                  <TableHead className="text-center">Unidad</TableHead>
                  <TableHead className="text-right">Ventas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingredientConsumption.map((ic) => (
                  <TableRow key={ic.ingredient_id}>
                    <TableCell className="font-semibold">{ic.ingredient_name}</TableCell>
                    <TableCell className="text-right font-bold">
                      {ic.total_consumed.toFixed(2)}
                    </TableCell>
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
