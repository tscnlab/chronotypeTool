import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { auditSite, publicFiles, resolveLocalLink } from '../scripts/project.mjs';
import reference from '../assets/reference-data.js';
import { referenceGeometry } from '../assets/charts.js';

test('reference contains only fixed aggregate counts and metadata', () => {
  assert.deepEqual(Object.keys(reference).sort(), ['schema', 'metric', 'instrument', 'n', 'binMinutes', 'startMinute', 'counts'].sort());
  assert.equal(reference.n, 679);
  assert.equal(reference.metric, 'MSFsc');
  assert.equal(reference.instrument, 'µMCTQ');
  assert.ok(Object.isFrozen(reference) && Object.isFrozen(reference.counts));
  assert.equal(referenceGeometry(reference).bins.reduce((sum, bin) => sum + bin.count, 0), 679);
});

test('local assets and workers resolve beneath a GitHub project path', () => {
  for (const [link, from] of [['./', 'index.html'], ['methods.html#scoring', 'index.html'], ['./scoring-worker.js', 'assets/app.js'], ['./scoring.js', 'assets/scoring-worker.js']]) {
    assert.doesNotThrow(() => resolveLocalLink(link, from, publicFiles));
  }
  for (const link of ['/assets/app.js', '//example.invalid/app.js', '../index.html', 'assets/missing.js']) {
    assert.throws(() => resolveLocalLink(link, 'index.html', publicFiles));
  }
});

test('deployment audit rejects extra attachments, broken links and symlinks', async () => {
  const root = await mkdtemp(path.join(tmpdir(), 'chronotype-audit-test-'));
  try {
    for (const file of publicFiles) {
      await mkdir(path.dirname(path.join(root, file)), { recursive: true });
      await writeFile(path.join(root, file), '');
    }
    assert.equal(await auditSite(root), publicFiles.length);
    await writeFile(path.join(root, 'survey.pdf'), 'Synthetic attachment');
    await assert.rejects(auditSite(root), /Unexpected files: survey.pdf/);
    await rm(path.join(root, 'survey.pdf'));
    await writeFile(path.join(root, 'index.html'), '<script src="/assets/app.js"></script>');
    await assert.rejects(auditSite(root), /Non-portable local URL/);
    await writeFile(path.join(root, 'index.html'), '<img src="assets/missing.png">');
    await assert.rejects(auditSite(root), /Broken local URL/);
    await writeFile(path.join(root, 'index.html'), '');
    await rm(path.join(root, 'assets/tum-en.png'));
    await symlink(path.join(root, 'assets/tum-de.png'), path.join(root, 'assets/tum-en.png'));
    await assert.rejects(auditSite(root), /Symlink is not allowed/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
