import { Plus, Package } from 'lucide-react';
import { ComboCompleto } from '@/types/pos';
import { Button } from '@/components/ui/button';

interface ComboCardProps {
  combo: ComboCompleto;
  onAdd: (combo: ComboCompleto) => void;
}

export function ComboCard({ combo, onAdd }: ComboCardProps) {
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

        {/* Temporal badge */}
        {combo.temporal && (
          <span className="inline-block px-2 py-0.5 text-xs font-semibold rounded-full bg-warning/10 text-warning">
            Temporal
          </span>
        )}
      </div>

      {/* Price and add button */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <span className="font-bold text-lg text-primary">
          S/ {combo.precio.toFixed(2)}
        </span>
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
