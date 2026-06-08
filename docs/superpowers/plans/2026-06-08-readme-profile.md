# README Profile "no genérico" Implementation Plan

> **ESTADO: ✅ SHIPPED a `main` y validado en producción (2026-06-08).**
> Todas las features están live en el perfil github.com/KevinJGV. El detalle de lo que
> realmente quedó (difiere del plan original) y los pendientes están al final, en
> **"Estado final shipped"** y **"Pendientes / follow-ups"**. Aprendizajes técnicos
> reutilizables en `docs/superpowers/findings/2026-06-08-readme-profile-findings.md`.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hacer que el README de perfil de KevinJGV destaque vs uno genérico con 5 features que usan datos reales que Kevin controla y su estética personal.

**Architecture:** El repo `KevinJGV/KevinJGV` es dual-propósito (README de perfil + portfolio Astro en Vercel). Los SVG dinámicos se sirven como rutas API del propio proyecto (`/api/*`, patrón de `src/pages/api/nowplaying.ts`) y se embeben en el README. El banner y el grafo 3D son assets estáticos/generados.

**Tech Stack:** Astro 6 (static + serverless endpoints), TypeScript, Last.fm API, SVG (CSS animations / SMIL), GitHub Actions.

---

## Context

Objetivo: perfil que no se vea genérico. Features: (1) Now Playing en vivo, (2) Banner ASCII fastfetch, (3) Chismes colapsables, (5) WakaTime, (6) Grafo 3D. (La idea "quotes" fue descartada.)

Restricciones: `.env` con secretos reales (no commitear; solo `.env.example`). Rutas API leen env con `import.meta.env.X ?? process.env.X`. No tocar `output: 'static'`. Verificación canónica: `npm run build` (incluye `astro check`). Usar context7 para APIs de librerías. Disciplina: dado que SVGs/README/Action no tienen assert unitario útil, la verificación es **verification-driven** (curl → 200 + `image/svg+xml`, build verde, inspección visual); donde haya lógica pura testeable, va con test.

---

## Task 1: Now Playing en vivo (SVG dinámico) ⭐

**Files:**
- Create: `src/lib/lastfm.ts`
- Modify: `src/pages/api/nowplaying.ts` (importar del nuevo módulo, sin cambiar su salida JSON)
- Create: `src/pages/api/now-playing.svg.ts` (ruta `/api/now-playing.svg`)
- Modify: `README.md` (sección "🎧 What am i listening now?", líneas ~23-24)

**Detalle:**
- `src/lib/lastfm.ts`: extraer `lastfmTrack()`, `itunes()`, `deezerPreview()`, interfaz `TrackInfo` desde `nowplaying.ts`. Env vars `LASTFM_API_KEY`, `LASTFM_USER` con patrón `import.meta.env.X ?? process.env.X`.
- `now-playing.svg.ts`: `export const prerender = false`; `GET` → `Content-Type: image/svg+xml`. Reusa `lastfmTrack()` + `itunes()`. Carátula embebida como **data URI base64** (fetch server-side de los bytes → base64). Ecualizador animado replicando rects + `@keyframes short-eq/tall-eq` de `SpotifyPlayer.astro:8-13,156-166` dentro de `<defs><style>`. Color `--green: #1ed760`. Label "Now playing"/"Last played" según `isPlaying`. Texto truncado con `…`. Fuente `ui-monospace/system-ui`. `Cache-Control: public, max-age=60, s-maxage=60`. Fallback robusto: sin env/track/fetch → SVG "not playing" válido (status 200).
- README: reemplazar bloque comentado por `[![Now Playing](https://www.vindevsito.dev/api/now-playing.svg)](https://open.spotify.com/user/22xnxi2j2d3vra2qhozf3bzsa)`.

**Verificación:** `npm run dev` → `curl -s -o /dev/null -w "%{http_code} %{content_type}" http://localhost:4321/api/now-playing.svg` = `200 image/svg+xml`; abrir SVG en navegador; `npm run build` pasa.

---

## Task 3: Chismes colapsables (`<details>`)

**Files:**
- Modify: `README.md`

**Detalle:** Nueva sección colapsable tras "💫 Hi there": `<details><summary>🫣 Chismes…</summary>…</details>`. Mover los fun facts triviales del bloque "Hi there" adentro (4 nipples, lugares de la ciudad, videojuegos), manteniendo los quirks. Solo markdown.

**Verificación:** preview markdown (colapsa/expande).

---

## Task 6: Grafo de contribución 3D (GitHub Action)

**Files:**
- Create: `.github/workflows/profile-3d.yml`
- Modify: `README.md` (sección "🧊 3D Contributions")

**Detalle:** Workflow con `yoshi389111/github-profile-3d-contrib`. Triggers `schedule` (cron diario) + `workflow_dispatch`. Token `secrets.GITHUB_TOKEN`. Genera SVGs en `profile-3d-contrib/*.svg` y commitea. Verificar versión/uso de la action (su README) antes de fijar el YAML. README: `![3D](./profile-3d-contrib/profile-night-rainbow.svg)`. Opcional (confirmar con Kevin): reactivar snake con `Platane/snk`.

**Verificación:** `workflow_dispatch` (o `gh workflow run`) → confirma commit del SVG.

---

## Task 2: Banner ASCII estilo fastfetch

**Files:**
- Create: `assets/banner.svg`
- Modify: `README.md` (línea 2, `<img src>`)

**Prereq (Kevin):** rutas de retrato + logo `.:VIN` (fallback: extraer de `Github_banner.png`).

**Detalle:** Retrato → ASCII (jp2a/script luminancia, calibrar columnas/contraste). SVG: izquierda ASCII del retrato (monospace `<text>`), derecha panel fastfetch (`kevin@KevinJGV`, separador, `Name:`/`Role:`/`Traits:` con las words, opcional `Stack:`/`Editor:`). Animación reveal por líneas (CSS). Fuente `ui-monospace`. README: cambiar `Github_banner.png` → `banner.svg`; **conservar PNG** como fallback.

**Verificación:** abrir `assets/banner.svg` en navegador (legible, animación, words presentes).

---

## Task 5: WakaTime

**Files:**
- Modify: `README.md` (sección "⌛ Coding Time")

**Prereq (Kevin):** cuenta wakatime.com + plugin en editor + perfil público + username.

**Detalle:** Reusa instance self-hosted `github-readme-stats-chi-livid-94.vercel.app/api/wakatime?username=<wakaUser>&theme=dracula&layout=compact&hide_border=false`. (Privado: env `WAKATIME_API_KEY` en la instance.) Datos se acumulan con el uso.

**Verificación:** `curl` al endpoint = `200 image/svg+xml`.

---

## Orden de ejecución

1/3/6 (sin dependencia de Kevin) → 2/5 (necesitan assets/credenciales). Commits a la rama `feat/readme-profile`; Kevin pushea/mergea.

---

## Estado final shipped (lo que realmente quedó en `main`)

El repo `KevinJGV/KevinJGV` es dual: README de perfil + portfolio Astro (Vercel). Live:

- **Banner ASCII fastfetch** — `assets/banner.svg`, generado por `scripts/banner/`:
  - `img2ascii.py`: line-art → ASCII por **cobertura de tinta** (`-threshold` → `-negate` →
    `-filter Box -resize` → mapeo `cobertura^gamma` a rampa). Capta líneas finas (ojos, nariz,
    boca, dedos) que el método de luminancia/`-level` borraba. CLI: `img2ascii.py <png> <cols> <thresh> <gamma>` (uso: `portrait.png 84 50% 0.6`).
  - `generate_banner.py`: SVG con retrato a la izquierda (cada glifo con **x absoluta**, sin
    espacios — evita cizalladura/colapso de espaciado en visores) + panel fastfetch a la derecha
    con **typewriter** (`clip-path: inset()` animado con `steps(N)` por línea, delays acumulados)
    y **cursor que sigue la escritura** (una animación `transform: translate` `curmove` que recorre
    el borde de revelado de cada línea y salta a la siguiente, parpadeando).
  - Retrato fuente: `scripts/banner/portrait.png` (la versión simplificada "peace sign"). El PNG
    original `assets/Github_banner.png` se conserva como fallback.
  - Datos del panel (en `generate_banner.py`, lista `rows` + `host_user`): `omarchy@vindev`,
    Name, Role (`FullStack Dev · Implementation Lead`), Learning, Traits, Stack, Editor (`VS Code`),
    Uptime. **Se quitó la fila Company (Clonai) — Kevin ya no trabaja ahí.**
- **Now Playing en vivo** — `src/pages/api/now-playing.svg.ts` + `src/lib/lastfm.ts` (Last.fm +
  iTunes, carátula base64, ecualizador animado). README embebe `https://www.vindevsito.dev/api/now-playing.svg`.
- **Chismes colapsables** — `<details>` en README.
- **WakaTime** — card desde la instance self-hosted `github-readme-stats-chi-livid-94.vercel.app/api/wakatime?username=VinDev`.
- **Grafo 3D** — `.github/workflows/profile-3d.yml` (yoshi389111/github-profile-3d-contrib@v0.9.2);
  genera `profile-3d-contrib/*.svg` y commitea. README usa `profile-night-rainbow.svg`.
- **Snake** — `.github/workflows/snake.yml` (Platane/snk@v3, `outputs:` + `github_token`).
- **Widgets self-hosted** (forks de Kevin en su Vercel, ver README): stats/top-langs, trophy,
  activity-graph, contribution-stats. Tokens = un PAT en cada proyecto.
- (Descartado del plan: la idea de "quotes" y el parpadeo de ojos del retrato.)

Ambos workflows hacen **push resiliente** (`pull --rebase` + reintentos, `fetch-depth: 0`) tras una
carrera de push que crasheó el snake. Crons separados (3D 18:00 UTC, snake 06:00 UTC).

## Pendientes / follow-ups

- **WakaTime (acción de Kevin):** en wakatime.com/settings activar *"Display languages, editors,
  operating systems publicly"* + perfil público; si no, la card muestra "User doesn't publicly
  share detailed code statistics". (La card en sí ya está cableada y correcta.)
- **Role del banner:** sigue como `FullStack Dev · Implementation Lead` (era el rol en Clonai). Si
  Kevin define nuevo rol/empresa, editar `rows` en `scripts/banner/generate_banner.py` y regenerar.
- **Regenerar el banner** tras cualquier cambio de datos/retrato: ver `scripts/banner/README.md`.
- **Permisos de Actions:** el repo necesita *Settings → Actions → General → Workflow permissions →
  Read and write* (ya configurado; recordarlo si se clona/forkea).
- Roadmap mayor del portfolio (no de este perfil): ver memoria `project_roadmap_status` — siguiente
  spec sería **Features OGG** (bilingüe ES/EN ya está hecho, plan `2026-05-27-bilingual-es-en.md`).
