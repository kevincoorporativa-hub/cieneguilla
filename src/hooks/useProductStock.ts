import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductStock {
  product_id: string;
  product_name: string;
  track_stock: boolean;
  min_stock: number;
  current_stock: number;
  stock_status: 'ok' | 'low_stock' | 'out_of_stock';
}

// Fetch product stock for the current store
export function useProductStock(storeId?: string) {
  return useQuery({
    queryKey: ['product-stock', storeId],
    queryFn: async () => {
      // Get products with their stock tracking settings
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, track_stock, min_stock')
        .eq('active', true);

      if (productsError) throw productsError;

      // Get stock levels
      let stockQuery = supabase
        .from('product_stock')
        .select('product_id, quantity, store_id');

      if (storeId) {
        stockQuery = stockQuery.eq('store_id', storeId);
      }

      const { data: stocks, error: stockError } = await stockQuery;
      if (stockError) throw stockError;

      // Merge stock into products
      const productsWithStock: ProductStock[] = products?.map(product => {
        const stockRecord = stocks?.find(s => s.product_id === product.id);
        const currentStock = Number(stockRecord?.quantity || 0);
        const minStock = Number(product.min_stock || 5);

        let stockStatus: 'ok' | 'low_stock' | 'out_of_stock' = 'ok';
        if (product.track_stock) {
          if (currentStock <= 0) {
            stockStatus = 'out_of_stock';
          } else if (currentStock <= minStock) {
            stockStatus = 'low_stock';
          }
        }

        return {
          product_id: product.id,
          product_name: product.name,
          track_stock: product.track_stock,
          min_stock: minStock,
          current_stock: currentStock,
          stock_status: stockStatus,
        };
      }) || [];

      return productsWithStock;
    },
  });
}

// Get stock for a specific product
export function useProductStockById(productId: string, storeId?: string) {
  const { data: allStock } = useProductStock(storeId);
  return allStock?.find(s => s.product_id === productId);
}

// Helper hook to check if product can be sold
export function useCanSellProduct() {
  const queryClient = useQueryClient();

  const checkStock = async (productId: string, quantity: number, storeId?: string): Promise<{
    canSell: boolean;
    availableStock: number;
    message?: string;
  }> => {
    // Get cached stock data or fetch fresh
    let stockData = queryClient.getQueryData<ProductStock[]>(['product-stock', storeId]);
    
    if (!stockData) {
      // Fetch fresh data
      const { data: products } = await supabase
        .from('products')
        .select('id, name, track_stock, min_stock')
        .eq('id', productId)
        .single();

      if (!products) {
        return { canSell: false, availableStock: 0, message: 'Producto no encontrado' };
      }

      // If product doesn't track stock, allow sale
      if (!products.track_stock) {
        return { canSell: true, availableStock: 999 };
      }

      let stockQuery = supabase
        .from('product_stock')
        .select('quantity')
        .eq('product_id', productId);

      if (storeId) {
        stockQuery = stockQuery.eq('store_id', storeId);
      }

      const { data: stockRecord } = await stockQuery.maybeSingle();
      const currentStock = Number(stockRecord?.quantity || 0);

      if (currentStock < quantity) {
        return {
          canSell: false,
          availableStock: currentStock,
          message: currentStock === 0 
            ? `${products.name} sin stock disponible`
            : `Solo hay ${currentStock} unidades de ${products.name} disponibles`,
        };
      }

      return { canSell: true, availableStock: currentStock };
    }

    const productStock = stockData.find(s => s.product_id === productId);
    
    if (!productStock) {
      return { canSell: true, availableStock: 999 }; // Producto sin tracking
    }

    if (!productStock.track_stock) {
      return { canSell: true, availableStock: 999 };
    }

    if (productStock.current_stock < quantity) {
      return {
        canSell: false,
        availableStock: productStock.current_stock,
        message: productStock.current_stock === 0 
          ? `${productStock.product_name} sin stock disponible`
          : `Solo hay ${productStock.current_stock} unidades de ${productStock.product_name} disponibles`,
      };
    }

    return { canSell: true, availableStock: productStock.current_stock };
  };

  return { checkStock };
}
