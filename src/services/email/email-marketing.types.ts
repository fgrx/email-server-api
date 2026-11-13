export interface AddContactInput {
  email: string;
  name: string;
  campaignId?: string;
  tag?: string;
}

export interface AddContactResult {
  status: string;
  message: string;
}

export interface EmailMarketingService {
  readonly name: string;
  addContact(input: AddContactInput): Promise<AddContactResult>;
}
