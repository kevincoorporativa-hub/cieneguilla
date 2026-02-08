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
        .or('ingredient_count.gt.0,recipe_cost.gt.0')
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
 * Tracks direct vs combo sales separately.
 */
export interface RecipeProductSale {
  product_id: string;
  product_name: string;
  units_sold: number;
  direct_units: number;
  combo_units: number;
  total_revenue: number;
  direct_revenue: number;
  combo_revenue: number;
  unit_recipe_cost: number;
  total_recipe_cost: number;
  total_profit: number;
  margin_percent: number;
}

export function useRecipeProductSales(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['reports', 'recipe-product-sales', startDate, endDate],
    queryFn: async () => {
      // 1. Get products with recipes OR cost_price (from the cost view)
      const { data: recipeCosts } = await supabase
        .from('v_product_recipe_cost')
        .select('product_id, product_name, base_price, recipe_cost')
        .or('ingredient_count.gt.0,recipe_cost.gt.0');

      if (!recipeCosts || recipeCosts.length === 0) return [];

      const recipeMap: Record<string, { name: string; price: number; cost: number }> = {};
      for (const rc of recipeCosts) {
        recipeMap[rc.product_id] = {
          name: rc.product_name,
          price: Number(rc.base_price),
          cost: Number(rc.recipe_cost),
        };
      }

      // 2. Get paid orders in date range
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

      const orderIds = orders.map(o => o.id);

      // 3. Get ALL order items (both direct products and combos)
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, combo_id, quantity, total')
        .in('order_id', orderIds);

      if (!orderItems) return [];

      // 4. Collect combo_ids to look up their components
      const comboIds = [...new Set(
        orderItems
          .filter(item => item.combo_id)
          .map(item => item.combo_id!)
      )];

      // 5. Fetch combo components if any
      let comboComponentsMap: Record<string, { product_id: string; quantity: number }[]> = {};
      if (comboIds.length > 0) {
        const { data: comboItems } = await supabase
          .from('combo_items')
          .select('combo_id, product_id, quantity')
          .in('combo_id', comboIds);

        if (comboItems) {
          for (const ci of comboItems) {
            if (!comboComponentsMap[ci.combo_id]) {
              comboComponentsMap[ci.combo_id] = [];
            }
            comboComponentsMap[ci.combo_id].push({
              product_id: ci.product_id,
              quantity: ci.quantity,
            });
          }
        }
      }

      // 6. Aggregate sales per recipe product (direct + combo components)
      const salesAgg: Record<string, {
        direct_units: number;
        direct_revenue: number;
        combo_units: number;
        combo_revenue: number;
      }> = {};

      for (const item of orderItems) {
        // Direct product sale (has product_id, no combo_id)
        if (item.product_id && !item.combo_id && recipeMap[item.product_id]) {
          if (!salesAgg[item.product_id]) {
            salesAgg[item.product_id] = { direct_units: 0, direct_revenue: 0, combo_units: 0, combo_revenue: 0 };
          }
          salesAgg[item.product_id].direct_units += item.quantity;
          salesAgg[item.product_id].direct_revenue += Number(item.total);
        }

        // Combo sale → expand into component products
        if (item.combo_id && comboComponentsMap[item.combo_id]) {
          const components = comboComponentsMap[item.combo_id];
          const recipeComponents = components.filter(c => recipeMap[c.product_id]);

          if (recipeComponents.length > 0) {
            // Distribute the combo's revenue proportionally by recipe cost
            const totalComponentCost = recipeComponents.reduce(
              (sum, c) => sum + recipeMap[c.product_id].cost * c.quantity, 0
            );

            for (const comp of recipeComponents) {
              if (!salesAgg[comp.product_id]) {
                salesAgg[comp.product_id] = { direct_units: 0, direct_revenue: 0, combo_units: 0, combo_revenue: 0 };
              }
              const compUnits = comp.quantity * item.quantity;
              salesAgg[comp.product_id].combo_units += compUnits;

              // Proportional revenue based on recipe cost weight
              if (totalComponentCost > 0) {
                const costWeight = (recipeMap[comp.product_id].cost * comp.quantity) / totalComponentCost;
                salesAgg[comp.product_id].combo_revenue += Number(item.total) * costWeight;
              } else {
                // Fallback: distribute evenly
                salesAgg[comp.product_id].combo_revenue += Number(item.total) / components.length;
              }
            }
          }
        }
      }

      // 7. Build result
      const result: RecipeProductSale[] = Object.entries(salesAgg).map(([productId, sales]) => {
        const recipe = recipeMap[productId];
        const totalUnits = sales.direct_units + sales.combo_units;
        const totalRevenue = sales.direct_revenue + sales.combo_revenue;
        const totalCost = recipe.cost * totalUnits;
        const totalProfit = totalRevenue - totalCost;
        const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

        return {
          product_id: productId,
          product_name: recipe.name,
          units_sold: totalUnits,
          direct_units: sales.direct_units,
          combo_units: sales.combo_units,
          total_revenue: totalRevenue,
          direct_revenue: sales.direct_revenue,
          combo_revenue: sales.combo_revenue,
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
