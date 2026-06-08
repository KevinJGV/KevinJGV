#!/usr/bin/env python3
"""Imagen (line-art) → ASCII por COBERTURA DE TINTA.

El problema de mapear luminancia: al reducir, las líneas negras finas (boca, nariz,
ojos, dedos) se promedian con el fondo claro y desaparecen. Solución: detectar la
tinta con un umbral y medir cuánta cae en cada celda (cobertura), realzando las
coberturas bajas para que las líneas finas también se dibujen.

Pipeline ImageMagick: -threshold (tinta=oscuro) -> -negate (tinta=blanco) ->
-filter Box -resize (cada celda = fracción de tinta) -> mapear cobertura^gamma a la
rampa (espacio..denso).
"""
import subprocess, re, sys

# Rampa espacio -> denso, indexada por "fuerza de tinta".
RAMP = " .:-=+*#%@"

def to_ascii(path, cols=84, thresh="50%", gamma=0.55, char_aspect=0.5):
    wh = subprocess.check_output(["magick", "identify", "-format", "%w %h", path]).decode().split()
    w, h = int(wh[0]), int(wh[1])
    rows = max(1, round(cols * (h / w) * char_aspect))
    cmd = ["magick", path, "-colorspace", "Gray", "-threshold", thresh, "-negate",
           "-filter", "Box", "-resize", f"{cols}x{rows}!", "-depth", "8", "txt:-"]
    out = subprocess.check_output(cmd).decode()
    grid = [[" "] * cols for _ in range(rows)]
    for line in out.splitlines():
        m = re.match(r"(\d+),(\d+):\s*\(([\d.]+)", line)
        if not m:
            continue
        x, y, val = int(m.group(1)), int(m.group(2)), float(m.group(3))
        if val > 255:
            val = val / 257.0
        cov = val / 255.0
        idx = round((cov ** gamma) * (len(RAMP) - 1))  # gamma<1 realza líneas finas
        if 0 <= y < rows and 0 <= x < cols:
            grid[y][x] = RAMP[idx]
    return "\n".join("".join(r).rstrip() for r in grid)

if __name__ == "__main__":
    path = sys.argv[1]
    cols = int(sys.argv[2]) if len(sys.argv) > 2 else 84
    thresh = sys.argv[3] if len(sys.argv) > 3 else "50%"
    gamma = float(sys.argv[4]) if len(sys.argv) > 4 else 0.55
    print(to_ascii(path, cols, thresh, gamma))
