import axios from "axios";
import express from "express";
import jwt from "jsonwebtoken";
import { syncUserWithSupabase } from "../services/userService.js";

const router = express.Router();

const CAS_URL = process.env.CAS_URL;
const SERVICE_URL = process.env.SERVICE_URL;
const FRONT_URL = process.env.FRONT_URL;

router.get("/login", (req, res) => {
  const loginUrl = `${CAS_URL}/login?service=${encodeURIComponent(
    SERVICE_URL + "/api/cas/callback"
  )}`;
  res.redirect(loginUrl);
});

router.get("/callback", async (req, res) => {
  const ticket = req.query.ticket;
  if (!ticket) {
    console.warn("[CAS Service] Ticket CAS manquant dans la requête");
    return res.status(400).send("Erreur : ticket CAS manquant.");
  }

  try {
    const validateUrl = `${CAS_URL}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(
      SERVICE_URL + "/api/cas/callback"
    )}`;
    const { data } = await axios.get(validateUrl);

    // Utilisation de RegExp pour extraire les informations
    const userName = data.match(/<cas:user>(.*?)<\/cas:user>/)?.[1];
    const displayName = data.match(
      /<cas:displayName>(.*?)<\/cas:displayName>/
    )?.[1];

    if (!userName) {
      console.error(
        "[CAS Service] Nom d'utilisateur non trouvé dans la réponse CAS"
      );
      console.error("[CAS Service] Réponse CAS complète:", data); // Ajout du log de la réponse complète
      console.error("[CAS Service] URL de validation CAS:", validateUrl); // Ajout du log de l'URL de validation
      return res.status(401).send("Échec de l'authentification CAS.");
    }

    // Sync avec Supabase et récupère l'id uuid
    const userId = await syncUserWithSupabase(userName);

    // Générer un JWT pour l'app (session) et un JWT compatible Supabase
    const payload = {
      user: { id: userId, userName, displayName },
      sub: userId, // identifiant unique (uuid)
      role: "authenticated",
      aud: "authenticated",
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "14d",
    });

    // Ajouter un cookie sécurisé
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 jours
    });

    // Optionnel : stocker aussi le token dans un cookie accessible JS pour le frontend
    res.cookie("sb-access-token", token, {
      httpOnly: false,
      secure: true,
      sameSite: "Strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    res.redirect(FRONT_URL); // Redirige vers la page d'accueil
  } catch (err) {
    console.error("[CAS Service] Erreur lors de la validation CAS:", err);
    res.status(500).send("Erreur lors de la validation CAS.");
  }
});

export default router;
