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

  return (
    <button
      onClick={() => !isDisabled && onAdd(product)}
      disabled={isDisabled}
      className={cn(
        'product-card flex flex-col items-center justify-center text-center gap-1 lg:gap-2 relative',
        isDisabled && 'opacity-50 cursor-not-allowed hover:border-transparent hover:shadow-sm'
      )}
    >
      {/* Stock indicator */}
      <div
        className={cn(
          'absolute top-2 lg:top-3 right-2 lg:right-3 w-3 h-3 lg:w-4 lg:h-4 rounded-full',
          getStockColor(stockLevel)
        )}
        title={`Stock: ${product.stock}`}
      />

      {/* Product name */}
      <h3 className="text-sm lg:text-base xl:text-lg font-bold text-foreground leading-tight line-clamp-2">
        {product.nombre}
      </h3>

      {/* Price */}
      <p className="text-base lg:text-lg xl:text-xl font-bold text-primary">
        S/ {product.precio.toFixed(2)}
      </p>

      {/* Add indicator */}
      {!isDisabled && (
        <div className="absolute bottom-2 lg:bottom-3 right-2 lg:right-3 w-7 h-7 lg:w-8 lg:h-8 xl:w-10 xl:h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
          <Plus className="h-4 w-4 lg:h-5 lg:w-5 xl:h-6 xl:w-6" />
        </div>
      )}

      {isDisabled && (
        <span className="text-xs lg:text-sm text-muted-foreground font-medium">Sin stock</span>
      )}
    </button>
  );
}
