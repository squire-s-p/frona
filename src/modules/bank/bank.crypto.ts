// ─── bank.crypto.ts ──────────────────────────────────────────────────────────
// AES-256-GCM encryption for monoToken storage.
// Token is NEVER returned to the client — decrypted only inside service layer.

import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96-bit IV for GCM
const TAG_LENGTH = 16;

function getKey(): Buffer {
    const secret = process.env.BANK_TOKEN_SECRET;
    if (!secret) {
        throw new Error(
            "BANK_TOKEN_SECRET env variable is not set. " +
            "Generate one with: openssl rand -hex 32"
        );
    }
    // Derive a 32-byte key from the secret (hex string → buffer)
    const key = Buffer.from(secret, "hex");
    if (key.length !== 32) {
        throw new Error("BANK_TOKEN_SECRET must be a 64-character hex string (32 bytes)");
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
