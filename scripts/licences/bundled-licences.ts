/**
 * Build-time licence list for the Licences page.
 *
 * The page imports `virtual:bundled-licences` from its server load. During
 * `vite build` this plugin replaces that module's placeholder with the name,
 * version, licence, and licence text of every third-party package whose code
 * ends up in the server bundle, read from the bundle's module graph (not from
 * package.json, which also lists build tools). Each package must match an entry
 * in pnpm-lock.yaml and use a licence from the policy in
 * docs/security/dependencies.md, or the build fails. The client bundle, built
 * afterwards by a separate Vite run, is checked to contain no package missing
 * from the list, which the server build leaves in `.svelte-kit/`.
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import type { Plugin, Rolldown } from 'vite';
import type { BundledPackage } from '../../src/lib/licences.ts';

const virtualId = 'virtual:bundled-licences';
const resolvedVirtualId = `\0${virtualId}`;
const placeholder = '__ONIHAYO_BUNDLED_LICENCES__';
const listedFile = '.svelte-kit/bundled-licences.json';

/** Licences compatible with MIT distribution (docs/security/dependencies.md). */
const allowedLicences = new Set([
  'MIT',
  'ISC',
  '0BSD',
  'BSD-2-Clause',
  'BSD-3-Clause',
  'Apache-2.0'
]);

/**
 * adapter-node copies its prebuilt server files into `build/` after Vite has
 * finished, so they never appear in the module graph. Those files include code
 * from packages that are adapter-node's own dev dependencies and therefore not in
 * the lockfile. Checked by hand against the registry for this adapter version.
 */
const adapter = {
  name: '@sveltejs/adapter-node',
  version: '5.5.7',
  note: 'Its server files also include code from polka, @polka/url, sirv, mrmime, and totalist by Luke Edwards, all under the MIT licence.'
};

/** The package directory a module ID belongs to, or null for application code. */
export function packageRoot(moduleId: string): string | null {
  const path = moduleId.replace(/^\0/u, '').split('?')[0]?.replaceAll('\\', '/') ?? '';
  const marker = '/node_modules/';
  const start = path.lastIndexOf(marker);
  if (start === -1) return null;
  const segments = path.slice(start + marker.length).split('/');
  const nameLength = segments[0]?.startsWith('@') ? 2 : 1;
  if (segments.length <= nameLength) return null;
  return path.slice(0, start + marker.length) + segments.slice(0, nameLength).join('/');
}

/** The licence file among a package's files: LICENSE, LICENCE, COPYING, optionally .md/.txt. */
export function licenceFileName(fileNames: readonly string[]): string | null {
  return fileNames.find((name) => /^(licen[cs]e|copying)(\.(md|txt))?$/iu.test(name)) ?? null;
}

/** Every `name@version` in the lockfile's `packages:` section. */
export function lockedPackages(lockfile: string): Set<string> {
  const locked = new Set<string>();
  let inPackages = false;
  for (const line of lockfile.split('\n')) {
    if (!line.startsWith(' ') && line.trim() !== '') inPackages = line === 'packages:';
    if (!inPackages) continue;
    const entry = /^ {2}'?((?:@[^@/'\s]+\/)?[^@/'\s]+@[^'():\s]+)'?:/u.exec(line);
    if (entry?.[1]) locked.add(entry[1]);
  }
  return locked;
}

/** Name, version, licence, and licence text of the package installed at `root`. */
export function readPackage(root: string, locked: ReadonlySet<string>): BundledPackage {
  const manifest: unknown = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (typeof manifest !== 'object' || manifest === null) {
    throw new Error(`${root}/package.json is not an object`);
  }
  const { name, version, license } = manifest as Record<string, unknown>;
  if (typeof name !== 'string' || typeof version !== 'string') {
    throw new Error(`${root}/package.json has no name or version`);
  }
  if (!locked.has(`${name}@${version}`)) {
    throw new Error(`${name}@${version} is bundled but not in pnpm-lock.yaml`);
  }
  if (typeof license !== 'string' || !allowedLicences.has(license)) {
    throw new Error(
      `${name}@${version} has licence ${JSON.stringify(license)}, which is not in the allowed list (docs/security/dependencies.md)`
    );
  }
  const file = licenceFileName(readdirSync(root));
  if (file === null) throw new Error(`${name}@${version} ships no licence file`);
  const text = readFileSync(join(root, file), 'utf8').trim();
  return { name, version, licence: license, text };
}

/** Package directories of every module that contributes code to a bundle. */
function bundledRoots(bundle: Rolldown.OutputBundle): Set<string> {
  const roots = new Set<string>();
  for (const output of Object.values(bundle)) {
    if (output.type !== 'chunk') continue;
    for (const [id, module] of Object.entries(output.modules)) {
      const root = module.renderedLength > 0 ? packageRoot(id) : null;
      if (root !== null) roots.add(root);
    }
  }
  return roots;
}

export function bundledLicences(): Plugin {
  let projectRoot = process.cwd();
  let serving = false;

  return {
    name: 'onihayo:bundled-licences',
    configResolved(config) {
      projectRoot = config.root;
      serving = config.command === 'serve';
    },
    resolveId(id) {
      return id === virtualId ? resolvedVirtualId : null;
    },
    load(id) {
      if (id !== resolvedVirtualId) return null;
      if (this.environment.name === 'client') {
        this.error(`${virtualId} is server-only; import it from a +page.server.ts load`);
      }
      // The list only exists once a production bundle does; the page says so in dev.
      if (serving) return 'export default null;';
      return `export default JSON.parse(${JSON.stringify(placeholder)});`;
    },
    generateBundle(_options, bundle) {
      const roots = bundledRoots(bundle);
      const locked = lockedPackages(readFileSync(join(projectRoot, 'pnpm-lock.yaml'), 'utf8'));

      if (this.environment.name === 'client') {
        let listed: unknown;
        try {
          listed = JSON.parse(readFileSync(join(projectRoot, listedFile), 'utf8'));
        } catch {
          this.error(`${listedFile} is missing: the server bundle must be built first`);
        }
        const names = new Set(Array.isArray(listed) ? listed : []);
        const missing = [...roots]
          .map((root) => readPackage(root, locked).name)
          .filter((name) => !names.has(name));
        if (missing.length > 0) {
          this.error(
            `client bundle includes packages missing from the Licences page: ${missing.join(', ')}`
          );
        }
        return;
      }

      const require = createRequire(join(projectRoot, 'package.json'));
      roots.add(dirname(require.resolve(`${adapter.name}/package.json`)));
      const packages = [...roots].map((root) => {
        const pkg = readPackage(root, locked);
        if (pkg.name !== adapter.name) return pkg;
        if (pkg.version !== adapter.version) {
          this.error(
            `${adapter.name} is now ${pkg.version}: re-check which packages its server files include and update the note in scripts/licences/bundled-licences.ts`
          );
        }
        return { ...pkg, note: adapter.note };
      });
      packages.sort((a, b) => a.name.localeCompare(b.name, 'en'));
      const listedPath = join(projectRoot, listedFile);
      mkdirSync(dirname(listedPath), { recursive: true });
      writeFileSync(listedPath, JSON.stringify(packages.map((pkg) => pkg.name)));

      const literal = JSON.stringify(placeholder);
      const replacement = JSON.stringify(JSON.stringify(packages));
      let replaced = 0;
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk' || !output.code.includes(literal)) continue;
        replaced += output.code.split(literal).length - 1;
        output.code = output.code.replaceAll(literal, replacement);
      }
      if (replaced !== 1) {
        this.error(`expected ${virtualId} in exactly one server chunk, found ${String(replaced)}`);
      }
    }
  };
}
