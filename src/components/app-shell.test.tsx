import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppShell } from './app-shell';

describe('AppShell', () => {
  it('renders the default client group and dashboard actions', () => {
    render(
      <AppShell>
        <div>Dashboard content</div>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: /internal projects/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add client/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add project/i })).toBeInTheDocument();
    expect(screen.getByText(/dashboard content/i)).toBeInTheDocument();
  });
});
