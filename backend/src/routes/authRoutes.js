import express from "express";
import { callback, login } from "../controllers/authController.js";

const router = express.Router();

router.get("/login", login);
router.get("/callback", callback);

// Route de déconnexion
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Erreur lors de la déconnexion :", err);
      return res.status(500).send("Impossible de se déconnecter");
    }
    res.clearCookie("connect.sid"); // Nom du cookie par défaut pour express-session
    console.log("Session détruite, utilisateur déconnecté.");
    res.status(200).send("Déconnexion réussie");
  });
});

export default router;
