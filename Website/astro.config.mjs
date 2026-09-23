// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://thelionsalliance.com',
  vite: {
    server: {
      watch: {
        // public/medelotapps-demo is generated output — ~385 files of hub code,
        // photographs and map tiles written by tools/demo/build_demo.py. Watching
        // them exhausted the dev server's file handles (EMFILE) and none of them
        // is ever hand-edited, so the watcher has no reason to follow them.
        ignored: ['**/public/medelotapps-demo/**'],
      },
    },
  },
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/wedding/photoportal') &&
        !page.includes('/songs-with-friends/callback') &&
        !page.includes('/songs-with-friends/print') &&
        !page.includes('/resume/test') &&
        !page.includes('/planner'),
    }),
  ],
});