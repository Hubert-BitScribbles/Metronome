"""Build Metronome's icon set from design/metronome-icon.svg.

Run from the repo root:  python3 design/make-icons.py   (needs: pip install cairosvg)

  icon-192.png, icon-512.png  rounded tile (as drawn)
  favicon.png                 64 px, rounded tile
  apple-touch-icon.png        180 px, square tile (iOS rounds it)
  maskable-512.png            full-bleed square tile, mark at 80% for Android's safe zone
"""
import re
from pathlib import Path
import cairosvg

root = Path(__file__).resolve().parent.parent
svg = (root / "design" / "metronome-icon.svg").read_text()

square = svg.replace(' rx="115"', '')
inner = re.search(r'(<path.*?)</svg>', svg, re.S).group(1)
maskable = (
    '<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">'
    '<rect width="512" height="512" fill="#F2B134"/>'
    f'<g transform="translate(256 256) scale(0.8) translate(-256 -256)">{inner}</g></svg>'
)

def png(src, name, size):
    cairosvg.svg2png(bytestring=src.encode(), write_to=str(root / name),
                     output_width=size, output_height=size)
    print(name, size)

png(svg, "icon-512.png", 512)
png(svg, "icon-192.png", 192)
png(svg, "favicon.png", 64)
png(square, "apple-touch-icon.png", 180)
png(maskable, "maskable-512.png", 512)
