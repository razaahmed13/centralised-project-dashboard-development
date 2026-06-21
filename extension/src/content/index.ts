import type { ProjectCredentials, BackgroundMessage, GetConfigResponse, ExtensionMessage } from '@/types';
import { detectLoginForms, fillFormField, triggerFormSubmit, type DetectedForm } from './form-detector';
import { findRecipeForUrl } from './recipes';

let pendingCredentials: ProjectCredentials | null = null;
let fillAttempts = 0;
let isDashboardPage = false;
const MAX_FILL_ATTEMPTS = 10;
const FILL_RETRY_DELAY = 1000;

async function bgMessage<T>(msg: ExtensionMessage, retries = 2): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await new Promise<T>((resolve, reject) => {
        chrome.runtime.sendMessage(msg, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else {
            resolve(response as T);
          }
        });
      });
    } catch (error) {
      if (attempt < retries && error instanceof Error && error.message.includes('context invalidated')) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw error;
    }
  }
  throw new Error('bgMessage: all retries exhausted');
}

async function getBgConfig() {
  const res = await bgMessage<GetConfigResponse>({ type: 'GET_CONFIG' });
  return res.payload;
}

window.addEventListener('message', async (event: MessageEvent) => {
  if (event.source !== window) return;
  if (event.data?.type !== 'NEODYM_OPEN_PROJECT') return;

  const { linkId, url, projectName } = event.data;

  window.postMessage({ type: 'NEODYM_PROJECT_OPENED', linkId }, '*');

  try {
    const response = await bgMessage<BackgroundMessage>({
      type: 'GET_CREDENTIALS',
      payload: { linkId, projectUrl: url },
    });

    if ('error' in response.payload) {
      throw new Error(response.payload.error);
    }

    chrome.runtime.sendMessage({
      type: 'OPEN_PROJECT',
      payload: { linkId, url, projectName, username: response.payload.username, password: response.payload.password },
    });
  } catch (error) {
    console.error('[Neodym] Failed to prepare credentials:', error);
    window.open(url, '_blank', 'noopener,noreferrer');
  }
});

function findInputBySelector(selector: string): HTMLInputElement | null {
  if (selector.startsWith('#') && !selector.includes(' ')) {
    return document.querySelector<HTMLInputElement>(selector);
  }
  if (selector.startsWith('[name=')) {
    const name = selector.slice(6, -1);
    return document.querySelector<HTMLInputElement>(`input[name="${CSS.escape(name)}"]`);
  }
  return document.querySelector<HTMLInputElement>(selector);
}

async function attemptRecipeFill(recipe: NonNullable<ReturnType<typeof findRecipeForUrl>>, credentials: ProjectCredentials): Promise<boolean> {
  if (recipe.customFill && credentials.username && credentials.password) {
    await recipe.customFill(credentials.username, credentials.password);
    return true;
  }

  if (recipe.waitForSelector) {
    const el = document.querySelector(recipe.waitForSelector);
    if (!el) {
      return false;
    }
  }

  let filled = 0;

  if (credentials.username && recipe.usernameSelector) {
    const field = findInputBySelector(recipe.usernameSelector);
    if (field) {
      fillFormField(field, credentials.username);
      filled++;
    }
  }

  if (credentials.password && recipe.passwordSelector) {
    const field = findInputBySelector(recipe.passwordSelector);
    if (field) {
      fillFormField(field, credentials.password);
      filled++;
    }
  }

  if (filled > 0 && recipe.submitSelector) {
    const submitBtn = document.querySelector<HTMLElement>(recipe.submitSelector);
    if (submitBtn) {
      setTimeout(() => submitBtn.click(), 300);
    }
    return true;
  }

  return filled > 0;
}

function attemptGenericFill(forms: DetectedForm[], credentials: ProjectCredentials): number {
  let filledFields = 0;

  for (const detected of forms) {
    const usernameField = detected.fields.find((f) => f.type === 'username');
    const passwordField = detected.fields.find((f) => f.type === 'password');
    const submitField = detected.fields.find((f) => f.type === 'submit');

    if (usernameField && credentials.username) {
      fillFormField(usernameField.element, credentials.username);
      filledFields++;
    }

    if (passwordField && credentials.password) {
      fillFormField(passwordField.element, credentials.password);
      filledFields++;
    }

    if (filledFields > 0 && detected.form) {
      triggerFormSubmit(detected.form);
    } else if (filledFields > 0 && submitField) {
      submitField.element.click();
    }
  }

  return filledFields;
}

async function fillCredentials(credentials: ProjectCredentials): Promise<void> {
  const url = window.location.href;
  const recipe = findRecipeForUrl(url);

  if (recipe) {
    const done = await attemptRecipeFill(recipe, credentials);
    if (!done && fillAttempts < MAX_FILL_ATTEMPTS) {
      fillAttempts++;
      setTimeout(() => fillCredentials(credentials), FILL_RETRY_DELAY);
    }
    return;
  }

  const forms = detectLoginForms();
  if (forms.length > 0) {
    attemptGenericFill(forms, credentials);
    return;
  }

  if (fillAttempts < MAX_FILL_ATTEMPTS) {
    fillAttempts++;
    setTimeout(() => fillCredentials(credentials), FILL_RETRY_DELAY);
  }
}

async function handleCredentialsResponse(payload: ProjectCredentials | { error: string }): Promise<void> {
  if ('error' in payload) {
    return;
  }

  const credentials = payload as ProjectCredentials;
  if (!credentials.hasCredentials || (!credentials.username && !credentials.password)) {
    return;
  }

  pendingCredentials = credentials;
  await fillCredentials(credentials);
}

async function requestCredentialsIfNeeded(): Promise<void> {
  const url = window.location.href;
  const config = await getBgConfig();
  if (!config.apiToken) return;

  if (isDashboardPage) return;

  const response = await bgMessage<BackgroundMessage>({
    type: 'GET_CREDENTIALS',
    payload: { linkId: '', projectUrl: url },
  });
  handleCredentialsResponse(response.payload);
}

function setupObserver(): void {
  const observer = new MutationObserver(() => {
    if (pendingCredentials && fillAttempts < MAX_FILL_ATTEMPTS) {
      const forms = detectLoginForms();
      if (forms.length > 0) {
        const recipe = findRecipeForUrl(window.location.href);
        if (recipe && recipe.waitForSelector) {
          const el = document.querySelector(recipe.waitForSelector);
          if (el) {
            fillAttempts++;
            attemptRecipeFill(recipe, pendingCredentials);
          } else {
            fillAttempts++;
            attemptGenericFill(forms, pendingCredentials);
          }
        } else {
          fillAttempts++;
          attemptGenericFill(forms, pendingCredentials);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function setupUrlChangeDetection(): void {
  let lastUrl = window.location.href;
  const titleEl = document.querySelector('title');

  if (!titleEl) return;

  new MutationObserver(() => {
    const url = window.location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      fillAttempts = 0;
      pendingCredentials = null;
      setTimeout(() => requestCredentialsIfNeeded(), 1000);
    }
  }).observe(titleEl, { childList: true, subtree: true });
}

async function init(): Promise<void> {
  const hostname = window.location.hostname;
  const dashConfig = await getBgConfig();
  const dashUrl = new URL(dashConfig.dashboardUrl);
  isDashboardPage = hostname === dashUrl.hostname || hostname.endsWith(`.${dashUrl.hostname}`);

  if (isDashboardPage) {
    document.documentElement.dataset.neodymExtension = 'true';
  }

  setupObserver();
  requestCredentialsIfNeeded();
  setupUrlChangeDetection();

  console.log('[Neodym] Content script loaded', isDashboardPage ? '(dashboard page)' : '');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}