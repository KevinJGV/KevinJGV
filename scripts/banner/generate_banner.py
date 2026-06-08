#!/usr/bin/env python3
"""Genera el banner SVG estilo fastfetch: ASCII portrait (izq) + info panel (der)."""
import sys

def esc(s):
    return (s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
             .replace('"', "&quot;"))

def build(ascii_path, out_path):
    with open(ascii_path) as f:
        ascii_lines = [l.rstrip("\n") for l in f.read().split("\n")]
    ascii_lines = [l for l in ascii_lines if l.strip() != ""] or ascii_lines

    # --- layout ---
    FS = 6.4            # ascii font-size (chico: más detalle sin agrandar el banner)
    LH = 6.4            # ascii line-height
    CW = FS * 0.6       # monospace char width approx
    ax, ay = 26, 46     # ascii origin
    cols = max((len(l) for l in ascii_lines), default=40)
    ascii_w = cols * CW
    panel_x = ax + ascii_w + 46
    panel_w = 440
    width = round(panel_x + panel_w + 8)
    ascii_h = ay + len(ascii_lines) * LH + 10

    # --- info panel content ---
    accent = "#1ed760"   # spotify/terminal green
    keycol = "#1ed760"
    valcol = "#e6edf3"
    dim = "#7d8590"
    host_user, host_name = "omarchy", "vindev"
    rows = [
        ("Name", "Kevin J. González Velandia"),
        ("Role", "FullStack Dev · Implementation Lead"),
        ("Learning", "Agentic patterns · Advanced TS"),
        ("Traits", "Multifaceted · Motivated · Engaged · Focused"),
        ("Stack", "Astro · TypeScript · Java · React · Node"),
        ("Editor", "VS Code"),
        ("Uptime", "online & shipping"),
    ]
    # compute dots row position to size the canvas so nothing clips
    _ry = 86 + 36
    _dy = _ry + len(rows) * 24 + 8
    height = round(max(ascii_h, _dy + 16 + 18))

    parts = []
    parts.append(f'<?xml version="1.0" encoding="UTF-8"?>')
    parts.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" font-family="ui-monospace, \'Cascadia Code\', \'JetBrains Mono\', Menlo, Consolas, monospace">')

    # styles + animations
    parts.append('''  <defs>
    <style>
      text { dominant-baseline: text-before-edge; }
      .ascii { opacity: 0; animation: fade 0.7s ease 0.1s forwards; }
      .ln { opacity: 0; animation: reveal 0.45s cubic-bezier(.2,.8,.2,1) forwards; }
      .cur { animation: blink 1s steps(1) infinite; }
      @keyframes fade { to { opacity: 1; } }
      @keyframes reveal { from { opacity: 0; } to { opacity: 1; } }
      @keyframes blink { 50% { opacity: 0; } }
      @keyframes typeon { to { clip-path: inset(0 0 0 0); } }
    </style>
  </defs>''')

    # background
    parts.append(f'  <rect width="{width}" height="{height}" rx="14" fill="#0d1117"/>')
    parts.append(f'  <rect x="0.5" y="0.5" width="{width-1}" height="{height-1}" rx="14" fill="none" stroke="#1f2630" stroke-width="1"/>')

    # ascii portrait (single fade-in group, near-white)
    parts.append('  <g class="ascii" fill="#cdd9e5" font-size="%.1f" xml:space="preserve">' % FS)
    # Emitir SOLO glifos visibles, cada uno con su x absoluta de rejilla. No se
    # emiten espacios: así ningún visor puede colapsar el espaciado de la izquierda
    # (que desfasaría la fila y "escurriría" el rostro). Se descartan también ' ' y
    # para que el lado vacío quede realmente en blanco. Con el método de cobertura el
    # fondo ya es espacio puro (umbral), así que solo se descarta ' ' (se conservan las
    # líneas finas, incluido el '.' de cobertura baja).
    EMPTY = {" "}
    for i, line in enumerate(ascii_lines):
        y = ay + i * LH
        glyphs = [(ax + c * CW, ch) for c, ch in enumerate(line) if ch not in EMPTY]
        if not glyphs:
            continue
        xs = " ".join(f"{x:.2f}" for x, _ in glyphs)
        text = esc("".join(ch for _, ch in glyphs))
        parts.append(f'    <text x="{xs}" y="{y:.1f}">{text}</text>')
    parts.append('  </g>')

    # info panel — efecto typewriter (clip-path inset + steps por línea)
    px = panel_x
    CHARW = 12 * 0.6      # ancho de carácter del panel (font-size 12 monospace)
    CHAR = 0.014          # s por carácter (velocidad de tipeo)
    GAP = 0.06            # s entre líneas
    t = [0.45]            # delay acumulado (lista para mutar desde el helper)
    cursor_steps = []     # (delay, dur, ncols, y) por línea, para el cursor móvil

    def typed(y, inner, ncols, fs=12):
        dur = max(0.18, ncols * CHAR)
        d = t[0]
        ln = (f'  <text x="{px}" y="{y}" font-size="{fs}" '
              f'style="clip-path: inset(0 100% 0 0); animation: typeon {dur:.2f}s steps({ncols}) {d:.2f}s forwards;">'
              f'{inner}</text>')
        cursor_steps.append((d, dur, ncols, y))
        t[0] = d + dur + GAP
        return ln

    # título ": VIN" (logo, fade)
    parts.append(f'  <g class="ln" style="animation-delay:0.25s">')
    parts.append(f'    <circle cx="{px+4}" cy="36" r="3.2" fill="{accent}"/>')
    parts.append(f'    <circle cx="{px+4}" cy="46" r="3.2" fill="{accent}"/>')
    parts.append(f'    <circle cx="{px+13}" cy="41" r="3.2" fill="{accent}"/>')
    parts.append(f'    <text x="{px+26}" y="22" font-size="30" font-weight="bold" fill="#ffffff">VIN</text>')
    parts.append(f'  </g>')

    # líneas que se "escriben"
    parts.append(typed(58, f'<tspan fill="{accent}">Software Developer</tspan>', len("Software Developer")))
    yh = 86
    host_inner = (f'<tspan fill="{accent}" font-weight="bold">{host_user}</tspan>'
                  f'<tspan fill="{dim}">@</tspan>'
                  f'<tspan fill="{accent}" font-weight="bold">{host_name}</tspan>')
    parts.append(typed(yh, host_inner, len(host_user) + 1 + len(host_name)))
    parts.append(typed(yh + 15, f'<tspan fill="{dim}">{"─"*30}</tspan>', 30))

    ry = yh + 36
    keyw = 78
    keycols = round(keyw / CHARW)
    for i, (k, v) in enumerate(rows):
        inner = (f'<tspan fill="{keycol}" font-weight="bold">{k}</tspan>'
                 f'<tspan x="{px+keyw}" fill="{valcol}">{esc(v)}</tspan>')
        parts.append(typed(ry + i * 24, inner, keycols + len(v)))

    # cursor que sigue el tipeo: una sola animación translate que recorre cada
    # línea (x crece con el revelado) y salta a la siguiente; parpadea siempre.
    T = max(d + du for d, du, _, _ in cursor_steps)
    CURW = CHARW * 0.9
    kf = [f'0% {{ transform: translate(0px,{cursor_steps[0][3]:.1f}px); }}']
    for d, du, nc, y in cursor_steps:
        kf.append(f'{d / T * 100:.2f}% {{ transform: translate(0px,{y:.1f}px); }}')
        kf.append(f'{(d + du) / T * 100:.2f}% {{ transform: translate({nc * CHARW:.1f}px,{y:.1f}px); }}')
    parts.append('  <style>@keyframes curmove { ' + ' '.join(kf) + ' }</style>')
    parts.append(f'  <rect x="{px}" y="0" width="{CURW:.1f}" height="13" rx="1" fill="{accent}" '
                 f'style="transform: translate(0px,{cursor_steps[0][3]:.1f}px); '
                 f'animation: curmove {T:.2f}s linear forwards, blink 0.9s steps(1) infinite;"/>')

    # terminal color dots (fade al terminar el tipeo)
    dy = ry + len(rows) * 24 + 8
    palette = ["#0d1117", "#ff6b6b", "#1ed760", "#ffd866", "#6cb6ff", "#d2a8ff", "#56d4dd", "#e6edf3"]
    parts.append(f'  <g class="ln" style="animation-delay:{t[0]:.2f}s">')
    for i, c in enumerate(palette):
        stroke = ' stroke="#30363d" stroke-width="1"' if c == "#0d1117" else ''
        parts.append(f'    <rect x="{px + i*22}" y="{dy}" width="16" height="16" rx="3" fill="{c}"{stroke}/>')
    parts.append(f'  </g>')

    parts.append('</svg>')
    with open(out_path, "w") as f:
        f.write("\n".join(parts))
    print(f"wrote {out_path}  ({width}x{height})")

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
