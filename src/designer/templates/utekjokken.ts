import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'

/**
 * Utekjøkken – parametrisk template (migrert fra Utekjøkkenplanleggeren).
 *
 * Et frittstående tak-på-stolper over en hevet platting, med innredning:
 * benkerad med benkeplate, valgfri vask, underskap, åpne hyller, sittebenk,
 * bakvegg og sidevegger i spiler. Pulttak leder vann bakover. Alt er valgbart
 * (høyt konfigurerbart) via mål, alternativer og av/på-brytere.
 *
 * Konfig-mål er i CENTIMETER; geometrien regnes i meter.
 */

export interface UtekjokkenConfig {
  form: string // 'rett' | 'l-venstre' | 'l-hoyre'
  bredde: number // cm (x – langs forsiden)
  benkedybde: number // cm (benkeplatens/benkens dybde, 60–90)
  dybde: number // cm (fotavtrykk-dybde under tak; kun overbygd)
  sidelengde: number // cm (lengde på L-armen)
  hoyde: number // cm (fri høyde under drager)
  taktype: string // 'ingen' | 'flatt' | 'pulttak'
  takvinkel: number // grader
  taktekke: string // 'stålplater' | 'bord' | 'shingel'
  plattformHoyde: number // cm (overkant platting)
  benkehoyde: number // cm (overkant benkeplate)
  benkeplate: string // 'tre' | 'laminat' | 'rustfritt'
  hyller: number // antall åpne hyller under benken (0–3)
  virke: string // '23x48' | '36x63' | '48x98' – gjennomgående lekt/virke
  harVask: boolean
  harSkap: boolean
  harBenk: boolean // sittebenk langs siden
  harBakvegg: boolean
  harSidevegger: boolean
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1
const cm = (v: number) => v / 100
const rad = (d: number) => (d * Math.PI) / 180

const OH = 0.3 // takutstikk (m)
const benkeD = (c: UtekjokkenConfig) => cm(c.benkedybde) // benkedybde (m)
const totalDybde = (c: UtekjokkenConfig) => (c.taktype !== 'ingen' ? cm(c.dybde) : benkeD(c) + (c.form !== 'rett' ? cm(c.sidelengde) : 0))
const SEAT_D = 0.42 // sittebenk-dybde
const SPAR_CC = 0.6 // c/c spær
const SKAP_W = 0.6 // underskapsbredde

// Virke: «AxB» mm (tykkelse × bredde). t = tynn side, w = bred side.
const virkeDims = (d: string) => {
  const [a, b] = d.split('x').map((n) => Number(n) || 0)
  return { t: (a || 48) / 1000, w: (b || 98) / 1000 }
}
const virkeW = (d: string) => virkeDims(d).w
const virkeT = (d: string) => virkeDims(d).t
const virkePrisId = (d: string) => (d === '23x48' ? 'lekt-23x48' : d === '36x63' ? 'lekt-36x63' : 'stolpe-48x98')
const taktekkePrisId = (t: string) => (t === 'bord' ? 'taktekke-bord' : t === 'shingel' ? 'taktekke-shingel' : 'taktekke-stalplater')
const benkeplatePrisId = (b: string) => (b === 'rustfritt' ? 'benkeplate-rustfritt' : b === 'laminat' ? 'benkeplate-laminat' : 'benkeplate-tre')
const taktekkeNavn = (t: string) => (t === 'bord' ? 'Bordtak' : t === 'shingel' ? 'Shingel' : 'Stålplater')
const benkeplateNavn = (b: string) => (b === 'rustfritt' ? 'Rustfritt' : b === 'laminat' ? 'Laminat' : 'Heltre')

const takFall = (c: UtekjokkenConfig) => (c.taktype === 'pulttak' ? totalDybde(c) * Math.tan(rad(c.takvinkel)) : 0)
const skråfaktor = (c: UtekjokkenConfig) => (c.taktype === 'flatt' ? 1 : 1 / Math.cos(rad(c.takvinkel)))
const stolperPerRad = (c: UtekjokkenConfig) => (cm(c.bredde) > 3.6 ? 3 : 2)
const antallSpaer = (c: UtekjokkenConfig) => Math.max(2, Math.floor(cm(c.bredde) / SPAR_CC) + 1)
const benkeradLengde = (c: UtekjokkenConfig) => Math.max(0.6, cm(c.bredde) - 0.2)
const spread = (a: number, b: number, n: number) => (n <= 1 ? [(a + b) / 2] : Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1)))

// ── Materialliste ──────────────────────────────────────────────────

function beregn(c: UtekjokkenConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const roofed = c.taktype !== 'ingen'
  const W = cm(c.bredde)
  const D = totalDybde(c)
  const H = cm(c.hoyde)
  const sf = skråfaktor(c)
  const fall = takFall(c)
  const bEff = W + 2 * OH
  const dEff = D + 2 * OH

  // Takstruktur (kun overbygd)
  const perRad = stolperPerRad(c)
  const stolpeAntall = roofed ? 2 * perRad : 0
  const stolpeLm = stolpeAntall * (cm(c.plattformHoyde) + H + fall / 2)
  const knebandAntall = stolpeAntall * 2
  const knebandLm = knebandAntall * 0.5
  const dragerLm = roofed ? 2 * bEff + 2 * dEff * sf : 0
  const spaerAntall = roofed ? antallSpaer(c) : 0
  const spaerLm = spaerAntall * dEff * sf
  const takAreal = roofed ? bEff * dEff * sf : 0
  const plattAreal = roofed ? W * D : 0

  // Benk (kjernen). L-form legger til en arm.
  const armLen = c.form !== 'rett' ? Math.min(cm(c.sidelengde), D - benkeD(c)) : 0
  const skapBredde = c.harSkap ? SKAP_W : 0
  const benkeLengde = Math.max(0.6, benkeradLengde(c) - skapBredde) + armLen
  const worktopLm = benkeLengde + skapBredde
  const benkLengde = c.harBenk && c.form === 'rett' ? Math.max(0.6, D - 0.2) : 0
  const sideveggAreal = c.harSidevegger ? 2 * D * Math.min(1.8, H) : 0
  const hyllerLm = c.hyller * benkeLengde
  const bd = benkeD(c)
  // Benke-ramme: bein + langsgående rammer.
  const beinAntall = 6 + (c.form !== 'rett' ? 2 : 0)
  const rammeLm = beinAntall * cm(c.benkehoyde) + 2 * worktopLm // bein + øvre/nedre ramme
  // Skjørt (apron) rundt benkekanten.
  const apronLm = 2 * worktopLm + 2 * bd + (c.form !== 'rett' ? 2 * bd : 0)
  // Kryssbærere under hyllene (endene på beinlinjene).
  const nBear = Math.max(2, Math.round((W - 0.2) / 0.8) + 1)
  const bearerLm = c.hyller * nBear * bd
  // Bakvegg: loddrette skjermstolper (c/c ≤ 60 cm) + horisontale spiler + topphylle.
  const nStolpe = c.harBakvegg ? Math.max(2, Math.ceil((W - 0.1) / 0.6) + 1) : 0
  const skjermStolpeLm = nStolpe * (cm(c.benkehoyde) + 1.06)
  const bakSpileLm = c.harBakvegg ? Math.max(4, Math.floor(1.0 / 0.09)) * (W - 0.12) + (W - 0.1) : 0

  const framingLm = rammeLm + apronLm + bearerLm + skjermStolpeLm // alt av virke i benken
  const skrueAntall = stolpeAntall * 6 + spaerAntall * 4 + knebandAntall * 2 + Math.round(takAreal * 6 + plattAreal * 20 + (framingLm + hyllerLm + bakSpileLm + benkLengde) * 10)

  const virkePris = prisFor(virkePrisId(c.virke))
  const takstolpeKr = (stolpeLm + knebandLm) * virkePris * faktor
  const bjelkeKr = (dragerLm + spaerLm) * virkePris * faktor
  const takKr = takAreal * prisFor(taktekkePrisId(c.taktekke))
  const plattKr = plattAreal * prisFor('platting-dekke') * faktor
  const framingKr = framingLm * virkePris * faktor
  const benkeplateKr = worktopLm * prisFor(benkeplatePrisId(c.benkeplate))
  const vaskKr = c.harVask ? prisFor('utslagsvask') : 0
  const skapKr = c.harSkap ? prisFor('underskap') : 0
  const benkKr = benkLengde * prisFor('sittebenk') * faktor
  const bakSpileKr = bakSpileLm * prisFor('bord-21x98') * faktor
  const sideveggKr = sideveggAreal * prisFor('veggpanel') * faktor
  const hyllerKr = hyllerLm * prisFor('bord-28x120') * faktor
  const skrueKr = skrueAntall * prisFor('skrue')
  const skoKr = stolpeAntall * prisFor('stolpesko')
  const estimatKr = Math.round(((takstolpeKr + bjelkeKr + plattKr + framingKr + benkeplateKr + benkKr + bakSpileKr + sideveggKr + hyllerKr) * SVINN + takKr + vaskKr + skapKr + skrueKr + skoKr) / 10) * 10

  const virkeStr = c.virke.replace('x', '×')
  const linjer: BomLine[] = []
  if (roofed) {
    linjer.push(
      { navn: `Takstolpe ${virkeStr} mm`, antall: Math.round(stolpeLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${stolpeAntall} stk` },
      { navn: PRISER['stolpesko'].navn, antall: stolpeAntall, enhet: 'stk' },
      { navn: `Knebånd (45°) ${virkeStr} mm`, antall: Math.round(knebandLm * SVINN * 10) / 10, enhet: 'lm' },
      { navn: `Drager + sidebjelker ${virkeStr} mm`, antall: Math.round(dragerLm * SVINN * 10) / 10, enhet: 'lm' },
      { navn: `Spær ${virkeStr} mm`, antall: Math.round(spaerLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${spaerAntall} stk c/c 60 cm` },
      { navn: `${taktekkeNavn(c.taktekke)} (taktekke)`, antall: Math.round(takAreal * SVINN * 10) / 10, enhet: 'm²' },
      { navn: PRISER['platting-dekke'].navn, antall: Math.round(plattAreal * 10) / 10, enhet: 'm²', kommentar: `h ${c.plattformHoyde} cm` },
    )
  }
  linjer.push(
    { navn: `Benke-ramme + bein ${virkeStr} mm`, antall: Math.round(rammeLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${beinAntall} bein${c.form !== 'rett' ? ' · inkl. L-arm' : ''}` },
    { navn: `Skjørt / apron ${virkeStr} mm`, antall: Math.round(apronLm * SVINN * 10) / 10, enhet: 'lm', kommentar: 'rundt benkekanten' },
    { navn: `Benkeplate ${benkeplateNavn(c.benkeplate).toLowerCase()}`, antall: Math.round(worktopLm * 10) / 10, enhet: 'lm', kommentar: `${c.benkedybde} cm dyp${c.form !== 'rett' ? ' · inkl. L-arm' : ''}` },
  )
  if (c.harVask) linjer.push({ navn: PRISER['utslagsvask'].navn, antall: 1, enhet: 'stk' })
  if (c.harSkap) linjer.push({ navn: PRISER['underskap'].navn, antall: 1, enhet: 'stk' })
  if (c.hyller > 0) {
    linjer.push({ navn: 'Hyllespiler 50 × 22 mm', antall: Math.round(hyllerLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${c.hyller} hyller` })
    linjer.push({ navn: `Hyllebærere ${virkeStr} mm`, antall: Math.round(bearerLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${nBear} pr. hylle` })
  }
  if (benkLengde > 0) linjer.push({ navn: PRISER['sittebenk'].navn, antall: Math.round(benkLengde * 10) / 10, enhet: 'lm' })
  if (c.harBakvegg) {
    linjer.push({ navn: `Skjermstolper ${virkeStr} mm`, antall: Math.round(skjermStolpeLm * SVINN * 10) / 10, enhet: 'lm', kommentar: `${nStolpe} stk c/c ≤ 60 cm` })
    linjer.push({ navn: 'Bakvegg-spiler 45 × 28 mm', antall: Math.round(bakSpileLm * SVINN * 10) / 10, enhet: 'lm', kommentar: 'inkl. topphylle' })
  }
  if (sideveggAreal > 0) linjer.push({ navn: 'Sidevegger (spiler)', antall: Math.round(sideveggAreal * SVINN * 10) / 10, enhet: 'm²' })
  linjer.push({ navn: 'Skruer / beslag', spesifikasjon: 'rustfri A4', antall: Math.round(skrueAntall / 10) * 10, enhet: 'stk' })

  const formNavn = c.form === 'l-hoyre' ? 'L-form (høyre)' : c.form === 'l-venstre' ? 'L-form (venstre)' : 'Rett'
  const utstyr = [c.harVask && 'vask', c.harSkap && 'skap', benkLengde > 0 && 'sittebenk', c.harBakvegg && 'bakvegg', c.harSidevegger && 'sidevegger'].filter(Boolean).join(', ')
  const sammendrag = `${formNavn} · ${c.bredde} cm${roofed ? ' · overbygd' : ' · uten tak'} · ${benkeplateNavn(c.benkeplate).toLowerCase()} benkeplate${utstyr ? ` · ${utstyr}` : ''} · ${TRESLAG[c.treslag]?.label ?? c.treslag}`
  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde / 100) * D, maal: `${c.bredde} × ${Math.round(D * 100)} cm` }
}

// ── Kappliste ──────────────────────────────────────────────────────

function kappliste(c: UtekjokkenConfig): KapplisteDel[] {
  const W = cm(c.bredde)
  const D = totalDybde(c)
  const H = cm(c.hoyde)
  const stolpeStr = `${c.virke.replace('x', '×')} mm`
  const bjelkeStr = `${c.virke.replace('x', '×')} mm`
  const roofed = c.taktype !== 'ingen'
  const perRad = stolperPerRad(c)
  const dele: KapplisteDel[] = []
  if (roofed) {
    dele.push(
      { navn: 'Takstolpe', profil: stolpeStr, lengdeCm: Math.round((cm(c.plattformHoyde) + H + takFall(c)) * 100), antall: 2 * perRad },
      { navn: 'Knebånd (45°)', profil: stolpeStr, lengdeCm: 50, antall: 2 * perRad * 2 },
      { navn: 'Drager', profil: bjelkeStr, lengdeCm: Math.round((W + 2 * OH) * 100), antall: 2 },
      { navn: 'Spær', profil: bjelkeStr, lengdeCm: Math.round((D + 2 * OH) * skråfaktor(c) * 100), antall: antallSpaer(c) },
    )
  }
  const armLen = c.form !== 'rett' ? Math.min(cm(c.sidelengde), D - benkeD(c)) : 0
  const worktopLm = Math.max(0.6, benkeradLengde(c)) + armLen
  const virkeStr = `${c.virke.replace('x', '×')} mm`
  const nBear = Math.max(2, Math.round((W - 0.2) / 0.8) + 1)
  dele.push(
    { navn: 'Benkebein', profil: virkeStr, lengdeCm: Math.round(cm(c.benkehoyde) * 100), antall: 6 + (c.form !== 'rett' ? 2 : 0) },
    { navn: 'Benke-ramme (øvre/nedre)', profil: virkeStr, lengdeCm: Math.round(worktopLm * 100), antall: 2 },
    { navn: 'Skjørt / apron', profil: virkeStr, lengdeCm: Math.round(worktopLm * 100), antall: 2 },
    { navn: `Benkeplate (${benkeplateNavn(c.benkeplate).toLowerCase()})`, profil: `${Math.round(benkeD(c) * 1000)} mm dyp`, lengdeCm: Math.round(worktopLm * 100), antall: 1 },
  )
  if (c.hyller > 0) {
    dele.push({ navn: 'Hyllespile', profil: '50 × 22 mm', lengdeCm: Math.round((W - 0.1) * 100), antall: c.hyller * 6 })
    dele.push({ navn: 'Hyllebærer', profil: virkeStr, lengdeCm: Math.round(benkeD(c) * 100), antall: c.hyller * nBear })
  }
  if (c.harBakvegg) {
    const nStolpe = Math.max(2, Math.ceil((W - 0.1) / 0.6) + 1)
    dele.push({ navn: 'Skjermstolpe', profil: virkeStr, lengdeCm: Math.round((cm(c.benkehoyde) + 1.06) * 100), antall: nStolpe })
    dele.push({ navn: 'Bakvegg-spile', profil: '45 × 28 mm', lengdeCm: Math.round((W - 0.12) * 100), antall: 11 })
    dele.push({ navn: 'Topphylle', profil: '28 × 160 mm', lengdeCm: Math.round((W - 0.1) * 100), antall: 1 })
  }
  if (c.harBenk && c.form === 'rett') dele.push({ navn: 'Sittebenk-planke', profil: '34 × 98 mm', lengdeCm: Math.round(Math.max(0.6, D - 0.2) * 100), antall: 3 })
  return dele
}

// ── 3D-modell ──────────────────────────────────────────────────────

function buildMesh(c: UtekjokkenConfig, opts?: BuildOptions): THREE.Group {
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
  const D = totalDybde(c)
  const H = cm(c.hoyde)
  const s = virkeW(c.virke)
  const jh = virkeW(c.virke)
  const pf = cm(c.plattformHoyde) // overkant platting (kun med tak)
  const roofed = c.taktype !== 'ingen'
  const base = roofed ? pf : 0 // gulv-/bakkenivå for benken
  const fall = takFall(c)
  const frontTop = pf + H + fall // drager-underkant foran (høy)
  const backTop = pf + H // drager-underkant bak (lav)
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
  // Bjelke langs Z som følger takfallet (rotert om X).
  const addZbeam = (xC: number, yA: number, yB: number, w: number, h: number, part: string, pid: string, info: { navn: string; profil: string; lengdeCm: number }, ex: THREE.Vector3, mat?: THREE.Material) => {
    const zA = -OH
    const zB = D + OH
    const dz = zB - zA
    const dy = yB - yA
    const len = Math.hypot(dz, dy)
    const box = addBox(w, h, len, part, pid, 1, wx(xC), (yA + yB) / 2, wz((zA + zB) / 2), info, ex, mat)
    box.rotation.x = -Math.atan2(dy, dz)
    return box
  }

  const stolpeProfil = `${c.virke.replace('x', '×')} mm`
  const bjelkeProfil = `${c.virke.replace('x', '×')} mm`
  const perRad = stolperPerRad(c)
  const xs = spread(s / 2 + 0.05, W - s / 2 - 0.05, perRad)
  const frontZ = s / 2 + 0.05
  const backZ = D - s / 2 - 0.05

  // ── Platting + takstruktur (kun når det er tak) ──────────────────
  if (roofed) {
  addBox(W, 0.05, D, 'platting', 'dekke', 1, wx(W / 2), pf - 0.025, wz(D / 2), { navn: 'Platting (dekke)', profil: '28 mm bord', lengdeCm: Math.round(D * 100) }, new THREE.Vector3(0, -0.5, 0))
  if (pf > 0.06) {
    // Skjørt/fascia rundt plattingen.
    ;[
      [W, pf, 0.03, wx(W / 2), pf / 2, wz(0.015)],
      [W, pf, 0.03, wx(W / 2), pf / 2, wz(D - 0.015)],
      [0.03, pf, D, wx(0.015), pf / 2, wz(D / 2)],
      [0.03, pf, D, wx(W - 0.015), pf / 2, wz(D / 2)],
    ].forEach((b, i) => addBox(b[0], b[1], b[2], 'platting', `fascia-${i}`, 0.95, b[3], b[4], b[5], { navn: 'Kantbord platting', profil: '28 mm', lengdeCm: Math.round(Math.max(b[0], b[2]) * 100) }, new THREE.Vector3(0, -0.4, 0)))
  }

  // ── Stolper + knebånd ────────────────────────────────────────────
  const topAt = (z: number) => frontTop + (backTop - frontTop) * ((z - frontZ) / (backZ - frontZ))
  const off = Math.min(0.4, H * 0.4)
  const kbCut = s * Math.SQRT2
  const rows: Array<{ z: number }> = [{ z: frontZ }, { z: backZ }]
  rows.forEach((row, r) => {
    const top = topAt(row.z)
    const postH = top - pf
    xs.forEach((x, i) => {
      addBox(s, postH, s, 'stolpe', `stolpe-${r}-${i}`, 1, wx(x), pf + postH / 2, wz(row.z), { navn: 'Stolpe', profil: stolpeProfil, lengdeCm: Math.round(postH * 100) }, new THREE.Vector3(0, -0.35, 0))
      // Knebånd i dragerplanet (x-y), begge veier – treffer drager-undersiden.
      const dirs: number[] = []
      if (i > 0) dirs.push(-1)
      if (i < xs.length - 1) dirs.push(1)
      if (dirs.length === 0) dirs.push(-1, 1)
      dirs.forEach((dir, k) => {
        const xSide = x + dir * (s / 2)
        const pts: Array<[number, number]> = [
          [wx(xSide), top - off],
          [wx(xSide + dir * off), top],
          [wx(xSide + dir * (off - kbCut)), top],
          [wx(xSide), top - off + kbCut],
        ]
        const shape = new THREE.Shape()
        shape.moveTo(pts[0][0], pts[0][1])
        for (let p = 1; p < pts.length; p++) shape.lineTo(pts[p][0], pts[p][1])
        shape.closePath()
        const g = new THREE.ExtrudeGeometry(shape, { depth: s, bevelEnabled: false })
        g.translate(0, 0, wz(row.z) - s / 2)
        const pid = `kneband-${r}-${i}-${k}`
        const mat = meshMat(pid, 0.9)
        mat.side = THREE.DoubleSide
        const m = new THREE.Mesh(g, mat)
        m.castShadow = true
        m.userData.part = 'kneband'
        m.userData.pid = pid
        m.userData.info = { navn: 'Knebånd (45°)', profil: stolpeProfil, lengdeCm: Math.round(Math.hypot(off, off) * 100) }
        m.userData.explode = new THREE.Vector3(dir * 0.3, 0, 0)
        group.add(m)
      })
    })
  })

  // ── Dragere (foran/bak) ──────────────────────────────────────────
  addBox(W + 2 * OH, jh, s, 'drager', 'drager-front', 1, wx(W / 2), frontTop + jh / 2, wz(frontZ), { navn: 'Drager foran', profil: bjelkeProfil, lengdeCm: Math.round((W + 2 * OH) * 100) }, new THREE.Vector3(0, 0.25, 0))
  addBox(W + 2 * OH, jh, s, 'drager', 'drager-bak', 1, wx(W / 2), backTop + jh / 2, wz(backZ), { navn: 'Drager bak', profil: bjelkeProfil, lengdeCm: Math.round((W + 2 * OH) * 100) }, new THREE.Vector3(0, 0.25, 0))

  // ── Spær på tvers (følger fallet, oppå dragerne) ─────────────────
  const spaerY = (z: number) => topAt(z) + jh + jh / 2 // senterlinje spær
  const spaerXs = spread(0, W, antallSpaer(c))
  spaerXs.forEach((x, i) => {
    addZbeam(x, spaerY(-OH), spaerY(D + OH), 0.048, jh, 'spaer', `spaer-${i}`, { navn: 'Spær', profil: bjelkeProfil, lengdeCm: Math.round((D + 2 * OH) * skråfaktor(c) * 100) }, new THREE.Vector3(0, 0.35, 0))
  })

  // ── Taktekke (oppå spærene) ──────────────────────────────────────
  const roofColor = c.taktekke === 'stålplater' ? 0x6b6f74 : c.taktekke === 'shingel' ? 0x3a3330 : resolveColor(c.treslag, c.farge)
  const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.6, metalness: c.taktekke === 'stålplater' ? 0.3 : 0.05 })
  addZbeam(W / 2, spaerY(-OH) + jh / 2 + 0.02, spaerY(D + OH) + jh / 2 + 0.02, W + 2 * OH, 0.03, 'tak', 'tak', { navn: `${taktekkeNavn(c.taktekke)} (taktekke)`, profil: 'plate', lengdeCm: Math.round((D + 2 * OH) * 100) }, new THREE.Vector3(0, 0.5, 0), roofMat)
  }

  // ── Benk-innredning (kjernen – med eller uten tak) ───────────────
  const BW = benkeD(c)
  const benkeplateTop = base + cm(c.benkehoyde)
  const worktopUnder = benkeplateTop - 0.04
  const worktopMat = () => {
    if (c.benkeplate === 'rustfritt') return new THREE.MeshStandardMaterial({ color: 0xc9ccd1, roughness: 0.35, metalness: 0.7 })
    if (c.benkeplate === 'laminat') return new THREE.MeshStandardMaterial({ color: 0x33343a, roughness: 0.5, metalness: 0.05 })
    return meshMat('benkeplate', 1)
  }
  // Benke-segmenter (rektangler i modellkoordinater). Hovedbenken er en BW-dyp
  // stripe langs baksiden (fyller hele dybden når det ikke er tak). L-form
  // legger til en arm langs en side.
  const S = Math.max(0.4, cm(c.sidelengde))
  const mainRun = { x0: 0.05, x1: W - 0.05, z0: Math.max(0.05, D - 0.05 - BW), z1: D - 0.05 }
  const runs: Array<{ x0: number; x1: number; z0: number; z1: number }> = [mainRun]
  if (c.form === 'l-hoyre') runs.push({ x0: W - 0.05 - BW, x1: W - 0.05, z0: Math.max(0.05, mainRun.z0 - S), z1: mainRun.z0 })
  else if (c.form === 'l-venstre') runs.push({ x0: 0.05, x1: 0.05 + BW, z0: Math.max(0.05, mainRun.z0 - S), z1: mainRun.z0 })

  const vW = Math.max(0.045, virkeW(c.virke)) // bred side av virket
  const vT = Math.max(0.023, virkeT(c.virke)) // tynn side
  const virkeStr = `${c.virke.replace('x', '×')} mm`
  const legAt = (x: number, z: number, tag: string) =>
    addBox(vW, worktopUnder - base, vT, 'benk', tag, 0.95, wx(x), base + (worktopUnder - base) / 2, wz(z), { navn: 'Benkebein', profil: virkeStr, lengdeCm: Math.round((worktopUnder - base) * 100) }, new THREE.Vector3(0, -0.2, 0))
  const slatShelf = (r: { x0: number; x1: number; z0: number; z1: number }, y: number, tag: string) => {
    const lenX = r.x1 - r.x0
    const lenZ = r.z1 - r.z0
    if (lenX >= lenZ) {
      // Kryssbjelker (bærere) på tvers under spilene – endebærerne står helt ute
      // på bein-linjene, og spenner mellom fremre og bakre bein.
      const nb = Math.max(2, Math.round(lenX / 0.8) + 1)
      spread(r.x0 + vW / 2, r.x1 - vW / 2, nb).forEach((x, bi) => addBox(vT, 0.03, lenZ - vT, 'benk', `${tag}-b${bi}`, 0.85, wx(x), y - 0.026, wz((r.z0 + r.z1) / 2), { navn: 'Hyllebærer', profil: virkeStr, lengdeCm: Math.round((lenZ - vT) * 100) }, new THREE.Vector3(0, 0.05, 0)))
      const n = Math.max(2, Math.floor(lenZ / 0.09))
      spread(r.z0 + 0.04, r.z1 - 0.04, n).forEach((z, i) => addBox(lenX - 0.05, 0.022, 0.05, 'benk', `${tag}-${i}`, 0.95, wx((r.x0 + r.x1) / 2), y, wz(z), { navn: 'Hyllespile', profil: '50 × 22 mm', lengdeCm: Math.round(lenX * 100) }, new THREE.Vector3(0, 0.1, 0)))
    } else {
      const nb = Math.max(2, Math.round(lenZ / 0.8) + 1)
      spread(r.z0 + vT / 2, r.z1 - vT / 2, nb).forEach((z, bi) => addBox(lenX - vW, 0.03, vT, 'benk', `${tag}-b${bi}`, 0.85, wx((r.x0 + r.x1) / 2), y - 0.026, wz(z), { navn: 'Hyllebærer', profil: virkeStr, lengdeCm: Math.round((lenX - vW) * 100) }, new THREE.Vector3(0, 0.05, 0)))
      const n = Math.max(2, Math.floor(lenX / 0.09))
      spread(r.x0 + 0.04, r.x1 - 0.04, n).forEach((x, i) => addBox(0.05, 0.022, lenZ - 0.05, 'benk', `${tag}-${i}`, 0.95, wx(x), y, wz((r.z0 + r.z1) / 2), { navn: 'Hyllespile', profil: '50 × 22 mm', lengdeCm: Math.round(lenZ * 100) }, new THREE.Vector3(0, 0.1, 0)))
    }
  }
  const nh = Math.min(3, Math.max(0, Math.round(c.hyller)))
  runs.forEach((r, ri) => {
    const lenX = r.x1 - r.x0
    const lenZ = r.z1 - r.z0
    const nx = Math.max(2, Math.round(lenX / 1.2) + 1)
    spread(r.x0 + vW / 2, r.x1 - vW / 2, nx).forEach((x, xi) => {
      ;[r.z0 + vT / 2, r.z1 - vT / 2].forEach((z, zi) => legAt(x, z, `bein-${ri}-${xi}-${zi}`))
    })
    // Benkeplate (solid)
    addBox(lenX, 0.04, lenZ, 'benk', `benkeplate-${ri}`, 1, wx((r.x0 + r.x1) / 2), benkeplateTop - 0.02, wz((r.z0 + r.z1) / 2), { navn: `Benkeplate (${benkeplateNavn(c.benkeplate).toLowerCase()})`, profil: `${Math.round(BW * 1000)} mm`, lengdeCm: Math.round(Math.max(lenX, lenZ) * 100) }, new THREE.Vector3(0, 0.4, 0), worktopMat())
    // Skjørt (apron) rundt kanten rett under benkeplaten
    const apH = Math.max(0.07, vW)
    const apY = worktopUnder - apH / 2
    addBox(lenX, apH, vT, 'benk', `apron-f-${ri}`, 0.9, wx((r.x0 + r.x1) / 2), apY, wz(r.z0 + vT / 2), { navn: 'Skjørt (apron)', profil: virkeStr, lengdeCm: Math.round(lenX * 100) }, new THREE.Vector3(0, 0.25, -0.2))
    addBox(lenX, apH, vT, 'benk', `apron-b-${ri}`, 0.9, wx((r.x0 + r.x1) / 2), apY, wz(r.z1 - vT / 2), { navn: 'Skjørt (apron)', profil: virkeStr, lengdeCm: Math.round(lenX * 100) }, new THREE.Vector3(0, 0.25, 0.2))
    addBox(vT, apH, lenZ, 'benk', `apron-l-${ri}`, 0.9, wx(r.x0 + vT / 2), apY, wz((r.z0 + r.z1) / 2), { navn: 'Skjørt (apron)', profil: virkeStr, lengdeCm: Math.round(lenZ * 100) }, new THREE.Vector3(-0.2, 0.25, 0))
    addBox(vT, apH, lenZ, 'benk', `apron-r-${ri}`, 0.9, wx(r.x1 - vT / 2), apY, wz((r.z0 + r.z1) / 2), { navn: 'Skjørt (apron)', profil: virkeStr, lengdeCm: Math.round(lenZ * 100) }, new THREE.Vector3(0.2, 0.25, 0))
    // Slatta hyller med kryssbærere
    for (let h = 0; h < nh; h++) {
      const y = base + 0.14 + (h * (worktopUnder - apH - base - 0.2)) / Math.max(1, nh)
      slatShelf(r, y, `hylle-${ri}-${h}`)
    }
  })

  // Underskap i høyre ende av hovedbenken (dybden følger benken)
  const mainDepth = mainRun.z1 - mainRun.z0
  if (c.harSkap) {
    const skapH = worktopUnder - base
    const cx = mainRun.x1 - SKAP_W / 2
    const zc = (mainRun.z0 + mainRun.z1) / 2
    addBox(SKAP_W, skapH, mainDepth - 0.04, 'benk', 'skap-korpus', 0.9, wx(cx), base + skapH / 2, wz(zc), { navn: 'Underskap', profil: 'korpus', lengdeCm: Math.round(skapH * 100) }, new THREE.Vector3(0.1, -0.1, 0))
    // Slatta dør (loddrette bord) på fronten
    const dn = Math.max(3, Math.floor(SKAP_W / 0.08))
    spread(cx - SKAP_W / 2 + 0.05, cx + SKAP_W / 2 - 0.05, dn).forEach((dx, i) =>
      addBox(0.05, skapH - 0.08, 0.02, 'benk', `skap-dor-${i}`, 1, wx(dx), base + skapH / 2, wz(mainRun.z0 + 0.015), { navn: 'Skapdør-spile', profil: '50 × 22 mm', lengdeCm: Math.round((skapH - 0.08) * 100) }, new THREE.Vector3(0, 0, -0.3)),
    )
  }
  // Vask nedfelt i benkeplaten
  if (c.harVask) {
    const metal = new THREE.MeshStandardMaterial({ color: 0xb8bcc0, roughness: 0.3, metalness: 0.75 })
    const vx = mainRun.x0 + 0.5
    const vz = (mainRun.z0 + mainRun.z1) / 2
    addBox(0.42, 0.12, 0.36, 'benk', 'vask', 1, wx(vx), benkeplateTop - 0.06, wz(vz), { navn: 'Utslagsvask', profil: 'rustfri', lengdeCm: 42 }, new THREE.Vector3(0, 0.5, 0), metal)
    addBox(0.03, 0.28, 0.03, 'benk', 'kran', 1, wx(vx + 0.19), benkeplateTop + 0.14, wz(vz + 0.13), { navn: 'Kran', profil: 'Ø30', lengdeCm: 28 }, new THREE.Vector3(0, 0.6, 0), metal)
  }

  // ── Bakvegg: horisontale spiler + topphylle ──────────────────────
  if (c.harBakvegg) {
    const bx0 = mainRun.x0
    const bx1 = mainRun.x1
    const zc = mainRun.z1 + 0.03
    const y0 = benkeplateTop + 0.06
    const screenH = 1.0
    const y1 = y0 + screenH
    // Loddrette støtter (skjermstolper) med c/c ≤ 60 cm.
    const nStolpe = Math.max(2, Math.ceil((bx1 - bx0) / 0.6) + 1)
    spread(bx0 + vW / 2, bx1 - vW / 2, nStolpe).forEach((x, i) => addBox(vW, y1 - base, vT, 'vegg', `bakstolpe-${i}`, 0.92, wx(x), base + (y1 - base) / 2, wz(zc), { navn: 'Skjermstolpe', profil: virkeStr, lengdeCm: Math.round((y1 - base) * 100) }, new THREE.Vector3(0, 0.2, 0)))
    const n = Math.max(4, Math.floor(screenH / 0.09))
    const spileZ = zc - vT / 2 - 0.014 // spilene ligger på framsiden av stolpene
    spread(y0, y1 - 0.08, n).forEach((y, i) => addBox(bx1 - bx0 - 0.12, 0.045, 0.028, 'vegg', `bakspile-${i}`, 0.96, wx((bx0 + bx1) / 2), y, wz(spileZ), { navn: 'Bakvegg-spile', profil: '45 × 28 mm', lengdeCm: Math.round((bx1 - bx0) * 100) }, new THREE.Vector3(0, 0, 0.3)))
    // Topphylle på skjermen
    addBox(bx1 - bx0, 0.03, 0.16, 'vegg', 'bak-topphylle', 1, wx((bx0 + bx1) / 2), y1 + 0.015, wz(zc + 0.03), { navn: 'Topphylle', profil: '28 × 160 mm', lengdeCm: Math.round((bx1 - bx0) * 100) }, new THREE.Vector3(0, 0.3, 0))
  }

  // ── Sittebenk (kun rett form) ────────────────────────────────────
  if (c.harBenk && c.form === 'rett') {
    const seatY = base + 0.45
    const seatX = 0.08 + SEAT_D / 2
    const seatLen = Math.max(0.6, mainRun.z0 - 0.1)
    addBox(SEAT_D, 0.04, seatLen, 'benk', 'sittebenk', 1, wx(seatX), seatY - 0.02, wz(seatLen / 2 + 0.05), { navn: 'Sittebenk', profil: '34 × 98 mm', lengdeCm: Math.round(seatLen * 100) }, new THREE.Vector3(-0.3, 0.2, 0))
    ;[wz(0.1 + 0.05), wz(seatLen - 0.05)].forEach((zc, i) => addBox(SEAT_D - 0.06, seatY - base - 0.04, 0.06, 'benk', `sittebein-${i}`, 0.95, wx(seatX), base + (seatY - base - 0.04) / 2, zc, { navn: 'Benkebein', profil: '48 × 48 mm', lengdeCm: Math.round((seatY - base) * 100) }, new THREE.Vector3(-0.2, -0.1, 0)))
  }

  // ── Sidevegger (horisontale spiler) på begge sider ───────────────
  if (c.harSidevegger) {
    const topY = base + Math.min(1.8, cm(c.hoyde))
    ;[0.06, W - 0.06].forEach((xw, side) => {
      const y0 = base + 0.05
      const n = Math.max(4, Math.floor((topY - y0) / 0.09))
      spread(y0, topY - 0.06, n).forEach((y, i) => addBox(0.028, 0.045, D - 0.2, 'vegg', `sidevegg-${side}-${i}`, 0.96, wx(xw), y, wz(D / 2), { navn: 'Sidevegg-spile', profil: '45 × 28 mm', lengdeCm: Math.round((D - 0.2) * 100) }, new THREE.Vector3(side === 0 ? -0.3 : 0.3, 0, 0)))
    })
  }

  // Snu 180° så benkefronten (benkeplate, vask, skap) vender mot betrakteren.
  group.rotation.y = Math.PI

  return group
}

// ── Template ───────────────────────────────────────────────────────

// ── Målsatt 2D-tegning (plan + oppriss) ────────────────────────────
function tegning2D(c: UtekjokkenConfig): Tegning2D {
  const W = c.bredde
  const bd = c.benkedybde
  const bh = c.benkehoyde
  const roofed = c.taktype !== 'ingen'
  const beam = 14
  const post = 10
  const oh = 30

  // Oppriss: benk nederst, evt. tak + stolper over (fri høyde = c.hoyde).
  const oppriss = (len: number, navn: string, id: string): Tegning2D['riss'][number] => {
    const H = roofed ? c.hoyde + beam : bh
    const former: Tegning2D['riss'][number]['former'] = [
      { type: 'rect', x: 0, y: H - bh, w: len, h: bh }, // benk
    ]
    const maal: Tegning2D['riss'][number]['maal'] = [
      { x1: 0, y1: H, x2: len, y2: H, label: `${len} cm`, offset: 26 },
      { x1: len, y1: H - bh, x2: len, y2: H, label: `${bh} cm`, offset: 22 },
    ]
    if (roofed) {
      former.push({ type: 'rect', x: -oh, y: 0, w: len + 2 * oh, h: beam }) // drager
      former.push({ type: 'rect', x: 4, y: beam, w: post, h: H - beam })
      former.push({ type: 'rect', x: len - 4 - post, y: beam, w: post, h: H - beam })
      maal.push({ x1: 0, y1: beam, x2: 0, y2: H, label: `${c.hoyde} cm`, offset: 24 })
    } else {
      maal.push({ x1: 0, y1: H - bh, x2: 0, y2: H, label: `${bh} cm`, offset: 24 })
    }
    return { id, navn, bredde: len, hoyde: H, former, maal }
  }

  // Plan: rett = rektangel; L-form = vinkel med arm langs én side.
  const planD = c.form === 'rett' ? bd : Math.max(bd, c.sidelengde)
  let planFormer: Tegning2D['riss'][number]['former']
  if (c.form === 'rett') {
    planFormer = [{ type: 'rect', x: 0, y: 0, w: W, h: bd }]
  } else if (c.form === 'l-hoyre') {
    planFormer = [{ type: 'poly', points: [[0, 0], [W, 0], [W, c.sidelengde], [W - bd, c.sidelengde], [W - bd, bd], [0, bd], [0, 0]] }]
  } else {
    planFormer = [{ type: 'poly', points: [[0, 0], [W, 0], [W, bd], [bd, bd], [bd, c.sidelengde], [0, c.sidelengde], [0, 0]] }]
  }

  return {
    riss: [
      oppriss(W, 'Forfra', 'forfra'),
      oppriss(c.form === 'rett' ? bd : c.sidelengde, 'Fra siden', 'siden'),
      {
        id: 'plan',
        navn: 'Ovenfra (plan)',
        bredde: W,
        hoyde: planD,
        former: planFormer,
        maal: [
          { x1: 0, y1: planD, x2: W, y2: planD, label: `${W} cm`, offset: 26 },
          { x1: 0, y1: 0, x2: 0, y2: planD, label: `${planD} cm`, offset: 24 },
        ],
      },
    ],
  }
}

export const utekjokken: ProductTemplate<UtekjokkenConfig> = {
  id: 'utekjokken',
  navn: 'Utekjøkken',
  ikon: 'faKitchenSet',
  beskrivelse: 'Tegn utekjøkkenet i 3D – fra enkel spilebenk til stort overbygd kjøkken. Rett eller L-form, med tak, benkeplate, vask, skap og hyller.',
  bilde: '/images/products/utekjokken-3d.webp',
  tilgjengelig: true,
  fraPris: 349,
  // Materialpakke tilbys ikke for utekjøkken – kun forespør bygging + byggeplan.
  leveranser: ['ferdig', 'plan'],
  defaultConfig: {
    form: 'rett',
    bredde: 280,
    benkedybde: 60,
    dybde: 150,
    sidelengde: 180,
    hoyde: 220,
    taktype: 'ingen',
    takvinkel: 6,
    taktekke: 'stålplater',
    plattformHoyde: 20,
    benkehoyde: 90,
    benkeplate: 'tre',
    hyller: 1,
    virke: '36x63',
    harVask: true,
    harSkap: true,
    harBenk: false,
    harBakvegg: true,
    harSidevegger: false,
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  presets: [
    { id: 'enkel', navn: 'Enkel benk', beskrivelse: 'Spilebenk med hyller', config: { form: 'rett', bredde: 200, benkedybde: 60, taktype: 'ingen', harVask: false, harSkap: false, harBenk: false, harBakvegg: false, hyller: 2 } },
    { id: 'vask', navn: 'Benk med vask', beskrivelse: 'Vask og spilevegg', config: { form: 'rett', bredde: 240, benkedybde: 60, taktype: 'ingen', harVask: true, harSkap: false, harBakvegg: true, hyller: 1 } },
    { id: 'skap', navn: 'Med skap & vask', beskrivelse: 'Skap, vask, bakvegg', config: { form: 'rett', bredde: 300, benkedybde: 65, taktype: 'ingen', harVask: true, harSkap: true, harBakvegg: true, hyller: 1 } },
    { id: 'grill', navn: 'Grillstasjon', beskrivelse: 'Rustfri plate + skap', config: { form: 'rett', bredde: 300, benkedybde: 65, taktype: 'ingen', harVask: false, harSkap: true, harBakvegg: true, hyller: 1, benkeplate: 'rustfritt' } },
    { id: 'l-form', navn: 'L-kjøkken', beskrivelse: 'Hjørne med retur', config: { form: 'l-hoyre', bredde: 320, benkedybde: 65, sidelengde: 160, taktype: 'ingen', harVask: true, harSkap: true, harBakvegg: true, hyller: 1 } },
    { id: 'overbygd', navn: 'Overbygd', beskrivelse: 'Pulttak over benken', config: { form: 'rett', bredde: 320, benkedybde: 65, dybde: 150, taktype: 'pulttak', harVask: true, harSkap: true, harBakvegg: true, harSidevegger: true, hyller: 2, taktekke: 'bord' } },
    { id: 'stor', navn: 'Stort utekjøkken', beskrivelse: 'Bredt, overbygd, rustfritt', config: { form: 'rett', bredde: 420, benkedybde: 70, dybde: 180, taktype: 'pulttak', harVask: true, harSkap: true, harBakvegg: true, harSidevegger: true, hyller: 2, benkeplate: 'rustfritt', virke: '48x98' } },
    { id: 'xl', navn: 'Selskaps-kjøkken XL', beskrivelse: 'L-form under tak', config: { form: 'l-hoyre', bredde: 480, benkedybde: 70, dybde: 240, sidelengde: 200, hoyde: 230, taktype: 'pulttak', harVask: true, harSkap: true, harBakvegg: true, harSidevegger: true, hyller: 2, benkeplate: 'rustfritt', virke: '48x98', taktekke: 'shingel' } },
  ],
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 150, max: 600, step: 10, axis: 'x' },
    { key: 'benkehoyde', label: 'Høyde (benk)', min: 60, max: 90, step: 1, unit: 'cm', axis: 'y' },
    { key: 'hoyde', label: 'Fri høyde (under tak)', min: 200, max: 280, step: 5, axis: 'y', handle: false, visibleWhen: (c) => c.taktype !== 'ingen' },
    { key: 'benkedybde', label: 'Benkedybde', min: 60, max: 90, step: 5, unit: 'cm', axis: 'z' },
    { key: 'dybde', label: 'Dybde (under tak)', min: 120, max: 350, step: 10, axis: 'z', handle: false, visibleWhen: (c) => c.taktype !== 'ingen' },
    { key: 'sidelengde', label: 'L-arm lengde', min: 100, max: 350, step: 10, axis: 'z', handle: false, visibleWhen: (c) => c.form !== 'rett' },
    { key: 'plattformHoyde', label: 'Platting-høyde', min: 0, max: 60, step: 5, unit: 'cm', axis: 'y', handle: false, visibleWhen: (c) => c.taktype !== 'ingen' },
    { key: 'hyller', label: 'Antall hyller', min: 0, max: 3, step: 1, unit: 'stk', axis: 'y', handle: false },
    { key: 'takvinkel', label: 'Takvinkel', min: 3, max: 20, step: 1, unit: '°', axis: 'y', handle: false, visibleWhen: (c) => c.taktype === 'pulttak' },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'form',
      label: 'Form',
      choices: [
        { id: 'rett', label: 'Rett', note: 'Benk langs én side.' },
        { id: 'l-hoyre', label: 'L – høyre', note: 'Retur mot høyre.' },
        { id: 'l-venstre', label: 'L – venstre', note: 'Retur mot venstre.' },
      ],
    },
    {
      key: 'taktype',
      label: 'Tak',
      choices: [
        { id: 'ingen', label: 'Uten tak', note: 'Frittstående benk.' },
        { id: 'flatt', label: 'Flatt', note: 'Overbygd, svakt fall.' },
        { id: 'pulttak', label: 'Pulttak', note: 'Overbygd, skrår bakover.' },
      ],
    },
    {
      key: 'taktekke',
      label: 'Taktekke',
      visibleWhen: (c) => c.taktype !== 'ingen',
      choices: [
        { id: 'stålplater', label: 'Stålplater' },
        { id: 'bord', label: 'Bordtak' },
        { id: 'shingel', label: 'Shingel' },
      ],
    },
    {
      key: 'benkeplate',
      label: 'Benkeplate',
      choices: [
        { id: 'tre', label: 'Heltre' },
        { id: 'laminat', label: 'Laminat' },
        { id: 'rustfritt', label: 'Rustfritt' },
      ],
    },
    {
      key: 'virke',
      label: 'Virke (lekt)',
      choices: [
        { id: '23x48', label: '23 × 48 mm' },
        { id: '36x63', label: '36 × 63 mm' },
        { id: '48x98', label: '48 × 98 mm' },
      ],
    },
  ],
  valg: [
    { key: 'harVask', label: 'Vask', note: 'Utslagsvask med kran og avløp.' },
    { key: 'harSkap', label: 'Underskap', note: 'Lukket skap med dør.' },
    { key: 'harBenk', label: 'Sittebenk', note: 'Benk langs siden.' },
    { key: 'harBakvegg', label: 'Bakvegg', note: 'Spilervegg bak benken.' },
    { key: 'harSidevegger', label: 'Sidevegger', note: 'Spilervegger for le.' },
  ],
  parts: [
    { key: 'stolpe', label: 'Stolper' },
    { key: 'kneband', label: 'Knebånd' },
    { key: 'drager', label: 'Dragere' },
    { key: 'spaer', label: 'Spær' },
    { key: 'tak', label: 'Tak' },
    { key: 'platting', label: 'Platting' },
    { key: 'benk', label: 'Benk / innredning' },
    { key: 'vegg', label: 'Vegger' },
  ],
  beregn,
  kappliste,
  tegning2D,
  montering: (c) => {
    const roofed = c.taktype !== 'ingen'
    const steg = ['Kapp virket etter kapplista.']
    if (roofed) {
      steg.push(
        'Bygg den hevede plattingen: bjelkelag på fundamenter/klosser, og legg dekket med 4–6 mm spalte.',
        'Sett justerbare stolpesko og reis takstolpene i vater; avstiv midlertidig.',
        'Legg fremre og bakre drager oppå stolpene og fest med gjennomgående bolter. Ved pulttak er fronten høyest.',
        'Monter knebåndene i 45° fra stolpe opp mot drager.',
        `Legg spærene på tvers med c/c ${Math.round(SPAR_CC * 100)} cm etter fallet, med likt utstikk foran og bak.`,
        `Tekk taket med ${taktekkeNavn(c.taktekke).toLowerCase()} og sørg for fall bakover for avrenning.`,
      )
    }
    steg.push(
      `Bygg benkerammen: ${c.form !== 'rett' ? 'hoved-benk + L-arm, ' : ''}stå-bein i ${c.benkehoyde} cm høyde med gjennomgående øvre og nedre ramme (${c.benkedybde} cm dyp).`,
      `${c.hyller > 0 ? `Fest kryssbærere mellom beina og legg ${c.hyller} slatta hyller (duckboard) i de åpne feltene. ` : ''}Monter skjørt (apron) rundt benkekanten, og legg ${benkeplateNavn(c.benkeplate).toLowerCase()} benkeplate på toppen.`,
    )
    if (c.harVask) steg.push('Skjær ut hull for vasken i benkeplaten, monter utslagsvask, kran og avløp med vannlås.')
    if (c.harSkap) steg.push('Sett inn underskapet med slatta dør i enden av benken.')
    if (c.harBenk && c.form === 'rett') steg.push('Monter sittebenken langs siden i ca. 45 cm høyde.')
    if (c.harBakvegg) steg.push('Reis skjermstolpene (c/c ≤ 60 cm) og skru de horisontale spilene på framsiden, med topphylle øverst.')
    if (c.harSidevegger) steg.push('Kle sideveggene med horisontale spiler for ekstra le.')
    steg.push('Kontroller vater/lodd, ettertrekk innfestingene og behandle treverket etter tørk.')
    return steg
  },
  raad: (c) => [
    'Sett stolpene i justerbare stolpesko på støpte fundamenter (frostfri dybde) – ikke trevirke rett i bakken.',
    'Gi taket fall bakover (min. 1:40 for flatt) så vann og løv renner av; hold god avstand fra brennbart ved grill/koketopp.',
    c.harVask ? 'Legg avløpet med fall til stein-/gruvekum eller tett tank, og monter vannlås. Steng og tøm vannet før frost.' : 'Planlegg for vann/avløp senere selv om du ikke monterer vask nå – legg gjerne trekkerør i plattingen.',
    'Bruk rustfrie (A4) skruer og beslag, og forbor i endene så virket ikke sprekker.',
    `Behandle ${benkeplateNavn(c.benkeplate).toLowerCase()} benkeplate jevnlig${c.benkeplate === 'tre' ? ' med benkeplateolje' : ''}; rustfritt tåler mest og er lettest å holde rent.`,
    'Frittstående utekjøkken under 15–50 m² er ofte unntatt søknadsplikt, men sjekk høyde/avstand til nabogrense og brann med kommunen.',
  ],
  buildMesh,
  bounds: (c) => {
    const roofed = c.taktype !== 'ingen'
    const benkeTopp = (roofed ? cm(c.plattformHoyde) : 0) + cm(c.benkehoyde)
    const y = roofed
      ? cm(c.plattformHoyde) + cm(c.hoyde) + takFall(c) + 2 * virkeW(c.virke) + 0.2
      : benkeTopp + (c.harBakvegg ? 1.2 : 0.1) + 0.15
    return {
      x: cm(c.bredde) + (roofed ? 2 * OH : 0.2),
      y,
      z: totalDybde(c) + (roofed ? 2 * OH : 0.2),
    }
  },
}
