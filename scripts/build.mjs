import { cp, mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const output = join(root, 'dist');

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const filename of ['index.html', 'style.css']) {
  await cp(join(root, filename), join(output, filename));
}

const entries = await readdir(root, { withFileTypes: true });
for (const entry of entries) {
  if (entry.isFile() && entry.name.endsWith('.js')) {
    await cp(join(root, entry.name), join(output, entry.name));
  }
}

if (entries.some(entry => entry.isDirectory() && entry.name === 'assets')) {
  await cp(join(root, 'assets'), join(output, 'assets'), { recursive: true });
}

await writeFile(join(output, '.nojekyll'), '');
console.log('Built static site in dist/');
