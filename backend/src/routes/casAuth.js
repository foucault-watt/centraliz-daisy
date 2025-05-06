import express from "express";
import axios from "axios";
import xml2js from "xml2js";
import jwt from "jsonwebtoken";
import { syncUserWithSupabase } from "../services/userService.js";

const router = express.Router();

const CAS_URL = process.env.CAS_URL;
const SERVICE_URL = process.env.SERVICE_URL;

router.get("/login", (req, res) => {
  const redirectURL = `${CAS_URL}/login?service=${encodeURIComponent(
    SERVICE_URL + "/api/cas/callback"
  )}`;
  res.redirect(redirectURL);
});

router.get("/callback", async (req, res) => {
  const ticket = req.query.ticket;
  if (!ticket) return res.status(400).send("Ticket CAS manquant.");

  try {
    const validationURL = `${CAS_URL}/serviceValidate?ticket=${ticket}&service=${encodeURIComponent(
      SERVICE_URL
    )}`;
    const { data } = await axios.get(validationURL);
    const result = await xml2js.parseStringPromise(data);

    const user =
      result["cas:serviceResponse"]["cas:authenticationSuccess"]?.[0][
        "cas:user"
      ]?.[0];
    if (!user) return res.status(403).send("Échec d'authentification CAS.");

    // Sync avec Supabase
    await syncUserWithSupabase(user);

    // JWT
    const token = jwt.sign({ user }, process.env.JWT_SECRET, {
      expiresIn: "14d",
    });

    // Cookie sécurisé
    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      maxAge: 14 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/");
  } catch (err) {
    console.error(err);
    res.status(500).send("Erreur interne CAS.");
  }
});

export default router;
