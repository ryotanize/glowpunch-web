import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { guideIds } from '../src/data/content-policy.mjs';
const files = readdirSync('src/content/blog').filter(name => name.endsWith('.md'));
const titles = new Set();
const prohibitedSafetyClaims = [
  /情報漏洩(?:の)?リスク(?:は)?ゼロ/,
  /流出リスクゼロ/,
  /プライバシーが完全に守られ(?:る|ます)/,
  /(?:機密(?:情報|文書|動画|書類)?|社外秘(?:の[^\s、。]*)?|個人情報(?:を含む[^\s、。]*)?)(?:でも|でも、|でも。)?(?:安全|安心)/,
  /一切どこへも送信され(?:ない|ません)/,
  /完全ローカル(?:処理)?(?:だから|で)(?:安全|安心)/,
  /(?:画像|動画|すべての)?データが外部(?:サーバー)?に送信されることはありません/,
  /(?:画像|動画|すべての)?データは外部(?:サーバー)?に送信されません/,
];

function astroFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return astroFiles(path);
    return entry.name.endsWith('.astro') ? [path] : [];
  });
}

function assertNoUnsafeClaims(file, text) {
  for (const pattern of prohibitedSafetyClaims) {
    assert(!pattern.test(text), `${file}: unsafe privacy or security claim (${pattern})`);
  }
}
for (const file of files) {
  const text = readFileSync(`src/content/blog/${file}`, 'utf8');
  for (const field of ['title', 'description', 'pubDate']) assert.match(text, new RegExp(`^${field}: .+`, 'm'), `${file}: missing ${field}`);
  const title = text.match(/^title: (.+)$/m)[1];
  assert(!titles.has(title), `${file}: duplicate title`); titles.add(title);
  assert(!/^# /m.test(text), `${file}: body must not duplicate the template h1`);
  assertNoUnsafeClaims(`src/content/blog/${file}`, text);
  for (const [, href] of text.matchAll(/\]\((\/[^)#]+)(?:#[^)]*)?\)/g)) {
    const path = href.replace(/\/$/, '');
    const target = path.startsWith('/blog/') ? `src/content/blog/${path.slice(6)}.md` : `src/pages${path}.astro`;
    assert(existsSync(target) || existsSync(`src/pages${path}/index.astro`), `${file}: broken link ${href}`);
  }
}
for (const id of guideIds) assert(existsSync(`src/content/blog/${id}.md`), `Missing guide ${id}`);
const interfaceFiles = [...astroFiles('src/pages'), ...astroFiles('src/components')];
for (const file of interfaceFiles) {
  assertNoUnsafeClaims(file, readFileSync(file, 'utf8'));
}
console.log(`Content lint: ${files.length} articles and ${interfaceFiles.length} Astro files; metadata, headings, internal links and safety claims checked.`);
