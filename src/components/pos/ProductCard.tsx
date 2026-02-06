import { Plus } from 'lucide-react';
import { Product, StockLevel } from '@/types/pos';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

function getStockLevel(stock: number, minimo: number): StockLevel {
  if (stock === 0) return 'empty';
  if (stock <= minimo) return 'low';
  if (stock <= minimo * 2) return 'medium';
  return 'high';
}

function getStockColor(level: StockLevel): string {
  switch (level) {
    case 'high': return 'bg-stock-high';
    case 'medium': return 'bg-stock-medium';
    case 'low': return 'bg-stock-low';
    case 'empty': return 'bg-stock-empty';
  }
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const stockLevel = getStockLevel(product.stock, product.stockMinimo);
  const isDisabled = stockLevel === 'empty';

  const handleClick = () => {
    if (!isDisabled) {
      onAdd(product);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={cn(
        'product-card flex flex-col items-center justify-center text-center gap-1 relative w-full',
        'touch-action-manipulation select-none',
        isDisabled && 'opacity-50 cursor-not-allowed hover:border-transparent hover:shadow-sm'
      )}
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      {/* Stock indicator */}
      <div
        className={cn(
          'absolute top-2 right-2 w-3 h-3 lg:w-4 lg:h-4 rounded-full',
          getStockColor(stockLevel)
        )}
        title={`Stock: ${product.stock}`}
      />

      {/* Product name */}
      <h3 className="text-sm lg:text-base font-bold text-foreground leading-tight line-clamp-2 px-1">
        {product.nombre}
      </h3>

      {/* Price */}
      <p className="text-base lg:text-lg font-bold text-primary">
        S/ {product.precio.toFixed(2)}
      </p>

      {/* Add indicator - larger for touch */}
      {!isDisabled && (
        <div className="absolute bottom-2 right-2 w-8 h-8 lg:w-9 lg:h-9 bg-primary rounded-full flex items-center justify-center text-primary-foreground shadow-md">
          <Plus className="h-5 w-5 lg:h-6 lg:w-6" />
        </div>
      )}

      {isDisabled && (
        <span className="text-xs text-muted-foreground font-medium">Sin stock</span>
      )}
    </button>
  );
}
