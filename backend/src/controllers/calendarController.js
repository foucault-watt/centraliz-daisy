import axios from "axios";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";

/**
 * Récupère les données iCalendar pour l'utilisateur authentifié.
 * Le lien iCal est récupéré depuis la base de données, puis le contenu du fichier
 * iCal est téléchargé et renvoyé au client.
 */
export const getHpData = async (req, res) => {
  // req.user est défini par authMiddleware
  if (!req.user || !req.user.userName) {
    return res
      .status(401)
      .json({
        error: "Authentification requise ou nom d'utilisateur manquant.",
      });
  }
  const { userName } = req.user;

  try {
    // 1. Récupérer le lien iCal de l'utilisateur depuis Supabase
    const { data: userData, error: dbError } = await supabase
      .from("users")
      .select("icalLink")
      .eq("userName", userName)
      .single();

    if (dbError) {
      logger.error(
        `Erreur Supabase lors de la récupération de icalLink pour ${userName}:`,
        dbError
      );
      return res
        .status(500)
        .json({
          error:
            "Erreur interne du serveur lors de la récupération des informations utilisateur.",
        });
    }

    if (!userData || !userData.icalLink) {
      logger.warn(`Aucun lien iCal trouvé pour l'utilisateur ${userName}.`);
      return res
        .status(404)
        .json({
          error: "Aucun lien iCalendar n'est configuré pour cet utilisateur.",
        });
    }

    const { icalLink } = userData;

    // 2. Télécharger le contenu du fichier iCalendar avec axios
    logger.info(
      `Tentative de téléchargement du iCal depuis: ${icalLink} pour ${userName}`
    );
    const icalResponse = await axios.get(icalLink, {
      responseType: "text", // S'assurer que la réponse est traitée comme du texte
    });

    if (icalResponse.status !== 200 || !icalResponse.data) {
      logger.error(
        `Échec du téléchargement du fichier iCal depuis ${icalLink}. Statut: ${icalResponse.status}`
      );
      return res
        .status(500)
        .json({ error: "Impossible de télécharger le fichier iCalendar." });
    }

    // 3. Renvoyer le contenu brut du fichier iCalendar
    res.setHeader("Content-Type", "text/calendar");
    res.send(icalResponse.data);
    logger.info(`Données iCal envoyées avec succès pour ${userName}.`);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      logger.error(
        `Erreur Axios lors du téléchargement du iCal depuis ${icalLink} pour ${userName}:`,
        error.message
      );
      if (error.response) {
        logger.error("Réponse d'erreur Axios:", {
          status: error.response.status,
          data: error.response.data,
        });
        return res
          .status(error.response.status || 500)
          .json({
            error:
              "Erreur lors de la récupération du fichier iCalendar distant.",
          });
      }
      return res
        .status(500)
        .json({
          error: "Erreur réseau lors de la récupération du fichier iCalendar.",
        });
    }
    logger.error(`Erreur inattendue dans getHpData pour ${userName}:`, error);
    res.status(500).json({ error: "Erreur interne du serveur." });
  }
};
