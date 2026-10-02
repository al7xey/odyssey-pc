import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const node = process.execPath;
const api = spawn(node, ['--import', 'tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    API_ONLY: 'true',
    API_PORT: process.env.API_PORT || '8787',
  },
});
const vite = spawn(
  node,
  [fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url))],
  { stdio: 'inherit', env: process.env },
);
let closing = false;
const close = (code = 0) => {
  if (closing) return;
  closing = true;
  api.kill();
  vite.kill();
  process.exit(code);
};
api.on('exit', (code) => close(code || 0));
vite.on('exit', (code) => close(code || 0));
api.on('error', () => close(1));
vite.on('error', () => close(1));
process.on('SIGINT', () => close());
process.on('SIGTERM', () => close());
