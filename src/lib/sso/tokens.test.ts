import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { createSsoToken, getSsoConfig, verifySsoToken } from './tokens';

describe('SSO token helpers', () => {
  it('reads issuer, ttl, and signing secret from server env', () => {
    process.env.SSO_ISSUER_URL = 'https://dashboard.neodym.ai';
    process.env.SSO_TOKEN_TTL_SECONDS = '600';
    process.env.SSO_SIGNING_SECRET = 'unit-test-signing-secret-that-is-long-enough';

    expect(getSsoConfig()).toEqual({
      issuer: 'https://dashboard.neodym.ai',
      tokenTtlSeconds: 600,
      signingSecret: 'unit-test-signing-secret-that-is-long-enough',
    });
  });

  it('creates signed tokens that verify issuer, audience, expiry, and user claims', async () => {
    process.env.SSO_ISSUER_URL = 'https://dashboard.neodym.ai';
    process.env.SSO_TOKEN_TTL_SECONDS = '900';
    process.env.SSO_SIGNING_SECRET = 'unit-test-signing-secret-that-is-long-enough';

    const token = await createSsoToken({
      clientId: 'token-watcher',
      userEmail: 'hello@neodym.ai',
      userName: 'Neodym Admin',
    });

    const claims = await verifySsoToken(token, 'token-watcher');
    expect(claims.iss).toBe('https://dashboard.neodym.ai');
    expect(claims.aud).toBe('token-watcher');
    expect(claims.sub).toBe('hello@neodym.ai');
    expect(claims.email).toBe('hello@neodym.ai');
    expect(claims.name).toBe('Neodym Admin');
  });
});
