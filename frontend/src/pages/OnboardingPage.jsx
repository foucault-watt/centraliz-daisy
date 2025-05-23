import axios from "axios";
import { Check, ChevronRight, X } from "lucide-react";
import { useState } from "react"; // Garder useEffect pour la logique interne de la page si besoin
import { useNavigate } from "react-router-dom";
import LoadingScreen from "../components/LoadingScreen.jsx";
import { useAuth } from "../context/AuthContext.jsx"; // Importer useAuth

const OnboardingPage = () => {
  const navigate = useNavigate();
  const {
    user,
    isLoading: authLoading,
    fetchAuthStatus, // Utiliser fetchAuthStatus pour rafraîchir l'état global
  } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [newIcalLink, setNewIcalLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [pageLoading, setPageLoading] = useState(false); // Chargement spécifique à la soumission du formulaire

  // Pas besoin de fetchUser ici, car AuthContext le fournit.

  const handleUploadIcalLink = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setPageLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/calendar`,
        { icalLink: newIcalLink },
        { withCredentials: true }
      );
      // Ne plus appeler updateIcalLinkLocal
      setSuccessMessage("Lien iCal enregistré avec succès ! Redirection...");
      // Rafraîchir l'état d'authentification et hasIcal depuis le backend
      await fetchAuthStatus();
      // La redirection sera gérée par ProtectedRoute ou le useEffect de cette page si hasIcal change
      // Ou on peut garder la redirection explicite si fetchAuthStatus met à jour l'état assez rapidement
      setTimeout(() => {
        navigate("/app/calendar", { replace: true });
      }, 1500); // Le délai peut être ajusté ou la redirection peut dépendre de la mise à jour de hasIcal
    } catch (error) {
      console.error("Erreur lors de l'upload du icalLink :", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Ce n'est pas un lien iCal valide 😖. Assurez-vous que le lien est correct et réessayez."
      );
    } finally {
      setPageLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (currentStep === 2 && newIcalLink && !pageLoading && !successMessage) {
        handleUploadIcalLink();
      }
    }
  };

  const nextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (
      currentStep === 2 &&
      newIcalLink &&
      !pageLoading &&
      !successMessage
    ) {
      handleUploadIcalLink();
    }
  };

  if (authLoading) {
    return <LoadingScreen />;
  }

  // Si l'utilisateur n'est pas disponible après le chargement du contexte,
  // cela pourrait indiquer un problème ou qu'il n'est pas authentifié.
  // ProtectedRoute devrait déjà gérer la redirection des non-authentifiés.
  if (!user) {
    // Normalement, ProtectedRoute devrait avoir redirigé.
    // Si on arrive ici, c'est un état inattendu, ou l'utilisateur vient de se déconnecter.
    // Afficher un chargement ou rediriger peut être une option.
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-base-100 p-4">
      <div className="card shadow-xl p-6 md:p-8 bg-base-200 w-full max-w-lg">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">
          Configuration Initiale
        </h1>

        <ul className="steps w-full mb-8">
          <li className={`step ${currentStep >= 1 ? "step-primary" : ""}`}>
            Bienvenue
          </li>
          <li className={`step ${currentStep >= 2 ? "step-primary" : ""}`}>
            Calendrier iCal
          </li>
        </ul>

        {currentStep === 1 && (
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-4">
              Bonjour, {user?.displayName || user?.userName}!
            </h2>
            <p className="mb-6">
              Merci d'avoir rejoint Centraliz. Configurons rapidement votre
              compte.
            </p>
            <button className="btn btn-primary" onClick={nextStep}>
              Continuer <ChevronRight size={18} />
            </button>
          </div>
        )}

        {currentStep === 2 && (
          <div>
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Connectez votre calendrier
            </h2>
            <p className="mb-1 text-sm text-base-content/70">
              Pour commencer, veuillez fournir le lien de votre calendrier au
              format iCal (se terminant généralement par .ics).
            </p>
            <p className="mb-4 text-xs text-base-content/50">
              Exemple: https://calendar.google.com/calendar/ical/.../basic.ics
            </p>
            <div className="form-control w-full mb-4">
              <input
                type="url"
                placeholder="Collez votre lien iCal ici"
                className={`input input-bordered w-full ${
                  errorMessage ? "input-error" : ""
                } ${successMessage ? "input-success" : ""}`}
                value={newIcalLink}
                onChange={(e) => {
                  setNewIcalLink(e.target.value);
                  setErrorMessage("");
                  setSuccessMessage("");
                }}
                onKeyDown={handleKeyDown}
                disabled={pageLoading || !!successMessage}
              />
            </div>
            {errorMessage && (
              <div role="alert" className="alert alert-error mb-4">
                <X size={18} />
                <span>{errorMessage}</span>
              </div>
            )}
            {successMessage && (
              <div role="alert" className="alert alert-success mb-4">
                <Check size={18} />
                <span>{successMessage}</span>
              </div>
            )}
            <button
              className="btn btn-primary btn-block"
              onClick={handleUploadIcalLink}
              disabled={!newIcalLink || pageLoading || !!successMessage}
            >
              {pageLoading ? (
                <span className="loading loading-spinner loading-sm"></span>
              ) : (
                "Enregistrer et Terminer"
              )}
            </button>
          </div>
        )}
      </div>
      <p className="mt-8 text-sm text-base-content/50">
        Vous pourrez modifier ce lien plus tard dans les paramètres.
      </p>
    </div>
  );
};

export default OnboardingPage;
