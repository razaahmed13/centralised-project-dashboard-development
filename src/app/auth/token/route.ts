import { NextResponse } from 'next/server';
import { z } from 'zod';

import { redeemSsoAuthorizationCode } from '@/lib/sso/store';
import { createSsoToken, getSsoConfig } from '@/lib/sso/tokens';

const tokenRequestSchema = z.object({
  grant_type: z.literal('authorization_code'),
  client_id: z.string().min(1),
  code: z.string().min(1),
  redirect_uri: z.string().url(),
  code_verifier: z.string().min(16),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  const parsed = tokenRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  try {
    const row = await redeemSsoAuthorizationCode({
      code: parsed.data.code,
      clientId: parsed.data.client_id,
      redirectUri: parsed.data.redirect_uri,
      codeVerifier: parsed.data.code_verifier,
    });

    if (!row.user_email) {
      return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
    }

    const accessToken = await createSsoToken({
      clientId: parsed.data.client_id,
      userEmail: row.user_email,
      userName: row.user_name,
    });

    return NextResponse.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: getSsoConfig().tokenTtlSeconds,
      user: {
        email: row.user_email,
        name: row.user_name,
      },
    });
  } catch {
    return NextResponse.json({ error: 'invalid_grant' }, { status: 400 });
  }
}
