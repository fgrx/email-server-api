import { Router, Request, Response } from "express";
import { LeadMagnetService } from "../services/lead-magnet/lead-magnet.types";
import { requireApiKey } from "./require-api-key";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function createLeadMagnetRouter(leadMagnetService: LeadMagnetService): Router {
  const router = Router();

  router.post(
    "/lead-magnet-send",
    requireApiKey,
    async (req: Request, res: Response) => {
      try {
        const { email, fileUrl, fileName, fileTitle, name, listId } =
          req.body as {
            email?: string;
            fileUrl?: string;
            fileName?: string;
            fileTitle?: string;
            name?: string;
            listId?: string;
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
          fileTitle,
          name,
          listId,
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
