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

## Fuera de alcance (follow-up)

- **Enlazado inteligente** del portafolio principal (`vindevsito.dev`) ↔ el
  subdominio del CV. Tarea separada posterior.
- Configuración de DNS / asignación del subdominio `cv.vindevsito.dev` en Vercel
  (acción manual del usuario, una sola vez).
