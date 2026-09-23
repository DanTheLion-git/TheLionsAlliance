#!/usr/bin/env python3
"""
Build the public Medelotapps web demo.

WHAT THIS IS
------------
thelionsalliance.com/touchscreens/ carries a playable demo of Medelotapps.
The hub it runs is the real product code, copied unmodified out of
Medelo-expansion/TouchTableHub/hub. On the touch table a WPF host scans the
museum's content folders and injects a manifest; there is no host on the web,
so this script writes that manifest itself, against content that belongs to
nobody in particular.

NONE OF MUSEUM MEDELO'S MATERIAL IS USED HERE, and that is the whole point of
the script existing. Medelo's photographs, articles, genealogy and recordings
are theirs, gathered by their heritage society, and a commercial demo is not
the place for them. So:

  Personen  ten monarchs from six centuries and four continents, written
            from Wikipedia in all four interface languages, illustrated
            from Wikimedia Commons.
  Tijdlijn  ten moments of world history, same sources.
  Foto-archief  five themed albums (war, agriculture, social progress,
            industry, transport) of dated, freely licensed photographs
            from Wikimedia Commons, 1885-1975, captions cleaned of archive
            boilerplate.
  Kaart     five places in Amsterdam's canal belt, over Kadaster's own
            historical map editions (see harvest_amsterdam.py).
  Verhalen  three National Geographic films, embedded from YouTube.
            Embedded, never re-hosted: they are NatGeo's work. The YouTube
            player is the licensed way to show somebody else's film, which
            is why views/storyplayer.js grew a YouTube path.

Every picture carries its source and licence through to the screen in the
`credit` field, which the hub already renders in a leaf's bottom-right corner.

USAGE
-----
    python build_demo.py            # full build
    python build_demo.py --skip-fetch   # re-emit manifest from the cache

Raw API responses and originals are cached under .cache/ so a re-run costs
nothing and is safe to interrupt.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import os
import re
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent
PUBLIC = HERE.parent.parent / "public" / "medelotapps-demo"
CONTENT = PUBLIC / "content"
DEMO = PUBLIC / "demo"
CACHE = HERE / ".cache"

UA = "LionsAllianceMedelotappsDemo/1.0 (https://thelionsalliance.com; info.mvdvl@gmail.com)"
S = requests.Session()
S.headers["User-Agent"] = UA

# The free-move canvas draws a leaf at 840 design px on its long edge and lets
# a visitor pinch it larger, so the file is a little over that and no more.
# Every extra hundred pixels here is ~10 MB across the whole demo.
LEAF_EDGE = 860
THUMB_EDGE = 620
WEBP_Q = 72

LANGS = ["nl", "en", "de", "fr"]


# ============================================================ monarchs

# Chosen for spread rather than fame alone: six centuries apart at the ends,
# four continents, and nobody whose portrait is still in copyright.
MONARCHS = [
    ("hatshepsut",   "Hatshepsut",                 -1479, -1458, "Egypt"),
    ("ashoka",       "Ashoka",                      -268,  -232, "Maurya Empire"),
    ("cleopatra",    "Cleopatra",                    -51,   -30, "Ptolemaic Egypt"),
    ("charlemagne",  "Charlemagne",                   768,   814, "Frankish Empire"),
    ("mansa-musa",   "Mansa Musa",                   1312,  1337, "Mali Empire"),
    ("suleiman",     "Suleiman the Magnificent",     1520,  1566, "Ottoman Empire"),
    ("elizabeth-i",  "Elizabeth I",                  1558,  1603, "England and Ireland"),
    ("louis-xiv",    "Louis XIV",                    1643,  1715, "France"),
    ("victoria",     "Queen Victoria",               1837,  1901, "United Kingdom"),
    ("haile-selassie", "Haile Selassie",             1930,  1974, "Ethiopia"),
]

# ============================================================ timeline

TIMELINE = [
    ("3200-bc",  -3200, "Cuneiform",                "Writing begins"),
    ("776-bc",    -776, "Ancient Olympic Games",    "The first Olympiad"),
    ("221-bc",    -221, "Qin dynasty",              "China unified"),
    ("79",          79, "Eruption of Mount Vesuvius in 79 AD", "Vesuvius buries Pompeii"),
    ("1088",      1088, "University of Bologna",    "The first university"),
    ("1440",      1440, "Printing press",           "Movable type in Europe"),
    ("1492",      1492, "Voyages of Christopher Columbus", "The Atlantic crossed"),
    ("1687",      1687, "Philosophiæ Naturalis Principia Mathematica", "Newton's Principia"),
    ("1869",      1869, "Suez Canal",               "Two seas joined"),
    ("1969",      1969, "Apollo 11",                "A footprint on the Moon"),
]

# ============================================================ Amsterdam

# Geocoded at build time through the PDOK locatieserver, the same public
# service the Kaart van Meijel's own coordinates came from, so the pins land
# on the Kadaster tile grid the map layers are cut from.
PLACES = [
    ("oude-kerk",       "Oude Kerk",            "Oudekerksplein 23, Amsterdam",  1306, None, "Oude Kerk (Amsterdam)"),
    ("dam",             "Dam",                  "Dam, Amsterdam",                1270, None, "Dam Square"),
    ("montelbaanstoren", "Montelbaanstoren",    "Oudeschans 2, Amsterdam",       1516, None, "Montelbaanstoren"),
    ("rembrandthuis",   "Rembrandthuis",        "Jodenbreestraat 4, Amsterdam",  1606, None, "Rembrandt House Museum"),
    ("westerkerk",      "Westerkerk",           "Prinsengracht 281, Amsterdam",  1631, None, "Westerkerk"),
]

# ============================================================ stories

# NatGeo's films, shown through YouTube's player under its embed terms.
# Never download these and never serve them from our own origin.
STORIES = [
    ("boyes",      "1SheNUm9KpM", "Steve Boyes's Journey",
     "Africa, Earth's Wild Home", 2024),
    ("lion-king",  "l-GnAVB1xYM", "From the Savanna to Broadway",
     "LION", 2024),
    ("photography", "CTGwl_4Mny0", "The Art of Authentic Photography",
     "National Geographic", 2023),
]


# ============================================================ photo archive

# Albums by theme, each drawn from more than one era so an album reads as a
# subject *through* history rather than as one photographer's week. Every
# source is a Wikimedia Commons category checked by hand for freely licensed
# material (public domain, CC0, CC BY, CC BY-SA); the licence is re-checked per
# file below and anything else is skipped.
#
# Liberation of the Netherlands stands in for WWII on purpose: this demo is
# shown to Dutch museums, and it is overwhelmingly photographs of people in the
# street, not of battle.
PHOTO_ALBUMS = [
    ("oorlog",
     {"nl": "Oorlog en bevrijding", "en": "War and liberation",
      "de": "Krieg und Befreiung", "fr": "Guerre et libération"},
     [("World War I photographs by Ernest Brooks", 4), ("Liberation of the Netherlands", 4)]),
    ("landbouw",
     {"nl": "Landbouw", "en": "Agriculture", "de": "Landwirtschaft", "fr": "Agriculture"},
     [("Ploughing with horses", 2), ("Haymaking", 2), ("Threshing machines", 2),
      ("Agriculture in the Netherlands", 2)]),
    ("vooruitgang",
     {"nl": "Sociale vooruitgang", "en": "Social progress",
      "de": "Sozialer Fortschritt", "fr": "Progrès social"},
     [("Photographs by Lewis Hine", 2), ("Women's suffrage in the United Kingdom", 2),
      ("Ellis Island in the 1900s", 2), ("March on Washington for Jobs and Freedom", 2)]),
    ("industrie",
     {"nl": "Industrie en arbeid", "en": "Industry and labour",
      "de": "Industrie und Arbeit", "fr": "Industrie et travail"},
     [("Steel industry in the United States", 3), ("Factory workers", 2),
      ("Textile industry", 2), ("Assembly lines", 1)]),
    ("vervoer",
     {"nl": "Vervoer", "en": "Transport", "de": "Verkehr", "fr": "Transports"},
     [("Horse-drawn carriages", 1), ("Trams in Amsterdam", 2), ("Wright Flyer", 2),
      ("Ford Model T", 2), ("Bicycles in the Netherlands", 1)]),
]

# An archive album is about the past. A 2024 museum photograph of an 1889
# threshing machine is a picture of a museum, and captioning it "2024" in an
# album called Agriculture tells the visitor something false about farming.
# Only photographs dated in the source, and dated before this, are used.
LATEST_YEAR = 1975

# A photo archive holds photographs. Maps, engravings and encyclopedia plates
# sit in the same Commons categories and are not what an album promises; a
# funeral is not what anybody means by Transport. Written in every language
# the archives in PHOTO_ALBUMS actually describe their pictures in.
NOT_A_PHOTO = re.compile(r"\b(maps?|kaart|karte|carte|illustration|engraving|gravure|drawing|"
                         r"lithograph\w*|funeral|begrafenis|beerdigung)\b", re.I)

FREE_LICENCE = re.compile(r"public domain|^pd\b|^pd-|cc0|cc[ -]by(-sa)?[ -]?[1-4]", re.I)

# A museum demo is shown to boards, volunteers and school groups. War is a
# subject in it; the dead are not.
GRAPHIC = re.compile(r"\b(dead|death|corpses?|bodies|body of|killed|execut\w*|massacre|"
                     r"hang(ed|ing)|graves?|cemetery|wounded|casualt\w*)\b", re.I)


# ============================================================ helpers

def log(*a):
    # The Windows console is cp1252; the content is not. Never let a dash kill a build.
    line = " ".join(str(x) for x in a)
    enc = sys.stdout.encoding or "utf-8"
    sys.stdout.write(line.encode(enc, "replace").decode(enc) + "\n")
    sys.stdout.flush()


def cache_path(key: str, ext: str) -> Path:
    h = hashlib.sha1(key.encode("utf-8")).hexdigest()[:16]
    return CACHE / f"{h}{ext}"


def cached_json(key: str, fetch):
    p = cache_path(key, ".json")
    if p.exists():
        return json.loads(p.read_text("utf-8"))
    data = fetch()
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(data, ensure_ascii=False), "utf-8")
    return data


def cached_bytes(key: str, url: str) -> Path | None:
    p = cache_path(key, ".bin")
    if p.exists():
        return p
    try:
        r = S.get(url, timeout=60)
        r.raise_for_status()
    except Exception as e:  # a single missing picture must not fail the build
        log("   ! download failed:", url[:80], e)
        return None
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_bytes(r.content)
    return p


def api(lang: str, **params):
    params.setdefault("action", "query")
    params.setdefault("format", "json")
    params.setdefault("formatversion", "2")
    r = S.get(f"https://{lang}.wikipedia.org/w/api.php", params=params, timeout=30)
    r.raise_for_status()
    return r.json()


def summary(lang: str, title: str) -> dict:
    def go():
        t = requests.utils.quote(title.replace(" ", "_"), safe="")
        r = S.get(f"https://{lang}.wikipedia.org/api/rest_v1/page/summary/{t}", timeout=30)
        if r.status_code != 200:
            return {}
        return r.json()
    return cached_json(f"sum:{lang}:{title}", go)


def langlinks(title: str) -> dict:
    """en title -> {lang: title} for the other three interface languages."""
    def go():
        d = api("en", prop="langlinks", titles=title, lllimit="500", redirects=1)
        out = {}
        for pg in (d.get("query") or {}).get("pages", []):
            for ll in pg.get("langlinks", []):
                if ll["lang"] in LANGS:
                    out[ll["lang"]] = ll["title"]
        return out
    return cached_json(f"ll:{title}", go)


JUNK = re.compile(
    r"logo|icon|symbol|commons-|wiki|edit-|arrow|blank|question|ambox|"
    r"disambig|stub|padlock|portal|barnstar|crystal|nuvola|gnome|folder|"
    r"loudspeaker|speaker|audio|\.ogg|\.oga|\.wav|flag_of|coat_of_arms|"
    r"map_of|locator|location_map|red_pennant|star_full|increase|decrease",
    re.I,
)


def article_images(title: str, want: int, prefer: str = "") -> list[dict]:
    """
    Usable illustrations from an article, best first.

    "Best" is a crude relevance score rather than article order, because the
    API returns files alphabetically and the alphabet has no opinion about
    which picture is the portrait.
    """
    def go():
        # iiurlwidth makes Commons render the scaled copy for us. Originals run
        # to 6000px and tens of megabytes; we want 860 on the long edge, so
        # pulling the full plate would waste hours and gigabytes for nothing.
        d = api("en", generator="images", titles=title, gimlimit="80",
                prop="imageinfo", iiprop="url|size|mime|extmetadata",
                iiurlwidth="1280", redirects=1)
        out = []
        for pg in (d.get("query") or {}).get("pages", []):
            ii = (pg.get("imageinfo") or [{}])[0]
            name = pg.get("title", "")[5:]
            mime = ii.get("mime", "")
            if mime not in ("image/jpeg", "image/png"):
                continue
            if ii.get("width", 0) < 640 or ii.get("height", 0) < 480:
                continue
            if JUNK.search(name):
                continue
            meta = ii.get("extmetadata") or {}
            lic = (meta.get("LicenseShortName") or {}).get("value", "")
            artist = re.sub(r"<[^>]+>", "", (meta.get("Artist") or {}).get("value", "")).strip()
            score = 0
            low = name.lower()
            for token in (prefer or title).lower().split():
                if len(token) > 3 and token in low:
                    score += 10
            if "portrait" in low or "portret" in low:
                score += 6
            if ii["width"] >= 1200:
                score += 2
            out.append({
                "name": name,
                "url": (ii.get("thumburl") or ii["url"]).split("?")[0],
                "width": ii.get("thumbwidth") or ii["width"],
                "height": ii.get("thumbheight") or ii["height"],
                "licence": lic or "see Wikimedia Commons",
                "artist": artist[:80],
                "score": score,
            })
        out.sort(key=lambda x: -x["score"])
        return out
    all_img = cached_json(f"img:{title}", go)
    return all_img[:want]


def lead_image(sums: dict) -> dict | None:
    """
    The article's own lead image.

    Ranking an article's file list by filename got the portrait right for
    Elizabeth I and wrong for Ashoka, whose best-scoring file was a map of
    his empire. The lead image is the one a human editor chose to put at the
    top, so it is the portrait by construction — use it first and let the
    scoring fill the rest.
    """
    for lang in ("en", "nl", "de", "fr"):
        s = sums.get(lang) or {}
        src = (s.get("originalimage") or {}).get("source") or (s.get("thumbnail") or {}).get("source")
        if not src:
            continue
        src = src.split("?")[0]
        if not src.lower().endswith((".jpg", ".jpeg", ".png")):
            continue
        # Ask Commons for a sensible rendering rather than the full plate.
        src = re.sub(r"/\d+px-([^/]+)$", r"/1280px-\1", src)
        return {"name": src.rsplit("/", 1)[-1], "url": src, "width": 0, "height": 0,
                "licence": "see Wikimedia Commons", "artist": "", "score": 999}
    return None


def with_lead(sums: dict, wiki_title: str, want: int, prefer: str = "") -> list[dict]:
    """Lead image first, then the best of the article's other files, deduplicated."""
    out = []
    lead = lead_image(sums)
    if lead:
        out.append(lead)
    seen = {o["url"].rsplit("/", 1)[-1].lower() for o in out}
    for im in article_images(wiki_title, want + 4, prefer=prefer):
        key = im["url"].rsplit("/", 1)[-1].lower()
        if key in seen:
            continue
        seen.add(key)
        out.append(im)
        if len(out) >= want:
            break
    return out[:want]


def rd_of(address: str):
    def go():
        r = S.get("https://api.pdok.nl/bzk/locatieserver/search/v3_1/free",
                  params={"q": address, "rows": 1, "fl": "weergavenaam,centroide_rd"},
                  timeout=30)
        r.raise_for_status()
        docs = r.json()["response"]["docs"]
        return docs[0] if docs else {}
    d = cached_json(f"rd:{address}", go)
    m = re.search(r"POINT\(([-\d.]+) ([-\d.]+)\)", d.get("centroide_rd", ""))
    if not m:
        return None, None
    return [float(m.group(1)), float(m.group(2))], d.get("weergavenaam", address)


# ============================================================ images

def encode(src: Path, dest: Path, edge: int) -> tuple[int, int] | None:
    """Re-encode to webp with the long edge capped. ffmpeg, per house preference."""
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        from PIL import Image
        with Image.open(dest) as im:
            return im.size
    from PIL import Image
    try:
        with Image.open(src) as im:
            w, h = im.size
    except Exception as e:
        log("   ! not an image:", src.name, e)
        return None
    scale = min(1.0, edge / max(w, h))
    ow, oh = max(1, round(w * scale)), max(1, round(h * scale))
    # even dimensions keep ffmpeg's scaler happy on every pixel format
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", str(src),
           "-vf", f"scale={ow}:{oh}:flags=lanczos", "-quality", str(WEBP_Q),
           str(dest)]
    r = subprocess.run(cmd, capture_output=True)
    if r.returncode != 0 or not dest.exists():
        log("   ! ffmpeg failed:", src.name, r.stderr.decode()[:160])
        return None
    return ow, oh


# ============================================================ documents

def make_pdf(path: Path, title: str, subtitle: str, paragraphs: list[str], footer: str):
    """
    A plain typeset document, because that is what the museum's own material
    is: somebody's article, printed. The table never shows a PDF viewer —
    WebView2 will not composite one inside the transformed stage — so these
    exist to be rasterised into page images, exactly as ContentScanner does
    with the real ones.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable

    ss = getSampleStyleSheet()
    h1 = ParagraphStyle("h1", parent=ss["Title"], fontName="Times-Bold",
                        fontSize=25, leading=29, alignment=0, spaceAfter=2)
    sub = ParagraphStyle("sub", parent=ss["Normal"], fontName="Times-Italic",
                         fontSize=12.5, leading=16, textColor=colors.HexColor("#6b6357"))
    body = ParagraphStyle("body", parent=ss["Normal"], fontName="Times-Roman",
                          fontSize=11.5, leading=17.5, spaceAfter=9,
                          textColor=colors.HexColor("#221f1a"))
    foot = ParagraphStyle("foot", parent=ss["Normal"], fontName="Helvetica",
                          fontSize=7.8, leading=11, textColor=colors.HexColor("#9a9186"))

    path.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(path), pagesize=A4,
                            leftMargin=24 * mm, rightMargin=24 * mm,
                            topMargin=22 * mm, bottomMargin=18 * mm,
                            title=title, author="The Lions Alliance")
    flow = [Paragraph(title, h1), Spacer(1, 3), Paragraph(subtitle, sub), Spacer(1, 9),
            HRFlowable(width="100%", thickness=0.7, color=colors.HexColor("#c9c1b4")),
            Spacer(1, 12)]
    for p in paragraphs:
        if p.strip():
            flow.append(Paragraph(p.strip(), body))
    flow += [Spacer(1, 14),
             HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#dcd5c8")),
             Spacer(1, 6), Paragraph(footer, foot)]
    doc.build(flow)


def rasterise(pdf: Path, dest: Path, edge: int) -> tuple[int, int] | None:
    """First page to webp — the same thing PdfRenderer does for the real table."""
    import fitz
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        from PIL import Image
        with Image.open(dest) as im:
            return im.size
    with fitz.open(pdf) as d:
        page = d[0]
        zoom = edge / max(page.rect.width, page.rect.height)
        pix = page.get_pixmap(matrix=fitz.Matrix(zoom, zoom), alpha=False)
        tmp = dest.with_suffix(".png")
        pix.save(tmp)
    size = encode(tmp, dest, edge)
    tmp.unlink(missing_ok=True)
    return size


def thumbnail_with_year(src: Path, dest: Path, year_label: str, caption: str) -> tuple[int, int] | None:
    """
    A timeline thumbnail with its year set into the corner.

    The real DeMediaTijdlijn thumbnails are designed plates with the year
    drawn on them. Composing one here keeps the rail reading as a timeline
    rather than as a row of unlabelled photographs.
    """
    from PIL import Image, ImageDraw, ImageFont
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists():
        with Image.open(dest) as im:
            return im.size

    W, H = 720, 960  # portrait plates, as on the real rail
    try:
        with Image.open(src) as im:
            im = im.convert("RGB")
            scale = max(W / im.width, H / im.height)
            im = im.resize((max(W, round(im.width * scale)), max(H, round(im.height * scale))),
                           Image.LANCZOS)
            left = (im.width - W) // 2
            top = (im.height - H) // 3   # bias upward: faces sit high
            plate = im.crop((left, top, left + W, top + H))
    except Exception as e:
        log("   ! thumbnail source unusable:", src, e)
        return None

    d = ImageDraw.Draw(plate, "RGBA")
    d.rectangle([0, H - 210, W, H], fill=(28, 24, 20, 205))

    def font(size, bold=False):
        for name in (("georgiab.ttf", "timesbd.ttf") if bold else ("georgia.ttf", "times.ttf")):
            try:
                return ImageFont.truetype(name, size)
            except Exception:
                continue
        return ImageFont.load_default()

    d.text((38, H - 168), year_label, font=font(74, True), fill=(255, 255, 255, 255))
    for i, line in enumerate(textwrap.wrap(caption, 30)[:2]):
        d.text((40, H - 78 + i * 30), line, font=font(24), fill=(228, 222, 210, 255))

    tmp = dest.with_suffix(".png")
    plate.save(tmp)
    size = encode(tmp, dest, THUMB_EDGE)
    tmp.unlink(missing_ok=True)
    return size


# ============================================================ build steps

def loc(nl="", en="", de="", fr=""):
    return {"nl": nl, "en": en or nl, "de": de or en or nl, "fr": fr or en or nl}


def paras(text: str) -> list[str]:
    return [p for p in re.split(r"\n{2,}|(?<=\.)\s{2,}", text or "") if p.strip()]


def html_body(text: str) -> str:
    return "".join(f"<p>{p.strip()}</p>" for p in paras(text) if p.strip())


def build_personen(skip_fetch: bool) -> dict:
    log("\n== Personen — ten monarchs ==")
    entities = []
    for eid, en_title, frm, to, realm in MONARCHS:
        log(f" · {en_title}")
        ll = langlinks(en_title)
        titles = {"en": en_title, **{l: ll.get(l, en_title) for l in LANGS if l != "en"}}
        sums = {l: summary(l, titles[l]) for l in LANGS}
        body = {l: html_body((sums[l] or {}).get("extract", "")) for l in LANGS}
        desc = {l: ((sums[l] or {}).get("description") or "") for l in LANGS}

        items = []
        imgs = with_lead(sums, en_title, 5, prefer=en_title)
        for n, im in enumerate(imgs):
            raw = cached_bytes(f"f:{im['url']}", im["url"])
            if not raw:
                continue
            out = CONTENT / "personen" / eid / f"beeld-{n + 1}.webp"
            size = encode(raw, out, LEAF_EDGE)
            if not size:
                continue
            credit = "Wikimedia Commons"
            if im["artist"]:
                credit += f" · {im['artist']}"
            if im["licence"]:
                credit += f" · {im['licence']}"
            items.append({
                "imagePath": f"content/personen/{eid}/beeld-{n + 1}.webp",
                "width": size[0], "height": size[1],
                "caption": loc(im["name"].rsplit(".", 1)[0].replace("_", " ")[:90]),
                "credit": credit[:120],
            })

        # Two documents per person, carrying the same text the panel shows —
        # a biography and a reign note. Rasterised, then dropped on the canvas
        # beside the photographs, which is how the museum's own PDFs behave.
        reign = f"r. {abs(frm)} {'BC' if frm < 0 else 'AD'} – {abs(to)} {'BC' if to < 0 else 'AD'}"
        docs = [
            ("biografie", f"{titles['nl']}", f"{realm} · {reign}",
             paras((sums["nl"] or {}).get("extract", "")) or paras((sums["en"] or {}).get("extract", ""))),
            ("regeerperiode", f"{titles['en']} — the reign", f"{realm} · {reign}",
             paras((sums["en"] or {}).get("extract", ""))),
        ]
        for slug, dt, ds, dp in docs:
            pdf = CONTENT / "personen" / eid / f"{slug}.pdf"
            make_pdf(pdf, dt, ds, dp,
                     "Demonstratiedocument · tekst: Wikipedia (CC BY-SA 4.0) · "
                     "opgemaakt voor de Medelotapps-demo van The Lions Alliance")
            page = CONTENT / "personen" / eid / f"{slug}-pagina-1.webp"
            size = rasterise(pdf, page, 1000)
            if not size:
                continue
            items.append({
                "imagePath": f"content/personen/{eid}/{slug}-pagina-1.webp",
                "pdfPath": f"content/personen/{eid}/{slug}.pdf",
                "width": size[0], "height": size[1],
                "caption": loc(f"{slug}.pdf", f"{slug}.pdf"),
                "credit": "Wikipedia · CC BY-SA 4.0",
            })

        hero = items[0] if items else None
        entities.append({
            "id": eid,
            "name": {l: titles[l] for l in LANGS},
            "subtitle": loc(
                f"{realm} · {reign}",
                f"{realm} · {reign}",
            ),
            "period": {"from": frm, "to": to},
            "bodyHtml": body,
            "facts": [
                {"key": "Rijk", "value": realm},
                {"key": "Regeerperiode", "value": reign},
            ],
            "document": {"title": f"{en_title} — Wikipedia",
                         "url": f"https://en.wikipedia.org/wiki/{en_title.replace(' ', '_')}"},
            "hero": {"url": hero["imagePath"], "width": hero["width"], "height": hero["height"]} if hero else None,
            "items": items,
            "media": [],
        })
        for l in LANGS:
            if desc[l]:
                entities[-1]["subtitle"][l] = f"{desc[l][:70]} · {reign}"

    return {"id": "personen", "name": "Personen", "type": "collection",
            "collection": entities, "warnings": []}


def build_tijdlijn(skip_fetch: bool) -> dict:
    log("\n== Tijdlijn — ten moments ==")
    entries = []
    for eid, year, wiki, caption in TIMELINE:
        log(f" · {year} {caption}")
        label = f"{abs(year)} {'v.Chr.' if year < 0 else ''}".strip()
        imgs = article_images(wiki, 4, prefer=wiki)
        items, thumb = [], None
        for n, im in enumerate(imgs):
            raw = cached_bytes(f"f:{im['url']}", im["url"])
            if not raw:
                continue
            out = CONTENT / "tijdlijn" / eid / f"beeld-{n + 1}.webp"
            size = encode(raw, out, LEAF_EDGE)
            if not size:
                continue
            if thumb is None:
                tpath = CONTENT / "tijdlijn" / eid / "plaat.webp"
                if thumbnail_with_year(raw, tpath, label, caption):
                    thumb = f"content/tijdlijn/{eid}/plaat.webp"
            credit = "Wikimedia Commons"
            if im["licence"]:
                credit += f" · {im['licence']}"
            items.append({
                "imagePath": f"content/tijdlijn/{eid}/beeld-{n + 1}.webp",
                "width": size[0], "height": size[1],
                "caption": loc(caption),
                "credit": credit[:120],
            })
            if len(items) >= 3:
                break
        if not items:
            continue
        entries.append({
            "id": eid,
            "title": f"{label} — {caption}",
            "thumbnail": thumb or items[0]["imagePath"],
            "items": items,
        })
    return {"id": "tijdlijn", "name": "Tijdlijn", "type": "timeline",
            "entries": entries, "warnings": []}


def build_kaart(skip_fetch: bool) -> dict:
    log("\n== Kaart — five places in Amsterdam ==")
    entities = []
    for eid, name, address, built, _to, wiki in PLACES:
        log(f" · {name}")
        rd, resolved = rd_of(address)
        if not rd:
            log("   ! no coordinate for", address)
        sums = {l: summary(l, wiki) for l in LANGS}
        body = {l: html_body((sums[l] or {}).get("extract", "")) for l in LANGS}

        items = []
        for n, im in enumerate(with_lead(sums, wiki, 3, prefer=name)):
            raw = cached_bytes(f"f:{im['url']}", im["url"])
            if not raw:
                continue
            out = CONTENT / "kaart" / eid / f"beeld-{n + 1}.webp"
            size = encode(raw, out, LEAF_EDGE)
            if not size:
                continue
            items.append({
                "imagePath": f"content/kaart/{eid}/beeld-{n + 1}.webp",
                "width": size[0], "height": size[1],
                "caption": loc(name),
                "credit": ("Wikimedia Commons · " + im["licence"])[:120],
            })

        hero = items[0] if items else None
        entities.append({
            "id": eid,
            "name": loc(name),
            "subtitle": loc(f"Amsterdam · vanaf {built}", f"Amsterdam · from {built}",
                            f"Amsterdam · ab {built}", f"Amsterdam · dès {built}"),
            "period": {"from": built, "to": None},
            "bodyHtml": body,
            "place": {"rd": rd, "precision": "exact" if rd else None,
                      "origin": f"PDOK locatieserver: {resolved}" if rd else None},
            "facts": [{"key": "Adres", "value": address}, {"key": "Gebouwd", "value": str(built)}],
            "hero": {"url": hero["imagePath"], "width": hero["width"], "height": hero["height"]} if hero else None,
            "items": items,
            "media": [],
        })

    lagen = CONTENT / "kaart" / "kaartlagen" / "lagen.json"
    maplayers = None
    if lagen.exists():
        maplayers = json.loads(lagen.read_text("utf-8"))
        maplayers["baseUrl"] = "content/kaart/kaartlagen"
    else:
        log("   ! no kaartlagen/lagen.json — run harvest_amsterdam.py; map opens without layers")

    out = {"id": "kaart", "name": "Kaart van Amsterdam", "type": "collection",
           "collection": entities, "warnings": []}
    if maplayers:
        out["mapLayers"] = maplayers
    return out


def build_verhalen(skip_fetch: bool) -> dict:
    log("\n== Verhalen — three films ==")
    entities = []
    for eid, ytid, title, series, year in STORIES:
        log(f" · {title}")
        poster_url = f"https://i.ytimg.com/vi/{ytid}/maxresdefault.jpg"
        raw = cached_bytes(f"yt:{ytid}", poster_url)
        if raw is None:
            raw = cached_bytes(f"yt-sd:{ytid}", f"https://i.ytimg.com/vi/{ytid}/hqdefault.jpg")
        hero = None
        if raw:
            out = CONTENT / "verhalen" / f"{eid}.webp"
            size = encode(raw, out, LEAF_EDGE)
            if size:
                hero = {"url": f"content/verhalen/{eid}.webp", "width": size[0], "height": size[1],
                        "credit": "© National Geographic"}
        entities.append({
            "id": eid,
            "name": loc(title),
            "subtitle": loc(f"{series} · National Geographic",),
            "period": {"from": year, "to": year},
            "bodyHtml": {l: (
                f"<p>Deze film wordt afgespeeld via YouTube en blijft eigendom van "
                f"National Geographic. In een echte opstelling staat hier het eigen "
                f"beeldmateriaal van het museum, met eigen hoofdstukmarkeringen.</p>"
                if l == "nl" else
                f"<p>This film plays through YouTube and remains National Geographic's. "
                f"In a real installation this is the venue's own footage, with its own "
                f"chapter marks.</p>") for l in LANGS},
            "archival": True,
            "youtube": ytid,
            "hero": hero,
            "items": [],
            "media": [],
            "chapters": [],
        })
    return {"id": "verhalen", "name": "Verhalen", "type": "collection",
            "collection": entities, "warnings": []}


def _plain(html: str) -> str:
    import html as _html
    text = _html.unescape(re.sub(r"<[^>]+>", " ", html or ""))
    text = re.sub(r"\s+", " ", text).strip()
    # Commons descriptions are often "English: ... Deutsch: ..." — keep the first.
    text = re.sub(r"^(English|Nederlands|Deutsch|Français)\s*:\s*", "", text, flags=re.I)
    text = re.split(r"\s(?:Nederlands|Deutsch|Français|Español)\s*:", text)[0]
    return text


def caption_from(desc: str) -> str:
    """
    The visitor-facing sentence buried in an archive's description.

    Every archive wraps its captions differently. Anefo (Nationaal Archief)
    prints a whole index card — "Collectie / Archief : … Beschrijving : …
    Datum : …" — and the caption is the Beschrijving. The Imperial War Museum
    prefixes "IWM caption :" and writes in capitals. The Library of Congress
    appends "Abstract/medium: …". None of that belongs on a photograph lying on
    a museum table.
    """
    t = desc or ""
    m = re.search(r"Beschrijving\s*:\s*(.+?)(?:\s+(?:Datum|Locatie|Trefwoorden|Fotograaf|Persoonsnaam|Instellingsnaam)\s*:|$)", t)
    if m:
        t = m.group(1)
    elif "Collectie / Archief" in t:
        m = re.search(r"(?:Reportage|Serie)\s*/?\s*(?:Serie)?\s*:\s*(.+?)(?:\s+\w+\s*:|$)", t)
        t = m.group(1) if m else ""
    t = re.sub(r"^\s*(IWM caption|Original caption|Title|Summary|Description|Caption)\s*:\s*", "", t, flags=re.I)
    t = re.sub(r"^\s*Wikipedia says\.?\s*", "", t, flags=re.I)
    t = re.sub(r"^\s*Objectgegevens\s+Titel\s*:\s*", "", t, flags=re.I)
    if re.match(r"^\s*(Tags\s*:|Bildet er hentet fra)", t, re.I):   # no caption in there at all
        return ""
    # IWM: "THE BATTLE OF X (DATES) Description: what is actually in the picture"
    m = re.search(r"\bDescription\s*:?\s+(.{20,})", t)
    if m:
        t = m.group(1)
    t = re.split(r"\s(?:(?:Abstract/medium|Photographer|Contributor Names|Notes)\s*:|Trefwoorden\b)", t)[0]
    t = re.sub(r"\s*\(from the documerica.*$", "", t, flags=re.I)   # NARA's exhibition note
    t = re.sub(r"^\s*\([^)]{0,400}\)\s*", "", t)        # a leading editorial aside
    t = t.strip(" \"'.;:-–")
    letters = [c for c in t if c.isalpha()]
    if letters and sum(c.isupper() for c in letters) / len(letters) > 0.6:
        t = t.lower()
        t = re.sub(r"(^|[.!?]\s+)([a-z])", lambda m: m.group(1) + m.group(2).upper(), t)
    return t


def year_from(dto: str, desc: str, name: str):
    """The photograph's own date field first; the prose only if that is empty.
    Descriptions are full of other years — a photographer's lifespan, a
    battle's — and the first one in the text is often not the photograph's."""
    for text in (dto, desc, name):
        m = re.search(r"\b(1[6-9]\d\d|20[0-2]\d)\b", text or "")
        if m:
            return int(m.group(1))
    return None


def _short(text: str, limit: int = 88) -> str:
    if len(text) <= limit:
        return text
    cut = text[:limit].rsplit(" ", 1)[0].rstrip(",;:.–- ")
    return cut + "…"


def _title_from_file(name: str) -> str:
    t = name.rsplit(".", 1)[0].replace("_", " ")
    t = re.sub(r"\s*-?\s*no-nb\b.*$", "", t)        # Nasjonalbiblioteket's accession tail
    t = re.sub(r"\((LOC|IWM)[^)]*\)|\bLOC\b|\b\d{5,}\w*\b|\bLCCN\w*|\b[a-z]{2,4}\d{4,}\w*", " ", t)
    return re.sub(r"\s+", " ", t).strip(" -–,")


def commons_category(cat: str) -> list[dict]:
    """
    Every freely licensed, large-enough, historical, non-graphic JPEG in a
    Commons category, with a clean caption and its year.

    The raw API answer is what gets cached; every judgement (licence, subject,
    date, caption) is made after the cache, so tightening a rule never needs a
    re-download and never leaves stale decisions baked into .cache/.
    """
    def go():
        d = requests.get("https://commons.wikimedia.org/w/api.php", headers=S.headers, timeout=60, params={
            "action": "query", "format": "json", "formatversion": "2",
            "generator": "categorymembers", "gcmtitle": "Category:" + cat,
            "gcmtype": "file", "gcmlimit": "100",
            "prop": "imageinfo", "iiprop": "url|size|mime|extmetadata", "iiurlwidth": "1280",
            "iiextmetadatafilter": "LicenseShortName|Artist|ImageDescription|DateTimeOriginal|ObjectName",
        }).json()
        return (d.get("query") or {}).get("pages", [])

    out = []
    for pg in cached_json(f"catraw:{cat}", go):
        ii = (pg.get("imageinfo") or [{}])[0]
        if ii.get("mime") != "image/jpeg":
            continue
        if max(ii.get("width", 0), ii.get("height", 0)) < 900:
            continue
        meta = ii.get("extmetadata") or {}
        val = lambda k: (meta.get(k) or {}).get("value", "")
        lic = _plain(val("LicenseShortName"))
        if not FREE_LICENCE.search(lic):
            continue
        name = pg.get("title", "")[5:]
        desc = _plain(val("ImageDescription")) or _plain(val("ObjectName"))
        if JUNK.search(name) or NOT_A_PHOTO.search(name + " " + desc):
            continue
        if GRAPHIC.search(name + " " + desc):
            continue
        year = year_from(_plain(val("DateTimeOriginal")), desc, name)
        if not year or year > LATEST_YEAR:
            continue
        caption = caption_from(desc)
        if len(caption) < 12:
            caption = _title_from_file(name)
        out.append({
            "name": name,
            "url": (ii.get("thumburl") or ii["url"]).split("?")[0],
            "licence": lic,
            "artist": _short(_plain(val("Artist")), 48),
            "caption": caption,
            "year": year,
        })
    return out


def spread(items: list, n: int) -> list:
    """n items evenly spaced through a list — neighbours in a category are usually one sequence."""
    if len(items) <= n:
        return items
    step = len(items) / n
    return [items[int(i * step + step / 2)] for i in range(n)]


def build_fotoarchief(skip_fetch: bool) -> dict:
    log("\n== Foto-archief — themed albums ==")
    albums, used = [], set()
    for aid, names, sources in PHOTO_ALBUMS:
        log(f" · {names['en']}")
        picked = []
        for cat, n in sources:
            pool = [p for p in commons_category(cat) if p["url"] not in used]
            got = spread(pool, n)
            if len(got) < n:
                log(f"   ! {cat}: only {len(got)} of {n}")
            picked += got
            used.update(p["url"] for p in got)

        items, years = [], []
        for k, p in enumerate(picked):
            raw = cached_bytes(f"f:{p['url']}", p["url"])
            if not raw:
                continue
            out = CONTENT / "fotoarchief" / aid / f"foto-{k + 1}.webp"
            size = encode(raw, out, LEAF_EDGE)
            if not size:
                continue
            text = _short(p["caption"])
            if p["year"]:
                years.append(p["year"])
                if not text.startswith(str(p["year"])):
                    text = f"{p['year']} · {text}"
            credit = "Wikimedia Commons"
            if p["artist"]:
                credit += f" · {p['artist']}"
            credit += f" · {p['licence']}"
            items.append({
                "imagePath": f"content/fotoarchief/{aid}/foto-{k + 1}.webp",
                "width": size[0], "height": size[1],
                # Plain strings, not {nl,en}: these are the source's own captions,
                # and a source keeps its words in every language — same rule the
                # product applies to `credit`.
                "caption": text,
                "credit": credit[:120],
            })

        if not items:
            continue
        # Chronological, so the throw reads left to right through time.
        items.sort(key=lambda it: int(re.match(r"(\d{4})", it["caption"]).group(1))
                   if re.match(r"\d{4}", it["caption"]) else 9999)
        frm, to = (min(years), max(years)) if years else (None, None)
        span = f"{frm}–{to}" if frm and to and frm != to else (str(frm) if frm else "")
        count = {"nl": f"{len(items)} foto's", "en": f"{len(items)} photographs",
                 "de": f"{len(items)} Fotos", "fr": f"{len(items)} photographies"}
        albums.append({
            "id": aid,
            "name": names,
            "subtitle": {l: f"{count[l]} · {span}" if span else count[l] for l in LANGS},
            "period": {"from": frm, "to": to} if frm else None,
            "hero": {"url": items[0]["imagePath"], "width": items[0]["width"], "height": items[0]["height"]},
            "items": items,
            "media": [],
        })
    return {"id": "fotoarchief", "name": "Foto-archief", "type": "collection",
            "collection": albums, "warnings": []}


def build_strings() -> dict:
    """
    Only the keys the demo has to say differently. Everything else — every
    button, every empty state, every date format — is the product's own and
    comes from hub/strings/.

    Two groups here. The `app.*` keys describe content that is not Medelo's,
    so they have to change. The `brand.*` / `home.*` keys are Medelo's name
    and Medelo's museum, and they have to change for a stronger reason: this
    page is public, and a demo that greets a stranger with "Museum Truijenhof
    — Meijel" is putting a client's identity on our sales material.
    """
    return {
        "nl": {
            "brand.venue": "Demo-opstelling",
            "app.photos.title": "Foto's <em>door de tijd</em>",
            "app.photos.lede": "{albums} albums, samen {photos} foto's uit vrij beschikbare archieven. Tik op een album en de foto's vallen op tafel.",
            "app.photos.sub": "Oorlog, landbouw, vooruitgang — per thema door de tijd",
            "period.bc": "v.Chr.",
            "home.title": "Dit is <em>Medelotapps</em>",
            "home.lede": "Dezelfde software die in Museum Medelo draait, hier gevuld met vrij materiaal. "
                         "Kies een tegel — alles werkt zoals op de tafel zelf.",
            "home.footer": "Medelotapps — demo van The Lions Alliance",
            "app.people.title": "Tien <em>vorsten</em>",
            "app.people.sub": "Tien vorsten, vier werelddelen",
            "app.timeline.title": "De geschiedenis <em>van de wereld</em>",
            "app.timeline.sub": "Tien momenten, 3200 v.Chr. tot nu",
            "app.stories.lede": "Films met hoofdstukken. Hier van National Geographic, via YouTube; "
                                "in uw museum uw eigen beeldmateriaal met uw eigen markeringen.",
            "storyplayer.documentNote": "Demonstratietekst — in uw museum staat hier uw eigen artikel",
            "app.map.eyebrow": "Kaart van Amsterdam",
            "app.map.label": "Kaart van Amsterdam",
            "app.map.title": "Kaart van Amsterdam",
            "app.map.lede": "Twee eeuwen Amsterdam op één plek: schuif door de kaartlagen en zie de stad veranderen.",
            "app.map.sub": "Vijf plekken binnen de grachtengordel",
            "app.people.eyebrow": "Personen",
            "app.people.label": "Personen",
            "app.people.title": "Personen",
            "app.people.lede": "Tien vorsten uit zesduizend jaar. Pak de foto's en documenten op en leg ze naast elkaar.",
            "app.people.sub": "Tien vorsten, vier werelddelen",
            "app.timeline.eyebrow": "Tijdlijn",
            "app.timeline.label": "Tijdlijn",
            "app.timeline.title": "Tijdlijn van de wereld",
            "app.timeline.lede": "Tien momenten die de wereld veranderden.",
            "app.timeline.sub": "Tien momenten, 3200 v.Chr. tot nu",
            "app.stories.eyebrow": "Verhalen",
            "app.stories.label": "Verhalen",
            "app.stories.title": "Verhalen",
            "app.stories.lede": "Films met hoofdstukken. Hier van National Geographic; in uw museum uw eigen beeld.",
            "app.stories.sub": "Drie films",
        },
        "en": {
            "brand.venue": "Demonstration table",
            "app.photos.title": "Photographs <em>through time</em>",
            "app.photos.lede": "{albums} albums, {photos} photographs from freely licensed archives. Tap an album and its photographs land on the table.",
            "app.photos.sub": "War, farming, progress — each theme through time",
            "period.bc": "BC",
            "home.title": "This is <em>Medelotapps</em>",
            "home.lede": "The same software running at Museum Medelo, filled here with freely "
                         "licensed material. Pick a tile — everything works as it does on the table.",
            "home.footer": "Medelotapps — a demo by The Lions Alliance",
            "app.people.title": "Ten <em>monarchs</em>",
            "app.people.sub": "Ten monarchs, four continents",
            "app.timeline.title": "A history <em>of the world</em>",
            "app.timeline.sub": "Ten moments, 3200 BC to now",
            "app.stories.lede": "Films with chapter marks. National Geographic's here, through YouTube; "
                                "in your museum your own footage with your own marks.",
            "storyplayer.documentNote": "Demonstration text — your own article stands here in your museum",
            "app.map.eyebrow": "Map of Amsterdam",
            "app.map.label": "Map of Amsterdam",
            "app.map.title": "Map of Amsterdam",
            "app.map.lede": "Two centuries of Amsterdam in one place: slide through the map editions and watch the city change.",
            "app.map.sub": "Five places inside the canal belt",
            "app.people.eyebrow": "People",
            "app.people.label": "People",
            "app.people.title": "People",
            "app.people.lede": "Ten monarchs across six thousand years. Pick the photographs and documents up and lay them side by side.",
            "app.people.sub": "Ten monarchs, four continents",
            "app.timeline.eyebrow": "Timeline",
            "app.timeline.label": "Timeline",
            "app.timeline.title": "A timeline of the world",
            "app.timeline.lede": "Ten moments that changed the world.",
            "app.timeline.sub": "Ten moments, 3200 BC to now",
            "app.stories.eyebrow": "Stories",
            "app.stories.label": "Stories",
            "app.stories.title": "Stories",
            "app.stories.lede": "Films with chapter marks. National Geographic's here; your own footage in your museum.",
            "app.stories.sub": "Three films",
        },
        "de": {
            "brand.venue": "Demo-Tisch",
            "app.photos.title": "Fotos <em>durch die Zeit</em>",
            "app.photos.lede": "{albums} Alben, {photos} Fotos aus frei lizenzierten Archiven. Tippen Sie auf ein Album, und die Fotos landen auf dem Tisch.",
            "app.photos.sub": "Krieg, Landwirtschaft, Fortschritt — jedes Thema durch die Zeit",
            "period.bc": "v. Chr.",
            "home.title": "Das ist <em>Medelotapps</em>",
            "home.lede": "Dieselbe Software, die im Museum Medelo läuft, hier mit frei "
                         "lizenziertem Material gefüllt. Wählen Sie eine Kachel.",
            "home.footer": "Medelotapps — eine Demo von The Lions Alliance",
            "app.map.eyebrow": "Karte von Amsterdam",
            "app.map.label": "Karte von Amsterdam",
            "app.map.title": "Karte von Amsterdam",
            "app.map.lede": "Zwei Jahrhunderte Amsterdam an einem Ort: Schieben Sie durch die "
                            "Kartenausgaben und sehen Sie die Stadt wachsen.",
            "app.map.sub": "Fünf Orte im Grachtengürtel",
            "app.people.label": "Personen",
            "app.people.title": "Zehn <em>Herrscher</em>",
            "app.people.lede": "Zehn Herrscher aus sechstausend Jahren. Nehmen Sie die Fotos und "
                               "Dokumente auf und legen Sie sie nebeneinander.",
            "app.people.sub": "Zehn Herrscher, vier Kontinente",
            "app.timeline.label": "Zeitleiste",
            "app.timeline.title": "Eine Geschichte <em>der Welt</em>",
            "app.timeline.lede": "Zehn Momente, die die Welt verändert haben.",
            "app.timeline.sub": "Zehn Momente, 3200 v. Chr. bis heute",
            "app.stories.label": "Geschichten",
            "app.stories.title": "Geschichten",
            "app.stories.lede": "Filme mit Kapitelmarken. Hier von National Geographic über YouTube; "
                                "in Ihrem Museum Ihr eigenes Material.",
            "app.stories.sub": "Drei Filme",
            "storyplayer.documentNote": "Demonstrationstext — in Ihrem Museum steht hier Ihr eigener Artikel",
        },
        "fr": {
            "brand.venue": "Table de démonstration",
            "app.photos.title": "Photographies <em>à travers le temps</em>",
            "app.photos.lede": "{albums} albums, {photos} photographies d'archives libres de droits. Touchez un album et ses photos se posent sur la table.",
            "app.photos.sub": "Guerre, agriculture, progrès — chaque thème à travers le temps",
            "period.bc": "av. J.-C.",
            "home.title": "Voici <em>Medelotapps</em>",
            "home.lede": "Le logiciel qui tourne au Museum Medelo, rempli ici de contenus "
                         "libres de droits. Choisissez une tuile.",
            "home.footer": "Medelotapps — une démo de The Lions Alliance",
            "app.map.eyebrow": "Carte d'Amsterdam",
            "app.map.label": "Carte d'Amsterdam",
            "app.map.title": "Carte d'Amsterdam",
            "app.map.lede": "Deux siècles d'Amsterdam au même endroit : faites glisser les éditions "
                            "de la carte et voyez la ville changer.",
            "app.map.sub": "Cinq lieux dans la ceinture de canaux",
            "app.people.label": "Personnages",
            "app.people.title": "Dix <em>souverains</em>",
            "app.people.lede": "Dix souverains sur six mille ans. Saisissez les photographies et les "
                               "documents et posez-les côte à côte.",
            "app.people.sub": "Dix souverains, quatre continents",
            "app.timeline.label": "Chronologie",
            "app.timeline.title": "Une histoire <em>du monde</em>",
            "app.timeline.lede": "Dix moments qui ont changé le monde.",
            "app.timeline.sub": "Dix moments, de 3200 av. J.-C. à nos jours",
            "app.stories.label": "Récits",
            "app.stories.title": "Récits",
            "app.stories.lede": "Des films avec chapitres. Ici National Geographic, via YouTube ; "
                                "dans votre musée, vos propres images.",
            "app.stories.sub": "Trois films",
            "storyplayer.documentNote": "Texte de démonstration — votre propre article figure ici dans votre musée",
        },
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--skip-fetch", action="store_true",
                    help="re-emit the manifest from the cache without new downloads")
    ap.add_argument("--only", default="", help="personen,tijdlijn,kaart,verhalen,fotoarchief")
    args = ap.parse_args()

    CACHE.mkdir(parents=True, exist_ok=True)
    DEMO.mkdir(parents=True, exist_ok=True)

    want = set(filter(None, args.only.split(","))) or {"personen", "tijdlijn", "kaart", "verhalen", "fotoarchief"}
    existing = {}
    mf = DEMO / "manifest.json"
    if mf.exists():
        existing = {c["id"]: c for c in json.loads(mf.read_text("utf-8")).get("components", [])}

    builders = {
        "tijdlijn": build_tijdlijn,
        "fotoarchief": build_fotoarchief,
        "verhalen": build_verhalen,
        "kaart": build_kaart,
        "personen": build_personen,
    }
    components = []
    for cid in ("tijdlijn", "fotoarchief", "verhalen", "kaart", "personen"):
        if cid in want:
            components.append(builders[cid](args.skip_fetch))
        elif cid in existing:
            components.append(existing[cid])
    components.append({"id": "homescreen", "name": "homescreen", "type": "assets", "warnings": []})

    mf.write_text(json.dumps({"components": components}, ensure_ascii=False, indent=1), "utf-8")
    (DEMO / "strings.json").write_text(
        json.dumps(build_strings(), ensure_ascii=False, indent=1), "utf-8")

    total = sum(f.stat().st_size for f in PUBLIC.rglob("*") if f.is_file())
    log(f"\nmanifest → {mf}")
    log(f"demo total: {total / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
