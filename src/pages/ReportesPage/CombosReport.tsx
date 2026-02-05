 import { useMemo } from 'react';
 import { Gift, Trophy } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 import { Badge } from '@/components/ui/badge';
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from '@/components/ui/table';
 import { 
   BarChart, 
   Bar, 
   XAxis, 
   YAxis, 
   CartesianGrid, 
   Tooltip, 
   ResponsiveContainer,
 } from 'recharts';
 import type { TopCombo } from '@/hooks/useReports';
 
 interface CombosReportProps {
   topCombos: TopCombo[];
   isLoading: boolean;
 }
 
 export function CombosReport({ topCombos, isLoading }: CombosReportProps) {
   const comboChartData = useMemo(() => 
     topCombos.map(c => ({
       nombre: c.combo_name.length > 20 ? c.combo_name.slice(0, 20) + '...' : c.combo_name,
       fullName: c.combo_name,
       cantidad: Number(c.total_quantity),
       total: Number(c.total_sales),
     })),
     [topCombos]
   );
 
   const totalComboSales = topCombos.reduce((sum, c) => sum + Number(c.total_sales), 0);
   const totalCombosVendidos = topCombos.reduce((sum, c) => sum + Number(c.total_quantity), 0);
 
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
                 <p className="text-2xl font-bold text-primary">S/ {totalComboSales.toFixed(2)}</p>
                 <p className="text-sm text-muted-foreground">Ventas en combos</p>
               </div>
             </Card>
             <Card className="border-2 p-4">
               <div className="text-center">
                 <p className="text-2xl font-bold text-success">{totalCombosVendidos}</p>
                 <p className="text-sm text-muted-foreground">Combos vendidos</p>
               </div>
             </Card>
           </>
         )}
       </div>
 
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card className="border-2">
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Gift className="h-5 w-5" />
               Combos Más Vendidos
             </CardTitle>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <div className="space-y-2">
                 {[...Array(5)].map((_, i) => (
                   <Skeleton key={i} className="h-10" />
                 ))}
               </div>
             ) : topCombos.length === 0 ? (
               <div className="py-8 text-center text-muted-foreground">
                 <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
                 <p>No hay ventas de combos en este período</p>
               </div>
             ) : (
               <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>#</TableHead>
                     <TableHead>Combo</TableHead>
                     <TableHead>Cantidad</TableHead>
                     <TableHead>Total</TableHead>
                   </TableRow>
                 </TableHeader>
                 <TableBody>
                   {topCombos.map((combo, index) => (
                     <TableRow key={combo.combo_id}>
                       <TableCell>
                         {index === 0 ? (
                           <Badge className="bg-amber-500 text-white">
                             <Trophy className="h-3 w-3 mr-1" />
                             1
                           </Badge>
                         ) : (
                           <span className="font-bold">{index + 1}</span>
                         )}
                       </TableCell>
                       <TableCell className="font-semibold">{combo.combo_name}</TableCell>
                       <TableCell>{combo.total_quantity}</TableCell>
                       <TableCell className="font-bold text-primary">
                         S/ {Number(combo.total_sales).toFixed(2)}
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
             <CardTitle>Gráfico de Ventas por Combo</CardTitle>
           </CardHeader>
           <CardContent>
             {isLoading ? (
               <Skeleton className="h-[300px]" />
             ) : comboChartData.length === 0 ? (
               <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                 <p>No hay datos</p>
               </div>
             ) : (
               <ResponsiveContainer width="100%" height={300}>
                 <BarChart data={comboChartData} layout="vertical">
                   <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                   <XAxis type="number" />
                   <YAxis dataKey="nombre" type="category" width={140} fontSize={12} />
                   <Tooltip 
                     formatter={(value, name, props) => [
                       name === 'total' ? `S/ ${value}` : `${value} unidades`, 
                       props.payload.fullName
                     ]} 
                   />
                   <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
                 </BarChart>
               </ResponsiveContainer>
             )}
           </CardContent>
         </Card>
       </div>
     </div>
   );
 }