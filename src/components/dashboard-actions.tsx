'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';

import {
  createClientGroupAction,
  createProjectWithLinkAction,
} from '@/app/actions/dashboard';
import type { ClientGroup } from '@/lib/dashboard-data';

function DialogShell({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const titleId = useId();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-xl overflow-y-auto rounded-[2rem] border border-blue-400/20 bg-slate-950 p-5 shadow-2xl shadow-blue-950/50 sm:p-6"
      >
        <div className="sticky top-0 z-10 -mx-5 -mt-5 flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/95 px-5 py-5 backdrop-blur sm:-mx-6 sm:-mt-6 sm:px-6">
          <h2 id={titleId} className="text-xl font-semibold text-white">{title}</h2>
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

const inputClass = 'w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-400';

export function DashboardActions({ clientGroups }: { clientGroups: ClientGroup[] }) {
  const [modal, setModal] = useState<'client' | 'project' | null>(null);

  async function closeAfterCreateClient(formData: FormData) {
    await createClientGroupAction(formData);
    setModal(null);
  }

  async function closeAfterCreateProject(formData: FormData) {
    await createProjectWithLinkAction(formData);
    setModal(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModal('client')}
        className="rounded-full border border-blue-300/20 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-blue-300/50 hover:bg-blue-400/10"
      >
        Add Client
      </button>
      <button
        type="button"
        onClick={() => setModal('project')}
        className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400"
      >
        Add Project
      </button>

      {modal === 'client' ? (
        <DialogShell title="Add Client" onClose={() => setModal(null)}>
          <form action={closeAfterCreateClient} className="mt-6 space-y-4">
            <Field label="Client name">
              <input name="name" required className={inputClass} placeholder="Client name" />
            </Field>
            <Field label="Niche / industry">
              <input name="niche" required className={inputClass} placeholder="AI, legal, ecommerce..." />
            </Field>
            <Field label="Short description (optional)">
              <textarea name="description" rows={3} className={inputClass} placeholder="Very short context for this client." />
            </Field>
            <button className="w-full rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400">
              Save Client
            </button>
          </form>
        </DialogShell>
      ) : null}

      {modal === 'project' ? (
        <DialogShell title="Add Project" onClose={() => setModal(null)}>
          <form action={closeAfterCreateProject} className="mt-6 space-y-4">
            <Field label="Client">
              <select name="clientGroupId" required className={inputClass}>
                {clientGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Project name">
              <input name="name" required className={inputClass} placeholder="Project name" />
            </Field>
            <Field label="Project link">
              <input name="url" type="url" required className={inputClass} placeholder="https://..." />
            </Field>
            <Field label="Short description (optional)">
              <textarea name="description" rows={2} className={inputClass} placeholder="What this project is for." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Credential email / username">
                <input name="username" className={inputClass} placeholder="hello@neodym.ai" />
              </Field>
              <Field label="Credential password">
                <input name="password" type="password" className={inputClass} placeholder="Stored encrypted" />
              </Field>
            </div>
            <Field label="Access notes (optional)">
              <textarea name="accessNotes" rows={3} className={inputClass} placeholder="Any extra login notes." />
            </Field>
            <button className="w-full rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400">
              Save Project
            </button>
          </form>
        </DialogShell>
      ) : null}
    </>
  );
}
