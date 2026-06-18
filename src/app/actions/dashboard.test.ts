import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createAuditLog: vi.fn(),
  revalidatePath: vi.fn(),
  requireAdminSession: vi.fn(),
  getSupabaseAdminClient: vi.fn(),
  deleteEq: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: mocks.revalidatePath }));
vi.mock('@/lib/audit', () => ({ createAuditLog: mocks.createAuditLog }));
vi.mock('@/lib/session', () => ({ requireAdminSession: mocks.requireAdminSession }));
vi.mock('@/lib/db', () => ({ getSupabaseAdminClient: mocks.getSupabaseAdminClient }));

import { deleteClientGroupAction } from './dashboard';

function formDataForClient(id: string) {
  const formData = new FormData();
  formData.set('clientGroupId', id);
  return formData;
}

function makeSupabaseMock({ isInternal = false, projectRows = [] as { id: string }[] } = {}) {
  mocks.deleteEq.mockResolvedValue({ data: null, error: null });

  return {
    from: vi.fn((table: string) => {
      if (table === 'client_groups') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({ data: [{ id: 'client-1', name: 'Ease IP', is_internal: isInternal }], error: null })),
            })),
          })),
          delete: vi.fn(() => ({ eq: mocks.deleteEq })),
        };
      }

      if (table === 'projects') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              limit: vi.fn(() => ({ data: projectRows, error: null })),
            })),
          })),
        };
      }

      return {};
    }),
  };
}

describe('deleteClientGroupAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminSession.mockResolvedValue({ user: { email: 'hello@neodym.ai' } });
    mocks.createAuditLog.mockResolvedValue(undefined);
  });

  it('rejects deleting a non-internal client that still has projects', async () => {
    mocks.getSupabaseAdminClient.mockReturnValue(makeSupabaseMock({ projectRows: [{ id: 'project-1' }] }));

    await expect(deleteClientGroupAction(formDataForClient('client-1'))).rejects.toThrow('Remove all projects before deleting this client.');

    expect(mocks.deleteEq).not.toHaveBeenCalled();
    expect(mocks.createAuditLog).not.toHaveBeenCalled();
  });

  it('deletes a non-internal client when it has no projects', async () => {
    mocks.getSupabaseAdminClient.mockReturnValue(makeSupabaseMock({ projectRows: [] }));

    await deleteClientGroupAction(formDataForClient('client-1'));

    expect(mocks.deleteEq).toHaveBeenCalledWith('id', 'client-1');
    expect(mocks.createAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'delete', entityType: 'client_group' }));
    expect(mocks.revalidatePath).toHaveBeenCalledWith('/');
  });
});
