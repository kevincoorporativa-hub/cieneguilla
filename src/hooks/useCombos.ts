import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ComboCompleto, ComboComponente } from '@/types/pos';

// Interface for combo from database
interface DbCombo {
  id: string;
  name: string;
  description: string | null;
  price: number;
  active: boolean;
  is_temporary: boolean;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

interface DbComboItem {
  id: string;
  combo_id: string;
  product_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    base_price: number;
  };
}

// Transform database combo to app format
function transformCombo(dbCombo: DbCombo, items: DbComboItem[]): ComboCompleto {
  return {
    id: dbCombo.id,
    nombre: dbCombo.name,
    descripcion: dbCombo.description || undefined,
    componentes: items.map(item => ({
      productoId: item.product_id,
      cantidad: item.quantity,
      nombre: item.product?.name || 'Producto',
    })),
    precio: Number(dbCombo.price),
    activo: dbCombo.active,
    temporal: dbCombo.is_temporary,
    fechaInicio: dbCombo.start_date ? new Date(dbCombo.start_date) : undefined,
    fechaFin: dbCombo.end_date ? new Date(dbCombo.end_date) : undefined,
    createdAt: new Date(dbCombo.created_at),
  };
}

export function useCombos() {
  return useQuery({
    queryKey: ['combos', 'active'],
    queryFn: async () => {
      // Fetch active combos
      const { data: combos, error: combosError } = await supabase
        .from('combos')
        .select('*')
        .eq('active', true)
        .order('name');

      if (combosError) throw combosError;
      if (!combos || combos.length === 0) return [];

      // Fetch all combo items with product info
      const { data: items, error: itemsError } = await supabase
        .from('combo_items')
        .select(`
          *,
          product:products(id, name, base_price)
        `)
        .in('combo_id', combos.map(c => c.id));

      if (itemsError) throw itemsError;

      // Group items by combo and transform
      return combos.map(combo => {
        const comboItems = (items || []).filter(item => item.combo_id === combo.id);
        return transformCombo(combo as DbCombo, comboItems as DbComboItem[]);
      });
    },
  });
}

export function useAllCombos() {
  return useQuery({
    queryKey: ['combos', 'all'],
    queryFn: async () => {
      const { data: combos, error: combosError } = await supabase
        .from('combos')
        .select('*')
        .order('created_at', { ascending: false });

      if (combosError) throw combosError;
      if (!combos || combos.length === 0) return [];

      const { data: items, error: itemsError } = await supabase
        .from('combo_items')
        .select(`
          *,
          product:products(id, name, base_price)
        `)
        .in('combo_id', combos.map(c => c.id));

      if (itemsError) throw itemsError;

      return combos.map(combo => {
        const comboItems = (items || []).filter(item => item.combo_id === combo.id);
        return transformCombo(combo as DbCombo, comboItems as DbComboItem[]);
      });
    },
  });
}

export function useCreateCombo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (combo: {
      nombre: string;
      descripcion?: string;
      precio: number;
      temporal: boolean;
      componentes: ComboComponente[];
    }) => {
      // Insert combo
      const { data: newCombo, error: comboError } = await supabase
        .from('combos')
        .insert({
          name: combo.nombre,
          description: combo.descripcion,
          price: combo.precio,
          is_temporary: combo.temporal,
          active: true,
        })
        .select()
        .single();

      if (comboError) throw comboError;

      // Insert combo items
      if (combo.componentes.length > 0) {
        const { error: itemsError } = await supabase
          .from('combo_items')
          .insert(
            combo.componentes.map(comp => ({
              combo_id: newCombo.id,
              product_id: comp.productoId,
              quantity: comp.cantidad,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return newCombo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useUpdateCombo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (combo: ComboCompleto) => {
      // Update combo
      const { error: comboError } = await supabase
        .from('combos')
        .update({
          name: combo.nombre,
          description: combo.descripcion,
          price: combo.precio,
          is_temporary: combo.temporal,
          active: combo.activo,
        })
        .eq('id', combo.id);

      if (comboError) throw comboError;

      // Delete existing items and re-insert
      await supabase
        .from('combo_items')
        .delete()
        .eq('combo_id', combo.id);

      if (combo.componentes.length > 0) {
        const { error: itemsError } = await supabase
          .from('combo_items')
          .insert(
            combo.componentes.map(comp => ({
              combo_id: combo.id,
              product_id: comp.productoId,
              quantity: comp.cantidad,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return combo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useToggleComboActive() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase
        .from('combos')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
      return { id, active };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}

export function useDeleteCombo() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (comboId: string) => {
      const { error } = await supabase
        .from('combos')
        .delete()
        .eq('id', comboId);

      if (error) throw error;
      return comboId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['combos'] });
    },
  });
}
