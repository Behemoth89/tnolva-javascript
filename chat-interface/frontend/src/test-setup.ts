import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

const here = dirname(fileURLToPath(import.meta.url));
const stylesDir = resolve(here, 'styles');

function inject(relPath: string) {
  const css = readFileSync(resolve(stylesDir, relPath), 'utf8');
  const style = document.createElement('style');
  style.setAttribute('data-injected', relPath);
  style.textContent = css;
  document.head.appendChild(style);
}

for (const file of ['tokens.css', 'glass.css', 'motion.css']) {
  inject(file);
}

afterEach(() => {
  cleanup();
});
