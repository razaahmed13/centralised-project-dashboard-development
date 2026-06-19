import crypto from 'node:crypto';

function base64Url(input: Buffer) {
  return input.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

export function generateAuthorizationCode() {
  return base64Url(crypto.randomBytes(32));
}

export function createCodeHash(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function createPkceChallenge(verifier: string) {
  return base64Url(crypto.createHash('sha256').update(verifier).digest());
}

export function verifyPkceChallenge(verifier: string, expectedChallenge: string, method = 'S256') {
  if (method !== 'S256') return false;
  const actual = Buffer.from(createPkceChallenge(verifier));
  const expected = Buffer.from(expectedChallenge);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}
