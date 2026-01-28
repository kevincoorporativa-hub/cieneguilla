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
    },
  });
}

// Fetch products expiring soon
export function useExpiringProducts(daysAhead: number = 20) {
  return useQuery({
    queryKey: ['expiring-products', daysAhead],
    queryFn: async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_stock(quantity, store_id)
        `)
        .eq('expires', true)
        .not('expiration_date', 'is', null)
        .lte('expiration_date', futureDate.toISOString().split('T')[0])
        .eq('active', true)
        .order('expiration_date', { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

// Fetch products with low stock
export function useLowStockProducts() {
  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_stock')
        .select(`
          *,
          product:products(id, name, base_price, min_stock)
        `)
        .eq('product.track_stock', true);

      if (error) throw error;
      
      // Filter to only show low stock items
      return (data || []).filter(item => {
        const minStock = (item.product as any)?.min_stock || 5;
        return item.quantity <= minStock;
      });
    },
  });
}
