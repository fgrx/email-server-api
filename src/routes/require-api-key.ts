import { NextFunction, Request, Response } from "express";
import { env } from "../config/env";

export function requireApiKey(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
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
}
