"""For every site with a Wikipedia article, fetch its lead image (PageImages returns free-licensed files only),
read author and licence from Commons, and download a 1280px rendition."""
import html, json, os, re, sys, time, urllib.parse, urllib.request

SITES, OUT = sys.argv[1], sys.argv[2]
UA = "TirthaPilgrimageApp/0.2 (personal project; photo build script)"
os.makedirs(f"{OUT}/raw", exist_ok=True)


def get(url, binary=False):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    for wait in (0, 5, 15, 30, 60, 90):
        time.sleep(wait)
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read() if binary else json.load(r)
        except urllib.error.HTTPError as e:
            if e.code not in (429, 503):
                raise
    raise RuntimeError("rate limited: " + url)


def api(host, **p):
    p.update(format="json", formatversion="2")
    return get(f"https://{host}/w/api.php?" + urllib.parse.urlencode(p))


data = json.load(open(SITES, encoding="utf8"))
sites = [s for k in ("jyotirlinga", "shakti", "dham", "divya") for s in data[k] if s.get("wiki") and not s.get("celestial")]
titles = sorted({s["wiki"] for s in sites})

# 1. lead image per article
lead = {}
for i in range(0, len(titles), 20):
    chunk = titles[i:i + 20]
    q = api("en.wikipedia.org", action="query", titles="|".join(chunk), prop="pageimages", piprop="name", redirects=1)["query"]
    alias = {r["from"]: r["to"] for r in q.get("normalized", []) + q.get("redirects", [])}
    names = {p["title"]: p.get("pageimage") for p in q.get("pages", [])}
    for t in chunk:
        u = t
        for _ in range(3):
            u = alias.get(u, u)
        lead[t] = names.get(u)
    time.sleep(1)

# 2. licence, author, rendition URL from Commons
files = sorted({f for f in lead.values() if f})
meta = {}
for i in range(0, len(files), 20):
    chunk = files[i:i + 20]
    q = api("commons.wikimedia.org", action="query", titles="|".join("File:" + f for f in chunk), prop="imageinfo",
            iiprop="url|extmetadata|size", iiurlwidth=1280)["query"]
    norm = {r["to"]: r["from"] for r in q.get("normalized", [])}
    for p in q.get("pages", []):
        ii = (p.get("imageinfo") or [None])[0]
        if not ii:
            continue
        em = ii.get("extmetadata", {})
        val = lambda k: re.sub(r"<[^>]+>", "", html.unescape(em.get(k, {}).get("value", ""))).strip()
        name = norm.get(p["title"], p["title"])[5:]
        meta[name] = dict(file=name, thumb=ii.get("thumburl"), w=ii.get("width"), h=ii.get("height"), page=ii.get("descriptionurl"),
                          artist=re.sub(r"\s+", " ", val("Artist"))[:120], license=val("LicenseShortName"),
                          licenseUrl=em.get("LicenseUrl", {}).get("value", ""), free=val("NonFree") == "")
    time.sleep(1)

# 3. download
out = {}
for s in sites:
    f = lead.get(s["wiki"])
    m = meta.get(f) if f else None
    if not m or not m["thumb"] or not m["free"]:
        continue
    ext = os.path.splitext(m["thumb"])[1].lower() or ".jpg"
    path = f"{OUT}/raw/{s['id']}{ext}"
    if not os.path.exists(path):
        open(path, "wb").write(get(m["thumb"], binary=True))
        time.sleep(0.8)
    out[s["id"]] = dict(m, raw=path)

json.dump(out, open(f"{OUT}/photos_meta.json", "w", encoding="utf8"), ensure_ascii=False, indent=1)
print("sites with articles", len(sites), "with free lead image", len(out), "distinct files", len({v["file"] for v in out.values()}))
print("no image:", [s["id"] for s in sites if s["id"] not in out])
