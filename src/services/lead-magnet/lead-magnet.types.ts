export interface LeadMagnetSendInput {
  email: string;
  fileUrl: string;
  fileName: string;
}

export interface LeadMagnetSendResult {
  status: string;
  message: string;
  messageId?: string;
}

export interface LeadMagnetService {
  readonly name: string;
  sendLeadMagnet(input: LeadMagnetSendInput): Promise<LeadMagnetSendResult>;
}
