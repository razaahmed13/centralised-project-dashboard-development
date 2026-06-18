'use server';

import { revalidatePath } from 'next/cache';

import { createAuditLog } from '@/lib/audit';
import { createEncryptedCredentialPayload } from '@/lib/credential-payload';
import { getSupabaseAdminClient } from '@/lib/db';
import { requireAdminSession } from '@/lib/session';
import { clientGroupInputSchema, projectWithLinkInputSchema } from '@/lib/validation';

function getRequiredString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

async function assertSupabase<T>(result: { data: T | null; error: { message: string } | null }): Promise<T> {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

export async function createClientGroupAction(formData: FormData) {
  const session = await requireAdminSession();
  const input = clientGroupInputSchema.parse({
    name: getRequiredString(formData, 'name'),
    niche: getRequiredString(formData, 'niche'),
    description: getRequiredString(formData, 'description'),
  });

  const supabase = getSupabaseAdminClient();
  const inserted = await assertSupabase<{ id: string }[]>(
    await supabase
      .from('client_groups')
      .insert({
        name: input.name,
        slug: slugify(input.name),
        niche: input.niche,
        description: input.description,
        is_internal: false,
      })
      .select('id'),
  );

  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'create',
    entityType: 'client_group',
    entityId: inserted[0]?.id,
    summary: `Created client group ${input.name}`,
  });

  revalidatePath('/');
}

export async function updateClientGroupAction(formData: FormData) {
  const session = await requireAdminSession();
  const id = getRequiredString(formData, 'clientGroupId');
  const input = clientGroupInputSchema.parse({
    name: getRequiredString(formData, 'name'),
    niche: getRequiredString(formData, 'niche'),
    description: getRequiredString(formData, 'description'),
  });
  const supabase = getSupabaseAdminClient();

  await assertSupabase(
    await supabase
      .from('client_groups')
      .update({ name: input.name, niche: input.niche, description: input.description })
      .eq('id', id),
  );
  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'update',
    entityType: 'client_group',
    entityId: id,
    summary: `Updated client group ${input.name}`,
  });

  revalidatePath('/');
}

export async function deleteClientGroupAction(formData: FormData) {
  const session = await requireAdminSession();
  const id = getRequiredString(formData, 'clientGroupId');
  const supabase = getSupabaseAdminClient();

  const group = await assertSupabase<{ id: string; name: string; is_internal: boolean }[]>(
    await supabase.from('client_groups').select('id,name,is_internal').eq('id', id).limit(1),
  );
  const selectedGroup = group[0];

  if (!selectedGroup) throw new Error('Client group not found.');
  if (selectedGroup.is_internal) throw new Error('Internal Projects cannot be deleted.');

  const existingProjects = await assertSupabase<{ id: string }[]>(
    await supabase.from('projects').select('id').eq('client_group_id', id).limit(1),
  );

  if (existingProjects.length > 0) throw new Error('Remove all projects before deleting this client.');

  await assertSupabase(await supabase.from('client_groups').delete().eq('id', id));
  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'delete',
    entityType: 'client_group',
    entityId: id,
    summary: `Deleted client group ${selectedGroup.name}`,
  });

  revalidatePath('/');
}

export async function createProjectWithLinkAction(formData: FormData) {
  const session = await requireAdminSession();
  const input = projectWithLinkInputSchema.parse({
    clientGroupId: getRequiredString(formData, 'clientGroupId'),
    name: getRequiredString(formData, 'name'),
    description: getRequiredString(formData, 'description'),
    url: getRequiredString(formData, 'url'),
    username: getRequiredString(formData, 'username'),
    password: getRequiredString(formData, 'password'),
    accessNotes: getRequiredString(formData, 'accessNotes'),
  });

  const supabase = getSupabaseAdminClient();
  const projectRows = await assertSupabase<{ id: string }[]>(
    await supabase
      .from('projects')
      .insert({
        client_group_id: input.clientGroupId,
        name: input.name,
        description: input.description,
      })
      .select('id'),
  );
  const projectId = projectRows[0].id;

  const hasCredentials = Boolean(input.username || input.password || input.accessNotes);
  const linkRows = await assertSupabase<{ id: string }[]>(
    await supabase
      .from('project_links')
      .insert({
        project_id: projectId,
        label: 'Open Project',
        url: input.url,
        kind: 'app',
        has_credentials: hasCredentials,
      })
      .select('id'),
  );
  const linkId = linkRows[0].id;

  if (hasCredentials) {
    const payload = createEncryptedCredentialPayload(input);
    await assertSupabase(
      await supabase.from('project_credentials').insert({
        project_link_id: linkId,
        ...payload,
        updated_by: session.user?.email ?? null,
      }),
    );
  }

  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'create',
    entityType: 'project',
    entityId: projectId,
    summary: `Created project ${input.name}`,
  });

  revalidatePath('/');
}

export async function updateProjectAction(formData: FormData) {
  const session = await requireAdminSession();
  const id = getRequiredString(formData, 'projectId');
  const input = projectWithLinkInputSchema.pick({
    clientGroupId: true,
    name: true,
    description: true,
    url: true,
    username: true,
    password: true,
    accessNotes: true,
  }).parse({
    clientGroupId: getRequiredString(formData, 'clientGroupId'),
    name: getRequiredString(formData, 'name'),
    description: getRequiredString(formData, 'description'),
    url: getRequiredString(formData, 'url'),
    username: getRequiredString(formData, 'username'),
    password: getRequiredString(formData, 'password'),
    accessNotes: getRequiredString(formData, 'accessNotes'),
  });
  const supabase = getSupabaseAdminClient();

  await assertSupabase(
    await supabase
      .from('projects')
      .update({ client_group_id: input.clientGroupId, name: input.name, description: input.description })
      .eq('id', id),
  );

  const links = await assertSupabase<{ id: string }[]>(
    await supabase.from('project_links').select('id').eq('project_id', id).order('sort_order').limit(1),
  );
  const linkId = links[0]?.id;
  const hasCredentials = Boolean(input.username || input.password || input.accessNotes);

  if (linkId) {
    await assertSupabase(
      await supabase.from('project_links').update({ url: input.url, has_credentials: hasCredentials }).eq('id', linkId),
    );
    if (hasCredentials) {
      const payload = createEncryptedCredentialPayload(input);
      await assertSupabase(
        await supabase
          .from('project_credentials')
          .upsert({ project_link_id: linkId, ...payload, updated_by: session.user?.email ?? null }, { onConflict: 'project_link_id' }),
      );
    }
  }

  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'update',
    entityType: 'project',
    entityId: id,
    summary: `Updated project ${input.name}`,
  });

  revalidatePath('/');
}

export async function deleteProjectAction(formData: FormData) {
  const session = await requireAdminSession();
  const id = getRequiredString(formData, 'projectId');
  const supabase = getSupabaseAdminClient();
  const project = await assertSupabase<{ id: string; name: string }[]>(
    await supabase.from('projects').select('id,name').eq('id', id).limit(1),
  );

  await assertSupabase(await supabase.from('projects').delete().eq('id', id));
  await createAuditLog({
    actor: session.user?.email ?? undefined,
    action: 'delete',
    entityType: 'project',
    entityId: id,
    summary: `Deleted project ${project[0]?.name ?? id}`,
  });

  revalidatePath('/');
}
