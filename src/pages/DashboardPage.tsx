import { 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  AlertTriangle,
  Package,
  Truck,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Calendar
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

const salesData = [
  { dia: 'Lun', ventas: 1250 },
  { dia: 'Mar', ventas: 980 },
  { dia: 'Mié', ventas: 1100 },
  { dia: 'Jue', ventas: 1400 },
  { dia: 'Vie', ventas: 2100 },
  { dia: 'Sáb', ventas: 2800 },
  { dia: 'Dom', ventas: 1900 },
];

const categoryData = [
  { name: 'Pizzas', value: 45, color: 'hsl(24, 95%, 53%)' },
  { name: 'Cervezas', value: 25, color: 'hsl(215, 25%, 27%)' },
  { name: 'Carnes', value: 15, color: 'hsl(38, 92%, 50%)' },
  { name: 'Otros', value: 15, color: 'hsl(220, 15%, 70%)' },
];

const topProducts = [
  { nombre: 'Pizza Pepperoni', ventas: 145, monto: 4640 },
  { nombre: 'Cerveza Pilsen', ventas: 320, monto: 2560 },
  { nombre: 'Pizza Hawaiana', ventas: 98, monto: 3430 },
  { nombre: 'Costillas BBQ', ventas: 45, monto: 2475 },
  { nombre: 'Coca Cola 1L', ventas: 180, monto: 1260 },
];

const lowStockProducts = [
  { nombre: 'Pizza Vegetariana', stock: 3, minimo: 5 },
  { nombre: 'Lomo Saltado', stock: 0, minimo: 3 },
  { nombre: 'Vino Rosé', stock: 2, minimo: 5 },
];

// Productos próximos a vencer
const expiringProducts = [
  { nombre: 'Coca Cola 1L', fechaVencimiento: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), diasRestantes: -2, status: 'expired' as const },
  { nombre: 'Cerveza Pilsen', fechaVencimiento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), diasRestantes: 5, status: 'warning' as const },
  { nombre: 'Sprite 500ml', fechaVencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), diasRestantes: 10, status: 'warning' as const },
  { nombre: 'Inca Kola 1L', fechaVencimiento: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000), diasRestantes: 18, status: 'soon' as const },
];

interface StatCardProps {
  title: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
  iconColor: string;
}

function StatCard({ title, value, change, icon: Icon, iconColor }: StatCardProps) {
  const isPositive = change >= 0;
  return (
    <Card className="border-2">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground font-medium">{title}</p>
            <p className="text-pos-2xl font-bold mt-2">{value}</p>
            <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-success' : 'text-destructive'}`}>
              {isPositive ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
              <span className="text-sm font-semibold">{Math.abs(change)}% vs ayer</span>
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
  const expiredCount = expiringProducts.filter(p => p.status === 'expired').length;
  const warningCount = expiringProducts.filter(p => p.status !== 'expired').length;

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
            value="S/ 3,450.00"
            change={12.5}
            icon={DollarSign}
            iconColor="bg-success"
          />
          <StatCard
            title="Pedidos"
            value="48"
            change={8}
            icon={ShoppingCart}
            iconColor="bg-primary"
          />
          <StatCard
            title="Ticket Promedio"
            value="S/ 71.88"
            change={-3}
            icon={TrendingUp}
            iconColor="bg-accent"
          />
          <StatCard
            title="Deliveries"
            value="12"
            change={25}
            icon={Truck}
            iconColor="bg-secondary"
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
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={salesData}>
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
            </CardContent>
          </Card>

          {/* Category Pie Chart */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-pos-lg">Ventas por Categoría</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value}%`, 'Porcentaje']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {categoryData.map((cat) => (
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
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section - 3 columns */}
        <div className="grid grid-cols-3 gap-6">
          {/* Top Products */}
          <Card className="border-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-pos-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos Más Vendidos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topProducts.map((product, index) => (
                  <div key={product.nombre} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <p className="font-semibold">{product.nombre}</p>
                      <p className="text-sm text-muted-foreground">{product.ventas} unidades</p>
                    </div>
                    <span className="font-bold text-success">S/ {product.monto.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="border-2 border-warning/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-pos-lg flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Stock Bajo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {lowStockProducts.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No hay productos con stock bajo
                </p>
              ) : (
                <div className="space-y-4">
                  {lowStockProducts.map((product) => (
                    <div key={product.nombre} className="flex items-center justify-between p-3 bg-warning/10 rounded-xl">
                      <div>
                        <p className="font-semibold">{product.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          Mínimo: {product.minimo} unidades
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-bold ${
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

          {/* Productos por Vencer */}
          <Card className="border-2 border-destructive/50">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-pos-lg flex items-center gap-2 text-destructive">
                <Clock className="h-5 w-5" />
                Por Vencer
                <span className="ml-2 px-2 py-0.5 text-sm rounded-full bg-destructive text-destructive-foreground">
                  {expiredCount + warningCount}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {expiringProducts.map((product) => (
                  <div 
                    key={product.nombre} 
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      product.status === 'expired' 
                        ? 'bg-destructive/10 border border-destructive/30'
                        : product.status === 'warning'
                        ? 'bg-warning/10 border border-warning/30'
                        : 'bg-accent/10 border border-accent/30'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${
                        product.status === 'expired' 
                          ? 'bg-destructive text-destructive-foreground'
                          : product.status === 'warning'
                          ? 'bg-warning text-warning-foreground'
                          : 'bg-accent text-accent-foreground'
                      }`}>
                        {product.status === 'expired' ? (
                          <AlertTriangle className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{product.nombre}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {product.fechaVencimiento.toLocaleDateString('es-PE')}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      product.status === 'expired' 
                        ? 'bg-destructive text-destructive-foreground'
                        : product.status === 'warning'
                        ? 'bg-warning text-warning-foreground'
                        : 'bg-accent text-accent-foreground'
                    }`}>
                      {product.status === 'expired' 
                        ? `Venció hace ${Math.abs(product.diasRestantes)}d`
                        : `${product.diasRestantes}d`
                      }
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
