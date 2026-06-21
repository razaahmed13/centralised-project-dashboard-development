import Link from 'next/link';

function SettingsIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5 transition-transform duration-500 group-hover:rotate-45"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

export function Topbar({
  actions,
  settingsActive = false,
  onMenuClick,
}: {
  actions?: React.ReactNode;
  settingsActive?: boolean;
  onMenuClick?: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-blue-400/10 bg-slate-950/80 px-5 py-4 backdrop-blur-xl sm:px-8 lg:left-72 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {onMenuClick && (
            <button
              type="button"
              onClick={onMenuClick}
              aria-label="Open sidebar"
              className="rounded-full border border-slate-800 p-2 text-slate-400 hover:border-blue-300/30 hover:bg-blue-400/5 hover:text-blue-100 lg:hidden"
            >
              <MenuIcon />
            </button>
          )}
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Neodym<span className="text-blue-400">.</span>{' '}
            <span className="font-normal text-slate-400">Project Dashboard</span>
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-wrap items-center gap-3">
            {actions ?? (
              <>
                <button className="rounded-full border border-blue-300/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-blue-300/50 hover:bg-blue-400/10">
                  Add Client
                </button>
                <button className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400">
                  Add Project
                </button>
              </>
            )}
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            className={[
              'group flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-200',
              settingsActive
                ? 'border-blue-400/20 bg-blue-500/10 text-blue-300 shadow-lg shadow-blue-950/20'
                : 'border-slate-800 text-slate-400 hover:border-blue-300/30 hover:bg-blue-400/5 hover:text-blue-100',
            ].join(' ')}
          >
            <SettingsIcon />
          </Link>
        </div>
      </div>
    </header>
  );
}
