import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SetupStatus {
  stores: { count: number; loaded: boolean };
  terminals: { count: number; loaded: boolean };
  categories: { count: number; loaded: boolean };
  products: { count: number; loaded: boolean };
  isComplete: boolean;
  isLoading: boolean;
}

export function useSetupStatus() {
  const storesQuery = useQuery({
    queryKey: ['setup-stores'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('stores')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const terminalsQuery = useQuery({
    queryKey: ['setup-terminals'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('terminals')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['setup-categories'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const productsQuery = useQuery({
    queryKey: ['setup-products'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const isLoading =
    storesQuery.isLoading ||
    terminalsQuery.isLoading ||
    categoriesQuery.isLoading ||
    productsQuery.isLoading;

  const storesCount = storesQuery.data ?? 0;
  const terminalsCount = terminalsQuery.data ?? 0;
  const categoriesCount = categoriesQuery.data ?? 0;
  const productsCount = productsQuery.data ?? 0;

  const isComplete =
    storesCount > 0 &&
    terminalsCount > 0 &&
    categoriesCount > 0 &&
    productsCount > 0;

  return {
    stores: { count: storesCount, loaded: !storesQuery.isLoading },
    terminals: { count: terminalsCount, loaded: !terminalsQuery.isLoading },
    categories: { count: categoriesCount, loaded: !categoriesQuery.isLoading },
    products: { count: productsCount, loaded: !productsQuery.isLoading },
    isComplete,
    isLoading,
    refetch: () => {
      storesQuery.refetch();
      terminalsQuery.refetch();
      categoriesQuery.refetch();
      productsQuery.refetch();
    },
  };
}
