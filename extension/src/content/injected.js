(function () {
  if (window.__neodymInjected) return;
  window.__neodymInjected = true;

  const FRAMEWORK_DETECTORS = [
    {
      name: 'react',
      check: () => !!(window.__REACT_DEVTOOLS_GLOBAL_HOOK__?.renderers?.size),
    },
    {
      name: 'vue',
      check: () => !!document.querySelector('[data-v-]'),
    },
    {
      name: 'angular',
      check: () => {
        const appRoot = document.querySelector('[ng-version]');
        return !!appRoot;
      },
    },
  ];

  function detectFramework() {
    for (const detector of FRAMEWORK_DETECTORS) {
      if (detector.check()) return detector.name;
    }
    return 'unknown';
  }

  function waitForElement(selector, timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (document.querySelector(selector)) {
        return resolve(document.querySelector(selector));
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      setTimeout(() => {
        observer.disconnect();
        reject(new Error(`Timeout waiting for ${selector}`));
      }, timeout);
    });
  }

  window.__neodym = {
    framework: detectFramework(),
    waitForElement,
    fillInput: function (input, value) {
      const nativeSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value',
      ).set;
      nativeSetter.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    },
  };
})();
