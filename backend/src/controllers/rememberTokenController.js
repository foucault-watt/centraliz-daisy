import crypto from "crypto";
import supabase from "../config/supabase.js";
import logger from "../utils/logger.js";

// Générer un token sécurisé
const generateToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

// Hasher un token
const hashToken = (token) => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// Extraire les informations de l'appareil à partir de la requête
const extractDeviceInfo = (req) => {
  const userAgent = req.headers["user-agent"] || "";
  const ip =
    req.ip ||
    req.connection.remoteAddress ||
    req.headers["x-forwarded-for"] ||
    "unknown";
  const acceptLanguage = req.headers["accept-language"] || "";
  const acceptEncoding = req.headers["accept-encoding"] || "";
  const referer = req.headers["referer"] || "";

  // Parser basique du User-Agent pour extraire des infos
  const parseUserAgent = (ua) => {
    const browserRegex = /(Chrome|Firefox|Safari|Edge|Opera)\/?([\d.]+)?/i;
    const osRegex = /(Windows|Mac|Linux|Android|iOS)[^\)]*\)?/i;
    const mobileRegex = /(Mobile|Android|iPhone|iPad)/i;

    const browserMatch = ua.match(browserRegex);
    const osMatch = ua.match(osRegex);
    const isMobile = mobileRegex.test(ua);

    return {
      browser: browserMatch
        ? `${browserMatch[1]} ${browserMatch[2] || ""}`.trim()
        : "Unknown",
      os: osMatch ? osMatch[1] : "Unknown",
      isMobile: isMobile,
      fullUserAgent: ua,
    };
  };

  const deviceInfo = parseUserAgent(userAgent);

  // Informations de base du serveur
  const baseInfo = {
    ip: ip,
    userAgent: userAgent,
    browser: deviceInfo.browser,
    os: deviceInfo.os,
    isMobile: deviceInfo.isMobile,
    language: acceptLanguage.split(",")[0] || "unknown",
    encoding: acceptEncoding,
    referer: referer,
    timestamp: new Date().toISOString(),
    timezone: req.headers["x-timezone"] || "unknown",
    screenResolution: req.headers["x-screen-resolution"] || "unknown",
    connectionType: req.headers["x-connection-type"] || "unknown",
  };

  // Fusionner avec les informations de session si disponibles
  if (req.session && req.session.deviceInfo) {
    return {
      ...baseInfo,
      ...req.session.deviceInfo,
      serverDetected: baseInfo,
      frontendDetected: req.session.deviceInfo.frontend || {},
      sessionTimestamp: req.session.deviceInfo.timestamp,
    };
  }

  return baseInfo;
};

// Créer un remember token
export const createRememberToken = async (userName, req) => {
  try {
    // Supprimer les anciens tokens de cet utilisateur s'il y en a trop
    const { data: existingTokens } = await supabase
      .from("remember_tokens")
      .select("id")
      .eq("userName", userName)
      .order("created_at", { ascending: false });

    if (existingTokens && existingTokens.length >= 10) {
      // Garder seulement les 9 plus récents
      const tokensToDelete = existingTokens.slice(9);
      await supabase
        .from("remember_tokens")
        .delete()
        .in(
          "id",
          tokensToDelete.map((t) => t.id)
        );
    }
    const token = generateToken();
    const hashedToken = hashToken(token);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 jours
    const deviceInfo = extractDeviceInfo(req);

    const { data, error } = await supabase
      .from("remember_tokens")
      .insert({
        userName: userName,
        token: hashedToken,
        expires_at: expiresAt.toISOString(),
        last_used_at: new Date().toISOString(),
        device_info: deviceInfo,
      })
      .select()
      .single();

    if (error) {
      logger.error("Erreur lors de la création du remember token:", error);
      return null;
    }

    logger.info(`Remember token créé pour l'utilisateur ${userName}`);
    return token; // Retourner le token non hashé pour le cookie
  } catch (error) {
    logger.error("Erreur lors de la création du remember token:", error);
    return null;
  }
};

// Vérifier un remember token
export const verifyRememberToken = async (token, req) => {
  try {
    const hashedToken = hashToken(token);
    const { data, error } = await supabase
      .from("remember_tokens")
      .select(
        `
        *,
        users!inner(userName, displayName, icalLink, isAdmin, group)
      `
      )
      .eq("token", hashedToken)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (error || !data) {
      return null;
    }

    // Mettre à jour last_used_at et device_info avec les nouvelles informations
    const currentDeviceInfo = extractDeviceInfo(req);
    await supabase
      .from("remember_tokens")
      .update({
        last_used_at: new Date().toISOString(),
        device_info: {
          ...data.device_info,
          lastUsed: currentDeviceInfo,
          usageCount: (data.device_info.usageCount || 0) + 1,
        },
      })
      .eq("id", data.id);

    logger.info(`Remember token utilisé pour l'utilisateur ${data.userName}`);
    return data.users;
  } catch (error) {
    logger.error("Erreur lors de la vérification du remember token:", error);
    return null;
  }
};

// Révoquer un remember token
export const revokeRememberToken = async (tokenId, userName) => {
  try {
    const { error } = await supabase
      .from("remember_tokens")
      .delete()
      .eq("id", tokenId)
      .eq("userName", userName);

    if (error) {
      logger.error("Erreur lors de la révocation du token:", error);
      return false;
    }

    logger.info(`Remember token ${tokenId} révoqué pour ${userName}`);
    return true;
  } catch (error) {
    logger.error("Erreur lors de la révocation du token:", error);
    return false;
  }
};

// Révoquer tous les tokens d'un utilisateur
export const revokeAllUserTokens = async (userName) => {
  try {
    const { error } = await supabase
      .from("remember_tokens")
      .delete()
      .eq("userName", userName);

    if (error) {
      logger.error("Erreur lors de la révocation de tous les tokens:", error);
      return false;
    }

    logger.info(`Tous les remember tokens révoqués pour ${userName}`);
    return true;
  } catch (error) {
    logger.error("Erreur lors de la révocation de tous les tokens:", error);
    return false;
  }
};

// Nettoyer les tokens expirés
export const cleanExpiredTokens = async () => {
  try {
    const { error } = await supabase
      .from("remember_tokens")
      .delete()
      .lt("expires_at", new Date().toISOString());

    if (error) {
      logger.error("Erreur lors du nettoyage des tokens expirés:", error);
      return false;
    }

    logger.info("Tokens expirés nettoyés");
    return true;
  } catch (error) {
    logger.error("Erreur lors du nettoyage des tokens expirés:", error);
    return false;
  }
};

// Obtenir les tokens d'un utilisateur
export const getUserTokens = async (userName) => {
  try {
    const { data, error } = await supabase
      .from("remember_tokens")
      .select("id, created_at, last_used_at, expires_at")
      .eq("userName", userName)
      .order("created_at", { ascending: false });

    if (error) {
      logger.error(
        "Erreur lors de la récupération des tokens utilisateur:",
        error
      );
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error(
      "Erreur lors de la récupération des tokens utilisateur:",
      error
    );
    return [];
  }
};

// Obtenir tous les tokens (pour l'admin)
export const getAllTokens = async () => {
  try {
    const { data, error } = await supabase
      .from("remember_tokens")
      .select(
        `
        *,
        users!inner(userName, displayName)
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      logger.error("Erreur lors de la récupération de tous les tokens:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error("Erreur lors de la récupération de tous les tokens:", error);
    return [];
  }
};
