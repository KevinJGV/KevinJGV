# Vista CV en subdominio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir una vista liviana tipo "CV Harvard" (texto plano, ES/EN, con temas claro/oscuro/sistema y descarga de PDF) servida en el subdominio `cv.vindevsito.dev` del portafolio Astro existente.

**Architecture:** Páginas estáticas autocontenidas bajo `src/pages/cv/`, desacopladas del i18n-routing de Astro (locale explícito). Un layout propio mínimo (sin GSAP/Three) con script anti-flash de tema y variables CSS por `[data-theme]`. Un rewrite por host en `vercel.json` mapea el subdominio a `/cv/`. Todo el contenido vive tipado en `src/data/cv.ts`.

**Tech Stack:** Astro 6 (static), TypeScript, CSS inline/scoped, JS vanilla. Sin dependencias nuevas.

---

## Decisiones de routing y enlaces (leer antes de empezar)

- Páginas: `src/pages/cv/index.astro` (ES, URL `/cv/`) y `src/pages/cv/en/index.astro` (EN, URL `/cv/en/`).
- PDFs descargables en `public/cv/cv-es.pdf` y `public/cv/cv-en.pdf` (servidos en `/cv/cv-es.pdf`, etc.).
- **Enlaces internos RELATIVOS** para que funcionen tanto en dev (`localhost/cv/`) como tras el rewrite del subdominio (raíz = `/cv/`):
  - Página ES (`/cv/`): switcher a EN → `en/`; PDF → `cv-es.pdf`.
  - Página EN (`/cv/en/`): switcher a ES → `../`; PDF → `../cv-en.pdf`.
  - Volver al portafolio: absoluto `https://vindevsito.dev/` (ES) / `https://vindevsito.dev/en` (EN).
- `canonical`/`hreflang`: absolutos del subdominio (`https://cv.vindevsito.dev/` y `https://cv.vindevsito.dev/en/`).
- El rewrite excluye `_astro/`, `_vercel/` y `cv/` para no romper assets bundleados ni doble-prefijar.

## Mapa de archivos

| Archivo | Responsabilidad |
|---|---|
| `src/data/cv.ts` (crear) | Contenido del CV tipado, `es` + `en`. Fuente única de verdad. |
| `public/cv/cv-es.pdf`, `public/cv/cv-en.pdf` (crear) | PDFs originales descargables. |
| `src/components/cv/ThemeToggle.astro` (crear) | Toggle 3 estados claro/oscuro/sistema + JS vanilla + persistencia. |
| `src/layouts/CvLayout.astro` (crear) | Shell mínimo: `<head>`, anti-flash script, variables de tema globales, reset/base. |
| `src/components/cv/CvDocument.astro` (crear) | Cuerpo del CV + toolbar (toggle, switcher, descarga, volver). |
| `src/pages/cv/index.astro` (crear) | Página ES. |
| `src/pages/cv/en/index.astro` (crear) | Página EN. |
| `vercel.json` (modificar) | Añadir `rewrites` por host del subdominio. |

> **Nota de verificación:** el proyecto no tiene framework de tests unitarios. La verificación canónica es `npm run build` (incluye `astro check`) + revisión manual en `npm run dev`/`npm run preview`. Cada tarea usa esos gates.

---

### Task 1: Datos del CV tipados

**Files:**
- Create: `src/data/cv.ts`

- [ ] **Step 1: Crear el archivo de datos con tipos y contenido ES/EN**

```ts
// src/data/cv.ts
// Contenido transcrito de docs/superpowers/.cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_{ES,EN}.pdf
// Fuente única de verdad del texto del CV. El markup mapea sobre estos datos.

export interface CvLink {
  label: string;
  href: string;
}

export interface CvAchievement {
  title: string;
  description: string;
}

export interface CvExperience {
  role: string;
  company: string;
  period: string;
  summary: string;
  achievements: CvAchievement[];
}

export interface CvEducation {
  title: string;
  institution: string;
  period: string;
  location: string;
  description: string;
}

export interface CvSkillGroup {
  category: string;
  items: string;
}

export interface CvUi {
  achievementsLabel: string;
  downloadPdf: string;
  backToPortfolio: string;
  themeLabel: string;
  themeLight: string;
  themeDark: string;
  themeSystem: string;
  switchTo: string; // etiqueta del idioma alternativo (p.ej. "EN")
}

export interface CvData {
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  links: CvLink[];
  profileHeading: string;
  profile: string;
  experienceHeading: string;
  experience: CvExperience[];
  educationHeading: string;
  education: CvEducation[];
  skillsHeading: string;
  skills: CvSkillGroup[];
  ui: CvUi;
}

const links: CvLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/vin-dev" },
  { label: "Github", href: "https://github.com/KevinJGV" },
  { label: "Website", href: "https://vindevsito.dev" },
];

const es: CvData = {
  name: "Kevin Johan González V.",
  title: "FullStack Software Developer",
  email: "vin.devsito@gmail.com",
  phone: "+573178952025",
  location: "Bucaramanga, Colombia",
  links,
  profileHeading: "Perfil",
  profile:
    "Desarrollador FullStack con cerca de 3 años de experiencia, especializado en aportar a los equipos mediante la construcción de arquitecturas escalables (Alta Cohesión y Bajo Acoplamiento) y la integración avanzada de Inteligencia Artificial. Experto en colaborar para modernizar interfaces (React/Astro) y robustecer el backend. Destaco por mi facilidad para trabajar en sintonía con las necesidades del negocio, traduciendo requerimientos complejos en soluciones técnicas eficientes que optimizan los procesos y el éxito general del producto.",
  experienceHeading: "Experiencia Profesional",
  experience: [
    {
      role: "Desarrollador FullStack / Líder Implementador",
      company: "Clonai S.a.s",
      period: "02/2025 – 05/2026",
      summary:
        "Actué como co-creador técnico del producto SaaS desde su fase MVP, liderando el desarrollo de la arquitectura y la lógica de negocio. Posteriormente, dada mi comprensión integral del sistema y tras una reestructuración estratégica, fui seleccionado para asumir el rol de Líder Implementador, combinando el desarrollo técnico continuo con la dirección del equipo de entrega.",
      achievements: [
        {
          title: "Co-creación y Consolidación de Arquitectura",
          description:
            "Lideré el diseño y escalado de las bases del producto abarcando modelado de bases de datos, lógicas de negocio y UI/UX, garantizando un entorno SaaS estable, escalable y alineado a los requerimientos del mercado.",
        },
        {
          title: "Motor de Inteligencia Artificial",
          description:
            "Participé en la estructuración de un motor de agentes autónomos para soporte, apoyando la implementación de tolerancia a fallos multi-LLM y un pipeline dinámico de políticas de seguridad en tiempo real.",
        },
        {
          title: "Liderazgo Técnico y Gestión del Cambio",
          description:
            "Dirigí y capacité al equipo de implementadores bajo una nueva estrategia comercial. Facilité ceremonias ágiles (dailies), coordiné requerimientos directamente con clientes y transmití buenas prácticas de desarrollo para elevar la calidad operativa del área.",
        },
        {
          title: "Estandarización de Procesos",
          description:
            "Ideé y establecí los lineamientos formales del rol de implementación. Desarrollé un sistema de seguimiento centralizado —apoyándome en automatizaciones y Spreadsheets con filtrado dinámico— que aportó orden, control y visibilidad ante los constantes pivotes estratégicos de la startup.",
        },
      ],
    },
    {
      role: "Desarrollador FullStack",
      company: "Campuslands Co-working",
      period: "10/2023 – 02/2025",
      summary:
        "Contribuí al desarrollo de plataformas internas y externas impulsadas por IA, enfocadas en mejorar la gestión comercial, la entrega de servicios digitales y el servicio al cliente.",
      achievements: [
        {
          title: "Entrega Crítica e Impacto de Negocio",
          description:
            "Lideré junto al equipo de diseño UI/UX el rediseño total de la interfaz bajo plazos sumamente estrictos y de alta exigencia. El despliegue exitoso en tiempo récord fue un factor determinante para concretar la validación del producto y asegurar el respaldo económico de un stakeholder clave en una mesa de inversión.",
        },
        {
          title: "Integración E-commerce e IA (Solución a Medida)",
          description:
            "Diseñé un flujo automatizado en Shopify (usando Liquid y GraphQL) conectado a un formulario dinámico y Make.com para superar las limitaciones de la plataforma, logrando la generación y entrega automatizada de documentos legales mediante IA.",
        },
        {
          title: "Refactorización y Migración Profunda",
          description:
            "Ejecuté la transición completa de ecosistemas de JavaScript a TypeScript y de Vue a Astro, asegurando una base de código más robusta y de fácil mantenimiento para el resto del equipo de desarrollo.",
        },
        {
          title: "Rediseño de UI e Integraciones",
          description:
            "Integré pasarelas de pago regionales, dejando la infraestructura lista para modelos de suscripción recurrente.",
        },
      ],
    },
  ],
  educationHeading: "Educación",
  education: [
    {
      title: "Técnico en desarrollo de software",
      institution: "Campuslands S.a.s",
      period: "09/2023 – 02/2025",
      location: "Floridablanca, Colombia",
      description:
        "Formación intensiva y práctica orientada al sector TI. Enfoque dual en habilidades técnicas (Software Skills) y blandas (Soft Skills), complementada con metodologías ágiles, pruebas de rendimiento mensuales, simulacros de entrevistas técnicas y elevator pitches ante expertos.",
    },
  ],
  skillsHeading: "Habilidades",
  skills: [
    { category: "Lenguajes", items: "TypeScript, JavaScript (ES6+), Python, Java, GraphQL, Liquid." },
    { category: "Bases de Datos y BaaS", items: "PostgreSQL, MySQL, Convex, Gestión de ORMs." },
    {
      category: "Herramientas y Automatización",
      items:
        "Git, Diseño de APIs REST, Shopify, Make.com, Hojas de Cálculo Avanzadas (Spreadsheets con automatización y filtrado dinámico).",
    },
    { category: "Frameworks y Librerías", items: "React.js, Astro, Next.js, Node/Express.js, Spring Boot, Tailwind CSS." },
    {
      category: "IA, Arquitectura y Procesamiento",
      items:
        "Integración de LLMs y Agentes Autónomos, Prompt Engineering Avanzado (gestión dinámica de contexto y cápsulas de prompts), Arquitectura de Software (Alta Cohesión y Bajo Acoplamiento), Multithreading.",
    },
    {
      category: "Liderazgo y Metodologías",
      items:
        "Liderazgo Técnico y Mentoría, Gestión de Requerimientos con Clientes, Estandarización de Procesos, Scrum / Metodologías Ágiles.",
    },
  ],
  ui: {
    achievementsLabel: "Logros Clave",
    downloadPdf: "Descargar PDF",
    backToPortfolio: "← Portafolio",
    themeLabel: "Tema",
    themeLight: "Claro",
    themeDark: "Oscuro",
    themeSystem: "Sistema",
    switchTo: "EN",
  },
};

const en: CvData = {
  name: "Kevin Johan González V.",
  title: "FullStack Software Developer",
  email: "vin.devsito@gmail.com",
  phone: "+573178952025",
  location: "Bucaramanga, Colombia",
  links,
  profileHeading: "Profile",
  profile:
    "FullStack Developer with nearly 3 years of experience, specialized in contributing to teams through the construction of scalable architectures (High Cohesion and Low Coupling) and the advanced integration of Artificial Intelligence. Expert in collaborating to modernize interfaces (React/Astro) and strengthen the backend. I stand out for my ability to work in tune with business needs, translating complex requirements into efficient technical solutions that optimize processes and the overall success of the product.",
  experienceHeading: "Professional Experience",
  experience: [
    {
      role: "FullStack Developer / Implementation Lead",
      company: "Clonai S.a.s",
      period: "02/2025 – 05/2026",
      summary:
        "I acted as the technical co-creator of the SaaS product from its MVP phase, leading the development of the architecture and business logic. Subsequently, given my comprehensive understanding of the system and following a strategic restructuring, I was selected to assume the role of Implementation Lead, combining continuous technical development with the direction of the delivery team.",
      achievements: [
        {
          title: "Architecture Co-creation and Consolidation",
          description:
            "I led the design and scaling of the product's foundations, covering database modeling, business logic, and UI/UX, ensuring a stable, scalable SaaS environment aligned with market requirements.",
        },
        {
          title: "Artificial Intelligence Engine",
          description:
            "I participated in the structuring of an autonomous agent engine for support, assisting in the implementation of multi-LLM fault tolerance and a dynamic real-time security policy pipeline.",
        },
        {
          title: "Technical Leadership and Change Management",
          description:
            "I directed and trained the implementation team under a new commercial strategy. I facilitated agile ceremonies (dailies), coordinated requirements directly with clients, and transmitted good development practices to elevate the operational quality of the department.",
        },
        {
          title: "Process Standardization",
          description:
            "I devised and established the formal guidelines for the implementation role. I developed a centralized tracking system—relying on automations and Spreadsheets with dynamic filtering—that brought order, control, and visibility in the face of the startup's constant strategic pivots.",
        },
      ],
    },
    {
      role: "FullStack Developer",
      company: "Campuslands Co-working",
      period: "10/2023 – 02/2025",
      summary:
        "I contributed to the development of internal and external AI-driven platforms, focused on improving commercial management, digital service delivery, and customer service.",
      achievements: [
        {
          title: "Critical Delivery and Business Impact",
          description:
            "I led, alongside the UI/UX design team, the total redesign of the interface under extremely strict and highly demanding deadlines. The successful deployment in record time was a determining factor in materializing product validation and securing the financial backing of a key stakeholder at an investment table.",
        },
        {
          title: "E-commerce and AI Integration (Custom Solution)",
          description:
            "I designed an automated flow in Shopify (using Liquid and GraphQL) connected to a dynamic form and Make.com to overcome the platform's limitations, achieving the automated generation and delivery of legal documents using AI.",
        },
        {
          title: "Deep Refactoring and Migration",
          description:
            "I executed the complete transition of ecosystems from JavaScript to TypeScript and from Vue to Astro, ensuring a more robust and easily maintainable codebase for the rest of the development team.",
        },
        {
          title: "UI Redesign and Integrations",
          description:
            "I integrated regional payment gateways, leaving the infrastructure ready for recurring subscription models.",
        },
      ],
    },
  ],
  educationHeading: "Education",
  education: [
    {
      title: "Software Development Technician",
      institution: "Campuslands S.a.s",
      period: "09/2023 – 02/2025",
      location: "Floridablanca, Colombia",
      description:
        "Intensive and practical training oriented to the IT sector. Dual focus on technical skills (Software Skills) and soft skills (Soft Skills), complemented by agile methodologies, monthly performance tests, technical interview simulations, and elevator pitches to experts.",
    },
  ],
  skillsHeading: "Skills",
  skills: [
    { category: "Languages", items: "TypeScript, JavaScript (ES6+), Python, Java, GraphQL, Liquid." },
    { category: "Databases and BaaS", items: "PostgreSQL, MySQL, Convex, ORM Management." },
    {
      category: "Tools and Automation",
      items:
        "Git, REST API Design, Shopify, Make.com, Advanced Spreadsheets (Spreadsheets with automation and dynamic filtering).",
    },
    { category: "Frameworks and Libraries", items: "React.js, Astro, Next.js, Node/Express.js, Spring Boot, Tailwind CSS." },
    {
      category: "AI, Architecture and Processing",
      items:
        "Integration of LLMs and Autonomous Agents, Advanced Prompt Engineering (dynamic context management and prompt capsules), Software Architecture (High Cohesion and Low Coupling), Multithreading.",
    },
    {
      category: "Leadership and Methodologies",
      items:
        "Technical Leadership and Mentoring, Requirements Management with Clients, Process Standardization, Scrum / Agile Methodologies.",
    },
  ],
  ui: {
    achievementsLabel: "Key Achievements",
    downloadPdf: "Download PDF",
    backToPortfolio: "← Portfolio",
    themeLabel: "Theme",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    switchTo: "ES",
  },
};

export const cv: Record<"es" | "en", CvData> = { es, en };
```

- [ ] **Step 2: Verificar tipos**

Run: `npx astro check`
Expected: 0 errors (puede haber warnings preexistentes ajenos a este archivo).

- [ ] **Step 3: Commit**

```bash
git add src/data/cv.ts
git commit -m "feat(cv): datos tipados del CV (ES/EN)"
```

---

### Task 2: PDFs descargables en public/

**Files:**
- Create: `public/cv/cv-es.pdf` (copia de `docs/superpowers/.cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_ES.pdf`)
- Create: `public/cv/cv-en.pdf` (copia de `docs/superpowers/.cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_EN.pdf`)

- [ ] **Step 1: Copiar y renombrar los PDFs**

```bash
mkdir -p public/cv
cp "docs/superpowers/.cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_ES.pdf" public/cv/cv-es.pdf
cp "docs/superpowers/.cv/KEVIN_JOHAN_GONZÁLEZ_V_CV_EN.pdf" public/cv/cv-en.pdf
```

- [ ] **Step 2: Verificar que existen**

Run: `ls -la public/cv/`
Expected: `cv-es.pdf` y `cv-en.pdf` presentes con tamaño > 0.

- [ ] **Step 3: Commit**

```bash
git add public/cv/cv-es.pdf public/cv/cv-en.pdf
git commit -m "feat(cv): PDFs descargables ES/EN en public/cv"
```

---

### Task 3: Componente ThemeToggle

Toggle de 3 estados (claro / oscuro / sistema). Persiste en `localStorage` con clave `cv-theme` los valores `'light' | 'dark' | 'system'`. En modo `system` escucha cambios de `prefers-color-scheme` en vivo. Resuelve y aplica `data-theme` en `<html>`. Iconos SVG inline con `currentColor`.

**Files:**
- Create: `src/components/cv/ThemeToggle.astro`

- [ ] **Step 1: Crear el componente**

```astro
---
// src/components/cv/ThemeToggle.astro
interface Props {
  labels: { theme: string; light: string; dark: string; system: string };
}
const { labels } = Astro.props;
---

<div class="theme-toggle" role="group" aria-label={labels.theme}>
  <button type="button" data-set-theme="light" aria-label={labels.light} title={labels.light}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="4"></circle>
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19"></path>
    </svg>
  </button>
  <button type="button" data-set-theme="system" aria-label={labels.system} title={labels.system}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <rect x="3" y="4" width="18" height="12" rx="1"></rect>
      <path d="M8 20h8M12 16v4"></path>
    </svg>
  </button>
  <button type="button" data-set-theme="dark" aria-label={labels.dark} title={labels.dark}>
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"></path>
    </svg>
  </button>
</div>

<script is:inline>
  (function () {
    var KEY = "cv-theme";
    var root = document.documentElement;
    var mq = window.matchMedia("(prefers-color-scheme: dark)");

    function stored() {
      var v = localStorage.getItem(KEY);
      return v === "light" || v === "dark" || v === "system" ? v : "system";
    }
    function resolve(pref) {
      if (pref === "light" || pref === "dark") return pref;
      return mq.matches ? "dark" : "light";
    }
    function apply(pref) {
      root.dataset.theme = resolve(pref);
      var buttons = document.querySelectorAll(".theme-toggle [data-set-theme]");
      for (var i = 0; i < buttons.length; i++) {
        var b = buttons[i];
        b.setAttribute("aria-pressed", b.getAttribute("data-set-theme") === pref ? "true" : "false");
      }
    }
    function set(pref) {
      localStorage.setItem(KEY, pref);
      apply(pref);
    }

    apply(stored());

    document.addEventListener("click", function (e) {
      var btn = e.target && e.target.closest ? e.target.closest("[data-set-theme]") : null;
      if (!btn) return;
      set(btn.getAttribute("data-set-theme"));
    });

    mq.addEventListener("change", function () {
      if (stored() === "system") apply("system");
    });
  })();
</script>

<style>
  .theme-toggle {
    display: inline-flex;
    gap: 0.15rem;
    border: 1px solid var(--cv-border);
    border-radius: 999px;
    padding: 0.15rem;
  }
  .theme-toggle button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2rem;
    height: 2rem;
    border: 0;
    border-radius: 999px;
    background: transparent;
    color: var(--cv-text-secondary);
    cursor: pointer;
    transition: color 200ms ease, background-color 200ms ease;
  }
  .theme-toggle button:hover {
    color: var(--cv-text);
  }
  .theme-toggle button[aria-pressed="true"] {
    background: var(--cv-surface);
    color: var(--cv-accent);
  }
  @media (prefers-reduced-motion: reduce) {
    .theme-toggle button {
      transition: none;
    }
  }
</style>
```

- [ ] **Step 2: Verificar tipos**

Run: `npx astro check`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/components/cv/ThemeToggle.astro
git commit -m "feat(cv): ThemeToggle 3 estados con persistencia"
```

---

### Task 4: Layout CvLayout

Shell mínimo independiente. Define en `<head>`: meta, `<title>`, `lang`, canonical, hreflang, **script anti-flash de tema inline ANTES del CSS**, y las variables de tema globales + reset base. No reusa `Layout.astro`.

**Files:**
- Create: `src/layouts/CvLayout.astro`

- [ ] **Step 1: Crear el layout**

```astro
---
// src/layouts/CvLayout.astro
interface Props {
  locale: "es" | "en";
  title: string;
  description: string;
}
const { locale, title, description } = Astro.props;
const canonical = locale === "en" ? "https://cv.vindevsito.dev/en/" : "https://cv.vindevsito.dev/";
---

<!doctype html>
<html lang={locale}>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="alternate" hreflang="es" href="https://cv.vindevsito.dev/" />
    <link rel="alternate" hreflang="en" href="https://cv.vindevsito.dev/en/" />
    <link rel="alternate" hreflang="x-default" href="https://cv.vindevsito.dev/" />

    <!-- Anti-flash: resuelve el tema ANTES de pintar y de cargar el CSS -->
    <script is:inline>
      (function () {
        var pref = localStorage.getItem("cv-theme");
        var sysDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        var resolved = pref === "light" || pref === "dark" ? pref : sysDark ? "dark" : "light";
        document.documentElement.dataset.theme = resolved;
      })();
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  :root,
  [data-theme="light"] {
    --cv-bg: #ffffff;
    --cv-surface: #f3f4f6;
    --cv-text: #111827;
    --cv-text-secondary: #6b7280;
    --cv-border: #e5e7eb;
    --cv-accent: #3b82f6;
  }
  [data-theme="dark"] {
    --cv-bg: #121212;
    --cv-surface: #1e1e1e;
    --cv-text: rgba(255, 255, 255, 0.87);
    --cv-text-secondary: rgba(255, 255, 255, 0.6);
    --cv-border: #333333;
    --cv-accent: #60a5fa;
  }

  * {
    box-sizing: border-box;
  }
  html {
    -webkit-text-size-adjust: 100%;
  }
  body {
    margin: 0;
    background: var(--cv-bg);
    color: var(--cv-text);
    font-family: Georgia, "Times New Roman", Cambria, "Liberation Serif", serif;
    line-height: 1.5;
    transition: background-color 200ms ease, color 200ms ease;
  }
  a {
    color: var(--cv-accent);
    text-decoration: none;
  }
  a:hover {
    text-decoration: underline;
  }
  :focus-visible {
    outline: 2px solid var(--cv-accent);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    body {
      transition: none;
    }
  }
  @media (prefers-contrast: more) {
    [data-theme="dark"] {
      --cv-text: #ffffff;
      --cv-text-secondary: #e0e0e0;
      --cv-bg: #000000;
    }
    :root,
    [data-theme="light"] {
      --cv-text: #000000;
      --cv-bg: #ffffff;
    }
  }
</style>
```

- [ ] **Step 2: Verificar tipos**

Run: `npx astro check`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/CvLayout.astro
git commit -m "feat(cv): CvLayout con anti-flash y variables de tema"
```

---

### Task 5: Componente CvDocument

Cuerpo del CV + toolbar (toggle de tema, switcher de idioma, descarga PDF, volver al portafolio). Recibe `locale` y los hrefs relativos/absolutos calculados por la página.

**Files:**
- Create: `src/components/cv/CvDocument.astro`

- [ ] **Step 1: Crear el componente**

```astro
---
// src/components/cv/CvDocument.astro
import { cv } from "../../data/cv";
import ThemeToggle from "./ThemeToggle.astro";

interface Props {
  locale: "es" | "en";
  pdfHref: string;
  altLangHref: string;
  portfolioHref: string;
}
const { locale, pdfHref, altLangHref, portfolioHref } = Astro.props;
const d = cv[locale];
---

<main class="cv">
  <nav class="toolbar" aria-label="utilidades">
    <a class="back" href={portfolioHref}>{d.ui.backToPortfolio}</a>
    <div class="toolbar-right">
      <a class="lang" href={altLangHref} hreflang={locale === "es" ? "en" : "es"}>{d.ui.switchTo}</a>
      <a class="download" href={pdfHref} download>{d.ui.downloadPdf}</a>
      <ThemeToggle
        labels={{
          theme: d.ui.themeLabel,
          light: d.ui.themeLight,
          dark: d.ui.themeDark,
          system: d.ui.themeSystem,
        }}
      />
    </div>
  </nav>

  <header class="head">
    <h1>{d.name}</h1>
    <p class="role">{d.title}</p>
    <p class="contact">
      <a href={`mailto:${d.email}`}>{d.email}</a>
      <span>·</span>
      <a href={`tel:${d.phone}`}>{d.phone}</a>
      <span>·</span>
      <span>{d.location}</span>
      {d.links.map((l) => (
        <>
          <span>·</span>
          <a href={l.href} target="_blank" rel="noopener noreferrer">{l.label}</a>
        </>
      ))}
    </p>
  </header>

  <section class="block">
    <h2>{d.profileHeading}</h2>
    <p>{d.profile}</p>
  </section>

  <section class="block">
    <h2>{d.experienceHeading}</h2>
    {d.experience.map((job) => (
      <article class="job">
        <div class="job-head">
          <div>
            <h3>{job.role}</h3>
            <p class="company">{job.company}</p>
          </div>
          <p class="period">{job.period}</p>
        </div>
        <p>{job.summary}</p>
        <p class="ach-label">{d.ui.achievementsLabel}:</p>
        <ul>
          {job.achievements.map((a) => (
            <li><strong>{a.title}:</strong> {a.description}</li>
          ))}
        </ul>
      </article>
    ))}
  </section>

  <section class="block">
    <h2>{d.educationHeading}</h2>
    {d.education.map((e) => (
      <article class="edu">
        <div class="job-head">
          <h3>{e.title}</h3>
          <p class="period">{e.period}</p>
        </div>
        <p class="company">{e.institution} · {e.location}</p>
        <p>{e.description}</p>
      </article>
    ))}
  </section>

  <section class="block">
    <h2>{d.skillsHeading}</h2>
    <dl class="skills">
      {d.skills.map((s) => (
        <div class="skill-row">
          <dt>{s.category}</dt>
          <dd>{s.items}</dd>
        </div>
      ))}
    </dl>
  </section>
</main>

<style>
  .cv {
    max-width: 50rem;
    margin: 0 auto;
    padding: 2.5rem 1.25rem 4rem;
  }
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
    font-family: system-ui, sans-serif;
    font-size: 0.85rem;
  }
  .toolbar-right {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
  }
  .lang,
  .download,
  .back {
    color: var(--cv-text-secondary);
  }
  .download {
    border: 1px solid var(--cv-border);
    border-radius: 999px;
    padding: 0.35rem 0.85rem;
  }
  .head {
    text-align: center;
    border-bottom: 2px solid var(--cv-border);
    padding-bottom: 1.25rem;
    margin-bottom: 1.5rem;
  }
  .head h1 {
    margin: 0;
    font-size: 2rem;
    letter-spacing: 0.02em;
  }
  .role {
    margin: 0.25rem 0 0.75rem;
    font-style: italic;
    color: var(--cv-text-secondary);
  }
  .contact {
    margin: 0;
    font-family: system-ui, sans-serif;
    font-size: 0.85rem;
    color: var(--cv-text-secondary);
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    justify-content: center;
  }
  .block {
    margin-top: 1.75rem;
  }
  .block h2 {
    font-size: 1.1rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-bottom: 1px solid var(--cv-border);
    padding-bottom: 0.3rem;
    margin: 0 0 0.85rem;
  }
  .job,
  .edu {
    margin-bottom: 1.25rem;
  }
  .job-head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .job h3,
  .edu h3 {
    margin: 0;
    font-size: 1rem;
  }
  .company {
    margin: 0.1rem 0;
    font-style: italic;
    color: var(--cv-text-secondary);
  }
  .period {
    margin: 0;
    font-family: system-ui, sans-serif;
    font-size: 0.8rem;
    color: var(--cv-text-secondary);
    white-space: nowrap;
  }
  .ach-label {
    margin: 0.6rem 0 0.2rem;
    font-weight: bold;
  }
  ul {
    margin: 0;
    padding-left: 1.1rem;
  }
  li {
    margin-bottom: 0.35rem;
  }
  .skills {
    margin: 0;
  }
  .skill-row {
    display: grid;
    grid-template-columns: 14rem 1fr;
    gap: 0.5rem 1rem;
    padding: 0.35rem 0;
    border-bottom: 1px solid var(--cv-border);
  }
  .skill-row dt {
    font-weight: bold;
  }
  .skill-row dd {
    margin: 0;
    color: var(--cv-text-secondary);
  }
  @media (max-width: 560px) {
    .skill-row {
      grid-template-columns: 1fr;
      gap: 0.15rem;
    }
  }

  @media print {
    .toolbar {
      display: none;
    }
    .cv {
      max-width: none;
      padding: 0;
    }
    :global(body) {
      background: #fff;
      color: #000;
    }
    a {
      color: #000;
    }
  }
</style>
```

- [ ] **Step 2: Verificar tipos**

Run: `npx astro check`
Expected: sin errores nuevos.

- [ ] **Step 3: Commit**

```bash
git add src/components/cv/CvDocument.astro
git commit -m "feat(cv): CvDocument (cuerpo + toolbar)"
```

---

### Task 6: Páginas ES y EN

Páginas finas que componen `CvLayout` + `CvDocument`, pasando locale y los hrefs relativos/absolutos correctos.

**Files:**
- Create: `src/pages/cv/index.astro`
- Create: `src/pages/cv/en/index.astro`

- [ ] **Step 1: Crear la página ES**

```astro
---
// src/pages/cv/index.astro  →  /cv/  (subdominio: cv.vindevsito.dev/)
import CvLayout from "../../layouts/CvLayout.astro";
import CvDocument from "../../components/cv/CvDocument.astro";
import { cv } from "../../data/cv";
const d = cv.es;
---

<CvLayout locale="es" title={`${d.name} — CV`} description={d.profile}>
  <CvDocument
    locale="es"
    pdfHref="cv-es.pdf"
    altLangHref="en/"
    portfolioHref="https://vindevsito.dev/"
  />
</CvLayout>
```

- [ ] **Step 2: Crear la página EN**

```astro
---
// src/pages/cv/en/index.astro  →  /cv/en/  (subdominio: cv.vindevsito.dev/en/)
import CvLayout from "../../../layouts/CvLayout.astro";
import CvDocument from "../../../components/cv/CvDocument.astro";
import { cv } from "../../../data/cv";
const d = cv.en;
---

<CvLayout locale="en" title={`${d.name} — CV`} description={d.profile}>
  <CvDocument
    locale="en"
    pdfHref="../cv-en.pdf"
    altLangHref="../"
    portfolioHref="https://vindevsito.dev/en"
  />
</CvLayout>
```

- [ ] **Step 3: Verificar build completo**

Run: `npm run build`
Expected: build OK. En `dist/` deben existir `dist/cv/index.html` y `dist/cv/en/index.html`.

- [ ] **Step 4: Verificación manual en dev**

Run: `npm run dev` y abrir:
- `http://localhost:4321/cv/` — CV en español, sin flash de tema.
- `http://localhost:4321/cv/en/` — CV en inglés.
- Probar el toggle (claro/oscuro/sistema) y recargar: la elección persiste sin flash.
- Click en "Descargar PDF" → descarga `cv-es.pdf` (en `/cv/`) / `cv-en.pdf` (en `/cv/en/`).
- Switcher de idioma: ES↔EN navega correctamente.

Expected: todo funciona; el switcher y la descarga resuelven bien con los enlaces relativos.

- [ ] **Step 5: Commit**

```bash
git add src/pages/cv/index.astro src/pages/cv/en/index.astro
git commit -m "feat(cv): páginas ES/EN del CV"
```

---

### Task 7: Rewrite por host en vercel.json

Mapear `cv.vindevsito.dev/*` → `/cv/*`, excluyendo `_astro/`, `_vercel/` y `cv/` para no romper assets ni doble-prefijar. Preservar el bloque `headers` existente.

**Files:**
- Modify: `vercel.json`

- [ ] **Step 1: Añadir `rewrites` al inicio del objeto raíz**

Estado actual: `vercel.json` contiene solo `{ "headers": [ ... ] }`. Añadir la clave `rewrites` (el archivo resultante debe ser):

```json
{
  "rewrites": [
    {
      "source": "/((?!_astro/|_vercel/|cv/).*)",
      "has": [{ "type": "host", "value": "cv.vindevsito.dev" }],
      "destination": "/cv/$1"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
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

- [ ] **Step 2: Validar JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('vercel.json','utf8')); console.log('vercel.json OK')"`
Expected: `vercel.json OK`

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat(cv): rewrite por host del subdominio cv.vindevsito.dev"
```

---

### Task 8: Verificación final

- [ ] **Step 1: Build canónico completo**

Run: `npm run build`
Expected: `astro check` sin errores y build exitoso.

- [ ] **Step 2: Preview y checklist manual**

Run: `npm run preview` y verificar en `http://localhost:4321/cv/` y `/cv/en/`:
- [ ] Sin flash de tema incorrecto al recargar en cualquiera de los 3 modos.
- [ ] Toggle claro/oscuro/sistema funciona y persiste (`localStorage` `cv-theme`).
- [ ] En modo "sistema", cambiar el tema del SO actualiza la página en vivo.
- [ ] Contraste cómodo en dark (texto no blanco puro sobre `#121212`).
- [ ] Descarga de PDF correcta por idioma.
- [ ] Switcher ES↔EN navega bien.
- [ ] `Ctrl/Cmd+P` (vista previa de impresión): toolbar oculta, fondo blanco, texto negro, layout limpio.
- [ ] Responsive: en móvil la grilla de habilidades pasa a una columna.

- [ ] **Step 3: Commit final (si quedaron ajustes)**

```bash
git add -A
git commit -m "chore(cv): ajustes finales tras verificación"
```

> **Despliegue (manual del usuario, follow-up):** apuntar `cv.vindevsito.dev` al proyecto en Vercel (DNS + dominio). El rewrite ya queda en el repo.

---

## Notas de cierre

- **Fuera de alcance (follow-up):** enlazado inteligente portafolio ↔ subdominio; configuración DNS/Vercel del subdominio.
- **CSP:** los scripts `is:inline` (anti-flash y toggle) son hasheados automáticamente por `security.csp` de Astro en build; la integración `stripStyleSrcHashes` solo afecta `style-src`, no `script-src`. No se requiere acción.
