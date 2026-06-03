import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export type LeveggType = 'rett' | 'hjornne'
export type LeveggOrientation = 'vertikal' | 'horisontal'

export interface LeveggConfig {
  type: LeveggType
  orientation: LeveggOrientation
  width: number
  widthB: number
  height: number
}

const IMPREGNATED_WOOD_COLOR = 0xc1c896

const SCALE = 0.01
const POST_WIDTH = 0.048
const POST_DEPTH = 0.073
const RAIL_HEIGHT = 0.048
const RAIL_DEPTH = 0.073
const SLAT_FACE = 0.048
const SLAT_DEPTH = 0.036
const SLAT_GAP = 0.023
const SLAT_FRONT_INSET = 0.010
const LEKT_WIDTH = 0.048
const LEKT_DEPTH = 0.023
const LEKT_END_INSET = 0.010
const LEKT_MAX_SPACING = 0.80
const FRAME_HALF_DEPTH = RAIL_DEPTH / 2
const SLAT_CENTER_Z = FRAME_HALF_DEPTH - SLAT_FRONT_INSET - SLAT_DEPTH / 2
const LEKT_CENTER_Z = SLAT_CENTER_Z - SLAT_DEPTH / 2 - LEKT_DEPTH / 2

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
      if (child.material) {
        const m = child.material
        if (Array.isArray(m)) m.forEach((x) => x.dispose())
        else m.dispose()
      }
    }
    group.remove(child)
  })
}

function buildPanel(
  parent: THREE.Group,
  widthM: number,
  heightM: number,
  woodMaterial: THREE.MeshStandardMaterial,
  trimMaterial: THREE.MeshStandardMaterial,
  options: { leftPost: boolean; rightPost: boolean; orientation: LeveggOrientation },
) {
  const innerWidth = widthM - POST_WIDTH * 2
  if (innerWidth <= 0) return

  // Side posts (48 × 73 mm — 73 mm visible face, 48 mm deep)
  if (options.leftPost) {
    const left = new THREE.Mesh(
      new THREE.BoxGeometry(POST_WIDTH, heightM, POST_DEPTH),
      trimMaterial,
    )
    left.position.set(-widthM / 2 + POST_WIDTH / 2, heightM / 2, 0)
    left.castShadow = true
    left.receiveShadow = true
    parent.add(left)
  }
  if (options.rightPost) {
    const right = new THREE.Mesh(
      new THREE.BoxGeometry(POST_WIDTH, heightM, POST_DEPTH),
      trimMaterial,
    )
    right.position.set(widthM / 2 - POST_WIDTH / 2, heightM / 2, 0)
    right.castShadow = true
    right.receiveShadow = true
    parent.add(right)
  }

  // Top and bottom rails (48 × 73 mm — 73 mm vertical face, 48 mm deep)
  const railGeom = new THREE.BoxGeometry(innerWidth, RAIL_HEIGHT, RAIL_DEPTH)
  const topRail = new THREE.Mesh(railGeom, woodMaterial)
  topRail.position.set(0, heightM - RAIL_HEIGHT / 2 - 0.02, 0)
  topRail.castShadow = true
  topRail.receiveShadow = true
  parent.add(topRail)

  const bottomRail = new THREE.Mesh(railGeom.clone(), woodMaterial)
  bottomRail.position.set(0, RAIL_HEIGHT / 2 + 0.02, 0)
  bottomRail.castShadow = true
  bottomRail.receiveShadow = true
  parent.add(bottomRail)

  // Inner vertical extent available for slats and lekter
  const slatHeight = heightM - RAIL_HEIGHT * 2 - 0.04
  if (slatHeight <= 0) return
  const slatY = (RAIL_HEIGHT + 0.02) + slatHeight / 2
  const bottomY = slatY - slatHeight / 2

  // Slats (43 × 48 mm — 48 mm visible face, 43 mm depth) in panel plane (z = 0)
  const pitch = SLAT_FACE + SLAT_GAP
  if (options.orientation === 'horisontal') {
    const slatCount = Math.max(1, Math.floor((slatHeight + SLAT_GAP) / pitch))
    const totalSlatSpan = slatCount * SLAT_FACE + (slatCount - 1) * SLAT_GAP
    const startY = bottomY + (slatHeight - totalSlatSpan) / 2 + SLAT_FACE / 2
    const slatGeom = new THREE.BoxGeometry(innerWidth, SLAT_FACE, SLAT_DEPTH)
    for (let i = 0; i < slatCount; i++) {
      const slat = new THREE.Mesh(slatGeom, woodMaterial)
      slat.position.set(0, startY + i * pitch, SLAT_CENTER_Z)
      slat.castShadow = true
      slat.receiveShadow = true
      parent.add(slat)
    }
  } else {
    const slatCount = Math.max(1, Math.floor((innerWidth + SLAT_GAP) / pitch))
    const totalSlatSpan = slatCount * SLAT_FACE + (slatCount - 1) * SLAT_GAP
    const startX = -totalSlatSpan / 2 + SLAT_FACE / 2
    const slatGeom = new THREE.BoxGeometry(SLAT_FACE, slatHeight, SLAT_DEPTH)
    for (let i = 0; i < slatCount; i++) {
      const slat = new THREE.Mesh(slatGeom, woodMaterial)
      slat.position.set(startX + i * pitch, slatY, SLAT_CENTER_Z)
      slat.castShadow = true
      slat.receiveShadow = true
      parent.add(slat)
    }
  }

  // Lekter (23 × 48 mm) mounted on the back face of the slats, inside the
  // frame depth. Perpendicular to slat direction, max 80 cm spacing, with
  // 10 mm gap to the frame on each end.
  if (options.orientation === 'vertikal') {
    // Horizontal lekter run between side posts at vertical intervals
    const spans = Math.max(1, Math.ceil(slatHeight / LEKT_MAX_SPACING))
    const lektCount = spans - 1
    if (lektCount > 0) {
      const lektSpacing = slatHeight / spans
      const lektLength = Math.max(0.05, innerWidth - 2 * LEKT_END_INSET)
      const lektGeom = new THREE.BoxGeometry(lektLength, LEKT_WIDTH, LEKT_DEPTH)
      for (let i = 1; i <= lektCount; i++) {
        const y = bottomY + lektSpacing * i
        const lekt = new THREE.Mesh(lektGeom, trimMaterial)
        lekt.position.set(0, y, LEKT_CENTER_Z)
        lekt.castShadow = true
        lekt.receiveShadow = true
        parent.add(lekt)
      }
    }
  } else {
    // Vertical lekter run between top and bottom rails at horizontal intervals
    const spans = Math.max(1, Math.ceil(innerWidth / LEKT_MAX_SPACING))
    const lektCount = spans - 1
    if (lektCount > 0) {
      const lektSpacing = innerWidth / spans
      const lektHeight = Math.max(0.05, slatHeight - 2 * LEKT_END_INSET)
      const lektGeom = new THREE.BoxGeometry(LEKT_WIDTH, lektHeight, LEKT_DEPTH)
      for (let i = 1; i <= lektCount; i++) {
        const x = -widthM / 2 + POST_WIDTH + lektSpacing * i
        const lekt = new THREE.Mesh(lektGeom, trimMaterial)
        lekt.position.set(x, slatY, LEKT_CENTER_Z)
        lekt.castShadow = true
        lekt.receiveShadow = true
        parent.add(lekt)
      }
    }
  }
}

function buildLeveggModel(group: THREE.Group, config: LeveggConfig) {
  disposeGroup(group)

  const wA = config.width * SCALE
  const wB = config.widthB * SCALE
  const h = config.height * SCALE

  const woodColor = IMPREGNATED_WOOD_COLOR
  const woodMaterial = new THREE.MeshStandardMaterial({
    color: woodColor,
    roughness: 0.82,
    metalness: 0.04,
  })
  const trimMaterial = new THREE.MeshStandardMaterial({
    color: darken(woodColor, 0.88),
    roughness: 0.7,
    metalness: 0.04,
  })

  if (config.type === 'rett') {
    buildPanel(group, wA, h, woodMaterial, trimMaterial, {
      leftPost: true,
      rightPost: true,
      orientation: config.orientation,
    })
    return
  }

  // Hjørne: two panels joined at 90° via a shared corner post.
  // Panel A runs along the X axis with width wA, Panel B runs along Z with width wB.
  const cornerPost = new THREE.Mesh(
    new THREE.BoxGeometry(POST_WIDTH, h, POST_WIDTH),
    trimMaterial,
  )
  cornerPost.position.set(0, h / 2, 0)
  cornerPost.castShadow = true
  cornerPost.receiveShadow = true
  group.add(cornerPost)

  const panelA = new THREE.Group()
  buildPanel(panelA, wA, h, woodMaterial, trimMaterial, {
    leftPost: true,
    rightPost: false,
    orientation: config.orientation,
  })
  panelA.position.set(-wA / 2, 0, 0)
  group.add(panelA)

  const panelB = new THREE.Group()
  buildPanel(panelB, wB, h, woodMaterial, trimMaterial, {
    leftPost: false,
    rightPost: true,
    orientation: config.orientation,
  })
  panelB.position.set(0, 0, wB / 2)
  panelB.rotation.y = Math.PI / 2
  group.add(panelB)
}

function centerCamera(group: THREE.Group, controls: OrbitControls, config: LeveggConfig) {
  const box = new THREE.Box3().setFromObject(group)
  const center = new THREE.Vector3()
  box.getCenter(center)
  controls.target.copy(center)
  // Pull camera back further for corner config since the model is deeper
  const distance = config.type === 'hjornne' ? 3.2 : 2.4
  const size = Math.max(config.width, config.widthB) * SCALE
  controls.minDistance = Math.max(0.8, size * 0.6)
  controls.maxDistance = Math.max(distance + 2, size * 4)
}

export default function ThreeVisualizer(config: LeveggConfig) {
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
    camera.position.set(2.2, 1.5, 2.4)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.insertBefore(renderer.domElement, container.firstChild)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 0.8
    controls.maxDistance = 8
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

    const groundGeometry = new THREE.PlaneGeometry(20, 20)
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.18 })
    const ground = new THREE.Mesh(groundGeometry, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.005
    ground.receiveShadow = true
    scene.add(ground)

    const group = new THREE.Group()
    scene.add(group)

    buildLeveggModel(group, config)
    centerCamera(group, controls, config)

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
    buildLeveggModel(sceneRef.current.group, config)
    centerCamera(sceneRef.current.group, sceneRef.current.controls, config)
  }, [config.type, config.orientation, config.width, config.widthB, config.height])

  const handleZoom = (direction: 'in' | 'out') => {
    if (!sceneRef.current) return
    const { camera, controls } = sceneRef.current
    const offset = camera.position.clone().sub(controls.target)
    const factor = direction === 'in' ? 0.8 : 1.25
    const dist = Math.max(
      controls.minDistance,
      Math.min(controls.maxDistance, offset.length() * factor),
    )
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
