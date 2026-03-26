import { spawn } from 'child_process';

const test = spawn('npm', ['run', 'test'], {
  cwd: process.cwd(),
  stdio: 'inherit'
});

test.on('close', (code) => {
  console.log(`Test process exited with code ${code}`);
  process.exit(code);
});
