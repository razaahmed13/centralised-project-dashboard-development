'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import type { ProjectLink } from '@/lib/dashboard-data';

export function ProjectLinkButton({ link }: { link: ProjectLink }) {
  const [status, setStatus] = useState<string | null>(null);
  const [fallbackText, setFallbackText] = useState<string | null>(null);
  const extensionDetected = useRef(false);
  const fallbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openProject = useCallback(() => {
    window.open(link.url, '_blank', 'noopener,noreferrer');
  }, [link.url]);

  const fetchAndCopyFallback = useCallback(async () => {
    try {
      const response = await fetch(`/api/project-links/${link.id}/credentials`, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to load credentials.');
      const payload = (await response.json()) as { formatted: string | null };

      if (!payload.formatted) {
        openProject();
        setStatus('Project opened.');
        return;
      }

      try {
        await navigator.clipboard.writeText(payload.formatted);
        openProject();
        setStatus('Credentials copied. Paste into the login form.');
      } catch {
        setFallbackText(payload.formatted);
        openProject();
        setStatus('Manually select and copy below.');
      }
    } catch (error) {
      openProject();
      setStatus(error instanceof Error ? error.message : 'Unable to load credentials.');
    }
  }, [link.id, openProject]);

  const openAndCopy = useCallback(async () => {
    setFallbackText(null);

    if (!link.hasCredentials) {
      openProject();
      setStatus('Project opened.');
      return;
    }

    if (extensionDetected.current) {
      window.postMessage({
        type: 'NEODYM_OPEN_PROJECT',
        linkId: link.id,
        url: link.url,
        projectName: link.label,
      }, '*');

      setStatus('Opening with auto-fill...');

      fallbackTimer.current = setTimeout(() => {
        setStatus('Extension did not respond. Trying manual copy...');
        fetchAndCopyFallback();
      }, 3000);
    } else {
      await fetchAndCopyFallback();
    }
  }, [link.id, link.url, link.label, link.hasCredentials, fetchAndCopyFallback, openProject]);

  useEffect(() => {
    extensionDetected.current = document.documentElement.dataset.neodymExtension === 'true';
  }, []);

  useEffect(() => {
    function handleExtensionResponse(event: MessageEvent) {
      if (event.data?.type === 'NEODYM_PROJECT_OPENED') {
        if (fallbackTimer.current) {
          clearTimeout(fallbackTimer.current);
          fallbackTimer.current = null;
        }
        setStatus('Opening with auto-fill...');
        setTimeout(() => setStatus(null), 5000);
      }
    }

    window.addEventListener('message', handleExtensionResponse);
    return () => window.removeEventListener('message', handleExtensionResponse);
  }, []);

  useEffect(() => {
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
    };
  }, []);

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={openAndCopy}
        className="rounded-full bg-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
      >
        {link.hasCredentials ? 'Open & Auto-fill' : link.label}
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