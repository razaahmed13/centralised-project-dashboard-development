import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DEPLOY_DASHBOARD_URL = 'https://neodym-centralised-project-dashboard.vercel.app';
const root = resolve(import.meta.dirname, '..');
const extensionDir = join(root, 'extension');
const distDir = join(extensionDir, 'dist');
const downloadsDir = join(root, 'public', 'downloads');
const zipPath = join(downloadsDir, 'neodym-dashboard-extension.zip');

execFileSync('npm', ['run', 'build'], { cwd: extensionDir, stdio: 'inherit' });

if (!existsSync(distDir)) {
  throw new Error(`Extension dist directory was not created: ${distDir}`);
}

mkdirSync(downloadsDir, { recursive: true });
rmSync(zipPath, { force: true });
execFileSync('zip', ['-qr', zipPath, '.'], { cwd: distDir, stdio: 'inherit' });

console.log(`[Neodym] Wrote ${zipPath}`);
console.log('[Neodym] Deployment install commands:');
console.log(`macOS/Linux/Ubuntu: curl -fsSL ${DEPLOY_DASHBOARD_URL}/install-extension.sh | bash`);
console.log(`Windows PowerShell: irm ${DEPLOY_DASHBOARD_URL}/install-extension.ps1 | iex`);
