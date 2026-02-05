 import { useMemo } from 'react';
 import { PieChart } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
 import { 
   PieChart as RechartsPie,
   Pie,
   Cell,
   Tooltip,
   ResponsiveContainer,
 } from 'recharts';
 import type { SalesByCategory } from '@/hooks/useReports';
 
 const categoryColors = [
   'hsl(24, 95%, 53%)',
   'hsl(215, 25%, 27%)',
   'hsl(38, 92%, 50%)',
   'hsl(142, 76%, 36%)',
   'hsl(220, 15%, 70%)',
   'hsl(280, 65%, 60%)',
   'hsl(190, 75%, 45%)',
 ];
 
 interface CategoriasReportProps {
   salesByCategory: SalesByCategory[];
   totalVentas: number;
   isLoading: boolean;
 }
 
 export function CategoriasReport({ salesByCategory, totalVentas, isLoading }: CategoriasReportProps) {
   const categoryChartData = useMemo(() => 
     salesByCategory.map(c => ({
       categoria: c.category_name,
       total: Number(c.total_sales),
       cantidad: Number(c.total_quantity),
     })),
     [salesByCategory]
   );
 
   return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                     className="w-4 h-4 rounded-full flex-shrink-0" 
                     style={{ backgroundColor: categoryColors[index % categoryColors.length] }}
                   />
                   <div className="flex-1 min-w-0">
                     <div className="flex justify-between">
                       <span className="font-semibold truncate">{cat.categoria}</span>
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
   );
 }