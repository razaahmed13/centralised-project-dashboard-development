import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';
import { LoginPanel } from '@/components/login-panel';

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps = {}) {
  const session = await getServerSession(authOptions);
  if (session) redirect('/');

  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020817] px-6 text-white">
      <LoginPanel authError={params?.error} />
    </main>
  );
}
