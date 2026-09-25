import * as crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // Standard 96-bit IV for GCM

function getEncryptionKey(): Buffer {
  const secret =
    process.env.SMTP_ENCRYPTION_KEY ||
    process.env.JWT_SECRET ||
    "leadengine-pro-default-secure-32b-key-change-me!";
  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive string using AES-256-GCM with random IV and authentication tag
 */
export function encryptText(plainText: string): string {
  if (!plainText) return "";
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts AES-256-GCM encrypted text
 */
export function decryptText(encryptedPayload: string): string {
  if (!encryptedPayload) return "";
  
  // Format: iv:authTag:encryptedData
  const parts = encryptedPayload.split(":");
  if (parts.length !== 3) {
    // Fallback if plaintext was saved unencrypted
    return encryptedPayload;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
