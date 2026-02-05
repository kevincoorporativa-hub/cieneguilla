 import { useMemo } from 'react';
 import { Package } from 'lucide-react';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Skeleton } from '@/components/ui/skeleton';
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
 import type { TopProduct } from '@/hooks/useReports';
 
 interface ProductosReportProps {
   topProducts: TopProduct[];
   isLoading: boolean;
 }
 
 export function ProductosReport({ topProducts, isLoading }: ProductosReportProps) {
   const productChartData = useMemo(() => 
     topProducts.map(p => ({
       nombre: p.product_name.length > 15 ? p.product_name.slice(0, 15) + '...' : p.product_name,
       fullName: p.product_name,
       cantidad: Number(p.total_quantity),
       total: Number(p.total_sales),
     })),
     [topProducts]
   );
 
   return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
       <Card className="border-2">
         <CardHeader>
           <CardTitle className="flex items-center gap-2">
             <Package className="h-5 w-5" />
             Productos Más Vendidos
           </CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <div className="space-y-2">
               {[...Array(5)].map((_, i) => (
                 <Skeleton key={i} className="h-10" />
               ))}
             </div>
           ) : topProducts.length === 0 ? (
             <div className="py-8 text-center text-muted-foreground">
               <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
               <p>No hay datos de productos</p>
             </div>
           ) : (
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
                 {topProducts.map((product, index) => (
                   <TableRow key={product.product_id}>
                     <TableCell className="font-bold">{index + 1}</TableCell>
                     <TableCell className="font-semibold">{product.product_name}</TableCell>
                     <TableCell>{product.total_quantity}</TableCell>
                     <TableCell className="font-bold text-primary">
                       S/ {Number(product.total_sales).toFixed(2)}
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
           <CardTitle>Gráfico de Ventas por Producto</CardTitle>
         </CardHeader>
         <CardContent>
           {isLoading ? (
             <Skeleton className="h-[300px]" />
           ) : productChartData.length === 0 ? (
             <div className="h-[300px] flex items-center justify-center text-muted-foreground">
               <p>No hay datos</p>
             </div>
           ) : (
             <ResponsiveContainer width="100%" height={300}>
               <BarChart data={productChartData} layout="vertical">
                 <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                 <XAxis type="number" />
                 <YAxis dataKey="nombre" type="category" width={120} fontSize={12} />
                 <Tooltip 
                   formatter={(value, name, props) => [
                     `${value} unidades`, 
                     props.payload.fullName
                   ]} 
                 />
                 <Bar dataKey="cantidad" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]} />
               </BarChart>
             </ResponsiveContainer>
           )}
         </CardContent>
       </Card>
     </div>
   );
 }