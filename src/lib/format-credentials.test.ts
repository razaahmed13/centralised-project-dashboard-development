import { describe, expect, it } from 'vitest';

import { formatCredentialsForClipboard } from './format-credentials';

describe('formatCredentialsForClipboard', () => {
  it('formats project credentials without masking the copied password', () => {
    const result = formatCredentialsForClipboard({
      projectName: 'Token Tracker',
      url: 'https://token.neodym.ai',
      username: 'hello@neodym.ai',
      password: 'secret-password',
      notes: 'Use shared admin account.',
    });

    expect(result).toContain('Project: Token Tracker');
    expect(result).toContain('URL: https://token.neodym.ai');
    expect(result).toContain('Username: hello@neodym.ai');
    expect(result).toContain('Password: secret-password');
    expect(result).toContain('Notes: Use shared admin account.');
  });

  it('omits blank credential fields', () => {
    const result = formatCredentialsForClipboard({
      projectName: 'Docs',
      url: 'https://docs.neodym.ai',
      username: '',
      password: '',
      notes: '',
    });

    expect(result).toBe('Project: Docs\nURL: https://docs.neodym.ai');
  });
});
