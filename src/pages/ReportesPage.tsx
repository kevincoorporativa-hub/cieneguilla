import { useState, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Calendar, 
  DollarSign, 
  Package, 
  Truck, 
  TrendingUp,
  BarChart3,
  PieChart,
  Scale,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPie,
  Pie,
  Cell,
} from 'recharts';
import { exportToExcel, exportToPDF, ExportData } from '@/utils/exportUtils';
import { 
  useSalesByDay, 
  useTopProducts, 
  useSalesByCategory, 
  useSalesSummary 
} from '@/hooks/useReports';
import { format, subDays, startOfWeek, startOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const categoryColors = [
  'hsl(24, 95%, 53%)',
  'hsl(215, 25%, 27%)',
  'hsl(38, 92%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(220, 15%, 70%)',
];

type ReportType = 'ventas' | 'productos' | 'categorias' | 'delivery' | 'caja' | 'cuadre';
type DateRange = 'today' | 'week' | 'month';

export default function ReportesPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('ventas');
  const [dateRange, setDateRange] = useState<DateRange>('today');

  // Calculate date ranges
  const dateRanges = useMemo(() => {
    const now = new Date();
    switch (dateRange) {
      case 'today':
        return { start: format(now, 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'week':
        return { start: format(startOfWeek(now, { locale: es }), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
      case 'month':
        return { start: format(startOfMonth(now), 'yyyy-MM-dd'), end: format(now, 'yyyy-MM-dd') };
    }
  }, [dateRange]);

  // Fetch data from Supabase
  const { data: salesByDay = [], isLoading: loadingSales } = useSalesByDay(dateRanges.start, dateRanges.end);
  const { data: topProducts = [], isLoading: loadingProducts } = useTopProducts();
  const { data: salesByCategory = [], isLoading: loadingCategories } = useSalesByCategory();
  const { data: summary, isLoading: loadingSummary } = useSalesSummary(dateRange);

  // Transform data for charts
  const salesChartData = useMemo(() => 
    salesByDay.map(s => ({
      fecha: format(new Date(s.sale_date), 'dd/MM'),
      total: Number(s.total_sales),
    })).reverse(),
    [salesByDay]
  );

  const categoryChartData = useMemo(() => 
    salesByCategory.map(c => ({
      categoria: c.category_name,
      total: Number(c.total_sales),
      cantidad: Number(c.total_quantity),
    })),
    [salesByCategory]
  );

  const productChartData = useMemo(() => 
    topProducts.map(p => ({
      nombre: p.product_name.length > 15 ? p.product_name.slice(0, 15) + '...' : p.product_name,
      fullName: p.product_name,
      cantidad: Number(p.total_quantity),
      total: Number(p.total_sales),
    })),
    [topProducts]
  );

  const totalVentas = summary?.totalSales || 0;
  const totalOrdenes = summary?.totalOrders || 0;
  const ticketPromedio = summary?.averageTicket || 0;

  const getExportData = (): ExportData => {
    const dateLabel = dateRange === 'today' ? 'Hoy' : 
                      dateRange === 'week' ? 'Esta semana' : 'Este mes';

    switch (selectedReport) {
      case 'ventas':
        return {
          title: 'Reporte de Ventas',
          subtitle: `Período: ${dateLabel}`,
          headers: ['Fecha', 'Total Ventas (S/)'],
          rows: salesByDay.map(v => [
            format(new Date(v.sale_date), 'dd/MM/yyyy'),
            Number(v.total_sales).toFixed(2)
          ])
        };
      case 'productos':
        return {
          title: 'Reporte de Productos Más Vendidos',
          subtitle: `Período: ${dateLabel}`,
          headers: ['#', 'Producto', 'Cantidad', 'Total (S/)'],
          rows: topProducts.map((p, i) => [
            i + 1, 
            p.product_name, 
            p.total_quantity, 
            Number(p.total_sales).toFixed(2)
          ])
        };
      case 'categorias':
        return {
          title: 'Reporte de Ventas por Categoría',
          subtitle: `Período: ${dateLabel}`,
          headers: ['Categoría', 'Cantidad', 'Total (S/)', '% del Total'],
          rows: salesByCategory.map(c => [
            c.category_name, 
            c.total_quantity, 
            Number(c.total_sales).toFixed(2),
            totalVentas > 0 ? ((Number(c.total_sales) / totalVentas) * 100).toFixed(1) + '%' : '0%'
          ])
        };
      default:
        return {
          title: 'Reporte',
          headers: [],
          rows: []
        };
    }
  };

  const handleExportExcel = () => {
    const data = getExportData();
    exportToExcel(data, `reporte_${selectedReport}_${dateRange}`);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    exportToPDF(data, `reporte_${selectedReport}_${dateRange}`);
  };

  const isLoading = loadingSales || loadingProducts || loadingCategories || loadingSummary;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Reportes</h1>
            <p className="text-muted-foreground">Análisis y estadísticas del negocio</p>
          </div>
          <div className="flex gap-3">
            <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
              <SelectTrigger className="w-48 h-12">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mes</SelectItem>
              </SelectContent>
            </Select>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="btn-pos">
                  <Download className="h-5 w-5 mr-2" />
                  Exportar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={handleExportExcel} className="cursor-pointer">
                  <FileSpreadsheet className="h-4 w-4 mr-2 text-success" />
                  Exportar a Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                  <FileDown className="h-4 w-4 mr-2 text-destructive" />
                  Exportar a PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { id: 'ventas', label: 'Ventas', icon: DollarSign },
            { id: 'productos', label: 'Productos', icon: Package },
            { id: 'categorias', label: 'Categorías', icon: PieChart },
            { id: 'caja', label: 'Caja', icon: BarChart3 },
          ].map((report) => (
            <Button
              key={report.id}
              variant={selectedReport === report.id ? 'default' : 'outline'}
              className={`btn-pos flex-col h-20 ${
                selectedReport === report.id ? 'bg-primary' : ''
              }`}
              onClick={() => setSelectedReport(report.id as ReportType)}
            >
              <report.icon className="h-6 w-6 mb-1" />
              {report.label}
            </Button>
          ))}
        </div>

        {/* Report Content */}
        {selectedReport === 'ventas' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </>
              ) : (
                <>
                  <Card className="border-2 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">S/ {totalVentas.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Total ventas</p>
                    </div>
                  </Card>
                  <Card className="border-2 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-success">{totalOrdenes}</p>
                      <p className="text-sm text-muted-foreground">Tickets generados</p>
                    </div>
                  </Card>
                  <Card className="border-2 p-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-secondary">S/ {ticketPromedio.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">Ticket promedio</p>
                    </div>
                  </Card>
                </>
              )}
            </div>

            {/* Chart */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Tendencia de Ventas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[350px]" />
                ) : salesChartData.length === 0 ? (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay datos de ventas para este período</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={salesChartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="fecha" />
                      <YAxis />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.75rem'
                        }}
                        formatter={(value) => [`S/ ${value}`, 'Ventas']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedReport === 'productos' && (
          <div className="grid grid-cols-2 gap-6">
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
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-10" />
                    ))}
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
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topProducts.map((product, index) => (
                        <TableRow key={product.product_id}>
                          <TableCell className="font-bold">{index + 1}</TableCell>
                          <TableCell className="font-semibold">{product.product_name}</TableCell>
                          <TableCell>{product.total_quantity}</TableCell>
                          <TableCell className="font-bold text-primary">
                            S/ {Number(product.total_sales).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
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
        )}

        {selectedReport === 'categorias' && (
          <div className="grid grid-cols-2 gap-6">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Ventas por Categoría
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : categoryChartData.length === 0 ? (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <p>No hay datos</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPie>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="total"
                        nameKey="categoria"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`S/ ${value}`, 'Total']} />
                    </RechartsPie>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Detalle por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : categoryChartData.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <p>No hay datos de categorías</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {categoryChartData.map((cat, index) => (
                      <div key={cat.categoria} className="flex items-center gap-4">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                        />
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <span className="font-semibold">{cat.categoria}</span>
                            <span className="font-bold text-primary">S/ {cat.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{cat.cantidad} unidades vendidas</span>
                            <span>
                              {totalVentas > 0 ? ((cat.total / totalVentas) * 100).toFixed(1) : 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {selectedReport === 'caja' && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">
              Los reportes de caja se encuentran en la sección de Control de Caja
            </p>
            <Button className="mt-4" variant="outline" onClick={() => window.location.href = '/caja'}>
              Ir a Control de Caja
            </Button>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
