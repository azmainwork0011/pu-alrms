// Stub: chat encryption (no-op)
export function encryptMessage(message: string, _key: string): string {
  return message;
}

export function decryptMessage(encrypted: string, _key: string): string {
  return encrypted;
}

export function generateEncryptionKey(): string {
  return '';
}
