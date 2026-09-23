#!/usr/bin/env python3
"""
Harvest the historical map layers behind the demo's "Kaart van Amsterdam".

This is a thin driver over the product's own harvester —
Medelo-expansion/TouchTableHub/tools/harvest_kaartlagen.py — with three
constants changed: where the frame is centred, how big it is, and where the
tiles land. Everything else (the Esri Nederland service, the edition
detection, the pyramid slicing, the attribution) is that script's, because
the demo's map must behave exactly like the real one.

Read the licensing note at the top of that file before changing anything
here. Short version: the tiles are Kadaster's, republished by Esri Nederland
under a "free to use with attribution" licence, and the attribution rides
through to the screen. Do not point it at topotijdreis.nl.

WHY A SMALLER FRAME AND FEWER EDITIONS
--------------------------------------
Meijel ships 48 editions over an 8 km square: 294 MB, which is nothing on a
kiosk SSD and impossible on a web page. Amsterdam here is a 3.25 km square —
the canal belt, which is what anybody means by historic Amsterdam — and ten
editions chosen to spread across the two centuries. That is the same feature
at about a fortieth of the weight.

USAGE
-----
    python harvest_amsterdam.py scan     # find editions -> editions_amsterdam.json
    python harvest_amsterdam.py pick     # choose ~10 of them, spread over time
    python harvest_amsterdam.py fetch    # download -> ../../public/.../kaartlagen/
"""

import importlib.util
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
# demo -> tools -> Website -> DanTheLion-Resume -> theLionsAlliance.com ->
# Daniel -> Documents, which is where the Medelo checkout sits beside it.
PRODUCT_TOOL = os.environ.get("MEDELO_HARVESTER") or os.path.normpath(os.path.join(
    HERE, "..", "..", "..", "..", "..", "..",
    "Medelo", "Medelotapps", "Medelo-expansion", "TouchTableHub", "tools",
    "harvest_kaartlagen.py"))

if not os.path.exists(PRODUCT_TOOL):
    sys.exit(f"cannot find the product harvester at:\n  {PRODUCT_TOOL}\n"
             "Adjust PRODUCT_TOOL if the Medelo checkout moved.")

spec = importlib.util.spec_from_file_location("harvest_kaartlagen", PRODUCT_TOOL)
H = importlib.util.module_from_spec(spec)
spec.loader.exec_module(H)

# ---------------------------------------------------------------- overrides

# Dam square, RD, from the PDOK locatieserver — the same source the Meijel
# centre came from.
H.MEIJEL_X, H.MEIJEL_Y = 121347.914, 487347.519

# 8x8 source tiles = 3251 m square. Holds the whole grachtengordel, the
# Jordaan, the Plantage and the IJ waterfront; loses Amsterdam-Noord and the
# 20th-century ring, neither of which is what the five pins are about.
H.GRID = 8

# Meijel's pyramid goes to 8 tiles a side — 5120 px — because its frame is
# 20 source tiles (5120 px) wide, so the deepest level is exactly native. This
# frame is 8 source tiles, i.e. 2048 px, so that same depth would upsample 2.5x
# and ship a quarter of a gigabyte of invented pixels. Four tiles a side is
# 2560 px, which is the last level that still carries real detail.
H.LEVELS = [1, 2, 4]

# Line maps at q80 are for a kiosk with an SSD. On a web page the same sheets
# stay perfectly legible at 66 and cost a third less.
H.TILE_ENCODE = dict(quality=66, method=6)

H.OUT_ROOT = os.path.normpath(os.path.join(
    HERE, "..", "..", "public", "medelotapps-demo", "content", "kaart", "kaartlagen"))
H.EDITIONS_PATH = os.path.join(HERE, "editions_amsterdam.json")

# FRAME and PROBES are computed at import time off the constants above, so
# they have to be rebuilt now that the constants have changed.
H.FRAME = H.frame()
H.PROBES = [(r, c) for r in (1, H.GRID // 2, H.GRID - 2)
            for c in (1, H.GRID // 2, H.GRID - 2)]

WANT_EDITIONS = 10


def cmd_pick():
    """
    Thin the scanned editions down to WANT_EDITIONS, spread evenly over the
    years rather than taken from the front: the service redraws Amsterdam far
    more often in the 20th century than the 19th, so the first ten in file
    order would all be post-war and the slider would show two centuries of
    nothing followed by a decade of everything.
    """
    with open(H.EDITIONS_PATH, encoding="utf-8") as f:
        doc = json.load(f)
    editions = doc["editions"]
    if len(editions) <= WANT_EDITIONS:
        print(f"{len(editions)} editions — keeping all of them")
        return

    editions.sort(key=lambda e: e["from"])
    first, last = editions[0], editions[-1]
    middle = editions[1:-1]
    span = last["from"] - first["from"]
    picked = [first]
    for i in range(1, WANT_EDITIONS - 1):
        target = first["from"] + round(span * i / (WANT_EDITIONS - 1))
        best = min(middle, key=lambda e: abs(e["from"] - target))
        if best not in picked:
            picked.append(best)
    picked.append(last)
    picked.sort(key=lambda e: e["from"])

    backup = H.EDITIONS_PATH.replace(".json", ".all.json")
    if not os.path.exists(backup):
        with open(backup, "w", encoding="utf-8") as f:
            json.dump(doc, f, ensure_ascii=False, indent=1)
    doc["editions"] = picked
    with open(H.EDITIONS_PATH, "w", encoding="utf-8") as f:
        json.dump(doc, f, ensure_ascii=False, indent=1)
    print(f"kept {len(picked)} of {len(editions)}: "
          + ", ".join(str(e["from"]) for e in picked))
    print(f"(all of them are still in {os.path.basename(backup)})")


if __name__ == "__main__":
    command = sys.argv[1] if len(sys.argv) > 1 else "scan"
    print(f"frame: {H.GRID}x{H.GRID} tiles "
          f"({H.GRID * H.SPAN:.0f} m square) centred on Dam square")
    print(f"out:   {H.OUT_ROOT}")
    if command == "scan":
        H.cmd_scan()
    elif command == "pick":
        cmd_pick()
    elif command == "fetch":
        H.cmd_fetch()
    else:
        sys.exit("usage: harvest_amsterdam.py scan|pick|fetch")
