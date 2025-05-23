import axios from "axios";
import dotenv from "dotenv";
import supabase from "../config/supabase.js";
import { extractFromCasXml } from "../utils/parseCasResponse.js";
dotenv.config();

const casBaseURL = process.env.CAS_URL;
const serviceURL = `${process.env.SERVICE_URL}/api/auth/callback`;

export const login = (req, res) => {
  const loginUrl = `${casBaseURL}/login?service=${encodeURIComponent(
    serviceURL
  )}`;
  res.redirect(loginUrl);
};

export const callback = async (req, res) => {
  const { ticket } = req.query;
  if (!ticket) {
    console.error("Ticket manquant dans la requête.");
    return res.status(400).send("Ticket manquant");
  }

  try {
    const validateUrl = `${casBaseURL}/p3/serviceValidate?service=${encodeURIComponent(
      serviceURL
    )}&ticket=${ticket}`;
    console.log("Validation CAS URL :", validateUrl);

    const response = await axios.get(validateUrl);
    console.log("Réponse CAS :", response.data);

    if (response.data.includes("<cas:authenticationFailure")) {
      let casErrorCode = "INCONNU";
      let casErrorMessage = "Échec de la validation du ticket CAS.";

      const codeMatch = response.data.match(
        /<cas:authenticationFailure\s+code="([^"]+)"/
      );
      if (codeMatch && codeMatch[1]) {
        casErrorCode = codeMatch[1];
      }

      const messageMatch = response.data.match(
        /<cas:authenticationFailure[^>]*>([\s\S]*?)<\/cas:authenticationFailure>/
      );
      if (messageMatch && messageMatch[1]) {
        casErrorMessage = messageMatch[1].trim();
      }

      console.error(
        "Échec de l'authentification CAS. Code:",
        casErrorCode,
        "Message:",
        casErrorMessage
      );
      return res
        .status(401)
        .send(
          `Échec de l'authentification CAS: ${casErrorMessage} (Code: ${casErrorCode})`
        );
    }

    const { userName, displayName } = extractFromCasXml(response.data);
    console.log("Utilisateur extrait :", { userName, displayName });

    if (!userName) {
      console.error(
        "CAS validation returned no userName, despite no explicit authenticationFailure tag."
      );
      return res
        .status(401)
        .send("Utilisateur non trouvé après validation CAS.");
    }

    let userToUse; // Vérification et insertion dans la table users
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("userName, displayName, icalLink, isAdmin, group") // Ajouter group ici
      .eq("userName", userName)
      .maybeSingle();

    if (fetchError) {
      console.error(
        "Erreur lors de la vérification de l'utilisateur dans Supabase :",
        fetchError
      );
      return res.status(500).send("Erreur interne du serveur");
    }

    if (!existingUser) {
      console.log("Utilisateur non trouvé, insertion dans la table users.");
      const { data: newUser, error: insertError } = await supabase
        .from("users")
        .insert({ userName, displayName }) // icalLink, isAdmin et group seront null/default par défaut
        .select("userName, displayName, icalLink, isAdmin, group") // Ajouter group ici
        .single();

      if (insertError) {
        console.error(
          "Erreur lors de l'insertion de l'utilisateur dans Supabase :",
          insertError
        );
        return res.status(500).send("Erreur interne du serveur");
      }
      userToUse = newUser;
    } else {
      console.log("Utilisateur déjà existant :", existingUser);
      userToUse = existingUser;
    }
    req.session.user = {
      userName: userToUse.userName,
      displayName: userToUse.displayName,
      hasIcal: !!userToUse.icalLink, // Convertir en booléen
      isAdmin: !!userToUse.isAdmin, // Ajouter isAdmin et convertir en booléen
      group: userToUse.group, // Ajouter le group ici
    };
    console.log("Session utilisateur créée :", req.session.user);

    // Redirection basée sur la présence du lien iCal
    if (userToUse.icalLink) {
      console.log("Utilisateur a un iCalLink, redirection vers /app/calendar");
      res.redirect(`${process.env.FRONT_URL}/app/calendar`);
    } else {
      console.log(
        "Utilisateur n'a pas d'iCalLink, redirection vers /onboarding"
      );
      res.redirect(`${process.env.FRONT_URL}/onboarding`);
    }
  } catch (e) {
    console.error("Erreur inattendue lors de la validation CAS :", e);
    res.status(500).send("Erreur lors de la validation CAS");
  }
};
