import { env } from "../../config/env";
import {
  LeadMagnetSendInput,
  LeadMagnetSendResult,
  LeadMagnetService,
} from "./lead-magnet.types";

interface BrevoEmailRequestBody {
  sender: { name: string; email: string };
  to: { email: string }[];
  subject: string;
  htmlContent: string;
}

interface BrevoEmailResponseBody {
  messageId?: string;
  message?: string;
}

export class BrevoLeadMagnetService implements LeadMagnetService {
  readonly name = "brevo-lead-magnet";

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string) {
    if (!apiKey) {
      throw new Error("BREVO_API_KEY is not configured");
    }
    this.apiKey = apiKey;
    this.baseUrl = env.brevo.baseUrl;
  }

  async sendLeadMagnet(
    input: LeadMagnetSendInput,
  ): Promise<LeadMagnetSendResult> {
    const body: BrevoEmailRequestBody = {
      sender: {
        name: env.brevo.sender.name,
        email: env.brevo.sender.email,
      },
      to: [{ email: input.email }],
      subject: `Votre fichier ${input.fileName}`,
      htmlContent: buildLeadMagnetEmailHtml(input.fileUrl, input.fileName),
    };

    const response = await fetch(`${this.baseUrl}/smtp/email`, {
      method: "POST",
      headers: {
        "api-key": this.apiKey,
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = (await response
        .json()
        .catch(() => ({}))) as BrevoEmailResponseBody;
      throw new Error(
        `Brevo API error: ${errorData.message || response.statusText}`,
      );
    }

    const data = (await response
      .json()
      .catch(() => ({}))) as BrevoEmailResponseBody;

    return {
      status: "email sent",
      message: "Email envoyé avec succès",
      messageId: data.messageId,
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildLeadMagnetEmailHtml(fileUrl: string, fileName: string): string {
  const safeFileName = escapeHtml(fileName);
  return `<!DOCTYPE html>
<html lang="fr">
  <body style="margin: 0; padding: 0; background-color: #f4f4f7; font-family: Arial, Helvetica, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; padding: 40px;">
            <tr>
              <td style="text-align: center; padding-bottom: 24px;">
                <h1 style="color: #333333; font-size: 24px; margin: 0;">Merci pour votre confiance&nbsp;!</h1>
              </td>
            </tr>
            <tr>
              <td style="color: #555555; font-size: 16px; line-height: 24px; padding-bottom: 32px;">
                <p style="margin: 0 0 16px 0;">Bonjour,</p>
                <p style="margin: 0 0 16px 0;">
                  Merci pour votre intérêt. Vous pouvez dès à présent télécharger votre document&nbsp;:
                  <strong>${safeFileName}</strong>.
                </p>
                <p style="margin: 0;">Bonne lecture&nbsp;!</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom: 32px;">
                <a href="${fileUrl}"
                  style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 6px;">
                  Télécharger ${safeFileName}
                </a>
              </td>
            </tr>
            <tr>
              <td style="color: #777777; font-size: 13px; line-height: 20px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 24px;">
                <p style="margin: 0 0 8px 0;">
                  Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur&nbsp;:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${fileUrl}" style="color: #4f46e5;">${fileUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
