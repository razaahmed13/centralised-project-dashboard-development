import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const mocks = vi.hoisted(() => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('@/lib/db', () => ({ getSupabaseAdminClient: mocks.getSupabaseAdminClient }));

import {
  createSsoAuthorizationCode,
  getActiveSsoClient,
  redeemSsoAuthorizationCode,
  validateRedirectUri,
} from './store';

function makeChain(result: unknown) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  for (const method of ['select', 'eq', 'is', 'gt', 'limit', 'single', 'insert', 'update']) {
    chain[method] = vi.fn(() => chain);
  }
  chain.single.mockResolvedValue(result);
  chain.insert.mockResolvedValue(result);
  return chain;
}

describe('SSO store helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads only active SSO clients and validates exact redirect URLs', async () => {
    const client = {
      client_id: 'token-watcher',
      name: 'Token Watcher',
      allowed_redirect_uris: ['https://tokenwatcher.neodym.ai/auth/callback'],
      allowed_origins: ['https://tokenwatcher.neodym.ai'],
      is_active: true,
    };
    const clientChain = makeChain({ data: client, error: null });
    mocks.getSupabaseAdminClient.mockReturnValue({ from: vi.fn(() => clientChain) });

    await expect(getActiveSsoClient('token-watcher')).resolves.toEqual(client);
    expect(clientChain.eq).toHaveBeenCalledWith('client_id', 'token-watcher');
    expect(clientChain.eq).toHaveBeenCalledWith('is_active', true);
    expect(validateRedirectUri(client, 'https://tokenwatcher.neodym.ai/auth/callback')).toBe(true);
    expect(validateRedirectUri(client, 'https://evil.example/auth/callback')).toBe(false);
  });

  it('stores only the hashed authorization code with expiry/user/client data', async () => {
    const insertChain = makeChain({ data: null, error: null });
    const from = vi.fn(() => insertChain);
    mocks.getSupabaseAdminClient.mockReturnValue({ from });

    await createSsoAuthorizationCode({
      code: 'raw-code-secret',
      clientId: 'token-watcher',
      redirectUri: 'https://tokenwatcher.neodym.ai/auth/callback',
      userEmail: 'hello@neodym.ai',
      userName: 'Neodym Admin',
      provider: 'dashboard',
      codeChallenge: 'challenge',
      codeChallengeMethod: 'S256',
      expiresAt: new Date('2026-06-19T00:01:00Z'),
    });

    expect(from).toHaveBeenCalledWith('sso_authorization_codes');
    const inserted = insertChain.insert.mock.calls[0][0];
    expect(inserted.code_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(inserted.code_hash).not.toBe('raw-code-secret');
    expect(inserted.client_id).toBe('token-watcher');
    expect(inserted.user_email).toBe('hello@neodym.ai');
  });

  it('redeems unused unexpired codes once and marks them used', async () => {
    const codeRow = {
      code_hash: 'hash',
      client_id: 'token-watcher',
      redirect_uri: 'https://tokenwatcher.neodym.ai/auth/callback',
      user_email: 'hello@neodym.ai',
      user_name: 'Neodym Admin',
      provider: 'dashboard',
      code_challenge: '0OMdJmsuqp2WFKpFxZeKAn_2LyAu4Tls6zheesnJDXE',
      code_challenge_method: 'S256',
      expires_at: '2099-01-01T00:00:00Z',
      used_at: null,
    };
    const selectChain = makeChain({ data: codeRow, error: null });
    const updateChain = makeChain({ data: null, error: null });
    const from = vi.fn((table: string) => (table === 'sso_authorization_codes' && from.mock.calls.length === 1 ? selectChain : updateChain));
    mocks.getSupabaseAdminClient.mockReturnValue({ from });

    await expect(
      redeemSsoAuthorizationCode({
        code: 'raw-code-secret',
        clientId: 'token-watcher',
        redirectUri: 'https://tokenwatcher.neodym.ai/auth/callback',
        codeVerifier: 'correct-horse-battery-staple-verifier',
      }),
    ).resolves.toMatchObject({ user_email: 'hello@neodym.ai' });

    expect(updateChain.update).toHaveBeenCalledWith(expect.objectContaining({ used_at: expect.any(String) }));
    expect(updateChain.eq).toHaveBeenCalledWith('code_hash', expect.stringMatching(/^[a-f0-9]{64}$/));
  });
});
