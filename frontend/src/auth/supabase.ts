import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log(supabaseUrl);

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in the root .env file, then restart Vite.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
