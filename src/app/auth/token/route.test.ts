import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  redeemSsoAuthorizationCode: vi.fn(),
  createSsoToken: vi.fn(),
}));

vi.mock('@/lib/sso/store', () => ({ redeemSsoAuthorizationCode: mocks.redeemSsoAuthorizationCode }));
vi.mock('@/lib/sso/tokens', () => ({ createSsoToken: mocks.createSsoToken, getSsoConfig: () => ({ tokenTtlSeconds: 900 }) }));

describe('POST /auth/token', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.redeemSsoAuthorizationCode.mockResolvedValue({
      client_id: 'token-watcher',
      user_email: 'hello@neodym.ai',
      user_name: 'Neodym Admin',
    });
    mocks.createSsoToken.mockResolvedValue('signed-sso-token');
  });

  it('exchanges a valid authorization code for a signed bearer token', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      new Request('https://dashboard.neodym.ai/auth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          client_id: 'token-watcher',
          code: 'raw-code',
          redirect_uri: 'https://tokenwatcher.neodym.ai/auth/callback',
          code_verifier: 'long-enough-verifier',
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      access_token: 'signed-sso-token',
      token_type: 'Bearer',
      expires_in: 900,
      user: { email: 'hello@neodym.ai', name: 'Neodym Admin' },
    });
    expect(mocks.redeemSsoAuthorizationCode).toHaveBeenCalledWith({
      code: 'raw-code',
      clientId: 'token-watcher',
      redirectUri: 'https://tokenwatcher.neodym.ai/auth/callback',
      codeVerifier: 'long-enough-verifier',
    });
  });

  it('returns oauth-style errors for invalid requests', async () => {
    const { POST } = await import('./route');

    const response = await POST(
      new Request('https://dashboard.neodym.ai/auth/token', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ grant_type: 'password' }),
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_request' });
    expect(mocks.redeemSsoAuthorizationCode).not.toHaveBeenCalled();
  });
});
