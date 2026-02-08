-- =====================================================
-- SISTEMA DE GESTIÓN: AUDIT LOG
-- Ejecutar en SQL Editor de Supabase
-- =====================================================

-- 1. Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.audit_log(action);

-- 3. Habilitar RLS
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de acceso (solo admins)
DO $$ BEGIN
    CREATE POLICY "Admins can read audit_log"
        ON public.audit_log FOR SELECT TO authenticated
        USING (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Admins can insert audit_log"
        ON public.audit_log FOR INSERT TO authenticated
        WITH CHECK (public.has_role(auth.uid(), 'admin'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Verificar creación
SELECT 'audit_log creada correctamente' AS resultado;
