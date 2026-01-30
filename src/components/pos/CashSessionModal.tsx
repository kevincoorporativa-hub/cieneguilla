import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentCashSession, useOpenCashSession, useCloseCashSession, useTerminals, useCashSessionSummary } from '@/hooks/useCashSession';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { DollarSign, Lock, Unlock, AlertTriangle, Calendar } from 'lucide-react';
import { format, isToday, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface CashSessionModalProps {
  onSessionReady: () => void;
}

export function CashSessionModal({ onSessionReady }: CashSessionModalProps) {
  const { user, role } = useAuth();
  const { data: currentSession, isLoading: loadingSession } = useCurrentCashSession();
  const { data: terminals, isLoading: loadingTerminals } = useTerminals();
  const { data: sessionSummary } = useCashSessionSummary(currentSession?.id || null);
  
  const openSession = useOpenCashSession();
  const closeSession = useCloseCashSession();

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'open' | 'close' | 'pending-close'>('open');
  const [terminalId, setTerminalId] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [closingAmount, setClosingAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Check if user can operate POS
  const canOperatePOS = role === 'admin' || role === 'manager' || role === 'cashier';

  useEffect(() => {
    if (loadingSession || loadingTerminals) return;

    if (!canOperatePOS) {
      // Non-POS users don't need cash session
      onSessionReady();
      return;
    }

    if (currentSession) {
      // Check if session is from a previous day
      const sessionDate = parseISO(currentSession.opened_at);
      if (!isToday(sessionDate)) {
        // Session from previous day - must close first
        setMode('pending-close');
        setIsOpen(true);
      } else {
        // Session is from today - ready to go
        onSessionReady();
      }
    } else {
      // No session - must open one
      setMode('open');
      setIsOpen(true);
    }
  }, [currentSession, loadingSession, loadingTerminals, canOperatePOS, onSessionReady]);

  const handleOpenSession = async () => {
    if (!terminalId) {
      toast.error('Selecciona una terminal');
      return;
    }
    
    const amount = parseFloat(openingAmount) || 0;
    
    try {
      await openSession.mutateAsync({
        terminalId,
        openingAmount: amount,
      });
      toast.success('Caja abierta correctamente');
      setIsOpen(false);
      onSessionReady();
    } catch (error) {
      console.error('Error opening session:', error);
      toast.error('Error al abrir caja');
    }
  };

  const handleCloseSession = async () => {
    if (!currentSession) return;
    
    const amount = parseFloat(closingAmount) || 0;
    
    try {
      await closeSession.mutateAsync({
        sessionId: currentSession.id,
        closingAmount: amount,
        notes: notes || undefined,
      });
      toast.success('Caja cerrada correctamente');
      
      // After closing, need to open a new one
      setMode('open');
      setClosingAmount('');
      setNotes('');
    } catch (error) {
      console.error('Error closing session:', error);
      toast.error('Error al cerrar caja');
    }
  };

  if (loadingSession || loadingTerminals) {
    return (
      <Dialog open={true}>
        <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!canOperatePOS) return null;

  const sessionDate = currentSession ? format(parseISO(currentSession.opened_at), "EEEE d 'de' MMMM", { locale: es }) : '';

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-lg" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {mode === 'pending-close' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-warning">
                <AlertTriangle className="h-5 w-5" />
                Caja Pendiente de Cierre
              </DialogTitle>
              <DialogDescription>
                Tienes una caja abierta del día anterior que debes cerrar antes de continuar.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-warning font-medium mb-2">
                  <Calendar className="h-4 w-4" />
                  Sesión del {sessionDate}
                </div>
                {sessionSummary && (
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Monto inicial:</div>
                    <div className="font-medium">S/ {sessionSummary.opening_amount.toFixed(2)}</div>
                    <div>Ventas totales:</div>
                    <div className="font-medium text-success">S/ {sessionSummary.total_sales.toFixed(2)}</div>
                    <div>Efectivo esperado:</div>
                    <div className="font-medium">S/ {(sessionSummary.opening_amount + sessionSummary.cash_total).toFixed(2)}</div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="closingAmount">Monto de cierre (efectivo en caja)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
                  <Input
                    id="closingAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={closingAmount}
                    onChange={(e) => setClosingAmount(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas (opcional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observaciones del cierre..."
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleCloseSession} 
                disabled={closeSession.isPending}
                className="gap-2"
              >
                <Lock className="h-4 w-4" />
                {closeSession.isPending ? 'Cerrando...' : 'Cerrar Caja Anterior'}
              </Button>
            </div>
          </>
        )}

        {mode === 'open' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Abrir Caja del Día
              </DialogTitle>
              <DialogDescription>
                Debes abrir una caja para comenzar a operar el punto de venta.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="terminal">Terminal</Label>
                <Select value={terminalId} onValueChange={setTerminalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una terminal" />
                  </SelectTrigger>
                  <SelectContent>
                    {terminals?.map((terminal) => (
                      <SelectItem key={terminal.id} value={terminal.id}>
                        {terminal.name} - {(terminal.store as any)?.name || 'Sin tienda'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="openingAmount">Monto inicial (efectivo en caja)</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">S/</span>
                  <Input
                    id="openingAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={openingAmount}
                    onChange={(e) => setOpeningAmount(e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button 
                onClick={handleOpenSession} 
                disabled={openSession.isPending || !terminalId}
                className="gap-2"
              >
                <Unlock className="h-4 w-4" />
                {openSession.isPending ? 'Abriendo...' : 'Abrir Caja'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
