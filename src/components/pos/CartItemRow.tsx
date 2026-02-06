import { Minus, Plus, Trash2 } from 'lucide-react';
import { CartItem } from '@/types/pos';
import { Button } from '@/components/ui/button';

interface CartItemRowProps {
  item: CartItem;
  onUpdateQuantity: (id: string, cantidad: number) => void;
  onRemove: (id: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemRowProps) {
  return (
    <div className="cart-item flex-col gap-2">
      {/* Row 1: Name and price per unit */}
      <div className="flex items-center justify-between w-full">
        <h4 className="font-bold text-pos-base truncate flex-1">{item.nombre}</h4>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          S/ {item.precioUnitario.toFixed(2)} c/u
        </span>
      </div>

      {/* Row 2: Quantity controls, subtotal, and remove */}
      <div className="flex items-center justify-between w-full gap-2">
        {/* Quantity controls - touch optimized with larger targets */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          <button
            className="qty-btn bg-background hover:bg-muted-foreground/10 text-foreground"
            onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
            aria-label="Disminuir cantidad"
          >
            <Minus className="h-5 w-5" />
          </button>
          <span className="w-10 text-center font-bold text-pos-lg">
            {item.cantidad}
          </span>
          <button
            className="qty-btn bg-primary text-primary-foreground"
            onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
            aria-label="Aumentar cantidad"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>

        {/* Subtotal */}
        <span className="font-bold text-pos-lg text-primary flex-1 text-right">
          S/ {item.subtotal.toFixed(2)}
        </span>

        {/* Remove button - touch optimized */}
        <button
          className="qty-btn bg-destructive/10 text-destructive hover:bg-destructive/20"
          onClick={() => onRemove(item.id)}
          aria-label="Eliminar producto"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
