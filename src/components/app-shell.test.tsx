import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('renders the default client group, groups heading, bottom audit link, and dashboard actions', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByText(/groups/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /internal projects/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /audit log/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
    expect(screen.getByText(/dashboard content/i)).toBeInTheDocument();
  });

  it('renders dynamic client groups on audit pages without marking a client active', () => {
    render(
      <AppShell
        auditActive
        selectedClientGroupId={null}
        clientGroups={[
          {
            id: 'internal-id',
            name: 'Internal Projects',
            slug: 'internal-projects',
            niche: null,
            description: null,
            isInternal: true,
            sortOrder: 0,
            projects: [],
          },
          {
            id: 'triangle-ip-id',
            name: 'Triangle IP',
            slug: 'triangle-ip',
            niche: 'IP',
            description: null,
            isInternal: false,
            sortOrder: 1,
            projects: [],
          },
        ]}
      >
        <div>Audit content</div>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: /triangle ip/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /audit log/i })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: /internal projects/i })).not.toHaveAttribute('aria-current');
  });
});
