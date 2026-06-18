import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

const { getServerSessionMock, redirectMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
  redirectMock: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('next-auth', () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock('next/navigation', () => ({
  redirect: redirectMock,
}));

vi.mock('@/auth', () => ({
  authOptions: {},
}));

import { requirePageSession } from './session';

describe('requirePageSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated page requests to login with callbackUrl', async () => {
    getServerSessionMock.mockResolvedValue(null);

    await expect(requirePageSession('/audit')).rejects.toThrow('REDIRECT:/login?callbackUrl=%2Faudit');
    expect(redirectMock).toHaveBeenCalledWith('/login?callbackUrl=%2Faudit');
  });

  it('returns the session for authenticated page requests', async () => {
    const session = { user: { email: 'hello@neodym.ai' } };
    getServerSessionMock.mockResolvedValue(session);

    await expect(requirePageSession('/')).resolves.toBe(session);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});
