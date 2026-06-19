import Link from 'next/link';

import type { ClientGroup } from '@/lib/dashboard-data';

import { LogoutButton } from './logout-button';

const baseLinkClass = 'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition';
const activeLinkClass = 'border-blue-400/20 bg-blue-500/10 text-blue-100 shadow-lg shadow-blue-950/20';
const inactiveLinkClass = 'border-transparent text-slate-400 hover:border-blue-300/20 hover:bg-blue-400/5 hover:text-slate-100';

export function ClientGroupSidebar({
  clientGroups,
  selectedClientGroupId,
  auditActive = false,
  ssoActive = false,
}: {
  clientGroups: ClientGroup[];
  selectedClientGroupId?: string | null;
  auditActive?: boolean;
  ssoActive?: boolean;
}) {
  return (
    <aside className="hidden h-screen w-72 shrink-0 flex-col border-r border-blue-400/10 bg-slate-950/60 p-5 backdrop-blur-xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex">
      <div className="shrink-0">
        <Link href="/" className="block text-xl font-semibold tracking-tight text-white">
          Neodym<span className="text-blue-400">.</span>
        </Link>
        <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">Project Access</p>
      </div>

      <div className="mt-10 min-h-0 flex-1">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.28em] text-blue-300/70">Groups</h2>
        <nav aria-label="Client groups" className="mt-4 max-h-full space-y-2 overflow-y-auto pr-1">
          {clientGroups.map((group) => {
            const active = group.id === selectedClientGroupId && !auditActive;
            return (
              <Link
                key={group.id}
                href={`/?client=${group.id}`}
                className={[baseLinkClass, active ? activeLinkClass : inactiveLinkClass].join(' ')}
                aria-current={active ? 'page' : undefined}
              >
                <span>{group.name}</span>
                {active ? <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.9)]" /> : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 shrink-0 space-y-3">
        <Link
          href="/audit"
          className={[
            'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition',
            auditActive ? activeLinkClass : 'border-slate-800 text-slate-400 hover:border-blue-300/30 hover:text-blue-100',
          ].join(' ')}
          aria-current={auditActive ? 'page' : undefined}
        >
          <span>Audit Log</span>
          {auditActive ? <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.9)]" /> : null}
        </Link>
        <Link
          href="/sso-clients"
          className={[
            'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition',
            ssoActive ? activeLinkClass : 'border-slate-800 text-slate-400 hover:border-blue-300/30 hover:text-blue-100',
          ].join(' ')}
          aria-current={ssoActive ? 'page' : undefined}
        >
          <span>SSO Clients</span>
          {ssoActive ? <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.9)]" /> : null}
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}
