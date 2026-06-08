# Banner ASCII (estilo fastfetch)

Genera `assets/banner.svg` — retrato en ASCII (izquierda) + panel de info estilo
neofetch/fastfetch (derecha), con animación de reveal.

## Regenerar

```bash
# 1. retrato → ASCII (ajustar columnas si hace falta; 56 da buen balance)
python3 scripts/banner/img2ascii.py scripts/banner/portrait.png 56 > /tmp/ascii.txt

# 2. ASCII → SVG final
python3 scripts/banner/generate_banner.py /tmp/ascii.txt assets/banner.svg
```

Requiere **ImageMagick** (`magick`) para el downscale/luminancia. Sin dependencias
de Node ni del proyecto Astro: es un asset estático del README de perfil.

- `portrait.png` — retrato fuente (versión simplificada, mejor lectura en ASCII).
- El texto del panel (Name/Role/Traits/…) se edita en `generate_banner.py` (`rows`).
- Previsualizar con animación corrida: abrir el SVG en un navegador (rsvg-convert
  renderiza el frame inicial con opacity 0, así que no sirve para preview estático).
