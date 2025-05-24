import express from "express";
import supabase from "../config/supabase.js";
import {
  cleanExpiredTokens,
  getAllTokens,
  getUserTokens,
  revokeAllUserTokens,
  revokeRememberToken,
} from "../controllers/rememberTokenController.js";
import { isAdmin } from "../middlewares/adminMiddleware.js";
import { isAuthenticated } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes utilisateur - obtenir ses propres tokens
router.get("/my-sessions", isAuthenticated, async (req, res) => {
  try {
    const tokens = await getUserTokens(req.user.userName);
    res.json({
      success: true,
      sessions: tokens.map((token) => ({
        id: token.id,
        createdAt: token.created_at,
        lastUsedAt: token.last_used_at,
        expiresAt: token.expires_at,
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des sessions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des sessions",
    });
  }
});

// Routes utilisateur - révoquer un de ses tokens
router.delete("/my-sessions/:tokenId", isAuthenticated, async (req, res) => {
  try {
    const success = await revokeRememberToken(
      req.params.tokenId,
      req.user.userName
    );
    if (success) {
      res.json({
        success: true,
        message: "Session révoquée avec succès",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Impossible de révoquer cette session",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la révocation de la session:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la révocation de la session",
    });
  }
});

// Routes utilisateur - révoquer tous ses tokens
router.delete("/my-sessions", isAuthenticated, async (req, res) => {
  try {
    const success = await revokeAllUserTokens(req.user.userName);
    if (success) {
      res.json({
        success: true,
        message: "Toutes les sessions révoquées avec succès",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Impossible de révoquer les sessions",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la révocation des sessions:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la révocation des sessions",
    });
  }
});

// Routes admin - obtenir tous les tokens
router.get("/all-sessions", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const tokens = await getAllTokens();
    res.json({
      success: true,
      sessions: tokens.map((token) => ({
        id: token.id,
        userName: token.userName,
        displayName: token.users.displayName,
        createdAt: token.created_at,
        lastUsedAt: token.last_used_at,
        expiresAt: token.expires_at,
        deviceInfo: token.device_info,
      })),
    });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération de toutes les sessions:",
      error
    );
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des sessions",
    });
  }
});

// Routes admin - nettoyer les tokens expirés
router.post("/cleanup", isAuthenticated, isAdmin, async (req, res) => {
  try {
    const success = await cleanExpiredTokens();
    if (success) {
      res.json({
        success: true,
        message: "Tokens expirés nettoyés avec succès",
      });
    } else {
      res.status(500).json({
        success: false,
        message: "Erreur lors du nettoyage",
      });
    }
  } catch (error) {
    console.error("Erreur lors du nettoyage des tokens:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors du nettoyage des tokens",
    });
  }
});

// Routes admin - révoquer un token spécifique (DOIT être en dernier car /:tokenId capture tout)
router.delete("/:tokenId", isAuthenticated, isAdmin, async (req, res) => {
  try {
    // Pour l'admin, on ne vérifie pas le userName
    const { data: tokenData } = await supabase
      .from("remember_tokens")
      .select("userName")
      .eq("id", req.params.tokenId)
      .single();

    if (!tokenData) {
      return res.status(404).json({
        success: false,
        message: "Session non trouvée",
      });
    }

    const success = await revokeRememberToken(
      req.params.tokenId,
      tokenData.userName
    );
    if (success) {
      res.json({
        success: true,
        message: "Session révoquée avec succès",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Impossible de révoquer cette session",
      });
    }
  } catch (error) {
    console.error("Erreur lors de la révocation de la session:", error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la révocation de la session",
    });
  }
});

export default router;
