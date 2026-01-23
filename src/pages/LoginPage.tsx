import { useState } from 'react';
import { Eye, EyeOff, Pizza, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate login - will be replaced with Supabase auth
    setTimeout(() => {
      setIsLoading(false);
      navigate('/');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-6">
      <Card className="w-full max-w-lg border-2">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="mx-auto w-20 h-20 rounded-2xl bg-primary flex items-center justify-center">
            <Pizza className="h-12 w-12 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-pos-2xl">PizzaPOS</CardTitle>
            <p className="text-muted-foreground mt-2">Sistema de Punto de Venta</p>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Username */}
            <div className="space-y-2">
              <label className="text-pos-base font-semibold">Usuario</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Ingresa tu usuario"
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
              {isLoading ? 'Iniciando sesión...' : 'Ingresar al Sistema'}
            </Button>
          </form>

          {/* Demo info */}
          <div className="mt-8 p-4 bg-muted rounded-xl text-center">
            <p className="text-sm text-muted-foreground">
              <strong>Demo:</strong> Ingresa cualquier usuario y contraseña
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}