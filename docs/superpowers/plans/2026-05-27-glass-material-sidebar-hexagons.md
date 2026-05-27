# Glass Material — Sidebar + Hexagons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extender el material liquid glass de Spec 5 al `Sidebar` y al `Hexagon` (panal de tecnologías), preservando el truco de `shape-outside` honeycomb pero arreglando el overflow responsive que rompía la posición del anchor "Sobre mí" en breakpoints mobile/tablet.

**Architecture:** 2 buckets independientes, revertibles por separado. B (Hexagon + HomeTechs) primero por mayor riesgo/complejidad; A (Sidebar) al final como cierre trivial. Cero JS nuevo: reuso del `#glassRefract` SVG filter de Spec 5 + del JS pointermove existente en HomeTechs.

**Tech Stack:** Astro 6 + CSS puro. Cero dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-05-27-glass-material-sidebar-hexagons-design.md`

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/components/Hexagon.astro` | Modify | Aplicar material (gradient bg, `backdrop-filter url(#glassRefract)`, `filter: drop-shadow()`) al `<li>`. Reemplazar `:before` actual con `mg-shine` pattern. Eliminar regla `.techs_container li:after`. |
| `src/components/home/HomeTechs.astro` | Modify | Añadir 2 breakpoints intermedios (1075, 780) + reducir `--s` progresivamente (120 → 100 → 85 → 70px) + ajustar `padding-bottom` por breakpoint. |
| `src/components/Sidebar.astro` | Modify | Quitar `glass0` del className. Aplicar stack completo del material (idéntico cards). Añadir `::before` para gradient border via mask-composite. Subir `border-radius` 5 → 14px. |

---

## Pre-flight: Baseline state

### Task 0: Confirmar baseline

**Files:** ninguno modificado.

- [ ] **Step 0.1: Verificar branch + working tree limpio**

Run: `git status && git branch --show-current`
Expected: branch `glass-material-sidebar-hexagons`, `nothing to commit, working tree clean`. Si no estás en esa branch: `git checkout glass-material-sidebar-hexagons`.

- [ ] **Step 0.2: Build baseline pasa**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints` + `[build] Complete!`. Si falla, NO continuar.

- [ ] **Step 0.3: Confirmar último commit es el spec**

Run: `git log --oneline -2`
Expected: el commit más reciente es `docs(spec): add Glass Material Sidebar + Hexagons design (Spec 6)` (hash `6e10341` o equivalente).

- [ ] **Step 0.4: Verificar pre-condiciones de Spec 5**

Run: `grep -c "id=\"glassRefract\"" src/layouts/Layout.astro`
Expected: `1` (filter SVG ya existe globalmente, lo reusamos).

Run: `grep -rn "glass0\|glass1" src/`
Expected: muestra usos actuales — al menos en `Sidebar.astro` (que vamos a quitar) y `Tools.astro` (que NO se toca). Confirmar que removerlo del sidebar no afecta a otros consumidores.

---

## Bucket B — Hexagon material + responsive fix

### Task B.1: Aplicar material al Hexagon

**Files:**
- Modify: `src/components/Hexagon.astro` (rewrite del bloque `<style>`)

**Estado actual del `<style>`** (líneas 27-106):

```css
li {
  position: relative;
  --x-px: calc(var(--x) * 1px);
  --y-px: calc(var(--y) * 1px);
  --border: 2px;
  background: rgba(255, 255, 255, 0.125);
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
}

li:before,
.techs_container li:after {
  content: "";
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  inset: 0px;
  background: radial-gradient(
    800px circle at var(--x-px) var(--y-px),
    rgba(255, 255, 255, 0.3),
    transparent 20%
  );
}

li:before { z-index: 1; }
li:after { opacity: 0; z-index: 2; }
li:hover:after { opacity: 1; }

li img {
  max-height: 60px;
  max-width: 60px;
  width: 100%;
  filter: drop-shadow(0px 0px 3px #000);
}
li:hover img {
  transform: scale(1.2);
  filter: drop-shadow(0px 0px 10px #ffffff99);
}

li p {
  font-size: 0.9rem;
  margin: 0;
  color: rgb(255, 255, 255);
}

.li_hidden { opacity: 0; }
.li_hidden:hover { opacity: 1 !important; }
```

- [ ] **Step B.1.1: Reemplazar el bloque `<style>` entero**

Sobrescribir todo el bloque `<style>...</style>` (líneas 27-106) con el siguiente contenido:

```astro
<style>
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

    /* mg-shine pattern: radial chico + screen blend.
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

    li img {
        max-height: 60px;
        max-width: 60px;
        width: 100%;
        filter: drop-shadow(0px 0px 3px #000);
    }
    li:hover img {
        transform: scale(1.2);
        filter: drop-shadow(0px 0px 10px #ffffff99);
    }

    li p {
        font-size: 0.9rem;
        margin: 0;
        color: rgb(255, 255, 255);
    }

    .li_hidden {
        opacity: 0;
    }

    .li_hidden:hover {
        opacity: 1 !important;
    }
</style>
```

**Cambios vs el estado actual:**
- `li`: `background: rgba(255,255,255,0.125)` → gradient layered. Plus añadidos `backdrop-filter url(#glassRefract) blur(8px) saturate(160%) brightness(108%)` (+ webkit prefix) y `filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4))`.
- `li:before, .techs_container li:after` (regla compuesta) → eliminada. Reemplazada por bloque `li:before` standalone con el patrón mg-shine.
- `li:before { z-index: 1 }` (regla aislada vieja) → consolidada dentro del nuevo `li:before`.
- `li:after { opacity: 0; z-index: 2 }` → eliminado.
- `li:hover:after { opacity: 1 }` → eliminado.
- `li:hover:before { opacity: 1 }` → nuevo (toma el rol que tenía `li:hover:after`).

Las reglas `li img`, `li:hover img`, `li p`, `.li_hidden`, `.li_hidden:hover` quedan idénticas.

- [ ] **Step B.1.2: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step B.1.3: Verificar grep**

Run: `grep -c "backdrop-filter: url(#glassRefract)" src/components/Hexagon.astro`
Expected: `1` (con prefix `-webkit-` aparte → cuenta como otra línea pero la regex match es 1; ajustar a `2` si grep cuenta ambas).

Actually: el comando exacto a usar es:
```bash
grep -E "^\s*(-webkit-)?backdrop-filter: url\(#glassRefract\)" src/components/Hexagon.astro | wc -l
```
Expected: `2` (estándar + webkit).

Run: `grep -c "filter: drop-shadow" src/components/Hexagon.astro`
Expected: `≥ 1` (en `li`; los `li img` y `li:hover img` ya tenían filter drop-shadow previos — el conteo total puede ser 3).

Run: `grep -c "mix-blend-mode: screen" src/components/Hexagon.astro`
Expected: `1`.

Run: `grep -c "techs_container li:after" src/components/Hexagon.astro`
Expected: `0` (regla eliminada).

- [ ] **Step B.1.4: Commit**

```bash
git add src/components/Hexagon.astro
git commit -m "feat(hex): apply liquid glass material to hexagons

Material adaptado para clip-path:
- gradient bg layered (vs rgba flat anterior)
- backdrop-filter url(#glassRefract) blur(8px) saturate(160%) brightness(108%)
  (blur menor que cards/sidebar — hex es elemento pequeño repetido,
  menos blur evita sobrecarga visual)
- filter: drop-shadow(0 8px 16px rgba(0,0,0,0.4)) — respeta clip-path
  (box-shadow no lo hace)
- Sin gradient border: clip-path limita el truco mask-composite,
  aceptado por scope

Shine: reemplaza el patrón previo (radial 800px + hover toggle :after)
por mg-shine consistente con cards (radial chico + mix-blend-mode:
screen + opacity transition 0.6s). El JS pointermove existente en
HomeTechs.astro sigue escribiendo --x-px/--y-px — cero JS nuevo."
```

---

### Task B.2: Responsive fix en HomeTechs.astro

**Files:**
- Modify: `src/components/home/HomeTechs.astro` (modify CSS only, líneas 53-100)

**Estado actual del bloque `<style>`** (líneas 53-101):

```css
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
```

- [ ] **Step B.2.1: Reemplazar el bloque `<style>` entero**

Sobrescribir todo el bloque `<style define:vars={{ s, r, mv }}>...</style>` (líneas 53-101) con:

```astro
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

  /* Responsive: reduce --s progresivamente + ajusta padding-bottom
     para acomodar más filas cuando viewport se estrecha y los hex
     se apilan más. */
  @media screen and (max-width: 1075px) {
    .techs_container {
      --s: 100px;
    }
  }

  @media screen and (max-width: 780px) {
    .hidden_text {
      opacity: 0.5;
    }
    .techs_container {
      --s: 85px;
    }
    .techs_container ul {
      padding-bottom: 300px;
    }
  }

  @media screen and (max-width: 460px) {
    .techs_container {
      --s: 70px;
    }
    .techs_container ul {
      padding-bottom: 500px;
    }
  }
</style>
```

**Cambios vs estado actual:**
- Nuevo bloque `@media (max-width: 1075px)` con `--s: 100px`.
- Bloque existente `@media (max-width: 780px)` se mantiene la regla `.hidden_text { opacity: 0.5 }` pero se le añaden las reglas para `.techs_container` (`--s: 85px`) y `.techs_container ul` (`padding-bottom: 300px`).
- Bloque existente `@media (max-width: 460px)` se mantiene pero `padding-bottom` ajustado de `600px` → `500px`, y se añade override `--s: 70px`.

El frontmatter (líneas 1-9) NO se toca. `s`, `r`, `mv` siguen siendo los defaults; los media queries hacen override de `--s` a nivel CSS variable.

- [ ] **Step B.2.2: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step B.2.3: Verificar greps**

Run: `grep -c "max-width: 1075px" src/components/home/HomeTechs.astro`
Expected: `1` (nuevo breakpoint).

Run: `grep -c "max-width: 780px" src/components/home/HomeTechs.astro`
Expected: `1` (existente, ahora con más reglas dentro).

Run: `grep -c "max-width: 460px" src/components/home/HomeTechs.astro`
Expected: `1`.

Run: `grep -c "padding-bottom: 500px" src/components/home/HomeTechs.astro`
Expected: `1` (reemplaza el 600px anterior).

- [ ] **Step B.2.4: Commit**

```bash
git add src/components/home/HomeTechs.astro
git commit -m "fix(techs): responsive hex sizing + padding-bottom by breakpoint

Soluciona overlap del panal con anchor 'Sobre mí' en viewports
mobile/tablet. Causa raíz: --s fijo a 120px + padding-bottom
hardcoded sin breakpoints intermedios. En viewports 461-1075px
los hex se apilaban en muchas filas y excedían el padding default
de 125px.

Path A (preserva shape-outside trick, fix puntual):
- @media <=1075px: --s 100px
- @media <=780px: --s 85px + padding-bottom 300px
- @media <=460px: --s 70px + padding-bottom 500px (era 600 con --s
  120; ahora con --s 70 cabe en menos espacio)

Sin cambios de markup, JS o data. Si Path A no convence post-deploy:
escalable a Path B (CSS Grid rebuild) en spec aparte."
```

---

## Bucket A — Sidebar material

### Task A.1: Aplicar material al Sidebar

**Files:**
- Modify: `src/components/Sidebar.astro` (className en `<aside>`, rewrite del bloque `aside { }` en CSS, añadir `aside::before`)

**Estado actual** (líneas 5 + 31-41):

Línea 5:
```astro
<aside class="flex relative fixed j_sb unselected glass0">
```

Líneas 31-41 (regla `aside` en `<style>`):
```css
aside {
  padding: 20px 15px;
  border: 1px solid var(--border);
  border-radius: 5px;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  top: 5px;
  left: 5px;
  bottom: 5px;
  overflow: hidden;
}
```

- [ ] **Step A.1.1: Quitar `glass0` del className**

En línea 5, cambiar:
```astro
<aside class="flex relative fixed j_sb unselected glass0">
```
A:
```astro
<aside class="flex relative fixed j_sb unselected">
```

- [ ] **Step A.1.2: Reemplazar el bloque `aside { ... }` en `<style>`**

Reemplazar las líneas 31-41 con:

```css
aside {
  padding: 20px 15px;
  border: 1px solid transparent;
  border-radius: 14px;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
  top: 5px;
  left: 5px;
  bottom: 5px;
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

**Cambios:**
- `border: 1px solid var(--border)` → `border: 1px solid transparent` (gradient border via `::before`).
- `border-radius: 5px` → `14px`.
- Añadido stack completo del material (background gradient, backdrop-filter url+blur+saturate+brightness, multi-layer box-shadow).
- Añadida regla `aside::before` para gradient border via mask-composite.

Las reglas restantes del `<style>` (`#vin span`, `aside strong`, `#avilable`, `#vin`, `#avilable > *`, `@media`) se preservan.

- [ ] **Step A.1.3: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints`.

- [ ] **Step A.1.4: Verificar greps**

Run: `grep -c "glass0" src/components/Sidebar.astro`
Expected: `0` (removido del className).

Run: `grep -cE "^\s*(-webkit-)?backdrop-filter: url\(#glassRefract\)" src/components/Sidebar.astro`
Expected: `2` (estándar + webkit).

Run: `grep -c "border-radius: 14px" src/components/Sidebar.astro`
Expected: `1`.

Run: `grep -c "mask-composite" src/components/Sidebar.astro`
Expected: `≥ 2` (mask-composite + webkit-mask-composite).

- [ ] **Step A.1.5: Commit**

```bash
git add src/components/Sidebar.astro
git commit -m "feat(sidebar): apply liquid glass material

Sustituye glass0 (blur 2px) por el stack completo del material
liquid glass (idéntico al de cards de Spec 5):
- backdrop-filter url(#glassRefract) blur(12px) saturate(180%) brightness(108%)
- background gradient layered translucent
- multi-layer box-shadow (depth + bevel inset)
- gradient border via ::before + mask-composite (sustituye border
  sólido var(--border))
- border-radius 5 → 14px (acerca al feel de cards sin igualar)

Sin shine cursor-following: el sidebar es contexto persistente, no
debe robar foco con animación constante. Material estático suficiente
para que se vea vivo.

Caveat: transform rotate(180deg) interactúa con SVG filter — patrón
fractal noise es estocástico, no se nota visualmente. Si genera glitch
en algún browser: fallback a filter alternativo o blur sin url()."
```

---

## Final: verificación + PR

### Task F.1: Verificación integral

**Files:** ninguno modificado.

- [ ] **Step F.1.1: Criterios automáticos del spec**

Ejecutar todos:

```bash
echo "=== 1. Sidebar sin glass0 ===" && grep -c "glass0" src/components/Sidebar.astro
echo "=== 2. Sidebar con glassRefract ===" && grep -cE "^\s*(-webkit-)?backdrop-filter: url\(#glassRefract\)" src/components/Sidebar.astro
echo "=== 3. Hexagon con glassRefract ===" && grep -cE "^\s*(-webkit-)?backdrop-filter: url\(#glassRefract\)" src/components/Hexagon.astro
echo "=== 4. Hexagon con drop-shadow ===" && grep -c "filter: drop-shadow" src/components/Hexagon.astro
echo "=== 5. Hexagon con screen blend ===" && grep -c "mix-blend-mode: screen" src/components/Hexagon.astro
echo "=== 6. Hexagon sin :after (vieja regla) ===" && grep -c "techs_container li:after" src/components/Hexagon.astro
echo "=== 7. HomeTechs breakpoint 1075 ===" && grep -c "max-width: 1075px" src/components/home/HomeTechs.astro
echo "=== 8. Build ===" && npm run build 2>&1 | tail -3
```

Expected:
- 1: `0`
- 2: `2`
- 3: `2`
- 4: `≥ 1` (puede ser 3 si grep cuenta los li img también)
- 5: `1`
- 6: `0`
- 7: `1`
- 8: `0 errors, 0 warnings, 0 hints` + `Complete!`

- [ ] **Step F.1.2: Confirmar `cases.ts`, `technologies.ts`, `Layout.astro`, `utilities.css` intactos**

```bash
diff -q src/data/cases.ts <(git show main:src/data/cases.ts) && echo "cases.ts: OK"
diff -q src/data/technologies.ts <(git show main:src/data/technologies.ts) && echo "technologies.ts: OK"
diff -q src/layouts/Layout.astro <(git show main:src/layouts/Layout.astro) && echo "Layout.astro: OK"
diff -q src/styles/utilities.css <(git show main:src/styles/utilities.css) && echo "utilities.css: OK"
```

Expected: 4× `OK`.

- [ ] **Step F.1.3: Push branch**

Run: `git push -u origin glass-material-sidebar-hexagons`
Expected: branch push exitoso. Vercel arranca preview deploy (~1-3 min).

- [ ] **Step F.1.4: Obtener URL preview**

Manual: Vercel dashboard → Deployments → branch `glass-material-sidebar-hexagons` → estado Ready → copiar preview URL.

### Task F.2: Smoke test manual en preview

**Files:** ninguno modificado.

- [ ] **Step F.2.1: securityheaders.com no regresa**

Manual: https://securityheaders.com/?q=`<preview-url>`
Expected: A+ (igual que producción).

- [ ] **Step F.2.2: Sidebar visual**

Manual: abrir `<preview-url>/` en Chrome con DevTools.
- Sidebar izquierdo tiene look liquid glass (translúcido + refraction visible)
- Gradient border sutil en el borde del sidebar
- DevTools Console: cero errores

- [ ] **Step F.2.3: Hexágonos visual + interacción**

Manual: scroll a sección "Mí BAGAJE":
- Cada hex tiene material translúcido (refraction visible al cursor pasar)
- drop-shadow exterior da depth sin gradient border
- Hover: shine sigue el cursor con `mix-blend-mode: screen`, fade-out suave (~0.6s) al salir
- Iconos siguen escalando + glow blanco al hover (no se rompe el behavior previo)

- [ ] **Step F.2.4: Responsive — sin overlap "Sobre mí"**

DevTools → Device toolbar. Probar viewports:
- 1100px (desktop ancho): hex tamaño completo, sin overlap
- 900px (tablet): `--s` baja a 100px, hex más pequeños, sin overlap
- 700px (tablet ang): `--s` baja a 85px, layout reorganiza
- 500px (mobile mediano): `--s` 85px aún, padding-bottom 300px aplica
- 400px (mobile pequeño): `--s` 70px, padding-bottom 500px, hex bien organizados
- 360px: chequear que iconos siguen legibles a 70px hex
- En NINGÚN viewport los hex deben solaparse con el anchor "Sobre mí"

- [ ] **Step F.2.5: No-regresión en otras secciones**

Manual: navegar a `/me` y `/contact`:
- Cards de Casos (en home) siguen idénticas
- Audio loop sigue funcionando
- Cursor custom OK
- Navbar / Footer sin cambios

- [ ] **Step F.2.6: Reduced motion (opcional)**

DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`:
- Sidebar y hex siguen mostrando material glass (CSS material no depende de motion preferences en este spec)
- Si el shine de hex causa molestia en reduced-motion, follow-up para suprimirlo (no es requisito del spec actual)

### Task F.3: Abrir PR

**Files:** ninguno modificado.

- [ ] **Step F.3.1: gh pr create**

Run:
```bash
gh pr create --title "feat: glass material sidebar + hexagons (Spec 6)" --body "$(cat <<'EOF'
## Summary

Extiende el material liquid glass de Spec 5 (cards) al `Sidebar` y a los hexágonos del panal de tecnologías, con fix del overflow responsive que rompía la posición del anchor "Sobre mí" en mobile/tablet.

- **B.1** — `Hexagon.astro`: material adaptado para clip-path (sin gradient border, `filter: drop-shadow` reemplaza box-shadow, mg-shine reemplaza shine actual).
- **B.2** — `HomeTechs.astro`: breakpoints intermedios + reducción progresiva de `--s` (120 → 100 → 85 → 70px) + padding-bottom escalado.
- **A.1** — `Sidebar.astro`: stack completo del material (idéntico cards). Quita `glass0`.

Cero JS nuevo. Reusa `#glassRefract` filter de Spec 5. `cases.ts`, `technologies.ts`, `Layout.astro`, `utilities.css` intactos.

Path A (preserva shape-outside del honeycomb). Si no convence, escalable a Path B (CSS Grid rebuild) en spec aparte.

## Test plan

- [ ] securityheaders.com sobre preview URL → A+
- [ ] Sidebar muestra material liquid glass con refraction
- [ ] Hexágonos muestran material + drop-shadow + shine mg-pattern al hover
- [ ] Responsive: en viewports 320-1100px ningún hex se solapa con "Sobre mí"
- [ ] Iconos hex siguen legibles a `--s: 70px` (mobile pequeño)
- [ ] `npm run build` → 0/0/0
- [ ] No regresión en cards de Casos, navbar, footer

Spec: \`docs/superpowers/specs/2026-05-27-glass-material-sidebar-hexagons-design.md\`
Plan: \`docs/superpowers/plans/2026-05-27-glass-material-sidebar-hexagons.md\`
EOF
)"
```

Expected: PR creado. Devuelve URL.

- [ ] **Step F.3.2: Esperar review humano o aprobación + merge**

Tras review aprobada: mergear a `main`. Vercel deploya a producción automáticamente.

### Task F.4: Post-merge production validation

**Files:** ninguno modificado.

- [ ] **Step F.4.1: securityheaders.com sobre producción**

Manual: https://securityheaders.com/?q=https://vindevsito.dev/
Expected: A+.

- [ ] **Step F.4.2: Smoke test runtime en producción**

Mismas verificaciones que F.2.2-F.2.6 sobre `https://vindevsito.dev/`.

- [ ] **Step F.4.3: Limpieza opcional de la branch**

Tras merge confirmado:
```bash
git checkout main
git pull --ff-only origin main
git branch -d glass-material-sidebar-hexagons
git push origin --delete glass-material-sidebar-hexagons
```

---

## Resumen de tareas

- **Task 0**: Baseline (4 steps, 0 commits)
- **Bucket B**: B.1 Hexagon material (4 steps, 1 commit) + B.2 HomeTechs responsive (4 steps, 1 commit) = 2 commits
- **Bucket A**: A.1 Sidebar material (5 steps, 1 commit)
- **Final**: F.1 verificación + F.2 smoke + F.3 PR + F.4 post-merge (0 commits adicionales)

**Total commits esperados:** 3 commits atómicos sobre la branch `glass-material-sidebar-hexagons`.
**Tiempo esperado:** 1 sesión (~30-60 min incluyendo espera de preview deploy).
**Riesgo principal:** Bucket B (hexagons). Plan B: `git revert` del commit B.1 deja hex en estado pre-Spec-6 (sin material pero funcional). B.2 revertible aparte si solo el responsive fix falla. A.1 totalmente independiente.
