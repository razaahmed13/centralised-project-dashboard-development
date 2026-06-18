import { describe, expect, it } from 'vitest';

import { decryptSecret, encryptSecret } from './crypto';

describe('credential encryption', () => {
  it('roundtrips plaintext with a valid key', () => {
    const key = '0123456789abcdef0123456789abcdef';
    const encrypted = encryptSecret('hello@neodym.ai', key);

    expect(decryptSecret(encrypted, key)).toBe('hello@neodym.ai');
  });

  it('uses a random IV so the same plaintext encrypts differently', () => {
    const key = '0123456789abcdef0123456789abcdef';

    expect(encryptSecret('same secret', key)).not.toBe(encryptSecret('same secret', key));
  });

  it('fails safely for missing or invalid keys', () => {
    expect(() => encryptSecret('secret', '')).toThrow(/credential encryption key/i);
    expect(() => encryptSecret('secret', 'short')).toThrow(/credential encryption key/i);
  });
});
