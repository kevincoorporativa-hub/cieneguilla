import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DatabaseSizeInfo {
  size_bytes: number;
  size_pretty: string;
  limit_bytes: number;
  limit_pretty: string;
  percentage: number;
}

export function useDatabaseSize() {
  return useQuery({
    queryKey: ['database-size'],
    queryFn: async (): Promise<DatabaseSizeInfo> => {
      const { data, error } = await supabase.functions.invoke('get-database-size');
      
      if (error) {
        console.error('Error fetching database size:', error);
        // Return default values on error
        return {
          size_bytes: 0,
          size_pretty: '0 MB',
          limit_bytes: 500 * 1024 * 1024,
          limit_pretty: '500 MB',
          percentage: 0
        };
      }
      
      return data as DatabaseSizeInfo;
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: 1,
  });
}
