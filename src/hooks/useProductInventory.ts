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

// Fetch products expiring soon (from stock moves)
export function useExpiringProducts(daysAhead: number = 20, storeId?: string) {
  return useQuery({
    queryKey: ['expiring-products', daysAhead, storeId || 'any'],
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
       // First get current stock levels to filter products with actual stock (store-specific when available)
       let stockQuery = supabase
         .from('product_stock')
         .select('product_id, quantity')
         .gt('quantity', 0);

       if (storeId) {
         stockQuery = stockQuery.eq('store_id', storeId);
       }

       const { data: stockData, error: stockError } = await stockQuery;
       
       if (stockError) throw stockError;
       
       // Create a map of products with stock > 0
       const productsWithStock = new Set(
         (stockData || []).map((s: any) => s.product_id)
       );

       // No stock => no expiration alerts
       if (productsWithStock.size === 0) return [];
       
       // Get all stock records with expiration dates (store-specific when available)
       // IMPORTANT: A product can have multiple expiration dates in history.
       // We must pick the same "nearest FUTURE expiration else most recent PAST" logic used in the inventory UI.
       let movesQuery = supabase
        .from('product_stock_moves')
        .select(`
          id,
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

       // For each product: pick nearest FUTURE expiration if any, else most recent PAST
       const bestByProduct = new Map<
         string,
         {
           id: string;
           name: string;
           future?: string;
           past?: string;
         }
       >();

       (data || []).forEach((move: any) => {
         if (!move.product?.active) return;
         if (!productsWithStock.has(move.product_id)) return;
         if (!move.expiration_date) return;

         const expDate = new Date(move.expiration_date);
         expDate.setHours(0, 0, 0, 0);

         const existing = bestByProduct.get(move.product_id) || {
           id: move.product_id,
           name: move.product.name,
           future: undefined as string | undefined,
           past: undefined as string | undefined,
         };

         if (expDate >= today) {
           if (!existing.future || expDate < new Date(existing.future)) {
             existing.future = move.expiration_date;
           }
         } else {
           if (!existing.past || expDate > new Date(existing.past)) {
             existing.past = move.expiration_date;
           }
         }

         bestByProduct.set(move.product_id, existing);
       });

       const results = Array.from(bestByProduct.values())
         .map((p) => {
           const chosen = p.future ?? p.past;
           if (!chosen) return null;

           const chosenDate = new Date(chosen);
           chosenDate.setHours(0, 0, 0, 0);

           // Alert only when: expired OR within daysAhead
           if (chosenDate > futureDate) return null;

           return {
             id: p.id,
             name: p.name,
             expiration_date: chosen,
           };
         })
         .filter(Boolean);

       return results as Array<{ id: string; name: string; expiration_date: string }>;
    },
     staleTime: 30000, // 30 seconds
     refetchInterval: 60000, // Refetch every minute to keep data fresh
     refetchOnWindowFocus: true,
  });
}

// Fetch nearest expiration date per product from stock moves
// Logic: Show the nearest FUTURE expiration if any, otherwise show the most recent expired
export function useProductExpirationDates(storeId?: string) {
  return useQuery({
    queryKey: ['product-expiration-dates', storeId],
    queryFn: async () => {
      let query = supabase
        .from('product_stock_moves')
        .select(
          `
          product_id,
          expiration_date
        `
        )
        .not('expiration_date', 'is', null)
        .gt('quantity', 0)
        .order('expiration_date', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Group expirations by product
      const productExpirations = new Map<string, string[]>();
      
      (data || []).forEach((move: any) => {
        const existing = productExpirations.get(move.product_id) || [];
        existing.push(move.expiration_date);
        productExpirations.set(move.product_id, existing);
      });
      
      // For each product, find the best expiration to show
      const expirationMap = new Map<string, string>();
      
      productExpirations.forEach((dates, productId) => {
        // Separate future and past dates
        const futureDates = dates.filter(d => new Date(d) >= today);
        const pastDates = dates.filter(d => new Date(d) < today);
        
        if (futureDates.length > 0) {
          // Show nearest future expiration (first one since sorted ASC)
          expirationMap.set(productId, futureDates[0]);
        } else if (pastDates.length > 0) {
          // All expired: show the most recent expired (last one since sorted ASC)
          expirationMap.set(productId, pastDates[pastDates.length - 1]);
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
