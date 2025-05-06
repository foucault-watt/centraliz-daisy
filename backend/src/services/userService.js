import { v4 as uuidv4 } from "uuid";
import supabase from "../model/supabase.js";

export async function syncUserWithSupabase(userName) {
  // Cherche l'utilisateur par username
  const { data, error } = await supabase
    .from("users")
    .select("id, username")
    .eq("username", userName)
    .single();

  if (data) {
    return data.id; // Retourne l'id existant
  }
  // Sinon, crée l'utilisateur avec un nouvel id
  const id = uuidv4();
  await supabase.from("users").insert([{ id, username: userName }]);
  return id;
}
