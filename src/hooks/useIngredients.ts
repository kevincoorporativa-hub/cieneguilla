import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  min_stock: number;
  cost_per_unit: number;
  category: string;
  supplier: string | null;
  purchase_date: string | null;
  active: boolean;
  created_at: string;
  current_stock: number;
  store_id?: string;
}

export interface StockMove {
  id: string;
  ingredient_id: string;
  ingredient_name?: string;
  store_id: string;
  move_type: 'purchase' | 'sale' | 'adjustment' | 'waste';
  quantity: number;
  unit_cost: number;
  total_cost: number;
  reference_id: string | null;
  notes: string | null;
  user_id: string | null;
  user_name?: string;
  created_at: string;
}

// Fetch all ingredients with current stock
export function useIngredients() {
  return useQuery({
    queryKey: ['ingredients'],
    queryFn: async () => {
      const { data: ingredients, error: ingError } = await supabase
        .from('ingredients')
        .select('*')
        .eq('active', true)
        .order('name');

      if (ingError) throw ingError;

      const { data: stocks, error: stockError } = await supabase
        .from('ingredient_stock')
        .select('ingredient_id, store_id, quantity');

      if (stockError) throw stockError;

      const ingredientsWithStock = ingredients?.map(ing => ({
        ...ing,
        min_stock: Number(ing.min_stock),
        cost_per_unit: Number(ing.cost_per_unit),
        category: ing.category || 'general',
        supplier: ing.supplier || null,
        purchase_date: ing.purchase_date || null,
        current_stock: Number(stocks?.find(s => s.ingredient_id === ing.id)?.quantity || 0),
        store_id: stocks?.find(s => s.ingredient_id === ing.id)?.store_id,
      })) || [];

      return ingredientsWithStock as Ingredient[];
    },
  });
}

// Fetch stock movements
export function useStockMoves(ingredientId?: string) {
  return useQuery({
    queryKey: ['stock-moves', ingredientId],
    queryFn: async () => {
      let query = supabase
        .from('stock_moves')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (ingredientId) {
        query = query.eq('ingredient_id', ingredientId);
      }

      const { data: moves, error } = await query;
      if (error) throw error;

      const ingredientIds = [...new Set(moves?.map(m => m.ingredient_id) || [])];
      const { data: ingredients } = ingredientIds.length > 0
        ? await supabase
            .from('ingredients')
            .select('id, name')
            .in('id', ingredientIds)
        : { data: [] };

      const userIds = [...new Set(moves?.filter(m => m.user_id).map(m => m.user_id) || [])];
      const { data: employees } = userIds.length > 0
        ? await supabase
            .from('employees')
            .select('user_id, first_name, last_name')
            .in('user_id', userIds as string[])
        : { data: [] };

      const movesWithNames = moves?.map(move => ({
        ...move,
        quantity: Number(move.quantity),
        unit_cost: Number(move.unit_cost || 0),
        total_cost: Number(move.total_cost || 0),
        ingredient_name: ingredients?.find(i => i.id === move.ingredient_id)?.name,
        user_name: employees?.find(e => e.user_id === move.user_id)
          ? `${employees.find(e => e.user_id === move.user_id)?.first_name} ${employees.find(e => e.user_id === move.user_id)?.last_name}`
          : null,
      })) || [];

      return movesWithNames as StockMove[];
    },
  });
}

// Create ingredient
export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      unit: string;
      min_stock?: number;
      cost_per_unit?: number;
      category?: string;
      supplier?: string;
      purchase_date?: string;
    }) => {
      const { data: ingredient, error } = await supabase
        .from('ingredients')
        .insert({
          name: data.name,
          unit: data.unit,
          min_stock: data.min_stock || 0,
          cost_per_unit: data.cost_per_unit || 0,
          category: data.category || 'general',
          supplier: data.supplier || null,
          purchase_date: data.purchase_date || null,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return ingredient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}

// Create stock movement with cost tracking
export function useCreateStockMove() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ingredient_id: string;
      store_id: string;
      move_type: 'purchase' | 'sale' | 'adjustment' | 'waste';
      quantity: number;
      notes?: string;
      unit_cost?: number;
    }) => {
      const { data: session } = await supabase.auth.getSession();
      const userId = session?.session?.user?.id;

      const totalCost = (data.unit_cost || 0) * Math.abs(data.quantity);

      const { data: move, error: moveError } = await supabase
        .from('stock_moves')
        .insert({
          ingredient_id: data.ingredient_id,
          store_id: data.store_id,
          move_type: data.move_type,
          quantity: data.quantity,
          notes: data.notes,
          user_id: userId,
          unit_cost: data.unit_cost || 0,
          total_cost: totalCost,
        })
        .select()
        .single();

      if (moveError) throw moveError;

      // Update stock
      const { data: existingStock } = await supabase
        .from('ingredient_stock')
        .select('id, quantity')
        .eq('ingredient_id', data.ingredient_id)
        .eq('store_id', data.store_id)
        .maybeSingle();

      if (existingStock) {
        const newQuantity = Number(existingStock.quantity) + data.quantity;
        const { error: updateError } = await supabase
          .from('ingredient_stock')
          .update({ quantity: Math.max(0, newQuantity), updated_at: new Date().toISOString() })
          .eq('id', existingStock.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('ingredient_stock')
          .insert({
            ingredient_id: data.ingredient_id,
            store_id: data.store_id,
            quantity: Math.max(0, data.quantity),
          });

        if (insertError) throw insertError;
      }

      return move;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      queryClient.invalidateQueries({ queryKey: ['stock-moves'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'current-stock'] });
      queryClient.invalidateQueries({ queryKey: ['cuadre'] });
    },
  });
}

// Update ingredient
export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      unit?: string;
      min_stock?: number;
      cost_per_unit?: number;
      category?: string;
      supplier?: string;
      purchase_date?: string;
      active?: boolean;
    }) => {
      const { data: ingredient, error } = await supabase
        .from('ingredients')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return ingredient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
    },
  });
}
