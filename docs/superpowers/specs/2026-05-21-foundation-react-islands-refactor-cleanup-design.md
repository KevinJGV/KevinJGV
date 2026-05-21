# Foundation — React Islands + Refactor + Limpieza

**Fecha:** 2026-05-21
**Estado:** Diseño aprobado, pendiente plan de implementación
**Stack actual:** Astro 5 SSR + GSAP + Vercel adapter
**Repositorio:** KevinJGV/KevinJGV

## Contexto

El portafolio personal está construido en Astro 5 con adapter de Vercel en modo SSR. La base tiene ~4046 LOC distribuidas en 18 archivos `src/`, con varios componentes que han crecido por encima de los 250 LOC mezclando markup, lógica y estilos. Existen dos archivos JavaScript sin tipos (`dots.js`, `motion-cursor.js`) y assets en `public/` cuya utilización no está verificada.

El usuario tiene un conjunto de seis objetivos sobre el portafolio (evaluación React/Astro, refactor, limpieza, seguridad, copy/posicionamiento, features nuevas). En sesión de brainstorming se decidió:

1. **Mantener Astro como stack principal** y añadir `@astrojs/react` para tener React Islands disponibles cuando una pieza interactiva lo justifique. La motivación de "señal de CV en React" queda cubierta porque el repo público pasará a contener tanto `.astro` como `.tsx`. La motivación de "interactividad rica / API integrations" se cubre con islas selectivas. No hay caso para migrar a un SPA React.
2. **Descomponer las seis metas en specs independientes**, atacando primero la fundación técnica (este documento). Le siguen: copy/posicionamiento, auditoría de seguridad, features nuevas.

Este spec es el primer eslabón. Su objetivo es dejar una base de código limpia, tipada y con React listo para usarse, sin alterar la experiencia visible del portafolio.

## Objetivos

1. Añadir `@astrojs/react` y establecer la convención de cuándo usar `.astro` vs `.tsx`. El setup queda listo; no se crea aún ningún componente React.
2. Partir componentes grandes (>~250 LOC) en sub-componentes de responsabilidad única.
3. Migrar `dots.js` y `motion-cursor.js` a TypeScript.
4. Eliminar código muerto, imports no usados y assets huérfanos en `public/` (excepto los OGG, que se preservan por decisión del usuario).
5. Evaluar cada archivo del proyecto para oportunidades de **simplificación de lógica** (duplicación, condicionales anidados, valores mágicos, props muertos, manejo de DOM contra el ciclo de Astro). El comportamiento observable no cambia.
6. Aplicar cambios obvios y de bajo riesgo descubiertos durante el refactor (ej: `output: 'server'` → `'static'` si no se usa SSR real, fonts no referenciadas).

## No-objetivos

- Re-redacción de copy o reposicionamiento del portafolio.
- Auditoría de seguridad (CSP, headers, dependencias).
- Features nuevas.
- Cambios visuales o de UX — el refactor es invisible para el visitante.
- Reescribir cualquier componente "porque podría hacerse con otro patrón".
- Cambiar la librería que hace algo (sigue GSAP).
- Tocar la lógica de animaciones GSAP más allá de extraer constantes y tipar parámetros.
- Renames cross-cutting en el codebase.

## Contrato de preservación

La salida visual de cada página y todas las animaciones GSAP deben verse y comportarse idénticas antes y después del refactor. Cualquier hallazgo que requiera cambio funcional o visual se documenta como follow-up al final de la ejecución, no se aplica aquí.

## Diseño

### Setup de React Islands

**Dependencias a instalar:**
- `@astrojs/react`
- `react`
- `react-dom`
- `@types/react` (dev)
- `@types/react-dom` (dev)

**Cambio en `astro.config.mjs`:** registrar la integración `react()` en el array `integrations`. El resto del archivo (`adapter: vercel(...)`, opciones de build) no se modifica como parte del setup. Si en la fase de "hallazgos" se decide cambiar `output: 'server'` → `'static'`, esa modificación va aparte y con su propia justificación.

**Sin cambios en `tsconfig.json`** más allá de los que `@astrojs/react` aporta por defecto.

### Estructura de archivos

- Componentes `.astro` → siguen en `src/components/` (raíz). Es el default.
- Componentes React → `src/components/react/` con extensión `.tsx`. La carpeta deja inmediatamente claro qué se hidrata en el cliente.
- Sub-componentes específicos de una página → `src/components/<page>/<Subcomponent>.astro` (ej: `src/components/me/Skills.astro`).
- Sub-componentes reutilizables → quedan en `src/components/` (raíz).
- Estilos globales → si `GlobalStyles.astro` se parte, los fragmentos viven en `src/styles/` con nombres por concern (`variables.css`, `reset.css`, `typography.css`, `utilities.css`).

### Convención `.astro` vs `.tsx`

Queda documentada en `CLAUDE.md`:

| Caso | Usar |
|---|---|
| Contenido estático, layout, sección sin estado | `.astro` |
| Animación GSAP simple disparada en load/scroll | `.astro` (script vanilla) |
| Estado local complejo (formulario multi-paso, filtros, búsqueda en vivo) | `.tsx` con `client:load` o `client:visible` |
| Fetch de API en el navegador con render reactivo | `.tsx` con `client:visible` |
| Microinteracción aislada sin estado | `.astro` con vanilla JS — no justifica una isla |

**Directiva de hidratación por defecto:** `client:visible` salvo razón concreta para `client:load`.

### Criterio de partición de componentes

Se parte un archivo solo si cumple **los tres** criterios:

1. El archivo supera ~250 LOC.
2. Visualmente cubre >1 sección o concepto distinguible (ej: hero + bio + skills + galería, no una sola unidad).
3. Las partes son co-localizables: viven en una sola página o se reutilizan en ≤2 sitios.

Si un archivo es grande pero hace **una sola cosa coherente** (ej: una tarjeta compleja que es la tarjeta entera), no se parte. La regla es responsabilidad, no líneas.

Cuando un sub-componente reciba datos, se tipan las `Props` con `interface Props { ... }` en el frontmatter.

### Tratamiento por archivo grande (alto nivel)

Los splits exactos se determinan en `writing-plans` tras leer cada archivo. Tabla orientativa:

| Archivo | LOC | Acción esperada |
|---|---|---|
| `Me.astro` | 535 | Partir por secciones visibles de `/me`. Likely 3-5 sub-componentes en `src/components/me/`. |
| `Card.astro` | 505 | Investigar primero. Si es UNA tarjeta compleja → dejar y solo simplificar. Si renderiza N variantes → partir en `Card.astro` (shell) + variantes. |
| `Home.astro` | 452 | Mismo patrón que `Me.astro`. Sub-componentes en `src/components/home/`. |
| `Footer.astro` | 363 | Partir por bloques del footer (links, redes, contacto, créditos). |
| `GlobalStyles.astro` | 359 | **Caso especial**: no es un componente. Partir por concern (variables, reset, typography, utilities) y reimportar desde un único entry point. |

**Archivos que NO se parten** (responsabilidad clara y bajo 250 LOC): `Anchor.astro` (133), `Hexagon.astro` (106), `Navbar.astro` (160), `SideComponentMain.astro` (159), `Contact.astro` (218), `Highlighter.astro` (52), `Sidebar.astro` (63), `CustomCursor.astro` (37).

**Archivos a re-evaluar al leerlos** (no se parten por default; entran solo si la lectura confirma que cubren múltiples conceptos distinguibles):
- `Tools.astro` (339 LOC) — borderline por tamaño.
- `Layout.astro` (239 LOC) — justo en el límite. Se evalúa solo si tiene contenido que claramente no es de layout. Un layout naturalmente es denso.

### Preservación visual durante el split

- Astro hace CSS scoping por componente. Cuando se extrae markup a un sub-componente, los estilos que dependían de selectores del padre se rompen.
- **Regla:** los estilos que aplican al sub-componente se mueven con él. Los estilos globales (tipografía, colores, resets) quedan en `GlobalStyles` (o sus splits) y no migran.
- Después de cada split: ejecutar `npm run dev`, comparar las 3 páginas (`/`, `/me`, `/contact`) antes/después.

### Migración `.js` → `.ts`

Archivos:
- `src/components/dots.js` (51 LOC) → `dots.ts`
- `src/components/motion-cursor.js` (206 LOC) → `motion-cursor.ts`

Pasos por archivo:
1. Renombrar la extensión.
2. Tipar parámetros y returns. Las APIs del navegador (`HTMLElement`, `MouseEvent`, etc.) ya tienen tipos en `lib.dom`.
3. Marcar variables sin tipo inferible con tipos explícitos.
4. `astro check` debe pasar limpio.

Si algún archivo solo se usa como script inline desde un `.astro`, evaluar si vale más absorberlo directamente al frontmatter del componente que lo usa.

### Limpieza — categorías y método

| Categoría | Método |
|---|---|
| Imports no usados en `.astro`/`.ts` | `astro check` lo reporta. |
| Componentes nunca importados | `grep -r "import.*ComponentX" src/` por cada componente. Cero hits = candidato a borrar. |
| Assets huérfanos en `public/` | Por cada archivo, `grep -r "<basename>" src/ public/`. Cero hits = candidato. Las fonts se referencian por `@font-face` en CSS — revisar también `src/styles/`. |
| CSS muerto | Inspección manual solo si surge sospecha. No hay herramienta confiable sin falsos positivos. |
| Variables / funciones sin uso dentro de un archivo | `astro check` los marca. |

**OGG (`VIN.ogg`, `VINXD.ogg`) se preservan** aunque la búsqueda los marque como huérfanos. Decisión explícita del usuario: hay un feature interactivo planeado para ellos en un spec futuro.

### Evaluación integral por archivo (simplificación de lógica)

Cada archivo del proyecto (no solo los grandes) pasa por una revisión de simplificación. La salida visual y de comportamiento sigue idéntica.

**Qué cuenta como simplificación (en scope):**
- Duplicación de lógica → factorizar a un helper o utilidad chiquita.
- Condicionales anidados / early-return faltante → aplanar con returns tempranos o destructuración.
- Selectores CSS repetidos / valores mágicos → mover a custom properties (`--var`) o clases utilitarias.
- Listas de strings/datos duros en el markup → extraer a un array tipado en el frontmatter. Prepara terreno para mover a `src/content/` en el spec de copy.
- Props / parámetros sin uso, variables muertas dentro del archivo → eliminar.
- Manejo manual de DOM que pelea con el ciclo de vida de Astro → corregir al patrón canónico (`is:inline` cuando aplique, listeners en `astro:page-load`).
- Nombres confusos → renombrar localmente, dentro del archivo o de su consumidor inmediato.

**Método por archivo:**
1. Leer entero.
2. Anotar: ¿se parte? ¿hay duplicación? ¿hay lógica que se puede aplanar? ¿props/imports muertos? ¿valores mágicos?
3. Ejecutar lo que entre en scope.
4. `npm run build` + verificación visual.
5. Commit atómico por archivo (o por bloque pequeño de archivos relacionados).

### Hallazgos esperados (pre-aprobados por categoría, decisión en ejecución)

1. **`output: 'server'` en `astro.config.mjs`** — Las 3 páginas son contenido estático. Si tras revisar el código no hay `Astro.request`, `cookies`, redirects dinámicos ni endpoints, cambiar a `output: 'static'`. Beneficio: cero invocaciones serverless en Vercel, build pre-renderizado. Si hay una razón de SSR genuina, queda en `'server'`.
2. **`functionPerRoute: false` y `middleware: true`** en el adapter de Vercel — si se pasa a `static`, gran parte de la config del adapter se vuelve irrelevante y se simplifica.
3. **9 archivos `.ttf` en `public/fonts/`** — alta probabilidad de que no todas se usen. Las no referenciadas se borran.
4. **SVGs (`circle.svg`, `cross.svg`, `question.svg`)** — verificar uso. Si son decorativos inline en algún componente, podrían moverse a `src/components/icons/` como `.astro` para mejor scoping. Decisión por archivo.
5. **OGG (`VIN.ogg`, `VINXD.ogg`)** — preservar siempre. Excluidos de la limpieza por decisión del usuario.
6. **Badge externo `visitcount.itsvg.in` en `README.md`** — third-party con implicaciones de privacidad. Se anota como follow-up de seguridad, no se ejecuta aquí.

Cada hallazgo concreto se decide en `writing-plans` / ejecución leyendo el archivo. Lo pre-aprobado aquí es la **categoría**, no una acción a ciegas.

### Orden y ritmo de ejecución

1. Setup React Islands primero (cambio chico, desbloquea convención).
2. Migración `.js` → `.ts` (autocontenido, sin riesgo visual).
3. Partición de componentes grandes en orden ascendente de complejidad esperada: `Footer.astro` → `Home.astro` → `Me.astro` → `Card.astro` → `GlobalStyles.astro`. Empezar por el más simple permite calibrar el patrón antes del más grande.
4. Evaluación integral de archivos medianos y chicos para simplificaciones.
5. Limpieza de assets huérfanos.
6. Evaluación de hallazgos (`output: 'server'` → `'static'`, fonts, SVGs).
7. Update de `CLAUDE.md` con la convención `.astro` vs `.tsx`.

Por cada paso: ejecutar, `npm run build`, verificación visual de las 3 páginas, commit atómico.

## Criterios de "listo" (todos deben pasar)

1. `npm run build` pasa limpio (sin errores ni warnings nuevos respecto al baseline actual).
2. `astro check` sin errores en los `.ts` migrados.
3. Inspección visual lado a lado de `/`, `/me`, `/contact` en `npm run preview` → idéntica antes/después.
4. Ningún archivo `.astro` en `src/components/` >250 LOC, salvo justificación escrita en el spec o en el commit que lo deja.
5. Cero archivos `.js` en `src/` (solo `.ts`, `.astro`).
6. `public/` contiene únicamente assets referenciados (OGG se quedan por decisión explícita).
7. Convención `.astro` vs `.tsx` documentada en `CLAUDE.md`.
8. Commits atómicos: cada uno deja la app funcionando; ninguno mezcla refactor estructural con simplificación de otro archivo.

## Riesgos

| Riesgo | Probabilidad | Mitigación |
|---|---|---|
| Romper una animación GSAP al partir un componente | Media | Las animaciones GSAP se preservan literalmente. Cualquier extracción de selectores se prueba en `dev` antes de commitear. Si una animación depende del padre, el split no procede para ese componente. |
| Romper estilos por CSS scoping al extraer markup | Alta | Por cada split: `npm run dev`, verificar visualmente las 3 páginas. Mover estilos junto con su markup. |
| Falsos positivos al detectar "código muerto" | Media | Antes de borrar: doble check con `grep`, incluyendo strings dinámicos. Si hay duda → no se borra, se lista como follow-up. |
| Cambio `output: 'server'` → `'static'` rompe algo no obvio | Baja-Media | Revisión sistemática de uso de `Astro.request`, cookies, redirects y endpoints antes del cambio. Si hay duda → no se cambia, se documenta. |
| Splits excesivos generan "fragmentitis" | Media | Criterio de partición exige los tres factores (>250 LOC + >1 sección distinguible + co-localizable). Componentes <100 LOC se dejan en paz. |
| Scope creep (la lente integral invita a tocar todo) | Alta | Contrato de preservación visual + lista de no-objetivos + cualquier cosa que no entre se documenta como follow-up. |

## Estimación

2-3 sesiones de implementación.

## Follow-ups conocidos (NO se ejecutan aquí)

- Auditoría de seguridad (CSP, headers HTTP, deps, badge externo del README) → spec dedicado.
- Re-redacción de copy y alineación con CV / mercado actual → spec dedicado.
- Features interactivos con los OGG (audio) → spec dedicado.
- Cualquier hallazgo "más grande" durante la ejecución (bugs funcionales, oportunidades UX) → se anexa al spec ejecutado como sección final "Findings para futuros specs".

## Lo que el spec NO promete

- Mejor performance medible (puede mejorar incidentalmente, pero no es objetivo).
- Mejor SEO (idem).
- Cambios en lo que el usuario ve.

## Decisiones de diseño cerradas

- **Stack:** Astro 5 + React Islands. No migración a SPA React.
- **Profundidad de refactor:** quirúrgico + evaluación integral por archivo para simplificación. No arquitectónico (sin tests E2E, sin capa de datos centralizada).
- **Contrato:** cambios obvios y de bajo riesgo entran al spec; cambios más grandes se listan como follow-up.
- **OGG:** se preservan siempre.
- **Tests automatizados:** no se introducen en este spec.
- **Hidratación por defecto:** `client:visible` cuando se cree una isla en el futuro.
