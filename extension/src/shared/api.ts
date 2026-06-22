import type { ProjectCredentials, ExtensionConfig } from '@/types';

const STORAGE_KEYS = {
  CONFIG: 'neodym_extension_config',
  CREDENTIALS_CACHE: 'neodym_credentials_cache',
} as const;

const DEFAULT_DASHBOARD_URL = 'https://neodym-centralised-project-dashboard.vercel.app';
const LEGACY_LOCAL_DASHBOARD_URL = 'http://localhost:3000';

export async function getConfig(): Promise<ExtensionConfig> {
  const result = await chrome.storage.sync.get(STORAGE_KEYS.CONFIG);
  const config = result[STORAGE_KEYS.CONFIG] as ExtensionConfig | undefined;
  if (!config) {
    return {
      dashboardUrl: DEFAULT_DASHBOARD_URL,
      apiToken: null,
      enabledDomains: [],
      autoSubmit: true,
    };
  }

  if (config.dashboardUrl === LEGACY_LOCAL_DASHBOARD_URL) {
    return { ...config, dashboardUrl: DEFAULT_DASHBOARD_URL };
  }

  const { dashboardUrl, apiToken, enabledDomains, autoSubmit } = config;
  return {
    dashboardUrl: dashboardUrl || DEFAULT_DASHBOARD_URL,
    apiToken: apiToken ?? null,
    enabledDomains: enabledDomains ?? [],
    autoSubmit: autoSubmit ?? true,
  };
}

export async function setConfig(config: Partial<ExtensionConfig>): Promise<void> {
  const current = await getConfig();
  await chrome.storage.sync.set({
    [STORAGE_KEYS.CONFIG]: { ...current, ...config },
  });
}

export async function getCachedCredentials(linkId: string): Promise<ProjectCredentials | null> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.CREDENTIALS_CACHE);
  const cache = (result[STORAGE_KEYS.CREDENTIALS_CACHE] as Record<string, { data: ProjectCredentials; expiry: number }>) ?? {};
  const entry = cache[linkId];
  if (entry && entry.expiry > Date.now()) {
    return entry.data;
  }
  return null;
}

export async function setCachedCredentials(linkId: string, credentials: ProjectCredentials, ttlMs = 5 * 60 * 1000): Promise<void> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.CREDENTIALS_CACHE);
  const cache = (result[STORAGE_KEYS.CREDENTIALS_CACHE] as Record<string, { data: ProjectCredentials; expiry: number }>) ?? {};
  cache[linkId] = { data: credentials, expiry: Date.now() + ttlMs };
  await chrome.storage.session.set({ [STORAGE_KEYS.CREDENTIALS_CACHE]: cache });
}

export async function clearCachedCredentials(linkId: string): Promise<void> {
  const result = await chrome.storage.session.get(STORAGE_KEYS.CREDENTIALS_CACHE);
  const cache = (result[STORAGE_KEYS.CREDENTIALS_CACHE] as Record<string, { data: ProjectCredentials; expiry: number }>) ?? {};
  delete cache[linkId];
  await chrome.storage.session.set({ [STORAGE_KEYS.CREDENTIALS_CACHE]: cache });
}

export async function fetchCredentialsFromDashboard(linkId: string, projectUrl: string): Promise<ProjectCredentials> {
  const config = await getConfig();
  if (!config.apiToken) {
    throw new Error('Extension not authenticated. Please configure API token in popup.');
  }

  const response = await fetch(`${config.dashboardUrl}/api/extension/credentials/${linkId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      'X-Project-URL': projectUrl,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch credentials' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export async function getCredentials(linkId: string, projectUrl: string): Promise<ProjectCredentials> {
  const cached = await getCachedCredentials(linkId);
  if (cached) return cached;

  const credentials = await fetchCredentialsFromDashboard(linkId, projectUrl);
  await setCachedCredentials(linkId, credentials);
  return credentials;
}