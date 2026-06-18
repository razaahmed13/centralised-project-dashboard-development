import { NextResponse, type NextRequest } from 'next/server';

import { createAuditLog } from '@/lib/audit';
import { decryptSecret } from '@/lib/crypto';
import { getSupabaseAdminClient } from '@/lib/db';
import { formatCredentialsForClipboard } from '@/lib/format-credentials';
import { requireAdminSession } from '@/lib/session';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function decryptNullable(value: string | null | undefined, key: string) {
  return value ? decryptSecret(value, key) : null;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession();
  const { id } = await context.params;
  const key = process.env.CREDENTIAL_ENCRYPTION_KEY;

  if (!key) {
    return NextResponse.json({ error: 'Credential encryption key is not configured.' }, { status: 500 });
  }

  const supabase = getSupabaseAdminClient();
  const { data: linkRows, error: linkError } = await supabase
    .from('project_links')
    .select('id,label,url,project_id,projects(name)')
    .eq('id', id)
    .limit(1);

  if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
  const link = linkRows?.[0] as { id: string; label: string; url: string; project_id: string; projects?: { name?: string } | { name?: string }[] } | undefined;

  if (!link) return NextResponse.json({ error: 'Project link not found.' }, { status: 404 });

  const { data: credentialRows, error: credentialError } = await supabase
    .from('project_credentials')
    .select('username_encrypted,password_encrypted,notes_encrypted')
    .eq('project_link_id', id)
    .limit(1);

  if (credentialError) return NextResponse.json({ error: credentialError.message }, { status: 500 });
  const credential = credentialRows?.[0];

  if (!credential) {
    return NextResponse.json({ hasCredentials: false, formatted: null });
  }

  const username = decryptNullable(credential.username_encrypted, key);
  const password = decryptNullable(credential.password_encrypted, key);
  const notes = decryptNullable(credential.notes_encrypted, key);
  const projectName = Array.isArray(link.projects) ? link.projects[0]?.name : link.projects?.name;
  const formatted = formatCredentialsForClipboard({
    projectName: projectName ?? link.label,
    url: link.url,
    username,
    password,
    notes,
  });

  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'credential_copy',
    entityType: 'project_link',
    entityId: id,
    summary: `Credentials accessed for ${projectName ?? link.label}`,
  });

  return NextResponse.json({ hasCredentials: true, formatted, username, password, notes });
}
