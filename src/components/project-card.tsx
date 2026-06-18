'use client';

import { useId, useState } from 'react';
import { createPortal } from 'react-dom';

import { deleteProjectAction, updateProjectAction } from '@/app/actions/dashboard';
import type { ClientGroup, Project } from '@/lib/dashboard-data';

import { ProjectLinkButton } from './project-link-button';

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400';
const secondaryButtonClass =
  'rounded-full border border-blue-300/20 px-4 py-2 text-sm font-semibold text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-400/10 disabled:cursor-not-allowed disabled:opacity-60';
const dangerButtonClass =
  'rounded-2xl border border-red-500/20 px-4 py-3 text-sm font-medium text-red-300 transition hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-200';
const copyIconButtonClass =
  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-blue-300/20 text-blue-100 transition hover:border-blue-300/50 hover:bg-blue-400/10';

type CredentialDetails = {
  hasCredentials: boolean;
  username?: string | null;
  password?: string | null;
  notes?: string | null;
};

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

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="9" y="9" width="10" height="12" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
      <path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CopyIconButton({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: (label: string, value: string) => void }) {
  return (
    <button
      type="button"
      aria-label={copied ? `Copied ${label}` : `Copy ${label}`}
      title={copied ? 'Copied' : `Copy ${label}`}
      onClick={() => onCopy(label, value)}
      className={`${copyIconButtonClass} ${copied ? 'border-emerald-300/30 text-emerald-300' : ''}`}
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}

function ReadOnlyCopyField({ label, value, copied, onCopy }: { label: string; value: string; copied: boolean; onCopy: (label: string, value: string) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300">
        <span>{label}</span>
        <div className="mt-2 flex items-center gap-2">
          <input readOnly value={value} className={inputClass} />
          <CopyIconButton label={label.toLowerCase()} value={value} copied={copied} onCopy={onCopy} />
        </div>
      </label>
    </div>
  );
}

function DeleteConfirmation({ title, message, idName, idValue, onCancel }: { title: string; message: string; idName: string; idValue: string; onCancel: () => void }) {
  const titleId = useId();

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm sm:items-center">
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="my-auto w-full max-w-2xl rounded-[2rem] border border-red-400/25 bg-slate-950 p-5 shadow-2xl shadow-red-950/40 sm:p-6"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <h2 id={titleId} className="text-xl font-semibold text-white">
            {title}
          </h2>
          <button type="button" onClick={onCancel} className="rounded-full border border-slate-700 px-3 py-1 text-sm text-slate-300 hover:border-red-300/40">
            Close
          </button>
        </div>
        <p className="mt-5 text-sm text-slate-300">{message}</p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <form action={deleteProjectAction}>
            <input type="hidden" name={idName} value={idValue} />
            <button type="submit" className="rounded-full border border-red-400/25 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10">
              Confirm
            </button>
          </form>
          <button type="button" onClick={onCancel} className="rounded-full border border-emerald-400/25 px-4 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10">
            Cancel
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export function ProjectCard({ project, clientGroups }: { project: Project; clientGroups: ClientGroup[] }) {
  const primaryLink = project.links[0];
  const [modal, setModal] = useState<'details' | 'edit' | null>(null);
  const [credentials, setCredentials] = useState<CredentialDetails | null>(null);
  const [credentialStatus, setCredentialStatus] = useState<string | null>(null);
  const [copiedFields, setCopiedFields] = useState<string[]>([]);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  async function loadCredentials() {
    setCredentialStatus(null);
    setCredentials(null);

    if (!primaryLink?.hasCredentials) {
      setCredentials({ hasCredentials: false });
      return;
    }

    try {
      const response = await fetch(`/api/project-links/${primaryLink.id}/credentials`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load credentials.');
      const payload = (await response.json()) as CredentialDetails;
      setCredentials(payload);
    } catch (error) {
      setCredentialStatus(error instanceof Error ? error.message : 'Unable to load credentials.');
    }
  }

  function openDetails() {
    setCopiedFields([]);
    setModal('details');
    void loadCredentials();
  }

  function openEdit() {
    setModal('edit');
    void loadCredentials();
  }

  async function closeAfterUpdate(formData: FormData) {
    await updateProjectAction(formData);
    setModal(null);
  }

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedFields((fields) => (fields.includes(label) ? fields : [...fields, label]));
  }

  return (
    <article className="rounded-[1.75rem] border border-blue-400/15 bg-slate-950/65 p-5 shadow-2xl shadow-blue-950/20 transition hover:border-blue-300/30">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-blue-300/70">{project.status}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{project.name}</h3>
        </div>
        {project.links.some((link) => link.hasCredentials) ? (
          <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
            Credentials stored
          </span>
        ) : null}
      </div>
      {project.description ? <p className="mt-3 text-sm leading-6 text-slate-400">{project.description}</p> : null}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {project.links.map((link) => (
          <ProjectLinkButton key={link.id} link={link} />
        ))}
        <button type="button" onClick={openDetails} className={secondaryButtonClass}>
          Show Details
        </button>
      </div>

      <div data-testid="project-card-actions" className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-800 pt-4">
        <button type="button" onClick={openEdit} className={secondaryButtonClass}>
          Edit project
        </button>
        <button type="button" onClick={() => setIsDeleteOpen(true)} className={dangerButtonClass}>
          Delete project
        </button>
      </div>

      {isDeleteOpen ? (
        <DeleteConfirmation
          title={`Delete ${project.name}`}
          message={`Delete ${project.name}? This cannot be undone.`}
          idName="projectId"
          idValue={project.id}
          onCancel={() => setIsDeleteOpen(false)}
        />
      ) : null}

      {modal === 'details' ? (
        <DialogShell title={`${project.name} Details`} onClose={() => setModal(null)}>
          <div className="mt-6 space-y-4">
            <ReadOnlyCopyField label="Project name" value={project.name} copied={copiedFields.includes('project name')} onCopy={copyValue} />
            {primaryLink ? (
              <div>
                <p className="text-sm font-medium text-slate-300">Project link</p>
                <div className="mt-2 flex items-center gap-2">
                  <a href={primaryLink.url} target="_blank" rel="noreferrer" className="block min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-blue-200 hover:border-blue-300/50">
                    {primaryLink.url}
                  </a>
                  <CopyIconButton label="project link" value={primaryLink.url} copied={copiedFields.includes('project link')} onCopy={copyValue} />
                </div>
              </div>
            ) : null}
            {project.description ? <ReadOnlyCopyField label="Description" value={project.description} copied={copiedFields.includes('description')} onCopy={copyValue} /> : null}
            {credentialStatus ? <p role="alert" className="rounded-2xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm font-medium text-rose-200">{credentialStatus}</p> : null}
            {!credentials && !credentialStatus ? <p className="text-sm text-slate-400">Loading credentials…</p> : null}
            {credentials?.hasCredentials ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {credentials.username ? <ReadOnlyCopyField label="Username" value={credentials.username} copied={copiedFields.includes('username')} onCopy={copyValue} /> : null}
                {credentials.password ? <ReadOnlyCopyField label="Password" value={credentials.password} copied={copiedFields.includes('password')} onCopy={copyValue} /> : null}
              </div>
            ) : null}
            {credentials?.notes ? <ReadOnlyCopyField label="Access notes" value={credentials.notes} copied={copiedFields.includes('access notes')} onCopy={copyValue} /> : null}
            {credentials && !credentials.hasCredentials ? <p className="rounded-2xl border border-slate-800 p-4 text-sm text-slate-400">No credentials stored for this project.</p> : null}
          </div>
        </DialogShell>
      ) : null}

      {modal === 'edit' ? (
        <DialogShell title={`Edit ${project.name}`} onClose={() => setModal(null)}>
          <form action={closeAfterUpdate} className="mt-6 space-y-4">
            <input type="hidden" name="projectId" value={project.id} />
            <Field label="Client">
              <select name="clientGroupId" defaultValue={project.clientGroupId} className={inputClass}>
                {clientGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Project name">
              <input name="name" required defaultValue={project.name} className={inputClass} />
            </Field>
            <Field label="Project link">
              <input name="url" required type="url" defaultValue={primaryLink?.url ?? ''} className={inputClass} />
            </Field>
            <Field label="Description">
              <textarea name="description" rows={2} defaultValue={project.description ?? ''} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Credential email / username">
                <input name="username" defaultValue={credentials?.username ?? ''} className={inputClass} placeholder="hello@neodym.ai" />
              </Field>
              <Field label="Credential password">
                <input name="password" type="password" defaultValue={credentials?.password ?? ''} className={inputClass} placeholder="Stored encrypted" />
              </Field>
            </div>
            <Field label="Access notes">
              <textarea name="accessNotes" rows={3} defaultValue={credentials?.notes ?? ''} className={inputClass} placeholder="Any extra login notes." />
            </Field>
            <button className="w-full rounded-full bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400">Update Project</button>
          </form>
        </DialogShell>
      ) : null}
    </article>
  );
}
