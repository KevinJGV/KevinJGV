import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import { readFile, writeFile } from 'node:fs/promises';

// W3C CSP3: 'unsafe-inline' es ignorado si style-src tiene hashes.
// Astro genera hashes para inline styles detectados en build, pero GSAP
// y otros runtime-generated styles no pueden pre-hashearse. Esta integración
// remueve los hashes de style-src en el config.json post-build, dejando
// 'self' 'unsafe-inline' como único source — así el runtime funciona.
const stripStyleSrcHashes = () => ({
  name: 'strip-style-src-hashes',
  hooks: {
    'astro:build:done': async () => {
      const configPath = '.vercel/output/config.json';
      const config = JSON.parse(await readFile(configPath, 'utf8'));
      for (const route of config.routes ?? []) {
        const csp = route.headers?.['content-security-policy'];
        if (!csp) continue;
        const cleaned = csp
          .split(';')
          .map((directive) => directive.trim())
          .filter(Boolean)
          .map((directive) => {
            if (!directive.startsWith('style-src')) return directive;
            return directive
              .split(/\s+/)
              .filter((token) => !/^'sha\d+-/.test(token))
              .join(' ');
          })
          .join('; ');
        route.headers['content-security-policy'] = cleaned;
      }
      await writeFile(configPath, JSON.stringify(config, null, '\t'));
    },
  },
});

export default defineConfig({
  output: 'static',
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [react(), stripStyleSrcHashes()],
  security: {
    csp: {
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "media-src 'self' https:",
        "font-src 'self' data:",
        "connect-src 'self' https://vitals.vercel-insights.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
      styleDirective: {
        resources: ["'self'", "'unsafe-inline'"],
      },
      // Hash del único <script is:inline> del portafolio (anti-flash de ruido +
      // auto-redirect de idioma, en Layout.astro). Astro NO hashea is:inline, así
      // que sin esto la CSP estricta lo bloquea (debe correr pre-paint para evitar
      // flash). ⚠️ Si se edita ese bloque, regenerar este hash (ver build output).
      scriptDirective: {
        hashes: ["sha256-rPzTUm1ekgv8deKAyepZvkRwJW4Yv+fQF49qr6lvpJE="],
      },
    },
  },
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
    staticHeaders: true,
  }),
});
