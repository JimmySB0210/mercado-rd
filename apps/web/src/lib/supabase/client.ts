import { createBrowserClient } from '@supabase/ssr';

// ─── Variables de entorno ─────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    '❌ Faltan variables de entorno. Copia .env.example → .env.local y configura Supabase.'
  );
}

// ─── Cliente para el browser (componentes de React) ──────────────────────────
export function createClient() {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
