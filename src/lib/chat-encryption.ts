/**
 * AES-256-GCM Encryption Engine for PU-ALRMS Community Chat
 *
 * Client-side encryption utility using the Web Crypto API.
 * The server-side chat service handles its own encryption independently.
 *
 * Each room has a unique 256-bit encryption key.
 * Messages are encrypted using AES-256-GCM with authenticated encryption.
 */

const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12; // 96-bit IV (NIST recommended for AES-GCM)
const TAG_LENGTH = 128; // Full 128-bit authentication tag

/**
 * Generate a cryptographically secure 256-bit key
 * Returns hex-encoded string (64 hex chars = 32 bytes = 256 bits)
 */
export function generateEncryptionKey(): string {
  const keyBytes = new Uint8Array(KEY_LENGTH / 8);
  crypto.getRandomValues(keyBytes);
  return bytesToHex(keyBytes);
}

/**
 * Import a hex-encoded key as CryptoKey for use with Web Crypto API
 */
async function importKey(keyHex: string): Promise<CryptoKey> {
  const keyBytes = hexToBytes(keyHex);
  return crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a plaintext message using AES-256-GCM
 * @param plaintext - Message to encrypt
 * @param keyHex - Hex-encoded 256-bit key (64 hex characters)
 * @returns Object with encrypted content (hex) and initialization vector (hex)
 */
export async function encryptMessage(
  plaintext: string,
  keyHex: string
): Promise<{ encrypted: string; iv: string }> {
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);

  const encoded = new TextEncoder().encode(plaintext);
  const cryptoKey = await importKey(keyHex);

  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    cryptoKey,
    encoded
  );

  return {
    encrypted: bytesToHex(new Uint8Array(ciphertext)),
    iv: bytesToHex(iv),
  };
}

/**
 * Decrypt an AES-256-GCM encrypted message
 * @param encryptedHex - Hex-encoded ciphertext (includes 128-bit auth tag)
 * @param keyHex - Hex-encoded 256-bit key
 * @param ivHex - Hex-encoded 96-bit initialization vector
 * @returns Decrypted plaintext string
 */
export async function decryptMessage(
  encryptedHex: string,
  keyHex: string,
  ivHex: string
): Promise<string> {
  const cryptoKey = await importKey(keyHex);
  const iv = hexToBytes(ivHex);
  const encrypted = hexToBytes(encryptedHex);

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv, tagLength: TAG_LENGTH },
    cryptoKey,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
}

// ─── Utility Functions ──────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}
