import Link from 'next/link';

const clientGroups = [{ name: 'Internal Projects', href: '/', active: true }];

export function Sidebar() {
  return (
    <aside className="hidden w-72 shrink-0 border-r border-blue-400/10 bg-slate-950/60 p-5 backdrop-blur-xl lg:block">
      <Link href="/" className="block text-xl font-semibold tracking-tight text-white">
        Neodym<span className="text-blue-400">.</span>
      </Link>
      <p className="mt-2 text-xs uppercase tracking-[0.28em] text-slate-500">Project Access</p>

      <nav aria-label="Client groups" className="mt-10 space-y-2">
        {clientGroups.map((group) => (
          <Link
            key={group.name}
            href={group.href}
            className="flex items-center justify-between rounded-2xl border border-blue-400/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-100 shadow-lg shadow-blue-950/20"
            aria-current={group.active ? 'page' : undefined}
          >
            <span>{group.name}</span>
            <span className="h-2 w-2 rounded-full bg-blue-300 shadow-[0_0_18px_rgba(59,130,246,0.9)]" />
          </Link>
        ))}
      </nav>
    </aside>
  );
}
