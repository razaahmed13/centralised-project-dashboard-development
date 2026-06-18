import { AppShell } from '@/components/app-shell';

export default function Home() {
  return (
    <AppShell>
      <section className="rounded-[2rem] border border-blue-400/20 bg-slate-950/60 p-8 shadow-2xl shadow-blue-950/30">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-300/80">Internal Projects</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Centralised Project Dashboard</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          A protected Neodym command center for project links, credentials, and client workspaces.
        </p>
        <div className="mt-10 rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center text-slate-400">
          No projects have been added to Internal Projects yet.
        </div>
      </section>
    </AppShell>
  );
}
