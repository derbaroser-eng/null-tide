#!/usr/bin/env python3
"""NULL TIDE cover / share-card generator.

Renders a deterministic 1200x630 PNG (itch.io cover size and viral memory-card
size) from a seed. No network, no paid APIs, no downloads; Pillow is installed.

Usage: python sharecard.py --seed 1200 --title "THE HALF-MERCIFUL" --out assets/cover-1200x630.png
"""
from __future__ import annotations

import argparse
import hashlib
import os
import random

from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630

DEFAULT_POEM = chr(10).join([
    "We kept the lamps burning.",
    "The water kept the rest.",
    "We rang for those who left.",
    "The city called it home.",
])


def _font(size, bold=False):
    names = (["DejaVuSerif-Bold.ttf", "DejaVuSans-Bold.ttf"] if bold
             else ["DejaVuSerif.ttf", "DejaVuSans.ttf"])
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default(size=size)


def _seed_int(seed):
    if isinstance(seed, int):
        return seed & 0xFFFFFFFFFFFFFFFF
    return int(hashlib.sha256(str(seed).encode("utf-8")).hexdigest()[:16], 16)


def generate_card(seed, title="THE DROWNER", poem=None,
                  tagline="You are not the hero. You are the tide."):
    """Deterministic 1200x630 image; identical seed gives identical pixels."""
    rng = random.Random(_seed_int(seed))
    img = Image.new("RGB", (W, H))
    px = img.load()
    top, mid, bot = (10, 32, 54), (18, 58, 85), (6, 18, 31)
    split = int(H * 0.55)
    for y in range(H):
        if y < split:
            t = y / split
            c = tuple(int(top[i] + (mid[i] - top[i]) * t) for i in range(3))
        else:
            t = (y - split) / (H - split)
            c = tuple(int(mid[i] + (bot[i] - mid[i]) * t) for i in range(3))
        for x in range(W):
            px[x, y] = c
    d = ImageDraw.Draw(img, "RGBA")
    mx, my, mr = 968, 128, 64
    for r in range(mr + 46, 0, -2):
        a = int(20 * (1 - r / (mr + 46)))
        d.ellipse([mx - r, my - r, mx + r, my + r], fill=(186, 224, 238, max(a, 0)))
    d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=(208, 232, 239, 220))

    horizon = 402
    x = 0
    while x < W:
        bw = rng.randint(34, 96)
        bh = rng.randint(48, 206)
        d.rectangle([x, horizon - bh, x + bw, horizon], fill=(9, 32, 47, 255))
        d.rectangle([x, horizon, x + bw, horizon + bh // 2], fill=(7, 26, 39, 96))
        for wy in range(horizon - bh + 9, horizon - 6, 14):
            for wx in range(x + 6, x + bw - 6, 12):
                if rng.random() < 0.28:
                    d.rectangle([wx, wy, wx + 3, wy + 5], fill=(242, 197, 112, 205))
        x += bw + rng.randint(2, 10)

    for i in range(6):
        y = horizon + 16 + i * 30
        d.rectangle([0, y, W, y + 2], fill=(255, 255, 255, 18))
    d.rectangle([0, horizon, W, horizon + 2], fill=(120, 190, 210, 64))

    d.rectangle([0, 0, W, 252], fill=(4, 14, 24, 128))
    d.text((60, 46), "NULL TIDE", font=_font(76, True), fill=(236, 244, 248, 255))
    d.text((62, 142), tagline, font=_font(26), fill=(150, 200, 214, 255))
    d.text((60, 296), str(title).upper(), font=_font(42, True), fill=(244, 214, 140, 255))
    if poem:
        y = 358
        for line in str(poem).splitlines()[:4]:
            d.text((62, y), line, font=_font(23), fill=(212, 230, 237, 240))
            y += 33
    d.text((60, H - 44), "derbaroser-eng  -  free in browser", font=_font(18),
           fill=(120, 160, 176, 210))
    d.text((W - 320, H - 44), "SEED  " + str(seed), font=_font(20),
           fill=(150, 190, 205, 230))
    return img


def save_card(seed, out, **kwargs):
    img = generate_card(seed, **kwargs)
    out = os.path.abspath(out)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    img.save(out, "PNG")
    return out


def main(argv=None):
    p = argparse.ArgumentParser(description="Render a NULL TIDE 1200x630 cover card")
    p.add_argument("--seed", default="1200")
    p.add_argument("--title", default="THE HALF-MERCIFUL")
    p.add_argument("--poem", default=DEFAULT_POEM)
    p.add_argument("--out", default="assets/cover-1200x630.png")
    a = p.parse_args(argv)
    path = save_card(a.seed, a.out, title=a.title, poem=a.poem)
    print("wrote " + path + " (" + str(os.path.getsize(path)) + " bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
