import type { LoginFormRecipe } from '@/types';
import { fillFormField } from './form-detector';

export const DOMAIN_RECIPES: LoginFormRecipe[] = [
  {
    domain: 'github.com',
    usernameSelector: '#login_field',
    passwordSelector: '#password',
    submitSelector: 'input[type="submit"]',
  },
  {
    domain: 'gitlab.com',
    usernameSelector: '#user_login',
    passwordSelector: '#user_password',
    submitSelector: 'input[type="submit"]',
  },
  {
    domain: 'bitbucket.org',
    usernameSelector: '#username',
    passwordSelector: '#password',
    submitSelector: '#login-submit',
  },
  {
    domain: 'vercel.com',
    usernameSelector: 'input[name="email"]',
    passwordSelector: 'input[name="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'railway.app',
    waitForSelector: 'input[type="email"]',
    usernameSelector: 'input[type="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'linear.app',
    usernameSelector: 'input[type="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'notion.so',
    usernameSelector: 'input[type="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'figma.com',
    usernameSelector: 'input[name="email"]',
    passwordSelector: 'input[name="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'slack.com',
    usernameSelector: 'input[type="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'atlassian.com',
    usernameSelector: 'input[name="username"]',
    passwordSelector: 'input[name="password"]',
    submitSelector: '#login-submit',
  },
  {
    domain: 'loom.com',
    usernameSelector: 'input[type="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'miro.com',
    usernameSelector: 'input[type="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'cloudflare.com',
    usernameSelector: 'input[type="email"]',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'sendgrid.com',
    usernameSelector: 'input[name="email"]',
    passwordSelector: 'input[name="password"]',
    submitSelector: 'button[type="submit"]',
  },
  {
    domain: 'triangleip.com',
    usernameSelector: '#basic_username',
    passwordSelector: 'input[type="password"]',
    submitSelector: 'button[type="submit"]',
    customFill: async (username: string, password: string) => {
      const isVisible = (el: Element): boolean => {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      const waitForEl = (selector: string, timeout = 10000): Promise<HTMLInputElement | null> =>
        new Promise((resolve) => {
          const found = document.querySelector<HTMLInputElement>(selector);
          if (found && isVisible(found)) return resolve(found);
          const start = Date.now();
          const obs = new MutationObserver(() => {
            const el = document.querySelector<HTMLInputElement>(selector);
            if (el && isVisible(el)) { obs.disconnect(); resolve(el); }
            else if (Date.now() - start > timeout) { obs.disconnect(); resolve(null); }
          });
          obs.observe(document.body, { childList: true, subtree: true });
        });

      const isPwdVisible = (): boolean => {
        const el = document.querySelector<HTMLInputElement>('input[type="password"]');
        return !!el && isVisible(el);
      };

      // Step 1: wait for the email input to appear (uses exact id from page inspection)
      const emailInput = await waitForEl('#basic_username');
      if (!emailInput) return;

      // Step 2: fill the email
      fillFormField(emailInput, username);

      // CRITICAL FIX: Ant Design Form validates on blur.
      // fillFormField only fires blur in its fallback path (when execCommand fails).
      // Without explicit blur, the form's internal validation never marks the email
      // as valid, so clicking PROCEED silently fails even if the email shows in the field.
      emailInput.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }));

      // Step 3: if password is already visible (page auto-proceeded), fill it directly
      if (isPwdVisible()) {
        const pwd = document.querySelector<HTMLInputElement>('input[type="password"]');
        if (pwd) fillFormField(pwd, password);
      } else {
        // Wait for Ant Design's async validation cycle to complete after blur
        await new Promise((r) => setTimeout(r, 600));

        // Primary: Enter key — confirmed by live page testing to reliably submit Ant Design forms
        emailInput.focus();
        emailInput.dispatchEvent(new KeyboardEvent('keydown',  { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
        emailInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));
        emailInput.dispatchEvent(new KeyboardEvent('keyup',    { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true }));

        // Backup: also click the PROCEED button (belt-and-suspenders)
        const proceedBtn = document.querySelector<HTMLElement>('button[type="submit"]')
          ?? Array.from(document.querySelectorAll<HTMLElement>('button'))
            .find((el) => /proceed/i.test(el.textContent ?? '') && isVisible(el))
          ?? null;

        if (proceedBtn) {
          proceedBtn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
          proceedBtn.dispatchEvent(new MouseEvent('mouseup',   { bubbles: true, cancelable: true }));
          proceedBtn.click();
        }

        // Step 4: wait for the password field (up to 10s — handles API latency)
        const pwd = await waitForEl('input[type="password"]', 10000);
        if (!pwd) return;
        fillFormField(pwd, password);
      }

      // Step 5: submit the password form (SIGN IN button)
      await new Promise((r) => setTimeout(r, 400));
      const signInBtn = document.querySelector<HTMLElement>('button[type="submit"]');
      signInBtn?.click();
    },
  },
];

const WILDCARD_RECIPES: { pattern: RegExp; recipe: Partial<LoginFormRecipe> }[] = [
  {
    pattern: /^https?:\/\/[^/]*\.supabase\.co/,
    recipe: {
      usernameSelector: 'input[type="email"]',
      passwordSelector: 'input[type="password"]',
      submitSelector: 'button[type="submit"]',
    },
  },
  {
    pattern: /^https?:\/\/[^/]*\.netlify\.app/,
    recipe: {
      usernameSelector: 'input[type="email"]',
      passwordSelector: 'input[type="password"]',
      submitSelector: 'button[type="submit"]',
    },
  },
];

export function findRecipeForUrl(url: string): LoginFormRecipe | null {
  try {
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, '');

    const exact = DOMAIN_RECIPES.find((r) => r.domain === domain || parsed.hostname.endsWith(`.${r.domain}`));
    if (exact) return exact;

    for (const { pattern, recipe } of WILDCARD_RECIPES) {
      if (pattern.test(url)) {
        return {
          domain: parsed.hostname,
          ...recipe,
        } as LoginFormRecipe;
      }
    }

    return null;
  } catch {
    return null;
  }
}