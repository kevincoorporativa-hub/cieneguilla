import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Store {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  active: boolean;
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
