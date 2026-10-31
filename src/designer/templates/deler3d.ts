import * as THREE from 'three'
import type { BuildOptions, KapplisteDel } from '../types'
import type { KappEnde, KapplisteDelPlan, Materialkategori } from '../plan-typer'
import { resolveColor } from '../materials'
import { rundOppKapp } from '../geometri'

/**
 * Del-modell for templater som bygger ALT (3D, materialliste, kappliste,
 * 2D-tegninger og kamera-bounds) fra én og samme liste med beregnede deler.
 * Da kan ikke 3D og byggeplan drifte fra hverandre.
 *
 * Enheter: meter i 3D-koordinater (x = bredde, y = høyde, z = dybde/front),
 * mm for kappelengder.
 */

export type V3 = [number, number, number]

/** Fargekilde: 'tre' = valgt treslag/beis, 'impregnert' = synlig konstruksjon i NTR-virke, ellers faste farger. */
export type Fargekilde = 'tre' | 'impregnert' | 'betong' | 'stal' | 'poly' | 'mork'

interface DelFelles {
  pid: string
  /** 3D-lag (userData.part). */
  part: string
  /** Kappliste-/hover-navn. */
  navn: string
  /** «48 × 198 mm». */
  profil: string
  /** Eksakt lengde langs delen, mm (kappliste rundes opp til 5 mm). */
  lengdeMm: number
  /** Kommer delen med i kapplista (trelast)? */
  kapp: boolean
  kategori?: Materialkategori
  kvalitet?: string
  endeA?: KappEnde
  endeB?: KappEnde
  merknad?: string
  farge: Fargekilde
  darken?: number
  /** Retning delen flyr ut i splittvisning. */
  explode?: V3
  /** Halvgjennomsiktig (f.eks. terrassebord i «begge»-visning). */
  gjennomsiktig?: number
}

/** Rett stav (bjelke, stolpe, lekt, bord) fra a til b med rektangulært tverrsnitt. */
export interface Stav extends DelFelles {
  type: 'stav'
  a: V3
  b: V3
  /** Mål vinkelrett på aksen i «sideretningen» (m). */
  bredde: number
  /** Mål vinkelrett på aksen i «opp-retningen» (m). */
  hoyde: number
  /** Ønsket opp-retning (standard: verdens y; for loddrette staver: z). */
  opp?: V3
}

/** Plan polygon (u, v) i et plan med origo o og akser u/v, ekstrudert ±tykk/2 langs u×v. */
export interface Prisme extends DelFelles {
  type: 'prisme'
  pts: Array<[number, number]>
  o: V3
  u: V3
  v: V3
  tykk: number
}

/** Loddrett sylinder (betongpilar) med senter bunn c. */
export interface Sylinder extends DelFelles {
  type: 'sylinder'
  c: V3
  r: number
  h: number
}

export type Del = Stav | Prisme | Sylinder

// ── Vektorhjelpere ─────────────────────────────────────────────────

export const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
export const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
export const mul = (a: V3, s: number): V3 => [a[0] * s, a[1] * s, a[2] * s]
export const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
export const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
export const len = (a: V3) => Math.hypot(a[0], a[1], a[2])
export const norm = (a: V3): V3 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}

/** Ortonormal basis for en stav: x' langs aksen, y' «opp», z' = x' × y'. */
function stavBasis(d: Stav): { x: V3; y: V3; z: V3; L: number } {
  const ax = sub(d.b, d.a)
  const L = len(ax)
  const x = norm(ax)
  let upHint: V3 = d.opp ?? [0, 1, 0]
  if (Math.abs(dot(upHint, x)) > 0.999) upHint = d.opp && Math.abs(dot(d.opp, x)) < 0.999 ? d.opp : [0, 0, 1]
  const y = norm(sub(upHint, mul(x, dot(upHint, x))))
  const z = cross(x, y)
  return { x, y, z, L }
}

/** Alle hjørnepunkter (til bounds / 2D). */
export function hjorner(d: Del): V3[] {
  if (d.type === 'stav') {
    const { y, z } = stavBasis(d)
    const out: V3[] = []
    for (const p of [d.a, d.b]) for (const sy of [-0.5, 0.5]) for (const sz of [-0.5, 0.5]) out.push(add(add(p, mul(y, sy * d.hoyde)), mul(z, sz * d.bredde)))
    return out
  }
  if (d.type === 'prisme') {
    const w = cross(d.u, d.v)
    const out: V3[] = []
    for (const [pu, pv] of d.pts) for (const s of [-0.5, 0.5]) out.push(add(add(add(d.o, mul(d.u, pu)), mul(d.v, pv)), mul(w, s * d.tykk)))
    return out
  }
  const out: V3[] = []
  for (let i = 0; i < 16; i++) {
    const v = (i / 16) * Math.PI * 2
    for (const y of [0, d.h]) out.push([d.c[0] + Math.cos(v) * d.r, d.c[1] + y, d.c[2] + Math.sin(v) * d.r])
  }
  return out
}

export interface Boks {
  min: V3
  max: V3
}

export function boks(deler: Del[], filter: (d: Del) => boolean = () => true): Boks {
  const min: V3 = [Infinity, Infinity, Infinity]
  const max: V3 = [-Infinity, -Infinity, -Infinity]
  for (const d of deler) {
    if (!filter(d)) continue
    for (const p of hjorner(d)) for (let i = 0; i < 3; i++) {
      if (p[i] < min[i]) min[i] = p[i]
      if (p[i] > max[i]) max[i] = p[i]
    }
  }
  return { min, max }
}

/** Flytt alle deler med v (in place). */
export function flytt(deler: Del[], v: V3) {
  for (const d of deler) {
    if (d.type === 'stav') {
      d.a = add(d.a, v)
      d.b = add(d.b, v)
    } else if (d.type === 'prisme') d.o = add(d.o, v)
    else d.c = add(d.c, v)
  }
}

// ── 3D ─────────────────────────────────────────────────────────────

const FASTE: Record<Exclude<Fargekilde, 'tre' | 'impregnert'>, number> = {
  betong: 0xb9b6ae,
  stal: 0x9aa1a8,
  poly: 0xd6e6ec,
  mork: 0x3a3a38,
}

export interface MeshKontekst {
  treslag: string
  farge: string
  opts?: BuildOptions
}

function materialFor(d: Del, k: MeshKontekst): THREE.MeshStandardMaterial {
  const ov = k.opts?.overrides?.[d.pid]
  let color: number
  let rough = 0.82
  let metal = 0.03
  let tre = true
  if (d.farge === 'tre') color = resolveColor(ov?.treslag ?? k.treslag, ov?.farge ?? k.farge)
  else if (d.farge === 'impregnert') color = resolveColor(ov?.treslag ?? 'impregnert', ov?.farge ?? 'ubehandlet')
  else {
    color = FASTE[d.farge]
    tre = false
    if (d.farge === 'stal') {
      rough = 0.45
      metal = 0.6
    } else if (d.farge === 'poly') {
      rough = 0.3
      metal = 0.05
    } else rough = 0.95
  }
  const base = new THREE.Color(color).multiplyScalar(d.darken ?? 1)
  const m = new THREE.MeshStandardMaterial({ color: base, roughness: rough, metalness: metal })
  if (tre && k.opts?.woodTexture) m.map = k.opts.woodTexture
  const alpha = d.gjennomsiktig ?? (d.farge === 'poly' ? 0.5 : undefined)
  if (alpha !== undefined && alpha < 1) {
    m.transparent = true
    m.opacity = alpha
    m.depthWrite = false
  }
  if (d.type === 'prisme') m.side = THREE.DoubleSide
  return m
}

export function delMesh(d: Del, k: MeshKontekst): THREE.Mesh {
  let geom: THREE.BufferGeometry
  const mat4 = new THREE.Matrix4()
  if (d.type === 'stav') {
    const { x, y, z, L } = stavBasis(d)
    geom = new THREE.BoxGeometry(Math.max(L, 0.001), Math.max(d.hoyde, 0.001), Math.max(d.bredde, 0.001))
    geom.translate(L / 2, 0, 0)
    mat4.makeBasis(new THREE.Vector3(...x), new THREE.Vector3(...y), new THREE.Vector3(...z))
    mat4.setPosition(d.a[0], d.a[1], d.a[2])
  } else if (d.type === 'prisme') {
    const shape = new THREE.Shape()
    shape.moveTo(d.pts[0][0], d.pts[0][1])
    for (let i = 1; i < d.pts.length; i++) shape.lineTo(d.pts[i][0], d.pts[i][1])
    shape.closePath()
    geom = new THREE.ExtrudeGeometry(shape, { depth: d.tykk, bevelEnabled: false })
    geom.translate(0, 0, -d.tykk / 2)
    const w = cross(d.u, d.v)
    mat4.makeBasis(new THREE.Vector3(...d.u), new THREE.Vector3(...d.v), new THREE.Vector3(...w))
    mat4.setPosition(d.o[0], d.o[1], d.o[2])
  } else {
    geom = new THREE.CylinderGeometry(d.r, d.r, d.h, 24)
    geom.translate(0, d.h / 2, 0)
    mat4.makeTranslation(d.c[0], d.c[1], d.c[2])
  }
  geom.applyMatrix4(mat4)
  // Flytt geometrien til lokalt origo i senter så posisjon/eksplosjon blir naturlig.
  geom.computeBoundingBox()
  const c = new THREE.Vector3()
  geom.boundingBox!.getCenter(c)
  geom.translate(-c.x, -c.y, -c.z)
  const mesh = new THREE.Mesh(geom, materialFor(d, k))
  mesh.position.copy(c)
  mesh.castShadow = d.farge !== 'poly'
  mesh.receiveShadow = true
  mesh.userData.part = d.part
  mesh.userData.pid = d.pid
  mesh.userData.info = { navn: d.navn, profil: d.profil, lengdeCm: Math.round(d.lengdeMm / 10) }
  if (d.explode) mesh.userData.explode = new THREE.Vector3(...d.explode)
  if (d.gjennomsiktig !== undefined || d.farge === 'poly') mesh.renderOrder = 2
  return mesh
}

export function byggGruppe(deler: Del[], k: MeshKontekst): THREE.Group {
  const g = new THREE.Group()
  for (const d of deler) g.add(delMesh(d, k))
  return g
}

// ── Kappliste ──────────────────────────────────────────────────────

const vinkelNokkel = (e?: KappEnde) => (e && e.vinkel > 0.05 ? `${e.vinkel.toFixed(1)}${e.type ?? ''}` : '0')
/** Speilvendte deler (kapp A/B byttet) er samme kapp – sorter endene. */
function ender(d: Del): [KappEnde | undefined, KappEnde | undefined] {
  const a = d.endeA
  const b = d.endeB
  return vinkelNokkel(a) >= vinkelNokkel(b) ? [a, b] : [b, a]
}
const fmtV = (e?: KappEnde) => (e && e.vinkel > 0.05 ? `${e.vinkel.toFixed(1).replace('.', ',')}°` : 'rett')

/**
 * Gjør navn unike når samme navn|profil|lengde finnes med ulike kappvinkler,
 * slik at kapplista og 3D-delene (userData.info) får samme nøkkel per rad.
 * Kall etter at alle deler er laget, før mesh/kappliste.
 */
export function unikeKappnavn(deler: Del[]) {
  const grupper = new Map<string, Set<string>>()
  for (const d of deler) {
    if (!d.kapp) continue
    const k = `${d.navn}|${d.profil}|${Math.round(d.lengdeMm / 10)}`
    const [a, b] = ender(d)
    const s = grupper.get(k) ?? new Set<string>()
    s.add(`${vinkelNokkel(a)}|${vinkelNokkel(b)}`)
    grupper.set(k, s)
  }
  for (const d of deler) {
    if (!d.kapp) continue
    const k = `${d.navn}|${d.profil}|${Math.round(d.lengdeMm / 10)}`
    if ((grupper.get(k)?.size ?? 0) > 1) {
      const [a, b] = ender(d)
      d.navn = `${d.navn} (${fmtV(a)}/${fmtV(b)})`
    }
  }
}

/**
 * Grupper trelast-deler til kapplisterader. Nøkkel = navn|profil|lengdeCm|vinkler.
 * `lengdeCm` er eksakt lengde avrundet (samme som 3D-ens userData.info), og
 * `lengdeMm` er kappelengden rundet OPP til 5 mm.
 */
export function kapplisteFra(deler: Del[], posFor?: (d: Del) => string | undefined): KapplisteDelPlan[] {
  const map = new Map<string, KapplisteDelPlan>()
  for (const d of deler) {
    if (!d.kapp) continue
    const lengdeCm = Math.round(d.lengdeMm / 10)
    const [ea, eb] = ender(d)
    const key = `${d.navn}|${d.profil}|${lengdeCm}|${vinkelNokkel(ea)}|${vinkelNokkel(eb)}`
    const ex = map.get(key)
    if (ex) {
      ex.antall++
      ex.lengdeMm = Math.max(ex.lengdeMm ?? 0, rundOppKapp(d.lengdeMm))
      continue
    }
    map.set(key, {
      navn: d.navn,
      profil: d.profil,
      lengdeCm,
      lengdeMm: rundOppKapp(d.lengdeMm),
      antall: 1,
      kvalitet: d.kvalitet,
      endeA: ea,
      endeB: eb,
      merknad: d.merknad,
      kategori: d.kategori,
      pos: posFor?.(d),
    })
  }
  return [...map.values()]
}

/** Sum løpemeter (eksakt) per filter. */
export function lopemeter(deler: Del[], f: (d: Del) => boolean): number {
  return deler.filter(f).reduce((s, d) => s + d.lengdeMm / 1000, 0)
}

export const antall = (deler: Del[], f: (d: Del) => boolean) => deler.filter(f).length

/** Kappliste-rader → enkle `KapplisteDel` (for kode som bare leser grunnfeltene). */
export function somKappliste(rader: KapplisteDelPlan[]): KapplisteDel[] {
  return rader
}

/** Avrund til 1 desimal (BOM-mengder). */
export const r1 = (v: number) => Math.round(v * 10) / 10

/** Pris fra prislista med lokal reserve når posten mangler (meld i rapport). */
export function prisMed(priser: Record<string, { pris: number }>, id: string, reserve: number): number {
  return priser[id]?.pris ?? reserve
}

// ── 2D-projeksjon (tegninger fra de samme delene) ──────────────────

export type Visning = 'plan' | 'front' | 'hoyre'

/** Konveks innhylling (monoton kjede). */
export function skall2D(pts: Array<[number, number]>): Array<[number, number]> {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  if (p.length < 3) return p
  const kryss = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
  const lo: Array<[number, number]> = []
  for (const q of p) {
    while (lo.length >= 2 && kryss(lo[lo.length - 2], lo[lo.length - 1], q) <= 1e-9) lo.pop()
    lo.push(q)
  }
  const hi: Array<[number, number]> = []
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i]
    while (hi.length >= 2 && kryss(hi[hi.length - 2], hi[hi.length - 1], q) <= 1e-9) hi.pop()
    hi.push(q)
  }
  return lo.slice(0, -1).concat(hi.slice(0, -1))
}

/**
 * Projiser en del til tegningsplanet (cm, y nedover). Plan: u = x, v = z.
 * Front (sett fra +z): u = x, v = topp − y. Høyre (sett fra +x): u = zMaks − z, v = topp − y.
 * Prismer med planet parallelt med tegningen gir eksakt omriss (ikke skall).
 */
export function projiser(d: Del, v: Visning, ref: { minX: number; minZ: number; maxZ: number; topY: number }): Array<[number, number]> {
  const P = (p: V3): [number, number] => {
    if (v === 'plan') return [Math.round((p[0] - ref.minX) * 1000) / 10, Math.round((p[2] - ref.minZ) * 1000) / 10]
    if (v === 'front') return [Math.round((p[0] - ref.minX) * 1000) / 10, Math.round((ref.topY - p[1]) * 1000) / 10]
    return [Math.round((ref.maxZ - p[2]) * 1000) / 10, Math.round((ref.topY - p[1]) * 1000) / 10]
  }
  if (d.type === 'prisme') {
    const w = cross(d.u, d.v)
    const sikt: V3 = v === 'plan' ? [0, 1, 0] : v === 'front' ? [0, 0, 1] : [1, 0, 0]
    if (Math.abs(dot(w, sikt)) > 0.999) return d.pts.map(([pu, pv]) => P(add(add(d.o, mul(d.u, pu)), mul(d.v, pv))))
  }
  return skall2D(hjorner(d).map(P))
}

/** Utstrekning (m) av et 2D-omriss langs retningen dir (tip–tip-lengde for kapplista). */
export function utstrekning(pts: Array<[number, number]>, dir: [number, number]): number {
  const l = Math.hypot(dir[0], dir[1]) || 1
  const p = pts.map(([u, v]) => (u * dir[0] + v * dir[1]) / l)
  return Math.max(...p) - Math.min(...p)
}
