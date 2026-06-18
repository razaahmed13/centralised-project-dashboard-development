import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

describe('global interactive cursor styles', () => {
  it('uses a pointer cursor for enabled buttons and links', () => {
    const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

    expect(css).toMatch(/button:not\(\[disabled\]\),\s*a\s*{[\s\S]*?cursor:\s*pointer;/);
  });
});