# Magnetic Liquid Glass Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar `Card.astro` (carousel-based, roto sin imágenes) por una card de liquid glass con refracción óptica real (SVG `feDisplacementMap`) + interacción magnética asimétrica con fire threshold + histéresis. Cero cambios a `cases.ts`.

**Architecture:** 4 buckets atómicos A→B→C→D, riesgo creciente. A define el SVG filter global, B introduce la lógica de interacción aislada, C es el switch visual atómico (Card.astro + HomeProjects.astro juntos), D limpia el archivo legacy huérfano.

**Tech Stack:** Astro 6 + TypeScript + CSS puro + SVG `feTurbulence` + `feDisplacementMap`. `requestAnimationFrame` para mouse throttling (no GSAP para esta feature). Cero dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-05-26-magnetic-liquid-glass-cards-design.md`

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/layouts/Layout.astro` | Modify | Añadir SVG filter `#glassRefract` inline en `<body>` (global, una sola definición) |
| `src/components/magnetic-cards.ts` | Create | Lógica de interacción: cacheBases, mousemove handler con histéresis, touch handler, focus a11y, reduced-motion |
| `src/components/Card.astro` | Rewrite | Markup nuevo (mg-cover, mg-meta, mg-title, mg-detail) + estilos glass + fired state |
| `src/components/home/HomeProjects.astro` | Modify | Backdrop ornaments (blobs + grid) + helper `zoneFor` + import script de magnetic-cards |
| `src/components/card-interactions.ts` | Delete | Archivo legacy, queda huérfano tras Bucket C |

---

## Pre-flight: Baseline state

### Task 0: Confirmar baseline

**Files:** ninguno modificado.

- [ ] **Step 0.1: Verificar branch + working tree limpio**

Run: `git status && git branch --show-current`
Expected: branch `magnetic-liquid-glass-cards`, `nothing to commit, working tree clean`. Si no estás en esa branch: `git checkout magnetic-liquid-glass-cards`.

- [ ] **Step 0.2: Build baseline pasa**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints` + build exitoso. Si falla, NO continuar.

- [ ] **Step 0.3: Confirmar último commit es el spec**

Run: `git log --oneline -2`
Expected: el commit más reciente es `docs(spec): add Magnetic Liquid Glass Cards design (Spec 5)` (hash `c54f2c4` o equivalente).

---

## Bucket A — SVG filter global

### Task A.1: Añadir SVG filter inline a Layout.astro

**Files:**
- Modify: `src/layouts/Layout.astro:31` (insertar después de la apertura de `<body>`)

- [ ] **Step A.1.1: Editar Layout.astro**

Localizar la línea 31 con `<body class="noise flex j_sb">`. Insertar el bloque SVG inmediatamente DESPUÉS de esa línea, ANTES del comentario `<!-- <CustomCursor ... -->` (línea 32 original).

ANTES (líneas 31-33 actuales):
```astro
  <body class="noise flex j_sb">
    <!-- <CustomCursor data-astro-transition="swap" /> -->
    <div id="dot-container" class="fixed" transition:persist></div>
```

DESPUÉS:
```astro
  <body class="noise flex j_sb">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <filter id="glassRefract" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise"/>
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
    <!-- <CustomCursor data-astro-transition="swap" /> -->
    <div id="dot-container" class="fixed" transition:persist></div>
```

Notas para el implementer:
- El `<svg width="0" height="0" style="position:absolute">` lo hace visualmente invisible (no ocupa layout).
- El filter `#glassRefract` está disponible globalmente para cualquier elemento que haga `backdrop-filter: url(#glassRefract)`.
- `transition:persist` NO se aplica al SVG — el filter es un asset estático que sobrevive en el DOM porque `<body>` mismo persiste entre transitions.

- [ ] **Step A.1.2: Verificar build**

Run: `npm run build`
Expected: 0/0/0. El SVG inline es HTML estándar, no rompe nada.

- [ ] **Step A.1.3: Verificar grep**

Run: `grep -n "feDisplacementMap" src/layouts/Layout.astro`
Expected: muestra la línea con el filter (~línea 36).

- [ ] **Step A.1.4: Commit**

```bash
git add src/layouts/Layout.astro
git commit -m "feat(layout): add SVG glass refract filter for liquid glass cards

Filter inline en <body>, hidden via width=0 height=0 style=position:absolute.
Disponible globalmente para cualquier elemento vía
backdrop-filter: url(#glassRefract). feTurbulence + feDisplacementMap
scale=22 produce refracción óptica orgánica."
```

---

## Bucket B — Lógica magnética (TS)

### Task B.1: Crear src/components/magnetic-cards.ts

**Files:**
- Create: `src/components/magnetic-cards.ts`

- [ ] **Step B.1.1: Crear archivo con EXACTAMENTE este contenido**

Crear `src/components/magnetic-cards.ts` con:

```ts
type Stage = HTMLElement;
type Card = HTMLElement;

interface BaseRect {
  left: number;
  top: number;
  w: number;
  h: number;
}

const MAX_PULL = 28;
const FIRE_ENTER = 70;
const FIRE_EXIT = 130;

let firedCard: Card | null = null;
let rafId: number | null = null;
let pendingEvent: MouseEvent | null = null;

const bases = new Map<Card, BaseRect>();

function cacheBases(stage: Stage, cards: Card[]): void {
  const sr = stage.getBoundingClientRect();
  for (const c of cards) {
    const prevTransform = c.style.transform;
    const prevClass = c.className;
    c.style.transform = 'none';
    c.classList.remove('fired', 'attracting');
    const r = c.getBoundingClientRect();
    bases.set(c, {
      left: r.left - sr.left,
      top: r.top - sr.top,
      w: r.width,
      h: r.height,
    });
    c.style.transform = prevTransform;
    c.className = prevClass;
  }
}

function getZone(card: Card) {
  const b = bases.get(card)!;
  const zl = parseInt(card.dataset.zoneLeft || '0', 10);
  const zr = parseInt(card.dataset.zoneRight || '0', 10);
  const zv = parseInt(card.dataset.zoneVert || '0', 10);
  return {
    left: b.left - zl,
    right: b.left + b.w + zr,
    top: b.top - zv,
    bottom: b.top + b.h + zv,
    cx: b.left + b.w / 2,
    cy: b.top + b.h / 2,
  };
}

function getCurrentBounds(stage: Stage, card: Card) {
  const r = card.getBoundingClientRect();
  const sr = stage.getBoundingClientRect();
  return {
    left: r.left - sr.left,
    right: r.right - sr.left,
    top: r.top - sr.top,
    bottom: r.bottom - sr.top,
  };
}

function updateSpecular(card: Card, e: MouseEvent): void {
  const cr = card.getBoundingClientRect();
  const rx = ((e.clientX - cr.left) / cr.width) * 100;
  const ry = ((e.clientY - cr.top) / cr.height) * 100;
  card.style.setProperty('--rx', `${rx}%`);
  card.style.setProperty('--ry', `${ry}%`);
}

function resetCard(card: Card): void {
  card.style.transform = 'translate(0,0) scale(1)';
  card.classList.remove('attracting');
  card.style.removeProperty('--rx');
  card.style.removeProperty('--ry');
}

function fireCard(card: Card): void {
  card.classList.add('fired');
  card.classList.remove('attracting');
  card.style.transform = 'translate(0,0) scale(1.02)';
}

function unfireCard(card: Card): void {
  card.classList.remove('fired');
  card.style.transform = 'translate(0,0) scale(1)';
}

function processMouseMove(stage: Stage, cards: Card[], e: MouseEvent): void {
  const sr = stage.getBoundingClientRect();
  const mx = e.clientX - sr.left;
  const my = e.clientY - sr.top;

  // Priority 1: if there's a firedCard, check expanded bounds first
  if (firedCard) {
    const eb = getCurrentBounds(stage, firedCard);
    const insideExpanded =
      mx >= eb.left && mx <= eb.right && my >= eb.top && my <= eb.bottom;
    if (insideExpanded) {
      updateSpecular(firedCard, e);
      for (const c of cards) if (c !== firedCard) resetCard(c);
      return;
    }
    const z = getZone(firedCard);
    const d = Math.hypot(mx - z.cx, my - z.cy);
    if (d <= FIRE_EXIT) {
      updateSpecular(firedCard, e);
      for (const c of cards) if (c !== firedCard) resetCard(c);
      return;
    }
    unfireCard(firedCard);
    firedCard = null;
  }

  // Priority 2: pick winner from base zones
  let winner: { card: Card; dx: number; dy: number; d: number; z: ReturnType<typeof getZone> } | null = null;
  let winnerDist = Infinity;
  for (const c of cards) {
    const z = getZone(c);
    if (mx < z.left || mx > z.right || my < z.top || my > z.bottom) continue;
    const dx = mx - z.cx;
    const dy = my - z.cy;
    const d = Math.hypot(dx, dy);
    if (d < winnerDist) {
      winnerDist = d;
      winner = { card: c, dx, dy, d, z };
    }
  }

  for (const c of cards) if (!winner || c !== winner.card) resetCard(c);

  if (winner) {
    const { card, dx, dy, d, z } = winner;
    if (d < FIRE_ENTER) {
      fireCard(card);
      firedCard = card;
    } else {
      card.classList.add('attracting');
      const maxDist = Math.max(z.right - z.cx, z.cx - z.left, z.bottom - z.cy, z.cy - z.top);
      const pullFactor = Math.max(0, 1 - d / maxDist);
      const pull = pullFactor * MAX_PULL;
      const len = Math.max(d, 1);
      const tx = (dx / len) * pull;
      const ty = (dy / len) * pull;
      card.style.transform = `translate(${tx}px, ${ty}px) scale(${1 + pullFactor * 0.02})`;
    }
    updateSpecular(card, e);
  }
}

function onMouseMove(stage: Stage, cards: Card[]) {
  return (e: MouseEvent) => {
    pendingEvent = e;
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      rafId = null;
      if (pendingEvent) {
        processMouseMove(stage, cards, pendingEvent);
        pendingEvent = null;
      }
    });
  };
}

function onMouseLeave(cards: Card[]) {
  return () => {
    for (const c of cards) {
      c.style.transform = 'translate(0,0) scale(1)';
      c.classList.remove('attracting', 'fired');
      c.style.removeProperty('--rx');
      c.style.removeProperty('--ry');
    }
    firedCard = null;
  };
}

function onTouchEnd(cards: Card[]) {
  return (e: TouchEvent) => {
    const target = e.target as HTMLElement;
    const tappedCard = target.closest('.mg-card') as Card | null;

    if (tappedCard && cards.includes(tappedCard)) {
      if (tappedCard === firedCard) {
        // segundo tap en card fired → deja que <a> navegue (no preventDefault)
        return;
      }
      e.preventDefault();
      if (firedCard) unfireCard(firedCard);
      fireCard(tappedCard);
      firedCard = tappedCard;
    } else {
      if (firedCard) {
        unfireCard(firedCard);
        firedCard = null;
      }
    }
  };
}

export function initMagneticCards(): void {
  const stage = document.getElementById('casos');
  if (!stage) return;
  const cards = Array.from(stage.querySelectorAll<HTMLElement>('.mg-card'));
  if (cards.length === 0) return;

  cacheBases(stage, cards);

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouch) {
    stage.addEventListener('touchend', onTouchEnd(cards), { passive: false });
  } else if (!reducedMotion) {
    stage.addEventListener('mousemove', onMouseMove(stage, cards));
    stage.addEventListener('mouseleave', onMouseLeave(cards));
  }

  // Keyboard accessibility: focus mirror del fired state
  for (const c of cards) {
    c.addEventListener('focusin', () => {
      if (firedCard && firedCard !== c) unfireCard(firedCard);
      fireCard(c);
      firedCard = c;
    });
    c.addEventListener('focusout', () => {
      if (firedCard === c) {
        unfireCard(c);
        firedCard = null;
      }
    });
  }

  window.addEventListener('resize', () => cacheBases(stage, cards));
}
```

Notas para el implementer:
- Las constantes `MAX_PULL`, `FIRE_ENTER`, `FIRE_EXIT` están al top — fáciles de tunear si después se quiere.
- `cacheBases` resetea transform/classes ANTES de medir para que el `getBoundingClientRect()` retorne la posición base sin contaminar por estados aplicados.
- `processMouseMove` tiene 2 prioridades: (1) chequear bounds expandidos del firedCard, (2) pick winner de zonas base.
- `requestAnimationFrame` throttling: solo se procesa 1 mousemove por frame. Evita sobrecarga.
- Touch: cero magnet. Solo tap → fire / tap fuera → cierra / 2do tap → navega.
- Focus: dispara fire visual. El `<a>` href del Card.astro hace el navegar default en Enter.

- [ ] **Step B.1.2: Verificar build (type check)**

Run: `npm run build`
Expected: 0/0/0. El archivo es puro TS, sin imports externos, no rompe nada. `astro check` valida los tipos.

- [ ] **Step B.1.3: Verificar archivo creado**

Run: `test -f src/components/magnetic-cards.ts && wc -l src/components/magnetic-cards.ts`
Expected: archivo existe, ~200 líneas aproximadamente.

- [ ] **Step B.1.4: Commit**

```bash
git add src/components/magnetic-cards.ts
git commit -m "feat(cards): add magnetic-cards.ts interaction logic

Lógica completa para liquid glass cards:
- Zonas asimétricas via data-zone-{left,right,vert} en cada card
- Magnet pull proporcional al pullFactor (MAX_PULL=28)
- Fire threshold con histéresis (entrar 70, salir 130)
- Prioridad: bounds expandidos > histéresis > pick winner
- rAF throttling para mousemove
- Touch tap → fire / tap fuera → cierra / 2do tap → navega
- Focus accessibility (mirror del fired)
- prefers-reduced-motion deshabilita mousemove
- No GSAP, no dependencias nuevas"
```

---

## Bucket C — Refactor visual atómico (Card.astro + HomeProjects.astro)

> **Atomic commit:** Card.astro y HomeProjects.astro se cambian JUNTOS porque el nuevo Card depende del nuevo wrapper HomeProjects (script import nuevo + data-zone-* atributos + backdrop ornaments).

### Task C.1: Reemplazar Card.astro completamente

**Files:**
- Modify: `src/components/Card.astro` (rewrite completo)

- [ ] **Step C.1.1: Reemplazar TODO el contenido de Card.astro**

Sobrescribir `src/components/Card.astro` con EXACTAMENTE:

```astro
---
import { tagConfigs } from "../data/tag-configs";

interface Props {
  text: string;
  href: string;
  company: string;
  role: string;
  period: string;
  cover: string;
  bgColor?: string;
  txtColor?: string;
  tags?: Record<string, string>;
  zoneLeft?: number;
  zoneRight?: number;
  zoneVert?: number;
}

const {
  text,
  href,
  company,
  role,
  period,
  cover,
  bgColor = "#1a3a52",
  txtColor = "#fff",
  tags = {},
  zoneLeft = 60,
  zoneRight = 60,
  zoneVert = 120,
} = Astro.props;

function tagItem(label: string, bg?: string, color?: string): string {
  const style = bg && color
    ? ` style="background:${bg};color:${color};border-color:transparent;"`
    : "";
  return `<li class="mg-tag"${style}>${label}</li>`;
}

function renderTag(key: string, setting: string): string {
  if (!key.startsWith("template")) return tagItem(key);
  const config = tagConfigs[setting];
  return config ? tagItem(config.label, config.bgColor, config.txtColor) : "";
}

const processedTags = Object.entries(tags).map(([k, v]) => renderTag(k, v));
const isSvgCover = cover.toLowerCase().endsWith("</svg>");
---

<a
  class="mg-card"
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  data-zone-left={zoneLeft}
  data-zone-right={zoneRight}
  data-zone-vert={zoneVert}
  style={`--cover-bg: ${bgColor}; --cover-fg: ${txtColor};`}
>
  <div class="mg-shine" aria-hidden="true"></div>
  <div class="mg-cover">
    {isSvgCover ? <Fragment set:html={cover} /> : <img src={cover} alt="" loading="lazy" />}
  </div>
  <div class="mg-meta">
    <span class="mg-company">{company}</span>
    <span class="mg-period">{period}</span>
  </div>
  <p class="mg-title">{text}</p>
  <div class="mg-detail">
    <div class="mg-role">{role}</div>
    <ul class="mg-tags">{processedTags.map((html) => <Fragment set:html={html} />)}</ul>
    <span class="mg-cta">Ver más →</span>
  </div>
</a>

<style>
  .mg-card {
    width: 200px;
    height: 280px;
    border-radius: 22px;
    padding: 14px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    overflow: hidden;
    color: #fff;
    text-decoration: none;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.18) 0%,
      rgba(255, 255, 255, 0.03) 55%,
      rgba(255, 255, 255, 0.1) 100%
    );
    backdrop-filter: url(#glassRefract) blur(12px) saturate(180%) brightness(108%);
    -webkit-backdrop-filter: url(#glassRefract) blur(12px) saturate(180%) brightness(108%);
    box-shadow:
      0 12px 36px rgba(0, 0, 0, 0.35),
      0 1px 0 rgba(255, 255, 255, 0.3) inset,
      0 -1px 0 rgba(0, 0, 0, 0.18) inset,
      0 0 0 1px rgba(255, 255, 255, 0.08) inset;
    will-change: transform, height;
    transition:
      transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
      height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1),
      background 0.4s,
      box-shadow 0.4s;
  }

  .mg-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.6) 0%,
      rgba(255, 255, 255, 0.1) 30%,
      rgba(255, 255, 255, 0.05) 70%,
      rgba(255, 255, 255, 0.4) 100%
    );
    -webkit-mask:
      linear-gradient(#000, #000) content-box,
      linear-gradient(#000, #000);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#000 0 0) content-box,
      linear-gradient(#000 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }

  .mg-shine {
    position: absolute;
    inset: -50%;
    background: radial-gradient(
      circle at var(--rx, 50%) var(--ry, 50%),
      rgba(255, 255, 255, 0.35) 0%,
      rgba(255, 255, 255, 0.08) 25%,
      transparent 50%
    );
    mix-blend-mode: screen;
    opacity: 0;
    transition: opacity 0.3s;
    pointer-events: none;
  }
  .mg-card.attracting .mg-shine,
  .mg-card.fired .mg-shine,
  .mg-card:focus-within .mg-shine {
    opacity: 1;
  }

  .mg-cover {
    height: 90px;
    border-radius: 14px;
    background: var(--cover-bg);
    color: var(--cover-fg);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.3),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
    position: relative;
    z-index: 1;
  }
  .mg-cover :global(svg) {
    width: 70%;
    height: auto;
  }
  .mg-cover img {
    max-width: 70%;
    height: auto;
  }

  .mg-meta {
    display: flex;
    justify-content: space-between;
    gap: 8px;
    font-size: 0.6rem;
    opacity: 0.75;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    position: relative;
    z-index: 1;
  }

  .mg-title {
    font-size: 0.85rem;
    line-height: 1.35;
    margin: 0;
    font-weight: 500;
    position: relative;
    z-index: 1;
  }

  .mg-detail {
    max-height: 0;
    overflow: hidden;
    opacity: 0;
    transition:
      max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
      opacity 0.4s;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    z-index: 1;
  }

  .mg-role {
    font-size: 0.65rem;
    opacity: 0.75;
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .mg-tags {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }

  .mg-tag {
    background: rgba(255, 255, 255, 0.2);
    color: #fff;
    padding: 3px 8px;
    border-radius: 5px;
    font-size: 0.65rem;
    letter-spacing: 0.05em;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    text-transform: uppercase;
  }

  .mg-cta {
    font-size: 0.75rem;
    margin-top: auto;
    padding-top: 6px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
    font-weight: 600;
    letter-spacing: 0.05em;
  }

  .mg-card.fired,
  .mg-card:focus-within {
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.28) 0%,
      rgba(255, 255, 255, 0.06) 55%,
      rgba(255, 255, 255, 0.18) 100%
    );
    box-shadow:
      0 20px 60px rgba(0, 0, 0, 0.45),
      0 1px 0 rgba(255, 255, 255, 0.42) inset,
      0 -1px 0 rgba(0, 0, 0, 0.2) inset,
      0 0 0 1px rgba(255, 255, 255, 0.15) inset,
      0 0 30px rgba(255, 255, 255, 0.12);
    height: 360px;
  }
  .mg-card.fired .mg-cover,
  .mg-card:focus-within .mg-cover {
    transform: scale(0.88) translateY(-4px);
  }
  .mg-card.fired .mg-detail,
  .mg-card:focus-within .mg-detail {
    max-height: 200px;
    opacity: 1;
  }

  @media (prefers-reduced-motion: reduce) {
    .mg-card {
      backdrop-filter: blur(12px) saturate(140%);
      -webkit-backdrop-filter: blur(12px) saturate(140%);
      transition: none !important;
    }
    .mg-card.attracting,
    .mg-card.fired {
      transform: none !important;
    }
    .mg-shine {
      display: none;
    }
  }

  @media (max-width: 1075px) {
    .mg-card {
      width: 100%;
      max-width: 320px;
    }
  }
</style>
```

Notas para el implementer:
- Eliminada toda referencia a `hrefImages` y carousel. La interface `Case` en `cases.ts` conserva `hrefImages?` opcional unused (decisión declarada en spec).
- Eliminado import de `DEFAULT_CARD_COVER` (no se necesita — todos los casos definen su cover).
- `data-zone-*` se reciben como props (default 60/60/120 = card central). HomeProjects.astro los override según index del array.
- Estados `attracting`, `fired`, `:focus-within` aplican mismos estilos visuales del fired (a11y mirror).
- Reduced motion desactiva el SVG filter (cae a blur normal) y los transforms.

- [ ] **Step C.1.2: Verificar build (sin commit aún)**

Run: `npm run build`
Expected: probablemente FALLA con errores tipo "Property 'hrefImages' does not exist on type Props" porque HomeProjects.astro aún pasa `hrefImages` al `<Card>`. ESPERADO — se arregla en C.2 en este mismo commit atómico.

### Task C.2: Actualizar HomeProjects.astro

**Files:**
- Modify: `src/components/home/HomeProjects.astro` (rewrite — solo este archivo)

- [ ] **Step C.2.1: Reemplazar TODO el contenido de HomeProjects.astro**

Sobrescribir `src/components/home/HomeProjects.astro` con EXACTAMENTE:

```astro
---
import Card from "../Card.astro";
import Anchor from "../Anchor.astro";
import { cases } from "../../data/cases";

function zoneFor(idx: number, total: number) {
  if (total === 1) return { zoneLeft: 220, zoneRight: 220, zoneVert: 120 };
  if (idx === 0) return { zoneLeft: 220, zoneRight: 60, zoneVert: 120 };
  if (idx === total - 1) return { zoneLeft: 60, zoneRight: 220, zoneVert: 120 };
  return { zoneLeft: 20, zoneRight: 20, zoneVert: 240 };
}
---

<section id="casos">
  <h2 class="Dela"><span class="hidden_text">Real</span> CASOS</h2>
  <div class="casos-stage">
    <div class="casos-blob casos-blob-1"></div>
    <div class="casos-blob casos-blob-2"></div>
    <div class="casos-blob casos-blob-3"></div>
    <div class="casos-grid"></div>
    <div class="casos-cards">
      {
        cases.map((caseItem, idx) => {
          const zones = zoneFor(idx, cases.length);
          return (
            <Card
              text={caseItem.text}
              href={caseItem.href}
              company={caseItem.company}
              role={caseItem.role}
              period={caseItem.period}
              cover={caseItem.cover}
              bgColor={caseItem.bgColor}
              txtColor={caseItem.txtColor}
              tags={caseItem.tags}
              zoneLeft={zones.zoneLeft}
              zoneRight={zones.zoneRight}
              zoneVert={zones.zoneVert}
            />
          );
        })
      }
    </div>
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

<script>
  import { initMagneticCards } from "../magnetic-cards";
  document.addEventListener("astro:page-load", initMagneticCards);
</script>

<style>
  .hidden_text {
    opacity: 0;
  }

  h2:hover .hidden_text {
    opacity: 0.5;
  }

  .casos-stage {
    position: relative;
    min-height: 440px;
    border-radius: 16px;
    overflow: hidden;
    padding: 40px 24px;
    background:
      radial-gradient(ellipse at 20% 30%, #1a3a52 0%, #0a1929 60%),
      #0a1929;
  }

  .casos-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(1px);
    opacity: 0.75;
    pointer-events: none;
  }
  .casos-blob-1 {
    width: 320px;
    height: 320px;
    background: #5e4ae3;
    top: 0;
    left: 5%;
  }
  .casos-blob-2 {
    width: 260px;
    height: 260px;
    background: #e07a5f;
    top: 40%;
    right: 3%;
  }
  .casos-blob-3 {
    width: 240px;
    height: 240px;
    background: #1d4e3f;
    bottom: -5%;
    left: 30%;
  }

  .casos-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 32px 32px;
    pointer-events: none;
  }

  .casos-cards {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    min-height: 360px;
    z-index: 1;
  }

  #casos blockquote {
    margin-block: 4rem;
    padding-top: 125px;
  }

  @media screen and (max-width: 1075px) {
    .casos-stage {
      min-height: auto;
      padding: 32px 16px;
    }
    .casos-cards {
      flex-direction: column;
      align-items: stretch;
      gap: 20px;
    }
  }

  @media screen and (max-width: 780px) {
    .hidden_text {
      opacity: 0.5;
    }
  }
</style>
```

Notas para el implementer:
- `zoneFor()` retorna las zonas asimétricas según índice. 3 cases → extrema izq, central, extrema der. Si en el futuro hay >3 cases, las intermedias usan zone central (estrecha lateral + alta vertical).
- El script ahora importa `initMagneticCards` (no `initCards`). Patrón idéntico al previo: registrar listener a `astro:page-load` para ClientRouter compat.
- `min-height: 440px` en `.casos-stage` acomoda la altura del estado `fired` (cards de 360px + paddings) sin layout shift.
- Las blob colors están hardcoded para coherencia con la paleta del sitio (azul/naranja/verde). Si se quiere parametrizar, futuro spec.
- Eliminado el script anterior que calculaba `--calculated-height` (relacionado al carousel + cards old).
- Eliminada la prop `hrefImages` (Card.astro nueva no la acepta).

- [ ] **Step C.2.2: Verificar build**

Run: `npm run build`
Expected: 0/0/0. Ambos archivos (Card.astro + HomeProjects.astro) están sincronizados.

- [ ] **Step C.2.3: Verificar greps**

Run: `grep -rn "hrefImages" src/components/`
Expected: vacío (Card.astro y HomeProjects.astro ya no la referencian; cases.ts NO está en `src/components/` así que no la encuentra ahí).

Run: `grep -rn "initCards" src/`
Expected: vacío (Card.astro ya no importa de card-interactions.ts).

Run: `grep -rn "initMagneticCards" src/`
Expected: 2 matches — uno en `magnetic-cards.ts` (export) y uno en `HomeProjects.astro` (import + invocación).

Run: `grep -rn "card-interactions" src/`
Expected: vacío. El archivo viejo queda huérfano para borrarse en Bucket D.

- [ ] **Step C.2.4: Commit (atómico de C.1 + C.2)**

```bash
git add src/components/Card.astro src/components/home/HomeProjects.astro
git commit -m "feat(cards): replace Card carousel with magnetic liquid glass design

Refactor visual atómico:
- Card.astro: rewrite completo. Glass stack (backdrop-filter url(#glassRefract)
  + gradient border via mask-composite + multi-layer box-shadow). Markup nuevo
  con mg-cover, mg-meta (company/period), mg-title, mg-detail (role/tags/cta).
  Estados: idle, attracting, fired, :focus-within.
- HomeProjects.astro: backdrop ornaments (3 blobs colorados + grid sutil) en
  .casos-stage para que la refracción tenga estructura visible qué deformar.
  Helper zoneFor() asigna data-zone-* asimétricos por posición del card.
  Script import nuevo: initMagneticCards from ../magnetic-cards (reemplaza
  el initCards viejo + lógica de --calculated-height).
- prefers-reduced-motion: filter desactivado + transforms off (CSS).
- Mobile: cards full-width, stage padding reducido.

Resuelve el bug original: Card no se rompe sin hrefImages (carousel
eliminado). Aspecto + interacción aprobados en brainstorm visual con
mockups iterativos."
```

---

## Bucket D — Cleanup legacy

### Task D.1: Eliminar card-interactions.ts

**Files:**
- Delete: `src/components/card-interactions.ts`

- [ ] **Step D.1.1: Confirmar 0 refs antes de eliminar**

Run: `grep -rn "card-interactions" src/`
Expected: vacío. Si hay output: NO eliminar — investigar la ref antes.

- [ ] **Step D.1.2: Eliminar el archivo**

Run: `rm src/components/card-interactions.ts`

- [ ] **Step D.1.3: Verificar build**

Run: `npm run build`
Expected: 0/0/0. El archivo era huérfano, su eliminación no rompe nada.

- [ ] **Step D.1.4: Verificar archivo eliminado**

Run: `test ! -f src/components/card-interactions.ts && echo "OK" || echo "FAIL"`
Expected: `OK`.

- [ ] **Step D.1.5: Commit**

```bash
git add -u src/components/card-interactions.ts
git commit -m "chore(cards): remove legacy card-interactions.ts

Archivo huérfano tras el refactor de Card.astro. La lógica del
carousel-on-hover ya no aplica (Card no tiene carousel)."
```

---

## Final: verificación + PR

### Task F.1: Verificación integral

**Files:** ninguno modificado.

- [ ] **Step F.1.1: Criterios automáticos del spec**

Ejecutar todos:

```bash
test -f src/components/Card.astro && echo "Card.astro: OK"
test -f src/components/magnetic-cards.ts && echo "magnetic-cards.ts: OK"
test ! -f src/components/card-interactions.ts && echo "card-interactions.ts removed: OK"
grep -rn "card-interactions" src/ && echo "FAIL: refs orphans" || echo "no refs: OK"
grep -c "feDisplacementMap" src/layouts/Layout.astro
grep -c "initMagneticCards" src/components/magnetic-cards.ts
grep -c "initMagneticCards" src/components/home/HomeProjects.astro
diff -q <(cat src/data/cases.ts) <(git show main:src/data/cases.ts) && echo "cases.ts unchanged: OK"
npm run build 2>&1 | tail -3
```

Expected:
- 4× `OK`
- 2× `1` (grep counts ≥ 1)
- `0` warnings/errors/hints en build
- `cases.ts unchanged: OK`

- [ ] **Step F.1.2: Push branch para preview deploy**

Run: `git push -u origin magnetic-liquid-glass-cards`
Expected: branch push exitoso. Vercel arranca preview deploy automáticamente (~1-3 min).

- [ ] **Step F.1.3: Esperar preview deploy + obtener URL**

Manual: Vercel dashboard → Deployments → branch `magnetic-liquid-glass-cards` → estado Ready → copiar preview URL.

### Task F.2: Smoke test manual en preview

**Files:** ninguno modificado.

- [ ] **Step F.2.1: securityheaders.com no regresa**

Manual: https://securityheaders.com/?q=`<preview-url>`
Expected: A+ (igual que producción). El SVG filter inline no es script ni style, no afecta CSP nativo de Spec 4.

- [ ] **Step F.2.2: Visual — glass + refracción**

Manual: abrir `<preview-url>/` en Chrome con DevTools. Verificar:
- 3 cards de liquid glass visibles en la sección `#casos`
- Backdrop con 3 blobs colorados (violeta, naranja, verde) + grid sutil
- Refracción: al mover mouse, los blobs detrás de las cards se ven distorsionados/warped (no solo blureados)
- Specular highlight: pequeño glow blanco sigue el cursor sobre cada card
- DevTools Console: cero errores CSP

- [ ] **Step F.2.3: Interacción magnética — zonas asimétricas**

Manual:
- Pasar mouse desde la izquierda lentamente hacia las cards: la card 1 (Clonai) atrapa desde lejos
- Pasar mouse horizontalmente a media altura entre cards: la card central (Justicia) NO debe atrapar
- Aproximar verticalmente la card central por arriba/abajo: SÍ atrae
- Card 3 (V→A) mirror de la 1

- [ ] **Step F.2.4: Fire state — no flicker**

Manual:
- Acercarse a cualquier card hasta que dispare (< 70px del centro)
- Card expande de 280 → 360px, revela role + tags + CTA
- Mover mouse libremente por toda la card expandida — NO debe haber flicker entre fired/attracting
- Alejarse lentamente — debe contraerse solo cuando salgas de la histéresis (130px del centro base)

- [ ] **Step F.2.5: Touch — DevTools touch emulation**

Manual: DevTools → Device toolbar → simular iPhone:
- Tap una card: fire visual (sin magnet pull)
- Tap fuera (en el background del stage): card se contrae
- Tap la misma card fired de nuevo: navega al href en nueva tab

- [ ] **Step F.2.6: Keyboard accessibility**

Manual: con teclado:
- Tab navega a la primera card → fire visual + tags + CTA visibles
- Tab a la siguiente → la anterior se contrae, la nueva fire
- Enter sobre card focused → navega al href

- [ ] **Step F.2.7: prefers-reduced-motion**

Manual: DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce":
- Recargar la página
- Mover mouse sobre las cards: NO debe haber magnet pull ni fire automático
- backdrop-filter se simplifica a blur normal (sin refracción)
- Tab keyboard focus SÍ debe seguir disparando fire (a11y)

- [ ] **Step F.2.8: No-regresión en otras secciones**

Manual: navegar a `/me` y `/contact`:
- Audio loop sigue funcionando
- Cursor custom OK
- Sidebar/navbar/footer sin cambios
- DevTools Console limpia

### Task F.3: Abrir PR

**Files:** ninguno modificado.

- [ ] **Step F.3.1: gh pr create**

Run:
```bash
gh pr create --title "feat(cards): magnetic liquid glass cards (Spec 5)" --body "$(cat <<'EOF'
## Summary

Reemplaza el `Card.astro` actual (carousel-based, roto sin imágenes) por una card de **liquid glass con refracción óptica real** (SVG `feDisplacementMap`) + sistema de **interacción magnética asimétrica** con fire threshold + histéresis.

- **A** — SVG filter `#glassRefract` global en `Layout.astro`.
- **B** — Lógica de interacción aislada en `magnetic-cards.ts` (zonas asimétricas, mousemove con histéresis 70/130, touch tap-to-fire, focus a11y, prefers-reduced-motion).
- **C** — Refactor visual atómico: `Card.astro` reescrito (glass stack + estados attracting/fired) + `HomeProjects.astro` con backdrop ornaments (blobs + grid) y helper `zoneFor()`.
- **D** — Eliminado `card-interactions.ts` legacy huérfano.

`cases.ts` intacto. CSP A+ se mantiene. Cero dependencias nuevas.

Brainstormed con visual companion (mockups iterativos v1→v3 + ajuste blob-blur del usuario).

## Test plan

- [ ] securityheaders.com sobre preview URL → A+ (sin regresión Spec 4)
- [ ] Refracción visible en Chrome (blobs deformados a través de cards)
- [ ] Zonas asimétricas: central no atrapa con mouse horizontal entre cards
- [ ] Fire state sin flicker — mouse libre sobre card expandida
- [ ] Touch: tap fire, tap fuera cierra, 2do tap navega
- [ ] Keyboard: Tab fire, Enter navega
- [ ] prefers-reduced-motion: animaciones off
- [ ] `npm run build` → 0/0/0
- [ ] No regresión en `/me` y `/contact`

Spec: \`docs/superpowers/specs/2026-05-26-magnetic-liquid-glass-cards-design.md\`
Plan: \`docs/superpowers/plans/2026-05-26-magnetic-liquid-glass-cards.md\`
EOF
)"
```

Expected: PR creado en GitHub. Devuelve URL.

- [ ] **Step F.3.2: Esperar review humano o aprobación**

Tras review aprobada, mergear a `main`. Vercel deploya a producción automáticamente.

### Task F.4: Post-merge production validation

**Files:** ninguno modificado.

- [ ] **Step F.4.1: securityheaders.com sobre producción**

Manual: https://securityheaders.com/?q=https://vindevsito.dev/
Expected: A+ (igual que pre-Spec-5).

- [ ] **Step F.4.2: Smoke test runtime en producción**

Mismas verificaciones que F.2.2-F.2.8 sobre `https://vindevsito.dev/`.

- [ ] **Step F.4.3: Limpieza opcional de la branch**

Tras merge confirmado:
```bash
git checkout main
git pull --ff-only origin main
git branch -d magnetic-liquid-glass-cards
git push origin --delete magnetic-liquid-glass-cards
```

---

## Resumen de tareas

- **Task 0**: Baseline (3 steps, 0 commits)
- **Bucket A**: A.1 SVG filter (4 steps, 1 commit)
- **Bucket B**: B.1 magnetic-cards.ts (4 steps, 1 commit)
- **Bucket C**: C.1 Card.astro rewrite + C.2 HomeProjects.astro rewrite (atomic single commit)
- **Bucket D**: D.1 delete card-interactions.ts (5 steps, 1 commit)
- **Final**: F.1 verification + F.2 smoke + F.3 PR + F.4 post-merge (0 commits)

**Total commits esperados:** 4 commits atómicos sobre la branch `magnetic-liquid-glass-cards`.
**Tiempo esperado:** 1-2 sesiones (incluye espera de preview deploys + smoke tests manuales).
**Riesgo principal:** Bucket C — refactor visual grande, atómico. Plan B: `git revert` del commit de C deja Card.astro en estado pre-Spec-5 (con bug original) pero página renderiza. Buckets A, B, D quedan inertes en ese caso.
