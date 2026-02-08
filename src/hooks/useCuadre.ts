import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PurchaseItem {
  id: string;
  ingredient_name: string;
  category: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
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

export interface CuadreSummary {
  totalCompras: number;
  totalVentas: number;
  utilidad: number;
  margenPorcentaje: number;
  cantidadCompras: number;
  cantidadVentas: number;
}

// Fetch purchases (stock_moves with move_type = 'purchase') within date range
export function usePurchases(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['cuadre', 'purchases', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('stock_moves')
        .select('*')
        .eq('move_type', 'purchase')
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

      const { data: moves, error } = await query;
      if (error) throw error;

      // Get ingredient names and categories
      const ingredientIds = [...new Set(moves?.map(m => m.ingredient_id) || [])];
      const { data: ingredients } = ingredientIds.length > 0
        ? await supabase
            .from('ingredients')
            .select('id, name, category, unit')
            .in('id', ingredientIds)
        : { data: [] };

      const purchases: PurchaseItem[] = (moves || []).map(move => {
        const ingredient = ingredients?.find(i => i.id === move.ingredient_id);
        return {
          id: move.id,
          ingredient_name: ingredient?.name || 'Desconocido',
          category: ingredient?.category || 'general',
          quantity: Number(move.quantity),
          unit_cost: Number(move.unit_cost || 0),
          total_cost: Number(move.total_cost || 0),
          created_at: move.created_at,
          notes: move.notes,
        };
      });

      return purchases;
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

      // Get items count per order
      const orderIds = orders?.map(o => o.id) || [];
      const { data: items } = orderIds.length > 0
        ? await supabase
            .from('order_items')
            .select('order_id, quantity')
            .in('order_id', orderIds)
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

// Calculate summary
export function useCuadreSummary(startDate?: string, endDate?: string) {
  const { data: purchases = [] } = usePurchases(startDate, endDate);
  const { data: sales = [] } = useSales(startDate, endDate);

  const totalCompras = purchases.reduce((sum, p) => sum + p.total_cost, 0);
  const totalVentas = sales.reduce((sum, s) => sum + s.total, 0);
  const utilidad = totalVentas - totalCompras;
  const margenPorcentaje = totalVentas > 0 ? (utilidad / totalVentas) * 100 : 0;

  return {
    totalCompras,
    totalVentas,
    utilidad,
    margenPorcentaje,
    cantidadCompras: purchases.length,
    cantidadVentas: sales.length,
  } as CuadreSummary;
}
