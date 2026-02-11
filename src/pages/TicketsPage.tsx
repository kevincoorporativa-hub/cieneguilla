import { useState, useMemo } from 'react';
import { Search, FileText, Printer, Eye, RefreshCw, Calendar, Download, Filter, FileSpreadsheet, Banknote, Smartphone, CreditCard, Building } from 'lucide-react';
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
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

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

// Helper to trigger browser print - now receives business settings
const buildPrintHtml = (ticket: Ticket, settings: { businessName: string; businessAddress: string; businessPhone: string; businessRuc: string; ticketLogoUrl: string; ticketPromoText: string; ticketFooterText: string }) => {
  const fecha = new Date(ticket.created_at);
  const logoHtml = settings.ticketLogoUrl 
    ? `<img src="${settings.ticketLogoUrl}" alt="Logo" style="width:60px;height:60px;object-fit:contain;margin:0 auto 8px;display:block;" />`
    : '';
  const promoHtml = settings.ticketPromoText
    ? `<div style="text-align:center;margin:12px 0;padding:8px;border:1px dashed #000;border-radius:4px;">
        <div style="font-size:10px;font-weight:bold;">🎉 PROMOCIÓN 🎉</div>
        <div style="font-size:10px;">${settings.ticketPromoText}</div>
      </div>`
    : '';
  const rucHtml = settings.businessRuc ? `<p style="font-size:10px;">RUC: ${settings.businessRuc}</p>` : '';

  return `
    <html>
      <head>
        <title>Ticket T-${ticket.order_number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body { font-family: 'Lucida Console', 'Consolas', 'Courier New', monospace; padding: 10px; font-size: 11px; line-height: 1.5; font-weight: bold; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .items { margin: 10px 0; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .separator { border-top: 1px dashed #000; margin: 8px 0; }
          .total { font-weight: bold; font-size: 16px; border-top: 2px solid #000; border-bottom: 1px solid #000; padding: 6px 0; margin: 4px 0; }
          .footer { text-align: center; margin-top: 16px; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          ${logoHtml}
          <div style="font-size:14px;font-weight:900;margin-bottom:2px;text-transform:uppercase;">${settings.businessName}</div>
          <p style="margin:2px 0;font-size:11px;">${settings.businessAddress}</p>
          <p style="margin:2px 0;font-size:11px;">Tel: ${settings.businessPhone}</p>
          ${rucHtml}
        </div>
        <div style="text-align:center;margin:8px 0;font-weight:900;font-size:12px;">TICKET DE VENTA</div>
        <div style="text-align:center;margin-bottom:6px;font-size:11px;">T-${ticket.order_number}</div>
        <div class="separator"></div>
        <div style="margin-bottom:4px;font-size:11px;">
          <div>FECHA  : ${fecha.toLocaleDateString('es-PE')} ${fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
        </div>
        <div class="separator"></div>
        <div style="margin-bottom:4px;font-size:11px;">
          ${ticket.customer_name ? `<div>CLIENTE : ${ticket.customer_name}</div>` : ''}
          ${ticket.customer_dni ? `<div>DNI     : ${ticket.customer_dni}</div>` : ''}
          <div>PAGO    : ${getPaymentMethodLabel(ticket.payment_method)}</div>
        </div>
        <div class="separator"></div>
        <div style="display:flex;font-size:11px;font-weight:900;margin-bottom:2px;">
          <span style="width:30px;">CANT</span>
          <span style="flex:1;">DESCRIPCION</span>
          <span style="width:55px;text-align:right;">SUBTOTAL</span>
        </div>
        <div class="items">
          ${ticket.items.map(item => `<div style="display:flex;margin-bottom:1px;font-size:11px;"><span style="width:30px;">${item.quantity}</span><span style="flex:1;">${item.product_name}</span><span style="width:55px;text-align:right;">S/${item.total.toFixed(2)}</span></div>`).join('')}
        </div>
        <div class="separator"></div>
        <div class="item-row total"><span>TOTAL S/.</span><span>S/${ticket.total.toFixed(2)}</span></div>
        <div class="item-row" style="font-size:11px;"><span>Pago:</span><span>${getPaymentMethodLabel(ticket.payment_method)}</span></div>
        ${promoHtml}
        <div class="footer">
          <p>${settings.ticketFooterText || '¡Gracias por su preferencia!'}</p>
          <p style="margin-top:4px;">Conserve este ticket</p>
        </div>
      </body>
    </html>
  `;
};

export default function TicketsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const { settings } = useBusinessSettings();

  const handlePrintTicket = (ticket: Ticket) => {
    const html = buildPrintHtml(ticket, settings);
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    iframe.style.width = '80mm';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(html);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.print();
      } catch (e) {
        console.error('Error al imprimir:', e);
      }
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);
    toast.success('Enviado a impresora');
  };

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

  // Payment method summary
  const paymentSummary = useMemo(() => {
    const summary: Record<string, { total: number; count: number }> = {};
    filteredTickets.forEach(t => {
      const method = t.payment_method || 'unknown';
      if (!summary[method]) summary[method] = { total: 0, count: 0 };
      summary[method].total += t.total;
      summary[method].count += 1;
    });
    return Object.entries(summary).map(([method, data]) => ({
      method,
      label: getPaymentMethodLabel(method),
      ...data,
      percentage: totalVentas > 0 ? ((data.total / totalVentas) * 100).toFixed(1) : '0',
    }));
  }, [filteredTickets, totalVentas]);

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-5 w-5 text-green-600" />;
      case 'yape': case 'plin': return <Smartphone className="h-5 w-5 text-purple-600" />;
      case 'pos': case 'card': return <CreditCard className="h-5 w-5 text-blue-600" />;
      case 'transfer': return <Building className="h-5 w-5 text-orange-600" />;
      default: return <Banknote className="h-5 w-5 text-muted-foreground" />;
    }
  };

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

  const handlePrintReport = () => {
    const rows = filteredTickets.map(t => {
      const f = new Date(t.created_at);
      return `<tr>
        <td>T-${t.order_number}</td>
        <td>${f.toLocaleDateString('es-PE')}</td>
        <td>${f.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</td>
        <td>${t.customer_name || '-'}</td>
        <td>${t.order_type === 'local' ? 'Local' : t.order_type === 'delivery' ? 'Delivery' : 'Para llevar'}</td>
        <td>${getPaymentMethodLabel(t.payment_method)}</td>
        <td style="text-align:right;">S/${t.total.toFixed(2)}</td>
      </tr>`;
    }).join('');

    const logoHtml = settings.ticketLogoUrl 
      ? `<img src="${settings.ticketLogoUrl}" alt="Logo" style="width:50px;height:50px;object-fit:contain;margin:0 auto 4px;display:block;" />`
      : '';

    const html = `<html><head><title>Reporte Tickets</title>
      <style>
        @page { size: 80mm auto; margin: 0; }
        body { font-family: 'Lucida Console','Consolas','Courier New',monospace; padding: 6px; font-size: 9px; font-weight: bold; }
        .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 2px 1px; text-align: left; font-size: 9px; }
        th { border-bottom: 1px solid #000; }
        .total-row { border-top: 2px solid #000; font-size: 11px; margin-top: 6px; padding-top: 4px; text-align: right; }
      </style></head><body>
      <div class="header">
        ${logoHtml}
        <div style="font-size:12px;font-weight:900;">${settings.businessName}</div>
        <div>REPORTE DE TICKETS</div>
        <div>${getPeriodLabel()}</div>
      </div>
      <table>
        <thead><tr><th>Ticket</th><th>Fecha</th><th>Hora</th><th>Cliente</th><th>Tipo</th><th>Pago</th><th style="text-align:right;">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="total-row"><strong>TOTAL: S/${totalVentas.toFixed(2)} (${filteredTickets.length} tickets)</strong></div>
      <div class="separator" style="border-top:1px dashed #000;margin:8px 0;"></div>
      <div style="font-size:10px;font-weight:900;margin-bottom:4px;">DETALLE POR MÉTODO DE PAGO:</div>
      ${paymentSummary.map(ps => `<div style="display:flex;justify-content:space-between;font-size:9px;margin-bottom:2px;"><span>${ps.label} (${ps.count})</span><span>S/${ps.total.toFixed(2)} (${ps.percentage}%)</span></div>`).join('')}
    </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:80mm;height:0;border:none;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) { document.body.removeChild(iframe); return; }
    doc.open(); doc.write(html); doc.close();
    setTimeout(() => {
      try { iframe.contentWindow?.print(); } catch (e) { console.error(e); }
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 250);
    toast.success('Enviado a impresora');
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
            <Button variant="outline" className="btn-pos" onClick={handlePrintReport}>
              <Printer className="h-5 w-5 mr-2" />
              IMP-Ticket
            </Button>
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

        {/* Payment Method Summary */}
        {paymentSummary.length > 0 && (
          <Card className="border-2">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Detalle por Método de Pago</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                {paymentSummary.map(ps => (
                  <div key={ps.method} className="flex items-center gap-3 p-3 rounded-xl border-2 bg-card">
                    {getPaymentIcon(ps.method)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{ps.label}</p>
                      <p className="text-xs text-muted-foreground">{ps.count} transacciones</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-primary">S/ {ps.total.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">{ps.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
                  {settings.ticketLogoUrl && (
                    <img src={settings.ticketLogoUrl} alt="Logo" className="w-14 h-14 object-contain mx-auto mb-2" />
                  )}
                  <h3 className="text-lg font-bold">{settings.businessName}</h3>
                  <p className="text-xs">{settings.businessAddress}</p>
                  <p className="text-xs">Tel: {settings.businessPhone}</p>
                  {settings.businessRuc && <p className="text-xs">RUC: {settings.businessRuc}</p>}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between"><span>Ticket:</span><span className="font-bold">T-{selectedTicket.order_number}</span></div>
                  <div className="flex justify-between"><span>Fecha:</span><span>{new Date(selectedTicket.created_at).toLocaleDateString('es-PE')}</span></div>
                  <div className="flex justify-between"><span>Hora:</span><span>{new Date(selectedTicket.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span></div>
                  {selectedTicket.customer_name && <div className="flex justify-between"><span>Cliente:</span><span>{selectedTicket.customer_name}</span></div>}
                  {selectedTicket.customer_dni && <div className="flex justify-between"><span>DNI:</span><span>{selectedTicket.customer_dni}</span></div>}
                </div>

                <div className="border-t border-dashed border-border pt-2 space-y-2">
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

                {settings.ticketPromoText && (
                  <div className="text-center p-2 border border-dashed border-border rounded">
                    <p className="text-xs font-bold">🎉 PROMOCIÓN 🎉</p>
                    <p className="text-xs">{settings.ticketPromoText}</p>
                  </div>
                )}
                
                <div className="text-center text-muted-foreground text-xs pt-4 border-t border-dashed border-border">
                  <p>{settings.ticketFooterText || '¡Gracias por su preferencia!'}</p>
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
