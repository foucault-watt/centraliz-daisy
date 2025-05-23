import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../assets/Logo.jsx";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx"; // Importer useAuth

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, hasIcal, isAuthenticated, isLoading } = useAuth(); // Utiliser hasIcal

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && hasIcal) {
        navigate("/app/calendar", { replace: true });
      } else if (isAuthenticated && !hasIcal) {
        navigate("/onboarding", { replace: true });
      }
      // Si non authentifié, reste sur la LandingPage
    }
  }, [isLoading, isAuthenticated, user, hasIcal, navigate]); // Ajouter hasIcal aux dépendances

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
