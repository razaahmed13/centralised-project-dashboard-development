import { describe, expect, it } from 'vitest';

import { formatCredentialsForClipboard } from './format-credentials';

describe('formatCredentialsForClipboard', () => {
  it('formats only username and password values on separate lines', () => {
    const result = formatCredentialsForClipboard({
      projectName: 'Token Tracker',
      url: 'https://token.neodym.ai',
      username: 'hello@neodym.ai',
      password: 'secret-password',
      notes: 'Use shared admin account.',
    });

    expect(result).toBe('hello@neodym.ai\nsecret-password');
  });

  it('omits blank username or password values', () => {
    const result = formatCredentialsForClipboard({
      projectName: 'Docs',
      url: 'https://docs.neodym.ai',
      username: '',
      password: 'secret-password',
      notes: 'Use shared admin account.',
    });

    expect(result).toBe('secret-password');
  });

  it('returns an empty string when username and password are blank', () => {
    const result = formatCredentialsForClipboard({
      projectName: 'Docs',
      url: 'https://docs.neodym.ai',
      username: '',
      password: '',
      notes: 'Use shared admin account.',
    });

    expect(result).toBe('');
  });
});
