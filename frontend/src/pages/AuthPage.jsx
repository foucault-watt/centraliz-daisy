import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx"; // Importer useAuth

/**
 * Page de traitement après authentification CAS
 *
 * Cette page est la cible de redirection après le login CAS.
 * Elle force une mise à jour de l'état d'authentification puis redirige
 * l'utilisateur vers la page appropriée selon son statut.
 */

const AuthPage = () => {
  const navigate = useNavigate();
  const { user, hasIcal, isAuthenticated, isLoading, fetchAuthStatus } =
    useAuth();

  /**
   * Premier useEffect : Force un rafraîchissement de l'état d'authentification
   * Nécessaire car après le callback CAS, la session backend vient d'être établie
   * et l'état côté client doit être mis à jour
   */
  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  /**
   * Deuxième useEffect : Gestion des redirections selon l'état d'authentification
   * - Authentifié avec iCal configuré → calendrier
   * - Authentifié sans iCal → onboarding
   * - Non authentifié → retour à l'accueil (problème d'authentification)
   */
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && hasIcal) {
        navigate("/app/calendar", { replace: true });
      } else if (isAuthenticated && !hasIcal) {
        navigate("/onboarding", { replace: true });
      } else if (!isAuthenticated) {
        // Problème d'authentification, retour à l'accueil
        navigate("/", { replace: true });
      }
    }
  }, [isLoading, isAuthenticated, user, hasIcal, navigate]);

  // Affichage d'un écran de chargement pendant le traitement et la redirection
  return <LoadingScreen />;
};

export default AuthPage;
