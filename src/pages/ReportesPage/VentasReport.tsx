 import { useMemo } from 'react';
import { TrendingUp, Clock, CalendarDays } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 import { 
   LineChart, 
   Line, 
   XAxis, 
   YAxis, 
   CartesianGrid, 
   Tooltip, 
   ResponsiveContainer,
   BarChart,
   Bar,
  AreaChart,
  Area,
  Cell,
 } from 'recharts';
 import { format } from 'date-fns';
import { es } from 'date-fns/locale';
 import type { SalesByDay, HourlySales } from '@/hooks/useReports';
 
 interface VentasReportProps {
   salesByDay: SalesByDay[];
   hourlySales: HourlySales[];
   summary?: {
     totalSales: number;
     totalOrders: number;
     averageTicket: number;
   };
   isLoading: boolean;
  dateRangeOption: 'today' | 'week' | 'month' | 'custom';
  rangeLabel: string;
 }
 
export function VentasReport({ salesByDay, hourlySales, summary, isLoading, dateRangeOption, rangeLabel }: VentasReportProps) {
   const salesChartData = useMemo(() => 
     salesByDay.map(s => ({
       fecha: format(new Date(s.sale_date), 'dd/MM'),
       total: Number(s.total_sales),
       ordenes: Number(s.total_orders),
     })).reverse(),
     [salesByDay]
   );
 
   const hourlyChartData = useMemo(() => 
     hourlySales.map(h => ({
       hora: `${h.hour}:00`,
       ventas: h.total_sales,
       ordenes: h.total_orders,
     })),
     [hourlySales]
   );

  // Daily sales chart data - format based on date range
  const dailySalesChartData = useMemo(() => {
    return salesByDay.map(s => {
      const date = new Date(s.sale_date + 'T12:00:00');
      let label: string;
      
      if (dateRangeOption === 'today') {
        label = 'Hoy';
      } else if (dateRangeOption === 'week') {
        // Show day name + date for week view
        label = format(date, 'EEE d', { locale: es });
      } else {
        // Show day/month for month and custom
        label = format(date, 'd MMM', { locale: es });
      }
      
      return {
        fecha: label,
        ventas: Number(s.total_sales),
        ordenes: Number(s.total_orders),
      };
    }).reverse();
  }, [salesByDay, dateRangeOption]);

  // Dynamic chart title based on filter
  const chartTitle = useMemo(() => {
    switch (dateRangeOption) {
      case 'today':
        return 'Ventas de Hoy';
      case 'week':
        return 'Ventas de la Semana';
      case 'month':
        return 'Ventas del Mes';
      case 'custom':
        return `Ventas: ${rangeLabel}`;
      default:
        return 'Ventas por Día';
    }
  }, [dateRangeOption, rangeLabel]);

  // Find max hour for highlighting
  const maxHourSales = Math.max(...hourlyChartData.map(h => h.ventas), 0);
 
   const totalVentas = summary?.totalSales || 0;
   const totalOrdenes = summary?.totalOrders || 0;
   const ticketPromedio = summary?.averageTicket || 0;
 
   return (
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
 
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Sales Trend */}
         <Card className="border-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <TrendingUp className="h-5 w-5" />
               Tendencia de Ventas
             </CardTitle>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <Skeleton className="h-[300px]" />
             ) : salesChartData.length === 0 ? (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                 <div className="text-center">
                   <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>No hay datos de ventas para este período</p>
                 </div>
               </div>
             ) : (
               <ResponsiveContainer width="100%" height={300}>
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
                     formatter={(value, name) => [
                       name === 'total' ? `S/ ${value}` : value,
                       name === 'total' ? 'Ventas' : 'Órdenes'
                     ]}
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
 
         {/* Hourly Sales */}
         <Card className="border-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Clock className="h-5 w-5" />
               Ventas por Hora (Hoy)
             </CardTitle>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <Skeleton className="h-[300px]" />
             ) : hourlyChartData.length === 0 ? (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                 <div className="text-center">
                   <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>No hay datos de ventas por hora</p>
                 </div>
               </div>
             ) : (
               <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={hourlyChartData}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis dataKey="hora" fontSize={11} />
                  <YAxis tickFormatter={(value) => `S/${value}`} />
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'hsl(var(--card))', 
                       border: '1px solid hsl(var(--border))',
                       borderRadius: '0.75rem'
                     }}
                    formatter={(value, name) => [
                      name === 'ventas' ? `S/ ${Number(value).toFixed(2)}` : value,
                      name === 'ventas' ? 'Ventas' : 'Órdenes'
                    ]}
                   />
                  <Area 
                    type="monotone" 
                    dataKey="ventas" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorVentas)" 
                  />
                </AreaChart>
               </ResponsiveContainer>
             )}
           </CardContent>
         </Card>
       </div>

      {/* Sales by Day of Week */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px]" />
          ) : dailySalesChartData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos de ventas en este período</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dailySalesChartData}>
                <defs>
                  <linearGradient id="colorBarVentas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
                <XAxis 
                  dataKey="fecha" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  tickFormatter={(value) => `S/${value}`} 
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.75rem'
                  }}
                  formatter={(value, name) => [
                    `S/ ${Number(value).toFixed(2)}`,
                    'Ventas'
                  ]}
                />
                <Bar 
                  dataKey="ventas" 
                  fill="url(#colorBarVentas)" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
     </div>
   );
 }