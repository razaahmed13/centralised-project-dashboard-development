import { build as esbuild } from 'esbuild';
import { build as viteBuild } from 'vite';
import { cp, mkdir, rm } from 'fs/promises';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dist = resolve(__dirname, 'dist');

async function clean() {
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
}

async function copyStatic() {
  await cp(resolve(__dirname, 'manifest.json'), resolve(dist, 'manifest.json'), { force: true });
  await mkdir(resolve(dist, 'content'), { recursive: true });
  await cp(resolve(__dirname, 'src/content/injected.js'), resolve(dist, 'content/injected.js'), { force: true });
  await mkdir(resolve(dist, 'popup'), { recursive: true });
  await cp(resolve(__dirname, 'src/popup/index.html'), resolve(dist, 'popup/index.html'), { force: true });
  await cp(resolve(__dirname, 'src/preauth.html'), resolve(dist, 'preauth.html'), { force: true });
}

async function buildContent() {
  await esbuild({
    entryPoints: [resolve(__dirname, 'src/content/index.ts')],
    bundle: true,
    format: 'iife',
    outfile: resolve(dist, 'content/index.js'),
    minify: process.argv.includes('--production'),
    sourcemap: process.argv.includes('--dev'),
    platform: 'browser',
    target: 'es2020',
    alias: { '@': resolve(__dirname, 'src') },
    loader: { '.ts': 'ts' },
  });
}

async function buildApp() {
  await viteBuild({
    configFile: resolve(__dirname, 'vite.config.ts'),
    mode: process.argv.includes('--production') ? 'production' : 'development',
    build: {
      outDir: dist,
      emptyOutDir: false,
      rollupOptions: {
        input: {
          background: resolve(__dirname, 'src/background/index.ts'),
          popup: resolve(__dirname, 'src/popup/index.tsx'),
        },
        output: {
          entryFileNames: '[name]/index.js',
          chunkFileNames: 'shared/[name].js',
          assetFileNames: (info) => {
            if (info.name?.endsWith('.css')) return 'popup/style.css';
            return 'assets/[name][extname]';
          },
        },
      },
    },
  });
}

async function main() {
  await clean();
  await copyStatic();
  await buildContent();
  await buildApp();
  console.log('[Neodym] Extension built');
}

main().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
