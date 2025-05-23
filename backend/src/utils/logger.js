import { DateTime } from "luxon";
import winston from "winston";
import "winston-daily-rotate-file";

// Format personnalisé pour l'horodatage (heure de Paris)
const timestampFormat = {
  format: () => {
    return DateTime.now()
      .setZone("Europe/Paris")
      .toFormat("yyyy-MM-dd HH:mm:ss");
  },
};

// Créer un transport pour la rotation des logs
const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  filename: "logs/%DATE%.log", // Fichier de log, '%DATE%' sera remplacé par la date
  datePattern: "YYYY-MM-DD", // Format de date dans le nom du fichier
  maxSize: "20m", // Taille maximale du fichier log avant la rotation (ici 20MB)
  maxFiles: "14d", // Conserver les fichiers de log pour les 14 derniers jours
  zippedArchive: true, // Archiver les fichiers de log après rotation
});

// Créer un transport de console pour afficher les logs dans la console
const consoleTransport = new winston.transports.Console({
  format: winston.format.simple(),
  level: "debug", // Log tous les niveaux (debug, info, warn, error)
});

// Créer une instance de logger
const logger = winston.createLogger({
  level: "info", // Niveau de log par défaut
  format: winston.format.combine(
    winston.format.colorize(), // Colorisation pour la console
    winston.format.timestamp(timestampFormat), // Utiliser notre format d'horodatage personnalisé
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} | ${level} | ${message}`
    )
  ),
  transports: [
    dailyRotateFileTransport, // Transport pour fichier avec rotation
    consoleTransport, // Transport pour la console
  ],
});

// Exporter le logger
export default logger;
