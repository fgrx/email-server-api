import { Router, Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { LeadMagnetService } from "../services/lead-magnet/lead-magnet.types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createLeadMagnetRouter(
  leadMagnetService: LeadMagnetService,
): Router {
  const router = Router();

  const requireApiKey = (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const apiKey = env.protection.apiKey;

    if (!apiKey) {
      res.status(500).json({ error: "PROTECTION_API_KEY is not configured" });
      return;
    }

    const providedKey = req.header("x-api-key");

    if (providedKey !== apiKey) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    next();
  };

  router.post(
    "/lead-magnet-send",
    requireApiKey,
    async (req: Request, res: Response) => {
      try {
        const { email, fileUrl, fileName } = req.body as {
          email?: string;
          fileUrl?: string;
          fileName?: string;
        };

        if (!email || !fileUrl || !fileName) {
          return res.status(400).json({
            error: "email, fileUrl and fileName are required",
          });
        }

        if (!EMAIL_REGEX.test(email)) {
          return res.status(400).json({ error: "Invalid email" });
        }

        if (!isValidHttpUrl(fileUrl)) {
          return res.status(400).json({ error: "Invalid fileUrl" });
        }

        const result = await leadMagnetService.sendLeadMagnet({
          email,
          fileUrl,
          fileName,
        });

        return res.status(200).json(result);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(
          `Error sending lead magnet email via ${leadMagnetService.name}:`,
          message,
        );
        return res.status(500).json({
          error: "Failed to send lead magnet email",
          details: message,
        });
      }
    },
  );

  return router;
}
