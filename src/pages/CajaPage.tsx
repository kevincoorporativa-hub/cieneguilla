import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Clock, 
  Calculator, 
  Save, 
  CheckCircle,
  Download,
  FileSpreadsheet,
  History,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Banknote,
  Smartphone,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { exportToExcel, exportToPDF, ExportData } from '@/utils/exportUtils';
import { 
  useCurrentCashSession, 
  useCashSessionSummary, 
  useCashSessionHistory,
  useOpenCashSession,
  useCloseCashSession,
  useTerminals
} from '@/hooks/useCashSession';
import { usePaymentsBySession } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function CajaPage() {
  const [montoInicial, setMontoInicial] = useState('500');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [selectedTerminal, setSelectedTerminal] = useState<string>('');

  // Fetch data
  const { data: currentSession, isLoading: loadingSession } = useCurrentCashSession();
  const { data: sessionSummary, isLoading: loadingSummary } = useCashSessionSummary(currentSession?.id || null);
  const { data: sessionHistory = [], isLoading: loadingHistory } = useCashSessionHistory();
  const { data: payments = [], isLoading: loadingPayments } = usePaymentsBySession(currentSession?.id || null);
  const { data: terminals = [] } = useTerminals();

  // Mutations
  const openSession = useOpenCashSession();
  const closeSession = useCloseCashSession();

  // Set default terminal
  useEffect(() => {
    if (terminals.length > 0 && !selectedTerminal) {
      setSelectedTerminal(terminals[0].id);
    }
  }, [terminals, selectedTerminal]);

  const isCajaOpen = !!currentSession;

  // Calculate totals from summary
  const resumenVentas = {
    efectivo: sessionSummary?.cash_total || 0,
    yape: sessionSummary?.yape_total || 0,
    plin: sessionSummary?.plin_total || 0,
    transferencia: sessionSummary?.card_total || 0, // card includes transfers
  };

  const totalVentas = sessionSummary?.total_sales || 0;
  const efectivoEsperado = (currentSession?.opening_amount || 0) + resumenVentas.efectivo;
  const diferencia = parseFloat(efectivoContado || '0') - efectivoEsperado;

  const handleOpenCaja = async () => {
    if (!selectedTerminal) {
      toast.error('Seleccione un terminal');
      return;
    }

    try {
      await openSession.mutateAsync({
        terminalId: selectedTerminal,
        openingAmount: parseFloat(montoInicial) || 0,
      });
      toast.success('Caja abierta correctamente');
    } catch (error: any) {
      toast.error('Error al abrir caja', { description: error.message });
    }
  };

  const handleCerrarCaja = async () => {
    if (!currentSession) return;

    try {
      await closeSession.mutateAsync({
        sessionId: currentSession.id,
        closingAmount: parseFloat(efectivoContado) || 0,
        notes: observaciones || undefined,
      });
      toast.success('Caja cerrada correctamente');
      setEfectivoContado('');
      setObservaciones('');
    } catch (error: any) {
      toast.error('Error al cerrar caja', { description: error.message });
    }
  };

  const getExportDataCierre = (): ExportData => {
    const today = new Date().toLocaleDateString('es-PE');
    return {
      title: 'Cierre de Caja',
      subtitle: `Fecha: ${today} | Cajero: ${sessionSummary?.cashier_name || 'N/A'}`,
      headers: ['Concepto', 'Monto'],
      rows: [
        ['Monto Inicial', `S/ ${(currentSession?.opening_amount || 0).toFixed(2)}`],
        ['Ventas Efectivo', `S/ ${resumenVentas.efectivo.toFixed(2)}`],
        ['Ventas Yape', `S/ ${resumenVentas.yape.toFixed(2)}`],
        ['Ventas Plin', `S/ ${resumenVentas.plin.toFixed(2)}`],
        ['Ventas Tarjeta/Transferencia', `S/ ${resumenVentas.transferencia.toFixed(2)}`],
        ['Total Ventas', `S/ ${totalVentas.toFixed(2)}`],
        ['Efectivo Esperado', `S/ ${efectivoEsperado.toFixed(2)}`],
        ['Efectivo Contado', `S/ ${parseFloat(efectivoContado || '0').toFixed(2)}`],
        ['Diferencia', `S/ ${diferencia.toFixed(2)}`],
        ['Observaciones', observaciones || '-']
      ]
    };
  };

  const getExportDataMovimientos = (): ExportData => {
    return {
      title: 'Movimientos de Caja',
      subtitle: `Fecha: ${new Date().toLocaleDateString('es-PE')}`,
      headers: ['Hora', 'Tipo', 'Orden #', 'Método', 'Monto'],
      rows: payments.map((p: any) => [
        format(new Date(p.created_at), 'HH:mm', { locale: es }),
        'Venta',
        p.order?.order_number || '-',
        p.method === 'cash' ? 'Efectivo' : p.method === 'yape' ? 'Yape' : p.method === 'plin' ? 'Plin' : 'Otro',
        `S/ ${Number(p.amount).toFixed(2)}`,
      ])
    };
  };

  const handleExportCierreExcel = () => {
    exportToExcel(getExportDataCierre(), 'cierre_caja');
    toast.success('Cierre exportado a Excel');
  };

  const handleExportCierrePDF = () => {
    exportToPDF(getExportDataCierre(), 'cierre_caja');
    toast.success('Cierre exportado a PDF');
  };

  const handleExportMovimientosExcel = () => {
    exportToExcel(getExportDataMovimientos(), 'movimientos_caja');
    toast.success('Movimientos exportados a Excel');
  };

  const handleExportMovimientosPDF = () => {
    exportToPDF(getExportDataMovimientos(), 'movimientos_caja');
    toast.success('Movimientos exportados a PDF');
  };

  const isLoading = loadingSession || loadingSummary;

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-pos-2xl font-bold">Control de Caja</h1>
            <p className="text-muted-foreground">Apertura, movimientos y cierre de caja</p>
          </div>
          <div className={`px-6 py-3 rounded-xl font-bold text-pos-lg ${
            isCajaOpen 
              ? 'bg-success text-success-foreground' 
              : 'bg-muted text-muted-foreground'
          }`}>
            <div className="flex items-center gap-2">
              {isCajaOpen ? <CheckCircle className="h-6 w-6" /> : <Clock className="h-6 w-6" />}
              {isCajaOpen ? 'Caja Abierta' : 'Caja Cerrada'}
            </div>
          </div>
        </div>

        <Tabs defaultValue="actual" className="space-y-6">
          <TabsList className="h-14 p-1 bg-muted rounded-xl">
            <TabsTrigger value="actual" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Calculator className="h-5 w-5 mr-2" />
              Caja Actual
            </TabsTrigger>
            <TabsTrigger value="movimientos" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <DollarSign className="h-5 w-5 mr-2" />
              Movimientos
            </TabsTrigger>
            <TabsTrigger value="historial" className="h-12 px-6 text-pos-base font-semibold rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <History className="h-5 w-5 mr-2" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* Tab: Caja Actual */}
          <TabsContent value="actual">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-6">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
              </div>
            ) : !isCajaOpen ? (
              // Open cash register UI
              <Card className="border-2 max-w-xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5" />
                    Abrir Sesión de Caja
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Debe abrir una sesión de caja para poder registrar ventas en el POS.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Terminal</label>
                    <Select value={selectedTerminal} onValueChange={setSelectedTerminal}>
                      <SelectTrigger className="h-14 text-pos-lg">
                        <SelectValue placeholder="Seleccionar terminal" />
                      </SelectTrigger>
                      <SelectContent>
                        {terminals.map((t: any) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} - {t.store?.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-pos-base font-semibold">Monto Inicial (Fondo de caja)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pos-lg font-bold text-muted-foreground">
                        S/
                      </span>
                      <Input
                        type="number"
                        value={montoInicial}
                        onChange={(e) => setMontoInicial(e.target.value)}
                        placeholder="0.00"
                        className="pl-12 h-16 text-pos-xl font-bold rounded-xl"
                      />
                    </div>
                  </div>

                  <Button 
                    className="w-full btn-pos-xl bg-success hover:bg-success/90"
                    onClick={handleOpenCaja}
                    disabled={openSession.isPending || !selectedTerminal}
                  >
                    <PlayCircle className="h-6 w-6 mr-2" />
                    {openSession.isPending ? 'Abriendo...' : 'Abrir Caja'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                {/* Left - Cash register info */}
                <div className="space-y-6">
                  {/* Opening */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Información de Apertura
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Fecha</p>
                          <p className="font-bold text-pos-lg">
                            {currentSession?.opened_at 
                              ? format(new Date(currentSession.opened_at), 'dd/MM/yyyy', { locale: es })
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Hora Apertura</p>
                          <p className="font-bold text-pos-lg">
                            {currentSession?.opened_at 
                              ? format(new Date(currentSession.opened_at), 'hh:mm a', { locale: es })
                              : '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Terminal</p>
                          <p className="font-bold text-pos-lg">{sessionSummary?.terminal_name || '-'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Monto Inicial</p>
                          <p className="font-bold text-pos-lg text-primary">
                            S/ {(currentSession?.opening_amount || 0).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sales summary */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Resumen de Ventas del Día
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                          <span className="font-medium flex items-center gap-2">
                            <Banknote className="h-5 w-5 text-success" />
                            Efectivo
                          </span>
                          <span className="font-bold text-pos-lg">S/ {resumenVentas.efectivo.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                          <span className="font-medium flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-purple-500" />
                            Yape
                          </span>
                          <span className="font-bold text-pos-lg">S/ {resumenVentas.yape.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                          <span className="font-medium flex items-center gap-2">
                            <Smartphone className="h-5 w-5 text-teal-500" />
                            Plin
                          </span>
                          <span className="font-bold text-pos-lg">S/ {resumenVentas.plin.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted rounded-xl">
                          <span className="font-medium flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-500" />
                            Tarjeta/Transferencia
                          </span>
                          <span className="font-bold text-pos-lg">S/ {resumenVentas.transferencia.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border-2 border-primary">
                        <span className="font-bold text-pos-lg">TOTAL VENTAS</span>
                        <span className="font-bold text-pos-2xl text-primary">S/ {totalVentas.toFixed(2)}</span>
                      </div>
                      <div className="text-center text-sm text-muted-foreground">
                        {sessionSummary?.orders_count || 0} órdenes procesadas
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right - Cash count */}
                <div className="space-y-6">
                  <Card className="border-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5" />
                        Cierre de Caja
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportCierreExcel}>
                          <FileSpreadsheet className="h-4 w-4 mr-1" />
                          Excel
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleExportCierrePDF}>
                          <Download className="h-4 w-4 mr-1" />
                          PDF
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Expected cash */}
                      <div className="p-4 bg-muted rounded-xl">
                        <p className="text-sm text-muted-foreground">Efectivo Esperado en Caja</p>
                        <p className="font-bold text-pos-2xl">S/ {efectivoEsperado.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          (Inicial S/ {(currentSession?.opening_amount || 0).toFixed(2)} + Ventas S/ {resumenVentas.efectivo.toFixed(2)})
                        </p>
                      </div>

                      {/* Counted cash input */}
                      <div className="space-y-2">
                        <label className="text-pos-base font-semibold">Efectivo Contado</label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pos-lg font-bold text-muted-foreground">
                            S/
                          </span>
                          <Input
                            type="number"
                            value={efectivoContado}
                            onChange={(e) => setEfectivoContado(e.target.value)}
                            placeholder="0.00"
                            className="pl-12 h-16 text-pos-xl font-bold rounded-xl"
                          />
                        </div>
                      </div>

                      {/* Difference */}
                      {efectivoContado && (
                        <div className={`p-4 rounded-xl ${
                          diferencia === 0 
                            ? 'bg-success/10 border-2 border-success' 
                            : diferencia > 0 
                              ? 'bg-success/10 border-2 border-success'
                              : 'bg-destructive/10 border-2 border-destructive'
                        }`}>
                          <div className="flex items-center gap-2">
                            {diferencia >= 0 ? (
                              <TrendingUp className="h-6 w-6 text-success" />
                            ) : (
                              <TrendingDown className="h-6 w-6 text-destructive" />
                            )}
                            <div>
                              <p className="text-sm text-muted-foreground">Diferencia</p>
                              <p className={`font-bold text-pos-2xl ${
                                diferencia === 0 ? 'text-success' : diferencia > 0 ? 'text-success' : 'text-destructive'
                              }`}>
                                {diferencia >= 0 ? '+' : ''} S/ {diferencia.toFixed(2)}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm mt-2">
                            {diferencia === 0 && '✓ El conteo coincide perfectamente'}
                            {diferencia > 0 && '↑ Sobrante de caja - revisar transacciones'}
                            {diferencia < 0 && '↓ Faltante de caja - revisar vueltos'}
                          </p>
                        </div>
                      )}

                      {/* Observations */}
                      <div className="space-y-2">
                        <label className="text-pos-base font-semibold">Observaciones</label>
                        <Textarea
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Notas sobre el cierre de caja..."
                          className="h-24 text-pos-base rounded-xl"
                        />
                      </div>

                      {/* Close button */}
                      <Button 
                        className="w-full btn-pos-xl bg-destructive hover:bg-destructive/90"
                        disabled={!efectivoContado || closeSession.isPending}
                        onClick={handleCerrarCaja}
                      >
                        <Save className="h-6 w-6 mr-2" />
                        {closeSession.isPending ? 'Cerrando...' : 'Cerrar Caja'}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Movimientos */}
          <TabsContent value="movimientos">
            <Card className="border-2">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Movimientos del Día
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleExportMovimientosExcel}>
                    <FileSpreadsheet className="h-4 w-4 mr-1" />
                    Excel
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportMovimientosPDF}>
                    <Download className="h-4 w-4 mr-1" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loadingPayments ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : !isCajaOpen ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay sesión de caja abierta</p>
                  </div>
                ) : payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay movimientos registrados</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hora</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Orden #</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {format(new Date(payment.created_at), 'HH:mm', { locale: es })}
                          </TableCell>
                          <TableCell>
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-success/10 text-success">
                              Venta
                            </span>
                          </TableCell>
                          <TableCell className="font-mono">
                            #{payment.order?.order_number || '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              payment.method === 'cash' ? 'bg-success/10 text-success' :
                              payment.method === 'yape' ? 'bg-purple-100 text-purple-700' :
                              payment.method === 'plin' ? 'bg-teal-100 text-teal-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {payment.method === 'cash' ? 'Efectivo' : 
                               payment.method === 'yape' ? 'Yape' : 
                               payment.method === 'plin' ? 'Plin' : 
                               payment.method === 'card' ? 'Tarjeta' : 'Transferencia'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-bold text-success">
                            S/ {Number(payment.amount).toFixed(2)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Historial */}
          <TabsContent value="historial">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Cierres
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingHistory ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : sessionHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No hay historial de cierres</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Terminal</TableHead>
                        <TableHead>Cajero</TableHead>
                        <TableHead>Apertura</TableHead>
                        <TableHead>Cierre</TableHead>
                        <TableHead className="text-right">Total Ventas</TableHead>
                        <TableHead className="text-right">Diferencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessionHistory.map((session) => {
                        const diff = (session.closing_amount || 0) - ((session.opening_amount || 0) + (session.cash_total || 0));
                        return (
                          <TableRow key={session.session_id}>
                            <TableCell>
                              {session.closed_at 
                                ? format(new Date(session.closed_at), 'dd/MM/yyyy', { locale: es })
                                : '-'}
                            </TableCell>
                            <TableCell>{session.terminal_name}</TableCell>
                            <TableCell>{session.cashier_name || '-'}</TableCell>
                            <TableCell>
                              {session.opened_at 
                                ? format(new Date(session.opened_at), 'HH:mm', { locale: es })
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {session.closed_at 
                                ? format(new Date(session.closed_at), 'HH:mm', { locale: es })
                                : '-'}
                            </TableCell>
                            <TableCell className="text-right font-bold">
                              S/ {(session.total_sales || 0).toFixed(2)}
                            </TableCell>
                            <TableCell className={`text-right font-bold ${
                              diff === 0 ? 'text-success' : diff > 0 ? 'text-success' : 'text-destructive'
                            }`}>
                              {diff >= 0 ? '+' : ''} S/ {diff.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
