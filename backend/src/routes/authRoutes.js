/**
 * Routes d'authentification
 *
 * Gère toutes les routes liées à l'authentification :
 * - Login et callback CAS
 * - Préparation de session pour le login
 * - Réception des informations d'appareil
 * - Déconnexion et nettoyage des sessions
 */

import express from "express";
import { callback, login } from "../controllers/authController.js";
import {
  checkRememberToken,
  cleanupCookies,
} from "../middlewares/rememberTokenMiddleware.js";

const router = express.Router();

// Route principale de login avec vérification préalable des remember tokens
router.get("/login", checkRememberToken, login);

// Route de callback après authentification CAS
router.get("/callback", callback);

/**
 * Route pour préparer le login
 * Stocke le paramètre "remember me" dans la session avant redirection vers CAS
 */
router.post("/prepare-login", (req, res) => {
  const rememberMe = req.body.remember === true;
  req.session.rememberMe = rememberMe;

  res.status(200).json({
    success: true,
    message: "Paramètre remember stocké",
    rememberMe: rememberMe,
  });
});

/**
 * Route pour recevoir les informations de l'appareil
 * Stocke les métadonnées de l'appareil client pour identification et logs
 */
router.post("/device-info", (req, res) => {
  // Stockage des informations de l'appareil dans la session
  req.session.deviceInfo = {
    frontend: req.body.deviceInfo,
    headers: {
      "user-agent": req.headers["user-agent"],
      "x-forwarded-for": req.headers["x-forwarded-for"],
      "x-real-ip": req.headers["x-real-ip"],
      ...req.body.deviceInfo,
    },
    ip: req.ip || req.connection.remoteAddress,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json({
    success: true,
    message: "Informations de l'appareil enregistrées",
  });
});

/**
 * Route de nettoyage des cookies
 * Supprime tous les cookies potentiellement problématiques
 */
router.post("/cleanup-cookies", cleanupCookies, (req, res) => {
  res.status(200).json({ success: true, message: "Cookies nettoyés" });
});

/**
 * Route de déconnexion
 * Détruit la session utilisateur et nettoie tous les cookies associés
 */
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion:", err);
      return res.status(500).send("Impossible de se déconnecter");
    }

    // Nettoyage de tous les cookies liés à l'authentification
    res.clearCookie("connect.sid"); // Cookie de session Express
    res.clearCookie("remember_token"); // Token de connexion persistante

    res.status(200).send("Déconnexion réussie");
  });
});

export default router;
