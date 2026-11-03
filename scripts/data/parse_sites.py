import json, re, sys, time, urllib.request, urllib.parse

D = sys.argv[1]
UA = "TirthaPilgrimageApp/0.1 (personal project; data build script)"

def wt(name):
    return open(f"{D}/{name}.txt", encoding="utf8").read()

def strip_refs(s):
    s = re.sub(r"<ref[^>/]*/>", "", s)
    s = re.sub(r"<ref[^>]*>.*?</ref>", "", s, flags=re.S)
    return s

def strip_templates(s):
    # keep IAST / lang text, drop the rest
    s = re.sub(r"\{\{IAST\|([^{}]*)\}\}", r"\1", s)
    s = re.sub(r"\{\{(?:lang|Langx)\|[^|{}]*\|([^{}|]*)[^{}]*\}\}", r"\1", s)
    prev = None
    while prev != s:
        prev = s
        s = re.sub(r"\{\{[^{}]*\}\}", "", s)
    return s

def first_link(s):
    m = re.search(r"\[\[(?!File:|Image:)([^\]|#]+)", s)
    return m.group(1).strip() if m else None

def clean(s):
    s = strip_refs(s)
    s = re.sub(r"\[\[(?:File|Image):[^\[\]]*(?:\[\[[^\]]*\]\][^\[\]]*)*\]\]", "", s)
    s = strip_templates(s)
    s = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"\[\[([^\]]*)\]\]", r"\1", s)
    s = re.sub(r"<br\s*/?>", ", ", s)
    s = re.sub(r"</?(small|sup|sub|span|b|i)[^>]*>", "", s)
    s = s.replace("'''", "").replace("''", "")
    s = re.sub(r"\s+", " ", s).strip(" ,;")
    s = re.sub(r"\s+([,.;])", r"\1", s)
    s = re.sub(r",\s*,", ",", s)
    return s

def table_after(text, start_marker):
    i = text.index(start_marker)
    j = text.index("\n|}", i)
    return text[i:j]

def rows(table):
    parts = re.split(r"\n\|-[^\n]*", table)[1:]
    out = []
    for p in parts:
        cells = []
        for line in p.strip("\n").split("\n"):
            if line.startswith("!") or line.startswith("|"):
                body = line[1:]
                for c in re.split(r"\|\||!!", body):
                    cells.append(c)
            elif cells:
                cells[-1] += "\n" + line
        out.append(cells)
    return out

# ---------- Jyotirlinga ----------
jt = table_after(wt("Jyotirlinga"), '{| class="wikitable sortable" style="width: 100%;"')
jyoti = []
for c in rows(jt):
    if len(c) < 6:
        continue
    jyoti.append(dict(n=int(clean(c[0])), name=clean(c[1]), link=first_link(c[1]),
                      state=clean(c[3]), place=clean(c[4]), about=clean(c[5])))

# ---------- Shakti Peetha (all 51) ----------
st = table_after(wt("Shakti_Peetha"), '{| class="wikitable sortable" border="1"')
shakti = []
for c in rows(st):
    if len(c) < 6:
        continue
    shakti.append(dict(n=int(re.sub(r"\D", "", clean(c[0])) or 0), place=clean(c[1]), link=first_link(c[1]),
                       state=clean(c[2]), part=clean(c[3]), shakti=clean(c[4]), bhairava=clean(c[5])))

# ---------- Divya Desam ----------
dt = table_after(wt("Divya_Desam"), "{| class=wikitable sortable")
divya = []
for c in rows(dt):
    if len(c) < 5:
        continue
    loc_raw = c[2]
    m = re.search(r"\{\{coord\|\s*([-\d.]+)\s*\|\s*([-\d.]+)", loc_raw, re.I)
    divya.append(dict(n=int(re.sub(r"\D", "", clean(c[0])) or 0), name=clean(c[1]), link=first_link(c[1]),
                      place=clean(loc_raw), lat=float(m.group(1)) if m else None, lon=float(m.group(2)) if m else None,
                      deities=clean(c[4]), about=clean(c[5]) if len(c) > 5 else ""))

# ---------- Char Dham (Bada) ----------
dham = [
    dict(n=1, name="Badrinath", link="Badrinath Temple", state="Uttarakhand", place="Badrinath", dir="North"),
    dict(n=2, name="Dwarka", link="Dwarkadhish Temple", state="Gujarat", place="Dwarka", dir="West"),
    dict(n=3, name="Puri", link="Jagannath Temple, Puri", state="Odisha", place="Puri", dir="East"),
    dict(n=4, name="Rameswaram", link="Ramanathaswamy Temple", state="Tamil Nadu", place="Rameswaram", dir="South"),
]

# ---------- Wikipedia API: coords + Hindi/Tamil titles + extracts for dham ----------
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

def lookup(titles, lang):
    info = {}
    titles = sorted({t for t in titles if t})
    for k in range(0, len(titles), 20):
        chunk = titles[k:k + 20]
        d = api(dict(action="query", titles="|".join(chunk), prop="coordinates|langlinks",
                     lllang=lang, lllimit="max", colimit="max"))
        q = d["query"]
        alias = {}
        for r in q.get("normalized", []) + q.get("redirects", []):
            alias[r["from"]] = r["to"]
        bypage = {}
        for p in q.get("pages", []):
            co = (p.get("coordinates") or [None])[0]
            ll = (p.get("langlinks") or [None])[0]
            bypage[p["title"]] = dict(lat=co and co["lat"], lon=co and co["lon"], local=ll and ll["title"])
        for t in chunk:
            u = t
            for _ in range(3):
                u = alias.get(u, u)
            info[t] = bypage.get(u, {})
        time.sleep(1.5)
    return info

hi = lookup([s["link"] for s in jyoti + shakti + dham], "hi")
ta = lookup([s["link"] for s in divya], "ta")
d = api(dict(action="query", titles="|".join(x["link"] for x in dham), prop="extracts", exintro="1", explaintext="1"))
ext = {p["title"]: p.get("extract", "") for p in d["query"]["pages"]}
alias = {r["from"]: r["to"] for r in d["query"].get("redirects", []) + d["query"].get("normalized", [])}

for s in jyoti + shakti + dham:
    i = hi.get(s["link"], {})
    s["lat"], s["lon"], s["local"] = i.get("lat"), i.get("lon"), i.get("local")
for s in dham:
    s["about"] = ext.get(alias.get(s["link"], s["link"]), "").split("\n")[0]
for s in divya:
    i = ta.get(s["link"], {})
    s["local"] = i.get("local")
    if s["lat"] is None:
        s["lat"], s["lon"] = i.get("lat"), i.get("lon")

out = dict(jyotirlinga=jyoti, shakti=shakti, divya=divya, dham=dham)
json.dump(out, open(f"{D}/sites_raw.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
for k, v in out.items():
    miss = [f'{s["n"]}:{s.get("link")}' for s in v if s.get("lat") is None]
    nol = sum(1 for s in v if not s.get("local"))
    print(k, len(v), "missing coords:", len(miss), miss[:60], "no local name:", nol)
