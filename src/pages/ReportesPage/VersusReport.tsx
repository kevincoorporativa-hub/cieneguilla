import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingCart } from 'lucide-react';
import { SaleItem } from '@/hooks/useCuadre';

function getOrderTypeBadge(type: string) {
  switch (type) {
    case 'local': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary">Local</span>;
    case 'delivery': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-accent text-accent-foreground">Delivery</span>;
    case 'takeaway': return <span className="px-2 py-1 rounded-full text-xs font-bold bg-warning/10 text-warning">Para llevar</span>;
    default: return <span className="px-2 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground">{type}</span>;
  }
}

interface VersusReportProps {
  sales: SaleItem[];
  isLoading: boolean;
}

export function VersusReport({ sales, isLoading }: VersusReportProps) {
  const totalVentas = sales.reduce((sum, s) => sum + s.total, 0);

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardHeader><Skeleton className="h-8 w-48" /></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" />
          Detalle de Ventas ({sales.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-bold">Fecha</TableHead>
              <TableHead className="font-bold">N° Orden</TableHead>
              <TableHead className="font-bold">Tipo</TableHead>
              <TableHead className="font-bold text-right">Items</TableHead>
              <TableHead className="font-bold text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map(s => (
              <TableRow key={s.id} className="hover:bg-muted/50">
                <TableCell className="text-muted-foreground">
                  {new Date(s.created_at).toLocaleDateString('es-PE')}
                </TableCell>
                <TableCell className="font-semibold">#{s.order_number}</TableCell>
                <TableCell>{getOrderTypeBadge(s.order_type)}</TableCell>
                <TableCell className="text-right">{s.items_count}</TableCell>
                <TableCell className="text-right font-bold text-success">S/ {s.total.toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {sales.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No hay ventas en el rango seleccionado
                </TableCell>
              </TableRow>
            )}
            {sales.length > 0 && (
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={4} className="text-right">TOTAL VENTAS:</TableCell>
                <TableCell className="text-right text-success text-lg">
                  S/ {totalVentas.toFixed(2)}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
