# Security Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar la deuda de seguridad del portafolio: 25 npm vulns, ausencia de HTTP headers, links sin `rel="noopener noreferrer"`, tracking de terceros en README, y referencias obsoletas a `output: 'server'` en CLAUDE.md.

**Architecture:** 5 buckets independientes ejecutados en orden de riesgo creciente: housekeeping de docs (trivial) → fixes locales sin deps (trivial) → upgrade de deps con verificación entre cada bump (riesgoso) → configuración de headers en Vercel (riesgo aislado, no toca código).

**Tech Stack:** Astro 5.13+ (output `'static'`) · `@astrojs/vercel` 8 → 10 (semver-major bump) · React 19 · GSAP 3.12 · Vercel hosting.

**Spec:** `docs/superpowers/specs/2026-05-22-security-hardening-design.md`

---

## Convenciones de este plan

- **Branch:** crear `security-hardening` desde `main` antes de empezar (Task 0).
- **Commits:** uno por bucket completado, prefijo según convención del repo (`docs:`, `fix(security):`, `chore(deps):`, `feat(security):`).
- **Verificación canónica:** `npm run build` (incluye `astro check`). Debe pasar con 0 errores, 0 warnings, 0 hints después de cada bucket.
- **Hooks activos:** `.claude/hooks/astro-check.sh` corre tras cada Edit/Write a `.astro`/`.ts`. Si bloquea, leer su feedback y corregir antes de continuar.
- **Reverts:** cada bucket es atómico. Si un commit rompe algo y no se puede arreglar en minutos, `git revert <sha>` y reportar al controller.

---

## Task 0: Branch setup

**Files:** ninguno (operación git)

- [ ] **Step 1: Verificar estado limpio en main**

Run:
```bash
git status
git rev-parse --abbrev-ref HEAD
```

Expected: `working tree clean`, branch `main`. Si hay cambios sin commit, parar y preguntar al controller.

- [ ] **Step 2: Crear branch `security-hardening`**

Run:
```bash
git checkout -b security-hardening
```

Expected: `Switched to a new branch 'security-hardening'`.

- [ ] **Step 3: Verificar baseline de build**

Run:
```bash
npm run build
```

Expected: build completo, 0 errors / 0 warnings / 0 hints en la salida de `astro check`. Si hay hints o warnings, anótalos como pre-existentes en una nota del primer commit — no deben aumentar en ningún task siguiente.

- [ ] **Step 4: Snapshot inicial de vulnerabilidades**

Run:
```bash
npm audit 2>&1 | tail -5
```

Expected: línea tipo `25 vulnerabilities (1 low, 10 moderate, 14 high)`. Guarda este número exacto — el commit final del Bucket A debe poder citarlo en el mensaje.

---

## Bucket E — Housekeeping CLAUDE.md (sin riesgo, contextualiza)

### Task E.1: Actualizar referencias obsoletas a `output: 'server'`

**Files:**
- Modify: `CLAUDE.md` (líneas 19 y 67)

Contexto: el spec Foundation cambió `output: 'server'` por `output: 'static'` en `astro.config.mjs`. CLAUDE.md tiene dos referencias stale a la configuración antigua que deben actualizarse.

- [ ] **Step 1: Verificar las líneas exactas**

Run:
```bash
grep -n "output: 'server'" CLAUDE.md
```

Expected: dos hits, en líneas 19 y 67 (o cerca — confirmar con la salida real).

- [ ] **Step 2: Reemplazar línea 19**

Edita `CLAUDE.md`. La línea actual:

```
- `astro.config.mjs` — config; usa `@astrojs/vercel` con `output: 'server'`, `functionPerRoute: false`, `maxDuration: 60`, `webAnalytics`, `imageService`, `middleware`.
```

Reemplázala por:

```
- `astro.config.mjs` — config; usa `@astrojs/vercel` con `output: 'static'`, `webAnalytics`, `imageService`. El sitio se prerenderiza como estático y se sirve desde el CDN de Vercel (no SSR).
```

Nota: también se quitan `functionPerRoute`, `maxDuration`, y `middleware` porque no están en la config actual (ver `astro.config.mjs`).

- [ ] **Step 3: Reemplazar línea 67 (sección "Deploy")**

La línea actual:

```
Vercel SSR. El adapter está en `astro.config.mjs`. No tocar `output: 'server'` ni `functionPerRoute: false` sin verificar el impacto en el deploy.
```

Reemplázala por:

```
Vercel estático. El adapter está en `astro.config.mjs`. No tocar `output: 'static'` sin verificar el impacto en el deploy (cambiar a `'server'` reintroduce funciones serverless y cambia el modelo de pricing).
```

- [ ] **Step 4: Verificar que no queden referencias stale**

Run:
```bash
grep -n "output: 'server'\|functionPerRoute\|Vercel SSR" CLAUDE.md
```

Expected: 0 hits.

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md output mode references to static

Foundation spec switched astro.config.mjs from output: 'server' to
'static'. CLAUDE.md still referenced the old SSR config in two places
(adapter description and Deploy section). Updated both."
```

---

## Bucket C — `rel="noopener noreferrer"` en links/form

### Task C.1: Card.astro

**Files:**
- Modify: `src/components/Card.astro` (línea 52)

- [ ] **Step 1: Leer el bloque actual**

Líneas 49-54 actuales:
```astro
<a
  href={href}
  class="pCard flex_col glass0 relative"
  target="_blank"
  style={`color: ${txtColor}; background-color: ${bgColor};`}
>
```

- [ ] **Step 2: Añadir `rel="noopener noreferrer"`**

Reemplazar por:
```astro
<a
  href={href}
  class="pCard flex_col glass0 relative"
  target="_blank"
  rel="noopener noreferrer"
  style={`color: ${txtColor}; background-color: ${bgColor};`}
>
```

### Task C.2: SpotifyPlayer.astro

**Files:**
- Modify: `src/components/me/SpotifyPlayer.astro` (línea 22-25)

- [ ] **Step 1: Leer el bloque actual**

```astro
    <a
      href="https://open.spotify.com/user/22xnxi2j2d3vra2qhozf3bzsa?si=08945a9049494095"
      target="_blank">Via Spotify</a
    >
```

- [ ] **Step 2: Añadir `rel`**

```astro
    <a
      href="https://open.spotify.com/user/22xnxi2j2d3vra2qhozf3bzsa?si=08945a9049494095"
      target="_blank"
      rel="noopener noreferrer">Via Spotify</a
    >
```

### Task C.3: MeWhereImGoing.astro

**Files:**
- Modify: `src/components/me/MeWhereImGoing.astro` (línea 16-19)

- [ ] **Step 1: Leer el bloque actual**

```astro
        definir como especialista en el campo capaz de escribir <a
          href="https://es.javascript.info/ninja-code"
          target="_blank">Código Ninja</a
        > a su conveniencia.<br />
```

- [ ] **Step 2: Añadir `rel`**

```astro
        definir como especialista en el campo capaz de escribir <a
          href="https://es.javascript.info/ninja-code"
          target="_blank"
          rel="noopener noreferrer">Código Ninja</a
        > a su conveniencia.<br />
```

### Task C.4: Contact.astro (form)

**Files:**
- Modify: `src/components/Contact.astro` (línea 8-13)

Nota: `rel` en `<form>` es válido HTML5 cuando `target="_blank"` está presente — proporciona el mismo aislamiento que en anchors.

- [ ] **Step 1: Leer el bloque actual**

```astro
  <form
    target="_blank"
    action="https://formsubmit.co/vin-dev@outlook.com"
    method="POST"
    class="flex_col j_c wrap"
  >
```

- [ ] **Step 2: Añadir `rel`**

```astro
  <form
    target="_blank"
    rel="noopener noreferrer"
    action="https://formsubmit.co/vin-dev@outlook.com"
    method="POST"
    class="flex_col j_c wrap"
  >
```

### Task C.5: Verificación global + commit

- [ ] **Step 1: Verificar que ningún `target="_blank"` quedó sin `rel`**

Run:
```bash
grep -rln 'target="_blank"' src/ | xargs grep -L 'noopener noreferrer'
```

Expected: salida vacía (ningún archivo). Si algún archivo sale en la lista, revisarlo y añadir el atributo.

- [ ] **Step 2: Build de verificación**

Run:
```bash
npm run build
```

Expected: 0 errors / 0 warnings / 0 hints.

- [ ] **Step 3: Commit**

```bash
git add src/components/Card.astro src/components/me/SpotifyPlayer.astro src/components/me/MeWhereImGoing.astro src/components/Contact.astro
git commit -m "fix(security): add rel=noopener noreferrer to all target=_blank

Prevents window.opener exploit + referrer leak on the 4 remaining
external links/form that didn't have rel set (Card project link,
SpotifyPlayer 'Via Spotify' anchor, MeWhereImGoing 'Código Ninja'
anchor, Contact form action). FooterSocial.astro already had it."
```

---

## Bucket D — README badge

### Task D.1: Reemplazar visitcount badge

**Files:**
- Modify: `README.md` (línea 12)

- [ ] **Step 1: Leer línea 12 actual**

```markdown
[![](https://visitcount.itsvg.in/api?id=KevinJGV&icon=5&color=8)](https://visitcount.itsvg.in)
```

- [ ] **Step 2: Reemplazar con shields.io self-referenced**

Opción elegida: `github/last-commit` (refleja actividad real del repo sin tracking de visitas). Reemplazar la línea por:

```markdown
[![](https://img.shields.io/github/last-commit/KevinJGV/KevinJGV?style=for-the-badge&color=8957e5&logo=github&logoColor=white)](https://github.com/KevinJGV/KevinJGV)
```

Razón del style: `for-the-badge` matchea el estilo visual del resto de badges del README (línea 4-7 lo usan).

- [ ] **Step 3: Verificar que no quedan referencias a itsvg**

Run:
```bash
grep -n "visitcount\|itsvg" README.md
```

Expected: 0 hits.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "chore(security): replace visitcount.itsvg.in badge with shields.io

Removes 3rd-party tracking on every README view (privacy concern,
phones home to itsvg.in). Replaced with a self-referenced
shields.io last-commit badge — no tracking, equivalent decoration."
```

---

## Bucket A — Dependencias npm (el más riesgoso)

### Task A.1: Aplicar fixes no-breaking

**Files:**
- Modify: `package.json`, `package-lock.json`

- [ ] **Step 1: Snapshot pre-fix**

Run:
```bash
npm audit 2>&1 | tail -3
```

Anotar la línea con conteo de vulns para citar en el commit message.

- [ ] **Step 2: Aplicar fix no-breaking**

Run:
```bash
npm audit fix
```

Expected: algunos paquetes actualizados, sin tocar dependencias directas en major. Si en la salida menciona "X vulnerabilities require manual review", es esperado (los manejaremos en A.2).

- [ ] **Step 3: Verificar build**

Run:
```bash
npm run build
```

Expected: 0 errors / 0 warnings / 0 hints. Si rompe, identificar qué dependencia indirecta causó el problema (típicamente `npm ls <pkg>`), revertir con `git checkout package.json package-lock.json` y reportar como BLOCKED.

- [ ] **Step 4: Auditoría intermedia**

Run:
```bash
npm audit 2>&1 | tail -3
```

Anotar el nuevo conteo (debería bajar significativamente, pero quedará al menos la high de `@astrojs/vercel`).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): apply npm audit fix (non-breaking)

Closes the transitive vulns that don't require semver-major bumps.
Pre: <N> vulnerabilities. Post: <M> vulnerabilities. The remaining
high in @astrojs/vercel (CVE GHSA-mr6q-rp88-fx84) requires a v8->v10
major bump, handled in the next task."
```

Sustituir `<N>` y `<M>` por los conteos reales del audit antes y después.

### Task A.2: Bump major de `@astrojs/vercel` v8 → v10

**Files:**
- Modify: `package.json`, `package-lock.json`, posiblemente `astro.config.mjs`

Contexto: el adapter actual está en `^8.0.4`. El fix de la CVE `GHSA-mr6q-rp88-fx84` requiere `>= 10.0.2`. Es semver-major — verificar release notes antes.

- [ ] **Step 1: Consultar docs de v10 con context7**

Llamadas obligatorias:
```
mcp__plugin_context7_context7__resolve-library-id with "@astrojs/vercel"
mcp__plugin_context7_context7__query-docs for the resolved ID asking
about: "v10 migration from v8, breaking changes in adapter API,
webAnalytics and imageService options"
```

Pega un resumen de los hallazgos relevantes (especialmente cambios de API que afecten a `astro.config.mjs`) en el reporte final del task. Si la doc indica que `webAnalytics: { enabled: true }` o `imageService: true` ya no son options válidas en v10, ajusta `astro.config.mjs` según la nueva API antes de continuar.

- [ ] **Step 2: Leer `astro.config.mjs` actual**

Contenido actual esperado:
```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
});
```

Toma nota de esto como baseline. Si tras leer las release notes de v10 hay cambios, planifica las modificaciones aquí antes de instalar.

- [ ] **Step 3: Bump del paquete**

Run:
```bash
npm install @astrojs/vercel@^10
```

Expected: `@astrojs/vercel` actualizado a la última v10.x. Sin errores de peer dependency (si los hay, leer el mensaje y resolver — generalmente ajustando un peer en `astro`).

- [ ] **Step 4: Ajustar `astro.config.mjs` si las release notes lo requieren**

Aplicar los cambios identificados en el Step 1. Si v10 no requiere cambios (la API se mantiene compatible), saltar este step.

- [ ] **Step 5: Verificar build**

Run:
```bash
npm run build
```

Expected: build completo sin errores. Si el adapter v10 reporta errores tipo "Unknown option" o "Adapter incompatible", revisar las release notes y ajustar la config.

- [ ] **Step 6: Verificar audit**

Run:
```bash
npm audit 2>&1 | tail -3
```

Expected: la high de `@astrojs/vercel` ya no aparece. El conteo de high debe bajar a 0 o muy cerca.

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json astro.config.mjs
git commit -m "chore(deps): upgrade @astrojs/vercel ^8 to ^10

Closes CVE GHSA-mr6q-rp88-fx84 (Unauthenticated Path Override via
x-astro-path header, CVSS 6.5). Semver-major bump per upstream
advisory. Build verified with new adapter version.

<Si hubo cambios en astro.config.mjs, listarlos aquí en 1-2 líneas>"
```

### Task A.3: Bumps de dependencias directas restantes

**Files:**
- Modify: `package.json`, `package-lock.json`

Contexto: aplicar updates dentro del rango semver actual de las directas — esto no son majors, son actualizaciones de parches/menores que pueden contener fixes de seguridad menores y mejoras de estabilidad.

- [ ] **Step 1: Listar outdated**

Run:
```bash
npm outdated
```

Anotar los paquetes que tienen update disponible dentro del rango "Wanted" (no "Latest" — eso sería major). Lista esperada incluye: `astro`, `react`, `react-dom`, `gsap`, `@astrojs/react`, `@astrojs/check`, `@types/*`.

- [ ] **Step 2: Update one-by-one con verificación**

Por cada paquete en la lista de Step 1, ejecutar en secuencia:

```bash
npm update <paquete>
npm run build
```

Si el build pasa, continuar al siguiente paquete. Si rompe, revertir con:
```bash
git checkout package.json package-lock.json
npm install
```
y documentar el paquete como "no actualizable en este ciclo" en el commit message final del task.

Para los paquetes que toquen APIs activas (`astro`, `@astrojs/react`, `gsap`), antes del update consulta context7 para release notes — sigue el patrón del Step 1 de A.2.

- [ ] **Step 3: Audit final**

Run:
```bash
npm audit
```

Expected: idealmente 0 vulnerabilidades. Si quedan, listarlas con su severidad — irán al commit message como "residuales aceptadas con justificación".

- [ ] **Step 4: Verificar build una última vez**

Run:
```bash
npm run build
```

Expected: 0/0/0.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): update direct dependencies within semver range

Bumped <lista de paquetes actualizados> to latest within their
current semver ranges. Build verified after each bump.

npm audit final: <X> vulnerabilities (<desglose por severidad>).
<Si X > 0, justificación de cada residual>"
```

---

## Bucket B — HTTP security headers (Vercel)

### Task B.1: Crear `vercel.json` con headers

**Files:**
- Create: `vercel.json` (en raíz del repo)

Contexto: en deploys estáticos de Vercel, los headers HTTP se configuran vía `vercel.json` (no vía el adapter de Astro). El archivo se aplica automáticamente al deploy. Para staging local de los headers no hay forma directa con `npm run preview` (que solo sirve los archivos estáticos sin Vercel) — la verificación final de headers se hace en el deploy real.

- [ ] **Step 1: Verificar que `vercel.json` no existe**

Run:
```bash
ls vercel.json 2>/dev/null && echo "EXISTS" || echo "MISSING"
```

Expected: `MISSING`. Si existe, leerlo y planificar merge antes de sobreescribir.

- [ ] **Step 2: Consultar docs de Vercel headers con context7**

```
mcp__plugin_context7_context7__resolve-library-id with "vercel"
mcp__plugin_context7_context7__query-docs asking about:
"vercel.json headers configuration schema, source patterns,
applying to all routes including static assets"
```

Confirma el schema exacto antes de escribir el archivo. La sintaxis estándar es `{ headers: [{ source: "...", headers: [{ key, value }] }] }`.

- [ ] **Step 3: Crear `vercel.json`**

Contenido completo:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' https://va.vercel-scripts.com; font-src 'self' data:; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self' https://formsubmit.co"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Strict-Transport-Security",
          "value": "max-age=63072000; includeSubDomains; preload"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()"
        }
      ]
    }
  ]
}
```

Notas para el implementer (no incluir como comentarios en el JSON — JSON no soporta comentarios):
- `'unsafe-inline'` en `style-src` es necesario por `define:vars`, `style={...}` inline, y estilos generados por GSAP en runtime.
- `data:` en `img-src` y `font-src` es necesario por el cursor base64 y fonts/svgs inline.
- `script-src` solo permite Vercel Analytics. Si se añade otro script externo en el futuro, ampliar aquí.
- `form-action` permite `formsubmit.co` para que `Contact.astro` siga funcionando.

- [ ] **Step 4: Validar JSON**

Run:
```bash
node -e "JSON.parse(require('fs').readFileSync('vercel.json', 'utf8')); console.log('valid')"
```

Expected: `valid`.

- [ ] **Step 5: Build de verificación**

Run:
```bash
npm run build
```

Expected: 0/0/0. `vercel.json` no afecta el build de Astro, pero confirma que nada se rompió.

- [ ] **Step 6: Commit**

```bash
git add vercel.json
git commit -m "feat(security): add HTTP security headers via vercel.json

Adds 6 headers applied to all routes:
- Content-Security-Policy: baseline allowing inline styles (needed
  for define:vars/GSAP) + Vercel Analytics scripts + formsubmit form
  action. Blocks all other external scripts/frames.
- X-Frame-Options: DENY (clickjacking)
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: 2y + includeSubDomains + preload
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: deny camera/mic/geo + opt out of FLoC

Target: securityheaders.com grade >= B (ideally A) post-deploy."
```

---

## Task FINAL: Verificación integral

**Files:** ninguno (verificación)

- [ ] **Step 1: Audit final**

Run:
```bash
npm audit
```

Expected: 0 vulnerabilidades. Si quedan, confirmar que están justificadas en el commit message de A.3.

- [ ] **Step 2: Build final**

Run:
```bash
npm run build
```

Expected: 0 errors / 0 warnings / 0 hints. Compara con el baseline del Task 0.

- [ ] **Step 3: Verificar todos los criterios automáticos**

Ejecuta y confirma cada uno:

```bash
# 3.a: No queda target=_blank sin rel
grep -rln 'target="_blank"' src/ | xargs grep -L 'noopener noreferrer'
# Expected: empty

# 3.b: README sin visitcount
grep -n "visitcount\|itsvg" README.md
# Expected: empty

# 3.c: CLAUDE.md sin output: 'server'
grep -n "output: 'server'" CLAUDE.md
# Expected: empty

# 3.d: vercel.json existe con los 6 headers
ls vercel.json && grep -c '"key"' vercel.json
# Expected: file exists, count = 6

# 3.e: @astrojs/vercel en v10+
grep '"@astrojs/vercel"' package.json
# Expected: version ^10.x.x or higher
```

- [ ] **Step 4: Smoke test visual local**

Run:
```bash
npm run preview
```

Manualmente abrir en navegador (`http://localhost:4321` o el puerto que reporte):
- `/` — verificar cursor custom, animaciones GSAP, scroll behavior.
- `/me` — verificar las 4 secciones, SpotifyPlayer, transiciones.
- `/contact` — verificar form (no enviar, solo cargar).
- DevTools → Console: 0 errores.

Nota: los headers HTTP **no aplican en `npm run preview`** porque Vercel los inyecta solo en el deploy real. Solo se valida que el build local sigue corriendo.

- [ ] **Step 5: Reportar al controller**

Resumir:
- Conteo final de vulnerabilidades (0 esperado, o lista de residuales con justificación).
- Lista de paquetes actualizados con sus versiones nuevas.
- Confirmación de los 6 criterios automáticos del Step 3.
- Resultado del smoke test del Step 4 (PASS o lista de issues encontrados).
- Next steps para el usuario: hacer push, mergear a main, deploy a Vercel, y validar headers en `securityheaders.com`.

No hacer push ni mergear desde el implementer subagent — esas son decisiones del usuario.

---

## Self-review checklist (para el implementer cuando termine cada bucket)

- ¿El cambio hace exactamente lo que el bucket pedía? ¿Algo más?
- ¿`npm run build` pasa con 0/0/0?
- ¿El commit message describe **por qué**, no solo qué?
- ¿No introduje refactors o cleanup colateral fuera de scope?
- Si un step me pidió consultar context7 y no lo hice, parar y hacerlo ahora.

## Cuándo escalar (BLOCKED / NEEDS_CONTEXT)

- Si el build se rompe tras un bump y no es obvio cómo arreglarlo en < 10 minutos.
- Si las release notes de v10 indican cambios profundos en la API del adapter que el plan no anticipó.
- Si la sintaxis de `vercel.json` headers difiere de lo que el plan asume tras consultar context7.
- Si descubres que algún `target="_blank"` adicional fue añadido al repo después de escribir este plan y no está en Bucket C.
