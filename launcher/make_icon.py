"""Draws the app icon (dark rounded tile + white page with text lines) as .ico and .png."""
from pathlib import Path
from PIL import Image, ImageDraw

S = 1024  # draw large, downsample for smooth edges
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(img)

d.rounded_rectangle([40, 40, S - 40, S - 40], radius=220, fill=(55, 53, 47, 255))

# Page with a folded corner
left, top, right, bottom, fold = 290, 210, 734, 814, 130
d.polygon(
    [(left, top), (right - fold, top), (right, top + fold), (right, bottom), (left, bottom)],
    fill=(255, 255, 255, 255),
)
d.polygon([(right - fold, top), (right - fold, top + fold), (right, top + fold)], fill=(205, 203, 197, 255))

# Text lines; the first is an accent-blue "heading"
d.rounded_rectangle([370, 400, 600, 448], radius=24, fill=(35, 131, 226, 255))
for y, end in [(520, 654), (610, 654), (700, 560)]:
    d.rounded_rectangle([370, y, end, y + 36], radius=18, fill=(55, 53, 47, 255))

out = Path(__file__).parent
img.resize((256, 256), Image.LANCZOS).save(out / "notes.ico", sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
img.resize((192, 192), Image.LANCZOS).save(out.parent / "public" / "icon.png")
print("icon written")
