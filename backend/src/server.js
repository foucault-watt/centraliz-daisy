import { createClient } from "@supabase/supabase-js"; // Import de Supabase
import compression from "compression";
import cors from "cors";
import * as dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { z } from "zod";
import logger from './utils/logger.js'; 

// Charger les variables d'environnement
dotenv.config();

// Schéma de validation avec Zod
const userSchema = z.object({
  name: z.string().min(1), // Le champ "name" doit être une chaîne de caractères non vide
  age: z.number().int().positive(), // Le champ "age" doit être un nombre entier positif
});

// Créer un client Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // Utilisation de la clé publique Anon
const supabase = createClient(supabaseUrl, supabaseKey);

const app = express();

// Middlewares généraux
app.use(cors());
app.use(helmet()); // Sécurise les headers HTTP
app.use(morgan("dev")); // Logs des requêtes HTTP
app.use(compression()); // Compresse les réponses
app.use(express.json()); // Parse le JSON des requêtes

// Route pour récupérer les notes
app.get("/notes", async (req, res) => {
  logger.info('Page notes demandée');
  try {
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Route pour ajouter un utilisateur avec validation Zod
app.post("/users", async (req, res) => {
  const validation = userSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({ error: validation.error.issues });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .insert([validation.data]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

// Démarrer le serveur
app.listen(3001, () => {
  console.log("✅ Serveur en ligne sur http://localhost:3001");
});
