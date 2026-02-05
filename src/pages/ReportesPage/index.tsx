 import { useState, useMemo } from 'react';
 import { 
   Calendar, 
   DollarSign, 
   Package, 
   Truck, 
   BarChart3,
   PieChart,
   CreditCard,
   Gift,
   Download,
   FileSpreadsheet,
   FileDown,
   Clock,
 } from 'lucide-react';
 import { MainLayout } from '@/components/layout/MainLayout';
 import { Button } from '@/components/ui/button';
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from '@/components/ui/select';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 import { exportToExcel, exportToPDF, ExportData } from '@/utils/exportUtils';
 import { 
   useSalesByDay, 
   useTopProducts, 
   useSalesByCategory, 
   useSalesSummary,
   useTopCombos,
   useDeliverySummary,
   useHourlySales,
   usePaymentMethodsSummary,
 } from '@/hooks/useReports';
 import { format, startOfWeek, startOfMonth } from 'date-fns';
 import { es } from 'date-fns/locale';
 
 import { VentasReport } from './VentasReport';
 import { ProductosReport } from './ProductosReport';
 import { CategoriasReport } from './CategoriasReport';
 import { CombosReport } from './CombosReport';
 import { DeliveryReport } from './DeliveryReport';
 import { MetodosPagoReport } from './MetodosPagoReport';
 
 type ReportType = 'ventas' | 'productos' | 'categorias' | 'combos' | 'delivery' | 'metodos';
 type DateRange = 'today' | 'week' | 'month';
 
 export default function ReportesPage() {
   const [selectedReport, setSelectedReport] = useState<ReportType>('ventas');
   const [dateRange, setDateRange] = useState<DateRange>('today');
 
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
 
   // Fetch all data
   const { data: salesByDay = [], isLoading: loadingSales } = useSalesByDay(dateRanges.start, dateRanges.end);
  const { data: topProducts = [], isLoading: loadingProducts } = useTopProducts(dateRanges.start, dateRanges.end);
  const { data: salesByCategory = [], isLoading: loadingCategories } = useSalesByCategory(dateRanges.start, dateRanges.end);
   const { data: summary, isLoading: loadingSummary } = useSalesSummary(dateRange);
   const { data: topCombos = [], isLoading: loadingCombos } = useTopCombos(dateRanges.start, dateRanges.end);
   const { data: deliverySummary, isLoading: loadingDelivery } = useDeliverySummary(dateRanges.start, dateRanges.end);
  // Hourly sales always shows TODAY's data (current local date)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: hourlySales = [], isLoading: loadingHourly } = useHourlySales(todayStr);
   const { data: paymentMethods = [], isLoading: loadingPayments } = usePaymentMethodsSummary(dateRanges.start, dateRanges.end);
 
   const isLoading = loadingSales || loadingProducts || loadingCategories || loadingSummary || 
                     loadingCombos || loadingDelivery || loadingHourly || loadingPayments;
 
   const totalVentas = summary?.totalSales || 0;
 
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
       case 'combos':
         return {
           title: 'Reporte de Combos Más Vendidos',
           subtitle: `Período: ${dateLabel}`,
           headers: ['#', 'Combo', 'Cantidad', 'Total (S/)'],
           rows: topCombos.map((c, i) => [
             i + 1, 
             c.combo_name, 
             c.total_quantity, 
             Number(c.total_sales).toFixed(2)
           ])
         };
       case 'delivery':
         return {
           title: 'Reporte de Delivery',
           subtitle: `Período: ${dateLabel}`,
           headers: ['Métrica', 'Valor'],
           rows: [
             ['Total Pedidos', deliverySummary?.total_orders || 0],
             ['Ventas Totales', `S/ ${(deliverySummary?.total_sales || 0).toFixed(2)}`],
             ['Ticket Promedio', `S/ ${(deliverySummary?.average_ticket || 0).toFixed(2)}`],
             ['Completados', deliverySummary?.completed_orders || 0],
             ['Cancelados', deliverySummary?.cancelled_orders || 0],
           ]
         };
       case 'metodos':
         return {
           title: 'Reporte por Método de Pago',
           subtitle: `Período: ${dateLabel}`,
           headers: ['Método', 'Transacciones', 'Total (S/)'],
           rows: paymentMethods.map(m => [
             m.method, 
             m.payment_count, 
             Number(m.total_amount).toFixed(2)
           ])
         };
       default:
         return { title: 'Reporte', headers: [], rows: [] };
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
 
   const reportTabs = [
     { id: 'ventas', label: 'Ventas', icon: DollarSign },
     { id: 'productos', label: 'Productos', icon: Package },
     { id: 'categorias', label: 'Categorías', icon: PieChart },
     { id: 'combos', label: 'Combos', icon: Gift },
     { id: 'delivery', label: 'Delivery', icon: Truck },
     { id: 'metodos', label: 'Pagos', icon: CreditCard },
   ];
 
   return (
     <MainLayout>
       <div className="space-y-6">
         {/* Header */}
         <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
         <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
           {reportTabs.map((report) => (
             <Button
               key={report.id}
               variant={selectedReport === report.id ? 'default' : 'outline'}
               className={`btn-pos flex-col h-16 sm:h-20 text-xs sm:text-sm ${
                 selectedReport === report.id ? 'bg-primary' : ''
               }`}
               onClick={() => setSelectedReport(report.id as ReportType)}
             >
               <report.icon className="h-5 w-5 sm:h-6 sm:w-6 mb-1" />
               {report.label}
             </Button>
           ))}
         </div>
 
         {/* Report Content */}
         {selectedReport === 'ventas' && (
           <VentasReport 
             salesByDay={salesByDay}
             hourlySales={hourlySales}
             summary={summary}
             isLoading={isLoading}
           />
         )}
 
         {selectedReport === 'productos' && (
           <ProductosReport 
             topProducts={topProducts}
             isLoading={isLoading}
           />
         )}
 
         {selectedReport === 'categorias' && (
           <CategoriasReport 
             salesByCategory={salesByCategory}
             totalVentas={totalVentas}
             isLoading={isLoading}
           />
         )}
 
         {selectedReport === 'combos' && (
           <CombosReport 
             topCombos={topCombos}
             isLoading={isLoading}
           />
         )}
 
         {selectedReport === 'delivery' && (
           <DeliveryReport 
             deliverySummary={deliverySummary}
             isLoading={isLoading}
           />
         )}
 
         {selectedReport === 'metodos' && (
           <MetodosPagoReport 
             paymentMethods={paymentMethods}
             isLoading={isLoading}
           />
         )}
       </div>
     </MainLayout>
   );
 }