import { verifyRememberToken } from "../controllers/rememberTokenController.js";
import logger from "../utils/logger.js";

// Middleware pour vérifier le remember token
export const checkRememberToken = async (req, res, next) => {
  try {
    const rememberToken = req.cookies.remember_token;

    if (!rememberToken) {
      return next(); // Pas de remember token, continuer normalement
    } // Vérifier le token
    const userData = await verifyRememberToken(rememberToken, req);

    if (!userData) {
      // Token invalide ou expiré, nettoyer le cookie
      res.clearCookie("remember_token");
      logger.info("Remember token invalide, cookie nettoyé");
      return next();
    }

    // Token valide, créer la session
    req.session.user = {
      userName: userData.userName,
      displayName: userData.displayName,
      hasIcal: !!userData.icalLink,
      isAdmin: !!userData.isAdmin,
      group: userData.group,
    };

    logger.info(
      `Session restaurée via remember token pour ${userData.userName}`
    );
    req.rememberTokenUsed = true; // Flag pour indiquer qu'un remember token a été utilisé

    next();
  } catch (error) {
    logger.error("Erreur lors de la vérification du remember token:", error);
    // En cas d'erreur, nettoyer le cookie et continuer
    res.clearCookie("remember_token");
    next();
  }
};

// Middleware pour nettoyer les cookies en cas de problème
export const cleanupCookies = (req, res, next) => {
  // Nettoyer tous les cookies potentiellement problématiques
  res.clearCookie("connect.sid");
  res.clearCookie("remember_token");

  logger.info("Cookies nettoyés");
  next();
};
