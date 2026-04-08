// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://thelionsalliance.com',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/wedding/photoportal') &&
        !page.includes('/songs-with-friends/callback') &&
        !page.includes('/songs-with-friends/print') &&
        !page.includes('/admin') &&
        !page.includes('/resume/test') &&
        !page.includes('/planner'),
    }),
  ],
});