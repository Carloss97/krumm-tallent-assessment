import fs from 'fs';
import path from 'path';
import process from 'node:process';

const root = path.resolve('.');
const src = path.join(root, 'src', 'assets', 'logo.jpg');
const destDir = path.join(root, 'public');
const dest = path.join(destDir, 'logo.jpg');

try {
  if (!fs.existsSync(src)) {
    console.warn('[copy-logo] source logo not found:', src);
    process.exit(0);
  }
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('[copy-logo] logo copied to public/logo.jpg');
} catch (err) {
  console.error('[copy-logo] failed to copy logo:', err?.message || err);
  process.exit(1);
}
