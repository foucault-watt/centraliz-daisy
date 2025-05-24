const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const downloadNotes = async (password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/notes/download`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Erreur lors du téléchargement des notes"
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Erreur lors du téléchargement des notes:", error);
    throw error;
  }
};
