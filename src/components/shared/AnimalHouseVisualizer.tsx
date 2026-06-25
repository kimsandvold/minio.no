import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface AnimalHouseConfig {
  /** Innvendige mål i cm. */
  width: number
  depth: number
  height: number
  roof: 'panel' | 'felt'
  finish: 'natural' | 'primed' | 'painted'
  /** 'door' = rektangulær døråpning (hundehus), 'hole' = rund inngang (kattehus). */
  entrance: 'door' | 'hole'
  /** Settes for stolpemontert variant (kattehus). cm fra bakken til husets gulv. */
  poleHeight?: number
}

const FINISH_COLORS: Record<AnimalHouseConfig['finish'], number> = {
  natural: 0xd3b083, // raw, untreated pine
  primed: 0xbdb8ad,
  painted: 0xede7dd,
}

const ROOF_COLORS: Record<AnimalHouseConfig['roof'], number> = {
  panel: 0x9c7b4f,
  felt: 0x3a3a3a,
}

const Wrapper = styled.div`
  width: 100%;
  margin-bottom: 2rem;
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
  }
`

const Label = styled.div`
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.6rem;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  white-space: nowrap;
  pointer-events: none;
  z-index: 1;
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

const WALL_T = 0.012
const ROOF_T = 0.016
const ROOF_EAVE = 0.05 // side overhang (down-slope)
const ROOF_GABLE = 0.11 // front/back (gable end) overhang
const POST_SIZE = 0.05

// Horizontal flat-faced rebated (shiplap) siding. Real board: 10 cm wide, 21 mm thick.
const BOARD_H = 0.10 // visible height of one board course (10 cm)
const SIDING_T = 0.021 // board thickness / how far it stands proud of the wall (21 mm)
const BOARD_GAP = 0.006 // recessed shadow groove between courses
const CORNER_T = 0.03 // vertical corner trim that caps the board ends

function darken(hex: number, factor: number) {
  const r = Math.max(0, Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor)))
  const g = Math.max(0, Math.min(255, Math.floor(((hex >> 8) & 0xff) * factor)))
  const b = Math.max(0, Math.min(255, Math.floor((hex & 0xff) * factor)))
  return (r << 16) | (g << 8) | b
}

function disposeGroup(group: THREE.Object3D) {
  const children = [...group.children]
  children.forEach((child) => {
    if (child instanceof THREE.Group) {
      disposeGroup(child)
    } else if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      const m = child.material
      if (Array.isArray(m)) m.forEach((x) => x.dispose())
      else if (m) m.dispose()
    }
    group.remove(child)
  })
}

function buildAnimalHouse(group: THREE.Group, cfg: AnimalHouseConfig) {
  disposeGroup(group)

  const scale = 0.01
  const w = cfg.width * scale
  const d = cfg.depth * scale
  const h = cfg.height * scale
  const yBase = (cfg.poleHeight ?? 0) * scale

  const woodColor = FINISH_COLORS[cfg.finish]
  const wood = new THREE.MeshStandardMaterial({ color: woodColor, roughness: 0.82, metalness: 0.04 })
  const trim = new THREE.MeshStandardMaterial({ color: darken(woodColor, 0.86), roughness: 0.7, metalness: 0.04 })
  const roofMat = new THREE.MeshStandardMaterial({ color: ROOF_COLORS[cfg.roof], roughness: cfg.roof === 'felt' ? 0.6 : 0.85, metalness: 0.05 })
  const dark = new THREE.MeshStandardMaterial({ color: 0x1c1c1c, roughness: 0.6, metalness: 0.1 })

  const add = (mesh: THREE.Mesh) => {
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }
  const box = (sx: number, sy: number, sz: number, mat: THREE.Material) =>
    new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat)

  // Clad a face with flat-faced horizontal boards separated by a recessed shadow
  // groove (rebated shiplap look). axis 'z' → board spans X (front/back faces);
  // axis 'x' → board spans Z (side faces).
  const cladFace = (o: {
    axis: 'x' | 'z'; dir: 1 | -1; spanLen: number
    centerAlong: number; faceCoord: number; yBottom: number; height: number
  }) => {
    const n = Math.max(1, Math.round(o.height / BOARD_H))
    const step = o.height / n
    const boardH = step - BOARD_GAP
    for (let i = 0; i < n; i++) {
      const y = o.yBottom + step * i + step / 2
      const board = o.axis === 'z'
        ? box(o.spanLen, boardH, SIDING_T, wood)
        : box(SIDING_T, boardH, o.spanLen, wood)
      if (o.axis === 'z') {
        board.position.set(o.centerAlong, y, o.faceCoord + o.dir * SIDING_T * 0.5)
      } else {
        board.position.set(o.faceCoord + o.dir * SIDING_T * 0.5, y, o.centerAlong)
      }
      add(board)
    }
  }

  // Vertical corner trim, sitting flush-proud of the siding, that caps the board
  // ends at each vertical edge (hjørnebord).
  const cornerTrim = (sx: 1 | -1, sz: 1 | -1) => {
    const off = SIDING_T - CORNER_T / 2
    const post = box(CORNER_T, h, CORNER_T, trim)
    post.position.set(sx * (w / 2 + off), yBase + h / 2, sz * (d / 2 + off))
    add(post)
  }
  const CI = CORNER_T // how far to pull board ends in from the corner

  // ── Floor ──
  const floor = box(w, WALL_T, d, wood)
  floor.position.set(0, yBase + WALL_T / 2, 0)
  add(floor)

  // ── Back + side walls ──
  const back = box(w, h, WALL_T, wood)
  back.position.set(0, yBase + h / 2, -d / 2 + WALL_T / 2)
  add(back)
  cladFace({ axis: 'z', dir: -1, spanLen: w - CI, centerAlong: 0, faceCoord: -d / 2, yBottom: yBase, height: h })

  const left = box(WALL_T, h, d, wood)
  left.position.set(-w / 2 + WALL_T / 2, yBase + h / 2, 0)
  add(left)
  cladFace({ axis: 'x', dir: -1, spanLen: d - CI, centerAlong: 0, faceCoord: -w / 2, yBottom: yBase, height: h })

  const right = box(WALL_T, h, d, wood)
  right.position.set(w / 2 - WALL_T / 2, yBase + h / 2, 0)
  add(right)
  cladFace({ axis: 'x', dir: 1, spanLen: d - CI, centerAlong: 0, faceCoord: w / 2, yBottom: yBase, height: h })

  // Build a front wall with a rectangular/arched opening cut out, then clad the
  // solid parts and add a proud frame around the opening.
  const frontWallWithHole = (hole: THREE.Path, openX: number, openYTop: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(-w / 2, 0)
    shape.lineTo(w / 2, 0)
    shape.lineTo(w / 2, h)
    shape.lineTo(-w / 2, h)
    shape.lineTo(-w / 2, 0)
    shape.holes.push(hole)
    const geom = new THREE.ExtrudeGeometry(shape, { depth: WALL_T, bevelEnabled: false })
    const wall = new THREE.Mesh(geom, wood)
    wall.position.set(0, yBase, d / 2 - WALL_T)
    add(wall)
    // Clad the solid strips around the opening.
    const sideW = (w - openX) / 2
    cladFace({ axis: 'z', dir: 1, spanLen: sideW - CI, centerAlong: -(w + openX) / 4, faceCoord: d / 2, yBottom: yBase, height: h })
    cladFace({ axis: 'z', dir: 1, spanLen: sideW - CI, centerAlong: (w + openX) / 4, faceCoord: d / 2, yBottom: yBase, height: h })
    cladFace({ axis: 'z', dir: 1, spanLen: openX, centerAlong: 0, faceCoord: d / 2, yBottom: yBase + openYTop, height: h - openYTop })
  }

  // ── Front wall + entrance ──
  const frameT = SIDING_T + 0.008
  if (cfg.entrance === 'door') {
    // Arched doorway.
    const dw = Math.min(w * 0.44, 0.5)
    const archR = dw / 2
    const dh = Math.min(h * 0.78, 0.78)
    const springY = dh - archR
    const hole = new THREE.Path()
    hole.moveTo(-archR, 0)
    hole.lineTo(-archR, springY)
    hole.absarc(0, springY, archR, Math.PI, 0, true)
    hole.lineTo(archR, 0)
    hole.lineTo(-archR, 0)
    frontWallWithHole(hole, dw, dh)
    // Proud vertical frame boards flanking the opening.
    const frameW = 0.04
    const frameH = springY + archR * 0.5
    const lf = box(frameW, frameH, frameT, trim)
    lf.position.set(-(archR + frameW / 2), yBase + frameH / 2, d / 2 + frameT / 2)
    add(lf)
    const rf = box(frameW, frameH, frameT, trim)
    rf.position.set(archR + frameW / 2, yBase + frameH / 2, d / 2 + frameT / 2)
    add(rf)
  } else {
    // Raised, rectangular window opening (cathouse).
    const ww = Math.min(w * 0.42, 0.42)
    const wh = Math.min(h * 0.46, 0.42)
    const sill = yBase === 0 ? h * 0.28 : Math.min(h * 0.24, 0.18)
    const top = sill + wh
    const hole = new THREE.Path()
    hole.moveTo(-ww / 2, sill)
    hole.lineTo(ww / 2, sill)
    hole.lineTo(ww / 2, top)
    hole.lineTo(-ww / 2, top)
    hole.lineTo(-ww / 2, sill)
    frontWallWithHole(hole, ww, top)
    // Clad the strip below the sill too.
    cladFace({ axis: 'z', dir: 1, spanLen: ww, centerAlong: 0, faceCoord: d / 2, yBottom: yBase, height: sill })
    // Dark pane set behind the opening.
    const pane = box(ww, wh, WALL_T * 0.6, dark)
    pane.position.set(0, yBase + sill + wh / 2, d / 2 - WALL_T)
    pane.castShadow = false
    add(pane)
    // Proud frame around the window.
    const fW = 0.03
    const top1 = box(ww + fW * 2, fW, frameT, trim); top1.position.set(0, yBase + top + fW / 2, d / 2 + frameT / 2); add(top1)
    const bot1 = box(ww + fW * 2, fW, frameT, trim); bot1.position.set(0, yBase + sill - fW / 2, d / 2 + frameT / 2); add(bot1)
    const lft = box(fW, wh + fW * 2, frameT, trim); lft.position.set(-(ww / 2 + fW / 2), yBase + sill + wh / 2, d / 2 + frameT / 2); add(lft)
    const rgt = box(fW, wh + fW * 2, frameT, trim); rgt.position.set(ww / 2 + fW / 2, yBase + sill + wh / 2, d / 2 + frameT / 2); add(rgt)
  }

  // ── Corner trim caps over the siding ends ──
  cornerTrim(1, 1)
  cornerTrim(1, -1)
  cornerTrim(-1, 1)
  cornerTrim(-1, -1)

  // ── Steep gabled roof with deep overhang (ridge runs front↔back) ──
  const ridge = h * 0.85
  const slopeRun = w / 2 + ROOF_EAVE
  const slopeRise = ridge
  const slopeLen = Math.hypot(slopeRun, slopeRise)
  const angle = Math.atan2(slopeRise, slopeRun)
  const panelDepth = d + ROOF_GABLE * 2
  const roofTopY = yBase + h

  const leftPanel = box(slopeLen, ROOF_T, panelDepth, roofMat)
  leftPanel.position.set(-slopeRun / 2, roofTopY + slopeRise / 2, 0)
  leftPanel.rotation.z = angle
  add(leftPanel)

  const rightPanel = box(slopeLen, ROOF_T, panelDepth, roofMat)
  rightPanel.position.set(slopeRun / 2, roofTopY + slopeRise / 2, 0)
  rightPanel.rotation.z = -angle
  add(rightPanel)

  // Ridge cap board along the apex.
  const ridgeCap = box(0.035, 0.028, panelDepth, wood)
  ridgeCap.position.set(0, roofTopY + ridge + 0.004, 0)
  add(ridgeCap)

  // Barge/rake boards along the gable slopes at the front & back overhang edges.
  const BARGE_W = 0.055
  const BARGE_T = 0.014
  const rake = (xSign: 1 | -1, z: number) => {
    const b = box(slopeLen + BARGE_W * 0.5, BARGE_W, BARGE_T, wood)
    b.position.set((xSign * slopeRun) / 2, roofTopY + slopeRise / 2 - BARGE_W * 0.2, z)
    b.rotation.z = -xSign * angle
    add(b)
  }
  const bargeZ = d / 2 + ROOF_GABLE - BARGE_T / 2
  rake(-1, bargeZ); rake(1, bargeZ)
  rake(-1, -bargeZ); rake(1, -bargeZ)

  // Gable end triangles (fill under the roof at front & back).
  const gableShape = new THREE.Shape()
  gableShape.moveTo(-w / 2, 0)
  gableShape.lineTo(w / 2, 0)
  gableShape.lineTo(0, ridge)
  gableShape.lineTo(-w / 2, 0)
  const gableGeom = new THREE.ExtrudeGeometry(gableShape, { depth: WALL_T, bevelEnabled: false })
  const frontGable = new THREE.Mesh(gableGeom, wood)
  frontGable.position.set(0, roofTopY, d / 2 - WALL_T)
  add(frontGable)
  const backGable = new THREE.Mesh(gableGeom.clone(), wood)
  backGable.position.set(0, roofTopY, -d / 2)
  add(backGable)

  // ── Raised platform on four legs, with a deck out front (cathouse) ──
  if (yBase > 0) {
    const DECK_T = 0.03
    const overhang = 0.04 // platform lip around the house
    const deckDepth = Math.max(0.35, d * 0.9) // deck projecting in front of the house
    const platW = w + overhang * 2
    const platFrontZ = d / 2 + deckDepth
    const platBackZ = -d / 2 - overhang
    const platDepth = platFrontZ - platBackZ
    const platCenterZ = (platFrontZ + platBackZ) / 2

    // Deck surface – the house floor sits on top of it.
    const deck = box(platW, DECK_T, platDepth, wood)
    deck.position.set(0, yBase - DECK_T / 2, platCenterZ)
    add(deck)

    // Apron board hanging along the deck front edge.
    const apron = box(platW, 0.045, 0.012, trim)
    apron.position.set(0, yBase - 0.0225, platFrontZ - 0.006)
    add(apron)

    // Four legs.
    const legX = platW / 2 - POST_SIZE * 0.7
    const legFrontZ = platFrontZ - POST_SIZE * 0.7
    const legBackZ = platBackZ + POST_SIZE * 0.7
    const legTopY = yBase - DECK_T
    const leg = (x: number, z: number) => {
      const l = box(POST_SIZE, legTopY, POST_SIZE, trim)
      l.position.set(x, legTopY / 2, z)
      add(l)
    }
    leg(-legX, legFrontZ); leg(legX, legFrontZ)
    leg(-legX, legBackZ); leg(legX, legBackZ)
  }
}

function fitCamera(group: THREE.Group, camera: THREE.PerspectiveCamera, controls: OrbitControls) {
  const box = new THREE.Box3().setFromObject(group)
  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(size)
  const maxDim = Math.max(size.x, size.y, size.z)
  const dist = maxDim * 2.1
  controls.minDistance = maxDim * 0.6
  controls.maxDistance = maxDim * 5
  controls.target.copy(center)
  camera.position.set(center.x + dist * 0.85, center.y + dist * 0.55, center.z + dist * 0.95)
  controls.update()
}

export default function AnimalHouseVisualizer(props: AnimalHouseConfig) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    group: THREE.Group
  } | null>(null)
  const didFit = useRef(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = null

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(1.2, 0.9, 1.4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.insertBefore(renderer.domElement, container.firstChild)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.maxPolarAngle = Math.PI / 2
    controls.enablePan = false

    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const key = new THREE.DirectionalLight(0xffffff, 0.85)
    key.position.set(4, 8, 6)
    key.castShadow = true
    key.shadow.mapSize.width = 1024
    key.shadow.mapSize.height = 1024
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xffffff, 0.3)
    fill.position.set(-5, 5, -5)
    scene.add(fill)

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.ShadowMaterial({ opacity: 0.18 }))
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.005
    ground.receiveShadow = true
    scene.add(ground)

    const group = new THREE.Group()
    scene.add(group)
    buildAnimalHouse(group, props)
    fitCamera(group, camera, controls)
    didFit.current = true

    let animationId = 0
    const animate = () => {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(container)

    sceneRef.current = { camera, renderer, controls, group }

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationId)
      controls.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          const m = object.material
          if (Array.isArray(m)) m.forEach((x) => x.dispose())
          else if (m) m.dispose()
        }
      })
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      sceneRef.current = null
      didFit.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Rebuild on config change. Re-fit the camera only when the overall size changes.
  useEffect(() => {
    if (!sceneRef.current) return
    const { group, camera, controls } = sceneRef.current
    buildAnimalHouse(group, props)
    if (!didFit.current) {
      fitCamera(group, camera, controls)
      didFit.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.width, props.depth, props.height, props.roof, props.finish, props.entrance, props.poleHeight])

  // Re-fit when dimensions (not just cosmetic options) change.
  useEffect(() => {
    if (!sceneRef.current) return
    const { group, camera, controls } = sceneRef.current
    fitCamera(group, camera, controls)
  }, [props.width, props.depth, props.height, props.poleHeight])

  const handleZoom = (direction: 'in' | 'out') => {
    if (!sceneRef.current) return
    const { camera, controls } = sceneRef.current
    const offset = camera.position.clone().sub(controls.target)
    const factor = direction === 'in' ? 0.8 : 1.25
    const dist = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * factor))
    offset.normalize().multiplyScalar(dist)
    camera.position.copy(controls.target).add(offset)
  }

  return (
    <Wrapper>
      <Viewport ref={containerRef}>
        <Label>Eksempel visualisering – ca. størrelse og proporsjoner</Label>
        <RotateHint>
          <span>&#9995;</span> Roter
        </RotateHint>
        <ZoomControls>
          <ZoomButton onClick={() => handleZoom('in')} aria-label="Zoom inn">+</ZoomButton>
          <ZoomButton onClick={() => handleZoom('out')} aria-label="Zoom ut">&minus;</ZoomButton>
        </ZoomControls>
      </Viewport>
    </Wrapper>
  )
}
