import 'server-only';

import { getSupabaseAdminClient } from '@/lib/db';

import { createCodeHash, verifyPkceChallenge } from './pkce';

export type SsoClient = {
  client_id: string;
  name: string;
  client_secret_hash?: string | null;
  allowed_redirect_uris: string[];
  allowed_origins: string[];
  is_active: boolean;
};

export type SsoAuthorizationCodeRow = {
  code_hash: string;
  client_id: string;
  redirect_uri: string;
  user_email: string | null;
  user_name: string | null;
  provider: string | null;
  code_challenge: string;
  code_challenge_method: string;
  expires_at: string;
  used_at: string | null;
};

export function validateRedirectUri(client: Pick<SsoClient, 'allowed_redirect_uris'>, redirectUri: string) {
  return client.allowed_redirect_uris.includes(redirectUri);
}

function assertSupabase<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  if (!result.data) throw new Error('SSO record not found.');
  return result.data;
}

export async function getActiveSsoClient(clientId: string): Promise<SsoClient> {
  const supabase = getSupabaseAdminClient();
  const result = await supabase
    .from('sso_clients')
    .select('client_id,name,client_secret_hash,allowed_redirect_uris,allowed_origins,is_active')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .single();

  return assertSupabase<SsoClient>(result);
}

export async function createSsoAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  userEmail?: string | null;
  userName?: string | null;
  provider?: string | null;
  codeChallenge: string;
  codeChallengeMethod: string;
  expiresAt: Date;
}) {
  const supabase = getSupabaseAdminClient();
  const result = await supabase.from('sso_authorization_codes').insert({
    code_hash: createCodeHash(input.code),
    client_id: input.clientId,
    redirect_uri: input.redirectUri,
    user_email: input.userEmail ?? null,
    user_name: input.userName ?? null,
    provider: input.provider ?? 'dashboard',
    code_challenge: input.codeChallenge,
    code_challenge_method: input.codeChallengeMethod,
    expires_at: input.expiresAt.toISOString(),
  });

  if (result.error) throw new Error(result.error.message);
}

export async function redeemSsoAuthorizationCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  codeVerifier: string;
}): Promise<SsoAuthorizationCodeRow> {
  const supabase = getSupabaseAdminClient();
  const codeHash = createCodeHash(input.code);
  const result = await supabase
    .from('sso_authorization_codes')
    .select('code_hash,client_id,redirect_uri,user_email,user_name,provider,code_challenge,code_challenge_method,expires_at,used_at')
    .eq('code_hash', codeHash)
    .single();

  const row = assertSupabase<SsoAuthorizationCodeRow>(result);

  if (row.used_at) throw new Error('Authorization code was already used.');
  if (new Date(row.expires_at).getTime() <= Date.now()) throw new Error('Authorization code expired.');
  if (row.client_id !== input.clientId) throw new Error('Authorization code client mismatch.');
  if (row.redirect_uri !== input.redirectUri) throw new Error('Authorization code redirect URI mismatch.');
  if (!verifyPkceChallenge(input.codeVerifier, row.code_challenge, row.code_challenge_method)) {
    throw new Error('Invalid PKCE verifier.');
  }

  const updateResult = await supabase
    .from('sso_authorization_codes')
    .update({ used_at: new Date().toISOString() })
    .eq('code_hash', codeHash)
    .is('used_at', null);

  if (updateResult.error) throw new Error(updateResult.error.message);
  return row;
}
