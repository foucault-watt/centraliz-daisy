import express from "express";
import { getCoefficients } from "../controllers/configController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/coefficients", authMiddleware, getCoefficients);

export default router;
