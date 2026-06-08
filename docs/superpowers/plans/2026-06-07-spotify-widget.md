# Music Widget (Last.fm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reemplazar el widget falso de música por uno real: "escuchando ahora" (o último reproducido) leído de **Last.fm**, con carátula/título/artista, y un preview de 30s que se auto-reproduce al hover (PC) / tap (móvil) haciendo crossfade con la música en bucle de la página.

**Architecture:** Endpoint serverless (`/api/nowplaying`, `prerender=false`) que lee `user.getRecentTracks` de **Last.fm** (gratis, solo API key + usuario; el track actual viene con `nowplaying="true"`, si no, el último reproducido) y resuelve un preview de 30s + carátula vía **iTunes** (fallback Deezer para el preview). El componente `SpotifyPlayer.astro` consume ese JSON y maneja el crossfade en cliente contra `#audio-player` (loop global del Layout).

**Tech Stack:** Astro 6 (endpoint API + componente), **Last.fm API** (datos), iTunes Search API / Deezer API (preview+carátula), `<audio>` + rampas de volumen por rAF. Sin nuevas deps npm.

**Por qué Last.fm y no Spotify:** desde feb-2026 la Spotify Web API exige cuenta **Premium** (Development Mode). Last.fm es gratis (API key + username, sin OAuth) y expone tu listening scrobbleado desde Spotify.

**Nota de verificación:** el proyecto NO tiene test runner; la verificación canónica es `npm run build` (corre `astro check`) + chequeo en `npm run dev`/`preview`.

**Prerequisito (Tarea 2, acción de Kevin):** cuenta Last.fm gratis + conectar scrobbling de Spotify + API key gratis. Tareas 4-5 (audio) se verifican end-to-end tras eso; el build no lo requiere.

---

### Task 1: CSP — permitir audio cross-origin (`media-src`)

**Files:**
- Modify: `astro.config.mjs` (bloque `security.csp.directives`)

- [ ] **Step 1: Agregar la directiva `media-src`**

En `astro.config.mjs`, dentro de `security.csp.directives`, dejar el array así (agrega `media-src`):

```js
      directives: [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "media-src 'self' https:",
        "font-src 'self' data:",
        "connect-src 'self' https://vitals.vercel-insights.com",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: "Complete!" sin errores.

- [ ] **Step 3: Verificar la CSP del build**

Run: `node -e "const c=require('./.vercel/output/config.json');const r=(c.routes||[]).find(r=>r.headers&&r.headers['content-security-policy']);console.log(r.headers['content-security-policy'].split(';').find(d=>d.trim().startsWith('media-src')))"`
Expected: imprime `media-src 'self' https:`.

- [ ] **Step 4: Commit**

```bash
git add astro.config.mjs
git commit -m "feat(csp): allow cross-origin audio (media-src) for track previews"
```

---

### Task 2: Last.fm — cuenta, scrobbling y API key (acción de Kevin) + env

**Files:**
- Modify: `.env.example`
- Modify (local, NO commitear): `.env`

- [ ] **Step 1: (Kevin) preparar Last.fm**

1. Crear cuenta gratis en last.fm (si no tenés).
2. Conectar **scrobbling de Spotify** → Last.fm (last.fm → Settings → Applications → Spotify "Connect"). Así Last.fm registra lo que reproducís en Spotify (sirve con Spotify free).
3. Crear una **API key** gratis en https://www.last.fm/api/account/create (no requiere callback ni OAuth).

- [ ] **Step 2: Documentar en `.env.example`**

Agregar al final de `.env.example`:

```
# Last.fm (widget de música). API key gratis: https://www.last.fm/api/account/create
# LASTFM_USER = tu nombre de usuario de Last.fm. Necesita scrobbling de Spotify activo.
LASTFM_API_KEY=
LASTFM_USER=
```

- [ ] **Step 3: (Kevin) cargar `.env` y Vercel**

En `.env` local y en Vercel (Project → Settings → Environment Variables): `LASTFM_API_KEY` y `LASTFM_USER`.

- [ ] **Step 4: Commit** (sin `.env`)

```bash
git add .env.example
git commit -m "chore(music): document Last.fm env vars"
```

---

### Task 3: Endpoint `/api/nowplaying`

**Files:**
- Create: `src/pages/api/nowplaying.ts`

- [ ] **Step 1: Implementar el endpoint**

`src/pages/api/nowplaying.ts`:

```ts
import type { APIRoute } from "astro";

export const prerender = false;

interface TrackInfo {
  title: string;
  artist: string;
  albumArt: string | null;
  spotifyUrl: string | null;
  previewUrl: string | null;
  isPlaying: boolean;
}

const EMPTY: TrackInfo = { title: "", artist: "", albumArt: null, spotifyUrl: null, previewUrl: null, isPlaying: false };

interface LfmImage { "#text": string; size: string }
interface LfmTrack {
  name?: string;
  artist?: { "#text"?: string; name?: string };
  image?: LfmImage[];
  "@attr"?: { nowplaying?: string };
}

async function lastfmTrack(): Promise<{ title: string; artist: string; art: string | null; isPlaying: boolean } | null> {
  const key = import.meta.env.LASTFM_API_KEY;
  const user = import.meta.env.LASTFM_USER;
  if (!key || !user) return null;
  const url =
    `https://ws.audioscrobbler.com/2.0/?method=user.getrecenttracks` +
    `&user=${encodeURIComponent(user)}&api_key=${key}&format=json&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const j = await res.json();
  const t: LfmTrack | undefined = j?.recenttracks?.track?.[0];
  if (!t?.name) return null;
  const title = t.name;
  const artist = t.artist?.["#text"] ?? t.artist?.name ?? "";
  const art = t.image?.length ? (t.image[t.image.length - 1]["#text"] || null) : null;
  const isPlaying = t["@attr"]?.nowplaying === "true";
  return { title, artist, art, isPlaying };
}

// iTunes: preview de 30s + carátula (mejor calidad que la de Last.fm).
async function itunes(title: string, artist: string): Promise<{ preview: string | null; art: string | null }> {
  const term = encodeURIComponent(`${title} ${artist}`);
  try {
    const r = await fetch(`https://itunes.apple.com/search?term=${term}&entity=song&limit=1`);
    if (r.ok) {
      const j = await r.json();
      const it = j?.results?.[0];
      if (it) {
        const art = (it.artworkUrl100 as string | undefined)?.replace("100x100", "300x300") ?? null;
        return { preview: it.previewUrl ?? null, art };
      }
    }
  } catch { /* ignore */ }
  return { preview: null, art: null };
}

async function deezerPreview(title: string, artist: string): Promise<string | null> {
  const term = encodeURIComponent(`${title} ${artist}`);
  try {
    const r = await fetch(`https://api.deezer.com/search?q=${term}&limit=1`);
    if (r.ok) { const j = await r.json(); return j?.data?.[0]?.preview ?? null; }
  } catch { /* ignore */ }
  return null;
}

function json(data: TrackInfo): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=30" },
  });
}

export const GET: APIRoute = async () => {
  const t = await lastfmTrack();
  if (!t) return json(EMPTY);
  const fromItunes = await itunes(t.title, t.artist);
  const previewUrl = fromItunes.preview ?? (await deezerPreview(t.title, t.artist));
  const albumArt = fromItunes.art ?? t.art;
  const spotifyUrl = `https://open.spotify.com/search/${encodeURIComponent(`${t.title} ${t.artist}`)}`;
  return json({ title: t.title, artist: t.artist, albumArt, spotifyUrl, previewUrl, isPlaying: t.isPlaying });
};
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: "Complete!" (0 errores; `astro check` valida tipos).

- [ ] **Step 3: Verificación runtime (requiere `.env` de la Tarea 2)**

Run: `npm run dev` y en otra terminal `curl -s localhost:4321/api/nowplaying | head -c 400`
Expected: JSON con `title/artist/albumArt/spotifyUrl/previewUrl/isPlaying`. Sin env → `EMPTY` (degrada, no rompe).

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/nowplaying.ts
git commit -m "feat(music): /api/nowplaying endpoint (Last.fm + 30s preview via iTunes/Deezer)"
```

---

### Task 4: `SpotifyPlayer.astro` — datos reales (sin audio todavía)

**Files:**
- Modify: `src/components/me/SpotifyPlayer.astro`

- [ ] **Step 1: Markup**

Dentro de `.player`, mantener el SVG ecualizador y el `<p>{t('spotify.listeningNow')}</p>`, y cambiar el carrusel falso por:

```astro
    <div class="carrousel">
      <p class="textoscroll" id="sp-track">{t('spotify.listeningNow')}</p>
    </div>
    <img id="sp-art" class="sp-art" alt="" hidden />
    <audio id="sp-preview" preload="none"></audio>
```

- [ ] **Step 2: Estilo de la carátula**

Agregar al `<style>`:

```css
  .sp-art {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    object-fit: cover;
    margin-left: 6px;
  }
```

- [ ] **Step 3: Script — fetch y render**

Agregar al final del componente:

```astro
<script>
  async function loadNowPlaying() {
    const trackEl = document.getElementById("sp-track");
    const artEl = document.getElementById("sp-art") as HTMLImageElement | null;
    if (!trackEl) return;
    try {
      const res = await fetch("/api/nowplaying");
      const d = await res.json();
      if (!d || !d.title) return; // sin datos → queda el texto por defecto
      trackEl.textContent = `${d.artist} — ${d.title}`;
      if (artEl && d.albumArt) { artEl.src = d.albumArt; artEl.hidden = false; }
    } catch { /* degrada al texto por defecto */ }
  }
  document.addEventListener("astro:page-load", loadNowPlaying);
</script>
```

- [ ] **Step 4: Build + dev**

Run: `npm run build` → "Complete!".
Run: `npm run dev`, ir a `/me`: el widget muestra `artista — título` real + carátula (con `.env`). Sin env → texto por defecto.

- [ ] **Step 5: Commit**

```bash
git add src/components/me/SpotifyPlayer.astro
git commit -m "feat(music): render real now-playing track + album art in widget"
```

---

### Task 5: Auto-reproducción por hover/tap + crossfade con el loop

**Files:**
- Modify: `src/components/me/SpotifyPlayer.astro`

- [ ] **Step 1: Reemplazar el `<script>` por la versión con crossfade**

```astro
<script>
  const FADE_MS = 800;    // duración de cada fade
  const OFFSET_MS = 1000; // desfase entre apagar uno y encender el otro

  let hasPreview = false;
  let playing = false;
  const timers: number[] = [];
  const clearTimers = () => { timers.forEach(clearTimeout); timers.length = 0; };

  function fade(audio: HTMLAudioElement, to: number, ms: number, onDone?: () => void) {
    const from = audio.volume;
    const start = performance.now();
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / ms);
      audio.volume = Math.max(0, Math.min(1, from + (to - from) * k));
      if (k < 1) requestAnimationFrame(tick); else onDone?.();
    };
    requestAnimationFrame(tick);
  }

  const loopAudio = () => document.getElementById("audio-player") as HTMLAudioElement | null;
  function muted(): boolean {
    const w = window as unknown as { audioController?: { isMuted: () => boolean } };
    return w.audioController?.isMuted?.() ?? false;
  }

  function startPreview() {
    const preview = document.getElementById("sp-preview") as HTMLAudioElement | null;
    const loop = loopAudio();
    if (!preview || !hasPreview || playing || muted()) return;
    playing = true;
    clearTimers();
    if (loop) fade(loop, 0, FADE_MS);                       // 1) baja el loop
    timers.push(window.setTimeout(() => {                    // 2) ~1s → entra el preview
      preview.currentTime = 0; preview.volume = 0;
      preview.play().catch(() => {});
      fade(preview, 1, FADE_MS);
    }, OFFSET_MS));
  }

  function stopPreview() {
    const preview = document.getElementById("sp-preview") as HTMLAudioElement | null;
    const loop = loopAudio();
    if (!preview || !playing) return;
    playing = false;
    clearTimers();
    fade(preview, 0, FADE_MS, () => preview.pause());        // 1) baja el preview
    timers.push(window.setTimeout(() => {                    // 2) ~1s → vuelve el loop
      if (loop && !muted()) { if (loop.paused) loop.play().catch(() => {}); fade(loop, 1, FADE_MS); }
    }, OFFSET_MS));
  }

  async function loadNowPlaying() {
    const trackEl = document.getElementById("sp-track");
    const artEl = document.getElementById("sp-art") as HTMLImageElement | null;
    const preview = document.getElementById("sp-preview") as HTMLAudioElement | null;
    const widget = document.querySelector(".bottom-section") as HTMLElement | null;
    if (!trackEl || !widget) return;
    try {
      const res = await fetch("/api/nowplaying");
      const d = await res.json();
      if (d && d.title) {
        trackEl.textContent = `${d.artist} — ${d.title}`;
        if (artEl && d.albumArt) { artEl.src = d.albumArt; artEl.hidden = false; }
        if (preview && d.previewUrl) { preview.src = d.previewUrl; hasPreview = true; }
      }
    } catch { /* degrada */ }

    if (widget.dataset.bound === "1") return;
    widget.dataset.bound = "1";
    if (window.matchMedia("(pointer: fine)").matches) {
      widget.addEventListener("mouseenter", startPreview);
      widget.addEventListener("mouseleave", stopPreview);
    } else {
      widget.addEventListener("click", () => (playing ? stopPreview() : startPreview()));
    }
    preview?.addEventListener("ended", stopPreview);
  }

  document.addEventListener("astro:page-load", loadNowPlaying);
  document.addEventListener("astro:before-swap", clearTimers);
</script>
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: "Complete!" (0 errores).

- [ ] **Step 3: Verificación en dev (con `.env`)**

Run: `npm run dev`, en `/me`:
- PC: hover → el loop baja con fade, ~1s después entra el preview de 30s; al salir, baja el preview y ~1s después vuelve el loop.
- Móvil (DevTools touch): tap togglea con el mismo crossfade.
- Sitio muteado → no suena nada al hover (respeta el mute).
- Sin `previewUrl` → muestra el track sin audio. Consola sin violaciones de CSP (`media-src`).

- [ ] **Step 4: Commit**

```bash
git add src/components/me/SpotifyPlayer.astro
git commit -m "feat(music): hover/tap autoplay of 30s preview with crossfade vs loop"
```

---

### Task 6: Verificación integral

- [ ] **Step 1: Build limpio** — Run: `npm run build` → "Complete!" 0 errores.
- [ ] **Step 2: Preview de prod** — Run: `npm run preview`; probar `/me` y `/en/me`: datos reales, crossfade, fallback sin `.env`, CSP ok en consola.
- [ ] **Step 3: Fallback total** — sin las env de Last.fm → endpoint responde `EMPTY`, widget con texto por defecto, sin errores.
