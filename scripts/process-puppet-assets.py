"""
Process ALL raw puppet + backdrop assets for Milano Mio.

For each puppet raw image (two puppets side-by-side on magenta):
  1. Remove magenta background
  2. Find the split column between closed (left) and open (right) poses
  3. Crop each half, pad both to a shared canvas (bottom-aligned)
  4. Auto-detect the jaw bbox by diffing closed vs open sprites
  5. Split into head layer (with open-mouth interior) + jaw layer + meta JSON

For each backdrop:
  - Resize to 1200px wide, preserve aspect ratio

Usage: python scripts/process-puppet-assets.py
"""
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUPPETS_RAW = ROOT / "puppets_raw"
OUT_PUPPETS = ROOT / "src" / "assets" / "puppets"
OUT_SCENES = ROOT / "src" / "assets" / "scenes"
DEBUG_DIR = ROOT / "scripts" / "jaw_debug"

PAD = 10
BACKDROP_WIDTH = 1200

# ── Asset configs ──────────────────────────────────────────────────

PUPPET_CONFIGS = [
    # Scenario main characters
    {"key": "marco",            "src": "marco_raw.png"},
    {"key": "giulia",           "src": "giulia_raw.png"},
    {"key": "davide",           "src": "davide_raw.png"},
    {"key": "francesca",        "src": "francesca_raw.png"},
    {"key": "rosa",             "src": "rosa_raw.png"},
    {"key": "lorenzo",          "src": "lorenzo_raw.png"},
    {"key": "sofia",            "src": "sofia_v2_raw.png"},
    {"key": "valentina",        "src": "valentina_raw.png"},
    {"key": "paolo",            "src": "paolo.png"},
    {"key": "alessandro",       "src": "alberto_raw.png"},
    {"key": "vendor",           "src": "vendor_raw.png"},
    {"key": "giuseppe",         "src": "giuseppe.png"},
    # Cameos
    {"key": "matteo",           "src": "matteo_raw.png"},
    {"key": "luca",             "src": "luca.png"},
    {"key": "marta",            "src": "marta_raw.png"},
    {"key": "elena_sommelier",  "src": "elena_sommelier_raw.png"},
    # Non-location characters
    {"key": "elena",            "src": "elena_raw.png"},
    {"key": "luca_cl",          "src": "luca_cl_raw.png"},
]

BACKDROP_CONFIGS = [
    {"key": "caffe",             "src": "caffe_background_raw.png"},
    {"key": "hotel",             "src": "hotel_background.png"},
    {"key": "metro",             "src": "metro.png"},
    {"key": "duomo",             "src": "duomo.png"},
    {"key": "mercato",           "src": "mercato.png"},
    {"key": "trattoria",         "src": "trattoria.png"},
    {"key": "navigli",           "src": "riverside bar.png"},
    {"key": "viaDellaSpigas",    "src": "fashion.png"},
    {"key": "casaMilan",         "src": "san siro museo.png"},
    {"key": "bartolini",         "src": "mudec.png"},
    {"key": "sanSiro_exterior",  "src": "san siro outside.png"},
    {"key": "sanSiro_interior",  "src": "san siro stands.png"},
]

# Manual jaw bbox overrides.  Auto-detection works for most puppets but
# if a specific puppet's jaw looks wrong, hardcode (left, top, right, bottom)
# here in UNIFIED CANVAS coordinates.
JAW_OVERRIDES = {
    "marco": (235, 378, 510, 505),
    "elena_sommelier": (560, 400, 830, 490),  # face is far right of canvas
}


# ── Image utilities ────────────────────────────────────────────────

def remove_magenta(img: Image.Image) -> Image.Image:
    """Return RGBA copy with magenta/pink pixels set to transparent."""
    img = img.convert("RGBA")
    pixels = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if (r - g) > 30 and (b - g) > 30 and (r + b) > 180:
                pixels[x, y] = (0, 0, 0, 0)
    return img


def crop_to_alpha(img: Image.Image, pad: int = PAD) -> Image.Image:
    """Crop to opaque bounding box with padding."""
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


def find_split_column(img_cleared: Image.Image) -> int:
    """Find the column in the center 40% with fewest opaque pixels."""
    pixels = img_cleared.load()
    w, h = img_cleared.size
    start, end = int(w * 0.30), int(w * 0.70)
    best_x, best_count = w // 2, h + 1
    for x in range(start, end):
        count = sum(1 for y in range(h) if pixels[x, y][3] > 0)
        if count < best_count:
            best_count = count
            best_x = x
    return best_x


def pad_to_canvas(img: Image.Image, tw: int, th: int) -> Image.Image:
    """Center horizontally, bottom-align vertically on a transparent canvas."""
    canvas = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
    w, h = img.size
    canvas.paste(img, ((tw - w) // 2, th - h), img)
    return canvas


# ── Jaw auto-detection ─────────────────────────────────────────────

def estimate_jaw_from_head(closed: Image.Image) -> tuple | None:
    """
    Estimate the jaw bbox from face proportions.

    The full-width head bbox is inflated by shoulders and arms, which
    pushes jaw estimates too low.  Instead we find the FACE by looking
    only at the center 40% of the canvas horizontally (arms don't reach
    the center column) and the top 35% vertically (stops before the
    torso dominates).  This gives a tight face-only bbox.

    Proportions (calibrated on Marco, verified on several others):
      - Jaw top:    ~70% down the face bbox
      - Jaw bottom: ~90% down
      - Jaw left:   ~15% in from left of face bbox
      - Jaw right:  ~85% in
    """
    w, h = closed.size

    # Crop to center 40% horizontal, top 35% vertical -> isolates face
    cx_lo = int(w * 0.30)
    cx_hi = int(w * 0.70)
    cy_hi = int(h * 0.35)
    face_strip = closed.crop((cx_lo, 0, cx_hi, cy_hi))
    fb = face_strip.getbbox()
    if not fb:
        return None

    # Map back to full canvas coords
    fl = cx_lo + fb[0]
    ft = fb[1]
    fr = cx_lo + fb[2]
    fbot = fb[3]
    fw, fh = fr - fl, fbot - ft

    if fh < 20 or fw < 20:
        return None

    jaw_top = int(ft + fh * 0.78)
    jaw_bot = int(ft + fh * 0.95)
    jaw_left = int(fl + fw * 0.12)
    jaw_right = int(fl + fw * 0.88)

    # Clamp to canvas
    jaw_bot = min(jaw_bot, h)
    jaw_right = min(jaw_right, w)

    return (jaw_left, jaw_top, jaw_right, jaw_bot)


# ── Processing functions ───────────────────────────────────────────

def process_puppet(key: str, src_filename: str):
    """
    Full pipeline for one puppet: split -> remove magenta -> crop ->
    pad to shared canvas -> detect jaw -> split into head + jaw layers.
    """
    src = PUPPETS_RAW / src_filename
    if not src.exists():
        print(f"  WARNING: SKIP {key}: {src} not found")
        return False

    print(f"\n[{key}] Loading {src_filename} ...")
    img = Image.open(src).convert("RGBA")
    w, h = img.size
    print(f"  raw size: {w}x{h}")

    # 1. Remove magenta
    print("  removing magenta ...")
    cleared = remove_magenta(img)

    # 2. Split at midpoint
    split_x = find_split_column(cleared)
    print(f"  split column: {split_x}/{w}")

    left = cleared.crop((0, 0, split_x, h))
    right = cleared.crop((split_x, 0, w, h))

    # 3. Crop each half to its opaque bbox
    left_cropped = crop_to_alpha(left)
    right_cropped = crop_to_alpha(right)
    print(f"  closed: {left_cropped.size[0]}x{left_cropped.size[1]}  "
          f"open: {right_cropped.size[0]}x{right_cropped.size[1]}")

    # 4. Pad to common canvas (bottom-aligned, centered)
    tw = max(left_cropped.size[0], right_cropped.size[0])
    th = max(left_cropped.size[1], right_cropped.size[1])
    closed = pad_to_canvas(left_cropped, tw, th)
    opened = pad_to_canvas(right_cropped, tw, th)
    print(f"  canvas: {tw}x{th}")

    OUT_PUPPETS.mkdir(parents=True, exist_ok=True)
    closed.save(OUT_PUPPETS / f"{key}_closed.png", "PNG")
    opened.save(OUT_PUPPETS / f"{key}_open.png", "PNG")

    # 5. Look up manual override or estimate from head proportions
    if key in JAW_OVERRIDES:
        jaw_bbox = JAW_OVERRIDES[key]
        print(f"  jaw bbox (override): {jaw_bbox}")
    else:
        jaw_bbox = estimate_jaw_from_head(closed)
        if jaw_bbox:
            print(f"  jaw bbox (estimated): {jaw_bbox}")
        else:
            print(f"  WARNING: jaw estimation FAILED -- skipping jaw split")
            return True

    # 6. Split into head + jaw layers
    head = closed.copy()
    open_mouth = opened.crop(jaw_bbox)
    head.paste(open_mouth, (jaw_bbox[0], jaw_bbox[1]), open_mouth)

    jaw = closed.crop(jaw_bbox)

    head.save(OUT_PUPPETS / f"{key}_head.png", "PNG")
    jaw.save(OUT_PUPPETS / f"{key}_jaw.png", "PNG")
    print(f"  head + jaw written  (jaw: {jaw.size[0]}x{jaw.size[1]})")

    # Meta JSON
    meta = {
        "canvas": {"width": tw, "height": th},
        "jawBbox": {
            "left": jaw_bbox[0], "top": jaw_bbox[1],
            "right": jaw_bbox[2], "bottom": jaw_bbox[3],
            "width": jaw_bbox[2] - jaw_bbox[0],
            "height": jaw_bbox[3] - jaw_bbox[1],
        }
    }
    (OUT_PUPPETS / f"{key}_jaw_meta.json").write_text(json.dumps(meta, indent=2))

    # 7. Debug visualization
    DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    vis = closed.copy()
    d = ImageDraw.Draw(vis)
    d.rectangle(jaw_bbox, outline=(255, 0, 0, 255), width=3)
    # Crop to face area for easier review
    face_top = max(0, jaw_bbox[1] - 200)
    face_bot = min(th, jaw_bbox[3] + 100)
    vis.crop((0, face_top, tw, face_bot)).save(DEBUG_DIR / f"{key}_jaw.png")

    return True


def process_backdrop(key: str, src_filename: str):
    """Resize one backdrop to BACKDROP_WIDTH px wide."""
    # Backdrops can be in puppets_raw/ OR the project root
    src = ROOT / src_filename
    if not src.exists():
        src = PUPPETS_RAW / src_filename
    if not src.exists():
        print(f"  WARNING: SKIP backdrop {key}: {src_filename} not found")
        return

    img = Image.open(src).convert("RGBA")
    w, h = img.size
    new_h = round(h * (BACKDROP_WIDTH / w))
    resized = img.resize((BACKDROP_WIDTH, new_h), Image.LANCZOS)
    OUT_SCENES.mkdir(parents=True, exist_ok=True)
    out = OUT_SCENES / f"{key}_backdrop.png"
    resized.save(out, "PNG")
    print(f"  [{key}] {w}x{h} -> {BACKDROP_WIDTH}x{new_h}")


# ── Main ───────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("=" * 60)
    print("PROCESSING PUPPETS")
    print("=" * 60)
    ok, fail = 0, 0
    for cfg in PUPPET_CONFIGS:
        if process_puppet(cfg["key"], cfg["src"]):
            ok += 1
        else:
            fail += 1
    print(f"\nPuppets: {ok} succeeded, {fail} skipped")

    print("\n" + "=" * 60)
    print("PROCESSING BACKDROPS")
    print("=" * 60)
    for cfg in BACKDROP_CONFIGS:
        process_backdrop(cfg["key"], cfg["src"])

    print("\n" + "=" * 60)
    print("DONE")
    print(f"Jaw debug visualisations: {DEBUG_DIR}/")
    print("=" * 60)
