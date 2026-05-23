---
name: csp-followup-astro6-native
description: Follow-up para migrar el CSP manual con 'unsafe-inline' a la feature nativa de Astro 6 con hashes
type: project
---

# Finding: Migración a CSP nativo de Astro 6

**Fecha:** 2026-05-23
**Spec origen:** `2026-05-22-security-hardening-design.md`
**Commits afectados:** `5ef6763` (quick fix CSP), `11ef950` (mixed content)

## Contexto

Tras desplegar el spec Security Hardening, `securityheaders.com` calificó A+, pero en producción se rompieron audio loop, hover de cards, render mobile, dropdown de nav, y ancho del footer. Causa: el `script-src 'self' https://va.vercel-scripts.com` de `vercel.json` bloqueaba **todos los inline scripts** que Astro emite por página (boot de `ClientRouter`, bootstrap de hidratación de islas React, `define:vars`). Adicionalmente, `src/styles/utilities.css:113` cargaba un PNG de `http://assets.iceable.com` sobre página HTTPS (mixed content).

## Quick fix aplicado (2026-05-23)

- `vercel.json`: añadir `'unsafe-inline'` a `script-src`. Restaura la funcionalidad, pero degrada el grade esperado de A+ a A/B+.
- `src/styles/utilities.css:113`: `http://` → `https://`. Sin trade-off.

## Solución proper (pendiente de spec)

Astro 6 ya trae CSP nativo. Reemplazar el CSP manual de `vercel.json` por:

1. **`astro.config.mjs`** — activar la feature:
   ```js
   export default defineConfig({
     output: 'static',
     security: {
       csp: true, // genera hashes automáticamente para inline scripts/styles
     },
     adapter: vercel({
       webAnalytics: { enabled: true },
       imageService: true,
       staticHeaders: true, // escribe el CSP de Astro en vercel.json automáticamente
     }),
   });
   ```

2. **`vercel.json`** — quitar la entrada `Content-Security-Policy` manual (la genera Astro vía `staticHeaders`). Mantener los otros 5 headers (X-Frame-Options, X-Content-Type-Options, HSTS, Referrer-Policy, Permissions-Policy) que Astro no gestiona.

3. **Hashes adicionales** — si quedan inline scripts/styles no detectados por Astro (ej. los que vienen del adapter de Vercel Analytics), añadirlos vía `security.csp.scriptDirective.hashes` / `styleDirective.hashes`.

## Resultado esperado

- Recuperar A+ en `securityheaders.com` sin `'unsafe-inline'` en `script-src`.
- Mantener funcionalidad runtime (Astro conoce sus propios scripts y los hashea).
- Acoplar la política a lo que el build realmente emite (vs. el header manual que se desincroniza fácil).

## Verificación previa al spec

Antes de escribir el spec, consultar via context7:
- `mcp__plugin_context7_context7__resolve-library-id` para `astro` y `@astrojs/vercel`.
- `query-docs` sobre `security.csp` (Astro) y `staticHeaders` (adapter Vercel v10) — confirmar API exacta y si hay caveats con `output: 'static'`.

## Prioridad

Media. El quick fix funcional; A vs A+ no es regresión funcional, solo cosmético/postura.
