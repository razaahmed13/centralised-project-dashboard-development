export interface FormField {
  element: HTMLInputElement;
  type: 'username' | 'password' | 'submit';
  selector: string;
}

export interface DetectedForm {
  fields: FormField[];
  form?: HTMLFormElement;
}

const USERNAME_PATTERNS = [
  'email', 'username', 'user', 'login', 'log in', 'signin', 'sign in',
  'e-mail', 'mail', 'userid', 'user_id', 'name',
];

const PASSWORD_PATTERNS = [
  'password', 'passwd', 'pass', 'pwd', 'secret',
];

const SUBMIT_TEXT_PATTERNS = [
  'sign in', 'login', 'log in', 'signin', 'submit', 'continue',
  'sign in with google', 'sign in with microsoft',
];

function matchesAnyPattern(value: string, patterns: string[]): boolean {
  const lower = value.toLowerCase().replace(/[^a-z0-9]/g, '');
  return patterns.some((p) => {
    const pattern = p.replace(/[^a-z0-9]/g, '');
    return lower.includes(pattern);
  });
}

function isVisible(element: Element): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden') return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function getUniqueSelector(element: Element): string {
  if (element.id) return `#${CSS.escape(element.id)}`;
  if (element.getAttribute('name')) return `[name="${CSS.escape(element.getAttribute('name')!)}"]`;
  if (element.getAttribute('type') === 'email' || element.getAttribute('type') === 'password') {
    return `input[type="${element.getAttribute('type')}"]`;
  }
  const parent = element.parentElement;
  if (parent) {
    const idx = Array.from(parent.children).indexOf(element) + 1;
    return `${getUniqueSelector(parent)} > :nth-child(${idx})`;
  }
  return element.tagName.toLowerCase();
}

export function detectLoginForms(): DetectedForm[] {
  const forms: DetectedForm[] = [];
  const processed = new Set<Element>();

  const inputs = document.querySelectorAll<HTMLInputElement>(
    'input[type="email"], input[type="password"], input[type="text"], input[type="submit"], button[type="submit"]',
  );

  const passwordInputs = Array.from(inputs).filter(
    (input) => input.type === 'password' && isVisible(input),
  );

  for (const passwordInput of passwordInputs) {
    const form = passwordInput.closest('form');
    const container = form ?? passwordInput.closest('div, section, main, body');

    if (!container || processed.has(container)) continue;
    processed.add(container);

    const allInputs = container.querySelectorAll<HTMLInputElement>(
      'input[type="email"], input[type="password"], input[type="text"]',
    );

    let usernameInput: HTMLInputElement | undefined;
    let submitButton: HTMLInputElement | HTMLButtonElement | undefined;

    for (const input of Array.from(allInputs)) {
      if (!isVisible(input)) continue;
      if (input === passwordInput || input.type === 'hidden') continue;

      const name = input.name || input.id || input.placeholder || '';
      const ariaLabel = input.getAttribute('aria-label') || '';
      const combinedLabel = `${name} ${ariaLabel} ${input.type}`;

      if (matchesAnyPattern(combinedLabel, PASSWORD_PATTERNS)) continue;

      if (matchesAnyPattern(combinedLabel, USERNAME_PATTERNS) || input.type === 'email') {
        usernameInput = input;
        break;
      }
    }

    if (!usernameInput) {
      for (const input of Array.from(allInputs)) {
        if (!isVisible(input)) continue;
        if (input === passwordInput || input.type === 'hidden') continue;
        if (matchesAnyPattern(input.name || input.id || '', PASSWORD_PATTERNS)) continue;
        usernameInput = input;
        break;
      }
    }

    if (!usernameInput) {
      const textInputs = Array.from(allInputs).filter(
        (i) => i.type === 'text' && isVisible(i) && i !== passwordInput,
      );
      usernameInput = textInputs[0];
    }

    if (form) {
      submitButton = form.querySelector<HTMLInputElement | HTMLButtonElement>(
        'input[type="submit"], button[type="submit"]',
      );
    }

    if (!submitButton && form) {
      const buttons = form.querySelectorAll<HTMLButtonElement>('button');
      for (const button of Array.from(buttons)) {
        const text = (button.textContent || button.getAttribute('aria-label') || '').toLowerCase();
        if (matchesAnyPattern(text, SUBMIT_TEXT_PATTERNS)) {
          submitButton = button;
          break;
        }
      }
    }

    if (usernameInput) {
      const fields: FormField[] = [
        { element: usernameInput, type: 'username', selector: getUniqueSelector(usernameInput) },
        { element: passwordInput, type: 'password', selector: getUniqueSelector(passwordInput) },
      ];
      if (submitButton) {
        fields.push({ element: submitButton, type: 'submit', selector: getUniqueSelector(submitButton) });
      }
      forms.push({ fields, form: form ?? undefined });
    }
  }

  return forms;
}

export function fillFormField(input: HTMLInputElement, value: string): void {
  input.focus();
  input.select();
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));

  if (document.execCommand('insertText', false, value)) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return;
  }

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value',
  )?.set;
  nativeInputValueSetter?.call(input, value);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, inputType: 'insertText', data: value }));
  input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
  input.dispatchEvent(new FocusEvent('blur', { bubbles: true, cancelable: true }));
}

export function triggerFormSubmit(form: HTMLFormElement): void {
  const submitEvent = new SubmitEvent('submit', { bubbles: true, cancelable: true });
  const defaultPrevented = !form.dispatchEvent(submitEvent);
  if (!defaultPrevented && form.requestSubmit) {
    form.requestSubmit();
  }
}