import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecipeStockInfo {
  product_id: string;
  available_servings: number;
  has_recipe: boolean;
}

/**
 * Fetches available servings for all products with recipes in a given store.
 * Uses the DB function get_recipe_available_servings to calculate how many
 * units of each product can be prepared from current ingredient stock.
 */
export function useRecipeStock(storeId: string | undefined, productIds: string[]) {
  return useQuery({
    queryKey: ['recipe-stock', storeId, productIds.sort().join(',')],
    queryFn: async () => {
      if (!storeId || productIds.length === 0) return [];

      const results: RecipeStockInfo[] = [];

      // Call the DB function for each product with a recipe
      // We batch these in parallel
      const promises = productIds.map(async (productId) => {
        const { data, error } = await supabase
          .rpc('get_recipe_available_servings', {
            p_product_id: productId,
            p_store_id: storeId,
          });

        if (error) {
          console.error(`Error fetching recipe stock for ${productId}:`, error);
          return { product_id: productId, available_servings: 0, has_recipe: false };
        }

        const servings = data as number;
        return {
          product_id: productId,
          available_servings: servings === -1 ? 999 : servings,
          has_recipe: servings !== -1,
        };
      });

      const settled = await Promise.all(promises);
      return settled;
    },
    enabled: !!storeId && productIds.length > 0,
    staleTime: 15000, // 15s
    refetchInterval: 30000, // 30s
    refetchOnWindowFocus: true,
  });
}
