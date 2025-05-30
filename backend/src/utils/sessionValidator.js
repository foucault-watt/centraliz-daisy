/**
 * Utilitaires de validation et synchronisation de session
 *
 * Fournit des fonctions pour :
 * - Valider l'intégrité des sessions utilisateur contre la base de données
 * - Nettoyer les sessions corrompues
 * - Synchroniser les données de session avec la base de données
 *
 * Ces fonctions permettent de maintenir la cohérence entre les sessions
 * en mémoire et les données utilisateur en base, notamment après des
 * modifications de profil ou des problèmes de synchronisation.
 */

import supabase from "../config/supabase.js";
import logger from "./logger.js";

/**
 * Valide une session utilisateur contre la base de données
 *
 * Vérifie que :
 * - L'utilisateur existe toujours en base
 * - Les données de session correspondent aux données en base
 * - Les propriétés essentielles sont présentes
 *
 * @param {Object} sessionUser - Données utilisateur de la session
 * @returns {boolean} - true si la session est valide, false sinon
 */
export const validateSessionUser = async (sessionUser) => {
  // Vérifier que les propriétés essentielles existent
  if (!sessionUser || !sessionUser.userName || !sessionUser.displayName) {
    logger.warn("Session utilisateur incomplète : propriétés manquantes", {
      hasUserName: !!sessionUser?.userName,
      hasDisplayName: !!sessionUser?.displayName,
    });
    return false;
  }

  try {
    // Vérifier que l'utilisateur existe toujours en base de données
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("userName, displayName, icalLink, isAdmin, group")
      .eq("userName", sessionUser.userName)
      .maybeSingle();

    if (error) {
      logger.error("Erreur lors de la validation de session en BDD", error);
      return false;
    }

    if (!dbUser) {
      logger.warn("Utilisateur de session non trouvé en BDD", {
        userName: sessionUser.userName,
      });
      return false;
    }

    // Vérifier que les données de session correspondent à la BDD
    const expectedHasIcal = !!dbUser.icalLink;
    const expectedIsAdmin = !!dbUser.isAdmin;

    if (
      sessionUser.hasIcal !== expectedHasIcal ||
      sessionUser.isAdmin !== expectedIsAdmin ||
      sessionUser.displayName !== dbUser.displayName ||
      sessionUser.group !== dbUser.group
    ) {
      logger.warn("Données de session obsolètes", {
        userName: sessionUser.userName,
        sessionHasIcal: sessionUser.hasIcal,
        dbHasIcal: expectedHasIcal,
        sessionIsAdmin: sessionUser.isAdmin,
        dbIsAdmin: expectedIsAdmin,
      });
      return false;
    }

    logger.debug("Session utilisateur validée avec succès", {
      userName: sessionUser.userName,
    });
    return true;
  } catch (error) {
    logger.error("Erreur inattendue lors de la validation de session", error);
    return false;
  }
};

// Fonction pour nettoyer une session corrompue
export const cleanupCorruptedSession = (req, res) => {
  logger.info("Nettoyage de session corrompue");
  req.session.destroy((err) => {
    if (err) {
      logger.error("Erreur lors de la destruction de session", err);
    }
  });
  res.clearCookie("connect.sid");
  res.clearCookie("remember_token");
};

// Fonction pour synchroniser les données de session avec la BDD
export const syncSessionWithDatabase = async (sessionUser) => {
  try {
    const { data: dbUser, error } = await supabase
      .from("users")
      .select("userName, displayName, icalLink, isAdmin, group")
      .eq("userName", sessionUser.userName)
      .single();

    if (error || !dbUser) {
      return null;
    }

    return {
      userName: dbUser.userName,
      displayName: dbUser.displayName,
      hasIcal: !!dbUser.icalLink,
      isAdmin: !!dbUser.isAdmin,
      group: dbUser.group,
    };
  } catch (error) {
    logger.error("Erreur lors de la synchronisation session/BDD", error);
    return null;
  }
};
