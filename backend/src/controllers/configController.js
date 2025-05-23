import supabase from "../config/supabase.js";

export const getCoefficients = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentification requise" });
  }

  try {
    const { data, error } = await supabase
      .from("app_configurations")
      .select("config_value")
      .eq("config_key", "coefficients")
      .single();

    if (error) {
      console.error("Erreur lors de la récupération des coefficients :", error);
      return res.status(500).json({ error: "Erreur interne du serveur" });
    }

    if (!data || !data.config_value) {
      return res
        .status(404)
        .json({ error: "Configuration des coefficients non trouvée" });
    }

    res.json({ coefficients: data.config_value });
  } catch (err) {
    console.error(
      "Erreur inattendue lors de la récupération des coefficients :",
      err
    );
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
};
