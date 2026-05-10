"use server";

import { verifyEmailToken } from "@/lib/email";

export async function verifyEmailAction(token: string, email: string) {
  return verifyEmailToken(token, email);
}
