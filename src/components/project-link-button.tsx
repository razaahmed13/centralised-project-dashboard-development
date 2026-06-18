'use client';

import { useState } from 'react';

import type { ProjectLink } from '@/lib/dashboard-data';

export function ProjectLinkButton({ link }: { link: ProjectLink }) {
  const [status, setStatus] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);

  async function openAndCopy() {
    window.open(link.url, '_blank', 'noopener,noreferrer');

    if (!link.hasCredentials) {
      setStatus('Project opened. No credentials stored.');
      return;
    }

    try {
      const response = await fetch(`/api/project-links/${link.id}/credentials`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load credentials.');
      const payload = (await response.json()) as { formatted: string | null };

      if (!payload.formatted) {
        setStatus('Project opened. No credentials stored.');
        return;
      }

      try {
        await navigator.clipboard.writeText(payload.formatted);
        setStatus('Project opened. Credentials copied.');
      } catch {
        setFallbackText(payload.formatted);
        setStatus('Project opened. Use manual copy below.');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to copy credentials.');
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openAndCopy}
        className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
      >
        {link.hasCredentials ? 'Open & Copy Credentials' : link.label}
      </button>
      {status ? <p className="text-xs text-slate-400">{status}</p> : null}
      {fallbackText ? (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs text-amber-50">
          <p className="mb-2 font-semibold">Manual copy fallback</p>
          <textarea readOnly value={fallbackText} className="h-32 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-slate-100" />
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(fallbackText)}
            className="mt-2 rounded-full border border-amber-200/30 px-3 py-1 text-amber-50 hover:bg-amber-200/10"
          >
            Copy manually
          </button>
        </div>
      ) : null}
    </div>
  );
}
