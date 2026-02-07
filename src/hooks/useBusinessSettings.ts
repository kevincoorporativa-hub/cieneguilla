import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface BusinessSettings {
  id?: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessRuc: string;
  systemLogoUrl: string;
  ticketLogoUrl: string;
  ticketPromoText: string;
  ticketFooterText: string;
}

const defaultSettings: BusinessSettings = {
  businessName: 'PizzaPOS',
  businessAddress: 'Av. Principal 123, Lima',
  businessPhone: '01-234-5678',
  businessRuc: '20123456789',
  systemLogoUrl: '',
  ticketLogoUrl: '',
  ticketPromoText: '¡Pide 2 pizzas y llévate una gaseosa gratis!',
  ticketFooterText: '¡Gracias por su preferencia!',
};

// Map DB row to our interface
function mapFromDb(row: any): BusinessSettings {
  return {
    id: row.id,
    businessName: row.business_name || defaultSettings.businessName,
    businessAddress: row.business_address || defaultSettings.businessAddress,
    businessPhone: row.business_phone || defaultSettings.businessPhone,
    businessRuc: row.business_ruc || defaultSettings.businessRuc,
    systemLogoUrl: row.system_logo_url || '',
    ticketLogoUrl: row.ticket_logo_url || '',
    ticketPromoText: row.ticket_promo_text ?? defaultSettings.ticketPromoText,
    ticketFooterText: row.ticket_footer_text ?? defaultSettings.ticketFooterText,
  };
}

// Map our interface to DB columns
function mapToDb(settings: Partial<BusinessSettings>) {
  const mapped: Record<string, any> = {};
  if (settings.businessName !== undefined) mapped.business_name = settings.businessName;
  if (settings.businessAddress !== undefined) mapped.business_address = settings.businessAddress;
  if (settings.businessPhone !== undefined) mapped.business_phone = settings.businessPhone;
  if (settings.businessRuc !== undefined) mapped.business_ruc = settings.businessRuc;
  if (settings.systemLogoUrl !== undefined) mapped.system_logo_url = settings.systemLogoUrl;
  if (settings.ticketLogoUrl !== undefined) mapped.ticket_logo_url = settings.ticketLogoUrl;
  if (settings.ticketPromoText !== undefined) mapped.ticket_promo_text = settings.ticketPromoText;
  if (settings.ticketFooterText !== undefined) mapped.ticket_footer_text = settings.ticketFooterText;
  mapped.updated_at = new Date().toISOString();
  return mapped;
}

async function fetchBusinessSettings(): Promise<BusinessSettings> {
  const { data, error } = await supabase
    .from('business_settings')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching business settings:', error);
    throw error;
  }

  if (!data) return defaultSettings;
  return mapFromDb(data);
}

export function useBusinessSettings() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings = defaultSettings, isLoading } = useQuery({
    queryKey: ['business-settings'],
    queryFn: fetchBusinessSettings,
    staleTime: 1000 * 60 * 5, // 5 min cache
    refetchOnWindowFocus: true,
  });

  const updateMutation = useMutation({
    mutationFn: async (partial: Partial<BusinessSettings>) => {
      const dbData = mapToDb(partial);
      dbData.updated_by = user?.id || null;

      if (settings.id) {
        // Update existing row
        const { error } = await supabase
          .from('business_settings')
          .update(dbData)
          .eq('id', settings.id);
        if (error) throw error;
      } else {
        // Insert new row
        const { error } = await supabase
          .from('business_settings')
          .insert(dbData);
        if (error) throw error;
      }
    },
    onMutate: async (partial) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['business-settings'] });
      const prev = queryClient.getQueryData<BusinessSettings>(['business-settings']);
      queryClient.setQueryData(['business-settings'], (old: BusinessSettings | undefined) => ({
        ...(old || defaultSettings),
        ...partial,
      }));
      return { prev };
    },
    onError: (_err, _vars, context) => {
      // Rollback on error
      if (context?.prev) {
        queryClient.setQueryData(['business-settings'], context.prev);
      }
      toast.error('Error al guardar los ajustes. Verifica que tengas permisos de administrador.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['business-settings'] });
    },
  });

  // Debounce text updates to avoid hammering DB on every keystroke
  const pendingUpdate = useRef<Partial<BusinessSettings>>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  const updateSettings = useCallback(
    (partial: Partial<BusinessSettings>) => {
      // Optimistic UI update immediately
      queryClient.setQueryData(['business-settings'], (old: BusinessSettings | undefined) => ({
        ...(old || defaultSettings),
        ...partial,
      }));

      // Accumulate changes and debounce the DB write
      pendingUpdate.current = { ...pendingUpdate.current, ...partial };
      
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const toSave = { ...pendingUpdate.current };
        pendingUpdate.current = {};
        updateMutation.mutate(toSave);
      }, 800);
    },
    [updateMutation, queryClient]
  );

  // Upload a logo to Supabase Storage and update the URL in the DB
  const uploadLogo = useCallback(
    async (file: File, type: 'system' | 'ticket') => {
      try {
        const ext = file.name.split('.').pop() || 'png';
        const fileName = `${type}-logo-${Date.now()}.${ext}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('business-logos')
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('business-logos')
          .getPublicUrl(fileName);

        const publicUrl = urlData.publicUrl;

        // Update the settings with the new URL
        const field = type === 'system' ? 'systemLogoUrl' : 'ticketLogoUrl';
        updateSettings({ [field]: publicUrl });

        toast.success(type === 'system' ? 'Logo del sistema actualizado' : 'Logo del ticket actualizado');
        return publicUrl;
      } catch (error: any) {
        console.error('Error uploading logo:', error);
        toast.error('Error al subir el logo. Verifica que tengas permisos de administrador.');
        return null;
      }
    },
    [updateSettings]
  );

  // Remove a logo
  const removeLogo = useCallback(
    (type: 'system' | 'ticket') => {
      const field = type === 'system' ? 'systemLogoUrl' : 'ticketLogoUrl';
      updateSettings({ [field]: '' });
    },
    [updateSettings]
  );

  return { settings, updateSettings, uploadLogo, removeLogo, isLoading };
}
