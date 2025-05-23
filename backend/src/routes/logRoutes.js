// Routes pour la gestion des logs
import express from "express";
import { getLogContent, getLogFiles } from "../controllers/logController.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Appliquer les middlewares d'authentification et de vérification admin à toutes les routes
router.use(isAuthenticated);
router.use(isAdmin);

// Routes pour la gestion des logs
router.get("/files", getLogFiles);
router.get("/content/:filename", getLogContent);

export default router;
