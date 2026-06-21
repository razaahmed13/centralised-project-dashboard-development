import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { signOut } from 'next-auth/react';

import { AppShell } from './app-shell';

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

describe('AppShell', () => {
  it('renders the default client group, groups heading, and dashboard actions', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByText(/groups/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /internal projects/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
    expect(screen.getByText(/dashboard content/i)).toBeInTheDocument();
  });

  it('renders dynamic client groups on settings pages without marking a client active', () => {
    render(
      <AppShell
        settingsActive
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
        <div>Settings content</div>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: /triangle ip/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /internal projects/i })).not.toHaveAttribute('aria-current');
  });

  it('keeps the desktop sidebar fixed while the page content scrolls', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByRole('complementary')).toHaveClass('fixed');
    expect(screen.getByRole('main')).toHaveClass('lg:ml-72');
  });

  it('keeps the topbar fixed while content scrolls and offsets page content below it', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByRole('banner')).toHaveClass('fixed');
    expect(screen.getByRole('banner')).toHaveClass('lg:left-72');
    expect(screen.getByText(/dashboard content/i).parentElement).toHaveClass('pt-32');
  });

  it('logs out to the login page from the persistent sidebar button', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    fireEvent.click(screen.getByRole('button', { name: /logout/i }));

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: '/login' });
  });
});
