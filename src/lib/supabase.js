import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Null when the env vars are missing — the live board then degrades to its
 * "NETS OPEN / nobody batting" fallback instead of crashing the page.
 */
export const supabase = url && key ? createClient(url, key) : null;
