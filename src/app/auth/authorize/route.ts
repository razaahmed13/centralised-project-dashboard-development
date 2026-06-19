import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { z } from 'zod';

import { authOptions } from '@/auth';
import { generateAuthorizationCode } from '@/lib/sso/pkce';
import { createSsoAuthorizationCode, getActiveSsoClient, validateRedirectUri } from '@/lib/sso/store';

const authorizeSchema = z.object({
  client_id: z.string().min(1),
  redirect_uri: z.string().url(),
  state: z.string().min(8),
  code_challenge: z.string().min(16),
  code_challenge_method: z.literal('S256').default('S256'),
});

function getCodeTtlSeconds() {
  const ttl = Number(process.env.SSO_CODE_TTL_SECONDS ?? '120');
  return Number.isFinite(ttl) && ttl > 0 ? ttl : 120;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = authorizeSchema.safeParse(Object.fromEntries(url.searchParams.entries()));

  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  let client;
  try {
    client = await getActiveSsoClient(parsed.data.client_id);
  } catch {
    return NextResponse.json({ error: 'invalid_client' }, { status: 400 });
  }

  if (!validateRedirectUri(client, parsed.data.redirect_uri)) {
    return NextResponse.json({ error: 'invalid_redirect_uri' }, { status: 400 });
  }

  const session = await getServerSession(authOptions);
  if (!session) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('callbackUrl', `${url.pathname}${url.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const code = generateAuthorizationCode();
  await createSsoAuthorizationCode({
    code,
    clientId: parsed.data.client_id,
    redirectUri: parsed.data.redirect_uri,
    userEmail: session.user?.email ?? null,
    userName: session.user?.name ?? null,
    provider: 'dashboard',
    codeChallenge: parsed.data.code_challenge,
    codeChallengeMethod: parsed.data.code_challenge_method,
    expiresAt: new Date(Date.now() + getCodeTtlSeconds() * 1000),
  });

  const callbackUrl = new URL(parsed.data.redirect_uri);
  callbackUrl.searchParams.set('code', code);
  callbackUrl.searchParams.set('state', parsed.data.state);
  return NextResponse.redirect(callbackUrl);
}
