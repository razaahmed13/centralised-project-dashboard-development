import 'server-only';

import crypto from 'node:crypto';

export type SsoConfig = {
  issuer: string;
  tokenTtlSeconds: number;
  signingSecret: string;
};

type SsoTokenPayload = {
  iss: string;
  aud: string;
  sub: string;
  email: string;
  name?: string;
  iat: number;
  exp: number;
};

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function sign(input: string, secret: string) {
  return base64Url(crypto.createHmac('sha256', secret).update(input).digest());
}

export function getSsoConfig(): SsoConfig {
  const issuer = process.env.SSO_ISSUER_URL ?? process.env.NEXTAUTH_URL;
  const signingSecret = process.env.SSO_SIGNING_SECRET;
  const tokenTtlSeconds = Number(process.env.SSO_TOKEN_TTL_SECONDS ?? '900');

  if (!issuer) throw new Error('Missing SSO_ISSUER_URL environment variable.');
  if (!signingSecret) throw new Error('Missing SSO_SIGNING_SECRET environment variable.');
  if (!Number.isFinite(tokenTtlSeconds) || tokenTtlSeconds <= 0) throw new Error('Invalid SSO_TOKEN_TTL_SECONDS environment variable.');

  return { issuer, tokenTtlSeconds, signingSecret };
}

export async function createSsoToken(input: { clientId: string; userEmail: string; userName?: string | null }) {
  const config = getSsoConfig();
  const issuedAt = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload: SsoTokenPayload = {
    iss: config.issuer,
    aud: input.clientId,
    sub: input.userEmail,
    email: input.userEmail,
    name: input.userName ?? undefined,
    iat: issuedAt,
    exp: issuedAt + config.tokenTtlSeconds,
  };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  return `${unsigned}.${sign(unsigned, config.signingSecret)}`;
}

export async function verifySsoToken(token: string, audience: string): Promise<SsoTokenPayload> {
  const config = getSsoConfig();
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid SSO token.');
  const [encodedHeader, encodedPayload, signature] = parts;
  const unsigned = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = sign(unsigned, config.signingSecret);

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new Error('Invalid SSO token signature.');
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as SsoTokenPayload;
  if (payload.iss !== config.issuer) throw new Error('Invalid SSO token issuer.');
  if (payload.aud !== audience) throw new Error('Invalid SSO token audience.');
  if (payload.exp <= Math.floor(Date.now() / 1000)) throw new Error('Expired SSO token.');
  return payload;
}
