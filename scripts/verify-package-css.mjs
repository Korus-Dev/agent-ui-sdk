import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const cssPath = process.argv[2]
  ? path.resolve(process.cwd(), process.argv[2])
  : fileURLToPath(new URL('../dist/codex-app-sdk.css', import.meta.url));
const vueDeclarationPath = process.argv[3]
  ? path.resolve(process.cwd(), process.argv[3])
  : fileURLToPath(new URL('../dist/vue/index.d.ts', import.meta.url));
const fontsPath = process.argv[4]
  ? path.resolve(process.cwd(), process.argv[4])
  : fileURLToPath(new URL('../dist/fonts', import.meta.url));
const css = await readFile(cssPath, 'utf8');
const requiredMarkers = [
  '.agent-ui-text-shimmer',
  '.agent-ui-markdown',
  '.agent-ui-markdown .katex-display',
  '.agent-ui-theme{font-family:var(--font-family-base)}',
  ':where(.agent-ui-theme)',
  '.agent-ui-theme--dark',
  '.agent-ui-theme--system',
  '@media (prefers-color-scheme:dark)',
  '--font-size-15:15px',
  '--agent-ui-message-font-size',
  '--agent-ui-composer-font-size',
  '--agent-ui-menu-font-size',
  '--agent-ui-composer-control-size',
  '--agent-ui-message-action-control-size',
  '.agent-ui-composer-menu-list__switch',
  '.agent-ui-conversation-pane',
  '.chat-rich-text-editor',
  '.chat-mention-chip',
  '.chat-composer-at-menu',
];
const missingMarkers = requiredMarkers.filter((marker) => !css.includes(marker));

if (missingMarkers.length > 0) {
  throw new Error(`The published CSS bundle is missing: ${missingMarkers.join(', ')}`);
}

if (/\.agent-ui-theme \*\{[^}]*font-family/.test(css)) {
  throw new Error('The published CSS must let themed descendants inherit specialized fonts.');
}

if (css.includes('data:font/')) {
  throw new Error('The published CSS must reference KaTeX fonts as files, not inline them.');
}

await access(path.join(fontsPath, 'KaTeX_Main-Regular.woff2'));

const vueDeclaration = await readFile(vueDeclarationPath, 'utf8');
if (vueDeclaration.includes('styles.css')) {
  throw new Error('The Vue declaration entry must not contain a dangling styles.css import.');
}

console.log(`verified ${requiredMarkers.length} SDK CSS markers in ${path.relative(process.cwd(), cssPath)}`);
