import axios from "axios";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [hasIcal, setHasIcal] = useState(false); // Remplacer icalLink par hasIcal
  const [isAdmin, setIsAdmin] = useState(false); // Ajouter l'état pour l'admin
  const [userGroup, setUserGroup] = useState(null); // Ajouter l'état pour le groupe de l'utilisateur
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const userResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/me`,
        { withCredentials: true }
      );
      const userData = userResponse.data.user; // userData peut être null si non authentifié

      if (userData && userData.userName) {
        // Vérifier si userData et userName sont valides
        setUser(userData);
        setIsAuthenticated(true);
        // Assurer que hasIcal est un booléen, même si userData.hasIcal est undefined
        setHasIcal(!!userData.hasIcal);
        // Définir isAdmin à partir des données utilisateur
        setIsAdmin(!!userData.isAdmin);
        // Définir le groupe de l'utilisateur à partir des données utilisateur
        setUserGroup(userData.group || null);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setHasIcal(false);
        setIsAdmin(false);
        setUserGroup(null);
      }
    } catch (authError) {
      // Cette section catch devrait maintenant être moins sollicitée pour les cas de non-authentification simple,
      // car /api/me renverra 200 avec user: null.
      // Elle reste utile pour les erreurs réseau ou autres erreurs serveur.
      console.error("Erreur lors de fetchAuthStatus:", authError);
      setUser(null);
      setHasIcal(false);
      setIsAuthenticated(false);
      setIsAdmin(false); // Assurez-vous de réinitialiser isAdmin également en cas d'erreur
      setUserGroup(null); // Réinitialiser le groupe en cas d'erreur
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  const logout = async () => {
    setIsLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/logout`,
        {},
        { withCredentials: true }
      );
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      // Gérer l'erreur de déconnexion si nécessaire, mais continuer la déconnexion côté client
    } finally {
      setUser(null);
      setHasIcal(false); // Réinitialiser hasIcal lors de la déconnexion
      setIsAdmin(false); // Réinitialiser isAdmin lors de la déconnexion
      setUserGroup(null); // Réinitialiser le groupe lors de la déconnexion
      setIsAuthenticated(false);
      setIsLoading(false);
      // La redirection sera gérée par ProtectedRoute ou la page actuelle
      // Forcer la redirection vers la page d'accueil après la déconnexion
      if (navigate) {
        // S'assurer que navigate est disponible
        navigate("/");
      } else {
        // Fallback si navigate n'est pas disponible (ne devrait pas arriver si AuthProvider est bien placé)
        window.location.href = "/";
      }
    }
  };
  const value = {
    user,
    hasIcal, // Exposer hasIcal
    isAdmin, // Exposer isAdmin
    userGroup, // Exposer userGroup
    isAuthenticated,
    isLoading,
    fetchAuthStatus,
    // Ne plus exposer updateIcalLinkLocal
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
