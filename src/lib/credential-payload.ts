import { encryptSecret } from './crypto';

export type CredentialPayloadInput = {
  username?: string | null;
  password?: string | null;
  accessNotes?: string | null;
};

export type EncryptedCredentialPayload = {
  username_encrypted: string | null;
  password_encrypted: string | null;
  notes_encrypted: string | null;
  credential_format: 'username_password_notes';
};

function encryptedOrNull(value: string | null | undefined, key: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? encryptSecret(trimmed, key) : null;
}

export function createEncryptedCredentialPayload(
  input: CredentialPayloadInput,
  key = process.env.CREDENTIAL_ENCRYPTION_KEY ?? '',
): EncryptedCredentialPayload {
  return {
    username_encrypted: encryptedOrNull(input.username, key),
    password_encrypted: encryptedOrNull(input.password, key),
    notes_encrypted: encryptedOrNull(input.accessNotes, key),
    credential_format: 'username_password_notes',
  };
}
