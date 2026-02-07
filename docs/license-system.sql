-- ============================================
-- SISTEMA DE LICENCIAS - PizzaPOS
-- Copiar y pegar en Supabase SQL Editor
-- ============================================

-- 1. Crear tabla de licencias
CREATE TABLE IF NOT EXISTS public.licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  license_type TEXT NOT NULL DEFAULT 'mensual',
  is_active BOOLEAN NOT NULL DEFAULT true,
  activated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

-- 3. Política: Todos los autenticados pueden VER la licencia activa
CREATE POLICY "Todos pueden ver licencias"
  ON public.licenses
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. Política: Solo admins pueden INSERTAR licencias
CREATE POLICY "Solo admins pueden crear licencias"
  ON public.licenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );

-- 5. Política: Solo admins pueden ACTUALIZAR licencias
CREATE POLICY "Solo admins pueden actualizar licencias"
  ON public.licenses
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );

-- 6. Política: Solo admins pueden ELIMINAR licencias
CREATE POLICY "Solo admins pueden eliminar licencias"
  ON public.licenses
  FOR DELETE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
  );

-- 7. Función para verificar si la licencia está vigente (SECURITY DEFINER para evitar RLS recursivo)
CREATE OR REPLACE FUNCTION public.is_license_active()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.licenses
    WHERE is_active = true
      AND expires_at > now()
    ORDER BY expires_at DESC
    LIMIT 1
  );
$$;

-- 8. Función para obtener los días restantes de la licencia activa
CREATE OR REPLACE FUNCTION public.get_license_days_remaining()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT GREATEST(0, EXTRACT(DAY FROM (expires_at - now()))::INTEGER)
      FROM public.licenses
      WHERE is_active = true
        AND expires_at > now()
      ORDER BY expires_at DESC
      LIMIT 1
    ),
    0
  );
$$;

-- 9. Insertar una licencia inicial de 30 días (OPCIONAL - descomentar si deseas)
-- INSERT INTO public.licenses (expires_at, license_type, is_active, notes)
-- VALUES (now() + INTERVAL '30 days', 'mensual', true, 'Licencia inicial del sistema');

-- ============================================
-- FIN DEL SCRIPT
-- ============================================
