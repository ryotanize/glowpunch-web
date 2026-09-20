import test from 'node:test';
import assert from 'node:assert/strict';
import { isIndexable } from '../src/data/content-policy.mjs';
import { createToolEventReporter } from '../src/components/tool-events.ts';

test('sitemap includes guides and tools, excludes history and all 404 spellings', () => {
  for (const path of ['/', '/blog/', '/blog/pdf-editor/', '/tools/pdf-editor/', '/privacy-policy/']) assert(isIndexable(`https://glowpunch.net${path}`));
  for (const path of ['/404', '/404/', '/404.html', '/blog/first-post/', '/blog/glow-frame']) assert(!isIndexable(`https://glowpunch.net${path}`));
});

test('analytics reports only allowed fields and does not duplicate terminal events', () => {
  const sent = [];
  const reporter = createToolEventReporter({siteRevision: 'a'.repeat(40), send: (name, params) => sent.push({name, params})});
  const operation = reporter.start('analyze');
  operation.error('private-filename.pdf'); // unknown errors must not be sent
  operation.success(); operation.error('processing_failed'); operation.success();
  assert.deepEqual(sent.map(event => event.name), ['tool_start', 'tool_success']);
  assert.deepEqual(Object.keys(sent[0].params).sort(), ['measurement_version', 'operation', 'site_revision', 'tool_id']);
  reporter.start('private-input-text').success();
  assert.equal(sent.length, 2);
});

test('cancellation and invalid revisions never emit success or leak errors', () => {
  const sent = [];
  const reporter = createToolEventReporter({siteRevision:'a'.repeat(40), send: name => sent.push(name)});
  const first = reporter.start('analyze');
  const next = reporter.start('normalize');
  first.success(); next.cancel(); next.error('worker_failed');
  assert.deepEqual(sent, ['tool_start', 'tool_start']);
  createToolEventReporter({siteRevision:'invalid',send: name => sent.push(name)}).start('analyze').success();
  assert.equal(sent.length, 2);
});
