 import { Truck, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Progress } from '@/components/ui/progress';
 import type { DeliverySummary } from '@/hooks/useReports';
 
 interface DeliveryReportProps {
   deliverySummary?: DeliverySummary;
   isLoading: boolean;
 }
 
 export function DeliveryReport({ deliverySummary, isLoading }: DeliveryReportProps) {
   const totalOrders = deliverySummary?.total_orders || 0;
   const completedOrders = deliverySummary?.completed_orders || 0;
   const cancelledOrders = deliverySummary?.cancelled_orders || 0;
   const pendingOrders = deliverySummary?.pending_orders || 0;
 
   const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
   const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;
 
   return (
     <div className="space-y-6">
       {/* Main Stats */}
       <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
         {isLoading ? (
           <>
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
           </>
         ) : (
           <>
             <Card className="border-2 p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-primary/10">
                   <Truck className="h-6 w-6 text-primary" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold">{totalOrders}</p>
                   <p className="text-sm text-muted-foreground">Total pedidos</p>
                 </div>
               </div>
             </Card>
 
             <Card className="border-2 p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-success/10">
                   <TrendingUp className="h-6 w-6 text-success" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-primary">
                     S/ {(deliverySummary?.total_sales || 0).toFixed(2)}
                   </p>
                   <p className="text-sm text-muted-foreground">Ventas delivery</p>
                 </div>
               </div>
             </Card>
 
             <Card className="border-2 p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-secondary/10">
                   <CheckCircle className="h-6 w-6 text-secondary" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-success">{completedOrders}</p>
                   <p className="text-sm text-muted-foreground">Completados</p>
                 </div>
               </div>
             </Card>
 
             <Card className="border-2 p-4">
               <div className="flex items-center gap-3">
                 <div className="p-2 rounded-lg bg-amber-500/10">
                   <Clock className="h-6 w-6 text-amber-500" />
                 </div>
                 <div>
                   <p className="text-2xl font-bold text-amber-500">{pendingOrders}</p>
                   <p className="text-sm text-muted-foreground">Pendientes</p>
                 </div>
               </div>
             </Card>
           </>
         )}
       </div>
 
       {/* Performance Cards */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <CheckCircle className="h-5 w-5 text-success" />
               Tasa de Completación
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {isLoading ? (
               <Skeleton className="h-20" />
             ) : (
               <>
                 <div className="text-center">
                   <p className="text-4xl font-bold text-success">{completionRate.toFixed(1)}%</p>
                   <p className="text-sm text-muted-foreground">
                     {completedOrders} de {totalOrders} pedidos completados
                   </p>
                 </div>
                 <Progress value={completionRate} className="h-3" />
               </>
             )}
           </CardContent>
         </Card>
 
         <Card className="border-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <XCircle className="h-5 w-5 text-destructive" />
               Pedidos Cancelados
             </CardTitle>
           </CardHeader>
           <CardContent className="space-y-4">
             {isLoading ? (
               <Skeleton className="h-20" />
             ) : (
               <>
                 <div className="text-center">
                   <p className="text-4xl font-bold text-destructive">{cancellationRate.toFixed(1)}%</p>
                   <p className="text-sm text-muted-foreground">
                     {cancelledOrders} pedidos cancelados
                   </p>
                 </div>
                 <Progress value={cancellationRate} className="h-3 [&>div]:bg-destructive" />
               </>
             )}
           </CardContent>
         </Card>
       </div>
 
       {/* Ticket Promedio */}
       <Card className="border-2">
         <CardHeader>
           <CardTitle>Resumen de Delivery</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <Skeleton className="h-24" />
           ) : totalOrders === 0 ? (
             <div className="py-8 text-center text-muted-foreground">
               <Truck className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>No hay pedidos de delivery en este período</p>
             </div>
           ) : (
             <div className="grid grid-cols-3 gap-6 text-center">
               <div>
                 <p className="text-2xl font-bold text-primary">
                   S/ {(deliverySummary?.average_ticket || 0).toFixed(2)}
                 </p>
                 <p className="text-sm text-muted-foreground">Ticket Promedio</p>
               </div>
               <div>
                 <p className="text-2xl font-bold text-success">
                   S/ {(deliverySummary?.total_sales || 0).toFixed(2)}
                 </p>
                 <p className="text-sm text-muted-foreground">Ventas Totales</p>
               </div>
               <div>
                 <p className="text-2xl font-bold text-secondary">
                   {totalOrders}
                 </p>
                 <p className="text-sm text-muted-foreground">Pedidos Totales</p>
               </div>
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }