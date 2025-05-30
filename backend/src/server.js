import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import session from "express-session";
import helmet from "helmet";
import morgan from "morgan";
import adminRoutes from "./routes/adminRoutes.js"; // Ajout de l'import admin
import authRoutes from "./routes/authRoutes.js";
import calendarRoutes from "./routes/calendarRoutes.js"; // Ajout de l'import
import configRoutes from "./routes/configRoutes.js"; // Import des routes de config
import logRoutes from "./routes/logRoutes.js"; // Import des routes de logs
import notesRoutes from "./routes/notesRoutes.js"; // Import des routes de notes
import sessionRoutes from "./routes/sessionRoutes.js"; // Import des routes de sessions
import userRoutes from "./routes/userRoutes.js";
import logger from "./utils/logger.js";

dotenv.config();
const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(cookieParser());

// Middleware de timeout pour éviter les requêtes qui traînent
app.use((req, res, next) => {
  req.setTimeout(30000); // 30 secondes
  res.setTimeout(30000);
  next();
});

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      httpOnly: true,
      secure: false, // true en prod avec HTTPS
      sameSite: "lax",
    },
  })
);

app.use("/api/auth", authRoutes);
app.use("/api", userRoutes); // userRoutes gère déjà /api/calendar pour le lien
app.use("/api/events", calendarRoutes); // Nouvelles routes pour les données d'événements
app.use("/api/config", configRoutes); // Routes pour la configuration
app.use("/api/admin", adminRoutes); // Routes d'administration
app.use("/api/admin/logs", logRoutes); // Routes pour les logs
app.use("/api/notes", notesRoutes); // Routes pour les notes
app.use("/api/sessions", sessionRoutes); // Routes pour la gestion des sessions

// Gestionnaire d'erreur global
app.use((err, req, res, next) => {
  console.error("🚨 [Server] Erreur non gérée:", err);
  logger.error("Erreur non gérée dans l'application", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    message: "Erreur interne du serveur",
    error:
      process.env.NODE_ENV === "development" ? err.message : "Erreur interne",
  });
});

// Route de test pour crash du serveur (à utiliser avec précaution)
app.use(`/api/${process.env.SECRET_API}/crash`, async (req, res) => {
  res.send("CRASH");
  process.exit(1);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`✅ Serveur en ligne : http://localhost:${PORT}`);
});
