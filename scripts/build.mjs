import { cp, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { auditSource, auditSite, sourceFiles, generatedFigures } from './project.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
await auditSource(root);
const temporary = await mkdtemp(path.join(tmpdir(), 'chronotype-build-'));
const output = path.join(root, 'docs');
try {
  for (const file of sourceFiles) {
    await mkdir(path.dirname(path.join(temporary, file)), { recursive: true });
    await cp(path.join(root, file), path.join(temporary, file));
  }
  const library = process.env.R_LIBS_USER || path.join(root, '.R-library');
  const render = spawnSync('quarto', ['render'], {
    cwd: temporary,
    env: { ...process.env, R_LIBS_USER: library.split(path.delimiter).map(p => path.resolve(root, p)).join(path.delimiter) },
    stdio: 'inherit'
  });
  if (render.error) throw render.error;
  if (render.status !== 0) throw new Error('Quarto render failed; previous docs/ preserved. Run npm run setup if dependencies are missing.');
  // Quarto enumerates resource files before the notebooks generate these exports.
  for (const file of generatedFigures) {
    await cp(path.join(temporary, file), path.join(temporary, 'docs', file));
  }
  const count = await auditSite(path.join(temporary, 'docs'));
  // Only a successful, audited build replaces the previous site.
  await rm(output, { recursive: true, force: true });
  await cp(path.join(temporary, 'docs'), output, { recursive: true });
  console.log(`Clean build complete: ${count} public files in docs/.`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
