# Fix Sidebar Carousel Coordination — Diseño

**Fecha:** 2026-05-27
**Estado:** Diseño aprobado, pendiente plan de implementación
**Spec previo en el roadmap:** `2026-05-27-glass-material-sidebar-hexagons-design.md` (mergeado a main)
**Spec siguiente en el roadmap:** Backlog declarado (Bilingüe / Features OGG / Noise + toggle / etc.)

---

## Goal

Eliminar el bug visual del carousel del sidebar (`src/components/SideComponentMain.astro`) donde la transición entre palabras no está coordinada: hay un flash de la palabra nueva a opacity 1 antes del fade-in, las duraciones in/out son asimétricas (4s vs 3s), el timing del swap está acoplado vía `setTimeout(3000)` magic a la duración del CSS animation, y `Math.random()` puede picar la misma palabra dos veces seguidas (carousel parece congelado).

Bugfix focal sobre un solo archivo. Cero cambios al contenido (`nouns` array), al markup, al sidebar contenedor, ni a la cadencia del ciclo (20s).

## Architecture

Single-file rewrite del `<script>` y `<style>` blocks de `SideComponentMain.astro`. Reemplaza el sistema actual de 2 clases CSS (`fade-in-text` / `fade-out-text`) con `@keyframes` x5 prefijos vendor (~80 líneas CSS) por una única `transition: opacity 0.6s ease-in-out` controlada mediante mutación inline de `style.opacity`. Usa `transitionend` event para precision swap (sin magic `setTimeout`). Pick-non-repeating en random.

**Tech stack:** Astro 6 + TypeScript + CSS puro. Cero dependencias nuevas. Cero refactor estructural — el componente sigue siendo un solo `<p id="carousel">` controlado por un módulo script inline.

---

## Sistema técnico

### Bug actual (5 issues identificados)

1. **Flash de la palabra nueva a opacity 1 antes del fade-in.** `fade-out-text` tiene `animation: fadeOut 3s forwards`. Cuando termina, opacity está en 0 por el `forwards`. Pero cuando JS hace `remove('fade-out-text')` + `add('fade-in-text')`, en el frame intermedio entre quitar la clase y que la animation `fadeIn` arranque desde 0%, el opacity vuelve al default (1) por un frame. El browser pinta 1 frame con la palabra nueva a opacity 1 antes de empezar a fade-in desde 0 → "salto" visual perceptible.
2. **Duraciones asimétricas:** `fadeIn` dura 4s, `fadeOut` dura 3s. La animación se siente irregular (el out es más snappy que el in).
3. **Timing acoplado por setTimeout(3000):** el swap de texto se hace en un `setTimeout(..., 3000)` magic-numbered al hardcoded de `fadeOut 3s`. Si alguien cambia la duración CSS pero olvida el setTimeout, todo se desincroniza silenciosamente.
4. **Random sin filtro:** `nouns[Math.floor(Math.random() * nouns.length)]` puede picar el mismo índice del ciclo anterior → carousel parece congelado por un ciclo entero (~20s).
5. **`setInterval(20000)` corre desde el momento de registro, no del fin del ciclo anterior.** No es un bug grave (el ciclo de fade es corto vs 20s), pero combinado con los otros issues amplifica la sensación de descoordinación.

### Cambios en `<script>`

Reemplazar el script entero por:

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

const FADE_MS = 600;
const CYCLE_MS = 20000;

let lastIndex = -1;
let cycleIntervalId: ReturnType<typeof setInterval> | null = null;

function pickNext(): string {
    let idx: number;
    do {
        idx = Math.floor(Math.random() * nouns.length);
    } while (idx === lastIndex && nouns.length > 1);
    lastIndex = idx;
    return nouns[idx];
}

function initCarousel() {
    const carousel = document.querySelector<HTMLElement>("#carousel");
    if (!carousel) return;

    // Clean up previous interval (Astro view transitions re-fire astro:page-load)
    if (cycleIntervalId !== null) {
        clearInterval(cycleIntervalId);
        cycleIntervalId = null;
    }

    // Reset state, set first word invisible then fade in
    carousel.textContent = pickNext();
    carousel.style.opacity = '0';
    requestAnimationFrame(() => {
        carousel.style.opacity = '1';
    });

    cycleIntervalId = setInterval(() => {
        // Fade out
        carousel.style.opacity = '0';
        const onFadeOut = (e: TransitionEvent) => {
            if (e.propertyName !== 'opacity') return;
            carousel.removeEventListener('transitionend', onFadeOut);
            // Swap text while invisible (opacity is literally 0)
            carousel.textContent = pickNext();
            // Force browser to paint a frame with opacity:0 + new text
            // before transitioning opacity back to 1 — eliminates flash
            requestAnimationFrame(() => {
                carousel.style.opacity = '1';
            });
        };
        carousel.addEventListener('transitionend', onFadeOut);
    }, CYCLE_MS);
}

document.addEventListener("astro:page-load", initCarousel);
```

### Cambios en `<style>`

Reemplazar el style entero por:

```css
#carousel {
    color: var(--border);
    margin: 18px;
    font-size: 2rem;
    position: relative;
    flex-grow: 2;
    line-height: 0;
    opacity: 1;
    transition: opacity 0.6s ease-in-out;
}

@media screen and (max-height: 600px) {
    p {
        display: none;
    }
}
```

Se eliminan ~80 líneas: las 2 reglas `.fade-in-text` / `.fade-out-text` y los 10 bloques `@keyframes fadeIn`/`fadeOut` con prefijos vendor (`-moz-`, `-webkit-`, `-o-`, `-ms-`). `transition` nativo no necesita prefixes vendor en navegadores modernos (Astro 6 target ES2020+).

### Por qué esto arregla los 5 issues

1. **Flash eliminado**: opacity nunca vuelve al default (1) entre fade-out y fade-in. La secuencia es: `opacity: 0` (transition runs 0.6s) → `transitionend` fires → texto swap (DOM mutation con opacity ya en 0, invisible) → `requestAnimationFrame` (browser paints a frame con opacity:0 + nuevo texto) → `opacity: 1` (transition runs 0.6s).
2. **Duraciones simétricas**: una sola `transition: opacity 0.6s` aplica a ambas direcciones. Cambio de duración futuro = 1 lugar.
3. **Sin setTimeout magic**: `transitionend` event detecta cuándo terminó el fade-out con precisión. Acoplado al CSS automáticamente.
4. **Sin repetir palabra**: `pickNext()` reroll si sale la misma del último ciclo.
5. **Cycle timing estable**: `setInterval(20000)` arranca cada fade-out cada 20s consistentemente. El ciclo total interno (fade-out 0.6s + swap instant + fade-in 0.6s = ~1.2s) es muy corto comparado con 20s, no produce skew perceptible.

Plus: limpia ~80 líneas de CSS legacy (keyframes con prefijos vendor obsoletos).

---

## Contrato

### Funcional

- Carousel sigue mostrando palabras del array `nouns` (mismo array, sin tocar contenido).
- Astro `astro:page-load` listener sigue inicializando — compatible con view transitions (con cleanup de interval previo añadido).
- `@media (max-height: 600px) { p { display: none; } }` preservado.

### Visual

- Cero flash al cambio de palabra.
- Fade in/out simétrico 0.6s.
- Palabra nueva nunca repite la inmediatamente anterior.
- Color, margin, font-size, line-height del `#carousel` intactos.

### No-regresión

- Sidebar (`Sidebar.astro` contenedor) sigue funcionando idéntico.
- Tipografía Poppins-R aplicada del className en el `<p>` (clase actual `container Poppins-R text_center`).
- Build pasa 0/0/0.
- Si Astro hace view transition entre páginas y re-ejecuta `initCarousel`, no acumula intervals (cleanup explícito).

### Criterios de aceptación automáticos

```bash
grep -c "fade-in-text\|fade-out-text" src/components/SideComponentMain.astro   # → 0 (clases eliminadas)
grep -c "@keyframes" src/components/SideComponentMain.astro                    # → 0 (keyframes eliminados)
grep -c "transition: opacity" src/components/SideComponentMain.astro           # → 1
grep -c "transitionend" src/components/SideComponentMain.astro                 # → ≥ 1
grep -c "pickNext" src/components/SideComponentMain.astro                      # → ≥ 2 (declaration + uses)
grep -c "cycleIntervalId" src/components/SideComponentMain.astro               # → ≥ 3 (declaration + cleanup + assignment)
npm run build                                                                  # → 0/0/0
```

### Criterios manuales (smoke en preview)

- [ ] Cargar `/` y mirar el sidebar por ~30s. Observar al menos 1 cambio de palabra.
- [ ] Cero flash visible al cambio (la palabra nueva fade-in desde opacity 0, no aparece a 1 antes).
- [ ] La duración del fade out y fade in se sienten iguales (~0.6s cada uno).
- [ ] Refrescar varias veces. La primera palabra fade-in correctamente (no aparece instant).
- [ ] Navegar `/` → `/me` → `/` (view transition). No hay multiple intervals corriendo (verifica con DevTools que la palabra cambia cada ~20s, no más rápido).
- [ ] Observar 3-4 cambios consecutivos. Nunca dos palabras iguales seguidas (con probabilidad ~10% sin el fix, ahora 0%).

---

## Riesgos

| # | Riesgo | Probabilidad | Mitigación |
|---|---|---|---|
| **R1** | `transitionend` no dispara si la transición se cancela mid-flight (ej. otra mutación rápida del opacity) | Baja | El `setInterval` es 20s, mucho más largo que el ciclo de fade (1.2s). No hay race condition realista. Si sucede algo edge: el siguiente ciclo arregla — peor caso 1 palabra queda visible 2x el tiempo |
| **R2** | Browsers viejos sin soporte `transition` (IE9 etc) | Muy baja | Astro 6 target moderno. El portafolio no soporta IE. Si user tiene browser muy viejo: opacity simplemente no anima, palabra cambia instant. Aceptable |
| **R3** | Astro view transition al navegar entre páginas re-ejecuta `initCarousel` → multiple `setInterval` corriendo | Media → Mitigada | Cleanup explícito al inicio de `initCarousel`: `if (cycleIntervalId !== null) { clearInterval(cycleIntervalId); cycleIntervalId = null; }`. El `let cycleIntervalId` está en module scope, persiste entre invocaciones |
| **R4** | Bug: si `nouns.length === 1`, el `do-while` haría loop infinito | Muy baja → Mitigada | Guard incluido: `while (idx === lastIndex && nouns.length > 1)`. Si solo hay 1 noun, retorna ese (aceptable). Actualmente hay 10 |
| **R5** | El `requestAnimationFrame` callback no se ejecuta si el tab está hidden (Page Visibility API pausa rAF) | Baja | Si el tab está hidden cuando arranca el cycle: el rAF se queda pending. Cuando el tab vuelve a visible, dispara, completa la transición. Peor caso: la palabra queda "stuck" mid-fade hasta visibilidad. No es regresión vs comportamiento actual |

**Plan de rollback:** 1 commit atómico. `git revert <hash>` deja el carousel en estado pre-Spec-7 (con los 5 bugs, pero funcional).

---

## No-objetivos (explícitos)

- **Crossfade con 2 spans/elementos superpuestos.** Considerado en brainstorm, rechazado por overkill — fix focal es suficiente.
- **GSAP rewrite.** Sin justificación dado que el problema es timing simple. Mantener consistencia con el resto de scripts vanilla del proyecto.
- **Web Animations API.** Igual que GSAP — no aporta valor sobre `transition` CSS para este caso.
- **Cambiar el array `nouns` (contenido).** Solo se arregla el mecanismo, no las palabras.
- **Cambiar cadencia del ciclo (20s).** Confirmado por el usuario durante brainstorm.
- **Cambiar duración del fade fuera de 0.6s.** Confirmado por el usuario (match con `mg-shine` transition en cards/hex).
- **Refactor de `Sidebar.astro`** (contenedor padre). Out of scope.
- **i18n del carousel.** Los nouns siguen en español/inglés mezclados. Cuando llegue Spec Bilingüe, se decidirá traducción y mecanismo per-language.

---

## Follow-ups esperados

### Backlog (no priorizado entre sí, pendiente decisión del usuario)

- **Bilingüe ES/EN** — i18n nativo Astro 6 con switcher en `Tools.astro`. Cuando llegue, se decide qué hacer con los `nouns` del carousel (algunos quirks en español, otros generales).
- **Features OGG** — diseño del feature interactivo para `public/VIN.ogg` y `public/VINXD.ogg`.
- **Micro-experimento "Pregúntale a mi CV"** — endpoint serverless con Anthropic SDK directo + isla React.
- **Efecto noise tipo ui-layouts.com/components/noise** — SVG `feTurbulence` overlay aplicado al background del portafolio + toggle desde `Tools.astro` para que el visitante pueda quitarlo.
- **Display visual de `company/role/period` en cards de Casos.**
- **Re-evaluar `Tools.astro` (~330 LOC)** cuando se le añadan los toggles (idioma + noise).

---

## Buckets de implementación

| # | Bucket | Files | Riesgo | Commits |
|---|---|---|---|---|
| **A** | Fix carousel coordination | `src/components/SideComponentMain.astro` | Bajo | 1 |

Total esperado: 1 commit atómico (rewrite del `<script>` + `<style>` blocks de un solo archivo).

---

## Decisiones de diseño cerradas

- **Stack:** Astro 6 + TypeScript + CSS puro. Cero dependencias nuevas. Cero JS framework adicional (no GSAP, no Web Animations API).
- **Approach:** single element + `style.opacity` mutation + `transition` CSS + `transitionend` event. NO crossfade con 2 spans.
- **Cadencia:** 20s entre cambios (preservado del original).
- **Fade duration:** 0.6s simétrica in/out (match con `mg-shine` transition de cards/hex).
- **Random:** no-repeat reroll (`pickNext()` con `lastIndex` tracking).
- **View transitions safety:** cleanup explícito de `setInterval` al inicio de cada `initCarousel` (re-fire safe).
- **`nouns` array:** intacto (10 palabras actuales preservadas byte-a-byte).
- **No tests automatizados** (proyecto no los tiene).
