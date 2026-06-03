import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

type PlantekasseShape = 'square' | 'rect' | 'outside-corner' | 'inside-corner'

interface PlantekasseConfig {
  shape: PlantekasseShape
  width: number
  height: number
  depth: number
  thickness: number
  construction: string
  finish: string
  espalier: boolean
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

const HandIcon = styled.span`
  font-size: 0.7rem;
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

function disposeGroup(group: THREE.Object3D) {
  const children = [...group.children]
  children.forEach((child) => {
    if (child instanceof THREE.Group) {
      disposeGroup(child)
    } else if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        const m = child.material
        if (Array.isArray(m)) m.forEach((x) => x.dispose())
        else m.dispose()
      }
    } else if (child instanceof THREE.Sprite) {
      const m = child.material
      if (m.map) m.map.dispose()
      m.dispose()
    }
    group.remove(child)
  })
}

function darken(hex: number, factor: number) {
  const r = Math.max(0, Math.min(255, Math.floor(((hex >> 16) & 0xff) * factor)))
  const g = Math.max(0, Math.min(255, Math.floor(((hex >> 8) & 0xff) * factor)))
  const b = Math.max(0, Math.min(255, Math.floor((hex & 0xff) * factor)))
  return (r << 16) | (g << 8) | b
}

function resolveWoodColor(construction: string, finish: string): number {
  if (finish === '800') return 0xe0d4ba
  if (finish === '1500') return 0xeaeaea
  if (finish === '1200') return 0x6e4a2c
  return construction === 'whitewood' ? 0xefe1be : 0xc1c896
}

type Vec2 = [number, number]

const POST_SIZE = 0.048
const PLANK_HEIGHT = 0.12
const PLANK_GAP = 0.003
const PLANK_THICKNESS = 0.028
const RIM_WIDTH = 0.073
const RIM_HEIGHT = 0.048
const RIM_OVERHANG = 0.012

function shapeVertices(props: PlantekasseConfig, scale: number): Vec2[] {
  if (props.shape === 'outside-corner' || props.shape === 'inside-corner') {
    const w = props.width * scale
    const d = props.depth * scale
    const t = Math.min(props.thickness, Math.min(props.width, props.depth) - 10) * scale
    return [
      [-w / 2, -d / 2],
      [w / 2, -d / 2],
      [w / 2, -d / 2 + t],
      [-w / 2 + t, -d / 2 + t],
      [-w / 2 + t, d / 2],
      [-w / 2, d / 2],
    ]
  }
  const w = props.shape === 'square' ? props.width * scale : props.width * scale
  const d = props.shape === 'square' ? props.width * scale : props.depth * scale
  return [
    [-w / 2, -d / 2],
    [w / 2, -d / 2],
    [w / 2, d / 2],
    [-w / 2, d / 2],
  ]
}

function offsetPolygon(verts: Vec2[], signedOffset: number): Vec2[] {
  const n = verts.length
  return verts.map((vert, i) => {
    const prev = verts[(i - 1 + n) % n]
    const next = verts[(i + 1) % n]
    const prevDx = vert[0] - prev[0]
    const prevDz = vert[1] - prev[1]
    const nextDx = next[0] - vert[0]
    const nextDz = next[1] - vert[1]
    const prevLen = Math.hypot(prevDx, prevDz)
    const nextLen = Math.hypot(nextDx, nextDz)
    const out1X = prevDz / prevLen
    const out1Z = -prevDx / prevLen
    const out2X = nextDz / nextLen
    const out2Z = -nextDx / nextLen
    return [
      vert[0] + signedOffset * (out1X + out2X),
      vert[1] + signedOffset * (out1Z + out2Z),
    ]
  })
}

function addEdgeWall(
  group: THREE.Group,
  from: Vec2,
  to: Vec2,
  numPlanks: number,
  plankH: number,
  material: THREE.MeshStandardMaterial,
) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  const plankLen = len - POST_SIZE * 2 + 0.004
  if (plankLen <= 0) return

  const dirX = dx / len
  const dirZ = dz / len
  const inX = -dirZ
  const inZ = dirX

  const midX = (from[0] + to[0]) / 2 + inX * (PLANK_THICKNESS / 2)
  const midZ = (from[1] + to[1]) / 2 + inZ * (PLANK_THICKNESS / 2)

  const wallGroup = new THREE.Group()
  wallGroup.position.set(midX, 0, midZ)
  wallGroup.rotation.y = -Math.atan2(dirZ, dirX)

  for (let i = 0; i < numPlanks; i++) {
    const y = plankH / 2 + i * (plankH + PLANK_GAP)
    const geom = new THREE.BoxGeometry(plankLen, plankH, PLANK_THICKNESS)
    const mesh = new THREE.Mesh(geom, material)
    mesh.position.set(0, y, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    wallGroup.add(mesh)
  }
  group.add(wallGroup)
}

function addPosts(
  group: THREE.Group,
  verts: Vec2[],
  h: number,
  material: THREE.MeshStandardMaterial,
) {
  const inset = offsetPolygon(verts, -POST_SIZE / 2)
  inset.forEach(([x, z]) => {
    const geom = new THREE.BoxGeometry(POST_SIZE, h, POST_SIZE)
    const mesh = new THREE.Mesh(geom, material)
    mesh.position.set(x, h / 2, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  })
}

function buildPolygonExtrude(verts: Vec2[], holeVerts: Vec2[] | null, depth: number): THREE.BufferGeometry {
  const shape = new THREE.Shape()
  shape.moveTo(verts[0][0], verts[0][1])
  for (let i = 1; i < verts.length; i++) shape.lineTo(verts[i][0], verts[i][1])
  shape.closePath()

  if (holeVerts) {
    const hole = new THREE.Path()
    const reversed = [...holeVerts].reverse()
    hole.moveTo(reversed[0][0], reversed[0][1])
    for (let i = 1; i < reversed.length; i++) hole.lineTo(reversed[i][0], reversed[i][1])
    hole.closePath()
    shape.holes.push(hole)
  }

  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false })
  geom.rotateX(Math.PI / 2)
  return geom
}

function addRim(
  group: THREE.Group,
  verts: Vec2[],
  h: number,
  material: THREE.MeshStandardMaterial,
) {
  const outerVerts = offsetPolygon(verts, RIM_OVERHANG)
  const innerVerts = offsetPolygon(verts, -(RIM_WIDTH - RIM_OVERHANG))
  const geom = buildPolygonExtrude(outerVerts, innerVerts, RIM_HEIGHT)
  geom.translate(0, h + RIM_HEIGHT, 0)
  const mesh = new THREE.Mesh(geom, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
}

function makeLabelPlane(text: string, planeWidth: number, planeHeight: number): THREE.Mesh {
  const canvas = document.createElement('canvas')
  const ratio = planeWidth / planeHeight
  canvas.height = 128
  canvas.width = Math.round(canvas.height * ratio)
  const ctx = canvas.getContext('2d')!

  ctx.clearRect(0, 0, canvas.width, canvas.height)

  ctx.fillStyle = '#f8f8f8'
  ctx.font = `bold ${Math.round(canvas.height * 0.62)}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.anisotropy = 4
  texture.needsUpdate = true

  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
  })

  const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight)
  return new THREE.Mesh(geometry, material)
}

const L_LABELS: Record<'outside-corner' | 'inside-corner', readonly string[]> = {
  'outside-corner': ['Front A', 'Side A', 'Bak A', 'Bak B', 'Side B', 'Front B'],
  'inside-corner': ['Bak A', 'Side A', 'Front A', 'Front B', 'Side B', 'Bak B'],
}

function addLabels(
  group: THREE.Group,
  verts: Vec2[],
  h: number,
  shape: 'outside-corner' | 'inside-corner',
) {
  const labels = L_LABELS[shape]
  const labelHeight = Math.min(0.08, h * 0.25)
  const labelMargin = 0.02

  for (let i = 0; i < verts.length; i++) {
    const from = verts[i]
    const to = verts[(i + 1) % verts.length]
    const dx = to[0] - from[0]
    const dz = to[1] - from[1]
    const len = Math.hypot(dx, dz)
    if (len < 0.15) continue

    const dirX = dx / len
    const dirZ = dz / len
    const outX = dirZ
    const outZ = -dirX

    // Place at edge midpoint, on the outer face of the plank (shifted out slightly to avoid z-fighting).
    const planeWidth = Math.min(0.28, len - labelMargin * 2)
    const surfaceOffset = PLANK_THICKNESS * 0.5 + 0.001
    const px = (from[0] + to[0]) / 2 + outX * surfaceOffset
    const pz = (from[1] + to[1]) / 2 + outZ * surfaceOffset
    const py = h - labelHeight / 2 - 0.04

    const mesh = makeLabelPlane(labels[i], planeWidth, labelHeight)
    mesh.position.set(px, py, pz)
    mesh.rotation.y = Math.atan2(outX, outZ)
    group.add(mesh)
  }
}

function addEspalier(
  group: THREE.Group,
  from: Vec2,
  to: Vec2,
  h: number,
  material: THREE.MeshStandardMaterial,
) {
  const dx = to[0] - from[0]
  const dz = to[1] - from[1]
  const len = Math.hypot(dx, dz)
  if (len <= 0) return

  const dirX = dx / len
  const dirZ = dz / len
  const outX = dirZ
  const outZ = -dirX

  const offset = 0.005
  const midX = (from[0] + to[0]) / 2 + outX * offset
  const midZ = (from[1] + to[1]) / 2 + outZ * offset

  const espalierHeight = 1.0
  const baseY = h + RIM_HEIGHT
  const margin = 0.03
  const gridTarget = 0.15

  const trellis = new THREE.Group()
  trellis.position.set(midX, 0, midZ)
  trellis.rotation.y = -Math.atan2(dirZ, dirX)

  const usableLen = len - margin * 2
  const numVerticals = Math.max(2, Math.round(usableLen / gridTarget) + 1)
  const vSpacing = usableLen / (numVerticals - 1)
  const vThickness = 0.022
  const vDepth = 0.018

  for (let i = 0; i < numVerticals; i++) {
    const localX = -len / 2 + margin + i * vSpacing
    const geom = new THREE.BoxGeometry(vThickness, espalierHeight, vDepth)
    const mesh = new THREE.Mesh(geom, material)
    mesh.position.set(localX, baseY + espalierHeight / 2, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    trellis.add(mesh)
  }

  const usableHeight = espalierHeight - 0.08
  const numHorizontals = Math.max(2, Math.round(usableHeight / gridTarget) + 1)
  const hSpacing = usableHeight / (numHorizontals - 1)
  const hThickness = 0.02
  const hDepth = 0.018

  for (let i = 0; i < numHorizontals; i++) {
    const localY = baseY + 0.04 + i * hSpacing
    const geom = new THREE.BoxGeometry(len - margin * 2, hThickness, hDepth)
    const mesh = new THREE.Mesh(geom, material)
    mesh.position.set(0, localY, vDepth / 2 + hDepth / 2)
    mesh.castShadow = true
    mesh.receiveShadow = true
    trellis.add(mesh)
  }

  group.add(trellis)
}

function addSoil(
  group: THREE.Group,
  verts: Vec2[],
  h: number,
  material: THREE.MeshStandardMaterial,
) {
  const innerVerts = offsetPolygon(verts, -(PLANK_THICKNESS + 0.005))
  const soilDepth = 0.015
  const geom = buildPolygonExtrude(innerVerts, null, soilDepth)
  geom.translate(0, h - 0.005, 0)
  const mesh = new THREE.Mesh(geom, material)
  mesh.receiveShadow = true
  group.add(mesh)
}

function buildPlanterModel(group: THREE.Group, props: PlantekasseConfig) {
  disposeGroup(group)

  const scale = 0.01
  const h = props.height * scale

  const woodColor = resolveWoodColor(props.construction, props.finish)
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: woodColor,
    roughness: 0.85,
    metalness: 0.04,
  })
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: darken(woodColor, 0.85),
    roughness: 0.7,
    metalness: 0.04,
  })
  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    roughness: 1,
    metalness: 0,
  })

  const verts = shapeVertices(props, scale)
  const numEdges = verts.length

  const totalPlank = PLANK_HEIGHT + PLANK_GAP
  const numPlanks = Math.max(1, Math.floor(h / totalPlank))
  const actualPlankHeight = (h - PLANK_GAP * (numPlanks - 1)) / numPlanks

  for (let i = 0; i < numEdges; i++) {
    addEdgeWall(group, verts[i], verts[(i + 1) % numEdges], numPlanks, actualPlankHeight, woodMaterial)
  }
  addPosts(group, verts, h, trimMaterial)
  addRim(group, verts, h, trimMaterial)
  addSoil(group, verts, h, soilMaterial)
  if (props.espalier) {
    if (props.shape === 'outside-corner') {
      addEspalier(group, verts[2], verts[3], h, trimMaterial)
      addEspalier(group, verts[3], verts[4], h, trimMaterial)
    } else if (props.shape === 'inside-corner') {
      addEspalier(group, verts[5], verts[0], h, trimMaterial)
      addEspalier(group, verts[0], verts[1], h, trimMaterial)
    } else {
      addEspalier(group, verts[0], verts[1], h, trimMaterial)
    }
  }

  const isCorner = props.shape === 'inside-corner' || props.shape === 'outside-corner'
  if (isCorner) {
    addLabels(group, verts, h, props.shape as 'outside-corner' | 'inside-corner')
  }
  group.rotation.y = props.shape === 'outside-corner' ? Math.PI : 0
  group.position.y = 0
}

function centerCamera(group: THREE.Group, controls: OrbitControls) {
  const box = new THREE.Box3().setFromObject(group)
  const center = new THREE.Vector3()
  box.getCenter(center)
  controls.target.copy(center)
}

export default function ThreeVisualizer(props: PlantekasseConfig) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    group: THREE.Group
    animationId: number
  } | null>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    const scene = new THREE.Scene()
    scene.background = null

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(1.6, 1.1, 2.0)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.insertBefore(renderer.domElement, container.firstChild)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.2
    controls.maxDistance = 5
    controls.maxPolarAngle = Math.PI / 2
    controls.enablePan = false
    controls.autoRotate = false

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.85)
    directionalLight.position.set(4, 8, 6)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    const groundGeometry = new THREE.PlaneGeometry(10, 10)
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.18 })
    const ground = new THREE.Mesh(groundGeometry, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    scene.add(ground)

    const group = new THREE.Group()
    scene.add(group)

    buildPlanterModel(group, props)
    centerCamera(group, controls)

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

    sceneRef.current = { scene, camera, renderer, controls, group, animationId }

    return () => {
      resizeObserver.disconnect()
      cancelAnimationFrame(animationId)
      controls.dispose()
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            const m = object.material
            if (Array.isArray(m)) m.forEach((x) => x.dispose())
            else m.dispose()
          }
        }
      })
      renderer.dispose()
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      sceneRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!sceneRef.current) return
    buildPlanterModel(sceneRef.current.group, props)
    centerCamera(sceneRef.current.group, sceneRef.current.controls)
  }, [props.shape, props.width, props.height, props.depth, props.thickness, props.construction, props.finish, props.espalier])

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
          <HandIcon>&#9995;</HandIcon>
          Roter
        </RotateHint>
        <ZoomControls>
          <ZoomButton onClick={() => handleZoom('in')} aria-label="Zoom inn">
            +
          </ZoomButton>
          <ZoomButton onClick={() => handleZoom('out')} aria-label="Zoom ut">
            &minus;
          </ZoomButton>
        </ZoomControls>
      </Viewport>
    </Wrapper>
  )
}
