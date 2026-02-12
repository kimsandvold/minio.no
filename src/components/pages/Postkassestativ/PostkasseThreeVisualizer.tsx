import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface PostkasseVisualizerProps {
  width: number
  height: number
  depth: number
  mailboxCount: number
  finish: string
  roof: string
  hasNumberPanel: boolean
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

function createMailbox(
  boxWidth: number,
  boxHeight: number,
  boxDepth: number,
  color: number,
): THREE.Group {
  const group = new THREE.Group()

  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.1,
  })

  // Main body
  const bodyGeo = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth)
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = boxHeight / 2
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)

  // Front door (slightly protruding)
  const doorMat = new THREE.MeshStandardMaterial({
    color: Math.min(0xffffff, color + 0x0a0a0a),
    roughness: 0.35,
    metalness: 0.15,
  })
  const doorGeo = new THREE.BoxGeometry(boxWidth * 0.92, boxHeight * 0.85, 0.008)
  const door = new THREE.Mesh(doorGeo, doorMat)
  door.position.set(0, boxHeight / 2, boxDepth / 2 + 0.005)
  door.castShadow = true
  group.add(door)

  // Mail slot on door
  const slotMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 })
  const slotGeo = new THREE.BoxGeometry(boxWidth * 0.5, 0.008, 0.012)
  const slot = new THREE.Mesh(slotGeo, slotMat)
  slot.position.set(0, boxHeight * 0.65, boxDepth / 2 + 0.01)
  group.add(slot)

  // Small handle below slot
  const handleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.2, metalness: 0.4 })
  const handleGeo = new THREE.BoxGeometry(boxWidth * 0.2, 0.008, 0.015)
  const handle = new THREE.Mesh(handleGeo, handleMat)
  handle.position.set(0, boxHeight * 0.35, boxDepth / 2 + 0.012)
  group.add(handle)

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

function buildPostkasseModel(
  houseGroup: THREE.Group,
  props: PostkasseVisualizerProps,
) {
  disposeGroup(houseGroup)

  const scale = 0.01
  const w = props.width * scale
  const h = props.height * scale
  const d = props.depth * scale

  // Colors based on finish
  let woodColor = 0xc9a66b
  if (props.finish === '1500') woodColor = 0xd4c4a8
  else if (props.finish === '3000') woodColor = 0x4a4a4a

  let roofColor = 0xc9a66b
  if (props.roof === '1500') roofColor = 0x2d2d2d
  else if (props.roof === '2500') roofColor = 0x5d4e37

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

  // ── Vertical layout ──────────────────────────────────────────────
  const baseHeight = 0.04
  const shelfThickness = 0.02
  const cubbyHeight = 0.50
  const shelfY = baseHeight + cubbyHeight
  const mailboxGap = 0.03
  const mailboxBottomY = shelfY + shelfThickness + mailboxGap + 0.20

  const mailboxH = Math.min(0.38, h - mailboxBottomY - 0.10)
  const innerW = w - postSize * 2
  const compartmentW = innerW / props.mailboxCount
  const mailboxW = Math.min(0.30, compartmentW - 0.06)
  const mailboxD = 0.25

  // Interior depth: from back wall inner face to front post inner face
  const backWallThickness = 0.02
  const interiorD = d - postSize - backWallThickness
  const interiorZ = (-d / 2 + backWallThickness + d / 2 - postSize) / 2

  // ── Corner posts ─────────────────────────────────────────────────
  const corners: [number, number][] = [
    [-w / 2 + postSize / 2, d / 2 - postSize / 2],
    [w / 2 - postSize / 2, d / 2 - postSize / 2],
    [-w / 2 + postSize / 2, -d / 2 + postSize / 2],
    [w / 2 - postSize / 2, -d / 2 + postSize / 2],
  ]

  corners.forEach(([x, z]) => {
    const geo = new THREE.BoxGeometry(postSize, h, postSize)
    const mesh = new THREE.Mesh(geo, frameMaterial)
    mesh.position.set(x, h / 2, z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    houseGroup.add(mesh)
  })

  // ── Top beams ────────────────────────────────────────────────────
  const beamSize = postSize * 0.6
  const topBeamGeo = new THREE.BoxGeometry(w, beamSize, beamSize)

  const topBeamFront = new THREE.Mesh(topBeamGeo, frameMaterial)
  topBeamFront.position.set(0, h - beamSize / 2, d / 2 - postSize / 2)
  topBeamFront.castShadow = true
  houseGroup.add(topBeamFront)

  const topBeamBack = new THREE.Mesh(topBeamGeo.clone(), frameMaterial)
  topBeamBack.position.set(0, h - beamSize / 2, -d / 2 + postSize / 2)
  topBeamBack.castShadow = true
  houseGroup.add(topBeamBack)

  // ── Back wall – full height solid siding ─────────────────────────
  const backWall = createVerticalSlatWall(w, h, slatWidth, slatGap, woodMaterial)
  backWall.rotation.y = Math.PI
  backWall.position.set(0, 0, -d / 2)
  houseGroup.add(backWall)

  // ── Side walls – full height solid siding ────────────────────────
  const leftWall = createVerticalSlatWall(d, h, slatWidth, slatGap, woodMaterial)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.x = -w / 2
  houseGroup.add(leftWall)

  const rightWall = createVerticalSlatWall(d, h, slatWidth, slatGap, woodMaterial)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.x = w / 2
  houseGroup.add(rightWall)

  // ── Front: completely open (no siding) ───────────────────────────

  // ── Base frame (bottom rails) ────────────────────────────────────
  const baseRailGeo = new THREE.BoxGeometry(w, baseHeight, postSize * 0.6)
  const baseFront = new THREE.Mesh(baseRailGeo, frameMaterial)
  baseFront.position.set(0, baseHeight / 2, d / 2 - postSize * 0.3)
  baseFront.receiveShadow = true
  houseGroup.add(baseFront)

  const baseBack = new THREE.Mesh(baseRailGeo.clone(), frameMaterial)
  baseBack.position.set(0, baseHeight / 2, -d / 2 + postSize * 0.3)
  baseBack.receiveShadow = true
  houseGroup.add(baseBack)

  // ── Shelves ──────────────────────────────────────────────────────
  const shelfGeo = new THREE.BoxGeometry(innerW, shelfThickness, interiorD)

  // Bottom shelf
  const bottomShelf = new THREE.Mesh(shelfGeo, woodMaterial)
  bottomShelf.position.set(0, baseHeight + shelfThickness / 2, interiorZ)
  bottomShelf.castShadow = true
  bottomShelf.receiveShadow = true
  houseGroup.add(bottomShelf)

  // Middle shelf (top of cubbies)
  const midShelf = new THREE.Mesh(shelfGeo.clone(), woodMaterial)
  midShelf.position.set(0, shelfY + shelfThickness / 2, interiorZ)
  midShelf.castShadow = true
  midShelf.receiveShadow = true
  houseGroup.add(midShelf)

  // ── Vertical dividers between compartments ───────────────────────
  const dividerThickness = 0.02
  for (let i = 1; i < props.mailboxCount; i++) {
    const divX = -w / 2 + postSize + i * compartmentW
    const divGeo = new THREE.BoxGeometry(dividerThickness, cubbyHeight, interiorD)
    const divMesh = new THREE.Mesh(divGeo, woodMaterial)
    divMesh.position.set(divX, baseHeight + shelfThickness + cubbyHeight / 2, interiorZ)
    divMesh.castShadow = true
    divMesh.receiveShadow = true
    houseGroup.add(divMesh)
  }

  // ── Interior wall (30cm from front, mailbox area only) ────────────
  const interiorWallInset = 0.30
  const interiorWallZ = d / 2 - interiorWallInset
  const interiorWallHeight = h - shelfY - shelfThickness
  const slatDepth = 0.02

  const interiorWall = createVerticalSlatWall(innerW, interiorWallHeight, slatWidth, slatGap, woodMaterial)
  interiorWall.position.set(0, shelfY + shelfThickness, interiorWallZ)
  houseGroup.add(interiorWall)

  // ── Mailboxes (green, hanging on interior wall) ──────────────────
  const mailboxColor = 0x2d5a2e // Norwegian post green

  for (let i = 0; i < props.mailboxCount; i++) {
    const cx = -w / 2 + postSize + (i + 0.5) * compartmentW
    const mailbox = createMailbox(mailboxW, mailboxH, mailboxD, mailboxColor)
    // Position in front of interior wall
    const mz = interiorWallZ + slatDepth / 2 + mailboxD / 2
    mailbox.position.set(cx, mailboxBottomY, mz)
    houseGroup.add(mailbox)
  }

  // ── Hip roof ────────────────────────────────────────────────────
  const oh = roofOverhang
  const ridgeHalf = Math.max(0, (w - d) / 2)

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

  // ── Number panel (on left side wall) ─────────────────────────────
  if (props.hasNumberPanel) {
    const panelW = 0.15
    const panelH = 0.12
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x2a2a2a,
      roughness: 0.3,
      metalness: 0.2,
    })
    const panelGeo = new THREE.BoxGeometry(0.015, panelH, panelW)
    const panel = new THREE.Mesh(panelGeo, panelMat)
    panel.position.set(-w / 2 - 0.01, h * 0.7, d / 4)
    panel.castShadow = true
    houseGroup.add(panel)

    const textMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 })
    const textGeo = new THREE.BoxGeometry(0.003, panelH * 0.5, panelW * 0.6)
    const textMesh = new THREE.Mesh(textGeo, textMat)
    textMesh.position.set(-w / 2 - 0.02, h * 0.7, d / 4)
    houseGroup.add(textMesh)
  }

  houseGroup.position.y = 0
}

// ── Component ───────────────────────────────────────────────────────

export default function PostkasseThreeVisualizer(props: PostkasseVisualizerProps) {
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
    camera.position.set(2.0, 1.3, 2.2)

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

    buildPostkasseModel(houseGroup, props)

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
    buildPostkasseModel(sceneRef.current.houseGroup, props)
  }, [props.width, props.height, props.depth, props.mailboxCount, props.finish, props.roof, props.hasNumberPanel])

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
