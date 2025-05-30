/**
 * Contrôleur d'authentification CAS
 *
 * Gère le processus d'authentification via CAS (Central Authentication Service) :
 * - Vérification des sessions existantes
 * - Redirection vers CAS pour l'authentification
 * - Traitement du callback après authentification
 * - Gestion des tokens de "remember me"
 */

import axios from "axios";
import dotenv from "dotenv";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";
import { extractFromCasXml } from "../utils/parseCasResponse.js";
import {
  cleanupCorruptedSession,
  validateSessionUser,
} from "../utils/sessionValidator.js";
import { createRememberToken } from "./rememberTokenController.js";

dotenv.config();

const casBaseURL = process.env.CAS_URL;
const serviceURL = `${process.env.SERVICE_URL}/api/auth/callback`;

/**
 * Point d'entrée pour l'authentification
 *
 * Vérifie d'abord si l'utilisateur a déjà une session valide.
 * Si oui, redirige directement selon son statut (calendar/onboarding).
 * Si non, redirige vers CAS pour l'authentification.
 */
export const login = async (req, res) => {
  // Vérifier si l'utilisateur a déjà une session valide
  if (req.session && req.session.user) {
    logger.info("Session existante détectée, validation en cours", {
      userName: req.session.user.userName,
    });

    // Validation robuste de la session avec vérification en base
    const isValidSession = await validateSessionUser(req.session.user);

    if (isValidSession) {
      logger.info("Session valide, redirection basée sur le statut", {
        userName: req.session.user.userName,
        hasIcal: req.session.user.hasIcal,
      });

      // Rediriger en fonction du statut de l'utilisateur
      if (req.session.user.hasIcal) {
        return res.redirect(`${process.env.FRONT_URL}/app/calendar`);
      } else {
        return res.redirect(`${process.env.FRONT_URL}/onboarding`);
      }
    } else {
      // Session corrompue, la nettoyer et continuer vers CAS
      logger.warn(
        "Session corrompue détectée, nettoyage et redirection vers CAS"
      );
      cleanupCorruptedSession(req, res);
    }
  }

  // Stocker le paramètre remember dans la session pour le récupérer au callback
  const rememberMe = req.query.remember === "true";
  req.session.rememberMe = rememberMe;

  // Redirection vers CAS avec l'URL de service appropriée
  const loginUrl = `${casBaseURL}/login?service=${encodeURIComponent(
    serviceURL
  )}`;
  res.redirect(loginUrl);
};

/**
 * Traitement du callback après authentification CAS
 *
 * Processus :
 * 1. Validation du ticket CAS reçu
 * 2. Extraction des informations utilisateur depuis la réponse CAS
 * 3. Vérification/création de l'utilisateur en base de données
 * 4. Création de la session utilisateur
 * 5. Gestion du token "remember me" si activé
 * 6. Redirection selon le statut utilisateur
 */
export const callback = async (req, res) => {
  const { ticket } = req.query;
  if (!ticket) {
    console.error("Ticket CAS manquant dans la requête de callback");
    return res.status(400).send("Ticket manquant");
  }

  try {
    // Validation du ticket auprès du serveur CAS
    const validateUrl = `${casBaseURL}/p3/serviceValidate?service=${encodeURIComponent(
      serviceURL
    )}&ticket=${ticket}`;

    const response = await axios.get(validateUrl);

    // Vérification des erreurs d'authentification CAS
    if (response.data.includes("<cas:authenticationFailure")) {
      let casErrorCode = "INCONNU";
      let casErrorMessage = "Échec de la validation du ticket CAS.";

      // Extraction du code d'erreur CAS
      const codeMatch = response.data.match(
        /<cas:authenticationFailure\s+code="([^"]+)"/
      );
      if (codeMatch && codeMatch[1]) {
        casErrorCode = codeMatch[1];
      }

      // Extraction du message d'erreur CAS
      const messageMatch = response.data.match(
        /<cas:authenticationFailure[^>]*>([\s\S]*?)<\/cas:authenticationFailure>/
      );
      if (messageMatch && messageMatch[1]) {
        casErrorMessage = messageMatch[1].trim();
      }

      console.error("Échec de l'authentification CAS:", {
        casErrorCode,
        casErrorMessage,
      });
      return res
        .status(401)
        .send(
          `Échec de l'authentification CAS: ${casErrorMessage} (Code: ${casErrorCode})`
        );
    }

    // Extraction des informations utilisateur depuis la réponse XML de CAS
    const { userName, displayName } = extractFromCasXml(response.data);

    if (!userName) {
      console.error("Aucun userName extrait de la réponse CAS valide");
      return res
        .status(401)
        .send("Utilisateur non trouvé après validation CAS.");
    }

    let userToUse;

    // Vérification de l'existence de l'utilisateur en base de données
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("userName, displayName, icalLink, isAdmin, group")
      .eq("userName", userName)
      .maybeSingle();

    if (fetchError) {
      console.error(
        "Erreur lors de la vérification de l'utilisateur en base:",
        fetchError
      );
      return res.status(500).send("Erreur interne du serveur");
    }

    if (!existingUser) {
      // Création d'un nouvel utilisateur si inexistant
      logger.info("Création d'un nouvel utilisateur", {
        userName,
        displayName,
      });
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({ userName, displayName })
        .select("userName, displayName, icalLink, isAdmin, group")
        .single();

      if (insertError) {
        console.error(
          "Erreur lors de la création de l'utilisateur:",
          insertError
        );
        return res.status(500).send("Erreur interne du serveur");
      }
      userToUse = newUser;
    } else {
      userToUse = existingUser;
    }

    // Création de la session utilisateur avec toutes les informations nécessaires
    req.session.user = {
      userName: userToUse.userName,
      displayName: userToUse.displayName,
      hasIcal: !!userToUse.icalLink,
      isAdmin: !!userToUse.isAdmin,
      group: userToUse.group,
    };

    logger.info("Session utilisateur créée avec succès", {
      userName: userToUse.userName,
    });

    // Gestion du token "remember me" si demandé
    const rememberMe = req.session.rememberMe;
    if (rememberMe) {
      const token = await createRememberToken(userToUse.userName, req);
      if (token) {
        res.cookie("remember_token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 jours
        });
        logger.info("Token remember me créé", { userName: userToUse.userName });
      }
    }

    // Nettoyage des paramètres temporaires de la session
    delete req.session.rememberMe;
    delete req.session.deviceInfo;

    // Redirection basée sur la configuration de l'utilisateur
    if (userToUse.icalLink) {
      logger.info("Redirection vers le calendrier", {
        userName: userToUse.userName,
      });
      res.redirect(`${process.env.FRONT_URL}/app/calendar`);
    } else {
      logger.info("Redirection vers l'onboarding", {
        userName: userToUse.userName,
      });
      res.redirect(`${process.env.FRONT_URL}/onboarding`);
    }
  } catch (error) {
    console.error("Erreur inattendue lors de la validation CAS:", error);
    res.status(500).send("Erreur lors de la validation CAS");
  }
};
