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
    FS = 9.0            # ascii font-size
    LH = 9.2            # ascii line-height
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
    host_user, host_name = "kevin", "vindev"
    rows = [
        ("Name", "Kevin J. González Velandia"),
        ("Role", "FullStack Dev · Implementation Lead"),
        ("Company", "Clonai"),
        ("Learning", "Agentic patterns · Advanced TS"),
        ("Traits", "Multifaceted · Motivated · Engaged · Focused"),
        ("Stack", "Astro · TypeScript · Java · React · Node"),
        ("Editor", "nvim (btw)"),
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
    </style>
  </defs>''')

    # background
    parts.append(f'  <rect width="{width}" height="{height}" rx="14" fill="#0d1117"/>')
    parts.append(f'  <rect x="0.5" y="0.5" width="{width-1}" height="{height-1}" rx="14" fill="none" stroke="#1f2630" stroke-width="1"/>')

    # ascii portrait (single fade-in group, near-white)
    parts.append('  <g class="ascii" fill="#cdd9e5" font-size="%.1f" xml:space="preserve">' % FS)
    for i, line in enumerate(ascii_lines):
        y = ay + i * LH
        parts.append(f'    <text x="{ax}" y="{y:.1f}">{esc(line)}</text>')
    parts.append('  </g>')

    # info panel
    px = panel_x
    delay0 = 0.5
    step = 0.12
    # title ".: VIN"
    parts.append(f'  <g class="ln" style="animation-delay:{delay0:.2f}s">')
    parts.append(f'    <circle cx="{px+4}" cy="36" r="3.2" fill="{accent}"/>')
    parts.append(f'    <circle cx="{px+4}" cy="46" r="3.2" fill="{accent}"/>')
    parts.append(f'    <circle cx="{px+13}" cy="41" r="3.2" fill="{accent}"/>')
    parts.append(f'    <text x="{px+26}" y="22" font-size="30" font-weight="bold" fill="#ffffff">VIN</text>')
    parts.append(f'  </g>')
    parts.append(f'  <text class="ln" style="animation-delay:{delay0+step:.2f}s" x="{px}" y="58" font-size="12" fill="{accent}">Software Developer</text>')

    # host line + separator
    yh = 86
    parts.append(f'  <text class="ln" style="animation-delay:{delay0+2*step:.2f}s" x="{px}" y="{yh}" font-size="12">'
                 f'<tspan fill="{accent}" font-weight="bold">{host_user}</tspan>'
                 f'<tspan fill="{dim}">@</tspan>'
                 f'<tspan fill="{accent}" font-weight="bold">{host_name}</tspan></text>')
    parts.append(f'  <text class="ln" style="animation-delay:{delay0+3*step:.2f}s" x="{px}" y="{yh+15}" font-size="12" fill="{dim}">{"─"*30}</text>')

    # key/value rows
    ry = yh + 36
    keyw = 78
    for i, (k, v) in enumerate(rows):
        d = delay0 + (4 + i) * step
        parts.append(f'  <text class="ln" style="animation-delay:{d:.2f}s" x="{px}" y="{ry + i*24}" font-size="12">'
                     f'<tspan fill="{keycol}" font-weight="bold">{k}</tspan>'
                     f'<tspan x="{px+keyw}" fill="{valcol}">{esc(v)}</tspan></text>')

    # terminal color dots
    dy = ry + len(rows) * 24 + 8
    palette = ["#0d1117", "#ff6b6b", "#1ed760", "#ffd866", "#6cb6ff", "#d2a8ff", "#56d4dd", "#e6edf3"]
    dlast = delay0 + (4 + len(rows)) * step
    parts.append(f'  <g class="ln" style="animation-delay:{dlast:.2f}s">')
    for i, c in enumerate(palette):
        stroke = ' stroke="#30363d" stroke-width="1"' if c == "#0d1117" else ''
        parts.append(f'    <rect x="{px + i*22}" y="{dy}" width="16" height="16" rx="3" fill="{c}"{stroke}/>')
    # blinking cursor
    parts.append(f'    <rect class="cur" x="{px + len(palette)*22 + 6}" y="{dy}" width="8" height="16" fill="{accent}"/>')
    parts.append(f'  </g>')

    parts.append('</svg>')
    with open(out_path, "w") as f:
        f.write("\n".join(parts))
    print(f"wrote {out_path}  ({width}x{height})")

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2])
