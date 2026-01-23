import { useState } from 'react';
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
  Smartphone
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
import { toast } from 'sonner';
import { exportToExcel, exportToPDF, ExportData } from '@/utils/exportUtils';

interface CashMovement {
  id: string;
  tipo: 'ingreso' | 'egreso' | 'venta';
  descripcion: string;
  monto: number;
  metodoPago?: string;
  hora: Date;
  usuario: string;
}

interface CajaHistorial {
  id: string;
  fecha: Date;
  horaApertura: Date;
  horaCierre: Date;
  usuario: string;
  montoInicial: number;
  totalVentas: number;
  efectivoEsperado: number;
  efectivoContado: number;
  diferencia: number;
  observaciones?: string;
}

// Demo data
const demoMovements: CashMovement[] = [
  { id: '1', tipo: 'venta', descripcion: 'Ticket T-100', monto: 65.00, metodoPago: 'Efectivo', hora: new Date(Date.now() - 3600000 * 5), usuario: 'Carlos García' },
  { id: '2', tipo: 'venta', descripcion: 'Ticket T-101', monto: 45.00, metodoPago: 'Yape', hora: new Date(Date.now() - 3600000 * 4), usuario: 'Carlos García' },
  { id: '3', tipo: 'egreso', descripcion: 'Compra de insumos', monto: -150.00, hora: new Date(Date.now() - 3600000 * 3), usuario: 'Carlos García' },
  { id: '4', tipo: 'venta', descripcion: 'Ticket T-102', monto: 98.00, metodoPago: 'Efectivo', hora: new Date(Date.now() - 3600000 * 2), usuario: 'Carlos García' },
  { id: '5', tipo: 'venta', descripcion: 'Ticket T-103', monto: 32.00, metodoPago: 'Plin', hora: new Date(Date.now() - 3600000), usuario: 'Carlos García' },
  { id: '6', tipo: 'ingreso', descripcion: 'Devolución proveedor', monto: 50.00, hora: new Date(Date.now() - 1800000), usuario: 'Carlos García' },
];

const demoHistorial: CajaHistorial[] = [
  { 
    id: '1', 
    fecha: new Date(Date.now() - 24 * 60 * 60 * 1000), 
    horaApertura: new Date(Date.now() - 24 * 60 * 60 * 1000), 
    horaCierre: new Date(Date.now() - 12 * 60 * 60 * 1000),
    usuario: 'Carlos García',
    montoInicial: 500,
    totalVentas: 2150,
    efectivoEsperado: 1850,
    efectivoContado: 1850,
    diferencia: 0
  },
  { 
    id: '2', 
    fecha: new Date(Date.now() - 48 * 60 * 60 * 1000), 
    horaApertura: new Date(Date.now() - 48 * 60 * 60 * 1000), 
    horaCierre: new Date(Date.now() - 36 * 60 * 60 * 1000),
    usuario: 'Ana Torres',
    montoInicial: 500,
    totalVentas: 1890,
    efectivoEsperado: 1620,
    efectivoContado: 1600,
    diferencia: -20,
    observaciones: 'Faltante por error en vuelto'
  },
];

export default function CajaPage() {
  const [isCajaOpen, setIsCajaOpen] = useState(true);
  const [montoInicial, setMontoInicial] = useState('500');
  const [efectivoContado, setEfectivoContado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [movements] = useState<CashMovement[]>(demoMovements);
  const [historial] = useState<CajaHistorial[]>(demoHistorial);

  // Demo data
  const resumenVentas = {
    efectivo: 1250.00,
    yape: 450.00,
    plin: 320.00,
    transferencia: 180.00,
  };

  const totalVentas = Object.values(resumenVentas).reduce((a, b) => a + b, 0);
  const efectivoEsperado = parseFloat(montoInicial) + resumenVentas.efectivo;
  const diferencia = parseFloat(efectivoContado || '0') - efectivoEsperado;

  const getExportDataCierre = (): ExportData => {
    const today = new Date().toLocaleDateString('es-PE');
    return {
      title: 'Cierre de Caja',
      subtitle: `Fecha: ${today} | Usuario: Carlos García`,
      headers: ['Concepto', 'Monto'],
      rows: [
        ['Monto Inicial', `S/ ${parseFloat(montoInicial).toFixed(2)}`],
        ['Ventas Efectivo', `S/ ${resumenVentas.efectivo.toFixed(2)}`],
        ['Ventas Yape', `S/ ${resumenVentas.yape.toFixed(2)}`],
        ['Ventas Plin', `S/ ${resumenVentas.plin.toFixed(2)}`],
        ['Ventas Transferencia', `S/ ${resumenVentas.transferencia.toFixed(2)}`],
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
      headers: ['Hora', 'Tipo', 'Descripción', 'Método', 'Monto', 'Usuario'],
      rows: movements.map(m => [
        m.hora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
        m.tipo === 'venta' ? 'Venta' : m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso',
        m.descripcion,
        m.metodoPago || '-',
        `S/ ${m.monto.toFixed(2)}`,
        m.usuario
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

  const handleCerrarCaja = () => {
    toast.success('Caja cerrada correctamente');
    setIsCajaOpen(false);
  };

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
                        <p className="font-bold text-pos-lg">{new Date().toLocaleDateString('es-PE')}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Hora Apertura</p>
                        <p className="font-bold text-pos-lg">09:00 AM</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Usuario</p>
                        <p className="font-bold text-pos-lg">Carlos García</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Monto Inicial</p>
                        <p className="font-bold text-pos-lg text-primary">S/ {parseFloat(montoInicial).toFixed(2)}</p>
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
                          Transferencia
                        </span>
                        <span className="font-bold text-pos-lg">S/ {resumenVentas.transferencia.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border-2 border-primary">
                      <span className="font-bold text-pos-lg">TOTAL VENTAS</span>
                      <span className="font-bold text-pos-2xl text-primary">S/ {totalVentas.toFixed(2)}</span>
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
                        (Inicial S/ {parseFloat(montoInicial).toFixed(2)} + Ventas S/ {resumenVentas.efectivo.toFixed(2)})
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
                      disabled={!efectivoContado}
                      onClick={handleCerrarCaja}
                    >
                      <Save className="h-6 w-6 mr-2" />
                      Cerrar Caja
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
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
                  <Button variant="outline" onClick={handleExportMovimientosExcel}>
                    <FileSpreadsheet className="h-5 w-5 mr-2" />
                    Excel
                  </Button>
                  <Button variant="outline" onClick={handleExportMovimientosPDF}>
                    <Download className="h-5 w-5 mr-2" />
                    PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hora</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead>Usuario</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {movements.map((mov) => (
                      <TableRow key={mov.id}>
                        <TableCell className="font-medium">
                          {mov.hora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            mov.tipo === 'venta' 
                              ? 'bg-success/10 text-success'
                              : mov.tipo === 'ingreso'
                              ? 'bg-primary/10 text-primary'
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {mov.tipo === 'venta' ? 'Venta' : mov.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                          </span>
                        </TableCell>
                        <TableCell>{mov.descripcion}</TableCell>
                        <TableCell>{mov.metodoPago || '-'}</TableCell>
                        <TableCell className={`text-right font-bold ${
                          mov.monto >= 0 ? 'text-success' : 'text-destructive'
                        }`}>
                          {mov.monto >= 0 ? '+' : ''} S/ {mov.monto.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{mov.usuario}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Usuario</TableHead>
                      <TableHead>Apertura</TableHead>
                      <TableHead>Cierre</TableHead>
                      <TableHead>M. Inicial</TableHead>
                      <TableHead>Ventas</TableHead>
                      <TableHead>Esperado</TableHead>
                      <TableHead>Contado</TableHead>
                      <TableHead>Diferencia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historial.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">
                          {h.fecha.toLocaleDateString('es-PE')}
                        </TableCell>
                        <TableCell>{h.usuario}</TableCell>
                        <TableCell>
                          {h.horaApertura.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>
                          {h.horaCierre.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        </TableCell>
                        <TableCell>S/ {h.montoInicial.toFixed(2)}</TableCell>
                        <TableCell className="font-bold text-success">S/ {h.totalVentas.toFixed(2)}</TableCell>
                        <TableCell>S/ {h.efectivoEsperado.toFixed(2)}</TableCell>
                        <TableCell>S/ {h.efectivoContado.toFixed(2)}</TableCell>
                        <TableCell className={`font-bold ${
                          h.diferencia === 0 
                            ? 'text-success' 
                            : h.diferencia > 0 
                            ? 'text-success'
                            : 'text-destructive'
                        }`}>
                          {h.diferencia >= 0 ? '+' : ''} S/ {h.diferencia.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}
