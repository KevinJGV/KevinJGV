# Bilingüe ES/EN — Diseño

**Fecha:** 2026-05-27
**Estado:** Diseño aprobado, pendiente plan de implementación
**Spec previo en el roadmap:** `2026-05-27-fix-sidebar-carousel-coordination-design.md` (mergeado a main)
**Spec siguiente en el roadmap:** Backlog declarado (noise effect + toggle, casos display, Pregúntale a mi CV, Features OGG)

---

## Goal

Implementar bilingüe ES/EN completo en el portafolio. ES preserva URLs actuales (`/`, `/me`, `/contact`), EN agrega routes con prefijo `/en/*` (`/en`, `/en/me`, `/en/contact`). Switcher en `Tools.astro` con auto-detect del browser + persistencia en `localStorage`. Traducción natural de copy preservando quirks culturales (verbátim solo casos intraducibles tipo "Empanada Lover").

## Architecture

3 buckets que shippeean juntos en un solo PR (infraestructura + contenido + UI son interdependientes — uno sin los otros no aporta valor).

| Bucket | Scope | Riesgo |
|---|---|---|
| **A — i18n infrastructure** | Astro 6 `i18n` config, estructura `src/pages/en/*`, helper `t()` module, `<html lang>` dinámico, hreflang SEO tags | Medio |
| **B — Copy translation** | Strings centrales en `src/i18n/{es,en}.ts`, `cases.ts` con fields bilingues, todos los componentes leyendo del helper, sidebar `nouns` array bilingual, `/api/contact` locale-aware | Alto (volumen + decisiones de traducción) |
| **C — Switcher UI** | Botón en `Tools.astro` + auto-detect inicial via inline script en Layout + localStorage persistence | Medio |

**Orden de ejecución:** A → B → C (infraestructura primero, contenido encima, UI al final).

**Tech stack:** Astro 6 i18n nativo (`i18n` config + `astro:i18n` module + `Astro.currentLocale`). TypeScript. Cero dependencias nuevas. Cero JS framework adicional.

**Decisiones macro cerradas durante el brainstorm:**

- **Routing:** `defaultLocale: 'es'`, `locales: ['es', 'en']`, `prefixDefaultLocale: false`, `redirectToDefaultLocale: false`. URLs ES sin prefijo (preserva existentes); EN bajo `/en/*`.
- **Data structure:** centralizada en `src/i18n/{es,en}.ts` para UI copy; `cases.ts` y similar data files con sub-objetos `{ es, en }` por field traducible.
- **Switcher UX:** auto-detect browser language + persistir en `localStorage` (key: `portfolio-locale`).
- **Auto-detect fallback:** si el browser language NO empieza con `es-*`, default a `en` (más inclusivo para audiencia internacional). Solo browsers explícitamente ES aterrizan en `/`.
- **Quirks policy:** traducción natural por default. Preservar verbátim solo "Empanada Lover" y quirks culturalmente colombianos. "Código Ninja" → "Ninja Code". "Dios creando cosas" → "god creating things". "Bagaje" → "Skills".
- **`/api/contact` locale handling:** hidden form input + switch de mensajes en endpoint.

---

## Bucket A — i18n infrastructure

### A.1 — Astro config

Añadir bloque `i18n` a `astro.config.mjs`:

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
  security: { /* preservar config existente */ },
  adapter: vercel({ /* preservar config existente */ }),
});
```

Resultado: Astro reconoce 2 locales. URLs `/`, `/me`, `/contact` siguen siendo ES. URLs `/en/`, `/en/me`, `/en/contact` se generan desde `src/pages/en/*`. `Astro.currentLocale` retorna `'es'` o `'en'` según route automáticamente.

### A.2 — Estructura de páginas EN

Crear 3 archivos espejo en `src/pages/en/`:
- `src/pages/en/index.astro`
- `src/pages/en/me.astro`
- `src/pages/en/contact.astro`

Cada archivo es un mirror corto del ES equivalente: importa el mismo Layout + componentes. La diferencia es que `Astro.currentLocale === 'en'` cuando se rendea bajo `/en/*`. Los componentes interiores leen ese locale via `tFor(Astro)` helper.

Ejemplo `src/pages/en/index.astro` (mismo markup que `src/pages/index.astro`):

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

Mismo markup que `src/pages/index.astro` pero hrefs prefijadas con `/en/` y labels traducidos via `t()`.

### A.3 — Helper i18n module

Crear `src/i18n/index.ts`:

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

Los archivos `src/i18n/es.ts` y `src/i18n/en.ts` se crean con esqueleto en Bucket A; se rellenan en Bucket B.

### A.4 — Layout.astro: lang dinámico + hreflang

```astro
---
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
    <!-- Auto-detect locale script (ver C.1) va acá, antes del ClientRouter -->
    <ClientRouter />
  </head>
  <body class="noise flex j_sb">
    <!-- ... resto preservado ... -->
```

### Contrato de Bucket A

- `npm run build` pasa: 6 páginas estáticas (`/`, `/me`, `/contact`, `/en`, `/en/me`, `/en/contact`).
- `Astro.currentLocale` correcto por route.
- `<html lang>` dinámico.
- `<link rel="alternate" hreflang>` tags presentes.
- Helper `t()` / `tFor()` / `getAlternatePath()` exportados y funcionales.
- Cero copy traducido todavía (eso es B). Las páginas `/en/*` renderean con keys placeholder que retornan el key como fallback (señal visible de qué falta traducir).

---

## Bucket B — Copy translation

### B.1 — Estructura `src/i18n/{es,en}.ts`

Objeto nested keyed por scope. Shape (keys finales se definen durante implementación):

```ts
// src/i18n/es.ts
export default {
  layout: {
    meta: {
      description: "Kevin González — FullStack Developer colombiano. Construyo SaaS, integro IA en productos reales y lidero equipos de implementación. Bucaramanga, Colombia.",
    },
  },
  pages: {
    home: { title: "Vin" },
    me: { title: "Sobre mí" },
    contact: { title: "Contacto" },
  },
  nav: {
    home: "Inicio",
    me: "Sobre mí",
    contact: "Contacto",
  },
  sidebar: {
    vinName: "VIN",
    statusAvailable: "Disponible",
    carouselNouns: [
      "Software Developer", "Dev in dev", "Pizza Time", '"FullStack"',
      "Frontend", "Backend", "AI-pilled", "Líder Implementador",
      "Architecture-pilled", "Gamer", "Empanada Lover",
    ],
  },
  tools: {
    muteAria: "Silenciar/Activar música",
    localeToggleAria: "Cambiar idioma",
  },
  home: {
    hero: {
      heading: /* texto actual del HomeHero */,
      body: /* paragraph con quirk 'me siento un poco dios creando cosas' */,
    },
    casos: {
      title: "CASOS",
      titleHover: "Real",
      cardCta: "Ver más →",
      linkedinAnchor: "Más en LinkedIn ",
    },
    techs: {
      title: "BAGAJE",
      titleHover: "Mi",
      aboutMeAnchor: "Sobre mí ",
      hexLockedLabel: "Bloqueado",
    },
  },
  me: {
    about: { /* secciones de MeAbout.astro */ },
    whatIDo: { /* secciones de MeWhatIDo.astro */ },
    whereImGoing: {
      /* segmentar para preservar inline HTML como el link Código Ninja */
      bodyParts: { /* ... */ },
    },
    likes: {
      lovesHeading: /* current */,
      hatesHeading: /* current */,
      lovesItems: [ /* array de objetos { text, note? } */ ],
      hatesItems: [ /* idem */ ],
    },
  },
  contact: {
    heading1: "Dame tu contacto",
    intro: "Siempre estoy abierto a propuestas, ¿tienes alguna?",
    formLabels: {
      nombre: "Nombre",
      email: "E-mail",
      descripcion: "Cuentame el chisme",
      submit: "Enviar",
    },
    successFeedback: "Mensaje recibido. Te respondo pronto.",
    heading2: "... O enviame un e-mail",
    emailIntro: "Puede tardar un poco en que recibas mi respuesta, pero seguro que mas de una semana no vas a tener que esperar",
    emailIntroParen: "(si no es spam, claro)",
  },
  footer: {
    typewriterWords: [ /* array bilingual */ ],
  },
} as const;
```

`src/i18n/en.ts` mismo shape exacto, valores en inglés. `as const` permite inferir tipos exactos para autocomplete del helper `t()`.

### B.2 — `src/data/cases.ts` refactor a bilingüe

`text` y `role` se vuelven objetos `{ es, en }`. `company`, `href`, `cover`, `bgColor`, `txtColor`, `period`, `tags` quedan universales.

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
    // ... resto sin cambios
  },
  // ... 2 entries más con misma estructura bilingual
];
```

`HomeProjects.astro` consume con:
```astro
const locale = Astro.currentLocale === 'en' ? 'en' : 'es';
// ...
text={caseItem.text[locale]}
role={caseItem.role[locale]}
```

`Card.astro` recibe `text: string` y `role: string` (sin cambios en su interface — el padre resuelve locale).

### B.3 — `nouns` array del carousel

Mover el array del literal en `SideComponentMain.astro` al i18n module como bilingüe. El componente lo recibe via `define:vars`.

```astro
---
import { tFor } from "../i18n";
const locale = Astro.currentLocale === 'en' ? 'en' : 'es';
import esStrings from "../i18n/es";
import enStrings from "../i18n/en";
const nouns = locale === 'en' ? enStrings.sidebar.carouselNouns : esStrings.sidebar.carouselNouns;
---

<p id="carousel" class="container Poppins-R text_center"></p>

<script define:vars={{ nouns }}>
  // ... el script existente, ahora `nouns` viene de define:vars en lugar del literal
</script>
```

(Opcional: si `define:vars` no se lleva bien con la lógica de view transition del carousel, alternativa: serializar el array via `data-nouns` attribute en el `<p>` y leerlo desde JS.)

### B.4 — Componentes consumiendo el helper

Patrón uniforme:

```astro
---
import { tFor } from "../i18n";
const t = tFor(Astro);
---

<h2>{t('home.casos.title')}</h2>
```

Archivos a tocar (lista exhaustiva):

- `src/layouts/Layout.astro` (meta description — ya cubierto en A.4)
- `src/components/Navbar.astro` (labels) — pero hrefs vienen de los page files
- `src/components/Sidebar.astro` ("Disponible")
- `src/components/SideComponentMain.astro` (nouns array via i18n)
- `src/components/Tools.astro` (aria-labels — más switcher button en Bucket C)
- `src/components/home/HomeHero.astro`
- `src/components/home/HomeProjects.astro` (heading, anchor text, `caseItem.text[locale]` lookup)
- `src/components/home/HomeTechs.astro` (heading, anchor text)
- `src/components/Card.astro` (CTA "Ver más →")
- `src/components/Hexagon.astro` ("Bloqueado")
- `src/components/me/MeAbout.astro`
- `src/components/me/MeWhatIDo.astro`
- `src/components/me/MeWhereImGoing.astro` (preservar inline HTML del link "Código Ninja"/"Ninja Code")
- `src/components/me/MeLikes.astro` (arrays loves/hates desde i18n)
- `src/components/Contact.astro` (headings, form labels, success feedback, intro paragraphs, hidden locale input)
- `src/components/footer/FooterTypewriter.astro` (typewriter words bilingual)
- `src/components/footer/FooterSocial.astro` (si tiene texto)
- `src/pages/index.astro`, `src/pages/me.astro`, `src/pages/contact.astro` (passing translated `title`)
- `src/pages/en/index.astro`, `src/pages/en/me.astro`, `src/pages/en/contact.astro` (creados en A, ahora consumen `title` traducido)

### B.5 — Endpoint `/api/contact.ts` locale-aware

Hidden input en `Contact.astro`:
```astro
<input type="hidden" name="locale" value={Astro.currentLocale ?? 'es'} />
```

En `src/pages/api/contact.ts`:
```ts
const locale = String(data.get('locale') ?? 'es') === 'en' ? 'en' : 'es';

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
}[locale];

// ... usar messages.* en lugar de strings hardcoded
```

### B.6 — Política de quirks (concreta)

Confirmado del brainstorm:

| Spanish | English |
|---|---|
| "me siento un poco dios creando cosas" | "I feel a bit like a god creating things" |
| "4 nipples 🫣🌰" | "4 nipples 🫣🌰" (universal) |
| "Empanada Lover" | "Empanada Lover" (preservar quirk colombiano) |
| "Código Ninja" link | "Ninja Code" link |
| "BAGAJE" header | "SKILLS" header |
| "CASOS" header | "CASES" header |
| "(Real)" hidden text | "(Real)" (universal) |
| "(Mí/Mi)" hidden text | "(My)" |
| "Pizza Time" | "Pizza Time" (universal) |
| "Líder Implementador" role | "Implementation Lead" role |
| "Software Developer" | "Software Developer" (universal) |

### B.7 — Contenido universal (NO se traduce)

- Proper nouns: "Clonai", "Campuslands", "Vin", nombres de tecnologías (Java, TypeScript, etc.)
- Dates: "02/2025 – 05/2026" (formato numérico universal)
- Email: "vin.devsito@gmail.com"
- URLs y hrefs externos
- Icons (SVGs de tecnologías)
- Easter egg binario en HTML comment (preservar intacto)

### Contrato de Bucket B

- Todos los strings visibles en ES y EN provienen del helper `t()` o de fields bilingues de `cases.ts`.
- `cases.ts` con `text` y `role` bilingues; demás fields universales.
- `nouns` carousel bilingual (~11 entries cada locale, mayoritariamente compartidos).
- `/api/contact` envía emails con subject/from/error messages en locale del form.
- Cero copy ES hardcoded en componentes (verificable con grep dirigido).
- `npm run build` pasa 0/0/0.

---

## Bucket C — Switcher UI + auto-detect

### C.1 — Auto-detect + redirect (Layout.astro `<head>` inline script)

Script blocking que corre ANTES del primer paint, evita flash. Va en el `<head>` de `Layout.astro`, antes del `<ClientRouter />`:

```astro
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
      // EN default for any non-ES browser language (more universal for international audience)
      target = lang.startsWith('es') ? 'es' : 'en';
      try { localStorage.setItem(STORAGE_KEY, target); } catch (e) { /* private mode: ignore */ }
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
```

**Notas:**
- `window.location.replace` → no agrega entry al history, no afecta back-button.
- Try/catch sobre localStorage por private mode (Safari throws).
- `is:inline` → script inyectado tal cual al HTML. Astro 6 `security.csp: true` lo hashea automáticamente para CSP.
- **Auto-detect fallback: EN.** Solo browsers explícitamente `es-*` aterrizan en `/`. Cualquier otro (`fr`, `de`, `pt`, `ja`, undefined, etc.) → `/en/`. Más inclusivo internacionalmente.
- Idempotente: si `target === current`, no redirect.

### C.2 — Switcher button en Tools.astro

Añadir un nuevo `<section class="tool">` junto al `audio-control`:

```astro
---
import { tFor } from "../i18n";
const t = tFor(Astro);
const locale = Astro.currentLocale === 'en' ? 'en' : 'es';
---

<aside id="tools" class="flex fixed j_sa glass1">
  <section class="tool" id="audio-control">
    <!-- ... botón mute existente ... -->
  </section>
  <section class="tool" id="locale-control">
    <button id="locale-toggle" aria-label={t('tools.localeToggleAria')}>
      <span class="locale-label">{locale.toUpperCase()}</span>
    </button>
  </section>
</aside>
```

CSS (añadir al `<style>` de Tools.astro):
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
}

#locale-control button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.5);
}
```

### C.3 — Click handler (Tools.astro `<script>`)

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

// Reuse existing initializeTools pattern (Tools.astro tiene transition:persist)
function initializeTools() {
  // ... existing audio init ...
  initLocaleToggle();
  updateLocaleLabel();
}

document.addEventListener('astro:page-load', initializeTools);
```

`dataset.bound` evita doble registro (transition:persist mantiene el botón entre navegaciones; `initializeTools` corre cada `astro:page-load`).

### Contrato de Bucket C

- Switcher button visible en Tools, muestra locale actual (`ES` o `EN`).
- Click toggles + navega + persiste en localStorage.
- Primera visita sin storage: auto-detect, EN default si browser ≠ `es-*`, persiste preferencia.
- Refresh / navegación: respeta localStorage > browser language.
- Navegación manual a `/en/x`: localStorage se sincroniza a 'en'.
- `transition:persist` de Tools no rompe el listener (guard `dataset.bound`).
- securityheaders.com sigue A+ (script inline hasheado).

### Verificación manual del flow

1. Browser nuevo (sin localStorage), navegador en EN → entra a `/` → redirect a `/en` (sin flash). localStorage = 'en'.
2. Browser nuevo en FR/DE/PT/JP → entra a `/` → redirect a `/en` (default fallback). localStorage = 'en'.
3. Browser nuevo en ES (`es-CO`, `es-ES`, etc.) → entra a `/` → queda en `/`. localStorage = 'es'.
4. Click switcher en `/` → navega a `/en`. localStorage = 'en'.
5. Refresh en `/en` → queda en `/en` (sin redirect loop).
6. Type manual `/en/me` directo en URL → carga `/en/me`. localStorage sincroniza a 'en'.
7. Click switcher en `/en/contact` → navega a `/contact`. localStorage = 'es'.

---

## Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R1** | Astro 6 i18n + `output: 'static'` + adapter Vercel interactúa raro | Baja | context7 confirma compatibilidad. Test temprano en preview. Si falla: `npm run build` da diagnóstico rápido |
| **R2** | Inline script C.1 causa CSP violation porque su hash cambia con cada build | Media | Astro auto-hashea inline scripts en cada build via `security.csp: true`. Si falla: fallback a `scriptDirective.hashes` manual |
| **R3** | Redirect loop en auto-detect | Muy baja → Mitigada | Guard `if (target === current) return` |
| **R4** | localStorage no disponible (Safari private) | Baja | Try/catch incluido. Fallback: detect cada visit (no persiste) |
| **R5** | Keys mal escritas en `t('home.casoss.title')` → retorna key como fallback | Media | `as const` da algo de inferencia. Smoke visual cubre. Follow-up: script CI validador |
| **R6** | Decisiones de traducción ambiguas durante implementación | Media | B.6 lista casos concretos. Regla general: traducción natural + preservar quirks culturales |
| **R7** | URLs `/en/*` no se indexan correctamente | Baja | `hreflang` tags + sitemap. Google descubre via crawl. ~1-2 semanas para indexar |
| **R8** | `transition:persist` de Tools no re-renderea label del locale | Media → Mitigada | `updateLocaleLabel()` en `astro:page-load` listener |
| **R9** | `Astro.currentLocale` undefined en alguna page | Baja | Helper `tFor()` con fallback: `=== 'en' ? 'en' : 'es'` |
| **R10** | Volumen de smoke test ~30 checks (15 por locale × 2) | Media | Aceptado. ~30-45 min estimado |

**Plan de rollback global:** PR único con todos los commits. `git revert <merge-commit>` deja el sitio en estado pre-Spec-8 (solo ES) instantáneamente.

---

## Contrato global

### Funcional

- URLs ES preservadas: `/`, `/me`, `/contact`.
- URLs EN nuevas: `/en`, `/en/me`, `/en/contact`.
- Switcher en Tools.astro permite cambiar entre locales.
- Primera visita: auto-detect, EN default si browser ≠ `es-*`.
- Persistencia en localStorage.
- Form `/api/contact` envía emails en locale del form.

### Visual

- `<html lang>` correcto por route.
- `<title>` traducido.
- Meta description traducida.
- `<link rel="alternate" hreflang>` tags presentes.
- Switcher coherente con aesthetic glass material.

### No-regresión

- Cards de Casos, sidebar liquid glass, hexágonos, carousel — todo intacto.
- Audio loop, cursor custom, navbar/footer — intactos.
- securityheaders.com sigue A+.
- `npm run build` 0/0/0.
- Quirks preservados: "Empanada Lover", "4 nipples 🫣🌰", binary easter egg.

### Criterios de aceptación automáticos

```bash
test -d src/pages/en && echo "en folder: OK"
test -f src/pages/en/index.astro && test -f src/pages/en/me.astro && test -f src/pages/en/contact.astro && echo "en pages: OK"
test -f src/i18n/index.ts && test -f src/i18n/es.ts && test -f src/i18n/en.ts && echo "i18n module: OK"

grep -c "defaultLocale: 'es'" astro.config.mjs
grep -cE "locales: \[['\"]es['\"], ['\"]en['\"]\]" astro.config.mjs

grep -c "Astro.currentLocale" src/layouts/Layout.astro
grep -c "hreflang" src/layouts/Layout.astro

grep -rln "from [\"']../i18n[\"']\|from [\"']../../i18n[\"']" src/components/ src/pages/ | wc -l

grep -c "locale-toggle" src/components/Tools.astro
grep -c "portfolio-locale" src/components/Tools.astro
grep -c "portfolio-locale" src/layouts/Layout.astro

grep -c "text: {" src/data/cases.ts

npm run build
```

### Criterios manuales (smoke en preview)

Por cada locale (ES y EN):

- [ ] securityheaders.com sobre preview URL → A+
- [ ] Homepage renderea con copy en locale correcto
- [ ] Hero, casos cards (text + role), hex tooltips, sidebar carousel, footer typewriter — todos en locale
- [ ] `/me` o `/en/me` con copy traducido
- [ ] `/contact` o `/en/contact` con form labels traducidos
- [ ] Form submit funciona, email llega con subject/from en locale correcto
- [ ] `<html lang>` corresponde
- [ ] Switcher button muestra locale actual
- [ ] Click switcher navega al equivalente
- [ ] Refresh respeta localStorage
- [ ] Browser en FR/DE → primera visita redirige a `/en/`

---

## No-objetivos (explícitos)

- **Más de 2 locales.** Solo ES + EN. Estructura permite agregar futuro pero no se implementa.
- **Currency / date formatting / number localization.** Dates en `cases.ts` quedan universales en formato numérico.
- **RTL support.** No aplica con ES/EN.
- **Server-side detection de Accept-Language header.** Imposible con `output: 'static'`. Detection es client-side via JS inline script.
- **Refactor del routing.** No tocamos slugs, query params ni middleware adicional.
- **CMS / external translation service.** Translations son TS constants en archivos del repo.
- **Pluralización avanzada.** No ICU MessageFormat.
- **Cambio de copy editorial.** Solo traducción del copy existente. No re-redacción del Spanish.
- **Switcher con dropdown / flags / nombres completos.** Solo "ES" / "EN" toggle minimal.
- **Tools.astro refactor.** Ya es ~330 LOC y crece ~30 con switcher. Aceptamos. Refactor en spec futuro si crece más.

---

## Follow-ups esperados

### Polish post-deploy

- Tuning de traducciones específicas si quedan flat tras review humana del EN en producción.
- SEO específico EN (structured data, longer meta, etc.) si traffic justifica.
- Si llega audiencia en otro idioma (PT-BR común para Colombia): agregar `i18n/pt.ts` siguiendo el patrón.

### Backlog continúa

- **Efecto noise + toggle desde Tools** (ahora el switcher de idioma es referencia para sumar otro toggle).
- **Display visual company/role/period en cards de Casos.**
- **Pregúntale a mi CV** (Anthropic SDK).
- **Features OGG** (audio interactivo con `VIN.ogg` / `VINXD.ogg`).

### Hardening / quality

- Script CI que valida que todo `t('key.path')` en codebase tenga key existente en `es.ts` Y `en.ts`. Previene typos.
- Re-evaluar `Tools.astro` (~360 LOC tras switcher) si crece más.

---

## Buckets de implementación

| # | Bucket | Files principales | Commits | Riesgo |
|---|---|---|---|---|
| **A** | i18n infrastructure | `astro.config.mjs`, `src/i18n/{index,es,en}.ts` (esqueleto), `src/layouts/Layout.astro`, `src/pages/en/{index,me,contact}.astro` | 2-3 | Medio |
| **B** | Copy translation | `src/i18n/es.ts` + `en.ts` (rellenar), `src/data/cases.ts` bilingual, ~15 componentes con `tFor()`, `src/pages/api/contact.ts` locale-aware | 4-6 (uno por sección lógica: nav+layout, home, me, contact, footer, api) | Alto |
| **C** | Switcher UI + auto-detect | `src/layouts/Layout.astro` (inline detect script), `src/components/Tools.astro` (button + handler) | 1-2 | Medio |

**Orden:** A → B → C. **Total commits esperados:** ~7-11. **Tiempo:** 2-3 sesiones (~3-5 horas dispersas). **Riesgo principal:** Bucket B por volumen + decisiones editoriales.

---

## Decisiones de diseño cerradas

- **Stack:** Astro 6 i18n nativo + TypeScript. Cero dependencias.
- **Routing:** `defaultLocale: 'es'`, `locales: ['es', 'en']`, `prefixDefaultLocale: false`, `redirectToDefaultLocale: false`.
- **Data structure:** centralizado en `src/i18n/{es,en}.ts`; `cases.ts` bilingüe inline.
- **Switcher UX:** auto-detect + persistir en localStorage.
- **Auto-detect fallback:** EN para cualquier browser ≠ `es-*` (más inclusivo).
- **Quirks policy:** traducción natural + preservar verbátim "Empanada Lover".
- **`/api/contact` locale:** hidden form input.
- **No tests automatizados.**
- **No nuevos JS frameworks / librerías i18n.**
