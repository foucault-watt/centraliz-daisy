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

    // Vérification et insertion dans la table users
    const { data: existingUser, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("userName", userName)
      .maybeSingle(); // Utilisation de maybeSingle pour éviter l'erreur si aucune ligne n'est trouvée

    if (fetchError) {
      console.error(
        "Erreur lors de la vérification de l'utilisateur dans Supabase :",
        fetchError
      );
      return res.status(500).send("Erreur interne du serveur");
    }

    if (!existingUser) {
      console.log("Utilisateur non trouvé, insertion dans la table users.");
      const { error: insertError } = await supabase
        .from("users")
        .insert({ userName, displayName });

      if (insertError) {
        console.error(
          "Erreur lors de l'insertion de l'utilisateur dans Supabase :",
          insertError
        );
        return res.status(500).send("Erreur interne du serveur");
      }
    } else {
      console.log("Utilisateur déjà existant :", existingUser);
    }

    req.session.user = { userName, displayName };
    console.log("Session utilisateur créée :", req.session.user);
    res.redirect(`${process.env.FRONT_URL}/auth`);
  } catch (e) {
    console.error("Erreur inattendue lors de la validation CAS :", e);
    res.status(500).send("Erreur lors de la validation CAS");
  }
};
