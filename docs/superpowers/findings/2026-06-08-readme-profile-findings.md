# Findings — README de perfil "no genérico" (2026-06-08)

Aprendizajes y gotchas del trabajo del README/banner de perfil. Léelos antes de tocar
`scripts/banner/`, los workflows de `.github/workflows/`, o los SVG dinámicos del README — costaron
muchas iteraciones.

## Repo dual-propósito
`KevinJGV/KevinJGV` es **a la vez** el README de perfil de GitHub **y** el portfolio Astro desplegado
en Vercel (vindevsito.dev). Por eso los SVG dinámicos (now-playing) se sirven como **rutas API Astro**
(`src/pages/api/*.svg.ts`, `export const prerender = false`) y el README los embebe por URL absoluta
`https://www.vindevsito.dev/api/...`. El README de perfil se renderiza desde la **rama por defecto
(main)**; nada se ve en el perfil hasta mergear a main.

## ASCII de line-art: usar COBERTURA DE TINTA, no luminancia
- Mapear luminancia + `-level` capta regiones (pelo) pero **borra las líneas negras finas** (boca,
  nariz, ojos, dedos): al reducir, una línea de 1px se promedia con el fondo claro y se pierde.
- Lo que funciona (`scripts/banner/img2ascii.py`): `-threshold` (detecta tinta) → `-negate` →
  `-filter Box -resize` (cada celda = fracción de tinta) → mapear `cobertura^gamma` (gamma<1 realza
  líneas finas) a la rampa `" .:-=+*#%@"`. Params buenos: `cols=84 thresh=50% gamma=0.6`.

## Alineación del ASCII en SVG (¡crítico!)
- Un `<text>` por fila con una sola `x` se **cizalla** (las columnas se desalinean según la fuente
  del visor). Tampoco confiar en `xml:space` para los espacios de la izquierda: algunos visores los
  colapsan y la fila "se escurre" al margen.
- Solución robusta (`generate_banner.py`): emitir **solo glifos visibles**, cada uno con su **x
  absoluta** de rejilla (`x="x0 x1 x2 …"`), sin espacios. Independiente de la fuente. Descartar `' '`
  (y `'.'` solo si el fondo no es ya espacio puro).

## Typewriter + cursor en SVG/CSS puro (sin JS)
- **Typewriter:** por línea, `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)` animado con
  `steps(N)` (N = nº de caracteres) y delays acumulados. Monospace → cada step ≈ 1 carácter.
- **Cursor que sigue la escritura:** UNA animación `transform: translate` (`@keyframes curmove`) con
  keyframes en % del tiempo total: por línea, en `delay_i%` → `translate(0, y_i)` y en
  `(delay_i+dur_i)%` → `translate(width_i, y_i)`. Salta de línea solo en los gaps. Blink aparte.
- Estos efectos **corren en navegador/GitHub** (CSS animations en SVG-as-image), igual que opacity.

## Renderizar/verificar SVG (gotchas que costaron tiempo)
- **rsvg-convert IGNORA `clip-path: inset()`** → muestra todo revelado. Para verificar clip-path/
  typewriter hay que usar **chromium headless** (sí lo respeta).
- **chromium `--virtual-time-budget` NO avanza animaciones CSS** en la captura → todos los frames
  salen iguales. No se puede capturar la animación headless. Para un GIF de preview: generar cada
  frame como SVG **estático** calculando el estado por tiempo (clip-path inset y/o transform del
  cursor) y renderizar con chromium; luego `magick` para ensamblar.
- Reproducir el **pipeline real**: el README carga el SVG vía `<img>`. Render de prueba = un HTML con
  `<img src="file://…banner.svg" width="1000">` en chromium (no el SVG suelto), para igualar el visor.
- **Caché del preview de VS Code**: cachea el SVG por ruta; al regenerar el mismo archivo sigue
  mostrando el viejo → recargar el preview / hard-reload. (Síntoma: "no cambió nada" tras un fix real.)
- **GitHub camo**: cachea imágenes del README un rato; refrescar con Ctrl+Shift+R. Las refs externas
  dentro de un SVG (`<image href="http…">`) NO cargan en modo imagen → embeber la carátula como
  **data URI base64** (ver `now-playing.svg.ts`).

## GitHub Actions de perfil
- **Carrera de push:** dos workflows que pushean a main (3D + snake) colisionan → `! [rejected]
  (fetch first)`. Fix: en el paso de commit, `git pull --rebase --autostash origin main` + reintentos
  antes de `git push`, y `actions/checkout` con `fetch-depth: 0` (el rebase no funciona en shallow).
  Además crons separados (3D 18:00, snake 06:00 UTC).
- **`Platane/snk@v3`** usa inputs `outputs:` (multilínea) + `github_token` — **NO** `svg_out_path`
  (eso es de otra versión; daba warning "Unexpected input"). Verificar la API contra el **tag exacto**,
  no contra el README/action.yml de master.
- Requiere *Settings → Actions → General → Workflow permissions → Read and write* (el push lo necesita).
- Imágenes de ruta relativa (`./profile-3d-contrib/...svg`, `assets/snake-contributions.svg`) solo se
  ven una vez que el workflow las commitea en main (antes: enlace roto).

## WakaTime
- La card de github-readme-stats (`/api/wakatime?username=…`) requiere que el perfil de WakaTime
  comparta **estadísticas detalladas públicamente** (Settings → "Display languages, editors,
  operating systems publicly"); si no: "User doesn't publicly share detailed code statistics".
