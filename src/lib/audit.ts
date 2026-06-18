import 'server-only';

import { getSupabaseAdminClient } from './db';
import { getActorEmail } from './session';

export type AuditLog = {
  id: string;
  actor: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
};

export async function createAuditLog(input: {
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  actor?: string;
}) {
  const supabase = getSupabaseAdminClient();
  const actor = input.actor ?? (await getActorEmail());

  const { error } = await supabase.from('audit_logs').insert({
    actor,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId ?? null,
    summary: input.summary,
  });

  if (error) throw new Error(error.message);
}

export async function getAuditLogs(limit = 100): Promise<AuditLog[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id,actor,action,entity_type,entity_id,summary,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}
