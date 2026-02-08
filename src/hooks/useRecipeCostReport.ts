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
        aggregated[ingredientId].total_consumed += Math.abs(Number(move.quantity));
        aggregated[ingredientId].total_cost += Math.abs(Number(move.total_cost || 0));
        aggregated[ingredientId].move_count += 1;
      }

      return Object.values(aggregated).sort((a, b) => b.total_consumed - a.total_consumed);
    },
    staleTime: 30000,
  });
}

/**
 * Actual sales data for products with recipes in a date range.
 * Combines order_items sales with recipe costs to show real profitability.
 */
export interface RecipeProductSale {
  product_id: string;
  product_name: string;
  units_sold: number;
  total_revenue: number;
  unit_recipe_cost: number;
  total_recipe_cost: number;
  total_profit: number;
  margin_percent: number;
}

export function useRecipeProductSales(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'recipe-product-sales', startDate, endDate],
    queryFn: async () => {
      // 1. Get products with recipes (from the cost view)
      const { data: recipeCosts } = await supabase
        .from('v_product_recipe_cost')
        .select('product_id, product_name, base_price, recipe_cost')
        .gt('ingredient_count', 0);

      if (!recipeCosts || recipeCosts.length === 0) return [];

      const recipeMap: Record<string, { name: string; price: number; cost: number }> = {};
      for (const rc of recipeCosts) {
        recipeMap[rc.product_id] = {
          name: rc.product_name,
          price: Number(rc.base_price),
          cost: Number(rc.recipe_cost),
        };
      }

      // 2. Get orders in date range
      let orderQuery = supabase
        .from('orders')
        .select('id')
        .eq('status', 'paid');

      if (startDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        orderQuery = orderQuery.gte('created_at', new Date(y, (m || 1) - 1, d || 1, 0, 0, 0).toISOString());
      }
      if (endDate) {
        const [y, m, d] = endDate.split('-').map(Number);
        orderQuery = orderQuery.lt('created_at', new Date(y, (m || 1) - 1, (d || 1) + 1, 0, 0, 0).toISOString());
      }

      const { data: orders } = await orderQuery;
      if (!orders || orders.length === 0) return [];

      // 3. Get order items for these orders
      const orderIds = orders.map(o => o.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, quantity, total')
        .in('order_id', orderIds);

      if (!orderItems) return [];

      // 4. Aggregate sales per recipe product
      const salesAgg: Record<string, { units: number; revenue: number }> = {};

      for (const item of orderItems) {
        if (!item.product_id || !recipeMap[item.product_id]) continue;
        if (!salesAgg[item.product_id]) {
          salesAgg[item.product_id] = { units: 0, revenue: 0 };
        }
        salesAgg[item.product_id].units += item.quantity;
        salesAgg[item.product_id].revenue += Number(item.total);
      }

      // 5. Build result
      const result: RecipeProductSale[] = Object.entries(salesAgg).map(([productId, sales]) => {
        const recipe = recipeMap[productId];
        const totalCost = recipe.cost * sales.units;
        const totalProfit = sales.revenue - totalCost;
        const margin = sales.revenue > 0 ? (totalProfit / sales.revenue) * 100 : 0;

        return {
          product_id: productId,
          product_name: recipe.name,
          units_sold: sales.units,
          total_revenue: sales.revenue,
          unit_recipe_cost: recipe.cost,
          total_recipe_cost: totalCost,
          total_profit: totalProfit,
          margin_percent: margin,
        };
      });

      return result.sort((a, b) => b.total_revenue - a.total_revenue);
    },
    staleTime: 30000,
  });
}
