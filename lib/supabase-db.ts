import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_DB_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_DB_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.warn(
    "[supabase-db] SUPABASE_DB_URL or SUPABASE_DB_SERVICE_ROLE_KEY missing — DB calls will fail",
  );
}

export const supabaseDb = createClient(url ?? "", key ?? "", {
  auth: { persistSession: false },
});
