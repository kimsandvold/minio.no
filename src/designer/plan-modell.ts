/**
 * Konstruksjonstegninger avledet direkte fra 3D-modellen.
 *
 * Templatets `buildMesh()` er fasiten for geometrien. Her projiseres hver
 * del (bjelke, stolpe, sperre …) ortografisk til plan/oppriss/snitt:
 *  - konturen er det konvekse skallet av delens hjørner i projeksjonen
 *    (eksakt for prismatiske trelastdeler, også skråkappede sperrer)
 *  - skjulte linjer fjernes med malerens algoritme (fjernest først, dekkende
 *    fyll)
 *  - snitt kutter delene med et plan; kuttflaten skraveres
 *  - målekjeder (stolpeavstand, c/c), akser og nivåer regnes ut av de samme
 *    koordinatene → tegning, 3D og kappliste kan ikke drifte fra hverandre.
 *
 * Alle mål i millimeter. Akser i 3D: x = bredde, y = høyde, z = dybde
 * (front = +z). Tegningskoordinater: u mot høyre, w nedover.
 */
import * as THREE from 'three'
import { dekkeUnderkant, delInfo, trinnFor } from './byggetrinn'
import type { P, Tegning, TElement, TPoly } from './plan-tegning'

export interface Del3D {
  i: number
  navn: string
  profil: string
  lengdeCm: number
  part: string
  pid?: string
  /** Byggetrinn-indeks (se byggetrinn.ts), -1 = kontekst. */
  trinn: number
  /** Trelast med A×B-profil (ikke plate/tekking/beslag). */
  tre: boolean
  /** Trekanter i verdens-mm, 9 tall per trekant. */
  tri: Float32Array
  min: [number, number, number]
  max: [number, number, number]
  loddrett: boolean
  /** Analysert lengdeakse (enhetsvektor) og lengde langs den (mm). */
  akse?: [number, number, number]
  lengdeMm?: number
  /** Kappvinkler i hver ende (grader fra rett kapp); null = sammensatt kapp. */
  vinkelA?: number | null
  vinkelB?: number | null
  /** Nøkkel som i UI/kappliste: navn|profil|lengdeCm. */
  nokkel: string
}

const PROFIL_RE = /(\d+(?:[.,]\d+)?)\s*[×xX]\s*(\d+(?:[.,]\d+)?)/

export function lesModell(root: THREE.Object3D): Del3D[] {
  root.updateMatrixWorld(true)
  const deler: Del3D[] = []
  const v = new THREE.Vector3()
  const bb = new THREE.Box3()
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh || !m.visible) return
    const g = m.geometry as THREE.BufferGeometry
    const pos = g.getAttribute('position') as THREE.BufferAttribute | undefined
    if (!pos) return
    const info = delInfo(m)
    const idx = g.getIndex()
    const n = idx ? idx.count : pos.count
    const tri = new Float32Array(Math.floor(n / 3) * 9)
    const min: [number, number, number] = [Infinity, Infinity, Infinity]
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity]
    for (let k = 0; k < tri.length / 3; k++) {
      const vi = idx ? idx.getX(k) : k
      v.fromBufferAttribute(pos, vi).applyMatrix4(m.matrixWorld).multiplyScalar(1000)
      tri[k * 3] = v.x
      tri[k * 3 + 1] = v.y
      tri[k * 3 + 2] = v.z
      if (v.x < min[0]) min[0] = v.x
      if (v.y < min[1]) min[1] = v.y
      if (v.z < min[2]) min[2] = v.z
      if (v.x > max[0]) max[0] = v.x
      if (v.y > max[1]) max[1] = v.y
      if (v.z > max[2]) max[2] = v.z
    }
    if (!Number.isFinite(min[0])) return
    bb.set(new THREE.Vector3(min[0] / 1000, min[1] / 1000, min[2] / 1000), new THREE.Vector3(max[0] / 1000, max[1] / 1000, max[2] / 1000))
    const sx = max[0] - min[0]
    const sy = max[1] - min[1]
    const sz = max[2] - min[2]
    const d: Del3D = {
      i: deler.length,
      navn: info.navn,
      profil: info.profil,
      lengdeCm: info.lengdeCm,
      part: info.part,
      pid: info.pid,
      trinn: trinnFor(info.part, info.navn, bb, undefined, info.kontekst),
      tre: PROFIL_RE.test(info.profil) && !/plate|papp|akryl|polykarbonat|stål|beslag|stolpesko|bjelkesko|bolt|skrue|hengsel|vinkel/i.test(info.navn + ' ' + info.profil),
      tri,
      min,
      max,
      loddrett: sy > Math.max(sx, sz) * 1.5,
      nokkel: `${info.navn}|${info.profil}|${info.lengdeCm}`,
    }
    // Templatet kan oppgi lengdeaksen eksplisitt (userData.akse, lokale koordinater) – da gjettes den ikke.
    const ua = m.userData.akse as unknown
    if (Array.isArray(ua) && ua.length === 3 && ua.every((x) => typeof x === 'number')) {
      const ax = new THREE.Vector3(ua[0], ua[1], ua[2]).transformDirection(m.matrixWorld)
      d.akse = [ax.x, ax.y, ax.z]
    }
    analyserDel(d)
    deler.push(d)
  })
  // Bærende deler under et (høyt) dekke bygges før dekket – juster trinn.
  const dekkeY = dekkeUnderkant(deler.map((d) => ({ part: d.part, navn: d.navn, minY: d.min[1] / 1000 })))
  if (dekkeY !== undefined) {
    const b = new THREE.Box3()
    for (const d of deler) {
      if (d.trinn < 0) continue // kontekst
      b.set(new THREE.Vector3(d.min[0] / 1000, d.min[1] / 1000, d.min[2] / 1000), new THREE.Vector3(d.max[0] / 1000, d.max[1] / 1000, d.max[2] / 1000))
      d.trinn = trinnFor(d.part, d.navn, b, dekkeY)
    }
  }
  return deler
}

/** Finn lengdeakse (dominerende kantretning) og kappvinkler i endene. */
function analyserDel(d: Del3D) {
  const t = d.tri
  const vekt = new Map<string, { v: [number, number, number]; w: number }>()
  for (let k = 0; k < t.length; k += 9) {
    for (const [a, b] of [[0, 3], [3, 6], [6, 0]]) {
      let x = t[k + b] - t[k + a]
      let y = t[k + b + 1] - t[k + a + 1]
      let z = t[k + b + 2] - t[k + a + 2]
      const L = Math.hypot(x, y, z)
      if (L < 1) continue
      x /= L; y /= L; z /= L
      // Fortegnsnormaliser (retning uten pil).
      if (x < -1e-6 || (Math.abs(x) <= 1e-6 && (y < -1e-6 || (Math.abs(y) <= 1e-6 && z < 0)))) { x = -x; y = -y; z = -z }
      const key = `${Math.round(x * 200)},${Math.round(y * 200)},${Math.round(z * 200)}`
      const e = vekt.get(key)
      if (e) e.w += L
      else vekt.set(key, { v: [x, y, z], w: L })
    }
  }
  let best: { v: [number, number, number]; w: number } | null = null
  for (const e of vekt.values()) if (!best || e.w > best.w) best = e
  if (!best) return
  const a: [number, number, number] = d.akse ?? best.v
  d.akse = a
  let lo = Infinity
  let hi = -Infinity
  for (let k = 0; k < t.length; k += 3) {
    const p = t[k] * a[0] + t[k + 1] * a[1] + t[k + 2] * a[2]
    if (p < lo) lo = p
    if (p > hi) hi = p
  }
  d.lengdeMm = hi - lo
  const mid = (lo + hi) / 2
  // Endeflater: trekanter med normal nær lengdeaksen.
  const ender: Array<Map<number, number>> = [new Map(), new Map()]
  for (let k = 0; k < t.length; k += 9) {
    const ux = t[k + 3] - t[k], uy = t[k + 4] - t[k + 1], uz = t[k + 5] - t[k + 2]
    const vx = t[k + 6] - t[k], vy = t[k + 7] - t[k + 1], vz = t[k + 8] - t[k + 2]
    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const A = Math.hypot(nx, ny, nz)
    if (A < 1e-6) continue
    nx /= A; ny /= A; nz /= A
    const c = Math.abs(nx * a[0] + ny * a[1] + nz * a[2])
    if (c < 0.2) continue
    const sentrum = ((t[k] + t[k + 3] + t[k + 6]) * a[0] + (t[k + 1] + t[k + 4] + t[k + 7]) * a[1] + (t[k + 2] + t[k + 5] + t[k + 8]) * a[2]) / 3
    const ende = sentrum < mid ? 0 : 1
    const vinkel = Math.round((Math.acos(Math.min(1, c)) * 180) / Math.PI * 10) / 10
    ender[ende].set(vinkel, (ender[ende].get(vinkel) ?? 0) + A)
  }
  const vinkelFor = (m: Map<number, number>): number | null | undefined => {
    if (m.size === 0) return undefined
    const sortert = [...m.entries()].sort((x, y) => y[1] - x[1])
    const tot = sortert.reduce((s, e) => s + e[1], 0)
    // Én dominerende flate = enkelt kapp. Flere like store = sammensatt (hakk).
    if (sortert[0][1] / tot > 0.8) return sortert[0][0]
    return null
  }
  d.vinkelA = vinkelFor(ender[0])
  d.vinkelB = vinkelFor(ender[1])
}

// ── Projeksjon ──────────────────────────────────────────────────────────

export type Visning = 'plan' | 'front' | 'bak' | 'venstre' | 'hoyre'

/** Verdens-mm → [u, w, dybde] (dybde: større = nærmere betrakteren). */
function proj(v: Visning, x: number, y: number, z: number): [number, number, number] {
  switch (v) {
    case 'plan': return [x, z, y]
    case 'front': return [x, -y, z]
    case 'bak': return [-x, -y, -z]
    case 'venstre': return [z, -y, -x]
    case 'hoyre': return [-z, -y, x]
  }
}

function skall(pts: P[]): P[] {
  const s = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  const uniq: P[] = []
  for (const p of s) {
    const q = uniq[uniq.length - 1]
    if (!q || Math.abs(q[0] - p[0]) > 0.05 || Math.abs(q[1] - p[1]) > 0.05) uniq.push(p)
  }
  if (uniq.length < 3) return uniq
  const cross = (o: P, a: P, b: P) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lower: P[] = []
  for (const p of uniq) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop()
    lower.push(p)
  }
  const upper: P[] = []
  for (let i = uniq.length - 1; i >= 0; i--) {
    const p = uniq[i]
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop()
    upper.push(p)
  }
  upper.pop()
  lower.pop()
  return lower.concat(upper)
}

/** Fjerner nesten-kolineære hjørner (gir rene rektangler for bjelker). */
function forenkle(pts: P[]): P[] {
  if (pts.length <= 4) return pts
  const ut: P[] = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[(i - 1 + pts.length) % pts.length]
    const b = pts[i]
    const c = pts[(i + 1) % pts.length]
    const cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0])
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) * Math.hypot(c[0] - b[0], c[1] - b[1])
    if (L > 0 && Math.abs(cr) / L > 0.002) ut.push(b)
  }
  return ut.length >= 3 ? ut : pts
}

function inniKonveks(p: P, poly: P[]): boolean {
  if (poly.length < 3) return false
  let tegn = 0
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i]
    const b = poly[(i + 1) % poly.length]
    const c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
    if (Math.abs(c) < 1e-9) continue
    const s = c > 0 ? 1 : -1
    if (tegn === 0) tegn = s
    else if (s !== tegn) return false
  }
  return true
}

interface Projisert {
  d: Del3D
  pts: P[]
  dybde: number
  snitt?: P[]
}

function projiserDel(d: Del3D, v: Visning, kutt?: { dybde: number }): Projisert | null {
  const t = d.tri
  const pts: P[] = []
  let dsum = 0
  let n = 0
  const bak: P[] = []
  const kuttPts: P[] = []
  for (let k = 0; k < t.length; k += 9) {
    const q = [proj(v, t[k], t[k + 1], t[k + 2]), proj(v, t[k + 3], t[k + 4], t[k + 5]), proj(v, t[k + 6], t[k + 7], t[k + 8])]
    for (const p of q) {
      pts.push([p[0], p[1]])
      dsum += p[2]
      n++
      if (kutt && p[2] <= kutt.dybde) bak.push([p[0], p[1]])
    }
    if (kutt) {
      for (const [a, b] of [[0, 1], [1, 2], [2, 0]]) {
        const da = q[a][2] - kutt.dybde
        const db = q[b][2] - kutt.dybde
        if ((da < 0 && db > 0) || (da > 0 && db < 0)) {
          const s = da / (da - db)
          const p: P = [q[a][0] + (q[b][0] - q[a][0]) * s, q[a][1] + (q[b][1] - q[a][1]) * s]
          kuttPts.push(p)
          bak.push(p)
        }
      }
    }
  }
  if (n === 0) return null
  if (kutt) {
    if (bak.length < 3) return null // helt foran snittplanet
    const snitt = kuttPts.length >= 3 ? forenkle(skall(kuttPts)) : undefined
    return { d, pts: forenkle(skall(bak)), dybde: dsum / n, snitt }
  }
  return { d, pts: forenkle(skall(pts)), dybde: dsum / n }
}

// ── Utvalg ──────────────────────────────────────────────────────────────

type Utvalg = (d: Del3D) => boolean
const erKonstruksjon: Utvalg = (d) => d.trinn >= 0 && (d.trinn === 0 || d.trinn === 1 || d.trinn === 3 || (d.trinn === 4 && d.tre))

// ── Tegningsbygger ──────────────────────────────────────────────────────

export interface ModellTegnOpts {
  /** Posisjonsmerke (A, B …) for en del – samme som kapplista. */
  merkeFor?: (d: Del3D) => string | undefined
}

interface ByggArgs {
  id: string
  navn: string
  type: Tegning['type']
  v: Visning
  deler: Del3D[]
  utvalg: Utvalg
  kutt?: number
  merkeFor?: (d: Del3D) => string | undefined
  undertittel?: string
}

function rund(v: number, steg = 1) {
  return Math.round(v / steg) * steg
}

/** Unike verdier med toleranse (mm). */
function unike(vals: number[], tol = 3): number[] {
  const s = [...vals].sort((a, b) => a - b)
  const ut: number[] = []
  for (const x of s) if (!ut.length || x - ut[ut.length - 1] > tol) ut.push(x)
  return ut
}

function byggVisning(a: ByggArgs): { tg: Tegning; synlige: Projisert[] } | null {
  const valgt = a.deler.filter(a.utvalg)
  if (valgt.length === 0) return null
  const proj2 = valgt
    .map((d) => projiserDel(d, a.v, a.kutt !== undefined ? { dybde: a.kutt } : undefined))
    .filter((p): p is Projisert => !!p && p.pts.length >= 2)
  if (proj2.length === 0) return null
  proj2.sort((p, q) => p.dybde - q.dybde)

  const el: TElement[] = []
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const p of proj2) {
    for (const [x, y] of p.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
    const tynn = !p.d.tre && (p.d.trinn === 5 || p.d.trinn === 2)
    const poly: TPoly = {
      t: 'poly',
      pts: p.pts,
      lukket: p.pts.length >= 3,
      linje: tynn ? 'tynn' : 'synlig',
      fyll: p.d.trinn === 0 && /betong|fundament|pilar|ringmur|plate/i.test(p.d.navn + p.d.part) ? 'betong' : p.d.tre ? 'tone' : 'hvit',
    }
    el.push(poly)
  }
  // Snittflater øverst (skravert, tykk kontur).
  for (const p of proj2) {
    if (!p.snitt || p.snitt.length < 3) continue
    el.push({ t: 'poly', pts: p.snitt, lukket: true, linje: 'snitt', fyll: p.d.tre ? 'tre' : /betong|fundament/i.test(p.d.navn + p.d.part) ? 'betong' : 'tett' })
  }

  const tg: Tegning = { id: a.id, navn: a.navn, type: a.type, el, geo: [x0, y0, x1, y1], undertittel: a.undertittel }

  // Terreng (y = 0) i oppriss/snitt.
  if (a.v !== 'plan') el.unshift({ t: 'terreng', y: 0, x0: x0 - 300, x1: x1 + 300 })

  // Posisjonsbobler: én per merke, på en synlig (ikke tildekket) del.
  if (a.merkeFor) {
    const plassert: P[] = []
    const minAvst = Math.max(x1 - x0, y1 - y0) * 0.045
    const grupper = new Map<string, Projisert[]>()
    for (const p of proj2) {
      const m = a.merkeFor(p.d)
      if (!m) continue
      const g = grupper.get(m) ?? []
      g.push(p)
      grupper.set(m, g)
    }
    const indeks = new Map(proj2.map((p, i) => [p, i]))
    for (const [merke, liste] of grupper) {
      // Nærmeste først – mest sannsynlig synlig.
      const kandidater = [...liste].sort((p, q) => q.dybde - p.dybde)
      for (const p of kandidater) {
        const c: P = p.snitt && p.snitt.length >= 3 ? sentroide(p.snitt) : sentroide(p.pts)
        const i = indeks.get(p) ?? 0
        const dekket = proj2.slice(i + 1).some((q) => q.pts.length >= 3 && inniKonveks(c, q.pts))
        const naer = plassert.some((q) => Math.hypot(q[0] - c[0], q[1] - c[1]) < minAvst)
        if (!dekket && !naer) {
          el.push({ t: 'pos', x: c[0], y: c[1], merke })
          plassert.push(c)
          break
        }
      }
    }
  }
  return { tg, synlige: proj2 }
}

function sentroide(pts: P[]): P {
  let x = 0, y = 0
  for (const p of pts) { x += p[0]; y += p[1] }
  return [x / pts.length, y / pts.length]
}

/** c/c-avstand for gjentatte, parallelle deler (største avstand, mm). */
export function ccAvstand(deler: Del3D[]): Map<string, number> {
  const grupper = new Map<string, Del3D[]>()
  for (const d of deler) {
    if (!d.tre || !d.akse) continue
    const k = `${d.navn}|${d.profil}`
    const g = grupper.get(k) ?? []
    g.push(d)
    grupper.set(k, g)
  }
  const ut = new Map<string, number>()
  for (const [k, g] of grupper) {
    if (g.length < 3) continue
    const a = g[0].akse!
    // Mål langs den horisontale aksen vinkelrett på delene.
    const perp: [number, number] = Math.abs(a[0]) > Math.abs(a[2]) ? [0, 1] : [1, 0]
    const loddrett = Math.abs(a[1]) > 0.9
    const sentre = g.map((d) => {
      const cx = (d.min[0] + d.max[0]) / 2
      const cz = (d.min[2] + d.max[2]) / 2
      return loddrett ? cx : perp[0] * cx + perp[1] * cz
    })
    // Del i rader (ulike plan) for loddrette: grupper på z.
    const rader = new Map<number, number[]>()
    g.forEach((d, i) => {
      const r = loddrett ? rund((d.min[2] + d.max[2]) / 2, 50) : rund(((d.min[1] + d.max[1]) / 2), 200)
      const l = rader.get(r) ?? []
      l.push(sentre[i])
      rader.set(r, l)
    })
    let maks = 0
    for (const l of rader.values()) {
      const u = unike(l, 5)
      for (let i = 1; i < u.length; i++) maks = Math.max(maks, u[i] - u[i - 1])
    }
    // Bare reelle c/c-rader (sperrer, bjelker, stendere, lekter) – ikke tilfeldige avstander.
    if (maks > 0 && maks <= 1250) ut.set(k, Math.round(maks))
  }
  return ut
}

// ── Offentlig: byggesett av konstruksjonstegninger ──────────────────────

export interface ModellTegninger {
  tegninger: Tegning[]
  /** Merker som forekommer i tegningene (til posisjonslista). */
  merker: Set<string>
}

export function byggModellTegninger(deler: Del3D[], opts: ModellTegnOpts = {}): ModellTegninger {
  const ut: Tegning[] = []
  const merker = new Set<string>()
  const ekte = deler.filter((d) => d.trinn >= 0)
  if (ekte.length === 0) return { tegninger: [], merker }
  const mf = opts.merkeFor

  // Modellens ytre mål (uten kontekst).
  const gz0 = Math.min(...ekte.map((d) => d.min[2]))
  const gz1 = Math.max(...ekte.map((d) => d.max[2]))

  const konstr = ekte.filter(erKonstruksjon)
  const fåDeler = konstr.length < 4
  const kon: Utvalg = fåDeler ? (d) => d.trinn >= 0 : erKonstruksjon

  // Stolper/loddrette bærende deler.
  const stolper = ekte.filter((d) => d.loddrett && d.tre && (d.trinn === 0 || d.trinn === 3) && /stolpe|søyle|hjørne/i.test(d.navn))

  // Snittplan (z) gjennom midten, flyttet bort fra deler som ligger akkurat der.
  let zKutt = (gz0 + gz1) / 2
  for (let forsok = 0; forsok < 8; forsok++) {
    const treff = ekte.some((d) => Math.abs(d.min[2] - zKutt) < 4 || Math.abs(d.max[2] - zKutt) < 4)
    if (!treff) break
    zKutt += 37
  }

  // 1) Fundament-/stolpeplan.
  const fundUtvalg: Utvalg = (d) => d.trinn === 0 || (d.loddrett && d.tre && d.trinn === 3)
  if (!fåDeler && ekte.some(fundUtvalg)) {
    const r = byggVisning({ id: 'k-fund', navn: 'Fundament- og stolpeplan', type: 'plan', v: 'plan', deler: ekte, utvalg: fundUtvalg, merkeFor: mf, undertittel: 'Sett ovenfra – stolper/fundament' })
    if (r) {
      const { tg } = r
      const sp = stolper.length >= 2 ? stolper : ekte.filter(fundUtvalg)
      const xs = unike(sp.map((d) => (d.min[0] + d.max[0]) / 2), 8)
      const zs = unike(sp.map((d) => (d.min[2] + d.max[2]) / 2), 8)
      const [ux0, uy0, ux1, uy1] = tg.geo
      if (xs.length >= 2 && xs.length <= 12) {
        tg.el.push({ t: 'maal', retning: 'h', punkter: xs, fra: uy1, side: 1, niva: 0 })
        xs.forEach((x, i) => tg.el.push({ t: 'akse', navn: String(i + 1), retning: 'x', pos: x }))
      }
      if (zs.length >= 2 && zs.length <= 12) {
        tg.el.push({ t: 'maal', retning: 'v', punkter: zs, fra: ux1, side: 1, niva: 0 })
        zs.forEach((z, i) => tg.el.push({ t: 'akse', navn: String.fromCharCode(65 + i), retning: 'y', pos: z }))
      }
      tg.el.push({ t: 'maal', retning: 'h', punkter: [ux0, ux1], fra: uy1, side: 1, niva: xs.length >= 2 ? 1 : 0 })
      tg.el.push({ t: 'maal', retning: 'v', punkter: [uy0, uy1], fra: ux1, side: 1, niva: zs.length >= 2 ? 1 : 0 })
      tg.el.push({ t: 'snitt', navn: 'A', a: [ux0 - 250, zKutt], b: [ux1 + 250, zKutt], retning: -1 })
      tg.nordpil = 0
      ut.push(tg)
    }
  }

  // 2) Bjelkelagsplan (lav ramme) og tak-/dragerplan.
  const bjelkelag: Utvalg = (d) => d.trinn === 1 && d.tre
  const takplan: Utvalg = (d) => d.tre && !d.loddrett && (d.trinn === 4 || d.trinn === 3) && !/lekt|sløyfe|knebånd|strever|kongstolpe|diagonal|vindski|stiver/i.test(d.navn)
  for (const [id, navn, utv, under] of [
    ['k-bjelkelag', 'Bjelkelagsplan', bjelkelag, 'Sett ovenfra – dekke ikke vist'],
    ['k-tak', ekte.some((d) => d.trinn === 4 && d.tre) ? 'Takkonstruksjon – plan' : 'Drager- og toppsvillplan', takplan, 'Sett ovenfra – tekking ikke vist'],
  ] as Array<[string, string, Utvalg, string]>) {
    // Planen må vise et lag av deler – én enkelt bjelke gir ingen mening.
    if (fåDeler || ekte.filter(utv).length < 3) continue
    const r = byggVisning({ id, navn, type: 'plan', v: 'plan', deler: ekte, utvalg: utv, merkeFor: mf, undertittel: under })
    if (!r) continue
    const { tg, synlige } = r
    const [ux0, uy0, ux1, uy1] = tg.geo
    // Kjede for den største gruppen parallelle deler (bjelker/sperrer c/c).
    const grupper = new Map<string, Projisert[]>()
    for (const p of synlige) {
      if (!p.d.akse) continue
      const k = `${p.d.navn}|${p.d.profil}`
      const g = grupper.get(k) ?? []
      g.push(p)
      grupper.set(k, g)
    }
    const storst = [...grupper.values()].sort((a, b) => b.length - a.length)[0]
    let harX = false
    let harZ = false
    if (storst && storst.length >= 3) {
      const a = storst[0].d.akse!
      const langsZ = Math.abs(a[2]) > Math.abs(a[0])
      const sentre = unike(storst.map((p) => (langsZ ? (p.d.min[0] + p.d.max[0]) / 2 : (p.d.min[2] + p.d.max[2]) / 2)), 5)
      if (sentre.length >= 3 && sentre.length <= 30) {
        if (langsZ) { tg.el.push({ t: 'maal', retning: 'h', punkter: sentre, fra: uy1, side: 1, niva: 0 }); harX = true }
        else { tg.el.push({ t: 'maal', retning: 'v', punkter: sentre, fra: ux1, side: 1, niva: 0 }); harZ = true }
      }
    }
    tg.el.push({ t: 'maal', retning: 'h', punkter: [ux0, ux1], fra: uy1, side: 1, niva: harX ? 1 : 0 })
    tg.el.push({ t: 'maal', retning: 'v', punkter: [uy0, uy1], fra: ux1, side: 1, niva: harZ ? 1 : 0 })
    ut.push(tg)
  }

  // 3) Oppriss av konstruksjonen (front + side) og 4) snitt A–A.
  const opprissDims = (tg: Tegning, synlige: Projisert[], v: Visning) => {
    const [ux0, uy0, ux1] = tg.geo
    const lodd = synlige.filter((p) => p.d.loddrett && p.d.tre)
    const us = unike(lodd.map((p) => { const c = sentroide(p.pts); return c[0] }), 8)
    let niva = 0
    if (us.length >= 2 && us.length <= 14) {
      tg.el.push({ t: 'maal', retning: 'h', punkter: us, fra: 0, side: 1, niva: 0 })
      niva = 1
    }
    tg.el.push({ t: 'maal', retning: 'h', punkter: [ux0, ux1], fra: 0, side: 1, niva })
    // Høyder: ±0, topp loddrette deler, topp konstruksjon.
    // «Topp stolper/vegger»: loddrette deler som står på fundament/bakke.
    const staaende = lodd.filter((p) => p.d.min[1] < 400)
    const toppLodd = staaende.length ? Math.max(...staaende.map((p) => p.d.max[1])) : 0
    const nivaer = unike([0, toppLodd, -uy0].filter((h) => h >= 0), 20)
    for (const h of nivaer) tg.el.push({ t: 'nivaa', y: -h, tekst: h < 1 ? '±0' : `+${Math.round(h)}` })
    if (nivaer.length >= 2) tg.el.push({ t: 'maal', retning: 'v', punkter: nivaer.map((h) => -h), fra: ux0, side: -1, niva: 0 })
    void v
  }

  const front = byggVisning({ id: 'k-front', navn: 'Oppriss forfra – konstruksjon', type: 'oppriss', v: 'front', deler: ekte, utvalg: kon, merkeFor: mf, undertittel: fåDeler ? undefined : 'Kledning, dekke og tekking ikke vist' })
  if (front) { opprissDims(front.tg, front.synlige, 'front'); ut.push(front.tg) }
  const side = byggVisning({ id: 'k-side', navn: 'Oppriss fra siden – konstruksjon', type: 'oppriss', v: 'venstre', deler: ekte, utvalg: kon, merkeFor: mf, undertittel: fåDeler ? undefined : 'Sett fra venstre – kledning ikke vist' })
  if (side) { opprissDims(side.tg, side.synlige, 'venstre'); ut.push(side.tg) }

  const snitt = byggVisning({ id: 'k-snitt', navn: 'Snitt A–A', type: 'snitt', v: 'front', deler: ekte, utvalg: (d) => d.trinn >= 0, kutt: zKutt, merkeFor: mf, undertittel: 'Snittede deler skravert' })
  if (snitt && snitt.tg.el.some((e) => e.t === 'poly' && e.linje === 'snitt')) {
    opprissDims(snitt.tg, snitt.synlige, 'front')
    ut.push(snitt.tg)
  }

  for (const tg of ut) for (const e of tg.el) if (e.t === 'pos') merker.add(e.merke)
  return { tegninger: ut, merker }
}

// ── Kontroll mot kapplista (rapport til utviklere / QA) ─────────────────

export interface Avvik { del: string; melding: string }

/**
 * Sammenligner 3D-modellen med templatets kappliste: antall og lengde per
 * del. Brukes i QA – ikke i PDF-en.
 */
export function kontrollerModell(deler: Del3D[], kappliste: Array<{ navn: string; profil: string; lengdeCm: number; antall: number }>): Avvik[] {
  const avvik: Avvik[] = []
  const iModell = new Map<string, Del3D[]>()
  for (const d of deler) {
    if (!d.tre || d.trinn < 0) continue
    const g = iModell.get(d.nokkel) ?? []
    g.push(d)
    iModell.set(d.nokkel, g)
  }
  for (const k of kappliste) {
    const key = `${k.navn}|${k.profil}|${k.lengdeCm}`
    const g = iModell.get(key)
    if (!g) {
      avvik.push({ del: key, melding: `finnes i kapplista (${k.antall} stk) men ingen 3D-del har samme navn|profil|lengde` })
      continue
    }
    if (g.length !== k.antall) avvik.push({ del: key, melding: `antall: kappliste ${k.antall}, 3D ${g.length}` })
    const lengder = unike(g.map((d) => d.lengdeMm ?? 0), 2)
    for (const L of lengder) {
      if (Math.abs(L - k.lengdeCm * 10) > 12) avvik.push({ del: key, melding: `3D-lengde ${Math.round(L)} mm ≠ kappliste ${k.lengdeCm * 10} mm` })
    }
  }
  for (const [key, g] of iModell) {
    if (!kappliste.some((k) => `${k.navn}|${k.profil}|${k.lengdeCm}` === key)) avvik.push({ del: key, melding: `3D-del (${g.length} stk) mangler i kapplista` })
    const L = g[0].lengdeMm ?? 0
    if (Math.abs(L - g[0].lengdeCm * 10) > 12) avvik.push({ del: key, melding: `userData.info.lengdeCm ${g[0].lengdeCm} cm, målt i 3D ${Math.round(L)} mm` })
  }
  return avvik
}

/**
 * Delens omriss sett fra siden (i planet der kappvinklene synes), i mm med
 * lengdeaksen langs u. Brukes til eksakte kappskisser i kapplista.
 */
export function delOmriss(d: Del3D): P[] | null {
  const a = d.akse
  if (!a) return null
  const t = d.tri
  // Finn en skrå endeflate; dens normal (uten aksekomponent) gir sideplanet.
  let np: [number, number, number] | null = null
  for (let k = 0; k < t.length && !np; k += 9) {
    const ux = t[k + 3] - t[k], uy = t[k + 4] - t[k + 1], uz = t[k + 5] - t[k + 2]
    const vx = t[k + 6] - t[k], vy = t[k + 7] - t[k + 1], vz = t[k + 8] - t[k + 2]
    let nx = uy * vz - uz * vy
    let ny = uz * vx - ux * vz
    let nz = ux * vy - uy * vx
    const A = Math.hypot(nx, ny, nz)
    if (A < 1e-6) continue
    nx /= A; ny /= A; nz /= A
    const c = nx * a[0] + ny * a[1] + nz * a[2]
    if (Math.abs(c) > 0.2 && Math.abs(c) < 0.998) {
      const px = nx - c * a[0], py = ny - c * a[1], pz = nz - c * a[2]
      const L = Math.hypot(px, py, pz)
      if (L > 1e-6) np = [px / L, py / L, pz / L]
    }
  }
  if (!np) {
    // Rett kappet: bruk retningen med størst tverrsnittsmål (bredflaten).
    const kand: Array<[number, number, number]> = [[0, 1, 0], [1, 0, 0], [0, 0, 1]]
    let best: [number, number, number] | null = null
    let bestUtstr = -1
    for (const k of kand) {
      const c = k[0] * a[0] + k[1] * a[1] + k[2] * a[2]
      const px = k[0] - c * a[0], py = k[1] - c * a[1], pz = k[2] - c * a[2]
      const L = Math.hypot(px, py, pz)
      if (L < 0.3) continue
      const v: [number, number, number] = [px / L, py / L, pz / L]
      let lo = Infinity, hi = -Infinity
      for (let i = 0; i < t.length; i += 3) {
        const p = t[i] * v[0] + t[i + 1] * v[1] + t[i + 2] * v[2]
        lo = Math.min(lo, p); hi = Math.max(hi, p)
      }
      if (hi - lo > bestUtstr) { bestUtstr = hi - lo; best = v }
    }
    np = best
  }
  if (!np) return null
  const pts: P[] = []
  let u0 = Infinity, v0 = Infinity
  for (let i = 0; i < t.length; i += 3) {
    const u = t[i] * a[0] + t[i + 1] * a[1] + t[i + 2] * a[2]
    const v = t[i] * np[0] + t[i + 1] * np[1] + t[i + 2] * np[2]
    pts.push([u, v])
    u0 = Math.min(u0, u)
    v0 = Math.min(v0, v)
  }
  return forenkle(skall(pts.map(([u, v]) => [u - u0, v - v0] as P)))
}
