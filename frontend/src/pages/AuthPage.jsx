import { useEffect } from "react";

// Ce composant ne sera plus une "page" visible avec des onglets.
// Sa logique de récupération d'utilisateur et de lien iCal est maintenant
// gérée dans LandingPage, OnboardingPage, et ProtectedRoute.
// Il pourrait servir de page de callback pour l'authentification OAuth à l'avenir.

const AuthPage = () => {
  // La logique ci-dessous est un exemple de ce qui pourrait rester ou être adapté
  // pour une page de callback ou un contexte d'authentification.
  // Pour l'instant, elle n'est plus directement utilisée pour afficher une page.

  /*
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [icalLoading, setIcalLoading] = useState(false);
  const [icalLink, setIcalLink] = useState(null);
  const [newIcalLink, setNewIcalLink] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/me`,
          { withCredentials: true }
        );
        setUser(response.data.user);
      } catch (error) {
        console.error(
          "Erreur lors de la récupération de l'utilisateur :",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchIcalLink = async () => {
      setIcalLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/calendar`,
          { withCredentials: true }
        );
        setIcalLink(response.data.icalLink);
      } catch (error) {
        console.error("Erreur lors de la récupération du icalLink :", error);
      } finally {
        setIcalLoading(false);
      }
    };

    if (user) {
      fetchIcalLink();
    }
  }, [user]);

  const handleUploadIcalLink = async () => {
    setErrorMessage("");
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/calendar`,
        { icalLink: newIcalLink },
        { withCredentials: true }
      );
      setIcalLink(newIcalLink);
      setNewIcalLink("");
    } catch (error) {
      console.error("Erreur lors de l'upload du icalLink :", error);
      setErrorMessage(
        error.response?.data?.error ||
          "Ce n'est pas un lien iCal valide 😖. Assurez-vous que le lien est correct."
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleUploadIcalLink();
    }
  };

  // La partie JSX ci-dessous est commentée car cette page n'est plus affichée directement.
  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-screen bg-base-100">
  //       <span className="loading loading-spinner loading-lg"></span>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return (
  //     <div className="flex flex-col items-center justify-center h-screen bg-base-100 text-base-content">
  //       <div className="card shadow-lg p-8 bg-base-200">
  //         <h1 className="text-3xl font-bold mb-4 text-center">
  //           Connexion requise
  //         </h1>
  //         <p className="text-center mb-6">
  //           Veuillez vous connecter pour accéder à votre espace.
  //         </p>
  //         <a
  //           href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`}
  //           className="btn btn-primary btn-wide"
  //         >
  //           Se connecter
  //         </a>
  //       </div>
  //     </div>
  //   );
  // }

  // return (
  //   <div className="flex flex-col items-center justify-center h-screen bg-base-100 text-base-content">
  //     <div className="card shadow-lg p-8 bg-base-200 w-full max-w-md">
  //       <h1 className="text-3xl font-bold mb-4 text-center">Bienvenue !</h1>
  //       <p className="text-lg text-center mb-4">
  //         <strong>Nom d'utilisateur :</strong> {user.userName}
  //       </p>
  //       <p className="text-lg text-center mb-6">
  //         <strong>Nom affiché :</strong> {user.displayName}
  //       </p>
  //       {icalLoading ? (
  //         <div className="flex justify-center items-center mt-4">
  //           <span className="loading loading-spinner loading-md"></span>
  //         </div>
  //       ) : icalLink ? (
  //         <div className="mt-4">
  //           <p className="text-lg text-center">
  //             <strong>Votre lien iCal :</strong> {icalLink}
  //           </p>
  //         </div>
  //       ) : (
  //         <div className="mt-4">
  //           <input
  //             type="text"
  //             placeholder="Entrez votre lien iCal"
  //             className="input input-bordered w-full"
  //             value={newIcalLink}
  //             onChange={(e) => setNewIcalLink(e.target.value)}
  //             onKeyDown={handleKeyDown}
  //           />
  //           <button
  //             className="btn btn-primary btn-block mt-2"
  //             onClick={handleUploadIcalLink}
  //           >
  //             Enregistrer le lien
  //           </button>
  //           {errorMessage && (
  //             <div className="alert alert-error mt-4">
  //               <span>{errorMessage}</span>
  //             </div>
  //           )}
  //         </div>
  //       )}
  //     </div>
  //   </div>
  // );
  */

  // Pour l'instant, cette page pourrait simplement rediriger ou afficher un message si elle est atteinte directement.
  // Idéalement, elle ne devrait pas être accessible directement.
  useEffect(() => {
    // Exemple: si cette page est utilisée comme callback après une authentification externe,
    // elle pourrait vérifier le statut et rediriger.
    // navigate("/onboarding"); // ou navigate("/") ou navigate("/app/calendar") selon le statut.
    console.log(
      "AuthPage atteinte - son rôle doit être redéfini (ex: callback)."
    );
  }, []);

  return (
    <div className="p-6 bg-base-200">
      <h1 className="text-2xl font-bold">Authentification en cours...</h1>
      <p className="mt-4">
        Vous serez redirigé sous peu. Si ce n'est pas le cas, veuillez vérifier
        votre connexion.
      </p>
      {/* Ce contenu est un placeholder, car cette page ne devrait pas être vue longtemps. */}
    </div>
  );
};

export default AuthPage;
