# Fix Sidebar Carousel Coordination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminar el bug visual del carousel en `src/components/SideComponentMain.astro`: flash de palabra nueva a opacity 1 antes del fade-in, duraciones asimétricas (4s/3s), timing acoplado vía setTimeout magic, random sin filtro que repite palabras, e instabilidad del intervalo en view transitions.

**Architecture:** Single-file rewrite del `<script>` y `<style>` blocks. Reemplaza ~80 líneas de CSS @keyframes con prefijos vendor por una `transition: opacity 0.6s ease-in-out`. Reemplaza `setTimeout(3000)` magic por `transitionend` event listener. Pick-non-repeating en random. Cleanup explícito de setInterval para view transition safety.

**Tech Stack:** Astro 6 + TypeScript + CSS puro. Cero dependencias nuevas. Cero refactor estructural.

**Spec:** `docs/superpowers/specs/2026-05-27-fix-sidebar-carousel-coordination-design.md`

---

## File Structure

| Archivo | Acción | Responsabilidad |
|---|---|---|
| `src/components/SideComponentMain.astro` | Modify (rewrite `<script>` + `<style>` blocks) | Carousel del sidebar — display rotating words con fade transition coordinado, sin flash, sin repetición, view-transition-safe |

Frontmatter (líneas 1-3) y template markup (línea 5) NO se tocan.

---

## Pre-flight: Baseline state

### Task 0: Confirmar baseline

**Files:** ninguno modificado.

- [ ] **Step 0.1: Verificar branch + working tree limpio**

Run: `git status && git branch --show-current`
Expected: branch `fix-sidebar-carousel-coordination`, `nothing to commit, working tree clean`.

- [ ] **Step 0.2: Build baseline pasa**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints` + `Complete!`.

- [ ] **Step 0.3: Confirmar último commit es el spec**

Run: `git log --oneline -2`
Expected: el commit más reciente es `docs(spec): add Fix Sidebar Carousel Coordination design (Spec 7)` (hash `bd8a15c` o equivalente).

- [ ] **Step 0.4: Verificar estado actual del componente**

Run: `wc -l src/components/SideComponentMain.astro`
Expected: ~165 líneas (estado actual antes del fix; tras el fix debería bajar significativamente por eliminación de keyframes prefixados).

Run: `grep -c "@keyframes" src/components/SideComponentMain.astro`
Expected: `≥ 8` (5 prefijos × 2 keyframes = 10 actualmente).

---

## Bucket A — Fix carousel coordination

### Task A.1: Rewrite SideComponentMain.astro

**Files:**
- Modify: `src/components/SideComponentMain.astro` (rewrite `<script>` y `<style>` blocks; frontmatter + markup intactos)

**Estado actual del archivo completo** (165 líneas):

```astro
---

---

<p id="carousel" class="container Poppins-R text_center"></p>

<script>
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

    function initCarousel() {
        const carousel = document.querySelector<HTMLElement>("#carousel");
        if (!carousel) return;

        carousel.textContent = nouns[Math.floor(Math.random() * nouns.length)];
        carousel.classList.add("fade-in-text");

        setInterval(() => {
            carousel.classList.remove("fade-in-text");
            carousel.classList.add("fade-out-text");

            setTimeout(() => {
                carousel.textContent = nouns[Math.floor(Math.random() * nouns.length)];
                carousel.classList.remove("fade-out-text");
                carousel.classList.add("fade-in-text");
            }, 3000);
        }, 20000);
    }

    document.addEventListener("astro:page-load", initCarousel);
</script>

<style>
    #carousel {
        color: var(--border);
        margin: 18px;
        font-size: 2rem;
        position: relative;
        flex-grow: 2;
        line-height: 0;
    }

    .fade-in-text {
        animation: fadeIn 4s;
        -webkit-animation: fadeIn 4s;
        -moz-animation: fadeIn 4s;
        -o-animation: fadeIn 4s;
        -ms-animation: fadeIn 4s;
    }

    @keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    @-moz-keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    @-webkit-keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    @-o-keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }
    @-ms-keyframes fadeIn { 0% { opacity: 0; } 100% { opacity: 1; } }

    .fade-out-text {
        animation: fadeOut 3s forwards;
        -webkit-animation: fadeOut 3s forwards;
        -moz-animation: fadeOut 3s forwards;
        -o-animation: fadeOut 3s forwards;
        -ms-animation: fadeOut 3s forwards;
    }

    @keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
    @-moz-keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
    @-webkit-keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
    @-o-keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }
    @-ms-keyframes fadeOut { 0% { opacity: 1; } 100% { opacity: 0; } }

    @media screen and (max-height: 600px) {
        p {
            display: none;
        }
    }
</style>
```

(Los `@keyframes` están condensados arriba para legibilidad — en el archivo real cada uno ocupa varias líneas. El conteo total es ~80 líneas de keyframes + classes.)

- [ ] **Step A.1.1: Sobrescribir TODO el archivo**

Reemplazar el contenido completo de `src/components/SideComponentMain.astro` con EXACTAMENTE:

```astro
---

---

<p id="carousel" class="container Poppins-R text_center"></p>

<script>
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

        // Cleanup previous interval (Astro view transitions re-fire astro:page-load)
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
</script>

<style>
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
</style>
```

**Cambios vs estado actual:**

- **Frontmatter (líneas 1-3):** vacío, intacto.
- **Template markup (línea 5):** `<p id="carousel" class="container Poppins-R text_center"></p>` intacto.
- **`<script>` block:** rewrite. Cambios principales:
  - Añadidos constantes `FADE_MS = 600`, `CYCLE_MS = 20000`.
  - Añadidas variables module-scope `lastIndex`, `cycleIntervalId`.
  - Nueva función `pickNext()` con guard contra repetición.
  - `initCarousel` ahora limpia `cycleIntervalId` previo antes de crear uno nuevo.
  - Initial fade-in usa `style.opacity = '0'` → `requestAnimationFrame` → `style.opacity = '1'` (en lugar de añadir clase `fade-in-text`).
  - Cycle usa `transitionend` event listener (en lugar de `setTimeout(3000)` magic).
  - Swap de texto sucede DESPUÉS del `transitionend` (cuando opacity confirmado en 0), seguido de `requestAnimationFrame` antes de transición de vuelta — elimina el flash.
- **`<style>` block:** simplificado drasticamente.
  - `#carousel` ahora incluye `opacity: 1` (initial state) y `transition: opacity 0.6s ease-in-out`.
  - **Eliminadas:** 2 reglas (`.fade-in-text`, `.fade-out-text`) y 10 bloques `@keyframes` (5 prefijos × 2 animations).
  - `@media (max-height: 600px) { p { display: none; } }` preservado al final.

- [ ] **Step A.1.2: Verificar build**

Run: `npm run build`
Expected: `0 errors, 0 warnings, 0 hints` + `Complete!`.

- [ ] **Step A.1.3: Verificar greps (criterios del spec)**

Run los criterios automáticos del spec:

```bash
echo "1. fade-in-text/fade-out-text eliminadas:"
grep -c "fade-in-text\|fade-out-text" src/components/SideComponentMain.astro

echo "2. @keyframes eliminados:"
grep -c "@keyframes" src/components/SideComponentMain.astro

echo "3. transition: opacity presente:"
grep -c "transition: opacity" src/components/SideComponentMain.astro

echo "4. transitionend listener presente:"
grep -c "transitionend" src/components/SideComponentMain.astro

echo "5. pickNext referenciado (declaración + uses):"
grep -c "pickNext" src/components/SideComponentMain.astro

echo "6. cycleIntervalId referenciado (declaración + cleanup + assignment):"
grep -c "cycleIntervalId" src/components/SideComponentMain.astro
```

Expected:
- 1: `0` (clases eliminadas)
- 2: `0` (keyframes eliminados)
- 3: `1`
- 4: `≥ 1` (al menos 1 ref: el `addEventListener('transitionend', ...)`)
- 5: `≥ 2` (declaración + invocaciones: `pickNext()` aparece en initial + dentro de setInterval = 3 totales)
- 6: `≥ 3` (declaración `let`, cleanup `if (cycleIntervalId !== null)` + `clearInterval(cycleIntervalId)` + `cycleIntervalId = null` + assignment `cycleIntervalId = setInterval(...)` = 5 totales)

- [ ] **Step A.1.4: Verificar contenido preservado**

Run: `grep -c "Software Developer\|Dev in dev\|Pizza Time\|FullStack\|Frontend\|Backend\|AI-pilled\|Implementation Lead\|Architecture-pilled\|Gamer" src/components/SideComponentMain.astro`
Expected: `≥ 10` (las 10 palabras del array nouns intactas).

Run: `grep -c "container Poppins-R text_center" src/components/SideComponentMain.astro`
Expected: `1` (className del `<p>` intacto).

Run: `grep -c "max-height: 600px" src/components/SideComponentMain.astro`
Expected: `1` (media query preservado).

- [ ] **Step A.1.5: Verificar reducción de líneas**

Run: `wc -l src/components/SideComponentMain.astro`
Expected: significativamente menos de 165 líneas — esperado ~85-95 líneas (eliminó ~80 líneas de CSS keyframes vendor-prefixed).

- [ ] **Step A.1.6: Commit**

```bash
git add src/components/SideComponentMain.astro
git commit -m "fix(sidebar): coordinate carousel fade — eliminate flash + sync timing

Reescritura focal de SideComponentMain.astro <script> + <style>.

Bugs fixed:
1. Flash de palabra nueva a opacity 1 antes del fade-in: eliminado
   via secuencia opacity:0 → transitionend → swap → requestAnimationFrame
   → opacity:1. El browser pinta un frame con opacity:0 + texto nuevo
   antes de iniciar la transición de vuelta.
2. Duraciones asimétricas (4s/3s): unificadas a 0.6s simétrico via
   transition CSS (FADE_MS constant).
3. Timing acoplado vía setTimeout(3000) magic: sustituido por
   transitionend event listener (precisión, sin acoplamiento manual).
4. Random repetía misma palabra: pickNext() reroll con lastIndex
   tracking (guard nouns.length > 1 evita loop infinito edge case).
5. Multiple setInterval en view transitions: cleanup explícito al
   inicio de initCarousel (cycleIntervalId module-scope).

CSS: eliminadas ~80 líneas de @keyframes con prefixes vendor
(-moz-, -webkit-, -o-, -ms-) reemplazadas por
transition: opacity 0.6s ease-in-out nativo (Astro 6 target ES2020+
no necesita prefixes).

Cero cambios al array nouns, al markup, al sidebar contenedor.
Cadencia de 20s entre cambios preservada."
```

---

## Final: verificación + PR

### Task F.1: Verificación integral

**Files:** ninguno modificado.

- [ ] **Step F.1.1: Confirmar `Sidebar.astro` y otros archivos intactos**

```bash
diff -q src/components/Sidebar.astro <(git show main:src/components/Sidebar.astro) 2>&1 && echo "Sidebar.astro: OK"
diff -q src/components/Hexagon.astro <(git show main:src/components/Hexagon.astro) 2>&1 && echo "Hexagon.astro: OK"
diff -q src/components/Card.astro <(git show main:src/components/Card.astro) 2>&1 && echo "Card.astro: OK"
diff -q src/layouts/Layout.astro <(git show main:src/layouts/Layout.astro) 2>&1 && echo "Layout.astro: OK"
diff -q src/styles/utilities.css <(git show main:src/styles/utilities.css) 2>&1 && echo "utilities.css: OK"
```

Expected: 5× `OK`.

- [ ] **Step F.1.2: Confirmar único archivo de código tocado**

Run: `git diff --stat main..HEAD`
Expected: solo `src/components/SideComponentMain.astro` + el spec markdown (`docs/superpowers/specs/2026-05-27-fix-sidebar-carousel-coordination-design.md`) y el plan markdown (este mismo, si ya commiteado).

- [ ] **Step F.1.3: Push branch**

Run: `git push -u origin fix-sidebar-carousel-coordination`
Expected: branch push exitoso. Vercel arranca preview deploy (~1-3 min).

- [ ] **Step F.1.4: Obtener URL preview**

Manual: Vercel dashboard → Deployments → branch `fix-sidebar-carousel-coordination` → estado Ready → copiar preview URL.

### Task F.2: Smoke test manual en preview

**Files:** ninguno modificado.

- [ ] **Step F.2.1: securityheaders.com no regresa**

Manual: https://securityheaders.com/?q=`<preview-url>`
Expected: A+ (igual que producción — no nuevos inline scripts/styles que rompan hashes CSP).

- [ ] **Step F.2.2: Carousel funciona sin flash**

Manual: abrir `<preview-url>/` en Chrome con DevTools. Mirar el carousel del sidebar (palabra rotatoria en la mitad del sidebar).

- Esperar ~20s observando el cambio de palabra.
- **Esperado:** la palabra fade-out suavemente → desaparece → la palabra nueva fade-in desde 0. **NO debe verse la palabra nueva a opacity 1 antes del fade-in (cero flash).**
- Las duraciones de fade in y fade out se sienten iguales (~0.6s cada uno).

- [ ] **Step F.2.3: First word fade-in correcto**

Manual: refrescar la página varias veces (Ctrl+R). Observar la primera aparición del carousel.

- **Esperado:** la primera palabra hace fade-in desde 0 (no aparece instant a opacity 1). El efecto debe ser igual al de los cambios subsecuentes.

- [ ] **Step F.2.4: Sin repetición consecutiva**

Manual: observar ≥4 cambios consecutivos del carousel.

- **Esperado:** nunca dos palabras iguales seguidas. (Antes del fix: probabilidad ~10% por ciclo de repetir. Ahora: 0%.)

- [ ] **Step F.2.5: View transition no acumula intervals**

Manual: con DevTools Performance/Console abierto:
- Cargar `/`
- Navegar a `/me` (link en navbar)
- Volver a `/` (link en navbar)
- Esperar 25s
- **Esperado:** la palabra del carousel cambia UNA vez en ese intervalo de 25s (cada 20s). NO debe cambiar varias veces seguidas (sería signo de multiple intervals acumulados).

- [ ] **Step F.2.6: No-regresión en otras secciones**

Manual:
- Cards de Casos en `/`: hover dispara magnetic + glass intacto.
- Hexágonos en `/`: hover dispara shine intacto.
- Audio loop, cursor custom, navbar, footer: sin cambios.
- DevTools Console: cero errores.

### Task F.3: Abrir PR

**Files:** ninguno modificado.

- [ ] **Step F.3.1: gh pr create**

Run:
```bash
gh pr create --title "fix: coordinate sidebar carousel fade (Spec 7)" --body "$(cat <<'EOF'
## Summary

Reescritura focal de `SideComponentMain.astro` para eliminar 5 bugs visuales del carousel del sidebar:

1. **Flash de palabra nueva a opacity 1 antes del fade-in** — eliminado via secuencia `opacity:0` → `transitionend` → swap texto → `requestAnimationFrame` → `opacity:1`.
2. **Duraciones asimétricas (4s in / 3s out)** — unificadas a 0.6s simétrico via `transition` CSS.
3. **`setTimeout(3000)` magic acoplado al CSS animation** — sustituido por `transitionend` event listener.
4. **Random repetía misma palabra** — `pickNext()` con `lastIndex` tracking + guard contra loop infinito.
5. **Multiple `setInterval` en view transitions** — cleanup explícito al inicio de `initCarousel` con module-scope `cycleIntervalId`.

CSS: eliminadas ~80 líneas de `@keyframes` con prefixes vendor (`-moz-`, `-webkit-`, `-o-`, `-ms-`) reemplazadas por `transition: opacity 0.6s ease-in-out` nativo. Astro 6 target ES2020+ no necesita prefixes.

Cero cambios al array `nouns` (mismas 10 palabras), al markup, al sidebar contenedor, ni a la cadencia de 20s entre cambios.

## Test plan

- [ ] securityheaders.com sobre preview URL → A+
- [ ] Observar ≥1 cambio de palabra: cero flash de la palabra nueva a opacity 1 antes del fade-in
- [ ] Refrescar varias veces: la primera palabra hace fade-in desde 0 (no aparece instant)
- [ ] Observar 3-4 cambios consecutivos: nunca dos palabras iguales seguidas
- [ ] Navegar `/` → `/me` → `/` y esperar 25s: palabra cambia UNA vez (no multiple intervals)
- [ ] No regresión: cards/hexágonos/audio/navbar/footer intactos
- [ ] `npm run build` → 0/0/0

Spec: \`docs/superpowers/specs/2026-05-27-fix-sidebar-carousel-coordination-design.md\`
Plan: \`docs/superpowers/plans/2026-05-27-fix-sidebar-carousel-coordination.md\`
EOF
)"
```

Expected: PR creado. Devuelve URL.

- [ ] **Step F.3.2: Esperar review humano + merge**

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
git branch -d fix-sidebar-carousel-coordination
git push origin --delete fix-sidebar-carousel-coordination
```

---

## Resumen de tareas

- **Task 0**: Baseline (4 steps, 0 commits)
- **Bucket A**: A.1 rewrite SideComponentMain.astro (6 steps, 1 commit)
- **Final**: F.1 verificación + F.2 smoke + F.3 PR + F.4 post-merge (0 commits adicionales)

**Total commits esperados:** 1 commit atómico sobre la branch `fix-sidebar-carousel-coordination`.
**Tiempo esperado:** ~20-30 min (incluye espera de preview deploy + smoke manual de cambios del carousel que ocurren cada 20s).
**Riesgo principal:** R3 del spec — view transition re-fire de `initCarousel`. Mitigado por cleanup explícito de `cycleIntervalId`. Plan B: `git revert` del commit deja carousel pre-Spec-7 (con los 5 bugs, pero funcional).
