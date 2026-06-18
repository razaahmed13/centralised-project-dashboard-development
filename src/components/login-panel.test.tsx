import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginPanel } from './login-panel';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

describe('LoginPanel', () => {
  it('shows a red inline admin password error above the password submit button', () => {
    render(<LoginPanel authError="CredentialsSignin" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Incorrect admin password.');
    expect(alert).toHaveClass('text-rose-200');
    expect(alert.compareDocumentPosition(screen.getByRole('button', { name: /sign in with admin password/i }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it('shows a red inline Google authorization error on the login screen', () => {
    render(<LoginPanel authError="AccessDenied" />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Google account not authorized.');
    expect(alert).toHaveClass('text-rose-200');
  });
});
