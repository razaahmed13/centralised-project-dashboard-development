import { describe, expect, it } from 'vitest';

import { createEncryptedCredentialPayload } from './credential-payload';

describe('credential payload preparation', () => {
  it('encrypts credential fields before database writes', () => {
    const key = '12345678901234567890123456789012';
    const payload = createEncryptedCredentialPayload(
      {
        username: 'hello@neodym.ai',
        password: 'secret-password',
        accessNotes: 'Use shared admin account.',
      },
      key,
    );

    expect(payload.username_encrypted).not.toContain('hello@neodym.ai');
    expect(payload.password_encrypted).not.toContain('secret-password');
    expect(payload.notes_encrypted).not.toContain('shared admin');
  });
});
