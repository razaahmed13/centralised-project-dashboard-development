import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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

describe('DashboardActions', () => {
  it('keeps the add project dialog constrained and scrollable inside the viewport', () => {
    render(<DashboardActions clientGroups={clientGroups} />);

    fireEvent.click(screen.getByRole('button', { name: /add project/i }));

    const dialog = screen.getByRole('dialog', { name: /add project/i });
    expect(dialog).toHaveClass('max-h-[calc(100dvh-2rem)]');
    expect(dialog).toHaveClass('overflow-y-auto');
    expect(dialog.parentElement?.parentElement).toBe(document.body);
    expect(screen.getByRole('button', { name: /save project/i })).toBeInTheDocument();
  });
});
