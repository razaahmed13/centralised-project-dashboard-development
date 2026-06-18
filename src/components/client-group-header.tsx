import { deleteClientGroupAction, updateClientGroupAction } from '@/app/actions/dashboard';
import type { ClientGroup } from '@/lib/dashboard-data';

const inputClass = 'rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400';

export function ClientGroupHeader({ clientGroup }: { clientGroup: ClientGroup }) {
  const canShowRemoveClient = !clientGroup.isInternal;
  const hasProjects = clientGroup.projects.length > 0;

  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-300/80">{clientGroup.niche ?? 'Client group'}</p>
      <div data-testid="client-title-row" className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-white">{clientGroup.name}</h1>
        {canShowRemoveClient ? (
          <form action={deleteClientGroupAction}>
            <input type="hidden" name="clientGroupId" value={clientGroup.id} />
            <button
              type="submit"
              disabled={hasProjects}
              title={hasProjects ? 'Remove all projects in this client before deleting the client.' : 'Remove this client'}
              className="flex shrink-0 items-center justify-between rounded-2xl border border-red-500/20 px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-red-500/20 disabled:hover:bg-transparent disabled:hover:text-red-300"
            >
              <span>Remove Client</span>
            </button>
          </form>
        ) : null}
      </div>
      {clientGroup.description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{clientGroup.description}</p> : null}
      {!clientGroup.isInternal ? (
        <details className="mt-6 rounded-2xl border border-slate-800 p-4">
          <summary className="cursor-pointer text-sm font-medium text-slate-300">Edit client details</summary>
          <form action={updateClientGroupAction} className="mt-4 grid gap-3 md:grid-cols-3">
            <input type="hidden" name="clientGroupId" value={clientGroup.id} />
            <input name="name" required defaultValue={clientGroup.name} className={inputClass} />
            <input name="niche" required defaultValue={clientGroup.niche ?? ''} className={inputClass} />
            <input name="description" defaultValue={clientGroup.description ?? ''} className={inputClass} />
            <button className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400 md:col-span-3">Save client details</button>
          </form>
        </details>
      ) : null}
    </>
  );
}
