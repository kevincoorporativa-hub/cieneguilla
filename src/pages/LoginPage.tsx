import { useState } from 'react';
import { Eye, EyeOff, Pizza, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const { settings } = useBusinessSettings();

  const handleResendConfirmation = async () => {
    if (!email) {
      toast.error('Ingresa tu correo para reenviar la confirmación');
      return;
    }

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success('Te enviamos nuevamente el correo de confirmación');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setNeedsEmailConfirmation(false);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success('¡Cuenta creada! Revisa tu correo para confirmar.');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          const maybeCode = (error as unknown as { code?: string }).code;
          const isNotConfirmed =
            maybeCode === 'email_not_confirmed' ||
            (typeof error.message === 'string' && error.message.toLowerCase().includes('not confirmed'));

          if (isNotConfirmed) {
            setNeedsEmailConfirmation(true);
            toast.error('Tu correo aún no está confirmado. Confírmalo para poder ingresar.');
          } else {
            toast.error('Credenciales incorrectas');
          }
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-2">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
            {settings.systemLogoUrl ? (
              <img src={settings.systemLogoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <Pizza className="h-12 w-12 text-primary-foreground" />
            )}
          </div>
          <div>
            <CardTitle className="text-pos-2xl">{settings.businessName}</CardTitle>
            <p className="text-muted-foreground mt-2">Sistema de Punto de Venta</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-pos-base font-semibold">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="pl-14 h-14 text-pos-lg rounded-xl"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-pos-base font-semibold">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingresa tu contraseña"
                  className="pl-14 pr-14 h-14 text-pos-lg rounded-xl"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full btn-pos-xl bg-primary hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading 
                ? (isSignUp ? 'Creando cuenta...' : 'Iniciando sesión...') 
                : (isSignUp ? 'Crear cuenta' : 'Ingresar al Sistema')}
            </Button>

            {!isSignUp && needsEmailConfirmation && (
              <div className="rounded-xl border p-4 text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  No podrás iniciar sesión hasta confirmar tu correo.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendConfirmation}
                  disabled={isLoading}
                >
                  Reenviar correo de confirmación
                </Button>
              </div>
            )}
          </form>

          {/* Toggle sign up / sign in */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline text-sm"
            >
              {isSignUp 
                ? '¿Ya tienes cuenta? Inicia sesión' 
                : '¿No tienes cuenta? Regístrate'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}