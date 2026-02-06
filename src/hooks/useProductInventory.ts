import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type ProductStockMoveType = 'purchase' | 'sale' | 'adjustment' | 'waste';

export interface ProductStock {
  id: string;
  product_id: string;
  store_id: string;
  quantity: number;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    base_price: number;
    expiration_date: string | null;
    entry_date: string | null;
    expires: boolean;
  };
  store?: {
    name: string;
  };
}

export interface ProductStockMove {
  id: string;
  product_id: string;
  store_id: string;
  move_type: ProductStockMoveType;
  quantity: number;
  unit_cost: number | null;
  reference_id: string | null;
  notes: string | null;
  user_id: string | null;
  expiration_date: string | null;
  created_at: string;
  product?: {
    name: string;
  };
}

// Fetch product stock with alerts
export function useProductStock(storeId?: string) {
  return useQuery({
    queryKey: ['product-stock', storeId],
    queryFn: async () => {
      let query = supabase
        .from('product_stock')
        .select(`
          *,
          product:products(id, name, base_price, expiration_date, entry_date, expires),
          store:stores(name)
        `)
        .order('updated_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductStock[];
    },
  });
}

// Fetch product stock movements (Kardex)
export function useProductStockMoves(productId?: string, storeId?: string) {
  return useQuery({
    queryKey: ['product-stock-moves', productId, storeId],
    queryFn: async () => {
      let query = supabase
        .from('product_stock_moves')
        .select(`
          *,
          product:products(name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (productId) {
        query = query.eq('product_id', productId);
      }

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as ProductStockMove[];
    },
  });
}

// Create stock movement
export function useCreateProductStockMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (move: {
      product_id: string;
      store_id: string;
      move_type: ProductStockMoveType;
      quantity: number;
      unit_cost?: number;
      notes?: string;
      user_id?: string;
      expiration_date?: string;
    }) => {
      // Create movement
      const { data: moveData, error: moveError } = await supabase
        .from('product_stock_moves')
        .insert({
          product_id: move.product_id,
          store_id: move.store_id,
          move_type: move.move_type,
          quantity: move.quantity,
          unit_cost: move.unit_cost || null,
          notes: move.notes || null,
          user_id: move.user_id || null,
          expiration_date: move.expiration_date || null,
        })
        .select()
        .single();

      if (moveError) throw moveError;

      // Update stock
      const { data: existingStock } = await supabase
        .from('product_stock')
        .select('*')
        .eq('product_id', move.product_id)
        .eq('store_id', move.store_id)
        .maybeSingle();

      if (existingStock) {
        const newQuantity = existingStock.quantity + move.quantity;
        const { error: updateError } = await supabase
          .from('product_stock')
          .update({ quantity: newQuantity, updated_at: new Date().toISOString() })
          .eq('id', existingStock.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('product_stock')
          .insert({
            product_id: move.product_id,
            store_id: move.store_id,
            quantity: move.quantity,
          });

        if (insertError) throw insertError;
      }

      return moveData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-stock'] });
      queryClient.invalidateQueries({ queryKey: ['product-stock-moves'] });
      queryClient.invalidateQueries({ queryKey: ['product-expiration-dates'] });
      queryClient.invalidateQueries({ queryKey: ['expiring-products'] });
    },
  });
}

// Fetch products expiring soon (uses FIFO logic to calculate remaining batches)
export function useExpiringProducts(daysAhead: number = 20, storeId?: string) {
  return useQuery({
    queryKey: ['expiring-products', daysAhead, storeId || 'any'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      // Get current stock levels per product
      let stockQuery = supabase
        .from('product_stock')
        .select('product_id, quantity')
        .gt('quantity', 0);

      if (storeId) {
        stockQuery = stockQuery.eq('store_id', storeId);
      }

      const { data: stockData, error: stockError } = await stockQuery;
      if (stockError) throw stockError;
      
      const currentStock = new Map<string, number>();
      (stockData || []).forEach((s: any) => {
        currentStock.set(s.product_id, s.quantity);
      });

      if (currentStock.size === 0) return [];
      
      // Get all stock moves with expiration dates
      let movesQuery = supabase
        .from('product_stock_moves')
        .select(`
          product_id,
          expiration_date,
          quantity,
          product:products(id, name, active)
        `)
        .not('expiration_date', 'is', null)
        .order('expiration_date', { ascending: true });

      if (storeId) {
        movesQuery = movesQuery.eq('store_id', storeId);
      }

      const { data, error } = await movesQuery;
      if (error) throw error;

      // Group by product: collect batches
      const productBatches = new Map<string, { 
        name: string;
        active: boolean;
        batches: Array<{ date: string; qty: number }>;
      }>();
      
      (data || []).forEach((move: any) => {
        if (!move.product?.active) return;
        if (!currentStock.has(move.product_id)) return;
        if (!move.expiration_date) return;

        const existing = productBatches.get(move.product_id) || {
          name: move.product.name,
          active: move.product.active,
          batches: []
        };
        
        const existingBatch = existing.batches.find(b => b.date === move.expiration_date);
        if (existingBatch) {
          existingBatch.qty += move.quantity;
        } else {
          existing.batches.push({ date: move.expiration_date, qty: move.quantity });
        }
        productBatches.set(move.product_id, existing);
      });

      // Use FIFO to find effective expiration per product
      const results: Array<{ id: string; name: string; expiration_date: string }> = [];
      
      productBatches.forEach((product, productId) => {
        const totalStock = currentStock.get(productId) || 0;
        if (totalStock <= 0) return;
        
        // Sort batches by expiration date ASC (FIFO)
        product.batches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calculate which batch has remaining stock
        const totalPurchased = product.batches.reduce((sum, b) => sum + Math.max(0, b.qty), 0);
        let soldFromBatches = totalPurchased - totalStock;
        
        let effectiveExpiration: string | null = null;
        
        for (const batch of product.batches) {
          const batchQty = Math.max(0, batch.qty);
          if (soldFromBatches >= batchQty) {
            soldFromBatches -= batchQty;
          } else {
            effectiveExpiration = batch.date;
            break;
          }
        }
        
        // Fallback
        if (!effectiveExpiration && product.batches.length > 0) {
          effectiveExpiration = product.batches[product.batches.length - 1].date;
        }
        
        if (!effectiveExpiration) return;
        
        const expDate = new Date(effectiveExpiration);
        expDate.setHours(0, 0, 0, 0);
        
        // Alert only if expired or within daysAhead
        if (expDate > futureDate) return;
        
        results.push({
          id: productId,
          name: product.name,
          expiration_date: effectiveExpiration,
        });
      });

      return results;
    },
    staleTime: 30000,
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });
}

// Fetch nearest expiration date per product from stock moves
// Uses FIFO logic: calculates remaining stock per expiration batch
// Shows the nearest FUTURE expiration with remaining stock, else most recent PAST
export function useProductExpirationDates(storeId?: string) {
  return useQuery({
    queryKey: ['product-expiration-dates', storeId],
    queryFn: async () => {
      // Get current stock levels per product
      let stockQuery = supabase
        .from('product_stock')
        .select('product_id, quantity');
      
      if (storeId) {
        stockQuery = stockQuery.eq('store_id', storeId);
      }
      
      const { data: stockData, error: stockError } = await stockQuery;
      if (stockError) throw stockError;
      
      // Map of current stock by product
      const currentStock = new Map<string, number>();
      (stockData || []).forEach((s: any) => {
        currentStock.set(s.product_id, s.quantity);
      });
      
      // Get all stock moves with expiration dates (purchases only have positive qty and expiration)
      let query = supabase
        .from('product_stock_moves')
        .select('product_id, expiration_date, quantity')
        .not('expiration_date', 'is', null)
        .order('expiration_date', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Group by product: collect all batches with their expiration dates and quantities
      const productBatches = new Map<string, Array<{ date: string; qty: number }>>();
      
      (data || []).forEach((move: any) => {
        if (!move.expiration_date) return;
        
        const existing = productBatches.get(move.product_id) || [];
        // Find if we already have this expiration date
        const existingBatch = existing.find(b => b.date === move.expiration_date);
        if (existingBatch) {
          existingBatch.qty += move.quantity;
        } else {
          existing.push({ date: move.expiration_date, qty: move.quantity });
        }
        productBatches.set(move.product_id, existing);
      });
      
      // For each product, use FIFO to determine which batches still have stock
      const expirationMap = new Map<string, string>();
      
      productBatches.forEach((batches, productId) => {
        const totalStock = currentStock.get(productId) || 0;
        
        if (totalStock <= 0) {
          // No stock = no expiration to show
          return;
        }
        
        // Sort batches by expiration date ASC (FIFO - oldest first)
        batches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Calculate which batches still have stock using FIFO
        // Total sold = sum of all batch entries - current stock
        const totalPurchased = batches.reduce((sum, b) => sum + Math.max(0, b.qty), 0);
        let soldFromBatches = totalPurchased - totalStock;
        
        // Find the first batch with remaining stock
        for (const batch of batches) {
          const batchQty = Math.max(0, batch.qty);
          if (soldFromBatches >= batchQty) {
            // This entire batch was sold
            soldFromBatches -= batchQty;
          } else {
            // This batch has remaining stock - this is our expiration date
            expirationMap.set(productId, batch.date);
            return;
          }
        }
        
        // Fallback: if logic doesn't find any, use the last batch
        if (batches.length > 0) {
          expirationMap.set(productId, batches[batches.length - 1].date);
        }
      });
      
      return expirationMap;
    },
  });
}

// Fetch products with low stock
export function useLowStockProducts(storeId?: string) {
  return useQuery({
    queryKey: ['low-stock-products', storeId || 'any'],
    queryFn: async () => {
      let query = supabase
        .from('product_stock')
        .select(`
          *,
          product:products(id, name, base_price, min_stock)
        `)
        .eq('product.track_stock', true);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Filter to only show low stock items
      return (data || []).filter(item => {
        const minStock = (item.product as any)?.min_stock || 5;
        return item.quantity <= minStock;
      });
    },
     staleTime: 30000, // 30 seconds
     refetchInterval: 60000, // Refetch every minute to keep data fresh
     refetchOnWindowFocus: true,
  });
}
