import express, { Application } from "express";
import cors from "cors";
import { env } from "./config/env";
import { createContactRouter } from "./routes/contact.routes";
import { createLeadMagnetRouter } from "./routes/lead-magnet.routes";
import { GetResponseService } from "./services/email/getresponse.service";
import { BrevoLeadMagnetService } from "./services/lead-magnet/brevo-lead-magnet.service";
import { EmailMarketingService } from "./services/email/email-marketing.types";
import { LeadMagnetService } from "./services/lead-magnet/lead-magnet.types";

function getAllowedOrigins(): string[] {
  return [
    "https://www.latelierpsy.com",
    "https://latelierpsy.com",
    "https://latelierpsy.fr",
    "https://www.latelierpsy.fr",
    ...env.corsAllowedOrigins
      .split(",")
      .map((origin) =>
        origin
          .trim()
          .replace(/^["']|["']$/g, "")
          .replace(/\/+$/, ""),
      )
      .filter(Boolean),
  ];
}

export function createApp(
  emailServices: EmailMarketingService[] = [],
  leadMagnetService?: LeadMagnetService,
): Application {
  const app = express();

  app.use(
    cors({
      origin: getAllowedOrigins(),
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
      credentials: true,
      optionsSuccessStatus: 200,
    }),
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.send("hello");
  });

  for (const service of emailServices) {
    app.use("/api", createContactRouter(service));
  }

  if (leadMagnetService) {
    app.use("/api", createLeadMagnetRouter(leadMagnetService));
  }

  return app;
}

export function buildLeadMagnetService(): LeadMagnetService | undefined {
  if (env.brevo.apiKey) {
    return new BrevoLeadMagnetService(env.brevo.apiKey);
  }

  console.warn("BREVO_API_KEY missing: lead magnet service disabled");
  return undefined;
}

export function buildEmailServices(): EmailMarketingService[] {
  const services: EmailMarketingService[] = [];

  if (env.getresponse.apiKey) {
    services.push(
      new GetResponseService(
        env.getresponse.apiKey,
        env.getresponse.defaultCampaignId,
      ),
    );
  } else {
    console.warn("GETRESPONSE_API_KEY missing: getresponse service disabled");
  }

  return services;
}
