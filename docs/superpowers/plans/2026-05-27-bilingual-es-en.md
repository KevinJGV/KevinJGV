# Bilingüe ES/EN Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar bilingüe ES/EN completo. ES preserva URLs actuales (`/`, `/me`, `/contact`), EN agrega routes con prefijo `/en/*`. Switcher en `Tools.astro` con auto-detect del browser + persistencia en `localStorage`. Traducción natural de copy preservando quirks culturales.

**Architecture:** 3 buckets que shippean juntos en 1 PR. A (infra Astro i18n + helper + lang dinámico + páginas EN) → B (i18n/{es,en}.ts + cases.ts bilingual + componentes consumiendo helper + /api/contact locale-aware) → C (switcher en Tools + auto-detect inline script).

**Tech Stack:** Astro 6 i18n nativo + TypeScript + CSS puro. Cero dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-05-27-bilingual-es-en-design.md`

---

## File Structure

### Created
| Archivo | Responsabilidad |
|---|---|
| `src/i18n/index.ts` | Helper module: `t(locale, key)`, `tFor(astro)`, `getAlternatePath()`, types `Locale` |
| `src/i18n/es.ts` | Diccionario centralizado ES (export default as const) |
| `src/i18n/en.ts` | Diccionario centralizado EN (mismo shape) |
| `src/pages/en/index.astro` | Mirror EN del home (mismo Layout + components, hrefs prefijadas) |
| `src/pages/en/me.astro` | Mirror EN del Me page |
| `src/pages/en/contact.astro` | Mirror EN del Contact page |

### Modified
| Archivo | Cambios |
|---|---|
| `astro.config.mjs` | Añadir bloque `i18n: { defaultLocale, locales, routing }` |
| `src/layouts/Layout.astro` | `<html lang>` dinámico, hreflang tags, meta description via `t()`, inline auto-detect script en `<head>` |
| `src/pages/index.astro` | Pasar `title` via `t()`, hrefs del Navbar |
| `src/pages/me.astro` | Idem |
| `src/pages/contact.astro` | Idem |
| `src/components/Navbar.astro` | Labels desde i18n |
| `src/components/Sidebar.astro` | "Disponible" / "Available" |
| `src/components/SideComponentMain.astro` | `nouns` array desde i18n via define:vars |
| `src/components/Tools.astro` | Switcher button + JS handler + aria-labels desde i18n |
| `src/components/home/HomeHero.astro` | Body paragraph desde i18n |
| `src/components/home/HomeProjects.astro` | Heading, anchor text, `caseItem.text[locale]` lookup |
| `src/components/home/HomeTechs.astro` | Heading, anchor text |
| `src/components/Card.astro` | CTA "Ver más" / "See more" desde i18n |
| `src/components/Hexagon.astro` | "Bloqueado" / "Locked" desde i18n |
| `src/components/me/MeAbout.astro` | Body desde i18n |
| `src/components/me/MeWhatIDo.astro` | Body desde i18n |
| `src/components/me/MeWhereImGoing.astro` | Body desde i18n (preservar inline link "Código Ninja" → "Ninja Code") |
| `src/components/me/MeLikes.astro` | Arrays loves/hates desde i18n |
| `src/components/Contact.astro` | Headings, form labels, success feedback, hidden locale input |
| `src/components/footer/FooterTypewriter.astro` | Words array desde i18n |
| `src/components/footer/FooterSocial.astro` | Si tiene texto, desde i18n |
| `src/data/cases.ts` | `text` y `role` como `{ es, en }` |
| `src/pages/api/contact.ts` | Switch de mensajes según `locale` del form |

---

## Pre-flight: Baseline state

### Task 0: Confirmar baseline

**Files:** ninguno modificado.

- [ ] **Step 0.1: Verificar branch + working tree limpio**

Run: `git status && git branch --show-current`
Expected: branch `bilingual-es-en`, `nothing to commit, working tree clean`.

- [ ] **Step 0.2: Build baseline pasa**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints` + `Complete!`.

- [ ] **Step 0.3: Confirmar último commit es el spec**

Run: `git log --oneline -2`
Expected: el commit más reciente es `docs(spec): add Bilingüe ES/EN design (Spec 8)` (hash `bb2d8d3` o equivalente).

- [ ] **Step 0.4: Confirmar URLs actuales del sitio (snapshot pre-cambio)**

Run: `find src/pages -name "*.astro" | sort`
Expected: 3 archivos — `src/pages/contact.astro`, `src/pages/index.astro`, `src/pages/me.astro`. Tras Spec 8 deben haber 6 (3 originales + 3 en `src/pages/en/`).

---

## Bucket A — i18n infrastructure (2-3 commits)

### Task A.1: Astro i18n config + helper module skeleton

**Files:**
- Modify: `astro.config.mjs` (añadir bloque `i18n`)
- Create: `src/i18n/index.ts` (helper module)
- Create: `src/i18n/es.ts` (skeleton vacío con `as const` export)
- Create: `src/i18n/en.ts` (skeleton vacío)

- [ ] **Step A.1.1: Editar `astro.config.mjs`**

Localizar el `defineConfig({...})` (línea ~43 actual). Añadir bloque `i18n` DESPUÉS de `output: 'static'` y ANTES de `integrations`:

```js
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
  // ... resto sin cambios
});
```

- [ ] **Step A.1.2: Crear `src/i18n/es.ts` skeleton**

Crear archivo con contenido inicial:

```ts
// src/i18n/es.ts
// Diccionario de strings ES. Las claves se rellenan en Tasks B.1-B.x
// según los componentes que las consumen.
export default {
  layout: { meta: { description: "" } },
  pages: { home: { title: "Vin" }, me: { title: "Sobre mí" }, contact: { title: "Contacto" } },
  nav: { home: "Inicio", me: "Sobre mí", contact: "Contacto" },
  tools: { muteAria: "Silenciar/Activar música", localeToggleAria: "Cambiar idioma" },
} as const;
```

(El esqueleto contiene solo las keys que el helper necesita para que Layout y el switcher funcionen en Bucket A; el resto se añade incrementalmente en B.)

- [ ] **Step A.1.3: Crear `src/i18n/en.ts` skeleton**

```ts
// src/i18n/en.ts
// EN dictionary. Same shape as es.ts, populated in Tasks B.1-B.x.
export default {
  layout: { meta: { description: "" } },
  pages: { home: { title: "Vin" }, me: { title: "About me" }, contact: { title: "Contact" } },
  nav: { home: "Home", me: "About me", contact: "Contact" },
  tools: { muteAria: "Mute/Unmute music", localeToggleAria: "Switch language" },
} as const;
```

- [ ] **Step A.1.4: Crear `src/i18n/index.ts`**

```ts
import esStrings from './es';
import enStrings from './en';

export type Locale = 'es' | 'en';
export const locales: Locale[] = ['es', 'en'];
export const defaultLocale: Locale = 'es';

const dict = { es: esStrings, en: enStrings };

/** Get string by dotted key path, fallback to ES if missing in target locale. */
export function t(locale: Locale, key: string): string {
  const segments = key.split('.');
  let value: unknown = dict[locale];
  for (const seg of segments) {
    if (value && typeof value === 'object') {
      value = (value as Record<string, unknown>)[seg];
    } else {
      value = undefined;
      break;
    }
  }
  if (typeof value === 'string') return value;
  if (locale !== 'es') return t('es', key);
  return key; // dev signal: missing translation
}

/** Helper for Astro components: returns (key) => string fn bound to the route's locale. */
export function tFor(astro: { currentLocale?: string | undefined }): (key: string) => string {
  const locale: Locale = astro.currentLocale === 'en' ? 'en' : 'es';
  return (key: string) => t(locale, key);
}

/** Map a current path to its equivalent in target locale (for switcher + hreflang). */
export function getAlternatePath(currentPath: string, targetLocale: Locale): string {
  const isCurrentlyEn = currentPath.startsWith('/en/') || currentPath === '/en';
  const baseSegment = isCurrentlyEn
    ? currentPath.replace(/^\/en(\/|$)/, '/')
    : currentPath;
  if (targetLocale === 'en') {
    if (baseSegment === '/') return '/en';
    return '/en' + baseSegment;
  }
  return baseSegment || '/';
}
```

- [ ] **Step A.1.5: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints`. 3 pages still being generated (`/`, `/me`, `/contact`) ya que aún no hay `src/pages/en/*`.

- [ ] **Step A.1.6: Commit**

```bash
git add astro.config.mjs src/i18n/
git commit -m "feat(i18n): add Astro 6 i18n config + helper module skeleton

- astro.config.mjs: i18n block with defaultLocale 'es', locales ['es','en'],
  prefixDefaultLocale: false (preserves current URLs).
- src/i18n/index.ts: t(locale, key), tFor(astro), getAlternatePath() helpers.
- src/i18n/{es,en}.ts: skeleton dictionaries with layout.meta, pages titles,
  nav labels, tools aria. Rellenados incrementalmente en Bucket B."
```

---

### Task A.2: Update Layout.astro — lang dinámico + hreflang + meta via t()

**Files:**
- Modify: `src/layouts/Layout.astro` (frontmatter + `<head>` section)

- [ ] **Step A.2.1: Reemplazar frontmatter + `<head>` de Layout.astro**

Localizar el frontmatter (líneas 1-17 actual) y reemplazar:

```astro
---
import "../styles/variables.css";
import "../styles/fonts.css";
import "../styles/base.css";
import "../styles/cursors.css";
import "../styles/utilities.css";
import "../styles/components-global.css";
import Tools from "../components/Tools.astro";
import { ClientRouter } from "astro:transitions";
import { tFor, getAlternatePath, type Locale } from "../i18n";

interface Props {
  title: string;
}

const { title } = Astro.props;
const locale: Locale = Astro.currentLocale === 'en' ? 'en' : 'es';
const t = tFor(Astro);
const currentPath = Astro.url.pathname;
const altPathEs = getAlternatePath(currentPath, 'es');
const altPathEn = getAlternatePath(currentPath, 'en');
const siteOrigin = Astro.site?.origin ?? 'https://vindevsito.dev';
---
```

Localizar la apertura del `<head>` (línea ~20-30 actual). Reemplazar:

```astro
<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="UTF-8" />
    <!-- easter egg histórico (binario "I am god"): 01001001 00100000 01100001 01101101 00100000 01100111 01101111 01100100 -->
    <meta name="description" content={t('layout.meta.description')} />
    <meta name="viewport" content="width=device-width" />
    <link id="icon" rel="icon" type="image/svg+xml" href="/circle.svg" />
    <meta name="generator" content={Astro.generator} />

    <link rel="alternate" hreflang="es" href={siteOrigin + altPathEs} />
    <link rel="alternate" hreflang="en" href={siteOrigin + altPathEn} />
    <link rel="alternate" hreflang="x-default" href={siteOrigin + altPathEs} />

    <title>{title}</title>
    <ClientRouter />
  </head>
```

(El inline auto-detect script de Bucket C se añade en C.1 dentro de este `<head>`.)

El resto del archivo (body, scripts existentes, styles) se preserva intacto.

- [ ] **Step A.2.2: Rellenar `layout.meta.description` en es.ts/en.ts**

Leer el valor actual de meta description en Layout.astro pre-cambio (era `"Kevin González — FullStack Developer colombiano. Construyo SaaS, integro IA en productos reales y lidero equipos de implementación. Bucaramanga, Colombia."`).

Editar `src/i18n/es.ts`:
```ts
layout: {
  meta: {
    description: "Kevin González — FullStack Developer colombiano. Construyo SaaS, integro IA en productos reales y lidero equipos de implementación. Bucaramanga, Colombia.",
  },
},
```

Editar `src/i18n/en.ts`:
```ts
layout: {
  meta: {
    description: "Kevin González — Colombian FullStack Developer. I build SaaS, integrate AI into real products, and lead implementation teams. Bucaramanga, Colombia.",
  },
},
```

- [ ] **Step A.2.3: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints`. 3 pages (sin /en/* aún). `Astro.currentLocale` retorna `'es'` por default.

- [ ] **Step A.2.4: Verificar greps**

Run: `grep -c "Astro.currentLocale" src/layouts/Layout.astro`
Expected: ≥ 1.

Run: `grep -c "hreflang" src/layouts/Layout.astro`
Expected: 3 (es, en, x-default).

- [ ] **Step A.2.5: Commit**

```bash
git add src/layouts/Layout.astro src/i18n/es.ts src/i18n/en.ts
git commit -m "feat(layout): dynamic html lang + hreflang tags + i18n meta description

- <html lang> reads Astro.currentLocale.
- 3 hreflang link tags (es, en, x-default → es).
- <title> + meta description via t() helper.
- src/i18n/{es,en}.ts: layout.meta.description traducida."
```

---

### Task A.3: Crear páginas EN mirror

**Files:**
- Create: `src/pages/en/index.astro`
- Create: `src/pages/en/me.astro`
- Create: `src/pages/en/contact.astro`

- [ ] **Step A.3.1: Leer pages ES actuales para mirror**

Run: `cat src/pages/index.astro src/pages/me.astro src/pages/contact.astro`

Anotar el shape: cada página importa Layout + componentes, pasa `title` + `hrefs` al Navbar. La estructura es idéntica entre las 3 (cambia solo qué `Main` se importa y qué `hrefs` se pasan).

- [ ] **Step A.3.2: Crear `src/pages/en/index.astro`**

```astro
---
import Layout from "../../layouts/Layout.astro";
import Navbar from "../../components/Navbar.astro";
import Sidebar from "../../components/Sidebar.astro";
import SideComponent from "../../components/SideComponentMain.astro";
import Main from "../../components/Home.astro";
import Footer from "../../components/Footer.astro";
import { tFor } from "../../i18n";
const t = tFor(Astro);
---
<Layout title={t('pages.home.title')}>
  <Navbar slot="navbar" hrefs={{
    [t('nav.me')]: "/en/me",
    [t('nav.contact')]: "/en/contact",
  }} />
  <Sidebar slot="sidebar">
    <SideComponent slot="side-component" />
  </Sidebar>
  <Main slot="main"></Main>
  <Footer slot="footer" />
</Layout>
```

- [ ] **Step A.3.3: Crear `src/pages/en/me.astro`**

Mirror del ES con paths prefijados:

```astro
---
import Layout from "../../layouts/Layout.astro";
import Navbar from "../../components/Navbar.astro";
import Sidebar from "../../components/Sidebar.astro";
import SideComponent from "../../components/SideComponentMain.astro";
import Main from "../../components/Me.astro";
import Footer from "../../components/Footer.astro";
import { tFor } from "../../i18n";
const t = tFor(Astro);
---
<Layout title={t('pages.me.title')}>
  <Navbar slot="navbar" hrefs={{
    [t('nav.home')]: "/en",
    [t('nav.contact')]: "/en/contact",
  }} />
  <Sidebar slot="sidebar">
    <SideComponent slot="side-component" />
  </Sidebar>
  <Main slot="main"></Main>
  <Footer slot="footer" />
</Layout>
```

- [ ] **Step A.3.4: Crear `src/pages/en/contact.astro`**

```astro
---
import Layout from "../../layouts/Layout.astro";
import Navbar from "../../components/Navbar.astro";
import Sidebar from "../../components/Sidebar.astro";
import SideComponent from "../../components/SideComponentMain.astro";
import Main from "../../components/Contact.astro";
import Footer from "../../components/Footer.astro";
import { tFor } from "../../i18n";
const t = tFor(Astro);
---
<Layout title={t('pages.contact.title')}>
  <Navbar slot="navbar" hrefs={{
    [t('nav.home')]: "/en",
    [t('nav.me')]: "/en/me",
  }} />
  <Sidebar slot="sidebar">
    <SideComponent slot="side-component" />
  </Sidebar>
  <Main slot="main"></Main>
  <Footer slot="footer" no_top_foot={true}/>
</Layout>
```

(El prop `no_top_foot={true}` del Footer se preserva igual al ES contact page.)

- [ ] **Step A.3.5: Actualizar pages ES para usar `t()` también**

Editar `src/pages/index.astro`:

```astro
---
import Layout from "../layouts/Layout.astro";
import Navbar from "../components/Navbar.astro";
import Sidebar from "../components/Sidebar.astro";
import SideComponent from "../components/SideComponentMain.astro";
import Main from "../components/Home.astro";
import Footer from "../components/Footer.astro";
import { tFor } from "../i18n";
const t = tFor(Astro);
---
<Layout title={t('pages.home.title')}>
  <Navbar slot="navbar" hrefs={{
    [t('nav.me')]: "/me",
    [t('nav.contact')]: "/contact",
  }} />
  <Sidebar slot="sidebar">
    <SideComponent slot="side-component" />
  </Sidebar>
  <Main slot="main"></Main>
  <Footer slot="footer" />
</Layout>
```

Editar `src/pages/me.astro` (mismo patrón, `nav.home`/`nav.contact`, `pages.me.title`):

```astro
---
import Layout from "../layouts/Layout.astro";
import Navbar from "../components/Navbar.astro";
import Sidebar from "../components/Sidebar.astro";
import SideComponent from "../components/SideComponentMain.astro";
import Main from "../components/Me.astro";
import Footer from "../components/Footer.astro";
import { tFor } from "../i18n";
const t = tFor(Astro);
---
<Layout title={t('pages.me.title')}>
  <Navbar slot="navbar" hrefs={{
    [t('nav.home')]: "/",
    [t('nav.contact')]: "/contact",
  }} />
  <Sidebar slot="sidebar">
    <SideComponent slot="side-component" />
  </Sidebar>
  <Main slot="main"></Main>
  <Footer slot="footer" />
</Layout>
```

Editar `src/pages/contact.astro`:

```astro
---
import Layout from "../layouts/Layout.astro";
import Navbar from "../components/Navbar.astro";
import Sidebar from "../components/Sidebar.astro";
import SideComponent from "../components/SideComponentMain.astro";
import Main from "../components/Contact.astro";
import Footer from "../components/Footer.astro";
import { tFor } from "../i18n";
const t = tFor(Astro);
---
<Layout title={t('pages.contact.title')}>
  <Navbar slot="navbar" hrefs={{
    [t('nav.home')]: "/",
    [t('nav.me')]: "/me",
  }} />
  <Sidebar slot="sidebar">
    <SideComponent slot="side-component" />
  </Sidebar>
  <Main slot="main"></Main>
  <Footer slot="footer" no_top_foot={true}/>
</Layout>
```

- [ ] **Step A.3.6: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints`. **6 pages generated:** `/`, `/me`, `/contact`, `/en`, `/en/me`, `/en/contact`.

- [ ] **Step A.3.7: Verificar URLs en dist**

Run: `find .vercel/output/static -name "*.html" | sort`
Expected: 6 archivos HTML (en directorios `/`, `/me/`, `/contact/`, `/en/`, `/en/me/`, `/en/contact/`).

- [ ] **Step A.3.8: Commit**

```bash
git add src/pages/
git commit -m "feat(i18n): add /en/* page mirrors + use t() for titles + nav

- src/pages/en/{index,me,contact}.astro: mirror del ES con hrefs
  prefijadas /en/* y title/nav labels via t() helper.
- src/pages/{index,me,contact}.astro: actualizado para usar t() también
  (consistencia + bilingual ready).
- nav.home/me/contact + pages.{home,me,contact}.title ya están en i18n
  skeleton desde Task A.1; en este task solo se consumen."
```

---

## Bucket B — Copy translation (5 commits)

### Task B.1: Wire Sidebar + Tools + minor components

**Files:**
- Modify: `src/components/Sidebar.astro` ("Disponible" → t)
- Modify: `src/components/Tools.astro` (aria-label "Silenciar/Activar música" → t)
- Modify: `src/components/Hexagon.astro` ("Bloqueado" → t)
- Modify: `src/components/Card.astro` ("Ver más →" → t)
- Modify: `src/i18n/es.ts` y `en.ts` (añadir keys)

- [ ] **Step B.1.1: Añadir keys a i18n/es.ts y en.ts**

Editar `src/i18n/es.ts`, añadir bloques `sidebar` (parcial) y `home.casos` (parcial, solo CTA) y `home.techs` (parcial, solo hexLockedLabel):

```ts
export default {
  layout: { meta: { description: "..." } }, // ya existente
  pages: { /* ya existente */ },
  nav: { /* ya existente */ },
  tools: {
    muteAria: "Silenciar/Activar música",
    localeToggleAria: "Cambiar idioma",
  },
  sidebar: {
    statusAvailable: "Disponible",
  },
  home: {
    casos: { cardCta: "Ver más →" },
    techs: { hexLockedLabel: "Bloqueado" },
  },
} as const;
```

Editar `src/i18n/en.ts`:

```ts
export default {
  layout: { meta: { description: "..." } },
  pages: { /* ya existente */ },
  nav: { /* ya existente */ },
  tools: {
    muteAria: "Mute/Unmute music",
    localeToggleAria: "Switch language",
  },
  sidebar: {
    statusAvailable: "Available",
  },
  home: {
    casos: { cardCta: "See more →" },
    techs: { hexLockedLabel: "Locked" },
  },
} as const;
```

- [ ] **Step B.1.2: Modificar Sidebar.astro**

Leer estado actual:
```bash
grep -n "Disponible" src/components/Sidebar.astro
```

Localizar línea con `<span>Disponible</span>`. Añadir import `tFor` al frontmatter y reemplazar:

```astro
---
import { tFor } from "../i18n";
const t = tFor(Astro);
---

<aside class="flex relative fixed j_sb unselected">
  <!-- ... -->
  <a href="/contact" id="avilable" class="Poppins-R flex">
    <strong>•</strong>
    <span>{t('sidebar.statusAvailable')}</span>
  </a>
</aside>
```

(El href `/contact` queda hardcoded por ahora — en EN routes el sidebar también apunta a `/contact` que el inline detect script redirige a `/en/contact` si el visitante está en EN. Alternativa: usar `getAlternatePath`. Decisión: simple, dejar `/contact` — el redirect inicial maneja el caso. Si en producción se ve confuso, follow-up.)

- [ ] **Step B.1.3: Modificar Tools.astro — aria-label**

Frontmatter ya vacío. Añadir import:

```astro
---
import { tFor } from "../i18n";
const t = tFor(Astro);
---
```

Localizar línea con `aria-label="Silenciar/Activar música"` y reemplazar:

```astro
<button id="mute-button" aria-label={t('tools.muteAria')}>
```

- [ ] **Step B.1.4: Modificar Hexagon.astro**

Localizar `<p>Bloqueado</p>` en el bloque `<>` cuando `src` es null:

```astro
---
import { tFor } from "../i18n";
const t = tFor(Astro);

interface Props {
    src?: string;
    title?: string
}

const { src, title } = Astro.props;
// ... resto preservado
---

<!-- ... markup preservado, excepto: -->
<p>{t('home.techs.hexLockedLabel')}</p>
```

- [ ] **Step B.1.5: Modificar Card.astro**

Localizar línea con `<span class="mg-cta Poppins-S">Ver más →</span>`:

```astro
---
// ... imports existentes ...
import { tFor } from "../i18n";
const t = tFor(Astro);
// ... resto del frontmatter preservado ...
---

<!-- ... markup preservado, excepto la línea del CTA: -->
<span class="mg-cta Poppins-S">{t('home.casos.cardCta')}</span>
```

- [ ] **Step B.1.6: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints`. 6 pages.

- [ ] **Step B.1.7: Commit**

```bash
git add src/i18n/es.ts src/i18n/en.ts src/components/Sidebar.astro src/components/Tools.astro src/components/Hexagon.astro src/components/Card.astro
git commit -m "feat(i18n): wire t() in Sidebar + Tools + Hexagon + Card

- sidebar.statusAvailable, tools.{muteAria,localeToggleAria},
  home.casos.cardCta, home.techs.hexLockedLabel keys added.
- 4 components consume tFor(Astro) helper."
```

---

### Task B.2: Wire HomeHero + HomeProjects + HomeTechs

**Files:**
- Modify: `src/components/home/HomeHero.astro`
- Modify: `src/components/home/HomeProjects.astro`
- Modify: `src/components/home/HomeTechs.astro`
- Modify: `src/i18n/es.ts` y `en.ts` (añadir bloques home.hero, home.casos completo, home.techs completo)

- [ ] **Step B.2.1: Leer copy actual de HomeHero**

Run: `cat src/components/home/HomeHero.astro`

Anotar el contenido del paragraph principal (con el quirk "me siento un poco dios creando cosas") y el heading si lo hay.

- [ ] **Step B.2.2: Añadir keys a i18n/es.ts**

Localizar el bloque `home:` y expandirlo. Añadir `hero`, completar `casos`, completar `techs`:

```ts
home: {
  hero: {
    // Copy completo del paragraph actual de HomeHero.astro, verbátim.
    // El paragraph tiene inline HTML (<br />, <strong>, etc.) — preservar al copiar.
    // Estructura sugerida (depende del actual): heading separado de body.
    heading: "/* COPY ACTUAL del <h1> o equivalente */",
    body: "/* COPY ACTUAL del paragraph, preservando <br /> inline si los hay */",
  },
  casos: {
    title: "CASOS",
    titleHover: "Real",
    cardCta: "Ver más →",  // ya existente desde B.1
    linkedinAnchor: "Más en LinkedIn ",
  },
  techs: {
    title: "BAGAJE",
    titleHover: "Mi",
    aboutMeAnchor: "Sobre mí ",
    hexLockedLabel: "Bloqueado",  // ya existente desde B.1
  },
},
```

**Instrucción al implementer:** leer `src/components/home/HomeHero.astro` y extraer el copy completo verbátim al campo `body`. Si el copy tiene inline HTML (`<br />`, `<strong>`, etc.), preservarlo en el string del i18n. La componente luego usa `set:html` para renderearlo.

- [ ] **Step B.2.3: Añadir keys a i18n/en.ts**

Traducir cada key del bloque `home`. Política:

- `hero.heading`: traducir natural.
- `hero.body`: traducir natural preservando estructura HTML inline. Quirks específicos:
  - "me siento un poco dios creando cosas" → "I feel a bit like a god creating things"
  - Otras frases coloquiales: traducir manteniendo intención
- `casos.title`: "CASES" (en mayúscula como ES).
- `casos.titleHover`: "Real" (universal, palabra inglesa).
- `casos.cardCta`: "See more →".
- `casos.linkedinAnchor`: "More on LinkedIn ".
- `techs.title`: "SKILLS" (en mayúscula).
- `techs.titleHover`: "My".
- `techs.aboutMeAnchor`: "About me ".

```ts
home: {
  hero: {
    heading: "/* traducción natural del heading ES */",
    body: "/* traducción natural del body ES, preservando estructura HTML */",
  },
  casos: {
    title: "CASES",
    titleHover: "Real",
    cardCta: "See more →",
    linkedinAnchor: "More on LinkedIn ",
  },
  techs: {
    title: "SKILLS",
    titleHover: "My",
    aboutMeAnchor: "About me ",
    hexLockedLabel: "Locked",
  },
},
```

- [ ] **Step B.2.4: Modificar HomeHero.astro**

Reemplazar copy hardcoded por `t()` calls. Si el body tiene inline HTML, usar `set:html`:

```astro
---
// ... imports existentes preservados ...
import { tFor } from "../../i18n";
const t = tFor(Astro);
---

<section id="hero">
  <h1 class="Dela">{t('home.hero.heading')}</h1>
  <p class="Poppins-R" set:html={t('home.hero.body')}></p>
  <!-- ... resto del markup preservado ... -->
</section>
```

- [ ] **Step B.2.5: Modificar HomeProjects.astro**

Localizar headers y anchors actuales (en `src/components/home/HomeProjects.astro`):

```astro
---
import Card from "../Card.astro";
import Anchor from "../Anchor.astro";
import { cases } from "../../data/cases";
import { tFor } from "../../i18n";

function zoneFor(idx: number, total: number) { /* preservado */ }

const t = tFor(Astro);
const locale = Astro.currentLocale === 'en' ? 'en' : 'es';
---

<section id="casos">
  <h2 class="Dela"><span class="hidden_text">{t('home.casos.titleHover')}</span> {t('home.casos.title')}</h2>
  <div class="casos-cards">
    {
      cases.map((caseItem, idx) => {
        const zones = zoneFor(idx, cases.length);
        return (
          <div class="casos-slot">
            <Card
              text={caseItem.text[locale]}
              href={caseItem.href}
              company={caseItem.company}
              role={caseItem.role[locale]}
              period={caseItem.period}
              cover={caseItem.cover}
              bgColor={caseItem.bgColor}
              txtColor={caseItem.txtColor}
              tags={caseItem.tags}
              zoneLeft={zones.zoneLeft}
              zoneRight={zones.zoneRight}
              zoneVert={zones.zoneVert}
            />
          </div>
        );
      })
    }
  </div>
  <!-- Anchor "Más en LinkedIn" si está visible — preservar markup pero text via t() -->
  <!-- (Si está comentado, dejar comentado) -->
</section>
<!-- ... script + style preservados ... -->
```

**Importante:** `caseItem.text[locale]` y `caseItem.role[locale]` asumen que `cases.ts` ya está refactorizado a bilingual. Eso ocurre en Task B.3 — orden de ejecución: B.3 ANTES de B.2 para evitar build failure intermedio. Reordenar tasks si necesario.

**Decisión:** Hacer B.3 ANTES de este B.2 para que el código de B.2 ya pueda asumir cases.ts bilingual. Voy a renombrar para claridad:

> **NOTA AL IMPLEMENTER:** Si llegas a este task antes que B.3 (cases.ts refactor), `caseItem.text` es string (no objeto). Adapta temporalmente: `text={caseItem.text}` y `role={caseItem.role}`. Después B.3 vuelve a `[locale]`. O mejor: ejecuta B.3 ANTES de B.2 (orden recomendado: B.1 → B.3 → B.2 → ...).

- [ ] **Step B.2.6: Modificar HomeTechs.astro**

Localizar header actual y el `<Anchor>` con texto "Sobre mí":

```astro
---
import Hexagon from "../Hexagon.astro";
import Anchor from "../Anchor.astro";
import { hexagonSlots } from "../../data/technologies";
import { tFor } from "../../i18n";

const s = "120px";
const r = 1;
const mv = "5px";
const t = tFor(Astro);
---

<section id="techs">
  <h2 class="Dela">
    <span class="hidden_text">{t('home.techs.titleHover')}</span> {t('home.techs.title')}
  </h2>
  <div class="techs_container grid unselected">
    <ul>
      {hexagonSlots.map((slot) =>
        slot ? <Hexagon src={slot.src} title={slot.title} /> : <Hexagon />
      )}
    </ul>
  </div>
</section>

<blockquote class="text_center">
  <Anchor
    href="/me"
    text={t('home.techs.aboutMeAnchor')}
    max_font_size="7rem"
    min_font_size="2rem"
    bgHeight="7.5rem"
    svgh={76}
    svgw={75}
    svg={true}
    responsive={true}
  />
</blockquote>

<!-- ... script + style preservados ... -->
```

**Nota sobre href del Anchor:** `/me` queda hardcoded. Para EN, el inline auto-detect script redirige `/me` → `/en/me` si user es EN. Misma estrategia que sidebar. Alternativa: usar `getAlternatePath()` para que el Anchor apunte ya a `/en/me` cuando se rendea bajo `/en/`. Decisión: usar `getAlternatePath` para limpieza:

```astro
---
import { tFor, getAlternatePath, type Locale } from "../../i18n";

const locale: Locale = Astro.currentLocale === 'en' ? 'en' : 'es';
const meHref = getAlternatePath('/me', locale);
---

<Anchor href={meHref} text={t('home.techs.aboutMeAnchor')} /* resto props */ />
```

Aplicar misma pattern al `/contact` del LinkedIn anchor en HomeProjects si descomentado.

- [ ] **Step B.2.7: Verificar build**

Run: `npm run build`
Expected: `0/0/0`. **Bloqueante:** si Casos cards no renderean (porque `caseItem.text` es string en cases.ts pre-B.3), saltarse al Task B.3 antes y volver.

- [ ] **Step B.2.8: Commit**

```bash
git add src/i18n/es.ts src/i18n/en.ts src/components/home/
git commit -m "feat(i18n): wire t() in Home sections (Hero + Projects + Techs)

- home.hero.{heading,body} keys with ES copy verbatim + EN translation
  preserving quirk 'god creating things'.
- home.casos.{title,titleHover,linkedinAnchor} keys.
- home.techs.{title,titleHover,aboutMeAnchor} keys.
- HomeHero, HomeProjects, HomeTechs consume tFor(Astro).
- HomeProjects: caseItem.text[locale] + role[locale] lookup.
- HomeTechs: Anchor href via getAlternatePath() (resolves /me vs /en/me)."
```

---

### Task B.3: Refactor cases.ts to bilingual + adjust HomeProjects consumption

**Files:**
- Modify: `src/data/cases.ts` (interface + 3 entries)
- (Already adjusted in B.2 if order was B.1 → B.3 → B.2)

> **NOTA CRÍTICA AL IMPLEMENTER:** Ejecutar este task ANTES de B.2 si todavía no se hizo. El build falla si `cases.ts` está pre-refactor (`text: string`) y `HomeProjects.astro` ya intenta hacer `caseItem.text[locale]`.

- [ ] **Step B.3.1: Leer estado actual de cases.ts**

Run: `cat src/data/cases.ts`

Anotar las 3 entries actuales con su `text`, `role`, `period`, `company`, etc. — los `text` y `role` actuales están en español.

- [ ] **Step B.3.2: Refactor de la interface + 3 entries**

Sobrescribir `src/data/cases.ts`:

```ts
export interface Case {
  text: { es: string; en: string };
  href: string;
  cover: string;
  bgColor: string;
  txtColor?: string;
  hrefImages?: string[];
  tags: Record<string, string>;
  company: string;
  role: { es: string; en: string };
  period: string;
}

export const cases: Case[] = [
  {
    text: {
      es: "SaaS B2B desde MVP — motor de agentes IA + liderazgo de implementación",
      en: "B2B SaaS from MVP — AI agent engine + implementation leadership",
    },
    company: "Clonai",
    role: {
      es: "FullStack Developer / Líder Implementador",
      en: "FullStack Developer / Implementation Lead",
    },
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
    text: {
      es: "Integración Shopify + IA para generación automatizada de documentos legales",
      en: "Shopify integration + AI for automated legal document generation",
    },
    company: "Campuslands",
    role: {
      es: "FullStack Developer",
      en: "FullStack Developer",
    },
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
    text: {
      es: "Migración Vue + JavaScript → Astro + TypeScript en plataforma productiva",
      en: "Vue + JavaScript → Astro + TypeScript migration on production platform",
    },
    company: "Campuslands",
    role: {
      es: "FullStack Developer",
      en: "FullStack Developer",
    },
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

**Nota:** valores ES preservados exactos del archivo actual. Verificar con `git diff src/data/cases.ts` que solo cambia la estructura (text/role envuelven en objeto), no el contenido literal ES.

- [ ] **Step B.3.3: Verificar build**

Run: `npm run build`
Expected: `0/0/0`. Si falla con TypeScript error porque `HomeProjects.astro` aún tiene `text={caseItem.text}` (sin `[locale]`), saltar a Task B.2 Step B.2.5 y aplicar el cambio. Build después.

- [ ] **Step B.3.4: Commit**

```bash
git add src/data/cases.ts
git commit -m "feat(i18n): cases.ts bilingual — text + role as { es, en }

- Interface Case: text and role fields now { es: string; en: string }.
- 3 cases entries refactored with EN translations.
- ES values preserved verbatim from previous state.
- Other fields (company, period, href, cover, etc.) universales sin cambios."
```

---

### Task B.4: Wire SideComponentMain (sidebar carousel nouns) + FooterTypewriter

**Files:**
- Modify: `src/components/SideComponentMain.astro` (move nouns array to i18n)
- Modify: `src/components/footer/FooterTypewriter.astro` (similar pattern if it has a words array)
- Modify: `src/i18n/es.ts` y `en.ts`

- [ ] **Step B.4.1: Añadir keys**

`src/i18n/es.ts` — añadir bloque `sidebar.carouselNouns` y `footer.typewriterWords`:

```ts
sidebar: {
  statusAvailable: "Disponible",  // ya existente
  vinName: "VIN",  // probablemente queda igual en ambos (proper noun)
  carouselNouns: [
    "Software Developer", "Dev in dev", "Pizza Time", '"FullStack"',
    "Frontend", "Backend", "AI-pilled", "Líder Implementador",
    "Architecture-pilled", "Gamer", "Empanada Lover",
  ],
},
footer: {
  typewriterWords: [ /* leer current array de FooterTypewriter.astro y copiar */ ],
},
```

`src/i18n/en.ts`:

```ts
sidebar: {
  statusAvailable: "Available",
  vinName: "VIN",
  carouselNouns: [
    "Software Developer", "Dev in dev", "Pizza Time", '"FullStack"',
    "Frontend", "Backend", "AI-pilled", "Implementation Lead",
    "Architecture-pilled", "Gamer", "Empanada Lover",
  ],
},
footer: {
  typewriterWords: [ /* traducir el array EN */ ],
},
```

**Nota:** "Líder Implementador" → "Implementation Lead" es el único cambio entre locales en `carouselNouns`. Resto preservado.

- [ ] **Step B.4.2: Modificar SideComponentMain.astro**

Estado actual del archivo tiene array `nouns` hardcoded en el `<script>`. Hay que mover al frontmatter (para que pueda leer del helper) y pasarlo al script via `define:vars`:

```astro
---
import esStrings from "../i18n/es";
import enStrings from "../i18n/en";

const locale = Astro.currentLocale === 'en' ? 'en' : 'es';
const nouns = locale === 'en' ? enStrings.sidebar.carouselNouns : esStrings.sidebar.carouselNouns;
---

<p id="carousel" class="container Poppins-R text_center"></p>

<script define:vars={{ nouns }}>
    const FADE_MS = 600;
    const CYCLE_MS = 20000;

    let lastIndex = -1;
    let cycleIntervalId = null;
    let pendingFadeOut = null;

    function pickNext() {
        let idx;
        do {
            idx = Math.floor(Math.random() * nouns.length);
        } while (idx === lastIndex && nouns.length > 1);
        lastIndex = idx;
        return nouns[idx];
    }

    function initCarousel() {
        // ... resto del script actual preservado, usando `nouns` desde define:vars
    }

    document.addEventListener("astro:page-load", initCarousel);
</script>

<!-- <style> preservado intacto -->
```

**Nota crítica:** al usar `define:vars`, las declaraciones de tipo TypeScript dentro del `<script>` no funcionan (define:vars transpila a JS plain). Por eso `let cycleIntervalId = null` (no `let cycleIntervalId: ReturnType<typeof setInterval> | null = null`).

- [ ] **Step B.4.3: Modificar FooterTypewriter.astro**

Leer estado actual:
```bash
cat src/components/footer/FooterTypewriter.astro
```

Si tiene un array `words` o similar hardcoded, mover al i18n y consumir desde frontmatter via define:vars o desde el script directamente. Aplicar mismo patrón que SideComponentMain.

(Si el componente no tiene array de palabras y solo es 1 frase, simplemente reemplazar el texto hardcoded por `{t('footer.someKey')}`.)

- [ ] **Step B.4.4: Verificar build**

Run: `npm run build`
Expected: `0/0/0`.

- [ ] **Step B.4.5: Commit**

```bash
git add src/i18n/es.ts src/i18n/en.ts src/components/SideComponentMain.astro src/components/footer/FooterTypewriter.astro
git commit -m "feat(i18n): wire t() in sidebar carousel + footer typewriter

- sidebar.carouselNouns bilingual: 'Líder Implementador' (ES) vs
  'Implementation Lead' (EN). Resto de palabras universales.
- footer.typewriterWords bilingual.
- SideComponentMain reads from i18n via define:vars to script.
- FooterTypewriter same pattern."
```

---

### Task B.5: Wire Me sections + Contact + remaining components

**Files:**
- Modify: `src/components/me/MeAbout.astro`
- Modify: `src/components/me/MeWhatIDo.astro`
- Modify: `src/components/me/MeWhereImGoing.astro` (preservar inline link "Código Ninja" → "Ninja Code")
- Modify: `src/components/me/MeLikes.astro` (arrays loves/hates)
- Modify: `src/components/Contact.astro` (headings + form labels + success feedback + hidden locale input)
- Modify: `src/components/Navbar.astro` (si tiene texto interno, no solo el slot de hrefs)
- Modify: `src/components/footer/FooterSocial.astro` (si tiene texto)
- Modify: `src/i18n/es.ts` y `en.ts`

- [ ] **Step B.5.1: Leer copy actual de las 4 Me sections**

```bash
cat src/components/me/MeAbout.astro src/components/me/MeWhatIDo.astro src/components/me/MeWhereImGoing.astro src/components/me/MeLikes.astro
```

Anotar:
- Headers/títulos de cada sección.
- Body paragraphs (preservar inline HTML si presente).
- En MeWhereImGoing: el `<a href="https://es.javascript.info/ninja-code" target="_blank" rel="noopener noreferrer">Código Ninja</a>` — el texto del enlace cambia a "Ninja Code" en EN. El `href` queda igual.
- En MeLikes: arrays `loves` y `hates` con structure `{ text: string, note?: string }`.

- [ ] **Step B.5.2: Añadir bloques `me.about`, `me.whatIDo`, `me.whereImGoing`, `me.likes` a es.ts y en.ts**

ES: copiar verbátim del componente. EN: traducir natural siguiendo política de quirks.

```ts
me: {
  about: {
    heading: /* current */,
    body: /* current con inline HTML preservado */,
  },
  whatIDo: {
    heading: /* current */,
    body: /* current */,
  },
  whereImGoing: {
    heading: /* current */,
    bodyBefore: /* texto antes del link Código Ninja */,
    ninjaCodeLinkText: "Código Ninja",  // EN: "Ninja Code"
    bodyAfter: /* texto después del link */,
  },
  likes: {
    lovesHeading: /* current */,
    hatesHeading: /* current */,
    loves: [
      { text: /* current */, note: /* current si existe */ },
      // ... resto
    ],
    hates: [
      // ...
    ],
  },
},
```

**Política de quirks aplicada:**
- "Empanada Lover" (si aparece en MeLikes): preservar VERBÁTIM en ambos locales.
- "(si me animo)" parenthetical → "(if I feel like it)" en EN.
- "Climas fríos" → "Cold weather".
- Cualquier quirk muy coloquial: traducir manteniendo intención. Si no se puede traducir sin perder gracia → preservar ES con asterisco/glosa.

- [ ] **Step B.5.3: Modificar las 4 Me components**

Cada uno con patrón:

```astro
---
// ... imports existentes preservados ...
import { tFor } from "../../i18n";
const t = tFor(Astro);
---

<!-- markup preservado, reemplazando strings hardcoded por t() -->
<h1>{t('me.about.heading')}</h1>
<p set:html={t('me.about.body')}></p>
```

Para MeWhereImGoing con el link interpolado:

```astro
<p>
  {t('me.whereImGoing.bodyBefore')}
  <a href="https://es.javascript.info/ninja-code" target="_blank" rel="noopener noreferrer">
    {t('me.whereImGoing.ninjaCodeLinkText')}
  </a>
  {t('me.whereImGoing.bodyAfter')}
</p>
```

Para MeLikes:

```astro
---
import esStrings from "../../i18n/es";
import enStrings from "../../i18n/en";
import { tFor } from "../../i18n";

const t = tFor(Astro);
const locale = Astro.currentLocale === 'en' ? 'en' : 'es';
const data = locale === 'en' ? enStrings.me.likes : esStrings.me.likes;
---

<h2>{data.lovesHeading}</h2>
<ul>
  {data.loves.map((item) => (
    <li>{item.text}{item.note ? <span> {item.note}</span> : null}</li>
  ))}
</ul>

<h2>{data.hatesHeading}</h2>
<ul>
  {data.hates.map((item) => /* similar */)}
</ul>
```

(MeLikes lee directo del i18n module bypass del helper `t()` porque maneja arrays nested.)

- [ ] **Step B.5.4: Modificar Contact.astro**

Leer estado actual:
```bash
cat src/components/Contact.astro
```

Añadir keys a i18n:

```ts
contact: {
  heading1: "Dame tu contacto",
  intro: "Siempre estoy abierto a propuestas, ¿tienes alguna?",
  formLabels: {
    nombre: "Nombre",
    email: "E-mail",
    descripcion: "Cuentame el chisme",  // textarea placeholder
    submit: "Enviar",
  },
  successFeedback: "Mensaje recibido. Te respondo pronto.",
  heading2: "... O enviame un e-mail",
  emailIntro: "Puede tardar un poco en que recibas mi respuesta, pero seguro que mas de una semana no vas a tener que esperar",
  emailIntroParen: "(si no es spam, claro)",
},
```

EN translations:

```ts
contact: {
  heading1: "Give me your contact",
  intro: "I'm always open to proposals — got one?",
  formLabels: {
    nombre: "Name",
    email: "E-mail",
    descripcion: "Spill the tea",  // traducción natural del quirk "cuentame el chisme"
    submit: "Send",
  },
  successFeedback: "Message received. I'll reply soon.",
  heading2: "... Or send me an e-mail",
  emailIntro: "It might take a bit for you to get my reply, but for sure you won't have to wait more than a week",
  emailIntroParen: "(if it's not spam, of course)",
},
```

Aplicar `t()` en Contact.astro:

```astro
---
import { tFor } from "../i18n";
const t = tFor(Astro);
---

<article id="contact1" class="Poppins-R flex_col j_c wrap">
  <h1 class="Poppins-S flex all_c">{t('contact.heading1')}</h1>
  <p>{t('contact.intro')}</p>
  <form action="/api/contact" method="POST" class="flex_col j_c wrap">
    <input type="hidden" name="locale" value={Astro.currentLocale ?? 'es'} />
    <div class="flex all_c">
      <div class="inputBox relative">
        <input type="text" name="nombre" id="nombre" maxlength="25" minlength="1" required="" placeholder=" " />
        <label for="nombre">{t('contact.formLabels.nombre')}</label>
      </div>
      <div class="inputBox relative">
        <input type="email" name="email" id="email" required="" placeholder=" " />
        <label for="email">{t('contact.formLabels.email')}</label>
      </div>
    </div>
    <div class="inputBox relative">
      <textarea name="descripcion" id="descripcion" maxlength="500" minlength="1" placeholder={t('contact.formLabels.descripcion')} cols="10" rows="5" required=""></textarea>
    </div>
    <!-- honeypot preservado -->
    <input type="text" name="_gotcha" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" />
    <button id="mensaje" class="Poppins-S" type="submit">{t('contact.formLabels.submit')}</button>
  </form>
</article>

<article id="contact2" class="Poppins-R flex_col j_c wrap">
  <h1 class="Poppins-S">{t('contact.heading2')}</h1>
  <p>
    {t('contact.emailIntro')}<br /><span>{t('contact.emailIntroParen')}</span>.
  </p>
  <a class="Dela all_c" href="mailto:vin.devsito@gmail.com?subject=...">vin.devsito@gmail.com</a>
</article>
```

Actualizar el `<script>` block de success feedback:

```js
function showContactSuccess() {
  if (new URLSearchParams(window.location.search).get("ok") === "1") {
    const intro = document.querySelector("#contact1 > p");
    if (intro) {
      // Read locale-aware feedback from a data attribute set in the template
      intro.textContent = document.getElementById('contact1').dataset.successMsg || 'Mensaje recibido. Te respondo pronto.';
    }
  }
}
```

Y añadir el data attribute en el `<article id="contact1">`:

```astro
<article id="contact1" class="Poppins-R flex_col j_c wrap" data-success-msg={t('contact.successFeedback')}>
```

(Esto evita tener que importar `t()` en el script; el HTML rendered ya tiene el texto correcto en su `data-*`.)

- [ ] **Step B.5.5: Verificar build**

Run: `npm run build`
Expected: `0/0/0`.

- [ ] **Step B.5.6: Commit**

```bash
git add src/i18n/es.ts src/i18n/en.ts src/components/me/ src/components/Contact.astro
git commit -m "feat(i18n): wire t() in Me sections + Contact form

- me.{about,whatIDo,whereImGoing,likes} keys with full ES copy + EN
  translations preserving quirks (Empanada Lover, Código Ninja → Ninja
  Code, etc.).
- contact.{heading1,intro,formLabels.*,successFeedback,heading2,
  emailIntro,emailIntroParen} keys.
- 4 Me components + Contact consume tFor(Astro).
- Contact.astro: hidden locale input + data-success-msg attribute for
  client-side success feedback in correct locale."
```

---

### Task B.6: Wire /api/contact.ts locale-aware messages

**Files:**
- Modify: `src/pages/api/contact.ts`

- [ ] **Step B.6.1: Reemplazar el endpoint**

Localizar `src/pages/api/contact.ts`. Reemplazar el contenido del POST handler para que lea `locale` del formData y use mensajes en ese idioma:

```ts
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

export const prerender = false;

const resend = new Resend(import.meta.env.RESEND_API_KEY);

const messages = {
  es: {
    missingFields: 'Campos requeridos faltantes',
    invalidData: 'Datos inválidos',
    sendFailure: 'Fallo envío',
    fromName: 'Contacto desde Portafolio',
    subject: (n: string) => `Contacto portafolio — ${n}`,
  },
  en: {
    missingFields: 'Required fields missing',
    invalidData: 'Invalid data',
    sendFailure: 'Send failure',
    fromName: 'Portfolio Contact',
    subject: (n: string) => `Portfolio contact — ${n}`,
  },
} as const;

export const POST: APIRoute = async ({ request }) => {
  const data = await request.formData();
  const nombre = String(data.get('nombre') ?? '').trim();
  const email = String(data.get('email') ?? '').trim();
  const descripcion = String(data.get('descripcion') ?? '').trim();
  const gotcha = String(data.get('_gotcha') ?? '');
  const locale = String(data.get('locale') ?? 'es') === 'en' ? 'en' : 'es';
  const m = messages[locale];

  if (gotcha) {
    return Response.redirect(new URL('/contact?ok=1', request.url), 303);
  }

  if (!nombre || !email || !descripcion) {
    return new Response(m.missingFields, { status: 400 });
  }

  if (nombre.length > 25 || descripcion.length > 500) {
    return new Response(m.invalidData, { status: 400 });
  }

  const { error } = await resend.emails.send({
    from: `${m.fromName} <noreply@vindevsito.dev>`,
    to: 'vin.devsito@gmail.com',
    replyTo: email,
    subject: m.subject(nombre),
    text: descripcion,
  });

  if (error) {
    console.error('Resend error:', error);
    return new Response(m.sendFailure, { status: 502 });
  }

  // Redirect to localized contact page
  const successPath = locale === 'en' ? '/en/contact?ok=1' : '/contact?ok=1';
  return Response.redirect(new URL(successPath, request.url), 303);
};
```

**Cambios vs estado actual:**
- Añadido `messages = { es: {...}, en: {...} }` constant.
- Lee `locale` del formData (con fallback `'es'`).
- Todos los strings hardcoded reemplazados por `m.*`.
- `from` ahora interpolado con `m.fromName`.
- Subject usa `m.subject(nombre)`.
- Success redirect va a `/en/contact?ok=1` si locale es `en`.

- [ ] **Step B.6.2: Verificar build**

Run: `npm run build`
Expected: `0/0/0`. El endpoint es server-rendered (no estático), build debe seguir generando función serverless.

- [ ] **Step B.6.3: Commit**

```bash
git add src/pages/api/contact.ts
git commit -m "feat(i18n): /api/contact reads locale from form + sends localized

- Hidden locale input from Contact.astro (added in B.5) is read here.
- messages = { es, en } object with missingFields, invalidData,
  sendFailure, fromName, subject(name).
- Success redirect targets locale-specific path (/contact?ok=1 vs
  /en/contact?ok=1) for correct landing in the chosen locale.
- from: 'Portfolio Contact <noreply@vindevsito.dev>' in EN."
```

---

## Bucket C — Switcher UI + auto-detect (2 commits)

### Task C.1: Inline auto-detect script en Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro` (añadir `<script is:inline>` en `<head>`)

- [ ] **Step C.1.1: Añadir inline script al `<head>`**

Localizar el bloque `<head>` modificado en Task A.2. Insertar el inline script INMEDIATAMENTE DESPUÉS del `<title>` y ANTES del `<ClientRouter />`:

```astro
    <title>{title}</title>

    <script is:inline>
      (function () {
        const STORAGE_KEY = 'portfolio-locale';
        const path = window.location.pathname;
        const onEn = path.startsWith('/en/') || path === '/en';
        const current = onEn ? 'en' : 'es';

        let target;
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'es' || stored === 'en') {
          target = stored;
        } else {
          const lang = (navigator.language || 'en').toLowerCase();
          // EN default for any non-ES browser language (more inclusive internationally)
          target = lang.startsWith('es') ? 'es' : 'en';
          try { localStorage.setItem(STORAGE_KEY, target); } catch (e) { /* private mode */ }
        }

        if (target === current) {
          // Sync localStorage if user navigated manually past auto-detect
          if (stored !== current) {
            try { localStorage.setItem(STORAGE_KEY, current); } catch (e) { /* ignore */ }
          }
          return;
        }

        let newPath;
        if (target === 'en') {
          newPath = '/en' + (path === '/' ? '' : path);
        } else {
          newPath = path.replace(/^\/en(\/|$)/, '/');
          if (newPath === '') newPath = '/';
        }
        window.location.replace(newPath + window.location.search + window.location.hash);
      })();
    </script>

    <ClientRouter />
  </head>
```

- [ ] **Step C.1.2: Verificar build**

Run: `npm run build`
Expected: `0/0/0`. Astro `security.csp: true` hashea el inline script automáticamente.

- [ ] **Step C.1.3: Verificar grep**

Run: `grep -c "portfolio-locale" src/layouts/Layout.astro`
Expected: ≥ 1.

Run: `grep -c "window.location.replace" src/layouts/Layout.astro`
Expected: 1.

- [ ] **Step C.1.4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(i18n): inline auto-detect script in Layout head

Runs before first paint (blocking inline). Logic:
1. Check localStorage 'portfolio-locale'. If set, use it as target.
2. Else inspect navigator.language. If starts with 'es-*' → target ES.
   Otherwise (en, fr, de, pt, etc.) → target EN (more inclusive
   international fallback).
3. If target differs from current path locale, redirect with replace()
   (no history entry).
4. Sync localStorage with manually navigated paths to prevent drift.

CSP: Astro 6 security.csp auto-hashes inline scripts at build time.
Try/catch around localStorage for Safari private mode."
```

---

### Task C.2: Switcher button en Tools.astro

**Files:**
- Modify: `src/components/Tools.astro` (markup + CSS + JS handler)

- [ ] **Step C.2.1: Añadir markup del botón switcher**

Localizar el `<aside id="tools">` y la `<section class="tool" id="audio-control">`. Añadir una SEGUNDA `<section class="tool">` despues del audio-control:

```astro
<aside id="tools" class="flex fixed j_sa glass1">
  <section class="tool" id="audio-control">
    <!-- ... botón mute existente preservado ... -->
  </section>
  <section class="tool" id="locale-control">
    <button id="locale-toggle" aria-label={t('tools.localeToggleAria')}>
      <span class="locale-label">{(Astro.currentLocale === 'en' ? 'en' : 'es').toUpperCase()}</span>
    </button>
  </section>
</aside>
```

(El `t = tFor(Astro)` ya fue añadido en B.1 al frontmatter; reuso.)

- [ ] **Step C.2.2: Añadir CSS para el switcher**

En el `<style>` block de Tools.astro, añadir DESPUÉS de las reglas existentes de `#audio-control`:

```css
#locale-control button {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  cursor: pointer;
  padding: 4px 10px;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  font-family: inherit;
}

#locale-control button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}
```

- [ ] **Step C.2.3: Añadir JS handler al `<script>` block**

Localizar el `<script>` block. Añadir las funciones `initLocaleToggle` y `updateLocaleLabel`, e invocarlas desde `initializeTools`:

```js
function initLocaleToggle() {
  const btn = document.getElementById('locale-toggle');
  if (!btn || btn.dataset.bound === '1') return;
  btn.dataset.bound = '1';
  btn.addEventListener('click', () => {
    const path = window.location.pathname;
    const onEn = path.startsWith('/en/') || path === '/en';
    const target = onEn ? 'es' : 'en';
    try { localStorage.setItem('portfolio-locale', target); } catch (e) { /* ignore */ }
    let newPath;
    if (target === 'en') {
      newPath = '/en' + (path === '/' ? '' : path);
    } else {
      newPath = path.replace(/^\/en(\/|$)/, '/');
      if (newPath === '') newPath = '/';
    }
    window.location.assign(newPath);
  });
}

function updateLocaleLabel() {
  const label = document.querySelector('#locale-toggle .locale-label');
  if (!label) return;
  const onEn = window.location.pathname.startsWith('/en');
  label.textContent = onEn ? 'EN' : 'ES';
}
```

Actualizar `initializeTools()` (función existente) para invocar las nuevas:

```js
function initializeTools() {
  restoreToolsVisibility();
  setupFirstInteractionDetection();
  initAudioControl();
  initLocaleToggle();
  updateLocaleLabel();
}
```

- [ ] **Step C.2.4: Verificar build**

Run: `npm run build`
Expected: `0/0/0`.

- [ ] **Step C.2.5: Verificar greps**

Run: `grep -c "locale-toggle" src/components/Tools.astro`
Expected: ≥ 2 (button id + JS handler refs).

Run: `grep -c "portfolio-locale" src/components/Tools.astro`
Expected: ≥ 1.

- [ ] **Step C.2.6: Commit**

```bash
git add src/components/Tools.astro
git commit -m "feat(i18n): add locale switcher button to Tools

- New <section class='tool' id='locale-control'> with #locale-toggle
  button next to mute audio.
- Visual: ES/EN label uppercase, border + hover glass-coherent.
- Click handler: toggle locale, persist to localStorage, navigate to
  alternate path.
- updateLocaleLabel reads window.location.pathname on each astro:page-load
  (transition:persist of Tools requires JS refresh of label).
- dataset.bound guard prevents double-binding listener across navigations."
```

---

## Final: verificación + PR

### Task F.1: Integral verification (controller)

**Files:** ninguno modificado.

- [ ] **Step F.1.1: Criterios automáticos del spec**

```bash
echo "1. en folder + 3 pages:"
test -d src/pages/en && echo "  en folder: OK"
test -f src/pages/en/index.astro && test -f src/pages/en/me.astro && test -f src/pages/en/contact.astro && echo "  en pages: OK"

echo "2. i18n module + dicts:"
test -f src/i18n/index.ts && test -f src/i18n/es.ts && test -f src/i18n/en.ts && echo "  i18n files: OK"

echo "3. Astro config has i18n:"
grep -c "defaultLocale: 'es'" astro.config.mjs
grep -cE "locales: \[['\"]es['\"], ['\"]en['\"]\]" astro.config.mjs

echo "4. Layout dynamic lang + hreflang:"
grep -c "Astro.currentLocale" src/layouts/Layout.astro
grep -c "hreflang" src/layouts/Layout.astro

echo "5. Componentes consumen i18n:"
grep -rln "from \"../i18n\"\|from \"../../i18n\"" src/components/ src/pages/ | wc -l

echo "6. Switcher en Tools:"
grep -c "locale-toggle" src/components/Tools.astro

echo "7. Auto-detect script en Layout:"
grep -c "portfolio-locale" src/layouts/Layout.astro
grep -c "portfolio-locale" src/components/Tools.astro

echo "8. cases.ts bilingual:"
grep -c "text: {" src/data/cases.ts

echo "9. Build:"
npm run build 2>&1 | tail -3
```

Expected:
- 1: 2× `OK`
- 2: `OK`
- 3: `1`, `1`
- 4: `≥ 1`, `3`
- 5: `≥ 15`
- 6: `≥ 2`
- 7: `1` en Layout, `≥ 1` en Tools
- 8: `3`
- 9: `Complete!`, 6 static pages

- [ ] **Step F.1.2: Confirmar 6 pages generadas**

Run: `find .vercel/output/static -type d -name "en" -o -name "me" -o -name "contact" -o -name "static" | sort`
Expected: directorios para `/`, `/me/`, `/contact/`, `/en/`, `/en/me/`, `/en/contact/`.

- [ ] **Step F.1.3: Push branch**

Run: `git push -u origin bilingual-es-en`
Expected: branch push exitoso. Vercel arranca preview deploy.

- [ ] **Step F.1.4: Obtener URL preview**

Manual: Vercel dashboard → Deployments → branch `bilingual-es-en` → Ready → copiar URL.

---

### Task F.2: Smoke test manual en preview (user-coordinated)

**Files:** ninguno modificado.

Por cada locale (ES y EN):

- [ ] **Step F.2.1: securityheaders.com no regresa**

Manual: https://securityheaders.com/?q=`<preview-url>`
Expected: A+ (CSP nativo Astro 6 sigue hasheando inline scripts correctamente).

- [ ] **Step F.2.2: ES — todas las páginas renderean**

Manual: abrir `<preview-url>/` en Chrome:
- Homepage en español. Hero body en ES. Cards de Casos con `text` y `role` en ES. Sidebar carousel rota palabras ES ("Líder Implementador" aparece). Footer typewriter en ES. Tools muestra "ES" + botón mute.

Manual: `<preview-url>/me`:
- Me sections en español. "Código Ninja" link presente. Likes/Hates en ES con "Empanada Lover" en lista.

Manual: `<preview-url>/contact`:
- Headers en español. Form labels: "Nombre", "E-mail", "Cuentame el chisme", "Enviar". Hidden input `name="locale" value="es"`.

- [ ] **Step F.2.3: EN — todas las páginas renderean**

Manual: `<preview-url>/en`:
- Homepage en inglés. Hero body en EN ("god creating things"). Cards en EN. Sidebar carousel rota con "Implementation Lead". Footer typewriter en EN.

Manual: `<preview-url>/en/me`:
- Me sections en inglés. "Ninja Code" link presente (href igual). "Empanada Lover" verbatim preservado en Likes.

Manual: `<preview-url>/en/contact`:
- Headers en inglés. Form labels: "Name", "E-mail", "Spill the tea", "Send".

- [ ] **Step F.2.4: Switcher button funcional**

En ES (`<preview-url>/`):
- Tools button muestra "ES".
- Click → navega a `/en`. localStorage `portfolio-locale` = "en".

En EN (`/en`):
- Button muestra "EN".
- Click → navega a `/`. localStorage = "es".

- [ ] **Step F.2.5: Auto-detect en primera visita**

Manual: clear localStorage. Chrome DevTools → Application → Storage → Clear.

Cambiar `navigator.language` simulado (DevTools → Sensors → Language → "es-CO"). Recargar `<preview-url>/`:
- Queda en `/` (es-* match).

Cambiar a `en-US`. Clear storage. Recargar `<preview-url>/`:
- Redirect inmediato a `/en/`. localStorage = "en".

Cambiar a `fr-FR`. Clear storage. Recargar `<preview-url>/`:
- Redirect a `/en/` (fallback EN para no-ES). localStorage = "en".

- [ ] **Step F.2.6: Form de contacto end-to-end en EN**

Manual: en `<preview-url>/en/contact`:
- Completar form con datos test.
- Submit.
- Esperar email a `vin.devsito@gmail.com`.
- Verificar email recibido tiene:
  - `Subject: Portfolio contact — <name>` (no "Contacto portafolio")
  - `From: Portfolio Contact <noreply@vindevsito.dev>` (no "Contacto desde Portafolio")
- Verificar redirect: tras submit, page va a `/en/contact?ok=1` (no `/contact?ok=1`).
- Success feedback: el `<p>` cambia a "Message received. I'll reply soon." (no "Mensaje recibido").

- [ ] **Step F.2.7: Form en ES**

Igual que F.2.6 pero en `<preview-url>/contact`. Email con subject ES, from name ES, redirect a `/contact?ok=1`, feedback ES.

- [ ] **Step F.2.8: No-regresión**

Manual: en ambos locales:
- Cards de Casos: liquid glass material, magnetic interaction intactos.
- Sidebar: liquid glass intact.
- Hexágonos: material + shine intactos.
- Audio loop: funciona.
- Cursor custom: intacto.
- `<html lang>` correcto en DevTools Inspector → Elements.

---

### Task F.3: Open PR

- [ ] **Step F.3.1: gh pr create**

```bash
gh pr create --title "feat(i18n): bilingual ES/EN with /en/* routes + switcher (Spec 8)" --body "$(cat <<'EOF'
## Summary

Bilingüe ES/EN completo:
- ES preserva URLs actuales (`/`, `/me`, `/contact`).
- EN agrega `/en`, `/en/me`, `/en/contact`.
- Switcher en `Tools.astro` (junto al audio mute) con auto-detect del browser + persistencia localStorage.
- Quirks culturales preservados verbátim ("Empanada Lover"); resto traducido natural ("Código Ninja" → "Ninja Code", "BAGAJE" → "SKILLS").
- `/api/contact` envía emails con subject/from en locale del form.

3 buckets que shippean juntos:
- **A** — infraestructura (Astro 6 i18n config, helper module, Layout lang dinámico + hreflang SEO, /en/* page mirrors).
- **B** — copy translation (i18n/{es,en}.ts dicts, cases.ts bilingual fields, 15+ componentes consumiendo `tFor()`).
- **C** — switcher UI (inline auto-detect script en Layout antes del paint + button en Tools).

Auto-detect fallback: EN para cualquier browser ≠ `es-*` (más inclusivo internacionalmente).

## Test plan

Por cada locale (ES y EN):
- [ ] securityheaders.com sobre preview URL → A+
- [ ] Homepage / Me / Contact renderean con copy correcto
- [ ] Cards de Casos: `text` y `role` en locale
- [ ] Sidebar carousel: nouns array correcto por locale ("Implementation Lead" en EN)
- [ ] Form submit → email llega con subject/from en locale + redirect a path correcto
- [ ] Switcher button navega entre locales y persiste

Plus:
- [ ] Browser EN o FR/DE/PT, sin localStorage → primera visita redirige a `/en/`
- [ ] Browser ES → queda en `/`
- [ ] `<html lang>` corresponde por route
- [ ] No regresión: cards/sidebar/hex/audio intactos
- [ ] `npm run build` → 0/0/0, 6 static pages

Spec: \`docs/superpowers/specs/2026-05-27-bilingual-es-en-design.md\`
Plan: \`docs/superpowers/plans/2026-05-27-bilingual-es-en.md\`
EOF
)"
```

- [ ] **Step F.3.2: Esperar review + merge**

---

### Task F.4: Post-merge production validation

- [ ] **Step F.4.1: securityheaders.com sobre producción**

Manual: https://securityheaders.com/?q=https://vindevsito.dev/
Expected: A+.

- [ ] **Step F.4.2: Smoke test runtime en producción**

Repetir F.2.2-F.2.8 sobre `https://vindevsito.dev/` y `https://vindevsito.dev/en/`.

- [ ] **Step F.4.3: Limpieza de la branch**

Tras merge:
```bash
git checkout main
git pull --ff-only origin main
git branch -d bilingual-es-en
git push origin --delete bilingual-es-en
```

---

## Resumen de tareas

- **Task 0**: Baseline (4 steps, 0 commits)
- **Bucket A**: A.1 config+helper (6 steps), A.2 Layout (5 steps), A.3 /en pages + ES pages refactor (8 steps) = **3 commits**
- **Bucket B**: B.1 minor components (7 steps), B.2 Home sections (8 steps), B.3 cases.ts (4 steps), B.4 carousel+typewriter (5 steps), B.5 Me + Contact (6 steps), B.6 /api/contact (3 steps) = **6 commits**
- **Bucket C**: C.1 auto-detect (4 steps), C.2 switcher button (6 steps) = **2 commits**
- **Final**: F.1 verificación + F.2 smoke + F.3 PR + F.4 post-merge

**Total commits esperados:** 11 commits atómicos sobre la branch `bilingual-es-en`.
**Tiempo esperado:** 2-3 sesiones (~4-6 horas dispersas).
**Riesgo principal:** Bucket B por volumen de traducción + decisiones editoriales. Plan B: si Bucket B se vuelve unwieldy, partir en sub-PRs por componente (no recomendado — pierde atomicidad).
**Orden crítico:** B.3 ANTES de B.2 (cases.ts bilingual debe existir antes de que HomeProjects lo consuma con `[locale]`).
