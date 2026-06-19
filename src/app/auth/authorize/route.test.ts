import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getServerSession: vi.fn(),
  getActiveSsoClient: vi.fn(),
  validateRedirectUri: vi.fn(),
  generateAuthorizationCode: vi.fn(),
  createSsoAuthorizationCode: vi.fn(),
}));

vi.mock('next-auth', () => ({ getServerSession: mocks.getServerSession }));
vi.mock('@/auth', () => ({ authOptions: {} }));
vi.mock('@/lib/sso/store', () => ({
  getActiveSsoClient: mocks.getActiveSsoClient,
  validateRedirectUri: mocks.validateRedirectUri,
  createSsoAuthorizationCode: mocks.createSsoAuthorizationCode,
}));
vi.mock('@/lib/sso/pkce', () => ({ generateAuthorizationCode: mocks.generateAuthorizationCode }));

describe('GET /auth/authorize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SSO_CODE_TTL_SECONDS = '120';
    mocks.getActiveSsoClient.mockResolvedValue({
      client_id: 'token-watcher',
      allowed_redirect_uris: ['https://tokenwatcher.neodym.ai/auth/callback'],
      allowed_origins: ['https://tokenwatcher.neodym.ai'],
      fallback_login_uri: 'https://tokenwatcher.neodym.ai/login',
    });
    mocks.validateRedirectUri.mockReturnValue(true);
    mocks.generateAuthorizationCode.mockReturnValue('raw-one-time-code');
    mocks.createSsoAuthorizationCode.mockResolvedValue(undefined);
  });

  it('redirects unauthenticated users to dashboard login with the full authorize URL as callback', async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=state-123&code_challenge=long-enough-pkce-challenge&code_challenge_method=S256',
      ),
    );

    expect(response.status).toBe(307);
    const location = response.headers.get('location') ?? '';
    expect(location).toContain('/login?callbackUrl=');
    expect(decodeURIComponent(location)).toContain('/auth/authorize?client_id=token-watcher');
  });

  it('redirects silent unauthenticated requests back to the client fallback URI with login_required', async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=state-123&code_challenge=long-enough-pkce-challenge&code_challenge_method=S256&prompt=none&fallback_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Flogin',
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://tokenwatcher.neodym.ai/login?error=login_required&state=state-123');
    expect(mocks.createSsoAuthorizationCode).not.toHaveBeenCalled();
  });

  it('uses the registered client fallback login URI for silent unauthenticated requests', async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=state-123&code_challenge=long-enough-pkce-challenge&code_challenge_method=S256&prompt=none',
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://tokenwatcher.neodym.ai/login?error=login_required&state=state-123');
    expect(mocks.createSsoAuthorizationCode).not.toHaveBeenCalled();
  });

  it('rejects silent fallback URIs outside the registered client origin', async () => {
    mocks.getServerSession.mockResolvedValue(null);
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=state-123&code_challenge=long-enough-pkce-challenge&code_challenge_method=S256&prompt=none&fallback_uri=https%3A%2F%2Fevil.example%2Flogin',
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_fallback_uri' });
  });

  it('issues one-time code and redirects authenticated users back to the exact client redirect URI', async () => {
    mocks.getServerSession.mockResolvedValue({ user: { email: 'hello@neodym.ai', name: 'Neodym Admin' } });
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Ftokenwatcher.neodym.ai%2Fauth%2Fcallback&state=state-123&code_challenge=long-enough-pkce-challenge&code_challenge_method=S256',
      ),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://tokenwatcher.neodym.ai/auth/callback?code=raw-one-time-code&state=state-123');
    expect(mocks.createSsoAuthorizationCode).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'raw-one-time-code',
        clientId: 'token-watcher',
        redirectUri: 'https://tokenwatcher.neodym.ai/auth/callback',
        userEmail: 'hello@neodym.ai',
        userName: 'Neodym Admin',
        codeChallenge: 'long-enough-pkce-challenge',
        codeChallengeMethod: 'S256',
      }),
    );
  });

  it('rejects unregistered or mismatched redirect URIs', async () => {
    mocks.getServerSession.mockResolvedValue({ user: { email: 'hello@neodym.ai' } });
    mocks.validateRedirectUri.mockReturnValue(false);
    const { GET } = await import('./route');

    const response = await GET(
      new Request(
        'https://dashboard.neodym.ai/auth/authorize?client_id=token-watcher&redirect_uri=https%3A%2F%2Fevil.example%2Fcallback&state=state-123&code_challenge=long-enough-pkce-challenge&code_challenge_method=S256',
      ),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: 'invalid_redirect_uri' });
    expect(mocks.createSsoAuthorizationCode).not.toHaveBeenCalled();
  });
});
