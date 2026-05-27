# Magnetic Liquid Glass Cards — Diseño

**Fecha:** 2026-05-26
**Estado:** Diseño aprobado, pendiente plan de implementación
**Spec previo en el roadmap:** `2026-05-24-security-closeout-design.md`
**Spec siguiente en el roadmap:** Bilingüe ES/EN + Features OGG

---

## Goal

Reemplazar el `Card.astro` actual (diseñado para carousel de screenshots, que se rompe en hover sin imágenes) por una nueva card de **liquid glass con refracción óptica real** y un sistema de **interacción magnética asimétrica** que dispara expansión al alcanzar el umbral. Aplica solo a los Casos del home; cero cambios en data o copy.

## Architecture

3 capas separadas:

1. **Visual** (`Card.astro`): markup + estilos del glass — `backdrop-filter` con SVG `feDisplacementMap` para refracción, gradient border via `mask-composite`, specular highlight que sigue el cursor, layered shadows para bevel.
2. **Interacción** (nuevo `magnetic-cards.ts`): event listeners de `mousemove` / `touchend` sobre el container, zonas asimétricas, magnet pull, fire threshold con histéresis, expand-aware bounds checking.
3. **Container** (`HomeProjects.astro`): wrapper con backdrop ornaments (blobs colorados + grid sutil) que dan estructura visible para que la refracción se lea.

**Tech stack:** Astro 6 + TypeScript + CSS puro + SVG filter inline. **No GSAP** para esto (la animación es por `requestAnimationFrame` directo sobre transforms — más simple y predecible que GSAP timelines para mouse tracking). Cero dependencias nuevas.

**Decisiones macro cerradas durante el brainstorm:**
- Refracción default `scale: 22` (`feDisplacementMap`). Si necesitamos variante "fuerte" futura: definir segundo filter `#glassRefractStrong` (scale=38) y switch por clase CSS. No es CSS variable (los atributos SVG no escuchan custom properties).
- Mouse: magnet + fire con histéresis 70/130 px.
- Touch: tap → fire, tap fuera → cerrar (sin magnet en touch).
- Zonas asimétricas: extremas amplias por exterior + estrechas por interior, central estrecha lateralmente + amplia vertical.
- Cero modificación de `cases.ts` (la data ya tiene `company/role/period` desde Spec 3).

---

## Sistema visual

### SVG filter (refracción óptica)

Inline en `Layout.astro` (global, una sola definición reutilizable):

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>
    <filter id="glassRefract" x="-20%" y="-20%" width="140%" height="140%">
      <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="7" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="22" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
</svg>
```

`baseFrequency` controla la "densidad" del ruido fractal (qué tan finas son las ondulaciones). `scale=22` es el desplazamiento en píxeles. Cambiar a `38` da efecto fuerte/grueso (out of scope visual MVP).

### Estructura del Card (markup)

```astro
---
interface Props {
  text: string;
  href: string;
  company: string;
  role: string;
  period: string;
  cover: string;       // SVG inline o URL imagen
  bgColor?: string;    // hue del cover
  tags?: Record<string, string>;
}
---

<a
  class="mg-card"
  href={href}
  target="_blank"
  rel="noopener noreferrer"
  data-zone-left={zoneLeft}
  data-zone-right={zoneRight}
  data-zone-vert={zoneVert}
>
  <div class="mg-shine"></div>
  <div class="mg-cover">
    {cover.endsWith("</svg>") ? <Fragment set:html={cover} /> : <img src={cover} alt="" />}
  </div>
  <div class="mg-meta">
    <span class="mg-company">{company}</span>
    <span class="mg-period">{period}</span>
  </div>
  <h3 class="mg-title">{text}</h3>
  <div class="mg-detail">
    <div class="mg-role">{role}</div>
    <ul class="mg-tags">{...renderTags(tags)}</ul>
    <span class="mg-cta">Ver más →</span>
  </div>
</a>
```

Los atributos `data-zone-*` se computan en `HomeProjects.astro` según posición de la card en el array (extrema vs central). Ver "Zonas asimétricas" abajo.

### Glass stack (CSS layers)

```css
.mg-card {
  /* Tinte translúcido — múltiples capas con gradient */
  background: linear-gradient(135deg,
    rgba(255,255,255,0.18) 0%,
    rgba(255,255,255,0.03) 55%,
    rgba(255,255,255,0.10) 100%);

  /* Refracción + blur leve + saturación + brillo */
  backdrop-filter: url(#glassRefract) blur(12px) saturate(180%) brightness(108%);
  -webkit-backdrop-filter: url(#glassRefract) blur(12px) saturate(180%) brightness(108%);

  /* Multi-layer shadow para bevel + depth */
  box-shadow:
    0 12px 36px rgba(0,0,0,0.35),
    0 1px 0 rgba(255,255,255,0.30) inset,
    0 -1px 0 rgba(0,0,0,0.18) inset,
    0 0 0 1px rgba(255,255,255,0.08) inset;

  border-radius: 22px;
  width: 200px;
  height: 280px;
  position: relative;
  overflow: hidden;
  will-change: transform, height;
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
              height 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Gradient border 1px via mask-composite */
.mg-card::before {
  content: '';
  position: absolute; inset: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg,
    rgba(255,255,255,0.60) 0%,
    rgba(255,255,255,0.10) 30%,
    rgba(255,255,255,0.05) 70%,
    rgba(255,255,255,0.40) 100%);
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  mask-composite: exclude;
  pointer-events: none;
}

/* Specular highlight que sigue el cursor */
.mg-shine {
  position: absolute; inset: -50%;
  background: radial-gradient(circle at var(--rx, 50%) var(--ry, 50%),
    rgba(255,255,255,0.35) 0%,
    rgba(255,255,255,0.08) 25%,
    transparent 50%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}
.mg-card.attracting .mg-shine,
.mg-card.fired .mg-shine { opacity: 1; }
```

### Estados visuales

| Estado | Cambios |
|---|---|
| **idle** | Glass base. Shine invisible. Detail oculto (`max-height: 0`, `opacity: 0`). |
| **attracting** | `transform: translate(tx, ty) scale(1 + pull*0.02)` — pull hacia el cursor. Shine visible. Detail aún oculto. |
| **fired** | `transform: scale(1.02)` sin translate. `height: 280 → 360px`. Detail expanded (`max-height: 200px`, `opacity: 1`). Shadow más fuerte + glow exterior. Cover hace `scale(0.88) translateY(-4px)` (cede espacio al detail). |

### Backdrop ornaments del container

`HomeProjects.astro` añade estructura visible para que la refracción tenga qué deformar:

```astro
<section id="casos" class="casos-stage">
  <div class="casos-blob casos-blob-1"></div>
  <div class="casos-blob casos-blob-2"></div>
  <div class="casos-blob casos-blob-3"></div>
  <div class="casos-grid"></div>
  <div class="casos-cards">
    {cases.map((c, idx) => <Card {...c} {...zoneFor(idx, cases.length)} />)}
  </div>
</section>
```

Blobs colorados saturados con `filter: blur(1px)` (no más — el blur agresivo lava la refracción, principio aprendido durante el brainstorm). Grid sutil (32px) para contraste estructural. Colores derivados de la paleta de Casos (`bgColor` de cada case).

### Tipografía + espaciado

- Reusa fonts del sitio: `Poppins-S` para títulos, `Poppins-R` para body, `Alumni` para tags si aplica.
- Card: 200px ancho desktop, full-width mobile. 280px altura idle, 360px fired.
- Gap entre cards: 24px.
- Border radius: 22px.

---

## Sistema de interacción

### Zonas de atracción asimétricas

Cada card tiene 3 atributos data definidos por su posición:

| Card | `data-zone-left` | `data-zone-right` | `data-zone-vert` | Forma |
|---|---|---|---|---|
| Extrema izquierda (idx 0) | `220` | `60` | `120` | Generosa exterior izq, modesta interior |
| Central (idx 1) | `20` | `20` | `240` | Estrecha lateral, alta vertical |
| Extrema derecha (idx 2) | `60` | `220` | `120` | Mirror de izquierda |

Helper `zoneFor(idx, total)` en `HomeProjects.astro`:
- Si `total === 3`: usa los valores hardcoded arriba.
- Si `total > 3`: extiende lógica (extremas amplias exterior, intermedias estrechas laterales). Implementación de extensión queda para spec futuro cuando llegue el caso.

### Algoritmo (mousemove handler)

```ts
const MAX_PULL = 28;       // px máximo de desplazamiento magnético
const FIRE_ENTER = 70;     // distancia (px) para entrar a fired
const FIRE_EXIT = 130;     // distancia (px) para SALIR de fired (histéresis)

let firedCard: HTMLElement | null = null;
const bases = new Map<HTMLElement, BaseRect>();  // posiciones cacheadas pre-transform

function onMouseMove(e: MouseEvent) {
  const { mx, my } = stageCoords(e);

  // === PRIORIDAD 1: si hay firedCard, chequear bounds EXPANDIDOS actuales ===
  if (firedCard) {
    const eb = getCurrentBounds(firedCard);
    if (insideRect(mx, my, eb)) {
      updateSpecular(firedCard, e);
      return;  // queda fired, salida temprana
    }
    // Fuera del expandido — ¿está dentro de histéresis?
    const d = distanceToBaseCenter(firedCard, mx, my);
    if (d <= FIRE_EXIT) {
      updateSpecular(firedCard, e);
      return;
    }
    // Fuera de ambas → desfire
    unfireCard(firedCard);
    firedCard = null;
  }

  // === PRIORIDAD 2: pick winner de zonas base ===
  const winner = pickWinner(mx, my);
  cards.forEach(c => { if (c !== winner?.card) resetCard(c); });

  if (winner) {
    if (winner.distance < FIRE_ENTER) {
      fireCard(winner.card);
      firedCard = winner.card;
    } else {
      applyMagnetPull(winner);
    }
    updateSpecular(winner.card, e);
  }
}
```

Mousemove se throttle vía `requestAnimationFrame` (1 actualización por frame).

### Touch handler (móvil)

Separado de mouse:

```ts
function onTouchEnd(e: TouchEvent) {
  const target = e.target as HTMLElement;
  const tappedCard = target.closest('.mg-card') as HTMLElement | null;

  if (tappedCard) {
    if (tappedCard === firedCard) {
      // segundo tap en card fired → navegar
      // (no preventDefault, deja que <a> haga su default)
    } else {
      e.preventDefault();
      if (firedCard) unfireCard(firedCard);
      fireCard(tappedCard);
      firedCard = tappedCard;
    }
  } else {
    if (firedCard) {
      unfireCard(firedCard);
      firedCard = null;
    }
  }
}
```

Cero magnet en touch. La refracción + glow quedan estáticos. Detección touch: `('ontouchstart' in window || navigator.maxTouchPoints > 0)` deshabilita listener mousemove en devices touch.

### Focus (keyboard accessibility)

`:focus-within` o `focus` listener en cada card → aplica clase `fired` igual que en mouse close. Enter sobre card focused activa el `<a>` default → navega. Tab fuera quita focus → contrae.

### Inicialización + cleanup (Astro ClientRouter compatible)

```ts
export function initMagneticCards() {
  const stage = document.getElementById('casos');
  if (!stage) return;
  const cards = Array.from(stage.querySelectorAll<HTMLElement>('.mg-card'));
  if (cards.length === 0) return;

  cacheBases(stage, cards);

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) {
    stage.addEventListener('touchend', onTouchEnd, { passive: false });
  } else {
    stage.addEventListener('mousemove', onMouseMove);
    stage.addEventListener('mouseleave', resetAll);
  }
  cards.forEach(c => {
    c.addEventListener('focusin', () => fireCard(c));
    c.addEventListener('focusout', () => { if (firedCard === c) unfireCard(c); });
  });
  window.addEventListener('resize', () => cacheBases(stage, cards));
}
```

Invocación desde `HomeProjects.astro`:

```astro
<script>
  import { initMagneticCards } from "./magnetic-cards";
  document.addEventListener("astro:page-load", initMagneticCards);
</script>
```

### Reduced motion (accesibilidad + low-end fallback)

```css
@media (prefers-reduced-motion: reduce) {
  .mg-card {
    backdrop-filter: blur(12px) saturate(140%);  /* sin SVG filter */
    -webkit-backdrop-filter: blur(12px) saturate(140%);
    transition: none !important;
  }
  .mg-card.attracting, .mg-card.fired {
    transform: none !important;
  }
  .mg-shine { display: none; }
}
```

En JS, también skip de `applyMagnetPull` si `window.matchMedia('(prefers-reduced-motion: reduce)').matches`.

---

## Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R1** | Firefox no renderiza `backdrop-filter: url(#filter)` → solo blur, sin refracción | Alta (conocida) | Degradación grácil. Documentado como limitación browser. Site sigue legible y funcional |
| **R2** | Safari flicker con `backdrop-filter` + `mask-composite` combo | Media | Test temprano en Safari macOS + iOS preview deploy. Fallback: si glitcha, usar border sólido en lugar de gradient border |
| **R3** | Performance baja en mobile low-end (múltiples `backdrop-filter` paralelos) | Media | Honrar `prefers-reduced-motion`. JS skip de magnet si reduced. Sin SVG filter en reduced. |
| **R4** | Layout shift fuera de Casos cuando una card pasa fired (280→360) | Media | `min-height` fijo en `.casos-stage` que acomode estado fired. Transición sucede dentro del container, no empuja inferior |
| **R5** | Cursor custom del proyecto (`motion-cursor.ts`) conflicta con stage | Baja | NO sobrescribir `cursor` en `.casos-stage`. Dejar que el cursor existente actúe. Magnet + glow comunican engagement sin indicador extra |
| **R6** | Cards no accesibles vía teclado | Media | `:focus-within` mirror del fired state. Tab → fire. Enter → navega. Validar en smoke test |
| **R7** | Devices híbridos (laptop touch screen) — mouse listener deshabilitado | Baja | Decisión declarada: prefiere touch. Si volumen importa: futuro con Pointer Events API |
| **R8** | `card-interactions.ts` queda código muerto si nuevo Card no lo importa | Baja | Eliminar archivo en el mismo spec (después de confirmar 0 refs) |
| **R9** | SVG filter inline genera CSP issue con Spec 4 CSP nativo | Baja | `<svg>` no es inline script ni inline style. No afecta `script-src` ni `style-src`. Build + browser console smoke confirmará |
| **R10** | Scope creep — rediseñar Tools / sidebar / otros para "armonizar" | Alta | Disciplina: spec solo toca Card + HomeProjects + Layout (para SVG filter). Refactores adicionales → follow-ups |

**Plan de rollback global:** cada bucket revertible con `git revert <range>` sin afectar otros.

---

## Contrato

### Funcional

- 3 Casos del home se renderizan correctamente. Links a LinkedIn / sitio en vivo / mailto siguen funcionando.
- Una vez fired, mouse puede moverse libremente sobre toda el área expandida sin titilar.
- Touch: tap card → fire visual, tap card fired → navega vía `<a>` default, tap fuera → cierra.
- Keyboard: Tab → focus card → fire visual. Enter → navega.

### Visual

- Refracción óptica visible en Chrome / Safari (Firefox: blur fallback documentado).
- Glass border con highlight superior + bevel inferior.
- Specular highlight sigue el cursor al estar attracting o fired.
- Backdrop ornaments (blobs + grid) visibles a través del glass.

### No-regresión

- Cero cambios visuales en `/me`, `/contact`, sidebar, navbar, footer.
- `cases.ts` sin tocar (data preservada).
- Audio loop, hover de cualquier otro componente, mobile render — siguen idénticos.
- Spec 4 CSP nativo A+ se mantiene (sin nuevos inline scripts/styles que rompan hashes).

### Criterios de aceptación automáticos (grep + build)

```bash
test -f src/components/Card.astro                                # → exit 0
test -f src/components/magnetic-cards.ts                         # → exit 0
test ! -f src/components/card-interactions.ts                    # → exit 0 (eliminado)
grep -rn "card-interactions" src/                                # → vacío
grep -rn "initMagneticCards" src/                                # → ≥ 1 (HomeProjects.astro)
grep -c "feDisplacementMap" src/                                 # → ≥ 1 (filter inline en Layout.astro)
diff -q <(cat src/data/cases.ts) <(git show main:src/data/cases.ts)  # → identical
npm run build                                                    # → 0 errors / 0 warnings / 0 hints
```

### Criterios manuales (smoke en preview deploy)

- [ ] securityheaders.com sigue dando A+ (CSP nativo de Spec 4 no se rompe)
- [ ] Refracción visible en Chrome (blobs detrás distorsionados al pasar mouse por las cards)
- [ ] Zona asimétrica funciona: mover mouse horizontalmente entre cards a media altura — central NO atrapa
- [ ] Una card fired: mover mouse por toda el área expandida — sin flicker
- [ ] Touch (smartphone real o DevTools touch emulation): tap fire, tap fuera cierra, segundo tap navega
- [ ] `prefers-reduced-motion`: con OS en reduced motion, no se ven animaciones magnéticas

---

## No-objetivos (explícitos)

- **Cambios al array `cases` de `cases.ts`**. Las 3 entradas (Clonai, Justicia Cercana, V→A) se preservan byte-a-byte.
- **Carousel `hrefImages`**. El nuevo `Card.astro` no renderiza nada para esa property. Decisión sobre la interface `Case`: mantener `hrefImages?: string[]` como opcional unused (cero impacto, máxima conservación de `cases.ts`). NO se elimina del interface en este spec.
- **Refactor de componentes fuera del scope listado**. Sidebar, Tools, Navbar, Footer, Me*, Contact — intactos.
- **A/B testing, variantes alternativas, switcher de estilo**. Una sola implementación canónica.
- **Slider de refracción configurable por usuario**. `--refract-scale` es CSS variable interna (ajuste dev), no UI visible.
- **Touch con magnet (long-press + drag)**. Cero magnet en touch.
- **Variantes responsive elaboradas para tablet**. Mobile (touch) y desktop (mouse) son los 2 modos. Tablet híbrido cae en touch.
- **WebGL / Canvas / librería externa**. CSS + SVG filter son suficientes.
- **GSAP**. Animaciones por `requestAnimationFrame` directo. GSAP queda solo para otras secciones del sitio que ya lo usan.
- **Animación de entrada al scroll**. La card aparece estática hasta interacción. Animación entrada → follow-up.

---

## Follow-ups esperados (para spec futuro)

### Spec siguiente — Bilingüe ES/EN + Features OGG (próximo del roadmap)

- i18n nativo Astro 6 + switcher en `Tools.astro`
- Espejo del copy estable al inglés (incluye `mg-cta` label, formato fechas en `mg-meta` si aplica)
- Micro-experimento "Pregúntale a mi CV" con Anthropic SDK
- Feature interactivo con `public/VIN.ogg` / `VINXD.ogg`

### Polish adicional (futuro lejano)

- Re-evaluar zonas asimétricas si crece el número de Casos (>3 cards).
- Chromatic aberration en bordes para refracción premium (probable WebGL).
- Animación de "entrada" inicial al hacer scroll a la sección Casos (IntersectionObserver).
- Si producción muestra performance issues: degradar refracción a blur en `prefers-reduced-data`.
- Pointer Events API para devices híbridos (manejar último input usado: touch o mouse).

---

## Buckets de implementación (orden de ejecución)

| # | Bucket | Files | Riesgo | Commits |
|---|---|---|---|---|
| **A** | SVG filter global | `src/layouts/Layout.astro` (añadir `<svg>` filter inline) | Bajo | 1 |
| **B** | Lógica magnética | Crear `src/components/magnetic-cards.ts` (mousemove + touchend + focus + cacheBases + reduced-motion) | Medio | 1 |
| **C** | Refactor Card + HomeProjects | Rewrite completo `Card.astro` (glass stack + markup nuevo). Modificar `HomeProjects.astro` (backdrop ornaments + zoneFor helper + script import + remove old card-interactions import). | Alto | 2 |
| **D** | Cleanup viejo | Eliminar `src/components/card-interactions.ts` ahora huérfano. `cases.ts` se queda intacto (incluida la interface `Case` con `hrefImages?` unused). | Bajo | 1 |

**Orden:** A → B → C → D. A y B no rompen nada (definiciones nuevas, sin uso aún). C es el switch principal — pone el visual + interacción a funcionar. D limpia.

Total esperado: ~5 commits.

---

## Decisiones de diseño cerradas

- **Stack:** Astro 6 + TypeScript + CSS puro + SVG filter inline. Sin librerías nuevas.
- **Animación:** `requestAnimationFrame` directo + CSS transitions. No GSAP.
- **Refracción default:** `feDisplacementMap scale=22` (normal). Variable `--refract-scale` para tuning futuro.
- **Magnet:** `MAX_PULL=28`, `FIRE_ENTER=70`, `FIRE_EXIT=130` (px).
- **Zonas asimétricas:** hardcoded para 3 casos. Extensión para más casos → spec futuro.
- **Touch:** tap → fire, tap fuera → cierra. Sin magnet.
- **Keyboard:** focus dispara fire visual. Enter usa `<a>` default.
- **Reduced motion:** filter desactivado, animaciones desactivadas, shine oculto.
- **`cases.ts`:** intacto. Data preservada.
- **Old `card-interactions.ts`:** eliminado en bucket D.
- **`hrefImages` y carousel:** eliminados del modelo.
- **Variantes de refracción:** una sola (`#glassRefract` con scale=22). Variante "strong" futura como segundo filter + switch por clase si llega el caso.
- **Tests automatizados:** no se introducen (proyecto no los tiene).
