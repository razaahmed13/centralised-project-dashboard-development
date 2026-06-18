import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createClientGroupAction,
  createProjectWithLinkAction,
} from '@/app/actions/dashboard';

import { DashboardActions } from './dashboard-actions';

vi.mock('@/app/actions/dashboard', () => ({
  createClientGroupAction: vi.fn(),
  createProjectWithLinkAction: vi.fn(),
}));

const clientGroups = [
  {
    id: 'internal-id',
    name: 'Internal Projects',
    slug: 'internal-projects',
    niche: 'Internal Operations',
    description: 'Internal tools',
    isInternal: true,
    sortOrder: 0,
    projects: [],
  },
];

const mockedCreateClientGroupAction = vi.mocked(createClientGroupAction);
const mockedCreateProjectWithLinkAction = vi.mocked(createProjectWithLinkAction);

describe('DashboardActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCreateClientGroupAction.mockResolvedValue(undefined);
    mockedCreateProjectWithLinkAction.mockResolvedValue(undefined);
  });

  it('keeps the add project dialog constrained and scrollable inside the viewport', () => {
    render(<DashboardActions clientGroups={clientGroups} />);

    fireEvent.click(screen.getByRole('button', { name: /add project/i }));

    const dialog = screen.getByRole('dialog', { name: /add project/i });
    expect(dialog).toHaveClass('max-h-[calc(100dvh-2rem)]');
    expect(dialog).toHaveClass('overflow-y-auto');
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument();
  });

  it('closes the add client modal after successful creation', async () => {
    render(<DashboardActions clientGroups={clientGroups} />);

    fireEvent.click(screen.getByRole('button', { name: /add client/i }));
    fireEvent.change(screen.getByLabelText(/client name/i), { target: { value: 'Triangle IP' } });
    fireEvent.change(screen.getByLabelText(/niche/i), { target: { value: 'IP' } });
    fireEvent.submit(screen.getByRole('button', { name: /save client/i }).closest('form')!);

    await waitFor(() => expect(mockedCreateClientGroupAction).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /add client/i })).not.toBeInTheDocument());
  });

  it('closes the add project modal after successful creation', async () => {
    render(<DashboardActions clientGroups={clientGroups} />);

    fireEvent.click(screen.getByRole('button', { name: /add project/i }));
    fireEvent.change(screen.getByLabelText(/project name/i), { target: { value: 'Token Watcher' } });
    fireEvent.change(screen.getByLabelText(/project link/i), { target: { value: 'https://example.com' } });
    fireEvent.submit(screen.getByRole('button', { name: /save project/i }).closest('form')!);

    await waitFor(() => expect(mockedCreateProjectWithLinkAction).toHaveBeenCalledOnce());
    await waitFor(() => expect(screen.queryByRole('dialog', { name: /add project/i })).not.toBeInTheDocument());
  });
});
