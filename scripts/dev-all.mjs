import { spawn } from 'node:child_process';

const commands = [
  ['api', 'npm.cmd', ['run', 'dev:api']],
  ['web', 'npm.cmd', ['run', 'dev:web']],
];

const children = commands.map(([name, command, args]) => {
  const child = spawn(command, args, {
    stdio: 'pipe',
    shell: false,
  });

  child.stdout.on('data', (chunk) => process.stdout.write(`[${name}] ${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`[${name}] ${chunk}`));
  child.on('exit', (code) => {
    if (code && code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
    }
  });

  return child;
});

function shutdown() {
  for (const child of children) {
    child.kill();
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
