import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Store {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
}

export interface Terminal {
  id: string;
  store_id: string;
  name: string;
  active: boolean;
  store?: Store;
}

// Fetch all stores
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      return data as Store[];
    },
  });
}

// Fetch single store
export function useStore(storeId: string | null) {
  return useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      if (!storeId) return null;
      
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', storeId)
        .single();

      if (error) throw error;
      return data as Store;
    },
    enabled: !!storeId,
  });
}

// Create store
export function useCreateStore() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (store: { name: string; address?: string; phone?: string }) => {
      const { data, error } = await supabase
        .from('stores')
        .insert({
          name: store.name,
          address: store.address || null,
          phone: store.phone || null,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Store;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stores'] });
    },
  });
}

// Create terminal
export function useCreateTerminal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (terminal: { store_id: string; name: string }) => {
      const { data, error } = await supabase
        .from('terminals')
        .insert({
          store_id: terminal.store_id,
          name: terminal.name,
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Terminal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['terminals'] });
    },
  });
}
