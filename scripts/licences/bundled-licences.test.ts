import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { licenceFileName, lockedPackages, packageRoot, readPackage } from './bundled-licences.ts';

describe('packageRoot', () => {
  it('finds the package directory inside the pnpm store', () => {
    expect(
      packageRoot('/app/node_modules/.pnpm/devalue@5.9.4/node_modules/devalue/src/parse.js')
    ).toBe('/app/node_modules/.pnpm/devalue@5.9.4/node_modules/devalue');
  });

  it('keeps both segments of a scoped name', () => {
    expect(packageRoot('/app/node_modules/@sveltejs/kit/src/runtime/client/client.js')).toBe(
      '/app/node_modules/@sveltejs/kit'
    );
  });

  it('ignores virtual-module prefixes, queries, and Windows separators', () => {
    expect(packageRoot('\0C:\\app\\node_modules\\clsx\\dist\\clsx.mjs?commonjs-proxy')).toBe(
      'C:/app/node_modules/clsx'
    );
  });

  it('returns null for application code and virtual modules', () => {
    expect(packageRoot('/app/src/routes/+page.svelte')).toBeNull();
    expect(packageRoot('\0virtual:bundled-licences')).toBeNull();
    expect(packageRoot('/app/node_modules/@scope')).toBeNull();
  });
});

describe('licenceFileName', () => {
  it('accepts the usual spellings and extensions in any case', () => {
    for (const name of ['LICENSE', 'license', 'LICENCE', 'LICENSE.md', 'License.txt', 'COPYING']) {
      expect(licenceFileName(['package.json', name])).toBe(name);
    }
  });

  it('ignores other files that merely mention a licence', () => {
    expect(licenceFileName(['package.json', 'LICENSE-THIRD-PARTY.md', 'licenses.json'])).toBeNull();
  });
});

describe('lockedPackages', () => {
  const lockfile = [
    "lockfileVersion: '9.0'",
    '',
    'importers:',
    '  .:',
    '    devDependencies:',
    '      svelte:',
    '        specifier: 5.57.1',
    '',
    'packages:',
    '',
    "  '@sveltejs/kit@2.70.3':",
    '    resolution: {integrity: sha512-x}',
    '',
    '  devalue@5.9.4:',
    '    resolution: {integrity: sha512-y}',
    '',
    'snapshots:',
    '',
    '  set-cookie-parser@3.1.2: {}',
    ''
  ].join('\n');

  it('reads name@version keys from the packages section only', () => {
    expect(lockedPackages(lockfile)).toEqual(new Set(['@sveltejs/kit@2.70.3', 'devalue@5.9.4']));
  });
});

describe('readPackage', () => {
  let root = '';
  const locked = new Set(['example@1.2.3']);

  function fixture(manifest: object, files: Record<string, string> = {}): string {
    root = mkdtempSync(join(tmpdir(), 'onihayo-licence-'));
    writeFileSync(join(root, 'package.json'), JSON.stringify(manifest));
    for (const [name, content] of Object.entries(files)) writeFileSync(join(root, name), content);
    return root;
  }

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('reads the name, version, licence, and trimmed licence text', () => {
    const dir = fixture(
      { name: 'example', version: '1.2.3', license: 'MIT' },
      { 'LICENSE.md': '\nMIT License\n\nCopyright (c) Example\n' }
    );
    expect(readPackage(dir, locked)).toEqual({
      name: 'example',
      version: '1.2.3',
      licence: 'MIT',
      text: 'MIT License\n\nCopyright (c) Example'
    });
  });

  it('rejects a package that is not in the lockfile', () => {
    const dir = fixture({ name: 'example', version: '9.9.9', license: 'MIT' }, { LICENSE: 'x' });
    expect(() => readPackage(dir, locked)).toThrow(
      'example@9.9.9 is bundled but not in pnpm-lock.yaml'
    );
  });

  it('rejects licences outside the dependency policy', () => {
    const dir = fixture(
      { name: 'example', version: '1.2.3', license: 'GPL-3.0' },
      { LICENSE: 'x' }
    );
    expect(() => readPackage(dir, locked)).toThrow('"GPL-3.0", which is not in the allowed list');
  });

  it('rejects a missing licence field', () => {
    const dir = fixture({ name: 'example', version: '1.2.3' }, { LICENSE: 'x' });
    expect(() => readPackage(dir, locked)).toThrow('undefined, which is not in the allowed list');
  });

  it('rejects a package without a licence file', () => {
    const dir = fixture({ name: 'example', version: '1.2.3', license: 'MIT' });
    expect(() => readPackage(dir, locked)).toThrow('example@1.2.3 ships no licence file');
  });
});
