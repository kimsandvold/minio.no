import { useRef, useEffect } from 'react'
import styled from 'styled-components'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

interface VedskjulVisualizerProps {
  width: number
  height: number
  depth: number
  sectionCount: number
  finish: string
  roof: string
  roofShape: string
  roofDegree: number
  roofSlopeDirection: string
  hasDoor: boolean
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

function createSlopedSlatWall(
  wallWidth: number,
  heightStart: number,
  heightEnd: number,
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
    const t = numSlats > 1 ? i / (numSlats - 1) : 0.5
    const slatH = heightStart + (heightEnd - heightStart) * t
    const geo = new THREE.BoxGeometry(slatWidth, slatH, slatDepth)
    const mesh = new THREE.Mesh(geo, material)
    mesh.position.set(startX + i * totalSlat, slatH / 2, 0)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)
  }

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

function buildVedskjulModel(
  houseGroup: THREE.Group,
  props: VedskjulVisualizerProps,
) {
  disposeGroup(houseGroup)

  const scale = 0.01
  const w = props.width * scale
  const h = props.height * scale
  const d = props.depth * scale

  // Colors based on finish
  let woodColor = 0xc9a66b
  if (props.finish === '2000') woodColor = 0xd4c4a8
  else if (props.finish === '4500') woodColor = 0x4a4a4a

  let roofColor = 0xc9a66b
  if (props.roof === '1200') roofColor = 0x2a2a2a
  else if (props.roof === '2000') roofColor = 0x5d4e37

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

  const slatWidth = 0.10
  const slatGap = 0.005
  const postSize = 0.05
  const roofOverhang = 0.20
  const roofPeak = props.roofShape === 'flat' ? 0 : d * (props.roofDegree / 100)

  // For flat angled roof, calculate wall heights at front and back
  const slopeRise = props.roofShape === 'flat' ? d * (props.roofDegree / 100) : 0
  const slopeFront = props.roofSlopeDirection === 'front'
  const frontH = h + (props.roofShape === 'flat' ? (slopeFront ? 0 : slopeRise) : 0)
  const backH = h + (props.roofShape === 'flat' ? (slopeFront ? slopeRise : 0) : 0)

  // ── Corner posts ───────────────────────────────────────────────
  const cornerPosts = [
    { x: -w / 2 + postSize / 2, z: d / 2 - postSize / 2, h: frontH },
    { x: w / 2 - postSize / 2, z: d / 2 - postSize / 2, h: frontH },
    { x: -w / 2 + postSize / 2, z: -d / 2 + postSize / 2, h: backH },
    { x: w / 2 - postSize / 2, z: -d / 2 + postSize / 2, h: backH },
  ]

  cornerPosts.forEach((c) => {
    const geo = new THREE.BoxGeometry(postSize, c.h, postSize)
    const mesh = new THREE.Mesh(geo, frameMaterial)
    mesh.position.set(c.x, c.h / 2, c.z)
    mesh.castShadow = true
    mesh.receiveShadow = true
    houseGroup.add(mesh)
  })

  // ── Top beams connecting posts ────────────────────────────────
  const beamSize = postSize * 0.6
  // Front beam
  const frontBeamGeo = new THREE.BoxGeometry(w, beamSize, beamSize)
  const frontBeam = new THREE.Mesh(frontBeamGeo, frameMaterial)
  frontBeam.position.set(0, frontH - beamSize / 2, d / 2 - postSize / 2)
  frontBeam.castShadow = true
  houseGroup.add(frontBeam)

  // Back beam
  const backBeamGeo = new THREE.BoxGeometry(w, beamSize, beamSize)
  const backBeam = new THREE.Mesh(backBeamGeo, frameMaterial)
  backBeam.position.set(0, backH - beamSize / 2, -d / 2 + postSize / 2)
  backBeam.castShadow = true
  houseGroup.add(backBeam)

  // ── Back wall: planks ────────────────────────────────────────
  const backWall = createVerticalSlatWall(w, backH, slatWidth, slatGap, woodMaterial)
  backWall.position.set(0, 0, -d / 2)
  houseGroup.add(backWall)

  // ── Side walls: planks (sloped to follow roof) ──────────────
  // Left wall rotates +90deg: local -x becomes +z (front), local +x becomes -z (back)
  const leftWall = createSlopedSlatWall(d, frontH, backH, slatWidth, slatGap, woodMaterial)
  leftWall.rotation.y = Math.PI / 2
  leftWall.position.set(-w / 2, 0, 0)
  houseGroup.add(leftWall)

  // Right wall rotates -90deg: local -x becomes -z (back), local +x becomes +z (front)
  const rightWall = createSlopedSlatWall(d, backH, frontH, slatWidth, slatGap, woodMaterial)
  rightWall.rotation.y = -Math.PI / 2
  rightWall.position.set(w / 2, 0, 0)
  houseGroup.add(rightWall)

  // ── Front ────────────────────────────────────────────────────
  const secondSectionWidth = 1.0 // 100cm in model scale
  const frameSize = 0.03
  const frameInset = d / 2 - frameSize / 2

  // Front opening: 190cm high, siding above goes to frontH
  const openHeight = Math.min(1.90, h)
  const sidingHeight = frontH - openHeight
  const sideInset = 0.35 // 35cm panel on each side of the opening

  if (props.sectionCount === 2) {
    const vedskjulWidth = w - secondSectionWidth
    const openingWidth = Math.max(0, vedskjulWidth - sideInset * 2)
    const vedskjulLeft = -w / 2

    // Top siding above opening (full vedskjul width)
    if (sidingHeight > 0.02) {
      const topSiding = createVerticalSlatWall(vedskjulWidth, sidingHeight, slatWidth, slatGap, woodMaterial)
      topSiding.position.set(vedskjulLeft + vedskjulWidth / 2, openHeight, d / 2)
      houseGroup.add(topSiding)
    }

    // Left panel (30cm, full height below opening top)
    if (sideInset > 0.01) {
      const leftPanel = createVerticalSlatWall(sideInset, openHeight, slatWidth, slatGap, woodMaterial)
      leftPanel.position.set(vedskjulLeft + sideInset / 2, 0, d / 2)
      houseGroup.add(leftPanel)
    }

    // Right panel on vedskjul side (30cm, full height below opening top)
    if (sideInset > 0.01) {
      const rightPanel = createVerticalSlatWall(sideInset, openHeight, slatWidth, slatGap, woodMaterial)
      rightPanel.position.set(vedskjulLeft + vedskjulWidth - sideInset / 2, 0, d / 2)
      houseGroup.add(rightPanel)
    }

    // Frame beam at top of opening
    const tfGeo = new THREE.BoxGeometry(openingWidth, frameSize, frameSize)
    const tf = new THREE.Mesh(tfGeo, frameMaterial)
    tf.position.set(vedskjulLeft + vedskjulWidth / 2, openHeight, frameInset)
    tf.castShadow = true
    houseGroup.add(tf)

    // Left frame plank (at inner edge of left panel)
    const lfGeo = new THREE.BoxGeometry(frameSize, openHeight, frameSize)
    const lf = new THREE.Mesh(lfGeo, frameMaterial)
    lf.position.set(vedskjulLeft + sideInset, openHeight / 2, frameInset)
    lf.castShadow = true
    houseGroup.add(lf)

    // Right frame plank on vedskjul side (at inner edge of right panel)
    const rfVedGeo = new THREE.BoxGeometry(frameSize, openHeight, frameSize)
    const rfVed = new THREE.Mesh(rfVedGeo, frameMaterial)
    rfVed.position.set(vedskjulLeft + vedskjulWidth - sideInset, openHeight / 2, frameInset)
    rfVed.castShadow = true
    houseGroup.add(rfVed)

    // Redskapsbod section (right): opening from divider to right side panel
    const bodLeft = w / 2 - secondSectionWidth
    const bodOpeningWidth = Math.max(0, secondSectionWidth - sideInset)
    const bodSidingHeight = frontH - openHeight

    // Top siding above opening (full bod width)
    if (bodSidingHeight > 0.02) {
      const bodTopSiding = createVerticalSlatWall(secondSectionWidth, bodSidingHeight, slatWidth, slatGap, woodMaterial)
      bodTopSiding.position.set(bodLeft + secondSectionWidth / 2, openHeight, d / 2)
      houseGroup.add(bodTopSiding)
    }

    // Right panel on bod side only (opening goes to divider on left)
    if (sideInset > 0.01) {
      const bodRightPanel = createVerticalSlatWall(sideInset, openHeight, slatWidth, slatGap, woodMaterial)
      bodRightPanel.position.set(bodLeft + secondSectionWidth - sideInset / 2, 0, d / 2)
      houseGroup.add(bodRightPanel)
    }

    // Frame beam at top of bod opening
    const bodTfGeo = new THREE.BoxGeometry(bodOpeningWidth, frameSize, frameSize)
    const bodTf = new THREE.Mesh(bodTfGeo, frameMaterial)
    bodTf.position.set(bodLeft + bodOpeningWidth / 2, openHeight, frameInset)
    bodTf.castShadow = true
    houseGroup.add(bodTf)

    // Right frame plank on bod (inner edge of right panel)
    const bodRfGeo = new THREE.BoxGeometry(frameSize, openHeight, frameSize)
    const bodRf = new THREE.Mesh(bodRfGeo, frameMaterial)
    bodRf.position.set(bodLeft + secondSectionWidth - sideInset, openHeight / 2, frameInset)
    bodRf.castShadow = true
    houseGroup.add(bodRf)

    // Optional door in the bod opening (spans from divider to right panel)
    if (props.hasDoor) {
      const doorMaterial = new THREE.MeshStandardMaterial({
        color: woodColor === 0x4a4a4a ? 0x3d3d3d : 0xb89858,
        roughness: 0.7,
        metalness: 0.1,
      })
      const doorW = bodOpeningWidth - 0.02
      const doorThick = 0.015
      const doorX = bodLeft + bodOpeningWidth / 2
      const doorGeo = new THREE.BoxGeometry(doorW, openHeight - 0.02, doorThick)
      const door = new THREE.Mesh(doorGeo, doorMaterial)
      door.position.set(doorX, openHeight / 2, d / 2 + 0.005)
      door.castShadow = true
      houseGroup.add(door)

      // Door handle (on the right side of the door)
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 })
      const handleGeo = new THREE.BoxGeometry(0.015, 0.06, 0.02)
      const handle = new THREE.Mesh(handleGeo, handleMat)
      handle.position.set(doorX + doorW * 0.35, openHeight * 0.5, d / 2 + 0.02)
      houseGroup.add(handle)
    }

    // Right frame plank (outer edge)
    const rfGeo = new THREE.BoxGeometry(frameSize, frontH, frameSize)
    const rf = new THREE.Mesh(rfGeo, frameMaterial)
    rf.position.set(w / 2 - frameSize / 2, frontH / 2, frameInset)
    rf.castShadow = true
    houseGroup.add(rf)
  } else {
    // Single section
    const openingWidth = Math.max(0, w - sideInset * 2)

    // Top siding above opening (full width)
    if (sidingHeight > 0.02) {
      const topSiding = createVerticalSlatWall(w, sidingHeight, slatWidth, slatGap, woodMaterial)
      topSiding.position.set(0, openHeight, d / 2)
      houseGroup.add(topSiding)
    }

    // Left panel (30cm, up to opening height)
    if (sideInset > 0.01) {
      const leftPanel = createVerticalSlatWall(sideInset, openHeight, slatWidth, slatGap, woodMaterial)
      leftPanel.position.set(-w / 2 + sideInset / 2, 0, d / 2)
      houseGroup.add(leftPanel)
    }

    // Right panel (30cm, up to opening height)
    if (sideInset > 0.01) {
      const rightPanel = createVerticalSlatWall(sideInset, openHeight, slatWidth, slatGap, woodMaterial)
      rightPanel.position.set(w / 2 - sideInset / 2, 0, d / 2)
      houseGroup.add(rightPanel)
    }

    // Frame beam at top of opening
    const tfGeo = new THREE.BoxGeometry(openingWidth, frameSize, frameSize)
    const tf = new THREE.Mesh(tfGeo, frameMaterial)
    tf.position.set(0, openHeight, frameInset)
    tf.castShadow = true
    houseGroup.add(tf)

    // Left frame plank (at inner edge of left panel)
    const lfGeo = new THREE.BoxGeometry(frameSize, openHeight, frameSize)
    const lf = new THREE.Mesh(lfGeo, frameMaterial)
    lf.position.set(-w / 2 + sideInset, openHeight / 2, frameInset)
    lf.castShadow = true
    houseGroup.add(lf)

    // Right frame plank (at inner edge of right panel)
    const rfGeo = new THREE.BoxGeometry(frameSize, openHeight, frameSize)
    const rf = new THREE.Mesh(rfGeo, frameMaterial)
    rf.position.set(w / 2 - sideInset, openHeight / 2, frameInset)
    rf.castShadow = true
    houseGroup.add(rf)
  }

  // ── Section dividers ──────────────────────────────────────────
  if (props.sectionCount === 2) {
    const dividerX = w / 2 - secondSectionWidth
    const divGeo = new THREE.BoxGeometry(postSize * 0.6, h, d)
    const div = new THREE.Mesh(divGeo, frameMaterial)
    div.position.set(dividerX, h / 2, 0)
    div.castShadow = true
    div.receiveShadow = true
    houseGroup.add(div)
  }

  // ── Roof ─────────────────────────────────────────────────────
  const oh = roofOverhang
  const fasciaH = 0.04
  const fasciaT = 0.015

  if (props.roofShape === 'flat') {
    // Flat roof with slope: extends the wall slope into overhang
    // wallSlope is positive when front is high, negative when back is high
    const wallSlope = d > 0 ? (frontH - backH) / d : 0

    // Front z and back z
    const fz = d / 2 + oh
    const bz = -d / 2 - oh
    const lx = -w / 2 - oh
    const rx = w / 2 + oh

    // Roof y at overhang edges (extends wall slope into overhang)
    const flY = frontH + wallSlope * oh
    const frY = frontH + wallSlope * oh
    const blY = backH - wallSlope * oh
    const brY = backH - wallSlope * oh

    const roofVerts: number[] = []
    // Top face (two triangles)
    roofVerts.push(lx, flY, fz, rx, frY, fz, rx, brY, bz)
    roofVerts.push(lx, flY, fz, rx, brY, bz, lx, blY, bz)

    const roofGeo = new THREE.BufferGeometry()
    roofGeo.setAttribute('position', new THREE.Float32BufferAttribute(roofVerts, 3))
    roofGeo.computeVertexNormals()

    const roofMat = roofMaterial.clone()
    roofMat.side = THREE.DoubleSide
    const flatRoof = new THREE.Mesh(roofGeo, roofMat)
    flatRoof.castShadow = true
    flatRoof.receiveShadow = true
    houseGroup.add(flatRoof)

    // Fascia boards (at the lower edges)
    // Front fascia
    const ffMidY = (flY + frY) / 2
    const ffGeo = new THREE.BoxGeometry(w + oh * 2, fasciaH, fasciaT)
    const ff = new THREE.Mesh(ffGeo, roofMaterial)
    ff.position.set(0, ffMidY - fasciaH / 2, fz)
    ff.castShadow = true
    houseGroup.add(ff)

    // Back fascia
    const bfMidY = (blY + brY) / 2
    const bfGeo = new THREE.BoxGeometry(w + oh * 2, fasciaH, fasciaT)
    const bf = new THREE.Mesh(bfGeo, roofMaterial)
    bf.position.set(0, bfMidY - fasciaH / 2, bz)
    bf.castShadow = true
    houseGroup.add(bf)

    // Left fascia (angled to follow roof slope)
    const totalRise = flY - blY
    const totalRun = d + oh * 2
    const sideLen = Math.sqrt(totalRise * totalRise + totalRun * totalRun)
    const slopeAngle = Math.atan2(totalRise, totalRun)
    const lfascGeo = new THREE.BoxGeometry(fasciaT, fasciaH, sideLen)
    const lfasc = new THREE.Mesh(lfascGeo, roofMaterial)
    lfasc.position.set(lx, (flY + blY) / 2 - fasciaH / 2, 0)
    lfasc.rotation.x = -slopeAngle
    lfasc.castShadow = true
    houseGroup.add(lfasc)

    // Right fascia (angled to follow roof slope)
    const rfascGeo = new THREE.BoxGeometry(fasciaT, fasciaH, sideLen)
    const rfasc = new THREE.Mesh(rfascGeo, roofMaterial)
    rfasc.position.set(rx, (frY + brY) / 2 - fasciaH / 2, 0)
    rfasc.rotation.x = -slopeAngle
    rfasc.castShadow = true
    houseGroup.add(rfasc)
  } else {
    // Hip roof
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


  houseGroup.position.y = 0
}

// ── Component ───────────────────────────────────────────────────────

export default function VedskjulThreeVisualizer(props: VedskjulVisualizerProps) {
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
    camera.position.set(3.5, 2.5, 4.0)

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

    buildVedskjulModel(houseGroup, props)

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
    buildVedskjulModel(sceneRef.current.houseGroup, props)
  }, [props.width, props.height, props.depth, props.sectionCount, props.finish, props.roof, props.roofShape, props.roofDegree, props.roofSlopeDirection, props.hasDoor])

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
