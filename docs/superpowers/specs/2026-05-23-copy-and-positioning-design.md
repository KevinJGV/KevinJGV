# Spec: Copy & Positioning — Portafolio KevinJGV

**Fecha:** 2026-05-23
**Estado:** Diseño aprobado, pendiente plan de implementación
**Spec previo:** `2026-05-22-security-hardening-design.md`
**Roadmap:** Foundation → Security → **Copy & Positioning** → Features OGG

## Resumen

Refinar la narrativa del portafolio para alinearla con la realidad profesional actual de Kevin (FullStack senior con experiencia de empresa, integrando IA aplicada en productos reales, saliendo de Clonai y disponible) sin convertirlo en una calca del CV. Resultado esperado: copy coherente con CV y trayectoria, sección de Casos reales en lugar de proyectos académicos, posicionamiento de IA honesto (aplicación, no construcción de frameworks), y README de Github sincronizado.

## Filosofía operativa

**Mostrar suficiente para que sepan quién eres, ocultar suficiente para que quieran preguntar.**

El CV vende "candidato apto para rol X" a un reclutador que escanea en 30 segundos. El portafolio vende **personalidad + capacidad + provocar contacto**. Si se igualan, el portafolio pierde su ventaja (versatilidad y filtro narrativo) y duplica esfuerzo sin sumar señal.

**Regla de quirks:** los guiños de personalidad ("Empanada Lover", "me siento un poco dios creando cosas", "Código Ninja", "¿Necesitas una mano? Yo tengo dos.", binario "I am god", "I have 4 nipples") NO son sacrificables al profesionalizar. Son señal cultural deliberada que filtra audiencia. Cuando un cambio quita un guiño, se reincorpora en versión refinada, no se elimina.

## Goals

1. **Corregir desactualizaciones** que contradicen la trayectoria real (ciberseguridad → IA aplicada; "training on Campuslands" en README → graduado y con experiencia).
2. **Reemplazar la sección Projects** por **Casos** con 3 cards de trabajos reales: Clonai (SaaS B2B + motor IA + liderazgo), Justicia Cercana (Shopify + IA), Refactor Vue→Astro.
3. **Refinar posicionamiento** en hero y secciones /me para señalar IA-aplicada + arquitectura + liderazgo, sin prometer skills no sostenibles (nada de "experto LangChain/LangGraph").
4. **Unificar email canónico** a `vin.devsito@gmail.com` (Contact form action, mailto del anchor, texto visible).
5. **Refinar sidebar carousel** quitando ironía Jr/Senior y añadiendo 3 señales pro.
6. **Limpieza ortográfica + 1 reemplazo en MeLikes/Hates** protegiendo personalidad (regla de quirks).
7. **Meta description SEO-friendly** manteniendo el binario "I am god" como comentario HTML.
8. **Sincronizar README de Github** con el posicionamiento del portafolio (bio, LinkedIn URL canónica, badges IA, link al portafolio en producción).

## Non-goals

- **Bilingüe ES/EN.** Spec independiente posterior. Este spec cierra ES refinado primero; bilingüe espejea sobre copy estable.
- **Sección de experiencia tipo timeline corporativo.** Eso es LinkedIn/CV. El portafolio no replica eso.
- **Cambios visuales o de animaciones.** Las cards de Casos reutilizan `Card.astro` sin tocarlo. Scope de Features OGG (siguiente spec).
- **Construir micro-demos en vivo (ej. chat con SDK Anthropic).** Scope de Features OGG.
- **Refactor de componentes** más allá de lo estrictamente necesario para que el copy nuevo encaje.
- **SEO técnico más allá de meta description** (no se tocan og:image, sitemap, robots, structured data, etc.).
- **Métricas corporate** ("aumenté X en Y%"). Rompe el tono del sitio.
- **Display visual de `company`, `role`, `period`** en las cards. Quedan en data como metadata semántica; mostrarlos es decisión de un spec futuro.

## Contract / preservación

- **Visual:** sin cambios. Las 3 cards de Casos reutilizan `Card.astro` exactamente igual.
- **Funcional:** sin cambios. Form, GSAP, view transitions, audio loop, cursor custom, todo igual.
- **Build:** `npm run build` sigue pasando 0/0/0.
- **Personalidad:** todos los quirks listados en la regla de quirks se conservan (algunos reubicados, ninguno eliminado).

Si algún cambio rompe alguno de los 4 puntos anteriores, se trata como regresión y debe revertirse o ajustarse el approach.

## Arquitectura de cambios

Cuatro buckets atómicos. Cada bucket es independiente (1-N commits relacionados) para facilitar revert quirúrgico.

### Bucket A — Periferia

Cambios triviales, sin riesgo de regresión visual.

**A.1 — Sidebar carousel** (`src/components/SideComponentMain.astro`)

Items actuales (9): `Software Developer`, `Dev in dev`, `Pizza Time`, `FullStack`, `Frontend`, `Backend`, `Clearly Senior`, `I mean, Jr`, `Gamer`.

Quitar: `Clearly Senior`, `I mean, Jr`.
Añadir: `AI-pilled`, `Implementation Lead`, `Architecture-pilled`.

Items finales (10): `Software Developer`, `Dev in dev`, `Pizza Time`, `FullStack`, `Frontend`, `Backend`, `AI-pilled`, `Implementation Lead`, `Architecture-pilled`, `Gamer`.

**A.2 — MeLikes/Hates ortografía + 1 reemplazo** (`src/components/me/MeLikes.astro`)

Loves (correcciones ortográficas):
- `Produccion de contenidos audiovisuales` → `Producción de contenidos audiovisuales`
- `Cocinar (Sí me anímo)` → `Cocinar (si me animo)` (tilde mal puesta)
- `Solitud (Staying-at-home)` → `Soledad (Staying-at-home)` (Solitud no es palabra estándar)
- `Climas frios` → `Climas fríos`

Hates (correcciones + 1 reemplazo):
- `Cafe puro` → `Café puro`
- `Falta de empatia` → `Falta de empatía`
- `Simps (Personas sin valor)` → `Gente sin criterio propio`
- Resto intacto (incluyendo `Gente superautoritaria` y `Gente que no soporta mi sentido del humor` — preferencias legítimas, sin etiqueta deshumanizante).

**A.3 — Meta description** (`src/layouts/Layout.astro`)

Reemplazar el `<meta name="description">` binario por uno SEO-friendly, conservando el binario como comentario HTML adyacente:

```html
<!-- easter egg histórico (binario "I am god"): 01001001 00100000 01100001 01101101 00100000 01100111 01101111 01100100 -->
<meta name="description" content="Kevin González — FullStack Developer colombiano. Construyo SaaS, integro IA en productos reales y lidero equipos de implementación. Bucaramanga, Colombia." />
```

**A.4 — Contact.astro email canónico** (`src/components/Contact.astro`)

3 cambios para unificar a `vin.devsito@gmail.com`:

- Línea 11 (form action): `https://formsubmit.co/vin-dev@outlook.com` → `https://formsubmit.co/vin.devsito@gmail.com`
- Línea 62 (mailto href): `mailto:noseasapo@sapo.com?subject=¡Hola%20Kevin!%20Estoy%20interesad@%20en%20comunicarme%20contigo.` → `mailto:vin.devsito@gmail.com?subject=¡Hola%20Kevin!%20Estoy%20interesad@%20en%20comunicarme%20contigo.`
- Línea 63 (texto visible): `vin-dev@outlook.com` → `vin.devsito@gmail.com`

El easter egg "noseasapo@sapo.com" se elimina porque rompía funcionalidad real (clic = email inexistente).

### Bucket B — Cuerpo narrativo

Copy reescrito de hero + 3 secciones de /me. Solo strings, cero riesgo de build.

**B.1 — HomeHero body** (`src/components/home/HomeHero.astro`)

Reemplazar el body actual por:

> Construyo sistemas que combinan back-end sólido, front-end cuidado e integración de LLMs en productos reales. He co-creado un SaaS desde MVP, liderado equipos de implementación y migrado plataformas enteras a stacks más mantenibles. Me obsesiona la arquitectura limpia — alta cohesión, bajo acoplamiento — y traducir requerimientos confusos a decisiones técnicas claras. ¿Por qué hago esto? Porque cuando todo encaja me siento un poco dios creando cosas, definiendo sus atributos y comportamientos. Cuando no estoy desarrollando, probablemente estoy pensando en el futuro o siendo el consejero de mis amigos.

No se tocan: títulos del hero ("Hola, Soy Kevin / Fullstack Software Developer & Empanada Lover / Activo Desde SEP '23 / HABLEMOS").

**B.2 — MeAbout** (`src/components/me/MeAbout.astro`)

Reemplazar el body por:

> Mi nombre completo es Kevin Johan González Velandia. Soy un desarrollador FullStack colombiano, con foco en arquitecturas escalables e integración de IA donde realmente suma valor — no por moda. Doy forma a marcas y productos digitales, fascinado por la intersección de la creatividad y la lógica. A pesar de la apariencia de mi webpage, soy un amante de la simplicidad, el minimalismo y la complejidad de las relaciones interpersonales. Me encanta colaborar en proyectos exigentes con gente talentosa — y soy de los que creen que un equipo funciona mejor cuando el nuevo puede tener una charla absurda con el administrador sin que eso reste profesionalismo. ¿Necesitas una mano? Yo tengo dos.

Título "¿Sobre mí?" sin cambios.

**B.3 — MeWhatIDo** (`src/components/me/MeWhatIDo.astro`)

Reemplazar el body por:

> Diseño y construyo software que tiene que funcionar el lunes en producción, no solo en una demo de viernes. Prefiero entender el problema dos veces antes que reescribir la solución tres. Optimizo procesos antes que reinventarlos: si la rueda existe, funciona y es confiable, la uso. Sumo valor con colaboración, comunicación honesta y la disciplina de terminar lo que empiezo — sin convertirme en robot ni esperar que los demás lo sean. Dame un teclado, un ratón, tiempo y música clásica sin anuncios — lo demás lo resolvemos.

Título "¿Qué hago?" sin cambios.

**B.4 — MeWhereImGoing** (`src/components/me/MeWhereImGoing.astro`)

Quote (corregir tilde):
> Con mi trabajo, sin temor a ello y nada más que eso, destilar mi valor y éxito profesional sin importar la empresa.

Body:
> Personalmente, aquel sujeto al que recurres ante un gridlock — el que ya pasó por suficientes incendios para saber por dónde empezar, capaz de escribir Código Ninja a su conveniencia. Profesionalmente, construyendo o co-construyendo productos que importen: con la experiencia técnica, el criterio de arquitectura y la cabeza de líder para que las cosas lleguen al usuario y sigan en pie seis meses después. Y, en algún momento, el CEO de uno o varios de esos productos.

Título "¿A donde voy?" sin cambios (mantener falta de tilde si así está hoy — es estilo).

### Bucket C — Casos

Reemplazo estructural de la sección Projects. Renombrado de archivos + tipos + data + tags + header + navbar.

**C.1 — Renombrado** (`src/data/projects.ts` → `src/data/cases.ts`)

- Mover archivo: `src/data/projects.ts` → `src/data/cases.ts`.
- Rename `interface Project` → `interface Case`.
- Rename `export const projects` → `export const cases`.
- Actualizar todos los importadores. Verificación: `grep -rn "from.*data/projects" src/` y `grep -rn "projects.ts" src/` deben quedar vacíos.

**C.2 — Tipo `Case` extendido**

```ts
export interface Case {
  // Existente
  text: string;              // título corto, p.ej. "SaaS B2B desde MVP — motor de agentes IA + liderazgo de implementación"
  href: string;              // URL pública o mailto: con asunto pre-rellenado
  cover: string;             // SVG inline (color sólido + texto grande estilo Farm Database)
  bgColor: string;
  txtColor?: string;
  hrefImages?: string[];     // capturas opcionales (no usadas en este spec)
  tags: Record<string, string>;

  // Nuevo (data-only — NO se muestra en Card.astro en este spec)
  company: string;           // "Clonai" / "Campuslands"
  role: string;              // "FullStack Developer / Líder Implementador"
  period: string;            // "02/2025 – 05/2026"
}
```

**C.3 — Data nueva** (3 entries en `src/data/cases.ts`)

Entry 1 — Clonai:
- `text`: "SaaS B2B desde MVP — motor de agentes IA + liderazgo de implementación"
- `company`: "Clonai"
- `role`: "FullStack Developer / Líder Implementador"
- `period`: "02/2025 – 05/2026"
- `href`: "https://www.linkedin.com/company/clonaico/posts/?feedView=all"
- `cover`: SVG inline con texto "CLONAI" o glifo equivalente (decisión visual en implementación; paleta sugerida abajo)
- `bgColor` / `txtColor`: paleta sugerida — fondo oscuro (`#0a1929` o similar) + texto blanco (alto contraste, tono profesional)
- `tags`: `{ template: "saas", template1: "ai-applied", template2: "leadership", template3: "architecture" }`

Entry 2 — Justicia Cercana (Campuslands):
- `text`: "Integración Shopify + IA para generación automatizada de documentos legales"
- `company`: "Campuslands"
- `role`: "FullStack Developer"
- `period`: "10/2023 – 02/2025"
- `href`: "https://www.justiciacercana.co/"
- `cover`: SVG inline con texto "JUSTICIA CERCANA" o glifo equivalente
- `bgColor` / `txtColor`: paleta sugerida — verde institucional (`#1d4e3f` o tono jurídico) + texto blanco
- `tags`: `{ template: "e-commerce", template1: "automation", template2: "ai-applied" }`

Entry 3 — Refactor Vue→Astro (Campuslands):
- `text`: "Migración Vue + JavaScript → Astro + TypeScript en plataforma productiva"
- `company`: "Campuslands"
- `role`: "FullStack Developer"
- `period`: "10/2023 – 02/2025"
- `href`: `mailto:vin.devsito@gmail.com?subject=Cu%C3%A9ntame%20m%C3%A1s%20sobre%20la%20migraci%C3%B3n%20Vue%E2%86%92Astro`
- `cover`: SVG inline con glifo "V→A" o "ASTRO" en grande
- `bgColor` / `txtColor`: paleta sugerida — naranja Astro (`#FF5D01`) o púrpura técnico, texto blanco
- `tags`: `{ template: "refactor", template1: "typescript", template2: "architecture" }`

**Eliminar el archivo `src/data/projects.ts`** después de mover su contenido reescrito a `cases.ts`.

**C.4 — Tags** (`src/data/tag-configs.ts`)

Añadir (6 entradas nuevas):
- `saas`: `{ label: "SaaS", bgColor: "#0f4c5c", txtColor: "#fff" }`
- `ai-applied`: `{ label: "IA aplicada", bgColor: "#5e4ae3", txtColor: "#fff" }`
- `architecture`: `{ label: "Arquitectura", bgColor: "#2b2d42", txtColor: "#fff" }`
- `automation`: `{ label: "Automatización", bgColor: "#e07a5f", txtColor: "#000" }`
- `refactor`: `{ label: "Refactor", bgColor: "#3d5a80", txtColor: "#fff" }`
- `typescript`: `{ label: "TypeScript", bgColor: "#3178c6", txtColor: "#fff" }`

(Las paletas son sugerencias coherentes con los colores existentes; el implementador puede ajustar dentro del mismo rango cromático.)

Conservar (siguen usándose):
- `e-commerce`
- `leadership`

Eliminar (huérfanos tras el cambio): `technology`, `frontend`, `uiux`, `entertainment`, `api`, `manager`, `dashboard`, `modeling`, `business`, `mysql`, `db`.

Verificación antes de eliminar: `grep -rn "\"technology\"\|\"frontend\"\|\"uiux\"\|\"entertainment\"\|\"api\"\|\"manager\"\|\"dashboard\"\|\"modeling\"\|\"business\"\|\"mysql\"\|\"db\"" src/` debe devolver 0 referencias (excepto el propio archivo `tag-configs.ts` que estamos editando).

**C.5 — Header de sección + link "Más"** (`src/components/home/HomeProjects.astro`)

- `h2`: `(Short) PREVIEW` → `(Real) CASOS` (mismo patrón visual: "Real" oculto, visible en hover).
- Blockquote link actual: `Más ` → GitHub repos → cambiar a `Más en LinkedIn ` → `https://www.linkedin.com/in/vin`.
- Actualizar import: `import { projects } from "../../data/projects"` → `import { cases } from "../../data/cases"`. Actualizar la variable referenciada en el `.map(...)` correspondientemente.

**C.6 — Navbar** (`src/components/Navbar.astro`)

Cambiar "Proyectos" → "Casos" en los 3 menús (Home, Me, Contact). Si hay anchors o IDs ligados (ej. `#projects`), evaluar si renombrar también el ID a `#cases` (decisión en implementación según cómo esté hoy el markup; preferir cambio mínimo).

### Bucket D — README de Github

Cambios independientes del build de Astro. Pueden hacerse en cualquier momento, pero recomendado **al final** porque linkea a `vindevsito.dev` (debe estar viva pre-deploy del README).

**D.1 — LinkedIn badge URL canónica** (`README.md` línea 5)

`https://www.linkedin.com/in/kejogodev/` → `https://www.linkedin.com/in/vin`

**D.2 — Descomentar Página Web** (`README.md` línea 7)

Quitar el `<!-- ... -->` y poner la URL real:
```html
[![](https://img.shields.io/badge/Página_Web-yelow?style=for-the-badge&logo=icloud&logoColor=white)](https://www.vindevsito.dev/)
```

**D.3 — Reescribir párrafo de posicionamiento** (`README.md` línea 19)

`Excited and interested in everything I realize I have yet to learn. Mostly strong in Backend with good Frontend skills.`
→
`Excited and interested in everything I realize I have yet to learn. Solid across the FullStack with a soft spot for architecture and AI integration.`

**D.4 — Reescribir bloque biográfico** (`README.md` línea 22)

```
👂 My full name is _Kevin Johan González Velandia_<br>
🔭 Wrapping up my FullStack Developer / Implementation Lead role at [Clonai](https://www.linkedin.com/company/clonaico/)<br>
👯 I'm looking to collaborate on product-focused projects, especially anything mixing SaaS + AI integration<br>
🌱 I'm currently learning agentic patterns, advanced TypeScript, and team leadership<br>
📫 Contact me ➜ [vin.devsito@gmail.com](mailto:vin.devsito@gmail.com)<br>
💬 Ask me about places to visit in my city<br>
❤️ I love videogames | learn spiritual things/knowledge<br>
⚡ Fun fact: I believe i have 4 nipples 🫣🌰
```

Cambios respecto al actual:
- `🔭 I'm currently training on [🧑‍🚀Campuslands]` → `🔭 Wrapping up my FullStack Developer / Implementation Lead role at [Clonai]`
- `👯 I'm looking to collaborate on backend related projects` → `👯 I'm looking to collaborate on product-focused projects, especially anything mixing SaaS + AI integration`
- `🌱 I'm currently learning Java | PostgreSQL | SpringBoot | Soft Skills` → `🌱 I'm currently learning agentic patterns, advanced TypeScript, and team leadership`
- `📫 Contact me ➜ vin-dev@outlook.com` → `📫 Contact me ➜ vin.devsito@gmail.com`
- Comentarios HTML `<!-- All of my projects ... -->` se mantienen como están (decisión: pueden descomentarse o no — no relevante para este spec).
- Preservados intactos: nombre completo, "places to visit in my city", videogames, "I have 4 nipples".

**D.5 — Añadir badges Anthropic + OpenAI al Tech Stack** (`README.md` línea 29)

Añadir al final del bloque existente de badges (antes del cierre del párrafo):
```
![Anthropic](https://img.shields.io/badge/Anthropic-d97757?style=flat&logo=anthropic&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
```

Verificar pre-commit que los slugs `anthropic` y `openai` resuelven en simpleicons; si alguno no renderiza, quitar `logo=` para fallback de badge sin logo.

## Orden de ejecución recomendado

```
1. Bucket D (README)            ← fuera del build, ortogonal, cero riesgo
2. Bucket A (Periferia)         ← correcciones triviales, calientan motores
3. Bucket C (Casos)             ← el más estructural (rename + tipos + tags huérfanos)
4. Bucket B (Cuerpo narrativo)  ← solo strings, más afino de tono en revisión visual
```

Los buckets son independientes: cualquier orden funciona. La recomendación prioriza ortogonalidad y deja el bucket de copy del cuerpo al final para permitir micro-ajustes durante revisión visual.

## Riesgos y mitigaciones

**R1 — Renombrado `projects.ts → cases.ts` rompe imports.**
- Mitigación: tras mover y editar, ejecutar `grep -rn "from.*data/projects" src/` y `grep -rn "from.*projects\"" src/`. Deben quedar vacíos. `astro check` debe pasar.
- Fallback: si un import quedó suelto, error de build lo señala — ajustar y volver a build.

**R2 — Eliminar tags huérfanos rompe runtime si quedan referencias.**
- Mitigación: antes de eliminar, grep por cada key (`technology`, `frontend`, `uiux`, etc.) confirmando 0 referencias en `src/` fuera del propio `tag-configs.ts`.
- Fallback: si una referencia quedó, restaurar el tag o actualizar la referencia.

**R3 — Tono nuevo no encaja visualmente (longitudes distintas).**
- Mitigación: `npm run dev` y revisión visual de cada sección reescrita. Si una sección queda significativamente más larga o corta y rompe spacing, ajustar el texto o aceptar el desfase como cambio menor.
- Fallback: documentar como finding para un ajuste de spacing en Features OGG.

**R4 — Form action cambia destino → formsubmit.co exige confirmación.**
- Mitigación: documentado explícitamente en este spec. Post-deploy, el primer envío del form dispara un email de activación a `vin.devsito@gmail.com` que debe clicarse. Hasta entonces el form no entrega.
- Acción del usuario: revisar inbox de `vin.devsito@gmail.com` tras primer envío de prueba y clicar el link de confirmación.

**R5 — Anchors / scroll-to-section ligados a "Proyectos".**
- Mitigación: revisar si el navbar usa IDs (`#projects` u otro) y si renombrar el texto rompe la navegación interna. Si los IDs son internos al markup, el rename de texto no los afecta; si hay hash routing, sincronizar `#projects` → `#casos`.

**R6 — README linkea a `vindevsito.dev` antes de que el portafolio esté ahí.**
- Mitigación: confirmar pre-merge que `https://www.vindevsito.dev/` resuelve (HTTP 200 o redirect a producción).
- Fallback: mergear el commit de README al final, después del deploy del portafolio.

**R7 — Badges Anthropic/OpenAI con slug distinto en simpleicons.**
- Mitigación: previsualizar la URL del badge en un navegador antes de commitear.
- Fallback: quitar `logo=` para badge solo con texto y color de marca.

## Criterios de aceptación

**Automáticamente verificables (grep + build):**

1. `npm run build` pasa con 0 errores, 0 warnings, 0 hints.
2. `grep -rn "ciberseguridad" src/` no devuelve nada.
3. `grep -rn "Código Ninja" src/` devuelve exactamente 1 línea (en `MeWhereImGoing.astro`).
4. `grep -rn "vin-dev@outlook.com\|noseasapo@sapo.com" src/` no devuelve nada.
5. `grep -rn "vin.devsito@gmail.com" src/` devuelve ≥ 2 líneas (form action + mailto del anchor; el texto visible cuenta también).
6. `src/data/projects.ts` no existe; `src/data/cases.ts` existe.
7. `grep -rn "from.*data/projects" src/` no devuelve nada.
8. `grep -rn "Clearly Senior\|I mean, Jr" src/` no devuelve nada.
9. `grep -n "training on Campuslands\|backend related projects" README.md` no devuelve nada.
10. `grep -n "vindevsito.dev" README.md` devuelve ≥ 1 línea.
11. `grep -n "linkedin.com/in/vin\"" README.md` devuelve ≥ 1 línea (LinkedIn URL canónica).
12. `grep -n "Anthropic\|OpenAI" README.md` devuelve líneas para ambos.

**Verificables visualmente (usuario en `npm run preview` y post-deploy):**

13. Home hero: copy refleja IA aplicada + arquitectura + SaaS, conserva "me siento un poco dios creando cosas".
14. /me: las 3 secciones reescritas. Sin ciberseguridad. Con "Código Ninja" en WhereImGoing. Con la frase de filosofía de equipo ("el nuevo puede tener una charla absurda con el administrador...") en About.
15. Home: sección "(Real) CASOS" muestra 3 cards (Clonai → LinkedIn empresa, Justicia Cercana → URL real, Refactor → mailto). Link "Más en LinkedIn" abajo abre `linkedin.com/in/vin`.
16. Navbar muestra "Casos" en los 3 menús.
17. Sidebar carousel rota los 10 items finales incluyendo AI-pilled / Implementation Lead / Architecture-pilled. No aparece Jr/Senior.
18. MeLikes: ortografía limpia. "Gente sin criterio propio" presente en hates. "Simps" ausente.
19. Contact: clic en email anchor abre mailto válido a `vin.devsito@gmail.com` con asunto pre-rellenado. Form action apunta al canónico.
20. View-source de cualquier página: meta description es la SEO-friendly; binario presente como comentario HTML.

**Post-deploy real:**

21. Form de contacto entrega a `vin.devsito@gmail.com` tras confirmación inicial de formsubmit.co.
22. README en Github renderiza con bio actualizada, badges Anthropic+OpenAI, link Página Web funcional a vindevsito.dev.
23. Share del portafolio en Slack/LinkedIn muestra preview con la nueva meta description.

## Follow-ups esperados (para spec futuro)

- **Bilingüe ES/EN** (i18n nativo de Astro 6 + switcher). Espejar copy estable de este spec al inglés.
- **Features OGG** (siguiente del roadmap): micro-experimentos en vivo dentro del portafolio (ej. "Pregúntale a mi CV" con Anthropic SDK directo), display visual de `company/role/period` en cards de Casos si se quiere, ajustes de spacing si el copy nuevo desencajó algún layout.
- **Migración de `formsubmit.co` a endpoint propio** (heredado del spec Security): convertir form a serverless function o backend dedicado, eliminar `form-action 'self' https://formsubmit.co` del CSP en `vercel.json`.
- **Astro 6 native CSP migration** (heredado de findings del spec Security): usar `security.csp: true` + `@astrojs/vercel` `staticHeaders: true` para recuperar A+ sin `'unsafe-inline'`.
