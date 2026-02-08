import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecipeItem {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity_needed: number;
  created_at: string;
  ingredient?: {
    id: string;
    name: string;
    unit: string;
    cost_per_unit: number;
  };
}

// Fetch recipe for a product
export function useProductRecipe(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-recipe', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_recipes')
        .select(`
          *,
          ingredient:ingredients(id, name, unit, cost_per_unit)
        `)
        .eq('product_id', productId)
        .order('created_at');

      if (error) throw error;
      return (data || []) as RecipeItem[];
    },
    enabled: !!productId,
  });
}

// Fetch all recipes (for POS validation)
export function useAllRecipes() {
  return useQuery({
    queryKey: ['all-recipes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_recipes')
        .select(`
          *,
          ingredient:ingredients(id, name, unit, cost_per_unit)
        `);

      if (error) throw error;
      return (data || []) as RecipeItem[];
    },
  });
}

// Save full recipe (delete old + insert new)
export function useSaveRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      items,
    }: {
      productId: string;
      items: { ingredient_id: string; quantity_needed: number }[];
    }) => {
      // Delete existing recipe items
      const { error: deleteError } = await supabase
        .from('product_recipes')
        .delete()
        .eq('product_id', productId);

      if (deleteError) throw deleteError;

      // Insert new recipe items
      if (items.length > 0) {
        const { error: insertError } = await supabase
          .from('product_recipes')
          .insert(
            items.map((item) => ({
              product_id: productId,
              ingredient_id: item.ingredient_id,
              quantity_needed: item.quantity_needed,
            }))
          );

        if (insertError) throw insertError;
      }

      return { productId, items };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['product-recipe', data.productId] });
      queryClient.invalidateQueries({ queryKey: ['all-recipes'] });
    },
  });
}
