import { describe, expect, it } from 'vitest';

import { getAllowedGoogleEmails, isAllowedGoogleEmail } from './auth-policy';
import { hashAdminPassword, verifyAdminPassword } from './password';

describe('auth policy', () => {
  it('allows hello@neodym.ai from the configured allowlist', () => {
    expect(isAllowedGoogleEmail('hello@neodym.ai', 'hello@neodym.ai')).toBe(true);
  });

  it('rejects emails not in the allowlist', () => {
    expect(isAllowedGoogleEmail('person@neodym.ai', 'hello@neodym.ai')).toBe(false);
  });

  it('normalizes comma separated allowed emails', () => {
    expect(getAllowedGoogleEmails(' hello@neodym.ai, team@neodym.ai ')).toEqual([
      'hello@neodym.ai',
      'team@neodym.ai',
    ]);
  });
});

describe('admin password', () => {
  it('verifies a matching admin password hash', async () => {
    const hash = await hashAdminPassword('correct horse battery staple');

    await expect(verifyAdminPassword('correct horse battery staple', hash)).resolves.toBe(true);
    await expect(verifyAdminPassword('wrong password', hash)).resolves.toBe(false);
  });

  it('returns false for missing password hashes', async () => {
    await expect(verifyAdminPassword('anything', '')).resolves.toBe(false);
  });
});
