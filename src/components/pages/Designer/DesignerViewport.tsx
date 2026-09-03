import { useRef, useEffect, type MutableRefObject } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { DesignConfig, DimensionSpec, PartMaterial, ProductTemplate } from '../../../designer/types'
import { makeWoodTexture } from '../../../designer/woodTexture'

export interface PartInfo { navn: string; profil: string; lengdeCm: number }
export type ViewPreset = 'iso' | 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'
export interface ViewApi {
  setView: (preset: ViewPreset) => void
  /** factor < 1 = zoom inn, > 1 = zoom ut. */
  zoom: (factor: number) => void
  /** Roter kamera rundt modellen (radianer). dTheta = venstre/høyre, dPhi = opp/ned. */
  orbit: (dTheta: number, dPhi: number) => void
  /** Render et PNG-snapshot ved gitt splittgrad (0 = montert, 1 = splittet). */
  snapshot: (explodeAmount: number, preset?: ViewPreset) => string
  /** Fjern markering av valgt del. */
  deselect: () => void
}

const Viewport = styled.div`
  position: absolute;
  inset: 0;
  touch-action: none;

  canvas {
    display: block;
    width: 100% !important;
    height: 100% !important;
  }
`

interface Props {
  template: ProductTemplate
  config: DesignConfig
  onConfigChange: (patch: Partial<DesignConfig>) => void
  /** Kalles når et håndtak dras, med det aktive målets label for HUD. */
  onDragLabel?: (label: string | null) => void
  /** Vis kontaktskygge under modellen. */
  shadows?: boolean
  /** Splittvisning 0–1 (0 = montert, 1 = fullt adskilt). */
  explode?: number
  /** Vis dra-håndtakene i 3D. */
  showHandles?: boolean
  /** Lysstyrke-multiplikator (1 = normal). */
  lightIntensity?: number
  /** Solretning (grader, 0–360) – styrer skyggeretning. */
  sunAzimuth?: number
  /** Solhøyde (grader, 5–85) – lav sol = lange skygger. */
  sunElevation?: number
  /** Vis dis/tåke i bakgrunnen. */
  fog?: boolean
  /** Vis diskré gulvrutenett i bakken. */
  showGrid?: boolean
  /** Realistisk trestruktur på materialene. */
  woodTexture?: boolean
  /** Komma-separerte del-nøkler (userData.part) som skjules – f.eks. «kledning,gulv» for å se konstruksjonen. */
  hiddenParts?: string
  /** Per-del materialoverstyring (paint bucket). */
  overrides?: Record<string, PartMaterial>
  /** Paint bucket-modus aktiv. */
  paintMode?: boolean
  /** Kalles med del-nøkkelen når en del males. */
  onPaint?: (partKey: string) => void
  /** Kalles når musepekeren er over en del (eller null). */
  onHoverPart?: (info: PartInfo | null) => void
  /** Kalles når en del velges med klikk (eller null ved avvelging). */
  onSelectPart?: (info: PartInfo | null) => void
  /** Fylles med kamera-API (hurtigvinkler + zoom) når scenen er klar. */
  apiRef?: MutableRefObject<ViewApi | null>
  /** Myk «vis frem»-animasjon (rotasjon + vipp) på/av. */
  showcase?: boolean
  /** Kalles når brukeren tar tak i scenen (dra/zoom/berøring) – stopper «vis frem». */
  onInteract?: () => void
}

const HANDLE_R = 0.055

interface HandleData {
  dim: DimensionSpec
  sign: number // 1 for symmetriske akser, brukt til plassering
}

export default function DesignerViewport({ template, config, onConfigChange, onDragLabel, shadows = true, explode = 0, showHandles = true, lightIntensity = 1, sunAzimuth = 40, sunElevation = 55, fog = false, showGrid = false, woodTexture = false, hiddenParts = '', overrides, paintMode = false, onPaint, onHoverPart, onSelectPart, apiRef, showcase = false, onInteract }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)

  // Ferske verdier til event-handlere uten å bygge scenen på nytt hver render.
  const templateRef = useRef(template)
  const configRef = useRef(config)
  const onChangeRef = useRef(onConfigChange)
  const onDragLabelRef = useRef(onDragLabel)
  const explodeRef = useRef(explode) // mål for splittvisning (0–1)
  const explodeAnimRef = useRef(explode) // myk-animert verdi mot målet
  const showcaseRef = useRef(showcase) // «vis frem»-animasjon på/av
  const showcaseIdxRef = useRef(0) // hvilken vinkel i turen
  const showcaseHoldRef = useRef(0) // frames holdt på gjeldende vinkel
  const showcaseRadiusRef = useRef(3) // kamera-avstand (bevarer zoom)
  const showHandlesRef = useRef(showHandles)
  const overridesRef = useRef(overrides)
  const woodOnRef = useRef(woodTexture)
  const paintModeRef = useRef(paintMode)
  const onPaintRef = useRef(onPaint)
  const onHoverPartRef = useRef(onHoverPart)
  const onSelectPartRef = useRef(onSelectPart)
  const onInteractRef = useRef(onInteract)
  const woodTexRef = useRef<THREE.Texture | null>(null)
  const hiddenPartsRef = useRef(hiddenParts)

  // Hold refs synkronisert (kjøres før de øvrige effektene, i deklarasjonsrekkefølge).
  useEffect(() => {
    templateRef.current = template
    configRef.current = config
    onChangeRef.current = onConfigChange
    onDragLabelRef.current = onDragLabel
    explodeRef.current = explode
    showHandlesRef.current = showHandles
    overridesRef.current = overrides
    woodOnRef.current = woodTexture
    paintModeRef.current = paintMode
    onPaintRef.current = onPaint
    onHoverPartRef.current = onHoverPart
    onSelectPartRef.current = onSelectPart
    onInteractRef.current = onInteract
  })

  // Be om ny innramming når produktet byttes (håndteres i render-loopen, som
  // alltid kjører – uavhengig av effekt-timing/HMR).
  useEffect(() => {
    needsFrameRef.current = true
  }, [template.id])

  // «Vis frem» slås på: bevar zoom (avstand) og start turen forfra.
  useEffect(() => {
    showcaseRef.current = showcase
    const cam = cameraRef.current
    const ctr = controlsRef.current
    if (showcase && cam && ctr) {
      showcaseRadiusRef.current = cam.position.distanceTo(ctr.target)
      showcaseIdxRef.current = 0
      showcaseHoldRef.current = 0
    }
  }, [showcase])

  // Signal til rebuild-effekten: endres når geometri/materialer endres.
  const geomKey = JSON.stringify({ config, overrides, woodTexture })

  // Delte objekter mellom effekter.
  const sceneRef = useRef<THREE.Scene | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const controlsRef = useRef<OrbitControls | null>(null)
  const modelGroupRef = useRef<THREE.Group | null>(null)
  const handleGroupRef = useRef<THREE.Group | null>(null)
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null)
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null)
  const groundRef = useRef<THREE.Mesh | null>(null)
  const gridRef = useRef<THREE.GridHelper | null>(null)
  const needsFrameRef = useRef(true)
  const explodablesRef = useRef<{ obj: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3 }[]>([])
  const handlesRef = useRef<{ obj: THREE.Object3D; base: THREE.Vector3; dir: THREE.Vector3 }[]>([])
  // «Skinn»-deler (gulvdekke/kledning) som gjøres halvgjennomsiktige i splittvisning.
  const skinRef = useRef<THREE.MeshStandardMaterial[]>([])

  // --- Vis/skjul deler (kledning, gulv …) for å avdekke konstruksjonen ---
  useEffect(() => {
    hiddenPartsRef.current = hiddenParts
    const mg = modelGroupRef.current
    if (!mg) return
    const hidden = new Set(hiddenParts.split(',').filter(Boolean))
    mg.traverse((o) => {
      const p = o.userData.part as string | undefined
      if (p) o.visible = !hidden.has(p)
    })
    needsFrameRef.current = true
  }, [hiddenParts])

  // --- Scene-oppsett (kjøres én gang) ---
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    sceneRef.current = scene

    const camera = new THREE.PerspectiveCamera(42, 1, 0.05, 100)
    camera.position.set(2.4, 1.9, 2.8)
    cameraRef.current = camera

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    // Vi rydder bufferet manuelt: ellers ville render av ViewCube-scenen nullstille
    // fargen i sitt scissor-rektangel og etterlate en synlig firkant i hjørnet.
    renderer.autoClear = false
    mount.appendChild(renderer.domElement)

    // Lys – mykt studio-oppsett.
    const hemi = new THREE.HemisphereLight(0xffffff, 0xdcd6c8, 0.9)
    scene.add(hemi)
    hemiLightRef.current = hemi
    const key = new THREE.DirectionalLight(0xffffff, 1.5)
    key.position.set(3, 5, 2)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.shadow.camera.near = 0.5
    key.shadow.camera.far = 30
    key.shadow.camera.left = -8
    key.shadow.camera.right = 8
    key.shadow.camera.top = 8
    key.shadow.camera.bottom = -8
    key.shadow.bias = -0.0004
    scene.add(key)
    keyLightRef.current = key
    const fill = new THREE.DirectionalLight(0xffffff, 0.4)
    fill.position.set(-3, 2, -2)
    scene.add(fill)

    // Kontaktskygge på bakken.
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(40, 40),
      new THREE.ShadowMaterial({ opacity: 0.16 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)
    groundRef.current = ground

    // Diskré gulvrutenett (0,5 m ruter) som toner ut mot kantene. Per-vertex
    // alfa gir en jevn fade uavhengig av bakgrunnsfargen.
    // Diskré gulvrutenett med 50 × 50 cm ruter (40 m totalt / 80 ruter = 0,5 m).
    const grid = new THREE.GridHelper(40, 80, 0x9a927f, 0xbfb7a4)
    const gmat = grid.material as THREE.Material
    gmat.transparent = true
    gmat.opacity = 0.35
    grid.position.y = 0.002
    grid.visible = showGrid
    scene.add(grid)
    gridRef.current = grid

    const modelGroup = new THREE.Group()
    scene.add(modelGroup)
    modelGroupRef.current = modelGroup

    const handleGroup = new THREE.Group()
    scene.add(handleGroup)
    handleGroupRef.current = handleGroup

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 0.8
    controls.maxDistance = 12
    // Øvre polargrense settes dynamisk i animasjonsløkken (se GROUND_CLAMP)
    // slik at kameraet kan roteres helt ned mot bakken uten å gå under den.
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    controls.target.set(0, 0.4, 0)
    controlsRef.current = controls
    // Bruker tar tak i scenen (dra/zoom/pinch) → stopp «vis frem».
    controls.addEventListener('start', () => onInteractRef.current?.())

    // Flate dobbeltpiler (canvas) til dra-håndtak – tegnet én gang.
    // Dra-håndtak er ekte 3D dobbelpiler (bygges i modell-effekten).

    // --- ViewCube (navigasjonskube som i Fusion 360) ---
    const gizmoScene = new THREE.Scene()
    const gizmoCam = new THREE.OrthographicCamera(-2.05, 2.05, 2.05, -2.05, 0.1, 20)
    gizmoCam.position.set(0, 0, 6)
    gizmoCam.lookAt(0, 0, 0)

    const faceTex = (label: string) => {
      const c = document.createElement('canvas')
      c.width = 128
      c.height = 128
      const ctx = c.getContext('2d')!
      ctx.fillStyle = '#f2f4f7'
      ctx.fillRect(0, 0, 128, 128)
      ctx.strokeStyle = '#c7ced7'
      ctx.lineWidth = 5
      ctx.strokeRect(4, 4, 120, 120)
      ctx.fillStyle = '#262a30'
      ctx.font = '700 26px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, 64, 66)
      const t = new THREE.CanvasTexture(c)
      t.anisotropy = 4
      return t
    }
    // Farget bokstav (X/Y/Z) på gjennomsiktig bakgrunn – til akse-tuppene.
    const axisLabelTex = (label: string, css: string) => {
      const c = document.createElement('canvas')
      c.width = 64
      c.height = 64
      const ctx = c.getContext('2d')!
      ctx.fillStyle = css
      ctx.font = 'bold 46px system-ui, -apple-system, sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, 32, 34)
      const t = new THREE.CanvasTexture(c)
      t.anisotropy = 4
      return t
    }
    // Rekkefølge for BoxGeometry: +X, -X, +Y, -Y, +Z, -Z
    const cubeMats = ['HØYRE', 'VENSTRE', 'TOPP', 'BUNN', 'FRONT', 'BAK'].map(
      (l) => new THREE.MeshBasicMaterial({ map: faceTex(l) }),
    )
    const gizmoCube = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), cubeMats)
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(gizmoCube.geometry),
      new THREE.LineBasicMaterial({ color: 0x9c988e }),
    )
    gizmoCube.add(edges)
    // Fargede akse-piler ut fra hjørnet (X rød, Y grønn, Z blå) med bokstaver.
    const axOrigin = new THREE.Vector3(0.78, -0.78, 0.78)
    const mkAxis = (dir: THREE.Vector3, hex: number, css: string, label: string) => {
      const arrow = new THREE.ArrowHelper(dir, axOrigin, 0.95, hex, 0.28, 0.18)
      gizmoCube.add(arrow)
      const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: axisLabelTex(label, css), depthTest: false, transparent: true }))
      spr.position.copy(axOrigin).addScaledVector(dir, 1.0)
      spr.scale.set(0.42, 0.42, 1)
      gizmoCube.add(spr)
    }
    mkAxis(new THREE.Vector3(1, 0, 0), 0xd83b3b, '#d83b3b', 'X')
    mkAxis(new THREE.Vector3(0, 1, 0), 0x3aa655, '#3aa655', 'Y')
    mkAxis(new THREE.Vector3(0, 0, 1), 0x3b6fd8, '#3b6fd8', 'Z')
    gizmoScene.add(gizmoCube)

    const normalToPreset = (n: THREE.Vector3): ViewPreset | null => {
      if (n.x > 0.5) return 'right'
      if (n.x < -0.5) return 'left'
      if (n.y > 0.5) return 'top'
      if (n.y < -0.5) return 'bottom'
      if (n.z > 0.5) return 'front'
      if (n.z < -0.5) return 'back'
      return null
    }

    // --- Hurtigvinkler ---
    const setView = (preset: ViewPreset) => {
      const dirs: Record<ViewPreset, [number, number, number]> = {
        iso: [1, 0.7, 1],
        front: [0, 0, 1],
        back: [0, 0, -1],
        right: [1, 0, 0],
        left: [-1, 0, 0],
        top: [0, 1, 0.001],
        bottom: [0, -1, 0.001],
      }
      const dist = camera.position.distanceTo(controls.target)
      const d = new THREE.Vector3(...dirs[preset]).normalize().multiplyScalar(dist)
      camera.position.copy(controls.target).add(d)
      controls.update()
    }
    const zoom = (factor: number) => {
      const dir = camera.position.clone().sub(controls.target)
      const d = Math.max(controls.minDistance, Math.min(controls.maxDistance, dir.length() * factor))
      camera.position.copy(controls.target).add(dir.setLength(d))
      controls.update()
    }
    // Roter kameraet rundt målet via knapper (for enheter uten mus/dra).
    const orbit = (dTheta: number, dPhi: number) => {
      const offset = camera.position.clone().sub(controls.target)
      const sph = new THREE.Spherical().setFromVector3(offset)
      sph.theta += dTheta
      // Hold samme polare grenser som OrbitControls (unngå å gå under bakken).
      sph.phi = Math.max(0.05, Math.min(controls.maxPolarAngle, sph.phi + dPhi))
      offset.setFromSpherical(sph)
      camera.position.copy(controls.target).add(offset)
      controls.update()
    }
    // Ren, godt innrammet iso-innramming (uavhengig av gjeldende kamera/zoom/vinkel).
    // Projiserer bounding-boksens 8 hjørner på skjermaksene og finner avstanden
    // som får hele modellen inn. `marginMul` gir ekstra luft (større ved splitt).
    const frameIso = (marginMul: number) => {
      const bb = templateRef.current.bounds(configRef.current)
      if (!(Number.isFinite(bb.x) && Number.isFinite(bb.y) && Number.isFinite(bb.z) && bb.x > 0)) return
      const target = new THREE.Vector3(0, bb.y * 0.45, 0)
      const dir = new THREE.Vector3(1, 0.7, 1).normalize()
      const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
      const camUp = new THREE.Vector3().crossVectors(right, dir).normalize()
      const hx = bb.x / 2, hy = bb.y / 2, hz = bb.z / 2
      const corner = new THREE.Vector3()
      let extRight = 0, extUp = 0
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        corner.set(sx * hx, bb.y / 2 + sy * hy - target.y, sz * hz)
        extRight = Math.max(extRight, Math.abs(corner.dot(right)))
        extUp = Math.max(extUp, Math.abs(corner.dot(camUp)))
      }
      const vFov = (camera.fov * Math.PI) / 180
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * (camera.aspect || 1))
      const R = Math.max(extUp / Math.tan(vFov / 2), extRight / Math.tan(hFov / 2)) * marginMul
      controls.target.copy(target)
      camera.position.copy(target).addScaledVector(dir, R)
      controls.update()
    }
    const snapshot = (ex: number, preset?: ViewPreset): string => {
      const savedPos = camera.position.clone()
      const savedTarget = controls.target.clone()
      // Til PDF: alltid ren, komplett iso – ikke avhengig av hva brukeren ser nå.
      if (preset === 'iso') frameIso(ex > 0.01 ? 1.7 : 1.3)
      else if (preset) setView(preset)
      // Sett splittgrad.
      for (const { obj, base, dir } of explodablesRef.current) obj.position.copy(base).addScaledVector(dir, ex)
      const handlesWere = handleGroup.visible
      handleGroup.visible = false
      // Nullstill all emissive (valg/«vis frem»-puls) så bildet blir rent.
      const emSaved: { m: THREE.MeshStandardMaterial; hex: number; int: number }[] = []
      modelGroup.traverse((o) => {
        const mm = (o as THREE.Mesh).material
        if (!mm) return
        for (const m of Array.isArray(mm) ? mm : [mm]) {
          const sm = m as THREE.MeshStandardMaterial
          if (sm.emissive && (sm.emissive.getHex() !== 0 || sm.emissiveIntensity !== 0)) {
            emSaved.push({ m: sm, hex: sm.emissive.getHex(), int: sm.emissiveIntensity })
            sm.emissive.setHex(0x000000); sm.emissiveIntensity = 0
          }
        }
      })
      const cw = mount.clientWidth
      const ch = mount.clientHeight
      renderer.setViewport(0, 0, cw, ch)
      renderer.setScissorTest(false)
      renderer.clear()
      renderer.render(scene, camera)
      let url = ''
      try { url = renderer.domElement.toDataURL('image/png') } catch { url = '' }
      // Gjenopprett emissive, splittgrad, håndtak og kamera/mål.
      for (const s of emSaved) { s.m.emissive.setHex(s.hex); s.m.emissiveIntensity = s.int }
      const cur = explodeAnimRef.current
      for (const { obj, base, dir } of explodablesRef.current) obj.position.copy(base).addScaledVector(dir, cur)
      handleGroup.visible = handlesWere
      camera.position.copy(savedPos)
      controls.target.copy(savedTarget)
      controls.update()
      return url
    }
    // --- Valg/markering av del ---
    let selected: THREE.Object3D | null = null
    const savedEmissive = new Map<THREE.MeshStandardMaterial, { hex: number; intensity: number }>()
    const markSelected = (obj: THREE.Object3D | null, on: boolean) => {
      obj?.traverse((c) => {
        const m = (c as THREE.Mesh).material as THREE.MeshStandardMaterial | undefined
        if (!m || !m.emissive) return
        if (on) {
          if (!savedEmissive.has(m)) savedEmissive.set(m, { hex: m.emissive.getHex(), intensity: m.emissiveIntensity })
          m.emissive.setHex(0x2f6d4f)
          m.emissiveIntensity = 0.55
        } else {
          const s = savedEmissive.get(m)
          if (s) { m.emissive.setHex(s.hex); m.emissiveIntensity = s.intensity; savedEmissive.delete(m) }
        }
      })
    }
    const selectFromMesh = (mesh: THREE.Object3D | null) => {
      let cur: THREE.Object3D | null = mesh
      while (cur && !cur.userData.info) cur = cur.parent
      if (selected) markSelected(selected, false)
      selected = cur
      if (cur) { markSelected(cur, true); onSelectPartRef.current?.(cur.userData.info as PartInfo) }
      else onSelectPartRef.current?.(null)
    }
    const deselect = () => {
      if (selected) { markSelected(selected, false); selected = null }
      onSelectPartRef.current?.(null)
    }

    if (apiRef) apiRef.current = { setView, zoom, orbit, snapshot, deselect }

    const GIZMO_SIZE = 158
    const GIZMO_PAD = 12

    // --- Dra-håndtak ---
    const raycaster = new THREE.Raycaster()
    // Raycaster treffer også skjulte mesh. Plukk den nærmeste som FAKTISK er
    // synlig (self + alle foreldre), så man klikker på det man ser (ikke det
    // skjulte taket foran konstruksjonen).
    const firstVisibleHit = (hits: THREE.Intersection[]): THREE.Intersection | undefined => {
      for (const h of hits) {
        let o: THREE.Object3D | null = h.object
        let vis = true
        while (o) { if (!o.visible) { vis = false; break } o = o.parent }
        if (vis) return h
      }
      return undefined
    }
    const pointer = new THREE.Vector2()
    let dragging: { data: HandleData; startVal: number; startPoint: THREE.Vector3; axisDir: THREE.Vector3; plane: THREE.Plane; factor: number } | null = null
    let hovered: THREE.Object3D | null = null
    let hoveredInfo: PartInfo | null = null

    const setPointer = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const axisVec = (axis: 'x' | 'y' | 'z') =>
      axis === 'x' ? new THREE.Vector3(1, 0, 0) : axis === 'y' ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)

    // Finn håndtak-gruppen fra et truffet mesh (raycast er rekursiv).
    const resolveHandle = (o: THREE.Object3D | null): THREE.Object3D | null => {
      let cur: THREE.Object3D | null = o
      while (cur && !cur.userData.handle) cur = cur.parent
      return cur
    }
    // Finn mesh-id (userData.pid) fra et truffet mesh – for maling av ett bord.
    const resolvePid = (o: THREE.Object3D | null): string | null => {
      let cur: THREE.Object3D | null = o
      while (cur && !cur.userData.pid) cur = cur.parent
      return (cur?.userData.pid as string) ?? null
    }
    let downXY: { x: number; y: number } | null = null
    const setHover = (obj: THREE.Object3D | null, on: boolean) => {
      if (!obj) return
      const bs = (obj.userData.baseScale as number) ?? 1
      const s = bs * (on ? 1.35 : 1)
      obj.scale.set(s, s, s)
    }

    const onPointerDown = (e: PointerEvent) => {
      // ViewCube-klikk (øvre høyre hjørne) har prioritet.
      const grect = renderer.domElement.getBoundingClientRect()
      const px = e.clientX - grect.left
      const py = e.clientY - grect.top
      const gx0 = grect.width - GIZMO_SIZE - GIZMO_PAD
      if (px >= gx0 && px <= grect.width - GIZMO_PAD && py >= GIZMO_PAD && py <= GIZMO_PAD + GIZMO_SIZE) {
        const nx = ((px - gx0) / GIZMO_SIZE) * 2 - 1
        const ny = -((py - GIZMO_PAD) / GIZMO_SIZE) * 2 + 1
        raycaster.setFromCamera(new THREE.Vector2(nx, ny), gizmoCam)
        const gHit = raycaster.intersectObject(gizmoCube, false)[0]
        if (gHit?.face) {
          const preset = normalToPreset(gHit.face.normal)
          if (preset) setView(preset)
        }
        return
      }

      // Registrer for klikk-deteksjon (maling / valg av del) på pointerup.
      downXY = { x: e.clientX, y: e.clientY }
      if (paintModeRef.current) return

      setPointer(e)
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(handleGroup.children, true)
      const obj = resolveHandle(hits[0]?.object ?? null)
      if (!obj) return
      const data = obj.userData.handle as HandleData
      const axisDir = axisVec(data.dim.axis)
      const start = obj.getWorldPosition(new THREE.Vector3())
      // Plan gjennom håndtaket, normal ~mot kamera men vinkelrett på aksen.
      const camDir = camera.getWorldDirection(new THREE.Vector3())
      const normal = axisDir.clone().cross(camDir).cross(axisDir).normalize()
      if (normal.lengthSq() < 1e-4) normal.copy(camDir)
      const plane = new THREE.Plane().setFromNormalAndCoplanarPoint(normal, start)
      dragging = {
        data,
        startVal: Number(configRef.current[data.dim.key]),
        startPoint: start,
        axisDir,
        plane,
        factor: data.dim.axis === 'y' ? 1 : 2, // symmetriske akser: halv utstrekning
      }
      controls.enabled = false
      renderer.domElement.setPointerCapture(e.pointerId)
      onDragLabelRef.current?.(data.dim.label)
    }

    const onPointerMove = (e: PointerEvent) => {
      setPointer(e)
      if (dragging) {
        raycaster.setFromCamera(pointer, camera)
        const hit = new THREE.Vector3()
        if (!raycaster.ray.intersectPlane(dragging.plane, hit)) return
        const delta = hit.sub(dragging.startPoint).dot(dragging.axisDir) // meter
        const spec = dragging.data.dim
        let val = dragging.startVal + delta * dragging.factor * 100 // → cm
        val = Math.round(val / spec.step) * spec.step
        val = Math.max(spec.min, Math.min(spec.max, val))
        if (val !== Number(configRef.current[spec.key])) {
          onChangeRef.current({ [spec.key]: val })
        }
        return
      }
      // Hover-tilbakemelding på håndtak.
      raycaster.setFromCamera(pointer, camera)
      const hits = raycaster.intersectObjects(handleGroup.children, true)
      const next = resolveHandle(hits[0]?.object ?? null)
      if (next !== hovered) {
        setHover(hovered, false)
        setHover(next, true)
        hovered = next
      }
      // Hover på selve delen (for å identifisere mål/treslag).
      let info: PartInfo | null = null
      if (!next) {
        const mhit = firstVisibleHit(raycaster.intersectObject(modelGroup, true))
        let cur: THREE.Object3D | null = mhit?.object ?? null
        while (cur && !cur.userData.info) cur = cur.parent
        info = (cur?.userData.info as PartInfo) ?? null
      }
      if (JSON.stringify(info) !== JSON.stringify(hoveredInfo)) {
        hoveredInfo = info
        onHoverPartRef.current?.(info)
      }
      renderer.domElement.style.cursor = next ? 'grab' : info ? 'pointer' : 'default'
    }

    const onPointerUp = (e: PointerEvent) => {
      const wasDragging = !!dragging
      if (dragging) {
        dragging = null
        controls.enabled = true
        onDragLabelRef.current?.(null)
        try { renderer.domElement.releasePointerCapture(e.pointerId) } catch { /* noop */ }
      }
      // Klikk (liten bevegelse): mal delen, eller velg/marker den.
      if (downXY && !wasDragging) {
        const moved = Math.hypot(e.clientX - downXY.x, e.clientY - downXY.y)
        if (moved < 5) {
          setPointer(e)
          raycaster.setFromCamera(pointer, camera)
          const hit = firstVisibleHit(raycaster.intersectObject(modelGroup, true))
          if (paintModeRef.current) {
            const pid = resolvePid(hit?.object ?? null)
            if (pid) onPaintRef.current?.(pid)
          } else {
            selectFromMesh(hit?.object ?? null)
          }
        }
      }
      downXY = null
    }

    renderer.domElement.addEventListener('pointerdown', onPointerDown)
    renderer.domElement.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', onPointerUp)

    // Resize.
    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (w === 0 || h === 0) return
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      camera.updateProjectionMatrix()
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    let raf = 0
    let lastW = 0
    let lastH = 0
    const camQuatInv = new THREE.Quaternion()
    // «Vis frem» – kinematisk sekvens av «shots». Kameraet kretser rundt modellen
    // (vekslende retning via fortegnet på `spin`), zoomer inn/ut (`zoom`), splitter
    // modellen for å vise sammenføyninger (`explode`), og fremhever en viktig
    // delgruppe med en varm puls (`focus` = gruppeindeks, null = ingen).
    //  focus = motiv å gå tett på (0..1 = andel inn i motivlista sortert etter
    //          størrelse; null = vid oversikt). Ved fokus rammer kameraet inn
    //          selve motivet på nært hold, så den fremhevede delen er nær kamera.
    //  height = kameraets y-retningskomponent (lav = øyehøyde, høy = ovenfra).
    //  look   = (kun vide skudd) sikt-høyde som andel av modellhøyden.
    //  dist   = (kun fokus-skudd) kameraavstand som multiplum av motivets radius.
    const SHOWCASE_SHOTS = [
      { focus: null as number | null, look: 0.52, height: 0.80, zoom: 1.28, dist: 0, spin: 0.0028, hold: 150, explode: 0 }, // vid hero
      { focus: 0.0,  look: 0, height: 0.30, zoom: 0, dist: 2.8, spin: 0.0030, hold: 180, explode: 0 }, // største del, lavt & tett
      { focus: 0.45, look: 0, height: 0.55, zoom: 0, dist: 3.0, spin: -0.0034, hold: 190, explode: 1 }, // mellomdel, splittet
      { focus: null, look: 0.72, height: 1.18, zoom: 1.08, dist: 0, spin: -0.0030, hold: 140, explode: 1 }, // høyt, splittet
      { focus: 1.0,  look: 0, height: 0.40, zoom: 0, dist: 2.4, spin: 0.0038, hold: 190, explode: 0 }, // liten detalj/knutepunkt, tett
      { focus: null, look: 0.48, height: 0.60, zoom: 1.05, dist: 0, spin: 0.0028, hold: 140, explode: 0 }, // vid utro
    ]
    let showcaseAz = 0
    let showcaseH = 2 // modellhøyde (m), settes når «vis frem» starter
    let showcaseFrame = 0
    let wasShowcase = false
    let savedMinDist = 0.4 // controls.minDistance å gjenopprette etter «vis frem»
    const showcaseGoal = new THREE.Vector3()
    const showcaseDir = new THREE.Vector3()
    const showcaseTargetGoal = new THREE.Vector3()

    // «Motiver»: meshes gruppert per delnavn (info.navn) med felles bbox. Hvert
    // motiv har materialer (til puls-highlight), meshene (til å finne senter live)
    // og en radius (til kameraavstand), så kameraet kan gå tett på nettopp den delen.
    // Et motiv = én representativ del-instans (rep) kameraet går tett på, pluss
    // alle materialene i samme delgruppe som pulser (så hele delkategorien lyser
    // mens den nærmeste instansen er stor i bildet). Radius = rep-instansens egen
    // størrelse, så små deler (knutepunkt) gir ekte nærbilder.
    type Subject = { rep: THREE.Mesh; mats: THREE.MeshStandardMaterial[]; radius: number }
    let showcaseSubjects: Subject[] = []
    let hiSaved: { m: THREE.MeshStandardMaterial; hex: number; intn: number }[] = []
    const clearHighlight = () => {
      for (const s of hiSaved) { s.m.emissive.setHex(s.hex); s.m.emissiveIntensity = s.intn }
      hiSaved = []
    }
    const _sbB = new THREE.Box3(), _sSize = new THREE.Vector3(), _sCenter = new THREE.Vector3()
    const computeSubjects = (): Subject[] => {
      modelGroup.updateWorldMatrix(true, true)
      type G = { mats: THREE.MeshStandardMaterial[]; rep: THREE.Mesh; repScore: number; repRad: number }
      const groups = new Map<string, G>()
      modelGroup.traverse((o) => {
        const mesh = o as THREE.Mesh
        if (!mesh.isMesh) return
        let cur: THREE.Object3D | null = o
        while (cur && !cur.userData.info) cur = cur.parent
        const navn = (cur?.userData.info as PartInfo | undefined)?.navn
        if (!navn || navn.toLowerCase().includes('husvegg')) return
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
        if (!mesh.geometry.boundingBox) return
        _sbB.copy(mesh.geometry.boundingBox).applyMatrix4(mesh.matrixWorld)
        _sbB.getSize(_sSize); _sbB.getCenter(_sCenter)
        const rad = Math.max(0.15, 0.5 * Math.max(_sSize.x, _sSize.y, _sSize.z))
        const score = _sCenter.x + _sCenter.z // fremre-høyre instans = fin hero-vinkel
        const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter((m) => (m as THREE.MeshStandardMaterial).emissive) as THREE.MeshStandardMaterial[]
        let g = groups.get(navn)
        if (!g) { g = { mats: [], rep: mesh, repScore: -Infinity, repRad: rad }; groups.set(navn, g) }
        g.mats.push(...mats)
        if (score > g.repScore) { g.repScore = score; g.rep = mesh; g.repRad = rad }
      })
      return [...groups.values()]
        .map((g) => ({ rep: g.rep, mats: g.mats, radius: g.repRad }))
        .sort((a, b) => a.radius - b.radius) // minste deler først → ekte nærbilder
    }
    // Live senter (world) for motivets rep-instans – følger delen når modellen splittes.
    const subjectCenter = (s: Subject, out: THREE.Vector3) => {
      s.rep.updateWorldMatrix(true, false)
      if (!s.rep.geometry.boundingBox) s.rep.geometry.computeBoundingBox()
      _sbB.copy(s.rep.geometry.boundingBox!).applyMatrix4(s.rep.matrixWorld)
      return _sbB.getCenter(out)
    }
    const resolveSubject = (focus: number | null): Subject | null =>
      focus == null || !showcaseSubjects.length ? null : (showcaseSubjects[Math.round(focus * (showcaseSubjects.length - 1))] ?? null)
    const highlightSubject = (s: Subject | null) => {
      clearHighlight()
      if (!s) return
      for (const m of s.mats) { hiSaved.push({ m, hex: m.emissive.getHex(), intn: m.emissiveIntensity }); m.emissive.setHex(0xff9a3c) }
    }
    const loop = () => {
      // «Vis frem»: kinematisk kamerakjøring – kretsing (skiftende retning),
      // inn/ut-zoom, splittvisning som avdekker sammenføyninger, og puls på
      // viktige deler. Kameraet nudges før controls.update() så orbit følger med.
      if (showcaseRef.current) {
        if (!wasShowcase) {
          // Start mykt der kameraet står: utled asimut + baseradius derfra.
          const off = camera.position.clone().sub(controls.target)
          showcaseAz = Math.atan2(off.x, off.z)
          showcaseRadiusRef.current = Math.max(off.length(), 1)
          showcaseIdxRef.current = 0
          showcaseHoldRef.current = 0
          showcaseFrame = 0
          showcaseH = Math.max(0.5, templateRef.current.bounds(configRef.current).y)
          showcaseSubjects = computeSubjects()
          savedMinDist = controls.minDistance
          controls.minDistance = 0.1 // tillat tette nærbilder under «vis frem»
          deselect()
          highlightSubject(resolveSubject(SHOWCASE_SHOTS[0].focus))
          wasShowcase = true
        }
        showcaseFrame += 1
        const shot = SHOWCASE_SHOTS[showcaseIdxRef.current % SHOWCASE_SHOTS.length]
        showcaseAz += shot.spin
        const subj = resolveSubject(shot.focus)
        if (subj) {
          // Fokus-skudd: sikt på selve delen og gå tett på – delen er nær kamera.
          subjectCenter(subj, showcaseTargetGoal)
          const r = Math.max(subj.radius * shot.dist, showcaseRadiusRef.current * 0.12)
          controls.target.lerp(showcaseTargetGoal, 0.06)
          showcaseDir.set(Math.sin(showcaseAz), shot.height, Math.cos(showcaseAz)).normalize()
          showcaseGoal.copy(controls.target).addScaledVector(showcaseDir, r)
        } else {
          // Vidt skudd: sikt-punktet glir opp/ned langs modellen (bakke → tak).
          showcaseTargetGoal.set(0, showcaseH * shot.look, 0)
          controls.target.lerp(showcaseTargetGoal, 0.05)
          showcaseDir.set(Math.sin(showcaseAz), shot.height, Math.cos(showcaseAz)).normalize()
          showcaseGoal.copy(controls.target).addScaledVector(showcaseDir, showcaseRadiusRef.current * shot.zoom)
        }
        camera.position.lerp(showcaseGoal, 0.06) // rask, men myk overgang
        if (hiSaved.length) {
          const puls = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(showcaseFrame * 0.11))
          for (const s of hiSaved) s.m.emissiveIntensity = puls
        }
        showcaseHoldRef.current += 1
        if (showcaseHoldRef.current >= shot.hold) {
          showcaseIdxRef.current = (showcaseIdxRef.current + 1) % SHOWCASE_SHOTS.length
          showcaseHoldRef.current = 0
          highlightSubject(resolveSubject(SHOWCASE_SHOTS[showcaseIdxRef.current % SHOWCASE_SHOTS.length].focus))
        }
      } else if (wasShowcase) {
        clearHighlight()
        controls.minDistance = savedMinDist
        controls.target.set(0, showcaseH * 0.45, 0) // tilbake til nøytralt sikt-punkt
        wasShowcase = false
      }

      // GROUND_CLAMP: la brukeren rotere vertikalt helt ned mot bakken. Målet
      // ligger i modellens senterhøyde, så en fast grense på PI/2 (horisonten)
      // stopper blikket i «menneskehøyde». Vi regner i stedet ut øvre polarvinkel
      // slik at kameraet kan senkes til like over bakkeplanet (y ≈ 0), men aldri
      // under det (som ville vist undersiden av rutenettet). Grensen avhenger av
      // avstand og målhøyde og oppdateres derfor hver frame.
      {
        const dist = camera.position.distanceTo(controls.target)
        const minCamY = 0.05
        const cosMax = Math.max(-1, Math.min(1, (minCamY - controls.target.y) / Math.max(dist, 1e-3)))
        controls.maxPolarAngle = Math.min(Math.PI - 0.02, Math.acos(cosMax))
      }
      controls.update()

      // Selv-korrigerende størrelse: fanger opp tilfeller der beholderen er 0×0
      // ved montering (f.eks. ved klient-navigasjon inn i en modell) uten å måtte
      // laste siden på nytt. Oppdaterer renderer + kamera når størrelsen endres.
      const mw = mount.clientWidth
      const mh = mount.clientHeight
      if (mw > 0 && mh > 0 && (mw !== lastW || mh !== lastH)) {
        lastW = mw
        lastH = mh
        renderer.setSize(mw, mh, false)
        camera.aspect = mw / mh
        camera.updateProjectionMatrix()
      }

      // Innramming når produktet er byttet (needsFrameRef). Projiserer alle 8
      // hjørnene av bounding-boksen på kameraets skjermakser (høyre/opp) for den
      // faste iso-retningen, og finner avstanden som får boksen til å passe i
      // BÅDE vertikal og horisontal FOV. Dette gir riktig zoom for alle modeller
      // – smale/høye som brede/flate – og tar hensyn til skjermformatet (mobil).
      if (needsFrameRef.current) {
        const bb = templateRef.current.bounds(configRef.current)
        if (Number.isFinite(bb.x) && Number.isFinite(bb.y) && Number.isFinite(bb.z) && bb.x > 0) {
          controls.target.set(0, bb.y * 0.45, 0)
          const dir = new THREE.Vector3(0.8, 0.55, 1).normalize()
          // Skjermakser sett fra kameraet langs -dir.
          const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize()
          const camUp = new THREE.Vector3().crossVectors(right, dir).normalize()
          // Største utstrekning langs hver skjermakse, relativt til target.
          const hx = bb.x / 2, hy = bb.y / 2, hz = bb.z / 2
          const corner = new THREE.Vector3()
          let extRight = 0, extUp = 0
          for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
            corner.set(sx * hx, bb.y / 2 + sy * hy - controls.target.y, sz * hz)
            extRight = Math.max(extRight, Math.abs(corner.dot(right)))
            extUp = Math.max(extUp, Math.abs(corner.dot(camUp)))
          }
          const vFov = (camera.fov * Math.PI) / 180
          const aspect = camera.aspect || 1
          const hFov = 2 * Math.atan(Math.tan(vFov / 2) * aspect)
          const distV = extUp / Math.tan(vFov / 2)
          const distH = extRight / Math.tan(hFov / 2)
          const R = Math.max(distV, distH) * 1.25 // ~luft rundt modellen
          camera.position.copy(controls.target).addScaledVector(dir, R)
          controls.minDistance = Math.max(0.4, R * 0.25)
          controls.maxDistance = R * 4
          controls.update()
          needsFrameRef.current = false
        }
      }

      // Myk animasjon av splittvisning mot målet. «Vis frem» overstyrer med
      // gjeldende shot sin splittgrad; ellers følges brukerens valg.
      const target = showcaseRef.current
        ? SHOWCASE_SHOTS[showcaseIdxRef.current % SHOWCASE_SHOTS.length].explode
        : explodeRef.current
      if (Math.abs(explodeAnimRef.current - target) > 0.0005) {
        // Roligere splitting mens «vis frem» kjører; snappy ved manuell veksling.
        const exLerp = showcaseRef.current ? 0.035 : 0.12
        explodeAnimRef.current += (target - explodeAnimRef.current) * exLerp
        if (Math.abs(explodeAnimRef.current - target) <= 0.0005) explodeAnimRef.current = target
        const ea = explodeAnimRef.current
        for (const { obj, base, dir } of explodablesRef.current) obj.position.copy(base).addScaledVector(dir, ea)
        for (const { obj, base, dir } of handlesRef.current) obj.position.copy(base).addScaledVector(dir, ea * 0.35)
        // Gulvdekke/kledning fades til halvgjennomsiktig når modellen splittes.
        const skinOp = 1 - 0.62 * Math.min(1, ea)
        for (const mm of skinRef.current) {
          mm.transparent = ea > 0.001
          mm.opacity = skinOp
          mm.depthWrite = skinOp > 0.98
        }
      }

      // Skjul dra-håndtakene mens «vis frem» kjører – ren presentasjon.
      handleGroup.visible = showHandlesRef.current && !showcaseRef.current
      // Hold dra-håndtakene i konstant skjermstørrelse uansett zoom-nivå.
      if (handlesRef.current.length) {
        const camDist = camera.position.distanceTo(controls.target)
        const hScale = Math.min(Math.max(camDist / 4.2, 0.45), 10)
        for (const { obj } of handlesRef.current) obj.scale.setScalar(hScale)
      }


      const cw = mount.clientWidth
      const ch = mount.clientHeight

      // Hovedscene.
      renderer.setViewport(0, 0, cw, ch)
      renderer.setScissorTest(false)
      renderer.clear()
      renderer.render(scene, camera)

      // ViewCube i øvre høyre hjørne: kuben roterer motsatt av kameraet,
      // så flaten mot deg alltid tilsvarer gjeldende utsikt (three: y=0 nederst).
      camQuatInv.copy(camera.quaternion).invert()
      gizmoCube.quaternion.copy(camQuatInv)
      renderer.setViewport(cw - GIZMO_SIZE - GIZMO_PAD, ch - GIZMO_SIZE - GIZMO_PAD, GIZMO_SIZE, GIZMO_SIZE)
      renderer.setScissor(cw - GIZMO_SIZE - GIZMO_PAD, ch - GIZMO_SIZE - GIZMO_PAD, GIZMO_SIZE, GIZMO_SIZE)
      renderer.setScissorTest(true)
      renderer.clearDepth()
      renderer.render(gizmoScene, gizmoCam)
      renderer.setScissorTest(false)

      raf = requestAnimationFrame(loop)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      // Frigjør WebGL-konteksten eksplisitt – ellers hoper kontekster seg opp
      // ved gjentatte åpne/lukke, og nettleseren kutter dem (blank canvas).
      renderer.dispose()
      renderer.forceContextLoss()
      if (apiRef) apiRef.current = null
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- Skygge av/på ---
  useEffect(() => {
    if (keyLightRef.current) keyLightRef.current.castShadow = shadows
    if (groundRef.current) groundRef.current.visible = shadows
  }, [shadows])

  // Splittvisningen animeres mykt i render-loopen (se `loop`) mot explodeRef.

  // --- Vis/skjul dra-håndtak ---
  useEffect(() => {
    if (handleGroupRef.current) handleGroupRef.current.visible = showHandles
  }, [showHandles])

  // --- Paint bucket-cursor ---
  useEffect(() => {
    const canvas = mountRef.current?.querySelector('canvas')
    if (!canvas) return
    const bucket =
      "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28' viewBox='0 0 28 28'%3E%3Cg transform='rotate(18 14 14)'%3E%3Cpath d='M7 11 h11 l-1.4 9.5 a1 1 0 0 1 -1 0.9 h-6.2 a1 1 0 0 1 -1 -0.9 z' fill='%231c1e22' stroke='white' stroke-width='1.3'/%3E%3Cpath d='M7 11 q5.5 -4.5 11 0' fill='none' stroke='white' stroke-width='1.4'/%3E%3Ccircle cx='22.5' cy='7' r='2.2' fill='%235aa47f' stroke='white' stroke-width='0.8'/%3E%3C/g%3E%3C/svg%3E\") 6 22, crosshair"
    canvas.style.cursor = paintMode ? bucket : ''
    return () => { canvas.style.cursor = '' }
  }, [paintMode])

  // --- Lysstyrke ---
  useEffect(() => {
    if (keyLightRef.current) keyLightRef.current.intensity = 1.5 * lightIntensity
    if (hemiLightRef.current) hemiLightRef.current.intensity = 0.9 * lightIntensity
  }, [lightIntensity])

  // --- Tåke/dis ---
  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    scene.fog = fog ? new THREE.Fog(0xdad4c6, 1.5, 6.5) : null
  }, [fog])

  // --- Gulvrutenett av/på ---
  useEffect(() => {
    if (gridRef.current) gridRef.current.visible = showGrid
  }, [showGrid])

  // --- Solvinkel (styrer retningslys + skygge) ---
  useEffect(() => {
    const key = keyLightRef.current
    if (!key) return
    const az = (sunAzimuth * Math.PI) / 180
    const el = (sunElevation * Math.PI) / 180
    const R = 6
    key.position.set(
      R * Math.cos(el) * Math.sin(az),
      Math.max(0.5, R * Math.sin(el)),
      R * Math.cos(el) * Math.cos(az),
    )
    key.target.position.set(0, 0, 0)
    key.target.updateMatrixWorld()
  }, [sunAzimuth, sunElevation])

  // --- Bygg om modell + håndtak når config endres ---
  useEffect(() => {
    const modelGroup = modelGroupRef.current
    const handleGroup = handleGroupRef.current
    const controls = controlsRef.current
    if (!modelGroup || !handleGroup) return
    // Ved klient-navigasjon kan config være tom {} et øyeblikk før den nullstilles
    // til defaultConfig. Ikke bygg/ramme inn på tom config (gir NaN-mål).
    if (Object.keys(configRef.current).length === 0) return

    const disposeGroup = (g: THREE.Group) => {
      g.traverse((o) => {
        const m = o as THREE.Mesh
        if (m.geometry) m.geometry.dispose()
        if (m.material) {
          const mats = Array.isArray(m.material) ? m.material : [m.material]
          mats.forEach((mm) => mm.dispose())
        }
      })
      g.clear()
    }

    // Modell.
    disposeGroup(modelGroup)
    if (woodOnRef.current && !woodTexRef.current) woodTexRef.current = makeWoodTexture()
    const built = templateRef.current.buildMesh(configRef.current, {
      overrides: overridesRef.current,
      woodTexture: woodOnRef.current ? woodTexRef.current : null,
    })
    modelGroup.add(built)

    // Samle deler som kan splittes (userData.explode) + påfør gjeldende split.
    explodablesRef.current = []
    skinRef.current = []
    built.traverse((o) => {
      const dir = o.userData.explode as THREE.Vector3 | undefined
      if (dir) explodablesRef.current.push({ obj: o, base: o.position.clone(), dir })
      const m = o as THREE.Mesh
      if (m.isMesh && (o.userData.part === 'gulv' || o.userData.part === 'kledning')) {
        const mats = Array.isArray(m.material) ? m.material : [m.material]
        mats.forEach((mm) => skinRef.current.push(mm as THREE.MeshStandardMaterial))
      }
    })
    for (const { obj, base, dir } of explodablesRef.current) {
      obj.position.copy(base).addScaledVector(dir, explodeAnimRef.current)
    }
    // Halvgjennomsiktig gulvdekke/kledning i splittvisning.
    const skinOp = 1 - 0.62 * Math.min(1, explodeAnimRef.current)
    for (const mm of skinRef.current) {
      mm.transparent = explodeAnimRef.current > 0.001
      mm.opacity = skinOp
      mm.depthWrite = skinOp > 0.98
    }

    // Gjenopprett vis/skjul-deler etter ombygging.
    const hiddenNow = new Set(hiddenPartsRef.current.split(',').filter(Boolean))
    if (hiddenNow.size) built.traverse((o) => {
      const p = o.userData.part as string | undefined
      if (p) o.visible = !hiddenNow.has(p)
    })

    // Håndtak – doble akse-piler (peker begge veier langs aksen).
    disposeGroup(handleGroup)
    handleGroup.visible = showHandlesRef.current
    const b = templateRef.current.bounds(configRef.current)
    const midY = Math.min(b.y * 0.6, b.y - 0.1)
    const gap = HANDLE_R * 1.7

    // Dobbeltpil med tykkelse (ekstrudert). Fargen følger aksen som på
    // orienteringskuben: X rød, Y grønn, Z blå.
    const axisColor = (dir: THREE.Vector3) =>
      Math.abs(dir.y) > 0.5 ? 0x3aa655 : Math.abs(dir.z) > 0.5 ? 0x3b6fd8 : 0xd83b3b
    const ARROW_THICK = HANDLE_R * 0.3
    const AL = HANDLE_R * 1.35 // halv lengde (litt mindre)
    const hl = HANDLE_R * 0.72 // spiss-lengde
    const hh = HANDLE_R * 0.5 // spiss halv-høyde
    const st = HANDLE_R * 0.14 // skaft halv-tykkelse
    const arrowShape = new THREE.Shape()
    arrowShape.moveTo(-AL, 0) // venstre spiss
    arrowShape.lineTo(-AL + hl, -hh)
    arrowShape.lineTo(-AL + hl, -st)
    arrowShape.lineTo(AL - hl, -st)
    arrowShape.lineTo(AL - hl, -hh)
    arrowShape.lineTo(AL, 0) // høyre spiss
    arrowShape.lineTo(AL - hl, hh)
    arrowShape.lineTo(AL - hl, st)
    arrowShape.lineTo(-AL + hl, st)
    arrowShape.lineTo(-AL + hl, hh)
    arrowShape.closePath()
    const makeArrow = (dir: THREE.Vector3) => {
      const geo = new THREE.ExtrudeGeometry(arrowShape, { depth: ARROW_THICK, bevelEnabled: false })
      geo.translate(0, 0, -ARROW_THICK / 2) // senter tykkelsen
      if (Math.abs(dir.y) > 0.5) {
        geo.rotateZ(Math.PI / 2) // loddrett pil langs Y (i front-planet)
      } else if (Math.abs(dir.z) > 0.5) {
        geo.rotateX(-Math.PI / 2)
        geo.rotateY(-Math.PI / 2) // ligger flatt, peker langs Z
      } else {
        geo.rotateX(-Math.PI / 2) // ligger flatt, peker langs X
      }
      const mat = new THREE.MeshStandardMaterial({ color: axisColor(dir), roughness: 0.45, metalness: 0.05 })
      return new THREE.Mesh(geo, mat)
    }

    handlesRef.current = []
    for (const dim of templateRef.current.dimensjoner) {
      if (dim.handle === false) continue
      if (dim.visibleWhen && !dim.visibleWhen(configRef.current)) continue

      let pos: THREE.Vector3
      let dir: THREE.Vector3
      if (dim.axis === 'x') {
        pos = new THREE.Vector3(b.x / 2 + gap, midY, 0)
        dir = new THREE.Vector3(1, 0, 0)
      } else if (dim.axis === 'z') {
        pos = new THREE.Vector3(0, midY, b.z / 2 + gap)
        dir = new THREE.Vector3(0, 0, 1)
      } else {
        pos = new THREE.Vector3(0, b.y + gap, 0)
        dir = new THREE.Vector3(0, 1, 0)
      }
      const arrow = makeArrow(dir)
      arrow.position.copy(pos)
      arrow.renderOrder = 10
      arrow.userData.baseScale = 1
      arrow.userData.handle = { dim } as HandleData
      handleGroup.add(arrow)
      handlesRef.current.push({ obj: arrow, base: pos.clone(), dir })
    }
    // Skyv håndtakene utover i takt med splittvisningen.
    for (const { obj, base, dir } of handlesRef.current) {
      obj.position.copy(base).addScaledVector(dir, explodeAnimRef.current * 0.35)
    }

    // Ramme inn modellen første gang og senter kontrollene – kun ved gyldige mål,
    // så framing ikke «brennes» på en NaN-modell (blank canvas til refresh).
    const finite = Number.isFinite(b.x) && Number.isFinite(b.y) && Number.isFinite(b.z)
    if (controls && finite) controls.target.set(0, b.y * 0.45, 0)
    // Selve innrammingen skjer i render-loopen (needsFrameRef), som alltid kjører.
  }, [geomKey])

  return <Viewport ref={mountRef} />
}
