-- ============================================
-- AJUSTES DEL NEGOCIO - Persistente en Base de Datos
-- Copiar y pegar en Supabase SQL Editor
-- ============================================

-- 1. Crear tabla de ajustes del negocio (una sola fila para toda la empresa)
CREATE TABLE IF NOT EXISTS public.business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL DEFAULT 'PizzaPOS',
  business_address TEXT NOT NULL DEFAULT '',
  business_phone TEXT NOT NULL DEFAULT '',
  business_ruc TEXT NOT NULL DEFAULT '',
  system_logo_url TEXT DEFAULT '',
  ticket_logo_url TEXT DEFAULT '',
  ticket_promo_text TEXT DEFAULT '',
  ticket_footer_text TEXT DEFAULT '¡Gracias por su preferencia!',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- 2. Habilitar RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- 3. Todos los autenticados pueden VER los ajustes
CREATE POLICY "Todos pueden ver ajustes del negocio"
  ON public.business_settings
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Solo admins pueden INSERTAR ajustes
CREATE POLICY "Solo admins pueden crear ajustes"
  ON public.business_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

-- 5. Solo admins pueden ACTUALIZAR ajustes
CREATE POLICY "Solo admins pueden actualizar ajustes"
  ON public.business_settings
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );

-- 6. Solo admins pueden ELIMINAR ajustes
CREATE POLICY "Solo admins pueden eliminar ajustes"
  ON public.business_settings
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- STORAGE: Bucket para logos del negocio
-- ============================================

-- 7. Crear bucket público para logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('business-logos', 'business-logos', true);

-- 8. Cualquier autenticado puede VER los logos
CREATE POLICY "Todos pueden ver logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'business-logos');

-- 9. Solo admins pueden SUBIR logos
CREATE POLICY "Admins pueden subir logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'business-logos' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- 10. Solo admins pueden ACTUALIZAR logos
CREATE POLICY "Admins pueden actualizar logos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'business-logos' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- 11. Solo admins pueden ELIMINAR logos
CREATE POLICY "Admins pueden eliminar logos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'business-logos' 
    AND public.has_role(auth.uid(), 'admin')
  );

-- ============================================
-- INSERTAR AJUSTES POR DEFECTO
-- ============================================
INSERT INTO public.business_settings (
  business_name, 
  business_address, 
  business_phone, 
  business_ruc, 
  ticket_promo_text, 
  ticket_footer_text
)
VALUES (
  'PizzaPOS', 
  'Av. Principal 123, Lima', 
  '01-234-5678', 
  '20123456789', 
  '¡Pide 2 pizzas y llévate una gaseosa gratis!', 
  '¡Gracias por su preferencia!'
);
