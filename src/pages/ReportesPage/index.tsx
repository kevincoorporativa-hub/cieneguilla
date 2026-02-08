 import { useState, useMemo } from 'react';
 import { 
   Calendar, 
  CalendarRange,
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
    Image,
    ChefHat,
 } from 'lucide-react';
 import { MainLayout } from '@/components/layout/MainLayout';
 import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
import { exportToExcel, exportToPDF, exportChartsToPDF, ExportData } from '@/utils/exportUtils';
import { toast } from 'sonner';
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
import { format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from 'date-fns';
 import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DateRange as DateRangeType } from 'react-day-picker';
 
 import { VentasReport } from './VentasReport';
 import { ProductosReport } from './ProductosReport';
 import { CategoriasReport } from './CategoriasReport';
 import { CombosReport } from './CombosReport';
 import { DeliveryReport } from './DeliveryReport';
 import { MetodosPagoReport } from './MetodosPagoReport';
 import { RecetasReport } from './RecetasReport';
 import { useRecipeCostReport, useIngredientConsumption, useRecipeProductSales, type RecipeCostData } from '@/hooks/useRecipeCostReport';
 
 type ReportType = 'ventas' | 'productos' | 'categorias' | 'combos' | 'delivery' | 'metodos' | 'recetas';
type DateRangeOption = 'today' | 'week' | 'month' | 'custom';
 
 export default function ReportesPage() {
   const [selectedReport, setSelectedReport] = useState<ReportType>('ventas');
  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('today');
  const [customRange, setCustomRange] = useState<DateRangeType | undefined>(undefined);
  const [calendarOpen, setCalendarOpen] = useState(false);
 
  const now = new Date();

  // Calculate date ranges and labels
  const { dateRanges, rangeLabel } = useMemo(() => {
     const now = new Date();
    let start: string;
    let end: string;
    let label: string;

    switch (dateRangeOption) {
       case 'today':
        start = format(now, 'yyyy-MM-dd');
        end = format(now, 'yyyy-MM-dd');
        label = `Hoy, ${format(now, 'd MMM', { locale: es })}`;
        break;
      case 'week': {
        const weekStart = startOfWeek(now, { locale: es });
        const weekEnd = endOfWeek(now, { locale: es });
        start = format(weekStart, 'yyyy-MM-dd');
        end = format(weekEnd, 'yyyy-MM-dd');
        label = `Semana ${format(weekStart, 'd', { locale: es })} - ${format(weekEnd, 'd MMM', { locale: es })}`;
        break;
      }
      case 'month': {
        const monthStart = startOfMonth(now);
        start = format(monthStart, 'yyyy-MM-dd');
        end = format(now, 'yyyy-MM-dd');
        label = format(now, 'MMMM yyyy', { locale: es });
        // Capitalize first letter
        label = label.charAt(0).toUpperCase() + label.slice(1);
        break;
      }
      case 'custom':
        if (customRange?.from && customRange?.to) {
          start = format(customRange.from, 'yyyy-MM-dd');
          end = format(customRange.to, 'yyyy-MM-dd');
          label = `${format(customRange.from, 'd MMM', { locale: es })} - ${format(customRange.to, 'd MMM', { locale: es })}`;
        } else if (customRange?.from) {
          start = format(customRange.from, 'yyyy-MM-dd');
          end = format(customRange.from, 'yyyy-MM-dd');
          label = format(customRange.from, 'd MMM yyyy', { locale: es });
        } else {
          start = format(now, 'yyyy-MM-dd');
          end = format(now, 'yyyy-MM-dd');
          label = 'Seleccionar fechas';
        }
        break;
     }

    return { dateRanges: { start, end }, rangeLabel: label };
  }, [dateRangeOption, customRange]);

  // For useSalesSummary we need to map custom to a valid option
  const summaryRange = dateRangeOption === 'custom' ? 'month' : dateRangeOption;
 
   // Fetch all data
   const { data: salesByDay = [], isLoading: loadingSales } = useSalesByDay(dateRanges.start, dateRanges.end);
  const { data: topProducts = [], isLoading: loadingProducts } = useTopProducts(dateRanges.start, dateRanges.end);
  const { data: salesByCategory = [], isLoading: loadingCategories } = useSalesByCategory(dateRanges.start, dateRanges.end);
  const { data: summary, isLoading: loadingSummary } = useSalesSummary(summaryRange);
   const { data: topCombos = [], isLoading: loadingCombos } = useTopCombos(dateRanges.start, dateRanges.end);
   const { data: deliverySummary, isLoading: loadingDelivery } = useDeliverySummary(dateRanges.start, dateRanges.end);
  // Hourly sales always shows TODAY's data (current local date)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const { data: hourlySales = [], isLoading: loadingHourly } = useHourlySales(todayStr);
    const { data: paymentMethods = [], isLoading: loadingPayments } = usePaymentMethodsSummary(dateRanges.start, dateRanges.end);
    const { data: recipeCosts = [], isLoading: loadingRecipeCosts } = useRecipeCostReport();
    const { data: ingredientConsumption = [], isLoading: loadingConsumption } = useIngredientConsumption(dateRanges.start, dateRanges.end);
    const { data: recipeProductSales = [], isLoading: loadingRecipeSales } = useRecipeProductSales(dateRanges.start, dateRanges.end);
 
    const isLoading = loadingSales || loadingProducts || loadingCategories || loadingSummary || 
                      loadingCombos || loadingDelivery || loadingHourly || loadingPayments || 
                      loadingRecipeCosts || loadingConsumption || loadingRecipeSales;
 
   const totalVentas = summary?.totalSales || 0;
 
   const getExportData = (): ExportData => {
    const dateLabel = rangeLabel;
 
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
      case 'productos': {
         const recipeCostMapExport: Record<string, RecipeCostData> = {};
         for (const rc of recipeCosts) recipeCostMapExport[rc.product_id] = rc;
         const hasRecipes = recipeCosts.length > 0;
         return {
           title: 'Reporte de Productos Más Vendidos',
           subtitle: `Período: ${dateLabel}`,
           headers: hasRecipes
             ? ['#', 'Producto', 'Cantidad', 'Total (S/)', 'Costo Insumos (S/)', 'Ganancia (S/)', 'Margen %']
             : ['#', 'Producto', 'Cantidad', 'Total (S/)'],
           rows: topProducts.map((p, i) => {
             const rc = recipeCostMapExport[p.product_id];
             const cost = rc ? Number(rc.recipe_cost) * Number(p.total_quantity) : 0;
             const profit = Number(p.total_sales) - cost;
             const margin = Number(p.total_sales) > 0 ? (profit / Number(p.total_sales) * 100) : 0;
             return hasRecipes
               ? [i + 1, p.product_name, p.total_quantity, Number(p.total_sales).toFixed(2), cost.toFixed(2), profit.toFixed(2), `${margin.toFixed(1)}%`]
               : [i + 1, p.product_name, p.total_quantity, Number(p.total_sales).toFixed(2)];
           })
         };
      }
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
        case 'recetas':
          return {
            title: 'Rentabilidad por Receta — Ventas Reales',
            subtitle: `Período: ${dateLabel}`,
            headers: ['Producto', 'Uds. Vendidas', 'Ingresos (S/)', 'Costo Insumos (S/)', 'Ganancia (S/)', 'Margen %'],
            rows: recipeProductSales.length > 0
              ? recipeProductSales.map(rs => [
                  rs.product_name,
                  rs.units_sold,
                  rs.total_revenue.toFixed(2),
                  rs.total_recipe_cost.toFixed(2),
                  rs.total_profit.toFixed(2),
                  `${rs.margin_percent.toFixed(1)}%`,
                ])
              : recipeCosts.map(rc => [
                  rc.product_name,
                  '-',
                  Number(rc.base_price).toFixed(2),
                  Number(rc.recipe_cost).toFixed(2),
                  Number(rc.profit).toFixed(2),
                  `${Number(rc.margin_percent).toFixed(1)}%`,
                ])
          };
        default:
          return { title: 'Reporte', headers: [], rows: [] };
     }
   };
 
   const handleExportExcel = () => {
     const data = getExportData();
    exportToExcel(data, `reporte_${selectedReport}_${dateRangeOption}`);
   };
 
   const handleExportPDF = () => {
     const data = getExportData();
    exportToPDF(data, `reporte_${selectedReport}_${dateRangeOption}`);
   };

  const handleExportChartsPDF = async () => {
    toast.loading('Generando PDF de gráficos...', { id: 'export-charts' });
    try {
       const reportTitles: Record<ReportType, string> = {
         ventas: 'Reporte de Ventas',
         productos: 'Productos Más Vendidos',
         categorias: 'Ventas por Categoría',
         combos: 'Combos Más Vendidos',
         delivery: 'Reporte de Delivery',
         metodos: 'Métodos de Pago',
         recetas: 'Rentabilidad por Receta',
       };
      
      await exportChartsToPDF(
        '#report-charts-container',
        reportTitles[selectedReport],
        `Período: ${rangeLabel}`,
        `graficos_${selectedReport}_${dateRangeOption}`
      );
      toast.success('PDF de gráficos generado correctamente', { id: 'export-charts' });
    } catch (error) {
      toast.error('Error al generar el PDF', { id: 'export-charts' });
    }
  };
 
    const reportTabs = [
      { id: 'ventas', label: 'Ventas', icon: DollarSign },
      { id: 'productos', label: 'Productos', icon: Package },
      { id: 'categorias', label: 'Categorías', icon: PieChart },
      { id: 'combos', label: 'Combos', icon: Gift },
      { id: 'delivery', label: 'Delivery', icon: Truck },
      { id: 'metodos', label: 'Pagos', icon: CreditCard },
      { id: 'recetas', label: 'Recetas', icon: ChefHat },
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
            <Select value={dateRangeOption} onValueChange={(v) => {
              setDateRangeOption(v as DateRangeOption);
              if (v === 'custom') {
                setCalendarOpen(true);
              }
            }}>
              <SelectTrigger className="w-56 h-12">
                 <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder={rangeLabel}>{rangeLabel}</SelectValue>
               </SelectTrigger>
               <SelectContent>
                <SelectItem value="today">Hoy, {format(now, 'd MMM', { locale: es })}</SelectItem>
                <SelectItem value="week">
                  Semana {format(startOfWeek(now, { locale: es }), 'd', { locale: es })} - {format(endOfWeek(now, { locale: es }), 'd MMM', { locale: es })}
                </SelectItem>
                <SelectItem value="month">
                  {format(now, 'MMMM yyyy', { locale: es }).replace(/^\w/, c => c.toUpperCase())}
                </SelectItem>
                <SelectItem value="custom">
                  <CalendarRange className="h-4 w-4 mr-2 inline" />
                  Rango personalizado
                </SelectItem>
               </SelectContent>
             </Select>

            {/* Custom Date Range Popover */}
            {dateRangeOption === 'custom' && (
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-12">
                    <CalendarRange className="h-4 w-4 mr-2" />
                    {customRange?.from ? (
                      customRange.to ? (
                        `${format(customRange.from, 'd MMM', { locale: es })} - ${format(customRange.to, 'd MMM', { locale: es })}`
                      ) : (
                        format(customRange.from, 'd MMM yyyy', { locale: es })
                      )
                    ) : (
                      'Seleccionar fechas'
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarComponent
                    mode="range"
                    selected={customRange}
                    onSelect={(range) => {
                      setCustomRange(range);
                      if (range?.from && range?.to) {
                        setCalendarOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    locale={es}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            )}
             
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
                 <DropdownMenuItem onClick={handleExportChartsPDF} className="cursor-pointer">
                   <Image className="h-4 w-4 mr-2 text-primary" />
                   Descargar Gráficos (PDF)
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
         </div>
 
         {/* Report Type Selector */}
         <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 sm:gap-4">
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
         <div id="report-charts-container">
         {selectedReport === 'ventas' && (
           <VentasReport 
             salesByDay={salesByDay}
             hourlySales={hourlySales}
             summary={summary}
             isLoading={isLoading}
            dateRangeOption={dateRangeOption}
            rangeLabel={rangeLabel}
           />
         )}
 
         {selectedReport === 'productos' && (
          <ProductosReport 
             topProducts={topProducts}
             recipeCosts={recipeCosts}
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

          {selectedReport === 'recetas' && (
            <RecetasReport
              recipeCosts={recipeCosts}
              ingredientConsumption={ingredientConsumption}
              recipeProductSales={recipeProductSales}
              isLoading={isLoading}
            />
          )}
          </div>
       </div>
     </MainLayout>
   );
 }