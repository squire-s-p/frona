export type BankConnectionStatusEnum =
  | "PENDING"
  | "WAITING_CONFIRMATION"
  | "CONNECTED"
  | "FAILED"
  | "EXPIRED";

export type BankSyncJobTypeId = "INITIAL_SYNC" | "INCREMENTAL_SYNC" | "FULL_SYNC";
export type BankSyncJobStatusId = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

export interface BankConnectionRecord {
  id: string;
  userId: string;
  provider: string;
  status: BankConnectionStatusEnum;
  tokenRequestId: string | null;
  qrLink: string | null;
  expiresAt: Date | null;
  connectedAt: Date | null;
  failedAt: Date | null;
  failureReason: string | null;
  lastSyncAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAuthSessionResult {
  connectionId: string;
  tokenRequestId: string;
  qrLink: string;
  deeplink: string;
  qrDataUrl: string;
}

export interface PollConnectionResult {
  status: BankConnectionStatusEnum;
  tokenRequestId: string;
}

export interface FinalizeConnectionResult {
  success: boolean;
  connectionId: string;
  accountsCreated: number;
  error?: string;
}

export interface MonobankProviderConfig {
  keyId: string;
  privateKey: string;
  callbackUrl?: string;
}

export const MONOBANK_AUTH_URL = "https://api.monobank.ua/personal/auth/request";
export const MONOBANK_DEEPLINK_BASE = "https://link.mono.com.ua/auth";
export const MONOBANK_APP_DEEPLINK_BASE = "mono://auth";

export const CONNECTION_EXPIRY_MINUTES = 10;
