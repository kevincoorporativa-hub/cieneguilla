import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Truck,
  AlertTriangle,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  ChefHat,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  useDashboardStats,
  useWeeklySales,
  useCategorySales,
  useTopProducts,
  useLowStockItems,
  useLowStockProducts,
} from '@/hooks/useDashboard';
import { useUnpreparableProducts } from '@/hooks/useUnpreparableProducts';

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
  iconColor: string;
  isLoading?: boolean;
}

function StatCard({ title, value, change, icon: Icon, iconColor, isLoading }: StatCardProps) {
  const isPositive = change >= 0;
  
  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="p-6">
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground font-medium">{title}</p>
            <p className="text-pos-2xl font-bold mt-2">{value}</p>
            <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span className="text-sm font-semibold">{Math.abs(change).toFixed(1)}% vs ayer</span>
            </div>
          </div>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconColor}`}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  // Fetch all dashboard data
  const { data: stats, isLoading: loadingStats } = useDashboardStats();
  const { data: weeklySales = [], isLoading: loadingWeekly } = useWeeklySales();
  const { data: categorySales = [], isLoading: loadingCategories } = useCategorySales();
  const { data: topProducts = [], isLoading: loadingProducts } = useTopProducts();
  const { data: lowStockItems = [], isLoading: loadingStock } = useLowStockItems();
  const { data: lowStockProducts = [], isLoading: loadingProductStock } = useLowStockProducts();
  const { data: unpreparableProducts = [], isLoading: loadingUnpreparable } = useUnpreparableProducts();

  // Calculate percentage changes
  const salesChange = stats?.yesterdaySales 
    ? ((stats.todaySales - stats.yesterdaySales) / stats.yesterdaySales) * 100 
    : 0;
  const ordersChange = stats?.yesterdayOrders 
    ? ((stats.todayOrders - stats.yesterdayOrders) / stats.yesterdayOrders) * 100 
    : 0;

  // Chart data for bar chart
  const chartData = weeklySales.map(d => ({
    dia: d.day,
    ventas: d.sales,
  }));

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-pos-2xl font-bold">Dashboard Gerencial</h1>
          <p className="text-muted-foreground">Resumen de operaciones del día</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-6">
          <StatCard
            title="Ventas del Día"
            value={`S/ ${(stats?.todaySales || 0).toFixed(2)}`}
            change={salesChange}
            icon={DollarSign}
            iconColor="bg-success"
            isLoading={loadingStats}
          />
          <StatCard
            title="Pedidos"
            value={String(stats?.todayOrders || 0)}
            change={ordersChange}
            icon={ShoppingCart}
            iconColor="bg-primary"
            isLoading={loadingStats}
          />
          <StatCard
            title="Ticket Promedio"
            value={`S/ ${(stats?.averageTicket || 0).toFixed(2)}`}
            change={0}
            icon={TrendingUp}
            iconColor="bg-accent"
            isLoading={loadingStats}
          />
          <StatCard
            title="Deliveries"
            value={String(stats?.deliveryCount || 0)}
            change={0}
            icon={Truck}
            iconColor="bg-secondary"
            isLoading={loadingStats}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-3 gap-6">
          {/* Sales Chart */}
          <Card className="col-span-2 border-2">
            <CardHeader>
              <CardTitle className="text-pos-lg">Ventas de la Semana</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingWeekly ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="dia" className="text-sm" />
                    <YAxis className="text-sm" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.75rem'
                      }}
                      formatter={(value) => [`S/ ${value}`, 'Ventas']}
                    />
                    <Bar 
                      dataKey="ventas" 
                      fill="hsl(var(--primary))" 
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Category Pie Chart */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-pos-lg">Ventas por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingCategories ? (
                <Skeleton className="h-[200px] w-full" />
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={categorySales}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categorySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value}%`, 'Porcentaje']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-4">
                    {categorySales.map((cat) => (
                      <div key={cat.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-sm font-medium">{cat.name}</span>
                        </div>
                        <span className="text-sm font-bold">{cat.value}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - 2x2 grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Top Products */}
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-pos-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProducts ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No hay datos de ventas esta semana</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={product.name} className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.quantity} unidades</p>
                      </div>
                      <span className="font-bold text-success">S/ {product.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recetas No Preparables */}
          <Card className="border-2 border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-pos-lg flex items-center gap-2 text-destructive">
                <ChefHat className="h-5 w-5" />
                Recetas Sin Insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUnpreparable ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : unpreparableProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  ✅ Todos los productos con receta se pueden preparar
                </p>
              ) : (
                <div className="space-y-3">
                  {unpreparableProducts.map((product) => (
                    <div key={product.product_id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-xl">
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{product.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Falta: <span className="font-medium">{product.limiting_ingredient}</span>
                          {' '}({product.limiting_stock.toFixed(1)} disponible, necesita {product.limiting_needed.toFixed(1)})
                        </p>
                      </div>
                      <Badge variant={product.available_servings === 0 ? 'destructive' : 'secondary'} className="ml-2">
                        {product.available_servings === 0 ? 'No disponible' : `${product.available_servings} uds`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert - Insumos */}
          <Card className="border-2 border-warning/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-pos-lg flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Stock Bajo Insumos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingStock ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : lowStockItems.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  ✅ No hay insumos con stock bajo
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockItems.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Mínimo: {item.min_stock} unidades
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        item.stock === 0 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-warning text-warning-foreground'
                      }`}>
                        {item.stock === 0 ? 'Sin stock' : `${item.stock} uds`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert - Productos */}
          <Card className="border-2 border-warning/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-pos-lg flex items-center gap-2 text-warning">
                <Package className="h-5 w-5" />
                Stock Bajo Productos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingProductStock ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : lowStockProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  ✅ No hay productos con stock bajo
                </p>
              ) : (
                <div className="space-y-3">
                  {lowStockProducts.map((product) => (
                    <div key={product.name} className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
                      <div>
                        <p className="font-semibold text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Mínimo: {product.min_stock} unidades
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        product.stock === 0 
                          ? 'bg-destructive text-destructive-foreground' 
                          : 'bg-warning text-warning-foreground'
                      }`}>
                        {product.stock === 0 ? 'Sin stock' : `${product.stock} uds`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
