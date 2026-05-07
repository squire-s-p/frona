import { z } from "zod/v4";

export const bankConnectionStatusSchema = z.enum([
  "PENDING",
  "WAITING_CONFIRMATION",
  "CONNECTED",
  "FAILED",
  "EXPIRED",
]);

export const createAuthSessionResponseSchema = z.object({
  connectionId: z.string(),
  tokenRequestId: z.string(),
  qrLink: z.string().url(),
  deeplink: z.string(),
  qrDataUrl: z.string(),
});

export const pollConnectionResponseSchema = z.object({
  status: bankConnectionStatusSchema,
  tokenRequestId: z.string(),
});

export const finalizeConnectionResponseSchema = z.object({
  success: z.boolean(),
  connectionId: z.string(),
  accountsCreated: z.number(),
  error: z.string().optional(),
});

export const monobankAuthRequestResponseSchema = z.object({
  requestId: z.string(),
});

export const monobankAuthCheckResponseSchema = z.object({
  status: z.enum(["pending", "granted", "denied", "expired"]),
  token: z.string().optional(),
});
