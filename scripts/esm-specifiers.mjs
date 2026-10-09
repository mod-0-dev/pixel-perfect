#!/usr/bin/env node
// Gives every relative import in dist/ its file extension.
//
// The source imports `./components/Button/Button`, which `moduleResolution:
// bundler` accepts and `tsc` emits unchanged. The package is `"type":
// "module"`, and outside a lenient bundler an ES module specifier is a file
// path: Node throws ERR_MODULE_NOT_FOUND on the first import of the package,
// webpack 5 refuses to resolve it, and TypeScript under `node16`/`nodenext`
// rejects the declarations. Vite and Turbopack guess the extension, which is
// why the playground never saw it.
//
// Rewriting the output rather than the source keeps every component file as
// it is. Each specifier is resolved against what tsc actually wrote — `x.js`
// or `x/index.js` for code, `x.d.ts` or `x/index.d.ts` for declarations — and
// one that resolves to neither fails the build. Run by `npm run build:js`;
// `fixSpecifiers` is exported for the unit test.

import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// `from './x'`, `import './x'`, `import('./x')` — in code and in declarations.
const SPECIFIER = /(\bfrom\s*|\bimport\s*\(?\s*)(['"])(\.{1,2}\/[^'"]*)\2/g;
const HAS_EXTENSION = /\.(?:m?js|cjs|json|css)$/;

function filesIn(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path) : [path];
  });
}

/** Rewrite one file's relative specifiers; returns how many changed. */
export function fixFile(file) {
  const declaration = /\.d\.m?ts$/.test(file);
  const code = /\.m?js$/.test(file);
  if (!declaration && !code) return 0;
  const [ext, typesExt] = file.endsWith('.mts') || file.endsWith('.mjs') ? ['.mjs', '.d.mts'] : ['.js', '.d.ts'];
  const probe = declaration ? typesExt : ext;
  let changed = 0;
  const source = readFileSync(file, 'utf8');
  const fixed = source.replace(SPECIFIER, (match, lead, quote, spec) => {
    if (HAS_EXTENSION.test(spec)) return match;
    const base = resolve(dirname(file), spec);
    let next;
    if (existsSync(base + probe)) next = spec + ext;
    else if (existsSync(join(base, 'index' + probe))) next = `${spec}/index${ext}`;
    else throw new Error(`${file}: cannot resolve '${spec}' to a file tsc wrote.`);
    changed += 1;
    return `${lead}${quote}${next}${quote}`;
  });
  if (changed > 0) writeFileSync(file, fixed);
  return changed;
}

/** Rewrite every file under `dir`; returns the number of specifiers changed. */
export function fixSpecifiers(dir) {
  return filesIn(dir).reduce((total, file) => total + fixFile(file), 0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const count = fixSpecifiers(join(ROOT, 'dist'));
  console.log(`Gave ${count} relative imports in dist/ their file extension`);
}
