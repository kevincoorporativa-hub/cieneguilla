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
      try {
        // Call the database function directly
        const { data, error } = await supabase.rpc('get_database_size');
        
        if (error) {
          console.error('Error fetching database size:', error);
          throw error;
        }
        
        // Parse the response (it comes as jsonb)
        const result = typeof data === 'string' ? JSON.parse(data) : data;
        
        return {
          size_bytes: result.size_bytes || 0,
          size_pretty: result.size_pretty || '0 MB',
          limit_bytes: result.limit_bytes || 500 * 1024 * 1024,
          limit_pretty: result.limit_pretty || '500 MB',
          percentage: result.percentage || 0
        };
      } catch (error) {
        console.error('Error in useDatabaseSize:', error);
        // Return default values on error
        return {
          size_bytes: 0,
          size_pretty: '0 MB',
          limit_bytes: 500 * 1024 * 1024,
          limit_pretty: '500 MB',
          percentage: 0
        };
      }
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
    retry: 2,
  });
}
