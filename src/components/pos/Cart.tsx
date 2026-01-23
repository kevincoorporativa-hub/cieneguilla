import { ShoppingCart, CreditCard, Percent, Trash2 } from 'lucide-react';
import { CartItem, Discount } from '@/types/pos';
import { CartItemRow } from './CartItemRow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CartProps {
  items: CartItem[];
  descuento?: Discount;
  onUpdateQuantity: (id: string, cantidad: number) => void;
  onRemove: (id: string) => void;
  onClearCart: () => void;
  onApplyDiscount: () => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  descuento,
  onUpdateQuantity,
  onRemove,
  onClearCart,
  onApplyDiscount,
  onCheckout,
}: CartProps) {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoMonto = descuento?.monto || 0;
  const total = subtotal - descuentoMonto;

  return (
    <div className="h-full flex flex-col bg-card rounded-2xl shadow-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <ShoppingCart className="h-7 w-7 text-primary" />
          <h2 className="text-pos-xl font-bold">Carrito</h2>
          <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
            {items.length}
          </span>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10"
            onClick={onClearCart}
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Vaciar
          </Button>
        )}
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-4 opacity-50" />
            <p className="text-pos-lg font-medium">Carrito vacío</p>
            <p className="text-sm">Selecciona productos para agregar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItemRow
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemove}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Totals and actions */}
      <div className="p-5 border-t border-border space-y-4 bg-card">
        {/* Totals */}
        <div className="space-y-3">
          <div className="flex justify-between text-pos-lg">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold">S/ {subtotal.toFixed(2)}</span>
          </div>
          {descuento && (
            <div className="flex justify-between text-pos-base text-success">
              <span>Descuento ({descuento.tipo})</span>
              <span className="font-semibold">- S/ {descuentoMonto.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-2xl font-bold pt-3 border-t-2 border-primary/20">
            <span>TOTAL</span>
            <span className="text-primary">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions - Larger buttons */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <Button
            variant="outline"
            className="h-16 text-lg font-bold rounded-xl border-2"
            onClick={onApplyDiscount}
            disabled={items.length === 0}
          >
            <Percent className="h-6 w-6 mr-2" />
            Descuento
          </Button>
          <Button
            className="h-16 text-lg font-bold rounded-xl bg-success hover:bg-success/90 text-success-foreground"
            onClick={onCheckout}
            disabled={items.length === 0}
          >
            <CreditCard className="h-6 w-6 mr-2" />
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  );
}
