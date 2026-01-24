import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type CashSessionStatus = 'open' | 'closed';

export interface CashSession {
  id: string;
  terminal_id: string;
  user_id: string;
  status: CashSessionStatus;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: string;
  closed_at: string | null;
  notes: string | null;
}

export interface CashSessionSummary {
  session_id: string;
  terminal_id: string;
  terminal_name: string;
  cashier_name: string;
  status: CashSessionStatus;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: string;
  closed_at: string | null;
  cash_total: number;
  card_total: number;
  yape_total: number;
  plin_total: number;
  total_sales: number;
  orders_count: number;
}

// Fetch current open session for user
export function useCurrentCashSession() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['cash-session', 'current', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('cash_sessions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      if (error) throw error;
      return data as CashSession | null;
    },
    enabled: !!user?.id,
  });
}

// Fetch session summary
export function useCashSessionSummary(sessionId: string | null) {
  return useQuery({
    queryKey: ['cash-session-summary', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from('v_cash_session_summary')
        .select('*')
        .eq('session_id', sessionId)
        .maybeSingle();

      if (error) throw error;
      return data as CashSessionSummary | null;
    },
    enabled: !!sessionId,
  });
}

// Fetch session history
export function useCashSessionHistory() {
  return useQuery({
    queryKey: ['cash-sessions', 'history'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_cash_session_summary')
        .select('*')
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as CashSessionSummary[];
    },
  });
}

// Open cash session
export function useOpenCashSession() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ terminalId, openingAmount }: { terminalId: string; openingAmount: number }) => {
      if (!user?.id) throw new Error('Usuario no autenticado');

      const { data, error } = await supabase
        .from('cash_sessions')
        .insert({
          terminal_id: terminalId,
          user_id: user.id,
          opening_amount: openingAmount,
          status: 'open',
        })
        .select()
        .single();

      if (error) throw error;
      return data as CashSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
    },
  });
}

// Close cash session
export function useCloseCashSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      sessionId,
      closingAmount,
      notes,
    }: {
      sessionId: string;
      closingAmount: number;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('cash_sessions')
        .update({
          status: 'closed',
          closing_amount: closingAmount,
          closed_at: new Date().toISOString(),
          notes,
        })
        .eq('id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data as CashSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-session'] });
      queryClient.invalidateQueries({ queryKey: ['cash-sessions'] });
    },
  });
}

// Fetch terminals
export function useTerminals() {
  return useQuery({
    queryKey: ['terminals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('terminals')
        .select(`
          *,
          store:stores(name)
        `)
        .eq('active', true);

      if (error) throw error;
      return data;
    },
  });
}
