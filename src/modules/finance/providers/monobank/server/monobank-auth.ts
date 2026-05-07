import crypto from "node:crypto";
import QRCode from "qrcode";
import {
  MONOBANK_AUTH_URL,
  MONOBANK_DEEPLINK_BASE,
  MONOBANK_APP_DEEPLINK_BASE,
  CONNECTION_EXPIRY_MINUTES,
} from "../types";
import type { MonobankProviderConfig } from "../types";
import { monobankAuthRequestResponseSchema } from "../schemas";

const MONO_BASE = "https://api.monobank.ua";

function getProviderConfig(): MonobankProviderConfig {
  const keyId = process.env.MONOBANK_KEY_ID;
  const privateKey = process.env.MONOBANK_PRIVATE_KEY;

  if (!keyId || !privateKey) {
    throw new Error(
      "MONOBANK_KEY_ID and MONOBANK_PRIVATE_KEY env variables are required for Provider API auth flow"
    );
  }

  return {
    keyId,
    privateKey,
    callbackUrl: process.env.MONOBANK_AUTH_CALLBACK_URL,
  };
}

function signRequest(privateKey: string, message: string): string {
  const sign = crypto.createSign("sha256");
  sign.update(message);
  sign.end();
  const signature = sign.sign(privateKey, "base64");
  return signature;
}

function buildAuthHeaders(
  config: MonobankProviderConfig,
  requestId?: string
): Record<string, string> {
  const time = Math.floor(Date.now() / 1000).toString();
  const url = "/personal/auth/request";
  const message = requestId ? `${time}${requestId}${url}` : `${time}${url}`;
  const sign = signRequest(config.privateKey, message);

  const headers: Record<string, string> = {
    "X-Key-Id": config.keyId,
    "X-Time": time,
    "X-Sign": sign,
    "Content-Type": "application/json",
  };

  if (requestId) {
    headers["X-Request-Id"] = requestId;
  }

  if (config.callbackUrl) {
    headers["X-Callback"] = config.callbackUrl;
  }

  return headers;
}

export async function createAuthRequest(): Promise<{
  tokenRequestId: string;
  qrLink: string;
  deeplink: string;
  qrDataUrl: string;
}> {
  const config = getProviderConfig();
  const headers = buildAuthHeaders(config);

  const response = await fetch(`${MONO_BASE}${MONOBANK_AUTH_URL}`, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  if (response.status === 429) {
    throw new Error("Rate limit exceeded — try again later");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `Monobank auth request failed [${response.status}]: ${(body as Record<string, string>)?.errorDescription ?? response.statusText}`
    );
  }

  const data = await response.json();
  const parsed = monobankAuthRequestResponseSchema.parse(data);
  const tokenRequestId = parsed.requestId;

  const qrLink = `${MONOBANK_DEEPLINK_BASE}?requestId=${tokenRequestId}`;
  const deeplink = `${MONOBANK_APP_DEEPLINK_BASE}?requestId=${tokenRequestId}`;

  const qrDataUrl = await QRCode.toDataURL(qrLink, {
    width: 256,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });

  return { tokenRequestId, qrLink, deeplink, qrDataUrl };
}

export type AuthCheckResult =
  | { status: "pending" }
  | { status: "granted"; token: string }
  | { status: "denied" }
  | { status: "expired" };

export async function checkAuthRequest(
  tokenRequestId: string
): Promise<AuthCheckResult> {
  const config = getProviderConfig();
  const headers = buildAuthHeaders(config, tokenRequestId);

  const response = await fetch(`${MONO_BASE}${MONOBANK_AUTH_URL}`, {
    method: "GET",
    headers,
    cache: "no-store",
  });

  if (response.status === 401) {
    return { status: "pending" };
  }

  if (response.status === 404) {
    return { status: "expired" };
  }

  if (response.status === 429) {
    throw new Error("Rate limit exceeded — try again later");
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `Monobank auth check failed [${response.status}]: ${(body as Record<string, string>)?.errorDescription ?? response.statusText}`
    );
  }

  const data = await response.json();

  if (data && typeof data === "object" && "token" in data) {
    return { status: "granted", token: String(data.token) };
  }

  return { status: "pending" };
}

export function isProviderApiConfigured(): boolean {
  return !!(process.env.MONOBANK_KEY_ID && process.env.MONOBANK_PRIVATE_KEY);
}

export { CONNECTION_EXPIRY_MINUTES };
