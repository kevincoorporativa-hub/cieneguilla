 import { useMemo } from 'react';
 import { CreditCard, Banknote, Smartphone, Building2 } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 import { 
   PieChart as RechartsPie,
   Pie,
   Cell,
   Tooltip,
   ResponsiveContainer,
   BarChart,
   Bar,
   XAxis,
   YAxis,
   CartesianGrid,
 } from 'recharts';
 
 interface PaymentMethod {
   method: string;
   payment_count: number;
   total_amount: number;
 }
 
 interface MetodosPagoReportProps {
   paymentMethods: PaymentMethod[];
   isLoading: boolean;
 }
 
 const methodColors: Record<string, string> = {
   cash: 'hsl(142, 76%, 36%)',
   card: 'hsl(215, 25%, 40%)',
   transfer: 'hsl(24, 95%, 53%)',
   yape: 'hsl(280, 65%, 55%)',
   plin: 'hsl(190, 75%, 45%)',
   other: 'hsl(220, 15%, 60%)',
 };
 
 const methodLabels: Record<string, string> = {
   cash: 'Efectivo',
   card: 'Tarjeta',
   transfer: 'Transferencia',
   yape: 'Yape',
   plin: 'Plin',
   other: 'Otro',
 };
 
 const methodIcons: Record<string, React.ReactNode> = {
   cash: <Banknote className="h-5 w-5" />,
   card: <CreditCard className="h-5 w-5" />,
   transfer: <Building2 className="h-5 w-5" />,
   yape: <Smartphone className="h-5 w-5" />,
   plin: <Smartphone className="h-5 w-5" />,
 };
 
 export function MetodosPagoReport({ paymentMethods, isLoading }: MetodosPagoReportProps) {
   const chartData = useMemo(() => 
     paymentMethods.map(m => ({
       method: methodLabels[m.method] || m.method,
       total: Number(m.total_amount),
       count: m.payment_count,
       color: methodColors[m.method] || methodColors.other,
     })),
     [paymentMethods]
   );
 
   const totalAmount = paymentMethods.reduce((sum, m) => sum + Number(m.total_amount), 0);
   const totalTransactions = paymentMethods.reduce((sum, m) => sum + m.payment_count, 0);
 
   return (
     <div className="space-y-6">
       {/* Stats */}
       <div className="grid grid-cols-2 gap-4">
         {isLoading ? (
           <>
             <Skeleton className="h-24" />
             <Skeleton className="h-24" />
           </>
         ) : (
           <>
             <Card className="border-2 p-4">
               <div className="text-center">
                 <p className="text-2xl font-bold text-primary">S/ {totalAmount.toFixed(2)}</p>
                 <p className="text-sm text-muted-foreground">Total recaudado</p>
               </div>
             </Card>
             <Card className="border-2 p-4">
               <div className="text-center">
                 <p className="text-2xl font-bold text-success">{totalTransactions}</p>
                 <p className="text-sm text-muted-foreground">Transacciones</p>
               </div>
             </Card>
           </>
         )}
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Pie Chart */}
         <Card className="border-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <CreditCard className="h-5 w-5" />
               Distribución por Método
             </CardTitle>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <Skeleton className="h-[300px]" />
             ) : chartData.length === 0 ? (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                 <div className="text-center">
                   <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
                   <p>No hay datos de pagos</p>
                 </div>
               </div>
             ) : (
               <ResponsiveContainer width="100%" height={300}>
                 <RechartsPie>
                   <Pie
                     data={chartData}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={100}
                     paddingAngle={5}
                     dataKey="total"
                     nameKey="method"
                   >
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip 
                     formatter={(value, name, props) => [
                       `S/ ${Number(value).toFixed(2)}`, 
                       props.payload.method
                     ]} 
                   />
                 </RechartsPie>
               </ResponsiveContainer>
             )}
           </CardContent>
         </Card>
 
         {/* Bar Chart */}
         <Card className="border-2">
           <CardHeader>
             <CardTitle>Monto por Método de Pago</CardTitle>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <Skeleton className="h-[300px]" />
             ) : chartData.length === 0 ? (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                 <p>No hay datos</p>
               </div>
             ) : (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={chartData}>
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis dataKey="method" />
                   <YAxis />
                   <Tooltip 
                     formatter={(value) => [`S/ ${Number(value).toFixed(2)}`, 'Monto']}
                   />
                   <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                     {chartData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Bar>
                 </BarChart>
               </ResponsiveContainer>
             )}
           </CardContent>
         </Card>
       </div>
 
       {/* Detailed List */}
       <Card className="border-2">
         <CardHeader>
           <CardTitle>Detalle por Método de Pago</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="space-y-4">
               {[...Array(4)].map((_, i) => (
                 <Skeleton key={i} className="h-16" />
               ))}
             </div>
           ) : paymentMethods.length === 0 ? (
             <div className="py-8 text-center text-muted-foreground">
               <p>No hay transacciones en este período</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
               {paymentMethods.map((method) => {
                 const percentage = totalAmount > 0 ? (Number(method.total_amount) / totalAmount) * 100 : 0;
                 const color = methodColors[method.method] || methodColors.other;
                 const icon = methodIcons[method.method];
                 const label = methodLabels[method.method] || method.method;
 
                 return (
                   <div 
                     key={method.method} 
                     className="p-4 rounded-lg border-2 flex items-center gap-4"
                     style={{ borderLeftColor: color, borderLeftWidth: 4 }}
                   >
                     <div 
                       className="p-2 rounded-lg" 
                       style={{ backgroundColor: `${color}20` }}
                     >
                       <span style={{ color }}>{icon || <CreditCard className="h-5 w-5" />}</span>
                     </div>
                     <div className="flex-1">
                       <div className="flex justify-between items-center">
                         <span className="font-semibold">{label}</span>
                         <span className="font-bold text-primary">
                           S/ {Number(method.total_amount).toFixed(2)}
                         </span>
                       </div>
                       <div className="flex justify-between text-sm text-muted-foreground">
                         <span>{method.payment_count} transacciones</span>
                         <span>{percentage.toFixed(1)}%</span>
                       </div>
                     </div>
                   </div>
                 );
               })}
             </div>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }