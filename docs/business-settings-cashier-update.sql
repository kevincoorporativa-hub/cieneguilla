-- ============================================
-- PERMITIR A CAJEROS EDITAR DISEÑO DE TICKET
-- Copiar y pegar en Supabase SQL Editor
-- ============================================

-- 1. Eliminar la política actual de UPDATE (solo admins)
DROP POLICY IF EXISTS "Solo admins pueden actualizar ajustes" ON public.business_settings;

-- 2. Crear nueva política: TODOS los autenticados pueden actualizar
--    (el frontend controla qué campos puede ver/editar cada rol)
CREATE POLICY "Usuarios autenticados pueden actualizar ajustes"
  ON public.business_settings
  FOR UPDATE
  TO authenticated
  USING (true);

-- ============================================
-- NOTA: Los campos del negocio (nombre, dirección, RUC)
-- están protegidos en el frontend: solo el admin ve la pestaña "Negocio".
-- Los cajeros solo ven la pestaña "Ticket" donde pueden cambiar:
--   - Logo del ticket
--   - Texto de promoción  
--   - Texto de pie de ticket
-- ============================================
