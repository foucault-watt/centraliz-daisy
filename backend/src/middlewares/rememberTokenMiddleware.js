/**
 * Middleware pour la gestion des tokens "remember me"
 *
 * Vérifie et traite les tokens de connexion persistante stockés dans les cookies.
 * Utilisé pour maintenir une session utilisateur entre les visites du navigateur.
 */

import { verifyRememberToken } from "../controllers/rememberTokenController.js";
import logger from "../utils/logger.js";

/**
 * Middleware pour vérifier et traiter les tokens "remember me"
 *
 * Processus :
 * 1. Vérification de la présence du token dans les cookies
 * 2. Validation du token auprès de la base de données
 * 3. Création de session si token valide
 * 4. Nettoyage du cookie si token invalide
 *
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
export const checkRememberToken = async (req, res, next) => {
  try {
    const rememberToken = req.cookies.remember_token;

    if (!rememberToken) {
      return next(); // Pas de remember token, continuer normalement
    }

    // Vérification du token auprès de la base de données
    const userData = await verifyRememberToken(rememberToken, req);

    if (!userData) {
      // Token invalide ou expiré, nettoyage du cookie
      res.clearCookie("remember_token");
      logger.info("Remember token invalide, cookie nettoyé");
      return next();
    }

    // Token valide, création/restauration de la session utilisateur
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

/**
 * Middleware pour nettoyer les cookies en cas de problème
 *
 * Supprime tous les cookies potentiellement problématiques :
 * - connect.sid (session Express)
 * - remember_token (token de connexion persistante)
 *
 * Utilisé généralement lors de la déconnexion ou en cas d'erreur de session.
 *
 * @param {Object} req - Requête Express
 * @param {Object} res - Réponse Express
 * @param {Function} next - Fonction next d'Express
 */
export const cleanupCookies = (req, res, next) => {
  // Nettoyage de tous les cookies potentiellement problématiques
  res.clearCookie("connect.sid");
  res.clearCookie("remember_token");

  logger.info("Cookies nettoyés");
  next();
};
