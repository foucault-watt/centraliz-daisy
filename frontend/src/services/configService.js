import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

export const configService = {
  async getCoefficients() {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/config/coefficients`,
        {
          withCredentials: true,
        }
      );
      return response.data.coefficients;
    } catch (error) {
      console.error("Erreur lors de la récupération des coefficients:", error);
      throw error;
    }
  },
};
