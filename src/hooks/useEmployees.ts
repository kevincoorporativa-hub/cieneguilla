import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Employee {
  id: string;
  user_id: string | null;
  store_id: string | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
  role?: string;
  last_sign_in?: string | null;
}

export interface UserWithRole {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  active: boolean;
  last_sign_in: string | null;
  created_at: string;
}

// Fetch all employees with their roles
export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      // Get employees
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .order('first_name');

      if (empError) throw empError;

      // Get user roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge roles into employees
      const employeesWithRoles = employees?.map(emp => ({
        ...emp,
        role: roles?.find(r => r.user_id === emp.user_id)?.role || 'cashier'
      })) || [];

      return employeesWithRoles as Employee[];
    },
  });
}

// Fetch delivery drivers (employees with delivery role)
export function useDeliveryDrivers() {
  return useQuery({
    queryKey: ['delivery-drivers'],
    queryFn: async () => {
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'delivery');

      if (rolesError) throw rolesError;

      const driverUserIds = roles?.map(r => r.user_id) || [];

      if (driverUserIds.length === 0) return [];

      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('*')
        .in('user_id', driverUserIds)
        .order('first_name');

      if (empError) throw empError;

      return employees || [];
    },
  });
}

// Create employee
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      first_name: string;
      last_name: string;
      email?: string;
      phone?: string;
      role?: string;
      store_id?: string;
    }) => {
      // Create employee record
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .insert({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          store_id: data.store_id,
          active: true,
        })
        .select()
        .single();

      if (empError) throw empError;
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-drivers'] });
    },
  });
}

// Update employee
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      first_name?: string;
      last_name?: string;
      email?: string;
      phone?: string;
      active?: boolean;
    }) => {
      const { data: employee, error } = await supabase
        .from('employees')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return employee;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-drivers'] });
    },
  });
}

// Toggle employee active status
export function useToggleEmployeeActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { data, error } = await supabase
        .from('employees')
        .update({ active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-drivers'] });
    },
  });
}

// Update user role
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // First try to update existing role
      const { data: existing } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });
        if (error) throw error;
      }

      return { userId, role };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
}
