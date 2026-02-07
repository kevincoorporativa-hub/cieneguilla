import { ShieldAlert, Key } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function LicenseBlocker() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="h-10 w-10 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Licencia Vencida</h2>
          <p className="text-muted-foreground">
            La licencia del sistema ha expirado. No es posible realizar ventas hasta que un administrador renueve la licencia.
          </p>
        </div>
        {isAdmin ? (
          <Button
            size="lg"
            className="btn-pos gap-2"
            onClick={() => navigate('/configuracion')}
          >
            <Key className="h-5 w-5" />
            Renovar Licencia
          </Button>
        ) : (
          <div className="p-4 bg-muted rounded-xl">
            <p className="text-sm text-muted-foreground">
              Contacte al administrador del sistema para renovar la licencia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
