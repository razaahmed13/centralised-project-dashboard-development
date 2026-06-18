import { describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));

import { mapDashboardRows, sanitizeProjectCredentialFields } from './dashboard-data';

describe('dashboard data mapping', () => {
  it('maps flat Supabase rows into client groups with projects and links', () => {
    const data = mapDashboardRows({
      clientGroups: [
        {
          id: 'internal',
          name: 'Internal Projects',
          slug: 'internal-projects',
          niche: 'Internal Operations',
          description: 'Neodym-owned tools.',
          is_internal: true,
          sort_order: 0,
        },
      ],
      projects: [
        {
          id: 'project-1',
          client_group_id: 'internal',
          name: 'Token Tracker',
          description: 'Usage dashboard.',
          status: 'active',
          sort_order: 0,
        },
      ],
      links: [
        {
          id: 'link-1',
          project_id: 'project-1',
          label: 'Open App',
          url: 'https://token.neodym.ai',
          kind: 'app',
          has_credentials: true,
          sort_order: 0,
        },
      ],
    });

    expect(data.clientGroups[0].projects[0].links[0]).toMatchObject({
      id: 'link-1',
      hasCredentials: true,
    });
  });

  it('does not expose encrypted credential values in project links', () => {
    expect(
      sanitizeProjectCredentialFields({
        id: 'link-1',
        username_encrypted: 'encrypted-username',
        password_encrypted: 'encrypted-password',
      }),
    ).toEqual({ id: 'link-1' });
  });
});
