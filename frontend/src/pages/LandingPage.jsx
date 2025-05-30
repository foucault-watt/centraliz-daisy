import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx"; // Importer useAuth
import { getCustomHeaders } from "../utils/deviceInfo.js";

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, hasIcal, isAuthenticated, isLoading } = useAuth(); // Utiliser hasIcal
  const [rememberMe, setRememberMe] = useState(true);
  /**
   * Fonction pour gérer la connexion avec envoi des informations de l'appareil
   * Processus en 3 étapes :
   * 1. Envoie les informations de l'appareil pour l'identification (headers device info)
   * 2. Prépare la session avec le paramètre "remember me"
   * 3. Redirige directement vers CAS pour l'authentification
   */
  const handleLogin = async () => {
    try {
      // Étape 1 : Envoyer les informations de l'appareil au serveur
      const headers = getCustomHeaders();
      await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/device-info`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        credentials: "include",
        body: JSON.stringify({
          remember: rememberMe,
          deviceInfo: headers,
        }),
      });
    } catch (error) {
      console.warn(
        "Impossible d'envoyer les informations de l'appareil:",
        error
      );
    }

    // Étape 2 : Stocker le paramètre "remember me" dans la session backend
    try {
      await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/prepare-login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            remember: rememberMe,
          }),
        }
      );
    } catch (error) {
      console.warn("Erreur lors du stockage du paramètre remember:", error);
    }

    // Étape 3 : Redirection directe vers CAS pour éviter les problèmes de redirection HTTP
    const serviceURL = encodeURIComponent(
      `${import.meta.env.VITE_BACKEND_URL}/api/auth/callback`
    );
    const casURL = `https://cas.centralelille.fr/login?service=${serviceURL}`;
    window.location.href = casURL;
  };
  /**
   * Gestion des redirections automatiques en fonction de l'état d'authentification
   * - Si l'utilisateur est connecté ET a configuré son iCal : va vers le calendrier
   * - Si l'utilisateur est connecté MAIS n'a pas configuré son iCal : va vers l'onboarding
   * - Sinon reste sur la page de connexion
   */
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && hasIcal) {
        navigate("/app/calendar", { replace: true });
      } else if (isAuthenticated && !hasIcal) {
        navigate("/onboarding", { replace: true });
      }
      // Si non authentifié, reste sur la LandingPage
    }
  }, [isLoading, isAuthenticated, hasIcal, user, navigate]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  // Si l'utilisateur est déjà authentifié et en cours de redirection,
  // on peut aussi afficher LoadingScreen pour éviter un flash de la LandingPage.
  if (!isLoading && isAuthenticated) {
    // Si on est ici, cela signifie que la redirection via useEffect n'a pas encore eu lieu
    // ou que l'utilisateur est authentifié mais la logique de redirection est en cours.
    // Afficher un écran de chargement peut être une bonne UX.
    return <LoadingScreen />;
  }

  return (
    <div className="hero min-h-screen bg-base-200">
      <div className="hero-content text-center">
        <div className="max-w-md">
          <div className="flex justify-center mb-8">
            <div className="h-24 w-24">
              <Logo />
            </div>
          </div>
          <h1 className="text-5xl font-bold">Bienvenue sur Centraliz</h1>{" "}
          <p className="py-6">
            Centraliz vous aide à organiser vos calendriers et bien plus encore.
            Connectez-vous pour commencer !
          </p>{" "}
          <div className="form-control mb-6">
            <label className="label cursor-pointer justify-center">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="checkbox checkbox-primary mr-2"
              />
              <span className="label-text">
                Se souvenir de moi pendant 30 jours
              </span>
            </label>
          </div>
          <button onClick={handleLogin} className="btn btn-primary btn-lg">
            Se connecter / S'inscrire
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
