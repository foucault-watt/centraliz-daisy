import axios from "axios";
import { useEffect, useState } from "react";

const AuthPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/api/me`,
          { withCredentials: true }
        );
        setUser(response.data.user);
        console.log("Authentification utilisateur :", response.data.user); // Affiche l'authentification dans la console
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-base-100 text-base-content">
        <h1 className="text-3xl font-bold mb-4">Vous n'êtes pas connecté</h1>
        <a
          href={`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`}
          className="btn btn-primary"
        >
          Se connecter
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-base-100 text-base-content">
      <h1 className="text-3xl font-bold mb-4">Bienvenue !</h1>
      <p className="text-lg">
        <strong>Nom d'utilisateur :</strong> {user.userName}
      </p>
      <p className="text-lg">
        <strong>Nom affiché :</strong> {user.displayName}
      </p>
    </div>
  );
};

export default AuthPage;
