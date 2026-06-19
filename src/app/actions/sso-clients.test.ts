import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  requireAdminSession: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  createAuditLog: vi.fn(),
  revalidatePath: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  eq: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/session', () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock('@/lib/db', () => ({ getSupabaseAdminClient: mocks.getSupabaseAdminClient }));
vi.mock('@/lib/audit', () => ({ createAuditLog: mocks.createAuditLog }));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));

import { createSsoClientAction, updateSsoClientStatusAction } from './sso-clients';

function formDataForClient() {
  const formData = new FormData();
  formData.set('clientId', 'token-watcher');
  formData.set('name', 'Token Watcher');
  formData.set('allowedRedirectUris', 'https://tokenwatcher.neodym.ai/auth/callback\nhttp://localhost:3001/auth/callback');
  formData.set('fallbackLoginUri', 'https://tokenwatcher.neodym.ai/login');
  formData.set('allowedOrigins', 'https://tokenwatcher.neodym.ai\nhttp://localhost:3001');
  formData.set('isActive', 'on');
  return formData;
}

describe('createSsoClientAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({ user: { email: 'hello@neodym.ai' } });
    mocks.createAuditLog.mockResolvedValue(undefined);
    mocks.select.mockResolvedValue({ data: [{ id: '11111111-1111-4111-8111-111111111111' }], error: null });
    mocks.insert.mockReturnValue({ select: mocks.select });
    mocks.eq.mockResolvedValue({ data: null, error: null });
    mocks.update.mockReturnValue({ eq: mocks.eq });
    mocks.getSupabaseAdminClient.mockReturnValue({
      from: vi.fn(() => ({ insert: mocks.insert, update: mocks.update })),
    });
  });

  it('registers an SSO client with exact redirect URI and origin allowlists', async () => {
    await createSsoClientAction(formDataForClient());

    expect(mocks.insert).toHaveBeenCalledWith({
      client_id: 'token-watcher',
      name: 'Token Watcher',
      allowed_redirect_uris: ['https://tokenwatcher.neodym.ai/auth/callback', 'http://localhost:3001/auth/callback'],
      fallback_login_uri: 'https://tokenwatcher.neodym.ai/login',
      allowed_origins: ['https://tokenwatcher.neodym.ai', 'http://localhost:3001'],
      is_active: true,
    });
    expect(mocks.select).toHaveBeenCalledWith('id');
    expect(mocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      actor: 'hello@neodym.ai',
      action: 'sso_client_created',
      entityType: 'sso_client',
      entityId: '11111111-1111-4111-8111-111111111111',
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/sso-clients');
  });

  it('disables an SSO client by row id and writes an audit log', async () => {
    const formData = new FormData();
    formData.set('clientId', '11111111-1111-4111-8111-111111111111');
    formData.set('clientName', 'Local Test');
    formData.set('isActive', 'false');

    await updateSsoClientStatusAction(formData);

    expect(mocks.update).toHaveBeenCalledWith({ is_active: false, updated_at: expect.any(String) });
    expect(mocks.eq).toHaveBeenCalledWith('id', '11111111-1111-4111-8111-111111111111');
    expect(mocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      actor: 'hello@neodym.ai',
      action: 'sso_client_disabled',
      entityType: 'sso_client',
      entityId: '11111111-1111-4111-8111-111111111111',
      summary: 'Disabled SSO client Local Test',
    }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/sso-clients');
  });

  it('enables an SSO client by row id and writes an audit log', async () => {
    const formData = new FormData();
    formData.set('clientId', '11111111-1111-4111-8111-111111111111');
    formData.set('clientName', 'Local Test');
    formData.set('isActive', 'true');

    await updateSsoClientStatusAction(formData);

    expect(mocks.update).toHaveBeenCalledWith({ is_active: true, updated_at: expect.any(String) });
    expect(mocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      action: 'sso_client_enabled',
      summary: 'Enabled SSO client Local Test',
    }));
  });
});
