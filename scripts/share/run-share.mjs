import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const action = process.argv[2];
const validActions = new Set(['start', 'check', 'stop']);

if (!validActions.has(action)) {
  console.error('Uso: node scripts/share/run-share.mjs <start|check|stop>');
  process.exit(1);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptMap = {
  start: {
    win32: path.join(__dirname, 'start-share.ps1'),
    linux: path.join(__dirname, 'start-share.sh'),
    darwin: path.join(__dirname, 'start-share.sh'),
  },
  check: {
    win32: path.join(__dirname, 'check-share.ps1'),
    linux: path.join(__dirname, 'check-share.sh'),
    darwin: path.join(__dirname, 'check-share.sh'),
  },
  stop: {
    win32: path.join(__dirname, 'stop-share.ps1'),
    linux: path.join(__dirname, 'stop-share.sh'),
    darwin: path.join(__dirname, 'stop-share.sh'),
  },
};

const targetScript = scriptMap[action][process.platform];
if (!targetScript) {
  console.error(`Plataforma no soportada para sharing: ${process.platform}`);
  process.exit(1);
}

const command = process.platform === 'win32' ? 'powershell' : 'bash';
const args = process.platform === 'win32'
  ? ['-ExecutionPolicy', 'Bypass', '-File', targetScript]
  : [targetScript];

const child = spawn(command, args, {
  stdio: 'inherit',
});

child.on('error', (error) => {
  console.error(`No se pudo ejecutar ${targetScript}:`, error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
