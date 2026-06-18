import { AppShell } from '@/components/app-shell';
import { AuditLogTable } from '@/components/audit-log-table';
import { getAuditLogs, type AuditLog } from '@/lib/audit';
import { getClientGroupsForSidebar, type ClientGroup } from '@/lib/dashboard-data';
import { requirePageSession } from '@/lib/session';

export default async function AuditPage() {
  await requirePageSession('/audit');

  let logs: AuditLog[] = [];
  let clientGroups: ClientGroup[] | undefined;
  let loadError: Error | null = null;

  try {
    [logs, clientGroups] = await Promise.all([getAuditLogs(), getClientGroupsForSidebar()]);
  } catch (error) {
    loadError = error instanceof Error ? error : new Error('Unable to load audit events.');
  }

  if (loadError) {
    return (
      <AppShell clientGroups={clientGroups} selectedClientGroupId={null} auditActive>
        <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-8 text-amber-50">
          <h1 className="text-3xl font-semibold">Audit log unavailable</h1>
          <p className="mt-4 text-sm">{loadError.message}</p>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell clientGroups={clientGroups} selectedClientGroupId={null} auditActive>
      <section className="rounded-[2rem] border border-blue-400/20 bg-slate-950/60 p-8 shadow-2xl shadow-blue-950/30">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-blue-300/80">Admin activity</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">Audit Log</h1>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-300">
          Recent dashboard changes and credential-copy events. Sensitive credential values are never displayed here.
        </p>
        <AuditLogTable logs={logs} />
      </section>
    </AppShell>
  );
}
