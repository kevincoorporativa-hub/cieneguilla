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
    <div className="h-full flex flex-col bg-card rounded-xl lg:rounded-2xl shadow-lg border border-border">
      {/* Header */}
      <div className="flex items-center justify-between p-2 lg:p-3 xl:p-4 border-b border-border">
        <div className="flex items-center gap-2 lg:gap-3">
          <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 xl:h-7 xl:w-7 text-primary" />
          <h2 className="text-base lg:text-lg xl:text-xl font-bold">Carrito</h2>
          <span className="bg-primary text-primary-foreground px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs lg:text-sm font-bold">
            {items.length}
          </span>
        </div>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:bg-destructive/10 text-xs lg:text-sm h-8 lg:h-9 px-2 lg:px-3"
            onClick={onClearCart}
          >
            <Trash2 className="h-4 w-4 lg:mr-1 xl:mr-2" />
            <span className="hidden lg:inline">Vaciar</span>
          </Button>
        )}
      </div>

      {/* Items */}
      <ScrollArea className="flex-1 p-2 lg:p-3 xl:p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 lg:h-40 xl:h-48 text-muted-foreground">
            <ShoppingCart className="h-10 w-10 lg:h-12 lg:w-12 xl:h-16 xl:w-16 mb-2 lg:mb-3 xl:mb-4 opacity-50" />
            <p className="text-sm lg:text-base xl:text-lg font-medium">Carrito vacío</p>
            <p className="text-xs lg:text-sm">Selecciona productos para agregar</p>
          </div>
        ) : (
          <div className="space-y-2 lg:space-y-3">
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
      <div className="p-3 lg:p-4 xl:p-5 border-t border-border space-y-2 lg:space-y-3 xl:space-y-4 bg-card">
        {/* Totals */}
        <div className="space-y-1.5 lg:space-y-2 xl:space-y-3">
          <div className="flex justify-between text-sm lg:text-base xl:text-lg">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold">S/ {subtotal.toFixed(2)}</span>
          </div>
          {descuento && (
            <div className="flex justify-between text-xs lg:text-sm xl:text-base text-success">
              <span>Descuento ({descuento.tipo})</span>
              <span className="font-semibold">- S/ {descuentoMonto.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-lg lg:text-xl xl:text-2xl font-bold pt-2 lg:pt-3 border-t-2 border-primary/20">
            <span>TOTAL</span>
            <span className="text-primary">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Actions - Responsive buttons */}
        <div className="grid grid-cols-2 gap-2 lg:gap-3 xl:gap-4 pt-1 lg:pt-2">
          <Button
            variant="outline"
            className="h-10 lg:h-12 xl:h-16 text-xs lg:text-sm xl:text-lg font-bold rounded-lg lg:rounded-xl border-2"
            onClick={onApplyDiscount}
            disabled={items.length === 0}
          >
            <Percent className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 mr-1 lg:mr-2" />
            <span className="hidden lg:inline">Descuento</span>
            <span className="lg:hidden">Desc.</span>
          </Button>
          <Button
            className="h-10 lg:h-12 xl:h-16 text-xs lg:text-sm xl:text-lg font-bold rounded-lg lg:rounded-xl bg-success hover:bg-success/90 text-success-foreground"
            onClick={onCheckout}
            disabled={items.length === 0}
          >
            <CreditCard className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 mr-1 lg:mr-2" />
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  );
}
