'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { createAuditLog } from '@/lib/audit';
import { getSupabaseAdminClient } from '@/lib/db';
import { requireAdminSession } from '@/lib/session';

const ssoClientSchema = z.object({
  clientId: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/),
  name: z.string().min(1),
  allowedRedirectUris: z.array(z.string().url()).min(1),
  fallbackLoginUri: z.string().url(),
  allowedOrigins: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true),
});

const ssoClientStatusSchema = z.object({
  clientId: z.string().uuid(),
  clientName: z.string().min(1),
  isActive: z.boolean(),
});

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function splitLines(value: string) {
  return value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

async function assertSupabase<T>(result: { data: T | null; error: { message: string } | null }): Promise<T> {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function createSsoClientAction(formData: FormData) {
  const session = await requireAdminSession();
  const input = ssoClientSchema.parse({
    clientId: getString(formData, 'clientId'),
    name: getString(formData, 'name'),
    allowedRedirectUris: splitLines(getString(formData, 'allowedRedirectUris')),
    fallbackLoginUri: getString(formData, 'fallbackLoginUri'),
    allowedOrigins: splitLines(getString(formData, 'allowedOrigins')),
    isActive: formData.get('isActive') === 'on',
  });

  const supabase = getSupabaseAdminClient();
  const inserted = await assertSupabase<{ id: string }[]>(
    await supabase
      .from('sso_clients')
      .insert({
        client_id: input.clientId,
        name: input.name,
        allowed_redirect_uris: input.allowedRedirectUris,
        fallback_login_uri: input.fallbackLoginUri,
        allowed_origins: input.allowedOrigins,
        is_active: input.isActive,
      })
      .select('id'),
  );
  const ssoClientRowId = inserted[0]?.id;

  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'sso_client_created',
    entityType: 'sso_client',
    entityId: ssoClientRowId,
    summary: `Registered SSO client ${input.name}`,
  });

  revalidatePath('/sso-clients');
}

export async function updateSsoClientStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const input = ssoClientStatusSchema.parse({
    clientId: getString(formData, 'clientId'),
    clientName: getString(formData, 'clientName'),
    isActive: getString(formData, 'isActive') === 'true',
  });

  const supabase = getSupabaseAdminClient();
  await assertSupabase(
    await supabase
      .from('sso_clients')
      .update({ is_active: input.isActive, updated_at: new Date().toISOString() })
      .eq('id', input.clientId),
  );

  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: input.isActive ? 'sso_client_enabled' : 'sso_client_disabled',
    entityType: 'sso_client',
    entityId: input.clientId,
    summary: `${input.isActive ? 'Enabled' : 'Disabled'} SSO client ${input.clientName}`,
  });

  revalidatePath('/sso-clients');
}
