import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingScreen from "./LoadingScreen.jsx";

const ProtectedRoute = ({
  onboardingRequired = false,
  onboardingSpecific = false, // Nouvelle prop pour la page /onboarding elle-même
}) => {
  const { isAuthenticated, hasIcal, isLoading } = useAuth(); // Utiliser hasIcal au lieu de icalLink
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    // Si non authentifié, rediriger vers la page d'accueil, en sauvegardant la page d'origine
    // sauf si la page d'origine est déjà la page d'accueil.
    if (location.pathname !== "/") {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
    // Si déjà sur "/", ne rien faire (laisser LandingPage s'afficher)
    // Ceci est géré par la route "/" elle-même qui n'est pas sous ProtectedRoute.
    // Donc, si on arrive ici non authentifié, c'est qu'on essaie d'accéder à une route protégée.
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // L'utilisateur est authentifié
  const hasCompletedOnboarding = hasIcal; // Utiliser hasIcal

  if (onboardingSpecific) {
    // Cas spécifique pour la route /onboarding
    if (hasCompletedOnboarding) {
      // Si l'onboarding est fait, rediriger de /onboarding vers /app/calendar
      return <Navigate to="/app/calendar" state={{ from: location }} replace />;
    }
    // Sinon (onboarding non fait), autoriser l'accès à /onboarding
    return <Outlet />;
  }

  if (onboardingRequired && !hasCompletedOnboarding) {
    // Si la route requiert l'onboarding et qu'il n'est pas fait,
    // rediriger vers /onboarding.
    // On s'assure de ne pas être déjà sur /onboarding pour éviter une boucle,
    // bien que le cas `onboardingSpecific` devrait déjà gérer cela.
    if (location.pathname !== "/onboarding") {
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
  }

  // Si toutes les conditions sont remplies (authentifié, et onboarding fait si requis),
  // ou si la route ne requiert pas l'onboarding et l'utilisateur est authentifié.
  return <Outlet />;
};

export default ProtectedRoute;
