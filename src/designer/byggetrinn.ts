/**
 * Byggetrinn – deler modellen inn i rekkefølgen den faktisk bygges i
 * (fundament → bjelkelag → dekke → reisverk → tak → kledning). Brukes av:
 *  - 3D-visningen («Bygg steg for steg»-animasjonen)
 *  - byggeplanen (illustrasjon av modellen etter hvert trinn i monteringen)
 *
 * Klassifiseringen leser `userData.part` + `userData.info.navn` og, for
 * generiske lag som «konstruksjon», geometrien (loddrett/vannrett, høyde over
 * bakken). Da virker den for alle templater uten at de må merke trinn selv.
 */
import * as THREE from 'three'

export const TRINN = ['fundament', 'bjelkelag', 'dekke', 'reisverk', 'tak', 'kledning'] as const
export type TrinnId = (typeof TRINN)[number]

export const TRINN_NAVN: Record<TrinnId, string> = {
  fundament: 'Fundament og stolpefester',
  bjelkelag: 'Bjelkelag og rammer',
  dekke: 'Gulv og dekke',
  reisverk: 'Reisverk – stolper, stendere og dragere',
  tak: 'Takkonstruksjon og taktekking',
  kledning: 'Kledning, dører og detaljer',
}

/**
 * Kontekst-deler (eksisterende husvegg o.l.) vises i alle trinn. Merkes
 * eksplisitt med `userData.kontekst = true` (eller part 'husvegg'/'kontekst') –
 * IKKE ut fra navnet, så ekte deler som «Festelist mot husvegg» klassifiseres riktig.
 */
const KONTEKST = new Set(['husvegg', 'kontekst'])
const SKALL = new Set(['kledning', 'vegg', 'dor', 'spiler', 'skjerm', 'gjerde', 'espalier', 'topplist', 'benk', 'trapp', 'bins', 'postkasse', 'rekkverk'])
const DEKKE = new Set(['gulv', 'bord', 'bunn', 'dekke', 'kantbord'])
/** Bjelkelag/dragere under et dekke bygges FØR dekket (også på høye terrasser). */
const BJELKELAG = new Set(['bjelkelag'])
/** Dragere uten dekke over seg: lavere enn dette (m) regnes som bjelkelag, høyere som reisverk (carport/pergola-dragere). */
const DRAGER_BJELKELAG_MAKS_Y = 1.8
const TAK = new Set(['tak', 'spaer', 'sperre', 'takstol', 'lekt'])
const FUNDAMENT = new Set(['fundament', 'plate', 'betong'])
const REISVERK = new Set(['stolpe', 'ramme', 'stiver', 'kneband', 'drager', 'beslag', 'stender'])

/** Del-informasjon (part + navn) ved å gå oppover til nærmeste merkede forelder. */
export function delInfo(o: THREE.Object3D): { part: string; navn: string; profil: string; lengdeCm: number; pid?: string; kontekst: boolean; holder: THREE.Object3D | null } {
  let part = ''
  let kontekst = false
  let info: { navn?: string; profil?: string; lengdeCm?: number } | undefined
  let pid: string | undefined
  let holder: THREE.Object3D | null = null
  let cur: THREE.Object3D | null = o
  while (cur) {
    if (!part && typeof cur.userData.part === 'string') part = cur.userData.part
    if (!info && cur.userData.info) { info = cur.userData.info; holder = cur }
    if (!pid && typeof cur.userData.pid === 'string') pid = cur.userData.pid
    if (cur.userData.kontekst === true) kontekst = true
    if (part && info && kontekst) break
    cur = cur.parent
  }
  return { part, navn: info?.navn ?? '', profil: info?.profil ?? '', lengdeCm: info?.lengdeCm ?? 0, pid, kontekst, holder }
}

/**
 * Trinn-indeks (0–5) for én del, eller -1 for kontekst som alltid vises.
 * `bb` er delens verdens-boks (meter). `dekkeY` (valgfri) er underkant av
 * laveste dekke/gulvbord i modellen (se `dekkeUnderkant`): alt bærende som
 * ligger under dekket (stolper, dragere, bjelker) bygges da før dekket –
 * uansett hvor høy terrassen er.
 */
export function trinnFor(part: string, navn: string, bb: THREE.Box3, dekkeY?: number, kontekst = false): number {
  const p = part.toLowerCase()
  const nv = navn.toLowerCase()
  if (kontekst || KONTEKST.has(p)) return -1
  if (FUNDAMENT.has(p) || /fundament|betong|stolpesko|stolpefot|pilar|ringmur|plate \(støpt|grus/.test(nv)) return 0
  if (TAK.has(p) || /sperre|spær|takstol|møne|takplate|takpapp|taktekk|vindski|taklekt|sløyfe|takåsanker|sperrebeslag/.test(nv)) return 4
  if (DEKKE.has(p) || /terrassebord|gulvbord|bunnbord|dekkebord/.test(nv)) return 2
  if (BJELKELAG.has(p)) return 1
  if (SKALL.has(p)) return 5

  const sx = bb.max.x - bb.min.x
  const sy = bb.max.y - bb.min.y
  const sz = bb.max.z - bb.min.z
  const loddrett = sy > Math.max(sx, sz) * 1.5
  const underDekke = dekkeY !== undefined && bb.max.y <= dekkeY + 0.01
  if (p === 'drager') {
    if (underDekke) return 1
    if (dekkeY === undefined && bb.max.y < DRAGER_BJELKELAG_MAKS_Y) return 1
    return 3
  }
  if (REISVERK.has(p)) {
    // Stolper/stag under et dekke (terrasse) står før bjelkelaget.
    if (underDekke) return loddrett ? 0 : 1
    if (loddrett && bb.max.y < 1.0 && p === 'stolpe') return 0
    return 3
  }
  if (underDekke) return loddrett ? 0 : 1
  // Generisk «konstruksjon»: lav, vannrett ramme = bjelkelag; ellers reisverk.
  if (!loddrett && bb.max.y < 0.7) return 1
  if (loddrett && bb.max.y < 0.9) return 0
  return 3
}

/** Er delen et dekke/gulvbord (til `dekkeUnderkant`)? */
export function erDekke(part: string, navn: string): boolean {
  return DEKKE.has(part.toLowerCase()) || /terrassebord|gulvbord|bunnbord|dekkebord/.test(navn.toLowerCase())
}

/**
 * Underkant (m) av det laveste dekket i modellen, eller undefined uten dekke.
 * Kun dekker som ligger høyere enn 0,3 m regnes (lave plattinger trenger ikke
 * justeringen, og bunnbord i bod skal ikke trekke tak-dragere ned).
 */
export function dekkeUnderkant(bokser: Array<{ part: string; navn: string; minY: number }>): number | undefined {
  let y: number | undefined
  for (const b of bokser) if (erDekke(b.part, b.navn) && b.minY > 0.3) y = y === undefined ? b.minY : Math.min(y, b.minY)
  return y
}

/** Trinnene som faktisk finnes i en modell (sortert). */
export function trinnIModell(root: THREE.Object3D): number[] {
  const funnet = new Set<number>()
  root.updateMatrixWorld(true)
  const meshes: Array<{ m: THREE.Mesh; part: string; navn: string; kontekst: boolean; bb: THREE.Box3 }> = []
  root.traverse((o) => {
    const m = o as THREE.Mesh
    if (!m.isMesh) return
    const i = delInfo(m)
    meshes.push({ m, part: i.part, navn: i.navn, kontekst: i.kontekst, bb: new THREE.Box3().setFromObject(m) })
  })
  const dekkeY = dekkeUnderkant(meshes.map((x) => ({ part: x.part, navn: x.navn, minY: x.bb.min.y })))
  for (const x of meshes) {
    const t = trinnFor(x.part, x.navn, x.bb, dekkeY, x.kontekst)
    x.m.userData.trinn = t
    if (t >= 0) funnet.add(t)
  }
  return [...funnet].sort((a, b) => a - b)
}
