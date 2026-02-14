import { useRef, useEffect, useState } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { useScrollLock } from '../../../hooks/useScrollLock'
import {
  SidebarPanel, SidebarHeader, SidebarTitle, SidebarClose, SidebarBody,
  SbSection, SbLabel, SbSliderGroup, SbSliderRow, SbSliderName, SbSliderVal, SbSlider,
  SegRow, SegBtn,
} from '../../shared/FullscreenSidebar'

interface VisualizerConfig {
  width: number
  height: number
  depth: number
  angle: number
  mounting: 'wall' | 'freestanding'
  finish: string
  roof: string
}

interface ThreeVisualizerProps extends VisualizerConfig {
  onConfigChange?: (config: VisualizerConfig) => void
}

const Wrapper = styled.div<{ $fullscreen?: boolean }>`
  width: 100%;
  margin-bottom: 2rem;

  ${({ $fullscreen }) => $fullscreen && `
    position: fixed;
    inset: 0;
    z-index: 10000;
    background: #fff;
    margin: 0;
    display: flex;
    flex-direction: row;
    height: 100vh;
    overflow: hidden;
  `}
`

const Viewport = styled.div<{ $fullscreen?: boolean }>`
  ${({ $fullscreen }) => $fullscreen ? `
    flex: 1;
    height: 100vh;
    min-width: 0;
  ` : `
    width: 100%;
    aspect-ratio: 4 / 3;
  `}
  position: relative;
  border-radius: ${({ $fullscreen }) => $fullscreen ? '0' : '8px'};
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

const FullscreenLogo = styled.img`
  position: absolute;
  top: 16px;
  left: 16px;
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
  props: VisualizerConfig,
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

function centerCamera(houseGroup: THREE.Group, controls: OrbitControls) {
  const box = new THREE.Box3().setFromObject(houseGroup)
  const center = new THREE.Vector3()
  box.getCenter(center)
  controls.target.copy(center)
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
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 })
    const ground = new THREE.Mesh(groundGeometry, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    scene.add(ground)

    // House group
    const houseGroup = new THREE.Group()
    scene.add(houseGroup)

    // Build initial model
    buildHouseModel(houseGroup, props)
    centerCamera(houseGroup, controls)

    // Animation loop
    let animationId = 0
    function animate() {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // Handle resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth
      const h = container.clientHeight
      if (w === 0 || h === 0) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    resizeObserver.observe(container)

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
      resizeObserver.disconnect()
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
    centerCamera(sceneRef.current.houseGroup, sceneRef.current.controls)
  }, [props.width, props.height, props.depth, props.angle, props.mounting, props.finish, props.roof])

  const [isFullscreen, setIsFullscreen] = useState(false)
  useScrollLock(isFullscreen)

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

  const handleZoom = (direction: 'in' | 'out') => {
    if (!sceneRef.current) return
    const { camera, controls } = sceneRef.current
    const offset = camera.position.clone().sub(controls.target)
    const factor = direction === 'in' ? 0.8 : 1.25
    const dist = Math.max(controls.minDistance, Math.min(controls.maxDistance, offset.length() * factor))
    offset.normalize().multiplyScalar(dist)
    camera.position.copy(controls.target).add(offset)
  }

  const config: VisualizerConfig = {
    width: props.width,
    height: props.height,
    depth: props.depth,
    angle: props.angle,
    mounting: props.mounting,
    finish: props.finish,
    roof: props.roof,
  }

  const update = (partial: Partial<VisualizerConfig>) => {
    props.onConfigChange?.({ ...config, ...partial })
  }

  return (
    <Wrapper $fullscreen={isFullscreen}>
      <Viewport ref={containerRef} $fullscreen={isFullscreen}>
        {!isFullscreen && <Label>Eksempel visualisering for å se størrelsen omtrentlig</Label>}
        {isFullscreen && <FullscreenLogo src="/images/branding/logo_dark.svg" alt="Minio" />}
        <RotateHint>
          <HandIcon>&#9995;</HandIcon>
          Roter
        </RotateHint>
        <ZoomControls>
          <ZoomButton onClick={() => handleZoom('in')} aria-label="Zoom inn">+</ZoomButton>
          <ZoomButton onClick={() => handleZoom('out')} aria-label="Zoom ut">&minus;</ZoomButton>
          {!isFullscreen && <FullscreenBtn onClick={() => setIsFullscreen(true)} aria-label="Fullskjerm">&#x26F6;</FullscreenBtn>}
        </ZoomControls>
      </Viewport>

      {isFullscreen && (
        <SidebarPanel>
          <SidebarHeader>
            <SidebarTitle>Tilpass</SidebarTitle>
            <SidebarClose onClick={() => setIsFullscreen(false)} aria-label="Lukk">&times;</SidebarClose>
          </SidebarHeader>
          <SidebarBody>
            <SbSection>
              <SbLabel>Monteringstype</SbLabel>
              <SegRow>
                <SegBtn $active={props.mounting === 'wall'} onClick={() => update({ mounting: 'wall' })}>Vegghengt</SegBtn>
                <SegBtn $active={props.mounting === 'freestanding'} onClick={() => update({ mounting: 'freestanding' })}>Frittstående</SegBtn>
              </SegRow>
            </SbSection>

            <SbSection>
              <SbLabel>Mål</SbLabel>
              <SbSliderGroup>
                <SbSliderRow>
                  <SbSliderName>Bredde</SbSliderName>
                  <SbSliderVal>{props.width} cm</SbSliderVal>
                </SbSliderRow>
                <SbSlider type="range" min={70} max={200} step={1} value={props.width} onChange={(e) => update({ width: +e.target.value })} />
              </SbSliderGroup>
              <SbSliderGroup>
                <SbSliderRow>
                  <SbSliderName>Høyde</SbSliderName>
                  <SbSliderVal>{props.height} cm</SbSliderVal>
                </SbSliderRow>
                <SbSlider type="range" min={50} max={200} step={1} value={props.height} onChange={(e) => update({ height: +e.target.value })} />
              </SbSliderGroup>
              <SbSliderGroup>
                <SbSliderRow>
                  <SbSliderName>Dybde</SbSliderName>
                  <SbSliderVal>{props.depth} cm</SbSliderVal>
                </SbSliderRow>
                <SbSlider type="range" min={40} max={150} step={1} value={props.depth} onChange={(e) => update({ depth: +e.target.value })} />
              </SbSliderGroup>
            </SbSection>

            <SbSection>
              <SbLabel>Takvinkel</SbLabel>
              <SbSliderGroup>
                <SbSliderRow>
                  <SbSliderName>Vinkel</SbSliderName>
                  <SbSliderVal>{props.angle}°</SbSliderVal>
                </SbSliderRow>
                <SbSlider type="range" min={0} max={45} step={1} value={props.angle} onChange={(e) => update({ angle: +e.target.value })} />
              </SbSliderGroup>
            </SbSection>

            <SbSection>
              <SbLabel>Overflatebehandling</SbLabel>
              <SegRow>
                <SegBtn $active={props.finish === '0'} onClick={() => update({ finish: '0' })}>Ubehandlet</SegBtn>
                <SegBtn $active={props.finish === '800'} onClick={() => update({ finish: '800' })}>Grunnet</SegBtn>
                <SegBtn $active={props.finish === '1500'} onClick={() => update({ finish: '1500' })}>Malt</SegBtn>
              </SegRow>
            </SbSection>

            <SbSection>
              <SbLabel>Taktype</SbLabel>
              <SegRow>
                <SegBtn $active={props.roof === '0'} onClick={() => update({ roof: '0' })}>Panel</SegBtn>
                <SegBtn $active={props.roof === '300'} onClick={() => update({ roof: '300' })}>Takpapp</SegBtn>
                <SegBtn $active={props.roof === '500'} onClick={() => update({ roof: '500' })}>Impregnert</SegBtn>
              </SegRow>
            </SbSection>
          </SidebarBody>
        </SidebarPanel>
      )}
    </Wrapper>
  )
}
