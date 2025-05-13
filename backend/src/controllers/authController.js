import axios from "axios";
import dotenv from "dotenv";
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
  if (!ticket) return res.status(400).send("Ticket manquant");

  try {
    const validateUrl = `${casBaseURL}/p3/serviceValidate?service=${encodeURIComponent(
      serviceURL
    )}&ticket=${ticket}`;
    const response = await axios.get(validateUrl);

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

    const { user, displayName } = extractFromCasXml(response.data);

    if (!user) {
      console.error(
        "CAS validation returned no user, despite no explicit authenticationFailure tag."
      );
      return res
        .status(401)
        .send("Utilisateur non trouvé après validation CAS.");
    }

    req.session.user = { id: user, name: displayName };
    res.redirect(process.env.FRONT_URL);
  } catch (e) {
    console.error("Erreur CAS :", e);
    res.status(500).send("Erreur lors de la validation CAS");
  }
};
