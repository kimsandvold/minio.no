import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface SoppelboderVisualizerProps {
  width: number
  height: number
  depth: number
  binCount: number
  doorType: string
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

// ── Geometry helpers ────────────────────────────────────────────────

function createVerticalSlatWall(
  wallWidth: number,
  wallHeight: number,
  slatWidth: number,
  slatGap: number,
  material: THREE.MeshStandardMaterial,
): THREE.Group {
  const group = new THREE.Group()
  const slatDepth = 0.02
  const totalSlat = slatWidth + slatGap
  const numSlats = Math.floor(wallWidth / totalSlat)
  const actualWidth = numSlats * totalSlat - slatGap
  const startX = -actualWidth / 2 + slatWidth / 2

  for (let i = 0; i < numSlats; i++) {
    const geo = new THREE.BoxGeometry(slatWidth, wallHeight, slatDepth)
    const mesh = new THREE.Mesh(geo, material)
    mesh.position.set(startX + i * totalSlat, wallHeight / 2, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

  return group
}

function createGarbageBin(
  binWidth: number,
  binDepth: number,
  binHeight: number,
  color: number,
): THREE.Group {
  const group = new THREE.Group()

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.05,
  })

  // Main body - slightly tapered (wider at top)
  const bodyGeo = new THREE.BoxGeometry(binWidth, binHeight * 0.82, binDepth)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = binHeight * 0.82 / 2
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Lid
  const lidMat = new THREE.MeshStandardMaterial({
    color: Math.max(0, color - 0x0a0a0a),
    roughness: 0.4,
    metalness: 0.05,
  })
  const lidGeo = new THREE.BoxGeometry(binWidth * 1.02, binHeight * 0.06, binDepth * 0.55)
  const lid = new THREE.Mesh(lidGeo, lidMat)
  lid.position.set(0, binHeight * 0.85 + binHeight * 0.03, -binDepth * 0.2)
  lid.castShadow = true
  group.add(lid)

  // Handle
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 })
  const handleGeo = new THREE.BoxGeometry(binWidth * 0.5, 0.01, 0.015)
  const handle = new THREE.Mesh(handleGeo, handleMat)
  handle.position.set(0, binHeight * 0.88 + 0.01, -binDepth * 0.42)
  group.add(handle)

  // Wheels (two small cylinders at back bottom)
  const wheelMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.3 })
  const wheelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8)
  const offsets = [-binWidth * 0.35, binWidth * 0.35]
  offsets.forEach((xOff) => {
    const wheel = new THREE.Mesh(wheelGeo, wheelMat)
    wheel.rotation.x = Math.PI / 2
    wheel.position.set(xOff, 0.03, binDepth * 0.4)
    group.add(wheel)
  })

  return group
}

function disposeGroup(group: THREE.Group) {
  while (group.children.length > 0) {
    const child = group.children[0]
    if (child instanceof THREE.Mesh) {
      if (child.geometry) child.geometry.dispose()
      if (child.material) {
        const material = child.material
        if (Array.isArray(material)) {
          material.forEach((m) => m.dispose())
        } else {
          material.dispose()
        }
      }
    }
    if (child instanceof THREE.Group) {
      disposeGroup(child)
    }
    group.remove(child)
  }
}

// ── Build model ─────────────────────────────────────────────────────

const OPEN_HEIGHT_CM = 120

function buildSoppelbodModel(
  houseGroup: THREE.Group,
  props: SoppelboderVisualizerProps,
) {
  disposeGroup(houseGroup)

  const scale = 0.01
  const w = props.width * scale
  const h = props.height * scale
  const d = props.depth * scale

  // Colors based on finish
  let woodColor = 0xc9a66b
  if (props.finish === '1200') woodColor = 0xd4c4a8
  else if (props.finish === '2500') woodColor = 0x4a4a4a

  let roofColor = 0xc9a66b
  if (props.roof === '500') roofColor = 0x2d2d2d
  else if (props.roof === '800') roofColor = 0x5d4e37
  else if (props.roof === '1200') roofColor = 0x2a2a2a

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

  const slatWidth = 0.08
  const slatGap = 0.005
  const postSize = 0.05
  const roofOverhang = 0.06
  const roofPeak = d * 0.18
  const frameSize = 0.03

  // Front opening: open up to 120cm, siding above
  const openHeight = Math.min(OPEN_HEIGHT_CM * scale, h)
  const sidingHeight = h - openHeight

  // ── Corner posts (all same height for hip roof) ───────────────
  const corners = [
    { x: -w / 2 + postSize / 2, z: d / 2 - postSize / 2 },
    { x: w / 2 - postSize / 2, z: d / 2 - postSize / 2 },
    { x: -w / 2 + postSize / 2, z: -d / 2 + postSize / 2 },
    { x: w / 2 - postSize / 2, z: -d / 2 + postSize / 2 },
  ]

  corners.forEach((c) => {
    const geo = new THREE.BoxGeometry(postSize, h, postSize)
    const mesh = new THREE.Mesh(geo, frameMaterial)
    mesh.position.set(c.x, h / 2, c.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    houseGroup.add(mesh)
  })

  // ── Top beams connecting posts ────────────────────────────────
  const beamSize = postSize * 0.6
  // Front beam
  const frontBeamGeo = new THREE.BoxGeometry(w, beamSize, beamSize)
  const frontBeam = new THREE.Mesh(frontBeamGeo, frameMaterial)
  frontBeam.position.set(0, h - beamSize / 2, d / 2 - postSize / 2)
  frontBeam.castShadow = true
  houseGroup.add(frontBeam)

  // Back beam
  const backBeamGeo = new THREE.BoxGeometry(w, beamSize, beamSize)
  const backBeam = new THREE.Mesh(backBeamGeo, frameMaterial)
  backBeam.position.set(0, h - beamSize / 2, -d / 2 + postSize / 2)
  backBeam.castShadow = true
  houseGroup.add(backBeam)

  // ── Back wall: siding 0–110cm, open 110–150cm, siding above ──
  const backSidingBottom = Math.min(1.10, h)
  const backOpenHeight = 0.40
  const backOpenTop = Math.min(backSidingBottom + backOpenHeight, h)
  const backSidingTopHeight = h - backOpenTop
  const backFrameInset = -(d / 2 - frameSize / 2)

  // Bottom siding (0 to 110cm)
  if (backSidingBottom > 0.02) {
    const backBottom = createVerticalSlatWall(w, backSidingBottom, slatWidth, slatGap, woodMaterial)
    backBottom.rotation.y = Math.PI
    backBottom.position.set(0, 0, -d / 2)
    houseGroup.add(backBottom)
  }

  // Top siding (above opening to wall top)
  if (backSidingTopHeight > 0.02) {
    const backTop = createVerticalSlatWall(w, backSidingTopHeight, slatWidth, slatGap, woodMaterial)
    backTop.rotation.y = Math.PI
    backTop.position.set(0, backOpenTop, -d / 2)
    houseGroup.add(backTop)
  }

  // Back opening frame planks
  // Left frame
  const blfGeo = new THREE.BoxGeometry(frameSize, h, frameSize)
  const blf = new THREE.Mesh(blfGeo, frameMaterial)
  blf.position.set(-w / 2 + frameSize / 2, h / 2, backFrameInset)
  blf.castShadow = true
  houseGroup.add(blf)

  // Right frame
  const brfGeo = new THREE.BoxGeometry(frameSize, h, frameSize)
  const brf = new THREE.Mesh(brfGeo, frameMaterial)
  brf.position.set(w / 2 - frameSize / 2, h / 2, backFrameInset)
  brf.castShadow = true
  houseGroup.add(brf)

  // Bottom frame beam (at 110cm)
  const bbfGeo = new THREE.BoxGeometry(w, frameSize, frameSize)
  const bbf = new THREE.Mesh(bbfGeo, frameMaterial)
  bbf.position.set(0, backSidingBottom, backFrameInset)
  bbf.castShadow = true
  houseGroup.add(bbf)

  // Top frame beam (at 150cm)
  if (backOpenTop < h) {
    const btfGeo = new THREE.BoxGeometry(w, frameSize, frameSize)
    const btf = new THREE.Mesh(btfGeo, frameMaterial)
    btf.position.set(0, backOpenTop, backFrameInset)
    btf.castShadow = true
    houseGroup.add(btf)
  }

  // ── Left wall ─────────────────────────────────────────────────
  const leftWall = createVerticalSlatWall(d, h, slatWidth, slatGap, woodMaterial)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.x = -w / 2
  houseGroup.add(leftWall)

  // ── Right wall ────────────────────────────────────────────────
  const rightWall = createVerticalSlatWall(d, h, slatWidth, slatGap, woodMaterial)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.x = w / 2
  houseGroup.add(rightWall)

  // ── Front: open below 120cm, siding above ─────────────────────
  if (sidingHeight > 0.02) {
    const frontSiding = createVerticalSlatWall(w, sidingHeight, slatWidth, slatGap, woodMaterial)
    frontSiding.position.set(0, openHeight, d / 2)
    houseGroup.add(frontSiding)
  }

  // ── Front opening frame planks (3cm, set inside the opening) ──
  const frameInset = d / 2 - frameSize / 2

  // Left frame plank
  const lfGeo = new THREE.BoxGeometry(frameSize, h, frameSize)
  const lf = new THREE.Mesh(lfGeo, frameMaterial)
  lf.position.set(-w / 2 + frameSize / 2, h / 2, frameInset)
  lf.castShadow = true
  houseGroup.add(lf)

  // Right frame plank
  const rfGeo = new THREE.BoxGeometry(frameSize, h, frameSize)
  const rf = new THREE.Mesh(rfGeo, frameMaterial)
  rf.position.set(w / 2 - frameSize / 2, h / 2, frameInset)
  rf.castShadow = true
  houseGroup.add(rf)

  // Top frame beam across the opening
  const tfGeo = new THREE.BoxGeometry(w, frameSize, frameSize)
  const tf = new THREE.Mesh(tfGeo, frameMaterial)
  tf.position.set(0, openHeight, frameInset)
  tf.castShadow = true
  houseGroup.add(tf)

  // ── Hip roof ──────────────────────────────────────────────────
  const oh = roofOverhang
  const ridgeHalf = Math.max(0, (w - d) / 2)

  // 4 eave corners + 2 ridge endpoints
  const FL = [-w / 2 - oh, h, d / 2 + oh]
  const FR = [w / 2 + oh, h, d / 2 + oh]
  const BR = [w / 2 + oh, h, -d / 2 - oh]
  const BL = [-w / 2 - oh, h, -d / 2 - oh]
  const RL = [-ridgeHalf, h + roofPeak, 0]
  const RR = [ridgeHalf, h + roofPeak, 0]

  const verts: number[] = []
  function tri(a: number[], b: number[], c: number[]) {
    verts.push(...a, ...b, ...c)
  }

  // Front slope
  tri(FL, RL, RR)
  tri(FL, RR, FR)
  // Back slope
  tri(BR, RR, RL)
  tri(BR, RL, BL)
  // Left hip
  tri(BL, RL, FL)
  // Right hip
  tri(FR, RR, BR)

  const roofGeo = new THREE.BufferGeometry()
  roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3))
  roofGeo.computeVertexNormals()

  const roofMat = roofMaterial.clone()
  roofMat.side = THREE.DoubleSide
  const roofMesh = new THREE.Mesh(roofGeo, roofMat)
  roofMesh.castShadow = true
  roofMesh.receiveShadow = true
  houseGroup.add(roofMesh)

  // Fascia boards around the eave
  const fasciaH = 0.04
  const fasciaT = 0.015

  const ffGeo = new THREE.BoxGeometry(w + oh * 2, fasciaH, fasciaT)
  const ff = new THREE.Mesh(ffGeo, roofMaterial)
  ff.position.set(0, h - fasciaH / 2, d / 2 + oh)
  ff.castShadow = true
  houseGroup.add(ff)

  const bfGeo = new THREE.BoxGeometry(w + oh * 2, fasciaH, fasciaT)
  const bf = new THREE.Mesh(bfGeo, roofMaterial)
  bf.position.set(0, h - fasciaH / 2, -d / 2 - oh)
  bf.castShadow = true
  houseGroup.add(bf)

  const lfascGeo = new THREE.BoxGeometry(fasciaT, fasciaH, d + oh * 2)
  const lfasc = new THREE.Mesh(lfascGeo, roofMaterial)
  lfasc.position.set(-w / 2 - oh, h - fasciaH / 2, 0)
  lfasc.castShadow = true
  houseGroup.add(lfasc)

  const rfascGeo = new THREE.BoxGeometry(fasciaT, fasciaH, d + oh * 2)
  const rfasc = new THREE.Mesh(rfascGeo, roofMaterial)
  rfasc.position.set(w / 2 + oh, h - fasciaH / 2, 0)
  rfasc.castShadow = true
  houseGroup.add(rfasc)

  // Ridge beam
  if (ridgeHalf > 0.01) {
    const ridgeGeo = new THREE.BoxGeometry(ridgeHalf * 2, 0.03, 0.03)
    const ridge = new THREE.Mesh(ridgeGeo, frameMaterial)
    ridge.position.set(0, h + roofPeak, 0)
    ridge.castShadow = true
    houseGroup.add(ridge)
  }

  // ── Bottom frame ──────────────────────────────────────────────
  const frameThickness = 0.03
  const fbGeo = new THREE.BoxGeometry(w, frameThickness, postSize * 0.6)
  const fb = new THREE.Mesh(fbGeo, frameMaterial)
  fb.position.set(0, frameThickness / 2, d / 2 - postSize * 0.3)
  fb.receiveShadow = true
  houseGroup.add(fb)

  const bbGeo = new THREE.BoxGeometry(w, frameThickness, postSize * 0.6)
  const bb = new THREE.Mesh(bbGeo, frameMaterial)
  bb.position.set(0, frameThickness / 2, -d / 2 + postSize * 0.3)
  bb.receiveShadow = true
  houseGroup.add(bb)

  // ── Garbage bins ──────────────────────────────────────────────
  const binColors = [0x505050, 0x454545, 0x4a6b3c, 0x505050]
  const binW = 0.55 * scale * 100
  const binD = 0.50 * scale * 100
  const binH = Math.min(h * 0.72, 0.95) + 0.20

  const totalBinsWidth = props.binCount * binW
  const binSpacing = props.binCount > 1
    ? (w - totalBinsWidth) / (props.binCount + 1)
    : 0
  const startX = -w / 2 + binSpacing + binW / 2

  for (let i = 0; i < props.binCount; i++) {
    const x = props.binCount === 1
      ? 0
      : startX + i * (binW + binSpacing)
    const bin = createGarbageBin(binW, binD, binH, binColors[i % binColors.length])
    bin.position.set(x, 0, 0)
    houseGroup.add(bin)
  }

  houseGroup.position.y = 0
}

// ── Component ───────────────────────────────────────────────────────

export default function SoppelboderThreeVisualizer(props: SoppelboderVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    scene: THREE.Scene
    camera: THREE.PerspectiveCamera
    renderer: THREE.WebGLRenderer
    controls: OrbitControls
    houseGroup: THREE.Group
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
    camera.position.set(2.0, 1.5, 2.5)

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    container.insertBefore(renderer.domElement, container.firstChild)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05
    controls.minDistance = 1.0
    controls.maxDistance = 8
    controls.maxPolarAngle = Math.PI / 2
    controls.enablePan = false
    controls.target.set(0, 0.5, 0)

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

    // Ground shadow
    const groundGeo = new THREE.PlaneGeometry(10, 10)
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.15 })
    const ground = new THREE.Mesh(groundGeo, groundMat)
    ground.rotation.x = -Math.PI / 2
    ground.position.y = -0.01
    ground.receiveShadow = true
    scene.add(ground)

    const houseGroup = new THREE.Group()
    scene.add(houseGroup)

    buildSoppelbodModel(houseGroup, props)

    let animationId = 0
    function animate() {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    function onWindowResize() {
      if (!container) return
      const w = container.clientWidth
      const h = container.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    }
    window.addEventListener('resize', onWindowResize)

    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      houseGroup,
      animationId,
    }

    return () => {
      window.removeEventListener('resize', onWindowResize)
      cancelAnimationFrame(animationId)
      controls.dispose()

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

  // Update model when props change
  useEffect(() => {
    if (!sceneRef.current) return
    buildSoppelbodModel(sceneRef.current.houseGroup, props)
  }, [props.width, props.height, props.depth, props.binCount, props.doorType, props.finish, props.roof])

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
