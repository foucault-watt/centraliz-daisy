import express from "express";
import { callback, login } from "../controllers/authController.js";
import {
  checkRememberToken,
  cleanupCookies,
} from "../middlewares/rememberTokenMiddleware.js";

const router = express.Router();

router.get("/login", checkRememberToken, login);
router.get("/callback", callback);

// Route pour recevoir les informations de l'appareil
router.post("/device-info", (req, res) => {
  // Stocker les informations de l'appareil dans la session pour les utiliser lors du callback
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

  res
    .status(200)
    .json({
      success: true,
      message: "Informations de l'appareil enregistrées",
    });
});

// Route de nettoyage des cookies
router.post("/cleanup-cookies", cleanupCookies, (req, res) => {
  res.status(200).json({ success: true, message: "Cookies nettoyés" });
});

// Route de déconnexion
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion :", err);
      return res.status(500).send("Impossible de se déconnecter");
    }
    res.clearCookie("connect.sid"); // Nom du cookie par défaut pour express-session
    res.clearCookie("remember_token"); // Nettoyer aussi le remember token
    console.log("Session détruite, utilisateur déconnecté.");
    res.status(200).send("Déconnexion réussie");
  });
});

export default router;
