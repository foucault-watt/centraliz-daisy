import { verifyRememberToken } from "../controllers/rememberTokenController.js";
import logger from "../utils/logger.js";

export const authMiddleware = async (req, res, next) => {
  // Si une session existe déjà, l'utiliser
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Pas de session, vérifier le remember token
  const rememberToken = req.cookies.remember_token;
  if (rememberToken) {
    try {
      const userData = await verifyRememberToken(rememberToken, req);

      if (userData) {
        // Token valide, créer la session
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
        // Token invalide, nettoyer le cookie
        res.clearCookie("remember_token");
        logger.info("Remember token invalide, cookie nettoyé");
      }
    } catch (error) {
      logger.error("Erreur lors de la vérification du remember token:", error);
      res.clearCookie("remember_token");
    }
  }

  // Aucune authentification trouvée, req.user reste undefined
  next();
};

// Middleware pour vérifier si l'utilisateur est authentifié
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
    next();
  } else {
    return res.status(401).json({
      success: false,
      message: "Non authentifié",
    });
  }
};
