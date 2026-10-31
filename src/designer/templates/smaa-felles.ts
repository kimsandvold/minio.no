import * as THREE from 'three'
import { rundOppKapp, rundVinkel } from '../geometri'
import type { BomLine, BuildOptions } from '../types'
import type { KappEnde, KapplisteDelPlan, Materialkategori, MonteringSteg } from '../plan-typer'
import { resolveColor } from '../materials'

/**
 * Felles byggeklosser for småprodukt-templatene (varmepumpehus, plantekasse,
 * postkassestativ, utekjøkken).
 *
 * Prinsippet er ÉN KILDE: templatet bygger en liste `Stav[]` (hver fysiske
 * del med eksakt geometri, navn, profil, lengde og kappvinkler). Den samme
 * lista gir 3D-meshene (`byggMesher`), kapplista (`samleKappliste`) og
 * løpemeter til materiallista (`lmPerPris`) – så 3D, kappliste og
 * materialliste kan ikke drifte fra hverandre.
 *
 * Geometri: `prisme()` lager en rett stav med vilkårlig (konveks) tverrsnitt
 * der HVER ende er et plan gitt som funksjon av tverrsnittspunktet. Dermed
 * blir skråkapp, gjæringer og loddkutt eksakte – plan-modell.ts måler
 * vinklene rett ut av meshen.
 */

export type V2 = [number, number]
export type V3 = [number, number, number]

/**
 * Prisme langs lokal x. `profil` = tverrsnittet i (y, z) (konvekst, mot
 * klokka sett fra +x). `ende0/ende1` gir x-koordinaten til endeflaten i hvert
 * profilpunkt (plan-kutt: lineær funksjon av y, z).
 */
export function prisme(
  profil0: V2[],
  ende0: (y: number, z: number) => number,
  ende1: (y: number, z: number) => number,
  /** y-nivåer der en endeflate knekker (sammensatt kapp, f.eks. hjørneklipp). */
  kniker: number[] = [],
): THREE.BufferGeometry {
  // Normaliser omløpsretningen så normalene alltid peker utover.
  const areal = profil0.reduce((s, p, i) => { const q = profil0[(i + 1) % profil0.length]; return s + p[0] * q[1] - q[0] * p[1] }, 0)
  const rå = areal > 0 ? [...profil0].reverse() : profil0
  // Sett inn hjørnepunkter der profilkantene krysser et knekknivå.
  const profil: V2[] = []
  for (let i = 0; i < rå.length; i++) {
    const p = rå[i]
    const q = rå[(i + 1) % rå.length]
    profil.push(p)
    const kryss = kniker
      .filter((k) => (k - p[0]) * (k - q[0]) < -1e-12)
      .map((k) => ({ k, t: (k - p[0]) / (q[0] - p[0]) }))
      .sort((a, b) => a.t - b.t)
    for (const { k, t } of kryss) profil.push([k, p[1] + t * (q[1] - p[1])])
  }
  const n = profil.length
  const a = profil.map(([y, z]) => new THREE.Vector3(ende0(y, z), y, z))
  const b = profil.map(([y, z]) => new THREE.Vector3(ende1(y, z), y, z))
  const pos: number[] = []
  const uv: number[] = []
  const xs = [...a, ...b].map((p) => p.x)
  const x0 = Math.min(...xs)
  const L = Math.max(1e-6, Math.max(...xs) - x0)
  const per = profil.reduce((s, p, i) => s + Math.hypot(profil[(i + 1) % n][0] - p[0], profil[(i + 1) % n][1] - p[1]), 0) || 1
  const tri = (p: THREE.Vector3, q: THREE.Vector3, r: THREE.Vector3, up: V2, uq: V2, ur: V2) => {
    pos.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z)
    uv.push(...up, ...uq, ...ur)
  }
  // Sideflater
  let acc = 0
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    const seg = Math.hypot(profil[j][0] - profil[i][0], profil[j][1] - profil[i][1])
    const v0 = acc / per
    const v1 = (acc + seg) / per
    acc += seg
    if (seg < 1e-9) continue
    const ua = (p: THREE.Vector3) => (p.x - x0) / L
    tri(a[i], b[i], b[j], [ua(a[i]), v0], [ua(b[i]), v0], [ua(b[j]), v1])
    tri(a[i], b[j], a[j], [ua(a[i]), v0], [ua(b[j]), v1], [ua(a[j]), v1])
  }
  // Endeflater: ett vifte-snitt per bånd mellom knekknivåene (eksakt plan per bånd).
  const ys = profil.map((p) => p[0])
  const zs = profil.map((p) => p[1])
  const y0 = Math.min(...ys), yL = Math.max(1e-6, Math.max(...ys) - y0)
  const z0 = Math.min(...zs), zL = Math.max(1e-6, Math.max(...zs) - z0)
  const ue = (p: THREE.Vector3): V2 => [(p.z - z0) / zL, (p.y - y0) / yL]
  const nivaa = [-Infinity, ...[...kniker].sort((u, v) => u - v), Infinity]
  for (let k = 0; k < nivaa.length - 1; k++) {
    const lo = nivaa[k] - 1e-9
    const hi = nivaa[k + 1] + 1e-9
    const idx = profil.map((_, i) => i).filter((i) => profil[i][0] >= lo && profil[i][0] <= hi)
    if (idx.length < 3) continue
    for (let m = 1; m < idx.length - 1; m++) {
      const [i0, i1, i2] = [idx[0], idx[m], idx[m + 1]]
      tri(a[i0], a[i1], a[i2], ue(a[i0]), ue(a[i1]), ue(a[i2]))
      tri(b[i0], b[i2], b[i1], ue(b[i0]), ue(b[i2]), ue(b[i1]))
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.computeVertexNormals()
  return g
}

/**
 * Transformer en (ikke-indeksert) geometri med en affin matrise. Speilende
 * matriser (negativ determinant) snur trekantene så normalene fortsatt peker ut.
 */
export function plasser(g: THREE.BufferGeometry, m: THREE.Matrix4): THREE.BufferGeometry {
  g.applyMatrix4(m)
  if (m.determinant() < 0) {
    const p = g.getAttribute('position') as THREE.BufferAttribute
    const u = g.getAttribute('uv') as THREE.BufferAttribute | undefined
    for (let i = 0; i < p.count; i += 3) {
      for (const attr of [p, u]) {
        if (!attr) continue
        const s = attr.itemSize
        for (let c = 0; c < s; c++) {
          const t = attr.array[(i + 1) * s + c]
          ;(attr.array as Float32Array)[(i + 1) * s + c] = attr.array[(i + 2) * s + c]
          ;(attr.array as Float32Array)[(i + 2) * s + c] = t
        }
      }
    }
    p.needsUpdate = true
    g.computeVertexNormals()
  }
  return g
}

/** Basis-matrise: lokale akser (x, y, z) → gitte verdensvektorer, origo i `o`. */
export function basis(x: V3, y: V3, z: V3, o: V3 = [0, 0, 0]): THREE.Matrix4 {
  return new THREE.Matrix4().set(x[0], y[0], z[0], o[0], x[1], y[1], z[1], o[1], x[2], y[2], z[2], o[2], 0, 0, 0, 1)
}

/** Akserett boks som stav-geometri (rette kapp) – senter og mål i meter. */
export function boks(cx: number, cy: number, cz: number, dx: number, dy: number, dz: number): THREE.BufferGeometry {
  const g = prisme(rektProfil(dy, dz), () => -dx / 2, () => dx / 2)
  g.translate(cx, cy, cz)
  return g
}

/** Rektangulært tverrsnitt h (y) × t (z), sentrert. */
export const rektProfil = (h: number, t: number): V2[] => [
  [-h / 2, -t / 2],
  [-h / 2, t / 2],
  [h / 2, t / 2],
  [h / 2, -t / 2],
]

/** Rett kapp ved x = konstant. */
export const rett = (x: number) => () => x

/**
 * Matrise som legger lokal x langs (b − a), lokal y langs `opp` (projisert
 * vinkelrett), origo i a. Brukes til å plassere en prisme mellom to punkter.
 */
export function orienter(a: THREE.Vector3, b: THREE.Vector3, opp: THREE.Vector3): THREE.Matrix4 {
  const x = b.clone().sub(a).normalize()
  const y = opp.clone().sub(x.clone().multiplyScalar(opp.dot(x))).normalize()
  const z = new THREE.Vector3().crossVectors(x, y).normalize()
  return new THREE.Matrix4().makeBasis(x, y, z).setPosition(a)
}

// ── Stav: én fysisk del ─────────────────────────────────────────────

export interface Stav {
  navn: string
  /** Profil som i kapplista, f.eks. «23 × 48 mm». */
  profil: string
  /** Pris-id i priser.ts (løpemeter), eller undefined (ikke trelast). */
  pris?: string
  /** Løpemeter-faktor ved innkjøp (0,5 = to deler kløyves av én lengde). */
  lmFaktor?: number
  kategori?: Materialkategori
  kvalitet?: string
  /** Eksakt kappelengde (lengste mål spiss–spiss), mm. */
  lengdeMm: number
  endeA?: KappEnde
  endeB?: KappEnde
  merknad?: string
  part: string
  pid: string
  /** Geometri i verdenskoordinater (meter). */
  geom: THREE.BufferGeometry
  darken?: number
  explode?: THREE.Vector3
  /** Eget materiale (metall, papp …) i stedet for tre. */
  materiale?: THREE.Material
  /** Ikke med i kapplista (f.eks. beslag/kontekst). */
  ikkeKapp?: boolean
}

/** Heltalls-cm som deles av 3D-info og kapplista (nøkkel navn|profil|cm). */
export const kappCm = (mm: number) => Math.round(mm / 10)

/** Lag en kappende med vinkel avrundet til 0,1°. */
export const ende = (vinkel: number, type?: KappEnde['type'], merknad?: string): KappEnde => ({ vinkel: rundVinkel(Math.abs(vinkel)), type, merknad })

export function lagMatFabrikk(treslag: string, farge: string, opts?: BuildOptions, roughness = 0.82) {
  const tex = opts?.woodTexture ?? null
  return (pid: string, darken = 1) => {
    const ov = opts?.overrides?.[pid]
    const base = new THREE.Color(resolveColor(ov?.treslag ?? treslag, ov?.farge ?? farge)).multiplyScalar(darken)
    const m = new THREE.MeshStandardMaterial({ color: base, roughness, metalness: 0.03 })
    if (tex) m.map = tex
    return m
  }
}

/** Bygg meshene for en stavliste inn i `group`. */
export function byggMesher(group: THREE.Group, staver: Stav[], mat: (pid: string, darken?: number) => THREE.Material) {
  for (const s of staver) {
    const m = new THREE.Mesh(s.geom, s.materiale ?? mat(s.pid, s.darken ?? 1))
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = s.part
    m.userData.pid = s.pid
    m.userData.info = { navn: s.navn, profil: s.profil, lengdeCm: kappCm(s.lengdeMm) }
    if (s.explode) m.userData.explode = s.explode
    group.add(m)
  }
}

/**
 * Kappliste fra stavlista: én rad per navn|profil|lengdeCm (samme nøkkel som
 * 3D-infoen), presis lengde rundet OPP til 5 mm, vinkler med 1 desimal.
 */
export function samleKappliste(staver: Stav[]): KapplisteDelPlan[] {
  const map = new Map<string, KapplisteDelPlan & { _mm: number }>()
  for (const s of staver) {
    if (s.ikkeKapp || !s.pris) continue
    const cmL = kappCm(s.lengdeMm)
    const key = `${s.navn}|${s.profil}|${cmL}`
    const ex = map.get(key)
    if (ex) {
      ex.antall += 1
      ex._mm = Math.max(ex._mm, s.lengdeMm)
      ex.lengdeMm = rundOppKapp(ex._mm)
    } else {
      map.set(key, {
        navn: s.navn,
        profil: s.profil,
        lengdeCm: cmL,
        lengdeMm: rundOppKapp(s.lengdeMm),
        antall: 1,
        kvalitet: s.kvalitet,
        endeA: s.endeA,
        endeB: s.endeB,
        merknad: s.merknad,
        kategori: s.kategori,
        _mm: s.lengdeMm,
      })
    }
  }
  return [...map.values()].map(({ _mm, ...d }) => {
    void _mm
    return d
  })
}

/** Løpemeter per pris-id (inkl. lmFaktor), fra kappelengdene. */
export function lmPerPris(staver: Stav[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const s of staver) {
    if (!s.pris || s.ikkeKapp) continue
    m.set(s.pris, (m.get(s.pris) ?? 0) + (rundOppKapp(s.lengdeMm) / 1000) * (s.lmFaktor ?? 1))
  }
  return m
}

/** «23 × 48 mm» */
export const prof = (a: number, b: number) => `${a} × ${b} mm`

/** Avrund til 0,1 og skriv med komma. */
export const f1 = (v: number) => (Math.round(v * 10) / 10).toFixed(1).replace('.', ',')
/** Hele tall med tusenskille-fritt komma-format. */
export const f0 = (v: number) => String(Math.round(v))

/** Materiallinje i løpemeter med svinn. */
export function lmLinje(navn: string, lm: number, svinn: number, ekstra: Partial<BomLine> & Record<string, unknown> = {}): BomLine {
  return { navn, antall: Math.round(lm * svinn * 10) / 10, enhet: 'lm', kommentar: `inkl. ${Math.round((svinn - 1) * 100)} % kapp/svinn`, ...ekstra }
}

/** Monteringssteg → klassisk tekstliste (nummereres av skallet). */
export const stegTilTekst = (steg: MonteringSteg[]) => steg.map((s) => `${s.tittel}: ${s.tekst}${s.advarsel ? ` NB: ${s.advarsel}` : ''}`)

// ── Plan-kutt for skrå staver ───────────────────────────────────────

export const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const add3 = (a: V3, b: V3, s = 1): V3 => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s]

/**
 * Kuttfunksjon u(p, q) for planet n·P = e, der staven er P = O + u·eU +
 * p·eA + q·eB (eA/eB = profilaksene). Gir eksakte skrå-/kinn-/loddkutt.
 */
export const kuttPlan = (O: V3, eU: V3, eA: V3, eB: V3, n: V3, e: number) => (p: number, q: number) =>
  (e - dot3(n, add3(add3(O, eA, p), eB, q))) / dot3(n, eU)

/** Lengde spiss–spiss for en stav med ender s0/s1 over profilpunktene. */
export const stavLengde = (pts: V2[], s0: (p: number, q: number) => number, s1: (p: number, q: number) => number) => {
  const us = pts.flatMap(([p, q]) => [s0(p, q), s1(p, q)])
  return Math.max(...us) - Math.min(...us)
}
