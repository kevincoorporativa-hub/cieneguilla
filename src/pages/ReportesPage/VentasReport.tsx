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
 }
 
 export function VentasReport({ salesByDay, hourlySales, summary, isLoading }: VentasReportProps) {
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

  // Group sales by day of week
  const salesByDayOfWeek = useMemo(() => {
    const daysOfWeek = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const dayTotals: Record<number, { ventas: number; ordenes: number }> = {};
    
    // Initialize all days
    for (let i = 0; i < 7; i++) {
      dayTotals[i] = { ventas: 0, ordenes: 0 };
    }
    
    // Aggregate by day of week
    for (const day of salesByDay) {
      const date = new Date(day.sale_date + 'T12:00:00'); // Add time to avoid timezone issues
      const dayOfWeek = date.getDay();
      dayTotals[dayOfWeek].ventas += Number(day.total_sales);
      dayTotals[dayOfWeek].ordenes += Number(day.total_orders);
    }
    
    return daysOfWeek.map((name, index) => ({
      dia: name,
      ventas: dayTotals[index].ventas,
      ordenes: dayTotals[index].ordenes,
    }));
  }, [salesByDay]);

  // Colors for bars
  const barColors = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#fdba74', '#fb923c', '#f97316'];

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
            Ventas por Día de la Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[250px]" />
          ) : salesByDay.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos de ventas en este período</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={salesByDayOfWeek} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
                <XAxis type="number" tickFormatter={(value) => `S/${value}`} />
                <YAxis type="category" dataKey="dia" width={40} />
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
                <Bar dataKey="ventas" radius={[0, 4, 4, 0]}>
                  {salesByDayOfWeek.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
     </div>
   );
 }