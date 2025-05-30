import { verifyRememberToken } from "../controllers/rememberTokenController.js";
import logger from "../utils/logger.js";
import {
  cleanupCorruptedSession,
  syncSessionWithDatabase,
  validateSessionUser,
} from "../utils/sessionValidator.js";

/**
 * Middleware d'authentification principal
 *
 * Processus de vérification en plusieurs étapes :
 * 1. Vérification de session existante et validation en base
 * 2. Si session corrompue, tentative de synchronisation avec la base
 * 3. Si pas de session, vérification du token "remember me"
 * 4. Restauration de session si token valide
 *
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
export const authMiddleware = async (req, res, next) => {
  // Étape 1 : Vérification et validation de session existante
  if (req.session && req.session.user) {
    const isValidSession = await validateSessionUser(req.session.user);

    if (isValidSession) {
      // Session valide, utilisateur authentifié
      req.user = req.session.user;
      return next();
    } else {
      // Session corrompue, tentative de synchronisation avec la base de données
      logger.warn("Session corrompue détectée dans authMiddleware", {
        userName: req.session.user.userName,
      });

      const syncedUser = await syncSessionWithDatabase(req.session.user);
      if (syncedUser) {
        // Synchronisation réussie, mise à jour de la session
        req.session.user = syncedUser;
        req.user = syncedUser;
        logger.info("Session synchronisée avec succès", {
          userName: syncedUser.userName,
        });
        return next();
      } else {
        // Impossible de synchroniser, nettoyage de la session
        logger.warn("Impossible de synchroniser la session, nettoyage");
        cleanupCorruptedSession(req, res);
        // Continuer sans req.user (utilisateur non authentifié)
      }
    }
  }

  // Étape 2 : Vérification du token "remember me" si pas de session valide
  const rememberToken = req.cookies.remember_token;
  if (rememberToken) {
    try {
      const userData = await verifyRememberToken(rememberToken, req);

      if (userData) {
        // Token valide, création/restauration de la session
        req.session.user = {
          userName: userData.userName,
          displayName: userData.displayName,
          hasIcal: !!userData.icalLink,
          isAdmin: !!userData.isAdmin,
          group: userData.group,
        };

        req.user = req.session.user;
        logger.info(
          `Session restaurée via remember token pour ${userData.userName}`
        );
        return next();
      } else {
        // Token invalide, nettoyage du cookie
        res.clearCookie("remember_token");
        logger.info("Remember token invalide, cookie nettoyé");
      }
    } catch (error) {
      logger.error("Erreur lors de la vérification du remember token:", error);
      res.clearCookie("remember_token");
    }
  }

  // Aucune authentification trouvée, continuer sans req.user
  next();
};

/**
 * Middleware pour vérifier l'authentification obligatoire
 *
 * Contrairement à authMiddleware qui permet de continuer même si non authentifié,
 * ce middleware retourne une erreur 401 si l'utilisateur n'est pas authentifié.
 * Utilisé pour protéger les routes qui nécessitent une authentification.
 *
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
export const isAuthenticated = async (req, res, next) => {
  if (req.session && req.session.user) {
    // Validation de la session avant acceptation
    const isValidSession = await validateSessionUser(req.session.user);

    if (isValidSession) {
      req.user = req.session.user;
      return next();
    } else {
      // Session corrompue, nettoyage
      logger.warn("Session corrompue dans isAuthenticated", {
        userName: req.session.user.userName,
      });
      cleanupCorruptedSession(req, res);
    }
  }

  // Utilisateur non authentifié, retour d'erreur
  return res.status(401).json({
    success: false,
    message: "Non authentifié",
  });
};
