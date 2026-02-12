import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface ThreeVisualizerProps {
  width: number
  height: number
  depth: number
  angle: number
  mounting: 'wall' | 'freestanding'
  finish: string
  roof: string
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
  color: #aaa;
  display: flex;
  align-items: center;
  gap: 4px;
  pointer-events: none;
  z-index: 1;
`

const HandIcon = styled.span`
  font-size: 0.7rem;
`

function createSlatWall(
  wallWidth: number,
  _wallHeight: number,
  slatHeight: number,
  slatGap: number,
  material: THREE.MeshStandardMaterial,
  tapered: boolean = false,
  heightAtStart: number | null = null,
  heightAtEnd: number | null = null,
): THREE.Group {
  const wallGroup = new THREE.Group()
  const slatDepth = 0.02
  const totalSlatHeight = slatHeight + slatGap
  const maxHeight = tapered ? Math.max(heightAtStart!, heightAtEnd!) : _wallHeight
  const numSlats = Math.floor(maxHeight / totalSlatHeight)
  const startY = slatHeight / 2

  for (let i = 0; i < numSlats; i++) {
    const slatY = startY + i * totalSlatHeight

    if (tapered) {
      const minRoofHeight = Math.min(heightAtStart!, heightAtEnd!)
      if (slatY + slatHeight / 2 > minRoofHeight) {
        continue
      }
    }

    const slatGeometry = new THREE.BoxGeometry(wallWidth, slatHeight, slatDepth)
    const slat = new THREE.Mesh(slatGeometry, material)
    slat.position.x = 0
    slat.position.y = slatY
    slat.castShadow = true
    slat.receiveShadow = true
    wallGroup.add(slat)
  }

  return wallGroup
}

function disposeGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0] as THREE.Mesh
    if (child.geometry) child.geometry.dispose()
    if (child.material) {
      const material = child.material
      if (Array.isArray(material)) {
        material.forEach((m) => m.dispose())
      } else {
        material.dispose()
      }
    }
    group.remove(child)
  }
}

function buildHouseModel(
  houseGroup: THREE.Group,
  props: ThreeVisualizerProps,
) {
  disposeGroup(houseGroup)

  const scale = 0.01
  const w = props.width * scale
  const h = props.height * scale
  const d = props.depth * scale

  const isFreestanding = props.mounting === 'freestanding'

  let woodColor = 0xc9a66b
  if (props.finish === '800') woodColor = 0xd4c4a8
  else if (props.finish === '1500') woodColor = 0x4a4a4a

  let roofColor = 0xc9a66b
  if (props.roof === '300') roofColor = 0x2d2d2d
  else if (props.roof === '500') roofColor = 0x5d4e37

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: woodColor,
    roughness: 0.8,
    metalness: 0.1,
  })
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: roofColor,
    roughness: 0.7,
    metalness: 0.1,
  })
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x8b7355,
    roughness: 0.6,
    metalness: 0.1,
  })

  const slatWidth = 0.04
  const slatGap = 0.02

  const roofAngle = (props.angle * Math.PI) / 180
  const frontHeight = h
  const backHeight = isFreestanding ? h : h + d * Math.tan(roofAngle)

  // Front wall
  const frontWall = createSlatWall(w, frontHeight, slatWidth, slatGap, woodMaterial)
  frontWall.position.z = d / 2
  houseGroup.add(frontWall)

  // Left wall
  const leftWall = createSlatWall(d, frontHeight, slatWidth, slatGap, woodMaterial)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.x = -w / 2
  houseGroup.add(leftWall)

  // Right wall
  const rightWall = createSlatWall(d, frontHeight, slatWidth, slatGap, woodMaterial)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.x = w / 2
  houseGroup.add(rightWall)

  // Back wall
  if (isFreestanding) {
    const backWall = createSlatWall(w, backHeight, slatWidth, slatGap, woodMaterial)
    backWall.rotation.y = Math.PI
    backWall.position.z = -d / 2
    houseGroup.add(backWall)
  } else {
    const backPanelGeometry = new THREE.BoxGeometry(w, backHeight, 0.02)
    const backPanel = new THREE.Mesh(backPanelGeometry, frameMaterial)
    backPanel.position.z = -d / 2
    backPanel.position.y = backHeight / 2
    backPanel.castShadow = true
    backPanel.receiveShadow = true
    houseGroup.add(backPanel)
  }

  // Corner posts
  const postSize = 0.04
  const frontPostHeight = frontHeight
  const backPostHeight = backHeight

  const corners = [
    { x: -w / 2 + postSize / 2, z: d / 2 - postSize / 2, h: frontPostHeight },
    { x: w / 2 - postSize / 2, z: d / 2 - postSize / 2, h: frontPostHeight },
    { x: -w / 2 + postSize / 2, z: -d / 2 + postSize / 2, h: backPostHeight },
    { x: w / 2 - postSize / 2, z: -d / 2 + postSize / 2, h: backPostHeight },
  ]

  corners.forEach((corner) => {
    const postGeometry = new THREE.BoxGeometry(postSize, corner.h, postSize)
    const post = new THREE.Mesh(postGeometry, frameMaterial)
    post.position.set(corner.x, corner.h / 2, corner.z)
    post.castShadow = true
    post.receiveShadow = true
    houseGroup.add(post)
  })

  // Roof
  const roofOverhang = 0.05
  const roofThickness = 0.03

  if (isFreestanding) {
    const ridgeHeight = frontHeight + (d / 2) * Math.tan(roofAngle)
    const roofSideLength = (d / 2 + roofOverhang) / Math.cos(roofAngle)

    const frontRoofGeometry = new THREE.BoxGeometry(
      w + roofOverhang * 2,
      roofThickness,
      roofSideLength,
    )
    const frontRoof = new THREE.Mesh(frontRoofGeometry, roofMaterial)
    frontRoof.position.set(
      0,
      ridgeHeight - (d / 4) * Math.tan(roofAngle),
      ((d / 4 + roofOverhang / 2) * Math.cos(roofAngle)),
    )
    frontRoof.rotation.x = roofAngle
    frontRoof.castShadow = true
    frontRoof.receiveShadow = true
    houseGroup.add(frontRoof)

    const backRoofGeometry = new THREE.BoxGeometry(
      w + roofOverhang * 2,
      roofThickness,
      roofSideLength,
    )
    const backRoof = new THREE.Mesh(backRoofGeometry, roofMaterial)
    backRoof.position.set(
      0,
      ridgeHeight - (d / 4) * Math.tan(roofAngle),
      -((d / 4 + roofOverhang / 2) * Math.cos(roofAngle)),
    )
    backRoof.rotation.x = -roofAngle
    backRoof.castShadow = true
    backRoof.receiveShadow = true
    houseGroup.add(backRoof)
  } else {
    const roofDepthAdjusted = (d + roofOverhang * 2) / Math.cos(roofAngle)
    const roofGeometry = new THREE.BoxGeometry(
      w + roofOverhang * 2,
      roofThickness,
      roofDepthAdjusted,
    )
    const roof = new THREE.Mesh(roofGeometry, roofMaterial)
    const roofHeightAtBack = backHeight + roofThickness / 2
    const roofHeightAtFront = frontHeight + roofThickness / 2
    const roofCenterHeight = (roofHeightAtBack + roofHeightAtFront) / 2
    roof.position.y = roofCenterHeight
    roof.position.z = 0
    roof.rotation.x = roofAngle
    roof.castShadow = true
    roof.receiveShadow = true
    houseGroup.add(roof)
  }

  houseGroup.position.y = 0
}

export default function ThreeVisualizer(props: ThreeVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    houseGroup: THREE.Group
    animationId: number
  } | null>(null)

  // Initialize Three.js scene
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const width = container.clientWidth
    const height = container.clientHeight

    // Scene
    const scene = new THREE.Scene()
    scene.background = null

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000)
    camera.position.set(1.0, 0.9, 1.3)

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.insertBefore(renderer.domElement, container.firstChild)

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.5
    controls.maxDistance = 5
    controls.maxPolarAngle = Math.PI / 2
    controls.enablePan = false
    controls.target.set(0, 0.35, 0)

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(5, 10, 7)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 1024
    directionalLight.shadow.mapSize.height = 1024
    scene.add(directionalLight)

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
    fillLight.position.set(-5, 5, -5)
    scene.add(fillLight)

    // Shadow-only ground plane
    const groundGeometry = new THREE.PlaneGeometry(10, 10)
    const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.15 })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    scene.add(ground)

    // House group
    const houseGroup = new THREE.Group()
    scene.add(houseGroup)

    // Build initial model
    buildHouseModel(houseGroup, props)

    // Animation loop
    let animationId = 0
    function animate() {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    function onWindowResize() {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onWindowResize)

    // Store refs
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      houseGroup,
      animationId,
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', onWindowResize)
      cancelAnimationFrame(animationId)
      controls.dispose()

      // Dispose all objects in the scene
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) object.geometry.dispose()
          if (object.material) {
            const material = object.material
            if (Array.isArray(material)) {
              material.forEach((m) => m.dispose())
            } else {
              material.dispose()
            }
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

  // Update house model when props change
  useEffect(() => {
    if (!sceneRef.current) return
    buildHouseModel(sceneRef.current.houseGroup, props)
  }, [props.width, props.height, props.depth, props.angle, props.mounting, props.finish, props.roof])

  return (
    <Wrapper>
      <Viewport ref={containerRef}>
        <Label>Eksempel visualisering for å se størrelsen omtrentlig</Label>
        <RotateHint>
          <HandIcon>&#9995;</HandIcon>
          Roter
        </RotateHint>
      </Viewport>
    </Wrapper>
  )
}
