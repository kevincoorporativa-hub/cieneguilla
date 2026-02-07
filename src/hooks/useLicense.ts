import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface License {
  id: string;
  activated_at: string;
  expires_at: string;
  license_type: string;
  is_active: boolean;
  activated_by: string | null;
  notes: string | null;
  created_at: string;
}

export function useLicense() {
  return useQuery({
    queryKey: ['license-active'],
    queryFn: async (): Promise<License | null> => {
      const { data, error } = await supabase
        .from('licenses')
        .select('*')
        .eq('is_active', true)
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching license:', error);
        return null;
      }

      return data as License | null;
    },
    refetchInterval: 60000, // Refetch every minute
  });
}

export function useLicenseStatus() {
  const { data: license, isLoading } = useLicense();

  const now = new Date();
  const expiresAt = license ? new Date(license.expires_at) : null;
  const isExpired = !license || !expiresAt || expiresAt <= now;
  const daysRemaining = expiresAt
    ? Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const isWarning = !isExpired && daysRemaining <= 7;
  const isCritical = !isExpired && daysRemaining <= 3;

  return {
    license,
    isLoading,
    isExpired,
    daysRemaining,
    isWarning,
    isCritical,
    expiresAt,
  };
}

export function useRenewLicense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ days, licenseType, notes }: { days: number; licenseType: string; notes?: string }) => {
      // Deactivate all current licenses
      await supabase
        .from('licenses')
        .update({ is_active: false })
        .eq('is_active', true);

      // Create new license
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);

      const { data: userData } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('licenses')
        .insert({
          expires_at: expiresAt.toISOString(),
          license_type: licenseType,
          is_active: true,
          activated_by: userData.user?.id || null,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['license-active'] });
    },
  });
}
