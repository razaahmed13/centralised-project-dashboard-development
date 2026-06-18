export function Topbar({ actions }: { actions?: React.ReactNode }) {
  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-blue-400/10 bg-slate-950/80 px-5 py-4 backdrop-blur-xl sm:px-8 lg:left-72 lg:px-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white">
            Neodym<span className="text-blue-400">.</span>{' '}
            <span className="font-normal text-slate-400">Project Dashboard</span>
          </h2>
        </div>
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
      </div>
    </header>
  );
}
