/**
 * Contexte d'authentification global
 *
 * Gère l'état d'authentification de l'application :
 * - Vérification initiale du statut de connexion
 * - Mise à jour des informations utilisateur
 * - Gestion de la déconnexion
 * - Synchronisation avec le backend
 */

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

// Hook personnalisé pour utiliser le contexte d'authentification
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  // États de l'authentification
  const [user, setUser] = useState(null);
  const [hasIcal, setHasIcal] = useState(false); // Configuration calendrier
  const [isAdmin, setIsAdmin] = useState(false); // Droits administrateur
  const [userGroup, setUserGroup] = useState(null); // Groupe d'appartenance
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  /**
   * Fonction pour récupérer le statut d'authentification depuis le backend
   *
   * Met à jour tous les états d'authentification :
   * - user : informations utilisateur complètes
   * - isAuthenticated : statut de connexion
   * - hasIcal : si l'utilisateur a configuré son calendrier
   * - isAdmin : droits administrateur
   * - userGroup : groupe d'appartenance
   */
  const fetchAuthStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      // Récupération du statut d'authentification depuis le backend
      const userResponse = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/me`,
        { withCredentials: true }
      );
      const userData = userResponse.data.user; // userData peut être null si non authentifié

      if (userData && userData.userName) {
        // Utilisateur authentifié : mise à jour des états
        setUser(userData);
        setIsAuthenticated(true);
        // Assurer que hasIcal est un booléen, même si userData.hasIcal est undefined
        setHasIcal(!!userData.hasIcal);
        // Définir isAdmin à partir des données utilisateur
        setIsAdmin(!!userData.isAdmin);
        // Définir le groupe de l'utilisateur à partir des données utilisateur
        setUserGroup(userData.group || null);
      } else {
        // Utilisateur non authentifié : reset des états
        setUser(null);
        setIsAuthenticated(false);
        setHasIcal(false);
        setIsAdmin(false);
        setUserGroup(null);
      }
    } catch (authError) {
      // Gestion des erreurs réseau ou serveur lors de la vérification d'authentification
      console.error(
        "Erreur lors de la vérification d'authentification:",
        authError
      );
      setUser(null);
      setHasIcal(false);
      setIsAuthenticated(false);
      setIsAdmin(false);
      setUserGroup(null);
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    // Vérification initiale du statut d'authentification au chargement de l'application
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  const logout = async () => {
    setIsLoading(true);
    try {
      // Appel API pour déconnexion côté serveur
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
