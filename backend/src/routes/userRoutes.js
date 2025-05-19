import express from "express";
import {
  getIcalLink,
  getMe,
  uploadIcalLink,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getMe);
router.get("/calendar", authMiddleware, getIcalLink);
router.post("/calendar", authMiddleware, uploadIcalLink);

export default router;
