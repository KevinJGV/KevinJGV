# Security Closeout — Diseño

**Fecha:** 2026-05-24
**Estado:** Diseño aprobado, pendiente plan de implementación
**Spec previo en el roadmap:** `2026-05-23-copy-and-positioning-design.md`
**Spec siguiente en el roadmap:** Bilingüe ES/EN + Features OGG

---

## Goal

Cerrar definitivamente el paraguas de seguridad del portafolio:

1. Recuperar A+ en `securityheaders.com` **sin `'unsafe-inline'`** en `script-src`, migrando al CSP nativo de Astro 6.
2. Eliminar la dependencia externa de `formsubmit.co` reemplazándola por un endpoint propio (serverless function en Vercel + Resend).
3. Establecer política automatizada de actualización de dependencias (Dependabot) para evitar la acumulación que motivó el spec Security original.
4. Barrer los 2 followups menores de Foundation findings que son temáticamente seguridad (badge externo de tracking en README, enlaces `target="_blank"` sin `rel="noopener noreferrer"`).

## Architecture

4 buckets atómicos, independientes, ejecutados de menor a mayor riesgo. Cada bucket es N commits relacionados, revert quirúrgico, build verificado entre buckets.

| Orden | Bucket | Riesgo | Razón del orden |
|---|---|---|---|
| 1 | **D — Limpieza** (badge visitcount + 4× rel=noopener) | Trivial | Cero comportamiento runtime, limpia ruido del diff posterior |
| 2 | **C — Dependabot** | Trivial | No toca el sitio. Independiente de Vercel/Astro |
| 3 | **B — Endpoint Resend** | Medio | Cambia modelo deploy (introduce 1 function), requiere setup externo. Aquí se elimina `https://formsubmit.co` del CSP manual |
| 4 | **A — CSP nativo Astro 6** | Alto | Ya rompió producción una vez con el quick fix. Va al final porque depende de que B haya quitado primero la regla `form-action` del CSP a migrar |

**Modelo de output:** transición de puro `output: 'static'` a hybrid (`output: 'static'` global + `export const prerender = false` solo en `src/pages/api/contact.ts`). El adapter Vercel ya está instalado por Web Analytics + Image Service; no requiere instalación nueva, solo activación del modo hybrid.

---

## Bucket D — Limpieza (2 commits)

### D.1 — Quitar badge externo de README

Eliminar la línea `![Visits](https://visitcount.itsvg.in/api/i?id=KevinJGV...)` del `README.md`. Es tracking de terceros que se ejecuta en cada render del README en GitHub.

**Verificación:** `grep -c "visitcount" README.md` → `0`.

### D.2 — `rel="noopener noreferrer"` en 4 enlaces

Añadir `rel="noopener noreferrer"` a los `target="_blank"` pendientes en:

- `src/components/me/MeWhereImGoing.astro` — enlace a Código Ninja
- `src/components/Card.astro` — enlace al proyecto
- `src/components/me/SpotifyPlayer.astro` — enlace "Via Spotify"
- `src/components/Contact.astro` — verificar (pudo arreglarse incidentalmente en Spec 3 commit `7988b17`)

Trabajo idempotente: hacer `grep` previo y aplicar solo donde falte.

**Verificación:** `grep -rn 'target="_blank"' src/ | grep -v noopener` → vacío.

---

## Bucket C — Dependabot (1 commit)

### C.1 — `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    groups:
      astro:
        patterns: ["astro", "@astrojs/*"]
      dev-dependencies:
        dependency-type: "development"
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

Agrupar Astro + adapters en un solo PR evita ruido (semver de `astro` y `@astrojs/vercel` viajan juntos).

**Verificación:** archivo válido a ojo + esperar al primer PR del lunes siguiente al merge.

---

## Bucket B — Endpoint Resend (4-5 commits)

### B.0 — Verificación de dominio en Resend

Pre-requisito de setup (no es código pero bloquea B.1):

1. Crear cuenta Resend, plan free.
2. Añadir dominio `vindevsito.dev` en Resend dashboard.
3. Crear los DNS records que Resend pida en el registrador del dominio:
   - **TXT** de verificación (`_resend.vindevsito.dev`)
   - **TXT DKIM** (`resend._domainkey.vindevsito.dev`)
   - **MX** opcional para bounces (`send.vindevsito.dev`)
   - (Opcional, futuro) **TXT SPF** y **TXT DMARC**
4. Esperar verificación (típico 5-30 min, hasta 24h por TTL DNS).
5. Una vez verificado: sender autorizado pasa a `noreply@vindevsito.dev`.

Si la verificación tarda > 24h: usar `onboarding@resend.dev` como sender temporal y migrar luego (no bloquea el spec).

### B.1 — SDK + endpoint serverless

```bash
npm install resend
```

`src/pages/api/contact.ts`:

```ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const name = String(data.get('name') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const message = String(data.get('message') ?? '').trim();
  const gotcha = String(data.get('_gotcha') ?? '');

  // Honeypot: bots completan campos ocultos
  if (gotcha) return Response.redirect(new URL('/contact?ok=1', request.url), 303);

  if (!name || !email || !message) {
    return new Response('Campos requeridos faltantes', { status: 400 });
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'Contacto desde Portafolio <noreply@vindevsito.dev>',
    to: 'vin.devsito@gmail.com',
    replyTo: email,
    subject: `Contacto portafolio — ${name}`,
    text: message,
  });

  if (error) return new Response('Fallo envío', { status: 502 });
  return Response.redirect(new URL('/contact?ok=1', request.url), 303);
};
```

### B.2 — Actualizar `Contact.astro`

- `action="https://formsubmit.co/vin.devsito@gmail.com"` → `action="/api/contact"`.
- Confirmar `method="POST"`.
- Eliminar inputs ocultos específicos de formsubmit si existen (`_captcha`, `_next`, etc.).
- Confirmar `name` de cada field encaja con lo que lee el endpoint: `name`, `email`, `message`.
- Añadir honeypot: `<input type="text" name="_gotcha" tabindex="-1" autocomplete="off" style="display:none" aria-hidden="true" />`.
- (Opcional) bloque visible `{searchParams.get("ok") && <p>Mensaje enviado.</p>}` para feedback post-redirect.

### B.3 — Variable de entorno + CSP

- Vercel project settings → Environment Variables: `RESEND_API_KEY` en **Production** + **Preview**.
- Local: `.env` (asegurar `.gitignore` lo cubre) con `RESEND_API_KEY=...`.
- Crear `.env.example` con `RESEND_API_KEY=` (sin valor) como documentación.
- En `vercel.json`: eliminar `https://formsubmit.co` de `form-action`. Ahora `form-action 'self'` basta (será reemplazado entero por Bucket A).

### B.4 — Smoke test deploy preview

Push a branch → Vercel preview deploy → enviar mensaje real desde el form → confirmar:

1. Llega email a `vin.devsito@gmail.com` con `from: noreply@vindevsito.dev`.
2. `replyTo` correcto (responder regresa al sender del form).
3. Honeypot funciona: enviar request con `_gotcha` lleno → 303 sin email.

---

## Bucket A — CSP nativo Astro 6 (1-2 commits)

### A.1 — Activar feature + adapter

`astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'static',
  security: { csp: true },
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
    staticHeaders: true,
  }),
});
```

### A.2 — Limpiar `vercel.json`

Eliminar la entry completa `Content-Security-Policy` de `headers`. Astro la escribirá ahí automáticamente vía `staticHeaders`.

Mantener las otras 5 entries: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `Referrer-Policy`, `Permissions-Policy` — Astro no las gestiona.

### A.3 — Inline scripts de Vercel Analytics

Si tras build el CSP nativo no incluye hash del script inyectado por Vercel Web Analytics o por el ClientRouter de view transitions, añadir manualmente:

```js
security: {
  csp: {
    scriptDirective: { hashes: ['sha256-...'] },
  },
},
```

Cómo obtener el hash: `npm run build` + inspeccionar `dist/**/*.html` (o página renderizada en preview), localizar inline script, hashear con `openssl dgst -sha256 -binary | openssl base64`.

Si Astro detecta el script automáticamente (esperado para sus propios scripts inyectados), no se requiere hash manual.

### A.4 — Verificación final

1. `npm run build` pasa.
2. Deploy preview → `securityheaders.com/?q=<preview-url>` debe dar **A+** sin `'unsafe-inline'` en `script-src`.
3. Smoke test runtime sobre los 5 puntos sensibles del incident anterior:
   - Audio loop arranca tras primera interacción
   - Hover de cards muestra tilt
   - Mobile render correcto (no whitespace anómalo)
   - Nav dropdown del sidebar abre y cierra
   - Footer width correcto
4. Console del navegador sin errores de CSP.

---

## Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R1** | CSP nativo no incluye hash de algún inline script Vercel inyecta runtime (Analytics, Speed Insights) y rompe producción de nuevo | Media | Pre-deploy en preview. Capturar inline scripts con `grep -rn "<script" dist/`. Si Astro no los detecta, hash manual en `scriptDirective.hashes`. Plan B: revert atómico del bucket A → vuelve al CSP manual con `'unsafe-inline'` |
| **R2** | Verificación DNS de `vindevsito.dev` en Resend falla o tarda | Baja | Resend permite `onboarding@resend.dev` durante verificación. Si tarda > 24h: deploy con sender default y migrar como follow-up corto |
| **R3** | Hybrid mode incompatible con alguna feature del adapter actual (webAnalytics, imageService) | Baja | Documentado en docs oficiales Astro 6 + `@astrojs/vercel` v10. `npm run build` local antes de push valida |
| **R4** | `RESEND_API_KEY` se commitea por accidente | Baja | `.env` ya en `.gitignore`. Verificación pre-commit: `git diff --cached \| grep RESEND_API_KEY` → vacío. Si filtra: rotar key en Resend dashboard |
| **R5** | Form spam tras quitar captcha de formsubmit.co | Media | Honeypot (B.1 + B.2) basta para portafolio personal. Si en 30 días llega spam significativo: Turnstile o rate limiting (follow-up) |
| **R6** | Dependabot abre PRs que rompen build | Media | Required status checks de CI (`astro check` + `build`) bloquean merge automático. PRs requieren revisión manual. Grupos en config mitigan ruido |
| **R7** | Quitar badge `visitcount` descompone alineación de otros badges del README | Baja | Preview en GitHub render antes de merge. Ajustar línea siguiente si necesario |
| **R8** | `rel="noopener noreferrer"` ya fue aplicado parcialmente en Spec 3 y reaplicarlo conflicta | Muy baja | D.2 hace `grep` previo y solo aplica donde falta. Idempotente |

**Plan de rollback global:** cada bucket es 1-N commits atómicos. Cualquier bucket es revertible con `git revert <range>` sin afectar a los otros tres. Bucket A es el único que requiere reverificar runtime post-revert (vuelve al CSP manual con `'unsafe-inline'` quick fix actual).

---

## Contrato

### Funcional

- Formulario de contacto sigue funcionando end-to-end: envío → email a `vin.devsito@gmail.com` con `from: "Contacto desde Portafolio <noreply@vindevsito.dev>"`.
- Audio loop, hover cards, mobile render, nav dropdown, footer width — los 5 puntos sensibles del incident anterior — siguen funcionando idénticos en producción tras Bucket A.
- Cero regresión visual en las 3 páginas (`/`, `/me`, `/contact`).

### Seguridad

- A+ en `securityheaders.com` post-deploy, **sin `'unsafe-inline'` en `script-src`**.
- Cero referencias a `formsubmit.co` en código (`src/`, `vercel.json`).
- Cero enlaces `target="_blank"` sin `rel="noopener noreferrer"` en `src/`.
- Cero tracking de terceros en `README.md`.

### Operacional

- Dependabot abriendo PRs semanales (verificable al lunes siguiente del merge).
- `RESEND_API_KEY` configurada en Vercel (Production + Preview), nunca commiteada.
- Dominio `vindevsito.dev` verificado en Resend, sender `noreply@vindevsito.dev`.

### Criterios de aceptación automáticos (grep-based)

```bash
grep -rn "formsubmit" . --exclude-dir=docs --exclude-dir=node_modules    # → 0 results
grep -rn 'target="_blank"' src/ | grep -v noopener                       # → vacío
grep -c "visitcount" README.md                                            # → 0
grep -c "unsafe-inline" vercel.json                                       # → 0 en script-src (style-src puede mantenerlo, ver no-goal)
test -f .github/dependabot.yml                                            # → exit 0
test -f src/pages/api/contact.ts                                          # → exit 0
grep -c "RESEND_API_KEY" .env.example                                     # → ≥ 1 (sin valor real)
npm run build                                                             # → 0/0/0
```

---

## No-objetivos (explícitos)

- **`'unsafe-inline'` en `style-src`** sigue presente. GSAP genera estilos inline y patrones `define:vars` / `style={...}` lo requieren. Migrar `style-src` a nonces/hashes es spec aparte; este spec cierra solo `script-src`.
- **Captcha real** (Turnstile/hCaptcha). Honeypot basta para portafolio personal. Si llega spam significativo post-deploy → follow-up.
- **Rate limiting en `/api/contact`**. No esperado a este volumen.
- **Refactor de `Tools.astro`**. Queda intacto para que Spec 5 (bilingüe) añada el toggle ES/EN ahí — esa expansión re-evalúa la decisión de partir el componente.
- **Cualquier cambio visual o de copy**. Si el form luce raro tras quitar campos ocultos de formsubmit, se ajusta como bug pero no se rediseña.
- **Migración del dominio `vindevsito.dev` en sí**. El dominio se asume vivo y bajo control del usuario; este spec solo añade DNS records para Resend.
- **Métricas / analytics extra**. Vercel Web Analytics ya está; no se agregan otros.
- **Otros buckets temáticos** (bilingüe, features OGG, micro-experimentos IA): Spec 5.

---

## Follow-ups esperados (para spec futuro)

### Spec 5 — Bilingüe ES/EN + Features OGG (próximo del roadmap)

- i18n nativo Astro 6 + switcher integrado en `Tools.astro` (junto al botón de audio)
- Espejar copy estable de Spec 3 al inglés
- Micro-experimento "Pregúntale a mi CV" con Anthropic SDK directo (alineado con posicionamiento "IA aplicada")
- Display visual de `company` / `role` / `period` en cards de Casos (los 3 campos hoy son data-only)
- Diseño del feature interactivo para `public/VIN.ogg` + `public/VINXD.ogg`
- Ajustes de spacing/layout post-copy si quedó algo desencajado
- Re-evaluar `Tools.astro` (330 LOC) tras añadir toggle idioma

### Hardening adicional (futuro lejano)

- Migración de `'unsafe-inline'` en `style-src` a nonces/hashes (requiere reescribir patrones GSAP + `define:vars` + estilos inline)
- Si spam: Turnstile en `/api/contact`
- `tagItem` / `renderTagItem` en `Card.astro` retornan HTML como string + `set:html` — refactor a componentes `.astro` reales (deuda de quality interno)

---

## Decisiones de diseño cerradas

- **Stack:** Astro 6 + adapter Vercel v10. No cambio de proveedor de deploy.
- **Output:** hybrid (`output: 'static'` + `export const prerender = false` en un solo endpoint). No vuelta a `'server'` global.
- **Email provider:** Resend, plan free, dominio propio verificado.
- **Sender:** `Contacto desde Portafolio <noreply@vindevsito.dev>` (con `onboarding@resend.dev` como fallback si verificación tarda).
- **Anti-spam:** honeypot only. Captcha futuro si necesario.
- **Deps automation:** Dependabot, no Renovate.
- **CSP scope:** `script-src` migra a hashes nativos; `style-src` queda con `'unsafe-inline'` por ahora.
- **Quirks de personalidad:** ningún copy se toca en este spec.
- **Tests automatizados:** no se introducen.
