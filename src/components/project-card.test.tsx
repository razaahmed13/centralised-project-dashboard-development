import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { deleteProjectAction, updateProjectAction } from '@/app/actions/dashboard';

import { ProjectCard } from './project-card';

vi.mock('@/app/actions/dashboard', () => ({
  deleteProjectAction: vi.fn(),
  updateProjectAction: vi.fn(),
}));

const clientGroups = [
  {
    id: 'internal-id',
    name: 'Internal Projects',
    slug: 'internal-projects',
    niche: 'Internal Operations',
    description: null,
    isInternal: true,
    sortOrder: 0,
    projects: [],
  },
];

const project = {
  id: 'project-1',
  clientGroupId: 'internal-id',
  name: 'Token Watcher',
  description: 'Usage dashboard',
  status: 'active',
  sortOrder: 0,
  links: [
    {
      id: 'link-1',
      label: 'Open Project',
      url: 'https://token.neodym.ai',
      kind: 'app',
      hasCredentials: true,
      sortOrder: 0,
    },
  ],
};

describe('ProjectCard', () => {
  const writeText = vi.fn();
  const open = vi.fn();
  const confirm = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ hasCredentials: false }) }));
    vi.stubGlobal('open', open);
    vi.stubGlobal('confirm', confirm);
    Object.assign(navigator, { clipboard: { writeText } });
    vi.mocked(updateProjectAction).mockResolvedValue(undefined);
    vi.mocked(deleteProjectAction).mockResolvedValue(undefined);
    writeText.mockResolvedValue(undefined);
    confirm.mockReturnValue(true);
  });

  it('shows project status/name, open action, and a matching show details button', () => {
    render(<ProjectCard project={project} clientGroups={clientGroups} />);

    expect(screen.getByText('active')).toHaveClass('uppercase');
    expect(screen.getByRole('heading', { name: /token watcher/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open & auto-fill/i })).toBeInTheDocument();

    const showDetails = screen.getByRole('button', { name: /show details/i });
    expect(showDetails).toHaveClass('border-blue-300/20');
    expect(showDetails).toHaveClass('text-blue-100');
  });

  it('opens a read-only details dialog with clickable link and icon-only copy controls that turn into ticks', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ hasCredentials: true, username: 'hello@neodym.ai', password: 'secret-pass', notes: 'Use workspace admin.' }),
    } as Response);

    render(<ProjectCard project={project} clientGroups={clientGroups} />);
    fireEvent.click(screen.getByRole('button', { name: /show details/i }));

    expect(await screen.findByRole('dialog', { name: /token watcher details/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /https:\/\/token.neodym.ai/i })).toHaveAttribute('href', 'https://token.neodym.ai');
    expect(screen.getByDisplayValue('hello@neodym.ai')).toHaveAttribute('readOnly');
    expect(screen.getByDisplayValue('secret-pass')).toHaveAttribute('readOnly');

    const copyLink = screen.getByRole('button', { name: /copy project link/i });
    const copyUsername = screen.getByRole('button', { name: /copy username/i });
    const copyPassword = screen.getByRole('button', { name: /copy password/i });
    expect(copyUsername).not.toHaveTextContent(/copy username/i);
    expect(copyPassword).not.toHaveTextContent(/copy password/i);

    fireEvent.click(copyLink);
    fireEvent.click(copyUsername);
    fireEvent.click(copyPassword);

    await waitFor(() => expect(writeText).toHaveBeenCalledWith('https://token.neodym.ai'));
    expect(writeText).toHaveBeenCalledWith('hello@neodym.ai');
    expect(writeText).toHaveBeenCalledWith('secret-pass');
    expect(await screen.findByRole('button', { name: /copied username/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copied password/i })).toBeInTheDocument();
  });

  it('shows edit and delete actions side by side below the separator without the old dropdown', () => {
    render(<ProjectCard project={project} clientGroups={clientGroups} />);

    expect(screen.queryByText(/edit project/i, { selector: 'summary' })).not.toBeInTheDocument();
    const actions = screen.getByTestId('project-card-actions');
    expect(actions).toHaveClass('flex');
    expect(actions).toContainElement(screen.getByRole('button', { name: /edit project/i }));
    expect(actions).toContainElement(screen.getByRole('button', { name: /delete project/i }));
    expect(screen.getByRole('button', { name: /delete project/i })).toHaveClass('border-red-500/20');
  });

  it('opens an edit dialog with editable fields and update button', async () => {
    render(<ProjectCard project={project} clientGroups={clientGroups} />);

    fireEvent.click(screen.getByRole('button', { name: /edit project/i }));

    expect(screen.getByRole('dialog', { name: /edit token watcher/i })).toBeInTheDocument();
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/project-links/link-1/credentials', { cache: 'no-store' }));
    expect(screen.getByLabelText(/project name/i)).toHaveValue('Token Watcher');
    expect(screen.getByLabelText(/project link/i)).toHaveValue('https://token.neodym.ai');
    expect(screen.getByRole('button', { name: /update project/i })).toBeInTheDocument();
  });

  it('opens a separate modal confirmation alert before deleting a project', () => {
    render(<ProjectCard project={project} clientGroups={clientGroups} />);

    fireEvent.click(screen.getByRole('button', { name: /delete project/i }));

    expect(confirm).not.toHaveBeenCalled();
    const alert = screen.getByRole('alertdialog', { name: /delete token watcher/i });
    expect(alert).toHaveAttribute('aria-modal', 'true');
    expect(alert.parentElement?.parentElement).toBe(document.body);
    expect(alert).toHaveClass('max-w-2xl');
    expect(alert).toHaveTextContent('Delete Token Watcher? This cannot be undone.');
    expect(within(alert).getByRole('button', { name: /confirm/i })).toHaveClass('text-red-300');
    expect(within(alert).getByRole('button', { name: /cancel/i })).toHaveClass('text-emerald-300');

    fireEvent.click(within(alert).getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('alertdialog', { name: /delete token watcher/i })).not.toBeInTheDocument();
  });
});
