import { useRef, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useScrollLock } from '../../../hooks/useScrollLock'
import ProsjektMeny from './ProsjektMeny'
import type { ProsjektStyring } from './useTerrasseProsjekter'
import {
  SidebarPanel, SidebarHeader, SidebarTitle, SidebarClose, SidebarBody,
  SbSection, SbLabel, SbSliderGroup, SbSliderRow, SbSliderName, SbSliderVal, SbSlider,
  SegRow, SegBtn,
} from '../../shared/FullscreenSidebar'
import {
  type TerrasseConfig,
  type TerrasseForm,
  type Terrasseside,
  type Gjerdetype,
  type Rekt,
  BJELKE_INFO,
  FORM_INFO,
  GJERDE_INFO,
  SIDE_INFO,
  MÅLEFELT,
  ALLE_FORMER,
  ALLE_GJERDETYPER,
  ALLE_SIDER,
  modellRekter,
  normalizedDimensions,
  trappRektModell,
  formOutline,
  nyTrapp,
} from './terrasseModel'

type ViewMode = 'ferdig' | 'konstruksjon' | 'begge'

interface Props {
  config: TerrasseConfig
  onConfigChange?: (config: TerrasseConfig) => void
  prosjekt?: ProsjektStyring
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

  /* På mobil holdes modellen alltid synlig (sticky), så den får fast, lavere høyde. */
  @media (max-width: 768px) {
    aspect-ratio: auto;
    height: 40vh;
  }
`

// Fullskjerm rendres via portal til <body> så sideoppsettet aldri påvirkes.
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

  /* På mobil ligger prosjektmenyen øverst – flytt modusvelgeren ned så de ikke kolliderer. */
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

  /* Skjul på mobil – modusvelgeren tar nå bunn-senter, og touch-rotasjon er selvforklarende. */
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

const SbButton = styled.button`
  width: 100%;
  padding: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  color: #fff;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.12);
  }
`

const TrappRowMini = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 0.6rem;
  margin-bottom: 0.6rem;
`

const TrappRemove = styled.button`
  background: transparent;
  border: none;
  color: #e06666;
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0;
`

// ── Materialer / mål ─────────────────────────────────────────────────────────

const DEFAULT_DECK_TOP = 0.6
const BOARD_THICKNESS = 0.028
const POST_SIZE = 0.07

// Dekkhøyden bestemmes av trappa: hvert trinn har standard opptrinn (høyde), så
// flere trinn = høyere terrasse. Uten trapp brukes en standard lav dekkhøyde.
function deckTopFor(c: TerrasseConfig): number {
  const maxTrinn = c.trapper.reduce((m, t) => Math.max(m, t.antallTrinn), 0)
  return maxTrinn > 0 ? maxTrinn * c.trappOpptrinn : DEFAULT_DECK_TOP
}

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
    if (child instanceof THREE.Group) {
      disposeGroup(child)
    } else if (child instanceof THREE.Mesh) {
      child.geometry?.dispose()
    }
    group.remove(child)
  })
}

interface Materials {
  board: THREE.MeshStandardMaterial
  rim: THREE.MeshStandardMaterial
  beam: THREE.MeshStandardMaterial
  metal: THREE.MeshStandardMaterial
}

const midX = (r: Rekt) => r.x + r.width / 2
const midY = (r: Rekt) => r.y + r.height / 2

function buildModel(
  finished: THREE.Group,
  framing: THREE.Group,
  always: THREE.Group,
  c: TerrasseConfig,
  mats: Materials,
) {
  disposeGroup(finished)
  disposeGroup(framing)
  disposeGroup(always)

  const size = normalizedDimensions(c)
  const modelW = size.width
  const modelH = size.height
  const rekter = modellRekter(c)

  const deckTop = deckTopFor(c)
  const jh = BJELKE_INFO[c.bjelkeDimensjon].høyde / 1000
  const boardBottom = deckTop - BOARD_THICKNESS
  const joistTop = boardBottom
  const joistBottom = joistTop - jh

  const wx = (mx: number) => mx - modelW / 2
  const wz = (my: number) => my - modelH / 2

  for (const r of rekter) {
    // Ferdig: solid bjelkeband (gir tykk terrassekant)
    const band = makeBox(r.width, jh, r.height, mats.rim)
    band.position.set(wx(midX(r)), joistTop - jh / 2, wz(midY(r)))
    finished.add(band)

    // Ferdig: terrassebord på langs med 3 mm luft mellom hvert bord
    const plankW = Math.max(0.04, c.bordbredde / 1000)
    const gap = c.bordavstand / 1000
    let x = r.x
    while (x < r.x + r.width - 0.001) {
      const wActual = Math.min(plankW, r.x + r.width - x)
      const plank = makeBox(wActual, BOARD_THICKNESS, r.height, mats.board)
      plank.position.set(wx(x + wActual / 2), deckTop - BOARD_THICKNESS / 2, wz(midY(r)))
      finished.add(plank)
      x += plankW + gap
    }

    // Konstruksjon: bjelker på tvers, med bjelkeavstand langs Z
    const dj = Math.max(0.1, c.bjelkeavstand / 1000)
    let y = r.y
    while (y <= r.y + r.height + 0.001) {
      const joist = makeBox(r.width, jh, 0.048, mats.beam)
      joist.position.set(wx(midX(r)), joistTop - jh / 2, wz(Math.min(y, r.y + r.height)))
      framing.add(joist)
      y += dj
    }
    // Konstruksjon: sidebjelker ved hver langside
    for (const edgeX of [r.x + 0.024, r.x + r.width - 0.024]) {
      const sideBeam = makeBox(0.048, jh, r.height, mats.beam)
      sideBeam.position.set(wx(edgeX), joistTop - jh / 2, wz(midY(r)))
      framing.add(sideBeam)
    }

    // Stolper i hjørnene
    const postH = Math.max(0.05, joistBottom)
    for (const cx of [r.x + 0.1, r.x + r.width - 0.1]) {
      for (const cy of [r.y + 0.1, r.y + r.height - 0.1]) {
        const post = makeBox(POST_SIZE, postH, POST_SIZE, mats.metal)
        post.position.set(wx(cx), postH / 2, wz(cy))
        framing.add(post)
      }
    }
  }

  // Gjerde / rekkverk – kun på yttersidene (ikke mot huset, ikke der trapp står)
  if (c.gjerdeType !== 'ingen') {
    byggGjerde(finished, c, size, modelW, modelH, deckTop, mats.rim)
  }

  // Trapper (alle moduser)
  for (const trapp of c.trapper) {
    byggTrapp(always, c, trapp, modelW, modelH, deckTop, mats.board)
  }

  return { modelW, modelH, deckTop }
}

// Kantindekser som ligger mot huset (ingen gjerde der).
const HUS_KANTER: Record<TerrasseForm, number[]> = {
  rektangel: [0], // bakkanten (mot huset)
  lForm: [1, 2], // de to innersidene i hjørnet
  uForm: [3, 4, 5], // de tre innersidene i hesteskoen
}

type Pt = [number, number]
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]

/** Hvilken terrasseside en aksejustert ytterkant vender mot (for å matche trapp). */
function kantSide(a: Pt, b: Pt, modelW: number, modelH: number): Terrasseside | null {
  const eps = 1e-4
  if (Math.abs(a[1] - b[1]) < eps) {
    if (Math.abs(a[1] - modelH) < eps) return 'front'
    if (Math.abs(a[1]) < eps) return 'bak'
  }
  if (Math.abs(a[0] - b[0]) < eps) {
    if (Math.abs(a[0]) < eps) return 'venstre'
    if (Math.abs(a[0] - modelW) < eps) return 'høyre'
  }
  return null
}

function byggGjerde(
  parent: THREE.Group,
  c: TerrasseConfig,
  size: { width: number; height: number },
  modelW: number,
  modelH: number,
  deckTop: number,
  mat: THREE.Material,
) {
  const outline = formOutline(c) as Pt[]
  const husKanter = new Set(HUS_KANTER[c.form])
  const wx = (m: number) => m - modelW / 2
  const wz = (m: number) => m - modelH / 2
  const n = outline.length

  for (let i = 0; i < n; i++) {
    if (husKanter.has(i)) continue
    const a = outline[i]
    const b = outline[(i + 1) % n]
    const edgeLen = Math.hypot(b[0] - a[0], b[1] - a[1])
    if (edgeLen < 0.05) continue

    // Åpninger der trapper står på denne kanten
    const side = kantSide(a, b, modelW, modelH)
    const horizontal = Math.abs(a[1] - b[1]) < 1e-4
    const blocked: Array<[number, number]> = []
    if (side) {
      const margin = 0.12 / edgeLen
      for (const t of c.trapper) {
        if (t.side !== side) continue
        const fr = trappRektModell(c, t, size)
        const lo = horizontal ? fr.x : fr.y
        const hi = horizontal ? fr.x + fr.width : fr.y + fr.height
        const a0 = horizontal ? a[0] : a[1]
        const b0 = horizontal ? b[0] : b[1]
        let t0 = (lo - a0) / (b0 - a0)
        let t1 = (hi - a0) / (b0 - a0)
        if (t0 > t1) [t0, t1] = [t1, t0]
        t0 = Math.max(0, t0 - margin)
        t1 = Math.min(1, t1 + margin)
        if (t1 - t0 > 0.01) blocked.push([t0, t1])
      }
    }
    blocked.sort((p, q) => p[0] - q[0])

    // Bygg gjerde på de delene som ikke er blokkert
    let cursor = 0
    const runs: Array<[number, number]> = []
    for (const [s, e] of blocked) {
      if (s > cursor + 0.001) runs.push([cursor, s])
      cursor = Math.max(cursor, e)
    }
    if (cursor < 0.999) runs.push([cursor, 1])

    for (const [s, e] of runs) {
      const A = lerp(a, b, s)
      const B = lerp(a, b, e)
      byggGjerdeløp(parent, A, B, c.gjerdeHøyde, c.gjerdeType, deckTop, mat, wx, wz)
    }
  }
}

function byggGjerdeløp(
  parent: THREE.Group,
  A: Pt,
  B: Pt,
  høyde: number,
  type: Gjerdetype,
  deckTop: number,
  mat: THREE.Material,
  wx: (m: number) => number,
  wz: (m: number) => number,
) {
  const ax = wx(A[0])
  const az = wz(A[1])
  const bx = wx(B[0])
  const bz = wz(B[1])
  const dx = bx - ax
  const dz = bz - az
  const len = Math.hypot(dx, dz)
  if (len < 0.05) return
  const cx = (ax + bx) / 2
  const cz = (az + bz) / 2
  const rotY = -Math.atan2(dz, dx)
  const railY = deckTop + høyde

  // Stolper i hver ende av løpet
  for (const [px, pz] of [
    [ax, az],
    [bx, bz],
  ]) {
    const post = makeBox(0.07, høyde, 0.07, mat)
    post.position.set(px, deckTop + høyde / 2, pz)
    parent.add(post)
  }

  if (type === 'hel') {
    const panel = makeBox(len, høyde, 0.03, mat)
    panel.position.set(cx, deckTop + høyde / 2, cz)
    panel.rotation.y = rotY
    parent.add(panel)
    return
  }

  // Topp- og bunnrekke
  for (const ry of [railY, deckTop + 0.07]) {
    const rail = makeBox(len, 0.05, 0.05, mat)
    rail.position.set(cx, ry, cz)
    rail.rotation.y = rotY
    parent.add(rail)
  }

  if (type === 'vannrett') {
    const rows = Math.max(1, Math.round(høyde / 0.18))
    for (let rIdx = 1; rIdx < rows; rIdx++) {
      const y = deckTop + høyde * (rIdx / rows)
      const rail = makeBox(len, 0.09, 0.025, mat)
      rail.position.set(cx, y, cz)
      rail.rotation.y = rotY
      parent.add(rail)
    }
  } else {
    // loddrett / spiler: vertikale spiler
    const gap = type === 'spiler' ? 0.1 : 0.13
    const count = Math.max(1, Math.floor(len / gap))
    for (let k = 0; k <= count; k++) {
      const t = k / count
      const px = ax + dx * t
      const pz = az + dz * t
      const baluster = makeBox(0.03, høyde - 0.08, 0.03, mat)
      baluster.position.set(px, deckTop + (høyde - 0.08) / 2 + 0.03, pz)
      baluster.rotation.y = rotY
      parent.add(baluster)
    }
  }
}

function byggTrapp(
  parent: THREE.Group,
  c: TerrasseConfig,
  trapp: TerrasseConfig['trapper'][number],
  modelW: number,
  modelH: number,
  deckTop: number,
  mat: THREE.Material,
) {
  const size = normalizedDimensions(c)
  const fr = trappRektModell(c, trapp, size)
  // Antall trinn som trengs for å nå dekkhøyden med standard opptrinn. Dekkhøyden
  // styres av trappa med flest trinn, så hver trapp får like høye, standard trinn.
  const n = Math.max(1, Math.round(deckTop / c.trappOpptrinn))
  const riser = c.trappOpptrinn
  const tread = c.trappInntrinn
  const width = trapp.bredde

  const wx = (mx: number) => mx - modelW / 2
  const wz = (my: number) => my - modelH / 2

  for (let i = 0; i < n; i++) {
    const topY = deckTop - (i + 1) * riser
    const centerY = topY + riser / 2
    let step: THREE.Mesh
    switch (trapp.side) {
      case 'front':
        step = makeBox(width, riser, tread, mat)
        step.position.set(wx(midX(fr)), centerY, wz(modelH + (i + 0.5) * tread))
        break
      case 'bak':
        step = makeBox(width, riser, tread, mat)
        step.position.set(wx(midX(fr)), centerY, wz(-(i + 0.5) * tread))
        break
      case 'venstre':
        step = makeBox(tread, riser, width, mat)
        step.position.set(wx(-(i + 0.5) * tread), centerY, wz(midY(fr)))
        break
      case 'høyre':
        step = makeBox(tread, riser, width, mat)
        step.position.set(wx(modelW + (i + 0.5) * tread), centerY, wz(midY(fr)))
        break
    }
    parent.add(step)
  }
}

function frameCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  modelW: number,
  modelH: number,
  deckTop: number,
  keepAngle = false,
) {
  const maxDim = Math.max(modelW, modelH, 2)
  const target = new THREE.Vector3(0, deckTop * 0.4, 0)
  const defaultPos = new THREE.Vector3(maxDim * 0.9, maxDim * 0.85 + deckTop, maxDim * 1.15)
  // Avstanden som rammer inn hele modellen – klemt innenfor zoom-grensene.
  const fitDist = Math.min(
    controls.maxDistance,
    Math.max(controls.minDistance, defaultPos.distanceTo(target)),
  )

  // Behold synsvinkelen brukeren har rotert til, men skaler avstanden så hele
  // terrassen alltid får plass når mål endres eller elementer legges til.
  const dir = camera.position.clone().sub(controls.target)
  if (!keepAngle || dir.lengthSq() < 1e-6) dir.copy(defaultPos).sub(target)
  dir.normalize().multiplyScalar(fitDist)

  controls.target.copy(target)
  camera.position.copy(target).add(dir)
  camera.lookAt(target)
  controls.update()
}

export default function TerrasseVisualizer({ config, onConfigChange, prosjekt }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const fsContainerRef = useRef<HTMLDivElement>(null)
  const [mode, setMode] = useState<ViewMode>('ferdig')
  const [isFullscreen, setIsFullscreen] = useState(false)
  useScrollLock(isFullscreen)

  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera
    controls: OrbitControls
    finished: THREE.Group
    framing: THREE.Group
    always: THREE.Group
    mats: Materials
    resizeObserver: ResizeObserver
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
    controls.maxDistance = 60
    controls.maxPolarAngle = Math.PI / 2.05
    controls.enablePan = false

    const ambient = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambient)

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

    // Myk kontaktskygge på gjennomsiktig bakke – samme stil som priskalkulatorene
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.receiveShadow = true
    scene.add(ground)

    // Trykkimpregnert (grønnlig) tre
    const mats: Materials = {
      board: new THREE.MeshStandardMaterial({ color: 0xb9bd8c, roughness: 0.85, metalness: 0.04 }),
      rim: new THREE.MeshStandardMaterial({ color: 0xa6ab7a, roughness: 0.85, metalness: 0.04 }),
      beam: new THREE.MeshStandardMaterial({ color: 0x99a06f, roughness: 0.9, metalness: 0.04 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x8f8f8f, roughness: 0.6, metalness: 0.3 }),
    }

    const finished = new THREE.Group()
    const framing = new THREE.Group()
    const always = new THREE.Group()
    scene.add(finished, framing, always)

    const { modelW, modelH, deckTop } = buildModel(finished, framing, always, config, mats)
    framing.visible = false

    frameCamera(camera, controls, modelW, modelH, deckTop)

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

    sceneRef.current = { renderer, camera, controls, finished, framing, always, mats, resizeObserver }

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

  // Gjenoppbygg ved konfigurasjonsendring
  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    const { modelW, modelH, deckTop } = buildModel(s.finished, s.framing, s.always, config, s.mats)
    applyMode(s, mode)
    frameCamera(s.camera, s.controls, modelW, modelH, deckTop, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  // Veksle visningsmodus
  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    applyMode(s, mode)
  }, [mode])

  // Esc lukker fullskjerm
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

  // Flytt canvas mellom innebygd visning og fullskjerm-portal (uten å re-initialisere)
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

  const update = (patch: Partial<TerrasseConfig>) => onConfigChange?.({ ...config, ...patch })
  const updateTrapp = (id: string, patch: Partial<TerrasseConfig['trapper'][number]>) =>
    update({ trapper: config.trapper.map((t) => (t.id === id ? { ...t, ...patch } : t)) })

  const MODES: Array<[ViewMode, string]> = [
    ['ferdig', 'Ferdig'],
    ['konstruksjon', 'Konstruksjon'],
    ['begge', 'Begge'],
  ]

  const controls = (fs: boolean) => (
    <>
      {fs && <FullscreenLogo src="/images/branding/logo_icon_white.webp" alt="Minio" />}
      {prosjekt && <ProsjektMeny prosjekt={prosjekt} />}
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
        <ZoomButton onClick={() => handleZoom('in')} aria-label="Zoom inn">
          +
        </ZoomButton>
        <ZoomButton onClick={() => handleZoom('out')} aria-label="Zoom ut">
          &minus;
        </ZoomButton>
        {fs ? (
          <ZoomButton onClick={() => setIsFullscreen(false)} aria-label="Lukk fullskjerm">
            &times;
          </ZoomButton>
        ) : (
          <FullscreenBtn onClick={() => setIsFullscreen(true)} aria-label="Fullskjerm">
            &#x26F6;
          </FullscreenBtn>
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
            <SidebarTitle>Tilpass terrassen</SidebarTitle>
            <SidebarClose onClick={() => setIsFullscreen(false)} aria-label="Lukk">
              &times;
            </SidebarClose>
          </SidebarHeader>
          <SidebarBody>
            <SbSection>
              <SbLabel>Form</SbLabel>
              <SegRow>
                {ALLE_FORMER.map((f: TerrasseForm) => (
                  <SegBtn key={f} $active={config.form === f} onClick={() => update({ form: f })}>
                    {FORM_INFO[f].navn}
                  </SegBtn>
                ))}
              </SegRow>
            </SbSection>

            <SbSection>
              <SbLabel>Mål</SbLabel>
              {MÅLEFELT[config.form].map(([key, label, min, max, step]) => (
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
                    onChange={(e) => update({ [key]: +e.target.value } as Partial<TerrasseConfig>)}
                  />
                </SbSliderGroup>
              ))}
            </SbSection>

            <SbSection>
              <SbLabel>Gjerde</SbLabel>
              <SegRow>
                {ALLE_GJERDETYPER.map((t: Gjerdetype) => (
                  <SegBtn key={t} $active={config.gjerdeType === t} onClick={() => update({ gjerdeType: t })}>
                    {GJERDE_INFO[t].navn}
                  </SegBtn>
                ))}
              </SegRow>
              {config.gjerdeType !== 'ingen' && (
                <SbSliderGroup style={{ marginTop: '0.85rem' }}>
                  <SbSliderRow>
                    <SbSliderName>Høyde</SbSliderName>
                    <SbSliderVal>{config.gjerdeHøyde.toFixed(1)} m</SbSliderVal>
                  </SbSliderRow>
                  <SbSlider
                    type="range"
                    min={0.3}
                    max={2.0}
                    step={0.1}
                    value={config.gjerdeHøyde}
                    onChange={(e) => update({ gjerdeHøyde: +e.target.value })}
                  />
                </SbSliderGroup>
              )}
            </SbSection>

            <SbSection>
              <SbLabel>Trapp</SbLabel>
              {config.trapper.map((t, i) => (
                <TrappRowMini key={t.id}>
                  <SbSliderRow>
                    <SbSliderName>Trapp {i + 1}</SbSliderName>
                    <TrappRemove onClick={() => update({ trapper: config.trapper.filter((x) => x.id !== t.id) })}>
                      Fjern
                    </TrappRemove>
                  </SbSliderRow>
                  <SegRow style={{ marginBottom: '0.6rem' }}>
                    {ALLE_SIDER.map((side: Terrasseside) => (
                      <SegBtn key={side} $active={t.side === side} onClick={() => updateTrapp(t.id, { side })}>
                        {SIDE_INFO[side]}
                      </SegBtn>
                    ))}
                  </SegRow>
                  <SbSliderGroup>
                    <SbSliderRow>
                      <SbSliderName>Antall trinn</SbSliderName>
                      <SbSliderVal>{t.antallTrinn}</SbSliderVal>
                    </SbSliderRow>
                    <SbSlider
                      type="range"
                      min={1}
                      max={20}
                      step={1}
                      value={t.antallTrinn}
                      onChange={(e) => updateTrapp(t.id, { antallTrinn: +e.target.value })}
                    />
                  </SbSliderGroup>
                </TrappRowMini>
              ))}
              <SbButton onClick={() => update({ trapper: [...config.trapper, nyTrapp()] })}>
                + Legg til trapp
              </SbButton>
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
  s: { finished: THREE.Group; framing: THREE.Group; mats: Materials },
  mode: ViewMode,
) {
  s.finished.visible = mode !== 'konstruksjon'
  s.framing.visible = mode !== 'ferdig'
  const transparent = mode === 'begge'
  for (const m of [s.mats.board, s.mats.rim]) {
    m.transparent = transparent
    m.opacity = transparent ? 0.4 : 1
    m.depthWrite = !transparent
    m.needsUpdate = true
  }
}
