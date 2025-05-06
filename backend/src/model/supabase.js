import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // doit être la clé service_role
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
