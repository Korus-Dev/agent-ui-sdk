import { readdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
const directory = new URL('../lab/tests/', import.meta.url);
for (const file of readdirSync(directory).filter(file => file.endsWith('.browser.mjs')).sort()) {
  console.log('Lab browser check:', file);
  execFileSync(process.execPath, [new URL(file, directory).pathname], { stdio: 'inherit' });
}
