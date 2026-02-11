-- =====================================================
-- FIX: Permitir a todos los roles autenticados crear clientes
-- Ejecutar en Supabase SQL Editor > Run SQL
-- =====================================================

-- Eliminar política restrictiva existente
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;

-- Permitir que todos los autenticados puedan leer, crear y actualizar clientes
CREATE POLICY "All authenticated can select customers"
ON public.customers FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated can insert customers"
ON public.customers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All authenticated can update customers"
ON public.customers FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Solo admins pueden eliminar clientes
CREATE POLICY "Admins can delete customers"
ON public.customers FOR DELETE TO authenticated USING (public.is_admin_or_manager(auth.uid()));

-- Verificar
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'customers';
