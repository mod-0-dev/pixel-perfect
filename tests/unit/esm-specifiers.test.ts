import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

import { fixSpecifiers } from '../../scripts/esm-specifiers.mjs';

/**
 * The package is `"type": "module"`, so outside a lenient bundler every
 * relative import in dist/ must name its file: Node, webpack 5 and
 * TypeScript under `nodenext` all refuse `./components/Button/Button`.
 * The build rewrites what tsc wrote; this proves the rewrite on a fixture.
 */

let dir = '';
afterEach(() => rmSync(dir, { recursive: true, force: true }));

function fixture(files: Record<string, string>) {
  dir = mkdtempSync(join(tmpdir(), 'pp-esm-'));
  for (const [path, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), body);
  }
}
const read = (path: string) => readFileSync(join(dir, path), 'utf8');

describe('relative imports in dist/', () => {
  it('get the extension of the file tsc wrote, or its index', () => {
    fixture({
      'index.js': "export { A } from './a';\nexport * from './dir';\nimport('./a');\nimport './a.js';\nimport 'react';\n",
      'index.d.ts': "export { A } from './a';\nexport type B = import('./dir').B;\n",
      'a.js': 'export const A = 1;\n',
      'a.d.ts': 'export declare const A = 1;\n',
      'dir/index.js': 'export const B = 1;\n',
      'dir/index.d.ts': 'export type B = 1;\n',
      'theme/index.mjs': "export * from './color';\n",
      'theme/index.d.mts': "export * from './color';\n",
      'theme/color.mjs': '',
      'theme/color.d.mts': '',
    });
    expect(fixSpecifiers(dir)).toBe(7);
    expect(read('index.js')).toBe(
      "export { A } from './a.js';\nexport * from './dir/index.js';\nimport('./a.js');\nimport './a.js';\nimport 'react';\n",
    );
    expect(read('index.d.ts')).toBe("export { A } from './a.js';\nexport type B = import('./dir/index.js').B;\n");
    expect(read('theme/index.mjs')).toBe("export * from './color.mjs';\n");
    expect(read('theme/index.d.mts')).toBe("export * from './color.mjs';\n");
  });

  it('fail the build on one that names no file', () => {
    fixture({ 'index.js': "export * from './missing';\n" });
    expect(() => fixSpecifiers(dir)).toThrow(/cannot resolve '\.\/missing'/);
  });
});
