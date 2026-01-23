import { useState } from 'react';
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
  ComposedChart,
  Legend
} from 'recharts';
import { exportToExcel, exportToPDF, ExportData } from '@/utils/exportUtils';

const ventasDiarias = [
  { fecha: '13/01', total: 1250 },
  { fecha: '14/01', total: 980 },
  { fecha: '15/01', total: 1100 },
  { fecha: '16/01', total: 1400 },
  { fecha: '17/01', total: 1850 },
];

const ventasPorCategoria = [
  { categoria: 'Pizzas', total: 4500, cantidad: 145 },
  { categoria: 'Cervezas', total: 2560, cantidad: 320 },
  { categoria: 'Carnes', total: 2475, cantidad: 45 },
  { categoria: 'Gaseosas', total: 1260, cantidad: 180 },
  { categoria: 'Vinos', total: 900, cantidad: 20 },
];

const productosMasVendidos = [
  { nombre: 'Pizza Pepperoni', cantidad: 145, total: 4640 },
  { nombre: 'Cerveza Pilsen', cantidad: 320, total: 2560 },
  { nombre: 'Pizza Hawaiana', cantidad: 98, total: 3430 },
  { nombre: 'Costillas BBQ', cantidad: 45, total: 2475 },
  { nombre: 'Coca Cola 1L', cantidad: 180, total: 1260 },
];

const deliveryStats = [
  { repartidor: 'Pedro Ruiz', entregas: 25, tiempoPromedio: '28 min' },
  { repartidor: 'Luis Gómez', entregas: 18, tiempoPromedio: '32 min' },
  { repartidor: 'Juan Pérez', entregas: 15, tiempoPromedio: '25 min' },
];

// Datos de compras vs ventas
const comprasVsVentas = [
  { fecha: '13/01', compras: 450, ventas: 1250, ganancia: 800 },
  { fecha: '14/01', compras: 320, ventas: 980, ganancia: 660 },
  { fecha: '15/01', compras: 580, ventas: 1100, ganancia: 520 },
  { fecha: '16/01', compras: 410, ventas: 1400, ganancia: 990 },
  { fecha: '17/01', compras: 650, ventas: 1850, ganancia: 1200 },
];

const detalleCompras = [
  { fecha: '17/01', proveedor: 'Distribuidora Lima', producto: 'Cerveza Pilsen x24', cantidad: 10, monto: 280 },
  { fecha: '17/01', proveedor: 'Coca Cola Perú', producto: 'Gaseosas variadas', cantidad: 50, monto: 175 },
  { fecha: '16/01', proveedor: 'Molino El Sol', producto: 'Harina para pizza', cantidad: 5, monto: 125 },
  { fecha: '16/01', proveedor: 'Frigorífico Norte', producto: 'Carnes premium', cantidad: 20, monto: 580 },
  { fecha: '15/01', proveedor: 'Lácteos del Sur', producto: 'Queso mozzarella', cantidad: 15, monto: 320 },
];

const categoryColors = [
  'hsl(24, 95%, 53%)',
  'hsl(215, 25%, 27%)',
  'hsl(38, 92%, 50%)',
  'hsl(142, 76%, 36%)',
  'hsl(220, 15%, 70%)',
];

type ReportType = 'ventas' | 'productos' | 'categorias' | 'delivery' | 'caja' | 'cuadre';

export default function ReportesPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>('ventas');
  const [dateRange, setDateRange] = useState('hoy');

  const totalVentas = ventasDiarias.reduce((sum, d) => sum + d.total, 0);
  const totalCompras = comprasVsVentas.reduce((sum, d) => sum + d.compras, 0);
  const totalGanancia = comprasVsVentas.reduce((sum, d) => sum + d.ganancia, 0);
  const rentabilidad = ((totalGanancia / totalVentas) * 100).toFixed(1);

  const getExportData = (): ExportData => {
    const dateLabel = dateRange === 'hoy' ? 'Hoy' : 
                      dateRange === 'semana' ? 'Esta semana' : 
                      dateRange === 'mes' ? 'Este mes' : 'Último trimestre';

    switch (selectedReport) {
      case 'ventas':
        return {
          title: 'Reporte de Ventas',
          subtitle: `Período: ${dateLabel}`,
          headers: ['Fecha', 'Total Ventas (S/)'],
          rows: ventasDiarias.map(v => [v.fecha, v.total.toFixed(2)])
        };
      case 'productos':
        return {
          title: 'Reporte de Productos Más Vendidos',
          subtitle: `Período: ${dateLabel}`,
          headers: ['#', 'Producto', 'Cantidad', 'Total (S/)'],
          rows: productosMasVendidos.map((p, i) => [i + 1, p.nombre, p.cantidad, p.total.toFixed(2)])
        };
      case 'categorias':
        return {
          title: 'Reporte de Ventas por Categoría',
          subtitle: `Período: ${dateLabel}`,
          headers: ['Categoría', 'Cantidad', 'Total (S/)', '% del Total'],
          rows: ventasPorCategoria.map(c => [
            c.categoria, 
            c.cantidad, 
            c.total.toFixed(2),
            ((c.total / totalVentas) * 100).toFixed(1) + '%'
          ])
        };
      case 'delivery':
        return {
          title: 'Reporte de Delivery',
          subtitle: `Período: ${dateLabel}`,
          headers: ['Repartidor', 'Entregas', 'Tiempo Promedio', 'Eficiencia'],
          rows: deliveryStats.map(d => [d.repartidor, d.entregas, d.tiempoPromedio, 'Excelente'])
        };
      case 'caja':
        return {
          title: 'Reporte de Caja por Método de Pago',
          subtitle: `Período: ${dateLabel}`,
          headers: ['Método de Pago', 'Total (S/)'],
          rows: [
            ['Efectivo', '4,250.00'],
            ['Yape', '1,450.00'],
            ['Plin', '820.00'],
            ['Transferencia', '480.00'],
          ]
        };
      case 'cuadre':
        return {
          title: 'Reporte de Cuadre - Compras vs Ventas',
          subtitle: `Período: ${dateLabel}`,
          headers: ['Fecha', 'Compras (S/)', 'Ventas (S/)', 'Ganancia (S/)', 'Rentabilidad'],
          rows: [
            ...comprasVsVentas.map(c => [
              c.fecha, 
              c.compras.toFixed(2), 
              c.ventas.toFixed(2), 
              c.ganancia.toFixed(2),
              ((c.ganancia / c.ventas) * 100).toFixed(1) + '%'
            ]),
            ['TOTAL', totalCompras.toFixed(2), totalVentas.toFixed(2), totalGanancia.toFixed(2), rentabilidad + '%']
          ]
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
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-48 h-12">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
                <SelectItem value="trimestre">Último trimestre</SelectItem>
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
        <div className="grid grid-cols-6 gap-4">
          {[
            { id: 'ventas', label: 'Ventas', icon: DollarSign },
            { id: 'productos', label: 'Productos', icon: Package },
            { id: 'categorias', label: 'Categorías', icon: PieChart },
            { id: 'delivery', label: 'Delivery', icon: Truck },
            { id: 'caja', label: 'Caja', icon: BarChart3 },
            { id: 'cuadre', label: 'Cuadre', icon: Scale },
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
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">S/ {totalVentas.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total ventas</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">148</p>
                  <p className="text-sm text-muted-foreground">Tickets generados</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">S/ 45.27</p>
                  <p className="text-sm text-muted-foreground">Ticket promedio</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">+12.5%</p>
                  <p className="text-sm text-muted-foreground">vs período anterior</p>
                </div>
              </Card>
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
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={ventasDiarias}>
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
                    {productosMasVendidos.map((product, index) => (
                      <TableRow key={product.nombre}>
                        <TableCell className="font-bold">{index + 1}</TableCell>
                        <TableCell className="font-semibold">{product.nombre}</TableCell>
                        <TableCell>{product.cantidad}</TableCell>
                        <TableCell className="font-bold text-primary">S/ {product.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Gráfico de Ventas por Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={productosMasVendidos} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" />
                    <YAxis dataKey="nombre" type="category" width={120} fontSize={12} />
                    <Tooltip formatter={(value) => [`${value} unidades`, 'Cantidad']} />
                    <Bar dataKey="cantidad" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
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
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPie>
                    <Pie
                      data={ventasPorCategoria}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="total"
                      nameKey="categoria"
                    >
                      {ventasPorCategoria.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={categoryColors[index % categoryColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`S/ ${value}`, 'Total']} />
                  </RechartsPie>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Detalle por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ventasPorCategoria.map((cat, index) => (
                    <div key={cat.categoria} className="flex items-center gap-4">
                      <div 
                        className="w-4 h-4 rounded-full" 
                        style={{ backgroundColor: categoryColors[index] }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <span className="font-semibold">{cat.categoria}</span>
                          <span className="font-bold text-primary">S/ {cat.total.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{cat.cantidad} unidades vendidas</span>
                          <span>{((cat.total / totalVentas) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedReport === 'delivery' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">58</p>
                  <p className="text-sm text-muted-foreground">Entregas totales</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">28 min</p>
                  <p className="text-sm text-muted-foreground">Tiempo promedio</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">S/ 2,850.00</p>
                  <p className="text-sm text-muted-foreground">Ventas delivery</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">98%</p>
                  <p className="text-sm text-muted-foreground">Entregas a tiempo</p>
                </div>
              </Card>
            </div>

            {/* Drivers Performance */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Rendimiento de Repartidores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Repartidor</TableHead>
                      <TableHead>Entregas</TableHead>
                      <TableHead>Tiempo Promedio</TableHead>
                      <TableHead>Eficiencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveryStats.map((driver) => (
                      <TableRow key={driver.repartidor}>
                        <TableCell className="font-semibold">{driver.repartidor}</TableCell>
                        <TableCell>{driver.entregas}</TableCell>
                        <TableCell>{driver.tiempoPromedio}</TableCell>
                        <TableCell>
                          <span className="px-3 py-1 rounded-full text-sm font-semibold bg-success/10 text-success">
                            Excelente
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedReport === 'caja' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">S/ 4,250.00</p>
                  <p className="text-sm text-muted-foreground">💵 Efectivo</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">S/ 1,450.00</p>
                  <p className="text-sm text-muted-foreground">📱 Yape</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">S/ 820.00</p>
                  <p className="text-sm text-muted-foreground">📱 Plin</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">S/ 480.00</p>
                  <p className="text-sm text-muted-foreground">🏦 Transferencia</p>
                </div>
              </Card>
            </div>

            <Card className="border-2">
              <CardHeader>
                <CardTitle>Distribución por Método de Pago</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={[
                    { metodo: 'Efectivo', total: 4250 },
                    { metodo: 'Yape', total: 1450 },
                    { metodo: 'Plin', total: 820 },
                    { metodo: 'Transferencia', total: 480 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="metodo" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`S/ ${value}`, 'Total']} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* NUEVO: Reporte de Cuadre - Compras vs Ventas */}
        {selectedReport === 'cuadre' && (
          <div className="space-y-6">
            {/* Stats principales */}
            <div className="grid grid-cols-5 gap-4">
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-destructive">S/ {totalCompras.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Compras</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">S/ {totalVentas.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-success">S/ {totalGanancia.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">Ganancia Bruta</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-warning">{rentabilidad}%</p>
                  <p className="text-sm text-muted-foreground">Rentabilidad</p>
                </div>
              </Card>
              <Card className="border-2 p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-secondary">{detalleCompras.length}</p>
                  <p className="text-sm text-muted-foreground">Compras Realizadas</p>
                </div>
              </Card>
            </div>

            {/* Gráfico Compras vs Ventas */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  Compras vs Ventas por Día
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={comprasVsVentas}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.75rem'
                      }}
                      formatter={(value: number, name: string) => [
                        `S/ ${value.toFixed(2)}`, 
                        name === 'compras' ? 'Compras' : name === 'ventas' ? 'Ventas' : 'Ganancia'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="compras" name="Compras" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="ventas" name="Ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="hsl(var(--success))" strokeWidth={3} dot={{ fill: 'hsl(var(--success))' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tablas de detalle */}
            <div className="grid grid-cols-2 gap-6">
              {/* Resumen diario */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Resumen Diario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Compras</TableHead>
                        <TableHead>Ventas</TableHead>
                        <TableHead>Ganancia</TableHead>
                        <TableHead>%</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {comprasVsVentas.map((row) => (
                        <TableRow key={row.fecha}>
                          <TableCell className="font-semibold">{row.fecha}</TableCell>
                          <TableCell className="text-destructive">S/ {row.compras.toFixed(2)}</TableCell>
                          <TableCell className="text-primary">S/ {row.ventas.toFixed(2)}</TableCell>
                          <TableCell className="text-success font-bold">S/ {row.ganancia.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                              {((row.ganancia / row.ventas) * 100).toFixed(0)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/50 font-bold">
                        <TableCell>TOTAL</TableCell>
                        <TableCell className="text-destructive">S/ {totalCompras.toFixed(2)}</TableCell>
                        <TableCell className="text-primary">S/ {totalVentas.toFixed(2)}</TableCell>
                        <TableCell className="text-success">S/ {totalGanancia.toFixed(2)}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                            {rentabilidad}%
                          </span>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Detalle de compras */}
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Detalle de Compras
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Producto</TableHead>
                        <TableHead>Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detalleCompras.map((compra, index) => (
                        <TableRow key={index}>
                          <TableCell>{compra.fecha}</TableCell>
                          <TableCell className="font-semibold">{compra.proveedor}</TableCell>
                          <TableCell className="text-sm">{compra.producto}</TableCell>
                          <TableCell className="font-bold text-destructive">S/ {compra.monto.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
