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
  settingsActive = false,
  isOpen = false,
  onClose,
}: {
  clientGroups: ClientGroup[];
  selectedClientGroupId?: string | null;
  auditActive?: boolean;
  ssoActive?: boolean;
  settingsActive?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside
      className={[
        'h-screen w-72 shrink-0 flex-col border-r border-blue-400/10 bg-slate-950/95 p-5 backdrop-blur-xl transition-all duration-300 lg:bg-slate-950/60',
        'fixed inset-y-0 left-0 z-40 flex lg:z-20 lg:flex',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      ].join(' ')}
    >
      <div className="flex items-center justify-between shrink-0">
        <div>
          <Link href="/" className="block text-xl font-semibold tracking-tight text-white" onClick={onClose}>
            Neodym<span className="text-blue-400">.</span>
          </Link>
          <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">Project Access</p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close sidebar"
            className="rounded-full border border-slate-800 p-1.5 text-slate-400 hover:border-blue-300/30 hover:bg-blue-400/5 hover:text-blue-100 lg:hidden"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
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
                onClick={onClose}
              >
                <span>{group.name}</span>
                {active ? <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.9)]" /> : null}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-6 shrink-0 space-y-3">
        <LogoutButton />
      </div>
    </aside>
  );
}
