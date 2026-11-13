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
  tags?: { tagId: string }[];
}

interface GetResponseTag {
  tagId: string;
  name: string;
}

interface GetResponseContact {
  contactId: string;
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

    const tagId = input.tag?.trim()
      ? await this.resolveTagId(input.tag.trim())
      : undefined;

    const body: ContactRequestBody = {
      email: input.email,
      name: input.name,
      campaign: {
        campaignId,
      },
      ...(tagId ? { tags: [{ tagId }] } : {}),
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
      const message = await parseGetResponseError(response);

      if (response.status === 409) {
        if (!tagId) {
          throw new Error(`GetResponse API error: ${message}`);
        }
        return this.addTagToExistingContact(input.email, tagId, message);
      }

      throw new Error(`GetResponse API error: ${message}`);
    }

    return {
      status: "contact added",
      message: "Contact créé avec succès",
    };
  }

  private async resolveTagId(tagName: string): Promise<string> {
    const existing = await this.findTagIdByName(tagName);
    if (existing) {
      return existing;
    }

    const response = await fetch(`${this.baseUrl}/tags`, {
      method: "POST",
      headers: {
        "X-Auth-Token": `api-key ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: tagName }),
    });

    if (!response.ok) {
      throw new Error(
        `GetResponse API error: unable to create tag "${tagName}": ${await parseGetResponseError(
          response,
        )}`,
      );
    }

    const tag = (await response.json()) as GetResponseTag;
    if (!tag.tagId) {
      throw new Error(
        `GetResponse API error: tag "${tagName}" created but no tagId returned`,
      );
    }
    return tag.tagId;
  }

  private async findTagIdByName(tagName: string): Promise<string | undefined> {
    const response = await fetch(
      `${this.baseUrl}/tags?perPage=1000&page=1`,
      {
        headers: {
          "X-Auth-Token": `api-key ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `GetResponse API error: unable to list tags: ${await parseGetResponseError(
          response,
        )}`,
      );
    }

    const tags = (await response.json()) as GetResponseTag[];
    const lowerName = tagName.toLowerCase();
    const match = tags.find(
      (tag) => tag.name?.toLowerCase() === lowerName && tag.tagId,
    );
    return match?.tagId;
  }

  private async addTagToExistingContact(
    email: string,
    tagId: string,
    conflictMessage: string,
  ): Promise<AddContactResult> {
    const contactId = await this.findContactIdByEmail(email);

    if (!contactId) {
      throw new Error(`GetResponse API error: ${conflictMessage}`);
    }

    const response = await fetch(
      `${this.baseUrl}/contacts/${contactId}/tags`,
      {
        method: "POST",
        headers: {
          "X-Auth-Token": `api-key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tags: [{ tagId }] }),
      },
    );

    if (!response.ok) {
      throw new Error(
        `GetResponse API error: unable to add tag to existing contact: ${await parseGetResponseError(
          response,
        )}`,
      );
    }

    return {
      status: "tag added to existing contact",
      message: "Contact déjà inscrit : tag ajouté",
    };
  }

  private async findContactIdByEmail(
    email: string,
  ): Promise<string | undefined> {
    const response = await fetch(
      `${this.baseUrl}/contacts?query[email]=${encodeURIComponent(
        email,
      )}&additionalFlags=exactMatch`,
      {
        headers: {
          "X-Auth-Token": `api-key ${this.apiKey}`,
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `GetResponse API error: unable to search contacts: ${await parseGetResponseError(
          response,
        )}`,
      );
    }

    const contacts = (await response.json()) as GetResponseContact[];
    const contact = contacts.find((entry) => entry.contactId);
    return contact?.contactId;
  }
}

async function parseGetResponseError(response: Response): Promise<string> {
  const text = await response.text();
  try {
    const errorData = JSON.parse(text) as { message?: string };
    return errorData.message || text;
  } catch {
    return text;
  }
}
