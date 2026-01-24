import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfrwwqszmpqdwpvdcxms.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcnd3cXN6bXBxZHdwdmRjeG1zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNjQ0MDYsImV4cCI6MjA4NDg0MDQwNn0.mqh6nGWy2notafJrxN0bJ8_bswIBlfAax6yGZhSe9GU';

export type AppRole = 'admin' | 'user';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
