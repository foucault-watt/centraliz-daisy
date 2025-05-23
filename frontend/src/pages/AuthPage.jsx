import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx"; // Importer useAuth

// Ce composant est la cible de redirection après le login CAS.
// AuthContext devrait déjà avoir mis à jour l'état.
// Cette page redirige en fonction de cet état.

const AuthPage = () => {
  const navigate = useNavigate();
  const {
    user,
    hasIcal,
    isAuthenticated,
    isLoading,
    fetchAuthStatus,
  } = useAuth(); // Utiliser hasIcal

  useEffect(() => {
    // Si AuthContext est toujours en train de charger initialement,
    // ou si on veut forcer un rafraîchissement après le callback.
    // Normalement, AuthContext se charge au démarrage de l'app.
    // Un fetchAuthStatus ici pourrait être redondant si le contexte est déjà à jour.
    // Cependant, après le callback CAS, la session backend vient d'être établie,
    // donc un rafraîchissement de l'état client est pertinent.
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && hasIcal) {
        // Utiliser hasIcal
        navigate("/app/calendar", { replace: true });
      } else if (isAuthenticated && !hasIcal) {
        // Utiliser hasIcal
        navigate("/onboarding", { replace: true });
      } else if (!isAuthenticated) {
        // Si après le callback et le fetchAuthStatus, l'utilisateur n'est toujours pas authentifié,
        // il y a un problème. Rediriger vers la page d'accueil.
        navigate("/", { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, hasIcal, navigate]); // Ajouter hasIcal aux dépendances

  return <LoadingScreen />; // Afficher un écran de chargement pendant la redirection
};

export default AuthPage;
