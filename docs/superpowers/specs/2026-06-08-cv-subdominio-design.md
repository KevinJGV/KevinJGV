# Vista CV en subdominio — Diseño

**Fecha:** 2026-06-08
**Estado:** Aprobado (pendiente revisión de spec por el usuario)

## Objetivo

Crear una vista liviana tipo "CV Harvard" (texto plano, una columna) desplegada en
un subdominio del portafolio actual (`cv.vindevsito.dev`), replicando el resume de
Kevin que vive en `docs/superpowers/.cv/` (PDFs ES/EN). Debe existir en español e
inglés, igual que el sitio actual, y ofrecer descarga del PDF original.

La página es deliberadamente lo opuesto al portafolio principal: sin GSAP, sin
Three.js, sin dependencias, CSS mínimo inline, carga instantánea.

## Routing y subdominio

- Páginas nuevas autocontenidas bajo `src/pages/cv/`:
  - `src/pages/cv/index.astro` → CV **español** (`cv.vindevsito.dev/`)
  - `src/pages/cv/en/index.astro` → CV **inglés** (`cv.vindevsito.dev/en`)
- **No** usan el i18n-routing de Astro. Ese sistema deriva el locale del prefijo
  `/en/` del path, lo cual no aplica a rutas `/cv/...`. En su lugar, cada página
  pasa su `locale` de forma explícita al componente de cuerpo. Esto mantiene el CV
  **desacoplado** del routing del portafolio principal.
- **Rewrite por host** en `vercel.json`: `cv.vindevsito.dev/(.*)` → `/cv/$1`
  (condición `has: [{ type: 'host', value: 'cv.vindevsito.dev' }]`). Un único
  rewrite cubre ambos idiomas:
  - `cv.vindevsito.dev/` → `/cv/` (es)
  - `cv.vindevsito.dev/en` → `/cv/en/` (en)
- Se mantiene `output: 'static'`. Sin SSR, sin funciones nuevas.

## Componentes (aislados, una sola responsabilidad)

### `src/layouts/CvLayout.astro`
Layout propio y mínimo (NO reusa `Layout.astro`, que carga GSAP/Three).
Responsabilidades:
- `<head>` con meta tags, `<title>`, `lang` correcto por locale.
- **Script anti-flash de tema inline**, colocado en `<head>` ANTES de cualquier CSS.
- `hreflang` ES↔EN y canonical.
- Todo el CSS de la página (inline, scoped o `is:global` según convenga, sin
  dependencias externas).
- Props: `interface Props { locale: 'es' | 'en'; title: string }`.

### `src/components/cv/CvDocument.astro`
Cuerpo del CV: encabezado, perfil, experiencia profesional, educación, habilidades.
- Recibe `locale` + datos tipados y mapea sobre ellos.
- Compartido por ambas páginas → cero duplicación de markup.
- Props: `interface Props { locale: 'es' | 'en' }` (lee los datos de `src/data/cv.ts`).

### `src/components/cv/ThemeToggle.astro`
Toggle de 3 estados: claro / oscuro / sistema.
- JS vanilla, sin framework.
- Persistencia en `localStorage` (clave dedicada, p.ej. `cv-theme`).
- Estado "sistema" NO persiste un tema fijo; escucha cambios de
  `matchMedia('(prefers-color-scheme: dark)')` en vivo.
- Iconos SVG con `currentColor`.

## Datos

### `src/data/cv.ts`
Contenido del CV **tipado**, siguiendo la convención de `src/data/*.ts`.
- `interface CvData { ... }` que modele: datos de contacto, perfil/summary,
  lista de experiencias (puesto, empresa, fechas, descripción, logros[]),
  educación, y grupos de habilidades (categoría → items).
- Exporta `es: CvData` y `en: CvData`. Fuente única de verdad del texto.
- El contenido se transcribe de los PDFs en `docs/superpowers/.cv/`
  (`KEVIN_JOHAN_GONZÁLEZ_V_CV_ES.pdf` y `..._EN.pdf`).

Contenido a transcribir (ambos idiomas):
- **Contacto:** vin.devsito@gmail.com · +573178952025 · Bucaramanga, Colombia ·
  LinkedIn · Github · Website. Título: "FullStack Software Developer".
- **Perfil / Profile.**
- **Experiencia:** Clonai S.a.s (FullStack Developer / Implementation Lead,
  02/2025–05/2026) y Campuslands Co-working (FullStack Developer,
  10/2023–02/2025), cada una con sus "Logros Clave / Key Achievements".
- **Educación:** Técnico en desarrollo de software / Software Development
  Technician — Campuslands (09/2023–02/2025, Floridablanca, Colombia).
- **Habilidades / Skills:** Lenguajes, Bases de Datos y BaaS, Herramientas y
  Automatización, Frameworks y Librerías, IA/Arquitectura/Procesamiento,
  Liderazgo y Metodologías.

## Estilo — Harvard académico

- Una sola columna, ancho de lectura cómodo centrado.
- Fuente serif del sistema (Georgia / Times New Roman / serif).
- Jerarquía solo por tamaño, negrita y espaciado. Reglas horizontales finas como
  separadores de sección. Sin sombras decorativas.
- Encabezado: nombre + título + línea de contacto con enlaces.
- Botón **"Descargar PDF" / "Download PDF"** → el PDF del idioma activo.
- Selector de idioma ES/EN (enlaza `/` ↔ `/en` dentro del subdominio).
- Link discreto de vuelta al portafolio principal.
- `@media print`: oculta toggle/botones/selector, ajusta colores a impresión
  limpia (fondo blanco, texto negro), para un "Guardar como PDF" presentable.

## Tema — reglas de modo oscuro aplicadas

Basado en la guía de modo oscuro (Material Design). CSS custom properties con
selector `[data-theme="light|dark"]` en `<html>`. **Default = sistema** vía
`prefers-color-scheme`.

Variables:

```
:root, [data-theme="light"] {
  --bg: #ffffff;
  --text: #111827;
  --text-secondary: #6B7280;
  --border: #E5E7EB;
  --accent: #3B82F6;
}
[data-theme="dark"] {
  --bg: #121212;            /* nunca #000 */
  --text: rgba(255,255,255,0.87);
  --text-secondary: rgba(255,255,255,0.60);
  --border: #333333;
  --accent: #60A5FA;        /* acento desaturado/aclarado para dark */
}
```

Reglas:
- Texto principal 87% / secundario 60% de opacidad en dark (no blanco puro).
- Acento link: `#3B82F6` (light) → `#60A5FA` (dark).
- Elevación con luminosidad, no sombras (la página casi no tiene superficies
  elevadas; mantener bordes sutiles `--border`).
- Focus visible: `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }`.
- Transición de tema 200ms en `background-color, color, border-color`.
- `@media (prefers-reduced-motion: reduce)` → `transition: none`.
- `@media (prefers-contrast: more)` → subir contraste (texto/bg hacia extremos).
- Contraste objetivo WCAG AA ≥ 4.5:1 en todos los pares.

### Script anti-flash (en `<head>`, antes del CSS)

```html
<script is:inline>
  (function () {
    var saved = localStorage.getItem('cv-theme'); // 'light' | 'dark' | 'system' | null
    var sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var resolved = (saved === 'light' || saved === 'dark')
      ? saved
      : (sysDark ? 'dark' : 'light');
    document.documentElement.dataset.theme = resolved;
  })();
</script>
```

El `ThemeToggle` reusa esta lógica para resolver y, en modo "sistema", adjunta un
listener a `matchMedia` que actualiza `data-theme` cuando el SO cambia, sin
sobrescribir una elección manual.

## Assets

- Copiar los 2 PDFs de `docs/superpowers/.cv/` a `public/cv/`:
  - `public/cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_ES.pdf`
  - `public/cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_EN.pdf`
- (Opcional, decidir en plan) renombrar a slugs más simples como `cv-es.pdf` /
  `cv-en.pdf` para URLs limpias.

## Verificación

- `npm run build` (incluye `astro check`) debe pasar antes de declarar el trabajo
  completo. El hook `PostToolUse` corre `astro check` tras editar `.astro`/`.ts`.
- Revisión manual: cambio de tema sin flash, persistencia, descarga de PDF por
  idioma, selector ES↔EN, impresión limpia.

## Producción: enrutamiento del subdominio (cómo se sirve el CV en la raíz)

`cv.vindevsito.dev` y el portafolio comparten **un solo deploy estático**. Servir
contenido distinto por host en la **raíz** (`/`) resultó imposible con los
mecanismos del repo, porque en `output: 'static'` el `handle: filesystem` de
Vercel sirve los `.html` prerenderizados **antes** que cualquier función:

- `rewrites` de `vercel.json` → se evalúan **después** del filesystem ⇒ `/` servía
  el `index.html` del apex. Solo funcionaban rutas sin colisión.
- Edge middleware (`@astrojs/vercel` `middlewareMode: 'edge'`) → en static, el
  `_middleware` solo atrapa lo que **no** existe como archivo (API/404). Tampoco
  intercepta `/`.

Lo que **sí** corre antes del filesystem en un deploy estático: *redirects* y las
**Vercel Routing Rules** (config a nivel proyecto, NO en el repo). La solución es
una routing rule que reescribe por host. Vive en la config del proyecto Vercel
`kejogostorage/webpage` y sobrevive a los deploys. Para reproducirla:

```bash
npx vercel routes add "CV subdomain root" \
  --src "/:path((?!_astro/|_vercel/|cv/).*)" --src-syntax path-to-regexp \
  --has "host:eq=cv.vindevsito.dev" \
  --action rewrite --dest "/cv/:path" --yes
npx vercel routes publish --yes
```

Notas:
- `src` y `dest` deben usar el **mismo** parámetro sin desajuste de modificador
  (`:path` ↔ `:path`; `:path*` en el dest NO sustituye y da 404).
- Excluye `_astro/`, `_vercel/` y `cv/` (assets compartidos y rutas ya correctas).
- El apex no se ve afectado (la regla está condicionada al host del CV).
- Por esto `vercel.json` ya **no** lleva `rewrites`: la routing rule lo reemplaza.

### Segunda routing rule: CSP del subdominio

La rewrite anterior hace que las respuestas del subdominio salgan **sin** la CSP
que Astro fija por-ruta (esa CSP queda en las respuestas del apex `/cv/…`). Para
no servir el subdominio sin CSP, una segunda routing rule header-only (también
condicionada al host) reinyecta una CSP. Usa `'unsafe-inline'` en `script-src`
porque en el subdominio no se pueden mantener los hashes por-página de Astro (que
cambian en cada build); el resto de directivas replican `astro.config.mjs`.

```bash
npx vercel routes add "CV subdomain CSP" \
  --src "^/.*$" --has "host:eq=cv.vindevsito.dev" \
  --set-response-header "Content-Security-Policy=default-src 'self'; img-src 'self' data: https:; media-src 'self' https:; font-src 'self' data:; connect-src 'self' https://vitals.vercel-insights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'" \
  --yes
npx vercel routes publish --yes
```

Notas:
- Es regla #2 (Transform), después de la rewrite #1; aplica el header también a las
  respuestas ya reescritas (`/`, `/en/`). Verificado en prod.
- Consecuencia: en el subdominio los scripts `is:inline` (anti-flash de tema,
  auto-redirect de idioma) corren bajo `'unsafe-inline'`. En el apex `/cv/…` la CSP
  estricta de Astro sigue bloqueándolos (ruta interna, no de cara al usuario).

### URLs internas limpias

Los enlaces del CV (selector ES↔EN, descarga PDF) y el target del auto-redirect de
idioma usan **paths relativos**, no `/cv/...` absolutos. Así resuelven limpio en el
subdominio (`/` ↔ `/en/`, `/Kevin…pdf`) y correcto en el apex (`/cv/` ↔ `/cv/en/`).
Ver `src/pages/cv/index.astro`, `src/pages/cv/en/index.astro`, y el script de
redirect en `src/layouts/CvLayout.astro`.

### Redirects cross-host (sin 404, sin duplicados)

**Orden completo de routing rules** (host `cv.vindevsito.dev`), de arriba a abajo
— los redirects van ANTES del rewrite (las routing rules corren antes que
`vercel.json` y antes del filesystem; si fueran después del rewrite, `/me` ya sería
`/cv/me`):

1. `CV sub /cv/en alias` — redirect `^/cv/en/?$` → `/en/` (308). Preserva idioma.
2. `CV sub catch-all to root` — redirect `^/(?!$|en/?$|_astro/|_vercel/|cv\.ico$|favicon\.ico$|Kevin_Johan_Gonzalez_CV_(ES|EN)\.pdf$).+` → `/` (308). Manda toda ruta no-CV (`/me`, `/contact`, `/cv`, `/cv/`, random) a la raíz.
3. `CV subdomain root` — rewrite (existente).
4. `CV subdomain CSP` — header (existente).

```bash
npx vercel routes add "CV sub /cv/en alias" --src '^/cv/en/?$' \
  --has "host:eq=cv.vindevsito.dev" --action redirect --dest "/en/" --status 308 --yes
npx vercel routes add "CV sub catch-all to root" \
  --src '^/(?!$|en/?$|_astro/|_vercel/|cv\.ico$|favicon\.ico$|Kevin_Johan_Gonzalez_CV_(ES|EN)\.pdf$).+' \
  --has "host:eq=cv.vindevsito.dev" --action redirect --dest "/" --status 308 --yes
# ordenar los 2 redirects al tope (alias antes que catch-all) y publicar:
npx vercel routes reorder "CV sub catch-all to root" --position start --yes
npx vercel routes reorder "CV sub /cv/en alias" --position start --yes
npx vercel routes publish --yes
```

⚠️ **Fragilidad**: el catch-all (#2) enumera en su lookahead las rutas válidas del
subdominio (raíz, `en`, `_astro/`, `_vercel/`, `cv.ico`, `favicon.ico`, los 2 PDFs).
Si se añade una página o asset al CV, **hay que actualizar ese regex** o se
redirigirá a `/`. `--src-syntax` default es `regex`.

**Dominio principal → subdominio** (en `vercel.json`, no routing rule, porque
ninguna routing rule afecta a `www`/apex y así queda en git):

```jsonc
// vercel.json
"redirects": [{
  "source": "/cv/:path*",
  "has": [{ "type": "host", "value": "(www\\.)?vindevsito\\.dev" }],
  "destination": "https://cv.vindevsito.dev/:path*",
  "permanent": true
}]
```

`vindevsito.dev/cv/` → `cv.vindevsito.dev/`, `/cv/en/` → `/en/`. CV con UNA sola URL
canónica (el subdominio). Requiere deploy (commit + push). Nota: `/cv/` y `/cv/en/`
ya cacheados como 200 pueden tardar en empezar a redirigir hasta que el edge
revalide; las rutas nuevas (`/cv/loquesea`) redirigen de inmediato.

**Dominio principal: rutas inexistentes → raíz** (routing rule, host `www`):

```bash
npx vercel routes add "Main domain unknown to root" \
  --src '^/(?!$|me/?$|contact/?$|en/?$|en/me/?$|en/contact/?$|cv(/|$)|_astro/|_vercel/)[^.]+$' \
  --has "host:eq=www.vindevsito.dev" --action redirect --dest "/" --status 308 --yes
npx vercel routes publish --yes
```

Toda ruta inexistente del dominio principal (`/en/asdfadsf`, `/loquesea`, `/me/xyz`)
→ 308 → `/`, en vez de servir una página 404. El `[^.]+$` excluye archivos (con
punto: assets) y el lookahead excluye las páginas válidas y `/cv*` (que va al
subdominio). El apex llega a `www` por su redirect de dominio.

⚠️ **Fragilidad (igual que el catch-all del subdominio)**: enumera las páginas
válidas del sitio principal (`me`, `contact`, `en`, `en/me`, `en/contact`). Si se
añade una página al portafolio, **actualizar este regex** o se redirigirá a `/`.

## Fuera de alcance (follow-up)

- **Enlazado inteligente** del portafolio principal (`vindevsito.dev`) ↔ el
  subdominio del CV (links cruzados apex→subdominio, en la UI). Las URLs internas y
  los redirects de enrutamiento ya están resueltos.
- En el apex `/cv/…` los scripts `is:inline` siguen bloqueados por la CSP estricta
  de Astro (patrón del proyecto: Astro solo hashea scripts procesados, no
  `is:inline`). No impacta al usuario (el acceso es por el subdominio).
- Configuración de DNS / asignación del subdominio `cv.vindevsito.dev` en Vercel
  (ya hecho: nameservers Vercel + subdominio conectado al proyecto `webpage`).
