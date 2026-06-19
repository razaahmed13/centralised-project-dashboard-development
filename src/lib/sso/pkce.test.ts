import { describe, expect, it } from 'vitest';

import { createCodeHash, generateAuthorizationCode, verifyPkceChallenge } from './pkce';

describe('SSO PKCE helpers', () => {
  it('generates opaque authorization codes and stores only deterministic hashes', () => {
    const first = generateAuthorizationCode();
    const second = generateAuthorizationCode();

    expect(first).not.toBe(second);
    expect(first.length).toBeGreaterThanOrEqual(43);
    expect(createCodeHash(first)).toMatch(/^[a-f0-9]{64}$/);
    expect(createCodeHash(first)).toBe(createCodeHash(first));
    expect(createCodeHash(first)).not.toBe(first);
  });

  it('validates S256 PKCE code challenges', () => {
    const verifier = 'correct-horse-battery-staple-verifier';
    const challenge = '0OMdJmsuqp2WFKpFxZeKAn_2LyAu4Tls6zheesnJDXE';

    expect(verifyPkceChallenge(verifier, challenge, 'S256')).toBe(true);
    expect(verifyPkceChallenge('wrong-verifier', challenge, 'S256')).toBe(false);
    expect(verifyPkceChallenge(verifier, challenge, 'plain')).toBe(false);
  });
});
