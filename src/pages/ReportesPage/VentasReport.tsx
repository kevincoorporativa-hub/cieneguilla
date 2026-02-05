 import { useMemo } from 'react';
 import { TrendingUp, Clock } from 'lucide-react';
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
 } from 'recharts';
 import { format } from 'date-fns';
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
                 <BarChart data={hourlyChartData}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis dataKey="hora" fontSize={11} />
                   <YAxis />
                   <Tooltip 
                     contentStyle={{ 
                       backgroundColor: 'hsl(var(--card))', 
                       border: '1px solid hsl(var(--border))',
                       borderRadius: '0.75rem'
                     }}
                     formatter={(value) => [`S/ ${value}`, 'Ventas']}
                   />
                   <Bar dataKey="ventas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             )}
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }