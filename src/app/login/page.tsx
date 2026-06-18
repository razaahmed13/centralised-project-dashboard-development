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
    <main className="relative flex min-h-screen overflow-hidden bg-[#020817] text-white">
      {/* Subtle grid overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />

      {/* Left — Brand */}
      <div className="relative hidden flex-1 flex-col justify-between p-14 lg:flex xl:p-20">
        {/* Blue ambient glow */}
        <div className="pointer-events-none absolute left-0 top-1/2 h-[520px] w-[520px] -translate-y-1/2 rounded-full bg-blue-600/10 blur-[120px]" />

        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-blue-300/50">
            Internal Access
          </p>
        </div>

        <div className="relative">
          <h1 className="text-[clamp(4rem,8vw,7rem)] font-bold leading-none tracking-tight">
            Neodym<span className="text-blue-400">.</span>
          </h1>
          <p className="mt-1 text-[clamp(4rem,8vw,7rem)] font-bold leading-none tracking-tight text-slate-500">
            Project
          </p>
          <p className="mt-1 text-[clamp(4rem,8vw,7rem)] font-bold leading-none tracking-tight text-slate-600">
            Dashboard
          </p>
          <p className="mt-10 max-w-xs text-sm leading-7 text-slate-500">
            Centralised access hub for Neodym internal tools and client projects.
          </p>
        </div>

        <div className="relative">
          <p className="text-xs text-slate-700">© {new Date().getFullYear()} Neodym. All rights reserved.</p>
        </div>
      </div>

      {/* Vertical divider */}
      <div className="hidden lg:block w-px bg-gradient-to-b from-transparent via-blue-400/10 to-transparent" />

      {/* Right — Login Panel */}
      <div className="relative flex flex-1 items-center justify-center px-6 py-12 lg:max-w-[520px] xl:max-w-[560px]">
        <div className="w-full max-w-md">
          <LoginPanel authError={params?.error} />
        </div>
      </div>
    </main>
  );
}
