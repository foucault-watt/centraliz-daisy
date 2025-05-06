import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
console.log("Supabase URL:", supabaseUrl); // Log the Supabase URL for debugging
if (!supabaseUrl) {
  throw new Error("Supabase URL is not defined in environment variables");
}
let supabaseToken = null;

export function setSupabaseToken(token) {
  supabaseToken = token;
}

export function getSupabaseClient() {
  if (!supabaseToken) throw new Error("Supabase token not set");
  return createClient(supabaseUrl, supabaseToken, {
    global: { headers: { Authorization: `Bearer ${supabaseToken}` } },
    auth: { persistSession: false },
  });
}
