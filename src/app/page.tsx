import { AppShell } from '@/components/app-shell';
import { ClientGroupHeader } from '@/components/client-group-header';
import { DashboardActions } from '@/components/dashboard-actions';
import { ProjectCard } from '@/components/project-card';
import { getDashboardData, type DashboardData } from '@/lib/dashboard-data';
import { requirePageSession } from '@/lib/session';

export default async function Home({ searchParams }: { searchParams?: Promise<{ client?: string }> }) {
  await requirePageSession('/');

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
        {selected ? <ClientGroupHeader clientGroup={selected} /> : <h1 className="text-4xl font-semibold tracking-tight text-white">Centralised Project Dashboard</h1>}

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
