# Glass Material — Sidebar + Hexagons — Diseño

**Fecha:** 2026-05-27
**Estado:** Diseño aprobado, pendiente plan de implementación
**Spec previo en el roadmap:** `2026-05-26-magnetic-liquid-glass-cards-design.md` (mergeado a main)
**Spec siguiente en el roadmap:** Bilingüe ES/EN + Features OGG

---

## Goal

Extender el material liquid glass de Spec 5 (cards) al `Sidebar` y al `Hexagon` (panal de tecnologías del home), preservando el truco actual de `shape-outside` honeycomb pero arreglando el overflow responsive que rompía la posición del anchor "Sobre mí" en breakpoints mobile/tablet (cuando los hex se apilan en más filas y exceden el `padding-bottom` hardcoded del `<ul>`).

Solo material visual + fix de layout puntual. Cero interacción magnética nueva.

## Architecture

2 buckets independientes, revertibles por separado:

- **A — Sidebar glass**: aplica el stack completo del material (idéntico al de cards de Spec 5) a `<aside>` en `Sidebar.astro`. Sustituye `glass0` por estilos propios. Sin tocar lógica ni markup.
- **B — Hexagon material + responsive fix**:
  - En `Hexagon.astro`: añade material (gradient bg layered, `backdrop-filter url(#glassRefract)`, `filter: drop-shadow()` reemplaza box-shadow incompatible con clip-path). Reemplaza `:before`/`:after` radial-gradient actual con patrón `mg-shine` (más pequeño + `mix-blend-mode: screen`).
  - En `HomeTechs.astro`: añade breakpoints intermedios + reduce `--s` (size del hex) progresivamente en mobile + ajusta `padding-bottom` del `<ul>` para acomodar más filas en viewports angostos. **Preserva** el `shape-outside` honeycomb (no rompemos identidad visual).

**Tech stack:** Astro 6 + CSS puro. Reusa el `#glassRefract` SVG filter ya definido en `Layout.astro` (Spec 5). Reusa el JS pointermove existente en `HomeTechs.astro` que escribe `--x`/`--y` por hex al hover. Cero JS nuevo, cero dependencias.

**Decisiones macro cerradas durante el brainstorm:**

- Sidebar: intensidad **igual que cards** (`backdrop-filter url + blur 12px + saturate 180% + brightness 108% + gradient border + multi-shadow`). **Sin shine cursor-following** — el sidebar es contexto persistente, no focal.
- Hexagons: shine reemplazado por `mg-shine` pattern (no se mantiene el actual de 800px circle). El JS pointermove existente se reusa.
- Hex border: **sin gradient border** (clip-path no lo soporta limpiamente), `filter: drop-shadow()` para depth.
- Layout: **Path A** (mantener shape-outside, fix puntual de breakpoints + `--s` responsive). Si en preview no convence, escalamos a Path B (CSS Grid rebuild) en spec aparte.

---

## Bucket A — Sidebar material

### Estado actual

`src/components/Sidebar.astro`:
```astro
<aside class="flex relative fixed j_sb unselected glass0">
  <a href="/me" id="vin" class="Alumni relative flex">…</a>
  <slot name="side-component" />
  <a href="/contact" id="avilable" class="Poppins-R flex">…</a>
</aside>

<style>
  aside {
    padding: 20px 15px;
    border: 1px solid var(--border);
    border-radius: 5px;
    writing-mode: vertical-lr;
    transform: rotate(180deg);
    top: 5px; left: 5px; bottom: 5px;
    overflow: hidden;
  }
  /* ... resto sin relevancia */
</style>
```

`glass0` (en `src/styles/utilities.css`) = solo `backdrop-filter: blur(2px)`.

### Cambios

**Markup:** quitar `glass0` del className. Queda `"flex relative fixed j_sb unselected"`. Sin otros cambios markup.

**CSS** dentro del `<style>` del componente, sobre el bloque `aside`:

```css
aside {
  padding: 20px 15px;
  border: 1px solid transparent;       /* gradient border via ::before */
  border-radius: 14px;                  /* sube de 5px a 14px — sutil acercamiento al feel de cards (22px) sin igualar */
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  top: 5px; left: 5px; bottom: 5px;
  overflow: hidden;

  /* Liquid glass material — idéntico al stack de cards */
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
}

/* Gradient border via mask-composite — funciona porque no hay clip-path */
aside::before {
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
  z-index: 1;
}
```

### Caveat: `transform: rotate(180deg)` y backdrop-filter

El sidebar está rotado 180°. `backdrop-filter: url(#glassRefract)` funciona pese a la transform, pero el desplazamiento del ruido fractal se ve "invertido". En la práctica esto no se nota porque el patrón es estocástico (fractal noise sin orientación legible). Si visualmente molesta: tuning futuro con un segundo filter `#glassRefractFlipped` (seed distinto) solo para el sidebar.

### Lo que NO hace este bucket

- **No agrega `mg-shine` interactivo.** Sidebar es contexto persistente; shine cursor-following sería ruido visual constante.
- **No toca `glass0` ni `glass1` en `utilities.css`.** Siguen disponibles para otros componentes.
- **No cambia markup ni el behavior del `<slot>` para `side-component`.**

---

## Bucket B — Hexagon material + responsive fix

### B.1 — Material en `Hexagon.astro`

**Estado actual** (líneas relevantes):

```css
li {
  background: rgba(255, 255, 255, 0.125);
  clip-path: polygon(...);
  /* sin backdrop-filter, sin filter:drop-shadow */
}
li:before, .techs_container li:after {
  background: radial-gradient(
    800px circle at var(--x-px) var(--y-px),
    rgba(255,255,255,0.3),
    transparent 20%
  );
}
li:before { z-index: 1; }
li:after { opacity: 0; z-index: 2; }
li:hover:after { opacity: 1; }
```

**Cambios:**

```css
li {
  position: relative;
  --x-px: calc(var(--x) * 1px);
  --y-px: calc(var(--y) * 1px);
  --border: 2px;
  width: var(--s);
  margin: var(--mv) var(--mh);
  height: calc(var(--s) * var(--r));
  display: inline-block;
  font-size: initial;
  clip-path: polygon(
    var(--hc) 0,
    calc(100% - var(--hc)) 0,
    100% var(--vc),
    100% calc(100% - var(--vc)),
    calc(100% - var(--hc)) 100%,
    var(--hc) 100%,
    0 calc(100% - var(--vc)),
    0 var(--vc)
  );
  margin-bottom: calc(var(--mv) - var(--vc));

  /* Liquid glass material */
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.18) 0%,
    rgba(255, 255, 255, 0.03) 55%,
    rgba(255, 255, 255, 0.1) 100%
  );
  backdrop-filter: url(#glassRefract) blur(8px) saturate(160%) brightness(108%);
  -webkit-backdrop-filter: url(#glassRefract) blur(8px) saturate(160%) brightness(108%);

  /* filter:drop-shadow respeta clip-path (box-shadow NO) */
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4));
}

/* mg-shine pattern: radial más chico + screen blend.
   Reemplaza el 800px circle / hover toggle :after anterior. */
li:before {
  content: "";
  position: absolute;
  inset: -50%;
  background: radial-gradient(
    circle at var(--x-px, 50%) var(--y-px, 50%),
    rgba(255, 255, 255, 0.35) 0%,
    rgba(255, 255, 255, 0.08) 25%,
    transparent 50%
  );
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.6s ease-out;
  pointer-events: none;
  z-index: 1;
}

li:hover:before {
  opacity: 1;
}

/* :after se ELIMINA (era duplicado del shine con hover toggle, ahora :before lo hace).
   La regla .techs_container li:after se borra. */

/* El resto del CSS de Hexagon.astro (li img, li:hover img, li p, .li_hidden) sin cambios. */
```

**Justificación:**
- `blur(8px)` (vs `12px` en sidebar/cards) — hex es elemento pequeño y repetido, menos blur evita sobrecarga visual + mejora performance con N instancias.
- `filter: drop-shadow()` reemplaza box-shadow (incompatible con clip-path). 8px blur + 16px y-offset = depth proporcional al tamaño del hex.
- Shine simplificado: el patrón `:before` + `:after` con hover toggle actual se colapsa a 1 solo `:before` con opacity transition. Reusa `--x-px`/`--y-px` que ya vienen del JS `pointermove` existente — cero JS nuevo.
- Sin clases `.fired` ni `.attracting` — los hex no tienen estos estados (no son cards). Solo idle / `:hover`.

**Caveat clip-path + backdrop-filter:** combinación soportada en Chrome/Safari modernos. Firefox: mismo fallback que cards (sin url refract, solo blur funciona). Aceptado per Spec 5 R1.

### B.2 — Responsive fix en `HomeTechs.astro`

**Estado actual:**

```ts
const s = "120px";  // hardcoded
const r = 1;
const mv = "5px";
```

```css
.techs_container ul {
  padding-bottom: calc(var(--s) * var(--r) + var(--mv));  /* = 125px */
}

@media screen and (max-width: 460px) {
  .techs_container ul {
    padding-bottom: 600px;
  }
}
```

**Problema:** entre 461-1075px hay solo `padding-bottom: 125px` y `--s = 120px` fijo. Al estrechar viewport los hex se apilan en muchas más filas → overlap con anchor "Sobre mí".

**Cambios** (en el `<style>` del componente):

```css
.techs_container {
  /* preserva TODAS las CSS variables actuales (no se tocan) */
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
  /* preserva el shape-outside trick actual */
}

/* NEW: tablet ancho (1075-781px) */
@media screen and (max-width: 1075px) {
  .techs_container {
    --s: 100px;
  }
}

/* NEW: tablet/mobile mediano (780-461px) */
@media screen and (max-width: 780px) {
  .techs_container {
    --s: 85px;
  }
  .techs_container ul {
    padding-bottom: 300px;
  }
}

/* MODIFICADO: mobile pequeño (≤460px) */
@media screen and (max-width: 460px) {
  .techs_container {
    --s: 70px;
  }
  .techs_container ul {
    padding-bottom: 500px;   /* ajustado de 600 — con --s más chico cabe en menos espacio */
  }
}
```

El bloque actual `@media (max-width: 780px) { .hidden_text { opacity: 0.5 } }` se preserva (regla de visibilidad del título "Mí").

**No cambios:**
- Markup intacto. Estructura `<section id="techs">` → `<h2>` + `<div class="techs_container grid unselected">` → `<ul>` → hex items.
- `shape-outside` trick intacto (no rebuild a CSS Grid).
- JS pointermove intacto.
- `hexagonSlots` data intacto.

---

## Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R1** | `transform: rotate(180deg)` del sidebar interfiere con `backdrop-filter url()` y se ve raro | Baja | Patrón fractal noise no tiene orientación legible. Si falla: filter alternativo `#glassRefractFlipped` con seed distinto |
| **R2** | `filter: drop-shadow` en ~28 hex impacta performance | Media | drop-shadow es GPU-accelerated en navegadores modernos. Si se ve lag: reducir blur (8→4) o aplicar solo a `:hover` |
| **R3** | Quitar `:after` de Hexagon rompe alguna otra cosa | Muy baja | Solo era duplicado del shine con opacity toggle. Pre-implementación: grep para confirmar 0 refs externos a `.techs_container li:after` |
| **R4** | `padding-bottom` empírico no es suficiente en viewports raros (ej. 700px) | Media | Valores conservadores (300/500px) dejan margen. Si overlap persiste: ajustar puntual. Plan B documentado: escalar a Path B (CSS Grid rebuild) en spec aparte |
| **R5** | Gradient border via mask-composite en sidebar genera glitch en Safari (mismo issue R2 de Spec 5) | Baja | Si glitcha: border sólido con color claro `rgba(255,255,255,0.2)` en lugar de gradient. Fallback gracioso |
| **R6** | Sidebar deja de aplicar `glass0` — otros componentes afectados | Muy baja | `glass0` sigue definido en `utilities.css`. Solo se remueve del `<aside>` específico. Pre-implementación: grep para confirmar otros uses |
| **R7** | Visual del hex sin gradient border se siente "menos polished" que cards | Media | Aceptado por scope: clip-path lo limita. Drop-shadow + shine + glass refract compensan. Upgrade futuro con SVG `<polygon>` si se quiere gradient border |
| **R8** | `--s: 70px` en mobile hace los iconos ilegibles | Baja | Iconos en `<img max-height/width: 60px>` se escalan con el hex. A 70px hex el icono renderiza ~42px — legible. Verificar en smoke |

**Plan de rollback:** cada bucket revertible con `git revert <range>` sin afectar al otro. Si todo Spec 6 rompe, `git revert` del PR merge restaura el estado pre-Spec-6 (Spec 5 intacto).

---

## Contrato

### Funcional

- Sidebar sigue navegando a `/me` y `/contact` desde sus links. Slot interno (`<SideComponentMain />`) renderiza igual.
- Hexagons siguen mostrando tooltips (`title`) y los iconos correctos. Hover sigue disparando el shine.
- HomeTechs sigue listando el bagaje en el mismo orden de tecnologías.

### Visual

- Sidebar con material liquid glass coherente con las cards (mismo blur + saturate + brightness + refract + gradient border).
- Hexágonos con material adaptado (sin gradient border, con drop-shadow). Shine reemplazado por mg-shine pattern.
- En todos los viewports (320px → 1920px+) los hexágonos NO se solapan con anchor "Sobre mí".

### No-regresión

- Cards de Casos siguen funcionando idénticas (no se tocan).
- Resto del sitio (`/me`, `/contact`, navbar, footer) sin cambios visuales.
- securityheaders.com sigue A+ (no nuevos inline scripts/styles que rompan hashes).
- `npm run build` → 0/0/0.

### Criterios de aceptación automáticos

```bash
grep -c "glass0" src/components/Sidebar.astro                                    # → 0
grep -c "backdrop-filter: url(#glassRefract)" src/components/Sidebar.astro       # → ≥ 1
grep -c "backdrop-filter: url(#glassRefract)" src/components/Hexagon.astro       # → ≥ 1
grep -c "filter: drop-shadow" src/components/Hexagon.astro                       # → ≥ 1
grep -c "mix-blend-mode: screen" src/components/Hexagon.astro                    # → ≥ 1
grep -c "techs_container li:after" src/components/Hexagon.astro                  # → 0
npm run build                                                                    # → 0/0/0
```

### Criterios manuales (smoke en preview deploy)

- [ ] Sidebar tiene look liquid glass coherente con cards (refraction visible en Chrome)
- [ ] Hexágonos tienen material liquid (translúcidos, refract, drop-shadow exterior)
- [ ] Shine de hex sigue cursor al pasar el mouse, fade-out suave al salir
- [ ] En viewports 461-780px NO hay overlap entre hex y "Sobre mí"
- [ ] En viewport 320-460px tampoco overlap
- [ ] Sidebar performance OK (sin lag perceptible al scroll)
- [ ] securityheaders.com sigue A+

---

## No-objetivos (explícitos)

- **Interacción magnética en hex o sidebar.** Solo material visual. Magnet/fire es exclusivo de las cards.
- **Refactor del layout honeycomb a CSS Grid (Path B).** Si Path A no convence post-deploy, escala a spec aparte.
- **Shine cursor-following en el sidebar.** Material estático suficiente para contexto persistente.
- **Cambios a `cases.ts`, `technologies.ts`, o cualquier data.**
- **Tocar `Card.astro`, `HomeProjects.astro`, `magnetic-cards.ts`** o cualquier componente fuera de Sidebar/Hexagon/HomeTechs.
- **Modificar `glass0` / `glass1` en `utilities.css`.** Siguen disponibles para otros usos.
- **SVG `#glassRefract` modifications.** Reusa el existente de Spec 5 tal cual.
- **Cambio de orden, tamaño o cantidad de hex slots.** `hexagonSlots` data intacta.
- **`HomeHero.astro` o cualquier sección del Home fuera de Techs.**

---

## Follow-ups esperados

### Si Path A no convence post-deploy

- **Spec follow-up: hex layout rebuild a CSS Grid (Path B)** — replace `shape-outside` trick con CSS Grid auto-fit + `nth-child` stagger. Más robusto responsive, container intrinsic height (sin `padding-bottom` manual). Riesgo: regresión sutil del feel honeycomb actual.

### Polish menor

- Shine cursor-following en el sidebar si se vuelve nice-to-have.
- SVG `<polygon>` para hexagons si se quiere gradient border real (upgrade visual, refactor del componente).
- Tuning de `--s` mobile si los iconos quedan pequeños a 70px.

### Roadmap principal continúa

- **Spec siguiente: Bilingüe ES/EN + Features OGG** (i18n nativo Astro 6 + "Pregúntale a mi CV" con Anthropic SDK + OGG interactivo).

---

## Buckets de implementación

| # | Bucket | Files | Riesgo | Commits |
|---|---|---|---|---|
| **B** | Hexagon material + responsive | `src/components/Hexagon.astro`, `src/components/home/HomeTechs.astro` | Medio | 1-2 |
| **A** | Sidebar material | `src/components/Sidebar.astro` | Bajo | 1 |

**Orden: B → A** (más complejo primero por si algo falla; A es trivial y cierra limpio).

Total esperado: ~2-3 commits.

---

## Decisiones de diseño cerradas

- **Stack:** Astro 6 + CSS puro. Cero JS nuevo. Cero dependencias nuevas.
- **Sidebar:** mismo material que cards (blur 12px + saturate 180% + refract + gradient border + multi-shadow). Sin shine.
- **Hexagons:** material reducido (blur 8px), sin gradient border (clip-path limitación), drop-shadow para depth, mg-shine reemplaza shine actual.
- **HomeTechs layout:** Path A — preserva shape-outside, fix responsive con `--s` decreciente + padding-bottom por breakpoint.
- **No tests automatizados** (proyecto no los tiene).
- **No tocar Spec 5 (cards) ni utilities.css.**
- **Reuso del JS pointermove** existente en HomeTechs para `--x`/`--y` por hex — no se modifica.
