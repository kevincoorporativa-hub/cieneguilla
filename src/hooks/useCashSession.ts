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
        .select(`
          *,
          terminal:terminals(name, store:stores(name))
        `)
        .eq('user_id', user.id)
        .eq('status', 'open')
        .maybeSingle();

      if (error) throw error;
      return data as CashSession | null;
    },
    enabled: !!user?.id,
    staleTime: 10000, // Cache for 10 seconds
    refetchOnWindowFocus: true,
  });
}

// Fetch session summary - calculate from payments directly for speed
export function useCashSessionSummary(sessionId: string | null) {
  return useQuery({
    queryKey: ['cash-session-summary', sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('cash_sessions')
        .select(`
          *,
          terminal:terminals(name, store:stores(name))
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Get all payments for this session
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('method, amount')
        .eq('cash_session_id', sessionId);

      if (paymentsError) throw paymentsError;

      // Calculate totals by payment method
      const cash_total = payments?.filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const card_total = payments?.filter(p => p.method === 'card' || p.method === 'transfer').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const yape_total = payments?.filter(p => p.method === 'yape').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const plin_total = payments?.filter(p => p.method === 'plin').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const total_sales = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      return {
        session_id: session.id,
        terminal_id: session.terminal_id,
        terminal_name: (session.terminal as any)?.name || '-',
        cashier_name: 'Cajero',
        status: session.status as CashSessionStatus,
        opening_amount: Number(session.opening_amount) || 0,
        closing_amount: session.closing_amount ? Number(session.closing_amount) : null,
        opened_at: session.opened_at,
        closed_at: session.closed_at,
        cash_total,
        card_total,
        yape_total,
        plin_total,
        total_sales,
        orders_count: payments?.length || 0,
      } as CashSessionSummary;
    },
    enabled: !!sessionId,
    staleTime: 5000, // Cache for 5 seconds
  });
}

// Fetch session history - calculate from closed sessions
export function useCashSessionHistory() {
  return useQuery({
    queryKey: ['cash-sessions', 'history'],
    queryFn: async () => {
      // Get closed sessions
      const { data: sessions, error: sessionsError } = await supabase
        .from('cash_sessions')
        .select(`
          *,
          terminal:terminals(name, store:stores(name))
        `)
        .eq('status', 'closed')
        .order('closed_at', { ascending: false })
        .limit(50);

      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) return [];

      // Get payments for all these sessions
      const sessionIds = sessions.map(s => s.id);
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('cash_session_id, method, amount')
        .in('cash_session_id', sessionIds);

      if (paymentsError) throw paymentsError;

      // Build summaries
      return sessions.map(session => {
        const sessionPayments = payments?.filter(p => p.cash_session_id === session.id) || [];
        const cash_total = sessionPayments.filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);
        const card_total = sessionPayments.filter(p => p.method === 'card' || p.method === 'transfer').reduce((sum, p) => sum + Number(p.amount), 0);
        const yape_total = sessionPayments.filter(p => p.method === 'yape').reduce((sum, p) => sum + Number(p.amount), 0);
        const plin_total = sessionPayments.filter(p => p.method === 'plin').reduce((sum, p) => sum + Number(p.amount), 0);
        const total_sales = sessionPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        return {
          session_id: session.id,
          terminal_id: session.terminal_id,
          terminal_name: (session.terminal as any)?.name || '-',
          cashier_name: 'Cajero',
          status: session.status as CashSessionStatus,
          opening_amount: Number(session.opening_amount) || 0,
          closing_amount: session.closing_amount ? Number(session.closing_amount) : null,
          opened_at: session.opened_at,
          closed_at: session.closed_at,
          cash_total,
          card_total,
          yape_total,
          plin_total,
          total_sales,
          orders_count: sessionPayments.length,
        } as CashSessionSummary;
      });
    },
    staleTime: 30000, // Cache for 30 seconds
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
      queryClient.invalidateQueries({ queryKey: ['cash-session-summary'] });
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
      queryClient.invalidateQueries({ queryKey: ['cash-session-summary'] });
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
    staleTime: 60000, // Cache for 1 minute - terminals don't change often
  });
}
