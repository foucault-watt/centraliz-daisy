import axios from "axios";
import supabase from "../config/supabase.js";

export const getMe = (req, res) => {
  const { userName, displayName } = req.user || {};
  res.json({ user: { userName, displayName } });
};

export const getIcalLink = async (req, res) => {
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
