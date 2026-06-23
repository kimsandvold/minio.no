import { useRef, useEffect, useState, type MutableRefObject } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useScrollLock } from '../../../hooks/useScrollLock'
import ProsjektMeny from '../../shared/planlegger/ProsjektMeny'
import type { ProsjektStyring } from './useCarportProsjekter'
import {
  SidebarPanel, SidebarHeader, SidebarTitle, SidebarClose, SidebarBody,
  SbSection, SbLabel, SbSliderGroup, SbSliderRow, SbSliderName, SbSliderVal, SbSlider,
  SegRow, SegBtn,
} from '../../shared/FullscreenSidebar'
import {
  type CarportConfig,
  type Montering,
  type Taktype,
  type Taktekke,
  type Veggtype,
  type Carportside,
  BJELKE_INFO,
  MONTERING_INFO,
  TAK_INFO,
  TAKTEKKE_INFO,
  VEGG_INFO,
  SIDE_INFO,
  MÅLEFELT,
  ALLE_MONTERING,
  ALLE_TAKTYPER,
  ALLE_TAKTEKKE,
  ALLE_VEGGTYPER,
  ALLE_SIDER,
  takFall,
  stolperPerRad,
  antallSpær,
} from './carportModel'

type ViewMode = 'ferdig' | 'konstruksjon' | 'begge'

interface Props {
  config: CarportConfig
  onConfigChange?: (config: CarportConfig) => void
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

const SideToggleRow = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
  margin-top: 0.6rem;
`

// ── Materialdimensjoner ────────────────────────────────────────────────────────

const BEAM_W = 0.096 // dragerbredde (langs lengden)
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
  panel: THREE.MeshStandardMaterial
  acryl: THREE.MeshStandardMaterial
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
    case 'polykarbonat': return 0xcfe0e6
    case 'takpapp': return 0x2c2c2c
    case 'shingel': return 0x4a3b2f
  }
}

interface Eaves { left: number; right: number; ridge: number }

function eaves(c: CarportConfig): Eaves {
  const fall = takFall(c)
  if (c.taktype === 'flatt') return { left: c.høyde, right: c.høyde, ridge: c.høyde }
  if (c.taktype === 'pulttak') return { left: c.høyde, right: c.høyde + fall, ridge: c.høyde + fall }
  return { left: c.høyde, right: c.høyde, ridge: c.høyde + fall } // saltak
}

/** Takets underkant-høyde ved en gitt x (modellkoordinat, kan være utenfor 0..W). */
function roofY(c: CarportConfig, e: Eaves, x: number): number {
  const W = c.bredde
  if (c.taktype === 'flatt') return c.høyde
  if (c.taktype === 'pulttak') return e.left + ((e.right - e.left) * x) / W
  const half = W / 2
  return e.left + (e.ridge - e.left) * (1 - Math.abs(x - half) / half)
}

function buildModel(
  structure: THREE.Group,
  roof: THREE.Group,
  walls: THREE.Group,
  c: CarportConfig,
  mats: Materials,
) {
  disposeGroup(structure)
  disposeGroup(roof)
  disposeGroup(walls)

  const W = c.bredde
  const L = c.lengde
  const oh = c.takutstikk
  const s = c.stolpeDim === '148x148' ? 0.148 : 0.098
  const jh = BJELKE_INFO[c.bjelkeDim].høyde / 1000
  const e = eaves(c)
  const frittstående = c.montering === 'frittstående'

  const wx = (mx: number) => mx - W / 2
  const wz = (mz: number) => mz - L / 2

  mats.roof.color.setHex(roofColor(c.taktekke))
  const roofTranslucent = c.taktekke === 'polykarbonat'
  mats.roof.transparent = roofTranslucent
  mats.roof.opacity = roofTranslucent ? 0.5 : 1

  // Stolperader: low side x≈0 (left), high side x≈W (right).
  const leftX = s / 2
  const rightX = W - s / 2
  const rows: Array<{ x: number; eave: number }> = frittstående
    ? [{ x: leftX, eave: e.left }, { x: rightX, eave: e.right }]
    : [{ x: leftX, eave: e.left }] // veggmontert: bare lav side har stolper
  const postZs = spread(s / 2, L - s / 2, stolperPerRad(c))

  // Stolper + stolpesko + knebånd
  for (const row of rows) {
    const postH = Math.max(0.3, row.eave - jh)
    const beamUnder = row.eave - jh // underkant drager = stolpetopp
    postZs.forEach((pz, i) => {
      const post = makeBox(s, postH, s, mats.post)
      post.position.set(wx(row.x), postH / 2, wz(pz))
      structure.add(post)
      const sko = makeBox(s * 1.1, 0.08, s * 1.1, mats.metal)
      sko.position.set(wx(row.x), 0.04, wz(pz))
      structure.add(sko)

      // Knebånd: korte 45°-skråstivere fra stolpe opp til drager, i stolpens
      // loddplan (langs z). Boksens lengde ligger langs Y og vippes ±45° om x-aksen,
      // så den går fra et punkt på stolpa diagonalt opp til dragerens underkant.
      // Endestolper får bare innovervendt bånd, slik at ingenting stikker ut.
      const dirs: number[] = []
      if (i > 0) dirs.push(-1)
      if (i < postZs.length - 1) dirs.push(1)
      if (dirs.length === 0) dirs.push(-1, 1)
      const off = 0.5
      const braceLen = Math.hypot(off, off)
      for (const dir of dirs) {
        const brace = makeBox(0.06, braceLen, 0.06, mats.brace) // lengde langs Y
        brace.position.set(wx(row.x), beamUnder - off / 2, wz(pz + (dir * off) / 2))
        brace.rotation.x = dir * (Math.PI / 4)
        structure.add(brace)
      }
    })
  }

  // Dragere langs lengden (oppå stolpene). Veggmontert: lav drager + vegg-ledger.
  const beamZLen = L + 2 * oh
  const dragerX = frittstående ? [leftX, rightX] : [leftX]
  for (const dx of dragerX) {
    const eave = dx === leftX ? e.left : e.right
    const beam = makeBox(s, jh, beamZLen, mats.beam)
    beam.position.set(wx(dx), eave - jh / 2, 0)
    structure.add(beam)
  }
  if (!frittstående) {
    // Vegg-ledger på høy side (mot huset)
    const ledger = makeBox(0.05, jh, beamZLen, mats.beam)
    ledger.position.set(wx(rightX), e.right - jh / 2, 0)
    structure.add(ledger)
  }

  // Møne (mønebjelke) som løper langs hele lengden under takryggen ved saltak.
  if (c.taktype === 'saltak') {
    const ridge = makeBox(BEAM_W, jh, L + 2 * oh, mats.beam)
    ridge.position.set(wx(W / 2), e.ridge - jh / 2, 0)
    structure.add(ridge)
  }

  // Takstol ved hver stolpelinje: tverrbjelke (undergurt) + avstivere.
  //  · saltak  → kongstolpe i senter (møne ↓ undergurt) + hanebjelke (kryssbjelke)
  //  · pulttak → midtstrever fra undergurt opp til raften
  const tieY = e.left - jh / 2 // underkant lav drager = undergurtnivå
  for (const pz of postZs) {
    const tie = makeBox(W, jh, BEAM_W, mats.beam)
    tie.position.set(0, tieY, wz(pz))
    structure.add(tie)

    if (c.taktype === 'saltak') {
      const kingBot = tieY + jh / 2
      const kingTop = e.ridge - jh
      if (kingTop - kingBot > 0.15) {
        const king = makeBox(0.07, kingTop - kingBot, 0.07, mats.brace)
        king.position.set(wx(W / 2), (kingBot + kingTop) / 2, wz(pz))
        structure.add(king)
      }
      // Hanebjelke: vannrett kryssbjelke mellom takflatene ~55 % opp
      const f = 0.55
      const half = W / 2
      const collarY = e.left + (e.ridge - e.left) * f
      const xIn = half * f // takflatene møter denne høyden ved x = f·halv bredde
      const collar = makeBox(W - 2 * xIn, jh * 0.7, 0.045, mats.beam)
      collar.position.set(0, collarY - (jh * 0.7) / 2, wz(pz))
      structure.add(collar)
    } else if (c.taktype === 'pulttak') {
      const strutBot = tieY + jh / 2
      const strutTop = roofY(c, e, W / 2) - jh
      if (strutTop - strutBot > 0.15) {
        const strut = makeBox(0.07, strutTop - strutBot, 0.07, mats.brace)
        strut.position.set(wx(W / 2), (strutBot + strutTop) / 2, wz(pz))
        structure.add(strut)
      }
    }
  }

  // Spær på tvers, følger takfallet
  const addRafter = (x1: number, x2: number, z: number, group: THREE.Group, thickY: number, widthZ: number, mat: THREE.Material, yOffset: number) => {
    const y1 = roofY(c, e, x1)
    const y2 = roofY(c, e, x2)
    const dx = x2 - x1
    const dy = y2 - y1
    const len = Math.hypot(dx, dy)
    const cx = (x1 + x2) / 2
    const cy = (y1 + y2) / 2
    const box = makeBox(len, thickY, widthZ, mat)
    box.position.set(wx(cx), cy + yOffset, wz(z))
    box.rotation.z = Math.atan2(dy, dx)
    group.add(box)
    return { len, cx, cy }
  }

  const spærZs = spread(0.024, L - 0.024, antallSpær(c))
  for (const sz of spærZs) {
    if (c.taktype === 'saltak') {
      addRafter(-oh, W / 2, sz, structure, jh, RAFTER_W, mats.beam, jh / 2)
      addRafter(W / 2, W + oh, sz, structure, jh, RAFTER_W, mats.beam, jh / 2)
    } else {
      addRafter(-oh, W + oh, sz, structure, jh, RAFTER_W, mats.beam, jh / 2)
    }
  }

  // Takflate (covering) – brede plater som følger spærene
  const roofWidthZ = L + 2 * oh
  if (c.taktype === 'saltak') {
    addRafter(-oh, W / 2, L / 2, roof, 0.04, roofWidthZ, mats.roof, jh + 0.04)
    addRafter(W / 2, W + oh, L / 2, roof, 0.04, roofWidthZ, mats.roof, jh + 0.04)
  } else {
    addRafter(-oh, W + oh, L / 2, roof, 0.04, roofWidthZ, mats.roof, jh + 0.04)
  }

  // Vindski langs gavlkantene (z = -oh og z = L+oh)
  for (const gz of [-oh + 0.02, L + oh - 0.02]) {
    if (c.taktype === 'saltak') {
      addRafter(-oh, W / 2, gz, roof, 0.18, 0.022, mats.brace, jh + 0.02)
      addRafter(W / 2, W + oh, gz, roof, 0.18, 0.022, mats.brace, jh + 0.02)
    } else {
      addRafter(-oh, W + oh, gz, roof, 0.18, 0.022, mats.brace, jh + 0.02)
    }
  }

  // Takrenne langs lav(e) raft + nedløp
  const renneSider = c.taktype === 'saltak' ? [leftX, rightX] : [leftX]
  for (const rx of renneSider) {
    const eave = rx === leftX ? e.left : e.right
    const renne = makeBox(0.08, 0.07, beamZLen, mats.metal)
    renne.position.set(wx(rx - s / 2 - 0.04), eave - 0.06, 0)
    roof.add(renne)
    // nedløp i hver ende
    for (const nz of [s / 2, L - s / 2]) {
      const pipe = makeBox(0.05, eave, 0.05, mats.metal)
      pipe.position.set(wx(rx - s / 2 - 0.04), eave / 2, wz(nz))
      roof.add(pipe)
    }
  }

  // Vegger med eventuelle akrylvinduer
  if (c.veggtype !== 'ingen') {
    for (const side of c.veggSider) buildVegg(walls, c, side, s, e, mats, wx, wz)
  }

  const topY = Math.max(e.left, e.right, e.ridge) + jh + 0.1
  return { modelW: W, modelL: L, topY }
}

function buildVegg(
  group: THREE.Group,
  c: CarportConfig,
  side: Carportside,
  s: number,
  e: Eaves,
  mats: Materials,
  wx: (m: number) => number,
  wz: (m: number) => number,
) {
  const W = c.bredde
  const L = c.lengde
  const t = 0.03

  // Geometri per side: senterlinje, lengde, rotasjon, vegghøyde
  let cx: number, cz: number, len: number, rotY: number, høyde: number
  if (side === 'venstre') {
    cx = s / 2; cz = L / 2; len = L; rotY = Math.PI / 2; høyde = e.left
  } else if (side === 'høyre') {
    cx = W - s / 2; cz = L / 2; len = L; rotY = Math.PI / 2; høyde = e.right
  } else if (side === 'front') {
    cx = W / 2; cz = L - s / 2; len = W; rotY = 0; høyde = Math.min(e.left, e.right)
  } else {
    cx = W / 2; cz = s / 2; len = W; rotY = 0; høyde = Math.min(e.left, e.right)
  }

  const addPanel = (y0: number, y1: number, mat: THREE.Material) => {
    const h = y1 - y0
    if (h <= 0.01) return
    const panel = makeBox(len, h, t, mat)
    panel.position.set(wx(cx), (y0 + y1) / 2, wz(cz))
    panel.rotation.y = rotY
    group.add(panel)
  }

  const bunn = 0.05
  if (c.veggtype === 'panel') {
    addPanel(bunn, høyde, mats.panel)
  } else if (c.veggtype === 'akryl') {
    addPanel(bunn, høyde, mats.acryl)
  } else {
    // kombinert: panel 0,05–1,05 m, akryl over
    const skille = Math.min(1.05, høyde)
    addPanel(bunn, skille, mats.panel)
    addPanel(skille, høyde, mats.acryl)
  }
}

function frameCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  modelW: number,
  modelL: number,
  topY: number,
  keepAngle = false,
) {
  const maxDim = Math.max(modelW, modelL, topY, 2)
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

export default function CarportVisualizer({ config, onConfigChange, prosjekt, snapshotRef }: Props) {
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
    walls: THREE.Group
    mats: Materials
    resizeObserver: ResizeObserver
    scene: THREE.Scene
    dims: { modelW: number; modelL: number; topY: number }
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
    controls.minDistance = 2
    controls.maxDistance = 80
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

    const mats: Materials = {
      post: new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.82, metalness: 0.04 }),
      beam: new THREE.MeshStandardMaterial({ color: 0xa07e4d, roughness: 0.82, metalness: 0.04 }),
      brace: new THREE.MeshStandardMaterial({ color: 0x977748, roughness: 0.85, metalness: 0.04 }),
      roof: new THREE.MeshStandardMaterial({ color: 0x6b6f74, roughness: 0.55, metalness: 0.2 }),
      panel: new THREE.MeshStandardMaterial({ color: 0xb0895a, roughness: 0.8, metalness: 0.04 }),
      acryl: new THREE.MeshStandardMaterial({ color: 0xcfe0e6, roughness: 0.15, metalness: 0, transparent: true, opacity: 0.4 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x8f8f8f, roughness: 0.6, metalness: 0.3 }),
    }

    const structure = new THREE.Group()
    const roof = new THREE.Group()
    const walls = new THREE.Group()
    scene.add(structure, roof, walls)

    const { modelW, modelL, topY } = buildModel(structure, roof, walls, config, mats)
    frameCamera(camera, controls, modelW, modelL, topY)

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
      renderer, camera, controls, structure, roof, walls, mats, resizeObserver, scene,
      dims: { modelW, modelL, topY },
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
    const s = sceneRef.current
    if (!s) return
    const { modelW, modelL, topY } = buildModel(s.structure, s.roof, s.walls, config, s.mats)
    s.dims = { modelW, modelL, topY }
    applyMode(s, mode)
    frameCamera(s.camera, s.controls, modelW, modelL, topY, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    applyMode(s, mode)
  }, [mode])

  useEffect(() => {
    if (!snapshotRef) return
    snapshotRef.current = () => {
      const s = sceneRef.current
      if (!s) return null
      const { renderer, camera, controls, scene, dims } = s
      const savedPos = camera.position.clone()
      const savedTarget = controls.target.clone()
      const savedAutoRotate = controls.autoRotate
      controls.autoRotate = false
      frameCamera(camera, controls, dims.modelW, dims.modelL, dims.topY, false)
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
    const s = sceneRef.current
    if (!s) return
    const dest = isFullscreen ? fsContainerRef.current : containerRef.current
    if (!dest) return
    const canvas = s.renderer.domElement
    if (canvas.parentElement !== dest) dest.insertBefore(canvas, dest.firstChild)
    if (isFullscreen && fsContainerRef.current) s.resizeObserver.observe(fsContainerRef.current)
    const w = dest.clientWidth
    const h = dest.clientHeight
    if (w && h) {
      s.camera.aspect = w / h
      s.camera.updateProjectionMatrix()
      s.renderer.setSize(w, h, false)
    }
  }, [isFullscreen])

  const handleZoom = (direction: 'in' | 'out') => {
    const s = sceneRef.current
    if (!s) return
    const { camera, controls } = s
    const offset = camera.position.clone().sub(controls.target)
    const factor = direction === 'in' ? 0.82 : 1.22
    const dist = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * factor))
    offset.normalize().multiplyScalar(dist)
    camera.position.copy(controls.target).add(offset)
  }

  const update = (patch: Partial<CarportConfig>) => onConfigChange?.({ ...config, ...patch })
  const toggleSide = (side: Carportside) =>
    update({
      veggSider: config.veggSider.includes(side)
        ? config.veggSider.filter((x) => x !== side)
        : [...config.veggSider, side],
    })

  const MODES: Array<[ViewMode, string]> = [
    ['ferdig', 'Ferdig'],
    ['konstruksjon', 'Konstruksjon'],
    ['begge', 'Begge'],
  ]

  const controls = (fs: boolean) => (
    <>
      {fs && <FullscreenLogo src="/images/branding/logo_icon_white.webp" alt="Minio" />}
      {prosjekt && (
        <ProsjektMeny prosjekt={prosjekt} beskriv={(c) => `${MONTERING_INFO[c.montering].navn} · ${TAK_INFO[c.taktype].navn}`} navnPlaceholder="F.eks. Carport innkjørsel" />
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
                  <SidebarTitle>Tilpass carporten</SidebarTitle>
                  <SidebarClose onClick={() => setIsFullscreen(false)} aria-label="Lukk">&times;</SidebarClose>
                </SidebarHeader>
                <SidebarBody>
                  <SbSection>
                    <SbLabel>Montering</SbLabel>
                    <SegRow>
                      {ALLE_MONTERING.map((m: Montering) => (
                        <SegBtn key={m} $active={config.montering === m} onClick={() => update({ montering: m })}>
                          {MONTERING_INFO[m].navn}
                        </SegBtn>
                      ))}
                    </SegRow>
                  </SbSection>

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
                          onChange={(ev) => update({ [key]: +ev.target.value } as Partial<CarportConfig>)}
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
                    {config.taktype !== 'flatt' && (
                      <SbSliderGroup style={{ marginTop: '0.85rem' }}>
                        <SbSliderRow>
                          <SbSliderName>Takvinkel</SbSliderName>
                          <SbSliderVal>{config.takvinkel}°</SbSliderVal>
                        </SbSliderRow>
                        <SbSlider
                          type="range"
                          min={3}
                          max={35}
                          step={1}
                          value={config.takvinkel}
                          onChange={(ev) => update({ takvinkel: +ev.target.value })}
                        />
                      </SbSliderGroup>
                    )}
                  </SbSection>

                  <SbSection>
                    <SbLabel>Taktekke</SbLabel>
                    <SegRow>
                      {ALLE_TAKTEKKE.map((t: Taktekke) => (
                        <SegBtn key={t} $active={config.taktekke === t} onClick={() => update({ taktekke: t, prisTaktekkePerM2: TAKTEKKE_INFO[t].standardpris })}>
                          {TAKTEKKE_INFO[t].navn}
                        </SegBtn>
                      ))}
                    </SegRow>
                  </SbSection>

                  <SbSection>
                    <SbLabel>Vegger</SbLabel>
                    <SegRow>
                      {ALLE_VEGGTYPER.map((t: Veggtype) => (
                        <SegBtn key={t} $active={config.veggtype === t} onClick={() => update({ veggtype: t })}>
                          {VEGG_INFO[t].navn}
                        </SegBtn>
                      ))}
                    </SegRow>
                    {config.veggtype !== 'ingen' && (
                      <SideToggleRow>
                        {ALLE_SIDER.map((side: Carportside) => (
                          <SegBtn key={side} $active={config.veggSider.includes(side)} onClick={() => toggleSide(side)}>
                            {SIDE_INFO[side]}
                          </SegBtn>
                        ))}
                      </SideToggleRow>
                    )}
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
  s: { structure: THREE.Group; roof: THREE.Group; walls: THREE.Group; mats: Materials },
  mode: ViewMode,
) {
  s.roof.visible = mode !== 'konstruksjon'
  s.walls.visible = mode !== 'konstruksjon'
  const transparent = mode === 'begge'
  const roofPoly = s.mats.roof.color.getHex() === 0xcfe0e6
  s.mats.roof.transparent = transparent || roofPoly
  s.mats.roof.opacity = transparent ? 0.3 : roofPoly ? 0.5 : 1
  s.mats.roof.needsUpdate = true
  s.mats.panel.transparent = transparent
  s.mats.panel.opacity = transparent ? 0.35 : 1
  s.mats.panel.needsUpdate = true
}
