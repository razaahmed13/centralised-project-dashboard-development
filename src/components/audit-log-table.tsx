import type { AuditLog } from '@/lib/audit';

export function AuditLogTable({ logs }: { logs: AuditLog[] }) {
  if (!logs.length) {
    return <div className="mt-8 rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No audit events yet.</div>;
  }

  return (
    <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.2em] text-slate-500">
          <tr>
            <th className="px-4 py-3">When</th>
            <th className="px-4 py-3">Actor</th>
            <th className="px-4 py-3">Action</th>
            <th className="px-4 py-3">Entity</th>
            <th className="px-4 py-3">Summary</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800 text-slate-300">
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="px-4 py-3 text-slate-400">{new Date(log.created_at).toLocaleString()}</td>
              <td className="px-4 py-3">{log.actor}</td>
              <td className="px-4 py-3 text-blue-200">{log.action}</td>
              <td className="px-4 py-3">{log.entity_type}</td>
              <td className="px-4 py-3">{log.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
