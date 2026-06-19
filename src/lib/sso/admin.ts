import 'server-only';

import { getSupabaseAdminClient } from '@/lib/db';

export type SsoClientAdminRow = {
  id: string;
  client_id: string;
  name: string;
  allowed_redirect_uris: string[];
  fallback_login_uri: string | null;
  allowed_origins: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export async function getSsoClients(): Promise<SsoClientAdminRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('sso_clients')
    .select('id,client_id,name,allowed_redirect_uris,fallback_login_uri,allowed_origins,is_active,created_at,updated_at')
    .order('name');

  if (error) throw new Error(error.message);
  return data ?? [];
}
