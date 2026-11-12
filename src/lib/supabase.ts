import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.generated";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase configuration. Set VITE_SUPABASE_URL and " +
      "VITE_SUPABASE_ANON_KEY in your .env file (see .env.example).",
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey);

export default supabase;
