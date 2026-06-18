import type { ClientGroup } from '@/lib/dashboard-data';

import { ClientGroupSidebar } from './client-group-sidebar';
import { Topbar } from './topbar';

const defaultClientGroups: ClientGroup[] = [
  {
    id: 'internal-projects',
    name: 'Internal Projects',
    slug: 'internal-projects',
    niche: 'Internal Operations',
    description: null,
    isInternal: true,
    sortOrder: 0,
    projects: [],
  },
];

export function AppShell({
  children,
  clientGroups = defaultClientGroups,
  selectedClientGroupId = defaultClientGroups[0].id,
  topbarActions,
}: {
  children: React.ReactNode;
  clientGroups?: ClientGroup[];
  selectedClientGroupId?: string | null;
  topbarActions?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="relative flex min-h-screen">
        <ClientGroupSidebar clientGroups={clientGroups} selectedClientGroupId={selectedClientGroupId} />
        <main className="flex min-w-0 flex-1 flex-col">
          <Topbar actions={topbarActions} />
          <div className="flex-1 p-5 sm:p-8 lg:p-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
