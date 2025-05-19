import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx"; // Importer LoadingScreen

const LandingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [icalLink, setIcalLink] = useState(null);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const userResponse = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/me`,
          { withCredentials: true }
        );
        setUser(userResponse.data.user);
        if (userResponse.data.user) {
          try {
            const icalResponse = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}/api/calendar`,
              { withCredentials: true }
            );
            // Vérifier explicitement si icalLink est présent et non-vide
            if (icalResponse.data && icalResponse.data.icalLink) {
              setIcalLink(icalResponse.data.icalLink);
            } else {
              // Si icalLink est null, vide, ou non présent dans la réponse
              setIcalLink(null);
              console.log(
                "LandingPage: iCal link is null or empty, user needs onboarding."
              );
            }
          } catch (icalError) {
            setIcalLink(null); // S'assurer que icalLink est null en cas d'erreur
            console.log(
              "LandingPage: iCal link not found or error fetching, user may need onboarding:",
              icalError.message
            );
          }
        }
      } catch (authError) {
        // L'utilisateur n'est pas authentifié ou une erreur s'est produite
        console.log(
          "User not authenticated or error fetching user:",
          authError.message
        );
        // setUser restera null
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []); // Pas de dépendances, exécuté une seule fois

  useEffect(() => {
    if (!loading) {
      if (user && icalLink) {
        // icalLink doit être une chaîne non vide ici
        navigate("/app/calendar");
      } else if (user && !icalLink) {
        // Si user existe mais icalLink est null ou vide
        navigate("/onboarding");
      }
    }
  }, [loading, user, icalLink, navigate]);

  if (loading) {
    return <LoadingScreen />; // Utiliser le composant LoadingScreen
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
          <h1 className="text-5xl font-bold">Bienvenue sur Centraliz</h1>
          <p className="py-6">
            Centraliz vous aide à organiser vos calendriers et bien plus encore.
            Connectez-vous pour commencer !
          </p>
          <a
            href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`}
            className="btn btn-primary btn-lg"
          >
            Se connecter / S'inscrire
          </a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
