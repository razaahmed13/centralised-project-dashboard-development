import { NextResponse, type NextRequest } from 'next/server';

import { getSupabaseAdminClient } from '@/lib/db';
import { requireAdminSession } from '@/lib/session';

function generateToken(): { full: string; prefix: string } {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomBytes = new Uint8Array(40);
  crypto.getRandomValues(randomBytes);
  const key = Array.from(randomBytes).map((b) => chars[b % chars.length]).join('');
  const prefix = `neo_${key.slice(0, 8)}`;
  return { full: `neo_${key}`, prefix };
}

async function hashToken(token: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function GET() {
  await requireAdminSession();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('extension_api_tokens')
    .select('id, label, token_prefix, created_by, last_used_at, expires_at, is_active, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tokens: data });
}

export async function POST(request: NextRequest) {
  const session = await requireAdminSession();
  const supabase = getSupabaseAdminClient();
  const body = await request.json().catch(() => ({}));

  const label = typeof body.label === 'string' && body.label.trim().length > 0
    ? body.label.trim().slice(0, 120)
    : 'Extension Token';

  const expiresInDays = typeof body.expiresInDays === 'number' && body.expiresInDays > 0
    ? body.expiresInDays
    : null;

  const { full: token, prefix } = generateToken();
  const tokenHash = await hashToken(token);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error } = await supabase.from('extension_api_tokens').insert({
    label,
    token_hash: tokenHash,
    token_prefix: prefix,
    created_by: session.user?.email ?? 'unknown',
    expires_at: expiresAt,
    is_active: true,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    token,
    prefix,
    label,
    expires_at: expiresAt,
    message: 'Make sure to copy this token now. You will not be able to see it again.',
  });
}