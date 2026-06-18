import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { LoginPanel } from './login-panel';

vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}));

describe('LoginPanel', () => {
  it('shows the Google logo before the continue with Google text', () => {
    render(<LoginPanel />);

    const googleButton = screen.getByRole('button', { name: /continue with google/i });
    const logo = googleButton.querySelector('svg[aria-label="Google logo"]');
    expect(logo).toBeTruthy();
    expect(googleButton.firstElementChild).toBe(logo);
  });

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
