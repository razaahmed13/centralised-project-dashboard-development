import type { ExtensionMessage, BackgroundMessage } from '@/types';
import { getConfig, getCredentials, clearCachedCredentials } from '@/shared/api';

const pendingTabCredentials = new Map<number, { linkId: string; url: string; projectName: string }>();
const debuggedTabs = new Set<number>();

function isBasicAuthSite(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return ['tokenwatch-xi.vercel.app']
      .some((d) => hostname === d || hostname.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Neodym] Extension installed');
});

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch((error) => {
    console.error('[Neodym] Message handling error:', error);
    sendResponse({ type: 'CREDENTIALS_RESPONSE', payload: { error: error.message } });
  });
  return true;
});

function encodeBasicAuth(username: string, password: string): string {
  return btoa(`${username}:${password}`);
}

async function openTabWithBasicAuth(tabId: number, url: string, username: string, password: string): Promise<void> {
  try {
    await chrome.debugger.attach({ tabId }, '1.3');
    await chrome.debugger.sendCommand({ tabId }, 'Network.enable');
    await chrome.debugger.sendCommand({ tabId }, 'Network.setExtraHTTPHeaders', {
      headers: { 'Authorization': `Basic ${encodeBasicAuth(username, password)}` },
    });

    await chrome.tabs.update(tabId, { url, active: true });

    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Page load timeout')), 30000);
      const listener = (_id: number, info: chrome.tabs.TabChangeInfo) => {
        if (_id === tabId && info.status === 'complete') {
          clearTimeout(timeout);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });

    debuggedTabs.add(tabId);
  } catch (error) {
    try { await chrome.debugger.detach({ tabId }); } catch { }
    await chrome.tabs.update(tabId, { url, active: true });
  }
}

async function handleMessage(message: ExtensionMessage, sender: chrome.runtime.MessageSender): Promise<BackgroundMessage> {
  switch (message.type) {
    case 'GET_CREDENTIALS': {
      const { linkId, projectUrl } = message.payload;

      if (!linkId && sender.tab?.id && projectUrl) {
        const pending = pendingTabCredentials.get(sender.tab.id);
        if (pending) {
          try {
            const credentials = await getCredentials(pending.linkId, projectUrl);
            return { type: 'CREDENTIALS_RESPONSE', payload: credentials };
          } catch (error) {
            return { type: 'CREDENTIALS_RESPONSE', payload: { error: error instanceof Error ? error.message : 'Unknown error' } };
          }
        }
      }

      if (!linkId) {
        return { type: 'CREDENTIALS_RESPONSE', payload: { error: 'No linkId provided' } };
      }

      try {
        const credentials = await getCredentials(linkId, projectUrl);
        return { type: 'CREDENTIALS_RESPONSE', payload: credentials };
      } catch (error) {
        await clearCachedCredentials(linkId);
        return { type: 'CREDENTIALS_RESPONSE', payload: { error: error instanceof Error ? error.message : 'Unknown error' } };
      }
    }

    case 'GET_CONFIG': {
      const config = await getConfig();
      return { type: 'CONFIG_RESPONSE', payload: config };
    }

    case 'OPEN_PROJECT': {
      const { url, linkId, projectName, username, password } = message.payload;
      const tab = await chrome.tabs.create({ url: 'about:blank', active: true });

      if (username && password) {
        pendingTabCredentials.set(tab.id!, { linkId, url, projectName });
        if (isBasicAuthSite(url)) {
          await openTabWithBasicAuth(tab.id!, url, username, password);
        } else {
          await chrome.tabs.update(tab.id!, { url });
        }
      } else {
        await chrome.tabs.update(tab.id!, { url });
      }

      return { type: 'CREDENTIALS_RESPONSE', payload: { hasCredentials: false, projectName, url, username: null, password: null, notes: null } };
    }

    default:
      return { type: 'CREDENTIALS_RESPONSE', payload: { error: 'Unknown message type' } };
  }
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/injected.js'],
      });
    } catch {
      // Ignore injection errors
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  pendingTabCredentials.delete(tabId);
  if (debuggedTabs.has(tabId)) {
    chrome.debugger.detach({ tabId }).catch(() => { });
    debuggedTabs.delete(tabId);
  }
});

console.log('[Neodym] Background script loaded');
