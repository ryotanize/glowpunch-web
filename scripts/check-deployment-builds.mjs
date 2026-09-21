import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
const root = mkdtempSync(join(process.cwd(), '.build-mode-check-'));
try {
  for (const branch of ['main', 'feat/adsense-readiness']) {
    const output = join(root, branch === 'main' ? 'production' : 'preview');
    execFileSync(process.execPath, ['node_modules/astro/bin/astro.mjs', 'build', '--outDir', output], {
      env: {...process.env, CF_PAGES:'1', CF_PAGES_BRANCH:branch, PUBLIC_ADSENSE_ENABLED:'true', PUBLIC_GA_MEASUREMENT_ID:'G-TEST12345'},
      stdio:'pipe',
    });
    const html = readFileSync(join(output, 'index.html'), 'utf8');
    const history = readFileSync(join(output, 'changelog/index.html'), 'utf8');
    const preview = branch !== 'main';
    assert.equal(html.includes('name="robots" content="noindex, follow"'), preview);
    assert.equal(html.includes('pagead2.googlesyndication.com'), !preview);
    assert.equal(html.includes('www.googletagmanager.com'), !preview);
    assert.equal(history.includes('pagead2.googlesyndication.com'), !preview);
    assert.equal(history.includes('www.googletagmanager.com'), !preview);
    assert.equal(history.includes('name="robots" content="noindex, follow"'), preview);
    console.log(`${branch}: indexing and third-party script isolation passed.`);
  }
} finally {
  rmSync(root, {recursive:true, force:true});
}
