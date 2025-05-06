import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, (req, res) => {
  // On extrait les infos du JWT
  const user = req.user?.user || {};
  res.json({
    user,
    supabaseToken: req.token,
  });
});

export default router;
