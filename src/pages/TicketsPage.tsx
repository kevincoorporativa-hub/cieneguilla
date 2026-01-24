import { useState, useMemo } from 'react';
import { Search, FileText, Printer, Eye, RefreshCw, Calendar, Download, Filter, FileSpreadsheet } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToExcel, exportToPDF, ExportData } from '@/utils/exportUtils';
import { useTickets, Ticket } from '@/hooks/useTickets';

type FilterPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

function getTipoBadge(tipo: Ticket['order_type']) {
  switch (tipo) {
    case 'local':
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">Local</span>;
    case 'delivery':
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground">Delivery</span>;
    case 'takeaway':
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-accent text-accent-foreground">Para llevar</span>;
  }
}

function getPaymentMethodLabel(method: string | null) {
  if (!method) return '—';
  const labels: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    yape: 'Yape',
    plin: 'Plin',
    transfer: 'Transferencia',
  };
  return labels[method] || method;
}

// Helper to trigger browser print
const handlePrintTicket = (ticket: Ticket) => {
  const fecha = new Date(ticket.created_at);
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket T-${ticket.order_number}</title>
          <style>
            body { font-family: monospace; padding: 20px; font-size: 12px; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; }
            .items { margin: 10px 0; }
            .total { border-top: 1px dashed #000; padding-top: 10px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>🍕 PIZZAPOS</h2>
            <p>Ticket: T-${ticket.order_number}</p>
            <p>${fecha.toLocaleDateString('es-PE')} ${fecha.toLocaleTimeString('es-PE')}</p>
          </div>
          <div class="items">
            ${ticket.items.map(item => `<p>${item.quantity}x ${item.product_name} - S/ ${item.total.toFixed(2)}</p>`).join('')}
          </div>
          <div class="total">
            <p>TOTAL: S/ ${ticket.total.toFixed(2)}</p>
            <p>Pago: ${getPaymentMethodLabel(ticket.payment_method)}</p>
          </div>
          <div class="footer">
            <p>¡Gracias por su preferencia!</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
  toast.success('Enviado a impresora');
};

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Calculate date range based on filter period
  const dateRange = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (filterPeriod) {
      case 'today':
        return { start: startOfToday.toISOString(), end: now.toISOString() };
      case 'yesterday': {
        const startOfYesterday = new Date(startOfToday);
        startOfYesterday.setDate(startOfYesterday.getDate() - 1);
        return { start: startOfYesterday.toISOString(), end: startOfToday.toISOString() };
      }
      case 'week': {
        const startOfWeek = new Date(startOfToday);
        startOfWeek.setDate(startOfWeek.getDate() - 7);
        return { start: startOfWeek.toISOString(), end: now.toISOString() };
      }
      case 'month': {
        const startOfMonth = new Date(startOfToday);
        startOfMonth.setDate(startOfMonth.getDate() - 30);
        return { start: startOfMonth.toISOString(), end: now.toISOString() };
      }
      case 'custom':
        if (customStartDate && customEndDate) {
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          return { start: new Date(customStartDate).toISOString(), end: end.toISOString() };
        }
        return { start: startOfToday.toISOString(), end: now.toISOString() };
      default:
        return { start: startOfToday.toISOString(), end: now.toISOString() };
    }
  }, [filterPeriod, customStartDate, customEndDate]);

  // Fetch tickets
  const { data: tickets = [], isLoading, refetch } = useTickets(dateRange.start, dateRange.end);

  // Filter by search
  const filteredTickets = useMemo(() => {
    return tickets.filter(
      (t) =>
        `T-${t.order_number}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [tickets, searchTerm]);

  const totalVentas = filteredTickets.reduce((sum, t) => sum + t.total, 0);

  const getPeriodLabel = () => {
    return {
      today: 'Hoy',
      yesterday: 'Ayer',
      week: 'Última Semana',
      month: 'Último Mes',
      custom: `${customStartDate} - ${customEndDate}`,
    }[filterPeriod];
  };

  const getExportData = (): ExportData => {
    return {
      title: 'Reporte de Tickets',
      subtitle: `Período: ${getPeriodLabel()} | Total: S/ ${totalVentas.toFixed(2)}`,
      headers: ['Ticket', 'Fecha', 'Hora', 'Cliente', 'Tipo', 'Método Pago', 'Total', 'Usuario'],
      rows: filteredTickets.map(t => {
        const fecha = new Date(t.created_at);
        return [
          `T-${t.order_number}`,
          fecha.toLocaleDateString('es-PE'),
          fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
          t.customer_name || '-',
          t.order_type === 'local' ? 'Local' : t.order_type === 'delivery' ? 'Delivery' : 'Para llevar',
          getPaymentMethodLabel(t.payment_method),
          `S/ ${t.total.toFixed(2)}`,
          t.user_email || '-'
        ];
      })
    };
  };

  const handleExportExcel = () => {
    const data = getExportData();
    exportToExcel(data, `tickets_${getPeriodLabel().replace(/\s/g, '_')}`);
    toast.success('Exportado a Excel');
  };

  const handleExportPDF = () => {
    const data = getExportData();
    exportToPDF(data, `tickets_${getPeriodLabel().replace(/\s/g, '_')}`);
    toast.success('Exportado a PDF');
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Tickets</h1>
            <p className="text-muted-foreground">Historial de ventas y reimpresión</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="btn-pos" onClick={handleExportExcel}>
              <FileSpreadsheet className="h-5 w-5 mr-2" />
              Excel
            </Button>
            <Button variant="outline" className="btn-pos" onClick={handleExportPDF}>
              <Download className="h-5 w-5 mr-2" />
              PDF
            </Button>
            <Button variant="outline" className="btn-pos" onClick={() => refetch()}>
              <RefreshCw className="h-5 w-5 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-6 gap-4">
          {/* Period buttons */}
          <Card className="col-span-4 border-2">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <Button
                  variant={filterPeriod === 'today' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setFilterPeriod('today')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Hoy
                </Button>
                <Button
                  variant={filterPeriod === 'yesterday' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setFilterPeriod('yesterday')}
                >
                  Ayer
                </Button>
                <Button
                  variant={filterPeriod === 'week' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setFilterPeriod('week')}
                >
                  Semana
                </Button>
                <Button
                  variant={filterPeriod === 'month' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setFilterPeriod('month')}
                >
                  Mes
                </Button>
                <Button
                  variant={filterPeriod === 'custom' ? 'default' : 'outline'}
                  className="rounded-xl"
                  onClick={() => setFilterPeriod('custom')}
                >
                  Rango
                </Button>
              </div>
              
              {filterPeriod === 'custom' && (
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Desde:</label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="h-10 rounded-xl w-40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium">Hasta:</label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="h-10 rounded-xl w-40"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Summary stats */}
          <Card className="col-span-2 border-2 bg-primary/5">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Período</p>
                <p className="text-2xl font-bold text-primary">S/ {totalVentas.toFixed(2)}</p>
                <p className="text-sm text-muted-foreground">{filteredTickets.length} tickets</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="border-2">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar por número de ticket o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-pos-base rounded-xl"
              />
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Tickets ({filteredTickets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-pos-base font-bold">Ticket</TableHead>
                    <TableHead className="text-pos-base font-bold">Fecha</TableHead>
                    <TableHead className="text-pos-base font-bold">Hora</TableHead>
                    <TableHead className="text-pos-base font-bold">Cliente</TableHead>
                    <TableHead className="text-pos-base font-bold">Tipo</TableHead>
                    <TableHead className="text-pos-base font-bold">Pago</TableHead>
                    <TableHead className="text-pos-base font-bold">Total</TableHead>
                    <TableHead className="text-pos-base font-bold">Usuario</TableHead>
                    <TableHead className="text-pos-base font-bold text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => {
                    const fecha = new Date(ticket.created_at);
                    return (
                      <TableRow key={ticket.id} className="hover:bg-muted/50">
                        <TableCell className="font-bold text-pos-lg text-primary">T-{ticket.order_number}</TableCell>
                        <TableCell>{fecha.toLocaleDateString('es-PE')}</TableCell>
                        <TableCell>
                          {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell className="font-medium">{ticket.customer_name || '—'}</TableCell>
                        <TableCell>{getTipoBadge(ticket.order_type)}</TableCell>
                        <TableCell>{getPaymentMethodLabel(ticket.payment_method)}</TableCell>
                        <TableCell className="font-bold text-pos-lg">S/ {ticket.total.toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground">{ticket.user_email || '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10"
                              onClick={() => setSelectedTicket(ticket)}
                            >
                              <Eye className="h-5 w-5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-10 w-10 text-primary"
                              onClick={() => handlePrintTicket(ticket)}
                            >
                              <Printer className="h-5 w-5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredTickets.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No se encontraron tickets en este período
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Ticket Preview Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-pos-xl">
                Ticket T-{selectedTicket?.order_number}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4 p-4 bg-muted rounded-xl font-mono text-sm">
                <div className="text-center border-b border-dashed border-border pb-4">
                  <h3 className="text-lg font-bold">🍕 PIZZAPOS</h3>
                  <p>{new Date(selectedTicket.created_at).toLocaleDateString('es-PE')}</p>
                  <p>{new Date(selectedTicket.created_at).toLocaleTimeString('es-PE')}</p>
                </div>
                
                <div className="space-y-2">
                  {selectedTicket.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.quantity}x {item.product_name}</span>
                      <span>S/ {item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-dashed border-border pt-4 space-y-1">
                  <div className="flex justify-between font-bold text-lg">
                    <span>TOTAL:</span>
                    <span>S/ {selectedTicket.total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Pago:</span>
                    <span>{getPaymentMethodLabel(selectedTicket.payment_method)}</span>
                  </div>
                </div>
                
                <div className="text-center text-muted-foreground text-xs pt-4 border-t border-dashed border-border">
                  <p>¡Gracias por su preferencia!</p>
                </div>
              </div>
            )}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => setSelectedTicket(null)}
              >
                Cerrar
              </Button>
              <Button 
                className="flex-1 bg-primary"
                onClick={() => selectedTicket && handlePrintTicket(selectedTicket)}
              >
                <Printer className="h-4 w-4 mr-2" />
                Reimprimir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
