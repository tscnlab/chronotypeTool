import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

// Explicit manifests keep local attachments out of both the build and deployment.
export const sourceFiles = [
  '.github/workflows/pages.yml', '.gitignore', '.nojekyll', '_quarto.yml',
  'README.md', 'package.json', 'index.qmd', 'methods.qmd', 'reference.qmd',
  'assets/app.js', 'assets/charts.js', 'assets/favicon.svg', 'assets/methods.css',
  'assets/reference-data.js', 'assets/scoring-worker.js', 'assets/scoring.js',
  'assets/style.css', 'assets/tum-de.png', 'assets/tum-en.png',
  'scripts/build.mjs', 'scripts/check.mjs', 'scripts/fixtures.mjs',
  'scripts/project.mjs', 'scripts/reference.mjs', 'scripts/setup-r.R',
  'server/dev.mjs', 'tests/charts.test.mjs', 'tests/deployment.test.mjs',
  'tests/scoring.test.mjs'
];
export const generatedFigures = ['assets/reference-distribution.png', 'assets/scoring-validation.png'];
export const publicFiles = [
  '.nojekyll', 'index.html', 'methods.html', 'reference.html',
  ...sourceFiles.filter(file => file.startsWith('assets/')),
  ...generatedFigures
];
const localDirectories = new Set(['.git', '.R-library', '.quarto', 'node_modules', 'docs']);

async function listFiles(root, ignored = new Set(), relative = '') {
  const files = [];
  for (const entry of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const file = relative ? `${relative}/${entry.name}` : entry.name;
    if (!relative && ignored.has(entry.name) && entry.isDirectory()) continue;
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed: ${file}`);
    if (entry.isDirectory()) files.push(...await listFiles(root, ignored, file));
    else if (entry.isFile()) files.push(file);
    else throw new Error(`Unsupported file type: ${file}`);
  }
  return files.sort();
}

function exactFiles(actual, expected, label) {
  const unexpected = actual.filter(file => !expected.includes(file));
  const missing = expected.filter(file => !actual.includes(file));
  if (unexpected.length || missing.length) {
    throw new Error(`${label} audit failed.${unexpected.length ? ` Unexpected files: ${unexpected.join(', ')}.` : ''}${missing.length ? ` Missing files: ${missing.join(', ')}.` : ''}`);
  }
}

export async function auditSource(root) {
  exactFiles(await listFiles(root, localDirectories), sourceFiles, 'Source');
}

export function resolveLocalLink(value, from, files) {
  // External references and in-page anchors are not deployment assets.
  if (!value || value.startsWith('#') || /^(?:https?:|mailto:|tel:|data:)/i.test(value)) return;
  if (value.startsWith('/') || value.includes('\\') || /^[a-z][a-z\d+.-]*:/i.test(value)) {
    throw new Error(`Non-portable local URL in ${from}: ${value}`);
  }
  const base = new URL('https://example.invalid/chronotype-lab/');
  const url = new URL(value, new URL(from, base));
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) {
    throw new Error(`URL escapes the project path in ${from}: ${value}`);
  }
  let target = decodeURIComponent(url.pathname.slice(base.pathname.length));
  if (!target || target.endsWith('/')) target += 'index.html';
  if (!files.includes(target)) throw new Error(`Broken local URL in ${from}: ${value}`);
}

export async function auditSite(root) {
  const files = await listFiles(root);
  exactFiles(files, publicFiles, 'Deployment');
  for (const file of files) {
    if (!/\.(?:html|js|css)$/.test(file)) continue;
    const content = await readFile(path.join(root, file), 'utf8');
    const links = [];
    if (file.endsWith('.html')) {
      // Inspect URL attributes, excluding the embedded script bodies in reports.
      const html = content.replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>');
      for (const match of html.matchAll(/<(?:a|link|script|img|iframe|source|video|audio)\b[^>]*?\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) links.push(match[1]);
    } else if (file.endsWith('.js')) {
      for (const match of content.matchAll(/\bfrom\s+['"]([^'"]+)['"]|\bimport\s*['"]([^'"]+)['"]|\bnew URL\(\s*['"]([^'"]+)['"]\s*,\s*import\.meta\.url/g)) links.push(match[1] || match[2] || match[3]);
    } else {
      for (const match of content.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) links.push(match[1]);
    }
    for (const link of links) resolveLocalLink(link, file, files);
  }
  return files.length;
}
