import { describe, expect, it } from 'vitest';

import { authOptions } from './auth';

describe('authOptions', () => {
  it('routes auth errors back to the styled login page', () => {
    expect(authOptions.pages?.signIn).toBe('/login');
    expect(authOptions.pages?.error).toBe('/login');
  });
});
