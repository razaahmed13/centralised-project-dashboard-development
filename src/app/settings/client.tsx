'use client';

import { useCallback, useEffect, useState } from 'react';

type TokenRow = {
  id: string;
  label: string;
  token_prefix: string;
  created_by: string;
  last_used_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

type NewTokenResponse = {
  token: string;
  prefix: string;
  label: string;
  expires_at: string | null;
  message: string;
};

const fieldClass = 'w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-blue-400';
const btnClass = 'rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:bg-blue-400 disabled:opacity-60';

const dangerBtnClass = 'rounded-2xl border border-red-500/20 px-4 py-2 text-sm font-medium text-red-300 transition hover:border-red-400/40 hover:bg-red-500/10';

export function ExtensionSettings() {
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTokenData, setNewTokenData] = useState<NewTokenResponse | null>(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [duration, setDuration] = useState(90);

  const fetchTokens = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/extension/tokens');
      if (!response.ok) throw new Error('Failed to load tokens');
      const data = await response.json();
      setTokens(data.tokens ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const aborted = { current: false };
    fetchTokens().catch(() => {});
    return () => { aborted.current = true; };
  }, [fetchTokens]);

  async function createToken() {
    setError(null);
    setNewTokenData(null);
    try {
      const response = await fetch('/api/extension/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: newLabel.trim() || 'Extension Token',
          expiresInDays: duration > 0 ? duration : null,
        }),
      });
      if (!response.ok) throw new Error('Failed to create token');
      const data: NewTokenResponse = await response.json();
      setNewTokenData(data);
      setShowNewForm(false);
      await fetchTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  async function revokeToken(id: string) {
    setError(null);
    try {
      const response = await fetch(`/api/extension/tokens/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to revoke token');
      await fetchTokens();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="mt-8 space-y-8">
      {error ? (
        <div className="rounded-2xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</div>
      ) : null}

      {newTokenData ? (
        <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5">
          <h3 className="text-sm font-semibold text-emerald-200">Token Created</h3>
          <p className="mt-1 text-xs text-emerald-300/80">{newTokenData.message}</p>
          <div className="mt-3">
            <label className="block text-xs font-medium text-emerald-200">Your API Token (copy now, won&apos;t be shown again)</label>
            <div className="mt-1 flex items-center gap-2">
              <input readOnly value={newTokenData.token} className="flex-1 rounded-xl border border-emerald-400/25 bg-slate-950 px-3 py-2 font-mono text-sm text-emerald-100" />
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(newTokenData.token)}
                className="rounded-xl border border-emerald-400/25 px-3 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10"
              >
                Copy
              </button>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-slate-300">
            <div><span className="text-slate-500">Label:</span> {newTokenData.label}</div>
            <div><span className="text-slate-500">Expires:</span> {formatDate(newTokenData.expires_at)}</div>
          </div>
          <button type="button" onClick={() => setNewTokenData(null)} className="mt-3 text-xs text-slate-400 hover:text-slate-200">Dismiss</button>
        </div>
      ) : null}

      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setShowNewForm(!showNewForm)} className={btnClass}>
          {showNewForm ? 'Cancel' : 'Generate New Token'}
        </button>
      </div>

      {showNewForm ? (
        <div className="rounded-2xl border border-blue-400/15 bg-slate-950/80 p-5">
          <h3 className="text-sm font-semibold text-white">New API Token</h3>
          <div className="mt-4 space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Label
              <input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="e.g. My Browser"
                className={`${fieldClass} mt-1`}
              />
            </label>
            <label className="block text-sm font-medium text-slate-300">
              Expires in (days, leave 0 for no expiry)
              <input
                type="number"
                min={0}
                max={365}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={`${fieldClass} mt-1`}
              />
            </label>
            <button type="button" onClick={createToken} className={btnClass}>
              Generate
            </button>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.24em] text-blue-300/70">Active Tokens</h2>

        {loading ? (
          <p className="mt-4 text-sm text-slate-400">Loading...</p>
        ) : tokens.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">No tokens yet. Generate one to use with the extension.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {tokens.map((token) => (
              <div key={token.id} className={`rounded-2xl border p-4 ${token.is_active ? 'border-blue-400/15 bg-slate-950/70' : 'border-slate-700/50 bg-slate-950/40'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{token.label}</span>
                      <span className="font-mono text-xs text-slate-500">{token.token_prefix}...</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-400">
                      <span>Created: {formatDate(token.created_at)}</span>
                      <span>By: {token.created_by}</span>
                      {token.last_used_at ? <span>Last used: {formatDate(token.last_used_at)}</span> : null}
                      {token.expires_at ? <span>Expires: {formatDate(token.expires_at)}</span> : null}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${token.is_active ? 'bg-emerald-400/10 text-emerald-200' : 'bg-slate-700/60 text-slate-300'}`}>
                      {token.is_active ? 'Active' : 'Revoked'}
                    </span>
                    {token.is_active ? (
                      <button type="button" onClick={() => revokeToken(token.id)} className={dangerBtnClass}>
                        Revoke
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}