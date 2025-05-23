// Contrôleur pour les fonctionnalités d'administration
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";

// Récupérer tous les utilisateurs (admin uniquement)
export const getAllUsers = async (req, res) => {
  try {
    // Récupérer tous les utilisateurs de la base de données
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(
        `Erreur lors de la récupération des utilisateurs: ${error.message}`
      );
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la récupération des utilisateurs",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    logger.error(
      `Exception lors de la récupération des utilisateurs: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des utilisateurs",
      error: error.message,
    });
  }
};

// Mettre à jour un utilisateur (admin uniquement)
export const updateUser = async (req, res) => {
  const { userName } = req.params;
  const { displayName, group, isAdmin } = req.body;

  try {
    // Mettre à jour l'utilisateur
    const { data, error } = await supabase
      .from("users")
      .update({
        displayName,
        group,
        isAdmin,
      })
      .eq("userName", userName);

    if (error) {
      logger.error(
        `Erreur lors de la mise à jour de l'utilisateur ${userName}: ${error.message}`
      );
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la mise à jour de l'utilisateur",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Utilisateur mis à jour avec succès",
    });
  } catch (error) {
    logger.error(
      `Exception lors de la mise à jour de l'utilisateur ${userName}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la mise à jour de l'utilisateur",
      error: error.message,
    });
  }
};

// Supprimer un utilisateur (admin uniquement)
export const deleteUser = async (req, res) => {
  const { userName } = req.params;

  try {
    // Supprimer l'utilisateur
    const { data, error } = await supabase
      .from("users")
      .delete()
      .eq("userName", userName);

    if (error) {
      logger.error(
        `Erreur lors de la suppression de l'utilisateur ${userName}: ${error.message}`
      );
      return res.status(500).json({
        success: false,
        message: "Erreur serveur lors de la suppression de l'utilisateur",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    logger.error(
      `Exception lors de la suppression de l'utilisateur ${userName}: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la suppression de l'utilisateur",
      error: error.message,
    });
  }
};

// Configuration des Coefficients
const COEFFICIENTS_CONFIG_KEY = "coefficients";

// Récupérer la configuration des coefficients
export const getCoefficientsConfig = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", COEFFICIENTS_CONFIG_KEY)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error(
        `Erreur lors de la récupération de la configuration des coefficients: ${error.message}`
      );
      return res.status(500).json({
        success: false,
        message:
          "Erreur serveur lors de la récupération de la configuration des coefficients",
        error: error.message,
      });
    }

    if (!data) {
      // Aucune configuration trouvée, retourner un objet vide ou une structure par défaut
      return res.status(200).json({
        success: true,
        config: {}, // Ou une structure JSON par défaut si vous préférez
      });
    }

    return res.status(200).json({
      success: true,
      config: data.config_value,
    });
  } catch (error) {
    logger.error(
      `Exception lors de la récupération de la configuration des coefficients: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la récupération de la configuration des coefficients",
      error: error.message,
    });
  }
};

// Mettre à jour la configuration des coefficients
export const updateCoefficientsConfig = async (req, res) => {
  const { config } = req.body; // Le JSON brut des coefficients

  if (typeof config !== "object" || config === null) {
    return res.status(400).json({
      success: false,
      message: "Le corps de la requête doit contenir un objet 'config' valide.",
    });
  }

  try {
    const { data, error } = await supabase
      .from("app_configurations")
      .upsert(
        { config_key: COEFFICIENTS_CONFIG_KEY, config_value: config },
        { onConflict: "config_key" }
      )
      .select()
      .single();

    if (error) {
      logger.error(
        `Erreur lors de la mise à jour de la configuration des coefficients: ${error.message}`
      );
      return res.status(500).json({
        success: false,
        message:
          "Erreur serveur lors de la mise à jour de la configuration des coefficients",
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Configuration des coefficients mise à jour avec succès",
      config: data.config_value,
    });
  } catch (error) {
    logger.error(
      `Exception lors de la mise à jour de la configuration des coefficients: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message:
        "Erreur serveur lors de la mise à jour de la configuration des coefficients",
      error: error.message,
    });
  }
};
