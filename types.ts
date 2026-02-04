
export enum UserPlan {
  FREE = 'FREE',
  PAID_15 = 'PAID_15',
  PAID_MONTHLY = 'PAID_MONTHLY'
}

export interface PaymentGatewayConfig {
  enabled: boolean;
  publicKey: string;
  secretKey: string; 
}

export interface PaymentConfig {
  stripe: PaymentGatewayConfig;
  paypal: PaymentGatewayConfig;
  currency: string;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  plan: UserPlan;
  planExpiry?: string;
  smtp?: CustomSMTP;
  dailyUsage: number;
  totalSent?: number;
  createdAt: string;
  lastLogin?: string;
}

export interface CustomSMTP {
  host: string;
  port: number;
  user: string;
  pass: string;
  fromEmail: string;
  fromName: string;
  encryption: 'SSL' | 'TLS' | 'NONE';
}

export interface Recipient {
  id: string;
  data: Record<string, string>;
  email: string;
  certId: string;
  status?: 'PENDING' | 'SUCCESS' | 'FAILURE';
}

export type VariableType = 'TEXT' | 'QR_CODE';

export interface VariableConfig {
  id: string;
  key: string; 
  type: VariableType;
  x: number;
  y: number;
  fontSize: number;
  fontColor: string;
  textAlign?: 'left' | 'center' | 'right';
}

export interface Project {
  id: string;
  name: string;
  templateFile: string | null;
  templateType: 'image' | 'pdf' | null;
  variables: VariableConfig[];
  recipients: Recipient[];
  emailSubject: string;
  emailBody: string;
  updatedAt: string;
  stats?: {
    success: number;
    failed: number;
  };
}

export interface ProcessingLog {
  id: string;
  userId: string;
  userEmail: string;
  projectId: string;
  projectName: string;
  recipientEmail: string;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: string;
  errorMessage?: string;
}
