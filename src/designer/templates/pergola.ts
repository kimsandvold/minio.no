import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'

/**
 * Pergola – parametrisk template (migrert fra Pergolaplanleggeren).
 *
 * Stolper bærer dragere langs bredden; spær ligger på tvers oppå dragerne, og
 * på toppen ligger solskjerm (lekter, skråstilte spjeld eller tett tak).
 * Valgfri sideskjerm (spalér/vannrett/tett) på utvalgte sider. Veggmontert
 * variant fester bakre drager til husveggen (skyggevegg vises).
 *
 * Konfig-mål er i CENTIMETER (designer-sliderne er cm); geometrien regnes i
 * meter slik planleggeren gjorde.
 */

export interface PergolaConfig {
  montering: string // 'frittstående' | 'veggmontert'
  bredde: number // cm (x – langs huset)
  dybde: number // cm (z – ut fra huset)
  hoyde: number // cm (stolpehøyde til underkant drager)
  stolpeDim: string // '98x98' | '148x148'
  bjelkeDim: string // '48x148' | '48x198' | '48x223'
  taktype: string // 'åpen' | 'lekter' | 'spjeld' | 'tett'
  lektAvstand: number // cm mellom takslekter (30–60)
  skjermtype: string // 'ingen' | 'spalér' | 'horisontal' | 'tett'
  skjermSider: string // 'bak' | 'bak+sider' | 'alle'
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const cm = (v: number) => v / 100
const rad = (d: number) => (d * Math.PI) / 180

const OH = 0.2 // utstikk på spær/dragere (m)
const RAFTER_W = 0.048 // spærbredde
const LEKT = 0.048 // takslekt / skjermspile
const SPAR_CC = 0.6 // c/c spær (m)
const STOLPE_CC = 2.6 // maks c/c stolper (m)

const stolpeSize = (dim: string) => (dim === '148x148' ? 0.148 : 0.098)
const bjelkeHoyde = (dim: string) => (dim === '48x223' ? 0.223 : dim === '48x198' ? 0.198 : 0.148)
const stolpePrisId = (dim: string) => (dim === '148x148' ? 'stolpe-148x148' : 'stolpe-98x98')
const bjelkePrisId = (dim: string) => (dim === '48x223' ? 'bjelke-48x223' : dim === '48x198' ? 'bjelke-48x198' : 'bjelke-48x148')

type Side = 'front' | 'bak' | 'venstre' | 'høyre'
const skjermSiderListe = (v: string, montering: string): Side[] => {
  const base: Side[] = v === 'bak' ? ['bak'] : v === 'bak+sider' ? ['bak', 'venstre', 'høyre'] : ['front', 'bak', 'venstre', 'høyre']
  // Veggmontert: baksiden er husveggen – ingen skjerm der.
  return montering === 'veggmontert' ? base.filter((s) => s !== 'bak') : base
}

const stolperPerRad = (W: number) => Math.max(2, Math.ceil(W / STOLPE_CC) + 1)
const antallSpaer = (W: number) => Math.max(2, Math.floor(W / SPAR_CC) + 1)
const antallLekter = (c: PergolaConfig, span: number) => {
  if (c.taktype !== 'lekter' && c.taktype !== 'spjeld') return 0
  const la = Math.max(0.1, cm(Number(c.lektAvstand)) || 0.4)
  return Math.max(2, Math.floor(span / la) + 1)
}
const spread = (a: number, b: number, n: number) => (n <= 1 ? [(a + b) / 2] : Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)))
const sideLen = (side: Side, W: number, D: number) => (side === 'front' || side === 'bak' ? W : D)

// ── Materialliste ──────────────────────────────────────────────────

function beregn(c: PergolaConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const W = cm(c.bredde)
  const D = cm(c.dybde)
  const H = cm(c.hoyde)
  const frittstående = c.montering === 'frittstående'

  const rader = frittstående ? 2 : 1
  const perRad = stolperPerRad(W)
  const stolpeAntall = rader * perRad
  const knebandAntall = stolpeAntall * 3 // 2 i dragerplanet + 1 mot inner pr. stolpe
  const knebandLen = Math.min(0.4, H * 0.45) * Math.SQRT2
  const stolpeLm = stolpeAntall * H
  const knebandLm = knebandAntall * knebandLen // knebånd i stolpedimensjon

  const dragerAntall = frittstående ? 2 : 1
  const dragerLm = dragerAntall * (W + 2 * OH) + (frittstående ? 0 : W) // + veggledger

  const spaerAntall = antallSpaer(W)
  const spaerLm = spaerAntall * (D + 2 * OH)

  // Tak
  let lektLm = 0
  let takM2 = 0
  const lektAntall = antallLekter(c, D + 2 * OH)
  if (lektAntall) lektLm = lektAntall * (W + 2 * OH)
  else if (c.taktype === 'tett') takM2 = (W + 2 * OH) * (D + 2 * OH)

  // Sideskjerm
  let skjermLm = 0
  let skjermM2 = 0
  const sider = c.skjermtype !== 'ingen' ? skjermSiderListe(c.skjermSider, c.montering) : []
  const skjermH = Math.max(0.4, H - 0.1)
  const totalSide = sider.reduce((s, sd) => s + sideLen(sd, W, D), 0)
  if (c.skjermtype === 'tett') skjermM2 = totalSide * skjermH
  else if (c.skjermtype === 'horisontal') skjermLm = Math.ceil(skjermH / 0.12) * totalSide
  else if (c.skjermtype === 'spalér') skjermLm = (totalSide / 0.12) * skjermH + (skjermH / 0.12) * totalSide

  const skrueAntall = stolpeAntall * 4 + spaerAntall * dragerAntall * 3 + lektAntall * spaerAntall + Math.round((skjermLm + skjermM2 * 8) * 2)

  const stolpeKr = (stolpeLm + knebandLm) * prisFor(stolpePrisId(c.stolpeDim)) * faktor
  const bjelkeKr = (dragerLm + spaerLm) * prisFor(bjelkePrisId(c.bjelkeDim)) * faktor
  const lektKr = lektLm * prisFor('spile-28x48') * faktor
  const takKr = takM2 * prisFor('taktekke-polykarbonat')
  const skjermKr = (skjermLm * prisFor('spile-28x48') * faktor) + (skjermM2 * prisFor('veggpanel') * faktor)
  const skrueKr = skrueAntall * prisFor('skrue')
  const skoKr = stolpeAntall * prisFor('stolpesko')
  const estimatKr = Math.round(((stolpeKr + bjelkeKr + lektKr + takKr + skjermKr) * SVINN + skrueKr + skoKr) / 10) * 10

  const stolpeStr = c.stolpeDim.replace('x', '×')
  const bjelkeStr = c.bjelkeDim.replace('x', '×')
  const linjer: BomLine[] = [
    { navn: `Stolpe ${stolpeStr} mm`, antall: Math.round(stolpeLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${stolpeAntall} stk` },
    { navn: PRISER['stolpesko'].navn, antall: stolpeAntall, enhet: 'stk' },
    { navn: `Knebånd (45°) ${stolpeStr} mm`, antall: Math.round(knebandLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${knebandAntall} stk` },
    { navn: `Drager ${bjelkeStr} mm`, antall: Math.round(dragerLm * SVINN * 10) / 10, enhet: 'lm', kommentar: frittstående ? `${dragerAntall} stk` : '1 drager + veggledger' },
    { navn: `Spær ${bjelkeStr} mm`, antall: Math.round(spaerLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${spaerAntall} stk c/c 60 cm` },
  ]
  if (lektLm > 0) linjer.push({ navn: `Takslekt (${c.taktype}) 48 × 48 mm`, antall: Math.round(lektLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${lektAntall} stk` })
  if (takM2 > 0) linjer.push({ navn: 'Tak-plate (tett)', antall: Math.round(takM2 * SVINN * 10) / 10, enhet: 'm²' })
  if (skjermLm > 0) linjer.push({ navn: `Sideskjerm (${c.skjermtype}) 28 × 48 mm`, antall: Math.round(skjermLm * SVINN * 10) / 10, enhet: 'lm' })
  if (skjermM2 > 0) linjer.push({ navn: 'Sideskjerm (tett panel)', antall: Math.round(skjermM2 * SVINN * 10) / 10, enhet: 'm²' })
  linjer.push({ navn: 'Skruer / beslag', spesifikasjon: 'rustfri A4', antall: Math.round(skrueAntall / 10) * 10, enhet: 'stk' })

  const sammendrag = `${c.bredde}×${c.dybde} cm · ${c.hoyde} cm høy · ${c.taktype}${c.skjermtype !== 'ingen' ? ` + ${c.skjermtype} skjerm` : ''} · stolpe ${stolpeStr}, bjelke ${bjelkeStr} · ${TRESLAG[c.treslag]?.label ?? c.treslag}`
  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * c.dybde) / 10000, maal: `${c.bredde} × ${c.dybde} cm` }
}

// ── Kappliste ──────────────────────────────────────────────────────

function kappliste(c: PergolaConfig): KapplisteDel[] {
  const W = cm(c.bredde)
  const D = cm(c.dybde)
  const H = cm(c.hoyde)
  const frittstående = c.montering === 'frittstående'
  const stolpeStr = `${c.stolpeDim.replace('x', '×')} mm`
  const bjelkeStr = `${c.bjelkeDim.replace('x', '×')} mm`
  const stolpeAntall = (frittstående ? 2 : 1) * stolperPerRad(W)
  const dele: KapplisteDel[] = [
    { navn: 'Stolpe', profil: stolpeStr, lengdeCm: Math.round(H * 100), antall: stolpeAntall },
    { navn: 'Knebånd (45°)', profil: stolpeStr, lengdeCm: Math.round(Math.min(0.4, H * 0.45) * 100), antall: stolpeAntall * 3 },
    { navn: 'Drager', profil: bjelkeStr, lengdeCm: Math.round((W + 2 * OH) * 100), antall: frittstående ? 2 : 1 },
  ]
  if (!frittstående) dele.push({ navn: 'Vegg-ledger', profil: bjelkeStr, lengdeCm: Math.round(W * 100), antall: 1 })
  dele.push({ navn: 'Spær', profil: bjelkeStr, lengdeCm: Math.round((D + 2 * OH) * 100), antall: antallSpaer(W) })
  const lektAntall = antallLekter(c, D + 2 * OH)
  if (lektAntall) dele.push({ navn: `Takslekt (${c.taktype})`, profil: '48 × 48 mm', lengdeCm: Math.round((W + 2 * OH) * 100), antall: lektAntall })
  return dele
}

// ── 3D-modell ──────────────────────────────────────────────────────

function buildMesh(c: PergolaConfig, opts?: BuildOptions): THREE.Group {
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

  const W = cm(c.bredde)
  const D = cm(c.dybde)
  const H = cm(c.hoyde)
  const s = stolpeSize(c.stolpeDim)
  const jh = bjelkeHoyde(c.bjelkeDim)
  const frittstående = c.montering === 'frittstående'
  const wx = (mx: number) => mx - W / 2
  const wz = (mz: number) => mz - D / 2

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

  const stolpeProfil = `${c.stolpeDim.replace('x', '×')} mm`
  const bjelkeProfil = `${c.bjelkeDim.replace('x', '×')} mm`
  const perRad = stolperPerRad(W)
  const xs = spread(s / 2, W - s / 2, perRad)
  const frontZ = s / 2
  const backZ = D - s / 2
  const rows = frittstående ? [frontZ, backZ] : [frontZ]

  // ── Stolper + 45°-knebånd ────────────────────────────────────────
  const beamUnder = H // underkant drager = stolpetopp
  const off = Math.min(0.4, H * 0.45) // knebånd-lengde langs hver retning
  const kbThick = s // samme tykkelse som stolpen
  const kbCut = s * Math.SQRT2 // båndbredde ≈ stolpedimensjonen vinkelrett
  const addBrace = (pid: string, planePts: Array<[number, number]>, extrude: 'x' | 'z', fixedWorld: number, ex: THREE.Vector3) => {
    const shape = new THREE.Shape()
    shape.moveTo(planePts[0][0], planePts[0][1])
    for (let p = 1; p < planePts.length; p++) shape.lineTo(planePts[p][0], planePts[p][1])
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: kbThick, bevelEnabled: false })
    if (extrude === 'x') {
      g.rotateY(-Math.PI / 2) // profil i z-y, ekstrudert langs x
      g.translate(fixedWorld + kbThick / 2, 0, 0)
    } else {
      g.translate(0, 0, fixedWorld - kbThick / 2) // profil i x-y, ekstrudert langs z
    }
    const mat = meshMat(pid, 0.9)
    mat.side = THREE.DoubleSide
    const m = new THREE.Mesh(g, mat)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'kneband'
    m.userData.pid = pid
    m.userData.info = { navn: 'Knebånd (45°)', profil: stolpeProfil, lengdeCm: Math.round(Math.hypot(off, off) * 100) }
    m.userData.explode = ex
    group.add(m)
  }

  rows.forEach((rz, r) => {
    xs.forEach((x, i) => {
      addBox(s, H, s, 'stolpe', `stolpe-${r}-${i}`, 1, wx(x), H / 2, wz(rz), { navn: 'Stolpe', profil: stolpeProfil, lengdeCm: Math.round(H * 100) }, new THREE.Vector3(0, -0.35, 0))

      // Knebånd i dragerplanet (x-y), begge veier mot naboene – de treffer
      // undersiden av drageren (den gjennomgående tverrbjelken).
      const dirs: number[] = []
      if (i > 0) dirs.push(-1)
      if (i < xs.length - 1) dirs.push(1)
      if (dirs.length === 0) dirs.push(-1, 1)
      dirs.forEach((dir, k) => {
        const xSide = x + dir * (s / 2)
        addBrace(
          `kneband-${r}-${i}-${k}`,
          [
            [wx(xSide), beamUnder - off],
            [wx(xSide + dir * off), beamUnder],
            [wx(xSide + dir * (off - kbCut)), beamUnder],
            [wx(xSide), beamUnder - off + kbCut],
          ],
          'z',
          wz(rz),
          new THREE.Vector3(dir * 0.3, 0, 0),
        )
      })

      // Knebånd mot inner (z-y-planet) – går helt opp til spærlaget (tverr-
      // bjelkene på toppen), som ligger én bjelkehøyde over drageren.
      const inDir = r === 0 ? 1 : -1
      const spaerUnder = H + jh
      const zP = rz + inDir * (s / 2)
      addBrace(
        `kneband-z-${r}-${i}`,
        [
          [wz(zP), spaerUnder - off],
          [wz(zP + inDir * off), spaerUnder],
          [wz(zP + inDir * (off - kbCut)), spaerUnder],
          [wz(zP), spaerUnder - off + kbCut],
        ],
        'x',
        wx(x),
        new THREE.Vector3(0, 0, inDir * 0.3),
      )
    })
  })

  // ── Dragere langs bredden (oppå stolpene) ────────────────────────
  const dragerY = H + jh / 2
  const dragerRows = frittstående ? [frontZ, backZ] : [frontZ]
  dragerRows.forEach((rz, i) => {
    addBox(W + 2 * OH, jh, s, 'drager', `drager-${i}`, 1, wx(W / 2), dragerY, wz(rz), { navn: 'Drager', profil: bjelkeProfil, lengdeCm: Math.round((W + 2 * OH) * 100) }, new THREE.Vector3(0, 0.25, 0))
  })
  if (!frittstående) {
    addBox(W, jh, 0.05, 'drager', 'ledger', 1, wx(W / 2), dragerY, wz(backZ), { navn: 'Vegg-ledger', profil: bjelkeProfil, lengdeCm: Math.round(W * 100) }, new THREE.Vector3(0, 0.25, 0.3))
  }

  // ── Spær på tvers (oppå dragerne) ────────────────────────────────
  const spaerY = H + jh + jh / 2
  const spaerXs = spread(0, W, antallSpaer(W))
  spaerXs.forEach((x, i) => {
    addBox(RAFTER_W, jh, D + 2 * OH, 'spaer', `spaer-${i}`, 1, wx(x), spaerY, wz(D / 2), { navn: 'Spær', profil: bjelkeProfil, lengdeCm: Math.round((D + 2 * OH) * 100) }, new THREE.Vector3(0, 0.35, 0))
  })

  // ── Tak / solskjerm (oppå spærene) ───────────────────────────────
  const takY = H + 2 * jh
  const lektAntall = antallLekter(c, D + 2 * OH)
  if (lektAntall) {
    const zs = spread(-OH, D + OH, lektAntall)
    zs.forEach((z, i) => {
      const m = addBox(W + 2 * OH, LEKT, LEKT, 'tak', `lekt-${i}`, 0.96, wx(W / 2), takY + LEKT / 2, wz(z), { navn: c.taktype === 'spjeld' ? 'Spjeldlekt' : 'Takslekt', profil: '48 × 48 mm', lengdeCm: Math.round((W + 2 * OH) * 100) }, new THREE.Vector3(0, 0.45, 0))
      if (c.taktype === 'spjeld') m.rotation.x = rad(35) // skråstilte lameller
    })
  } else if (c.taktype === 'tett') {
    const mat = new THREE.MeshStandardMaterial({ color: 0xcfe0e6, roughness: 0.5, metalness: 0.15, transparent: true, opacity: 0.55 })
    addBox(W + 2 * OH, 0.02, D + 2 * OH, 'tak', 'tak-tett', 1, wx(W / 2), takY + 0.01, wz(D / 2), { navn: 'Tett tak (plate)', profil: 'plate', lengdeCm: Math.round((D + 2 * OH) * 100) }, new THREE.Vector3(0, 0.5, 0), mat)
  }

  // ── Skyggevegg (hus) på baksiden ved veggmontering ───────────────
  if (!frittstående) {
    const wallH = H + 2 * jh + 0.3
    const ghostGeo = new THREE.BoxGeometry(W + 0.6, wallH, 0.05)
    const ghostMat = new THREE.MeshStandardMaterial({ color: 0x9fb0c2, transparent: true, opacity: 0.16, roughness: 0.95, metalness: 0, side: THREE.DoubleSide, depthWrite: false })
    const ghost = new THREE.Mesh(ghostGeo, ghostMat)
    ghost.position.set(wx(W / 2), wallH / 2, wz(D) + 0.05)
    ghost.renderOrder = -1
    ghost.userData.part = 'husvegg'
    ghost.userData.pid = 'husvegg'
    ghost.userData.info = { navn: 'Husvegg (medfølger ikke)', profil: 'eksisterende vegg', lengdeCm: Math.round((W + 0.6) * 100) }
    ghost.userData.explode = new THREE.Vector3(0, 0, 0.5)
    group.add(ghost)
  }

  // ── Sideskjerm ───────────────────────────────────────────────────
  if (c.skjermtype !== 'ingen') {
    const sider = skjermSiderListe(c.skjermSider, c.montering)
    const y0 = 0.08
    const y1 = H - 0.02
    const sh = y1 - y0
    const infMat = () => meshMat('skjerm', 0.96)
    sider.forEach((side) => {
      const horiz = side === 'front' || side === 'bak'
      const len = horiz ? W : D
      const axPos = side === 'front' ? frontZ : side === 'bak' ? backZ : side === 'venstre' ? xs[0] : xs[xs.length - 1]
      // Plasser en tynn skjerm i planet på valgt side.
      const place = (u: number, v: number, uw: number, vh: number, tag: string, mat?: THREE.Material) => {
        // u langs siden, v = høyde. horiz: u→x ved z=axPos; ellers u→z ved x=axPos.
        if (horiz) addBox(uw, vh, 0.03, 'skjerm', tag, 0.96, wx(u), v, wz(axPos), { navn: 'Sideskjerm', profil: '28 × 48 mm', lengdeCm: Math.round(uw * 100) }, new THREE.Vector3(0, 0, side === 'front' ? -0.3 : 0.3), mat)
        else addBox(0.03, vh, uw, 'skjerm', tag, 0.96, wx(axPos), v, wz(u), { navn: 'Sideskjerm', profil: '28 × 48 mm', lengdeCm: Math.round(uw * 100) }, new THREE.Vector3(side === 'venstre' ? -0.3 : 0.3, 0, 0), mat)
      }
      if (c.skjermtype === 'tett') {
        place(len / 2, (y0 + y1) / 2, len, sh, `skjerm-${side}-panel`, infMat())
      } else {
        // vannrette bord
        const rows2 = Math.max(2, Math.floor(sh / 0.12))
        for (let r = 0; r <= rows2; r++) {
          const v = y0 + (r / rows2) * sh
          place(len / 2, v, len, 0.045, `skjerm-${side}-h${r}`, infMat())
        }
        // spalér: også loddrette spiler (rutenett)
        if (c.skjermtype === 'spalér') {
          const cols = Math.max(2, Math.floor(len / 0.16))
          for (let k = 0; k <= cols; k++) {
            const u = (k / cols) * len
            if (horiz) addBox(0.03, sh, 0.03, 'skjerm', `skjerm-${side}-v${k}`, 0.96, wx(u), (y0 + y1) / 2, wz(axPos), { navn: 'Spalérspile', profil: '28 × 48 mm', lengdeCm: Math.round(sh * 100) }, new THREE.Vector3(0, 0, side === 'front' ? -0.3 : 0.3), infMat())
            else addBox(0.03, sh, 0.03, 'skjerm', `skjerm-${side}-v${k}`, 0.96, wx(axPos), (y0 + y1) / 2, wz(u), { navn: 'Spalérspile', profil: '28 × 48 mm', lengdeCm: Math.round(sh * 100) }, new THREE.Vector3(side === 'venstre' ? -0.3 : 0.3, 0, 0), infMat())
          }
        }
      }
    })
  }

  return group
}

// ── Template ───────────────────────────────────────────────────────

// ── Målsatt 2D-tegning (plan + oppriss) ────────────────────────────
function tegning2D(c: PergolaConfig): Tegning2D {
  const W = c.bredde
  const D = c.dybde
  const h = c.hoyde
  const beam = 14 // tegnet dragerhøyde
  const oh = 30 // dragerutstikk
  const post = 10
  const H = h + beam

  const oppriss = (len: number, navn: string, id: string): Tegning2D['riss'][number] => ({
    id,
    navn,
    bredde: len,
    hoyde: H,
    former: [
      { type: 'rect', x: -oh, y: 0, w: len + 2 * oh, h: beam },
      { type: 'rect', x: 0, y: beam, w: post, h: H - beam },
      { type: 'rect', x: len - post, y: beam, w: post, h: H - beam },
    ],
    maal: [
      { x1: 0, y1: H, x2: len, y2: H, label: `${len} cm`, offset: 26 },
      { x1: 0, y1: beam, x2: 0, y2: H, label: `${h} cm`, offset: 24 },
    ],
  })

  // Plan: takslekter langs dybden, med valgt senteravstand.
  const step = Math.max(20, c.lektAvstand)
  const lekter: Tegning2D['riss'][number]['former'] = []
  for (let x = step; x < W; x += step) lekter.push({ type: 'line', points: [[x, 0], [x, D]], tynn: true })

  return {
    riss: [
      oppriss(W, 'Forfra', 'forfra'),
      oppriss(D, 'Fra siden', 'siden'),
      {
        id: 'plan',
        navn: 'Ovenfra (plan)',
        bredde: W,
        hoyde: D,
        former: [{ type: 'rect', x: 0, y: 0, w: W, h: D }, ...lekter],
        maal: [
          { x1: 0, y1: D, x2: W, y2: D, label: `${W} cm`, offset: 26 },
          { x1: 0, y1: 0, x2: 0, y2: D, label: `${D} cm`, offset: 24 },
        ],
      },
    ],
  }
}

export const pergola: ProductTemplate<PergolaConfig> = {
  id: 'pergola',
  navn: 'Pergola',
  ikon: 'faBorderNone',
  beskrivelse: 'Tegn pergolaen i 3D – frittstående eller veggmontert, med åpne spær eller tett tak, valgfri lektavstand og sideskjerm.',
  bilde: '/images/products/pergola-3d.webp',
  tilgjengelig: true,
  fraPris: 249,
  // Materialpakke tilbys ikke for pergola – kun forespør bygging + byggeplan.
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    montering: 'frittstående',
    bredde: 360,
    dybde: 300,
    hoyde: 240,
    stolpeDim: '98x98',
    bjelkeDim: '48x198',
    taktype: 'lekter',
    lektAvstand: 40,
    skjermtype: 'ingen',
    skjermSider: 'bak+sider',
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'klassisk', navn: 'Klassisk pergola', beskrivelse: 'Frittstående med lekter', config: { montering: 'frittstående', bredde: 300, dybde: 300, hoyde: 240, taktype: 'lekter', skjermtype: 'ingen' } },
    { id: 'solskjerm-vegg', navn: 'Veggmontert solskjerm', beskrivelse: 'Lekter mot terrassen', config: { montering: 'veggmontert', bredde: 400, dybde: 300, hoyde: 250, taktype: 'lekter', lektAvstand: 15, skjermtype: 'ingen' } },
    { id: 'lukket-tak', navn: 'Pergola med tett tak', beskrivelse: 'Tørr uteplass hele året', config: { montering: 'veggmontert', bredde: 400, dybde: 350, hoyde: 260, bjelkeDim: '48x223', taktype: 'tett', skjermtype: 'ingen' } },
    { id: 'med-skjerm', navn: 'Pergola med spalér', beskrivelse: 'Le og klatreplanter', config: { montering: 'frittstående', bredde: 360, dybde: 300, hoyde: 240, taktype: 'spjeld', skjermtype: 'spalér', skjermSider: 'bak+sider' } },
    { id: 'stor', navn: 'Stor uteplass-pergola', beskrivelse: 'Plass til langbord', config: { montering: 'frittstående', bredde: 600, dybde: 400, hoyde: 260, stolpeDim: '148x148', bjelkeDim: '48x223', taktype: 'lekter', skjermtype: 'ingen' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 150, max: 1000, step: 10, axis: 'x' },
    { key: 'hoyde', label: 'Høyde', min: 200, max: 320, step: 5, axis: 'y' },
    { key: 'dybde', label: 'Dybde', min: 150, max: 800, step: 10, axis: 'z' },
    {
      key: 'lektAvstand',
      label: 'Lekteavstand',
      min: 10,
      max: 60,
      step: 5,
      unit: 'cm',
      axis: 'z',
      handle: false,
      visibleWhen: (c) => c.taktype === 'lekter' || c.taktype === 'spjeld',
    },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'montering',
      label: 'Montering',
      choices: [
        { id: 'frittstående', label: 'Frittstående', note: 'Stolper på alle fire hjørner.' },
        { id: 'veggmontert', label: 'Veggmontert', note: 'Bakre drager festet til husveggen.' },
      ],
    },
    {
      key: 'taktype',
      label: 'Tak / solskjerm',
      choices: [
        { id: 'åpen', label: 'Åpen', note: 'Kun spær.' },
        { id: 'lekter', label: 'Lekter', note: 'Solskjerm med luft.' },
        { id: 'spjeld', label: 'Spjeld', note: 'Skråstilte lameller.' },
        { id: 'tett', label: 'Tett tak', note: 'Plater / duk.' },
      ],
    },
    {
      key: 'stolpeDim',
      label: 'Stolpedimensjon',
      choices: [
        { id: '98x98', label: '98 × 98 mm' },
        { id: '148x148', label: '148 × 148 mm', note: 'Kraftigere.' },
      ],
    },
    {
      key: 'bjelkeDim',
      label: 'Bjelke (drager/spær)',
      choices: [
        { id: '48x148', label: '48 × 148 mm' },
        { id: '48x198', label: '48 × 198 mm' },
        { id: '48x223', label: '48 × 223 mm', note: 'Størst spenn.' },
      ],
    },
    {
      key: 'skjermtype',
      label: 'Sideskjerm',
      choices: [
        { id: 'ingen', label: 'Ingen' },
        { id: 'spalér', label: 'Spalér', note: 'Rutenett for klatreplanter.' },
        { id: 'horisontal', label: 'Vannrett', note: 'Vannrette bord.' },
        { id: 'tett', label: 'Tett', note: 'Sammenhengende panel.' },
      ],
    },
    {
      key: 'skjermSider',
      label: 'Skjerm på',
      visibleWhen: (c) => c.skjermtype !== 'ingen',
      choices: [
        { id: 'bak', label: 'Bak' },
        { id: 'bak+sider', label: 'Bak + sider' },
        { id: 'alle', label: 'Alle sider' },
      ],
    },
  ],
  parts: [
    { key: 'stolpe', label: 'Stolper' },
    { key: 'drager', label: 'Dragere' },
    { key: 'spaer', label: 'Spær' },
    { key: 'tak', label: 'Tak / solskjerm' },
    { key: 'skjerm', label: 'Sideskjerm' },
  ],
  beregn,
  kappliste,
  tegning2D,
  montering: (c) => {
    const steg: string[] = [
      'Kapp alt virke etter kapplista. Skjær 45°-endene på knebåndene (loddrett kutt mot stolpen, vannrett mot drageren) og skråkapp spjeldlektene om du velger spjeld.',
      'Merk opp og støp punktfundamenter i frostfri dybde etter stolperutenettet. Kontroller at diagonalmålene er like så alt blir i vinkel.',
      'Sett justerbare stolpesko i vater på fundamentene.',
      'Reis stolpene i skoene, lodd dem i begge retninger og avstiv midlertidig med skråbord.',
    ]
    if (c.montering === 'veggmontert') {
      steg.push('Fest vegg-ledgeren vannrett til husveggen (i bindingsverk/mur) med gjennomgående bolter, og legg vannbrett/tettelist over så det ikke trekker vann inn i veggen.')
      steg.push('Legg fremre drager oppå stolperaden og fest med gjennomgående bolter eller kraftige bjelkesko.')
    } else {
      steg.push('Legg dragerne oppå begge stolperadene (med likt utstikk i hver ende) og fest med gjennomgående bolter eller bjelkesko.')
    }
    steg.push('Monter knebåndene i 45° fra stolpe opp mot drager – to i dragerplanet og ett inn mot midten opp til spærlaget – for sideveis stabilitet.')
    steg.push(`Legg spærene på tvers oppå dragerne med c/c ${Math.round(SPAR_CC * 100)} cm og likt utstikk (${Math.round(OH * 100)} cm) foran og bak. Fest hvert spær til drageren med vinkelbeslag eller skrå skruer.`)
    if (c.taktype === 'lekter' || c.taktype === 'spjeld') {
      steg.push(
        `Legg takslektene (48 × 48 mm) på tvers oppå spærene med ${c.lektAvstand} cm mellomrom, helt ut til endene av spærene.` +
          (c.taktype === 'spjeld' ? ' Vipp hver lekt ca. 35° for justerbar skygge.' : ''),
      )
    } else if (c.taktype === 'tett') {
      steg.push('Monter tett tak (plater/duk) oppå spærene med litt fall for avrenning og god overlapp i skjøtene.')
    }
    if (c.skjermtype !== 'ingen') {
      steg.push(`Monter sideskjerm (${c.skjermtype}) på valgte sider mellom stolpene, fra ca. 8 cm over bakken opp til drageren.`)
    }
    steg.push('Kontroller at alt er i lodd og vater, ettertrekk innfestingene, og behandle virket (beis/olje) etter at det har tørket.')
    return steg
  },
  raad: (c) => [
    'Sett stolpene i justerbare stolpesko på støpte punktfundamenter (frostfri dybde) – aldri trevirke rett i bakken.',
    'Lodd og avstiv stolpene før du fester dragerne, og kontroller diagonalmål så rammen blir i vinkel.',
    c.montering === 'veggmontert'
      ? 'Fest vegg-ledgeren til bindingsverk/mur med gjennomgående bolter og bruk vannbrett/tettelist så det ikke trekker vann inn i veggen.'
      : 'Fest dragerne oppå stolpene med gjennomgående bolter eller kraftige beslag, ikke bare skruer.',
    c.taktype === 'spjeld'
      ? 'Skråstilte spjeld gir skygge midt på dagen og slipper inn lavere sol – vend dem etter hvor sola står mest.'
      : c.taktype === 'tett'
        ? 'Tett tak bør ha litt fall for avrenning; vurder gjennomsiktige plater for mer lys.'
        : 'Lektene kan legges tettere for mer skygge – 10–15 cm gir god solskjerm.',
    'Bruk rustfrie (A4) skruer og varmforsinkede beslag utendørs, og forbor i endene så virket ikke sprekker.',
    'Frittstående pergola er som regel unntatt søknadsplikt, men sjekk høyde og avstand til nabogrense med kommunen.',
  ],
  buildMesh,
  bounds: (c) => ({
    x: cm(c.bredde) + 2 * OH + 0.2,
    y: cm(c.hoyde) + 2 * bjelkeHoyde(c.bjelkeDim) + 0.15,
    z: cm(c.dybde) + 2 * OH + 0.2,
  }),
}
