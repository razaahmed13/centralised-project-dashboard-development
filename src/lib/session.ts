import 'server-only';

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';

export async function requireAdminSession() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    throw new Error('Admin session required.');
  }

  return session;
}

export async function getActorEmail() {
  const session = await requireAdminSession();
  return session.user?.email ?? 'unknown-admin';
}

export async function requirePageSession(callbackUrl = '/') {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  return session;
}
