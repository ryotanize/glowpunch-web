import { readdirSync, readFileSync, existsSync } from 'node:fs';
import assert from 'node:assert/strict';
import { guideIds } from '../src/data/content-policy.mjs';
const files = readdirSync('src/content/blog').filter(name => name.endsWith('.md'));
const titles = new Set();
for (const file of files) {
  const text = readFileSync(`src/content/blog/${file}`, 'utf8');
  for (const field of ['title', 'description', 'pubDate']) assert.match(text, new RegExp(`^${field}: .+`, 'm'), `${file}: missing ${field}`);
  const title = text.match(/^title: (.+)$/m)[1];
  assert(!titles.has(title), `${file}: duplicate title`); titles.add(title);
  assert(!/^# /m.test(text), `${file}: body must not duplicate the template h1`);
  assert(!/リスクはゼロ|流出リスクゼロ|プライバシーが完全に守られ/.test(text), `${file}: absolute safety claim`);
  for (const [, href] of text.matchAll(/\]\((\/[^)#]+)(?:#[^)]*)?\)/g)) {
    const path = href.replace(/\/$/, '');
    const target = path.startsWith('/blog/') ? `src/content/blog/${path.slice(6)}.md` : `src/pages${path}.astro`;
    assert(existsSync(target) || existsSync(`src/pages${path}/index.astro`), `${file}: broken link ${href}`);
  }
}
for (const id of guideIds) assert(existsSync(`src/content/blog/${id}.md`), `Missing guide ${id}`);
console.log(`Content lint: ${files.length} articles; titles, metadata, headings, internal links and safety claims checked.`);
