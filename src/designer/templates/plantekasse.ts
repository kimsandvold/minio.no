import * as THREE from 'three'
import type { Bom, BomLine, BuildOptions, DesignConfig, KapplisteDel, ProductTemplate, Tegning2D } from '../types'
import { TRESLAG, resolveColor, treslagValg, fargeValg } from '../materials'
import { prisFor } from '../priser'

/**
 * Plantekasse – parametrisk template med full funksjonspari med den gamle
 * konfiguratoren: fire former (kvadrat, rektangel, ut-/innvendig hjørne),
 * fritt mål, valgbar stolpedimensjon, ben under bunnen, topplist med utheng,
 * treslag + farge, bunn og espalier. Geometrien er portet fra den opprinnelige
 * Plantekasse/ThreeVisualizer og tilpasset motorens kontrakt.
 */

export type PlantekasseShape = 'square' | 'rect' | 'outside-corner' | 'inside-corner'

export interface PlantekasseConfig {
  shape: PlantekasseShape
  bredde: number // cm (x)
  dybde: number // cm (z)
  hoyde: number // cm (y) – kassehøyde
  arm: number // cm – armbredde for L-former (godstykkelse)
  ben: number // cm – hvor langt beina stikker ned under bunnen
  bordDim: string // hovedkonstruksjon, f.eks. '28x120'
  hjorne: string // 'kapp' (terrassebord-hjørne utvendig) | 'stolpe' (innvendig)
  stolpeDim: string // brukes når hjorne = 'stolpe'
  treslag: string
  farge: string
  bunn: boolean
  topplist: boolean
  topplistOverheng: number // cm – hvor mye topplisten stikker ut
  espalier: boolean
  [key: string]: DesignConfig[string]
}

// Materialdimensjoner (mm/m).
const SVINN = 1.1 // alltid 10 % kapp/svinn i innkjøpsmengder
const PLANK_GAP_M = 0.003

// Hovedkonstruksjon – kledningsbord (terrassebord) å velge mellom.
const BORD_DIMS: Record<string, { label: string; t: number; h: number }> = {
  '21x98': { label: '21 × 98 mm', t: 21, h: 98 },
  '28x120': { label: '28 × 120 mm', t: 28, h: 120 },
}
const bord = (c: PlantekasseConfig) => BORD_DIMS[c.bordDim] ?? BORD_DIMS['28x120']


// Stolpedimensjoner for «stolpe innvendig»-varianten. Tallet foran = tykkelse (mm).
const STOLPE_DIMS: Record<string, { label: string; mm: number }> = {
  '48x48': { label: '48 × 48 mm', mm: 48 },
  '68x68': { label: '68 × 68 mm', mm: 68 },
  '98x98': { label: '98 × 98 mm', mm: 98 },
}

const cm = (v: number) => v / 100

type Vec2 = [number, number]

function rader(hoyde: number, bordHmm: number): number {
  const totalCm = bordHmm / 10 + 0.3 // bordhøyde + spalte
  return Math.max(1, Math.floor(hoyde / totalCm))
}

/** Polygonhjørner for valgt form. scale=1 gir cm, scale=0.01 gir meter. */
function shapeVertices(c: PlantekasseConfig, scale: number): Vec2[] {
  if (c.shape === 'outside-corner' || c.shape === 'inside-corner') {
    const w = c.bredde * scale
    const d = c.dybde * scale
    const t = Math.min(c.arm, Math.min(c.bredde, c.dybde) - 10) * scale
    return [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, -d / 2 + t],
      [-w / 2 + t, -d / 2 + t],
      [-w / 2 + t, d / 2],
      [-w / 2, d / 2],
    ]
  }
  const w = c.bredde * scale
  const d = (c.shape === 'square' ? c.bredde : c.dybde) * scale
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ]
}

function offsetPolygon(verts: Vec2[], off: number): Vec2[] {
  const n = verts.length
  return verts.map((vert, i) => {
    const prev = verts[(i - 1 + n) % n]
    const next = verts[(i + 1) % n]
    const pdx = vert[0] - prev[0], pdz = vert[1] - prev[1]
    const ndx = next[0] - vert[0], ndz = next[1] - vert[1]
    const pl = Math.hypot(pdx, pdz) || 1
    const nl = Math.hypot(ndx, ndz) || 1
    return [
      vert[0] + off * (pdz / pl + ndz / nl),
      vert[1] + off * (-pdx / pl + -ndx / nl),
    ] as Vec2
  })
}

function edgeLenSum(verts: Vec2[]): number {
  let sum = 0
  for (let i = 0; i < verts.length; i++) {
    const a = verts[i], b = verts[(i + 1) % verts.length]
    sum += Math.hypot(b[0] - a[0], b[1] - a[1])
  }
  return sum
}

function buildExtrude(verts: Vec2[], hole: Vec2[] | null, depth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(verts[0][0], verts[0][1])
  for (let i = 1; i < verts.length; i++) shape.lineTo(verts[i][0], verts[i][1])
  shape.closePath()
  if (hole) {
    const rev = [...hole].reverse()
    const path = new THREE.Path()
    path.moveTo(rev[0][0], rev[0][1])
    for (let i = 1; i < rev.length; i++) path.lineTo(rev[i][0], rev[i][1])
    path.closePath()
    shape.holes.push(path)
  }
  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geom.rotateX(Math.PI / 2)
  return geom
}

function addEdgeWall(
  g: THREE.Group,
  from: Vec2,
  to: Vec2,
  rows: number,
  plankH: number,
  plankT: number,
  endInset: number,
  prefix: string,
  makeMat: (pid: string) => THREE.Material,
  info: { navn: string; profil: string; lengdeCm: number },
) {
  const dx = to[0] - from[0], dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  const plankLen = len - endInset * 2 + 0.004
  if (plankLen <= 0) return
  const dirX = dx / len, dirZ = dz / len
  const inX = -dirZ, inZ = dirX
  const wall = new THREE.Group()
  wall.position.set((from[0] + to[0]) / 2 + inX * (plankT / 2), 0, (from[1] + to[1]) / 2 + inZ * (plankT / 2))
  wall.rotation.y = -Math.atan2(dirZ, dirX)
  wall.userData.info = info
  // Splittvisning: veggen skyves utover (bort fra innsiden).
  wall.userData.explode = new THREE.Vector3(-inX, 0, -inZ).normalize().multiplyScalar(0.28)
  for (let i = 0; i < rows; i++) {
    const pid = `${prefix}-${i}`
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(plankLen, plankH, plankT), makeMat(pid))
    mesh.position.y = plankH / 2 + i * (plankH + PLANK_GAP_M)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData.part = 'kledning'
    mesh.userData.pid = pid
    wall.add(mesh)
  }
  g.add(wall)
}

function beregn(c: PlantekasseConfig): Bom {
  const faktor = TRESLAG[c.treslag]?.prisFaktor ?? 1
  const b = bord(c)
  const antRader = rader(c.hoyde, b.h)
  const vertsCm = shapeVertices(c, 1)
  const antHjorner = vertsCm.length
  const perimeterCm = edgeLenSum(vertsCm)
  const kapp = c.hjorne !== 'stolpe' // terrassebord-hjørne (utvendig) er standard

  const bordLm = (perimeterCm / 100) * antRader * SVINN
  const benLengde = c.hoyde + c.ben
  // Terrassebord-hjørne = 2 bord per hjørne; stolpe = 1 stolpe per hjørne.
  const hjorneBord = kapp ? antHjorner * 2 : 0
  const hjorneBordLm = (hjorneBord * benLengde) / 100 * SVINN
  const stolpeAnt = kapp ? 0 : antHjorner
  const stolpeLm = (stolpeAnt * benLengde) / 100 * SVINN

  const bunnBord = c.bunn ? Math.ceil(c.bredde / (b.h / 10)) : 0
  const bunnLm = c.bunn ? (bunnBord * c.dybde) / 100 * SVINN : 0
  const topplistLm = c.topplist ? (perimeterCm / 100) * SVINN : 0
  const espLm = c.espalier ? (5 * 1.0 + 4 * (c.bredde / 100)) * SVINN : 0

  const skruer = antRader * antHjorner * 2 + bunnBord * 4 + (c.topplist ? antHjorner * 4 : 0) + (c.espalier ? 40 : 0)

  const bordPris = prisFor(`bord-${c.bordDim}`)
  const stolpePris = prisFor(`stolpe-${c.stolpeDim}`)
  const espPris = prisFor('espalier-28x48')
  const skruePris = prisFor('skrue')
  const estimatKr = Math.round(
    ((bordLm + bunnLm + topplistLm + hjorneBordLm) * bordPris * faktor +
      stolpeLm * stolpePris * faktor +
      espLm * espPris * faktor +
      skruer * skruePris) / 10,
  ) * 10

  const stolpeSpec = STOLPE_DIMS[c.stolpeDim]?.label ?? c.stolpeDim
  const bordSpec = `${b.t}×${b.h} mm`
  const benKomm = c.ben > 0 ? `${benLengde} cm (inkl. ${c.ben} cm ben)` : `${benLengde} cm`
  const linjer: BomLine[] = [
    { navn: 'Kledningsbord', spesifikasjon: bordSpec, antall: Math.round(bordLm * 10) / 10, enhet: 'lm', kommentar: `${antRader} rader rundt` },
  ]
  if (kapp) {
    linjer.push({ navn: 'Hjørnebord (terrassebord)', spesifikasjon: bordSpec, antall: Math.round(hjorneBordLm * 10) / 10, enhet: 'lm', kommentar: `${hjorneBord} bord, 90° hjørne · ${benKomm}` })
  } else {
    linjer.push({ navn: 'Hjørnestolper', spesifikasjon: stolpeSpec, antall: stolpeAnt, enhet: 'stk', kommentar: benKomm })
  }
  if (c.bunn) linjer.push({ navn: 'Bunnbord', spesifikasjon: bordSpec, antall: Math.round(bunnLm * 10) / 10, enhet: 'lm', kommentar: `${bunnBord} bord med dreneringsspalter` })
  if (c.topplist) linjer.push({ navn: 'Topplist / kantbord', spesifikasjon: bordSpec, antall: Math.round(topplistLm * 10) / 10, enhet: 'lm', kommentar: `${c.topplistOverheng} cm utheng` })
  if (c.espalier) linjer.push({ navn: 'Espalierspiler', spesifikasjon: '28×48 mm', antall: Math.round(espLm * 10) / 10, enhet: 'lm' })
  linjer.push({ navn: 'Skruer', spesifikasjon: 'rustfri A4', antall: skruer, enhet: 'stk' })
  linjer.push({ navn: 'Fiberduk', antall: 1, enhet: 'rull', kommentar: 'valgfritt' })

  const formNavn: Record<PlantekasseShape, string> = { square: 'kvadratisk', rect: 'rektangulær', 'outside-corner': 'utvendig hjørne', 'inside-corner': 'innvendig hjørne' }
  const malStr = c.shape === 'square' ? `${c.bredde}×${c.bredde}` : `${c.bredde}×${c.dybde}`
  const sammendrag = `${formNavn[c.shape]} · ${malStr}×${c.hoyde} cm · ${TRESLAG[c.treslag]?.label ?? c.treslag}`
  const dybdeEff = c.shape === 'square' ? c.bredde : c.dybde

  return { linjer, estimatKr, sammendrag, arealM2: (c.bredde * dybdeEff) / 10000, maal: `${malStr}×${c.hoyde} cm` }
}

function kappliste(c: PlantekasseConfig): KapplisteDel[] {
  const b = bord(c)
  const bordSpec = `${b.t}×${b.h} mm`
  const stolpeSpec = STOLPE_DIMS[c.stolpeDim]?.label ?? c.stolpeDim
  const kapp = c.hjorne !== 'stolpe'
  const rows = rader(c.hoyde, b.h)
  const verts = shapeVertices(c, 1)
  const N = verts.length

  const map = new Map<string, KapplisteDel>()
  const add = (navn: string, profil: string, lengdeCm: number, antall: number) => {
    const L = Math.round(lengdeCm)
    const key = `${navn}|${profil}|${L}`
    const ex = map.get(key)
    if (ex) ex.antall += antall
    else map.set(key, { navn, profil, lengdeCm: L, antall })
  }

  // Kledningsbord – én kapp per kant (bordene møtes i hjørnet), i hver rad.
  const bordT = b.t / 10 // cm
  for (let i = 0; i < N; i++) {
    const a = verts[i]
    const d = verts[(i + 1) % N]
    const len = Math.hypot(d[0] - a[0], d[1] - a[1])
    // annenhver kant kappes for buttskjøt i hjørnet
    add('Kledningsbord', bordSpec, Math.max(10, len - (i % 2 ? 2 * bordT : 0)), rows)
  }
  // Hjørne: terrassebord-kapp (2 per hjørne) eller innvendig stolpe (1 per hjørne).
  if (kapp) add('Hjørnebord (terrassebord)', bordSpec, c.hoyde + c.ben, N * 2)
  else add('Hjørnestolpe', stolpeSpec, c.hoyde + c.ben, N)
  // Bunnbord.
  if (c.bunn) {
    const bunnBord = Math.ceil(c.bredde / (b.h / 10))
    const span = (c.shape === 'square' ? c.bredde : c.dybde) - 2 * (b.t / 10)
    add('Bunnbord', bordSpec, Math.max(10, span), bunnBord)
  }
  // Topplist – per kant, med utheng i begge ender.
  if (c.topplist) {
    for (let i = 0; i < N; i++) {
      const a = verts[i]
      const d = verts[(i + 1) % N]
      const len = Math.hypot(d[0] - a[0], d[1] - a[1])
      add('Topplist', bordSpec, len + 2 * c.topplistOverheng, 1)
    }
  }
  // Espalier.
  if (c.espalier) {
    add('Espalier – loddrett spile', '28×48 mm', 100, 5)
    add('Espalier – vannrett spile', '28×48 mm', c.bredde, 5)
  }
  return [...map.values()]
}

function buildMesh(c: PlantekasseConfig, opts?: BuildOptions): THREE.Group {
  const group = new THREE.Group()
  const body = new THREE.Group()
  group.add(body)

  // Per-bord-materialer med valgfri overstyring (paint bucket, per mesh-id) + trestruktur.
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
  const b = bord(c)
  const plankT = b.t / 1000
  const bordW = b.h / 1000 // terrassebord-bredde (til hjørnekapp)
  const kapp = c.hjorne !== 'stolpe'
  const h = cm(c.hoyde)
  const benM = cm(c.ben)
  const postSize = (STOLPE_DIMS[c.stolpeDim]?.mm ?? 48) / 1000
  const verts = shapeVertices(c, scale)
  const rows = rader(c.hoyde, b.h)
  const plankH = (h - PLANK_GAP_M * (rows - 1)) / rows

  // Vegger – annenhver kant kappes så bordene møtes i buttskjøt i hjørnet.
  const bordSpec = `${b.t}×${b.h} mm`
  for (let i = 0; i < verts.length; i++) {
    const endInset = i % 2 ? plankT : 0
    const a2 = verts[i]
    const d2 = verts[(i + 1) % verts.length]
    const lenCm = Math.hypot(d2[0] - a2[0], d2[1] - a2[1]) * 100
    const cutCm = Math.round(Math.max(10, lenCm - (i % 2 ? 2 * (b.t / 10) : 0)))
    addEdgeWall(body, a2, d2, rows, plankH, plankT, endInset, `kledning-${i}`, (pid) => meshMat(pid), {
      navn: 'Kledningsbord', profil: bordSpec, lengdeCm: cutCm,
    })
  }

  // Fiberduk / ugressduk – kler innsiden av veggene ned til bunnen + dekker gulvet.
  const inner = offsetPolygon(verts, -(plankT + 0.005))
  const dukInner = offsetPolygon(verts, -(plankT + 0.012))
  const dukMat = new THREE.MeshStandardMaterial({ color: 0x3b3a36, roughness: 1, metalness: 0, side: THREE.DoubleSide })
  const gulvY = c.bunn ? plankT : 0.004
  // Vegg-kledning (tynn ring fra gulv til topp).
  const dukVegg = buildExtrude(inner, dukInner, h - gulvY)
  dukVegg.translate(0, h, 0) // ekstruderer nedover fra topp
  const dukWall = new THREE.Mesh(dukVegg, dukMat)
  dukWall.userData.explode = new THREE.Vector3(0, 0.45, 0)
  body.add(dukWall)
  // Duk på gulvet.
  const dukGulvGeom = buildExtrude(dukInner, null, 0.004)
  dukGulvGeom.translate(0, gulvY + 0.006, 0)
  const dukGulv = new THREE.Mesh(dukGulvGeom, dukMat)
  dukGulv.userData.explode = new THREE.Vector3(0, -0.28, 0)
  body.add(dukGulv)

  // Bunn.
  if (c.bunn) {
    const bunnGeom = buildExtrude(inner, null, plankT)
    bunnGeom.translate(0, plankT, 0)
    const bunn = new THREE.Mesh(bunnGeom, meshMat('bunn-0', 0.9))
    bunn.castShadow = true
    bunn.userData.part = 'bunn'
    bunn.userData.pid = 'bunn-0'
    bunn.userData.info = { navn: 'Bunnbord', profil: bordSpec, lengdeCm: Math.round(Math.max(10, (c.shape === 'square' ? c.bredde : c.dybde) - 2 * (b.t / 10))) }
    bunn.userData.explode = new THREE.Vector3(0, -0.3, 0)
    body.add(bunn)
  }

  // Topplist med utheng, gjæret (45°) i hjørnene.
  if (c.topplist) {
    const overheng = cm(c.topplistOverheng)
    const rimWidth = b.h / 1000
    const outer = offsetPolygon(verts, overheng)
    const innerRim = offsetPolygon(verts, -(rimWidth - overheng))
    const topY = h + plankT
    const explodeUp = new THREE.Vector3(0, 0.4, 0)
    const N = verts.length
    // Én gjæret bordbit per kant: plan = [ytre_i, ytre_i+1, indre_i+1, indre_i].
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N
      const quad: Vec2[] = [outer[i], outer[j], innerRim[j], innerRim[i]]
      const boardGeom = buildExtrude(quad, null, plankT)
      boardGeom.translate(0, topY, 0)
      const edgeLenCm = Math.hypot(verts[j][0] - verts[i][0], verts[j][1] - verts[i][1]) * 100
      const board = new THREE.Mesh(boardGeom, meshMat(`topplist-${i}`))
      board.castShadow = true
      board.receiveShadow = true
      board.userData.part = 'topplist'
      board.userData.pid = `topplist-${i}`
      board.userData.info = { navn: 'Topplist', profil: bordSpec, lengdeCm: Math.round(edgeLenCm + 2 * c.topplistOverheng) }
      board.userData.explode = explodeUp
      body.add(board)
    }
    // Gjærings-skjøtlinjer (45°) fra ytre til indre hjørne.
    const seamPts: number[] = []
    for (let i = 0; i < N; i++) {
      seamPts.push(outer[i][0], topY + 0.0015, outer[i][1])
      seamPts.push(innerRim[i][0], topY + 0.0015, innerRim[i][1])
    }
    const seamGeom = new THREE.BufferGeometry()
    seamGeom.setAttribute('position', new THREE.Float32BufferAttribute(seamPts, 3))
    const seams = new THREE.LineSegments(seamGeom, new THREE.LineBasicMaterial({ color: 0x5a4630 }))
    seams.userData.explode = explodeUp
    seams.raycast = () => {} // ikke treff skjøtlinjene ved klikk/maling
    body.add(seams)
  }

  // Espalier på bakre kant(er).
  if (c.espalier) {
    let espN = 0
    const addEsp = (from: Vec2, to: Vec2) => {
      const pid = `espalier-${espN++}`
      const dx = to[0] - from[0], dz = to[1] - from[1]
      const len = Math.hypot(dx, dz)
      if (len <= 0) return
      const dirX = dx / len, dirZ = dz / len
      const outX = dirZ, outZ = -dirX
      const espH = 1.0
      const t = new THREE.Group()
      t.position.set((from[0] + to[0]) / 2 + outX * 0.005, 0, (from[1] + to[1]) / 2 + outZ * 0.005)
      t.rotation.y = -Math.atan2(dirZ, dirX)
      const espMat = meshMat(pid, 0.85)
      const nV = Math.max(2, Math.round((len - 0.06) / 0.15) + 1)
      for (let i = 0; i < nV; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(0.022, espH, 0.018), espMat)
        m.position.set(-len / 2 + 0.03 + i * ((len - 0.06) / (nV - 1)), h + espH / 2, 0)
        m.castShadow = true
        m.userData.part = 'espalier'
        m.userData.pid = pid
        t.add(m)
      }
      for (let j = 0; j < 5; j++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(len - 0.06, 0.02, 0.018), espMat)
        m.position.set(0, h + 0.04 + j * ((espH - 0.08) / 4), 0.018)
        m.castShadow = true
        m.userData.part = 'espalier'
        m.userData.pid = pid
        t.add(m)
      }
      t.userData.explode = new THREE.Vector3(0, 0.5, 0)
      group.add(t) // espalier følger med i rotasjonen; legges i outer group, men på body-nivå
      t.position.y += benM
    }
    if (c.shape === 'outside-corner') { addEsp(verts[2], verts[3]); addEsp(verts[3], verts[4]) }
    else if (c.shape === 'inside-corner') { addEsp(verts[5], verts[0]); addEsp(verts[0], verts[1]) }
    else addEsp(verts[0], verts[1])
  }

  // Løft kroppen opp med ben-høyden.
  body.position.y = benM

  // Hjørner – fra bakken opp til toppen (inkl. ben).
  const postH = benM + h
  if (kapp) {
    // Terrassebord-hjørne: to bord per hjørne, på utsiden, som en 90°-kapp.
    let legIdx = 0
    const addCap = (v: Vec2, along: [number, number], n: [number, number]) => {
      // Forleng bordet plankT forbi hjørnet så de to bordene overlapper (laper over hverandre).
      const capLen = bordW + plankT
      const off = (bordW - plankT) / 2
      const cx = v[0] + along[0] * off + n[0] * (plankT / 2)
      const cz = v[1] + along[1] * off + n[1] * (plankT / 2)
      const pid = `stolpe-${legIdx++}`
      const cap = new THREE.Mesh(new THREE.BoxGeometry(capLen, postH, plankT), meshMat(pid))
      cap.position.set(cx, postH / 2, cz)
      cap.rotation.y = -Math.atan2(along[1], along[0])
      cap.castShadow = true
      cap.receiveShadow = true
      cap.userData.part = 'stolpe'
      cap.userData.pid = pid
      cap.userData.info = { navn: 'Hjørnebord (terrassebord)', profil: bordSpec, lengdeCm: c.hoyde + c.ben }
      // Splittvisning: kappene skyves lenger ut enn veggene (0.28) + litt ned, så de havner utenfor.
      cap.userData.explode = new THREE.Vector3(n[0] * 0.5, -0.3, n[1] * 0.5)
      group.add(cap)
    }
    for (let i = 0; i < verts.length; i++) {
      const a = verts[i]
      const bb = verts[(i + 1) % verts.length]
      const dx = bb[0] - a[0], dz = bb[1] - a[1]
      const len = Math.hypot(dx, dz) || 1
      const dir: [number, number] = [dx / len, dz / len]
      const n: [number, number] = [dz / len, -dx / len] // utover
      addCap(a, dir, n) // ved kant-start
      addCap(bb, [-dir[0], -dir[1]], n) // ved kant-slutt
    }
  } else {
    // Innvendig stolpe: firkantstolpe på innsiden i hvert hjørne.
    const insetPosts = offsetPolygon(verts, -(plankT + postSize / 2))
    insetPosts.forEach(([x, z], idx) => {
      const pid = `stolpe-${idx}`
      const post = new THREE.Mesh(new THREE.BoxGeometry(postSize, postH, postSize), meshMat(pid, 0.85))
      post.position.set(x, postH / 2, z)
      post.castShadow = true
      post.receiveShadow = true
      post.userData.part = 'stolpe'
      post.userData.pid = pid
      post.userData.info = { navn: 'Hjørnestolpe', profil: STOLPE_DIMS[c.stolpeDim]?.label ?? c.stolpeDim, lengdeCm: c.hoyde + c.ben }
      post.userData.explode = new THREE.Vector3(x, 0, z).normalize().multiplyScalar(0.2).setY(-0.12)
      group.add(post)
    })
  }

  group.rotation.y = c.shape === 'outside-corner' ? Math.PI : 0
  return group
}

// ── Målsatt 2D-tegning (plan + oppriss) ────────────────────────────
function tegning2D(c: PlantekasseConfig): Tegning2D {
  const W = c.bredde
  const D = c.shape === 'square' ? c.bredde : c.dybde
  const box = c.hoyde
  const ben = Math.max(0, c.ben)
  const H = box + ben
  const legW = 10
  const ov = c.topplist ? c.topplistOverheng : 0

  const oppriss = (bredde: number, navn: string, id: string): Tegning2D['riss'][number] => ({
    id,
    navn,
    bredde,
    hoyde: H,
    former: [
      { type: 'rect', x: 0, y: 0, w: bredde, h: box },
      ...(ov > 0 ? [{ type: 'rect' as const, x: -ov, y: -5, w: bredde + 2 * ov, h: 5 }] : []),
      ...(ben > 0
        ? [
            { type: 'rect' as const, x: 6, y: box, w: legW, h: ben },
            { type: 'rect' as const, x: bredde - 6 - legW, y: box, w: legW, h: ben },
          ]
        : []),
    ],
    maal: [
      { x1: 0, y1: H, x2: bredde, y2: H, label: `${bredde} cm`, offset: 26 },
      { x1: 0, y1: 0, x2: 0, y2: box, label: `${box} cm`, offset: 24 },
      ...(ben > 0 ? [{ x1: bredde, y1: box, x2: bredde, y2: H, label: `${ben} cm`, offset: 22 }] : []),
    ],
  })

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

export const plantekasse: ProductTemplate<PlantekasseConfig> = {
  id: 'plantekasse',
  navn: 'Plantekasse',
  ikon: 'faSeedling',
  beskrivelse: 'Tegn plantekassen i 3D – fire former, med eller uten ben, topplist og espalier. Velg treslag og farge.',
  bilde: '/images/designer/plantekasse-3d.webp',
  tilgjengelig: true,
  gratis: true,
  fraPris: 199,
  defaultConfig: {
    shape: 'rect',
    bredde: 80,
    dybde: 40,
    hoyde: 40,
    arm: 40,
    ben: 0,
    bordDim: '28x120',
    hjorne: 'kapp',
    stolpeDim: '48x48',
    treslag: 'impregnert',
    farge: 'ubehandlet',
    bunn: true,
    topplist: true,
    topplistOverheng: 3,
    espalier: false,
  },
  former: {
    key: 'shape',
    label: 'Form',
    choices: [
      { id: 'square', label: 'Kvadrat', ikon: 'square' },
      { id: 'rect', label: 'Rektangel', ikon: 'rect' },
      { id: 'outside-corner', label: 'Utvendig hjørne', ikon: 'outside-corner' },
      { id: 'inside-corner', label: 'Innvendig hjørne', ikon: 'inside-corner' },
    ],
  },
  dimensjoner: [
    { key: 'bredde', label: 'Bredde', min: 40, max: 240, step: 5, axis: 'x' },
    { key: 'dybde', label: 'Dybde', min: 30, max: 200, step: 5, axis: 'z', visibleWhen: (c) => c.shape !== 'square' },
    { key: 'hoyde', label: 'Høyde', min: 20, max: 110, step: 5, axis: 'y' },
    { key: 'arm', label: 'Armbredde', min: 25, max: 90, step: 5, axis: 'x', handle: false, visibleWhen: (c) => c.shape === 'outside-corner' || c.shape === 'inside-corner' },
    { key: 'ben', label: 'Ben under bunn', min: 0, max: 60, step: 2, axis: 'y', handle: false },
    { key: 'topplistOverheng', label: 'Topplist-utheng', min: 0, max: 12, step: 1, axis: 'x', handle: false, visibleWhen: (c) => Boolean(c.topplist) },
  ],
  materialer: [
    { key: 'treslag', label: 'Treslag', choices: treslagValg(['impregnert', 'gran', 'royal', 'lerk', 'kebony']) },
    { key: 'farge', label: 'Farge / beis', asSwatches: true, choices: fargeValg(['ubehandlet', 'klar', 'hvit', 'lysgra', 'morkegra', 'sort', 'brun', 'gronn']) },
  ],
  alternativer: [
    {
      key: 'bordDim',
      label: 'Kledningsbord (hovedkonstruksjon)',
      choices: Object.entries(BORD_DIMS).map(([id, v]) => ({ id, label: v.label })),
    },
    {
      key: 'hjorne',
      label: 'Hjørne / ben',
      choices: [
        { id: 'kapp', label: 'Terrassebord-hjørne (utvendig)' },
        { id: 'stolpe', label: 'Stolpe innvendig' },
      ],
    },
    {
      key: 'stolpeDim',
      label: 'Stolpe-dimensjon',
      visibleWhen: (c) => c.hjorne === 'stolpe',
      choices: Object.entries(STOLPE_DIMS).map(([id, v]) => ({ id, label: v.label })),
    },
  ],
  valg: [
    { key: 'bunn', label: 'Bunn med drenering', note: 'Anbefalt for jord og planting.' },
    { key: 'topplist', label: 'Topplist / kantbord', note: 'Ramme rundt toppen – juster utheng under Mål.' },
    { key: 'espalier', label: 'Espalier på baksiden', note: 'For klatreplanter.' },
  ],
  parts: [
    { key: 'kledning', label: 'Kledningsbord' },
    { key: 'stolpe', label: 'Hjørner / ben' },
    { key: 'topplist', label: 'Topplist' },
    { key: 'bunn', label: 'Bunn' },
    { key: 'espalier', label: 'Espalier' },
  ],
  beregn,
  kappliste,
  tegning2D,
  raad: (c) => {
    const kapp = c.hjorne !== 'stolpe'
    return [
      'Forbor alltid i endene av bordene (ca. 8–10 mm fra kanten) for å unngå at treet sprekker.',
      'Bruk rustfrie (A4/syrefaste) skruer utendørs – vanlige skruer ruster og gir stygge renner.',
      kapp
        ? 'Sett sammen to terrassebord til en 90°-kapp i hvert hjørne, og skru kledningsbordene fast utenfra i denne kappen.'
        : `Reis en innvendig stolpe (${STOLPE_DIMS[c.stolpeDim]?.label ?? c.stolpeDim}) i hvert hjørne, og la kledningsbordene møtes i buttskjøt utenpå.`,
      c.topplist ? 'Gjær topplisten i 45° i hjørnene og lim skjøtene med utendørs trelim før du skrur.' : 'Slip toppkanten lett så den er fin å ta på.',
      c.bunn ? 'La det være noen mm spalte mellom bunnbordene for drenering, og legg fiberduk innvendig før jord.' : 'Sett kassen på klosser eller heller for lufting under.',
      c.ben > 0 ? `Sørg for at kassen står i vater på beina (${c.ben} cm) før du fyller jord.` : 'Kontroller at kassen står i vater før fylling.',
      'Behandle treet med olje eller beis for lengre levetid – vent til impregnert virke er tørt (noen uker).',
    ]
  },
  buildMesh,
  bounds: (c) => ({
    x: cm(c.bredde) + (c.topplist ? cm(c.topplistOverheng) * 2 : 0),
    y: cm(c.ben) + cm(c.hoyde) + (c.espalier ? 1.0 : 0),
    z: cm(c.shape === 'square' ? c.bredde : c.dybde) + (c.topplist ? cm(c.topplistOverheng) * 2 : 0),
  }),
  montering: (c) => {
    const kapp = c.hjorne !== 'stolpe'
    const stolpeSpec = STOLPE_DIMS[c.stolpeDim]?.label ?? c.stolpeDim
    return [
      kapp
        ? `Kapp materialene etter kapplista. Lag ${c.shape === 'square' || c.shape === 'rect' ? 4 : 6} hjørnekapper av to terrassebord hver (lengde ${c.hoyde + c.ben} cm${c.ben > 0 ? `, ${c.ben} cm blir ben` : ''}).`
        : `Kapp materialene etter kapplista. Hjørnestolper (${stolpeSpec}): ${c.hoyde + c.ben} cm${c.ben > 0 ? ` – ${c.ben} cm stikker ned som ben` : ''}.`,
      kapp
        ? 'Skru de to bordene i hver kapp sammen til en 90°-vinkel.'
        : 'Reis hjørnestolpene innvendig og kontroller vater og vinkel.',
      kapp
        ? 'Skru kledningsbordene rad for rad fast i hjørnekappene utenfra. La bordene møtes i buttskjøt i hjørnene.'
        : 'Skru kledningsbordene rad for rad fast i stolpene, slik at bordene møtes i buttskjøt i hjørnene.',
      c.bunn ? 'Legg bunnbordene med dreneringsspalte og skru dem til en list innvendig.' : 'Uten bunn: sett kassen på klosser for lufting.',
      c.topplist ? `Monter topplisten med ${c.topplistOverheng} cm utheng, gjæret i hjørnene.` : 'Slip toppkanten lett.',
      'Kle innsiden med fiberduk før du fyller jord.',
      c.espalier ? 'Monter espalieret på baksiden.' : 'Behandle treet etter ønske.',
    ]
  },
}
