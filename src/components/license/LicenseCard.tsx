import { useState } from 'react';
import { Key, RefreshCw, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useLicenseStatus, useRenewLicense } from '@/hooks/useLicense';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const LICENSE_OPTIONS = [
  { value: '1', label: '1 día', days: 1 },
  { value: '3', label: '3 días', days: 3 },
  { value: '7', label: '1 semana', days: 7 },
  { value: '30', label: '1 mes', days: 30 },
  { value: '90', label: '3 meses', days: 90 },
  { value: '180', label: '6 meses', days: 180 },
  { value: '365', label: '1 año', days: 365 },
];

export function LicenseCard() {
  const { isAdmin } = useAuth();
  const { license, isLoading, isExpired, daysRemaining, isWarning, isCritical, expiresAt } = useLicenseStatus();
  const renewLicense = useRenewLicense();
  const [showRenewDialog, setShowRenewDialog] = useState(false);
  const [selectedDays, setSelectedDays] = useState('30');
  const [notes, setNotes] = useState('');

  const handleRenew = async () => {
    const option = LICENSE_OPTIONS.find(o => o.value === selectedDays);
    if (!option) return;

    try {
      await renewLicense.mutateAsync({
        days: option.days,
        licenseType: option.label,
        notes: notes.trim() || undefined,
      });
      toast.success(`Licencia renovada por ${option.label}`);
      setShowRenewDialog(false);
      setNotes('');
    } catch (e: any) {
      toast.error(e.message || 'Error al renovar licencia');
    }
  };

  const getStatusColor = () => {
    if (isExpired) return 'bg-destructive/10 border-destructive';
    if (isCritical) return 'bg-destructive/10 border-destructive';
    if (isWarning) return 'bg-warning/10 border-warning';
    return 'bg-success/10 border-success';
  };

  const getStatusBadge = () => {
    if (isExpired) return (
      <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive text-destructive-foreground">
        VENCIDA
      </span>
    );
    if (isCritical) return (
      <span className="px-3 py-1 rounded-full text-sm font-bold bg-destructive text-destructive-foreground">
        POR VENCER
      </span>
    );
    if (isWarning) return (
      <span className="px-3 py-1 rounded-full text-sm font-bold bg-warning text-warning-foreground">
        PRONTO A VENCER
      </span>
    );
    return (
      <span className="px-3 py-1 rounded-full text-sm font-bold bg-success text-success-foreground">
        ACTIVA
      </span>
    );
  };

  const getDaysColor = () => {
    if (isExpired) return 'text-destructive';
    if (isCritical) return 'text-destructive';
    if (isWarning) return 'text-warning';
    return 'text-success';
  };

  if (isLoading) {
    return (
      <Card className="border-2">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Licencia del Sistema
          </CardTitle>
          <CardDescription>
            Estado de tu licencia actual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className={`p-4 rounded-xl border-2 ${getStatusColor()}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">Estado:</span>
              {getStatusBadge()}
            </div>
            {license && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-semibold">{license.license_type}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-muted-foreground">Vence:</span>
                  <span className="font-semibold">
                    {expiresAt ? format(expiresAt, 'dd/MM/yyyy', { locale: es }) : '-'}
                  </span>
                </div>
              </>
            )}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Días restantes:</span>
              <span className={`font-bold ${getDaysColor()}`}>
                {isExpired ? '0 días' : `${daysRemaining} días`}
              </span>
            </div>
          </div>

          {isExpired && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-sm font-medium text-destructive">
                La licencia ha vencido. El Punto de Venta está bloqueado hasta que un administrador renueve la licencia.
              </p>
            </div>
          )}

          {!license && !isExpired && (
            <div className="p-3 rounded-xl bg-warning/10 border border-warning flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0" />
              <p className="text-sm font-medium">
                No hay licencia configurada. Contacte al administrador.
              </p>
            </div>
          )}

          {isAdmin && (
            <Button 
              variant="outline" 
              className="w-full btn-pos"
              onClick={() => setShowRenewDialog(true)}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Renovar Licencia
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Renew Dialog */}
      <Dialog open={showRenewDialog} onOpenChange={setShowRenewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renovar Licencia</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Duración</label>
              <Select value={selectedDays} onValueChange={setSelectedDays}>
                <SelectTrigger className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LICENSE_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label} ({opt.days} días)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas (opcional)</label>
              <Input
                placeholder="Ej: Pago por transferencia"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="h-12"
              />
            </div>
            <div className="p-3 bg-muted rounded-xl text-sm">
              <p><strong>Nueva fecha de vencimiento:</strong></p>
              <p className="text-primary font-bold">
                {format(
                  new Date(Date.now() + parseInt(selectedDays) * 24 * 60 * 60 * 1000),
                  'dd/MM/yyyy',
                  { locale: es }
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRenew} disabled={renewLicense.isPending}>
              {renewLicense.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirmar Renovación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
