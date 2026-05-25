import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  security: {
    csp: true,
  },
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
    staticHeaders: true,
  }),
});
