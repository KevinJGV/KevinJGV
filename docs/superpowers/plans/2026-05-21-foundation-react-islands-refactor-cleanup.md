# Foundation — React Islands + Refactor + Limpieza — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar la base del portafolio Astro 5 lista para crecer: React Islands disponible, archivos `.js` tipados, componentes grandes partidos en sub-componentes de responsabilidad única, data extraída a archivos tipados, código muerto eliminado. Cero cambios visibles para el visitante.

**Architecture:** Astro 5 con `@astrojs/react` integrado pero sin islas creadas todavía. Componentes `.astro` siguen siendo el default; `.tsx` en `src/components/react/` queda reservado para piezas con estado complejo. Datos hardcodeados en markup migran a `src/data/*.ts`. Scripts grandes embebidos en `.astro` se extraen a `.ts` adyacentes. Estilos globales monolíticos se parten por concern en `src/styles/`.

**Tech Stack:** Astro 5, TypeScript 5, GSAP 3, `@astrojs/react` (a instalar), `@astrojs/vercel` (existente), React 18 + react-dom (a instalar como peer de la integración).

**Spec de referencia:** [docs/superpowers/specs/2026-05-21-foundation-react-islands-refactor-cleanup-design.md](../specs/2026-05-21-foundation-react-islands-refactor-cleanup-design.md)

---

## Verification protocol (aplica a cada tarea con cambio de código)

Antes de marcar una tarea como hecha:
1. `npm run build` pasa sin errores nuevos.
2. Levantar `npm run dev` y verificar visualmente las 3 páginas: `/`, `/me`, `/contact`. Comparar contra baseline (estado anterior al commit).
3. Verificar la animación o interacción afectada por el cambio (si aplica).
4. Commit atómico con el mensaje propuesto.

Si cualquier verificación falla, **no avanzar** — diagnosticar y arreglar antes del commit.

---

## Phase 0: Baseline

### Task 0.1: Baseline de build y screenshots

**Files:** ninguno

- [ ] **Step 1: Verificar baseline de build limpio**

Run: `npm run build 2>&1 | tee /tmp/baseline-build.log`
Expected: completa sin errores. Guardar el log como referencia.

- [ ] **Step 2: Levantar dev server y tomar capturas de baseline (mental o de pantalla)**

Run: `npm run dev`

En el navegador, abrir y observar:
- `http://localhost:4321/`
- `http://localhost:4321/me`
- `http://localhost:4321/contact`

Anotar el comportamiento de:
- Cursor personalizado (motion-cursor) en hover sobre links, botones, nav.
- Dots de fondo (deben aparecer y animarse).
- Cards de proyectos en `/`: hover expande la tarjeta y rota el carrusel.
- Footer: texto dinámico tipo terminal ("Crece tu Marca..."), wheel SVG rotando.
- En `/me`: layout de 4 secciones con animaciones y el player de Spotify.

- [ ] **Step 3: Verificar inventario inicial de tamaños**

Run:
```bash
find src -type f \( -name "*.astro" -o -name "*.ts" -o -name "*.js" -o -name "*.css" \) -exec wc -l {} + | sort -rn | head -25
```

Guardar el output para comparar al final.

- [ ] **Step 4: No hay commit en esta task** (solo baseline).

---

## Phase 1: Setup React Islands

### Task 1.1: Instalar dependencias de React

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Instalar la integración y sus peer deps**

Run:
```bash
npx astro add react -- --yes
```

Este comando hace tres cosas automáticamente:
- Instala `@astrojs/react`, `react`, `react-dom`, `@types/react`, `@types/react-dom`.
- Edita `astro.config.mjs` para añadir `integrations: [react()]`.
- Actualiza `tsconfig.json` si hace falta para JSX.

Si el comando falla o pide confirmación inesperada, abortar e instalar manualmente:
```bash
npm install @astrojs/react react react-dom
npm install -D @types/react @types/react-dom
```

Y editar `astro.config.mjs` a mano (ver Step 2).

- [ ] **Step 2: Verificar `astro.config.mjs`**

Read: `astro.config.mjs`

Debe contener (preservando el adapter de Vercel existente):
```js
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';

export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: vercel({
    webAnalytics: { enabled: true },
    includeFiles: ["src", 'public'],
    functionPerRoute: false,
    maxDuration: 60,
    assets: { upload: true },
    imageService: true,
    middleware: true,
  }),
  vite: {
    build: { rollupOptions: { output: {} } }
  }
});
```

Si `npx astro add` añadió la integración en otro lugar, moverla al objeto principal como muestra el ejemplo.

- [ ] **Step 3: Verificar que la build sigue pasando**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 4: Crear directorio placeholder para componentes React**

Run:
```bash
mkdir -p src/components/react
touch src/components/react/.gitkeep
```

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json astro.config.mjs src/components/react/.gitkeep tsconfig.json
git commit -m "feat: integrate @astrojs/react for selective islands"
```

---

### Task 1.2: Documentar convención en CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Añadir sección de convención de componentes**

Insertar después de la sección "Convenciones" actual en `CLAUDE.md`:

```markdown
## Convención `.astro` vs `.tsx`

| Caso | Usar |
|---|---|
| Contenido estático, layout, sección sin estado | `.astro` |
| Animación GSAP simple disparada en load/scroll | `.astro` (script vanilla) |
| Estado local complejo (formulario multi-paso, filtros, búsqueda en vivo) | `.tsx` con `client:load` o `client:visible` |
| Fetch de API en el navegador con render reactivo | `.tsx` con `client:visible` |
| Microinteracción aislada sin estado | `.astro` con vanilla JS — no justifica una isla |

- Componentes `.astro` viven en `src/components/` (raíz) o `src/components/<page>/` si son específicos de una página.
- Componentes React viven en `src/components/react/` con extensión `.tsx`.
- **Directiva de hidratación por defecto:** `client:visible` salvo razón concreta para `client:load`.
- Tipar `Props` siempre: `interface Props { ... }` en frontmatter `.astro` o tipos explícitos en `.tsx`.

## Datos hardcodeados

Listas de datos (proyectos, tecnologías, configuraciones de tags) viven en `src/data/*.ts` con tipos explícitos. Markup importa esos datos y mapea sobre ellos.
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add .astro vs .tsx convention to CLAUDE.md"
```

---

## Phase 2: Migración `.js` → `.ts`

### Task 2.1: Migrar `dots.js` → `dots.ts`

**Files:**
- Rename: `src/components/dots.js` → `src/components/dots.ts`

- [ ] **Step 1: Renombrar el archivo**

Run:
```bash
git mv src/components/dots.js src/components/dots.ts
```

- [ ] **Step 2: Tipar el contenido**

Reemplazar todo el contenido de `src/components/dots.ts` con:

```ts
import gsap from "gsap";

const dotCount = 10;
const maxSize = 30;
const withScale = true;
const withBlur = true;
const randColour = false;

export const generateDots = (): void => {
  const container = document.querySelector<HTMLElement>("#dot-container");
  if (!container) return;

  for (let i = 0; i < dotCount; i++) {
    const el = document.createElement("div");
    el.classList.add("dot");
    container.appendChild(el);
  }

  const dots = gsap.utils.toArray<HTMLElement>(".dot");

  dots.forEach((dot) => {
    let _xPos = Math.random() * window.innerWidth;
    let _yPos = Math.random() * window.innerHeight;
    let size = Math.ceil(Math.random() * maxSize);
    if (size < 10) size = 50;
    if (_xPos > size) _xPos = _xPos - size;
    if (_yPos > size) _yPos = _yPos - size;
    gsap.set(dot, {
      width: size,
      height: size,
      x: _xPos,
      y: _yPos,
      backgroundColor: randColour
        ? "#" + Math.floor(Math.random() * 16777215).toString(16)
        : "#6c8c65",
      scale: withScale ? Math.random() + 0.25 : 1,
      filter: withBlur ? "blur(1rem)" : "unset",
    });
  });

  gsap
    .timeline({ defaults: { ease: "none", repeat: -1 } })
    .to(dots, {
      xPercent: "random(-100, 100)",
      yPercent: "random(-100, 100)",
      scale: "random(.5, 2)",
      opacity: "random(0, .8)",
      ease: "power1.inOut",
      duration: 6,
      repeatRefresh: true,
    })
    .time(Math.random() * 200);
};

generateDots();
```

Cambios respecto al `.js` original:
- Return type `void` en `generateDots`.
- Guard del container (`#dot-container` ahora puede ser `null` — antes el código asumía que existía).
- `gsap.utils.toArray<HTMLElement>` con tipo explícito.
- Variable `index` no usada en el `forEach` → eliminada.

- [ ] **Step 3: Actualizar referencias si existen**

Run: `grep -rn "dots.js\|dots\\.js" src/ public/ astro.config.mjs`

Si aparece alguna referencia explícita a `dots.js` con extensión, actualizar a `dots.ts` (o sin extensión).

Run: `grep -rn "dots" src/`

Verificar que ningún `import` se rompe. La ausencia de extensión es lo común.

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: sin errores. `astro check` debe pasar.

- [ ] **Step 5: Verificar visualmente que los dots siguen funcionando**

Run: `npm run dev`

Abrir las 3 páginas. Los dots de fondo deben aparecer y animarse igual que antes.

- [ ] **Step 6: Commit**

```bash
git add src/components/dots.ts
git commit -m "refactor: migrate dots.js to TypeScript with explicit types"
```

---

### Task 2.2: Migrar `motion-cursor.js` → `motion-cursor.ts`

**Files:**
- Rename: `src/components/motion-cursor.js` → `src/components/motion-cursor.ts`

- [ ] **Step 1: Renombrar el archivo**

Run:
```bash
git mv src/components/motion-cursor.js src/components/motion-cursor.ts
```

- [ ] **Step 2: Tipar el contenido**

Reemplazar todo el contenido de `src/components/motion-cursor.ts` con:

```ts
interface Position {
  distanceX: number;
  distanceY: number;
  pointerX: number;
  pointerY: number;
}

export default class MotionCursor {
  private root: HTMLElement | null = null;
  private cursor: HTMLElement | null = null;
  private filter: SVGElement | null = null;
  private position!: Position;
  private previousPointerX: number = 0;
  private previousPointerY: number = 0;
  private angle: number = 0;
  private previousAngle: number = 0;
  private angleDisplace: number = 0;
  private readonly degrees: number = 57.296;
  private readonly cursorSize: number = 15;
  private moving: boolean = false;
  private isHovered: boolean = false;
  private isPressed: boolean = false;

  constructor() {
    if (typeof window === "undefined") return;
    this.init();
  }

  private init(): void {
    this.root = document.body;
    this.cursor = document.querySelector<HTMLElement>(".curzr-motion");
    this.filter = document.querySelector<SVGElement>(".curzr-motion .curzr-motion-blur");

    if (!this.cursor || !this.filter) {
      console.error("Cursor elements not found");
      return;
    }

    this.setupProperties();
    this.setupStyles();
    this.setupEventListeners();
  }

  private setupProperties(): void {
    this.position = {
      distanceX: 0,
      distanceY: 0,
      pointerX: 0,
      pointerY: 0,
    };
    this.previousPointerX = 0;
    this.previousPointerY = 0;
    this.angle = 0;
    this.previousAngle = 0;
    this.angleDisplace = 0;
    this.moving = false;
    this.isHovered = false;
    this.isPressed = false;
  }

  private setupStyles(): void {
    if (!this.cursor) return;
    const cursorStyle: Partial<CSSStyleDeclaration> = {
      opacity: "1",
      position: "fixed",
      boxSizing: "border-box",
      top: `${this.cursorSize / -2}px`,
      left: `${this.cursorSize / -2}px`,
      zIndex: "2147483647",
      width: `${this.cursorSize}px`,
      height: `${this.cursorSize}px`,
      borderRadius: "50%",
      overflow: "visible",
      transition: "200ms, transform 20ms",
      userSelect: "none",
      pointerEvents: "none",
    };
    Object.assign(this.cursor.style, cursorStyle);
    this.cursor.removeAttribute("hidden");
  }

  private setupEventListeners(): void {
    this.clearEventListeners();

    const interactiveElements: Element[] = [
      ...document.querySelectorAll("a, button, input, select, textarea"),
      document.querySelector("nav"),
      document.querySelector("#bot-menu"),
    ].filter((el): el is Element => el !== null);

    interactiveElements.forEach((element) => {
      element.addEventListener("mouseenter", () => {
        this.isHovered = true;
        this.updateTransform();
      });
      element.addEventListener("mouseleave", () => {
        this.isHovered = false;
        this.updateTransform();
      });
    });

    document.addEventListener("mousedown", () => {
      this.isPressed = true;
      this.updateTransform();
    });
    document.addEventListener("mouseup", () => {
      this.isPressed = false;
      this.updateTransform();
    });
    document.addEventListener("mouseleave", () => {
      this.isPressed = false;
      this.updateTransform();
    });
  }

  private clearEventListeners(): void {
    const elements = document.querySelectorAll(
      "a, button, input, select, textarea, nav, #bot-menu"
    );
    elements.forEach((element) => {
      element?.replaceWith(element.cloneNode(true));
    });
  }

  public move(event: MouseEvent): void {
    if (!this.cursor || !this.filter) return;

    this.previousPointerX = this.position.pointerX;
    this.previousPointerY = this.position.pointerY;

    this.position.pointerX = event.pageX - window.scrollX;
    this.position.pointerY = event.pageY - window.scrollY;

    this.position.distanceX = Math.min(
      Math.max(this.previousPointerX - this.position.pointerX, -20),
      20
    );
    this.position.distanceY = Math.min(
      Math.max(this.previousPointerY - this.position.pointerY, -20),
      20
    );

    this.updateTransform();
    this.rotate(this.position);

    if (this.moving) {
      this.stop();
    } else {
      this.moving = true;
    }
  }

  private rotate(position: Position): void {
    if (!this.cursor || !this.filter) return;

    const unsortedAngle =
      Math.atan(Math.abs(position.distanceY) / Math.abs(position.distanceX)) *
      this.degrees;

    if (isNaN(unsortedAngle)) {
      this.angle = this.previousAngle;
    } else {
      if (unsortedAngle <= 45) {
        this.angle =
          position.distanceX * position.distanceY >= 0
            ? +unsortedAngle
            : -unsortedAngle;
        this.filter.setAttribute(
          "stdDeviation",
          `${Math.abs(this.position.distanceX / 2)}, 0`
        );
      } else {
        this.angle =
          position.distanceX * position.distanceY <= 0
            ? 180 - unsortedAngle
            : unsortedAngle;
        this.filter.setAttribute(
          "stdDeviation",
          `${Math.abs(this.position.distanceY / 2)}, 0`
        );
      }
    }

    this.cursor.style.transform += ` rotate(${this.angle}deg)`;
    this.previousAngle = this.angle;
  }

  private stop(): void {
    if (!this.filter) return;
    setTimeout(() => {
      this.filter?.setAttribute("stdDeviation", "0, 0");
      this.moving = false;
    }, 50);
  }

  private updateTransform(): void {
    if (!this.cursor) return;

    let scale = "scale(1)";
    if (this.isHovered) scale = " scale(2)";
    if (this.isPressed) scale = " scale(0.8)";
    if (this.isHovered && this.isPressed) scale = " scale(1.5)";

    this.cursor.style.transform = `translate3d(${this.position.pointerX}px, ${this.position.pointerY}px, 0)${scale} rotate(${this.angle}deg)`;
  }
}
```

Cambios respecto al `.js` original:
- Interface `Position` extraída.
- Todas las propiedades de clase declaradas con tipos.
- Métodos marcados como `private` o `public` según uso interno.
- `event: MouseEvent` tipado en `move`.
- Filter guard usa optional chaining en `stop()`.

- [ ] **Step 3: Buscar referencias e imports**

Run: `grep -rn "motion-cursor" src/ public/ astro.config.mjs`

Si algún `import` o referencia rompe, actualizar.

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 5: Verificar visualmente el cursor**

Run: `npm run dev`

Hacer hover sobre links, botones, nav. El cursor debe escalar (2x al hacer hover, 0.8x al presionar, 1.5x ambos). Movimiento + rotación + blur al moverse rápido.

Si el cursor no aparece o no rota, revisar que el HTML correspondiente (`.curzr-motion` y `.curzr-motion-blur`) esté en el DOM. Probablemente lo agrega `CustomCursor.astro`.

- [ ] **Step 6: Commit**

```bash
git add src/components/motion-cursor.ts
git commit -m "refactor: migrate motion-cursor.js to TypeScript class with explicit types"
```

---

## Phase 3: Extracción de datos a `src/data/`

### Task 3.1: Crear estructura de `src/data/` y extraer `tagConfigs` de `Card.astro`

**Files:**
- Create: `src/data/tag-configs.ts`
- Modify: `src/components/Card.astro` (lines 30-108)

- [ ] **Step 1: Crear `src/data/tag-configs.ts`**

```ts
export interface TagConfig {
  label: string;
  bgColor: string;
  txtColor: string;
}

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

- [ ] **Step 2: Actualizar `src/components/Card.astro`**

En el frontmatter (lines 1-113), reemplazar la sección que contiene `function renderTagItem` y el objeto `tagConfigs` inline.

Cambiar el frontmatter completo a:

```astro
---
import { tagConfigs } from "../data/tag-configs";

interface Props {
  text: string;
  href: string;
  hrefImages?: string[];
  cover?: string;
  txtColor?: string;
  bgColor?: string;
  tags?: { [key: string]: string };
}

const {
  text,
  href,
  hrefImages,
  cover = `<svg xmlns="http://www.w3.org/2000/svg" width="" height="" viewBox="0 0 32 32"><defs><filter id="inset-shadow"><feOffset dx="0" dy="0" /><feGaussianBlur stdDeviation="1" result="offset-blur" /><feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" /><feFlood flood-color="#838383" flood-opacity="0.8" result="color" /><feComposite operator="in" in="color" in2="inverse" result="shadow" /></filter></defs><g filter="url(#inset-shadow)"><path fill="#fff" d="M20.42 21.157l2.211 2.211L30 16l-7.369-7.369l-2.211 2.212L25.58 16ZM11.58 10.843L9.369 8.631 2 16l7.369 7.369 2.211-2.211L6.42 16Zm5.831-3.166l1.6.437-4.42 16.209-1.6-.437z" /></g></svg>`,
  txtColor = "#fff",
  bgColor = "#fff3",
  tags = {},
} = Astro.props;

function tagItem(key: string, bgColor?: string, color_fill?: string): string {
  return `
		<li class="Alumni flex all_c" style="--bgColor: ${bgColor}; --txtColor: ${color_fill};">
			<span>${key}</span>
		</li>
	`;
}

function renderTagItem(key: string, setting: string): string {
  if (!key.startsWith("template")) {
    return tagItem(key);
  }
  const config = tagConfigs[setting];
  if (config) {
    return tagItem(config.label, config.bgColor, config.txtColor);
  }
  return "";
}

const processedTags = Object.entries(tags).map(([key, setting]) =>
  renderTagItem(key, setting)
);
---
```

El resto del archivo (markup desde `<a href={href}...`, script, style) **no se modifica**.

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 4: Verificar visualmente las cards**

Run: `npm run dev`

En `/`, las 4 tarjetas de proyectos deben mostrar sus tags con los mismos colores y labels que antes. Hover debe seguir expandiendo la card y mostrando carrusel.

- [ ] **Step 5: Commit**

```bash
git add src/data/tag-configs.ts src/components/Card.astro
git commit -m "refactor: extract tagConfigs to src/data/tag-configs.ts"
```

---

### Task 3.2: Extraer lista de proyectos de `Home.astro`

**Files:**
- Create: `src/data/projects.ts`
- Modify: `src/components/Home.astro` (lines 62-134, los 4 `<Card>` hardcodeados)

- [ ] **Step 1: Crear `src/data/projects.ts`**

```ts
export interface Project {
  text: string;
  href: string;
  cover: string;
  bgColor: string;
  txtColor?: string;
  hrefImages?: string[];
  tags: Record<string, string>;
}

export const projects: Project[] = [
  {
    text: "Domi",
    href: "https://kevinjgv.github.io/Work-Project_DOMI/",
    cover: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1731379909/Domi_lmwy6d.svg",
    bgColor: "#F3B10F",
    txtColor: "#092334",
    hrefImages: [
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731358579/Domi_index_hg32o3.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731358579/Domi_shop_snjaez.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731358579/Domi_cart_ezbmjb.png",
    ],
    tags: {
      template: "e-commerce",
      template2: "technology",
      template3: "frontend",
      template4: "uiux",
    },
  },
  {
    text: "SWAPI - Consumed API",
    href: "https://kevinjgv.github.io/SWAPIMPIRE_OF_JEDIS_CONSUMED-API/",
    cover: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1731379907/Swapi_popgza.png",
    bgColor: "#42000b",
    txtColor: "#FFE300",
    hrefImages: [
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914352/swapi1_dgz5ml.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914349/swapi2_v6zavr.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914348/swapi3_czp65u.png",
    ],
    tags: {
      template: "entertainment",
      template1: "api",
      template2: "frontend",
      template3: "uiux",
    },
  },
  {
    text: "My Progress Eye",
    href: "https://kevinjgv.github.io/My_Progress_Eye/index.html",
    cover: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1731379911/progress_eye_wsybqv.png",
    bgColor: "#F9FAFB",
    txtColor: "#000",
    hrefImages: [
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731915005/prog1_bwchsj.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731915003/prog2_tvttbo.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731915000/prog3_yoa58g.png",
      "https://res.cloudinary.com/dqgxt985j/image/upload/v1731914999/prog4_rredwu.png",
    ],
    tags: {
      template: "manager",
      template1: "entertainment",
      template2: "frontend",
      template3: "api",
      template4: "dashboard",
      template5: "uiux",
    },
  },
  {
    text: "Farm Database",
    href: "https://github.com/KevinJGV/Finca_El_Primer_Mundo_MYSQL",
    cover: '<svg xmlns="http://www.w3.org/2000/svg" width="0.88em" height="1em" viewBox="0 0 448 512"><path fill="currentColor" d="M448 73.143v45.714C448 159.143 347.667 192 224 192S0 159.143 0 118.857V73.143C0 32.857 100.333 0 224 0s224 32.857 224 73.143M448 176v102.857C448 319.143 347.667 352 224 352S0 319.143 0 278.857V176c48.125 33.143 136.208 48.572 224 48.572S399.874 209.143 448 176m0 160v102.857C448 479.143 347.667 512 224 512S0 479.143 0 438.857V336c48.125 33.143 136.208 48.572 224 48.572S399.874 369.143 448 336"/></svg>',
    bgColor: "#353535",
    tags: {
      template: "modeling",
      template1: "business",
      template2: "leadership",
      template3: "mysql",
      template4: "db",
    },
  },
];
```

- [ ] **Step 2: Actualizar `src/components/Home.astro` frontmatter**

Cambiar el frontmatter (líneas 1-10) a:

```astro
---
import TextHighlighted from "./Highlighter.astro";
import Card from "./Card.astro";
import Anchor from "./Anchor.astro";
import Hexagon from "./Hexagon.astro";
import { projects } from "../data/projects";

const s = "120px",
  r = 1,
  mv = "5px";
---
```

- [ ] **Step 3: Reemplazar las 4 `<Card>` hardcodeadas por un map**

En `Home.astro`, localizar el bloque `<div class="flex">` dentro de `<section id="projects">` (entre las líneas ~63 y ~134) que contiene las 4 `<Card>` hardcodeadas. Reemplazar TODO ese bloque interno (las 4 cards, no el `<div>` contenedor) por:

```astro
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
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 5: Verificar visualmente**

Run: `npm run dev`

En `/`, las 4 cards deben aparecer exactamente igual que antes, en el mismo orden y con los mismos colores/imágenes/tags.

- [ ] **Step 6: Commit**

```bash
git add src/data/projects.ts src/components/Home.astro
git commit -m "refactor: extract project list to src/data/projects.ts"
```

---

### Task 3.3: Extraer lista de tecnologías (Hexagons) de `Home.astro`

**Files:**
- Create: `src/data/technologies.ts`
- Modify: `src/components/Home.astro` (lines 154-262, la lista de `<Hexagon>` dentro de `<ul>`)

- [ ] **Step 1: Crear `src/data/technologies.ts`**

La lista actual mezcla Hexagons con `src` (tecnologías reales) y Hexagons sin props (slots vacíos para layout de panal). Modelar ambos:

```ts
export interface Technology {
  src: string;
  title: string;
}

export type HexagonSlot = Technology | null;

// `null` representa un slot vacío en el patrón hexagonal (Hexagon sin props).
// El orden DEBE preservarse para que el layout visual no cambie.
export const hexagonSlots: HexagonSlot[] = [
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732069030/free-java-59-1174952_rcoapt.svg", title: "Java" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755287690/1200px-Typescript_logo_2020.svg_umjkft.svg", title: "TypeScript" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732070256/gratis-png-jira-atlassian-software-de-computadora-confluencia-desarrollo-de-software-jira_ijbp0y.svg", title: "Jira" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069645/git_plain_wordmark_logo_icon_146508_lxcqzm.svg", title: "git" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288774/340px-CSS3_logo_and_wordmark.svg_elok7l.svg", title: "CSS" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732068544/1711525883305_prjgih.svg", title: "Python" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732070853/image_rnyojd.svg", title: "MarkDown" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071297/Notion_app_logo_f6uixh.svg", title: "Notion" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732069390/1656604745399_m4wyx5.png", title: "Spring Boot" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071011/pngwing.com_bpat9e.svg", title: "PostgreSQL" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071136/postman-logo-0087CA0D15-seeklogo.com_dajchv.svg", title: "Postman" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732068739/JavaScript-logo_mpgu9l.svg", title: "Javascript" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071705/1_nLbfO_PdTSpeCdZQuUr8RQ_wvcppy.svg", title: "Astro Framework" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069752/Figma-logo_jsyern.svg", title: "Figma" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071224/insomnia-logo-A35E09EB19-seeklogo.com_jujkam.svg", title: "Insomnia" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732069295/mysql_PNG23_rlknax.svg", title: "MySQL" },
  null,
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732070581/HTML5_logo_and_wordmark_njrary.svg", title: "HTML" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/t_Thumbnail/v1732071368/sonarlint-icon-logo-0161BCE8AD-seeklogo.com_l2ardn.svg", title: "SonarLint" },
  null,
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1732071874/1200px-Tux.svg_xjz7da.svg", title: "Linux" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288591/arch_o5n2pt.svg", title: "Arch Linux" },
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288590/vercel_xivkm6.svg", title: "Vercel" },
  null,
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755288591/react_xjxhnf.svg", title: "React" },
  null,
  { src: "https://res.cloudinary.com/dqgxt985j/image/upload/v1755287829/eslint_ag585p.svg", title: "ESLint" },
];
```

- [ ] **Step 2: Importar en `Home.astro` frontmatter**

Añadir al frontmatter de `Home.astro`:

```astro
import { hexagonSlots } from "../data/technologies";
```

- [ ] **Step 3: Reemplazar la lista hardcodeada de Hexagons**

Localizar el `<ul>` dentro de `<div class="techs_container grid unselected">` (líneas ~155-262). Reemplazar todo su contenido por:

```astro
<ul>
  {hexagonSlots.map((slot) =>
    slot ? <Hexagon src={slot.src} title={slot.title} /> : <Hexagon />
  )}
</ul>
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 5: Verificar visualmente**

Run: `npm run dev`

En `/`, la sección "TECHS | TOOLS" debe mostrar EL MISMO patrón hexagonal con los mismos iconos en el mismo orden. Hover sobre un hex sigue moviendo el highlight (la lógica `--x`/`--y`).

Si el patrón hexagonal se ve diferente, abortar y verificar el orden de la lista contra el archivo original.

- [ ] **Step 6: Commit**

```bash
git add src/data/technologies.ts src/components/Home.astro
git commit -m "refactor: extract hexagon technologies list to src/data/technologies.ts"
```

---

## Phase 4: Partición de componentes grandes

### Task 4.1: Partir `Footer.astro` (363 LOC)

**Files:**
- Create: `src/components/footer/FooterWheelSVG.astro`
- Create: `src/components/footer/FooterTypewriter.astro`
- Create: `src/components/footer/FooterSocial.astro`
- Create: `src/components/footer/FooterCredits.astro`
- Create: `src/components/footer/typewriter-words.ts`
- Modify: `src/components/Footer.astro` (rewrite como composición)

**Plan de partición:**

Footer original tiene 3 secciones (`#top_foot`, `#mid_foot`, `#bot_foot`). El refactor:

- `FooterWheelSVG.astro` → la SVG decorativa grande (líneas 32-84 del original).
- `FooterTypewriter.astro` → el bloque `#top_foot > div:first-child` (h3 con texto dinámico + Anchor "Contactame") + el script `consoleText` correspondiente.
- `FooterSocial.astro` → `#mid_foot > div:first-child` con los 3 SVG icons de social.
- `FooterCredits.astro` → `#mid_foot > p:last-child` (©AÑO VIN-DEV) + `#bot_foot` (Astro + café), incluyendo el script de `curYear`.
- `typewriter-words.ts` → arrays `words` y `colors` extraídos del script.
- `Footer.astro` → shell que importa y compone los 4 sub-componentes; preserva la prop `no_top_foot`.

**CSS:** los estilos `#top_foot`, `#mid_foot`, `#bot_foot`, `#console`, `#social_media`, `@keyframes wheel`, media queries — cada uno se mueve al sub-componente correspondiente. El estilo que aplica al `<footer>` global se queda en `Footer.astro` o se elimina si no aporta.

- [ ] **Step 1: Crear `src/components/footer/typewriter-words.ts`**

```ts
export const dynamicWords: string[] = ["Marca.", "Negocio.", "Valor.", "Potencial."];

export const dynamicColors: string[] = [
  "fuchsia", "lime", "yellow", "blue", "aqua", "orange", "hotpink", "lawngreen",
  "cyan", "magenta", "springgreen", "dodgerblue", "deeppink", "chartreuse",
  "mediumspringgreen", "limegreen", "crimson", "tomato", "gold", "coral",
  "orangered", "greenyellow", "mediumturquoise", "royalblue", "mediumorchid",
  "mediumpurple", "yellowgreen", "turquoise", "mediumvioletred", "darkorange",
  "lightskyblue", "palevioletred", "mediumseagreen", "violet", "salmon",
  "sandybrown", "darkcyan", "mediumslateblue", "goldenrod", "#3b82f6", "#8b5df6",
];
```

- [ ] **Step 2: Crear `src/components/footer/FooterWheelSVG.astro`**

Copiar las líneas 32-84 del `Footer.astro` original (el `<svg width="156" height="156" ...>` completo) al archivo nuevo. El archivo nuevo no necesita frontmatter (no recibe props) y tampoco `<style>` propio — los estilos de animación viven en `FooterTypewriter.astro` o donde se renderice.

Estructura:
```astro
---
---
<svg
  width="156"
  height="156"
  viewBox="0 0 156 156"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <!-- Pegar todos los <path> originales aquí, exactamente como están -->
</svg>

<style>
  svg {
    border-radius: 200px;
    animation-name: wheel;
    animation-duration: 5s;
    animation-delay: 2s;
    animation-iteration-count: infinite;
    animation-direction: alternate;
  }
  svg:hover {
    animation-play-state: paused;
  }
  @keyframes wheel {
    0%   { transform: rotate(0deg);   }
    50%  { transform: rotate(180deg); }
    100% { transform: rotate(360deg); }
  }
</style>
```

- [ ] **Step 3: Crear `src/components/footer/FooterTypewriter.astro`**

```astro
---
import Anchor from "../Anchor.astro";
import FooterWheelSVG from "./FooterWheelSVG.astro";
---

<section id="top_foot" class="flex j_sb">
  <div>
    <h3 class="Dela">
      Crece tu <span id="dinamic_text"></span><span id="console"> █ </span>
    </h3>
    <Anchor
      href="/contact"
      text="Contactame"
      max_font_size="2rem"
      min_font_size="2rem"
      bgHeight="2.2rem"
      svgh={21}
      svgw={20}
      svg={true}
    />
  </div>
  <div>
    <FooterWheelSVG />
  </div>
</section>

<script>
  import { dynamicWords, dynamicColors } from "./typewriter-words";

  document.addEventListener("astro:page-load", () => {
    function consoleText(words: string[], id: string, colors: string[]): void {
      if (colors === undefined) colors = ["#fff"];
      let visible = true;
      const con = document.querySelector("#console");
      let letterCount = 1;
      let x = 1;
      let waiting = false;
      const target = document.querySelector(id);
      if (!target || !con) return;
      target.setAttribute(
        "style",
        "color:" + colors[Math.floor(Math.random() * colors.length)]
      );
      window.setInterval(function () {
        if (letterCount === 0 && waiting === false) {
          waiting = true;
          target.innerHTML = words[0].substring(0, letterCount);
          window.setTimeout(function () {
            const usedColor = colors.shift()!;
            colors.push(usedColor);
            const usedWord = words.shift()!;
            words.push(usedWord);
            x = 1;
            target.setAttribute(
              "style",
              "color:" + colors[Math.floor(Math.random() * colors.length)]
            );
            letterCount += x;
            waiting = false;
          }, 1000);
        } else if (letterCount === words[0].length + 1 && waiting === false) {
          waiting = true;
          window.setTimeout(function () {
            x = -1;
            letterCount += x;
            waiting = false;
          }, 1000);
        } else if (waiting === false) {
          target.innerHTML = words[0].substring(0, letterCount);
          letterCount += x;
        }
      }, 120);
      window.setInterval(function () {
        if (visible === true) {
          con.id = "console";
          con.className = "hidden";
          visible = false;
        } else {
          con.id = "console";
          con.className = "";
          visible = true;
        }
      }, 400);
    }

    consoleText([...dynamicWords], "#dinamic_text", [...dynamicColors]);
  });
</script>

<style>
  #top_foot {
    align-items: center;
    margin-inline: 50px;
    margin-block: 130px;
    height: fit-content;
    gap: 3rem;
  }

  #top_foot h3 {
    font-size: clamp(2.5rem, 1.0774rem + 3.7936vw, 5rem);
    margin-bottom: 30px;
  }

  #console {
    display: inline-block;
    position: relative;
    left: 10px;
  }

  @media screen and (max-width: 1075px) {
    #top_foot {
      flex-direction: column;
      align-items: start;
    }

    #top_foot div:last-child {
      align-self: center;
      margin-block: 1rem;
    }

    #dinamic_text::before {
      content: "";
      display: block;
    }
  }

  @media screen and (max-width: 425px) {
    #top_foot {
      margin-inline: 1rem;
    }
  }
</style>
```

Nota: Las arrays se pasan a `consoleText` con spread (`[...dynamicWords]`) porque la función las muta con `shift`/`push`.

- [ ] **Step 4: Crear `src/components/footer/FooterSocial.astro`**

```astro
---
---
<div>
  <p>Más sobre mí</p>
  <div id="social_media" class="flex">
    <a href="https://github.com/KevinJGV" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 24 24">
        <path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5c.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34c-.46-1.16-1.11-1.47-1.11-1.47c-.91-.62.07-.6.07-.6c1 .07 1.53 1.03 1.53 1.03c.87 1.52 2.34 1.07 2.91.83c.09-.65.35-1.09.63-1.34c-2.22-.25-4.55-1.11-4.55-4.92c0-1.11.38-2 1.03-2.71c-.1-.25-.45-1.29.1-2.64c0 0 .84-.27 2.75 1.02c.79-.22 1.65-.33 2.5-.33s1.71.11 2.5.33c1.91-1.29 2.75-1.02 2.75-1.02c.55 1.35.2 2.39.1 2.64c.65.71 1.03 1.6 1.03 2.71c0 3.82-2.34 4.66-4.57 4.91c.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2"></path>
      </svg>
    </a>
    <a href="https://discordapp.com/users/356763345283710986" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.1.1 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.1 16.1 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.25-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02M8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12m6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12"></path>
      </svg>
    </a>
    <a href="https://www.linkedin.com/in/vin-dev/" target="_blank" rel="noopener noreferrer">
      <svg xmlns="http://www.w3.org/2000/svg" width="3em" height="3em" viewBox="0 0 24 24">
        <path fill="currentColor" d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zm-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93zM6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37z"></path>
      </svg>
    </a>
  </div>
</div>

<style>
  #social_media > * {
    margin: 10px;
  }

  div:first-child p {
    margin: 5px 5px 5px 10px;
  }

  @media screen and (max-width: 600px) {
    #social_media {
      justify-content: center;
    }
  }
</style>
```

- [ ] **Step 5: Crear `src/components/footer/FooterCredits.astro`**

```astro
---
import Anchor from "../Anchor.astro";
---

<p>©<span id="curYear"></span> VIN-DEV</p>

<section id="bot_foot" class="text_center Poppins-R">
  Despegando al éxito 🚀... gracias a <Anchor
    href="https://astro.build/"
    max_font_size="1rem"
    min_font_size="1rem"
    text="Astro"
    bgHeight="1.2rem"
  /> y algo de café ☕
</section>

<script>
  document.addEventListener("astro:page-load", () => {
    const curYearEl = document.querySelector("#curYear");
    if (curYearEl) {
      curYearEl.textContent = new Date().getFullYear().toString();
    }
  });
</script>

<style>
  p {
    align-self: flex-end;
    margin-right: 30px;
  }

  #bot_foot {
    color: var(--border);
    margin-bottom: 30px;
  }
</style>
```

- [ ] **Step 6: Reescribir `src/components/Footer.astro` como composición**

Reemplazar TODO el contenido del archivo por:

```astro
---
import FooterTypewriter from "./footer/FooterTypewriter.astro";
import FooterSocial from "./footer/FooterSocial.astro";
import FooterCredits from "./footer/FooterCredits.astro";

interface Props {
  no_top_foot?: boolean;
}

const { no_top_foot = false } = Astro.props;
---

<footer>
  {!no_top_foot && <FooterTypewriter />}
  <section id="mid_foot" class="flex j_sb Poppins-R">
    <FooterSocial />
    <FooterCredits />
  </section>
</footer>

<style>
  #mid_foot {
    padding: 30px 20px 0;
    border-top: 1px solid var(--border);
  }

  @media screen and (max-width: 600px) {
    #mid_foot {
      flex-direction: column;
    }
  }
</style>
```

Nota: la prop `no_top_foot` ahora controla la renderización condicional de `FooterTypewriter` en vez de aplicar la clase `no_display`.

- [ ] **Step 7: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 8: Verificar visualmente con énfasis en footer**

Run: `npm run dev`

En las 3 páginas, scroll hasta el footer y verificar:
- "Crece tu [palabra dinámica que cambia]" — animación funciona, colores cambian.
- Wheel SVG con animación rotando alternada.
- Anchor "Contactame".
- 3 iconos sociales con hover.
- "©2026 VIN-DEV" (año actual).
- "Despegando al éxito 🚀... gracias a Astro y algo de café ☕".

Verificar también la página `contact` o cualquiera que use `<Footer no_top_foot />` — `FooterTypewriter` NO debe renderizar.

- [ ] **Step 9: Commit**

```bash
git add src/components/footer/ src/components/Footer.astro
git commit -m "refactor: split Footer.astro into focused sub-components"
```

---

### Task 4.2: Partir `Home.astro` (452 LOC)

**Files:**
- Create: `src/components/home/HomeHero.astro`
- Create: `src/components/home/HomeProjects.astro`
- Create: `src/components/home/HomeTechs.astro`
- Modify: `src/components/Home.astro` (rewrite como composición)

**Plan de partición:**

`Home.astro` tiene dos `<article>` (`#home1`, `#home2`). `#home2` contiene dos `<section>` (`#projects`, `#techs`). División:

- `HomeHero.astro` → `<article id="home1">` completo, con su CSS específico (`#home1`, `#home1_text`, `#home1_top`, `#home1_img`, `#home1_bot`, `#photo`).
- `HomeProjects.astro` → `<section id="projects">` con el map de proyectos + el Anchor "Más", y el script inline que setea `--calculated-height`. CSS específico (`#projects > div`, `.hidden_text`).
- `HomeTechs.astro` → `<section id="techs">` con el map de Hexagons + el Anchor "Sobre mí", y el script de `pointermove` del techs_container. CSS específico (`.techs_container`, sus pseudo-elementos y queries).
- `Home.astro` → shell que importa y compone. CSS general (`#home2 { gap: 1rem; }`, `#home2 h2 { margin-block }`).

Datos ya extraídos a `src/data/` en Tasks 3.2 y 3.3.

- [ ] **Step 1: Crear `src/components/home/HomeHero.astro`**

```astro
---
import TextHighlighted from "../Highlighter.astro";
---

<article id="home1" class="home_article flex relative">
  <section id="home1_text" class="flex_col j_se">
    <div id="home1_top" class="flex_col j_c">
      <span class="Dela">Hola, </span>
      <h1 class="Dela">Soy Kevin</h1>
      <i>
        <span class="Ansterdam">Fullstack Software Developer</span>
        <span class="Poppins-R">&</span>
        <TextHighlighted
          text="Empanada Lover"
          el="span"
          font_size="2rem"
          bg_Color="#6c8c65"
        />
      </i>
      <p class="Poppins-S">
        Activo Desde SEP ‘23<br /><a href="/contact">HABLEMOS</a>
      </p>
    </div>
    <div id="home1_bot" class="Poppins-R">
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
    </div>
  </section>
  <section id="home1_img" class="sticky">
    <img
      id="photo"
      src="https://res.cloudinary.com/dqgxt985j/image/upload/v1731282091/photo_xmglr7.png"
      alt="Kevin"
      srcset=""
      class="unselected relative"
      draggable="false"
    />
  </section>
</article>

<style>
  #home1 {
    gap: 20rem;
  }

  #home1_text {
    gap: 200px;
  }

  #home1_top {
    height: 100vh;
    padding-top: 200px;
  }

  #home1_top span {
    font-size: clamp(4rem, 1.0774rem + 3.7936vw, 5rem);
    line-height: 0.9;
  }

  #home1_top h1 {
    font-size: clamp(5rem, 1.0774rem + 3.7936vw, 7rem);
    margin: 0;
  }

  #home1_top i {
    font-size: clamp(1.5rem, 0.0774rem + 1.7936vw, 2rem);
    margin-bottom: 3rem;
  }

  #home1_top i span {
    font-size: clamp(2rem, 0.0774rem + 1.7936vw, 3rem);
  }

  #home1_top a {
    text-decoration: underline;
  }

  #home1_img {
    top: 150px;
    width: 0;
    height: fit-content;
  }

  #home1_bot p {
    font-size: clamp(1rem, 0.0774rem + 1.7936vw, 1.5rem);
  }

  #photo {
    top: 50% !important;
    left: 50% !important;
    transform: translate(-50%) rotate(3deg);
    width: 450px;
  }

  @media screen and (max-width: 780px) {
    #home1_top i {
      padding-top: 2rem;
    }

    #home1_bot p {
      transform: unset;
    }

    #home1_img {
      position: absolute;
      width: 0;
      top: 695px;
      right: 50%;
      opacity: 0.4;
      transform: scale(0.5);
      z-index: -1;
    }

    #photo {
      width: 315px;
    }
  }

  @media screen and (max-width: 460px) {
    .Ansterdam {
      font-family: "Times New Roman", Times, serif;
    }
  }
</style>
```

- [ ] **Step 2: Crear `src/components/home/HomeProjects.astro`**

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

<script>
  document.addEventListener("astro:page-load", () => {
    const projectsContainer = document.querySelector<HTMLElement>("#projects > div");
    if (projectsContainer) {
      projectsContainer.style.setProperty(
        "--calculated-height",
        `${projectsContainer.children.length * 150}px`
      );
    }
  });
</script>

<style>
  .hidden_text {
    opacity: 0;
  }

  h2:hover .hidden_text {
    opacity: 0.5;
  }

  #projects > div {
    flex-grow: 1;
    height: 254px;
    border-radius: 4px;
    display: flex;
    gap: 5px;
    padding: 0.4em;
  }

  #projects blockquote {
    margin-block: 4rem;
    padding-top: calc(var(--s) * var(--r) + var(--mv));
  }

  @media screen and (max-width: 1075px) {
    #projects > div {
      flex-direction: column;
      height: var(--calculated-height);
    }
  }

  @media screen and (max-width: 780px) {
    .hidden_text {
      opacity: 0.5;
    }
  }
</style>
```

Nota: el script ahora usa `astro:page-load` en lugar de `DOMContentLoaded`, consistente con el resto del proyecto. La hidden_text rule de media query 780px viene del Home original (línea 439-441).

- [ ] **Step 3: Crear `src/components/home/HomeTechs.astro`**

```astro
---
import Hexagon from "../Hexagon.astro";
import Anchor from "../Anchor.astro";
import { hexagonSlots } from "../../data/technologies";

const s = "120px";
const r = 1;
const mv = "5px";
---

<section id="techs">
  <h2 class="Dela">
    <span class="hidden_text">Main</span> TECHS | TOOLS
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
    text="Sobre mí "
    max_font_size="7rem"
    min_font_size="2rem"
    bgHeight="7.5rem"
    svgh={76}
    svgw={75}
    svg={true}
    responsive={true}
  />
</blockquote>

<script>
  document.addEventListener("astro:page-load", () => {
    const techsList = document.querySelector(".techs_container ul");
    techsList?.addEventListener("pointermove", (ev) => {
      const target = (ev.target as HTMLElement).closest("li");
      if (target) {
        const rect = target.getBoundingClientRect();
        const mouseEv = ev as PointerEvent;
        target.style.setProperty("--x", String(mouseEv.clientX - rect.left));
        target.style.setProperty("--y", String(mouseEv.clientY - rect.top));
      }
    });
  });
</script>

<style define:vars={{ s, r, mv }}>
  .hidden_text {
    opacity: 0;
  }

  h2:hover .hidden_text {
    opacity: 0.5;
  }

  .techs_container {
    --s: var(--s);
    --r: var(--r);
    --h: 0.5;
    --v: 0.29;
    --hc: calc(clamp(0, var(--h), 0.5) * var(--s));
    --vc: calc(clamp(0, var(--v), 0.5) * var(--s) * var(--r));
    --mv: var(--mv);
    --mh: calc(var(--mv) + (var(--s) - 2 * var(--hc)) / 2);
    --f: calc(2 * var(--s) * var(--r) + 4 * var(--mv) - 2 * var(--vc) - 2px);
  }

  .techs_container ul {
    font-size: 0;
    padding-bottom: calc(var(--s) * var(--r) + var(--mv));
  }

  .techs_container ul::before {
    content: "";
    width: calc(var(--s) / 2 + var(--mh));
    float: left;
    height: 140%;
    shape-outside: repeating-linear-gradient(
      #0000 0 calc(var(--f) - 2px),
      #000 0 var(--f)
    );
  }

  @media screen and (max-width: 780px) {
    .hidden_text {
      opacity: 0.5;
    }
  }

  @media screen and (max-width: 460px) {
    .techs_container ul {
      padding-bottom: 600px;
    }
  }
</style>
```

- [ ] **Step 4: Reescribir `src/components/Home.astro` como composición**

Reemplazar TODO el contenido por:

```astro
---
import HomeHero from "./home/HomeHero.astro";
import HomeProjects from "./home/HomeProjects.astro";
import HomeTechs from "./home/HomeTechs.astro";
---

<HomeHero />
<article id="home2" class="home_article flex_col">
  <HomeProjects />
  <HomeTechs />
</article>

<style>
  #home2 {
    gap: 1rem;
  }

  #home2 h2 {
    margin-block: 4rem;
  }
</style>
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 6: Verificar visualmente toda la página `/`**

Run: `npm run dev`

Abrir `/`. Verificar:
- Hero "Hola, Soy Kevin..." con texto highlighted "Empanada Lover" + foto.
- Sticky behavior de la foto al scrollear (la foto se queda en pantalla mientras scrolleas la sección).
- Sección "Short PREVIEW" con las 4 cards de proyectos — hover expande la card y muestra el carrusel.
- Anchor "Más" con animación hover.
- Sección "Main TECHS | TOOLS" con el patrón hexagonal.
- Hover sobre un hex mueve el highlight (efecto `--x`/`--y`).
- Anchor "Sobre mí" al final.
- Responsive: probar en ancho ~1000px y ~600px.

- [ ] **Step 7: Commit**

```bash
git add src/components/home/ src/components/Home.astro
git commit -m "refactor: split Home.astro into Hero, Projects, Techs sub-components"
```

---

### Task 4.3: Partir `Me.astro` (535 LOC)

**Files:**
- Create: `src/components/me/MeAbout.astro` (article #me1)
- Create: `src/components/me/MeWhatIDo.astro` (article #me2)
- Create: `src/components/me/MeWhereImGoing.astro` (article #me3)
- Create: `src/components/me/MeLikes.astro` (article #me4)
- Create: `src/components/me/SpotifyPlayer.astro` (player widget de #me1)
- Modify: `src/components/Me.astro` (rewrite como composición)

**Plan de partición:**

`Me.astro` tiene 4 `<article>` (`#me1`, `#me2`, `#me3`, `#me4`). El player de Spotify (lines 28-66 dentro de `#me1`) es lo suficientemente distintivo para extraerse aparte.

- `MeAbout.astro` → `#me1` SIN el player (texto + imagen).
- `SpotifyPlayer.astro` → el `.bottom-section` con el player (ecualizador SVG + carrusel de "Escuchando ahora").
- `MeWhatIDo.astro` → `#me2`.
- `MeWhereImGoing.astro` → `#me3`.
- `MeLikes.astro` → `#me4` (loves/hates).
- `Me.astro` → shell que importa y compone, con los estilos compartidos `.article`, `.text-content`, `.top-section`, `.image-section`, `.photo`.

- [ ] **Step 1: Crear `src/components/me/SpotifyPlayer.astro`**

```astro
---
---

<section class="bottom-section Poppins-R flex relative s_b">
  <div class="player relative grid all_c">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <rect class="eq-bar eq-bar--1" x="4"    y="4" width="3.7" height="8"></rect>
      <rect class="eq-bar eq-bar--2" x="10.2" y="4" width="3.7" height="16"></rect>
      <rect class="eq-bar eq-bar--3" x="16.3" y="4" width="3.7" height="11"></rect>
    </svg>
    <p>Escuchando ahora:</p>
    <div class="carrousel">
      <p class="textoscroll">00:00 - Siddharta</p>
    </div>
  </div>
  <label for="player">
    <a
      href="https://open.spotify.com/user/22xnxi2j2d3vra2qhozf3bzsa?si=08945a9049494095"
      target="_blank">Via Spotify</a
    >
  </label>
</section>

<style>
  .bottom-section {
    width: 450px;
    margin-block: 2rem;
    align-self: end;
  }

  .bottom-section > .player {
    grid-template-columns: auto auto 2fr;
    border: var(--green) solid 1px;
    border-radius: 8px;
  }

  .bottom-section * {
    text-wrap: none !important;
    white-space: nowrap;
  }

  .bottom-section > .player p {
    color: var(--green);
    margin: 5px;
  }

  .bottom-section svg {
    margin: 3px;
  }

  .carrousel {
    width: 155px;
    overflow: hidden;
  }

  .textoscroll {
    display: inline-block;
    padding-left: 100%;
    animation: scroll 5s linear infinite;
    animation-delay: 1s;
  }

  @keyframes scroll {
    0% { transform: translateX(0); }
    100% { transform: translateX(-100%); }
  }

  .bottom-section label {
    text-align: center;
    margin: 10px;
    color: #666666;
  }

  .bottom-section a {
    color: #939393;
  }

  .bottom-section label::before {
    content: url("https://res.cloudinary.com/dqgxt985j/image/upload/v1732161021/spotify-white_wwxzoe.webp");
    margin-right: 5px;
  }

  .eq-bar {
    fill: var(--green);
    transform: scale(1, -1) translate(0, -24px);
  }

  .eq-bar--1 {
    animation-name: short-eq;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-delay: 0s;
  }

  .eq-bar--2 {
    animation-name: tall-eq;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-delay: 0.17s;
  }

  .eq-bar--3 {
    animation-name: short-eq;
    animation-duration: 0.5s;
    animation-iteration-count: infinite;
    animation-delay: 0.34s;
  }

  @keyframes short-eq {
    0%   { height: 8px; }
    50%  { height: 4px; }
    100% { height: 8px; }
  }

  @keyframes tall-eq {
    0%   { height: 16px; }
    50%  { height: 6px; }
    100% { height: 16px; }
  }

  @media screen and (max-width: 600px) {
    .bottom-section {
      flex-direction: column;
    }
  }
</style>
```

Nota: la regla duplicada de `.eq-bar--1` en el original (líneas 309-321 — dos bloques idénticos) se eliminó. Es duplicación literal.

- [ ] **Step 2: Crear `src/components/me/MeAbout.astro`**

```astro
---
import SpotifyPlayer from "./SpotifyPlayer.astro";
---

<article id="me1" class="article flex relative j_sb">
  <section class="text-content flex_col">
    <section class="top-section flex_col">
      <h1 class="Alumni_I">¿Sobre mí?</h1>
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
    </section>
    <SpotifyPlayer />
  </section>
  <section class="image-section unselected">
    <img
      src="https://res.cloudinary.com/dqgxt985j/image/upload/v1732430464/Me_nhlhpt.png"
      alt="me"
      class="photo unselected relative"
      draggable="false"
    />
  </section>
</article>
```

(Sin `<style>` propio — los estilos compartidos `.article`, `.top-section`, `.text-content`, `.image-section`, `.photo` viven en `Me.astro`.)

- [ ] **Step 3: Crear `src/components/me/MeWhatIDo.astro`**

```astro
---
---

<article id="me2" class="article flex relative alignI_c">
  <section class="text-content flex_col">
    <section class="top-section flex_col">
      <h1 class="Alumni_I">¿Qué hago?</h1>
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
    </section>
  </section>
  <section class="image-section">
    <svg
      width="40px"
      height="35px"
      viewBox="0 0 708 767"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill="#fff" opacity="1.00" d=" M 137.12 42.94 C 142.35 41.99 147.70 42.10 152.99 41.92 C 290.99 42.09 429.00 41.96 567.00 42.00 C 567.00 56.33 566.99 70.67 567.00 85.00 C 581.33 85.00 595.66 85.00 610.00 85.00 C 609.99 99.33 610.00 113.67 610.00 128.00 C 624.33 128.00 638.66 128.00 653.00 128.00 C 653.00 199.67 652.99 271.33 653.00 343.00 C 638.66 343.00 624.33 343.00 610.00 343.00 C 610.00 357.33 610.00 371.67 610.00 386.01 C 595.98 386.09 581.95 385.52 567.94 386.12 C 566.11 400.32 567.12 414.72 567.01 429.00 C 524.01 428.99 481.00 429.01 438.00 429.00 C 438.01 457.66 437.98 486.33 438.00 515.00 C 366.34 514.70 294.65 515.58 223.00 514.58 C 223.19 472.03 222.69 429.47 223.12 386.94 C 237.33 385.10 251.72 386.12 266.02 386.01 C 266.09 371.99 265.52 357.95 266.12 343.94 C 280.53 342.10 295.12 343.11 309.61 343.03 C 308.87 328.90 308.95 314.76 308.95 300.62 C 351.95 299.24 394.99 300.34 438.00 300.01 C 438.00 271.33 437.99 242.67 438.00 214.00 C 380.67 214.00 323.33 214.00 266.00 214.00 C 266.00 228.33 266.00 242.67 266.00 257.00 C 251.66 257.00 237.33 257.00 223.00 257.00 C 223.00 271.33 223.00 285.66 223.00 300.00 C 180.00 300.00 137.00 300.00 94.00 300.00 C 94.00 285.66 94.00 271.32 94.00 256.98 C 79.98 256.91 65.95 257.47 51.94 256.88 C 50.15 243.34 51.14 229.61 50.96 216.00 C 51.28 186.98 50.57 157.95 51.12 128.94 C 65.33 127.10 79.72 128.12 94.00 128.01 C 94.00 113.67 94.00 99.33 94.00 85.00 C 108.34 85.00 122.68 85.00 137.02 85.00 C 137.09 70.98 136.52 56.95 137.12 42.94 Z"></path>
      <path fill="#fff" opacity="1.00" d=" M 225.42 558.00 C 296.28 557.99 367.14 558.01 438.00 558.00 C 437.99 599.33 438.00 640.67 438.00 682.00 C 423.66 682.00 409.33 681.99 395.00 682.00 C 395.00 696.33 395.00 710.66 395.00 725.00 C 352.00 725.00 309.00 724.99 266.00 725.00 C 265.99 710.66 266.00 696.33 266.00 681.99 C 252.33 682.00 238.67 681.99 225.00 682.01 C 225.27 640.67 224.44 599.32 225.42 558.00 Z"></path>
    </svg>
  </section>
</article>

<style>
  #me2 {
    flex-direction: row-reverse;
  }

  #me2 p {
    transform: rotateZ(4deg);
  }

  #me2 .top-section {
    text-align: right;
    padding-top: 0;
  }

  #me2 svg {
    width: 20rem;
    height: 21.5rem;
  }

  @media screen and (max-width: 1075px) {
    #me2 .image-section {
      position: absolute;
      top: 0;
      left: 0;
    }

    #me2 svg {
      width: 10rem;
      height: 10.5rem;
    }

    #me2 svg * {
      fill: var(--border);
      opacity: 0.5;
    }
  }
</style>
```

- [ ] **Step 4: Crear `src/components/me/MeWhereImGoing.astro`**

```astro
---
---

<article id="me3" class="article flex relative alignI_c">
  <section class="text-content flex_col">
    <section class="top-section flex_col">
      <h1 class="Alumni_I">¿A donde voy?</h1>
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
          target="_blank">Código Ninja</a
        > a su conveniencia.<br />
        Profesionalmente, con una solida carrera, experiencia y conocimientos tecnologicos,<br>el CEO de un, o varios, productos distintivos utiles e impactantes
        en el dia a dia de las sociedades.
      </p>
    </section>
  </section>
  <section class="image-section">
    <img
      src="https://res.cloudinary.com/dqgxt985j/image/upload/v1732247039/sparkles_t2ddaa.gif"
      alt=""
      class="unselected relative"
    />
  </section>
</article>

<style>
  #me3 .top-section {
    padding-top: 0;
  }

  #me3 .photo {
    right: unset;
    transform: unset;
  }

  #me3 q {
    display: block;
    margin: auto;
    margin-bottom: 2rem;
    font-size: 1.5rem;
  }

  #me3 a {
    text-decoration: underline;
  }

  @media screen and (min-width: 1719px) {
    #me3 p {
      transform: rotateZ(360deg);
    }
  }

  @media screen and (max-width: 1075px) {
    #me3 .image-section {
      position: absolute;
      top: 0;
      right: 0;
    }
  }
</style>
```

- [ ] **Step 5: Crear `src/components/me/MeLikes.astro`**

```astro
---
const loves: Array<{ text: string; note?: string }> = [
  { text: "Color negro" },
  { text: "Produccion de contenidos audiovisuales" },
  { text: "Animaciones" },
  { text: "Videojuegos" },
  { text: "Mi moto", note: "(Enduros)" },
  { text: "Admirar personas" },
  { text: "Aconsejar" },
  { text: "Gatos" },
  { text: "Cocinar", note: "(Sí me anímo)" },
  { text: "Solitud", note: "(Staying-at-home)" },
  { text: "Climas frios" },
  { text: "Trabajar en equipo", note: "(Y el co-working)" },
  { text: "Conocer nuevos sitios" },
];

const hates: Array<{ text: string; note?: string }> = [
  { text: "Resultados incompletos" },
  { text: "Quedarme sin dinero" },
  { text: "Climas muy calientes" },
  { text: "Simps", note: "(Personas sin valor)" },
  { text: "Gente que no soporta mi sentido del humor" },
  { text: "Cafe puro" },
  { text: "Falta de empatia" },
  { text: "Gente superautoritaria" },
];
---

<article id="me4" class="flex_col">
  <h2 class="Alumni_I">Mira eso, qué humano</h2>
  <div class="Poppins-R flex_col">
    <div class="flex alignI_c">
      <h3>Qué amo</h3>
      <svg id="love" xmlns="http://www.w3.org/2000/svg" width="143" height="143" fill="none" viewBox="0 0 143 143">
        <path fill="#1ED760" d="M40.219 58.792a6.703 6.703 0 1 0 13.406 0 6.703 6.703 0 0 0-13.406 0Zm49.156 0a6.703 6.703 0 1 0 13.406 0 6.703 6.703 0 0 0-13.406 0ZM71.5 8.937C36.951 8.938 8.937 36.951 8.937 71.5c0 34.549 28.014 62.562 62.563 62.562 34.549 0 62.562-28.013 62.562-62.562 0-34.549-28.013-62.563-62.562-62.563Zm36.728 99.291a51.947 51.947 0 0 1-16.52 11.143c-6.383 2.71-13.184 4.078-20.208 4.078-7.024 0-13.825-1.368-20.221-4.078a51.715 51.715 0 0 1-16.52-11.143 51.955 51.955 0 0 1-11.144-16.52C20.919 85.324 19.55 78.523 19.55 71.5c0-7.024 1.368-13.825 4.078-20.221a51.725 51.725 0 0 1 11.143-16.52 51.952 51.952 0 0 1 16.52-11.144c6.383-2.696 13.184-4.064 20.208-4.064 7.024 0 13.825 1.368 20.221 4.078a51.735 51.735 0 0 1 16.521 11.143 51.96 51.96 0 0 1 11.143 16.52c2.696 6.383 4.064 13.184 4.064 20.208 0 7.024-1.368 13.825-4.078 20.221a51.506 51.506 0 0 1-11.143 16.507ZM92.727 74.433h-6.718c-.586 0-1.089.446-1.13 1.033-.531 6.913-6.327 12.373-13.379 12.373s-12.862-5.46-13.378-12.373a1.128 1.128 0 0 0-1.132-1.033h-6.717a1.117 1.117 0 0 0-1.117 1.173c.615 11.772 10.404 21.17 22.344 21.17 11.94 0 21.73-9.398 22.344-21.17a1.119 1.119 0 0 0-1.117-1.173Z"></path>
      </svg>
      <ul class="flex">
        {loves.map((item) => (
          <li>{item.text}{item.note && <span> {item.note}</span>}</li>
        ))}
      </ul>
    </div>
    <hr>
    <div class="flex alignI_c">
      <h3>Qué no tanto</h3>
      <svg id="hate" xmlns="http://www.w3.org/2000/svg" width="143" height="143" fill="none" viewBox="0 0 143 143">
        <path fill="#D71E1E" d="M40.219 58.792a6.703 6.703 0 0 0 13.4.294.424.424 0 0 0-.266-.407l-10.822-4.483a.538.538 0 0 0-.608.13 6.703 6.703 0 0 0-1.704 4.466Zm49.47-.13a.488.488 0 0 0-.305.47 6.704 6.704 0 1 0 11.843-4.632c-.234-.28-.632-.356-.969-.216L89.69 58.662ZM71.5 8.938C36.951 8.938 8.937 36.95 8.937 71.5c0 34.549 28.014 62.562 62.563 62.562 34.549 0 62.562-28.013 62.562-62.562 0-34.549-28.013-62.563-62.562-62.563Zm36.728 99.29a51.947 51.947 0 0 1-16.52 11.143c-6.383 2.71-13.184 4.078-20.208 4.078-7.024 0-13.825-1.368-20.221-4.078a51.715 51.715 0 0 1-16.52-11.143 51.955 51.955 0 0 1-11.144-16.52C20.919 85.324 19.55 78.523 19.55 71.5c0-7.024 1.368-13.825 4.078-20.221a51.725 51.725 0 0 1 11.143-16.52 51.952 51.952 0 0 1 16.52-11.144c6.383-2.696 13.184-4.064 20.208-4.064 7.024 0 13.825 1.368 20.221 4.078a51.735 51.735 0 0 1 16.521 11.143 51.96 51.96 0 0 1 11.143 16.52c2.696 6.383 4.064 13.184 4.064 20.208 0 7.024-1.368 13.825-4.078 20.221a51.506 51.506 0 0 1-11.143 16.507Z"></path>
        <rect width="59" height="9" x="42" y="81" fill="#D71E1E" rx="1"></rect>
      </svg>
      <ul class="flex">
        {hates.map((item) => (
          <li>{item.text}{item.note && <span> {item.note}</span>}</li>
        ))}
      </ul>
    </div>
  </div>
</article>

<style>
  #me4 h2 {
    font-weight: normal;
    font-size: clamp(1.3rem, 0.0774rem + 2.7936vw, 2rem);
  }

  #me4 > div {
    border: var(--border) 1px solid;
    border-radius: 8px;
    padding: 1rem 4rem;
    gap: 2rem;
    width: fit-content;
  }

  #me4 > div div {
    gap: 2rem;
  }

  #me4 h3 {
    white-space: nowrap;
  }

  #me4 svg {
    flex-shrink: 0;
  }

  #love {
    transform: rotateZ(45deg);
  }

  #hate {
    transform: rotateZ(315deg);
  }

  #me4 hr {
    width: 100%;
    border: 1px 0 0 0 solid;
    border-color: var(--border);
    margin: 0;
  }

  #me4 ul {
    flex-wrap: wrap;
    gap: 1rem;
    list-style-type: none;
    padding: 0;
    margin: 0;
  }

  #me4 li {
    white-space: nowrap;
    padding: 5px 8px;
    border: var(--border) 1px solid;
    border-radius: 20px;
    place-self: center;
    text-align: center;
  }

  #me4 li span {
    color: #666;
    font-size: 0.8rem;
  }

  @media screen and (max-width: 1075px) {
    #me4 div div {
      flex-direction: column;
    }
  }

  @media screen and (max-width: 600px) {
    #me4 > div {
      padding-inline: 1rem;
    }

    #me4 ul {
      gap: 0.5rem;
      justify-content: space-evenly;
    }

    #me4 li {
      white-space: wrap;
      max-width: 40%;
    }

    #me4 li span::before {
      content: "";
      display: block;
    }
  }
</style>
```

- [ ] **Step 6: Reescribir `src/components/Me.astro` como composición**

Reemplazar TODO el contenido por:

```astro
---
import MeAbout from "./me/MeAbout.astro";
import MeWhatIDo from "./me/MeWhatIDo.astro";
import MeWhereImGoing from "./me/MeWhereImGoing.astro";
import MeLikes from "./me/MeLikes.astro";
---

<MeAbout />
<MeWhatIDo />
<MeWhereImGoing />
<MeLikes />

<style>
  .article {
    gap: 5rem;
  }

  .text-content {
    gap: 80px;
  }

  .top-section {
    padding-top: 150px;
  }

  .top-section h1 {
    font-size: clamp(3rem, 1.0774rem + 3.7936vw, 5rem);
    font-weight: 300;
    margin-block: 1em;
  }

  .top-section p {
    margin: 0;
    font-size: clamp(1rem, 0.0774rem + 1.7936vw, 1.2rem);
  }

  .image-section,
  .image-section * {
    z-index: -1;
  }

  .photo {
    width: 600px;
  }

  @media screen and (max-width: 1075px) {
    article {
      flex-direction: column;
    }

    #me1 .image-section {
      position: absolute;
      top: 0;
      right: 0;
    }

    .photo {
      width: 280px;
    }
  }
</style>
```

Nota: los estilos `.article` y compañía son globales por scope al estar todos los sub-componentes dentro del mismo árbol DOM compartido. Pero los selectores específicos `#me1`, `#me2`, etc., aplican solo cuando esos IDs existen — funcionan correctamente porque cada sub-componente declara su propio ID al hacer `<article id="meN">`.

- [ ] **Step 7: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 8: Verificar visualmente toda la página `/me`**

Run: `npm run dev`

Abrir `/me`. Verificar las 4 secciones:
- **#me1 "¿Sobre mí?"** — texto, foto a la derecha, player de Spotify abajo (ecualizador animado + carrusel "00:00 - Siddharta" + link a Spotify).
- **#me2 "¿Qué hago?"** — texto a la derecha (row-reverse), SVG decorativo a la izquierda.
- **#me3 "¿A donde voy?"** — quote + texto + GIF de sparkles a la derecha.
- **#me4 "Mira eso, qué humano"** — lista "Qué amo" (verde) y "Qué no tanto" (rojo) con los items como pills.
- Responsive en 1075px y 600px.

- [ ] **Step 9: Commit**

```bash
git add src/components/me/ src/components/Me.astro
git commit -m "refactor: split Me.astro into 4 article sub-components + SpotifyPlayer"
```

---

### Task 4.4: Evaluar y simplificar `Card.astro` (505 LOC)

Card es UN componente (una tarjeta de proyecto). NO se parte. Pero el script enorme y el SVG default cover se pueden extraer.

**Files:**
- Create: `src/components/card-interactions.ts`
- Create: `src/data/card-defaults.ts`
- Modify: `src/components/Card.astro`

- [ ] **Step 1: Crear `src/data/card-defaults.ts`**

```ts
// Default cover SVG usado cuando una Card no recibe la prop `cover`.
export const DEFAULT_CARD_COVER: string = `<svg xmlns="http://www.w3.org/2000/svg" width="" height="" viewBox="0 0 32 32"><defs><filter id="inset-shadow"><feOffset dx="0" dy="0" /><feGaussianBlur stdDeviation="1" result="offset-blur" /><feComposite operator="out" in="SourceGraphic" in2="offset-blur" result="inverse" /><feFlood flood-color="#838383" flood-opacity="0.8" result="color" /><feComposite operator="in" in="color" in2="inverse" result="shadow" /></filter></defs><g filter="url(#inset-shadow)"><path fill="#fff" d="M20.42 21.157l2.211 2.211L30 16l-7.369-7.369l-2.211 2.212L25.58 16ZM11.58 10.843L9.369 8.631 2 16l7.369 7.369 2.211-2.211L6.42 16Zm5.831-3.166l1.6.437-4.42 16.209-1.6-.437z" /></g></svg>`;
```

- [ ] **Step 2: Crear `src/components/card-interactions.ts`**

Extraer todo el script interno de `Card.astro` (las funciones `calculateDimensions`, `updateStyles`, `resetStyles`, `initCarousel`, etc.) a un módulo TS con una función `initCards` que se invoca desde el `<script>` del `.astro`.

```ts
type CSSProperties = {
  fontSize: string;
  paddingBottom: string;
  zIndex: string;
  opacity: string;
};

interface StyleUpdate {
  selector: string;
  styles: Partial<CSSProperties>;
}

export function initCards(): void {
  const pCards = document.querySelectorAll<HTMLElement>(".pCard");
  if (pCards.length === 0) return;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  const setTimeoutWithKey = (key: string, callback: () => void, delay: number): void => {
    if (timeouts[key]) clearTimeout(timeouts[key]);
    timeouts[key] = setTimeout(() => {
      callback();
      delete timeouts[key];
    }, delay);
  };

  const calculateDimensions = (): void => {
    const cardsContainer = document.querySelector<HTMLElement>("#projects > div");
    if (!cardsContainer) return;

    const containerWidth = cardsContainer.clientWidth;
    const totalCards = pCards.length;
    const growFactor = 4;
    const shrinkFactor = 1;
    const totalFlex = (totalCards - 1) * shrinkFactor + growFactor;
    const maxCardWidth = Math.round((containerWidth * growFactor) / totalFlex) - 9;

    [".tags", ".card_carousel"].forEach((clase) =>
      document.querySelectorAll<HTMLElement>(clase).forEach((el) => {
        el.style.width = `${maxCardWidth}px`;
      })
    );

    let maxEstimatedHeight = 0;
    document.querySelectorAll<HTMLElement>(".card_carousel").forEach((carousel) => {
      carousel.querySelectorAll("img").forEach((img) => {
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        maxEstimatedHeight = Math.max(maxEstimatedHeight, maxCardWidth * aspectRatio);
      });
    });

    pCards.forEach((pCard) => {
      pCard.style.setProperty("--carousel-height", `${maxEstimatedHeight}px`);
    });
  };

  const updateStyles = (hoveredCard: HTMLElement): void => {
    const tagsEl = hoveredCard.querySelector<HTMLElement>(".tags");
    const carouselEl = hoveredCard.querySelector(".card_carousel");
    if (!tagsEl || !carouselEl) return;

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

    const styleUpdatesHovered: StyleUpdate[] = [
      { selector: "p", styles: { fontSize: "1rem", paddingBottom: `${tagsEl.offsetHeight - rootFontSize}px` } },
      { selector: ".tags", styles: { zIndex: "11" } },
      { selector: ".imageCard", styles: { opacity: carouselEl.children.length !== 0 ? "0" : "1" } },
    ];

    const styleUpdatesNonHovered: StyleUpdate[] = [
      { selector: "p", styles: { fontSize: "0" } },
      { selector: ".tags", styles: { zIndex: "3" } },
    ];

    pCards.forEach((otherCard) => {
      if (otherCard === hoveredCard) {
        styleUpdatesHovered.forEach(({ selector, styles }) => {
          const element = otherCard.querySelector<HTMLElement>(selector);
          if (!element) return;
          (Object.keys(styles) as Array<keyof CSSProperties>).forEach((prop) => {
            const value = styles[prop];
            if (value !== undefined) {
              (element.style as any)[prop] = String(value);
            }
          });
        });
      } else {
        styleUpdatesHovered.forEach(({ selector, styles }) => {
          const element = otherCard.querySelector<HTMLElement>(selector);
          if (!element) return;
          (Object.keys(styles) as Array<keyof CSSProperties>).forEach((prop) => {
            const nonHoveredStyle = styleUpdatesNonHovered.find((s) => s.selector === selector);
            if (nonHoveredStyle && nonHoveredStyle.styles[prop] !== undefined) {
              (element.style as any)[prop] = nonHoveredStyle.styles[prop];
            } else {
              element.style.removeProperty(prop);
            }
          });
        });
      }
    });
  };

  const resetStyles = (): void => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      pCards.forEach((card) => {
        ["p", ".tags", ".imageCard"].forEach((selector) => {
          const element = card.querySelector<HTMLElement>(selector);
          if (!element) return;
          ["font-size", "bottom", "opacity", "padding-bottom", "z-index"].forEach((prop) =>
            element.style.removeProperty(prop)
          );
        });
      });
    }, 99);
  };

  const initCarousel = (card: HTMLElement) => {
    const images = card.querySelectorAll<HTMLElement>(".card_carousel img");
    let currentIndex = 0;
    let direction = 1;
    let interval: ReturnType<typeof setInterval> | undefined;

    const startCarousel = (): void => {
      interval = setInterval(() => {
        images[currentIndex].style.display = "none";
        images[currentIndex].classList.remove("active");
        currentIndex += direction;

        if (currentIndex >= images.length) {
          currentIndex = images.length - 2;
          direction = -1;
        } else if (currentIndex < 0) {
          currentIndex = 1;
          direction = 1;
        }

        images[currentIndex].style.display = "block";
        images[currentIndex].classList.add("active");
      }, 1500);
    };

    const stopCarousel = (): void => {
      if (interval) clearInterval(interval);
      images.forEach((img, index) => {
        img.style.display = index === 0 ? "block" : "none";
        img.classList.toggle("active", index === 0);
      });
      currentIndex = 0;
      direction = 1;
    };

    return { startCarousel, stopCarousel };
  };

  const mediaQuery = window.matchMedia("(min-width: 425px)");

  const resizeHandler = (): void => {
    setTimeoutWithKey("resizeDimensions", calculateDimensions, 99);
  };

  const applyMediaQueryStyles = (matches: boolean): void => {
    if (matches) {
      calculateDimensions();
      window.addEventListener("resize", resizeHandler);
    } else {
      window.removeEventListener("resize", resizeHandler);
    }
  };

  pCards.forEach((card) => {
    const { startCarousel, stopCarousel } = initCarousel(card);

    card.addEventListener("mouseover", () => {
      startCarousel();
      if (timeoutId) clearTimeout(timeoutId);
      updateStyles(card);
    });

    card.addEventListener("mouseout", () => {
      stopCarousel();
      resetStyles();
    });
  });

  mediaQuery.addEventListener("change", (e) => applyMediaQueryStyles(e.matches));
  applyMediaQueryStyles(mediaQuery.matches);
}
```

Simplificaciones aplicadas (sin cambiar comportamiento):
- `applyMediaQueryStyles` ya no recibe el forEach redundante sobre `pCards` (no usaba `card`).
- `resetStyles` loop interno colapsado en un único `forEach`.
- Type safety en lugar de los `as keyof` invasivos.

- [ ] **Step 3: Actualizar `src/components/Card.astro`**

Reescribir el archivo completo:

```astro
---
import { tagConfigs } from "../data/tag-configs";
import { DEFAULT_CARD_COVER } from "../data/card-defaults";

interface Props {
  text: string;
  href: string;
  hrefImages?: string[];
  cover?: string;
  txtColor?: string;
  bgColor?: string;
  tags?: { [key: string]: string };
}

const {
  text,
  href,
  hrefImages,
  cover = DEFAULT_CARD_COVER,
  txtColor = "#fff",
  bgColor = "#fff3",
  tags = {},
} = Astro.props;

function tagItem(key: string, bgColor?: string, color_fill?: string): string {
  return `
		<li class="Alumni flex all_c" style="--bgColor: ${bgColor}; --txtColor: ${color_fill};">
			<span>${key}</span>
		</li>
	`;
}

function renderTagItem(key: string, setting: string): string {
  if (!key.startsWith("template")) {
    return tagItem(key);
  }
  const config = tagConfigs[setting];
  if (config) {
    return tagItem(config.label, config.bgColor, config.txtColor);
  }
  return "";
}

const processedTags = Object.entries(tags).map(([key, setting]) =>
  renderTagItem(key, setting)
);
---

<a
  href={href}
  class="pCard flex_col glass0 relative"
  target="_blank"
  style={`color: ${txtColor}; background-color: ${bgColor};`}
>
  {
    cover && cover.toLowerCase().endsWith("</svg>") ? (
      <div class="imageCard flex j_c absolute" set:html={cover} />
    ) : (
      <div class="imageCard flex j_c absolute">
        <img src={cover} alt="" loading="lazy" />
      </div>
    )
  }

  <ul class="tags absolute flex wrap j_sa">
    {processedTags.map((tag) => <Fragment set:html={tag} />)}
  </ul>

  <p class="Poppins-S text_center absolute">
    <span>{text}</span>
  </p>

  {
    hrefImages ? (
      <div class="card_carousel flex absolute">
        {hrefImages.map((capture) => (
          <img src={capture} alt="" />
        ))}
      </div>
    ) : (
      <div class="card_carousel flex absolute" />
    )
  }
</a>

<script>
  import { initCards } from "./card-interactions";
  document.addEventListener("astro:page-load", () => {
    initCards();
  });
</script>

<style define:vars={{ bgColor, txtColor }}>
  .card_carousel img {
    transition: opacity 0.5s ease;
    width: 100%;
  }

  .pCard span {
    min-width: 14em;
    padding: 0.5em;
    text-align: center;
    transform: rotate(-90deg);
    transition: all 0.5s;
    text-transform: uppercase;
    color: var(--txtColor);
    letter-spacing: 0.1em;
  }

  .card_carousel img:first-child {
    display: block;
  }

  .card_carousel img:not(:first-child) {
    display: none;
  }

  .imageCard {
    z-index: 5;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--bgColor);
    align-items: center;
  }

  .pCard p {
    font-size: 1rem;
    left: 0;
    right: 0;
    padding: 0.5rem;
    bottom: 0;
    z-index: 10;
  }

  .pCard:hover p {
    background-color: var(--bgColor);
  }

  .pCard .tags {
    list-style: none;
    padding: 1rem;
    margin: 0;
    z-index: 3;
    width: 100%;
    bottom: 0;
    background-color: var(--bgColor);
    gap: 1rem;
  }

  .tags li {
    background-color: var(--bgColor);
    color: var(--txtColor);
    padding: 0.4rem 0.6rem;
    border-radius: 0.3rem;
    font-size: 0.75rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .tags li img {
    width: 1rem;
    height: 1rem;
    filter: brightness(0) invert(1);
    flex-shrink: 0;
  }

  .tags li span {
    min-width: unset;
    padding: 0;
    text-align: left;
    transform: none;
    transition: none;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: inherit;
  }

  @media screen and (max-width: 1075px) {
    .pCard,
    .tags,
    .card_carousel {
      width: 100% !important;
    }

    .pCard p {
      opacity: 0;
    }

    .pCard:hover p {
      opacity: 1;
    }
  }
</style>
```

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 5: Verificar interacción de cards**

Run: `npm run dev`

En `/`:
- 4 cards visibles, layout idéntico.
- Hover sobre una card: la card se expande (flex: 4), el carrusel rota imágenes, el texto rota a horizontal, las demás cards se contraen.
- Mouseout: las cards vuelven a su estado normal.
- Resize de la ventana: recalcula anchos correctamente.

- [ ] **Step 6: Commit**

```bash
git add src/data/card-defaults.ts src/components/card-interactions.ts src/components/Card.astro
git commit -m "refactor: extract Card script logic and default cover to TS modules"
```

---

### Task 4.5: Partir `GlobalStyles.astro` (359 LOC) en archivos CSS por concern

**Files:**
- Create: `src/styles/fonts.css`
- Create: `src/styles/variables.css`
- Create: `src/styles/utilities.css`
- Create: `src/styles/base.css`
- Create: `src/styles/cursors.css`
- Create: `src/styles/components-global.css`
- Modify: `src/layouts/Layout.astro` (importar los nuevos CSS)
- Delete: `src/styles/GlobalStyles.astro`

**Plan de partición:**

El archivo actual es `<style is:global>`. Lo movemos a CSS plano importable desde el Layout. Esto es más estándar y permite imports selectivos en el futuro.

- `fonts.css` → todos los `@font-face` + clases tipográficas (`.Dela`, `.Poppins-R`, `.Poppins-S`, `.Alumni`, `.Alumni_I`, `.AudioWide`, `.Ansterdam`).
- `variables.css` → `:root { --... }`.
- `base.css` → `*`, `*:after`, `*::selection`, `a` (reset), `body` (sin cursor — el cursor va a `cursors.css`).
- `utilities.css` → `.flex`, `.flex_col`, `.grid`, `.wrap`, `.text_center`, `.all_c`, `.j_sb`, `.j_se`, `.j_sa`, `.j_c`, `.alignI_c`, posiciones (`.relative`, `.absolute`, `.fixed`, `.sticky`), centrado absoluto, `.unselected`, `.no_display`, `.hidden`, `.pointer`, `.noise`, `.glass0`, `.glass1`.
- `cursors.css` → reglas `body { cursor: url(...) }`, `a { cursor: url(...) }`, `.x-cursor`.
- `components-global.css` → estilos globales que aplican a componentes específicos (`.dot`, `#top-menu*`, `main`, `.imageCard > *`, `.pCard`, `.pCard:hover`, `.pCard .tags li`, `.pCard .tags li *`, `.pCard .tags li svg`, `.techs_container li > *`, `.techs_container ul:hover .li_hidden`, las transforms con `rotateZ(357deg)`).

El comentario CSS muerto (líneas 205-218 — `.noise` viejo comentado, líneas 344-358 — media queries comentadas) **se elimina por completo**, no se preserva.

- [ ] **Step 1: Crear `src/styles/fonts.css`**

```css
@font-face {
  font-family: "Dela";
  src: url("/fonts/DelaGothicOne-Regular.ttf");
}

.Dela {
  font-family: "Dela";
  font-weight: 100;
}

@font-face {
  font-family: "Poppins-R";
  src: url("/fonts/Poppins-Regular.ttf");
}

.Poppins-R {
  font-family: "Poppins-R";
}

@font-face {
  font-family: "Poppins-S";
  src: url("/fonts/Poppins-SemiBold.ttf");
}

.Poppins-S {
  font-family: "Poppins-S";
}

@font-face {
  font-family: "Alumni";
  src: url("/fonts/AlumniSans-VariableFont_wght.ttf");
}

.Alumni {
  font-family: "Alumni";
}

@font-face {
  font-family: "Alumni Italic";
  src: url("/fonts/AlumniSans-Italic-VariableFont_wght.ttf");
}

.Alumni_I {
  font-family: "Alumni Italic";
}

@font-face {
  font-family: "AudioWide";
  src: url("/fonts/Audiowide-Regular.ttf");
}

.AudioWide {
  font-family: "AudioWide";
}

@font-face {
  font-family: "Ansterdam";
  src: url("/fonts/Amsterdam-four.ttf");
}

.Ansterdam {
  font-family: "Ansterdam";
}
```

- [ ] **Step 2: Crear `src/styles/variables.css`**

```css
:root {
  --font-color-sub: rgba(255, 255, 255, 0.26);
  --bg-color: #000000;
  --text-color: #ffffff;
  --border: #757373;
  --green: #1ed760;
  --red: #d71e1e;
}
```

- [ ] **Step 3: Crear `src/styles/base.css`**

```css
*,
*:after {
  color: var(--text-color);
  box-sizing: border-box;
  transition: all 0.2s cubic-bezier(0.22, 0.61, 0.36, 1);
  text-wrap: balance;
  scrollbar-width: thin;
  scrollbar-color: #fff hsla(0, 0%, 100%, 0.1);
  scroll-behavior: smooth;
}

*::selection {
  background-color: #ff4a402c;
}

a {
  color: unset;
  text-decoration: none;
}

body {
  background-color: var(--bg-color);
  margin: 0;
  width: 100vw;
  overflow-x: hidden;
}

main {
  margin-inline: 50px;
}
```

- [ ] **Step 4: Crear `src/styles/utilities.css`**

```css
.flex {
  display: flex;
}

.flex_col {
  display: flex;
  flex-flow: column;
}

.grid {
  display: grid;
}

.grid_text_center {
  justify-content: center;
  place-items: center;
}

.wrap {
  flex-wrap: wrap;
}

.text_center {
  text-align: center;
}

.all_c {
  justify-content: center;
  justify-self: center;
  justify-items: center;
  align-content: center;
  align-self: center;
  align-items: center;
}

.j_sb {
  justify-content: space-between;
  align-content: space-between;
}

.j_se {
  justify-content: space-evenly;
  align-content: space-evenly;
}

.j_sa {
  justify-content: space-around;
  align-content: space-around;
}

.j_c {
  justify-content: center;
  align-content: center;
}

.alignI_c {
  align-items: center;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.fixed {
  position: fixed;
}

.sticky {
  position: sticky;
}

.centrar_absolutoX {
  left: 50%;
  transform: translateX(-50%);
}

.centrar_absolutoY {
  top: 50%;
  transform: translateY(-50%);
}

.centrar_absoluto {
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%);
}

.unselected,
.unselected * {
  user-select: none;
  -moz-user-select: none;
  -webkit-user-select: none;
  -webkit-user-drag: none;
}

.no_display {
  display: none;
}

.hidden {
  visibility: hidden;
}

.pointer {
  cursor: pointer;
}

.noise {
  background: black url('http://assets.iceable.com/img/noise-transparent.png') repeat 0 0;
  background-repeat: repeat;
}

.glass0 {
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}

.glass1 {
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
  backdrop-filter: blur(2px);
  -webkit-backdrop-filter: blur(2px);
}
```

- [ ] **Step 5: Crear `src/styles/cursors.css`**

```css
body {
  cursor:
    url('data:image/svg+xml,<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(%23filter0_d_8_111)"><path fill-rule="evenodd" clip-rule="evenodd" d="M22 15.5068L10 10L12.8382 23L16.3062 17.8654L22 15.5068Z" fill="%23000"/><path d="M22.1914 15.9687L23.2499 15.5302L22.2085 15.0523L10.2085 9.54556L9.29776 9.12761L9.51151 10.1066L12.3497 23.1066L12.5988 24.2477L13.2525 23.2799L16.6364 18.2698L22.1914 15.9687Z" stroke="white" stroke-width="1.5" stroke-miterlimit="16"/></g><defs><filter id="filter0_d_8_111" x="5.59552" y="6.25522" width="21.9043" height="23.2402" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB"><feFlood flood-opacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="1"/><feGaussianBlur stdDeviation="1.5"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_111"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_111" result="shape"/></filter></defs></svg>')
      10 10,
    auto;
}

a {
  cursor:
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="%23000000" stroke="%23FFFFFF" stroke-width="1.25" d="m16.24 12 3.18-3.18a1.5 1.5 0 0 0 0-2.12L17.3 4.58a1.5 1.5 0 0 0-2.12 0L12 7.76 8.82 4.58a1.5 1.5 0 0 0-2.12 0L4.58 6.7a1.5 1.5 0 0 0 0 2.12L7.76 12l-3.18 3.18a1.5 1.5 0 0 0 0 2.12l2.12 2.12a1.5 1.5 0 0 0 2.12 0L12 16.24l3.18 3.18a1.5 1.5 0 0 0 2.12 0l2.12-2.12a1.5 1.5 0 0 0 0-2.12L16.24 12Z"></path></svg>')
      10 5,
    auto;
}

.x-cursor {
  cursor:
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24"><path fill="%23000000" stroke="%23FFFFFF" stroke-width="1.25" d="m16.24 12 3.18-3.18a1.5 1.5 0 0 0 0-2.12L17.3 4.58a1.5 1.5 0 0 0-2.12 0L12 7.76 8.82 4.58a1.5 1.5 0 0 0-2.12 0L4.58 6.7a1.5 1.5 0 0 0 0 2.12L7.76 12l-3.18 3.18a1.5 1.5 0 0 0 0 2.12l2.12 2.12a1.5 1.5 0 0 0 2.12 0L12 16.24l3.18 3.18a1.5 1.5 0 0 0 2.12 0l2.12-2.12a1.5 1.5 0 0 0 0-2.12L16.24 12Z"></path></svg>')
      16 16,
    auto;
}
```

- [ ] **Step 6: Crear `src/styles/components-global.css`**

```css
.dot {
  position: absolute;
  border-radius: 50%;
  z-index: -10;
}

#top-menu {
  flex-grow: 2;
}

#top-menu div {
  flex-grow: 1;
}

#top-menu ul {
  flex-grow: 1;
  list-style: none;
  padding: 0;
}

.imageCard > * {
  width: 5rem;
  height: 5rem;
}

.pCard {
  height: 100%;
  flex: 1;
  overflow: hidden;
  border-radius: 10px;
  transition: all 0.5s;
  display: flex;
  justify-content: center;
  align-items: center;
  align-self: center;
  z-index: 1;
}

.pCard:hover {
  flex: 4;
  height: var(--carousel-height);
}

.pCard .tags li {
  background-color: var(--bgColor);
  color: var(--txtColor);
  padding: 3px 4px;
  gap: 5px;
  border-radius: 5px;
}

.pCard .tags li * {
  font-size: 1rem;
  fill: var(--txtColor);
  color: var(--txtColor);
}

.pCard .tags li svg {
  width: 15px;
  height: 15px;
}

.techs_container li > * {
  top: 50% !important;
  left: 50% !important;
  transform: translate(-50%, -50%);
  z-index: 1;
  position: absolute;
}

.techs_container ul:hover .li_hidden {
  opacity: 0.04;
}

#home1_bot p,
#me1 .top-section p,
#me3 p {
  transform: rotateZ(357deg);
}
```

- [ ] **Step 7: Actualizar `src/layouts/Layout.astro`**

Read: `src/layouts/Layout.astro`

Localizar el `import` (o `<GlobalStyles />`) que carga el archivo viejo. Reemplazar por imports de los nuevos archivos CSS en el frontmatter:

```astro
---
import "../styles/variables.css";
import "../styles/fonts.css";
import "../styles/base.css";
import "../styles/cursors.css";
import "../styles/utilities.css";
import "../styles/components-global.css";
// (resto del frontmatter intacto)
---
```

Eliminar cualquier referencia a `GlobalStyles.astro` o `<GlobalStyles />` en el markup.

El orden de imports importa: variables → fonts → base → cursors → utilities → components-global. Variables primero porque otros archivos las usan.

- [ ] **Step 8: Eliminar `src/styles/GlobalStyles.astro`**

Run: `git rm src/styles/GlobalStyles.astro`

- [ ] **Step 9: Verificar build**

Run: `npm run build`
Expected: sin errores.

- [ ] **Step 10: Verificar visualmente las 3 páginas con énfasis en estilos**

Run: `npm run dev`

Verificar en `/`, `/me`, `/contact`:
- Fuentes correctas (Dela, Poppins-R, Poppins-S, Alumni, Alumni Italic, AudioWide, Ansterdam según corresponda).
- Variables CSS (`--green` en player de Spotify, `--border` en bordes, etc.).
- Layout (flex, grid, gap, alineaciones).
- Cursor personalizado (flecha de papel + cruz sobre links).
- Selection color al seleccionar texto.
- Scrollbar fino.
- Backdrop blur en `.glass0` / `.glass1`.
- Cards de proyectos: flex: 1 normal, flex: 4 en hover, fondo del color, etc.
- Patrón hexagonal en `/`.
- Rotación `rotateZ(357deg)` en párrafos de #home1_bot, #me1, #me3.

Si algo se ve sin estilo (FOUC notable o flash de Times New Roman), revisar que el import en `Layout.astro` se cargue antes del contenido.

- [ ] **Step 11: Commit**

```bash
git add src/styles/ src/layouts/Layout.astro
git rm src/styles/GlobalStyles.astro 2>/dev/null || true
git commit -m "refactor: split GlobalStyles.astro into focused CSS files by concern"
```

---

## Phase 5: Limpieza de assets huérfanos

### Task 5.1: Auditar fonts en `public/fonts/`

**Files:** evaluar `public/fonts/*.ttf`

- [ ] **Step 1: Listar fonts y referencias**

Run:
```bash
ls public/fonts/
```

Para cada `.ttf`, buscar referencia:
```bash
for f in public/fonts/*.ttf; do
  name=$(basename "$f")
  count=$(grep -r "$name" src/ 2>/dev/null | wc -l)
  echo "$name: $count refs"
done
```

- [ ] **Step 2: Cross-check contra `fonts.css`**

Read: `src/styles/fonts.css`

Listar manualmente las fuentes referenciadas en `@font-face`. Comparar con el `ls` anterior.

Las que `@font-face` referencia (canónico):
- `DelaGothicOne-Regular.ttf`
- `Poppins-Regular.ttf`
- `Poppins-SemiBold.ttf`
- `AlumniSans-VariableFont_wght.ttf`
- `AlumniSans-Italic-VariableFont_wght.ttf`
- `Audiowide-Regular.ttf`
- `Amsterdam-four.ttf`

Las que están en disco según el ls original (`public/fonts/`):
- `AlumniSans-Italic-VariableFont_wght.ttf` ✓
- `AlumniSans-VariableFont_wght.ttf` ✓
- `Amsterdam-four.ttf` ✓
- `Audiowide-Regular.ttf` ✓
- `DelaGothicOne-Regular.ttf` ✓
- `Poppins-MediumItalic.ttf` ← **NO referenciada** → candidato a borrar
- `Poppins-Regular.ttf` ✓
- `Poppins-SemiBold.ttf` ✓
- `Poppins-ThinItalic.ttf` ← **NO referenciada** → candidato a borrar

- [ ] **Step 3: Doble check antes de borrar**

Para cada candidato, hacer una búsqueda más amplia:
```bash
grep -r "Poppins-MediumItalic" .
grep -r "Poppins-ThinItalic" .
```

Si aparecen en algún archivo (incluido CSS dinámico, scripts, lock files irrelevantes los descartamos), NO borrar.

Si están limpios (solo aparecen en `package-lock.json` o lock files o nada), proceder.

- [ ] **Step 4: Borrar fonts no usadas**

```bash
git rm public/fonts/Poppins-MediumItalic.ttf
git rm public/fonts/Poppins-ThinItalic.ttf
```

- [ ] **Step 5: Verificar build y visual**

Run: `npm run build && npm run dev`

Las fuentes en uso deben seguir cargando. Inspeccionar tab Network del navegador: las TTFs cargadas deben coincidir con las del `@font-face`.

- [ ] **Step 6: Commit**

```bash
git commit -m "chore: remove unused font files from public/fonts/"
```

---

### Task 5.2: Auditar SVGs en `public/`

**Files:** evaluar `public/circle.svg`, `public/cross.svg`, `public/question.svg`

- [ ] **Step 1: Buscar referencias por nombre base**

Run:
```bash
for f in public/circle.svg public/cross.svg public/question.svg; do
  name=$(basename "$f" .svg)
  count=$(grep -rn "$name\.svg\|/$name\b" src/ 2>/dev/null | wc -l)
  echo "$name.svg: $count refs"
done
```

- [ ] **Step 2: Decisión por archivo**

Para cada SVG:
- Si `count == 0` → candidato a borrar.
- Si `count > 0` → revisar las referencias. Si son uso real, dejar.

Si todos los SVGs están huérfanos, ejecutar:
```bash
git rm public/circle.svg public/cross.svg public/question.svg
```

Si solo algunos lo están, borrar solo esos.

- [ ] **Step 3: Verificar build y visual**

Run: `npm run build && npm run dev`

Si el build falla por un asset faltante, restaurar el archivo: `git checkout -- public/<nombre>.svg`.

- [ ] **Step 4: Commit (solo si hubo borrado)**

```bash
git commit -m "chore: remove unused SVG files from public/"
```

---

### Task 5.3: NO tocar OGG

`public/VIN.ogg` y `public/VINXD.ogg` se preservan SIEMPRE, aunque la búsqueda los reporte como huérfanos. Decisión explícita del usuario (audio interactivo planeado).

- [ ] **Step 1: Confirmar que NO se borraron por accidente**

Run:
```bash
ls public/*.ogg
```

Expected: ambos archivos presentes.

---

## Phase 6: Evaluación SSR → static

### Task 6.1: Detectar uso real de SSR

**Files:** read-only — `src/pages/*.astro`, `src/layouts/Layout.astro`, `src/components/*.astro`, `astro.config.mjs`

- [ ] **Step 1: Buscar usos de SSR-only APIs**

Run:
```bash
echo "=== Astro.request ==="
grep -rn "Astro.request" src/
echo "=== Astro.cookies ==="
grep -rn "Astro.cookies" src/
echo "=== Astro.redirect ==="
grep -rn "Astro.redirect" src/
echo "=== prerender = false ==="
grep -rn "prerender" src/
echo "=== API endpoints ==="
find src/pages -name "*.ts" -o -name "*.json.ts" -o -name "*.js.ts" 2>/dev/null
```

- [ ] **Step 2: Decisión**

Si los 5 greps devuelven CERO resultados → seguro pasar a `output: 'static'`.

Si algún grep devuelve algo → leer el contexto. Si es uso genuino de SSR → quedarse en `'server'` y saltar al Task 6.2 sin cambios.

- [ ] **Step 3: Si es seguro, modificar `astro.config.mjs`**

Read: `astro.config.mjs`

Cambiar `output: 'server'` → `output: 'static'`. Cambiar el adapter para simplificarlo (en modo static, `functionPerRoute`, `middleware`, `maxDuration`, `assets.upload` se vuelven irrelevantes o requieren ajuste):

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

(El bloque `vite: { build: { rollupOptions: { output: {} } } }` se elimina — estaba vacío, no aportaba nada.)

- [ ] **Step 4: Verificar build estático**

Run: `npm run build`

Inspect: que el output sea `dist/` con archivos estáticos (no funciones serverless).

- [ ] **Step 5: Verificar preview**

Run: `npm run preview`

Abrir `http://localhost:4321` y verificar las 3 páginas.

- [ ] **Step 6: Commit**

```bash
git add astro.config.mjs
git commit -m "chore: switch to static output (no SSR APIs in use)"
```

---

## Phase 7: Pasada de simplificación archivos restantes

Para cada archivo restante (los que NO se partieron en Phase 4), una revisión rápida. Solo se ejecuta lo que aporte; si el archivo está bien, se documenta y se pasa al siguiente.

### Task 7.1: Revisión de `Anchor.astro` (133 LOC), `Hexagon.astro` (106 LOC), `Navbar.astro` (160 LOC), `SideComponentMain.astro` (159 LOC), `Sidebar.astro` (63 LOC), `Highlighter.astro` (52 LOC), `CustomCursor.astro` (37 LOC), `Tools.astro` (339 LOC), `Contact.astro` (218 LOC), `Layout.astro` (239 LOC)

- [ ] **Step 1: Por cada archivo, leerlo y aplicar el checklist**

Para cada archivo en la lista anterior:

1. `Read` el archivo completo.
2. Aplicar este checklist:
   - **Imports muertos:** `astro check` los reporta. Si hay, eliminar.
   - **Props sin uso:** revisar la interface `Props` vs el markup. Si hay props declaradas y nunca usadas, eliminar.
   - **Variables/funciones declaradas y no usadas:** eliminar.
   - **Condicionales anidados:** ¿se pueden aplanar con early returns?
   - **Valores mágicos repetidos:** ¿se pueden extraer a constantes en frontmatter?
   - **Strings hardcodeados que parecen datos:** ¿deberían ir a `src/data/`?
   - **Listeners con `DOMContentLoaded` que deberían ser `astro:page-load`:** corregir (Astro maneja transiciones de página con view transitions, `DOMContentLoaded` no re-dispara).
   - **Optional chaining faltante:** donde haya `querySelector` sin guard, añadir.
   - **Duplicación de selectores CSS:** si hay duplicación literal, consolidar.
3. Si encuentras algo, hacer el cambio.
4. Verificar build: `npm run build`.
5. Verificar visualmente la parte afectada.
6. Commit atómico: `git commit -m "refactor(<nombre>): <breve descripción>"`.

Si el archivo no necesita cambios después de la revisión, comentar "(reviewed, no changes)" y pasar al siguiente sin commit.

Casos esperados (basado en lo que sabemos):
- `Anchor.astro`: probablemente reusable y limpio.
- `Tools.astro` (339): MAYOR atención. Es el más grande no partido. Releerlo y decidir si entra en split (ver Step 2).

- [ ] **Step 2: Re-evaluar `Tools.astro` para posible split**

Read: `src/components/Tools.astro`

Aplicar criterios de partición del spec:
- ¿>250 LOC? Sí (339).
- ¿>1 sección visualmente distinguible? — evaluar al leer.
- ¿Co-localizable? — sí, lo usa una sola página.

Si la lectura confirma multi-sección distinguible → diseñar el split (similar a Footer/Home/Me), documentarlo aquí inline y ejecutarlo como serie de sub-steps. Si es una unidad coherente → dejar y solo aplicar simplificación.

- [ ] **Step 3: Re-evaluar `Layout.astro` (239)**

Read: `src/layouts/Layout.astro`

Si solo es layout genuino (head, body shell, view transitions, imports globales) → no se parte. Solo aplicar simplificación.

Si contiene contenido que NO es layout (componentes hardcodeados de página, scripts no relacionados con layout) → extraer ese contenido.

---

## Phase 8: Verificación final y comparación con baseline

### Task 8.1: Inventario final + verificación end-to-end

- [ ] **Step 1: Inventario de tamaños final**

Run:
```bash
find src -type f \( -name "*.astro" -o -name "*.ts" -o -name "*.js" -o -name "*.css" \) -exec wc -l {} + | sort -rn | head -30
```

Comparar con baseline de Task 0.1 Step 3.

Validar:
- Ningún `.astro` en `src/components/` >250 LOC (salvo justificación).
- Cero `.js` en `src/` (todo `.ts` o `.astro`).

Si hay un archivo `.astro` >250 LOC fuera del scope re-evaluado, decidir: ¿se parte ahora o se deja documentado como follow-up?

- [ ] **Step 2: Build final**

Run: `npm run build`

Expected:
- Sin errores ni warnings nuevos respecto al baseline.
- Si pasaste a `output: 'static'`: build genera archivos pre-renderizados.

- [ ] **Step 3: Preview y verificación visual final**

Run: `npm run preview`

Recorrer las 3 páginas (`/`, `/me`, `/contact`) y verificar TODOS los puntos del baseline (Task 0.1 Step 2):

- [ ] Cursor personalizado en hover.
- [ ] Dots de fondo.
- [ ] Cards de proyectos: hover + carrusel.
- [ ] Footer: texto dinámico, wheel SVG, año actual.
- [ ] `/me`: 4 secciones, Spotify player.
- [ ] Patrón hexagonal en techs.
- [ ] Responsive en ~1075px y ~600px.

Si TODO pasa, continuar. Si algo falla, no marcar como completo — diagnosticar y arreglar con un commit adicional.

- [ ] **Step 4: Revisión del git log**

Run: `git log --oneline main..HEAD`

Cada commit debería:
- Tener mensaje claro siguiendo prefijos `feat:`, `refactor:`, `chore:`, `docs:`.
- Ser atómico (no mezclar refactor estructural con simplificación de otro archivo).
- Dejar la app funcionando (verificación visual ya hecha por commit).

- [ ] **Step 5: Anexo de findings**

Crear `docs/superpowers/findings/2026-05-21-foundation-findings.md` con:

```markdown
# Findings durante Foundation refactor — 2026-05-21

Lista de hallazgos NO resueltos en este spec, propuestos como follow-up.

## Para spec de seguridad
- Badge externo `visitcount.itsvg.in` en `README.md` (tracking de terceros).
- Revisar uso de `target="_blank"` sin `rel="noopener noreferrer"` en componentes (si quedan).
- Audit de deps (`npm audit`).
- Headers de Vercel (CSP, X-Frame-Options, etc.).

## Para spec de copy
- Texto de `/me` (4 secciones), `/`, `/contact` — pase de copywriting profesional.
- Mover los datos de `loves`/`hates` de `MeLikes.astro` a `src/data/likes.ts` cuando el copy se rediseñe.

## Para spec de features (OGG interactivo)
- `public/VIN.ogg` y `public/VINXD.ogg` siguen sin uso. Pendiente diseño de feature.

## Otros findings durante ejecución
<!-- añadir aquí cualquier cosa encontrada que no entró al spec actual -->
```

- [ ] **Step 6: Commit final del anexo**

```bash
git add docs/superpowers/findings/2026-05-21-foundation-findings.md
git commit -m "docs: add findings anexo from foundation refactor"
```

---

## Resumen de tareas

- Phase 0: Baseline (no commit).
- Phase 1: React Islands setup (2 commits).
- Phase 2: TS migration (2 commits).
- Phase 3: Data extraction (3 commits).
- Phase 4: Component splits (5 commits).
- Phase 5: Asset cleanup (0-2 commits).
- Phase 6: SSR → static (0-1 commit).
- Phase 7: Per-file simplification (0-N commits, atómicos).
- Phase 8: Findings anexo (1 commit).

Total esperado: ~15-20 commits atómicos en 2-3 sesiones.
