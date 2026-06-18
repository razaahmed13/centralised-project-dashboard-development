import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ClientGroupHeader } from './client-group-header';

vi.mock('@/app/actions/dashboard', () => ({
  deleteClientGroupAction: vi.fn(),
  updateClientGroupAction: vi.fn(),
}));

const clientGroup = {
  id: 'client-1',
  name: 'Ease IP',
  slug: 'ease-ip',
  niche: 'Medical',
  description: null,
  isInternal: false,
  sortOrder: 1,
  projects: [],
};

describe('ClientGroupHeader', () => {
  it('places a red remove client button opposite the non-internal client name when there are no projects', () => {
    render(<ClientGroupHeader clientGroup={clientGroup} />);

    const removeButton = screen.getByRole('button', { name: /remove client/i });
    expect(removeButton).toHaveClass('border-red-500/20');
    expect(removeButton).toHaveClass('text-red-300');
    expect(removeButton).not.toBeDisabled();
    expect(removeButton.closest('form')?.querySelector('input[name="clientGroupId"]')).toHaveValue('client-1');

    const titleRow = screen.getByTestId('client-title-row');
    expect(titleRow).toHaveClass('justify-between');
    expect(titleRow).toContainElement(screen.getByRole('heading', { name: /ease ip/i }));
    expect(titleRow).toContainElement(removeButton);
  });

  it('does not show client management buttons for Internal Projects', () => {
    render(<ClientGroupHeader clientGroup={{ ...clientGroup, id: 'internal', name: 'Internal Projects', isInternal: true }} />);

    expect(screen.queryByRole('button', { name: /remove client/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /edit client/i })).not.toBeInTheDocument();
  });

  it('places an edit client button beside remove client with project edit styling', () => {
    render(<ClientGroupHeader clientGroup={clientGroup} />);

    const actions = screen.getByTestId('client-management-actions');
    const editButton = within(actions).getByRole('button', { name: /edit client/i });
    const removeButton = within(actions).getByRole('button', { name: /remove client/i });

    expect(editButton).toHaveClass('border-blue-300/20');
    expect(editButton).toHaveClass('text-blue-100');
    expect(actions).toContainElement(removeButton);
    expect(actions).toContainElement(editButton);
    expect(Array.from(actions.children).at(0)).toBe(editButton);
  });

  it('opens client edit details in a modal instead of inline details', () => {
    render(<ClientGroupHeader clientGroup={{ ...clientGroup, description: 'Client description' }} />);

    expect(screen.queryByText(/edit client details/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /edit client/i }));

    const dialog = screen.getByRole('dialog', { name: /edit ease ip/i });
    expect(within(dialog).getByLabelText(/client name/i)).toHaveValue('Ease IP');
    expect(within(dialog).getByLabelText(/client niche/i)).toHaveValue('Medical');
    expect(within(dialog).getByLabelText(/description/i)).toHaveValue('Client description');
    expect(within(dialog).getByRole('button', { name: /update client/i })).toHaveClass('bg-blue-500');
  });

  it('disables the remove client button when the client still has projects', () => {
    render(
      <ClientGroupHeader
        clientGroup={{
          ...clientGroup,
          projects: [
            {
              id: 'project-1',
              clientGroupId: 'client-1',
              name: 'Existing Project',
              description: null,
              status: 'active',
              sortOrder: 0,
              links: [],
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole('button', { name: /remove client/i })).toBeDisabled();
  });
});
