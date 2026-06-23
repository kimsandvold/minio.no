import { useRef, useEffect, useState, type MutableRefObject } from 'react'
import { createPortal } from 'react-dom'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useScrollLock } from '../../../hooks/useScrollLock'
import ProsjektMeny from '../../shared/planlegger/ProsjektMeny'
import type { ProsjektStyring } from './usePergolaProsjekter'
import {
  SidebarPanel, SidebarHeader, SidebarTitle, SidebarClose, SidebarBody,
  SbSection, SbLabel, SbSliderGroup, SbSliderRow, SbSliderName, SbSliderVal, SbSlider,
  SegRow, SegBtn,
} from '../../shared/FullscreenSidebar'
import {
  type PergolaConfig,
  type Montering,
  type Taktype,
  type Skjermtype,
  type Pergolaside,
  BJELKE_INFO,
  MONTERING_INFO,
  TAK_INFO,
  SKJERM_INFO,
  SIDE_INFO,
  MÅLEFELT,
  ALLE_MONTERING,
  ALLE_TAKTYPER,
  ALLE_SKJERMTYPER,
  ALLE_SIDER,
  stolperPerRad,
  antallSpær,
  antallLekter,
} from './pergolaModel'

type ViewMode = 'ferdig' | 'konstruksjon' | 'begge'

interface Props {
  config: PergolaConfig
  onConfigChange?: (config: PergolaConfig) => void
  prosjekt?: ProsjektStyring
  // Settes av visualiseringen: fanger modellen fra standard-perspektivet (til PDF).
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

// ── Materialer / mål ─────────────────────────────────────────────────────────

const BEAM_W = 0.096 // dragerbredde (langs z)
const RAFTER_W = 0.048 // spærbredde (langs x)
const SLAT_T = 0.04 // takslektens tykkelse (langs z)
const SLAT_H = 0.028

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
  post: THREE.MeshStandardMaterial
  beam: THREE.MeshStandardMaterial
  slat: THREE.MeshStandardMaterial
  glass: THREE.MeshStandardMaterial
  screen: THREE.MeshStandardMaterial
  metal: THREE.MeshStandardMaterial
}

/** Jevnt fordelte posisjoner mellom lo og hi (n ≥ 2 gir endepunktene). */
function spread(lo: number, hi: number, n: number): number[] {
  if (n <= 1) return [(lo + hi) / 2]
  const step = (hi - lo) / (n - 1)
  return Array.from({ length: n }, (_, i) => lo + i * step)
}

function buildModel(
  structure: THREE.Group,
  cover: THREE.Group,
  screens: THREE.Group,
  c: PergolaConfig,
  mats: Materials,
) {
  disposeGroup(structure)
  disposeGroup(cover)
  disposeGroup(screens)

  const W = c.bredde
  const D = c.dybde
  const H = c.høyde
  const s = c.stolpeDim === '148x148' ? 0.148 : 0.098
  const jh = BJELKE_INFO[c.bjelkeDim].høyde / 1000

  const beamCenterY = H + jh / 2 // drager oppå stolpene
  const rafterCenterY = H + jh + jh / 2 // spær oppå dragerne
  const rafterTop = H + 2 * jh
  const topY = rafterTop

  const wx = (mx: number) => mx - W / 2
  const wz = (mz: number) => mz - D / 2

  const frittstående = c.montering === 'frittstående'

  // Stolperader (z-posisjon): front alltid; bak kun ved frittstående.
  const frontZ = D - s / 2
  const bakZ = s / 2
  const postRows = frittstående ? [bakZ, frontZ] : [frontZ]
  const postXs = spread(s / 2, W - s / 2, stolperPerRad(c))

  // Stolper + stolpesko
  for (const pz of postRows) {
    for (const px of postXs) {
      const post = makeBox(s, H, s, mats.post)
      post.position.set(wx(px), H / 2, wz(pz))
      structure.add(post)
      const sko = makeBox(s * 1.1, 0.08, s * 1.1, mats.metal)
      sko.position.set(wx(px), 0.04, wz(pz))
      structure.add(sko)
    }
  }

  // Dragere (langs x) oppå stolperadene. Veggmontert: front-drager + veggfeste i bak.
  const dragerZs = frittstående ? [bakZ, frontZ] : [frontZ]
  for (const dz of dragerZs) {
    const drager = makeBox(W, jh, BEAM_W, mats.beam)
    drager.position.set(0, beamCenterY, wz(dz))
    structure.add(drager)
  }
  if (!frittstående) {
    // Veggfeste / ledger mot huset (z = 0)
    const ledger = makeBox(W, jh, BEAM_W, mats.beam)
    ledger.position.set(0, beamCenterY, wz(0.02 + BEAM_W / 2))
    structure.add(ledger)
  }

  // Spær (langs z) oppå dragerne
  const spærXs = spread(0.024, W - 0.024, antallSpær(c))
  for (const sx of spærXs) {
    const rafter = makeBox(RAFTER_W, jh, D, mats.beam)
    rafter.position.set(wx(sx), rafterCenterY, 0)
    structure.add(rafter)
  }

  // Tak / solskjerm
  if (c.taktype === 'lekter' || c.taktype === 'spjeld') {
    const lektZs = spread(0.04, D - 0.04, antallLekter(c))
    const tilt = c.taktype === 'spjeld' ? Math.PI / 6 : 0
    for (const lz of lektZs) {
      const slat = makeBox(W, SLAT_H, SLAT_T, mats.slat)
      slat.position.set(0, rafterTop + SLAT_H / 2, wz(lz))
      slat.rotation.x = tilt
      cover.add(slat)
    }
  } else if (c.taktype === 'tett') {
    const panel = makeBox(W + 0.1, 0.03, D + 0.1, mats.glass)
    panel.position.set(0, rafterTop + 0.05, 0)
    cover.add(panel)
  }

  // Sideskjermer
  for (const side of c.skjermSider) {
    if (c.skjermtype === 'ingen') break
    byggSkjerm(screens, c, side, s, H, mats.screen, mats.glass, wx, wz, frittstående)
  }

  return { modelW: W, modelD: D, topY }
}

type Pt = [number, number]

/** Endepunktene (modellkoordinater) for skjermen på en gitt side, langs stolpelinjen. */
function sideEndepunkter(c: PergolaConfig, side: Pergolaside, s: number, frittstående: boolean): [Pt, Pt] {
  const W = c.bredde
  const D = c.dybde
  const frontZ = D - s / 2
  const bakZ = frittstående ? s / 2 : 0.05
  switch (side) {
    case 'front':
      return [[s / 2, frontZ], [W - s / 2, frontZ]]
    case 'bak':
      return [[s / 2, bakZ], [W - s / 2, bakZ]]
    case 'venstre':
      return [[s / 2, bakZ], [s / 2, frontZ]]
    case 'høyre':
      return [[W - s / 2, bakZ], [W - s / 2, frontZ]]
  }
}

function byggSkjerm(
  parent: THREE.Group,
  c: PergolaConfig,
  side: Pergolaside,
  s: number,
  H: number,
  screenMat: THREE.Material,
  glassMat: THREE.Material,
  wx: (m: number) => number,
  wz: (m: number) => number,
  frittstående: boolean,
) {
  const [a, b] = sideEndepunkter(c, side, s, frittstående)
  const ax = wx(a[0])
  const az = wz(a[1])
  const bx = wx(b[0])
  const bz = wz(b[1])
  const dx = bx - ax
  const dz = bz - az
  const len = Math.hypot(dx, dz)
  if (len < 0.1) return
  const cx = (ax + bx) / 2
  const cz = (az + bz) / 2
  const rotY = -Math.atan2(dz, dx)
  const bottom = 0.08
  const usableH = H - bottom - 0.05

  if (c.skjermtype === 'tett') {
    const panel = makeBox(len, usableH, 0.03, glassMat)
    panel.position.set(cx, bottom + usableH / 2, cz)
    panel.rotation.y = rotY
    parent.add(panel)
    return
  }

  if (c.skjermtype === 'horisontal') {
    const rows = Math.max(2, Math.round(usableH / 0.12))
    for (let i = 0; i <= rows; i++) {
      const y = bottom + usableH * (i / rows)
      const bar = makeBox(len, 0.07, 0.025, screenMat)
      bar.position.set(cx, y, cz)
      bar.rotation.y = rotY
      parent.add(bar)
    }
    return
  }

  // spalér – rutenett av smale spiler i begge retninger
  const vGap = 0.15
  const vCount = Math.max(1, Math.round(len / vGap))
  for (let k = 0; k <= vCount; k++) {
    const t = k / vCount
    const px = ax + dx * t
    const pz = az + dz * t
    const slat = makeBox(0.022, usableH, 0.022, screenMat)
    slat.position.set(px, bottom + usableH / 2, pz)
    slat.rotation.y = rotY
    parent.add(slat)
  }
  const hCount = Math.max(1, Math.round(usableH / 0.3))
  for (let k = 0; k <= hCount; k++) {
    const y = bottom + usableH * (k / hCount)
    const bar = makeBox(len, 0.022, 0.022, screenMat)
    bar.position.set(cx, y, cz)
    bar.rotation.y = rotY
    parent.add(bar)
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
  const target = new THREE.Vector3(0, topY * 0.45, 0)
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

export default function PergolaVisualizer({ config, onConfigChange, prosjekt, snapshotRef }: Props) {
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
    cover: THREE.Group
    screens: THREE.Group
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
    controls.minDistance = 2
    controls.maxDistance = 60
    controls.maxPolarAngle = Math.PI / 2.05
    controls.enablePan = false
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.6
    controls.addEventListener('start', () => {
      controls.autoRotate = false
    })

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

    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.ShadowMaterial({ opacity: 0.18 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.position.y = 0
    ground.receiveShadow = true
    scene.add(ground)

    // Naturlig/oljet tre + lett glassaktig takplate
    const mats: Materials = {
      post: new THREE.MeshStandardMaterial({ color: 0x8a6a40, roughness: 0.82, metalness: 0.04 }),
      beam: new THREE.MeshStandardMaterial({ color: 0xa07e4d, roughness: 0.82, metalness: 0.04 }),
      slat: new THREE.MeshStandardMaterial({ color: 0xb0895a, roughness: 0.8, metalness: 0.04 }),
      glass: new THREE.MeshStandardMaterial({ color: 0xdce7ec, roughness: 0.2, metalness: 0.0, transparent: true, opacity: 0.7 }),
      screen: new THREE.MeshStandardMaterial({ color: 0x97774a, roughness: 0.85, metalness: 0.04 }),
      metal: new THREE.MeshStandardMaterial({ color: 0x8f8f8f, roughness: 0.6, metalness: 0.3 }),
    }

    const structure = new THREE.Group()
    const cover = new THREE.Group()
    const screens = new THREE.Group()
    scene.add(structure, cover, screens)

    const { modelW, modelD, topY } = buildModel(structure, cover, screens, config, mats)

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
      renderer, camera, controls, structure, cover, screens, mats, resizeObserver, scene,
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

  // Gjenoppbygg ved konfigurasjonsendring
  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    const { modelW, modelD, topY } = buildModel(s.structure, s.cover, s.screens, config, s.mats)
    s.dims = { modelW, modelD, topY }
    applyMode(s, mode)
    frameCamera(s.camera, s.controls, modelW, modelD, topY, true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config])

  // Veksle visningsmodus
  useEffect(() => {
    const s = sceneRef.current
    if (!s) return
    applyMode(s, mode)
  }, [mode])

  // Eksponer snapshot fra standard-perspektivet (til PDF), og gjenopprett synsvinkelen.
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

  const update = (patch: Partial<PergolaConfig>) => onConfigChange?.({ ...config, ...patch })
  const toggleSide = (side: Pergolaside) =>
    update({
      skjermSider: config.skjermSider.includes(side)
        ? config.skjermSider.filter((s) => s !== side)
        : [...config.skjermSider, side],
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
        <ProsjektMeny prosjekt={prosjekt} beskriv={(c) => MONTERING_INFO[c.montering].navn} navnPlaceholder="F.eks. Pergola sørvest" />
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
                  <SidebarTitle>Tilpass pergolaen</SidebarTitle>
                  <SidebarClose onClick={() => setIsFullscreen(false)} aria-label="Lukk">
                    &times;
                  </SidebarClose>
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
                          onChange={(e) => update({ [key]: +e.target.value } as Partial<PergolaConfig>)}
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
                  </SbSection>

                  <SbSection>
                    <SbLabel>Sideskjerm</SbLabel>
                    <SegRow>
                      {ALLE_SKJERMTYPER.map((t: Skjermtype) => (
                        <SegBtn key={t} $active={config.skjermtype === t} onClick={() => update({ skjermtype: t })}>
                          {SKJERM_INFO[t].navn}
                        </SegBtn>
                      ))}
                    </SegRow>
                    {config.skjermtype !== 'ingen' && (
                      <SideToggleRow>
                        {ALLE_SIDER.map((side: Pergolaside) => (
                          <SegBtn key={side} $active={config.skjermSider.includes(side)} onClick={() => toggleSide(side)}>
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
  s: { structure: THREE.Group; cover: THREE.Group; screens: THREE.Group; mats: Materials },
  mode: ViewMode,
) {
  s.cover.visible = mode !== 'konstruksjon'
  s.screens.visible = mode !== 'konstruksjon'
  const transparent = mode === 'begge'
  for (const m of [s.mats.slat, s.mats.screen]) {
    m.transparent = transparent
    m.opacity = transparent ? 0.35 : 1
    m.depthWrite = !transparent
    m.needsUpdate = true
  }
  // Takplaten er alltid lett gjennomsiktig; gjør den svakere i «begge».
  s.mats.glass.opacity = transparent ? 0.3 : 0.7
  s.mats.glass.needsUpdate = true
}
