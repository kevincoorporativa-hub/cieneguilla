import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PurchaseItem {
  id: string;
  source: 'insumo' | 'producto';
  item_name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  supplier: string | null;
  purchase_date: string | null;
  created_at: string;
  notes: string | null;
}

export interface SaleItem {
  id: string;
  order_number: string;
  total: number;
  order_type: string;
  created_at: string;
  items_count: number;
}

// Fetch ALL purchases: ingredient purchases (stock_moves) + product purchases (product_stock_moves)
export function useAllPurchases(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['versus', 'all-purchases', startDate, endDate],
    queryFn: async () => {
      // Build date filters
      let startISO: string | undefined;
      let endISO: string | undefined;
      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        startISO = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0).toISOString();
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        endISO = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0).toISOString();
      }

      // 1. Ingredient purchases from stock_moves
      let insumoQuery = supabase
        .from('stock_moves')
        .select('*')
        .eq('move_type', 'purchase')
        .order('created_at', { ascending: false });

      if (startISO) insumoQuery = insumoQuery.gte('created_at', startISO);
      if (endISO) insumoQuery = insumoQuery.lt('created_at', endISO);

      const { data: insumoMoves, error: insumoError } = await insumoQuery;
      if (insumoError) throw insumoError;

      // Get ingredient details
      const ingredientIds = [...new Set(insumoMoves?.map(m => m.ingredient_id) || [])];
      const { data: ingredients } = ingredientIds.length > 0
        ? await supabase.from('ingredients').select('id, name, category').in('id', ingredientIds)
        : { data: [] };

      const insumoPurchases: PurchaseItem[] = (insumoMoves || []).map(move => {
        const ing = ingredients?.find(i => i.id === move.ingredient_id);
        return {
          id: move.id,
          source: 'insumo' as const,
          item_name: ing?.name || 'Desconocido',
          category: ing?.category || 'general',
          quantity: Number(move.quantity),
          unit_cost: Number(move.unit_cost || 0),
          total_cost: Number(move.total_cost || 0),
          supplier: move.supplier || null,
          purchase_date: move.purchase_date || null,
          created_at: move.created_at,
          notes: move.notes,
        };
      });

      // 2. Product purchases from product_stock_moves
      let prodQuery = supabase
        .from('product_stock_moves')
        .select('*, product:products(name, category)')
        .eq('move_type', 'purchase')
        .order('created_at', { ascending: false });

      if (startISO) prodQuery = prodQuery.gte('created_at', startISO);
      if (endISO) prodQuery = prodQuery.lt('created_at', endISO);

      const { data: prodMoves, error: prodError } = await prodQuery;
      if (prodError) throw prodError;

      const productPurchases: PurchaseItem[] = (prodMoves || []).map(move => ({
        id: move.id,
        source: 'producto' as const,
        item_name: (move as any).product?.name || 'Desconocido',
        category: (move as any).product?.category || 'general',
        quantity: Number(move.quantity),
        unit_cost: Number(move.unit_cost || 0),
        total_cost: Number(move.unit_cost || 0) * Number(move.quantity),
        supplier: null,
        purchase_date: null,
        created_at: move.created_at,
        notes: move.notes,
      }));

      // Combine and sort by date
      return [...insumoPurchases, ...productPurchases].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    },
  });
}

// Fetch sales (paid orders) within date range
export function useSales(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['cuadre', 'sales', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select('id, order_number, total, order_type, created_at')
        .eq('status', 'paid')
        .order('created_at', { ascending: false });

      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        const startLocal = new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
        query = query.gte('created_at', startLocal.toISOString());
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        const endLocalExclusive = new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0, 0);
        query = query.lt('created_at', endLocalExclusive.toISOString());
      }

      const { data: orders, error } = await query;
      if (error) throw error;

      const orderIds = orders?.map(o => o.id) || [];
      const { data: items } = orderIds.length > 0
        ? await supabase.from('order_items').select('order_id, quantity').in('order_id', orderIds)
        : { data: [] };

      const sales: SaleItem[] = (orders || []).map(order => {
        const orderItems = items?.filter(i => i.order_id === order.id) || [];
        return {
          id: order.id,
          order_number: order.order_number || '—',
          total: Number(order.total),
          order_type: order.order_type || 'local',
          created_at: order.created_at,
          items_count: orderItems.reduce((sum, i) => sum + i.quantity, 0),
        };
      });

      return sales;
    },
  });
}
