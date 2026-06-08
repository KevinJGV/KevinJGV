#!/usr/bin/env python3
import subprocess, re, sys

# Ramp: index 0 = darkest pixel -> densest glyph; last = lightest -> space.
RAMP = "@%#*+=-:. "

def to_ascii(path, cols=60, char_aspect=0.46):
    # Get original size
    wh = subprocess.check_output(["magick", "identify", "-format", "%w %h", path]).decode().split()
    w, h = int(wh[0]), int(wh[1])
    rows = max(1, round(cols * (h / w) * char_aspect))
    # Resize to cols x rows, grayscale, dump pixel values as text
    out = subprocess.check_output([
        "magick", path, "-resize", f"{cols}x{rows}!", "-colorspace", "Gray",
        "-depth", "8", "txt:-"
    ]).decode()
    grid = [[" "] * cols for _ in range(rows)]
    for line in out.splitlines():
        m = re.match(r"(\d+),(\d+):\s*\(([\d.]+)", line)
        if not m:
            continue
        x, y, val = int(m.group(1)), int(m.group(2)), float(m.group(3))
        if val > 255:  # some builds emit 0-65535
            val = val / 257.0
        idx = round(val / 255 * (len(RAMP) - 1))
        if 0 <= y < rows and 0 <= x < cols:
            grid[y][x] = RAMP[idx]
    return "\n".join("".join(r).rstrip() for r in grid)

if __name__ == "__main__":
    path = sys.argv[1]
    cols = int(sys.argv[2]) if len(sys.argv) > 2 else 60
    print(to_ascii(path, cols))
