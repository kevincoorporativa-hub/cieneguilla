-- Function to get database size information
-- This function uses SECURITY DEFINER to run with elevated privileges

CREATE OR REPLACE FUNCTION public.get_database_size()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  db_size_bytes bigint;
  db_limit_bytes bigint := 500 * 1024 * 1024; -- 500MB free tier limit
  usage_percentage numeric;
BEGIN
  -- Get the current database size
  SELECT pg_database_size(current_database()) INTO db_size_bytes;
  
  -- Calculate percentage
  usage_percentage := ROUND((db_size_bytes::numeric / db_limit_bytes::numeric) * 100, 1);
  
  RETURN jsonb_build_object(
    'size_bytes', db_size_bytes,
    'size_pretty', pg_size_pretty(db_size_bytes),
    'limit_bytes', db_limit_bytes,
    'limit_pretty', pg_size_pretty(db_limit_bytes),
    'percentage', usage_percentage
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_database_size() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_database_size() TO service_role;
