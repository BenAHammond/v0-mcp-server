import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Package identity, resolved once from the nearest `package.json`. */
export interface PackageMeta {
  name: string;
  version: string;
}

const FALLBACK: PackageMeta = { name: 'v0-mcp-server', version: '1.0.0' };

/**
 * Walk up from `startDir` to the nearest `package.json`. This survives tsup
 * bundling: the library (`dist/index.js`) and the CLI (`dist/cli/index.js`)
 * both sit under the package root, so a bounded upward search finds the real
 * manifest regardless of how many `dist/` levels separate them.
 */
function findPackageJson(startDir: string): string | null {
  let dir = startDir;
  for (let depth = 0; depth < 10; depth += 1) {
    const candidate = join(dir, 'package.json');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
  return null;
}

function loadPackageMeta(): PackageMeta {
  try {
    const startDir = dirname(fileURLToPath(import.meta.url));
    const packagePath = findPackageJson(startDir);
    if (packagePath) {
      const pkg = JSON.parse(readFileSync(packagePath, 'utf-8'));
      return {
        name: pkg.name ?? FALLBACK.name,
        version: pkg.version ?? FALLBACK.version
      };
    }
  } catch {
    // fall through to defaults if the manifest is missing or malformed
  }
  return FALLBACK;
}

/** Package name and version, read once at module load. */
export const PACKAGE_META: PackageMeta = loadPackageMeta();
