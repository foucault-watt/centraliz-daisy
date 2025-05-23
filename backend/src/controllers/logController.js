// Contrôleur pour la gestion des logs
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import logger from "../utils/logger.js";

// Obtenir le chemin du répertoire actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const logsDirectory = path.join(__dirname, "../../logs");

// Fonction pour lister tous les fichiers de logs disponibles
export const getLogFiles = async (req, res) => {
  try {
    // Vérifier si le dossier existe
    if (!fs.existsSync(logsDirectory)) {
      return res.status(404).json({
        success: false,
        message: "Répertoire de logs introuvable",
      });
    }

    // Lire le contenu du répertoire
    const files = fs
      .readdirSync(logsDirectory)
      .filter((file) => file.endsWith(".log") || file.endsWith(".log.gz"))
      .sort()
      .reverse(); // Trier par date décroissante (plus récent en premier)

    return res.status(200).json({
      success: true,
      files,
    });
  } catch (error) {
    logger.error(
      `Erreur lors de la récupération des fichiers de logs: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la récupération des fichiers de logs",
      error: error.message,
    });
  }
};

// Fonction pour lire le contenu d'un fichier de log spécifique
export const getLogContent = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(logsDirectory, filename);

    // Vérifier si le fichier existe
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Fichier de log introuvable",
      });
    }

    // Vérifier si le fichier est compressé
    if (filename.endsWith(".gz")) {
      return res.status(400).json({
        success: false,
        message: "Les fichiers compressés ne peuvent pas être lus directement",
      });
    }

    // Lire le contenu du fichier
    const content = fs.readFileSync(filePath, "utf8");
    // Transformer le contenu en tableau de lignes pour faciliter l'affichage
    const lines = content
      .split("\n")
      .filter((line) => line.trim() !== "")
      .map((line) => {
        try {
          // Nouveau format: "2025-05-22 22:25:57 | info | Message"
          const timestampRegex = /^(.*?)\s+\|\s+(.*?)\s+\|\s+(.*)$/;
          const match = line.match(timestampRegex);

          if (match && match.length === 4) {
            return {
              timestamp: match[1],
              level: match[2],
              message: match[3],
            };
          }
          return { message: line }; // Fallback si le format ne correspond pas
        } catch (e) {
          return { message: line }; // Fallback en cas d'erreur
        }
      });

    return res.status(200).json({
      success: true,
      filename,
      lines,
    });
  } catch (error) {
    logger.error(
      `Erreur lors de la lecture du fichier de log: ${error.message}`
    );
    return res.status(500).json({
      success: false,
      message: "Erreur serveur lors de la lecture du fichier de log",
      error: error.message,
    });
  }
};
