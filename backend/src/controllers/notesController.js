import fs from "fs";
import { downloadCSV } from "../services/notesDownloadService.js";
import logger from "../utils/logger.js";

export const downloadAndProcessNotes = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  const { password } = req.body;
  const { userName } = req.user;

  if (!password) {
    return res.status(400).json({ error: "Mot de passe requis" });
  }
  try {
    logger.info(
      `Début du téléchargement des notes pour l'utilisateur: ${userName}`
    );

    // Télécharger le CSV
    const csvFilePath = await downloadCSV(userName, password);

    // Lire le contenu du CSV directement ici
    const csvContent = fs.readFileSync(csvFilePath, "utf-8");
    logger.info(`Lecture du CSV terminée: ${csvFilePath}`);

    // Nettoyer le fichier temporaire
    if (fs.existsSync(csvFilePath)) {
      fs.unlinkSync(csvFilePath);
      logger.info(`Fichier CSV supprimé: ${csvFilePath}`);
    }

    logger.info(`Notes récupérées avec succès pour l'utilisateur: ${userName}`);

    res.json({
      success: true,
      csvContent: csvContent,
      message: "Notes récupérées avec succès",
    });
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération des notes pour ${userName}:`,
      error
    );

    // Déterminer le type d'erreur et renvoyer une réponse appropriée
    if (
      error.message.includes("timeout") ||
      error.message.includes("Timeout")
    ) {
      return res.status(408).json({
        error: "Timeout lors de la récupération des notes. Veuillez réessayer.",
      });
    }

    if (
      error.message.includes("navigation") ||
      error.message.includes("login")
    ) {
      return res.status(401).json({
        error: "Erreur de connexion. Vérifiez vos identifiants.",
      });
    }

    res.status(500).json({
      error:
        "Erreur lors de la récupération des notes. Veuillez réessayer plus tard.",
    });
  }
};
