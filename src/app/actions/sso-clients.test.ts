import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  createAuditLog: vi.fn(),
  revalidatePath: vi.fn(),
  insert: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/session', () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock('@/lib/db', () => ({ getSupabaseAdminClient: mocks.getSupabaseAdminClient }));
vi.mock('@/lib/audit', () => ({ createAuditLog: mocks.createAuditLog }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { createSsoClientAction } from './sso-clients';

function formDataForClient() {
  const formData = new FormData();
  formData.set('clientId', 'token-watcher');
  formData.set('name', 'Token Watcher');
  formData.set('allowedRedirectUris', 'https://tokenwatcher.neodym.ai/auth/callback\nhttp://localhost:3001/auth/callback');
  formData.set('allowedOrigins', 'https://tokenwatcher.neodym.ai\nhttp://localhost:3001');
  formData.set('isActive', 'on');
  return formData;
}

describe('createSsoClientAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({ user: { email: 'hello@neodym.ai' } });
    mocks.createAuditLog.mockResolvedValue(undefined);
    mocks.insert.mockResolvedValue({ data: null, error: null });
    mocks.getSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({ insert: mocks.insert })),
    });
  });

  it('registers an SSO client with exact redirect URI and origin allowlists', async () => {
    await createSsoClientAction(formDataForClient());

    expect(mocks.insert).toHaveBeenCalledWith({
      client_id: 'token-watcher',
      name: 'Token Watcher',
      allowed_redirect_uris: ['https://tokenwatcher.neodym.ai/auth/callback', 'http://localhost:3001/auth/callback'],
      allowed_origins: ['https://tokenwatcher.neodym.ai', 'http://localhost:3001'],
      is_active: true,
    });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      actor: 'hello@neodym.ai',
      action: 'sso_client_created',
      entityType: 'sso_client',
      entityId: 'token-watcher',
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/sso-clients');
  });
});
