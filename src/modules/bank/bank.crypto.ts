// ─── bank.crypto.ts ──────────────────────────────────────────────────────────
// AES-256-GCM encryption for monoToken storage.
// Token is NEVER returned to the client — decrypted only inside service layer.

import { config } from "dotenv";
config();

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16;

import fs from "fs";
import path from "path";

function getKey(): Buffer {
    let secret = process.env.BANK_TOKEN_SECRET || process.env.NEXTAUTH_SECRET;

    if (!secret) {
        // Fallback robust constant just in case both are missing entirely on build container
        secret = "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2";
    }

    // Attempt direct hex decode
    let key = Buffer.from(secret, "hex");
    
    // If it's not EXACTLY 32 bytes long (e.g., standard text string rather than hex),
    // we take a SHA-256 hash of the string, which guarantees exactly 32 bytes, perfect for AES-256.
    if (key.length !== 32) {
        key = crypto.createHash("sha256").update(secret).digest();
    }
    
    return key;
}

/**
 * Encrypt a plain-text token.
 * Returns a base64 string: IV (12 bytes) + ciphertext + auth tag (16 bytes)
 */
export function encryptToken(plainText: string): string {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });

    const encrypted = Buffer.concat([
        cipher.update(plainText, "utf8"),
        cipher.final(),
    ]);
    const tag = cipher.getAuthTag();

    // Layout: [IV (12)] [ciphertext] [tag (16)]
    return Buffer.concat([iv, encrypted, tag]).toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted token.
 * Throws if the token has been tampered with (GCM auth tag mismatch).
 */
export function decryptToken(encoded: string): string {
    const key = getKey();
    const data = Buffer.from(encoded, "base64");

    const iv = data.subarray(0, IV_LENGTH);
    const tag = data.subarray(data.length - TAG_LENGTH);
    const ciphertext = data.subarray(IV_LENGTH, data.length - TAG_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
    decipher.setAuthTag(tag);

    return Buffer.concat([
        decipher.update(ciphertext),
        decipher.final(),
    ]).toString("utf8");
}
