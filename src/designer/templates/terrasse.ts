import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'

/**
 * Terrasse – parametrisk template (migrert fra Terrasseplanleggeren).
 *
 * Terrassen bygges opp av ett eller flere rektangler (rektangel, L-form,
 * speilvendt L, U-form). Hvert rektangel får bærebjelker (kantbjelker) langs
 * lengden, tverrbjelker c/c 60 cm og terrassebord på tvers. Under står
 * bærestolper på punktfundament. Valgfritt rekkverk (gjerde) langs ytterkanten
 * og en frontrapp. En halvgjennomsiktig «skyggevegg» viser husveggen terrassen
 * ligger inntil.
 *
 * Konfig-mål er i CENTIMETER (designer-sliderne er cm); geometrien regnes i
 * meter slik Terrasseplanleggeren gjorde.
 */

export interface TerrasseConfig {
  form: string // 'rektangel' | 'lForm' | 'lFormSpeil' | 'uForm'
  lengde: number // cm (x)
  bredde: number // cm (z)
  hovedLengde: number // cm (z)
  hovedBredde: number // cm (x)
  floyLengde: number // cm (z)
  floyBredde: number // cm (x)
  ytreLengde: number // cm (z)
  ytreBredde: number // cm (x)
  armBredde: number // cm
  hoyde: number // cm – gulvhøyde over bakken
  bjelkeDim: string // '48x98' | '48x148' | '48x198'
  bordbredde: string // '90' | '120' | '145' (mm)
  gjerdeType: string // 'ingen' | 'vannrett' | 'loddrett' | 'spiler' | 'hel'
  gjerdeHoyde: number // cm
  gjerdeSider: string // 'ytterkant' | 'alle'
  trapp: string // 'ingen' | 'front'
  trappTrinn: number
  visning: string // 'begge' | 'overflate' | 'konstruksjon'
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const cm = (v: number) => v / 100

const BOARD_T = 0.028 // terrassebord-tykkelse (m)
const BOARD_GAP = 0.004 // spalte mellom bord
const JOIST_W = 0.048 // bjelkebredde
const JOIST_CC = 0.6 // c/c tverrbjelker
const POST = 0.098 // bæostolpe
const POST_CC = 1.9 // maks c/c bærestolper
const RAIL_POST = 0.07 // rekkverksstolpe
const RAIL_CC = 1.2 // maks c/c rekkverksstolper

const bjelkeHoyde = (dim: string) => (dim === '48x98' ? 0.098 : dim === '48x198' ? 0.198 : 0.148)
const bjelkePrisId = (dim: string) => (dim === '48x98' ? 'bjelke-48x98' : dim === '48x198' ? 'bjelke-48x198' : 'bjelke-48x148')
const bordB = (c: TerrasseConfig) => (parseInt(c.bordbredde, 10) || 120) / 1000

interface Rekt {
  x: number
  z: number
  w: number
  d: number
} // meter; x/w langs X, z/d langs Z

function rekter(c: TerrasseConfig): Rekt[] {
  const L = cm(c.lengde)
  const B = cm(c.bredde)
  const hL = cm(c.hovedLengde)
  const hB = cm(c.hovedBredde)
  const fL = cm(c.floyLengde)
  const fB = cm(c.floyBredde)
  const yL = cm(c.ytreLengde)
  const yB = cm(c.ytreBredde)
  const a = cm(c.armBredde)
  switch (c.form) {
    case 'lForm':
      return [
        { x: 0, z: 0, w: hB, d: hL },
        { x: hB, z: hL - fL, w: fB, d: fL },
      ]
    case 'lFormSpeil':
      return [
        { x: fB, z: 0, w: hB, d: hL },
        { x: 0, z: hL - fL, w: fB, d: fL },
      ]
    case 'uForm':
      return [
        { x: 0, z: 0, w: yB, d: a },
        { x: 0, z: a, w: a, d: yL - a },
        { x: yB - a, z: a, w: a, d: yL - a },
      ]
    default:
      return [{ x: 0, z: 0, w: L, d: B }]
  }
}

function outline(c: TerrasseConfig): Array<[number, number]> {
  const L = cm(c.lengde)
  const B = cm(c.bredde)
  const hL = cm(c.hovedLengde)
  const hB = cm(c.hovedBredde)
  const fL = cm(c.floyLengde)
  const fB = cm(c.floyBredde)
  const yL = cm(c.ytreLengde)
  const yB = cm(c.ytreBredde)
  const a = cm(c.armBredde)
  switch (c.form) {
    case 'lForm':
      return [
        [0, 0],
        [hB, 0],
        [hB, hL - fL],
        [hB + fB, hL - fL],
        [hB + fB, hL],
        [0, hL],
      ]
    case 'lFormSpeil': {
      const W = hB + fB
      return [
        [W, 0],
        [fB, 0],
        [fB, hL - fL],
        [0, hL - fL],
        [0, hL],
        [W, hL],
      ]
    }
    case 'uForm':
      return [
        [0, 0],
        [yB, 0],
        [yB, yL],
        [yB - a, yL],
        [yB - a, a],
        [a, a],
        [a, yL],
        [0, yL],
      ]
    default:
      return [
        [0, 0],
        [L, 0],
        [L, B],
        [0, B],
      ]
  }
}

function overall(c: TerrasseConfig) {
  const rs = rekter(c)
  let minX = Infinity
  let minZ = Infinity
  let maxX = -Infinity
  let maxZ = -Infinity
  for (const r of rs) {
    minX = Math.min(minX, r.x)
    minZ = Math.min(minZ, r.z)
    maxX = Math.max(maxX, r.x + r.w)
    maxZ = Math.max(maxZ, r.z + r.d)
  }
  return { minX, minZ, maxX, maxZ, w: maxX - minX, d: maxZ - minZ, cx: (minX + maxX) / 2, cz: (minZ + maxZ) / 2 }
}

// ── Materialliste ──────────────────────────────────────────────────

function beregn(c: TerrasseConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const rs = rekter(c)
  const bw = bordB(c)
  const eff = bw + BOARD_GAP

  let areal = 0
  let bordLm = 0
  let bordAntall = 0
  let tverrLm = 0
  let tverrAntall = 0
  let kantLm = 0
  let kantAntall = 0
  let skruer = 0
  for (const r of rs) {
    areal += r.w * r.d
    const across = Math.max(1, Math.ceil(r.w / eff))
    bordAntall += across
    bordLm += across * r.d
    const joists = Math.floor(r.d / JOIST_CC) + 1
    tverrAntall += joists
    tverrLm += joists * r.w
    kantAntall += 2
    kantLm += 2 * r.d
    skruer += across * joists * 2
  }

  // Bærestolper: rutenett pr. delrektangel.
  let stolpeAntall = 0
  for (const r of rs) {
    const nx = Math.max(2, Math.ceil(r.w / POST_CC) + 1)
    const nz = Math.max(2, Math.ceil(r.d / POST_CC) + 1)
    stolpeAntall += nx * nz
  }

  // Gjerde langs ytterkant (evt. alle sider).
  const segs = railSegments(c)
  const gjerdeLengde = segs.reduce((s, seg) => s + Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]), 0)
  const rh = cm(c.gjerdeHoyde)
  let gjerdeBord = 0
  let gjerdeStolper = 0
  let gjerdeLektLm = 0
  if (c.gjerdeType !== 'ingen' && gjerdeLengde > 0) {
    gjerdeStolper = Math.max(2, Math.ceil(gjerdeLengde / RAIL_CC) + segs.length)
    if (c.gjerdeType === 'vannrett') {
      const rader = Math.max(2, Math.ceil(rh / 0.12))
      gjerdeBord = Math.ceil((rader * gjerdeLengde) / eff)
    } else if (c.gjerdeType === 'loddrett') {
      gjerdeBord = Math.ceil(gjerdeLengde / eff)
    } else if (c.gjerdeType === 'spiler') {
      gjerdeBord = Math.ceil(gjerdeLengde / 0.1)
    } else {
      gjerdeBord = Math.ceil(gjerdeLengde / 1.8) * Math.max(1, Math.ceil(rh / 1.8))
    }
    gjerdeLektLm = 2 * gjerdeLengde + gjerdeStolper * rh
  }

  // Trapp foran.
  const trinn = c.trapp === 'front' ? stairSteps(c) : 0

  const bordPris = prisFor('terrassebord-28x120')
  const bjPris = prisFor(bjelkePrisId(c.bjelkeDim))
  const woodKr = (bordLm * bordPris + (tverrLm + kantLm) * bjPris) * faktor
  const stolpeKr = stolpeAntall * POST_HEIGHT_LM(c) * prisFor('stolpe-98x98') * faktor
  const gjerdeKr = (gjerdeBord * prisFor('bord-21x98') + gjerdeLektLm * prisFor('lekt-11x36')) * faktor + gjerdeStolper * prisFor('stolpe-48x98') * faktor
  const skrueKr = (skruer + gjerdeBord * 4 + trinn * 20) * prisFor('skrue')
  const trappKr = trinn > 0 ? trinn * 90 * faktor + 2 * prisFor('trappevange') : 0
  const estimatKr = Math.round(((woodKr + stolpeKr + gjerdeKr + trappKr) * SVINN + skrueKr) / 10) * 10

  const linjer: BomLine[] = [
    { navn: PRISER['terrassebord-28x120'].navn, spesifikasjon: `${Math.round(bw * 1000)} × 28 mm`, antall: Math.round(bordLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${bordAntall} bord · inkl. 10 % svinn` },
    { navn: `Tverrbjelke ${c.bjelkeDim.replace('x', '×')} mm`, antall: Math.round(tverrLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${tverrAntall} stk c/c 60 cm` },
    { navn: `Kantbjelke ${c.bjelkeDim.replace('x', '×')} mm`, antall: Math.round(kantLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${kantAntall} stk` },
    { navn: 'Bærestolpe 98 × 98 mm', antall: stolpeAntall, enhet: 'stk', kommentar: 'på justerbar stolpesko' },
    { navn: PRISER['stolpesko'].navn, antall: stolpeAntall, enhet: 'stk' },
  ]
  if (gjerdeBord > 0) {
    linjer.push({ navn: `Rekkverksbord (${c.gjerdeType})`, antall: gjerdeBord, enhet: 'stk' })
    linjer.push({ navn: 'Rekkverksstolpe 48 × 98 mm', antall: gjerdeStolper, enhet: 'stk' })
    linjer.push({ navn: PRISER['lekt-11x36'].navn, antall: Math.round(gjerdeLektLm * SVINN * 10) / 10, enhet: 'lm', kommentar: 'topp-/bunnlekt' })
  }
  if (trinn > 0) {
    linjer.push({ navn: 'Trappetrinn', antall: Math.max(1, trinn - 1), enhet: 'trinn', kommentar: 'nederste trinn = bakken' })
    linjer.push({ navn: PRISER['trappevange'].navn, antall: 2, enhet: 'stk', kommentar: `${trinn} trinn · kjøpes ferdig` })
  }
  linjer.push({ navn: 'Terrasseskruer', spesifikasjon: 'rustfri A4', antall: Math.round((skruer + gjerdeBord * 4 + trinn * 20) / 10) * 10, enhet: 'stk' })

  const sammendrag = `${formNavn(c.form)} · ${areal.toFixed(1)} m² · ${c.hoyde} cm høyde · bjelke ${c.bjelkeDim.replace('x', '×')} · ${c.gjerdeType === 'ingen' ? 'uten rekkverk' : `${c.gjerdeType} rekkverk`} · ${TRESLAG[c.treslag]?.label ?? c.treslag}`
  const ov = overall(c)
  const maal = `${Math.round(ov.w * 100)} × ${Math.round(ov.d * 100)} cm`
  return { linjer, estimatKr, sammendrag, arealM2: areal, maal }
}

const POST_HEIGHT_LM = (c: TerrasseConfig) => Math.max(0.2, cm(c.hoyde) - BOARD_T - bjelkeHoyde(c.bjelkeDim))

// Antall trinn følger gulvhøyden (standard opptrinn ≈ 18 cm).
const OPPTRINN = 0.18
const stairSteps = (c: TerrasseConfig) => Math.max(1, Math.round(cm(c.hoyde) / OPPTRINN))

function formNavn(f: string): string {
  return f === 'lForm' ? 'Hjørne høyre (L)' : f === 'lFormSpeil' ? 'Hjørne venstre (L)' : f === 'uForm' ? 'U-form' : 'Rektangel'
}

// Rekkverkssegmenter (modellkoordinater). Med gjerdeSider = 'ytterkant' hoppes
// husveggsiden over: for rektangel/L er det bakkanten (y≈0), for U-form er det
// gårdsplassen inni (segmenter som ikke ligger på ytre bounding-box).
function railSegments(c: TerrasseConfig): Array<[[number, number], [number, number]]> {
  if (c.gjerdeType === 'ingen') return []
  const pts = outline(c)
  const ov = overall(c)
  const near = (v: number, t: number) => Math.abs(v - t) < 0.02
  const segs: Array<[[number, number], [number, number]]> = []
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    let skip = false
    if (c.gjerdeSider !== 'alle') {
      if (c.form === 'uForm') {
        // Behold kun segmenter på den ytre kanten; dropp gårdsplass-innerkanten.
        const vertikalYtre = near(a[0], b[0]) && (near(a[0], ov.minX) || near(a[0], ov.maxX))
        const horisontalYtre = near(a[1], b[1]) && (near(a[1], ov.minZ) || near(a[1], ov.maxZ))
        skip = !(vertikalYtre || horisontalYtre)
      } else {
        skip = near(a[1], 0) && near(b[1], 0) // bakkant mot huset
      }
    }
    if (!skip) segs.push([a, b])
  }
  return segs
}

// ── Kappliste ──────────────────────────────────────────────────────

function kappliste(c: TerrasseConfig): KapplisteDel[] {
  const rs = rekter(c)
  const bw = bordB(c)
  const eff = bw + BOARD_GAP
  const bjStr = `${c.bjelkeDim.replace('x', '×')} mm`
  const map = new Map<string, KapplisteDel>()
  const add = (navn: string, profil: string, lengdeCm: number, antall: number) => {
    const key = `${navn}|${profil}|${lengdeCm}`
    const ex = map.get(key)
    if (ex) ex.antall += antall
    else map.set(key, { navn, profil, lengdeCm, antall })
  }
  for (const r of rs) {
    const across = Math.max(1, Math.ceil(r.w / eff))
    add('Terrassebord', `${Math.round(bw * 1000)} × 28 mm`, Math.round(r.d * 100), across)
    const joists = Math.floor(r.d / JOIST_CC) + 1
    add('Tverrbjelke', bjStr, Math.round(r.w * 100), joists)
    add('Kantbjelke', bjStr, Math.round(r.d * 100), 2)
    const nx = Math.max(2, Math.ceil(r.w / POST_CC) + 1)
    const nz = Math.max(2, Math.ceil(r.d / POST_CC) + 1)
    add('Bærestolpe', '98 × 98 mm', Math.round(POST_HEIGHT_LM(c) * 100), nx * nz)
  }
  const segs = railSegments(c)
  if (segs.length) {
    const rh = cm(c.gjerdeHoyde)
    const len = segs.reduce((s, seg) => s + Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]), 0)
    add('Rekkverksstolpe', '48 × 98 mm', Math.round(rh * 100), Math.max(2, Math.ceil(len / RAIL_CC) + segs.length))
  }
  if (c.trapp === 'front') {
    const trinn = stairSteps(c)
    const diag = Math.hypot(trinn * 0.3, cm(c.hoyde))
    add('Trappetrinn', `${Math.round(bordB(c) * 1000)} × 28 mm`, 100, Math.max(1, trinn - 1))
    add('Trappevange (ferdig)', 'utfrest', Math.round(diag * 100), 2)
  }
  return [...map.values()]
}

// ── 3D-modell ──────────────────────────────────────────────────────

function buildMesh(c: TerrasseConfig, opts?: BuildOptions): THREE.Group {
  const group = new THREE.Group()
  const tex = opts?.woodTexture ?? null
  const meshMat = (pid: string, darken = 1) => {
    const ov = opts?.overrides?.[pid]
    const treslag = ov?.treslag ?? c.treslag
    const farge = ov?.farge ?? c.farge
    const base = new THREE.Color(resolveColor(treslag, farge)).multiplyScalar(darken)
    const m = new THREE.MeshStandardMaterial({ color: base, roughness: 0.82, metalness: 0.03 })
    if (tex) m.map = tex
    return m
  }

  const ov = overall(c)
  const wx = (px: number) => px - ov.cx
  const wz = (pz: number) => pz - ov.cz
  const H = cm(c.hoyde)
  const jh = bjelkeHoyde(c.bjelkeDim)
  const bw = bordB(c)
  const eff = bw + BOARD_GAP
  const deckTop = H
  const joistTop = deckTop - BOARD_T
  const joistBot = joistTop - jh
  const postH = Math.max(0.1, joistBot)

  const addBox = (
    w: number,
    hgt: number,
    d: number,
    part: string,
    pid: string,
    darken: number,
    px: number,
    py: number,
    pz: number,
    info: { navn: string; profil: string; lengdeCm: number },
    explode: THREE.Vector3,
    mat?: THREE.Material,
  ) => {
    const geom = new THREE.BoxGeometry(Math.max(w, 0.001), Math.max(hgt, 0.001), Math.max(d, 0.001))
    const m = new THREE.Mesh(geom, mat ?? meshMat(pid, darken))
    m.position.set(px, py, pz)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = part
    m.userData.pid = pid
    m.userData.info = info
    m.userData.explode = explode
    group.add(m)
    return m
  }

  const rs = rekter(c)
  const bjStr = `${c.bjelkeDim.replace('x', '×')} mm`

  // Visning: overflate (bord+rekkverk), konstruksjon (bjelkelag+stolper) eller
  // begge (bordene gjøres gjennomsiktige så du ser konstruksjonen under).
  const showStruct = c.visning !== 'overflate'
  const showSurface = c.visning !== 'konstruksjon'
  const boardTransparent = c.visning === 'begge'
  const boardMat = (pid: string) => {
    const m = meshMat(pid)
    if (boardTransparent) {
      m.transparent = true
      m.opacity = 0.45
      m.depthWrite = false
    }
    return m
  }

  rs.forEach((r, ri) => {
    // Bærestolper (rutenett).
    const nx = Math.max(2, Math.ceil(r.w / POST_CC) + 1)
    const nz = Math.max(2, Math.ceil(r.d / POST_CC) + 1)
    if (showStruct)
      for (let i = 0; i < nx; i++) {
        for (let j = 0; j < nz; j++) {
          const px = r.x + (i / (nx - 1)) * r.w
          const pz = r.z + (j / (nz - 1)) * r.d
          const ix = Math.min(Math.max(px, r.x + POST / 2), r.x + r.w - POST / 2)
          const iz = Math.min(Math.max(pz, r.z + POST / 2), r.z + r.d - POST / 2)
          addBox(POST, postH, POST, 'stolpe', `stolpe-${ri}-${i}-${j}`, 1, wx(ix), postH / 2, wz(iz), { navn: 'Bærestolpe', profil: '98 × 98 mm', lengdeCm: Math.round(postH * 100) }, new THREE.Vector3(0, -0.4, 0))
        }
      }
    // Kantbjelker langs Z på begge X-sider.
    if (showStruct)
      [r.x + JOIST_W / 2, r.x + r.w - JOIST_W / 2].forEach((bx, k) => {
        addBox(JOIST_W, jh, r.d, 'bjelke', `kant-${ri}-${k}`, 0.92, wx(bx), joistBot + jh / 2, wz(r.z + r.d / 2), { navn: 'Kantbjelke', profil: bjStr, lengdeCm: Math.round(r.d * 100) }, new THREE.Vector3(0, -0.25, 0))
      })
    // Tverrbjelker langs X, c/c 60 cm.
    const joists = Math.floor(r.d / JOIST_CC) + 1
    if (showStruct)
      for (let j = 0; j < joists; j++) {
        const pz = joists === 1 ? r.z + r.d / 2 : r.z + (j / (joists - 1)) * r.d
        const iz = Math.min(Math.max(pz, r.z + JOIST_W / 2), r.z + r.d - JOIST_W / 2)
        addBox(r.w, jh, JOIST_W, 'bjelke', `tverr-${ri}-${j}`, 1, wx(r.x + r.w / 2), joistBot + jh / 2, wz(iz), { navn: 'Tverrbjelke', profil: bjStr, lengdeCm: Math.round(r.w * 100) }, new THREE.Vector3(0, -0.2, 0))
      }
    // Terrassebord på tvers (langs Z), tilet over X.
    if (showSurface) {
      const across = Math.max(1, Math.ceil(r.w / eff))
      for (let i = 0; i < across; i++) {
        const bx = r.x + i * eff + bw / 2
        if (bx > r.x + r.w) break
        const w = Math.min(bw, r.x + r.w - (r.x + i * eff))
        addBox(w, BOARD_T, r.d, 'bord', `bord-${ri}-${i}`, 1, wx(bx), deckTop - BOARD_T / 2, wz(r.z + r.d / 2), { navn: 'Terrassebord', profil: `${Math.round(bw * 1000)} × 28 mm`, lengdeCm: Math.round(r.d * 100) }, new THREE.Vector3(0, 0.5, 0), boardMat(`bord-${ri}-${i}`))
      }
    }
  })

  // ── Skyggevegg (hus) langs bakkant (y≈0) for ikke-U-former ──────────
  if (c.form !== 'uForm') {
    const wallH = H + 1.3
    const ghostGeo = new THREE.BoxGeometry(ov.w + 0.6, wallH, 0.05)
    const ghostMat = new THREE.MeshStandardMaterial({ color: 0x9fb0c2, transparent: true, opacity: 0.16, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, depthWrite: false })
    const ghost = new THREE.Mesh(ghostGeo, ghostMat)
    ghost.position.set(wx(ov.cx), wallH / 2, wz(ov.minZ) - 0.05)
    ghost.renderOrder = -1
    ghost.userData.part = 'husvegg'
    ghost.userData.pid = 'husvegg'
    ghost.userData.info = { navn: 'Husvegg (medfølger ikke)', profil: 'eksisterende vegg', lengdeCm: Math.round((ov.w + 0.6) * 100) }
    ghost.userData.explode = new THREE.Vector3(0, 0, -0.5)
    group.add(ghost)
  }

  // Praktisk trappeplassering: sentrert på den ytre fronten som vender bort fra
  // huset. z er kanten (planner-y), dir hvilken vei trappa går ut.
  const stairW = Math.min(1.4, Math.max(0.9, ov.w * 0.45))
  const stair =
    c.trapp !== 'front'
      ? null
      : c.form === 'uForm'
        ? { xc: cm(c.ytreBredde) / 2, z: ov.minZ, dir: -1 }
        : c.form === 'lForm'
          ? { xc: cm(c.hovedBredde) / 2, z: ov.maxZ, dir: 1 }
          : c.form === 'lFormSpeil'
            ? { xc: cm(c.floyBredde) + cm(c.hovedBredde) / 2, z: ov.maxZ, dir: 1 }
            : { xc: ov.cx, z: ov.maxZ, dir: 1 }

  // ── Rekkverk langs ytterkant (med åpning der trappa er) ─────────────
  const segs = railSegments(c)
  if (segs.length && showSurface) {
    const rh = cm(c.gjerdeHoyde)
    const railMat = () => meshMat('gjerde', 0.96)

    const drawRail = (ax: number, az: number, bx: number, bz: number, si: string) => {
      const dx = bx - ax
      const dz = bz - az
      const segLen = Math.hypot(dx, dz)
      if (segLen < 0.2) return
      const ux = dx / segLen
      const uz = dz / segLen
      const ang = Math.atan2(-dz, dx) // legg boksens X-akse langs segmentet
      const nPosts = Math.max(2, Math.ceil(segLen / RAIL_CC) + 1)
      for (let i = 0; i < nPosts; i++) {
        const t = (i / (nPosts - 1)) * segLen
        const g = addBox(RAIL_POST, rh, RAIL_POST, 'gjerde', `rekk-stolpe-${si}-${i}`, 0.96, ax + ux * t, deckTop + rh / 2, az + uz * t, { navn: 'Rekkverksstolpe', profil: '48 × 98 mm', lengdeCm: Math.round(rh * 100) }, new THREE.Vector3(0, 0.3, 0))
        g.rotation.y = ang
      }
      const rail = (y: number, tag: string) => {
        const m = addBox(segLen, 0.045, 0.045, 'gjerde', `rekk-${tag}-${si}`, 0.96, (ax + bx) / 2, y, (az + bz) / 2, { navn: 'Håndløper/lekt', profil: '45 × 45 mm', lengdeCm: Math.round(segLen * 100) }, new THREE.Vector3(0, 0.3, 0))
        m.rotation.y = ang
      }
      rail(deckTop + rh - 0.04, 'topp')
      rail(deckTop + 0.06, 'bunn')
      if (c.gjerdeType === 'hel') {
        const infill = railMat()
        infill.side = THREE.DoubleSide
        const p = addBox(segLen, rh - 0.12, 0.02, 'gjerde', `rekk-panel-${si}`, 0.96, (ax + bx) / 2, deckTop + rh / 2, (az + bz) / 2, { navn: 'Panel', profil: 'kledning', lengdeCm: Math.round(segLen * 100) }, new THREE.Vector3(0, 0.3, 0), infill)
        p.rotation.y = ang
      } else if (c.gjerdeType === 'vannrett') {
        const rader = Math.max(2, Math.ceil(rh / 0.14))
        for (let r = 0; r < rader; r++) {
          const y = deckTop + 0.12 + (r / Math.max(1, rader - 1)) * (rh - 0.2)
          const m = addBox(segLen, 0.09, 0.022, 'gjerde', `rekk-h-${si}-${r}`, 0.96, (ax + bx) / 2, y, (az + bz) / 2, { navn: 'Vannrett bord', profil: '98 × 21 mm', lengdeCm: Math.round(segLen * 100) }, new THREE.Vector3(0, 0.3, 0), railMat())
          m.rotation.y = ang
        }
      } else {
        const spile = c.gjerdeType === 'loddrett' ? bw : 0.03
        const gap = c.gjerdeType === 'loddrett' ? BOARD_GAP : 0.07
        const step = spile + gap
        const n = Math.max(2, Math.floor(segLen / step))
        for (let i = 0; i <= n; i++) {
          const t = Math.min(segLen, i * step + spile / 2)
          const m = addBox(spile, rh - 0.14, 0.022, 'gjerde', `rekk-v-${si}-${i}`, 0.96, ax + ux * t, deckTop + 0.06 + (rh - 0.14) / 2, az + uz * t, { navn: c.gjerdeType === 'loddrett' ? 'Loddrett bord' : 'Spile', profil: c.gjerdeType === 'loddrett' ? `${Math.round(bw * 1000)} × 21 mm` : '30 × 21 mm', lengdeCm: Math.round((rh - 0.14) * 100) }, new THREE.Vector3(0, 0.3, 0), railMat())
          m.rotation.y = ang
        }
      }
    }

    const openHalf = stair ? stairW / 2 + 0.12 : 0
    segs.forEach((seg, si) => {
      const [a, b] = seg
      const lo = Math.min(a[0], b[0])
      const hi = Math.max(a[0], b[0])
      const onStairEdge = stair != null && Math.abs(a[1] - stair.z) < 0.02 && Math.abs(b[1] - stair.z) < 0.02 && Math.abs(a[1] - b[1]) < 0.02
      if (onStairEdge && stair && stair.xc > lo + 0.05 && stair.xc < hi - 0.05) {
        // Del rekkverket i to og la åpningen stå der trappa er.
        const z = wz(a[1])
        const openLo = Math.max(lo, stair.xc - openHalf)
        const openHi = Math.min(hi, stair.xc + openHalf)
        drawRail(wx(lo), z, wx(openLo), z, `${si}a`)
        drawRail(wx(openHi), z, wx(hi), z, `${si}b`)
      } else {
        drawRail(wx(a[0]), wz(a[1]), wx(b[0]), wz(b[1]), `${si}`)
      }
    })
  }

  // ── Trapp på praktisk ytterkant ─────────────────────────────────────
  if (stair && showSurface) {
    const trinn = stairSteps(c)
    const stepDepth = 0.3
    const riser = deckTop / trinn
    const cxw = wx(stair.xc)
    const run = trinn * stepDepth
    // Trinn – nederste «trinn» er selve bakken, så vi hopper over det. Bare
    // trappevangene går helt ned til bakken.
    for (let s = 0; s < trinn - 1; s++) {
      const y = deckTop - (s + 1) * riser // overkant trinn (øverste ett opptrinn under dekket)
      const zc = stair.z + stair.dir * (stepDepth / 2 + s * stepDepth)
      addBox(stairW, BOARD_T, stepDepth, 'bord', `trapp-${s}`, 1, cxw, y - BOARD_T / 2, wz(zc), { navn: 'Trappetrinn', profil: `${Math.round(bw * 1000)} × 28 mm`, lengdeCm: Math.round(stairW * 100) }, new THREE.Vector3(0, 0.4, stair.dir * ((s + 1) / trinn) * 0.3))
    }
    // Trappevanger på hver side: utfrest (sagtannet) vange – trinnutsparinger på
    // toppen, vannrett bunn på bakken og loddrett bakkant mot dekket.
    const TH = 0.045
    const sx = (u: number) => wz(stair.z + stair.dir * u) // lokal u (m langs trappa) → verden-Z
    // Sagtann-profil (u, y) fra dekkant og ned til bakken.
    const prof: Array<[number, number]> = [[0, deckTop]]
    for (let s = 0; s < trinn; s++) {
      const y = deckTop - (s + 1) * riser
      prof.push([s * stepDepth, y]) // loddrett opptrinn
      prof.push([(s + 1) * stepDepth, y]) // vannrett inntrinn (der trinnet hviler)
    }
    prof.push([run, 0]) // fremre fot på bakken
    prof.push([0, 0]) // bakre fot på bakken (loddrett bakkant lukkes til [0, deckTop])
    ;[cxw - stairW / 2 + TH / 2, cxw + stairW / 2 - TH / 2].forEach((vx, k) => {
      const shape = new THREE.Shape()
      shape.moveTo(sx(prof[0][0]), prof[0][1])
      for (let i = 1; i < prof.length; i++) shape.lineTo(sx(prof[i][0]), prof[i][1])
      shape.closePath()
      const geom = new THREE.ExtrudeGeometry(shape, { depth: TH, bevelEnabled: false })
      geom.rotateY(-Math.PI / 2) // shape-X → verden-Z, ekstrudering → verden-X
      geom.translate(vx + TH / 2, 0, 0)
      const mat = meshMat(`trappevange-${k}`, 0.9)
      mat.side = THREE.DoubleSide
      const mesh = new THREE.Mesh(geom, mat)
      mesh.castShadow = true
      mesh.receiveShadow = true
      mesh.userData.part = 'bord'
      mesh.userData.pid = `trappevange-${k}`
      mesh.userData.info = { navn: 'Trappevange', profil: `ferdig utfrest, ${trinn} trinn`, lengdeCm: Math.round(Math.hypot(run, deckTop) * 100) }
      mesh.userData.explode = new THREE.Vector3(stair.dir * 0.25, 0.2, stair.dir * 0.25)
      group.add(mesh)
    })
  }

  // Hesteskoen vender riktig vei: snu 180° så åpningen/gårdsplassen peker bakover
  // og trappa vender mot betrakteren.
  if (c.form === 'uForm') group.rotation.y = Math.PI

  return group
}

// ── Template ───────────────────────────────────────────────────────

// ── Målsatt 2D-tegning (plan + oppriss) ────────────────────────────
function tegning2D(c: TerrasseConfig): Tegning2D {
  const ov = overall(c)
  const W = Math.round(ov.w * 100)
  const D = Math.round(ov.d * 100)
  const gulv = c.hoyde
  const rail = c.gjerdeType !== 'ingen' ? c.gjerdeHoyde : 0
  const deckThk = 8
  const post = 10
  const H = gulv + rail
  const deckTopY = H - gulv // overkant dekke fra topp (y=0)

  const oppriss = (len: number, navn: string, id: string): Tegning2D['riss'][number] => {
    const former: Tegning2D['riss'][number]['former'] = [
      { type: 'rect', x: 0, y: deckTopY, w: len, h: deckThk }, // dekke + bjelke
      { type: 'rect', x: 4, y: deckTopY + deckThk, w: post, h: gulv - deckThk }, // stolpe v
      { type: 'rect', x: len - 4 - post, y: deckTopY + deckThk, w: post, h: gulv - deckThk }, // stolpe h
    ]
    if (rail > 0) {
      former.push({ type: 'line', points: [[0, 0], [len, 0]] }) // topphåndlist
      former.push({ type: 'line', points: [[2, deckTopY], [2, 0]], tynn: true })
      former.push({ type: 'line', points: [[len - 2, deckTopY], [len - 2, 0]], tynn: true })
      for (let x = len / 5; x < len; x += len / 5) former.push({ type: 'line', points: [[x, deckTopY], [x, 0]], tynn: true })
    }
    const maal: Tegning2D['riss'][number]['maal'] = [
      { x1: 0, y1: H, x2: len, y2: H, label: `${len} cm`, offset: 26 },
      { x1: 0, y1: deckTopY, x2: 0, y2: H, label: `${gulv} cm`, offset: 24 },
    ]
    if (rail > 0) maal.push({ x1: len, y1: 0, x2: len, y2: deckTopY, label: `${rail} cm`, offset: 22 })
    return { id, navn, bredde: len, hoyde: H, former, maal }
  }

  return {
    riss: [
      oppriss(W, 'Forfra', 'forfra'),
      oppriss(D, 'Fra siden', 'siden'),
      {
        id: 'plan',
        navn: 'Ovenfra (plan)',
        bredde: W,
        hoyde: D,
        former: [{ type: 'rect', x: 0, y: 0, w: W, h: D }],
        maal: [
          { x1: 0, y1: D, x2: W, y2: D, label: `${W} cm`, offset: 26 },
          { x1: 0, y1: 0, x2: 0, y2: D, label: `${D} cm`, offset: 24 },
        ],
      },
    ],
  }
}

// ── Veiledende byggeregler (søknadsplikt) ──────────────────────────
// Åpen terrasse/platting inntil 0,5 m over terrenget er normalt unntatt
// søknadsplikt (SAK10 § 4-1). Er den høyere, regnes den som søknadspliktig
// tiltak og teller med i bebygd areal (BYA). Veiledende – kommunen avgjør.
function byggeregler(c: TerrasseConfig) {
  const areal = rekter(c).reduce((s, r) => s + r.w * r.d, 0)
  const hoydeM = cm(c.hoyde)
  const overGrense = hoydeM > 0.5
  const sokfri = !overGrense
  const punkter: string[] = []
  if (overGrense) {
    punkter.push(`Gulvhøyde ${c.hoyde} cm er over 0,5 m over terrenget – en hevet terrasse regnes da som søknadspliktig tiltak og teller med i bebygd areal (BYA).`)
  } else {
    punkter.push(`Gulvhøyde ${c.hoyde} cm er innenfor 0,5 m over terrenget – en åpen terrasse/platting er normalt unntatt søknadsplikt (SAK10 § 4-1).`)
  }
  if (overGrense) {
    punkter.push(
      c.gjerdeType === 'ingen'
        ? 'Fallhøyde over 0,5 m krever rekkverk (TEK17 § 12-15) – legg til rekkverk for sikker bruk.'
        : `Rekkverk ${c.gjerdeHoyde} cm: ved stor fallhøyde bør rekkverket være minst 1,0 m (TEK17 § 12-15/§ 12-17).`,
    )
  }
  punkter.push(`Grunnflate ${areal.toFixed(1)} m². Avstand til nabogrense må normalt være minst 1,0 m for søknadsfrie tiltak.`)
  punkter.push('Veiledende – sjekk alltid reguleringsplan og kommunens regler. Du er selv ansvarlig.')
  return { sokfri, tittel: sokfri ? 'Trolig søknadsfri' : 'Søknad kreves trolig', punkter }
}

// ── Søknadsklart tegningssett (plan + fasader + snitt) ─────────────
// Klassifiserte riss (type satt) → PDF-heftet legger på terrenglinje på
// fasader/snitt, grafisk målestokk og tittelfelt.
type Riss = Tegning2D['riss'][number]
function soknadTegning(c: TerrasseConfig): Tegning2D {
  const ov = overall(c)
  const W = Math.round(ov.w * 100)
  const D = Math.round(ov.d * 100)
  const gulv = c.hoyde
  const rail = c.gjerdeType !== 'ingen' ? c.gjerdeHoyde : 0
  const deckThk = 8
  const post = 10
  const jh = Math.round(bjelkeHoyde(c.bjelkeDim) * 100)
  const H = gulv + rail
  const deckTopY = H - gulv // overkant dekke fra topp (y = 0)

  // Fasade/oppriss med stolper ned til terreng (terrenglinje tegnes i heftet).
  const fasade = (len: number, navn: string, id: string): Riss => {
    const former: Riss['former'] = [
      { type: 'rect', x: 0, y: deckTopY, w: len, h: deckThk },
      { type: 'rect', x: 4, y: deckTopY + deckThk, w: post, h: gulv - deckThk },
      { type: 'rect', x: len - 4 - post, y: deckTopY + deckThk, w: post, h: gulv - deckThk },
    ]
    if (rail > 0) {
      former.push({ type: 'line', points: [[0, 0], [len, 0]] })
      former.push({ type: 'line', points: [[2, deckTopY], [2, 0]], tynn: true })
      former.push({ type: 'line', points: [[len - 2, deckTopY], [len - 2, 0]], tynn: true })
      for (let x = len / 5; x < len - 1; x += len / 5) former.push({ type: 'line', points: [[x, deckTopY], [x, 0]], tynn: true })
    }
    const maal: Riss['maal'] = [
      { x1: 0, y1: H, x2: len, y2: H, label: `${len} cm`, offset: 26 },
      { x1: 0, y1: deckTopY, x2: 0, y2: H, label: `${gulv} cm`, offset: 24 },
    ]
    if (rail > 0) maal.push({ x1: len, y1: 0, x2: len, y2: deckTopY, label: `${rail} cm`, offset: 22 })
    return { id, navn, bredde: len, hoyde: H, former, maal, type: 'fasade' }
  }

  // Snitt: tverrsnitt gjennom terrassebord, bærebjelke og stolpe ned til terreng.
  const snitt: Riss = (() => {
    const len = D
    const former: Riss['former'] = [
      { type: 'rect', x: 0, y: deckTopY, w: len, h: deckThk }, // terrassebord
      { type: 'rect', x: 0, y: deckTopY + deckThk, w: len, h: jh, tynn: true }, // bærebjelke
      { type: 'rect', x: 8, y: deckTopY + deckThk + jh, w: post, h: Math.max(2, gulv - deckThk - jh) }, // stolpe v
      { type: 'rect', x: len - 8 - post, y: deckTopY + deckThk + jh, w: post, h: Math.max(2, gulv - deckThk - jh) }, // stolpe h
    ]
    if (rail > 0) {
      former.push({ type: 'line', points: [[2, deckTopY], [2, 0]], tynn: true })
      former.push({ type: 'line', points: [[len - 2, deckTopY], [len - 2, 0]], tynn: true })
    }
    const maal: Riss['maal'] = [
      { x1: 0, y1: H, x2: len, y2: H, label: `${len} cm`, offset: 26 },
      { x1: 0, y1: deckTopY, x2: 0, y2: H, label: `${gulv} cm`, offset: 24 },
    ]
    return { id: 'snitt', navn: 'Snitt A–A', bredde: len, hoyde: H, former, maal, type: 'snitt' }
  })()

  // Plan: fotavtrykk (konturen) med hovedmål.
  const planPts = outline(c).map(([x, z]) => [Math.round(x * 100), Math.round(z * 100)] as [number, number])
  const plan: Riss = {
    id: 'plan',
    navn: 'Plan (ovenfra)',
    bredde: W,
    hoyde: D,
    former: [{ type: 'poly', points: planPts }],
    maal: [
      { x1: 0, y1: D, x2: W, y2: D, label: `${W} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: D, label: `${D} cm`, offset: 24 },
    ],
    type: 'plan',
  }

  return { riss: [plan, fasade(W, 'Fasade forfra', 'fasade-forfra'), fasade(D, 'Fasade fra siden', 'fasade-siden'), snitt] }
}

export const terrasse: ProductTemplate<TerrasseConfig> = {
  id: 'terrasse',
  navn: 'Terrasse',
  ikon: 'faBorderAll',
  beskrivelse: 'Tegn terrassen i 3D – rektangel, L-form eller U-form, med bærestolper, valgfritt rekkverk og trapp.',
  bilde: '/images/products/terrasse-3d.webp',
  tilgjengelig: true,
  fraPris: 349,
  // Materialpakke tilbys ikke for terrasse – kun forespør bygging + byggeplan.
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    form: 'rektangel',
    lengde: 500,
    bredde: 300,
    hovedLengde: 600,
    hovedBredde: 300,
    floyLengde: 300,
    floyBredde: 250,
    ytreLengde: 600,
    ytreBredde: 700,
    armBredde: 200,
    hoyde: 50,
    bjelkeDim: '48x148',
    bordbredde: '120',
    gjerdeType: 'spiler',
    gjerdeHoyde: 90,
    gjerdeSider: 'ytterkant',
    trapp: 'front',
    trappTrinn: 3,
    visning: 'begge',
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'liten', navn: 'Liten uteplass', beskrivelse: 'Kompakt sittehjørne', config: { form: 'rektangel', lengde: 300, bredde: 200, gjerdeType: 'ingen', trapp: 'front', trappTrinn: 2 } },
    { id: 'klassisk', navn: 'Klassisk terrasse', beskrivelse: 'Rekkverk langs ytterkant', config: { form: 'rektangel', lengde: 400, bredde: 250, gjerdeType: 'spiler', gjerdeHoyde: 90, gjerdeSider: 'ytterkant', trapp: 'front', trappTrinn: 3 } },
    { id: 'hjorne-v', navn: 'Hjørne venstre', beskrivelse: 'L-form rundt to vegger', config: { form: 'lFormSpeil', hovedLengde: 600, hovedBredde: 300, floyLengde: 300, floyBredde: 250, gjerdeType: 'loddrett', gjerdeSider: 'ytterkant', trapp: 'front', trappTrinn: 3 } },
    { id: 'hjorne-h', navn: 'Hjørne høyre', beskrivelse: 'L-form rundt to vegger', config: { form: 'lForm', hovedLengde: 600, hovedBredde: 300, floyLengde: 300, floyBredde: 250, gjerdeType: 'loddrett', gjerdeSider: 'ytterkant', trapp: 'front', trappTrinn: 3 } },
    { id: 'familie', navn: 'Stor familieterrasse', beskrivelse: 'Rekkverk rundt, bred trapp', config: { form: 'rektangel', lengde: 700, bredde: 400, bjelkeDim: '48x198', gjerdeType: 'spiler', gjerdeSider: 'alle', trapp: 'front', trappTrinn: 4 } },
    { id: 'hestesko', navn: 'Hesteskoterrasse', beskrivelse: 'U-form rundt tre vegger', config: { form: 'uForm', ytreLengde: 600, ytreBredde: 700, armBredde: 200, gjerdeType: 'spiler', gjerdeSider: 'ytterkant', trapp: 'front', trappTrinn: 3 } },
  ],
  dimensjoner: [
    { key: 'lengde', label: 'Lengde', min: 150, max: 1200, step: 10, axis: 'x', visibleWhen: (c) => c.form === 'rektangel' },
    { key: 'bredde', label: 'Bredde', min: 150, max: 800, step: 10, axis: 'z', visibleWhen: (c) => c.form === 'rektangel' },
    { key: 'hovedBredde', label: 'Hovedbredde', min: 150, max: 900, step: 10, axis: 'x', visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'hovedLengde', label: 'Hovedlengde', min: 150, max: 1200, step: 10, axis: 'z', visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'floyBredde', label: 'Fløybredde', min: 100, max: 600, step: 10, axis: 'x', handle: false, visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'floyLengde', label: 'Fløylengde', min: 100, max: 800, step: 10, axis: 'z', handle: false, visibleWhen: (c) => c.form === 'lForm' || c.form === 'lFormSpeil' },
    { key: 'ytreBredde', label: 'Ytre bredde', min: 300, max: 1000, step: 10, axis: 'x', visibleWhen: (c) => c.form === 'uForm' },
    { key: 'ytreLengde', label: 'Ytre lengde', min: 300, max: 1000, step: 10, axis: 'z', visibleWhen: (c) => c.form === 'uForm' },
    { key: 'armBredde', label: 'Armbredde', min: 100, max: 400, step: 10, axis: 'x', handle: false, visibleWhen: (c) => c.form === 'uForm' },
    { key: 'hoyde', label: 'Gulvhøyde', min: 15, max: 150, step: 5, axis: 'y' },
    { key: 'gjerdeHoyde', label: 'Rekkverkshøyde', min: 70, max: 120, step: 5, axis: 'y', handle: false, visibleWhen: (c) => c.gjerdeType !== 'ingen' },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'visning',
      label: 'Visning',
      choices: [
        { id: 'begge', label: 'Begge', note: 'Overflate + konstruksjon (bord gjennomsiktige).' },
        { id: 'overflate', label: 'Overflate', note: 'Kun terrassebord og rekkverk.' },
        { id: 'konstruksjon', label: 'Konstruksjon', note: 'Kun bjelkelag og bærestolper.' },
      ],
    },
    {
      key: 'form',
      label: 'Form',
      choices: [
        { id: 'rektangel', label: 'Rektangel', note: 'Langs én husvegg.' },
        { id: 'lForm', label: 'Hjørne høyre', note: 'L-form rundt to sider.' },
        { id: 'lFormSpeil', label: 'Hjørne venstre', note: 'L-form rundt to sider.' },
        { id: 'uForm', label: 'U-form', note: 'Hestesko – tre sider.' },
      ],
    },
    {
      key: 'bjelkeDim',
      label: 'Bjelkedimensjon',
      choices: [
        { id: '48x98', label: '48 × 98 mm', note: 'Lav terrasse / korte spenn.' },
        { id: '48x148', label: '48 × 148 mm' },
        { id: '48x198', label: '48 × 198 mm', note: 'Størst spennvidde.' },
      ],
    },
    {
      key: 'bordbredde',
      label: 'Bordbredde',
      choices: [
        { id: '90', label: '90 mm' },
        { id: '120', label: '120 mm' },
        { id: '145', label: '145 mm' },
      ],
    },
    {
      key: 'gjerdeType',
      label: 'Rekkverk',
      choices: [
        { id: 'ingen', label: 'Uten' },
        { id: 'spiler', label: 'Spiler', note: 'Loddrette spiler med luft.' },
        { id: 'loddrett', label: 'Loddrett', note: 'Tette loddrette bord.' },
        { id: 'vannrett', label: 'Vannrett', note: 'Vannrette bord.' },
        { id: 'hel', label: 'Hel', note: 'Tett panel.' },
      ],
    },
    {
      key: 'gjerdeSider',
      label: 'Rekkverk på',
      visibleWhen: (c) => c.gjerdeType !== 'ingen',
      choices: [
        { id: 'ytterkant', label: 'Ytterkant', note: 'Ikke mot husveggen.' },
        { id: 'alle', label: 'Alle sider' },
      ],
    },
    {
      key: 'trapp',
      label: 'Trapp',
      choices: [
        { id: 'ingen', label: 'Ingen' },
        { id: 'front', label: 'Foran', note: 'Sentrert trapp ned fra fronten.' },
      ],
    },
  ],
  parts: [
    { key: 'bord', label: 'Terrassebord' },
    { key: 'bjelke', label: 'Bjelkelag' },
    { key: 'stolpe', label: 'Bærestolper' },
    { key: 'gjerde', label: 'Rekkverk' },
  ],
  beregn,
  kappliste,
  tegning2D,
  soknadTegning,
  byggeregler,
  montering: (c) => {
    const steg = [
      'Kapp materialene etter kapplista. Sett av c/c 60 cm for bjelkelaget og merk opp fundamentene.',
      'Støp punktfundamenter i frostfri dybde og sett justerbare stolpesko i vater etter rutenettet.',
      'Reis bærestolpene i skoene, lodd dem og avstiv midlertidig. Kontroller diagonalmål så alt er i vinkel.',
      'Monter kantbjelker og tverrbjelker (c/c 60 cm) i vater til et stivt bjelkelag.',
      'Legg terrassebordene på tvers med 4–6 mm spalte, og skru fast med to skruer i hvert kryss.',
    ]
    if (c.gjerdeType !== 'ingen') steg.push('Fest rekkverksstolpene gjennomgående i bjelkelaget og monter håndløper, bunnlekt og fyll (spiler/bord/panel). Hold åpninger < 100 mm der barn ferdes.')
    if (c.trapp === 'front') steg.push('Skjær ut trappevangene (eller kjøp ferdige) og monter trinnene – nederste «trinn» er bakken.')
    steg.push('Kontroller vater og innfestinger, og behandle virket (beis/olje) etter at det har tørket.')
    return steg
  },
  raad: (c) => [
    'Sett bærestolpene på støpte punktfundamenter (frostfri dybde) i justerbare stolpesko – aldri trevirke direkte mot bakken.',
    'Legg bjelkelaget i vater med c/c 60 cm; kontroller diagonalmål så terrassen blir i vinkel før du skrur fast bordene.',
    'Legg terrassebordene med 4–6 mm spalte for drenering og bevegelse, og la den «beste» siden vende opp.',
    c.gjerdeType !== 'ingen'
      ? 'Fest rekkverksstolpene gjennomgående i bjelkelaget (bolt/vinkelbeslag), ikke bare i endeveden. Åpning i rekkverket skal være < 100 mm der barn ferdes.'
      : 'Rekkverk anbefales når gulvet er mer enn 50 cm over terrenget – og er påbudt over ca. 60–100 cm.',
    'Bruk rustfrie (A4) terrasseskruer og forbor gjerne i endene så bordene ikke sprekker.',
    'Er terrassen ≥ 0,5 m over terreng eller nær nabogrense kan den være søknadspliktig – sjekk med kommunen.',
  ],
  buildMesh,
  bounds: (c) => {
    const ov = overall(c)
    const rail = c.gjerdeType !== 'ingen' ? cm(c.gjerdeHoyde) : 0
    return {
      x: ov.w + 0.6,
      y: cm(c.hoyde) + rail + 0.2,
      z: ov.d + (c.trapp === 'front' ? 1.2 : 0.3) + 0.6,
    }
  },
}
