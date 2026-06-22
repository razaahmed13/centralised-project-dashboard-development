import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const extensionDir = join(root, 'extension');
const distDir = join(extensionDir, 'dist');
const downloadsDir = join(root, 'public', 'downloads');
const zipPath = join(downloadsDir, 'neodym-dashboard-extension-local.zip');

execFileSync('npm', ['run', 'build'], { cwd: extensionDir, stdio: 'inherit' });

if (!existsSync(distDir)) {
  throw new Error(`Extension dist directory was not created: ${distDir}`);
}

mkdirSync(downloadsDir, { recursive: true });
rmSync(zipPath, { force: true });
execFileSync('zip', ['-qr', zipPath, '.'], { cwd: distDir, stdio: 'inherit' });

console.log(`[Neodym] Wrote ${zipPath}`);
console.log('[Neodym] Local install command:');
console.log('curl -fsSL http://localhost:3000/install-extension-local.sh | bash');
