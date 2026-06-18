import Link from 'next/link';

import type { ClientGroup } from '@/lib/dashboard-data';

export function ClientGroupSidebar({
  clientGroups,
  selectedClientGroupId,
}: {
  clientGroups: ClientGroup[];
  selectedClientGroupId?: string | null;
}) {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-blue-400/10 bg-slate-950/60 p-5 backdrop-blur-xl lg:block">
      <Link href="/" className="block text-xl font-semibold tracking-tight text-white">
        Neodym<span className="text-blue-400">.</span>
      </Link>
      <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">Project Access</p>

      <nav aria-label="Client groups" className="mt-10 space-y-2">
        {clientGroups.map((group) => {
          const active = group.id === selectedClientGroupId;
          return (
            <Link
              key={group.id}
              href={`/?client=${group.id}`}
              className={[
                'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition',
                active
                  ? 'border-blue-400/20 bg-blue-500/10 text-blue-100 shadow-lg shadow-blue-950/20'
                  : 'border-transparent text-slate-400 hover:border-blue-300/20 hover:bg-blue-400/5 hover:text-slate-100',
              ].join(' ')}
              aria-current={active ? 'page' : undefined}
            >
              <span>{group.name}</span>
              {active ? <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.9)]" /> : null}
            </Link>
          );
        })}
      </nav>
      <Link href="/audit" className="mt-8 block rounded-2xl border border-slate-800 px-4 py-3 text-sm text-slate-400 hover:border-blue-300/30 hover:text-blue-100">
        Audit Log
      </Link>
    </aside>
  );
}
