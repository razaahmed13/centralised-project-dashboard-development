import { deleteProjectAction, updateProjectAction } from '@/app/actions/dashboard';
import type { ClientGroup, Project } from '@/lib/dashboard-data';

import { ProjectLinkButton } from './project-link-button';

const inputClass = 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none focus:border-blue-400';

export function ProjectCard({ project, clientGroups }: { project: Project; clientGroups: ClientGroup[] }) {
  const primaryLink = project.links[0];

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

      <div className="mt-6 flex flex-wrap gap-3">
        {project.links.map((link) => (
          <ProjectLinkButton key={link.id} link={link} />
        ))}
      </div>

      <details className="mt-6 rounded-2xl border border-slate-800 p-4">
        <summary className="cursor-pointer text-sm font-medium text-slate-300">Edit project</summary>
        <form action={updateProjectAction} className="mt-4 space-y-3">
          <input type="hidden" name="projectId" value={project.id} />
          <label className="block text-xs text-slate-400">
            Client
            <select name="clientGroupId" defaultValue={project.clientGroupId} className={inputClass}>
              {clientGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400">
            Name
            <input name="name" required defaultValue={project.name} className={inputClass} />
          </label>
          <label className="block text-xs text-slate-400">
            Link
            <input name="url" required type="url" defaultValue={primaryLink?.url ?? ''} className={inputClass} />
          </label>
          <label className="block text-xs text-slate-400">
            Description
            <textarea name="description" rows={2} defaultValue={project.description ?? ''} className={inputClass} />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs text-slate-400">
              Username
              <input name="username" className={inputClass} placeholder="Leave blank to keep no credentials" />
            </label>
            <label className="block text-xs text-slate-400">
              Password
              <input name="password" type="password" className={inputClass} placeholder="Re-enter to update" />
            </label>
          </div>
          <label className="block text-xs text-slate-400">
            Access notes
            <textarea name="accessNotes" rows={2} className={inputClass} placeholder="Re-enter notes to update" />
          </label>
          <button className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400">Save changes</button>
        </form>
      </details>

      <form action={deleteProjectAction} className="mt-4 border-t border-slate-800 pt-4">
        <input type="hidden" name="projectId" value={project.id} />
        <button className="text-xs font-medium text-rose-300 hover:text-rose-200">Delete project</button>
      </form>
    </article>
  );
}
