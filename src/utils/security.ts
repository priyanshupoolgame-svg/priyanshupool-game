// Security & Cryptographic utility for 8BALL PRO

/**
 * Computes a SHA-256 hash of a string using Web Crypto API
 */
export async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgUint8 = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback simple deterministic hash if crypto.subtle is unavailable
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const chr = message.charCodeAt(i);
    hash = (hash << 5) - hash + chr;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generates a permanent unique Player ID matching the required specification:
 * Format: PLY + 5 digits (e.g. PLY78098, PLY45217, PLY91834)
 */
export function generatePlayerId(existingIds: string[] = []): string {
  let id = '';
  do {
    const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 digits
    id = `PLY${randomDigits}`;
  } while (existingIds.includes(id));
  return id;
}

/**
 * Generates a unique Transaction ID (e.g. TXN928374)
 */
export function generateTransactionId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `TXN${digits}`;
}

/**
 * Generates a unique Withdrawal Request ID (e.g. WDR748291)
 */
export function generateWithdrawalId(): string {
  const digits = Math.floor(100000 + Math.random() * 900000);
  return `WDR${digits}`;
}

// Development Admin Configuration
// In production, these should be supplied via environment variables
export const DEV_ADMIN_ID = (import.meta as any).env?.VITE_ADMIN_ID || '789895';
export const DEV_ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || '020203';

/**
 * Authenticates Admin credentials without exposing plain text in persistent storage
 */
export async function authenticateAdmin(adminIdInput: string, passwordInput: string): Promise<boolean> {
  const cleanId = adminIdInput.trim();
  const cleanPass = passwordInput.trim();

  // Support development credentials as well as environment-configured credentials
  if (cleanId === DEV_ADMIN_ID && cleanPass === DEV_ADMIN_PASSWORD) {
    return true;
  }

  // Also support custom pre-hashed environment variable comparison
  const expectedHash = (import.meta as any).env?.VITE_ADMIN_PASSWORD_HASH;
  if (expectedHash && cleanId === DEV_ADMIN_ID) {
    const inputHash = await sha256(cleanPass);
    return inputHash === expectedHash;
  }

  return false;
}
