"""Merge parsed Wikipedia data into the app's sites.json.
Sources: en.wikipedia Jyotirlinga, Shakti Peetha, Divya Desam, Char Dham; hi.wikipedia ज्योतिर्लिंग and
साँचा:इक्यावन शक्तिपीठ (Tantra Chudamani list of 51). Coordinates from the Wikipedia articles each row links to."""
import json, math, re, sys, time, urllib.request, urllib.parse

D, OUT = sys.argv[1], sys.argv[2]
UA = "TirthaPilgrimageApp/0.1 (personal project; data build script)"
raw = json.load(open(f"{D}/sites_raw.json", encoding="utf8"))


def api(params):
    params.update(format="json", formatversion="2", redirects="1")
    url = "https://en.wikipedia.org/w/api.php?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (0, 5, 15, 30, 60):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
    raise RuntimeError("rate limited")


def coords(titles):
    out = {}
    titles = sorted({t for t in titles if t})
    for k in range(0, len(titles), 20):
        chunk = titles[k:k + 20]
        q = api(dict(action="query", titles="|".join(chunk), prop="coordinates", colimit="max"))["query"]
        alias = {r["from"]: r["to"] for r in q.get("normalized", []) + q.get("redirects", [])}
        pages = {p["title"]: (p.get("coordinates") or [None])[0] for p in q.get("pages", [])}
        for t in chunk:
            u = t
            for _ in range(3):
                u = alias.get(u, u)
            c = pages.get(u)
            out[t] = (round(c["lat"], 5), round(c["lon"], 5)) if c else None
        time.sleep(1.5)
    return out


def clean(s):
    s = re.sub(r"<ref[^>/]*/>|<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    s = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[\[([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"<br\s*/?>", " ", s)
    return re.sub(r"\s+", " ", s).strip(" ,")


def km(a, b):
    if not a or not b:
        return 0
    la1, lo1, la2, lo2 = map(math.radians, (*a, *b))
    h = math.sin((la2 - la1) / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin((lo2 - lo1) / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


# ---------- Hindi 51 list ----------
t = open(f"{D}/hi_shakti51.txt", encoding="utf8").read()
hi51 = []
for part in t.split("\n|-")[1:]:
    cells = [clean(c[1:]) for c in part.strip().split("\n") if c.startswith("|") and not c.startswith("|}")]
    if len(cells) >= 5:
        hi51.append(dict(n=int(cells[0]), place=cells[1], part=cells[2], shakti=cells[3], bhairava=cells[4]))
assert len(hi51) == 51, len(hi51)

en = {s["n"]: s for s in raw["shakti"]}
# Hindi list number -> English "all Shakti Pith" row number (matched on place, body part, Shakti and Bhairava).
# None = no row in the English table; extra = article title used for coordinates; note = shown in the app.
M = {
    1: dict(e=13, extra="Hingol National Park", approx=True), 2: dict(e=36, note="The Tantra Chudamani names Sharkarare near Sukkur, Pakistan; Naina Devi in Bilaspur, Himachal Pradesh is the shrine widely worshipped as this pitha."),
    3: dict(e=40), 4: dict(e=1), 5: dict(e=28), 6: dict(e=47), 7: dict(e=52), 8: dict(e=10), 9: dict(e=22),
    10: dict(e=7), 11: dict(e=11), 12: dict(e=3), 13: dict(e=42, extra="Guskara", approx=True), 14: dict(e=41, extra="Udaipur, Tripura", approx=True),
    15: dict(e=67), 16: dict(e=21), 17: dict(e=15), 18: dict(e=50), 19: dict(e=14), 20: dict(e=31, extra="Prayagraj", approx=True),
    21: dict(e=26, note="The Tantra Chudamani places Jayanti in the Jaintia hills of Sylhet; the shrine at Nartiang, Meghalaya is worshipped as this pitha."),
    22: dict(e=19), 23: dict(e=43), 24: dict(e=17, extra="Kanyakumari", approx=True), 25: dict(e=32), 26: dict(e=24), 27: dict(e=58), 28: dict(e=16),
    29: dict(e=None, en="Kalmadhav, cave on the Son river, Amarkantak", state="Madhya Pradesh", part="Left buttock", extra="Amarkantak", approx=True),
    30: dict(e=37, extra="Amarkantak", force=True, approx=True),
    31: dict(e=None, en="Ramgiri, Chitrakoot", state="Uttar Pradesh", part="Right breast", extra="Chitrakoot Dham", approx=True),
    32: dict(e=46), 33: dict(e=39), 34: dict(e=29, unknown=True, note="The Tantra Chudamani gives no known location for Panchsagar; some identify it with Champawat in Uttarakhand."),
    35: dict(e=6), 36: dict(e=38, note="The Tantra Chudamani names Shri Parvat in Ladakh; Srisailam in Andhra Pradesh is the other identification and is shown on the map."),
    37: dict(e=44), 38: dict(e=30), 39: dict(e=56), 40: dict(e=12),
    41: dict(e=None, en="Sarvashail, Kotilingeswara temple on the Godavari, Rajahmundry", state="Andhra Pradesh", part="Cheek", extra="Rajahmundry", approx=True),
    42: dict(e=45), 43: dict(e=20), 44: dict(e=8, extra="Janakpur", approx=True), 45: dict(e=55, extra="Nalhati", approx=True),
    46: dict(e=69, note="The Tantra Chudamani gives no known location for Karnat; the Jnanakshi Rajarajeshwari temple in Bengaluru is a recent identification."),
    47: dict(e=4), 48: dict(e=27), 49: dict(e=2), 50: dict(e=34),
    51: dict(e=25, note="The Tantra Chudamani says Lanka, exact place unknown; Nainativu in Sri Lanka is the shrine worshipped as this pitha. Another view places it at Trincomalee."),
}
extra = coords([m["extra"] for m in M.values() if m.get("extra")] + ["Kedarnath"])
print("extra coords:", {k: v for k, v in extra.items()})

shakti = []
for h in hi51:
    m = M[h["n"]]
    e = en.get(m["e"]) if m["e"] else None
    ll = None if m.get("unknown") else ((e["lat"], e["lon"]) if e and e.get("lat") is not None and not m.get("force") else extra.get(m.get("extra")))
    name_en = m.get("en") or re.sub(r"\s*\(.*?\)\s*", " ", e["place"]).strip(" ,.")
    shakti.append(dict(
        id=f"sp-{h['n']:02d}", n=h["n"], name=name_en.split(",")[0].strip(), place=name_en, local=h["place"],
        state=m.get("state") or (e and e["state"]), part=m.get("part") or (e and e["part"]),
        shakti=e["shakti"] if e else None, bhairava=e["bhairava"] if e else None,
        localShakti=h["shakti"], localBhairava=h["bhairava"], localPart=h["part"],
        lat=ll and ll[0], lon=ll and ll[1], approx=bool(m.get("approx")), note=m.get("note"), wiki=e and e["link"],
    ))

# ---------- Jyotirlinga ----------
hi_j = {1: "सोमनाथ", 2: "मल्लिकार्जुन", 3: "महाकालेश्वर", 4: "ओंकारेश्वर", 5: "वैद्यनाथ", 6: "भीमशंकर", 7: "रामेश्वर",
        8: "नागेश्वर", 9: "काशी विश्वनाथ", 10: "त्र्यम्बकेश्वर", 11: "केदारनाथ", 12: "घुश्मेश्वर"}
jyoti = []
for s in raw["jyotirlinga"]:
    ll = (s["lat"], s["lon"]) if s["lat"] is not None else extra["Kedarnath"]
    jyoti.append(dict(id=f"jl-{s['n']:02d}", n=s["n"], name=s["name"], place=s["place"], state=s["state"], local=hi_j[s["n"]],
                      lat=round(ll[0], 5), lon=round(ll[1], 5), wiki=s["link"]))

# ---------- Char Dham ----------
dham = [dict(id=f"cd-{s['n']}", n=s["n"], name=s["name"], place=s["place"], state=s["state"], dir=s["dir"],
             local=re.sub(r",.*", "", s["local"]).replace("श्री ", ""), lat=round(s["lat"], 5), lon=round(s["lon"], 5), wiki=s["link"])
        for s in raw["dham"]]

# ---------- Divya Desam ----------
fixn = {320: 20, 234: 34}
rows = [dict(s, n=fixn.get(s["n"], s["n"])) for s in raw["divya"] if s["n"] and s["link"]]
apic = coords([s["link"] for s in rows])
divya = []
for s in rows:
    table = (s["lat"], s["lon"]) if s["lat"] is not None else None
    art = None if s["n"] == 21 else apic.get(s["link"])  # article point for 21 is Thirunangur, not Nathan Kovil
    ll = art or table
    if art and table and km(art, table) > 15:
        print(f"divya {s['n']} {s['link']}: table {table} vs article {art} -> article")
    celestial = s["n"] in (107, 108)
    divya.append(dict(id=f"dd-{s['n']:03d}", n=s["n"], name=s["name"], place=s["place"], deities=s["deities"],
                      local=s["local"], localScript="ta", lat=None if celestial else ll and ll[0],
                      lon=None if celestial else ll and ll[1], celestial=celestial, approx=not celestial and art is None, wiki=s["link"]))
divya.sort(key=lambda s: s["n"])
assert [s["n"] for s in divya] == list(range(1, 109)), [s["n"] for s in divya]

# shared-coordinate check (identical points across different articles usually means a copied value)
seen = {}
for s in divya:
    if s["lat"] is not None:
        seen.setdefault((s["lat"], s["lon"]), []).append(s["n"])
print("divya shared points:", {k: v for k, v in seen.items() if len(v) > 1})
print("missing:", [s["id"] for s in jyoti + dham + shakti + divya if s["lat"] is None])

json.dump(dict(jyotirlinga=jyoti, shakti=shakti, dham=dham, divya=divya), open(OUT, "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("counts", len(jyoti), len(shakti), len(dham), len(divya))
