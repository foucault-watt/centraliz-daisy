import express from "express";
import { downloadAndProcessNotes } from "../controllers/notesController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/download", authMiddleware, downloadAndProcessNotes);

export default router;
