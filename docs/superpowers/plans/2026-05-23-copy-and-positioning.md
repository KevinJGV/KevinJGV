# Copy & Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refinar la narrativa del portafolio Astro 6 para alinearla con la realidad profesional actual de Kevin (FullStack senior, IA aplicada, Implementation Lead saliendo de Clonai), reemplazar proyectos académicos por casos reales, unificar email canónico, y sincronizar README de Github — sin convertirlo en una calca del CV y protegiendo todos los quirks de personalidad.

**Architecture:** 4 buckets atómicos. Cada tarea es un commit, build verificado, revert quirúrgico. Sin cambios visuales/animaciones: Card.astro y todos los componentes visuales se reutilizan. Cero refactor de lógica. Solo data + strings + nuevos tags.

**Tech Stack:** Astro 6 (estático), TypeScript, GSAP (no se toca), @astrojs/vercel v10, deploy en Vercel.

**Spec:** `docs/superpowers/specs/2026-05-23-copy-and-positioning-design.md`

**Orden de buckets:** D (README) → A (Periferia) → C (Casos) → B (Cuerpo narrativo)

---

## Task 0: Branch setup + baseline

**Files:**
- None (git ops)

- [ ] **Step 1: Crear branch desde main actualizado**

```bash
git checkout main
git pull --ff-only
git checkout -b copy-and-positioning
```

- [ ] **Step 2: Verificar baseline limpio**

Run: `npm run build 2>&1 | tail -10`
Expected:
```
✓ 0 errors
✓ 0 warnings
✓ 0 hints
[build] Complete!
```

Si falla: STOP. El baseline debe estar limpio antes de empezar. Investigar y corregir.

- [ ] **Step 3: Snapshot del estado pre-cambios**

Run:
```bash
echo "=== files que tocaremos ==="
wc -l src/components/SideComponentMain.astro src/components/me/MeLikes.astro src/layouts/Layout.astro src/components/Contact.astro src/data/projects.ts src/data/tag-configs.ts src/components/home/HomeProjects.astro src/components/home/HomeHero.astro src/components/me/MeAbout.astro src/components/me/MeWhatIDo.astro src/components/me/MeWhereImGoing.astro README.md src/pages/index.astro src/pages/me.astro src/pages/contact.astro
```
Expected: que todos existan (sin "No such file"). Anota mentalmente el total de líneas para comparar al final.

---

## Task D.1: README — LinkedIn URL canónica

**Files:**
- Modify: `README.md:5`

- [ ] **Step 1: Aplicar el cambio de URL**

Reemplazar `https://www.linkedin.com/in/kejogodev/` por `https://www.linkedin.com/in/vin-dev` en la línea 5 (badge de LinkedIn).

- [ ] **Step 2: Verificar el cambio con grep**

Run: `grep -n "linkedin.com/in/" README.md`
Expected: 1 línea, conteniendo `https://www.linkedin.com/in/vin-dev`

Run: `grep -n "kejogodev" README.md`
Expected: vacío.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): canonicalize LinkedIn URL to /in/vin-dev

Aligns README badge with the LinkedIn URL referenced across the
portfolio's Casos section (HomeProjects 'Más en LinkedIn' link).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task D.2: README — Descomentar badge "Página Web"

**Files:**
- Modify: `README.md:7`

- [ ] **Step 1: Aplicar el cambio**

Línea 7 actual:
```html
  <!-- [![](https://img.shields.io/badge/Página_Web-yelow?style=for-the-badge&logo=icloud&logoColor=white)](https://www.vin-dev.tech/) -->
```

Reemplazar por (sin comentario HTML, con URL real):
```html
  [![](https://img.shields.io/badge/Página_Web-yelow?style=for-the-badge&logo=icloud&logoColor=white)](https://www.vindevsito.dev/)
```

- [ ] **Step 2: Verificar el cambio**

Run: `grep -n "vindevsito.dev" README.md`
Expected: 1 línea con la URL nueva.

Run: `grep -n "vin-dev.tech" README.md`
Expected: vacío.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): uncomment Página Web badge pointing to vindevsito.dev

The badge was commented out historically. Now the portfolio is live at
vindevsito.dev, so expose the link in the README.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task D.3: README — Párrafo de posicionamiento

**Files:**
- Modify: `README.md:19`

- [ ] **Step 1: Aplicar el cambio**

Reemplazar el contenido de la línea 19:
```
Excited and interested in everything I realize I have yet to learn. Mostly strong in Backend with good Frontend skills.<br><br>
```

Por:
```
Excited and interested in everything I realize I have yet to learn. Solid across the FullStack with a soft spot for architecture and AI integration.<br><br>
```

- [ ] **Step 2: Verificar el cambio**

Run: `grep -n "Mostly strong in Backend" README.md`
Expected: vacío.

Run: `grep -n "Solid across the FullStack" README.md`
Expected: 1 línea.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): reposition tagline to FullStack + AI integration

Reflects current professional reality (FullStack senior with experience
integrating IA in real products) instead of backend-leaning framing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task D.4: README — Bloque biográfico actualizado

**Files:**
- Modify: `README.md:22`

- [ ] **Step 1: Aplicar el cambio**

Reemplazar la línea 22 entera (es una sola línea con `<br>` separadores). El contenido actual es:
```
👂 My full name is _Kevin Johan González Velandia_<br>🔭 I'm currently training on [🧑‍🚀Campuslands](https://www.linkedin.com/company/campuslands/)<br>👯 I'm looking to collaborate on backend related projects<br>🌱 I'm currently learning Java | PostgreSQL | SpringBoot | Soft Skills<br>📫 Contact me ➜ [vin-dev@outlook.com](mailto:vin-dev@outlook.com)<!-- <br>👨‍💻 All of my projects are available at [my portfolio](https://www.vin-dev.tech/) --> <br>💬 Ask me about places to visit in my city<br>❤️ I love videogames | learn spiritual things/knowledge<br>⚡ Fun fact: I believe i have 4 nipples 🫣🌰
```

Reemplazar por:
```
👂 My full name is _Kevin Johan González Velandia_<br>🔭 Wrapping up my FullStack Developer / Implementation Lead role at [Clonai](https://www.linkedin.com/company/clonaico/)<br>👯 I'm looking to collaborate on product-focused projects, especially anything mixing SaaS + AI integration<br>🌱 I'm currently learning agentic patterns, advanced TypeScript, and team leadership<br>📫 Contact me ➜ [vin.devsito@gmail.com](mailto:vin.devsito@gmail.com)<!-- <br>👨‍💻 All of my projects are available at [my portfolio](https://www.vindevsito.dev/) --> <br>💬 Ask me about places to visit in my city<br>❤️ I love videogames | learn spiritual things/knowledge<br>⚡ Fun fact: I believe i have 4 nipples 🫣🌰
```

Quirks preservados intactos: nombre completo, "places to visit in my city", "videogames", "4 nipples". El comentario sobre portfolio se mantiene pero apuntando a `vindevsito.dev` (sin descomentar — decisión: ya hay un badge de Página Web visible desde Task D.2, no duplicar).

- [ ] **Step 2: Verificar los cambios**

Run: `grep -n "training on Campuslands\|backend related projects\|Java | PostgreSQL\|vin-dev@outlook" README.md`
Expected: vacío.

Run: `grep -n "Wrapping up my FullStack\|SaaS + AI integration\|agentic patterns\|vin.devsito@gmail.com" README.md`
Expected: las 4 cadenas presentes (4 líneas o todas en la misma línea 22).

Run: `grep -n "4 nipples" README.md`
Expected: 1 línea con el dato preservado (quirk innegociable).

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): update bio block to current role and learning focus

- Current role: Clonai FullStack Developer / Implementation Lead
- Collaboration focus: product + SaaS + AI integration
- Learning: agentic patterns, advanced TypeScript, team leadership
- Email canonical: vin.devsito@gmail.com
- Portfolio link in HTML comment now points to vindevsito.dev

Quirks preserved: full name, places to visit, videogames, 4 nipples.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task D.5: README — Badges Anthropic + OpenAI

**Files:**
- Modify: `README.md:29`

- [ ] **Step 1: Aplicar el cambio**

Línea 29 (Tech Stack) — añadir al final de la cadena de badges, antes del cierre del párrafo. El final actual incluye `... ![Astro](...) ![TypeScript](...)`. Concatenar los dos badges nuevos al final:

Localizar el segmento final actual:
```
![Astro](https://img.shields.io/badge/Astro-23262f?style=flat&logo=Astro) ![TypeScript](https://img.shields.io/badge/TypeScript-23262f?style=flat&logo=TypeScript&color=white)
```

Reemplazar por:
```
![Astro](https://img.shields.io/badge/Astro-23262f?style=flat&logo=Astro) ![TypeScript](https://img.shields.io/badge/TypeScript-23262f?style=flat&logo=TypeScript&color=white) ![Anthropic](https://img.shields.io/badge/Anthropic-d97757?style=flat&logo=anthropic&logoColor=white) ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
```

- [ ] **Step 2: Verificar el cambio + previsualizar badges en navegador**

Run: `grep -c "Anthropic\|OpenAI" README.md`
Expected: ≥ 2 (uno por cada badge).

Manualmente: copiar las URLs `https://img.shields.io/badge/Anthropic-d97757?style=flat&logo=anthropic&logoColor=white` y `https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white` y abrirlas en navegador. Confirmar que renderizan con su logo. Si alguno no renderiza el logo (slug no existe en simpleicons), editar y quitar `&logo=...&logoColor=white` para fallback de badge sin logo.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "$(cat <<'EOF'
docs(readme): add Anthropic + OpenAI badges to Tech Stack

Signals AI applied (SDK integration) consistent with the portfolio's
new positioning. No LangChain/LangGraph claim — applied integration,
not framework construction.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A.1: Sidebar carousel — quitar Jr/Senior, añadir señales pro

**Files:**
- Modify: `src/components/SideComponentMain.astro:8-18`

- [ ] **Step 1: Reemplazar el array `nouns`**

Localizar las líneas 8-18:
```ts
    const nouns = [
        "Software Developer",
        "Dev in dev",
        "Pizza Time",
        '"FullStack"',
        "Frontend",
        "Backend",
        "Clearly Senior",
        "I mean, Jr",
        "Gamer"
    ];
```

Reemplazar por:
```ts
    const nouns = [
        "Software Developer",
        "Dev in dev",
        "Pizza Time",
        '"FullStack"',
        "Frontend",
        "Backend",
        "AI-pilled",
        "Implementation Lead",
        "Architecture-pilled",
        "Gamer"
    ];
```

(Se quitan `Clearly Senior` y `I mean, Jr`; se añaden `AI-pilled`, `Implementation Lead`, `Architecture-pilled`. El array pasa de 9 a 10 items.)

- [ ] **Step 2: Verificar**

Run: `grep -n "Clearly Senior\|I mean, Jr" src/components/SideComponentMain.astro`
Expected: vacío.

Run: `grep -n "AI-pilled\|Implementation Lead\|Architecture-pilled" src/components/SideComponentMain.astro`
Expected: 3 líneas (una por item nuevo).

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0 errors / 0 warnings / 0 hints.

- [ ] **Step 4: Commit**

```bash
git add src/components/SideComponentMain.astro
git commit -m "$(cat <<'EOF'
feat(sidebar): refine carousel — drop Jr/Senior irony, add pro signals

Replaces 'Clearly Senior' / 'I mean, Jr' with 'AI-pilled',
'Implementation Lead', 'Architecture-pilled' to align with current
positioning while keeping the meme-tone consistent with the rest of
the items (Dev in dev, Pizza Time, Gamer).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A.2: MeLikes — ortografía + reemplazar Simps

**Files:**
- Modify: `src/components/me/MeLikes.astro:2-27`

- [ ] **Step 1: Reemplazar los dos arrays `loves` y `hates`**

Localizar líneas 2-27 (los dos arrays en frontmatter). Reemplazar por:

```ts
const loves: Array<{ text: string; note?: string }> = [
  { text: "Color negro" },
  { text: "Producción de contenidos audiovisuales" },
  { text: "Animaciones" },
  { text: "Videojuegos" },
  { text: "Mi moto", note: "(Enduros)" },
  { text: "Admirar personas" },
  { text: "Aconsejar" },
  { text: "Gatos" },
  { text: "Cocinar", note: "(si me animo)" },
  { text: "Soledad", note: "(Staying-at-home)" },
  { text: "Climas fríos" },
  { text: "Trabajar en equipo", note: "(Y el co-working)" },
  { text: "Conocer nuevos sitios" },
];

const hates: Array<{ text: string; note?: string }> = [
  { text: "Resultados incompletos" },
  { text: "Quedarme sin dinero" },
  { text: "Climas muy calientes" },
  { text: "Gente sin criterio propio" },
  { text: "Gente que no soporta mi sentido del humor" },
  { text: "Café puro" },
  { text: "Falta de empatía" },
  { text: "Gente superautoritaria" },
];
```

Cambios respecto al original:
- `Produccion` → `Producción`
- `(Sí me anímo)` → `(si me animo)`
- `Solitud` → `Soledad`
- `Climas frios` → `Climas fríos`
- `Simps` con nota `(Personas sin valor)` → `Gente sin criterio propio` (sin nota)
- `Cafe puro` → `Café puro`
- `Falta de empatia` → `Falta de empatía`

- [ ] **Step 2: Verificar**

Run: `grep -n "Simps\|Produccion\|Solitud\|Cafe puro\|empatia\b\|Climas frios\|anímo" src/components/me/MeLikes.astro`
Expected: vacío.

Run: `grep -n "Producción\|Soledad\|Climas fríos\|Gente sin criterio propio\|Café puro\|empatía" src/components/me/MeLikes.astro`
Expected: 6 líneas (una por cada string corregido).

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 4: Commit**

```bash
git add src/components/me/MeLikes.astro
git commit -m "$(cat <<'EOF'
feat(me): MeLikes — orthography fixes + replace Simps slur

Loves: Producción, Soledad, Climas fríos, '(si me animo)' (tilde fix).
Hates: Café, empatía, replace 'Simps (Personas sin valor)' with
'Gente sin criterio propio' — same intent, no dehumanizing label.

Preserved intentionally: 'Gente superautoritaria', 'Gente que no
soporta mi sentido del humor' — legitimate filters, no edits needed.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A.3: Meta description SEO-friendly + binario en comentario

**Files:**
- Modify: `src/layouts/Layout.astro:23`

- [ ] **Step 1: Reemplazar la línea 23**

Localizar la línea 23 actual:
```html
    <meta name="description" content="01001001 00100000 01100001 01101101 00100000 01100111 01101111 01100100" />
```

Reemplazar por:
```html
    <!-- easter egg histórico (binario "I am god"): 01001001 00100000 01100001 01101101 00100000 01100111 01101111 01100100 -->
    <meta name="description" content="Kevin González — FullStack Developer colombiano. Construyo SaaS, integro IA en productos reales y lidero equipos de implementación. Bucaramanga, Colombia." />
```

- [ ] **Step 2: Verificar**

Run: `grep -n "Kevin González — FullStack Developer colombiano" src/layouts/Layout.astro`
Expected: 1 línea.

Run: `grep -n "easter egg histórico (binario" src/layouts/Layout.astro`
Expected: 1 línea (binario preservado como comentario).

Run: `grep -cE 'name="description" content="01001001' src/layouts/Layout.astro`
Expected: 0 (el binario ya no es el content del meta, solo comentario).

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "$(cat <<'EOF'
feat(seo): meta description SEO-friendly, binary easter egg as comment

The 'I am god' binary stays as an HTML comment (findable via View
Source — coherent with site tone). Meta description now provides
useful preview for shares and SEO indexing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task A.4: Contact.astro — email canónico, eliminar sapo

**Files:**
- Modify: `src/components/Contact.astro:11`
- Modify: `src/components/Contact.astro:62`
- Modify: `src/components/Contact.astro:63`

- [ ] **Step 1: Cambio en línea 11 (form action)**

Reemplazar:
```html
    action="https://formsubmit.co/vin-dev@outlook.com"
```

Por:
```html
    action="https://formsubmit.co/vin.devsito@gmail.com"
```

- [ ] **Step 2: Cambio en línea 62 (mailto href)**

Reemplazar:
```html
    href="mailto:noseasapo@sapo.com?subject=¡Hola%20Kevin!%20Estoy%20interesad@%20en%20comunicarme%20contigo."
```

Por:
```html
    href="mailto:vin.devsito@gmail.com?subject=¡Hola%20Kevin!%20Estoy%20interesad@%20en%20comunicarme%20contigo."
```

- [ ] **Step 3: Cambio en línea 63 (texto visible del anchor)**

Reemplazar:
```html
    >vin-dev@outlook.com</a
```

Por:
```html
    >vin.devsito@gmail.com</a
```

- [ ] **Step 4: Verificar**

Run: `grep -n "vin-dev@outlook.com\|noseasapo@sapo.com" src/components/Contact.astro`
Expected: vacío.

Run: `grep -cn "vin.devsito@gmail.com" src/components/Contact.astro`
Expected: 3 (form action + mailto href + texto visible).

- [ ] **Step 5: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 6: Commit**

```bash
git add src/components/Contact.astro
git commit -m "$(cat <<'EOF'
feat(contact): unify canonical email to vin.devsito@gmail.com

Three changes:
- form action: formsubmit.co destination updated
- mailto href: removed 'noseasapo@sapo.com' joke (broke real clicks)
- visible anchor text: matches the new canonical

Note: post-deploy, first form submission triggers a formsubmit.co
activation email to vin.devsito@gmail.com that must be clicked before
form delivery starts working.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task C.1: Tags nuevos en `tag-configs.ts` (+6)

**Files:**
- Modify: `src/data/tag-configs.ts:7-21`

- [ ] **Step 1: Añadir 6 entradas nuevas al objeto `tagConfigs`**

Localizar el objeto `tagConfigs` (líneas 7-21). Mantener todas las entradas existentes y añadir las 6 nuevas al final del objeto (antes del `}`):

Reemplazar:
```ts
export const tagConfigs: Record<string, TagConfig> = {
  "e-commerce": { label: "E-commerce", bgColor: "#264653", txtColor: "#fff" },
  technology:   { label: "Technologia", bgColor: "#6c8c65", txtColor: "#000" },
  frontend:     { label: "Frontend", bgColor: "#6f1d1b", txtColor: "#fff" },
  uiux:         { label: "UI/UX", bgColor: "#f4d35e", txtColor: "#000" },
  entertainment:{ label: "Entretenimiento", bgColor: "#2a9d8f", txtColor: "#000" },
  api:          { label: "API", bgColor: "#000000", txtColor: "#fff" },
  manager:      { label: "Administrador", bgColor: "#8d99ae", txtColor: "#000" },
  dashboard:    { label: "DashBoard", bgColor: "#ff6d00", txtColor: "#000" },
  modeling:     { label: "Modelado", bgColor: "#042a2b", txtColor: "#fff" },
  business:     { label: "Negocio", bgColor: "#ff6b6b", txtColor: "#000" },
  leadership:   { label: "Líderazgo", bgColor: "#7a9e9f", txtColor: "#000" },
  mysql:        { label: "MySql", bgColor: "#04a777", txtColor: "#000" },
  db:           { label: "DB", bgColor: "#f0f0c9", txtColor: "#000" },
};
```

Por:
```ts
export const tagConfigs: Record<string, TagConfig> = {
  "e-commerce": { label: "E-commerce", bgColor: "#264653", txtColor: "#fff" },
  technology:   { label: "Technologia", bgColor: "#6c8c65", txtColor: "#000" },
  frontend:     { label: "Frontend", bgColor: "#6f1d1b", txtColor: "#fff" },
  uiux:         { label: "UI/UX", bgColor: "#f4d35e", txtColor: "#000" },
  entertainment:{ label: "Entretenimiento", bgColor: "#2a9d8f", txtColor: "#000" },
  api:          { label: "API", bgColor: "#000000", txtColor: "#fff" },
  manager:      { label: "Administrador", bgColor: "#8d99ae", txtColor: "#000" },
  dashboard:    { label: "DashBoard", bgColor: "#ff6d00", txtColor: "#000" },
  modeling:     { label: "Modelado", bgColor: "#042a2b", txtColor: "#fff" },
  business:     { label: "Negocio", bgColor: "#ff6b6b", txtColor: "#000" },
  leadership:   { label: "Líderazgo", bgColor: "#7a9e9f", txtColor: "#000" },
  mysql:        { label: "MySql", bgColor: "#04a777", txtColor: "#000" },
  db:           { label: "DB", bgColor: "#f0f0c9", txtColor: "#000" },
  saas:         { label: "SaaS", bgColor: "#0f4c5c", txtColor: "#fff" },
  "ai-applied": { label: "IA aplicada", bgColor: "#5e4ae3", txtColor: "#fff" },
  architecture: { label: "Arquitectura", bgColor: "#2b2d42", txtColor: "#fff" },
  automation:   { label: "Automatización", bgColor: "#e07a5f", txtColor: "#000" },
  refactor:     { label: "Refactor", bgColor: "#3d5a80", txtColor: "#fff" },
  typescript:   { label: "TypeScript", bgColor: "#3178c6", txtColor: "#fff" },
};
```

- [ ] **Step 2: Verificar**

Run: `grep -cE '^\s*(saas|"ai-applied"|architecture|automation|refactor|typescript):' src/data/tag-configs.ts`
Expected: 6.

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0. (Los tags nuevos no son referenciados aún; son inertes hasta C.2.)

- [ ] **Step 4: Commit**

```bash
git add src/data/tag-configs.ts
git commit -m "$(cat <<'EOF'
feat(data): add 6 new tag configs for Casos section

New tags: saas, ai-applied, architecture, automation, refactor,
typescript. Old tags untouched in this commit — orphans pruned later
in a dedicated commit once nothing references them.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task C.2: Crear `cases.ts` + actualizar HomeProjects + eliminar `projects.ts`

**Files:**
- Create: `src/data/cases.ts`
- Delete: `src/data/projects.ts`
- Modify: `src/components/home/HomeProjects.astro:1-36`

- [ ] **Step 1: Crear `src/data/cases.ts` con tipo extendido + 3 entries**

Crear archivo nuevo `src/data/cases.ts` con este contenido completo:

```ts
export interface Case {
  text: string;
  href: string;
  cover: string;
  bgColor: string;
  txtColor?: string;
  hrefImages?: string[];
  tags: Record<string, string>;
  company: string;
  role: string;
  period: string;
}

export const cases: Case[] = [
  {
    text: "SaaS B2B desde MVP — motor de agentes IA + liderazgo de implementación",
    company: "Clonai",
    role: "FullStack Developer / Líder Implementador",
    period: "02/2025 – 05/2026",
    href: "https://www.linkedin.com/company/clonaico/posts/?feedView=all",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="62" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="36" letter-spacing="2">CLONAI</text></svg>',
    bgColor: "#0a1929",
    txtColor: "#fff",
    tags: {
      template:  "saas",
      template1: "ai-applied",
      template2: "leadership",
      template3: "architecture",
    },
  },
  {
    text: "Integración Shopify + IA para generación automatizada de documentos legales",
    company: "Campuslands",
    role: "FullStack Developer",
    period: "10/2023 – 02/2025",
    href: "https://www.justiciacercana.co/",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="42" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="22" letter-spacing="1">JUSTICIA</text><text x="100" y="72" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="22" letter-spacing="1">CERCANA</text></svg>',
    bgColor: "#1d4e3f",
    txtColor: "#fff",
    tags: {
      template:  "e-commerce",
      template1: "automation",
      template2: "ai-applied",
    },
  },
  {
    text: "Migración Vue + JavaScript → Astro + TypeScript en plataforma productiva",
    company: "Campuslands",
    role: "FullStack Developer",
    period: "10/2023 – 02/2025",
    href: "mailto:vin.devsito@gmail.com?subject=Cu%C3%A9ntame%20m%C3%A1s%20sobre%20la%20migraci%C3%B3n%20Vue%E2%86%92Astro",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"><text x="100" y="68" text-anchor="middle" fill="currentColor" font-family="sans-serif" font-weight="800" font-size="48" letter-spacing="4">V→A</text></svg>',
    bgColor: "#FF5D01",
    txtColor: "#fff",
    tags: {
      template:  "refactor",
      template1: "typescript",
      template2: "architecture",
    },
  },
];
```

- [ ] **Step 2: Actualizar `src/components/home/HomeProjects.astro`**

Reemplazar el contenido COMPLETO del archivo (líneas 1-36 — la sección + frontmatter + script + style se preservan; cambios concentrados en lo de arriba):

Localizar líneas 1-36 (todo lo que NO es `<script>` ni `<style>`):

Antes:
```astro
---
import Card from "../Card.astro";
import Anchor from "../Anchor.astro";
import { projects } from "../../data/projects";
---

<section id="projects">
  <h2 class="Dela"><span class="hidden_text">Short</span> PREVIEW</h2>
  <div class="flex">
    {projects.map((project) => (
      <Card
        text={project.text}
        href={project.href}
        cover={project.cover}
        bgColor={project.bgColor}
        txtColor={project.txtColor}
        hrefImages={project.hrefImages}
        tags={project.tags}
      />
    ))}
  </div>
  <blockquote class="text_center">
    <Anchor
      href="https://github.com/KevinJGV?tab=repositories"
      text="Más "
      max_font_size="7rem"
      min_font_size="3rem"
      bgHeight="7.5rem"
      _blank={true}
      svgh={76}
      svgw={75}
      svg={true}
      responsive={true}
    />
  </blockquote>
</section>
```

Después:
```astro
---
import Card from "../Card.astro";
import Anchor from "../Anchor.astro";
import { cases } from "../../data/cases";
---

<section id="projects">
  <h2 class="Dela"><span class="hidden_text">Real</span> CASOS</h2>
  <div class="flex">
    {cases.map((caseItem) => (
      <Card
        text={caseItem.text}
        href={caseItem.href}
        cover={caseItem.cover}
        bgColor={caseItem.bgColor}
        txtColor={caseItem.txtColor}
        hrefImages={caseItem.hrefImages}
        tags={caseItem.tags}
      />
    ))}
  </div>
  <blockquote class="text_center">
    <Anchor
      href="https://www.linkedin.com/in/vin-dev"
      text="Más en LinkedIn "
      max_font_size="7rem"
      min_font_size="3rem"
      bgHeight="7.5rem"
      _blank={true}
      svgh={76}
      svgw={75}
      svg={true}
      responsive={true}
    />
  </blockquote>
</section>
```

Cambios:
- Import: `projects` → `cases`.
- Header `Short` (hover) `PREVIEW` → `Real` (hover) `CASOS`.
- `.map((project) => ...)` → `.map((caseItem) => ...)`.
- Referencias `project.*` → `caseItem.*` (text, href, cover, bgColor, txtColor, hrefImages, tags).
- Anchor href: GitHub repos → `https://www.linkedin.com/in/vin-dev`.
- Anchor text: `"Más "` → `"Más en LinkedIn "`.

**NO se toca:** `id="projects"` (CSS lo referencia), el bloque `<script>`, el bloque `<style>` (incluyendo la regla `#projects > div`).

- [ ] **Step 3: Eliminar `src/data/projects.ts`**

```bash
rm src/data/projects.ts
```

- [ ] **Step 4: Verificar build + grep imports limpios**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

Run: `grep -rn "from.*data/projects" src/`
Expected: vacío.

Run: `test -f src/data/projects.ts && echo "STILL EXISTS" || echo "ok deleted"`
Expected: `ok deleted`.

Run: `test -f src/data/cases.ts && echo "ok created" || echo "MISSING"`
Expected: `ok created`.

- [ ] **Step 5: Verificación visual rápida**

Run: `npm run preview &` (en background)

Abrir `http://localhost:4321/` en navegador y verificar:
- La sección de cards muestra 3 cards (Clonai, Justicia Cercana, Refactor).
- Header dice "CASOS" con "Real" oculto, visible en hover.
- Link al final dice "Más en LinkedIn".
- Cards renderizan los SVG covers correctamente con texto grande.

Cerrar preview: `kill %1` o `pkill -f "astro preview"`.

Si algo se ve mal (texto cortado, layout roto): apuntar y diagnosticar antes de seguir. Si el layout pasa, continuar.

- [ ] **Step 6: Commit**

```bash
git add src/data/cases.ts src/components/home/HomeProjects.astro
git rm src/data/projects.ts
git commit -m "$(cat <<'EOF'
feat(home): replace academic projects with 3 real Casos

- Rename src/data/projects.ts → src/data/cases.ts
- Extend type with company/role/period (data-only, not displayed in Card)
- 3 entries: Clonai (SaaS B2B + IA + leadership), Justicia Cercana
  (Shopify + IA — live URL), Vue→Astro refactor (mailto fallback)
- HomeProjects header: '(Short) PREVIEW' → '(Real) CASOS'
- Footer link: GitHub repos → 'Más en LinkedIn' → /in/vin-dev
- Card.astro untouched: visual contract preserved

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task C.3: Eliminar 11 tags huérfanos de `tag-configs.ts`

**Files:**
- Modify: `src/data/tag-configs.ts:7-27` (eliminar 11 líneas)

- [ ] **Step 1: Verificar que los 11 tags no son referenciados**

Run:
```bash
for key in technology frontend uiux entertainment api manager dashboard modeling business mysql db; do
  count=$(grep -rEn "\"$key\"|'$key'" src/ | grep -v "src/data/tag-configs.ts" | wc -l)
  echo "$key: $count refs"
done
```
Expected: TODOS deben mostrar `0 refs`. Si alguno muestra > 0, NO eliminar ese tag y reportar la referencia para decisión.

- [ ] **Step 2: Eliminar las 11 entradas del objeto `tagConfigs`**

Tras Task C.1, el objeto luce:
```ts
export const tagConfigs: Record<string, TagConfig> = {
  "e-commerce": { label: "E-commerce", bgColor: "#264653", txtColor: "#fff" },
  technology:   { label: "Technologia", bgColor: "#6c8c65", txtColor: "#000" },
  frontend:     { label: "Frontend", bgColor: "#6f1d1b", txtColor: "#fff" },
  uiux:         { label: "UI/UX", bgColor: "#f4d35e", txtColor: "#000" },
  entertainment:{ label: "Entretenimiento", bgColor: "#2a9d8f", txtColor: "#000" },
  api:          { label: "API", bgColor: "#000000", txtColor: "#fff" },
  manager:      { label: "Administrador", bgColor: "#8d99ae", txtColor: "#000" },
  dashboard:    { label: "DashBoard", bgColor: "#ff6d00", txtColor: "#000" },
  modeling:     { label: "Modelado", bgColor: "#042a2b", txtColor: "#fff" },
  business:     { label: "Negocio", bgColor: "#ff6b6b", txtColor: "#000" },
  leadership:   { label: "Líderazgo", bgColor: "#7a9e9f", txtColor: "#000" },
  mysql:        { label: "MySql", bgColor: "#04a777", txtColor: "#000" },
  db:           { label: "DB", bgColor: "#f0f0c9", txtColor: "#000" },
  saas:         { label: "SaaS", bgColor: "#0f4c5c", txtColor: "#fff" },
  "ai-applied": { label: "IA aplicada", bgColor: "#5e4ae3", txtColor: "#fff" },
  architecture: { label: "Arquitectura", bgColor: "#2b2d42", txtColor: "#fff" },
  automation:   { label: "Automatización", bgColor: "#e07a5f", txtColor: "#000" },
  refactor:     { label: "Refactor", bgColor: "#3d5a80", txtColor: "#fff" },
  typescript:   { label: "TypeScript", bgColor: "#3178c6", txtColor: "#fff" },
};
```

Reemplazar por (conservando solo `e-commerce`, `leadership` y los 6 nuevos):
```ts
export const tagConfigs: Record<string, TagConfig> = {
  "e-commerce": { label: "E-commerce", bgColor: "#264653", txtColor: "#fff" },
  leadership:   { label: "Líderazgo", bgColor: "#7a9e9f", txtColor: "#000" },
  saas:         { label: "SaaS", bgColor: "#0f4c5c", txtColor: "#fff" },
  "ai-applied": { label: "IA aplicada", bgColor: "#5e4ae3", txtColor: "#fff" },
  architecture: { label: "Arquitectura", bgColor: "#2b2d42", txtColor: "#fff" },
  automation:   { label: "Automatización", bgColor: "#e07a5f", txtColor: "#000" },
  refactor:     { label: "Refactor", bgColor: "#3d5a80", txtColor: "#fff" },
  typescript:   { label: "TypeScript", bgColor: "#3178c6", txtColor: "#fff" },
};
```

- [ ] **Step 3: Verificar**

Run: `grep -cE '^\s*(technology|frontend|uiux|entertainment|api|manager|dashboard|modeling|business|mysql|db):' src/data/tag-configs.ts`
Expected: 0.

Run: `grep -cE '^\s*(("e-commerce")|leadership|saas|"ai-applied"|architecture|automation|refactor|typescript):' src/data/tag-configs.ts`
Expected: 8.

- [ ] **Step 4: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 5: Commit**

```bash
git add src/data/tag-configs.ts
git commit -m "$(cat <<'EOF'
chore(data): prune 11 orphan tag configs

Removed after grep-confirmed zero references in src/:
technology, frontend, uiux, entertainment, api, manager, dashboard,
modeling, business, mysql, db.

YAGNI: if any of these come back later, re-add then.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task C.4: Navbar — "Proyectos" → "Casos" + URL a LinkedIn (3 páginas)

**Files:**
- Modify: `src/pages/index.astro:15`
- Modify: `src/pages/me.astro:15`
- Modify: `src/pages/contact.astro:15`

- [ ] **Step 1: Cambio en `src/pages/index.astro:15`**

Reemplazar:
```ts
				Proyectos: "https://github.com/KevinJGV?tab=repositories",
```

Por:
```ts
				Casos: "https://www.linkedin.com/in/vin-dev",
```

- [ ] **Step 2: Cambio en `src/pages/me.astro:15`**

Reemplazar:
```ts
				Proyectos: "https://github.com/KevinJGV?tab=repositories",
```

Por:
```ts
				Casos: "https://www.linkedin.com/in/vin-dev",
```

- [ ] **Step 3: Cambio en `src/pages/contact.astro:15`**

Reemplazar:
```ts
				Proyectos: "https://github.com/KevinJGV?tab=repositories",
```

Por:
```ts
				Casos: "https://www.linkedin.com/in/vin-dev",
```

- [ ] **Step 4: Verificar**

Run: `grep -rn "Proyectos" src/pages/`
Expected: vacío.

Run: `grep -rcn "Casos:" src/pages/`
Expected: 3 archivos con 1 match cada uno.

Run: `grep -rn "KevinJGV?tab=repositories" src/pages/`
Expected: vacío.

- [ ] **Step 5: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/pages/me.astro src/pages/contact.astro
git commit -m "$(cat <<'EOF'
feat(navbar): 'Proyectos' → 'Casos', URL → LinkedIn /in/vin-dev

Consistent with the 'Más en LinkedIn' link inside HomeProjects: both
the navbar item and the section-footer link now point to the same
LinkedIn profile, removing the GitHub-repos dissonance with the new
Casos framing (professional cases, not academic repos).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task B.1: HomeHero body — reescrito

**Files:**
- Modify: `src/components/home/HomeHero.astro:25-39`

- [ ] **Step 1: Reemplazar el `<p>` dentro de `#home1_bot`**

Localizar líneas 25-39 (el contenido del `<p>` dentro de `<div id="home1_bot">`):

Antes:
```astro
      <p>
        Disciplina en el back-end, pasión por el front-end.
        <br />
        Amo la lógica y la creatividad de la programación.
        <br />
        ¿Por qué?
        <br />
        Porque me siento como un dios creando cosas, definiendo sus atributos y comportamientos.
        <br />
        Ambición por comprender los sistemas informáticos y crear experiencias de
        usuario impresionantes.
        <br />
        Cuando no estoy aprendiendo sobre nuevas tecnologías, probablemente estoy
        pensando en el futuro o siendo el consejero de mis amigos.
      </p>
```

Después:
```astro
      <p>
        Construyo sistemas que combinan back-end sólido, front-end cuidado e integración de LLMs en productos reales.
        <br />
        He co-creado un SaaS desde MVP, liderado equipos de implementación y migrado plataformas enteras a stacks más mantenibles.
        <br />
        Me obsesiona la arquitectura limpia — alta cohesión, bajo acoplamiento — y traducir requerimientos confusos a decisiones técnicas claras.
        <br />
        ¿Por qué hago esto?
        <br />
        Porque cuando todo encaja me siento un poco dios creando cosas, definiendo sus atributos y comportamientos.
        <br />
        Cuando no estoy desarrollando, probablemente estoy pensando en el futuro o siendo el consejero de mis amigos.
      </p>
```

- [ ] **Step 2: Verificar**

Run: `grep -n "Disciplina en el back-end" src/components/home/HomeHero.astro`
Expected: vacío.

Run: `grep -n "integración de LLMs en productos reales\|co-creado un SaaS desde MVP\|alta cohesión, bajo acoplamiento\|me siento un poco dios creando cosas" src/components/home/HomeHero.astro`
Expected: 4 líneas (una por cada cadena clave).

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 4: Verificación visual rápida**

Run: `npm run preview &`

Abrir `http://localhost:4321/` y leer el bloque body del hero. Verificar:
- Texto se ve completo y legible.
- No hay overflow ni desbordes notorios respecto al original.
- Quirk "me siento un poco dios creando cosas" presente.

Cerrar preview.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/HomeHero.astro
git commit -m "$(cat <<'EOF'
feat(home): rewrite hero body — signals IA + arquitectura + liderazgo

Replaces generic 'back-end/front-end pasión' framing with concrete
signals: co-creating SaaS from MVP, leading implementation teams,
plataform migrations, clean architecture. Preserves quirk: 'me siento
un poco dios creando cosas' relocated as the answer to '¿Por qué hago
esto?' so it now reinforces seniority instead of distracting.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task B.2: MeAbout body — reescrito

**Files:**
- Modify: `src/components/me/MeAbout.astro:9-22`

- [ ] **Step 1: Reemplazar el `<p>` del bloque About**

Localizar líneas 9-22 (el `<p class="Poppins-R">` y su contenido):

Antes:
```astro
      <p class="Poppins-R">
        Mi nombre completo es Kevin Johan González Velandia.<br />
        Soy un desarrollador y diseñador de software Colombiano, Full-Stack,<br />
        con la ambición de especializarme en la ciberseguridad y lanzar un
        producto con potencial tecnologico.<br />
        Doy forma a las marcas digitalmente, fascinado por la intersección
        de la creatividad y la lógica.<br />
        A pesar de la apariencia de mi webpage, soy un amante de la simplicidad,
        el minimalismo y la complejidad de las relaciones interpersonales.<br />
        Soy consciente de la importancia de los aspectos técnicos y creativos,<br />
        siempre en busca de la mejora personal.<br />
        Me encanta colaborar en grandes proyectos con gente talentosa e interesante.<br />
        ¿Necesitas una mano? Yo tengo dos.
      </p>
```

Después:
```astro
      <p class="Poppins-R">
        Mi nombre completo es Kevin Johan González Velandia.<br />
        Soy un desarrollador FullStack colombiano,<br />
        con foco en arquitecturas escalables e integración de IA<br />
        donde realmente suma valor — no por moda.<br />
        Doy forma a marcas y productos digitales, fascinado por la intersección
        de la creatividad y la lógica.<br />
        A pesar de la apariencia de mi webpage, soy un amante de la simplicidad,
        el minimalismo y la complejidad de las relaciones interpersonales.<br />
        Me encanta colaborar en proyectos exigentes con gente talentosa —<br />
        y soy de los que creen que un equipo funciona mejor cuando el nuevo<br />
        puede tener una charla absurda con el administrador sin que eso<br />
        reste profesionalismo.<br />
        ¿Necesitas una mano? Yo tengo dos.
      </p>
```

- [ ] **Step 2: Verificar**

Run: `grep -n "ciberseguridad" src/components/me/MeAbout.astro`
Expected: vacío.

Run: `grep -n "FullStack colombiano\|integración de IA\|charla absurda con el administrador\|¿Necesitas una mano? Yo tengo dos." src/components/me/MeAbout.astro`
Expected: 4 líneas (una por cadena clave; la firma final preservada).

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 4: Verificación visual rápida**

Run: `npm run preview &`

Abrir `http://localhost:4321/me` y revisar el bloque About. Verificar:
- Texto completo, sin overflow obvio.
- Frase de filosofía de equipo presente y legible.
- Firma "¿Necesitas una mano? Yo tengo dos." preservada al final.

Cerrar preview.

- [ ] **Step 5: Commit**

```bash
git add src/components/me/MeAbout.astro
git commit -m "$(cat <<'EOF'
feat(me): rewrite About — drop ciberseguridad, add team philosophy

- Position: FullStack colombiano con foco en arquitecturas escalables
  e integración de IA (drops 'ciberseguridad' which contradicted the CV)
- Adds explicit team philosophy: 'el nuevo puede tener una charla
  absurda con el administrador sin que eso reste profesionalismo' —
  the cultural filter Kevin values in teams
- Preserves the signature closing 'Yo tengo dos.'

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task B.3: MeWhatIDo body — reescrito

**Files:**
- Modify: `src/components/me/MeWhatIDo.astro:8-18`

- [ ] **Step 1: Reemplazar el `<p>` del bloque WhatIDo**

Localizar líneas 8-18:

Antes:
```astro
      <p class="Poppins-R">
        Dame un teclado, un raton, tiempo, lo que necesitas y musica
        clasica sin anuncios para desarrollarlo priorizando la
        optimización de procesos, sumando en estos mis valores
        distintivos de colaboración, comunicación honesta, dedicación e
        iniciativa, ahorrando tiempo buscando metodos / tecnologias ya
        existentes, funcionales y confiables que se adapten a las
        necesidades.<br />Despues de todo no siempre hace falta
        reinvetar las ruedas para tener más valor agregado<br />¡Es más
        barato optimizarlas!
      </p>
```

Después:
```astro
      <p class="Poppins-R">
        Diseño y construyo software que tiene que funcionar el lunes en
        producción, no solo en una demo de viernes.<br />
        Prefiero entender el problema dos veces antes que reescribir la
        solución tres.<br />
        Optimizo procesos antes que reinventarlos: si la rueda existe,
        funciona y es confiable, la uso.<br />
        Sumo valor con colaboración, comunicación honesta y la disciplina
        de terminar lo que empiezo — sin convertirme en robot ni esperar
        que los demás lo sean.<br />
        Dame un teclado, un ratón, tiempo y música clásica sin anuncios —
        lo demás lo resolvemos.
      </p>
```

- [ ] **Step 2: Verificar**

Run: `grep -n "reinvetar las ruedas\|¡Es más" src/components/me/MeWhatIDo.astro`
Expected: vacío.

Run: `grep -n "funcionar el lunes en producción\|entender el problema dos veces\|sin convertirme en robot\|música clásica sin anuncios" src/components/me/MeWhatIDo.astro`
Expected: 4 líneas (una por cadena clave; firma del teclado/ratón/música preservada al final).

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 4: Verificación visual rápida**

Run: `npm run preview &`

Abrir `http://localhost:4321/me` y revisar el bloque WhatIDo. Verificar:
- Texto completo y legible.
- Firma "Dame un teclado, un ratón, tiempo y música clásica sin anuncios" preservada al final.

Cerrar preview.

- [ ] **Step 5: Commit**

```bash
git add src/components/me/MeWhatIDo.astro
git commit -m "$(cat <<'EOF'
feat(me): rewrite WhatIDo — declarative decisions, not fluffy prose

Replaces the poetic 'dame teclado, ratón, música clásica' framing
(now relocated as closing signature) with concrete decisions: ship
to Monday-prod, understand-twice-before-rewrite-thrice, prefer
existing battle-tested tools, finish what you start without becoming
a robot. Preserves the keyboard/mouse/music sign-off.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task B.4: MeWhereImGoing body — reescrito (preservando link de Código Ninja)

**Files:**
- Modify: `src/components/me/MeWhereImGoing.astro:8-23`

- [ ] **Step 1: Reemplazar el `<q>` y el `<p>` del bloque WhereImGoing**

Localizar líneas 8-23 (el `<q>` quote + el `<p>` body):

Antes:
```astro
      <q class="Poppins-S"
        >Con mi trabajo, sin temor a ello y nada más que eso, destilar
        mi valor y exito profesional sin importar la empresa.</q
      >
      <p class="Poppins-R">
        Personalmente aquel sujeto al cual sueles recurrir, gracias a la
        experiencia y conocimiento en todas las tecnologias y areas de
        su interes, ante un "Gridlock".<br />Alguien a quien puedas
        definir como especialista en el campo capaz de escribir <a
          href="https://es.javascript.info/ninja-code"
          target="_blank"
          rel="noopener noreferrer">Código Ninja</a
        > a su conveniencia.<br />
        Profesionalmente, con una solida carrera, experiencia y conocimientos tecnologicos,<br>el CEO de un, o varios, productos distintivos utiles e impactantes
        en el dia a dia de las sociedades.
      </p>
```

Después:
```astro
      <q class="Poppins-S"
        >Con mi trabajo, sin temor a ello y nada más que eso, destilar
        mi valor y éxito profesional sin importar la empresa.</q
      >
      <p class="Poppins-R">
        Personalmente, aquel sujeto al que recurres ante un gridlock —<br />
        el que ya pasó por suficientes incendios para saber por dónde empezar,<br />
        capaz de escribir <a
          href="https://es.javascript.info/ninja-code"
          target="_blank"
          rel="noopener noreferrer">Código Ninja</a
        > a su conveniencia.<br />
        Profesionalmente, construyendo o co-construyendo productos que importen:<br />
        con la experiencia técnica, el criterio de arquitectura y la cabeza de líder<br />
        para que las cosas lleguen al usuario y sigan en pie seis meses después.<br />
        Y, en algún momento, el CEO de uno o varios de esos productos.
      </p>
```

Cambios respecto al original:
- Quote: `exito` → `éxito` (tilde corregida).
- Body reestructurado: gridlock-incendios-Código Ninja (mantiene link `<a>` con el mismo href y atributos rel).
- "Solida carrera" → "construyendo o co-construyendo productos que importen".
- "CEO de un, o varios, productos distintivos utiles e impactantes en el dia a dia de las sociedades" → "el CEO de uno o varios de esos productos" (versión refinada manteniendo la ambición CEO).

- [ ] **Step 2: Verificar**

Run: `grep -n "exito profesional\|tecnologias y areas\|solida carrera\|distintivos utiles" src/components/me/MeWhereImGoing.astro`
Expected: vacío.

Run: `grep -n "éxito profesional\|suficientes incendios\|Código Ninja\|seis meses después" src/components/me/MeWhereImGoing.astro`
Expected: 4 líneas (incluyendo Código Ninja con su link preservado).

Run: `grep -n 'href="https://es.javascript.info/ninja-code"' src/components/me/MeWhereImGoing.astro`
Expected: 1 línea (link Código Ninja preservado).

- [ ] **Step 3: Build pasa**

Run: `npm run build 2>&1 | tail -10`
Expected: 0/0/0.

- [ ] **Step 4: Verificación visual rápida**

Run: `npm run preview &`

Abrir `http://localhost:4321/me` y revisar el bloque WhereImGoing. Verificar:
- Quote legible (con tilde en éxito).
- Body completo, "Código Ninja" subrayado y clicable (apunta a javascript.info/ninja-code).
- Cierre "el CEO de uno o varios de esos productos" presente.

Cerrar preview.

- [ ] **Step 5: Commit**

```bash
git add src/components/me/MeWhereImGoing.astro
git commit -m "$(cat <<'EOF'
feat(me): rewrite WhereImGoing — refined ambition, Código Ninja inline

- Quote: éxito (tilde) corregido
- Body: gridlock → 'suficientes incendios para saber por dónde empezar'
  reinforces seniority; Código Ninja link (javascript.info) preserved
  intact; ambition reframed from 'CEO de productos distintivos útiles'
  to 'construyendo productos que importen ... CEO de uno o varios'
- Six-months durability angle ('sigan en pie seis meses después')
  signals engineering discipline over hype

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task FINAL: Integral verification + handoff

**Files:**
- None (verification + final commit if needed)

- [ ] **Step 1: Build integral pasa**

Run: `npm run build 2>&1 | tail -15`
Expected: `0 errors / 0 warnings / 0 hints` y `Complete!` al final.

- [ ] **Step 2: Verificación integral por grep (todos los criterios automáticos del spec)**

Run el bloque completo:
```bash
echo "=== ciberseguridad ===" && grep -rn "ciberseguridad" src/ || echo "ok vacío"
echo "=== Código Ninja ===" && grep -rn "Código Ninja" src/
echo "=== emails viejos ===" && grep -rn "vin-dev@outlook.com\|noseasapo@sapo.com" src/ || echo "ok vacío"
echo "=== email canónico ===" && grep -rcn "vin.devsito@gmail.com" src/
echo "=== projects.ts existe? ===" && test -f src/data/projects.ts && echo "STILL EXISTS" || echo "ok deleted"
echo "=== cases.ts existe? ===" && test -f src/data/cases.ts && echo "ok exists" || echo "MISSING"
echo "=== imports projects ===" && grep -rn "from.*data/projects" src/ || echo "ok vacío"
echo "=== Jr/Senior ===" && grep -rn "Clearly Senior\|I mean, Jr" src/ || echo "ok vacío"
echo "=== README training/backend old ===" && grep -n "training on Campuslands\|backend related projects" README.md || echo "ok vacío"
echo "=== README vindevsito.dev ===" && grep -cn "vindevsito.dev" README.md
echo "=== README LinkedIn canónico ===" && grep -n 'linkedin.com/in/vin-dev' README.md
echo "=== README badges IA ===" && grep -cn "Anthropic\|OpenAI" README.md
echo "=== Proyectos en pages ===" && grep -rn "Proyectos" src/pages/ || echo "ok vacío"
echo "=== Casos en pages ===" && grep -rcn "Casos:" src/pages/
```

Expected:
- `ciberseguridad`: vacío ✓
- `Código Ninja`: 1 línea (MeWhereImGoing) ✓
- emails viejos: vacío ✓
- email canónico: ≥3 ocurrencias en Contact.astro + 0+ en otros ✓
- `projects.ts`: deleted ✓
- `cases.ts`: exists ✓
- imports projects: vacío ✓
- Jr/Senior: vacío ✓
- training/backend old en README: vacío ✓
- README vindevsito.dev: ≥1 ✓
- README LinkedIn `/in/vin-dev`: ≥1 ✓
- README badges Anthropic+OpenAI: ≥2 ✓
- Proyectos en pages: vacío ✓
- Casos en pages: 3 archivos ✓

Si algo falla, identificar el commit responsable, corregir y crear NUEVO commit (no amend).

- [ ] **Step 3: Verificación visual integral**

Run: `npm run preview &`

Abrir 4 URLs y verificar:

`http://localhost:4321/`:
- Hero body refleja IA + arquitectura + SaaS, conserva "me siento un poco dios".
- Sidebar carousel rota AI-pilled / Implementation Lead / Architecture-pilled (sin Jr/Senior).
- Sección "(Real) CASOS" con 3 cards (Clonai dark navy, Justicia Cercana verde, Refactor naranja Astro).
- Link "Más en LinkedIn" funciona, apunta a `/in/vin-dev`.
- Navbar muestra "Casos".

`http://localhost:4321/me`:
- MeAbout: sin ciberseguridad, con frase de filosofía de equipo, firma "Yo tengo dos." al final.
- MeWhatIDo: declarativo, firma teclado/ratón/música al final.
- MeWhereImGoing: éxito con tilde, Código Ninja link funcional, cierre CEO presente.
- MeLikes: ortografía limpia, "Gente sin criterio propio" presente, sin Simps.

`http://localhost:4321/contact`:
- Email visible: `vin.devsito@gmail.com`.
- Clic en email anchor abre mailto válido con asunto pre-rellenado.

View-source de cualquier ruta:
- Meta description: la SEO-friendly. Comentario HTML con binario presente.

Cerrar preview.

- [ ] **Step 4: README rendering visual**

Abrir `https://github.com/KevinJGV/KevinJGV/blob/copy-and-positioning/README.md` en navegador (después de push, si quieres validar pre-merge).

Verificar:
- Badge "Página Web" visible, clic lleva a `vindevsito.dev`.
- Bio: Clonai role, SaaS+AI integration, agentic patterns.
- Email canónico.
- Badges Anthropic + OpenAI renderizan con logo (si no, fallback documentado).
- Quirk "4 nipples" preservado.

- [ ] **Step 5: Si algo se vio mal — crear NUEVO commit de corrección**

Si en Step 3 o 4 detectaste algo (overflow, animación rota, badge sin logo, layout desalineado): documentar, corregir, crear NUEVO commit con mensaje `fix(copy): <descripción>`. NO amend a commits anteriores.

Si todo OK: continuar.

- [ ] **Step 6: Resumen del branch + handoff**

Run:
```bash
git log --oneline main..HEAD
git diff --stat main..HEAD
```

Resumir al usuario:
- Cantidad de commits en el branch.
- Archivos tocados y líneas +/-.
- Lista de los 4 buckets completados (D, A, C, B).
- Recordatorio de R4 (formsubmit.co requiere confirmación post-deploy de primer envío).

Preguntar al usuario cómo proceder:
- Merge a main (estilo de los specs anteriores) y deploy.
- O PR para revisión adicional.

Esperar decisión del usuario antes de mergear/pushear.

---

## Notas operativas

**Sobre R4 (formsubmit.co):** post-merge y post-deploy, **el primer envío del form de Contact triggerea un email de activación** que llega a `vin.devsito@gmail.com`. Hasta que ese email sea clicado, formsubmit.co NO entrega los mensajes al destino. Documentar en el handoff y recordar al usuario hacer el envío de prueba + confirmación.

**Sobre R6 (vindevsito.dev):** antes del merge del commit D.2, confirmar que `https://www.vindevsito.dev/` resuelve (HTTP 200 o redirect). Si no resuelve, mover el commit de D.2 al final del orden y mergear cuando el portafolio esté desplegado.

**Sobre R7 (badges shields.io):** si en D.5 los badges Anthropic/OpenAI no renderizan con logo, fallback documentado: editar quitando `&logo=...&logoColor=white`.

**Si una tarea de Bucket B (cuerpo narrativo) genera overflow visual:** apuntar el caso, decidir caso por caso si recortar texto o ajustar spacing. Spec marca esto como riesgo R3.
