// Routes pour les fonctionnalités d'administration
import express from "express";
import {
  deleteUser,
  getAllUsers,
  getCoefficientsConfig,
  updateCoefficientsConfig,
  updateUser,
} from "../controllers/adminController.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Appliquer les middlewares d'authentification et de vérification admin à toutes les routes
router.use(isAuthenticated);
router.use(isAdmin);

// Routes pour la gestion des utilisateurs
router.get("/users", getAllUsers);
router.put("/users/:userName", updateUser);
router.delete("/users/:userName", deleteUser);

// Routes pour la gestion de la configuration des coefficients
router.get("/coefficients", getCoefficientsConfig);
router.put("/coefficients", updateCoefficientsConfig);

export default router;
