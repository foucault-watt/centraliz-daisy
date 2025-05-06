// server.js
import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { authMiddleware } from "./middlewares/authMiddleware.js";
import casAuthRoutes from "./routes/casAuth.js";
import logger from "./utils/logger.js";
// Charger .env
dotenv.config();

const app = express();

// Middlewares globaux
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/cas", casAuthRoutes);

// Route test protégée
app.get("/api/whoami", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`✅ Serveur en ligne : http://localhost:${PORT}`);
});
