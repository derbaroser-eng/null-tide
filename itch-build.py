#!/usr/bin/env python3
"""Build the itch.io HTML upload zip for NULL TIDE.

itch.io's HTML channel expects index.html at the archive root. The product
directory already has that layout, so we zip the runtime files only - no tests,
no build tooling, no git metadata. Stdlib only; no network.
"""
import json
import os
import sys
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
FILES = ["index.html", "styles.css", "game.js", "manifest.json", "icons/icon.svg"]
DIST = os.path.join(HERE, "dist")


def main():
    missing = [f for f in FILES if not os.path.isfile(os.path.join(HERE, f))]
    if missing:
        print("MISSING: " + ", ".join(missing), file=sys.stderr)
        return 2

    with open(os.path.join(HERE, "package.json"), encoding="utf-8") as fh:
        version = json.load(fh)["version"]

    os.makedirs(DIST, exist_ok=True)
    out = os.path.join(DIST, "null-tide-%s-itch.zip" % version)

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for rel in FILES:
            z.write(os.path.join(HERE, rel), arcname=rel)
        z.write(os.path.join(HERE, "ITCH.md"), arcname="ITCH.md")

    with zipfile.ZipFile(out) as z:
        names = sorted(z.namelist())
        bad = z.testzip()

    if bad is not None:
        print("CORRUPT ENTRY: " + bad, file=sys.stderr)
        return 3
    if "index.html" not in names:
        print("index.html must be at the archive root", file=sys.stderr)
        return 4

    print("wrote %s (%d bytes)" % (out, os.path.getsize(out)))
    print("contents: " + ", ".join(names))
    return 0


if __name__ == "__main__":
    sys.exit(main())
