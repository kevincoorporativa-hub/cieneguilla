import { useState, useCallback } from 'react';
import { ShoppingCart, CreditCard, Percent, Trash2, X } from 'lucide-react';
import { CartItem, Discount } from '@/types/pos';
import { CartItemRow } from './CartItemRow';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { cn } from '@/lib/utils';

interface SwipeableCartProps {
  items: CartItem[];
  descuento?: Discount;
  onUpdateQuantity: (id: string, cantidad: number) => void;
  onRemove: (id: string) => void;
  onClearCart: () => void;
  onApplyDiscount: () => void;
  onCheckout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function SwipeableCart({
  items,
  descuento,
  onUpdateQuantity,
  onRemove,
  onClearCart,
  onApplyDiscount,
  onCheckout,
  isOpen = true,
  onClose,
}: SwipeableCartProps) {
  const [swipeState, setSwipeState] = useState<'none' | 'left' | 'right'>('none');

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const descuentoMonto = descuento?.monto || 0;
  const total = subtotal - descuentoMonto;

  const handleSwipeLeft = useCallback(() => {
    setSwipeState('left');
    // Swipe left to clear last item
    if (items.length > 0) {
      const lastItem = items[items.length - 1];
      onRemove(lastItem.id);
    }
    setTimeout(() => setSwipeState('none'), 300);
  }, [items, onRemove]);

  const handleSwipeRight = useCallback(() => {
    setSwipeState('right');
    // Swipe right on mobile could close the cart
    onClose?.();
    setTimeout(() => setSwipeState('none'), 300);
  }, [onClose]);

  const swipeHandlers = useSwipeGesture({
    threshold: 80,
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  });

  return (
    <div 
      className={cn(
        "h-full flex flex-col bg-card rounded-xl lg:rounded-2xl shadow-lg border border-border cart-swipeable",
        swipeState === 'left' && 'swiping-left',
        swipeState === 'right' && 'swiping-right'
      )}
      {...swipeHandlers}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 lg:p-4 xl:p-5 border-b border-border">
        <div className="flex items-center gap-2 lg:gap-3">
          <ShoppingCart className="h-5 w-5 lg:h-6 lg:w-6 xl:h-8 xl:w-8 text-primary" />
          <h2 className="text-base lg:text-lg xl:text-2xl font-bold">Carrito</h2>
          <span className="bg-primary text-primary-foreground px-2 lg:px-3 py-0.5 lg:py-1 rounded-full text-xs lg:text-sm xl:text-base font-bold">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:bg-destructive/10 text-xs lg:text-sm h-9 lg:h-10 xl:h-12 px-2 lg:px-3 touch-active"
              onClick={onClearCart}
            >
              <Trash2 className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6 lg:mr-2" />
              <span className="hidden lg:inline">Vaciar</span>
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden h-9 w-9 p-0 touch-active"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      {/* Totals and actions - NOW AT TOP */}
      <div className="p-3 lg:p-4 xl:p-6 border-b border-border space-y-3 lg:space-y-4 xl:space-y-5 bg-card">
        {/* Totals */}
        <div className="space-y-2 lg:space-y-3 xl:space-y-4">
          <div className="flex justify-between text-sm lg:text-base xl:text-xl">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-bold">S/ {subtotal.toFixed(2)}</span>
          </div>
          {descuento && (
            <div className="flex justify-between text-xs lg:text-sm xl:text-lg text-success">
              <span>Descuento ({descuento.tipo})</span>
              <span className="font-semibold">- S/ {descuentoMonto.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl lg:text-2xl xl:text-3xl font-bold pt-2 lg:pt-3 border-t-2 border-primary/20">
            <span>TOTAL</span>
            <span className="text-primary">S/ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Touch-friendly stacked buttons */}
        <div className="flex flex-col gap-3 lg:gap-4 pt-3">
          <Button
            className="h-20 lg:h-24 xl:h-28 text-xl lg:text-2xl xl:text-3xl font-bold rounded-xl lg:rounded-2xl bg-success hover:bg-success/90 text-success-foreground touch-active"
            onClick={onCheckout}
            disabled={items.length === 0}
          >
            <CreditCard className="h-8 w-8 lg:h-10 lg:w-10 xl:h-12 xl:w-12 mr-3" />
            Cobrar
          </Button>
          <Button
            variant="outline"
            className="h-14 lg:h-16 xl:h-20 text-base lg:text-lg xl:text-xl font-bold rounded-xl lg:rounded-2xl border-2 touch-active"
            onClick={onApplyDiscount}
            disabled={items.length === 0}
          >
            <Percent className="h-6 w-6 lg:h-7 lg:w-7 xl:h-8 xl:w-8 mr-2" />
            Descuento
          </Button>
        </div>
      </div>

      {/* Swipe hint for touch devices */}
      <div className="lg:hidden px-3 py-1 bg-muted/50 text-center text-xs text-muted-foreground">
        ← Desliza para eliminar último item
      </div>

      {/* Items - NOW AT BOTTOM */}
      <ScrollArea className="flex-1 p-2 lg:p-3 xl:p-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 lg:h-48 xl:h-56 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 lg:h-16 lg:w-16 xl:h-20 xl:w-20 mb-3 lg:mb-4 opacity-50" />
            <p className="text-sm lg:text-base xl:text-xl font-medium">Carrito vacío</p>
            <p className="text-xs lg:text-sm xl:text-base">Selecciona productos para agregar</p>
          </div>
        ) : (
          <div className="space-y-2 lg:space-y-3 xl:space-y-4">
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
    </div>
  );
}
