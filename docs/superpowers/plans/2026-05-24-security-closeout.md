# Security Closeout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cerrar el paraguas de seguridad: CSP nativo Astro 6 (recupera A+ sin `'unsafe-inline'` en `script-src`), endpoint propio de contacto vía Resend con dominio verificado `vindevsito.dev` (elimina `formsubmit.co`), Dependabot semanal, y verificar/barrer los 2 followups menores de Foundation findings (visitcount badge + `rel=noopener`).

**Architecture:** 4 buckets atómicos D→C→B→A ejecutados de menor a mayor riesgo. Bucket D es verificación pura (el trabajo ya fue absorbido por specs previos, según greps de baseline). Bucket B introduce hybrid output (`output: 'static'` global + `export const prerender = false` en un único endpoint). Bucket A es el más sensible (rompió producción una vez) y va al final.

**Tech Stack:** Astro 6 + `@astrojs/vercel` v10 (adapter ya instalado), TypeScript, Resend SDK, GitHub Dependabot. Deploy en Vercel CDN + 1 serverless function.

**Spec:** `docs/superpowers/specs/2026-05-24-security-closeout-design.md`

---

## Pre-flight: Baseline state

### Task 0: Establecer baseline

**Files:** ninguno modificado en esta task.

- [ ] **Step 0.1: Verificar working tree limpio**

Run: `git status`
Expected: `nothing to commit, working tree clean`. Si hay cambios, decidir si commitearlos antes o stash.

- [ ] **Step 0.2: Verificar branch base**

Run: `git branch --show-current`
Expected: `main`. Si no, hacer `git checkout main && git pull`.

- [ ] **Step 0.3: Crear feature branch**

Run: `git checkout -b security-closeout`
Expected: `Switched to a new branch 'security-closeout'`.

- [ ] **Step 0.4: Build baseline pasa**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints` + build exitoso. Si falla: NO continuar — el spec se ejecuta sobre un baseline verde.

- [ ] **Step 0.5: Verificar acceso a Resend dashboard**

Manual: abrir https://resend.com/domains → confirmar que `vindevsito.dev` está al menos en estado **Partially Verified** con DKIM ✓ y SPF ✓. Si no: completar verificación DNS antes de Bucket B (no bloquea D ni C).

---

## Bucket D — Verification gate

> **Hipótesis (de baseline):** todos los criterios de D están ya satisfechos por trabajo absorbido en specs previos (Foundation/Security/Copy). Esta tarea es 100% verificación: si los greps pasan, 0 commits. Si alguno falla, hay un sub-step de corrección puntual.

### Task D.1: Verify visitcount badge ausente en README

**Files:** `README.md` (read-only verificación; modificar solo si falla).

- [ ] **Step D.1.1: Grep visitcount**

Run: `grep -c "visitcount" README.md`
Expected: `0`.

- [ ] **Step D.1.2: Si grep > 0 (fallback)**

Solo ejecutar si Step D.1.1 retornó > 0. Abrir `README.md`, localizar la línea con `![Visits](https://visitcount.itsvg.in/...)`, eliminarla completa (incluido cualquier salto de línea solitario que deje).

Re-run: `grep -c "visitcount" README.md` → debe ser `0`.

Commit (solo si se modificó):
```bash
git add README.md
git commit -m "chore(readme): remove visitcount third-party tracking badge"
```

---

### Task D.2: Verify rel=noopener en todos los target=_blank de src/

**Files:** `src/**/*.astro` (read-only verificación; modificar solo si falla).

- [ ] **Step D.2.1: Grep huérfanos**

Run: `grep -rn 'target="_blank"' src/ | grep -v noopener`
Expected: vacío.

- [ ] **Step D.2.2: Si grep retorna líneas (fallback)**

Por cada línea reportada, abrir el archivo y añadir `rel="noopener noreferrer"` al elemento que tiene `target="_blank"`. Patrón para anchor:

```astro
<a
  href="..."
  target="_blank"
  rel="noopener noreferrer">...</a
>
```

Re-run grep → debe quedar vacío.

Commit (solo si se modificó):
```bash
git add src/
git commit -m "fix(security): add rel=noopener noreferrer to remaining target=_blank links"
```

---

## Bucket C — Dependabot

### Task C.1: Crear `.github/dependabot.yml`

**Files:**
- Create: `.github/dependabot.yml`

- [ ] **Step C.1.1: Verificar carpeta .github**

Run: `ls -la .github/ 2>/dev/null || echo "missing"`
Expected: muestra contenido (si existe) o `missing`. Si missing, crearla:

Run: `mkdir -p .github`

- [ ] **Step C.1.2: Escribir dependabot.yml**

Crear `.github/dependabot.yml` con:

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
        patterns:
          - "astro"
          - "@astrojs/*"
      dev-dependencies:
        dependency-type: "development"
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

- [ ] **Step C.1.3: Validación de sintaxis YAML**

Run: `python3 -c "import yaml; yaml.safe_load(open('.github/dependabot.yml'))"`
Expected: sin output (parseo exitoso, exit 0). Si error: revisar indentación.

- [ ] **Step C.1.4: Commit**

```bash
git add .github/dependabot.yml
git commit -m "chore(deps): add Dependabot weekly automation for npm + github-actions

Grouping: Astro + @astrojs/* viajan juntos en un solo PR para evitar
desincronización de semver entre core y adapters."
```

- [ ] **Step C.1.5: Post-merge note**

Documentar en el handoff: el primer PR de Dependabot aparecerá el lunes siguiente al merge en `main`. Verificar entonces que CI bloquea merges si build falla.

---

## Bucket B — Endpoint propio (Resend)

### Task B.0: Confirmar dominio verificado en Resend

**Files:** ninguno (verificación externa).

- [ ] **Step B.0.1: Confirmar estado en Resend dashboard**

Manual: https://resend.com/domains/vindevsito.dev

Status mínimo requerido: **DKIM Verified** ✓ + **SPF Verified** ✓ (MX `feedback-smtp.amazonses.com` + TXT `v=spf1 ...amazonses.com ~all`).

Si solo aparece "Partially Verified" por MX Receiving Pending: está OK para enviar. Opcionalmente, desactivar toggle "Enable Receiving" para limpiar status (no se planea recibir emails en el dominio).

- [ ] **Step B.0.2: Obtener API key de Resend**

Manual: https://resend.com/api-keys → crear key con permiso "Sending access" (no full access) para el dominio `vindevsito.dev`. Copiar valor (formato `re_xxx...`). NO commitearlo.

- [ ] **Step B.0.3: Guardar key localmente**

Crear/editar `.env` en la raíz del repo:

```
RESEND_API_KEY=re_xxx_paste_real_value_here
```

Verificar que `.gitignore` excluye `.env`:

Run: `grep -E "^\.env$" .gitignore`
Expected: línea coincide (ya cubierto por la entry actual del .gitignore).

Run: `git status .env`
Expected: archivo no aparece (es ignorado). Si aparece tracked, NO continuar.

---

### Task B.1: Instalar SDK Resend y crear endpoint serverless

**Files:**
- Modify: `package.json` (npm install)
- Create: `src/pages/api/contact.ts`

- [ ] **Step B.1.1: Instalar Resend SDK**

Run: `npm install resend`
Expected: package añadido a `dependencies` en `package.json`, sin errores de peer-dep.

- [ ] **Step B.1.2: Crear endpoint**

Crear `src/pages/api/contact.ts` con:

```ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const nombre = String(data.get('nombre') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const descripcion = String(data.get('descripcion') ?? '').trim();
  const gotcha = String(data.get('_gotcha') ?? '');

  if (gotcha) {
    return Response.redirect(new URL('/contact?ok=1', request.url), 303);
  }

  if (!nombre || !email || !descripcion) {
    return new Response('Campos requeridos faltantes', { status: 400 });
  }

  const resend = new Resend(import.meta.env.RESEND_API_KEY);
  const { error } = await resend.emails.send({
    from: 'Contacto desde Portafolio <noreply@vindevsito.dev>',
    to: 'vin.devsito@gmail.com',
    replyTo: email,
    subject: `Contacto portafolio — ${nombre}`,
    text: descripcion,
  });

  if (error) {
    console.error('Resend error:', error);
    return new Response('Fallo envío', { status: 502 });
  }

  return Response.redirect(new URL('/contact?ok=1', request.url), 303);
};
```

Notas:
- `prerender = false` hace que Astro emita esta ruta como serverless function (hybrid output sobre base `'static'`).
- Los nombres de campo (`nombre`, `email`, `descripcion`) coinciden con los actuales del form en `Contact.astro` (NO `name`/`message`).
- `_gotcha` es honeypot: bots completan campos ocultos.
- 303 See Other tras POST evita re-submit al recargar.

- [ ] **Step B.1.3: Verificar build local**

Run: `npm run build`
Expected: `astro check` y build pasan. El output debe indicar que la ruta `/api/contact` es server-rendered (no prerendered). Si build falla con error de adapter: confirmar que `@astrojs/vercel` v10 está instalado.

- [ ] **Step B.1.4: Commit**

```bash
git add package.json package-lock.json src/pages/api/contact.ts
git commit -m "feat(contact): add Resend serverless endpoint at /api/contact

Reemplaza formsubmit.co. POST recibe formData con campos nombre/email/
descripcion + honeypot _gotcha. Envía email a vin.devsito@gmail.com
con sender verificado noreply@vindevsito.dev. replyTo apunta al sender
del form. Redirect 303 a /contact?ok=1 tras éxito."
```

---

### Task B.2: Actualizar Contact.astro

**Files:**
- Modify: `src/components/Contact.astro:1-14` (frontmatter + form opening tag), `:50` (añadir honeypot antes del button)

- [ ] **Step B.2.1: Editar frontmatter + form opening tag + honeypot**

En `src/components/Contact.astro`:

**Reemplazar líneas 1-14** (frontmatter y opening del form):

```astro
---

---

<article id="contact1" class="Poppins-R flex_col j_c wrap">
  <h1 class="Poppins-S flex all_c">Dame tu contacto</h1>
  <p>Siempre estoy abierto a propuestas, ¿tienes alguna?</p>
  <form
    action="/api/contact"
    method="POST"
    class="flex_col j_c wrap"
  >
```

Cambios sobre el original:
- Frontmatter vaciado: se elimina `const formSecurityAttrs = ...` (era para target=_blank, ya no aplica).
- `target="_blank"` eliminado del form: con el endpoint propio + 303 redirect, abrir tab nueva es UX rara.
- `{...formSecurityAttrs}` eliminado: sin target=_blank no se requiere rel=noopener.
- `action` apunta al endpoint propio.

**Edit separada (línea 50 del original, queda a ~47 tras Step anterior):** insertar honeypot inmediatamente después de `</div>` que cierra el inputBox del textarea (línea 49 original) y antes del `<button id="mensaje">` (línea 50 original). El input nuevo va dentro del `<form>`:

```astro
    <input
      type="text"
      name="_gotcha"
      tabindex="-1"
      autocomplete="off"
      aria-hidden="true"
      style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;"
    />
    <button id="mensaje" class="Poppins-S" type="submit">Enviar</button>
```

Nota: `display:none` puede ser detectado por bots avanzados; el patrón `position:absolute;left:-9999px` es más robusto y mantiene el input fuera del flujo visual sin que screen readers / bots lo descarten obviamente.

- [ ] **Step B.2.2: Verificar grep formsubmit en src/**

Run: `grep -rn "formsubmit" src/`
Expected: vacío.

- [ ] **Step B.2.3: Verificar build**

Run: `npm run build`
Expected: 0/0/0.

- [ ] **Step B.2.4: Smoke test local (dev server)**

Run: `npm run dev`
Manual: abrir `http://localhost:4321/contact`, inspeccionar el `<form>` en DevTools, confirmar:
- `action="/api/contact"`
- Sin `target="_blank"`
- Input `name="_gotcha"` presente pero invisible (visualmente fuera de pantalla)

No probar el envío real aún (RESEND_API_KEY puede no estar configurada en dev local; eso se cubre en B.4).

Detener dev server con Ctrl+C.

- [ ] **Step B.2.5: Commit**

```bash
git add src/components/Contact.astro
git commit -m "feat(contact): wire form to /api/contact endpoint + honeypot

- form action: formsubmit.co → /api/contact (endpoint propio)
- Quitar target=_blank: con 303 redirect en mismo tab es mejor UX
- Quitar formSecurityAttrs del frontmatter: ya no aplica sin target=_blank
- Añadir honeypot _gotcha oculto vía left:-9999px (sustituye al captcha que
  ofrecía formsubmit)"
```

---

### Task B.3: Actualizar CSP en vercel.json + crear .env.example

**Files:**
- Modify: `vercel.json:8` (eliminar `https://formsubmit.co` de `form-action`)
- Create: `.env.example`

- [ ] **Step B.3.1: Crear .env.example**

Crear `.env.example` en la raíz:

```
# Resend API key — obtener en https://resend.com/api-keys
# El endpoint /api/contact lee esta variable vía import.meta.env.RESEND_API_KEY
RESEND_API_KEY=
```

- [ ] **Step B.3.2: Editar vercel.json**

En `vercel.json:8`, el valor del header `Content-Security-Policy` actualmente termina en:

```
... form-action 'self' https://formsubmit.co
```

Cambiar a:

```
... form-action 'self'
```

El JSON completo del valor queda:

```
default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; font-src 'self' data:; connect-src 'self' https://va.vercel-scripts.com https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'
```

(Bucket A reemplazará TODO este header. Esta edición es transitoria para mantener funcionalidad si B y A se mergean en deploys separados.)

- [ ] **Step B.3.3: Verificar refs formsubmit fuera de docs/**

Run: `grep -rn "formsubmit" . --exclude-dir=docs --exclude-dir=node_modules --exclude-dir=.astro --exclude-dir=.vercel --exclude-dir=dist`
Expected: vacío.

- [ ] **Step B.3.4: Validar JSON de vercel.json**

Run: `python3 -c "import json; json.load(open('vercel.json'))"`
Expected: sin output (parseo exitoso). Si error: revisar comas/quotes.

- [ ] **Step B.3.5: Commit**

```bash
git add vercel.json .env.example
git commit -m "chore(security): drop formsubmit.co from CSP form-action + add .env.example

CSP form-action queda solo en 'self' tras migrar /contact a endpoint propio.
.env.example documenta RESEND_API_KEY como variable requerida."
```

---

### Task B.4: Configurar RESEND_API_KEY en Vercel + preview deploy + smoke test

**Files:** ninguno modificado.

- [ ] **Step B.4.1: Configurar variable en Vercel**

Manual: https://vercel.com/<account>/<project>/settings/environment-variables

Añadir:
- **Name:** `RESEND_API_KEY`
- **Value:** (el `re_...` de B.0.2)
- **Environments:** Production ✓ Preview ✓ Development ✓

Save.

- [ ] **Step B.4.2: Push branch para preview deploy**

Run: `git push -u origin security-closeout`
Expected: branch push exitoso. Vercel detecta y construye un preview deploy (1-3 min).

- [ ] **Step B.4.3: Esperar preview deploy**

Manual: ir al PR/branch en Vercel dashboard, esperar a que el preview deploy quede en estado **Ready** con URL accesible (`https://kevinjgv-git-security-closeout-<hash>.vercel.app` o similar).

- [ ] **Step B.4.4: Smoke test del form**

Manual: abrir `<preview-url>/contact`, completar form con datos reales (Nombre, Email tuyo, mensaje "test security closeout"), enviar.

Verificar:
1. **Tab no se cambia** (target=_blank removido).
2. **URL final tras submit**: `<preview-url>/contact?ok=1` (303 redirect).
3. **Email llega** a `vin.devsito@gmail.com` con:
   - From: `Contacto desde Portafolio <noreply@vindevsito.dev>`
   - Subject: `Contacto portafolio — <Nombre>`
   - Reply-To: el email que pusiste en el form
   - Body texto: el mensaje del form

Si no llega: revisar Resend dashboard → Emails → ver si hay entries con error (rate limit, dominio rechazado, etc.) y logs de la function en Vercel dashboard.

- [ ] **Step B.4.5: Honeypot test**

Manual con DevTools:
1. Abrir `<preview-url>/contact`.
2. DevTools → Elements → localizar `<input name="_gotcha">`.
3. Modificar el valor del input a `bot`.
4. Completar resto del form y enviar.

Verificar:
1. Página redirige a `/contact?ok=1` (apariencia normal de éxito).
2. **NO llega email** a `vin.devsito@gmail.com` (silently dropped por honeypot).

- [ ] **Step B.4.6: Si todo OK, anotar en handoff**

Bucket B completo. La feature funciona en preview. Pasar a Bucket A. NO mergear a `main` aún — primero cerrar A para evitar dos deploys consecutivos a producción.

---

## Bucket A — CSP nativo Astro 6

### Task A.1: Activar `security.csp` + `staticHeaders` en astro.config.mjs

**Files:**
- Modify: `astro.config.mjs:5-12` (config completo del defineConfig)

- [ ] **Step A.1.1: Editar astro.config.mjs**

Reemplazar el contenido actual (líneas 5-12):

```js
export default defineConfig({
  output: 'static',
  integrations: [react()],
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),
});
```

Por:

```js
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
```

Cambios:
- Añadir `security: { csp: true }` antes del `adapter`. Esto activa el generador nativo de CSP en Astro 6.
- Añadir `staticHeaders: true` en las opciones del adapter Vercel. Esto hace que el adapter escriba los headers generados por Astro (incluido CSP) en `vercel.json` automáticamente durante build.

- [ ] **Step A.1.2: Build local**

Run: `npm run build`
Expected: build pasa. Observar el output — Astro debería loggear si añade/modifica headers en `vercel.json`.

- [ ] **Step A.1.3: Inspeccionar dist/ para inline scripts no detectados**

Run: `grep -rn "<script" dist/ | grep -v "src=" | head -20`
Expected: lista de inline scripts incluidos en HTML generado. Anotar mentalmente los más comunes (Vercel Analytics, ClientRouter de view transitions, audio bootstrapping, hidratación de islands React).

Si Astro está hasheando correctamente, esos scripts ya están reflejados en el `Content-Security-Policy` que el build escribió en `vercel.json`. Pasar a A.2 para verificar.

- [ ] **Step A.1.4: NO commitear aún**

`vercel.json` puede haber sido reescrito por el build (Astro + staticHeaders lo hace automáticamente). Diff manual antes de commit en A.2.

---

### Task A.2: Reconciliar vercel.json con CSP de Astro

**Files:**
- Modify: `vercel.json` (eliminar CSP manual; conservar otros 5 headers; integrar con CSP generado por Astro)

- [ ] **Step A.2.1: Inspeccionar diff post-build**

Run: `git diff vercel.json`
Expected: Astro pudo haber añadido sus headers en una nueva entry `headers[]` o modificado la existente. Analizar el diff:

- Si Astro añadió un nuevo objeto en `headers` con su CSP: hay duplicación con la entry CSP manual de antes. Hay que eliminar la manual.
- Si Astro modificó la entry existente: verificar que el CSP nuevo NO incluye `'unsafe-inline'` en `script-src`.

- [ ] **Step A.2.2: Editar vercel.json a mano**

Caso esperado: vercel.json queda con el header `Content-Security-Policy` generado por Astro (con hashes) más los 5 manuales (X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security, Referrer-Policy, Permissions-Policy).

Si Astro NO sobrescribió el `Content-Security-Policy` manual (porque la entry existía antes con la misma key), eliminar el objeto manual `{ "key": "Content-Security-Policy", "value": "default-src 'self'; ... form-action 'self'" }` del array `headers[0].headers`. Mantener los otros 5.

Estructura esperada de `vercel.json` resultante (orden de keys puede variar):

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "<generado por Astro con sha256-xxx hashes>" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" }
      ]
    }
  ]
}
```

- [ ] **Step A.2.3: Verificar `script-src` sin `'unsafe-inline'`**

Run: `python3 -c "import json; csp = [h['value'] for h in json.load(open('vercel.json'))['headers'][0]['headers'] if h['key'] == 'Content-Security-Policy'][0]; print(csp)"`
Expected: imprime el CSP generado. Verificar:
- Contiene `script-src` sin `'unsafe-inline'`.
- Incluye uno o más `'sha256-...'` hashes en `script-src`.
- `style-src` aún puede contener `'unsafe-inline'` (no es objetivo de este spec).

Si `script-src` aún tiene `'unsafe-inline'`: el config de Astro no está hasheando. Revisar `astro.config.mjs` y consultar docs Astro 6 sobre `security.csp` (puede requerir opciones explícitas).

- [ ] **Step A.2.4: Build de nuevo y verificar idempotencia**

Run: `npm run build`
Expected: sin errores. `git diff vercel.json` post-segundo-build debe estar limpio (Astro no debería modificar de nuevo lo que ya escribió).

- [ ] **Step A.2.5: Commit**

```bash
git add astro.config.mjs vercel.json
git commit -m "feat(security): migrate to Astro 6 native CSP with auto-generated hashes

- astro.config.mjs: enable security.csp + adapter staticHeaders
- vercel.json: drop manual Content-Security-Policy entry (Astro la genera
  vía staticHeaders durante build, hasheando inline scripts propios y de
  Vercel Analytics)
- Mantiene otros 5 headers manuales (X-Frame-Options, X-Content-Type-Options,
  HSTS, Referrer-Policy, Permissions-Policy) que Astro no gestiona
- Cierra A+ en securityheaders.com sin 'unsafe-inline' en script-src.
  style-src queda con 'unsafe-inline' (GSAP/define:vars) — out of scope"
```

---

### Task A.3: Verificación de inline scripts no detectados (condicional)

> **Esta tarea solo ejecuta si A.4 detecta errores de CSP en runtime.**

**Files:**
- Modify (condicional): `astro.config.mjs` (añadir hashes manuales)

- [ ] **Step A.3.1: Capturar inline script huérfano**

Si A.4 muestra error de CSP en consola del browser (formato `Refused to execute inline script because it violates the following Content Security Policy directive: ... sha256-XXX`), el browser reporta el hash exacto requerido entre comillas.

Copiar el hash (formato `'sha256-<base64>='`).

- [ ] **Step A.3.2: Añadir hash manual a astro.config.mjs**

Editar la sección `security` en `astro.config.mjs`:

```js
security: {
  csp: {
    scriptDirective: {
      hashes: ['sha256-XXX_paste_real_hash_here'],
    },
  },
},
```

Si hay múltiples scripts huérfanos, añadir múltiples entries al array.

- [ ] **Step A.3.3: Re-build y re-verificar**

Run: `npm run build`

Push, esperar preview deploy, re-ejecutar A.4 → consola debe quedar limpia.

- [ ] **Step A.3.4: Commit (solo si se añadieron hashes)**

```bash
git add astro.config.mjs
git commit -m "fix(security): add manual CSP hashes for runtime-injected scripts

Astro 6 security.csp no detectó automáticamente <inline script>
inyectado por <Vercel Analytics | view transitions | otro>. Hash
añadido manualmente vía scriptDirective.hashes."
```

---

### Task A.4: Preview deploy + verificación A+ en securityheaders.com + smoke test runtime

**Files:** ninguno modificado.

- [ ] **Step A.4.1: Push y esperar preview deploy**

Run: `git push`
Manual: esperar a que Vercel construya el preview deploy (1-3 min). Obtener la URL del preview.

- [ ] **Step A.4.2: Verificar headers servidos**

Run: `curl -sI <preview-url>/ | grep -i "content-security-policy"`
Expected: muestra el header CSP servido por Vercel. Verificar:
- Contiene `script-src` con uno o más `'sha256-...'`.
- NO contiene `'unsafe-inline'` en `script-src`.
- `style-src` puede mantener `'unsafe-inline'` (intencional).

- [ ] **Step A.4.3: securityheaders.com**

Manual: https://securityheaders.com/?q=<preview-url> → click "Hide Results" si se ofrece (privado) o aceptar público.

Expected: **A+** (sin downgrade por `'unsafe-inline'` en `script-src`).

Si A+ no se obtiene: leer reporte específico, identificar qué directiva falla. Si es `'unsafe-inline'`: hash no se generó. Si es otro header: confirmar que A.2 conservó los 5 manuales.

- [ ] **Step A.4.4: Smoke test runtime sobre los 5 puntos sensibles**

Manual: abrir `<preview-url>/` con DevTools → Console:

1. **Audio loop**: tras primera interacción (click), el audio arranca. NO debe haber CSP error en consola.
2. **Hover cards**: pasar mouse sobre cards de Casos en `/`, debe verse el efecto tilt. NO CSP error.
3. **Mobile render**: DevTools → device mode → iPhone 12 → recorrer `/`, `/me`, `/contact`. Layout correcto, sin whitespace anómalo.
4. **Nav dropdown**: en sidebar (mobile), abrir y cerrar el menú. Funciona sin CSP error.
5. **Footer width**: full width, no recortado.

Si HAY errors de CSP en consola: capturar el hash que el browser pide, ir a **Task A.3** y añadir hashes manuales. Re-build, re-push, re-verificar.

- [ ] **Step A.4.5: Verificar /api/contact sigue funcionando post-CSP**

Manual: en `<preview-url>/contact`, re-enviar form de prueba. Confirmar que llega email a `vin.devsito@gmail.com` (CSP `form-action 'self'` debe permitir POST a `/api/contact`).

- [ ] **Step A.4.6: Si todo OK, anotar en handoff**

Spec completo en preview. Listo para PR + merge a `main`.

---

## Final: PR + merge + post-merge validation

### Task F.1: Crear PR

**Files:** ninguno modificado.

- [ ] **Step F.1.1: Verificar criterios automáticos del spec**

Run los 8 criterios del contrato del spec:

```bash
grep -rn "formsubmit" . --exclude-dir=docs --exclude-dir=node_modules --exclude-dir=.astro --exclude-dir=.vercel --exclude-dir=dist
grep -rn 'target="_blank"' src/ | grep -v noopener
grep -c "visitcount" README.md
python3 -c "import json; csp = [h['value'] for h in json.load(open('vercel.json'))['headers'][0]['headers'] if h['key'] == 'Content-Security-Policy'][0]; print('FAIL' if \"'unsafe-inline'\" in csp.split('script-src')[1].split(';')[0] else 'PASS')"
test -f .github/dependabot.yml && echo "PASS" || echo "FAIL"
test -f src/pages/api/contact.ts && echo "PASS" || echo "FAIL"
grep -c "RESEND_API_KEY" .env.example
npm run build
```

Expected:
- Greps 1-3: vacíos / `0`.
- CSP check: `PASS`.
- File tests: ambos `PASS`.
- `.env.example` grep: `≥ 1`.
- Build: 0/0/0.

- [ ] **Step F.1.2: Crear PR vía gh**

Run:
```bash
gh pr create --title "feat(security): close security follow-ups (Spec 4)" --body "$(cat <<'EOF'
## Summary

Cierra el paraguas de seguridad heredado de specs anteriores:
- **A** — CSP nativo Astro 6 (`security.csp` + adapter `staticHeaders`). Recupera A+ en securityheaders.com sin `'unsafe-inline'` en `script-src`.
- **B** — Endpoint propio `/api/contact` con Resend + dominio verificado `vindevsito.dev`. Elimina dependencia externa de `formsubmit.co`. Honeypot anti-spam.
- **C** — Dependabot weekly para npm + github-actions (grupos Astro/adapters juntos).
- **D** — Verificación: no quedan refs a visitcount ni `target="_blank"` sin `rel="noopener noreferrer"` (ya absorbido en specs previos).

## Test plan

- [ ] securityheaders.com sobre preview URL → A+
- [ ] Smoke test runtime (audio, cards, mobile, nav, footer) sin errores de CSP
- [ ] Form `/contact` envía → email llega a vin.devsito@gmail.com desde `noreply@vindevsito.dev`
- [ ] Honeypot funciona (request con `_gotcha` lleno → redirect sin email)
- [ ] `npm run build` → 0/0/0
- [ ] CI gates pasan en PR

Spec: \`docs/superpowers/specs/2026-05-24-security-closeout-design.md\`
Plan: \`docs/superpowers/plans/2026-05-24-security-closeout.md\`
EOF
)"
```

- [ ] **Step F.1.3: Mergear**

Tras review (humana o ultrareview): mergear a `main`. Vercel deploya a producción automáticamente.

---

### Task F.2: Post-merge production validation

**Files:** ninguno modificado.

- [ ] **Step F.2.1: securityheaders.com sobre producción**

Manual: https://securityheaders.com/?q=https://vindevsito.dev/
Expected: A+.

- [ ] **Step F.2.2: Smoke test runtime en producción**

Mismas 5 verificaciones que A.4.4 pero sobre `https://vindevsito.dev/`.

- [ ] **Step F.2.3: Form prod end-to-end**

Manual: enviar form de prueba desde producción. Email debe llegar a `vin.devsito@gmail.com`.

- [ ] **Step F.2.4: CLAUDE.md (opcional)**

Si durante el spec se identificaron desactualizaciones en `CLAUDE.md` (output: 'static' refs, sección de deploy, etc.), abrir PR separado de docs. No mezclar con este spec.

- [ ] **Step F.2.5: Reportar follow-ups detectados durante ejecución**

Si surgió algo no resuelto (ej. hashes manuales adicionales necesarios, error inesperado en Resend, etc.), documentar en una sección "Findings" del spec o como issue en el repo para el siguiente spec.

---

## Resumen de tareas

- **Task 0**: Baseline (5 steps, 0 commits)
- **Bucket D**: D.1 + D.2 verification (idempotente, 0-2 commits si falla algo)
- **Bucket C**: C.1 dependabot.yml (1 commit)
- **Bucket B**: B.0 verify Resend → B.1 SDK+endpoint → B.2 form → B.3 CSP+env.example → B.4 deploy+smoke (3 commits + 1 manual config + 1 preview)
- **Bucket A**: A.1 config → A.2 reconcile vercel.json → A.3 hashes manuales (condicional) → A.4 preview+A+ verification (1-2 commits)
- **Final**: F.1 PR + F.2 prod validation (0 commits adicionales)

**Total commits esperados:** 5-7 commits atómicos.
**Total tiempo esperado:** 1-2 sesiones, con tiempo de espera incluido para DNS Resend (si aún pending) y preview deploys.
**Riesgo principal:** Bucket A (CSP nativo). Plan B explicito: revert atómico del commit de A.2 + A.3 si rompe runtime y volver al CSP manual con `'unsafe-inline'` (quick fix actual).
