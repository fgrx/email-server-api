import { Router, Request, Response } from "express";
import { env } from "../config/env";
import { EmailMarketingService } from "../services/email/email-marketing.types";
import { requireApiKey } from "./require-api-key";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createSubscribeRouter(
  emailService: EmailMarketingService,
): Router {
  const router = Router();

  router.post(
    "/subscribe-contact",
    requireApiKey,
    async (req: Request, res: Response) => {
      try {
        const { email, name, listId, tag } = req.body as {
          email?: string;
          name?: string;
          listId?: string;
          tag?: string;
        };

        if (!email) {
          return res.status(400).json({ error: "email is required" });
        }

        if (!EMAIL_REGEX.test(email)) {
          return res.status(400).json({ error: "Invalid email" });
        }

        const result = await emailService.addContact({
          email,
          name: name?.trim() || email.split("@")[0],
          campaignId: listId || env.getresponse.defaultCampaignId,
          tag: tag?.trim() || undefined,
        });

        return res.status(201).json(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Error adding contact via ${emailService.name}:`,
          message,
        );
        return res.status(500).json({
          error: "Failed to add contact",
          details: message,
        });
      }
    },
  );

  return router;
}
