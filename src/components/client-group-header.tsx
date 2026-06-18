'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';

import { deleteClientGroupAction, updateClientGroupAction } from '@/app/actions/dashboard';
import type { ClientGroup } from '@/lib/dashboard-data';

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400';
const secondaryButtonClass =
  'rounded-full border border-blue-300/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:opacity-60';
const dangerButtonClass =
  'flex shrink-0 items-center justify-between rounded-2xl border border-red-500/20 px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-red-500/20 disabled:hover:bg-transparent disabled:hover:text-red-300';

function DialogShell({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  const titleId = useId();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-blue-400/20 bg-slate-950 p-5 shadow-2xl shadow-blue-950/50 sm:p-6"
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/95 px-5 py-5 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
          <h2 id={titleId} className="text-xl font-semibold text-white">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-blue-300/40">
            Close
          </button>
        </div>
        {children}
      </section>
    </div>,
    document.body,
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-300">
      <span>{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function DeleteClientConfirmation({ clientGroup, onCancel }: { clientGroup: ClientGroup; onCancel: () => void }) {
  const titleId = useId();

  return (
    <div role="alertdialog" aria-modal="false" aria-labelledby={titleId} className="mt-4 rounded-3xl border border-red-400/20 bg-slate-950/90 p-4 shadow-xl shadow-red-950/20">
      <h4 id={titleId} className="text-sm font-semibold text-white">
        Delete {clientGroup.name}
      </h4>
      <p className="mt-2 text-sm text-slate-300">Delete {clientGroup.name}? This cannot be undone.</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <form action={deleteClientGroupAction}>
          <input type="hidden" name="clientGroupId" value={clientGroup.id} />
          <button type="submit" className="rounded-full border border-red-400/25 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10">
            Confirm
          </button>
        </form>
        <button type="button" onClick={onCancel} className="rounded-full border border-emerald-400/25 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10">
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ClientGroupHeader({ clientGroup }: { clientGroup: ClientGroup }) {
  const canManageClient = !clientGroup.isInternal;
  const hasProjects = clientGroup.projects.length > 0;
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function closeAfterUpdate(formData: FormData) {
    await updateClientGroupAction(formData);
    setIsEditOpen(false);
  }

  return (
    <>
      <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-300/80">{clientGroup.niche ?? 'Client group'}</p>
      <div data-testid="client-title-row" className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-semibold tracking-tight text-white">{clientGroup.name}</h1>
        {canManageClient ? (
          <div data-testid="client-management-actions" className="flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setIsEditOpen(true)} className={secondaryButtonClass}>
              Edit Client
            </button>
            <button
              type="button"
              disabled={hasProjects}
              title={hasProjects ? 'Remove all projects in this client before deleting the client.' : 'Remove this client'}
              onClick={() => setIsDeleteOpen(true)}
              className={dangerButtonClass}
            >
              <span>Remove Client</span>
            </button>
          </div>
        ) : null}
      </div>
      {clientGroup.description ? <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">{clientGroup.description}</p> : null}

      {isDeleteOpen ? <DeleteClientConfirmation clientGroup={clientGroup} onCancel={() => setIsDeleteOpen(false)} /> : null}

      {isEditOpen ? (
        <DialogShell title={`Edit ${clientGroup.name}`} onClose={() => setIsEditOpen(false)}>
          <form action={closeAfterUpdate} className="mt-6 space-y-4">
            <input type="hidden" name="clientGroupId" value={clientGroup.id} />
            <Field label="Client name">
              <input name="name" required defaultValue={clientGroup.name} className={inputClass} />
            </Field>
            <Field label="Client niche">
              <input name="niche" required defaultValue={clientGroup.niche ?? ''} className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={3} defaultValue={clientGroup.description ?? ''} className={inputClass} />
            </Field>
            <button className="w-full rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400">Update Client</button>
          </form>
        </DialogShell>
      ) : null}
    </>
  );
}
