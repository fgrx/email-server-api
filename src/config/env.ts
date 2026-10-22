import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT) || 3000,
  corsAllowedOrigins: process.env.CORS_ALLOWED_ORIGINS || "",
  getresponse: {
    apiKey: process.env.GETRESPONSE_API_KEY,
    defaultCampaignId: process.env.GETRESPONSE_LIST_ID,
    baseUrl: "https://api.getresponse.com/v3",
  },
  brevo: {
    apiKey: process.env.BREVO_API_KEY,
    baseUrl: "https://api.brevo.com/v3",
    sender: {
      email: "contact@latelierpsy.com",
      name: "L'Atelier Psy",
    },
  },
  protection: {
    apiKey: process.env.PROTECTION_API_KEY,
  },
} as const;
