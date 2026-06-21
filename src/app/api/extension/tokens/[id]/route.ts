import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseAdminClient } from '@/lib/db';
import { requireAdminSession } from '@/lib/session';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  await requireAdminSession();
  const { id } = await context.params;
  const supabase = getSupabaseAdminClient();

  const { error } = await supabase
    .from('extension_api_tokens')
    .update({ is_active: false })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}