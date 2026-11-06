import { env } from "../../config/env";
import {
  AddContactInput,
  AddContactResult,
  EmailMarketingService,
} from "./email-marketing.types";

interface ContactRequestBody {
  email: string;
  name: string;
  campaign: {
    campaignId: string;
  };
}

export class GetResponseService implements EmailMarketingService {
  readonly name = "getresponse";

  private readonly apiKey: string;
  private readonly defaultCampaignId: string;
  private readonly baseUrl: string;

  constructor(apiKey?: string, defaultCampaignId?: string) {
    if (!apiKey) {
      throw new Error("GETRESPONSE_API_KEY is not configured");
    }
    this.apiKey = apiKey;
    this.defaultCampaignId = defaultCampaignId || "";
    this.baseUrl = env.getresponse.baseUrl;
  }

  async addContact(input: AddContactInput): Promise<AddContactResult> {
    const campaignId = input.campaignId || this.defaultCampaignId;

    const body: ContactRequestBody = {
      email: input.email,
      name: input.name,
      campaign: {
        campaignId,
      },
    };

    const response = await fetch(`${this.baseUrl}/contacts`, {
      method: "POST",
      headers: {
        "X-Auth-Token": `api-key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      let message = text;
      try {
        const errorData = JSON.parse(text) as { message?: string };
        message = errorData.message || text;
      } catch {
        message = text;
      }
      throw new Error(`GetResponse API error: ${message}`);
    }

    return {
      status: "contact added",
      message: "Contact créé avec succès",
    };
  }
}
