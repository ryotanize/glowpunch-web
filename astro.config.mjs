// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { isIndexable } from './src/data/content-policy.mjs';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://glowpunch.net',
  trailingSlash: 'always',
  integrations: [sitemap({ filter: isIndexable })],
  vite: {
    plugins: [tailwindcss()]
  }
});