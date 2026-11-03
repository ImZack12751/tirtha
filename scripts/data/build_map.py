"""Builds Tirtha's own map of India from Natural Earth (public domain, India point-of-view boundaries).
Lambert conformal conic projection, clipped to the region the temples span, simplified for the web.
Output: map.json with SVG path data, label points and every temple's projected position."""
import json, math, sys

G, SITES, OUT = sys.argv[1:4]
BOX = (50.0, -4.0, 110.0, 44.0)  # wide margin of neighbouring land and sea around the temples  # lon/lat window: Hinglaj in the west to Myanmar, Sri Lanka to Ladakh
P1, P2, P0, L0 = map(math.radians, (12, 28, 22, 80))
n = math.log(math.cos(P1) / math.cos(P2)) / math.log(math.tan(math.pi / 4 + P2 / 2) / math.tan(math.pi / 4 + P1 / 2))
F = math.cos(P1) * math.tan(math.pi / 4 + P1 / 2) ** n / n
rho0 = F / math.tan(math.pi / 4 + P0 / 2) ** n


def lcc(lon, lat):
    rho = F / math.tan(math.pi / 4 + math.radians(lat) / 2) ** n
    t = n * (math.radians(lon) - L0)
    return rho * math.sin(t), -(rho0 - rho * math.cos(t))  # y grows downward for SVG


# fit the window into a 1000-unit-wide canvas
edge = [(BOX[0] + (BOX[2] - BOX[0]) * i / 40, BOX[1]) for i in range(41)] + [(BOX[0] + (BOX[2] - BOX[0]) * i / 40, BOX[3]) for i in range(41)] \
     + [(BOX[0], BOX[1] + (BOX[3] - BOX[1]) * i / 40) for i in range(41)] + [(BOX[2], BOX[1] + (BOX[3] - BOX[1]) * i / 40) for i in range(41)]
pts = [lcc(*p) for p in edge]
minx, maxx = min(p[0] for p in pts), max(p[0] for p in pts)
miny, maxy = min(p[1] for p in pts), max(p[1] for p in pts)
W = 1000.0
S = W / (maxx - minx)
H = (maxy - miny) * S
WIDE = (38.0, -14.0, 122.0, 54.0)  # generous pre-clip so the projection stays well-behaved
proj = lambda lon, lat: ((lcc(lon, lat)[0] - minx) * S, (lcc(lon, lat)[1] - miny) * S)


def clip(ring, box):
    """Sutherland-Hodgman against an axis-aligned box (lon/lat or projected)."""
    def cut(pts, inside, inter):
        out = []
        for i, cur in enumerate(pts):
            prev = pts[i - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(inter(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(inter(prev, cur))
        return out
    lerp = lambda a, b, t: (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    pts = ring
    for k, v, keep_ge in ((0, box[0], True), (0, box[2], False), (1, box[1], True), (1, box[3], False)):
        if not pts:
            break
        pts = cut(pts, (lambda p, k=k, v=v, g=keep_ge: p[k] >= v if g else p[k] <= v),
                  (lambda a, b, k=k, v=v: lerp(a, b, (v - a[k]) / (b[k] - a[k]))))
    return pts


def rdp(pts, tol):
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        L = math.hypot(dx, dy) or 1e-9
        best, idx = -1, None
        for i in range(a + 1, b):
            # a closed ring starts and ends on the same point, so fall back to distance from that point
            d = abs(dy * pts[i][0] - dx * pts[i][1] + bx * ay - by * ax) / L if L > 1e-6 else math.hypot(pts[i][0] - ax, pts[i][1] - ay)
            if d > best:
                best, idx = d, i
        if idx is not None and best > tol:
            keep[idx] = True
            stack += [(a, idx), (idx, b)]
    return [p for p, k in zip(pts, keep) if k]


def rings_of(geom):
    polys = geom["coordinates"] if geom["type"] == "MultiPolygon" else [geom["coordinates"]]
    for poly in polys:
        for ring in poly:
            yield ring


def area(r):
    return abs(sum(r[i - 1][0] * r[i][1] - r[i][0] * r[i - 1][1] for i in range(len(r)))) / 2


def to_path(geom, tol, min_area=0.0):
    parts, total = [], 0.0
    for ring in rings_of(geom):
        c = clip([tuple(p[:2]) for p in ring], WIDE)
        if len(c) < 3:
            continue
        # clip again in projected space so neighbours run straight to the canvas edges
        c = clip([proj(*p) for p in c], (0, 0, W, H))
        if len(c) < 3:
            continue
        xy = rdp(c + [c[0]], tol)
        if len(xy) < 4 or area(xy) < min_area:
            continue
        total += area(xy)
        parts.append("M" + "L".join(f"{x:.1f} {y:.1f}" for x, y in xy[:-1]) + "Z")
    return "".join(parts), total


TOL = 0.13
countries = json.load(open(f"{G}/ne_10m_admin_0_countries_ind.geojson", encoding="utf8"))["features"]
land, neighbours = None, []
LABEL = {"PAK": ("Pakistan", 69.3, 28.6), "AFG": ("Afghanistan", 65.5, 33.6), "NPL": ("Nepal", 83.9, 28.4), "BTN": ("Bhutan", 90.4, 27.45),
         "BGD": ("Bangladesh", 90.1, 24.0), "LKA": ("Sri Lanka", 80.7, 7.7), "MMR": ("Myanmar", 95.6, 22.0), "CHN": ("China", 86.0, 33.4),
         "IRN": ("Iran", 61.2, 29.5)}
for f in countries:
    a3 = f["properties"]["ADM0_A3"]
    # India is drawn finely; neighbours only need their shape
    d, A = to_path(f["geometry"], TOL if a3 == "IND" else TOL * 2.5, 0.2)
    if not d:
        continue
    if a3 == "IND":
        land = d
    else:
        neighbours.append(d)
labels = [dict(name=v[0], x=round(proj(v[1], v[2])[0], 1), y=round(proj(v[1], v[2])[1], 1), kind="country") for v in LABEL.values()]
for name, lon, lat in (("Arabian Sea", 65.5, 15.5), ("Bay of Bengal", 88.5, 15.5), ("Indian Ocean", 74.0, 5.6)):
    x, y = proj(lon, lat)
    labels.append(dict(name=name, x=round(x, 1), y=round(y, 1), kind="sea"))

states = [f for f in json.load(open(f"{G}/ne_10m_admin_1_states_provinces.geojson", encoding="utf8"))["features"]
          if f["properties"].get("adm0_a3") == "IND"]
state_paths = []
for f in states:
    p = f["properties"]
    d, A = to_path(f["geometry"], TOL, 0.05)
    state_paths.append(d)
    x, y = proj(p["longitude"], p["latitude"])
    # big states are labelled at every zoom, small ones only once zoomed in
    labels.append(dict(name=p["name"], x=round(x, 1), y=round(y, 1), kind="state", minZoom=1 if A > 2500 else 2.2 if A > 400 else 4.5))

sites = json.load(open(SITES, encoding="utf8"))
pos = {s["id"]: [round(proj(s["lon"], s["lat"])[0], 2), round(proj(s["lon"], s["lat"])[1], 2)]
       for k in sites for s in sites[k] if s.get("lat") is not None}

# India's own extent, for the initial fit
xs, ys = [], []
for f in countries:
    if f["properties"]["ADM0_A3"] == "IND":
        for ring in rings_of(f["geometry"]):
            for lon, lat in (p[:2] for p in ring):
                x, y = proj(lon, lat)
                xs.append(x); ys.append(y)
home = [round(min(xs), 1), round(min(ys), 1), round(max(xs), 1), round(max(ys), 1)]

out = dict(width=W, height=round(H, 1), home=home, land=land, neighbours="".join(neighbours), states="".join(state_paths),
           labels=labels, sites=pos, source="Natural Earth 1:10m, India point of view (public domain)")
json.dump(out, open(OUT, "w", encoding="utf8"), separators=(",", ":"))
print("size", round(len(json.dumps(out)) / 1024), "KB  canvas", W, round(H), "home", home, "sites", len(pos))
print("land pts", out["land"].count("L") + out["land"].count("M"), "states pts", out["states"].count("L"), "neigh pts", out["neighbours"].count("L"))
