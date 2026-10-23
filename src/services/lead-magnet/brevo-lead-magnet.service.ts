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
    if (apiKey.startsWith("xsmtpsib-")) {
      throw new Error(
        "BREVO_API_KEY is an SMTP key (xsmtpsib-). Use an API v3 key (xkeysib-) from https://app.brevo.com/settings/keys/api",
      );
    }
    this.apiKey = apiKey;
    this.baseUrl = env.brevo.baseUrl;
  }

  async sendLeadMagnet(
    input: LeadMagnetSendInput,
  ): Promise<LeadMagnetSendResult> {
    const fileTitle = input.fileTitle?.trim() || input.fileName;
    const downloadUrl = buildDownloadPageUrl(input);

    const body: BrevoEmailRequestBody = {
      sender: {
        name: env.brevo.sender.name,
        email: env.brevo.sender.email,
      },
      to: [{ email: input.email }],
      subject: `Votre fichier ${input.fileName}`,
      htmlContent: buildLeadMagnetEmailHtml(
        downloadUrl,
        fileTitle,
        env.brevo.sender.name,
      ),
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

function buildDownloadPageUrl(input: LeadMagnetSendInput): string {
  const fileUrl = new URL(input.fileUrl);
  const params = new URLSearchParams();
  params.set("email", input.email);

  const listId = input.listId?.trim() || env.getresponse.defaultCampaignId;
  if (listId) {
    params.set("list", listId);
  }

  params.set("file", fileUrl.pathname);

  const name = input.name?.trim();
  if (name) {
    params.set("name", name);
  }

  return `${fileUrl.origin}/download/?${params.toString()}`;
}

function buildLeadMagnetEmailHtml(
  downloadUrl: string,
  fileTitle: string,
  senderName: string,
): string {
  const safeFileTitle = escapeHtml(fileTitle);
  const safeDownloadUrl = escapeHtml(downloadUrl);
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
                  <strong>${safeFileTitle}</strong>.
                </p>
                <p style="margin: 0;">Bien à vous,</p>
                <p style="margin: 8px 0 0 0;">${escapeHtml(senderName)}</p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom: 32px;">
                <a href="${safeDownloadUrl}"
                  style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: bold; padding: 14px 32px; border-radius: 6px;">
                  Télécharger ${safeFileTitle}
                </a>
              </td>
            </tr>
            <tr>
              <td style="color: #777777; font-size: 13px; line-height: 20px; text-align: center; border-top: 1px solid #eeeeee; padding-top: 24px;">
                <p style="margin: 0 0 8px 0;">
                  Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur&nbsp;:
                </p>
                <p style="margin: 0; word-break: break-all;">
                  <a href="${safeDownloadUrl}" style="color: #4f46e5;">${safeDownloadUrl}</a>
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
