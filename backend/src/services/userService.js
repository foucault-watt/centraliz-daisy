const { supabase } = require("./supabaseClient");

async function syncUserWithSupabase(userId) {
  const { data, error } = await supabase
    .from("utilisateurs")
    .select("id")
    .eq("identifiant", userId)
    .single();

  if (!data) {
    await supabase.from("utilisateurs").insert({ identifiant: userId });
  }
}

module.exports = { syncUserWithSupabase };
