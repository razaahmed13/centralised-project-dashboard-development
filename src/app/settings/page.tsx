import Link from 'next/link';

import { createSsoClientAction, updateSsoClientStatusAction } from '@/app/actions/sso-clients';
import { AppShell } from '@/components/app-shell';
import { AuditLogTable } from '@/components/audit-log-table';
import { getAuditLogs, type AuditLog } from '@/lib/audit';
import { getClientGroupsForSidebar } from '@/lib/dashboard-data';
import { requirePageSession } from '@/lib/session';
import { getSsoClients, type SsoClientAdminRow } from '@/lib/sso/admin';

import { ExtensionSettings } from './client';

export const metadata = { title: 'Settings – Neodym Dashboard' };

function ClientCard({ client }: { client: SsoClientAdminRow }) {
  return (
    <article className="rounded-3xl border border-blue-400/15 bg-slate-950/70 p-5 shadow-xl shadow-blue-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-white">{client.name}</h2>
            <form action={updateSsoClientStatusAction}>
              <input type="hidden" name="clientId" value={client.id} />
              <input type="hidden" name="clientName" value={client.name} />
              <input type="hidden" name="isActive" value={client.is_active ? 'false' : 'true'} />
              <button
                type="submit"
                className={client.is_active
                  ? 'rounded-2xl border border-rose-300/30 px-3 py-1.5 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/10'
                  : 'rounded-2xl border border-emerald-300/30 px-3 py-1.5 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-400/10'}
              >
                {client.is_active ? 'Disable client' : 'Enable client'}
              </button>
            </form>
          </div>
          <p className="mt-1 font-mono text-xs text-blue-200">{client.client_id}</p>
        </div>
        <span className={client.is_active ? 'rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200' : 'rounded-full bg-slate-700/60 px-3 py-1 text-xs text-slate-300'}>
          {client.is_active ? 'Active' : 'Disabled'}
        </span>
      </div>
      <div className="mt-5 space-y-4 text-sm text-slate-300">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-blue-300/70">Redirect URIs</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
            {client.allowed_redirect_uris.map((uri) => <li key={uri}>{uri}</li>)}
          </ul>
        </div>
        {client.fallback_login_uri ? (
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue-300/70">Fallback/Login URI</p>
            <p className="mt-2 font-mono text-xs text-slate-300">{client.fallback_login_uri}</p>
          </div>
        ) : null}
        {client.allowed_origins.length > 0 ? (
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-blue-300/70">Origins</p>
            <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
              {client.allowed_origins.map((origin) => <li key={origin}>{origin}</li>)}
            </ul>
          </div>
        ) : null}
      </div>
    </article>
  );
}

export default async function SettingsPage({ searchParams }: { searchParams?: Promise<{ tab?: string }> }) {
  await requirePageSession('/settings');
  const params = await searchParams;
  const tab = params?.tab || 'extension';

  let clientGroups = await getClientGroupsForSidebar();
  let ssoClients: SsoClientAdminRow[] = [];
  let auditLogs: AuditLog[] = [];
  let loadError: Error | null = null;

  try {
    if (tab === 'sso') {
      ssoClients = await getSsoClients();
    } else if (tab === 'audit') {
      auditLogs = await getAuditLogs();
    }
  } catch (error) {
    loadError = error instanceof Error ? error : new Error('Unable to load settings data.');
  }

  const activeTabClass = 'border-blue-400/20 bg-blue-500/10 text-blue-100 shadow-lg shadow-blue-950/20';
  const inactiveTabClass = 'border-slate-800 text-slate-400 hover:border-blue-300/30 hover:text-blue-100';

  return (
    <AppShell clientGroups={clientGroups} selectedClientGroupId={null} settingsActive={true}>
      <section className="rounded-[2rem] border border-blue-400/20 bg-slate-950/60 p-8 shadow-2xl shadow-blue-950/30">
        <h1 className="text-4xl font-semibold tracking-tight text-white">System Settings</h1>
        <p className="mt-2 text-sm text-slate-400">
          Manage system configurations, SSO applications, and security audit logs.
        </p>

        {/* Tab navigation */}
        <nav aria-label="Settings tabs" className="mt-8 flex flex-wrap gap-2 border-b border-slate-800 pb-5">
          <Link
            href="/settings?tab=extension"
            className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
              tab === 'extension' ? activeTabClass : inactiveTabClass
            }`}
          >
            Extension Settings
          </Link>
          <Link
            href="/settings?tab=sso"
            className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
              tab === 'sso' ? activeTabClass : inactiveTabClass
            }`}
          >
            SSO Clients
          </Link>
          <Link
            href="/settings?tab=audit"
            className={`flex items-center justify-between rounded-2xl border px-4 py-2.5 text-sm font-medium transition ${
              tab === 'audit' ? activeTabClass : inactiveTabClass
            }`}
          >
            Audit Log
          </Link>
        </nav>

        <div className="mt-8">
          {loadError ? (
            <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
              {loadError.message}
            </div>
          ) : (
            <>
              {tab === 'extension' && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Extension Settings</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Manage API tokens for the Neodym Dashboard browser extension.
                    </p>
                  </div>
                  <div className="pt-2">
                    <ExtensionSettings />
                  </div>
                </div>
              )}

              {tab === 'sso' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">SSO Clients</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Register internal Neodym tools that may use the dashboard as a private OAuth-style authorization authority.
                    </p>
                  </div>

                  <form action={createSsoClientAction} className="grid gap-4 rounded-3xl border border-blue-400/10 bg-slate-900/70 p-5 md:grid-cols-2">
                    <label className="space-y-2 text-sm text-slate-300">
                      <span>Client ID</span>
                      <input name="clientId" required placeholder="token-watcher" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300">
                      <span>App name</span>
                      <input name="name" required placeholder="Token Watcher" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-400" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                      <span>Allowed redirect URIs, one per line</span>
                      <textarea name="allowedRedirectUris" required rows={3} placeholder="https://tokenwatcher.neodym.ai/auth/callback" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-blue-400" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                      <span>Fallback/Login URI</span>
                      <input name="fallbackLoginUri" type="url" required placeholder="https://tokenwatcher.neodym.ai/login" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-blue-400" />
                    </label>
                    <label className="space-y-2 text-sm text-slate-300 md:col-span-2">
                      <span>Allowed origins, one per line</span>
                      <textarea name="allowedOrigins" rows={2} placeholder="https://tokenwatcher.neodym.ai" className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white outline-none focus:border-blue-400" />
                    </label>
                    <label className="flex items-center gap-3 text-sm text-slate-300">
                      <input name="isActive" type="checkbox" defaultChecked className="h-4 w-4" />
                      Active client
                    </label>
                    <div className="md:col-span-2">
                      <button type="submit" className="rounded-2xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition hover:bg-blue-400">
                        Register SSO Client
                      </button>
                    </div>
                  </form>

                  <div className="grid gap-4 xl:grid-cols-2">
                    {ssoClients.map((client) => <ClientCard key={client.id} client={client} />)}
                  </div>
                </div>
              )}

              {tab === 'audit' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">Security Audit Log</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Recent dashboard changes and credential-copy events. Sensitive credentials are never displayed here.
                    </p>
                  </div>
                  <AuditLogTable logs={auditLogs} />
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}