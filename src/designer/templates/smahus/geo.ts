/**
 * Ren geometri (mm) for småhus-modellen (vedskjul, utedo, søppelbod).
 *
 * Alle deler beskrives som en PRISME: et 2D-profil (p2) som er ekstrudert
 * mellom to flater `a` og `b` (samme punktrekkefølge). Etter ekstrudering kan
 * endene kappes mot vilkårlige plan (`trimTilPlan`) ved å skyve endepunktene
 * langs delens lengdeakse – slik blir kinn-/gjæringskutt eksakte og plane.
 * Ingen three.js her, så modellen kan testes med tsx.
 */

export type V3 = [number, number, number]
export type P2 = [number, number]

export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2])
export const norm = (a: V3): V3 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

/** Prisme: `a[i]` og `b[i]` er samme profilpunkt på hver side. `hull` = indeksintervaller for hull i profilet. */
export interface Prisme {
  type: 'prisme'
  a: V3[]
  b: V3[]
  /** 2D-profil (til triangulering), samme rekkefølge som a/b. */
  p2: P2[]
  /** Antall punkter i ytterkonturen; resten er hull (hullLengder). */
  ytre: number
  hullLengder?: number[]
}

export interface Sylinder {
  type: 'sylinder'
  /** Senter bunn. */
  c: V3
  h: number
  r: number
  /** Akse (standard loddrett). */
  akse?: V3
  segs?: number
}

export type Geo = Prisme | Sylinder

/** Plan n·p = d (n trenger ikke være enhetsvektor). Område «innenfor» = n·p ≤ d. */
export interface Plan {
  n: V3
  d: number
}

/**
 * Prisme fra 2D-profil i et lokalt koordinatsystem: punkt (x, y) →
 * O + x·ex + y·ey, ekstrudert fra z0 til z1 langs ez.
 */
export function prisme(O: V3, ex: V3, ey: V3, ez: V3, profil: P2[], z0: number, z1: number, hull: P2[][] = []): Prisme {
  const alle = [...profil, ...hull.flat()]
  const pt = (p: P2, z: number): V3 => add(add(add(O, mul(ex, p[0])), mul(ey, p[1])), mul(ez, z))
  return {
    type: 'prisme',
    a: alle.map((p) => pt(p, z0)),
    b: alle.map((p) => pt(p, z1)),
    p2: alle.map((p) => [p[0], p[1]] as P2),
    ytre: profil.length,
    hullLengder: hull.length ? hull.map((h) => h.length) : undefined,
  }
}

/** Aksejustert boks (min/maks hjørner). */
export function boks(min: V3, max: V3): Prisme {
  return prisme(
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
    [
      [min[0], min[1]],
      [max[0], min[1]],
      [max[0], max[1]],
      [min[0], max[1]],
    ],
    min[2],
    max[2],
  )
}

/** Boks gitt senter og størrelse. */
export function boksC(c: V3, s: V3): Prisme {
  return boks([c[0] - s[0] / 2, c[1] - s[1] / 2, c[2] - s[2] / 2], [c[0] + s[0] / 2, c[1] + s[1] / 2, c[2] + s[2] / 2])
}

/** Alle punkter i en geometri. */
export function punkter(g: Geo): V3[] {
  if (g.type === 'prisme') return [...g.a, ...g.b]
  const ax = g.akse ?? [0, 1, 0]
  const top = add(g.c, mul(ax, g.h))
  // Grov utstrekning: 8 punkter på hver ende.
  const u = norm(Math.abs(ax[1]) > 0.9 ? cross(ax, [1, 0, 0]) : cross(ax, [0, 1, 0]))
  const v = cross(ax, u)
  const res: V3[] = []
  for (let k = 0; k < 8; k++) {
    const t = (k / 8) * Math.PI * 2
    const o = add(mul(u, Math.cos(t) * g.r), mul(v, Math.sin(t) * g.r))
    res.push(add(g.c, o), add(top, o))
  }
  return res
}

/** Utstrekning langs en akse (mm). */
export function utstrekning(g: Geo, akse: V3): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const p of punkter(g)) {
    const t = dot(p, akse)
    if (t < min) min = t
    if (t > max) max = t
  }
  return { min, max }
}

/**
 * Kapp en ende av prismen mot et plan: punktene i enden (profil-x lik
 * minste/største verdi innenfor toleranse) skyves langs `akse` til planet.
 * `bareTrim` = flytt bare punkter som ligger utenfor (n·p > d).
 */
export function trimTilPlan(g: Prisme, ende: 'min' | 'maks', plan: Plan, akse: V3, bareTrim = true, tol = 0.5) {
  const xs = g.p2.slice(0, g.ytre).map((p) => p[0])
  const ref = ende === 'min' ? Math.min(...xs) : Math.max(...xs)
  const na = dot(plan.n, akse)
  if (Math.abs(na) < 1e-9) return
  for (let i = 0; i < g.ytre; i++) {
    if (Math.abs(g.p2[i][0] - ref) > tol) continue
    for (const f of [g.a, g.b]) {
      const p = f[i]
      const s = dot(plan.n, p) - plan.d
      if (bareTrim && s <= 1e-9) continue
      const t = -s / na
      f[i] = add(p, mul(akse, t))
    }
  }
}

/**
 * Kapp ALLE punkter i prismen som ligger utenfor planet (skyves langs aksen).
 * Brukes når enden ikke er en ren endeflate (f.eks. vannbord-gjæring).
 */
export function trimAlle(g: Prisme, plan: Plan, akse: V3) {
  const na = dot(plan.n, akse)
  if (Math.abs(na) < 1e-9) return
  for (const f of [g.a, g.b]) {
    for (let i = 0; i < f.length; i++) {
      const s = dot(plan.n, f[i]) - plan.d
      if (s <= 1e-9) continue
      f[i] = add(f[i], mul(akse, -s / na))
    }
  }
}

// ── 2D-hjelpere ────────────────────────────────────────────────────

/** Sutherland–Hodgman: behold delen av polygonet der a·x + b·y ≤ c. */
export function klipp(poly: P2[], a: number, b: number, c: number): P2[] {
  const out: P2[] = []
  const inn = (p: P2) => a * p[0] + b * p[1] <= c + 1e-9
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i]
    const Q = poly[(i + 1) % poly.length]
    const pi = inn(P)
    const qi = inn(Q)
    if (pi) out.push(P)
    if (pi !== qi) {
      const fp = a * P[0] + b * P[1] - c
      const fq = a * Q[0] + b * Q[1] - c
      const t = fp / (fp - fq)
      out.push([P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t])
    }
  }
  return fjernDuplikater(out)
}

export function fjernDuplikater(poly: P2[], tol = 0.01): P2[] {
  const res: P2[] = []
  for (const p of poly) {
    const q = res[res.length - 1]
    if (!q || Math.abs(q[0] - p[0]) > tol || Math.abs(q[1] - p[1]) > tol) res.push(p)
  }
  while (res.length > 1 && Math.abs(res[0][0] - res[res.length - 1][0]) <= tol && Math.abs(res[0][1] - res[res.length - 1][1]) <= tol) res.pop()
  return res
}

/** Polygonareal (mm², med fortegn). */
export function areal2(poly: P2[]): number {
  let s = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    s += p[0] * q[1] - q[0] * p[1]
  }
  return s / 2
}

/** Laveste y der den loddrette linja x krysser polygonet (konveks/ikke-konveks), eller undefined. */
export function nedreKant(poly: P2[], x: number): number | undefined {
  let best: number | undefined
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    const lo = Math.min(p[0], q[0])
    const hi = Math.max(p[0], q[0])
    if (x < lo - 1e-9 || x > hi + 1e-9) continue
    let y: number
    if (Math.abs(q[0] - p[0]) < 1e-9) y = Math.min(p[1], q[1])
    else y = p[1] + ((q[1] - p[1]) * (x - p[0])) / (q[0] - p[0])
    if (best === undefined || y < best) best = y
  }
  return best
}

/**
 * Overkant for et kledningsbord fra x0 til x1: min av en «tak»-funksjon og
 * nedre kant av hindringer (tverrsnitt av stikkere o.l. i bordets plan).
 * Returnerer punktene i overkanten fra x1 til x0 (til å lukke polygonet).
 */
export function overkant(x0: number, x1: number, tak: (x: number) => number, hindringer: P2[][], klaring: number): P2[] {
  const brudd = new Set<number>([x0, x1])
  const eps = 0.02
  for (const h of hindringer) {
    for (const p of h) {
      if (p[0] > x0 && p[0] < x1) brudd.add(p[0])
      for (const d of [-eps, eps]) if (p[0] + d > x0 && p[0] + d < x1) brudd.add(p[0] + d)
    }
  }
  const f = (x: number) => {
    let y = tak(x)
    for (const h of hindringer) {
      const n = nedreKant(h, x)
      if (n !== undefined) y = Math.min(y, n - klaring)
    }
    return y
  }
  const xs = [...brudd].sort((a, b) => b - a)
  const pts: P2[] = xs.map((x) => [x, f(x)] as P2)
  // Fjern kolineære mellompunkt.
  const res: P2[] = []
  for (const p of pts) {
    if (res.length >= 2) {
      const a = res[res.length - 2]
      const b = res[res.length - 1]
      const cr = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
      if (Math.abs(cr) < 1e-3 * Math.max(1, Math.abs(p[0] - a[0]))) res.pop()
    }
    res.push(p)
  }
  return res
}

/** Konveks skall (2D). */
export function konvekstSkall(pts: P2[]): P2[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (s.length < 3) return s
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo: P2[] = []
  for (const p of s) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop()
    lo.push(p)
  }
  const hi: P2[] = []
  for (let i = s.length - 1; i >= 0; i--) {
    const p = s[i]
    while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], p) <= 0) hi.pop()
    hi.push(p)
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)]
}

/** Snitt mellom den rette linja {x = verdi} og konvekst polygon → y-intervall. */
export function snittLinje(poly: P2[], verdi: number): [number, number] | undefined {
  let lo = Infinity
  let hi = -Infinity
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    if ((p[0] - verdi) * (q[0] - verdi) > 0) continue
    if (Math.abs(q[0] - p[0]) < 1e-9) {
      lo = Math.min(lo, p[1], q[1])
      hi = Math.max(hi, p[1], q[1])
      continue
    }
    const t = (verdi - p[0]) / (q[0] - p[0])
    const y = p[1] + (q[1] - p[1]) * t
    lo = Math.min(lo, y)
    hi = Math.max(hi, y)
  }
  return lo <= hi ? [lo, hi] : undefined
}
