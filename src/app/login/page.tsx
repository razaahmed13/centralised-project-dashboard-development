import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { authOptions } from '@/auth';
import { LoginPanel } from '@/components/login-panel';

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect('/');

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020817] px-6 text-white">
      <LoginPanel />
    </main>
  );
}
