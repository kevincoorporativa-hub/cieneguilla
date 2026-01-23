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
        {/* Quantity controls - compact */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={() => onUpdateQuantity(item.id, item.cantidad - 1)}
          >
            <Minus className="h-4 w-4" />
          </Button>
          <span className="w-8 text-center font-bold text-pos-base">
            {item.cantidad}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-md"
            onClick={() => onUpdateQuantity(item.id, item.cantidad + 1)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Subtotal */}
        <span className="font-bold text-pos-lg text-primary flex-1 text-right">
          S/ {item.subtotal.toFixed(2)}
        </span>

        {/* Remove button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:bg-destructive/10 rounded-md"
          onClick={() => onRemove(item.id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
