import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../api";
import { getSupabaseClient, setSupabaseToken } from "../api/supabaseClient";

function AuthPage() {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentUser()
      .then((data) => {
        if (data?.supabaseToken) setSupabaseToken(data.supabaseToken);
        setUser(data?.userName);
        setUserId(data?.id);

        // Exemple : requête authentifiée avec id
        if (data?.supabaseToken && data?.id) {
          const supabase = getSupabaseClient();
          supabase
            .from("users")
            .select("*")
            .eq("id", data.id)
            .single()
            .then((res) => {
              console.log("Données utilisateur Supabase :", res.data);
            });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogin = () => {
    window.location.href = "http://localhost:3001/api/cas/login";
  };

  const handleLogout = () => {
    document.cookie = "auth_token=; Max-Age=0; path=/";
    window.location.reload();
  };

  const handleSupabaseRequest = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.from("users").select("*").limit(5);
      if (error) {
        console.error("Erreur Supabase :", error);
      } else {
        console.log("Résultat requête Supabase :", data);
      }
    } catch (err) {
      console.error("Erreur JS :", err);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center">
      <div className="card w-96 bg-base-100 shadow-xl p-6">
        {loading ? (
          <span className="loading loading-spinner loading-md"></span>
        ) : user ? (
          <>
            <h2 className="text-2xl font-bold mb-4">Bonjour {user}</h2>
            <button className="btn btn-error w-full" onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Se déconnecter
            </button>
            <button
              className="btn btn-info w-full mt-4"
              onClick={handleSupabaseRequest}
            >
              Tester requête Supabase
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold mb-4">Bienvenue sur Centraliz</h2>
            <button className="btn btn-primary w-full" onClick={handleLogin}>
              Se connecter via CAS
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthPage;
