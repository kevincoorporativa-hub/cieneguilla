-- =====================================================
-- Renombrar columna "phone" a "dni" en la tabla customers
-- Ejecutar en Lovable Cloud > Run SQL
-- =====================================================

-- Renombrar la columna
ALTER TABLE public.customers RENAME COLUMN phone TO dni;

-- Verificar el cambio
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public';
