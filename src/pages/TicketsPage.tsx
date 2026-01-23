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
import { exportToExcel, exportToPDF, ExportData } from '@/utils/exportUtils';

interface Ticket {
  id: string;
  numero: string;
  fecha: Date;
  cliente?: string;
  total: number;
  metodoPago: string;
  usuario: string;
  tipo: 'local' | 'delivery' | 'para_llevar';
  items: { nombre: string; cantidad: number; precio: number }[];
}

// Helper to generate demo tickets across different dates
const generateDemoTickets = (): Ticket[] => {
  const now = new Date();
  const tickets: Ticket[] = [];
  
  // Today's tickets
  for (let i = 0; i < 8; i++) {
    tickets.push({
      id: `today-${i}`,
      numero: `T-${String(100 + i).padStart(3, '0')}`,
      fecha: new Date(now.getTime() - i * 3600000),
      cliente: i % 2 === 0 ? `Cliente ${i}` : undefined,
      total: 25 + Math.random() * 100,
      metodoPago: ['Efectivo', 'Yape', 'Plin', 'Transferencia'][i % 4],
      usuario: ['Carlos García', 'Ana Torres'][i % 2],
      tipo: ['local', 'delivery', 'para_llevar'][i % 3] as Ticket['tipo'],
      items: [
        { nombre: 'Pizza Pepperoni', cantidad: 1, precio: 32 },
        { nombre: 'Coca Cola 1L', cantidad: 2, precio: 7 },
      ],
    });
  }
  
  // Yesterday's tickets
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  for (let i = 0; i < 6; i++) {
    tickets.push({
      id: `yesterday-${i}`,
      numero: `T-${String(90 + i).padStart(3, '0')}`,
      fecha: new Date(yesterday.getTime() - i * 3600000),
      cliente: i % 3 === 0 ? `Cliente Y${i}` : undefined,
      total: 30 + Math.random() * 80,
      metodoPago: ['Efectivo', 'Yape'][i % 2],
      usuario: 'Carlos García',
      tipo: ['local', 'para_llevar'][i % 2] as Ticket['tipo'],
      items: [{ nombre: 'Pizza Hawaiana', cantidad: 1, precio: 35 }],
    });
  }
  
  // Last week tickets
  for (let d = 2; d <= 7; d++) {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - d);
    for (let i = 0; i < 3; i++) {
      tickets.push({
        id: `week-${d}-${i}`,
        numero: `T-${String(50 + d * 3 + i).padStart(3, '0')}`,
        fecha: new Date(pastDate.getTime() - i * 3600000),
        total: 40 + Math.random() * 60,
        metodoPago: 'Efectivo',
        usuario: 'Ana Torres',
        tipo: 'local',
        items: [{ nombre: 'Parrilla Mixta', cantidad: 1, precio: 65 }],
      });
    }
  }
  
  // Last month tickets
  for (let d = 8; d <= 30; d++) {
    const pastDate = new Date(now);
    pastDate.setDate(pastDate.getDate() - d);
    tickets.push({
      id: `month-${d}`,
      numero: `T-${String(d).padStart(3, '0')}`,
      fecha: pastDate,
      total: 50 + Math.random() * 100,
      metodoPago: 'Efectivo',
      usuario: 'Carlos García',
      tipo: 'local',
      items: [{ nombre: 'Pizza Suprema', cantidad: 1, precio: 42 }],
    });
  }
  
  return tickets.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
};

const demoTickets = generateDemoTickets();

type FilterPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'custom';

function getTipoBadge(tipo: Ticket['tipo']) {
  switch (tipo) {
    case 'local':
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-primary/10 text-primary">Local</span>;
    case 'delivery':
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-secondary text-secondary-foreground">Delivery</span>;
    case 'para_llevar':
      return <span className="px-3 py-1 rounded-full text-sm font-semibold bg-accent text-accent-foreground">Para llevar</span>;
  }
}

// Helper to trigger browser print
const handlePrintTicket = (ticket: Ticket) => {
  const printWindow = window.open('', '_blank', 'width=400,height=600');
  if (printWindow) {
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket ${ticket.numero}</title>
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
            <p>Ticket: ${ticket.numero}</p>
            <p>${ticket.fecha.toLocaleDateString('es-PE')} ${ticket.fecha.toLocaleTimeString('es-PE')}</p>
          </div>
          <div class="items">
            ${ticket.items.map(item => `<p>${item.cantidad}x ${item.nombre} - S/ ${(item.cantidad * item.precio).toFixed(2)}</p>`).join('')}
          </div>
          <div class="total">
            <p>TOTAL: S/ ${ticket.total.toFixed(2)}</p>
            <p>Pago: ${ticket.metodoPago}</p>
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

  const filteredTickets = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfWeek.getDate() - 7);
    const startOfMonth = new Date(startOfToday);
    startOfMonth.setDate(startOfMonth.getDate() - 30);

    let dateFiltered = demoTickets;

    switch (filterPeriod) {
      case 'today':
        dateFiltered = demoTickets.filter(t => t.fecha >= startOfToday);
        break;
      case 'yesterday':
        dateFiltered = demoTickets.filter(t => t.fecha >= startOfYesterday && t.fecha < startOfToday);
        break;
      case 'week':
        dateFiltered = demoTickets.filter(t => t.fecha >= startOfWeek);
        break;
      case 'month':
        dateFiltered = demoTickets.filter(t => t.fecha >= startOfMonth);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          end.setHours(23, 59, 59, 999);
          dateFiltered = demoTickets.filter(t => t.fecha >= start && t.fecha <= end);
        }
        break;
    }

    return dateFiltered.filter(
      (t) =>
        t.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.cliente?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, filterPeriod, customStartDate, customEndDate]);

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
      rows: filteredTickets.map(t => [
        t.numero,
        t.fecha.toLocaleDateString('es-PE'),
        t.fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        t.cliente || '-',
        t.tipo === 'local' ? 'Local' : t.tipo === 'delivery' ? 'Delivery' : 'Para llevar',
        t.metodoPago,
        `S/ ${t.total.toFixed(2)}`,
        t.usuario
      ])
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
            <Button variant="outline" className="btn-pos">
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
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id} className="hover:bg-muted/50">
                    <TableCell className="font-bold text-pos-lg text-primary">{ticket.numero}</TableCell>
                    <TableCell>{ticket.fecha.toLocaleDateString('es-PE')}</TableCell>
                    <TableCell>
                      {ticket.fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    </TableCell>
                    <TableCell className="font-medium">{ticket.cliente || '—'}</TableCell>
                    <TableCell>{getTipoBadge(ticket.tipo)}</TableCell>
                    <TableCell>{ticket.metodoPago}</TableCell>
                    <TableCell className="font-bold text-pos-lg">S/ {ticket.total.toFixed(2)}</TableCell>
                    <TableCell className="text-muted-foreground">{ticket.usuario}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Ticket Preview Dialog */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-pos-xl">
                Ticket {selectedTicket?.numero}
              </DialogTitle>
            </DialogHeader>
            {selectedTicket && (
              <div className="space-y-4 p-4 bg-muted rounded-xl font-mono text-sm">
                <div className="text-center border-b border-dashed border-border pb-4">
                  <h3 className="text-lg font-bold">🍕 PIZZAPOS</h3>
                  <p>Sistema de Ventas</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {selectedTicket.fecha.toLocaleDateString('es-PE')} - {selectedTicket.fecha.toLocaleTimeString('es-PE')}
                  </p>
                </div>
                
                <div className="space-y-2 border-b border-dashed border-border pb-4">
                  <p><strong>Ticket:</strong> {selectedTicket.numero}</p>
                  <p><strong>Tipo:</strong> {selectedTicket.tipo}</p>
                  {selectedTicket.cliente && <p><strong>Cliente:</strong> {selectedTicket.cliente}</p>}
                  <p><strong>Atendido por:</strong> {selectedTicket.usuario}</p>
                </div>

                <div className="border-b border-dashed border-border pb-4">
                  <p className="font-bold mb-2">Detalle:</p>
                  {selectedTicket.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.cantidad}x {item.nombre}</span>
                      <span>S/ {(item.cantidad * item.precio).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Método de pago:</span>
                    <span>{selectedTicket.metodoPago}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span>TOTAL:</span>
                    <span>S/ {selectedTicket.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground pt-4 border-t border-dashed border-border">
                  <p>¡Gracias por su preferencia!</p>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-4">
              <Button variant="outline" className="flex-1 btn-pos" onClick={() => setSelectedTicket(null)}>
                Cerrar
              </Button>
              <Button 
                className="flex-1 btn-pos bg-primary"
                onClick={() => {
                  if (selectedTicket) handlePrintTicket(selectedTicket);
                }}
              >
                <Printer className="h-5 w-5 mr-2" />
                Reimprimir
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
