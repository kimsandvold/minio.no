/**
 * Felles 3D-/kapplistemodell for carport og garasje.
 *
 * Hver fysiske del beskrives ÉN gang som et prisme: et 2D-omriss (mm) i et
 * lokalt (u, v)-plan, plassert med origo O og akser U, V (planet) og W
 * (ekstrudering, tykkelse t). Fra samme beskrivelse lages:
 *  - 3D-mesh (buildMesh) – med userData.part/pid/info
 *  - kapplista (lengde langs delens akse, avrundet opp til 5 mm, og kappvinkler)
 *  - kontroll i testene (3D-lengde = kappliste-lengde)
 * Slik kan ikke 3D, kappliste og materialliste drifte fra hverandre.
 *
 * Alle mål i millimeter; 3D-scenen er i meter (× 0,001).
 */
import * as THREE from 'three'
import { rundOppKapp } from '../geometri'
import type { KappEnde, KapplisteDelPlan, Materialkategori } from '../plan-typer'

export type V3 = [number, number, number]
export type P2 = [number, number]

/** Materialtype for 3D-visning. */
export type Flate = 'tre' | 'metall' | 'betong' | 'tekke' | 'akryl' | 'plate' | 'membran' | 'port' | 'kontekst'

export interface Prisme {
  pid: string
  part: string
  navn: string
  profil: string
  /** Omriss i (u, v), mm. */
  poly: P2[]
  O: V3
  U: V3
  V: V3
  W: V3
  /** Tykkelse langs W, mm. */
  t: number
  flate: Flate
  /**
   * Skrå ende (kinnkutt): hjørner med u ≥ uFra forskyves k·(w − t/2) langs u,
   * så endeflaten blir et loddrett plan på skrå gjennom tykkelsen (skiftesperre
   * mot grat, grat mot bæretakstol).
   */
  skjevEnde?: { uFra: number; k: number }
  darken?: number
  /** Farge for ikke-tre (hex). */
  farge?: number
  /** Retning i splittvisning (meter). */
  explode?: V3
  /** Kapplistenøkkel (utelatt = ikke på kapplista, f.eks. plater/beslag). */
  kapp?: KappInfo
  /** Lengde vist i hover (cm). Settes automatisk fra kapp når den finnes. */
  lengdeCm?: number
}

export interface KappInfo {
  pos?: string
  kvalitet: string
  lengdeMm: number
  endeA?: KappEnde
  endeB?: KappEnde
  merknad?: string
  kategori?: Materialkategori
  /** Prisnøkkel (priser.ts) per løpemeter. */
  prisId: string
  /** Rekkefølge i kapplista. */
  orden: number
}

export const PI = Math.PI
export const rad = (g: number) => (g * PI) / 180
export const deg = (r: number) => (r * 180) / PI

// ── Polygonverktøy ─────────────────────────────────────────────────

/** Halvplan a·u + b·v ≤ c. */
export interface Halvplan {
  a: number
  b: number
  c: number
}

/** Sutherland–Hodgman: klipp konvekst/konkavt polygon mot ett halvplan. */
export function klipp(poly: P2[], h: Halvplan): P2[] {
  const ut: P2[] = []
  const inne = (p: P2) => h.a * p[0] + h.b * p[1] <= h.c + 1e-9
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i]
    const B = poly[(i + 1) % poly.length]
    const ia = inne(A)
    const ib = inne(B)
    if (ia) ut.push(A)
    if (ia !== ib) {
      const fa = h.a * A[0] + h.b * A[1] - h.c
      const fb = h.a * B[0] + h.b * B[1] - h.c
      const t = fa / (fa - fb)
      ut.push([A[0] + t * (B[0] - A[0]), A[1] + t * (B[1] - A[1])])
    }
  }
  return ut
}
export const klippAlle = (poly: P2[], hs: Halvplan[]) => hs.reduce((p, h) => (p.length ? klipp(p, h) : p), poly)

/** Halvplan «under linja gjennom p med retning d» (venstre/høyre bestemt av punkt `inne`). */
export function halvplanLinje(p: P2, d: P2, inne: P2): Halvplan {
  // Normal n = (-d.y, d.x); behold siden der `inne` ligger.
  let a = -d[1]
  let b = d[0]
  let c = a * p[0] + b * p[1]
  if (a * inne[0] + b * inne[1] > c) {
    a = -a
    b = -b
    c = -c
  }
  return { a, b, c }
}

/** Lang stav langs senterlinja p0→p1 (forlenget `ekstra` i hver ende), bredde h. */
export function stavPoly(p0: P2, p1: P2, h: number, ekstra = 0): P2[] {
  const dx = p1[0] - p0[0]
  const dy = p1[1] - p0[1]
  const L = Math.hypot(dx, dy)
  const ux = dx / L
  const uy = dy / L
  const nx = -uy * (h / 2)
  const ny = ux * (h / 2)
  const a: P2 = [p0[0] - ux * ekstra, p0[1] - uy * ekstra]
  const b: P2 = [p1[0] + ux * ekstra, p1[1] + uy * ekstra]
  return [
    [a[0] + nx, a[1] + ny],
    [b[0] + nx, b[1] + ny],
    [b[0] - nx, b[1] - ny],
    [a[0] - nx, a[1] - ny],
  ]
}

export const rekt = (u0: number, v0: number, u1: number, v1: number): P2[] => [
  [u0, v0],
  [u1, v0],
  [u1, v1],
  [u0, v1],
]

/** Utstrekning av polygonet langs retningen d (enhetsvektor): [min, max]. */
export function utstrekning(poly: P2[], d: P2): [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (const p of poly) {
    const s = p[0] * d[0] + p[1] * d[1]
    if (s < lo) lo = s
    if (s > hi) hi = s
  }
  return [lo, hi]
}

/**
 * Kappvinkler for en stav med akse d: vinkelen (grader fra rett kapp) til
 * endeflatene, funnet som kantene i polygonet som ligger i hver ende
 * (lengste kant blant de som ikke er parallelle med aksen).
 */
export function kappVinkler(poly: P2[], d: P2): [number, number] {
  const [lo, hi] = utstrekning(poly, d)
  const ender: [number, number] = [0, 0]
  const best: [number, number] = [0, 0]
  for (let i = 0; i < poly.length; i++) {
    const A = poly[i]
    const B = poly[(i + 1) % poly.length]
    const ex = B[0] - A[0]
    const ey = B[1] - A[1]
    const L = Math.hypot(ex, ey)
    if (L < 1) continue
    const cos = Math.abs((ex * d[0] + ey * d[1]) / L)
    if (cos > 0.999) continue // langsgående kant
    const midt = ((A[0] + B[0]) / 2) * d[0] + ((A[1] + B[1]) / 2) * d[1]
    const ende = midt - lo < hi - midt ? 0 : 1
    // Vinkel fra rett kapp = vinkelen mellom kanten og normalen til aksen.
    const v = deg(Math.asin(Math.min(1, cos)))
    if (L > best[ende]) {
      best[ende] = L
      ender[ende] = v
    }
  }
  return [Math.round(ender[0] * 10) / 10, Math.round(ender[1] * 10) / 10]
}

// ── Prisme-byggere ─────────────────────────────────────────────────

export const AX: Record<'x' | 'y' | 'z' | '-x' | '-y' | '-z', V3> = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1], '-x': [-1, 0, 0], '-y': [0, -1, 0], '-z': [0, 0, -1] }

/** Boks fra min/maks-hjørner (mm). */
export function boks(min: V3, max: V3): Pick<Prisme, 'poly' | 'O' | 'U' | 'V' | 'W' | 't'> {
  return { poly: rekt(min[0], min[1], max[0], max[1]), O: [0, 0, min[2]], U: AX.x, V: AX.y, W: AX.z, t: max[2] - min[2] }
}

/** Prisme i x–y-planet (ekstrudert langs z fra z0, tykkelse t). */
export function iXY(poly: P2[], z0: number, t: number): Pick<Prisme, 'poly' | 'O' | 'U' | 'V' | 'W' | 't'> {
  return { poly, O: [0, 0, z0], U: AX.x, V: AX.y, W: AX.z, t }
}
/** Prisme i z–y-planet (u = z, v = y, ekstrudert langs x fra x0). */
export function iZY(poly: P2[], x0: number, t: number): Pick<Prisme, 'poly' | 'O' | 'U' | 'V' | 'W' | 't'> {
  // Høyrehåndet: U = z, V = y → W = U × V = -x. Vi ekstruderer langs -x fra x0 + t.
  return { poly, O: [x0 + t, 0, 0], U: AX.z, V: AX.y, W: AX['-x'], t }
}

/** Lengde langs delens lengdeakse (lengste utstrekning blant u/v-retninger og diagonalen). */
export function lengdeLangs(poly: P2[], d: P2): number {
  const [lo, hi] = utstrekning(poly, d)
  return hi - lo
}

// ── Kappliste ──────────────────────────────────────────────────────

/** Slå sammen like deler (navn, profil, lengde, vinkler) til kapplisterader med posisjonsbokstav. */
export function lagKappliste(deler: Prisme[]): KapplisteDelPlan[] {
  const map = new Map<string, KapplisteDelPlan & { orden: number }>()
  for (const d of deler) {
    const k = d.kapp
    if (!k) continue
    const key = kappNokkel(d)
    const ex = map.get(key)
    if (ex) ex.antall += 1
    else
      map.set(key, {
        navn: d.navn,
        profil: d.profil,
        lengdeCm: k.lengdeMm / 10,
        lengdeMm: k.lengdeMm,
        antall: 1,
        kvalitet: k.kvalitet,
        endeA: k.endeA,
        endeB: k.endeB,
        merknad: k.merknad,
        kategori: k.kategori,
        orden: k.orden,
      })
  }
  const rader = [...map.values()].sort((a, b) => a.orden - b.orden || b.lengdeMm! - a.lengdeMm!)
  return rader.map((r, i) => {
    const { orden: _o, ...rest } = r
    void _o
    return { ...rest, pos: posBokstav(i) }
  })
}

export const kappNokkel = (d: Prisme) => `${d.navn}|${d.profil}|${d.kapp?.lengdeMm}|${d.kapp?.endeA?.vinkel ?? 0}|${d.kapp?.endeB?.vinkel ?? 0}`

export function posBokstav(i: number): string {
  return i < 26 ? String.fromCharCode(65 + i) : String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26))
}

/** Kapplengde (5 mm opp) for en stav med akse d. */
export const kappLengde = (poly: P2[], d: P2) => rundOppKapp(lengdeLangs(poly, d) - 0.01)

// ── THREE ──────────────────────────────────────────────────────────

export interface MatOpts {
  /** Treets materiale (paint bucket/treslag). */
  tre: (pid: string, darken?: number) => THREE.Material
}

const FLATE_FARGE: Record<Exclude<Flate, 'tre'>, number> = {
  metall: 0x9aa0a6,
  betong: 0x9d9d97,
  tekke: 0x3a3a3a,
  akryl: 0xbcd4dd,
  plate: 0xd6b97f,
  membran: 0x2b2b2b,
  port: 0xe6e6e2,
  kontekst: 0x9fb0c2,
}

/** Bygg et mesh fra et prisme (meter i scenen). */
export function prismeMesh(p: Prisme, mats: MatOpts): THREE.Mesh | null {
  if (p.poly.length < 3 || p.t <= 0) return null
  const shape = new THREE.Shape(p.poly.map(([u, v]) => new THREE.Vector2(u / 1000, v / 1000)))
  const g = new THREE.ExtrudeGeometry(shape, { depth: p.t / 1000, bevelEnabled: false, curveSegments: 1 })
  if (p.skjevEnde) {
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    const { uFra, k } = p.skjevEnde
    for (let i = 0; i < pos.count; i++) {
      if (pos.getX(i) * 1000 >= uFra - 0.01) pos.setX(i, pos.getX(i) + (k * (pos.getZ(i) * 1000 - p.t / 2)) / 1000)
    }
  }
  const m4 = new THREE.Matrix4().makeBasis(new THREE.Vector3(...p.U), new THREE.Vector3(...p.V), new THREE.Vector3(...p.W))
  m4.setPosition(p.O[0] / 1000, p.O[1] / 1000, p.O[2] / 1000)
  g.applyMatrix4(m4)
  // Venstrehåndet basis speiler trekantene – snu normalene.
  if (m4.determinant() < 0) {
    const idx = g.getIndex()
    if (idx) {
      for (let i = 0; i < idx.count; i += 3) {
        const a = idx.getX(i + 1)
        idx.setX(i + 1, idx.getX(i + 2))
        idx.setX(i + 2, a)
      }
    } else {
      const pos = g.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < pos.count; i += 3) {
        const x = pos.getX(i + 1), y = pos.getY(i + 1), z = pos.getZ(i + 1)
        pos.setXYZ(i + 1, pos.getX(i + 2), pos.getY(i + 2), pos.getZ(i + 2))
        pos.setXYZ(i + 2, x, y, z)
      }
    }
  }
  g.computeVertexNormals()
  let mat: THREE.Material
  if (p.flate === 'tre') mat = mats.tre(p.pid, p.darken ?? 1)
  else {
    const farge = p.farge ?? FLATE_FARGE[p.flate]
    const glass = p.flate === 'akryl' || p.flate === 'kontekst'
    const mt = p.flate === 'metall'
    mat = new THREE.MeshStandardMaterial({
      color: farge,
      roughness: mt ? 0.45 : p.flate === 'tekke' ? 0.7 : 0.9,
      metalness: mt ? 0.75 : p.flate === 'tekke' ? 0.25 : 0.02,
      transparent: glass,
      opacity: p.flate === 'akryl' ? 0.3 : p.flate === 'kontekst' ? 0.16 : 1,
      depthWrite: !glass,
      side: glass ? THREE.DoubleSide : THREE.FrontSide,
    })
  }
  const mesh = new THREE.Mesh(g, mat)
  mesh.castShadow = p.flate !== 'kontekst' && p.flate !== 'akryl'
  mesh.receiveShadow = p.flate !== 'kontekst'
  mesh.userData.part = p.part
  mesh.userData.pid = p.pid
  mesh.userData.info = { navn: p.navn, profil: p.profil, lengdeCm: p.kapp ? p.kapp.lengdeMm / 10 : p.lengdeCm ?? 0 }
  if (p.explode) mesh.userData.explode = new THREE.Vector3(...p.explode)
  // Eksplisitt lengdeakse for kappdeler: den retningen i omrisset (u,v-planet) som har størst
  // samlet kantlengde (langsidene er parallelle), så plan-modell måler lengde/helning langs
  // delen i stedet for å gjette ut fra alle trekantkanter (skrå kinnkutt lurer gjetningen).
  if (p.kapp) {
    const grupper = new Map<number, { du: number; dv: number; w: number }>()
    for (let i = 0; i < p.poly.length; i++) {
      const a = p.poly[i]
      const b = p.poly[(i + 1) % p.poly.length]
      const L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 1) continue
      let du = (b[0] - a[0]) / L
      let dv = (b[1] - a[1]) / L
      if (du < -1e-9 || (Math.abs(du) <= 1e-9 && dv < 0)) { du = -du; dv = -dv }
      const k = Math.round((Math.atan2(dv, du) * 180) / Math.PI * 2) // 0,5°-klasser
      const g = grupper.get(k)
      if (g) g.w += L
      else grupper.set(k, { du, dv, w: L })
    }
    let best: { du: number; dv: number; w: number } | undefined
    for (const g of grupper.values()) if (!best || g.w > best.w) best = g
    if (best && best.w >= 2 * p.t) mesh.userData.akse = [best.du * p.U[0] + best.dv * p.V[0], best.du * p.U[1] + best.dv * p.V[1], best.du * p.U[2] + best.dv * p.V[2]]
  }
  if (p.flate === 'kontekst') {
    mesh.renderOrder = -1
    mesh.userData.kontekst = true // eksisterende omgivelser – vises i alle byggetrinn
  }
  return mesh
}

export function byggGruppe(deler: Prisme[], mats: MatOpts): THREE.Group {
  const g = new THREE.Group()
  for (const d of deler) {
    const m = prismeMesh(d, mats)
    if (m) g.add(m)
  }
  return g
}

/** Akse-justert omsluttende boks (mm) for alle prismer – til bounds(). */
export function omslutt(deler: Prisme[], filter?: (p: Prisme) => boolean): { min: V3; max: V3 } {
  const min: V3 = [Infinity, Infinity, Infinity]
  const max: V3 = [-Infinity, -Infinity, -Infinity]
  for (const p of deler) {
    if (filter && !filter(p)) continue
    for (const q of hjorner(p)) {
      for (let k = 0; k < 3; k++) {
        if (q[k] < min[k]) min[k] = q[k]
        if (q[k] > max[k]) max[k] = q[k]
      }
    }
  }
  return { min, max }
}

// ── 2D-projeksjoner (tegninger) ────────────────────────────────────

export type Visning = 'front' | 'bak' | 'venstre' | 'hoyre' | 'plan'

/** Alle hjørner i verden (mm). */
export function hjorner(p: Prisme): V3[] {
  const ut: V3[] = []
  for (const [u0, v] of p.poly)
    for (const w of [0, p.t]) {
      const u = p.skjevEnde && u0 >= p.skjevEnde.uFra - 0.01 ? u0 + p.skjevEnde.k * (w - p.t / 2) : u0
      ut.push([0, 1, 2].map((k) => p.O[k] + u * p.U[k] + v * p.V[k] + w * p.W[k]) as V3)
    }
  return ut
}

/** Projiser til tegningsplan: front (fra +z): u = x; bak: u = −x; venstre (fra −x): u = z; høyre: u = −z; plan: (x, z). v = høyde (eller z i plan). */
export function projiserPunkt(q: V3, vis: Visning): P2 {
  switch (vis) {
    case 'front':
      return [q[0], q[1]]
    case 'bak':
      return [-q[0], q[1]]
    case 'venstre':
      return [q[2], q[1]]
    case 'hoyre':
      return [-q[2], q[1]]
    case 'plan':
      return [q[0], q[2]]
  }
}

/** Konvekst skall (Andrew monotone chain). */
export function skall(pts: P2[]): P2[] {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (p.length < 3) return p
  const kryss = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lav: P2[] = []
  for (const q of p) {
    while (lav.length >= 2 && kryss(lav[lav.length - 2], lav[lav.length - 1], q) <= 0) lav.pop()
    lav.push(q)
  }
  const hoy: P2[] = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (hoy.length >= 2 && kryss(hoy[hoy.length - 2], hoy[hoy.length - 1], q) <= 0) hoy.pop()
    hoy.push(q)
  }
  hoy.pop()
  lav.pop()
  return [...lav, ...hoy]
}

/**
 * Omriss av et prisme i en visning. Når ekstruderingen står vinkelrett på
 * tegningsplanet brukes selve polygonet (eksakt, også konkave hakk); ellers
 * det konvekse skallet av hjørnene.
 */
export function projiser(p: Prisme, vis: Visning): P2[] {
  const n = vis === 'plan' ? 1 : vis === 'front' || vis === 'bak' ? 2 : 0
  const parallell = Math.abs(p.W[n]) > 0.999
  if (parallell) {
    return p.poly.map(([u, v]) => projiserPunkt([0, 1, 2].map((k) => p.O[k] + u * p.U[k] + v * p.V[k]) as V3, vis))
  }
  return skall(hjorner(p).map((q) => projiserPunkt(q, vis)))
}

/** Lag Riss2D-former (cm, y ned) fra prismer. `topp` = høyeste v (mm) i risset. Like omriss vises én gang. */
export function tilFormer(deler: Prisme[], vis: Visning, origo: P2, topp: number, opts: { tynn?: (p: Prisme) => boolean; stiplet?: (p: Prisme) => boolean } = {}): Form2D2[] {
  const sett = new Set<string>()
  const ut: Form2D2[] = []
  for (const d of deler) {
    const pts = projiser(d, vis)
    if (pts.length < 2) continue
    const cm = pts.map(([u, v]) => [Math.round((u - origo[0]) / 1) / 10, vis === 'plan' ? Math.round(v - origo[1]) / 10 : Math.round(topp - v) / 10] as P2)
    const key = cm.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).sort().join(';')
    if (sett.has(key)) continue
    sett.add(key)
    ut.push({ type: 'poly', points: [...cm, cm[0]], tynn: opts.tynn?.(d), dashed: opts.stiplet?.(d) })
  }
  return ut
}

export interface Form2D2 {
  type: 'poly' | 'rect' | 'line'
  points?: P2[]
  x?: number
  y?: number
  w?: number
  h?: number
  dashed?: boolean
  tynn?: boolean
}

// ── Innkjøp av trelast (materialliste) ─────────────────────────────

const LAGER = [2400, 2700, 3000, 3300, 3600, 3900, 4200, 4500, 4800, 5100, 5400, 6000]

export interface TreLinje {
  prisId: string
  profil: string
  kvalitet: string
  kategori?: Materialkategori
  /** Kjøpt løpemeter (hele lagerlengder, eller bestillingsmål for limtre). */
  lm: number
  spesifikasjon: string
}

/**
 * Grupper kapplista per prisnøkkel og finn innkjøpte lagerlengder (30 cm-sprang,
 * «first fit decreasing», 5 mm sagsnitt). Limtre bestilles i eksakt lengde.
 */
export function treInnkjop(kl: KapplisteDelPlan[], deler: Prisme[]): TreLinje[] {
  const per = new Map<string, { profil: string; kvalitet: string; kategori?: Materialkategori; behov: Array<{ L: number; n: number }> }>()
  for (const r of kl) {
    const d = deler.find((p) => p.kapp && p.navn === r.navn && p.profil === r.profil && p.kapp.lengdeMm === r.lengdeMm)
    const id = d?.kapp?.prisId ?? 'bjelke-48x98'
    const e = per.get(id) ?? { profil: r.profil, kvalitet: r.kvalitet ?? '', kategori: r.kategori, behov: [] }
    e.behov.push({ L: r.lengdeMm ?? r.lengdeCm * 10, n: r.antall })
    per.set(id, e)
  }
  const ut: TreLinje[] = []
  for (const [prisId, e] of per) {
    const limtre = prisId.startsWith('limtre') || prisId === 'stolpe-115x115' || prisId === 'stolpe-140x140' || prisId === 'stolpe-90x90'
    const spes: string[] = []
    let lm = 0
    if (limtre) {
      for (const b of e.behov) {
        lm += (b.L * b.n) / 1000
        spes.push(`${b.n} × ${(b.L / 1000).toFixed(2).replace('.', ',')} m (bestillingsmål)`)
      }
    } else {
      const stykker = e.behov.flatMap((b) => Array.from({ length: b.n }, () => b.L)).sort((a, b) => b - a)
      const planker: number[] = []
      const rest: number[] = []
      for (const st of stykker) {
        const behov = st + 5
        const i = rest.findIndex((r) => r >= behov)
        if (i < 0) {
          const L = LAGER.find((l) => l >= behov) ?? Math.ceil(behov / 300) * 300
          planker.push(L)
          rest.push(L - behov)
        } else rest[i] -= behov
      }
      const tell = new Map<number, number>()
      for (const p of planker) tell.set(p, (tell.get(p) ?? 0) + 1)
      ;[...tell.entries()].sort((a, b) => b[0] - a[0]).forEach(([L, k]) => spes.push(`${k} × ${(L / 1000).toFixed(1).replace('.', ',')} m`))
      lm = planker.reduce((s, p) => s + p, 0) / 1000
    }
    ut.push({ prisId, profil: e.profil, kvalitet: e.kvalitet, kategori: e.kategori, lm, spesifikasjon: spes.join(', ') })
  }
  return ut
}

/** Roter et prisme kvarte omdreininger (k · 90°) om y-aksen. */
export function roterY(p: Prisme, k: number): Prisme {
  const kk = ((k % 4) + 4) % 4
  if (kk === 0) return p
  const r = (v: V3): V3 => {
    let x = v[0]
    let z = v[2]
    for (let i = 0; i < kk; i++) [x, z] = [z, -x]
    return [x, v[1], z]
  }
  return { ...p, O: r(p.O), U: r(p.U), V: r(p.V), W: r(p.W), explode: p.explode ? r(p.explode) : undefined }
}

/** Polygonareal (mm²). */
export function polyAreal(poly: P2[]): number {
  let a = 0
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i]
    const q = poly[(i + 1) % poly.length]
    a += p[0] * q[1] - q[0] * p[1]
  }
  return Math.abs(a) / 2
}
