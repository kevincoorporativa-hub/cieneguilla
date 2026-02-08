import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecipeCostData {
  product_id: string;
  product_name: string;
  base_price: number;
  recipe_cost: number;
  profit: number;
  margin_percent: number;
  ingredient_count: number;
}

/**
 * Fetches recipe cost analysis from the v_product_recipe_cost view.
 * Only returns products that have at least one recipe ingredient.
 */
export function useRecipeCostReport() {
  return useQuery({
    queryKey: ['reports', 'recipe-cost'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_product_recipe_cost')
        .select('*')
        .gt('ingredient_count', 0)
        .order('margin_percent', { ascending: true });

      if (error) throw error;
      return (data || []) as RecipeCostData[];
    },
    staleTime: 30000,
  });
}

/**
 * Fetches ingredient deduction history from stock_moves for sales,
 * aggregated by ingredient within a date range.
 */
export interface IngredientConsumption {
  ingredient_id: string;
  ingredient_name: string;
  unit: string;
  total_consumed: number;
  total_cost: number;
  move_count: number;
}

export function useIngredientConsumption(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'ingredient-consumption', startDate, endDate],
    queryFn: async () => {
      let query = supabase
        .from('stock_moves')
        .select(`
          ingredient_id,
          quantity,
          unit_cost,
          total_cost,
          created_at,
          ingredient:ingredients(id, name, unit)
        `)
        .eq('move_type', 'sale');

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

      const { data, error } = await query;
      if (error) throw error;

      // Aggregate by ingredient
      const aggregated: Record<string, IngredientConsumption> = {};

      for (const move of data || []) {
        const ingredientId = move.ingredient_id;
        const ingredient = move.ingredient as any;
        if (!aggregated[ingredientId]) {
          aggregated[ingredientId] = {
            ingredient_id: ingredientId,
            ingredient_name: ingredient?.name || 'Desconocido',
            unit: ingredient?.unit || '',
            total_consumed: 0,
            total_cost: 0,
            move_count: 0,
          };
        }
        // quantity is negative for sales, so we use Math.abs
        aggregated[ingredientId].total_consumed += Math.abs(Number(move.quantity));
        aggregated[ingredientId].total_cost += Math.abs(Number(move.total_cost || 0));
        aggregated[ingredientId].move_count += 1;
      }

      return Object.values(aggregated).sort((a, b) => b.total_consumed - a.total_consumed);
    },
    staleTime: 30000,
  });
}
