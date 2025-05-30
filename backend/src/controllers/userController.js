import axios from "axios";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";
import {
  syncSessionWithDatabase,
  validateSessionUser,
} from "../utils/sessionValidator.js";

export const getMe = async (req, res) => {
  if (!req.user) {
    // Si req.user n'est pas défini par le middleware, l'utilisateur n'est pas authentifié.
    return res.json({ user: null }); // Renvoyer null pour l'utilisateur
  }

  // Validation supplémentaire de la session pour /api/me
  // Car cette route est critique pour l'état d'authentification côté frontend
  const isValidSession = await validateSessionUser(req.user);

  if (!isValidSession) {
    logger.warn(
      "Session invalide détectée dans getMe, tentative de synchronisation",
      {
        userName: req.user.userName,
      }
    );

    // Essayer de synchroniser avec la BDD
    const syncedUser = await syncSessionWithDatabase(req.user);
    if (syncedUser) {
      // Mise à jour de la session avec les données synchronisées
      req.session.user = syncedUser;
      req.user = syncedUser;
      logger.info("Session synchronisée dans getMe", {
        userName: syncedUser.userName,
      });
    } else {
      // Impossible de synchroniser, utilisateur non authentifié
      logger.warn(
        "Impossible de synchroniser dans getMe, utilisateur non authentifié"
      );
      return res.json({ user: null });
    }
  }

  const { userName, displayName, hasIcal, isAdmin, group } = req.user;
  res.json({ user: { userName, displayName, hasIcal, isAdmin, group } });
};

export const getIcalLink = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  const { userName } = req.user;

  try {
    const { data, error } = await supabase
      .from("users")
      .select("icalLink")
      .eq("userName", userName)
      .single();

    if (error) {
      console.error("Erreur lors de la récupération du icalLink :", error);
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }

    res.json({ icalLink: data?.icalLink || null });
  } catch (err) {
    console.error("Erreur inattendue :", err);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};

export const uploadIcalLink = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }
  const { userName } = req.user;
  const { icalLink } = req.body;

  try {
    // Vérification du lien iCal
    const response = await axios.get(icalLink);
    const data = response.data;

    if (
      typeof data === "string" &&
      data.includes("BEGIN:VCALENDAR") &&
      data.includes("BEGIN:VEVENT")
    ) {
      // Si le lien est valide, on l'enregistre dans la base de données
      const { error } = await supabase
        .from("users")
        .update({ icalLink })
        .eq("userName", userName);

      if (error) {
        console.error("Erreur lors de l'upload du icalLink :", error);
        return res.status(500).json({ error: "Erreur interne du serveur" });
      }

      // Mettre à jour la session utilisateur
      if (req.session.user) {
        req.session.user.hasIcal = true;
      }
      // express-session sauvegarde généralement la session automatiquement à la fin de la réponse.
      // Si vous rencontrez des problèmes, vous pouvez forcer la sauvegarde :
      // req.session.save(err => {
      //   if (err) {
      //     console.error("Erreur lors de la sauvegarde de la session :", err);
      //     return res.status(500).json({ error: "Erreur interne du serveur lors de la sauvegarde de la session" });
      //   }
      //   res.status(200).json({ message: "icalLink mis à jour avec succès" });
      // });
      res.status(200).json({ message: "icalLink mis à jour avec succès" });
    } else {
      // Si le lien n'est pas valide
      console.warn(
        `Le contenu du lien fourni n'est pas un fichier iCal valide pour l'utilisateur ${userName}: ${icalLink}`
      );
      res.status(400).json({
        error:
          "Ce n'est pas un lien iCal valide 😖. Assurez-vous que le lien contient un calendrier au format iCal.",
      });
    }
  } catch (err) {
    if (err.response) {
      console.warn(
        `Erreur HTTP lors de la vérification du lien iCal pour l'utilisateur ${userName}: ${icalLink}`,
        `Statut: ${err.response.status}, Message: ${err.response.statusText}`
      );
      res.status(400).json({
        error:
          "Impossible de vérifier le lien iCal. Vérifiez que le lien est accessible et valide.",
      });
    } else {
      console.error(
        `Erreur inattendue lors de la vérification du lien iCal pour l'utilisateur ${userName}: ${icalLink}`,
        err
      );
      res.status(500).json({
        error:
          "Ce n'est pas un lien iCal valide 😖. Assurez-vous que le lien est correct.",
      });
    }
  }
};
