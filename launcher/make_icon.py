"""Draws the Muistipaikka app icon (a 3D extruded "M" in black and white) as .ico and .png."""
from pathlib import Path
from PIL import Image, ImageDraw

S = 1024  # draw large, downsample for smooth edges
DEPTH = 70  # extrusion depth in pixels, towards the bottom right

# Front face of a blocky "M", shifted up-left so letter + extrusion is centred.
SHIFT = -DEPTH // 2
M = [(250, 744), (250, 280), (385, 280), (512, 468), (639, 280), (774, 280), (774, 744),
     (652, 744), (652, 478), (546, 636), (478, 636), (372, 478), (372, 744)]
M = [(x + SHIFT, y + SHIFT) for x, y in M]

img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rounded_rectangle([40, 40, S - 40, S - 40], radius=220, fill=(17, 17, 17, 255))

# Extrusion: stack copies from the back (dark) to just behind the front (light grey).
for step in range(DEPTH, 0, -1):
    shade = int(45 + (DEPTH - step) / DEPTH * 85)
    d.polygon([(x + step, y + step) for x, y in M], fill=(shade, shade, shade, 255))

# Front face with a soft top-to-bottom gradient from white to light grey.
mask = Image.new("L", (S, S), 0)
ImageDraw.Draw(mask).polygon(M, fill=255)
top, bottom = min(y for _, y in M), max(y for _, y in M)
gradient = Image.new("RGBA", (S, S))
gd = ImageDraw.Draw(gradient)
for y in range(S):
    t = min(1, max(0, (y - top) / (bottom - top)))
    v = int(255 - t * 40)
    gd.line([(0, y), (S, y)], fill=(v, v, v, 255))
img.paste(gradient, (0, 0), mask)

out = Path(__file__).parent
img.resize((256, 256), Image.LANCZOS).save(out / "notes.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
img.resize((192, 192), Image.LANCZOS).save(out.parent / "public" / "icon.png")
print("icon written")
