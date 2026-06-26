import { useRef, useEffect, useState, type MutableRefObject } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useScrollLock } from '../../../hooks/useScrollLock'
import ProsjektMeny from '../../shared/planlegger/ProsjektMeny'
import type { ProsjektStyring } from './useUtekjokkenProsjekter'
import {
  SidebarPanel, SidebarHeader, SidebarTitle, SidebarClose, SidebarBody,
  SbSection, SbLabel, SbSliderGroup, SbSliderRow, SbSliderName, SbSliderVal, SbSlider,
  SegRow, SegBtn, ToggleRow, ToggleText, ToggleTrack,
} from '../../shared/FullscreenSidebar'
import {
  type UtekjokkenConfig,
  type Taktype,
  type Taktekke,
  type Benkeplate,
  BJELKE_INFO,
  TAK_INFO,
  TAKTEKKE_INFO,
  BENKEPLATE_INFO,
  MÅLEFELT,
  ALLE_TAKTYPER,
  ALLE_TAKTEKKE,
  ALLE_BENKEPLATE,
  takFall,
  stolperPerRad,
  antallSpær,
  benkeradLengde,
} from './utekjokkenModel'

type ViewMode = 'ferdig' | 'konstruksjon' | 'begge'

interface Props {
  config: UtekjokkenConfig
  onConfigChange?: (config: UtekjokkenConfig) => void
  prosjekt?: ProsjektStyring
  snapshotRef?: MutableRefObject<(() => string | null) | null>
}

const Wrapper = styled.div`
  width: 100%;
`

const Viewport = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  background: transparent;

  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }

  @media (max-width: 768px) {
    aspect-ratio: auto;
    height: 40vh;
  }
`

const FSOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: #fff;
  display: flex;
  flex-direction: row;
  overflow: hidden;
`

const FSViewport = styled.div`
  flex: 1;
  min-width: 0;
  height: 100%;
  position: relative;
  overflow: hidden;
  background: transparent;

  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
`

const ModeToggle = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  border-radius: 999px;
  padding: 3px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.12);
  z-index: 2;

  @media (max-width: 768px) {
    top: auto;
    bottom: 12px;
  }
`

const ModeBtn = styled.button<{ $active: boolean }>`
  border: none;
  background: ${({ $active, theme }) => ($active ? theme.colors.textDark : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#555')};
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.18s ease;
  white-space: nowrap;

  @media (max-width: 768px) {
    font-size: 0.62rem;
    padding: 0.3rem 0.55rem;
  }
`

const FullscreenLogo = styled.img`
  position: absolute;
  top: 16px;
  right: 16px;
  height: 24px;
  pointer-events: none;
  z-index: 1;
  opacity: 0.5;
`

const RotateHint = styled.div`
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.55rem;
  font-weight: 500;
  color: #888;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: none;
  z-index: 1;

  @media (max-width: 768px) {
    display: none;
  }
`

const ZoomControls = styled.div`
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 2;
`

const ZoomButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  color: #333;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
  transition: background 0.15s ease;

  &:hover {
    background: #fff;
  }
`

const FullscreenBtn = styled(ZoomButton)`
  @media (max-width: 768px) {
    display: none;
  }
`

// ── Materialdimensjoner ────────────────────────────────────────────────────────

const RAFTER_W = 0.048 // spærbredde

function makeBox(w: number, h: number, l: number, mat: THREE.Material): THREE.Mesh {
  const geom = new THREE.BoxGeometry(Math.max(w, 0.001), Math.max(h, 0.001), Math.max(l, 0.001))
  const mesh = new THREE.Mesh(geom, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function disposeGroup(group: THREE.Object3D) {
  const children = [...group.children]
  children.forEach((child) => {
    if (child instanceof THREE.Group) disposeGroup(child)
    else if (child instanceof THREE.Mesh) child.geometry?.dispose()
    group.remove(child)
  })
}

interface Materials {
  post: THREE.MeshStandardMaterial
  beam: THREE.MeshStandardMaterial
  brace: THREE.MeshStandardMaterial
  roof: THREE.MeshStandardMaterial
  deck: THREE.MeshStandardMaterial
  counter: THREE.MeshStandardMaterial
  cabinet: THREE.MeshStandardMaterial
  panel: THREE.MeshStandardMaterial
  metal: THREE.MeshStandardMaterial
}

function spread(lo: number, hi: number, n: number): number[] {
  if (n <= 1) return [(lo + hi) / 2]
  const step = (hi - lo) / (n - 1)
  return Array.from({ length: n }, (_, i) => lo + i * step)
}

function roofColor(t: Taktekke): number {
  switch (t) {
    case 'stålplater': return 0x6b6f74
    case 'bord': return 0x9a7549
    case 'shingel': return 0x4a3b2f
  }
}

function counterColor(b: Benkeplate): number {
  switch (b) {
    case 'tre': return 0xb88a52
    case 'laminat': return 0xd8d2c6
    case 'rustfritt': return 0xc8ccd0
  }
}

/** Takets underkant-høyde (over bakken) ved en gitt z – stiger bakover ved pulttak. */
function roofUnderY(c: UtekjokkenConfig, z: number): number {
  const eaveFront = c.plattformHøyde + c.høyde
  if (c.taktype === 'flatt') return eaveFront
  return eaveFront + takFall(c) * (z / Math.max(0.1, c.dybde))
}

function buildModel(
  structure: THREE.Group,
  roof: THREE.Group,
  innredning: THREE.Group,
  c: UtekjokkenConfig,
  mats: Materials,
) {
  disposeGroup(structure)
  disposeGroup(roof)
  disposeGroup(innredning)

  const W = c.bredde
  const D = c.dybde
  const oh = c.takutstikk
  const s = c.stolpeDim === '148x148' ? 0.148 : c.stolpeDim === '98x98' ? 0.098 : 0.09
  const jh = BJELKE_INFO[c.bjelkeDim].høyde / 1000
  const pf = c.plattformHøyde

  const wx = (mx: number) => mx - W / 2
  const wz = (mz: number) => mz - D / 2

  mats.roof.color.setHex(roofColor(c.taktekke))
  mats.counter.color.setHex(counterColor(c.benkeplate))

  // ── Platting (hevet gulv) ──────────────────────────────────────────────────
  const deck = makeBox(W, 0.05, D, mats.deck)
  deck.position.set(0, pf - 0.025, 0)
  structure.add(deck)
  // Bjelkelag / skjørt rundt kanten
  const skirtH = Math.max(0.05, pf - 0.05)
  for (const [cx, cz, len, rotY] of [
    [W / 2, 0.02, W, 0],
    [W / 2, D - 0.02, W, 0],
    [0.02, D / 2, D, Math.PI / 2],
    [W - 0.02, D / 2, D, Math.PI / 2],
  ] as const) {
    const skirt = makeBox(len, skirtH, 0.04, mats.beam)
    skirt.position.set(wx(cx), (pf - 0.05) / 2, wz(cz))
    skirt.rotation.y = rotY
    structure.add(skirt)
  }

  // ── Stolper + stolpesko + knebånd ──────────────────────────────────────────
  const perRad = stolperPerRad(c)
  const postXs = spread(s / 2, W - s / 2, perRad)
  const postRows = [s / 2, D - s / 2] // front, bak
  for (const px of postXs) {
    for (const pz of postRows) {
      const top = roofUnderY(c, pz) - jh
      const postH = Math.max(0.3, top - pf)
      const post = makeBox(s, postH, s, mats.post)
      post.position.set(wx(px), pf + postH / 2, wz(pz))
      structure.add(post)

      const sko = makeBox(s * 1.1, 0.06, s * 1.1, mats.metal)
      sko.position.set(wx(px), pf + 0.03, wz(pz))
      structure.add(sko)

      // Knebånd: skråstivere langs bredden opp mot dragerne (innovervendt på endene)
      const dirs: number[] = []
      const idx = postXs.indexOf(px)
      if (idx > 0) dirs.push(-1)
      if (idx < postXs.length - 1) dirs.push(1)
      if (dirs.length === 0) dirs.push(-1, 1)
      const off = 0.45
      const braceLen = Math.hypot(off, off)
      for (const dir of dirs) {
        const brace = makeBox(0.05, braceLen, 0.05, mats.brace)
        brace.position.set(wx(px + (dir * off) / 2), top - off / 2, wz(pz))
        brace.rotation.z = -dir * (Math.PI / 4)
        structure.add(brace)
      }
    }
  }

  // ── Dragere langs forsiden og baksiden ─────────────────────────────────────
  for (const pz of postRows) {
    const eave = roofUnderY(c, pz)
    const beam = makeBox(W + 2 * oh, jh, s, mats.beam)
    beam.position.set(0, eave - jh / 2, wz(pz))
    structure.add(beam)
  }

  // ── Spær på tvers (langs dybden), følger fallet ────────────────────────────
  const addRafterZ = (z1: number, z2: number, x: number, group: THREE.Group, thickY: number, widthX: number, mat: THREE.Material, yOff: number) => {
    const y1 = roofUnderY(c, z1)
    const y2 = roofUnderY(c, z2)
    const dz = z2 - z1
    const dy = y2 - y1
    const len = Math.hypot(dz, dy)
    const box = makeBox(widthX, thickY, len, mat)
    box.position.set(wx(x), (y1 + y2) / 2 + yOff, wz((z1 + z2) / 2))
    box.rotation.x = -Math.atan2(dy, dz)
    group.add(box)
  }

  const spærXs = spread(0.024, W - 0.024, antallSpær(c))
  for (const sx of spærXs) addRafterZ(-oh, D + oh, sx, structure, jh, RAFTER_W, mats.beam, jh / 2)

  // ── Takflate + raftekant (fascia) ──────────────────────────────────────────
  addRafterZ(-oh, D + oh, W / 2, roof, 0.04, W + 2 * oh, mats.roof, jh + 0.04)
  // Fascia langs forkant + sidekanter (de synlige "3 cm"-kantene)
  const fasciaFrontY = roofUnderY(c, -oh) + jh
  const frontFascia = makeBox(W + 2 * oh, 0.16, 0.03, mats.beam)
  frontFascia.position.set(0, fasciaFrontY + 0.02, wz(-oh))
  roof.add(frontFascia)
  for (const fx of [-oh + 0.015, W + oh - 0.015]) {
    addRafterZ(-oh, D + oh, fx, roof, 0.16, 0.025, mats.beam, jh + 0.02)
  }

  // ── Innredning ─────────────────────────────────────────────────────────────
  buildInnredning(innredning, c, s, mats, wx, wz)

  const topY = roofUnderY(c, D + oh) + jh + 0.1
  return { modelW: W, modelD: D, topY }
}

function buildInnredning(
  g: THREE.Group,
  c: UtekjokkenConfig,
  s: number,
  mats: Materials,
  wx: (m: number) => number,
  wz: (m: number) => number,
) {
  const W = c.bredde
  const D = c.dybde
  const pf = c.plattformHøyde
  const bh = c.benkehøyde // overkant benkeplate (over dekke)
  const bd = c.benkedybde
  const plateT = 0.04

  // Bakvegg som spiler (stående battens med luft mellom) langs baksiden
  if (c.harBakvegg) {
    const veggH = 1.2
    const zPos = D - s - 0.02
    const slatW = 0.045
    const pitch = slatW + 0.035 // batten + luftspalte
    const usableW = Math.max(0.2, W - 2 * s - 0.1)
    const n = Math.max(2, Math.floor(usableW / pitch))
    const slatXs = spread(-usableW / 2 + slatW / 2, usableW / 2 - slatW / 2, n)
    // Topp- og bunnramme som spilene festes til
    for (const ry of [pf + 0.06, pf + veggH - 0.06]) {
      const ramme = makeBox(usableW, 0.05, 0.03, mats.panel)
      ramme.position.set(0, ry, wz(zPos))
      g.add(ramme)
    }
    for (const sx of slatXs) {
      const slat = makeBox(slatW, veggH, 0.022, mats.panel)
      slat.position.set(sx, pf + veggH / 2, wz(zPos))
      g.add(slat)
    }
  }

  // Spilervegger på begge sider (stående battens langs dybden)
  if (c.harSidevegger) {
    const veggH = Math.min(1.8, c.høyde)
    const slatW = 0.045
    const pitch = slatW + 0.035
    const usableD = Math.max(0.2, D - 2 * s - 0.1)
    const n = Math.max(2, Math.floor(usableD / pitch))
    const slatZs = spread(-usableD / 2 + slatW / 2, usableD / 2 - slatW / 2, n)
    for (const sideX of [s / 2, W - s / 2]) {
      for (const ry of [pf + 0.06, pf + veggH - 0.06]) {
        const ramme = makeBox(0.03, 0.05, usableD, mats.panel)
        ramme.position.set(wx(sideX), ry, 0)
        g.add(ramme)
      }
      for (const cz of slatZs) {
        const slat = makeBox(0.022, veggH, slatW, mats.panel)
        slat.position.set(wx(sideX), pf + veggH / 2, cz)
        g.add(slat)
      }
    }
  }

  // Benkerad langs baksiden. Deles i benk (vask) + evt. skap.
  const skapBredde = c.harSkap ? 0.6 : 0
  const benkeLengde = Math.max(0.6, benkeradLengde(c) - skapBredde)
  const leftMargin = 0.1
  const counterZ = D - s - bd / 2 - 0.02 // senter i dybderetning, mot baksiden

  // Benkeplate
  const plate = makeBox(benkeLengde, plateT, bd, mats.counter)
  plate.position.set(wx(leftMargin + benkeLengde / 2), pf + bh, wz(counterZ))
  g.add(plate)

  // Underramme / ben + hyller under benkeplata
  const frontZ = counterZ - bd / 2 + 0.04
  const backZ = counterZ + bd / 2 - 0.04
  for (const lx of [leftMargin + 0.05, leftMargin + benkeLengde - 0.05]) {
    for (const lz of [frontZ, backZ]) {
      const leg = makeBox(0.05, bh, 0.05, mats.cabinet)
      leg.position.set(wx(lx), pf + bh / 2, wz(lz))
      g.add(leg)
    }
  }
  for (let i = 0; i < c.hyller; i++) {
    const hy = pf + 0.12 + (i * (bh - 0.2)) / Math.max(1, c.hyller)
    const hylle = makeBox(benkeLengde - 0.1, 0.025, bd - 0.12, mats.cabinet)
    hylle.position.set(wx(leftMargin + benkeLengde / 2), hy, wz(counterZ))
    g.add(hylle)
  }

  // Vask + kran
  if (c.harVask) {
    const sinkW = 0.4
    const sinkX = leftMargin + Math.min(benkeLengde - sinkW / 2 - 0.1, 0.35)
    const basin = makeBox(sinkW, 0.12, bd * 0.6, mats.metal)
    basin.position.set(wx(sinkX), pf + bh - 0.06, wz(counterZ))
    g.add(basin)
    const kran = makeBox(0.03, 0.28, 0.03, mats.metal)
    kran.position.set(wx(sinkX), pf + bh + 0.14, wz(counterZ + bd / 2 - 0.08))
    g.add(kran)
    const tut = makeBox(0.03, 0.03, 0.16, mats.metal)
    tut.position.set(wx(sinkX), pf + bh + 0.26, wz(counterZ + bd / 2 - 0.16))
    g.add(tut)
  }

  // Lukket underskap med dør (til høyre for benken)
  if (c.harSkap) {
    const skapX = leftMargin + benkeLengde + skapBredde / 2
    const skapH = bh - 0.02
    const box = makeBox(skapBredde, skapH, bd, mats.cabinet)
    box.position.set(wx(skapX), pf + skapH / 2, wz(counterZ))
    g.add(box)
    // Benkeplate over skapet
    const skapPlate = makeBox(skapBredde, plateT, bd, mats.counter)
    skapPlate.position.set(wx(skapX), pf + bh, wz(counterZ))
    g.add(skapPlate)
    // Dør (litt proud, på forsiden)
    const dør = makeBox(skapBredde - 0.06, skapH - 0.06, 0.02, mats.panel)
    dør.position.set(wx(skapX), pf + skapH / 2, wz(counterZ - bd / 2 - 0.01))
    g.add(dør)
    const håndtak = makeBox(0.02, 0.12, 0.02, mats.metal)
    håndtak.position.set(wx(skapX + skapBredde / 2 - 0.08), pf + skapH / 2, wz(counterZ - bd / 2 - 0.03))
    g.add(håndtak)
  }

  // Sittebenk langs høyre side (i dybderetning), foran benkeraden
  if (c.harBenk) {
    const seatH = 0.45
    const seatDepth = 0.4
    const benkX = W - seatDepth / 2 - 0.1
    const benkZ0 = 0.15
    const benkZ1 = D - bd - 0.1
    const benkLen = Math.max(0.5, benkZ1 - benkZ0)
    const seat = makeBox(seatDepth, 0.05, benkLen, mats.counter)
    seat.position.set(wx(benkX), pf + seatH, wz((benkZ0 + benkZ1) / 2))
    g.add(seat)
    for (const lz of [benkZ0 + 0.1, benkZ1 - 0.1]) {
      const leg = makeBox(0.05, seatH, 0.05, mats.cabinet)
      leg.position.set(wx(benkX), pf + seatH / 2, wz(lz))
      g.add(leg)
    }
  }
}

function frameCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  modelW: number,
  modelD: number,
  topY: number,
  keepAngle = false,
) {
  const maxDim = Math.max(modelW, modelD, topY, 2)
  const target = new THREE.Vector3(0, topY * 0.4, 0)
  const defaultPos = new THREE.Vector3(maxDim * 0.95, maxDim * 0.8 + topY, maxDim * 1.2)
  const fitDist = Math.min(
    controls.maxDistance,
    Math.max(controls.minDistance, defaultPos.distanceTo(target)),
  )
  const dir = camera.position.clone().sub(controls.target)
  if (!keepAngle || dir.lengthSq() < 1e-6) dir.copy(defaultPos).sub(target)
  dir.normalize().multiplyScalar(fitDist)
  controls.target.copy(target)
  camera.position.copy(target).add(dir)
  camera.lookAt(target)
  controls.update()
}

export default function UtekjokkenVisualizer({ config, onConfigChange, prosjekt, snapshotRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fsContainerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<ViewMode>('ferdig')
  const [isFullscreen, setIsFullscreen] = useState(false)
  useScrollLock(isFullscreen)

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    structure: THREE.Group
    roof: THREE.Group
    innredning: THREE.Group
    mats: Materials
    resizeObserver: ResizeObserver
    scene: THREE.Scene
    dims: { modelW: number; modelD: number; topY: number }
  } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = null
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setSize(width, height, false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.insertBefore(renderer.domElement, container.firstChild)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.5
    controls.maxDistance = 60
    controls.maxPolarAngle = Math.PI / 2.05
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.addEventListener('start', () => {
      controls.autoRotate = false
    })

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const sun = new THREE.DirectionalLight(0xffffff, 0.85)
    sun.position.set(12, 24, 16)
    sun.castShadow = true
    sun.shadow.mapSize.width = 2048
    sun.shadow.mapSize.height = 2048
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far = 120
    sun.shadow.camera.left = -30
    sun.shadow.camera.right = 30
    sun.shadow.camera.top = 30
    sun.shadow.camera.bottom = -30
    scene.add(sun)
    const fill = new THREE.DirectionalLight(0xffffff, 0.3)
    fill.position.set(-10, 8, -8)
    scene.add(fill)

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Grønnlig tone som trykkimpregnert (royalimpregnert) trevirke.
    const mats: Materials = {
      post: new THREE.MeshStandardMaterial({ color: 0x8a9466, roughness: 0.85, metalness: 0.03 }),
      beam: new THREE.MeshStandardMaterial({ color: 0x97a173, roughness: 0.85, metalness: 0.03 }),
      brace: new THREE.MeshStandardMaterial({ color: 0x8e9869, roughness: 0.87, metalness: 0.03 }),
      roof: new THREE.MeshStandardMaterial({ color: 0x6b6f74, roughness: 0.55, metalness: 0.2 }),
      deck: new THREE.MeshStandardMaterial({ color: 0xa1ab80, roughness: 0.82, metalness: 0.03 }),
      counter: new THREE.MeshStandardMaterial({ color: 0xb88a52, roughness: 0.6, metalness: 0.05 }),
      cabinet: new THREE.MeshStandardMaterial({ color: 0x848e5c, roughness: 0.83, metalness: 0.03 }),
      panel: new THREE.MeshStandardMaterial({ color: 0x9aa476, roughness: 0.83, metalness: 0.03 }),
      metal: new THREE.MeshStandardMaterial({ color: 0xb9bcc0, roughness: 0.35, metalness: 0.6 }),
    }

    const structure = new THREE.Group()
    const roof = new THREE.Group()
    const innredning = new THREE.Group()
    scene.add(structure, roof, innredning)

    const { modelW, modelD, topY } = buildModel(structure, roof, innredning, config, mats)
    frameCamera(camera, controls, modelW, modelD, topY)

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const resizeObserver = new ResizeObserver(() => {
      const host = renderer.domElement.parentElement
      if (!host) return
      const w = host.clientWidth
      const h = host.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h, false)
    })
    resizeObserver.observe(container)

    sceneRef.current = {
      renderer, camera, controls, structure, roof, innredning, mats, resizeObserver, scene,
      dims: { modelW, modelD, topY },
    }

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationId)
      controls.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry?.dispose()
          const m = obj.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else m?.dispose()
        }
      })
      renderer.dispose()
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement)
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const sref = sceneRef.current
    if (!sref) return
    const { modelW, modelD, topY } = buildModel(sref.structure, sref.roof, sref.innredning, config, sref.mats)
    sref.dims = { modelW, modelD, topY }
    applyMode(sref, mode)
    frameCamera(sref.camera, sref.controls, modelW, modelD, topY, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  useEffect(() => {
    const sref = sceneRef.current
    if (!sref) return
    applyMode(sref, mode)
  }, [mode])

  useEffect(() => {
    if (!snapshotRef) return
    snapshotRef.current = () => {
      const sref = sceneRef.current
      if (!sref) return null
      const { renderer, camera, controls, scene, dims } = sref
      const savedPos = camera.position.clone()
      const savedTarget = controls.target.clone()
      const savedAutoRotate = controls.autoRotate
      controls.autoRotate = false
      frameCamera(camera, controls, dims.modelW, dims.modelD, dims.topY, false)
      renderer.render(scene, camera)
      let url: string | null = null
      try {
        url = renderer.domElement.toDataURL('image/png')
      } catch {
        url = null
      }
      camera.position.copy(savedPos)
      controls.target.copy(savedTarget)
      controls.autoRotate = savedAutoRotate
      controls.update()
      renderer.render(scene, camera)
      return url
    }
    return () => {
      snapshotRef.current = null
    }
  }, [snapshotRef])

  useEffect(() => {
    if (!isFullscreen) return
    document.documentElement.setAttribute('data-fullscreen-preview', '')
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handler)
    return () => {
      document.documentElement.removeAttribute('data-fullscreen-preview')
      window.removeEventListener('keydown', handler)
    }
  }, [isFullscreen])

  useEffect(() => {
    const sref = sceneRef.current
    if (!sref) return
    const dest = isFullscreen ? fsContainerRef.current : containerRef.current
    if (!dest) return
    const canvas = sref.renderer.domElement
    if (canvas.parentElement !== dest) dest.insertBefore(canvas, dest.firstChild)
    if (isFullscreen && fsContainerRef.current) sref.resizeObserver.observe(fsContainerRef.current)
    const w = dest.clientWidth
    const h = dest.clientHeight
    if (w && h) {
      sref.camera.aspect = w / h
      sref.camera.updateProjectionMatrix()
      sref.renderer.setSize(w, h, false)
    }
  }, [isFullscreen])

  const handleZoom = (direction: 'in' | 'out') => {
    const sref = sceneRef.current
    if (!sref) return
    const { camera, controls } = sref
    const offset = camera.position.clone().sub(controls.target)
    const factor = direction === 'in' ? 0.82 : 1.22
    const dist = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * factor))
    offset.normalize().multiplyScalar(dist)
    camera.position.copy(controls.target).add(offset)
  }

  const update = (patch: Partial<UtekjokkenConfig>) => onConfigChange?.({ ...config, ...patch })

  const MODES: Array<[ViewMode, string]> = [
    ['ferdig', 'Ferdig'],
    ['konstruksjon', 'Konstruksjon'],
    ['begge', 'Begge'],
  ]

  const controls = (fs: boolean) => (
    <>
      {fs && <FullscreenLogo src="/images/branding/logo_icon_white.webp" alt="Minio" />}
      {prosjekt && (
        <ProsjektMeny prosjekt={prosjekt} beskriv={(cfg) => `${cfg.bredde.toFixed(1)}×${cfg.dybde.toFixed(1)} m · ${TAK_INFO[cfg.taktype].navn}`} navnPlaceholder="F.eks. Utekjøkken terrasse" />
      )}
      <ModeToggle>
        {MODES.map(([m, label]) => (
          <ModeBtn key={m} $active={mode === m} onClick={() => setMode(m)}>
            {label}
          </ModeBtn>
        ))}
      </ModeToggle>
      <RotateHint>
        <span>&#9995;</span> Dra for å rotere · knip/scroll for å zoome
      </RotateHint>
      <ZoomControls>
        <ZoomButton onClick={() => handleZoom('in')} aria-label="Zoom inn">+</ZoomButton>
        <ZoomButton onClick={() => handleZoom('out')} aria-label="Zoom ut">&minus;</ZoomButton>
        {fs ? (
          <ZoomButton onClick={() => setIsFullscreen(false)} aria-label="Lukk fullskjerm">&times;</ZoomButton>
        ) : (
          <FullscreenBtn onClick={() => setIsFullscreen(true)} aria-label="Fullskjerm">&#x26F6;</FullscreenBtn>
        )}
      </ZoomControls>
    </>
  )

  return (
    <Wrapper>
      <Viewport ref={containerRef}>{!isFullscreen && controls(false)}</Viewport>

      {isFullscreen &&
        createPortal(
          <FSOverlay>
            <FSViewport ref={fsContainerRef}>{controls(true)}</FSViewport>
            {onConfigChange && (
              <SidebarPanel>
                <SidebarHeader>
                  <SidebarTitle>Tilpass utekjøkkenet</SidebarTitle>
                  <SidebarClose onClick={() => setIsFullscreen(false)} aria-label="Lukk">&times;</SidebarClose>
                </SidebarHeader>
                <SidebarBody>
                  <SbSection>
                    <SbLabel>Mål</SbLabel>
                    {MÅLEFELT.map(([key, label, min, max, step]) => (
                      <SbSliderGroup key={key}>
                        <SbSliderRow>
                          <SbSliderName>{label}</SbSliderName>
                          <SbSliderVal>{(config[key] as number).toFixed(1)} m</SbSliderVal>
                        </SbSliderRow>
                        <SbSlider
                          type="range"
                          min={min}
                          max={max}
                          step={step}
                          value={config[key] as number}
                          onChange={(ev) => update({ [key]: +ev.target.value } as Partial<UtekjokkenConfig>)}
                        />
                      </SbSliderGroup>
                    ))}
                  </SbSection>

                  <SbSection>
                    <SbLabel>Tak</SbLabel>
                    <SegRow>
                      {ALLE_TAKTYPER.map((t: Taktype) => (
                        <SegBtn key={t} $active={config.taktype === t} onClick={() => update({ taktype: t })}>
                          {TAK_INFO[t].navn}
                        </SegBtn>
                      ))}
                    </SegRow>
                    <SegRow style={{ marginTop: '0.5rem' }}>
                      {ALLE_TAKTEKKE.map((t: Taktekke) => (
                        <SegBtn key={t} $active={config.taktekke === t} onClick={() => update({ taktekke: t, prisTaktekkePerM2: TAKTEKKE_INFO[t].standardpris })}>
                          {TAKTEKKE_INFO[t].navn}
                        </SegBtn>
                      ))}
                    </SegRow>
                  </SbSection>

                  <SbSection>
                    <SbLabel>Benkeplate</SbLabel>
                    <SegRow>
                      {ALLE_BENKEPLATE.map((b: Benkeplate) => (
                        <SegBtn key={b} $active={config.benkeplate === b} onClick={() => update({ benkeplate: b, prisBenkeplatePrLm: BENKEPLATE_INFO[b].standardpris })}>
                          {BENKEPLATE_INFO[b].navn}
                        </SegBtn>
                      ))}
                    </SegRow>
                  </SbSection>

                  <SbSection>
                    <SbLabel>Innredning</SbLabel>
                    <ToggleRow>
                      <ToggleText>Vask og kran</ToggleText>
                      <ToggleTrack $on={config.harVask} onClick={() => update({ harVask: !config.harVask })} />
                    </ToggleRow>
                    <ToggleRow>
                      <ToggleText>Underskap med dør</ToggleText>
                      <ToggleTrack $on={config.harSkap} onClick={() => update({ harSkap: !config.harSkap })} />
                    </ToggleRow>
                    <ToggleRow>
                      <ToggleText>Sittebenk</ToggleText>
                      <ToggleTrack $on={config.harBenk} onClick={() => update({ harBenk: !config.harBenk })} />
                    </ToggleRow>
                    <ToggleRow>
                      <ToggleText>Bakvegg (spiler)</ToggleText>
                      <ToggleTrack $on={config.harBakvegg} onClick={() => update({ harBakvegg: !config.harBakvegg })} />
                    </ToggleRow>
                    <ToggleRow>
                      <ToggleText>Sidevegger (spiler)</ToggleText>
                      <ToggleTrack $on={config.harSidevegger} onClick={() => update({ harSidevegger: !config.harSidevegger })} />
                    </ToggleRow>
                  </SbSection>
                </SidebarBody>
              </SidebarPanel>
            )}
          </FSOverlay>,
          document.body,
        )}
    </Wrapper>
  )
}

function applyMode(
  sref: { structure: THREE.Group; roof: THREE.Group; innredning: THREE.Group; mats: Materials },
  mode: ViewMode,
) {
  sref.roof.visible = mode !== 'konstruksjon'
  sref.innredning.visible = mode !== 'konstruksjon'
  const transparent = mode === 'begge'
  sref.mats.roof.transparent = transparent
  sref.mats.roof.opacity = transparent ? 0.3 : 1
  sref.mats.roof.needsUpdate = true
}
