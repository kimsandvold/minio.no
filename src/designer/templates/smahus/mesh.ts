/**
 * 3D for småhus-modellen: hver `Del` blir én mesh med nøyaktig samme punkter
 * som kapplista er regnet fra (mm → m). Ingen egen geometri her.
 */
import * as THREE from 'three'
import type { BuildOptions } from '../../types'
import { resolveColor } from '../../materials'
import { settSplitt } from '../../konstruksjon'
import type { Del, Modell } from './modell'
import type { Prisme, Sylinder } from './geo'

const S = 0.001

function prismeGeo(g: Prisme): THREE.BufferGeometry {
  const n = g.a.length
  const ytre = g.p2.slice(0, g.ytre).map((p) => new THREE.Vector2(p[0], p[1]))
  const hull: THREE.Vector2[][] = []
  let off = g.ytre
  for (const l of g.hullLengder ?? []) {
    hull.push(g.p2.slice(off, off + l).map((p) => new THREE.Vector2(p[0], p[1])))
    off += l
  }
  const tris = THREE.ShapeUtils.triangulateShape(ytre, hull)
  const pos: number[] = []
  const push = (p: number[]) => pos.push(p[0] * S, p[1] * S, p[2] * S)
  const A = g.a
  const B = g.b
  for (const [i, j, k] of tris) {
    push(A[i]); push(A[k]); push(A[j])
    push(B[i]); push(B[j]); push(B[k])
  }
  const loops: Array<[number, number]> = [[0, g.ytre]]
  off = g.ytre
  for (const l of g.hullLengder ?? []) {
    loops.push([off, l])
    off += l
  }
  for (const [s, l] of loops) {
    for (let q = 0; q < l; q++) {
      const i = s + q
      const j = s + ((q + 1) % l)
      push(A[i]); push(A[j]); push(B[j])
      push(A[i]); push(B[j]); push(B[i])
    }
  }
  // Orientering: sørg for at normalene peker utover (positivt volum).
  let vol = 0
  for (let t = 0; t < pos.length; t += 9) {
    const ax = pos[t], ay = pos[t + 1], az = pos[t + 2]
    const bx = pos[t + 3], by = pos[t + 4], bz = pos[t + 5]
    const cx = pos[t + 6], cy = pos[t + 7], cz = pos[t + 8]
    vol += ax * (by * cz - bz * cy) - ay * (bx * cz - bz * cx) + az * (bx * cy - by * cx)
  }
  if (vol < 0) {
    for (let t = 0; t < pos.length; t += 9) {
      for (let c = 0; c < 3; c++) {
        const tmp = pos[t + 3 + c]
        pos[t + 3 + c] = pos[t + 6 + c]
        pos[t + 6 + c] = tmp
      }
    }
  }
  void n
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.computeVertexNormals()
  // UV: enkel boks-projeksjon så treteksturen får retning.
  const uv: number[] = []
  const nrm = geo.getAttribute('normal')
  for (let i = 0; i < pos.length / 3; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2]
    const nx = Math.abs(nrm.getX(i)), ny = Math.abs(nrm.getY(i))
    if (nx >= ny && nx >= Math.abs(nrm.getZ(i))) uv.push(z * 2, y * 2)
    else if (ny >= Math.abs(nrm.getZ(i))) uv.push(x * 2, z * 2)
    else uv.push(x * 2, y * 2)
  }
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  return geo
}

function sylinderGeo(g: Sylinder): { geo: THREE.BufferGeometry; pos: THREE.Vector3; quat: THREE.Quaternion } {
  const geo = new THREE.CylinderGeometry(g.r * S, g.r * S, g.h * S, g.segs ?? 16)
  const ax = new THREE.Vector3(...(g.akse ?? [0, 1, 0])).normalize()
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ax)
  const pos = new THREE.Vector3(g.c[0] * S, g.c[1] * S, g.c[2] * S).add(ax.clone().multiplyScalar((g.h * S) / 2))
  return { geo, pos, quat }
}

const MORK: Record<string, number> = { konstruksjon: 0.86, gulv: 1, kledning: 0.93, dor: 0.97, tak: 0.72, benk: 0.95 }

export function byggMesh(m: Modell, c: { treslag: string; farge: string }, opts?: BuildOptions): THREE.Group {
  const group = new THREE.Group()
  const tex = opts?.woodTexture ?? null
  const cache = new Map<string, THREE.MeshStandardMaterial>()
  const treMat = (pid: string, darken: number) => {
    const ov = opts?.overrides?.[pid]
    const treslag = ov?.treslag ?? c.treslag
    const farge = ov?.farge ?? c.farge
    const key = `${treslag}|${farge}|${darken.toFixed(3)}`
    if (!ov && cache.has(key)) return cache.get(key)!
    const col = new THREE.Color(resolveColor(treslag, farge)).multiplyScalar(darken)
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.82, metalness: 0.03 })
    if (tex) mat.map = tex
    if (!ov) cache.set(key, mat)
    return mat
  }
  const fastMat = new Map<string, THREE.MeshStandardMaterial>()
  const fast = (farge: number, opasitet?: number, metall = false) => {
    const key = `${farge}|${opasitet ?? 1}|${metall}`
    let mat = fastMat.get(key)
    if (!mat) {
      mat = new THREE.MeshStandardMaterial({ color: farge, roughness: metall ? 0.45 : 0.9, metalness: metall ? 0.6 : 0.02, transparent: opasitet !== undefined, opacity: opasitet ?? 1, side: opasitet !== undefined ? THREE.DoubleSide : THREE.FrontSide, depthWrite: opasitet === undefined })
      fastMat.set(key, mat)
    }
    return mat
  }
  const kryssfiner = new THREE.MeshStandardMaterial({ color: 0xcdb48a, roughness: 0.85 })
  m.deler.forEach((d: Del, i) => {
    let mesh: THREE.Mesh
    let mat: THREE.Material
    if (d.mat === 'kryssfiner-18') mat = kryssfiner
    else if (d.farge !== undefined) mat = fast(d.farge, d.opasitet, d.part === 'beslag')
    else mat = treMat(d.pid, (d.darken ?? MORK[d.part] ?? 0.9) * (d.gruppe === 'tak' ? 0.97 : 1) * (i % 7 === 0 ? 0.985 : 1))
    if (d.geo.type === 'prisme') mesh = new THREE.Mesh(prismeGeo(d.geo), mat)
    else {
      const s = sylinderGeo(d.geo)
      mesh = new THREE.Mesh(s.geo, mat)
      mesh.position.copy(s.pos)
      mesh.quaternion.copy(s.quat)
    }
    mesh.castShadow = d.opasitet === undefined
    mesh.receiveShadow = true
    mesh.userData.part = d.part
    mesh.userData.pid = d.pid
    mesh.userData.info = { navn: d.navn, profil: d.profil, lengdeCm: d.tre ? d.lengdeCm : 0 }
    // Eksplisitt lengdeakse (samme som kapplista måler langs) – plan-modell bruker den i stedet for å gjette.
    if (d.geo.type === 'prisme' && d.akse) mesh.userData.akse = [...d.akse]
    group.add(mesh)
  })
  settSplitt(group)
  return group
}
