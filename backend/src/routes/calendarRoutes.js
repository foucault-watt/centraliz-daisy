import express from "express";
import { getHpData } from "../controllers/calendarController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route pour récupérer les données iCalendar (HyperPlanning)
// Nécessite une authentification via authMiddleware
router.get("/hp-data", authMiddleware, getHpData);

export default router;
