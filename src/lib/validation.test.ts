import { describe, expect, it } from 'vitest';

import {
  clientGroupInputSchema,
  projectWithLinkInputSchema,
} from './validation';

describe('dashboard form validation', () => {
  it('accepts a client group name, niche, and optional short description', () => {
    const result = clientGroupInputSchema.parse({
      name: 'Triangle IP',
      niche: 'Legal technology',
      description: 'Patent disclosure tooling.',
    });

    expect(result.name).toBe('Triangle IP');
    expect(result.niche).toBe('Legal technology');
  });

  it('rejects empty client group names', () => {
    expect(() => clientGroupInputSchema.parse({ name: ' ', niche: 'AI' })).toThrow();
  });

  it('accepts a project with a valid URL, selected client group, credentials, and notes', () => {
    const result = projectWithLinkInputSchema.parse({
      clientGroupId: '11111111-1111-4111-8111-111111111111',
      name: 'Token Tracker',
      description: 'Usage dashboard.',
      url: 'https://token.neodym.ai',
      username: 'hello@neodym.ai',
      password: 'secret-password',
      accessNotes: 'Use shared admin account.',
    });

    expect(result.url).toBe('https://token.neodym.ai/');
  });

  it('rejects invalid project URLs', () => {
    expect(() =>
      projectWithLinkInputSchema.parse({
        clientGroupId: '11111111-1111-4111-8111-111111111111',
        name: 'Bad Link',
        url: 'not-a-url',
      }),
    ).toThrow();
  });
});
