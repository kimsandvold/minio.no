import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface PidestallConfig {
  width: number
  depth: number
  height: number
}

const IMPREGNATED_WOOD_COLOR = 0xc1c896

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

const LEG_SIZE = 0.048
const TOP_THICKNESS = 0.023
const TOP_PLANK_WIDTH = 0.046
const TOP_PLANK_GAP = 0.001
const RAIL_HEIGHT = 0.05
const RAIL_THICKNESS = 0.022
const RAIL_INSET_FROM_BOTTOM = 0.06
const TOP_OVERHANG = 0.012

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

function buildPidestallModel(group: THREE.Group, props: PidestallConfig) {
  disposeGroup(group)

  const scale = 0.01
  const w = props.width * scale
  const d = props.depth * scale
  const h = props.height * scale

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

  const legHeight = h - TOP_THICKNESS
  const legPositions: Array<[number, number]> = [
    [-w / 2 + LEG_SIZE / 2, -d / 2 + LEG_SIZE / 2],
    [w / 2 - LEG_SIZE / 2, -d / 2 + LEG_SIZE / 2],
    [w / 2 - LEG_SIZE / 2, d / 2 - LEG_SIZE / 2],
    [-w / 2 + LEG_SIZE / 2, d / 2 - LEG_SIZE / 2],
  ]

  legPositions.forEach(([x, z]) => {
    const geom = new THREE.BoxGeometry(LEG_SIZE, legHeight, LEG_SIZE)
    const mesh = new THREE.Mesh(geom, trimMaterial)
    mesh.position.set(x, legHeight / 2, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  })

  const footMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a2a2a,
    roughness: 0.45,
    metalness: 0.55,
  })
  const footRadius = LEG_SIZE * 0.55
  const footHeight = 0.018
  const stemHeight = 0.012
  const stemRadius = LEG_SIZE * 0.18
  const [fx, fz] = legPositions[0]
  const footGroup = new THREE.Group()
  const footPad = new THREE.Mesh(
    new THREE.CylinderGeometry(footRadius, footRadius * 0.92, footHeight, 24),
    footMaterial,
  )
  footPad.position.set(fx, footHeight / 2, fz)
  footPad.castShadow = true
  footPad.receiveShadow = true
  footGroup.add(footPad)
  const footStem = new THREE.Mesh(
    new THREE.CylinderGeometry(stemRadius, stemRadius, stemHeight, 16),
    footMaterial,
  )
  footStem.position.set(fx, footHeight + stemHeight / 2, fz)
  footStem.castShadow = true
  footGroup.add(footStem)
  group.add(footGroup)

  const railY = RAIL_INSET_FROM_BOTTOM + RAIL_HEIGHT / 2
  const railLengthX = w - LEG_SIZE * 2 + 0.004
  const railLengthZ = d - LEG_SIZE * 2 + 0.004

  if (railLengthX > 0) {
    const railGeomX = new THREE.BoxGeometry(railLengthX, RAIL_HEIGHT, RAIL_THICKNESS)
    const front = new THREE.Mesh(railGeomX, woodMaterial)
    front.position.set(0, railY, -d / 2 + LEG_SIZE / 2)
    front.castShadow = true
    front.receiveShadow = true
    group.add(front)
    const back = new THREE.Mesh(railGeomX.clone(), woodMaterial)
    back.position.set(0, railY, d / 2 - LEG_SIZE / 2)
    back.castShadow = true
    back.receiveShadow = true
    group.add(back)
  }
  if (railLengthZ > 0) {
    const railGeomZ = new THREE.BoxGeometry(RAIL_THICKNESS, RAIL_HEIGHT, railLengthZ)
    const left = new THREE.Mesh(railGeomZ, woodMaterial)
    left.position.set(-w / 2 + LEG_SIZE / 2, railY, 0)
    left.castShadow = true
    left.receiveShadow = true
    group.add(left)
    const right = new THREE.Mesh(railGeomZ.clone(), woodMaterial)
    right.position.set(w / 2 - LEG_SIZE / 2, railY, 0)
    right.castShadow = true
    right.receiveShadow = true
    group.add(right)
  }

  const apronY = legHeight - RAIL_HEIGHT / 2 - 0.005
  if (railLengthX > 0) {
    const apronGeomX = new THREE.BoxGeometry(railLengthX, RAIL_HEIGHT, RAIL_THICKNESS)
    const frontA = new THREE.Mesh(apronGeomX, woodMaterial)
    frontA.position.set(0, apronY, -d / 2 + LEG_SIZE / 2)
    frontA.castShadow = true
    frontA.receiveShadow = true
    group.add(frontA)
    const backA = new THREE.Mesh(apronGeomX.clone(), woodMaterial)
    backA.position.set(0, apronY, d / 2 - LEG_SIZE / 2)
    backA.castShadow = true
    backA.receiveShadow = true
    group.add(backA)
  }
  if (railLengthZ > 0) {
    const apronGeomZ = new THREE.BoxGeometry(RAIL_THICKNESS, RAIL_HEIGHT, railLengthZ)
    const leftA = new THREE.Mesh(apronGeomZ, woodMaterial)
    leftA.position.set(-w / 2 + LEG_SIZE / 2, apronY, 0)
    leftA.castShadow = true
    leftA.receiveShadow = true
    group.add(leftA)
    const rightA = new THREE.Mesh(apronGeomZ.clone(), woodMaterial)
    rightA.position.set(w / 2 - LEG_SIZE / 2, apronY, 0)
    rightA.castShadow = true
    rightA.receiveShadow = true
    group.add(rightA)
  }

  const topW = w + TOP_OVERHANG * 2
  const topD = d + TOP_OVERHANG * 2
  const numPlanks = Math.max(1, Math.round((topD + TOP_PLANK_GAP) / (TOP_PLANK_WIDTH + TOP_PLANK_GAP)))
  const actualPlankWidth = (topD - TOP_PLANK_GAP * (numPlanks - 1)) / numPlanks
  const topY = legHeight + TOP_THICKNESS / 2
  for (let i = 0; i < numPlanks; i++) {
    const zCenter = -topD / 2 + actualPlankWidth / 2 + i * (actualPlankWidth + TOP_PLANK_GAP)
    const plankGeom = new THREE.BoxGeometry(topW, TOP_THICKNESS, actualPlankWidth)
    const plank = new THREE.Mesh(plankGeom, woodMaterial)
    plank.position.set(0, topY, zCenter)
    plank.castShadow = true
    plank.receiveShadow = true
    group.add(plank)
  }
}

function centerCamera(group: THREE.Group, controls: OrbitControls) {
  const box = new THREE.Box3().setFromObject(group)
  const center = new THREE.Vector3()
  box.getCenter(center)
  controls.target.copy(center)
}

export default function ThreeVisualizer(props: PidestallConfig) {
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
    camera.position.set(0.85, 0.7, 1.05)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.insertBefore(renderer.domElement, container.firstChild)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 0.6
    controls.maxDistance = 4
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
    ground.position.y = -0.005
    ground.receiveShadow = true
    scene.add(ground)

    const group = new THREE.Group()
    scene.add(group)

    buildPidestallModel(group, props)
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
    buildPidestallModel(sceneRef.current.group, props)
    centerCamera(sceneRef.current.group, sceneRef.current.controls)
  }, [props.width, props.depth, props.height])

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
