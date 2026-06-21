import { NextResponse, type NextRequest } from 'next/server';

import { decryptSecret } from '@/lib/crypto';
import { getSupabaseAdminClient } from '@/lib/db';
import { createAuditLog } from '@/lib/audit';

type RouteContext = {
  params: Promise<{ linkId: string }>;
};

async function validateExtensionToken(request: NextRequest): Promise<{ error?: string; email?: string }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: 'Missing or invalid authorization header.' };
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseAdminClient();

  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  const tokenHash = Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');

  const { data: tokenRows, error: tokenError } = await supabase
    .from('extension_api_tokens')
    .select('id, created_by, expires_at, is_active')
    .eq('token_hash', tokenHash)
    .limit(1);

  if (tokenError) return { error: tokenError.message };
  const tokenRecord = tokenRows?.[0];
  if (!tokenRecord) return { error: 'Invalid API token.' };
  if (!tokenRecord.is_active) return { error: 'API token is deactivated.' };
  if (tokenRecord.expires_at && new Date(tokenRecord.expires_at) < new Date()) {
    return { error: 'API token has expired.' };
  }

  await supabase.from('extension_api_tokens').update({ last_used_at: new Date().toISOString() }).eq('id', tokenRecord.id);

  return { email: tokenRecord.created_by };
}

function decryptNullable(value: string | null | undefined, key: string) {
  return value ? decryptSecret(value, key) : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { linkId } = await context.params;
  const validation = await validateExtensionToken(request);

  if (validation.error) {
    return NextResponse.json({ error: validation.error }, { status: 401 });
  }

  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!key) {
    return NextResponse.json({ error: 'Credential encryption key is not configured.' }, { status: 500 });
  }

  const supabase = getSupabaseAdminClient();

  const { data: linkRows, error: linkError } = await supabase
    .from('project_links')
    .select('id,label,url,project_id,projects!inner(name)')
    .eq('id', linkId)
    .limit(1);

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });

  const link = linkRows?.[0] as {
    id: string; label: string; url: string; project_id: string;
    projects?: { name?: string } | { name?: string }[];
  } | undefined;

  if (!link) return NextResponse.json({ error: 'Project link not found.' }, { status: 404 });

  const projectUrl = request.headers.get('X-Project-URL');
  if (projectUrl) {
    try {
      const reqHost = new URL(projectUrl).hostname;
      const linkHost = new URL(link.url).hostname;
      if (reqHost !== linkHost) {
        return NextResponse.json({ error: 'URL mismatch.' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid project URL.' }, { status: 400 });
    }
  }

  const { data: credentialRows, error: credentialError } = await supabase
    .from('project_credentials')
    .select('username_encrypted,password_encrypted,notes_encrypted')
    .eq('project_link_id', linkId)
    .limit(1);

  if (credentialError) return NextResponse.json({ error: credentialError.message }, { status: 500 });

  const credential = credentialRows?.[0];

  if (!credential) {
    const projectName = Array.isArray(link.projects) ? link.projects[0]?.name : link.projects?.name;
    return NextResponse.json({
      username: null,
      password: null,
      notes: null,
      hasCredentials: false,
      projectName: projectName ?? link.label,
      url: link.url,
    });
  }

  const username = decryptNullable(credential.username_encrypted, key);
  const password = decryptNullable(credential.password_encrypted, key);
  const notes = decryptNullable(credential.notes_encrypted, key);
  const projectName = Array.isArray(link.projects) ? link.projects[0]?.name : link.projects?.name;

  await createAuditLog({
    actor: validation.email ?? 'extension',
    action: 'credential_access',
    entityType: 'project_link',
    entityId: linkId,
    summary: `Extension accessed credentials for ${projectName ?? link.label}`,
  });

  return NextResponse.json({
    username,
    password,
    notes,
    hasCredentials: true,
    projectName: projectName ?? link.label,
    url: link.url,
  });
}