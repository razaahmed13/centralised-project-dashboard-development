import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;

function normalizeKey(key: string): Buffer {
  if (!key || Buffer.byteLength(key, 'utf8') !== KEY_LENGTH) {
    throw new Error('Credential encryption key must be exactly 32 bytes.');
  }

  return Buffer.from(key, 'utf8');
}

export function encryptSecret(plaintext: string, key: string): string {
  const normalizedKey = normalizeKey(key);
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, normalizedKey, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return ['v1', iv.toString('base64url'), authTag.toString('base64url'), encrypted.toString('base64url')].join(':');
}

export function decryptSecret(ciphertext: string, key: string): string {
  const normalizedKey = normalizeKey(key);
  const [version, ivValue, authTagValue, encryptedValue] = ciphertext.split(':');

  if (version !== 'v1' || !ivValue || !authTagValue || !encryptedValue) {
    throw new Error('Invalid encrypted credential payload.');
  }

  const decipher = createDecipheriv(ALGORITHM, normalizedKey, Buffer.from(ivValue, 'base64url'), {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(Buffer.from(authTagValue, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encryptedValue, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
