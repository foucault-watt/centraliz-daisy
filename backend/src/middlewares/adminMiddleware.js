// Middleware pour vérifier si l'utilisateur est administrateur
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";

export const isAdmin = async (req, res, next) => {
  try {
    // Vérifier si l'utilisateur est connecté
    if (!req.session || !req.session.user || !req.session.user.userName) {
      return res.status(401).json({
        success: false,
        message: "Non authentifié",
      });
    }

    const { userName } = req.session.user;

    // Récupérer l'utilisateur dans la base de données
    const { data: user, error } = await supabase
      .from("users")
      .select("isAdmin")
      .eq("userName", userName)
      .single();

    if (error || !user) {
      logger.error(
        `Erreur lors de la vérification des droits d'admin pour ${userName}: ${
          error?.message || "Utilisateur non trouvé"
        }`
      );
      return res.status(401).json({
        success: false,
        message: "Non autorisé",
      });
    }

    // Vérifier si l'utilisateur est administrateur
    if (!user.isAdmin) {
      logger.warn(
        `Tentative d'accès à une ressource admin par un utilisateur non-admin: ${userName}`
      );
      return res.status(403).json({
        success: false,
        message: "Accès refusé : droits d'administrateur requis",
      });
    }

    // L'utilisateur est administrateur, on continue
    next();
  } catch (error) {
    logger.error(
      `Exception lors de la vérification des droits d'admin: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la vérification des droits d'administrateur",
    });
  }
};
