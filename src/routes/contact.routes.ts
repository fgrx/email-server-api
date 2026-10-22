import { Router, Request, Response } from "express";
import { EmailMarketingService } from "../services/email/email-marketing.types";

export function createContactRouter(
  emailService: EmailMarketingService,
): Router {
  const router = Router();

  router.post("/add-contact", async (req: Request, res: Response) => {
    try {
      const { email, name, campaignId } = req.body as {
        email?: string;
        name?: string;
        campaignId?: string;
      };

      if (!email || !name) {
        return res
          .status(400)
          .json({ error: "email and name are required" });
      }

      const result = await emailService.addContact({ email, name, campaignId });

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
