#!/usr/bin/env node
// Rules that a CSS linter cannot see. Run by `npm run lint:rules`.
//
//   1. Component CSS lives in @layer pp.components
//   2. Component CSS consumes semantic tokens, never raw palette steps
//   3. No banned prop names in any *Props type
//   4. Files using client-only React have the 'use client' directive
//   5. The built stylesheet establishes cascade layers in the declared order
//   6. No selector list mixes a -webkit- and a -moz- pseudo-element
//   7. Every --pp-* a component stylesheet reads is defined somewhere

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
// TypeScript 7 is a native compiler with no JS compiler API, so the parser
// comes from Microsoft's 6.x compatibility package. `tsc` itself is 7.
import ts from '@typescript/typescript6';

const ROOT = new URL('..', import.meta.url).pathname;

// `--src <dir>` lets the self-test point the linter at fixture sources.
const srcArg = process.argv.indexOf('--src');
const SRC = srcArg === -1 ? join(ROOT, 'src') : join(ROOT, process.argv[srcArg + 1]);
const SELF_TEST = srcArg !== -1;

const problems = [];
const fail = (file, message) => problems.push({ file, message });

function walk(dir, ext, out = []) {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, ext, out);
    else if (ext.some((e) => entry.endsWith(e))) out.push(full);
  }
  return out;
}

// ---- 1 & 2: component stylesheets ----------------------------------------

/*
 * 7. EVERY --pp-* A COMPONENT READS RESOLVES TO SOMETHING.
 *
 * `var(--pp-font-size-sm)` is valid CSS, passes stylelint and renders: the
 * property is undefined, so the declaration is invalid at computed-value
 * time and the value is inherited instead. AppShell's skip link shipped that
 * way — the scale is `--pp-font-size-1` to `-9`, and `sm` is a Text size, not
 * a token — and nothing said so until an example page read the stylesheet
 * (D-102 §7). A reference counts as defined when a token file or any library
 * stylesheet declares it, or when it is a component's own override hook
 * (`--pp-<component>`, `--pp-<component>-*`), which is undefined by design
 * until a consumer sets it. The tokens are always the repository's own, so
 * the self-test's fixture is judged against the real scales.
 */
const DEFINED = new Set();
const COMPONENT_HOOKS = new Set();
for (const file of [
  ...walk(join(ROOT, 'src/styles'), ['.css']),
  ...walk(join(ROOT, 'src/components'), ['.css']),
  ...walk(join(SRC, 'components'), ['.css']),
]) {
  for (const m of readFileSync(file, 'utf8').matchAll(/(--pp-[a-z0-9-]+)\s*:/g)) DEFINED.add(m[1]);
  const name = file.split(/[\\/]/).pop().replace(/\.css$/, '');
  COMPONENT_HOOKS.add(`--pp-${name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()}`);
}
const isHook = (token) => [...COMPONENT_HOOKS].some((hook) => token === hook || token.startsWith(`${hook}-`));

const BANNED_PROP_NAMES = new Set([
  'fullWidth', 'width', 'maxWidth', 'minWidth', 'fullwidth',
  'margin', 'm', 'mt', 'mb', 'ml', 'mr', 'mx', 'my',
  'as', 'color', 'kind', 'appearance', 'theme', 'spacing',
]);

for (const file of walk(join(SRC, 'components'), ['.css'])) {
  const css = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);

  if (!/@layer\s+pp\.components\s*\{/.test(css)) {
    fail(rel, 'component CSS must be wrapped in `@layer pp.components { … }` (RULES §3)');
  }
  for (const m of css.matchAll(/--pp-palette-[a-z0-9-]+/g)) {
    fail(rel, `references the raw palette token \`${m[0]}\` — components consume semantic or --pp-tone-* tokens only (RULES §3)`);
  }
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/var\(\s*(--pp-[a-z0-9-]+)/g)) {
    if (DEFINED.has(m[1]) || isHook(m[1])) continue;
    fail(rel, `reads \`${m[1]}\`, which no token file or stylesheet defines — an undefined var() is invalid at computed-value time and falls back silently (D-102 §7)`);
  }

  /*
   * 6. NO SELECTOR LIST MIXES A -webkit- AND A -moz- PSEUDO-ELEMENT.
   *
   * An unknown pseudo-element invalidates the ENTIRE selector list in the
   * engine that does not know it, so
   *
   *     .x::-webkit-slider-thumb,
   *     .x::-moz-range-thumb { … }
   *
   * silently unstyles the thumb in Firefox while looking correct in Chrome —
   * no console warning, no visual signal on the machine of the person who
   * wrote it, and the two blocks look like copy-paste begging to be tidied
   * away. Stylelint cannot see this: each selector is individually valid.
   *
   * This exists instead of the browser assertion `tier-3d-composite.md` §8
   * promised. That assertion was to compare the thumb "in both Chromium and
   * Firefox projects"; `playwright.config.ts` defines ONE project and the
   * environment ships one browser, so it could never have run — and a test
   * that silently does not exist reads exactly like one that passes
   * (D-051 §4). A static check of the precise failure mode runs everywhere.
   */
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of withoutComments.matchAll(/([^{}]+)\{/g)) {
    const selector = m[1];
    if (/::-webkit-/.test(selector) && /::-moz-/.test(selector)) {
      fail(
        rel,
        `one selector list mixes \`::-webkit-\` and \`::-moz-\` pseudo-elements — an unknown pseudo-element invalidates the WHOLE list, so this unstyles one engine silently. Write the blocks out separately (tier-3d-composite.md §8, D-051 §4)`,
      );
    }
  }
}

// ---- 3 & 4: TypeScript sources -------------------------------------------

/*
 * NOT `useId`: React's server dispatcher implements it (an id from the
 * request's counter), and a Server Component that names a region by its
 * caption needs one (Table, D-081 §4). Everything here is state, an effect,
 * a ref or a context, none of which exists on the server.
 */
const CLIENT_ONLY = new Set([
  'useState', 'useReducer', 'useEffect', 'useLayoutEffect', 'useRef',
  'useContext', 'useSyncExternalStore', 'useTransition', 'createContext',
]);

/*
 * The 'use client' rule is about RSC correctness of what SHIPS, and these files
 * do not ship — tsconfig.build.json excludes exactly this list from the package
 * build. A test that renders a controlled component needs an owner with
 * `useState`, which RULES §5.5 makes compulsory for every stateful component,
 * so the alternative is a 'use client' directive at the top of every test file
 * in Tier 3 that means nothing and protects nothing.
 *
 * Kept as narrow as the build's own exclusion, and the self-test asserts both
 * halves: that the rule still fires for a shipped file, and that it does not
 * fire for one of these.
 */
const NOT_SHIPPED = /(\.test\.tsx?$|[\\/]test[\\/])/;

for (const file of walk(SRC, ['.ts', '.tsx'])) {
  const code = readFileSync(file, 'utf8');
  const rel = relative(ROOT, file);

  const source = ts.createSourceFile(rel, code, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);

  /*
   * IDENTIFIERS, NOT TEXT. This was a regex over the raw source, and it flagged
   * `useId()` written inside a sentence in Label's JSDoc — a comment whose
   * entire point was that Label deliberately does NOT call it, because ids come
   * from Field. A hook named in prose is not a hook call, exactly as the word
   * `document` in a comment is not a module-scope access; the rule below was
   * already fixed for that, and this is the same defect in the rule above it.
   *
   * The self-test asserts both directions: the rule still fires for a shipped
   * file that really calls a hook, and does not fire for one that only talks
   * about them.
   */
  let usesClientOnly = false;
  const findClientOnly = (node) => {
    if (usesClientOnly) return;
    if (ts.isIdentifier(node) && CLIENT_ONLY.has(node.text)) usesClientOnly = true;
    else ts.forEachChild(node, findClientOnly);
  };
  findClientOnly(source);

  if (!NOT_SHIPPED.test(rel) && usesClientOnly && !/^\s*(['"])use client\1/.test(code)) {
    fail(rel, "uses client-only React but is missing the 'use client' directive (RULES §7)");
  }

  const visit = (node) => {
    const isPropsType =
      (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
      node.name.text.endsWith('Props');

    if (isPropsType) {
      const members = ts.isInterfaceDeclaration(node)
        ? node.members
        : ts.isTypeLiteralNode(node.type)
          ? node.type.members
          : [];
      for (const member of members) {
        const name = member.name && ts.isIdentifier(member.name) ? member.name.text : null;
        if (name && BANNED_PROP_NAMES.has(name)) {
          const { line } = source.getLineAndCharacterOfPosition(member.getStart(source));
          fail(rel, `${node.name.text} declares banned prop \`${name}\` at line ${line + 1} — see the banned table in RULES §10`);
        }
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);

  // Module-scope browser globals break SSR. Only code that RUNS at module
  // evaluation matters: an identifier inside a function body runs later, in
  // the browser, and a word inside a comment, a string or a type never runs
  // at all. So this walks the AST for identifier nodes rather than grepping
  // text — the text version flagged the word "document" in a JSDoc.
  const BROWSER_GLOBALS = new Set(['window', 'document', 'localStorage', 'sessionStorage', 'matchMedia']);
  const isDeferred = (node) =>
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isTypeNode(node);

  const findModuleScopeGlobal = (node) => {
    if (isDeferred(node)) return null;
    if (ts.isIdentifier(node) && BROWSER_GLOBALS.has(node.text)) {
      // `foo.document` is a property, not the global.
      const isPropertyName = ts.isPropertyAccessExpression(node.parent) && node.parent.name === node;
      if (!isPropertyName) return node;
    }
    let found = null;
    ts.forEachChild(node, (child) => {
      if (!found) found = findModuleScopeGlobal(child);
    });
    return found;
  };

  for (const statement of source.statements) {
    const hit = findModuleScopeGlobal(statement);
    if (hit) {
      const { line } = source.getLineAndCharacterOfPosition(hit.getStart(source));
      fail(rel, `\`${hit.text}\` is accessed at module scope (line ${line + 1}) — breaks SSR (RULES §7)`);
    }
  }
}

// ---- 5: cascade layer order in the built stylesheet -----------------------

const EXPECTED_LAYERS = ['pp.reset', 'pp.tokens', 'pp.base', 'pp.components', 'pp.overrides'];
const dist = join(ROOT, 'dist/pixel-perfect.css');

if (SELF_TEST) {
  // fixtures have no build output of their own
} else if (!existsSync(dist)) {
  console.log('• dist/pixel-perfect.css not built — skipping layer-order check (run `npm run build:css`)');
} else {
  const css = readFileSync(dist, 'utf8');
  const established = [];
  const re = /@layer\s+([^;{]+)([;{])/g;
  for (let m; (m = re.exec(css)); ) {
    for (const name of m[1].split(',').map((n) => n.trim()).filter(Boolean)) {
      if (!established.includes(name)) established.push(name);
    }
  }
  const relevant = established.filter((n) => EXPECTED_LAYERS.includes(n));
  const expected = EXPECTED_LAYERS.filter((n) => relevant.includes(n));
  if (relevant.join(' < ') !== expected.join(' < ')) {
    fail(
      'dist/pixel-perfect.css',
      `cascade layers are established as [${relevant.join(', ')}] but must be [${expected.join(', ')}] — check the @import order in src/styles/index.css`,
    );
  }
}

// ---- report ---------------------------------------------------------------

if (SELF_TEST) {
  console.log(JSON.stringify(problems, null, 2));
  process.exit(0);
}

if (problems.length > 0) {
  for (const p of problems) console.error(`✗ ${p.file}: ${p.message}`);
  console.error(`\n${problems.length} rule violation(s)`);
  process.exit(1);
}
console.log('✓ rule lint passed');
