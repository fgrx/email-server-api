import { Router, Request, Response } from "express";
import { env } from "../config/env";
import { EmailMarketingService } from "../services/email/email-marketing.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SUPERVISION_ALIAS = "supervisions";

function resolveCampaignId(rawCampaignId: unknown): string | undefined {
  const value = typeof rawCampaignId === "string" ? rawCampaignId.trim() : "";
  if (!value) {
    return undefined;
  }
  if (value === SUPERVISION_ALIAS) {
    return env.getresponse.supervisionListId;
  }
  return value;
}

export function createContactRouter(
  emailService: EmailMarketingService,
): Router {
  const router = Router();

  router.post("/add-contact", async (req: Request, res: Response) => {
    try {
      const { email, name, tag } = req.body as {
        email?: string;
        name?: string;
        tag?: string;
      };

      if (!email || !name) {
        return res
          .status(400)
          .json({ error: "email and name are required" });
      }

      if (!EMAIL_REGEX.test(email)) {
        return res.status(400).json({ error: "Invalid email" });
      }

      const campaignId = resolveCampaignId(
        req.body?.campaignId ?? req.body?.campaignid,
      );

      const result = await emailService.addContact({
        email,
        name,
        campaignId,
        tag: tag?.trim() || undefined,
      });

      return res.status(201).json(result);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error(`Error adding contact via ${emailService.name}:`, message);
      return res.status(500).json({
        error: "Failed to add contact",
        details: message,
      });
    }
  });

  return router;
}
