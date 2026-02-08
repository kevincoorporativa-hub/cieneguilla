import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UnpreparableProduct {
  product_id: string;
  product_name: string;
  available_servings: number;
  limiting_ingredient: string;
  limiting_stock: number;
  limiting_needed: number;
}

/**
 * Fetches products with active recipes that cannot be prepared
 * because at least one ingredient is out of stock or below the needed quantity.
 */
export function useUnpreparableProducts() {
  return useQuery({
    queryKey: ['dashboard', 'unpreparable-products'],
    queryFn: async () => {
      // 1. Get all products that belong to categories with has_recipes = true
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('has_recipes', true);

      if (!categories || categories.length === 0) return [];

      const categoryIds = categories.map(c => c.id);

      const { data: products } = await supabase
        .from('products')
        .select('id, name, category_id')
        .eq('active', true)
        .in('category_id', categoryIds);

      if (!products || products.length === 0) return [];

      // 2. Get recipes for these products
      const productIds = products.map(p => p.id);

      const { data: recipes } = await supabase
        .from('product_recipes')
        .select('product_id, ingredient_id, quantity_needed, ingredient:ingredients(name)')
        .in('product_id', productIds);

      if (!recipes || recipes.length === 0) return [];

      // 3. Get active store
      const { data: store } = await supabase
        .from('stores')
        .select('id')
        .eq('active', true)
        .limit(1)
        .single();

      if (!store) return [];

      // 4. Get ingredient stock for this store
      const ingredientIds = [...new Set(recipes.map(r => r.ingredient_id))];

      const { data: stocks } = await supabase
        .from('ingredient_stock')
        .select('ingredient_id, quantity')
        .eq('store_id', store.id)
        .in('ingredient_id', ingredientIds);

      const stockMap: Record<string, number> = {};
      for (const s of stocks || []) {
        stockMap[s.ingredient_id] = Number(s.quantity);
      }

      // 5. Calculate which products can't be prepared
      const unpreparable: UnpreparableProduct[] = [];

      // Group recipes by product
      const recipesByProduct: Record<string, typeof recipes> = {};
      for (const r of recipes) {
        if (!recipesByProduct[r.product_id]) recipesByProduct[r.product_id] = [];
        recipesByProduct[r.product_id].push(r);
      }

      for (const product of products) {
        const productRecipes = recipesByProduct[product.id];
        if (!productRecipes || productRecipes.length === 0) continue;

        let minServings = Infinity;
        let limitingIngredientName = '';
        let limitingStock = 0;
        let limitingNeeded = 0;

        for (const recipe of productRecipes) {
          const needed = Number(recipe.quantity_needed);
          if (needed <= 0) continue;

          const available = stockMap[recipe.ingredient_id] ?? 0;
          const servings = Math.floor(available / needed);

          if (servings < minServings) {
            minServings = servings;
            limitingIngredientName = (recipe.ingredient as any)?.name || 'Desconocido';
            limitingStock = available;
            limitingNeeded = needed;
          }
        }

        if (minServings < Infinity && minServings <= 2) {
          unpreparable.push({
            product_id: product.id,
            product_name: product.name,
            available_servings: minServings,
            limiting_ingredient: limitingIngredientName,
            limiting_stock: limitingStock,
            limiting_needed: limitingNeeded,
          });
        }
      }

      return unpreparable.sort((a, b) => a.available_servings - b.available_servings);
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}
