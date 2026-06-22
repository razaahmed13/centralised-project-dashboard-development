import React, { useEffect, useState } from 'react';
import type { ExtensionConfig } from '@/types';
import { getConfig, setConfig } from '@/shared/api';
import { findRecipeForUrl } from '@/content/recipes';
import { detectLoginForms } from '@/content/form-detector';

type PopupView = 'main' | 'settings' | 'test' | 'about';

export function App() {
  const [config, setConfigState] = useState<ExtensionConfig | null>(null);
  const [view, setView] = useState<PopupView>('main');
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [dashboardUrlInput, setDashboardUrlInput] = useState('');
  const [autoSubmit, setAutoSubmit] = useState(true);
  const [testResult, setTestResult] = useState<string>('');
  const [newDomain, setNewDomain] = useState('');

  useEffect(() => {
    async function init() {
      const cfg = await getConfig();
      setConfigState(cfg);
      setApiTokenInput(cfg.apiToken ?? '');
      setDashboardUrlInput(cfg.dashboardUrl);
      setAutoSubmit(cfg.autoSubmit);

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      setCurrentTab(tabs[0] ?? null);
    }
    init();
  }, []);

  async function saveConfig(partial: Partial<ExtensionConfig>) {
    await setConfig(partial);
    const updated = await getConfig();
    setConfigState(updated);
  }

  async function handleSaveSettings() {
    await saveConfig({
      apiToken: apiTokenInput || null,
      dashboardUrl: dashboardUrlInput,
      autoSubmit,
    });
    setStatusMessage('Settings saved');
    setTimeout(() => setStatusMessage(''), 2000);
  }

  async function handleFillNow() {
    if (!currentTab?.id) {
      setTestResult('No active tab');
      return;
    }

    try {
      const [result] = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        func: () => {
          const forms = detectLoginForms();
          return forms.map((f) => ({
            fields: f.fields.map((ff) => ({ type: ff.type, selector: ff.selector })),
            hasForm: !!f.form,
          }));
        },
      });

      const forms = result?.result;
      if (!forms || forms.length === 0) {
        setTestResult('No login forms detected');
        return;
      }

      setTestResult(`Detected ${forms.length} login form(s):\n${forms.map((f) => f.fields.map((ff) => `  ${ff.type}: ${ff.selector}`).join('\n')).join('\n')}`);
    } catch (error) {
      setTestResult(`Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  async function handleAddDomain() {
    if (!newDomain.trim() || !config) return;
    const domains = [...(config.enabledDomains ?? []), newDomain.trim().toLowerCase()];
    await saveConfig({ enabledDomains: [...new Set(domains)] });
    setNewDomain('');
    setStatusMessage(`Added ${newDomain.trim()}`);
    setTimeout(() => setStatusMessage(''), 2000);
  }

  async function handleRemoveDomain(domain: string) {
    if (!config) return;
    const domains = (config.enabledDomains ?? []).filter((d) => d !== domain);
    await saveConfig({ enabledDomains: domains });
  }

  const recipe = currentTab?.url ? findRecipeForUrl(currentTab.url) : null;

  if (!config) {
    return <div className="container"><p>Loading...</p></div>;
  }

  return (
    <div className="container">
      <header>
        <h1>Neodym<span className="accent">.</span></h1>
        <p className="subtitle">Project Dashboard</p>
      </header>

      <nav className="tabs">
        <button className={view === 'main' ? 'active' : ''} onClick={() => setView('main')}>Status</button>
        <button className={view === 'settings' ? 'active' : ''} onClick={() => setView('settings')}>Settings</button>
        <button className={view === 'test' ? 'active' : ''} onClick={() => setView('test')}>Test Page</button>
        <button className={view === 'about' ? 'active' : ''} onClick={() => setView('about')}>About</button>
      </nav>

      {statusMessage && <div className="toast">{statusMessage}</div>}

      {view === 'main' && (
        <section>
          <div className="card">
            <h2>Status</h2>
            <div className="status-row">
              <span>API Token</span>
              <span className={config.apiToken ? 'badge ok' : 'badge warn'}>
                {config.apiToken ? 'Configured' : 'Missing'}
              </span>
            </div>
            <div className="status-row">
              <span>Dashboard</span>
              <span className="badge ok">{config.dashboardUrl}</span>
            </div>
            <div className="status-row">
              <span>Auto-fill</span>
              <span className={config.autoSubmit ? 'badge ok' : 'badge warn'}>
                {config.autoSubmit ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="status-row">
              <span>Tracked Domains</span>
              <span className="badge info">{(config.enabledDomains ?? []).length}</span>
            </div>
          </div>

          {currentTab && (
            <div className="card">
              <h2>Current Page</h2>
              <p className="url">{currentTab.url}</p>
              {recipe ? (
                <p className="badge ok">Recipe available</p>
              ) : (
                <p className="badge warn">No specific recipe</p>
              )}
              <button className="btn" onClick={handleFillNow}>Detect Forms</button>
              {testResult && <pre className="test-output">{testResult}</pre>}
            </div>
          )}

          <div className="card">
            <h2>Domains</h2>
            {config.enabledDomains && config.enabledDomains.length > 0 ? (
              <ul className="domain-list">
                {config.enabledDomains.map((domain) => (
                  <li key={domain}>
                    <span>{domain}</span>
                    <button className="btn-small danger" onClick={() => handleRemoveDomain(domain)}>✕</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dim">No custom domains added. Auto-fill works on detected login forms.</p>
            )}
          </div>
        </section>
      )}

      {view === 'settings' && (
        <section>
          <div className="card">
            <h2>Configuration</h2>

            <label>
              Dashboard URL
              <input
                type="url"
                value={dashboardUrlInput}
                onChange={(e) => setDashboardUrlInput(e.target.value)}
                placeholder="https://neodym-centralised-project-dashboard.vercel.app"
              />
            </label>

            <label>
              API Token
              <input
                type="password"
                value={apiTokenInput}
                onChange={(e) => setApiTokenInput(e.target.value)}
                placeholder="Paste your API token"
              />
            </label>

            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={autoSubmit}
                onChange={(e) => setAutoSubmit(e.target.checked)}
              />
              Auto-submit login forms
            </label>

            <button className="btn primary" onClick={handleSaveSettings}>Save Settings</button>

            <details className="how-to">
              <summary>How to get an API token</summary>
              <ol>
                <li>Log in to your Neodym Dashboard</li>
                <li>Go to Settings → Extensions</li>
                <li>Click "Generate API Token"</li>
                <li>Copy the token and paste it here</li>
              </ol>
            </details>
          </div>

          <div className="card">
            <h2>Add Domain</h2>
            <div className="domain-input">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="example.com"
              />
              <button className="btn" onClick={handleAddDomain}>Add</button>
            </div>
            <p className="hint">Domains here will be monitored for auto-fill even without a login form recipe.</p>
          </div>
        </section>
      )}

      {view === 'test' && (
        <section>
          <div className="card">
            <h2>Test Page</h2>
            <p>Click "Detect Forms" to scan the current page for login forms.</p>
            <button className="btn" onClick={handleFillNow}>Detect Forms</button>
            {testResult && (
              <div className="test-output">
                <pre>{testResult}</pre>
              </div>
            )}
          </div>

          <div className="card">
            <h2>Manual Fill</h2>
            <button
              className="btn primary"
              onClick={async () => {
                if (!currentTab?.id) return;
                const [result] = await chrome.scripting.executeScript({
                  target: { tabId: currentTab.id },
                  func: () => {
                    const forms = detectLoginForms();
                    if (forms.length === 0) return { success: false, error: 'No forms' };
                    return { success: true, count: forms.length };
                  },
                });
                setTestResult(result?.result?.success ? `Ready to fill ${result.result.count} form(s)` : `Error: ${result?.result?.error}`);
              }}
            >
              Analyze Page
            </button>
          </div>
        </section>
      )}

      {view === 'about' && (
        <section>
          <div className="card">
            <h2>About Neodym Dashboard Extension</h2>
            <p><strong>Version:</strong> 1.0.0</p>
            <p>This extension auto-fills credentials from your Neodym Project Dashboard into login forms, so you don&apos;t need to manually copy-paste credentials.</p>
            <h3>How it works</h3>
            <ol>
              <li>You click &ldquo;Open Project&rdquo; on the dashboard</li>
              <li>The project opens in a new tab</li>
              <li>This extension detects the login form</li>
              <li>It fetches encrypted credentials from the dashboard</li>
              <li>It fills the username/password fields</li>
              <li>It optionally submits the form</li>
            </ol>
            <h3>Security</h3>
            <ul>
              <li>Credentials are encrypted in transit and in storage</li>
              <li>API tokens are revocable</li>
              <li>Domain access is controlled via allowlist</li>
              <li>No data is sent to third parties</li>
            </ul>
          </div>
        </section>
      )}
    </div>
  );
}