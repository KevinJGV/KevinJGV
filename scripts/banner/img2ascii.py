#!/usr/bin/env python3
"""Imagen → ASCII para el banner.

Para ilustraciones de líneas (contornos negros + relleno gris plano) el relleno se
convierte en un bloque uniforme de caracteres que tapa los rasgos. Truco: reducir
PRIMERO y luego subir el medio hacia blanco con -level, de modo que el relleno de la
cara quede vacío y solo queden el pelo, las gafas y los contornos.
"""
import subprocess, re, sys

# Rampa: índice 0 = píxel más oscuro -> glifo más denso; último = más claro -> espacio.
RAMP = "@%#*+=-:. "

def to_ascii(path, cols=68, level="32%,66%", char_aspect=0.5):
    wh = subprocess.check_output(["magick", "identify", "-format", "%w %h", path]).decode().split()
    w, h = int(wh[0]), int(wh[1])
    rows = max(1, round(cols * (h / w) * char_aspect))
    # reducir PRIMERO, luego -level sobre los grises ya promediados (aísla rasgos)
    cmd = ["magick", path, "-colorspace", "Gray", "-resize", f"{cols}x{rows}!"]
    if level:
        cmd += ["-level", level]
    cmd += ["-depth", "8", "txt:-"]
    out = subprocess.check_output(cmd).decode()
    grid = [[" "] * cols for _ in range(rows)]
    for line in out.splitlines():
        m = re.match(r"(\d+),(\d+):\s*\(([\d.]+)", line)
        if not m:
            continue
        x, y, val = int(m.group(1)), int(m.group(2)), float(m.group(3))
        if val > 255:  # algunos builds emiten 0-65535
            val = val / 257.0
        idx = round(val / 255 * (len(RAMP) - 1))
        if 0 <= y < rows and 0 <= x < cols:
            grid[y][x] = RAMP[idx]
    return "\n".join("".join(r).rstrip() for r in grid)

if __name__ == "__main__":
    path = sys.argv[1]
    cols = int(sys.argv[2]) if len(sys.argv) > 2 else 68
    level = sys.argv[3] if len(sys.argv) > 3 else "32%,66%"
    print(to_ascii(path, cols, level))
