'use client';

import { useState } from 'react';

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
  auditActive = false,
  ssoActive = false,
  settingsActive = false,
}: {
  children: React.ReactNode;
  clientGroups?: ClientGroup[];
  selectedClientGroupId?: string | null;
  topbarActions?: React.ReactNode;
  auditActive?: boolean;
  ssoActive?: boolean;
  settingsActive?: boolean;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="relative min-h-screen">
        <ClientGroupSidebar
          clientGroups={clientGroups}
          selectedClientGroupId={selectedClientGroupId}
          auditActive={auditActive}
          ssoActive={ssoActive}
          settingsActive={settingsActive}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-slate-950/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        <main className="flex min-w-0 flex-1 flex-col lg:ml-72">
          <Topbar actions={topbarActions} settingsActive={settingsActive} onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex-1 px-5 pb-5 pt-32 sm:px-8 sm:pb-8 lg:px-10 lg:pb-10">{children}</div>
        </main>
      </div>
    </div>
  );
}
