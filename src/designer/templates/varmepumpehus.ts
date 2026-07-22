import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { PRISER, prisFor } from '../priser'

/**
 * Varmepumpehus – parametrisk template.
 *
 * Hele huset bygges av lekt (23×48, eller 36×48 ved «forsterket»). Hvert hjørne
 * er to laminerte lekter forskjøvet så spjeldene får en skulder å feste mot.
 * Kledningen er skrå spjeld (louvre): lekt kløyvd i to i 45° og montert som
 * skråstilte, horisontale blad – slipper luft gjennom, men skygger for regn.
 * Pulttak med fall framover, valgbar takvinkel, spjeldspalte, taktype (over/
 * underligger, faspanel, takpapp), kvalitet, mål, treslag og farge.
 */

export interface VarmepumpehusConfig {
  kvalitet: string // 'standard' (23×48) | 'forsterket' (36×48 ramme)
  bredde: number // cm (x)
  hoyde: number // cm (y) – fronthøyde
  dybde: number // cm (z)
  takvinkel: number // grader
  spileGap: number // cm – luftspalte mellom spjeldbladene
  taktype: string // 'overunder' | 'faspanel' | 'takpapp'
  treslag: string
  farge: string
  [key: string]: DesignConfig[string]
}

const SVINN = 1.1 // 10 % kapp/svinn
const cm = (v: number) => v / 100

// Lekt 23×48 mm – hele huset bygges av denne (meter).
const LEKT_T = 0.023
const LEKT_W = 0.048

// Skrå spjeld (louvre): lekt kløyvd i to → 45°-kile. Dybde = lekttykkelse,
// bakhøyde = tykkelse + liten loddrett flate (settes pr. build ut fra kvalitet).
const BLADE_FLAT = 0.002 // liten loddrett flate på tynne ytterkant

// Tak / strekkere.
const ROOF_OVERHANG = 0.05 // 5 cm utstikk foran
const CROSS_OUT = 0.05 // tverrbord stikker 5 cm ut på hver side

const lektProfil = '23 × 48 mm'
const spjeldProfil = '23 × 48 mm (kløyvd 45°)'
const stiffProfil = '11 × 36 mm'
const takProfil = '21 × 98 mm'
// Beina løftes én lekttykkelse opp fra bakken (hviler på sålen).
const LEG_LIFT = LEKT_T
// Vertikal stiver bak spjeldene: 11×36 mm, én pr. påbegynt 60 cm spjeldspenn.
const STIFF_T = 0.011
const STIFF_W = 0.036
const STIFF_MAX_SPAN = 0.6
// ── Materialdeler (delt kilde for materialliste + kappliste) ───────
// Alle fysiske deler regnes ut fra samme geometri som 3D-modellen, slik at
// hvert bord telles. Lengder i meter.
interface Del {
  navn: string
  profil: string
  lengdeM: number
  antall: number
  mat: string // pris-id
  kløyvd?: boolean // 23×48 kløyvd i to → 2 spiler pr. lekt-lengde
}

// Bladlengder på én spjeldvegg – speiler klippingen i buildMesh mot takflaten.
function spjeldBlader(len: number, alongOffset: number, topX0: number, topX1: number, pitch: number, yStart: number, bladeH: number): number[] {
  const x0 = alongOffset - len / 2
  const x1 = alongOffset + len / 2
  const maxTop = Math.max(topX0, topX1)
  const sloped = Math.abs(topX1 - topX0) > 1e-9
  const res: number[] = []
  for (let yb = yStart; yb + bladeH <= maxTop + 1e-6; yb += pitch) {
    const need = yb + bladeH
    let cx0 = x0
    let cx1 = x1
    if (sloped) {
      const xc = x0 + ((need - topX0) / (topX1 - topX0)) * (x1 - x0)
      if (topX1 > topX0) cx0 = Math.max(x0, xc)
      else cx1 = Math.min(x1, xc)
    } else if (topX0 < need) {
      continue
    }
    const clen = cx1 - cx0
    if (clen > 0.02) res.push(clen)
  }
  return res
}

function deler(c: VarmepumpehusConfig): Del[] {
  const w = c.bredde / 100
  const h = c.hoyde / 100
  const d = c.dybde / 100
  const dz = d / 2
  const wx = w / 2
  const roofRad = (c.takvinkel * Math.PI) / 180
  const tanR = Math.tan(roofRad)
  const cosR = Math.cos(roofRad)
  // Forsterket: hele huset i 36×48 i stedet for 23×48.
  const forsterket = c.kvalitet === 'forsterket'
  const T = forsterket ? 0.036 : LEKT_T // lekt-tykkelse
  const W = LEKT_W // 48 mm bredde
  const bladeH = BLADE_FLAT + T // 45°-kile, skalerer med tykkelsen
  const LEKT = forsterket ? 'stolpe-36x48' : 'stolpe-23x48'
  const lektP = forsterket ? '36 × 48 mm' : lektProfil
  const spjeldP = forsterket ? '36 × 48 mm (kløyvd 45°)' : spjeldProfil
  const yFrontTop = T + h
  const roofTop = (z: number) => yFrontTop + (dz - z) * tanR
  const yStart = T // sålens overkant
  const out: Del[] = []
  const push = (navn: string, profil: string, lengdeM: number, antall: number, mat: string, kløyvd = false) => {
    if (lengdeM > 0.001 && antall > 0) out.push({ navn, profil, lengdeM, antall, mat, kløyvd })
  }

  // Hjørnebein. Lengde = høyeste (bakre) hjørne av lamina (skråkappet topp).
  const legLen = (zLo: number) => roofTop(zLo) - T
  push('Hjørnebein front, ytre', lektP, legLen(dz - W), 2, LEKT)
  push('Hjørnebein front, indre', lektP, legLen(dz - T - W), 2, LEKT)
  push('Hjørnebein bak, ytre', lektP, legLen(-(dz + W)), 2, LEKT)
  // Bak indre bord er dobbelt bredt = 2 lekt limt på bredden (2 hjørner × 2).
  push('Hjørnebein bak, indre (2 limt)', lektP, legLen(-(dz + T)), 4, LEKT)

  // Såle / bunnramme (flatt).
  push('Såle front', lektP, w, 1, LEKT)
  push('Såle side', lektP, d + W, 2, LEKT)

  // Spjeld (kløyvd → 2 blad pr. lekt-lengde). Antall følger spalten.
  const gapM = (typeof c.spileGap === 'number' ? c.spileGap : 4) / 100
  const pitch = bladeH + gapM
  const frontTop = roofTop(dz)
  const frontLen = w - 2 * T
  const sideLen = d - W
  const sideZc = W / 2
  const rX0 = sideZc - sideLen / 2
  const rX1 = sideZc + sideLen / 2
  const front = spjeldBlader(frontLen, 0, frontTop, frontTop, pitch, yStart, bladeH)
  push('Spjeld front', spjeldP, frontLen, front.length, LEKT, true)
  const side = [
    ...spjeldBlader(sideLen, sideZc, roofTop(-rX0), roofTop(-rX1), pitch, yStart, bladeH),
    ...spjeldBlader(sideLen, -sideZc, roofTop(-rX1), roofTop(-rX0), pitch, yStart, bladeH),
  ]
  const sideGrp = new Map<number, number>()
  side.forEach((L) => {
    const cmL = Math.round(L * 100)
    sideGrp.set(cmL, (sideGrp.get(cmL) ?? 0) + 1)
  })
  sideGrp.forEach((cnt, cmL) => push('Spjeld side (skråkappes)', spjeldP, cmL / 100, cnt, LEKT, true))

  // Vertikale stivere (11×36) – én pr. påbegynt 60 cm, høyde følger takflaten.
  const stiver = (len: number, topX0: number, topX1: number, alongOffset: number) => {
    const nStiff = Math.max(0, Math.ceil(len / STIFF_MAX_SPAN) - 1)
    const x0 = alongOffset - len / 2
    const x1 = alongOffset + len / 2
    const sloped = Math.abs(topX1 - topX0) > 1e-9
    for (let s = 1; s <= nStiff; s++) {
      const lx = x0 + (s * len) / (nStiff + 1)
      const topLx = sloped ? topX0 + ((topX1 - topX0) * (lx - x0)) / (x1 - x0) : topX0
      push('Vertikal stiver', stiffProfil, topLx - yStart, 1, 'lekt-11x36')
    }
  }
  stiver(frontLen, frontTop, frontTop, 0)
  stiver(sideLen, roofTop(-rX0), roofTop(-rX1), sideZc)
  stiver(sideLen, roofTop(-rX1), roofTop(-rX0), -sideZc)

  // Diagonalstiver (45°) – én pr. side.
  const zHit = (yFrontTop + dz * tanR - yStart - dz) / (1 + tanR)
  const zEnd = Math.min(dz, zHit)
  push('Diagonalstiver (45°)', lektP, (zEnd + dz) * Math.SQRT2, 2, LEKT)

  // Takstrekkere + tverrbord.
  const run = d + ROOF_OVERHANG + W
  const slope = run / cosR
  push('Sidestrekker', lektP, slope, 2, LEKT)
  const crossLen = 2 * (wx + T + CROSS_OUT)
  push('Tverrbord (tak)', lektP, crossLen, 2, LEKT)

  // Taktekking.
  const roofW = crossLen
  if (c.taktype === 'takpapp') {
    push('Takbord (underlag)', takProfil, slope, Math.max(1, Math.round(roofW / 0.098)), 'bord-21x98')
  } else if (c.taktype === 'faspanel') {
    push('Faspanel (tak)', takProfil, slope, Math.max(1, Math.round(roofW / 0.1)), 'bord-21x98')
  } else {
    const target = 0.098
    const nU = Math.max(2, Math.round((roofW + target) / (2 * target)))
    push('Takbord underligger', takProfil, slope, nU, 'bord-21x98')
    push('Takbord overligger', takProfil, slope, nU - 1, 'bord-21x98')
  }

  return out
}

// ── Beregning (materialliste + estimat) ────────────────────────────

function beregn(c: VarmepumpehusConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const del = deler(c)

  // Løpemeter pr. materialtype (kløyvde spjeld teller halv lekt-lengde å kjøpe).
  const lmByMat = new Map<string, number>()
  del.forEach((p) => {
    const lmv = p.lengdeM * p.antall * (p.kløyvd ? 0.5 : 1)
    lmByMat.set(p.mat, (lmByMat.get(p.mat) ?? 0) + lmv)
  })

  // Takpapp-areal (kun takpapp).
  const w = c.bredde / 100
  const d = c.dybde / 100
  const cosR = Math.cos((c.takvinkel * Math.PI) / 180)
  const T = c.kvalitet === 'forsterket' ? 0.036 : LEKT_T
  const run = d + ROOF_OVERHANG + LEKT_W
  const roofW = 2 * (w / 2 + T + CROSS_OUT)
  const takArealM2 = c.taktype === 'takpapp' ? roofW * (run / cosR) : 0

  // Kostnad: trevirke × treslag-faktor + evt. papp + skruer, alt inkl. svinn.
  let woodKr = 0
  let totalLm = 0
  lmByMat.forEach((lmv, mat) => {
    totalLm += lmv
    woodKr += lmv * prisFor(mat) * faktor
  })
  const skruer = Math.round(totalLm * 5 + 30)
  // Trelim til de laminerte hjørnebeina (limflate = beinlengder). ~12 lm pr. flaske.
  const beinLm = del.filter((p) => p.navn.startsWith('Hjørnebein')).reduce((a, p) => a + p.lengdeM * p.antall, 0)
  const limFlasker = Math.max(1, Math.ceil(beinLm / 12))
  const veggSkruer = 4 // 2 pr. bak-bein × 2 bein (6×80 til veggen)
  const estimatKr =
    Math.round(
      ((woodKr + takArealM2 * prisFor('takpapp')) * SVINN +
        skruer * prisFor('skrue') +
        limFlasker * prisFor('trelim') +
        veggSkruer * prisFor('skrue-6x80')) /
        10,
    ) * 10

  // Materialliste = handleliste for byggevarehuset: total lengde pr. materialtype
  // inkl. 10 % kapp/svinn. (Kappliste-fanen viser hvert enkelt bord.)
  const rekkefolge = ['stolpe-36x48', 'stolpe-23x48', 'bord-21x98', 'lekt-11x36']
  const linjer: BomLine[] = [...lmByMat.entries()]
    .sort((a, b) => rekkefolge.indexOf(a[0]) - rekkefolge.indexOf(b[0]))
    .map(([mat, lmv]) => ({
      navn: PRISER[mat]?.navn ?? mat,
      antall: Math.round(lmv * SVINN * 10) / 10,
      enhet: 'lm',
      kommentar: 'inkl. 10 % svinn',
    }))
  if (takArealM2 > 0) linjer.push({ navn: PRISER['takpapp'].navn, antall: Math.round(takArealM2 * SVINN * 10) / 10, enhet: 'm²', kommentar: 'over underlag' })
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4', antall: skruer, enhet: 'stk' })
  linjer.push({ navn: PRISER['trelim'].navn, antall: limFlasker, enhet: 'stk', kommentar: 'til laminering av hjørnebein' })
  linjer.push({ navn: PRISER['skrue-6x80'].navn, antall: veggSkruer, enhet: 'stk', kommentar: 'gjennom bak-beina til veggen' })

  const sammendrag = `${c.bredde}×${c.dybde}×${c.hoyde} cm · ${c.takvinkel}° tak · ${c.taktype} · ${c.kvalitet} · ${TRESLAG[c.treslag]?.label ?? c.treslag}`
  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * c.dybde) / 10000, maal: `${c.bredde} × ${c.dybde} × ${c.hoyde} cm` }
}

// ── Målsatt 2D-tegning (plan + oppriss) ────────────────────────────
// Bygges av de samme parametrene som 3D-modellen. Fronten er lavest,
// baksiden løftes av takfallet (pulttak). Mål i cm.
function tegning2D(c: VarmepumpehusConfig): Tegning2D {
  const B = c.bredde
  const D = c.dybde
  const Hf = c.hoyde // fronthøyde
  const fall = Math.round(D * Math.tan((c.takvinkel * Math.PI) / 180))
  const Hb = Hf + fall // bakhøyde
  const takT = 6 // tegnet taktykkelse
  const utstikkSide = 5 // tverrbord stikker ut på hver side
  const utstikkFront = Math.round(ROOF_OVERHANG * 100)

  // Forfra: front-flate B × Hf, med takkappe på toppen.
  const forfra: Tegning2D['riss'][number] = {
    id: 'forfra',
    navn: 'Forfra',
    bredde: B + 2 * utstikkSide,
    hoyde: Hf + takT,
    former: [
      { type: 'rect', x: utstikkSide, y: takT, w: B, h: Hf },
      { type: 'rect', x: 0, y: 0, w: B + 2 * utstikkSide, h: takT },
    ],
    maal: [
      { x1: utstikkSide, y1: takT + Hf, x2: utstikkSide + B, y2: takT + Hf, label: `${B} cm`, offset: 26 },
      { x1: utstikkSide, y1: takT, x2: utstikkSide, y2: takT + Hf, label: `${Hf} cm`, offset: 24 },
    ],
  }

  // Fra siden: front (venstre) lav, bakside (høyre) høy – takfallet synes.
  const sett = [
    [utstikkFront, Hb], // takutstikk foran, nede
    [utstikkFront, Hb - Hf], // front-eave
    [utstikkFront + D, 0], // bak-topp
    [utstikkFront + D, Hb], // bak, nede
    [utstikkFront, Hb], // tilbake til start (bunn)
  ] as Array<[number, number]>
  const fraSiden: Tegning2D['riss'][number] = {
    id: 'siden',
    navn: 'Fra siden',
    bredde: D + utstikkFront + 6,
    hoyde: Hb,
    former: [
      { type: 'poly', points: sett },
      // takplate langs fallet
      { type: 'line', points: [[0, Hb - Hf - 1], [utstikkFront + D, -1]], tynn: true },
    ],
    maal: [
      { x1: utstikkFront, y1: Hb, x2: utstikkFront + D, y2: Hb, label: `${D} cm`, offset: 26 },
      { x1: utstikkFront, y1: Hb - Hf, x2: utstikkFront, y2: Hb, label: `${Hf} cm`, offset: 24 },
      { x1: utstikkFront + D, y1: 0, x2: utstikkFront + D, y2: Hb, label: `${Hb} cm`, offset: 24 },
    ],
    tekster: [{ x: utstikkFront + D * 0.4, y: Hb - Hf - 8, tekst: `${c.takvinkel}° fall` }],
  }

  // Ovenfra (plan): B × D.
  const ovenfra: Tegning2D['riss'][number] = {
    id: 'plan',
    navn: 'Ovenfra (plan)',
    bredde: B,
    hoyde: D,
    former: [{ type: 'rect', x: 0, y: 0, w: B, h: D }],
    maal: [
      { x1: 0, y1: D, x2: B, y2: D, label: `${B} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: D, label: `${D} cm`, offset: 24 },
    ],
  }

  return { riss: [forfra, fraSiden, ovenfra] }
}

// ── Kappliste ──────────────────────────────────────────────────────

function kappliste(c: VarmepumpehusConfig): KapplisteDel[] {
  const map = new Map<string, KapplisteDel>()
  deler(c).forEach((p) => {
    const L = Math.round(p.lengdeM * 100)
    const key = `${p.navn}|${p.profil}|${L}`
    const ex = map.get(key)
    if (ex) ex.antall += p.antall
    else map.set(key, { navn: p.navn, profil: p.profil, lengdeCm: L, antall: p.antall })
  })
  return [...map.values()]
}

// ── 3D-modell ──────────────────────────────────────────────────────

function buildMesh(c: VarmepumpehusConfig, opts?: BuildOptions): THREE.Group {
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
  const scale = 0.01
  const w = c.bredde * scale
  const h = c.hoyde * scale
  const d = c.dybde * scale

  // Forsterket: hele huset bygges i 36×48 i stedet for 23×48. Alle mål er
  // proporsjonale med lekttykkelsen, så modellen skalerer konsistent.
  // eslint-disable-next-line no-shadow
  const LEKT_T = c.kvalitet === 'forsterket' ? 0.036 : 0.023
  // eslint-disable-next-line no-shadow
  const LEG_OVERLAP = LEKT_T
  // eslint-disable-next-line no-shadow
  const LEG_LIFT = LEKT_T
  // eslint-disable-next-line no-shadow
  const BLADE_D = LEKT_T
  // eslint-disable-next-line no-shadow
  const BLADE_H = BLADE_FLAT + LEKT_T // 45°-kile, skalerer med tykkelsen
  const frameProfil = c.kvalitet === 'forsterket' ? '36 × 48 mm' : lektProfil

  // Takfall (pulttak med fall framover): fronten er forankret (= hoyde), og
  // bakenden løftes når vinkelen øker. roofTop(z) er overkanten – samme linje
  // som strekkernes overkant – som både bein og spjeld følger, foran og bak.
  const roofRad = (c.takvinkel * Math.PI) / 180
  const tanR = Math.tan(roofRad)
  const yFrontTop = LEG_LIFT + h // fronthøyde ved frontplanet (z = d/2)
  const roofTop = (z: number) => yFrontTop + (d / 2 - z) * tanR

  // ── Hjørnebein (to laminerte lekter, forskjøvet) ─────────────────
  // Bygges fra bunnen: først de fire hjørnene. Hvert hjørne er to 23×48-lekter
  // limt flate-mot-flate (46 mm i x, ytterflate flukter x=±w/2), men forskjøvet
  // LEG_OVERLAP (~23 mm) langs z i forhold til hverandre. Forskyvningen lager en
  // 23 mm skulder som spjeldene fester mot: front-beina skyves framover (+z ut),
  // bak-beina bakover (−z). Bak-beinas indre bord er dobbelt så bredt (96 mm).
  const corners: Array<{ sx: number; sz: number }> = [
    { sx: -1, sz: 1 }, // front-venstre
    { sx: 1, sz: 1 }, // front-høyre
    { sx: -1, sz: -1 }, // bak-venstre
    { sx: 1, sz: -1 }, // bak-høyre
  ]
  corners.forEach(({ sx, sz }, idx) => {
    const front = sz > 0
    const navn = front ? 'Hjørnebein front' : 'Hjørnebein bak'
    const explode = new THREE.Vector3(sx, -0.15, sz).normalize().multiplyScalar(0.3)
    // xNr: 0 = ytre lamina (ved sideplanet), 1 = indre lamina (limt innenfor).
    const addLamina = (nr: number, xNr: number, zCenter: number, lenZ: number) => {
      const pid = `ramme-${idx}-${nr}`
      const zLo = zCenter - lenZ / 2
      const zHi = zCenter + lenZ / 2
      // Sideprofil (z, y): loddrette sider, bunn ved LEG_LIFT, topp kappet skrått
      // langs takflaten (roofTop) – samme vinkel som strekkerne.
      const shape = new THREE.Shape()
      shape.moveTo(zLo, LEG_LIFT)
      shape.lineTo(zHi, LEG_LIFT)
      shape.lineTo(zHi, roofTop(zHi))
      shape.lineTo(zLo, roofTop(zLo))
      shape.closePath()
      const g = new THREE.ExtrudeGeometry(shape, { depth: LEKT_T, bevelEnabled: false })
      g.rotateY(-Math.PI / 2) // profil i z-y, ekstrudert langs x (tykkelse)
      g.translate(sx * (w / 2 - LEKT_T / 2 - xNr * LEKT_T) + LEKT_T / 2, 0, 0)
      const mat = meshMat(pid, 0.9)
      mat.side = THREE.DoubleSide
      const lek = new THREE.Mesh(g, mat)
      lek.castShadow = true
      lek.receiveShadow = true
      lek.userData.part = 'ramme'
      lek.userData.pid = pid
      lek.userData.info = { navn, profil: nr === 1 && !front ? `${c.kvalitet === 'forsterket' ? 36 : 23} × 96 mm (2 lekt)` : frameProfil, lengdeCm: Math.round((roofTop(zCenter) - LEG_LIFT) * 100) }
      lek.userData.explode = explode
      group.add(lek)
    }
    // Kun den ytre lamina på bak-beina skyves 48 mm lenger bak enn bak-planet.
    const backShift = front ? 0 : LEKT_W
    // Ytre lamina: 48 mm bred, ytterflate flukter med front/bak-planet (z=±d/2).
    addLamina(0, 0, sz * (d / 2 + backShift - LEKT_W / 2), LEKT_W)
    // Indre lamina: limt innenfor, forskjøvet LEG_OVERLAP så det står fram en
    // 23 mm skulder. Front-bein skyves innover (−), bak-bein utover (+).
    // Bak-bein: dobbelt bredt indre bord (96 mm).
    const innerLen = front ? LEKT_W : 2 * LEKT_W
    const shoulderShift = front ? -LEG_OVERLAP : LEG_OVERLAP
    addLamina(1, 1, sz * (d / 2 + shoulderShift - innerLen / 2), innerLen)
  })

  // ── Bunnramme / såle (footer) ────────────────────────────────────
  // Flate bord som ligger flatt: venstre (bak→front), front (venstre→høyre) og
  // høyre (front→bak) – U-form, åpen bak. Geringes 45° i de to fronthjørnene.
  // 48 mm bredde flukter med ytterplanet; tykkelsen følger lekten (23/36 mm).
  const FW = LEKT_W // 48 mm bredde (ligger flatt)
  const FH = LEKT_T // sålens tykkelse (høyde)
  const wx = w / 2
  const dz = d / 2
  const footerBoard = (nr: number, pts: Array<[number, number]>, navn: string, lengdeCm: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: FH, bevelEnabled: false })
    g.rotateX(Math.PI / 2) // fotavtrykk i x-z, ekstrudert oppover i y
    g.translate(0, FH, 0)
    const pid = `footer-${nr}`
    const mat = meshMat(pid, 0.9)
    mat.side = THREE.DoubleSide
    const m = new THREE.Mesh(g, mat)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'ramme'
    m.userData.pid = pid
    m.userData.info = { navn, profil: frameProfil, lengdeCm: Math.round(lengdeCm) }
    m.userData.explode = new THREE.Vector3(0, -0.4, 0)
    group.add(m)
  }
  const backZ = dz + LEKT_W // sålen går helt bak til bak-beina (48 mm bak bak-planet)
  // Front (geret begge ender).
  footerBoard(0, [[-wx, dz], [wx, dz], [wx - FW, dz - FW], [-wx + FW, dz - FW]], 'Såle front', c.bredde)
  // Venstre (geret front, butt bak – helt bak).
  footerBoard(1, [[-wx, dz], [-wx + FW, dz - FW], [-wx + FW, -backZ], [-wx, -backZ]], 'Såle venstre', c.dybde)
  // Høyre (geret front, butt bak – helt bak).
  footerBoard(2, [[wx, dz], [wx, -backZ], [wx - FW, -backZ], [wx - FW, dz - FW]], 'Såle høyre', c.dybde)

  // ── Spjeld (louvre-blad: 23×48 kløyvd 45°) ───────────────────────
  // Kilesnitt (rettvinklet trekant): flat bunn, 48 mm skråflate som vender
  // opp-og-ut, ytterkant i flukt med ytterplanet (lokal z=0), stikker BL innover.
  // Legges fra topp av sålen og itereres oppover med konfigurerbar luftspalte.
  // 23×48-plank kløyvd i to. Kile: bunn/dybde = 23 mm, skråflate (hypotenus) =
  // 33.2 mm → bakhøyde ≈ 24 mm. Dybden 23 mm flukter med skulderforskyvningen
  // (ytre↔indre plank). Liten loddrett flate på tynne ytterkant før 90°-hjørnet.
  const gapM = (typeof c.spileGap === 'number' ? c.spileGap : 4) / 100
  const pitch = BLADE_H + gapM
  const yStart = FH // topp av sålen
  const bladeShape = new THREE.Shape()
  bladeShape.moveTo(0, 0) // ytre bunn (ved planet – 90°-hjørne)
  bladeShape.lineTo(0, BLADE_FLAT) // liten loddrett flate på tynne ytterkant
  bladeShape.lineTo(-BLADE_D, BLADE_H) // 45° skråflate opp til indre topp
  bladeShape.lineTo(-BLADE_D, 0) // indre bunn (bakre loddrett kant)
  bladeShape.closePath()
  const makeBladeGeom = (len: number) => {
    const g = new THREE.ExtrudeGeometry(bladeShape, { depth: len, bevelEnabled: false })
    g.rotateY(-Math.PI / 2) // ekstrudering (Z=lengde) → lokal x; skråflate ut mot lokal +z
    g.translate(len / 2, 0, 0)
    return g
  }
  // topX0/topX1 = takflatens høyde ved bladenes to lokale x-ender (x0 = −len/2,
  // x1 = +len/2). Bladene klippes så de følger den skrå takflaten (foran/bak).
  const bladeWall = (len: number, alongOffset: number, prefix: string, navn: string, lengdeCm: number, ry: number, px: number, pz: number, topX0: number, topX1: number) => {
    const wall = new THREE.Group()
    const x0 = alongOffset - len / 2
    const x1 = alongOffset + len / 2
    const maxTop = Math.max(topX0, topX1)
    const sloped = Math.abs(topX1 - topX0) > 1e-9
    let i = 0
    for (let yb = yStart; yb + BLADE_H <= maxTop + 1e-6; yb += pitch, i++) {
      const need = yb + BLADE_H
      let cx0 = x0
      let cx1 = x1
      if (sloped) {
        const xc = x0 + ((need - topX0) / (topX1 - topX0)) * (x1 - x0)
        if (topX1 > topX0) cx0 = Math.max(x0, xc)
        else cx1 = Math.min(x1, xc)
      } else if (topX0 < need) {
        continue
      }
      const clen = cx1 - cx0
      if (clen <= 0.02) continue
      const pid = `${prefix}-${i}`
      const mat = meshMat(pid)
      mat.side = THREE.DoubleSide
      const m = new THREE.Mesh(makeBladeGeom(clen), mat)
      m.position.set((cx0 + cx1) / 2, yb, 0)
      m.castShadow = true
      m.receiveShadow = true
      m.userData.part = 'spiler'
      m.userData.pid = pid
      wall.add(m)
    }
    // Vertikal stiver (11×36) bak spjeldene når spennet er over 60 cm.
    // Antall = én pr. påbegynt 60 cm, jevnt fordelt; høyden følger takflaten.
    const nStiff = Math.max(0, Math.ceil(len / STIFF_MAX_SPAN) - 1)
    for (let s = 1; s <= nStiff; s++) {
      const lx = x0 + (s * len) / (nStiff + 1)
      const topLx = sloped ? topX0 + ((topX1 - topX0) * (lx - x0)) / (x1 - x0) : topX0
      const sh = topLx - yStart
      if (sh <= 0.02) continue
      const spid = `${prefix}-stiver-${s}`
      const sm = new THREE.Mesh(new THREE.BoxGeometry(STIFF_W, sh, STIFF_T), meshMat(spid, 0.85))
      sm.position.set(lx, (yStart + topLx) / 2, -BLADE_D - STIFF_T / 2)
      sm.castShadow = true
      sm.receiveShadow = true
      sm.userData.part = 'stiver'
      sm.userData.pid = spid
      wall.add(sm)
    }
    wall.rotation.y = ry
    wall.position.set(px, 0, pz)
    wall.userData.info = { navn, profil: spjeldProfil, lengdeCm: Math.round(lengdeCm) }
    wall.userData.explode = new THREE.Vector3(px, 0, pz).normalize().multiplyScalar(0.4)
    group.add(wall)
  }
  // Bladene (23 mm dype) ligger i ytre-lamina-sjiktet: ytterkant i flukt med
  // ytre plank, innerkant i flukt med indre plank. De butter mot beina:
  // Front: mot ytre laminas innerflate i x (LEKT_T pr. side).
  const frontLen = w - 2 * LEKT_T
  // Side: fra front-beinets bakkant (d/2−48) til bak-planet (−d/2).
  const sideLen = d - LEKT_W
  const sideZc = LEKT_W / 2 // sentrum mellom front-beinets bakkant og bak-planet
  // Front: flat overkant ved frontplanet. Sider: overkant følger takfallet
  // (lokal x → verdens z: høyre z=−x, venstre z=+x).
  const frontTop = roofTop(dz)
  const rX0 = sideZc - sideLen / 2
  const rX1 = sideZc + sideLen / 2
  bladeWall(frontLen, 0, 'spile-front', 'Spjeld front', frontLen * 100, 0, 0, dz, frontTop, frontTop)
  bladeWall(sideLen, sideZc, 'spile-hoyre', 'Spjeld side', sideLen * 100, Math.PI / 2, wx, 0, roofTop(-rX0), roofTop(-rX1))
  bladeWall(sideLen, -sideZc, 'spile-venstre', 'Spjeld side', sideLen * 100, -Math.PI / 2, -wx, 0, roofTop(-rX1), roofTop(-rX0))

  // ── Diagonale avstivere på sidene (23×48, X-kryss) ───────────────
  // Innsiden av spjeldene. To diagonaler (sidens to diagonaler): bak-bunn →
  // front-topp, og front-bunn → bak-topp. På begge sider.
  const addBrace = (zA: number, yA: number, zB: number, yB: number, tag: string) => {
    const len = Math.hypot(zB - zA, yB - yA)
    const ang = Math.atan2(yB - yA, zB - zA)
    // Endene kappes loddrett (langs de loddrette beina) → 45°-snitt på selve
    // bordet. Loddrett høyde av 48 mm-bredden = LEKT_W / cos(vinkel).
    const Wv = LEKT_W / Math.cos(ang)
    // Sideprofil (z, y): parallellogram med langsider langs diagonalen og
    // loddrette ender ved zA (bak-bein) og zB (front-bein).
    const pts: Array<[number, number]> = [
      [zA, yA - Wv / 2],
      [zB, yB - Wv / 2],
      [zB, yB + Wv / 2],
      [zA, yA + Wv / 2],
    ]
    const inX = wx - BLADE_D // innerkant av spjeldene
    ;[1, -1].forEach((sgn) => {
      const pid = `diag-${tag}-${sgn > 0 ? 'h' : 'v'}`
      const shape = new THREE.Shape()
      shape.moveTo(pts[0][0], pts[0][1])
      for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
      shape.closePath()
      const g = new THREE.ExtrudeGeometry(shape, { depth: LEKT_T, bevelEnabled: false })
      g.rotateY(-Math.PI / 2) // profil i z-y, ekstrudert langs x (tykkelse)
      g.translate(sgn > 0 ? inX : -inX + LEKT_T, 0, 0)
      const mat = meshMat(pid, 0.85)
      mat.side = THREE.DoubleSide
      const m = new THREE.Mesh(g, mat)
      m.castShadow = true
      m.receiveShadow = true
      m.userData.part = 'stiver'
      m.userData.pid = pid
      m.userData.info = { navn: 'Diagonalstiver', profil: frameProfil, lengdeCm: Math.round(len * 100) }
      m.userData.explode = new THREE.Vector3(sgn * 0.4, 0, 0)
      group.add(m)
    })
  }
  // Alltid 45°: fra bak-bunn stiger den 45° til den møter takstrekkeren (takflaten),
  // begrenset til fronten.
  const tR = Math.tan(roofRad)
  const zHit = (yFrontTop + dz * tR - yStart - dz) / (1 + tR)
  const zEnd = Math.min(dz, zHit)
  addBrace(-dz, yStart, zEnd, yStart + (zEnd + dz), 'a')

  // ── Skruehull i bak-beina (veggmontering) ────────────────────────
  // Ø6 mm gjennom bak-beinets ytre lamina for en 6×80 treskrue inn i veggen.
  // Plasseres i glipene mellom spjeldene (øvre + nedre feste).
  const screwR = 0.003 // 6 mm diameter
  const backOuterZ = -(dz + LEKT_W / 2) // z-senter for bak-beinets ytre lamina
  const backLegH = roofTop(backOuterZ) - LEG_LIFT
  const gapCenterY = (frac: number) => {
    const i = Math.max(0, Math.round((frac * backLegH - BLADE_H - gapM / 2) / pitch))
    return yStart + i * pitch + BLADE_H + gapM / 2 // senter av glipen
  }
  const screwMat = new THREE.MeshStandardMaterial({ color: 0x140f0b, roughness: 0.95 })
  ;[-1, 1].forEach((sx) => {
    ;[0.22, 0.82].forEach((frac, k) => {
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(screwR, screwR, LEKT_W + 0.006, 16), screwMat)
      hole.rotation.x = Math.PI / 2 // akse langs z (inn i veggen)
      hole.position.set(sx * (wx - LEKT_T / 2), gapCenterY(frac), backOuterZ)
      hole.userData.part = 'ramme'
      hole.userData.pid = `skruehull-${sx > 0 ? 'h' : 'v'}-${k}`
      hole.userData.info = { navn: 'Skruehull (Ø6, vegg)', profil: 'for 6 × 80 mm', lengdeCm: 0 }
      group.add(hole)
    })
  })

  // ── Sidestrekkere (bærer takfallet) ──────────────────────────────
  // Montert utenpå hver side, skrå etter takvinkelen (default 22.5°) med fall
  // framover. Strekker seg 5 cm lenger enn dybden (utstikk foran). Begge ender
  // kappes loddrett; bakenden flukter med bak-beinets bakkant.
  const STRETCH_T = LEKT_T // 23 mm tykk (ut fra siden)
  const STRETCH_H = LEKT_W // 48 mm høy
  const overhang = 0.05 // 5 cm utstikk foran
  const zBack = -(d / 2 + LEKT_W) // flukter med bak-beinets bakkant
  const zFront = d / 2 + overhang
  const run = zFront - zBack
  const cosR = Math.cos(roofRad)
  const Hc = STRETCH_H / cosR // loddrett høyde av kappet
  // Overkant = roofTop(z) (samme linje som bein og spjeld); underkant Hc lavere.
  // Begge ender kappes loddrett.
  const pts: Array<[number, number]> = [
    [zBack, roofTop(zBack)],
    [zFront, roofTop(zFront)],
    [zFront, roofTop(zFront) - Hc], // loddrett frontkapp
    [zBack, roofTop(zBack) - Hc], // loddrett bakkapp
  ]
  ;[1, -1].forEach((sgn) => {
    const pid = `strekker-${sgn > 0 ? 'h' : 'v'}`
    const shape = new THREE.Shape()
    shape.moveTo(pts[0][0], pts[0][1])
    for (let i = 1; i < pts.length; i++) shape.lineTo(pts[i][0], pts[i][1])
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: STRETCH_T, bevelEnabled: false })
    g.rotateY(-Math.PI / 2) // profil i z-y, ekstrudert langs x (tykkelse)
    g.translate(sgn > 0 ? wx + STRETCH_T : -wx, 0, 0) // utenpå siden
    const mat = meshMat(pid, 0.85)
    mat.side = THREE.DoubleSide
    const m = new THREE.Mesh(g, mat)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'tak'
    m.userData.pid = pid
    m.userData.info = { navn: 'Sidestrekker', profil: frameProfil, lengdeCm: Math.round((run / cosR) * 100) }
    m.userData.explode = new THREE.Vector3(sgn * 0.4, 0.2, 0)
    group.add(m)
  })

  // ── Tverrbord mellom strekkerne (avstivning for taket) ───────────
  // 15 cm fra front og 15 cm fra bak, liggende i takflaten (samme vinkel som
  // strekkerne). Stikker 5 cm ut på hver side. Halvt-i-halvt mot strekkerne.
  const sinR = Math.sin(roofRad)
  const CROSS_T = LEKT_T // 23 mm tykk (langs fallet)
  const CROSS_W = LEKT_W // 48 mm høyde (på høykant, vinkelrett på takflaten – som strekkerne)
  const crossOut = 0.05 // 5 cm utstikk hver side
  const crossLen = 2 * (wx + STRETCH_T + crossOut)
  ;[
    { z: zFront - 0.15, tag: 'front' },
    { z: zBack + 0.15, tag: 'bak' },
  ].forEach(({ z, tag }) => {
    const yc = roofTop(z)
    const pid = `tverrbord-${tag}`
    const cb = new THREE.Mesh(new THREE.BoxGeometry(crossLen, CROSS_W, CROSS_T), meshMat(pid, 0.8))
    cb.rotation.x = roofRad // på høykant i takflaten (vinkelrett på fallet)
    cb.position.set(0, yc - (CROSS_W / 2) * cosR, z - (CROSS_W / 2) * sinR) // overkant i flukt med takflaten
    cb.castShadow = true
    cb.receiveShadow = true
    cb.userData.part = 'tak'
    cb.userData.pid = pid
    cb.userData.info = { navn: 'Tverrbord (tak)', profil: frameProfil, lengdeCm: Math.round(crossLen * 100) }
    cb.userData.explode = new THREE.Vector3(0, 0.3, 0)
    group.add(cb)
  })

  // ── Tak ──────────────────────────────────────────────────────────
  // Ligger på strekkerne i takflaten. Front/bak kappes loddrett i flukt med
  // strekker-endene (zFront/zBack); sidene går ut til endene av tverrbordene.
  // Bordene går langs fallet (front→bak) og flislegges på tvers (x). Tre typer:
  // over/underligger, faspanel eller takpapp.
  const roofW = crossLen
  const roofX0 = -roofW / 2
  const roofBoard = (xc: number, width: number, yOff: number, thick: number, pid: string, darken: number, mat?: THREE.Material) => {
    const shape = new THREE.Shape()
    shape.moveTo(zFront, roofTop(zFront) + yOff)
    shape.lineTo(zBack, roofTop(zBack) + yOff)
    shape.lineTo(zBack, roofTop(zBack) + yOff + thick)
    shape.lineTo(zFront, roofTop(zFront) + yOff + thick)
    shape.closePath()
    const g = new THREE.ExtrudeGeometry(shape, { depth: width, bevelEnabled: false })
    g.rotateY(-Math.PI / 2) // profil i z-y, ekstrudert langs x (bordbredde)
    g.translate(xc + width / 2, 0, 0)
    // Bytt om UV slik at åringen løper langs bordet (fallet), ikke på tvers.
    const uv = g.attributes.uv
    if (uv) {
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i), uv.getX(i))
      uv.needsUpdate = true
    }
    const material = mat ?? meshMat(pid, darken)
    if (!mat) material.side = THREE.DoubleSide
    const m = new THREE.Mesh(g, material)
    m.castShadow = true
    m.receiveShadow = true
    m.userData.part = 'tak'
    m.userData.pid = pid
    m.userData.info = { navn: 'Tak', profil: takProfil, lengdeCm: Math.round((run / cosR) * 100) }
    m.userData.explode = new THREE.Vector3(0, 0.5, 0)
    group.add(m)
  }
  if (c.taktype === 'takpapp') {
    roofBoard(0, roofW, 0, LEKT_T, 'tak-underlag', 0.95) // tett underlag
    const papp = new THREE.MeshStandardMaterial({ color: 0x2b2b2b, roughness: 0.95, metalness: 0.02, side: THREE.DoubleSide })
    roofBoard(0, roofW, LEKT_T, 0.004, 'tak-papp', 1, papp)
  } else if (c.taktype === 'faspanel') {
    const spor = 0.005 // liten V-fals mellom bordene
    const n = Math.max(1, Math.round(roofW / 0.1))
    const aw = (roofW - spor * (n - 1)) / n
    for (let i = 0; i < n; i++) {
      roofBoard(roofX0 + aw / 2 + i * (aw + spor), aw, 0, 0.017, `tak-fas-${i}`, 1)
    }
  } else {
    // Over/underligger: dekker hele bredden. Underligger i begge kanter (starter
    // og slutter likt), jevn glipe; overligger sentrert over hver glipe og dekker
    // den med overlapp. Antall/senteravstand tilpasses så bredden går opp.
    const th = LEKT_T
    const target = 0.098 // ønsket bordbredde
    const nU = Math.max(2, Math.round((roofW + target) / (2 * target)))
    const P = (roofW - target) / (nU - 1) // senteravstand – kantbord flukter med kantene
    const ow = P - 0.2 * target // overligger dekker glipa med overlapp
    for (let i = 0; i < nU; i++) {
      roofBoard(roofX0 + target / 2 + i * P, target, 0, th, `tak-under-${i}`, 0.82)
    }
    for (let i = 0; i < nU - 1; i++) {
      roofBoard(roofX0 + target / 2 + P / 2 + i * P, ow, th, th, `tak-over-${i}`, 1)
    }
  }

  return group
}

export const varmepumpehus: ProductTemplate<VarmepumpehusConfig> = {
  id: 'varmepumpehus',
  navn: 'Varmepumpehus',
  ikon: 'faFan',
  beskrivelse: 'Tegn varmepumpekassen i 3D – skrå spjeld som slipper ut varmluft men skygger for regn. Velg størrelse, takvinkel og taktype.',
  bilde: '/images/products/varmepumpehus-3d.webp',
  tilgjengelig: true,
  fraPris: 199,
  defaultConfig: {
    kvalitet: 'standard',
    bredde: 90,
    hoyde: 60,
    dybde: 50,
    takvinkel: 22.5,
    spileGap: 4,
    taktype: 'faspanel',
    treslag: 'impregnert',
    farge: 'ubehandlet',
  },
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 70, max: 200, step: 5, axis: 'x' },
    { key: 'hoyde', label: 'Høyde (front)', min: 50, max: 200, step: 5, axis: 'y' },
    { key: 'dybde', label: 'Dybde', min: 40, max: 150, step: 5, axis: 'z' },
    { key: 'takvinkel', label: 'Takvinkel', min: 0, max: 45, step: 0.5, unit: '°', axis: 'y', handle: false },
    { key: 'spileGap', label: 'Spalte spjeld', min: 2, max: 10, step: 0.5, unit: 'cm', axis: 'y', handle: false },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'kvalitet',
      label: 'Kvalitet',
      choices: [
        { id: 'standard', label: 'Standard', note: 'Ramme i 23×48 lekt.' },
        { id: 'forsterket', label: 'Forsterket', note: 'Kraftigere 36×48 ramme (strekkere, tverrbord, diagonal og såle).' },
      ],
    },
    {
      key: 'taktype',
      label: 'Taktype',
      choices: [
        { id: 'overunder', label: 'Over/underligger' },
        { id: 'faspanel', label: 'Faspanel' },
        { id: 'takpapp', label: 'Takpapp' },
      ],
    },
  ],
  parts: [
    { key: 'spiler', label: 'Spjeld' },
    { key: 'ramme', label: 'Hjørnebein' },
    { key: 'stiver', label: 'Stivere' },
    { key: 'tak', label: 'Tak' },
    { key: 'bakvegg', label: 'Bakpanel' },
  ],
  beregn,
  kappliste,
  tegning2D,
  raad: (c) => [
    'Kløyv lektene på skrå i 45° på sirkelsag med skråstilt blad – hver 23×48 gir to spjeldblad.',
    'Sørg for god luftspalte rundt varmepumpa – de skrå spjeldene gir ventilasjon, men hold minst 10–15 cm klaring til viften.',
    'Bruk rustfrie (A4/syrefaste) skruer utendørs, og forbor i endene så spjeldene ikke sprekker.',
    'Monter spjeldene skrånende nedover-ut med ~4 cm luft imellom, så regn renner av mens lufta slipper gjennom.',
    'Lim og skru hjørnebeina (to lekter flate-mot-flate) for stive hjørner. Bruk vinkelbeslag der bein møter sålen om du vil ha ekstra styrke.',
    c.takvinkel < 8
      ? 'Lav takvinkel: bruk takpapp for å hindre at vann blir stående.'
      : 'Takvinkelen gir god avrenning – utstikket foran gjør at vannet drypper klar av spjeldene.',
    'La impregnert virke tørke noen uker før du eventuelt beiser eller maler.',
  ],
  buildMesh,
  bounds: (c) => {
    const vinkel = (c.takvinkel * Math.PI) / 180
    // Høyest bak: fronthøyde + fall over hele dybden (+ bak-bein) opp til takflaten.
    const backTop = LEG_LIFT + cm(c.hoyde) + (cm(c.dybde) + LEKT_W) * Math.tan(vinkel)
    return {
      x: cm(c.bredde) + 0.12,
      y: backTop + 0.06,
      z: cm(c.dybde) + 0.2, // utstikk foran + bak-bein
    }
  },
  montering: () => [
    'Kapp alle materialene etter kapplista. VINKELKAPP: kløyv spjeld-lektene på skrå i 45° (2 spiler pr. lekt), og skråkapp toppen av hjørnebeina i takvinkelen.',
    'Bygg de fire hjørnebeina av to 23×48 limt flate-mot-flate, forskjøvet 23 mm så det står fram en skulder. Bak-beina har dobbelt indre bord (2 × 23×48 limt).',
    'Legg sålen (23×48 flatt) i U-form – venstre, front og høyre. De to fronthjørnene skjøtes med 45° gjæring.',
    'Reis hjørnebeina på sålen (løftet 23 mm). Front lavere enn bak, slik at takflaten får fall framover i valgt takvinkel.',
    'Skru de skrå spjeldene på front og de to sidene med valgt luftspalte (skråflaten opp-og-ut). Sidespjeldene skråkappes etter takfallet. Sett en vertikal stiver (11×36) bak spjeldene for hver påbegynte 60 cm.',
    'Fest diagonalstiveren (23×48) på innsiden av sidespjeldene, fra bunn bak opp til front i 45°. Endene kappes loddrett (45°-snitt) så de flukter langs beina.',
    'Monter sidestrekkerne utenpå sidene i takvinkelen (begge ender kappes loddrett; bakenden flukter med bak-beinet). Legg tverrbordene på høykant mellom strekkerne, halvt-i-halvt, 15 cm fra front og bak.',
    'Legg taket (over/underligger, faspanel eller takpapp) på strekkerne. Front- og bakkant kappes loddrett i flukt med strekker-endene; sidene går ut til endene av tverrbordene.',
    'Veggmontering: forbor Ø6 mm hull i bak-beinas ytre lekt (i glipene mellom spjeldene, ett øvre og ett nedre pr. bein) og fest huset til veggen med 6×80 treskruer i solide fester/plugger.',
    'Sett huset på plass over varmepumpa med god klaring til vifte og rør, og fest det stødig.',
  ],
}
