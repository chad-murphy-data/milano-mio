"""
Process Vespa companion puppets + world map for Milano Mio.

Each Vespa puppet raw is TWO poses side-by-side on magenta:
  left pose  = wheels on ground (static)
  right pose = wheels bouncing (motion frame)

For simplicity we keep only the LEFT pose; CSS handles the bounce
animation on the map. No jaw-split needed — the Vespa puppet doesn't
talk.

World map is resized to a consistent width and saved as PNG.

Usage: python scripts/process-vespa-puppets.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
RAWS = ROOT / "puppets_raw"  # fallback when raws have been tucked away
OUT_PUPPETS = ROOT / "src" / "assets" / "puppets"
OUT_SCENES = ROOT / "src" / "assets" / "scenes"


def find_raw(filename: str) -> Path | None:
    """Return ROOT/filename or puppets_raw/filename, whichever exists."""
    for base in (ROOT, RAWS):
        p = base / filename
        if p.exists():
            return p
    return None

PAD = 10
MAP_WIDTH = 1600

VESPA_CONFIGS = [
    {"key": "keeshond", "src": "keeshond.jpg"},
    {"key": "pug",      "src": "pug.jpg"},
]
MAP_CONFIG = {"key": "world_map", "src": "map.jpg"}


def remove_magenta(img: Image.Image) -> Image.Image:
    """Return RGBA copy with magenta pixels set to transparent."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if (r - g) > 30 and (b - g) > 30 and (r + b) > 180:
                pixels[x, y] = (0, 0, 0, 0)
    return img


def crop_to_alpha(img: Image.Image, pad: int = PAD) -> Image.Image:
    bbox = img.getbbox()
    if not bbox:
        return img
    left, top, right, bottom = bbox
    w, h = img.size
    return img.crop((
        max(0, left - pad),
        max(0, top - pad),
        min(w, right + pad),
        min(h, bottom + pad),
    ))


def find_split_column(img: Image.Image) -> int:
    """Column with the fewest opaque pixels in the center 40%."""
    pixels = img.load()
    w, h = img.size
    start, end = int(w * 0.30), int(w * 0.70)
    best_x, best_count = w // 2, h + 1
    for x in range(start, end):
        count = sum(1 for y in range(h) if pixels[x, y][3] > 0)
        if count < best_count:
            best_count = count
            best_x = x
    return best_x


def process_vespa(key: str, src_filename: str):
    src = find_raw(src_filename)
    if not src:
        print(f"  WARNING: {src_filename} not found in ROOT or puppets_raw/")
        return
    print(f"\n[{key}] loading {src} ...")
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    print(f"  raw: {w}x{h}")

    cleared = remove_magenta(img)
    split_x = find_split_column(cleared)
    print(f"  split column: {split_x}/{w}")

    # Keep only the LEFT pose (wheels down, static).
    left = cleared.crop((0, 0, split_x, h))
    cropped = crop_to_alpha(left)
    print(f"  cropped: {cropped.size[0]}x{cropped.size[1]}")

    OUT_PUPPETS.mkdir(parents=True, exist_ok=True)
    out = OUT_PUPPETS / f"vespa_{key}.png"
    cropped.save(out, "PNG")
    print(f"  -> {out.relative_to(ROOT)}")


def process_map(key: str, src_filename: str):
    src = find_raw(src_filename)
    if not src:
        print(f"  WARNING: {src_filename} not found in ROOT or puppets_raw/")
        return
    print(f"\n[{key}] loading {src} ...")
    img = Image.open(src).convert("RGB")
    w, h = img.size
    new_h = round(h * (MAP_WIDTH / w))
    resized = img.resize((MAP_WIDTH, new_h), Image.LANCZOS)
    OUT_SCENES.mkdir(parents=True, exist_ok=True)
    out = OUT_SCENES / f"{key}.png"
    resized.save(out, "PNG")
    print(f"  {w}x{h} -> {MAP_WIDTH}x{new_h}")
    print(f"  -> {out.relative_to(ROOT)}")


if __name__ == "__main__":
    print("=" * 60)
    print("PROCESSING VESPA PUPPETS + WORLD MAP")
    print("=" * 60)
    for cfg in VESPA_CONFIGS:
        process_vespa(cfg["key"], cfg["src"])
    process_map(MAP_CONFIG["key"], MAP_CONFIG["src"])
    print("\nDone.")
