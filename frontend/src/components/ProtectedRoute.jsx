import axios from "axios";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import LoadingScreen from "./LoadingScreen.jsx"; // Importer LoadingScreen

const ProtectedRoute = ({ onboardingRequired = false }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkStatus = async () => {
      let auth = false;
      try {
        await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/me`, {
          withCredentials: true,
        });
        auth = true;
        setIsAuthenticated(true);

        try {
          const icalResponse = await axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/api/calendar`,
            { withCredentials: true }
          );
          // Vérifier si icalLink est présent et non-vide dans la réponse
          if (icalResponse.data && icalResponse.data.icalLink) {
            setHasCompletedOnboarding(true);
          } else {
            // Si icalLink est null, vide, ou non présent
            setHasCompletedOnboarding(false);
            console.log("ProtectedRoute: iCal link is null or empty.");
          }
        } catch (icalError) {
          setHasCompletedOnboarding(false);
          console.log(
            "ProtectedRoute: Error fetching iCal link.",
            icalError.message
          );
        }
      } catch (authError) {
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false); // Par sécurité
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, []); // Exécuter une seule fois au montage

  if (loading) {
    return <LoadingScreen />; // Utiliser le composant LoadingScreen
  }

  if (!isAuthenticated) {
    if (location.pathname !== "/") {
      return <Navigate to="/" state={{ from: location }} replace />;
    }
  }

  if (isAuthenticated) {
    if (onboardingRequired && !hasCompletedOnboarding) {
      // Si la route requiert l'onboarding et qu'il n'est pas fait (hasCompletedOnboarding est false)
      // et que nous ne sommes pas déjà sur la page d'onboarding, rediriger.
      if (location.pathname !== "/onboarding") {
        return <Navigate to="/onboarding" state={{ from: location }} replace />;
      }
    }
    if (hasCompletedOnboarding && location.pathname === "/onboarding") {
      return <Navigate to="/app/calendar" state={{ from: location }} replace />;
    }
  }

  return <Outlet />; // Afficher le contenu de la route si toutes les conditions sont remplies
};

export default ProtectedRoute;
