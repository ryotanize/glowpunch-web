import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { PDFDocument } from 'pdf-lib';
import { tools } from '../../src/data/tools';
import { isGuide } from '../../src/data/content-policy.mjs';
test.beforeEach(async ({page}) => { page.on('pageerror', error => console.error('BROWSER ERROR:', error.message)); });
const articles = readdirSync('src/content/blog').map(name => name.replace(/\.md$/, ''));
const routes = ['/', '/blog/', '/guide/', '/about/', '/contact/', '/privacy-policy/', '/disclaimer/', ...tools.map(tool => `/tools/${tool.id}/`), ...articles.map(id => `/blog/${id}/`)];

for (const width of [390, 1280]) {
  test(`all public pages: navigation, metadata, structured data and layout at ${width}px`, async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    const validPaths = new Set(routes);
    for (const path of routes) {
      const response = await page.goto(path);
      if (['/', '/blog/', '/about/', '/tools/pdf-editor/'].includes(path)) await page.screenshot({path: testInfo.outputPath(`${path.replaceAll("/", "-") || "home"}-${width}.png`), fullPage: true});
      expect(response?.status(), path).toBe(200);
      await expect(page.locator('h1'), path).toHaveCount(1);
      await expect(page.locator('head link[rel="canonical"]')).toHaveAttribute('href', `https://glowpunch.net${path}`);
      expect(await page.locator('meta[name="description"]').getAttribute('content')).toBeTruthy();
      await expect(page.getByRole('navigation', { name: 'メインナビゲーション' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), path).toBe(true);
      const links = await page.locator('a[href^="/"]').evaluateAll(anchors => anchors.map(a => a.getAttribute('href')!.split('#')[0] || '/'));
      for (const href of links) expect(validPaths.has(href), `${path} links to ${href}`).toBe(true);
      const structured = await page.locator('script[type="application/ld+json"]').allTextContents();
      for (const data of structured) expect(() => JSON.parse(data)).not.toThrow();
      expect(await page.locator('script[src*="googlesyndication"], script[src*="googletagmanager"]').count()).toBe(0);
      if (path.startsWith('/blog/') && path !== '/blog/') {
        const id = path.split('/')[2];
        if (!isGuide(id) || process.env.PREVIEW_URL) await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, follow');
      }
    }
    expect(errors).toEqual([]);
  });
}

test('unknown pages return 404 with navigation, and sitemap excludes history', async ({ page, request }) => {
  const response = await page.goto('/not-a-real-glowpunch-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', {level:1})).toHaveText('ページが見つかりません');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content','noindex, follow');
  const sitemap = await (await request.get('/sitemap-0.xml')).text();
  expect(sitemap).toContain('https://glowpunch.net/blog/pdf-editor/');
  expect(sitemap).not.toContain('/blog/first-post/');
  expect(sitemap).not.toContain('/404');
  expect(await (await request.get('/robots.txt')).text()).toContain('Sitemap: https://glowpunch.net/sitemap-index.xml');
});

test('character and token counters process text without sending the input', async ({ page }) => {
  const marker = 'private-fixture-テスト';
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url() + (request.postData() || '')));
  await page.goto('/tools/character-counter/');
  await page.locator('#text-input').fill(marker);
  await expect(page.locator('#stat-chars')).toHaveText(String(marker.length));
  await page.locator('#btn-clear').click();
  await expect(page.locator('#stat-chars')).toHaveText('0');
  await page.goto('/tools/token-counter/');
  await page.locator('#text-input').fill(marker);
  await expect(page.locator('#stat-tokens')).not.toHaveText('0');
  await expect(page.locator('#stat-cost')).toHaveText('入力本文のみ');
  expect(requests.some(value => value.includes(marker) || value.includes(encodeURIComponent(marker)))).toBe(false);
});

test('PDF merge exports two readable pages in source order', async ({ page }) => {
  const first = await PDFDocument.create(); first.addPage([200,300]);
  const second = await PDFDocument.create(); second.addPage([400,500]);
  await page.goto('/tools/pdf-editor/');
  await page.locator('#file-input').setInputFiles([
    {name:'first.pdf',mimeType:'application/pdf',buffer:Buffer.from(await first.save())},
    {name:'second.pdf',mimeType:'application/pdf',buffer:Buffer.from(await second.save())},
  ]);
  await expect(page.locator('#page-count')).toContainText('2');
  await expect(page.locator('#btn-merge')).toBeEnabled();
  const download = page.waitForEvent('download');
  await page.locator('#btn-merge').click();
  const result = await PDFDocument.load(readFileSync((await (await download).path())!));
  expect(result.getPageCount()).toBe(2);
  expect(result.getPages().map(page => page.getWidth())).toEqual([200,400]);
});

test('image tools export actual PNG/SVG files', async ({ page }) => {
  await page.goto('/tools/mesh-gradient/');
  const download = page.waitForEvent('download');
  await page.locator('#btn-export-svg').click();
  expect(readFileSync((await (await download).path())!, 'utf8')).toContain('<svg');
  const meshPng = page.waitForEvent('download');
  await page.locator('#btn-export-png').click();
  expect(readFileSync((await (await meshPng).path())!).subarray(1,4).toString()).toBe('PNG');
  const png = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 80;
    const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#0088aa'; ctx.fillRect(0,0,100,80);
    return canvas.toDataURL().split(',')[1];
  });
  await page.goto('/tools/glow-frame/');
  await page.locator('#file-input').setInputFiles({name:'sample.png',mimeType:'image/png',buffer:Buffer.from(png,'base64')});
  await expect(page.locator('#btn-export-png')).toBeEnabled();
  const result = page.waitForEvent('download');
  await page.locator('#btn-export-png').click();
  expect(readFileSync((await (await result).path())!).subarray(1,4).toString()).toBe('PNG');
});

test('file selection and privacy details work with the keyboard', async ({ page }) => {
  await page.goto('/tools/pdf-editor/');
  await page.getByRole('button', {name:'処理するファイルを選択'}).focus();
  const chooser = page.waitForEvent('filechooser');
  await page.keyboard.press('Enter');
  await chooser;
  const summary = page.locator('summary').filter({hasText:'ファイルの処理場所と外部通信について'});
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(page.getByText('処理対象データの外部APIへの送信', {exact:true})).toBeVisible();
});

test('video frame extraction and audio conversion create usable files', async ({ page }) => {
  await page.goto('/tools/frame-extractor/');
  await page.locator('#file-input').setInputFiles('tests/fixtures/tone.webm');
  await expect(page.locator('#editor-section')).toBeVisible();
  await page.waitForFunction(() => (document.querySelector('video') as HTMLVideoElement).readyState >= 2);
  await page.locator('#single-format').selectOption('image/png');
  const frame = page.waitForEvent('download');
  await page.locator('#btn-extract-single').click();
  expect(readFileSync((await (await frame).path())!).subarray(1,4).toString()).toBe('PNG');
  await page.goto('/tools/audio-extractor/');
  await page.locator('#file-input').setInputFiles('tests/fixtures/tone.webm');
  await page.locator('#out-format').selectOption('wav');
  const audio = page.waitForEvent('download');
  await page.locator('#btn-extract').click();
  const bytes = readFileSync((await (await audio).path())!);
  expect(bytes.subarray(0,4).toString()).toBe('RIFF');
  expect(bytes.subarray(8,12).toString()).toBe('WAVE');
  expect(bytes.length).toBeGreaterThan(1000);
});
