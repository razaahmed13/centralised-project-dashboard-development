import { updateClientGroupAction } from '@/app/actions/dashboard';
import { AppShell } from '@/components/app-shell';
import { DashboardActions } from '@/components/dashboard-actions';
import { ProjectCard } from '@/components/project-card';
import { getDashboardData, type DashboardData } from '@/lib/dashboard-data';

export default async function Home({ searchParams }: { searchParams?: Promise<{ client?: string }> }) {
  const params = await searchParams;
  let data: DashboardData | null = null;
  let loadError: Error | null = null;

  try {
    data = await getDashboardData(params?.client);
  } catch (error) {
    loadError = error instanceof Error ? error : new Error('Unable to load dashboard data.');
  }

  if (loadError || !data) {
    return (
      <AppShell>
        <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-8 text-amber-50">
          <p className="text-sm font-medium uppercase tracking-[0.3em]">Dashboard setup needed</p>
          <h1 className="mt-4 text-3xl font-semibold">Connect Supabase to load projects</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6">{loadError?.message}</p>
        </section>
      </AppShell>
    );
  }

  const selected = data.selectedClientGroup;

  return (
    <AppShell
      clientGroups={data.clientGroups}
      selectedClientGroupId={selected?.id}
      topbarActions={<DashboardActions clientGroups={data.clientGroups} />}
    >
      <section className="rounded-[2rem] border border-blue-400/20 bg-slate-950/60 p-8 shadow-2xl shadow-blue-950/30">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-300/80">{selected?.niche ?? 'Client group'}</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{selected?.name ?? 'Centralised Project Dashboard'}</h1>
        {selected?.description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{selected.description}</p> : null}
        {selected && !selected.isInternal ? (
          <details className="mt-6 rounded-2xl border border-slate-800 p-4">
            <summary className="cursor-pointer text-sm font-medium text-slate-300">Edit client details</summary>
            <form action={updateClientGroupAction} className="mt-4 grid gap-3 md:grid-cols-3">
              <input type="hidden" name="clientGroupId" value={selected.id} />
              <input name="name" required defaultValue={selected.name} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400" />
              <input name="niche" required defaultValue={selected.niche ?? ''} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400" />
              <input name="description" defaultValue={selected.description ?? ''} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400" />
              <button className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 md:col-span-3">Save client details</button>
            </form>
          </details>
        ) : null}

        {selected?.projects.length ? (
          <div className="mt-10 grid gap-5 xl:grid-cols-2">
            {selected.projects.map((project) => (
              <ProjectCard key={project.id} project={project} clientGroups={data.clientGroups} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-2xl border border-dashed border-slate-700/80 bg-slate-900/50 p-8 text-center text-slate-400">
            No projects have been added to {selected?.name ?? 'this client group'} yet.
          </div>
        )}
      </section>
    </AppShell>
  );
}
