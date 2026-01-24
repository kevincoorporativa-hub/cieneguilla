import { Plus, Package, TrendingDown } from 'lucide-react';
import { ComboCompleto } from '@/types/pos';
import { Button } from '@/components/ui/button';

interface ComboCardProps {
  combo: ComboCompleto;
  onAdd: (combo: ComboCompleto) => void;
  products?: { id: string; base_price: number }[];
}

export function ComboCard({ combo, onAdd, products = [] }: ComboCardProps) {
  // Calculate original price from components
  const precioOriginal = combo.componentes.reduce((sum, comp) => {
    const producto = products.find(p => p.id === comp.productoId);
    return sum + (Number(producto?.base_price) || 0) * comp.cantidad;
  }, 0);
  
  const ahorro = precioOriginal - combo.precio;
  const porcentajeAhorro = precioOriginal > 0 ? Math.round((ahorro / precioOriginal) * 100) : 0;

  return (
    <div className="relative bg-card border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 hover:border-primary/50 group">
      {/* Combo badge */}
      <div className="absolute -top-2 -right-2">
        <div className="bg-primary text-primary-foreground rounded-full p-1.5">
          <Package className="h-3 w-3" />
        </div>
      </div>

      {/* Availability indicator */}
      <div className="absolute top-3 right-3">
        <div className="w-3 h-3 rounded-full bg-success animate-pulse" />
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="font-bold text-pos-base pr-6 line-clamp-2">{combo.nombre}</h3>
        
        {combo.descripcion && (
          <p className="text-xs text-muted-foreground line-clamp-1">{combo.descripcion}</p>
        )}

        {/* Components preview */}
        <div className="text-xs text-muted-foreground space-y-0.5">
          {combo.componentes.slice(0, 2).map((comp, idx) => (
            <p key={idx} className="truncate">
              {comp.cantidad}x {comp.nombre}
            </p>
          ))}
          {combo.componentes.length > 2 && (
            <p className="text-primary">+{combo.componentes.length - 2} más</p>
          )}
        </div>

        {/* Savings badge */}
        {ahorro > 0 && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 w-fit">
            <TrendingDown className="h-3 w-3 text-success" />
            <span className="text-xs font-bold text-success">
              Ahorras S/ {ahorro.toFixed(2)} ({porcentajeAhorro}%)
            </span>
          </div>
        )}

        {/* Temporal badge */}
        {combo.temporal && (
          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-warning/10 text-warning">
            Temporal
          </span>
        )}
      </div>

      {/* Price and add button */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex flex-col">
          {precioOriginal > combo.precio && (
            <span className="text-xs text-muted-foreground line-through">
              S/ {precioOriginal.toFixed(2)}
            </span>
          )}
          <span className="font-bold text-lg text-primary">
            S/ {combo.precio.toFixed(2)}
          </span>
        </div>
        <Button
          size="icon"
          className="h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-lg"
          onClick={() => onAdd(combo)}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
