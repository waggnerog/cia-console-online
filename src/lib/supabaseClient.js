/**
 * src/lib/supabaseClient.js
 * ─────────────────────────────────────────────────────────────────────
 * Single source of truth for the Supabase client in CIA Console.
 *
 * Configuration comes exclusively from Vite env vars:
 *   VITE_SUPABASE_URL       → Supabase project URL
 *   VITE_SUPABASE_ANON_KEY  → Supabase anon/public key
 *   VITE_SUPABASE_BUCKET    → Storage bucket name (default: cia-files)
 *
 * Requirements:
 *   1. Copy .env.example to .env.local and fill in your project values.
 *   2. NEVER put the service_role key here or anywhere client-side.
 * ─────────────────────────────────────────────────────────────────────
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const SUPABASE_BUCKET = import.meta.env.VITE_SUPABASE_BUCKET || 'cia-files';

if (!SUPABASE_URL || SUPABASE_URL.includes('your-project')) {
  throw new Error(
    '[CIA] VITE_SUPABASE_URL is not configured.\n' +
    'Copy .env.example to .env.local and set your Supabase project URL.'
  );
}

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...')) {
  throw new Error(
    '[CIA] VITE_SUPABASE_ANON_KEY is not configured.\n' +
    'Copy .env.example to .env.local and set your Supabase anon key.'
  );
}

/**
 * Singleton Supabase client.
 * Use this directly or via CIA_CLOUD.client().
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export { SUPABASE_URL, SUPABASE_ANON_KEY };
