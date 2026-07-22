import * as THREE from 'three'

/**
 * Konstruksjonsvirke – felles standard for designer-templatene.
 *
 * Dimensjonene følger norsk standard skurlast/konstruksjonsvirke (C24). «2×4»
 * = 48×98 mm. Modulene her bygger bærende trevirke (bjelkelag/gulv, stenderverk
 * med sviller, og sperrer) som legges inn i 3D-modellen OG i materiallista, slik
 * at produktene kan selges som reelle byggeplaner.
 *
 * Standardprofiler (b × h, mm):
 *   48×48, 48×73, 48×98 («2×4»), 48×123, 48×148 («2×6»), 48×198 («2×8»)
 */

export const KV_B = 0.048 // tykkelse (48 mm)
export const KV_H = 0.098 // høyde/bredde (98 mm) – «2×4»
export const KV_PROFIL = '48 × 98 mm (2×4)'
export const KV_STUD_PRIS = 'stolpe-48x98' // stender/svill
export const KV_BJELKE_PRIS = 'bjelke-48x98' // bjelke/sperre (C24)
export const CC = 0.6 // senteravstand 600 mm (norsk standard)

// Kraftigere bjelke – sperrer/gratsperrer/mønebærer i valmtak (NS 3478).
export const KV148_H = 0.148
export const KV148_PROFIL = '48 × 148 mm'
export const KV148_PRIS = 'bjelke-48x148'

// Gulvdekke – terrassebord (som terrasse-templatet).
export const DEKKE_T = 0.028 // terrassebord 28 mm
export const DEKKE_B = 0.12 // 120 mm bredde
export const DEKKE_GAP = 0.006 // sprekk mellom bord
export const DEKKE_PRIS = 'terrassebord-28x120'
/** Overkant av ferdig gulv (bjelkelag + dekke) over bakken. */
export const GULV_TOP = KV_H + DEKKE_T

/**
 * Antall bjelker/stendere slik at senteravstanden ALDRI overstiger `cc`
 * (norsk standard c/c ≤ 600 mm): antall bæk = ceil(len/cc), medlemmer = bæk + 1.
 */
export const antallCC = (len: number, cc = CC) => Math.max(2, Math.ceil(len / cc - 1e-9) + 1)

/** Antall terrassebord som dekker en bredde `w` (til materiallista). */
export const antallGulvbord = (w: number) => Math.max(1, Math.floor(w / (DEKKE_B + DEKKE_GAP)))

type Mat = (pid: string, darken?: number) => THREE.MeshStandardMaterial
type Info = { navn: string; profil: string; lengdeCm: number }

function add(target: THREE.Group, geo: THREE.BufferGeometry, mat: THREE.MeshStandardMaterial, pid: string, info: Info) {
  const m = new THREE.Mesh(geo, mat)
  m.castShadow = true
  m.receiveShadow = true
  m.userData.part = 'konstruksjon'
  m.userData.pid = pid
  m.userData.info = info
  target.add(m)
  return m
}

/**
 * Takstol-stav (undergurt/kingpost/diagonal) mellom to punkter a→b. Tegner et
 * rektangulært tverrsnitt (`thick` på tvers av takstolplanet × `depth` i planet)
 * langs forbindelsen, orientert med boksens z-akse mot b. Staven ligger i et
 * konstant-x-plan (a og b deler x), så `thick` følger x-aksen og `depth` ligger
 * i takstolplanet. Brukes til ekte takstoler (SINTEF Byggforsk – fagverk).
 */
function strut(roof: THREE.Group, mat: Mat, a: [number, number, number], b: [number, number, number], pid: string, navn: string, thick = KV_B, depth = KV_H, darken = 0.84) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2]
  const L = Math.hypot(dx, dy, dz)
  if (L < 0.03) return
  const profil = `48 × ${Math.round(depth * 1000)} mm`
  const m = add(roof, new THREE.BoxGeometry(thick, depth, L), mat(pid, darken), pid, { navn, profil, lengdeCm: Math.round(L * 100) })
  m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(dx, dy, dz).normalize())
}

/**
 * Takstol-stav i takstolplanet (konstant x) med VINKLEDE endekutt. `p0`/`p1` er
 * senterlinjas ender i [z, y]; `depth` er tverrsnittshøyden i planet, `thick`
 * (x) på tvers. `cutA`/`cutB` er retningen (i [z, y]) hver ende kappes parallelt
 * med – f.eks. sperreretningen, så diagonalen butter flust under sperra i stedet
 * for et rett (loddrett på staven) kutt. Ekstruderes `thick` langs x ved `xc`.
 */
function beam2D(roof: THREE.Group, mat: Mat, xc: number, thick: number, p0: [number, number], p1: [number, number], depth: number, cutA: [number, number], cutB: [number, number], pid: string, navn: string, darken = 0.84) {
  const dz = p1[0] - p0[0], dy = p1[1] - p0[1]
  const L = Math.hypot(dz, dy)
  if (L < 0.03) return
  const u: [number, number] = [dz / L, dy / L]
  const n: [number, number] = [-u[1], u[0]] // normal i planet
  // Hjørne på ende P, side s (±depth/2), kappet parallelt med retning c.
  const corner = (P: [number, number], s: number, c: [number, number]): [number, number] => {
    const nxc = n[0] * c[1] - n[1] * c[0]
    const uxc = u[0] * c[1] - u[1] * c[0]
    // Skyv hjørnet langs staven til kuttlinja. Nær-parallelt kutt (uxc ≈ 0) gir
    // et løpsk kutt → klem til rett kutt / maks 2× tverrsnitt så det ikke spiker.
    let a = Math.abs(uxc) < 1e-3 ? 0 : (-s * nxc) / uxc
    a = Math.max(-2 * depth, Math.min(2 * depth, a))
    return [P[0] + s * n[0] + a * u[0], P[1] + s * n[1] + a * u[1]]
  }
  const h = depth / 2
  const A1 = corner(p0, h, cutA), A2 = corner(p0, -h, cutA)
  const B1 = corner(p1, h, cutB), B2 = corner(p1, -h, cutB)
  const sh = new THREE.Shape()
  sh.moveTo(A1[0], A1[1]); sh.lineTo(B1[0], B1[1]); sh.lineTo(B2[0], B2[1]); sh.lineTo(A2[0], A2[1]); sh.closePath()
  const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: false })
  g.translate(0, 0, -thick / 2); g.rotateY(-Math.PI / 2); g.translate(xc, 0, 0)
  add(roof, g, mat(pid, darken), pid, { navn, profil: `48 × ${Math.round(depth * 1000)} mm`, lengdeCm: Math.round(L * 100) })
}

/** Utspart hakk (lekt-hakk) i taklekt. */
export const LEKT_T = 0.048 // taklekt 48 × 48 mm
export const LEKT_HAKK = 0.048 // lekten ligger nedfelt hele sin høyde (48 mm) i sperra

/** Fasciebord / vindski langs raftet og gavlene (dekker sperreendene). */
export const FASCIA_T = 0.022
export const FASCIA_H = KV148_H + 0.03

/** Vannbord/kappe oppå vindskien. Vindskien står TOPPBORD_LOFT over taket. */
export const TOPPBORD_T = 0.016
export const TOPPBORD_B = 0.07 // smal kappe (litt bredere enn vindskien → lite utstikk)
export const TOPPBORD_LOFT = 0 // vindski/vannbord ligger tilnærmet i flukt med tekkingen (ikke oppstikkende kant)
export const BARGE_OVER = 0.05 // vindskien stikker litt ut forbi raftet (i lengden)

/**
 * Skråstilt fascia/vindski langs en gavl (følger takfallet). Profil i z-y
 * (topp = takflatens overkant `undY(z)+RH`, høyde FASCIA_H ned), ekstrudert
 * FASCIA_T tykt og lagt i x-posisjonen `xT`. Loddrett kappede ender.
 */
function rakeGeo(zStart: number, zEnd: number, undY: (z: number) => number, RH: number, xT: number): THREE.ExtrudeGeometry {
  // Vindskiens overkant står litt (TOPPBORD_LOFT) over selve tekkingen.
  const topL = (z: number) => undY(z) + RH + TAK_PLY + TOPPBORD_LOFT
  const s = new THREE.Shape()
  s.moveTo(zStart, topL(zStart) - FASCIA_H)
  s.lineTo(zEnd, topL(zEnd) - FASCIA_H)
  s.lineTo(zEnd, topL(zEnd))
  s.lineTo(zStart, topL(zStart))
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: FASCIA_T, bevelEnabled: false })
  g.rotateY(-Math.PI / 2)
  g.translate(xT, 0, 0)
  return g
}

/** Gesims-plank tykkelse (dekker sperrene mellom kledningstopp og takflate). */
export const GESIMS_T = 0.02
/**
 * Gesimsbord langs en vegg som følger takfallet: fra veggtopp/sperre-underkant
 * `botY(z)` og opp `RH` (til takflatens underkant). Profil i z-y, ekstrudert
 * `GESIMS_T` tykt, lagt i x-posisjonen `xT`. Brukes til å kle sperre-sonen over
 * kledningen (gavl/raft), så rammeverket ikke står bart under taket.
 */
function friezeGeo(zStart: number, zEnd: number, botY: (z: number) => number, RH: number, xT: number): THREE.ExtrudeGeometry {
  const s = new THREE.Shape()
  s.moveTo(zStart, botY(zStart))
  s.lineTo(zEnd, botY(zEnd))
  s.lineTo(zEnd, botY(zEnd) + RH)
  s.lineTo(zStart, botY(zStart) + RH)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: GESIMS_T, bevelEnabled: false })
  g.rotateY(-Math.PI / 2)
  g.translate(xT, 0, 0)
  return g
}

/**
 * Soffitt/undertak KUN under takutstikket – en flat bord-ring mellom veggliv
 * (±ww/2, ±dd/2) og fascia (±(ww/2+oh), ±(dd/2+oh)). Ingen innvendig himling.
 * `undY(z)` gir takflatens underkant (bordene legges her, følger fallet).
 */
function soffittRing(roof: THREE.Group, mat: Mat, undY: (z: number) => number, ww: number, dd: number, oh: number) {
  const oX = ww / 2
  const oXo = ww / 2 + oh
  const oZ = dd / 2
  const oZo = dd / 2 + oh
  const v: number[] = []
  const quad = (a: number[], b: number[], c: number[], e: number[]) => { v.push(...a, ...b, ...c, ...a, ...c, ...e) }
  // Front + bak (langs x, full bredde inkl. hjørnene)
  quad([-oXo, undY(oZ), oZ], [-oXo, undY(oZo), oZo], [oXo, undY(oZo), oZo], [oXo, undY(oZ), oZ])
  quad([-oXo, undY(-oZ), -oZ], [-oXo, undY(-oZo), -oZo], [oXo, undY(-oZo), -oZo], [oXo, undY(-oZ), -oZ])
  // Venstre + høyre (langs z, samplet så ringen følger takfallet/gavlen)
  const N = 8
  for (let i = 0; i < N; i++) {
    const z0 = -oZ + (2 * oZ * i) / N
    const z1 = -oZ + (2 * oZ * (i + 1)) / N
    quad([-oXo, undY(z0), z0], [-oXo, undY(z1), z1], [-oX, undY(z1), z1], [-oX, undY(z0), z0])
    quad([oX, undY(z0), z0], [oX, undY(z1), z1], [oXo, undY(z1), z1], [oXo, undY(z0), z0])
  }
  byggTakplate(roof, mat('soffit', 0.82), v, 'soffit', 'Undertak (soffitt, utstikk)', TAK_PLY, 'tak')
}

/**
 * Bygger en sperre-geometri (profil i z-y, ekstrudert 48 mm langs x) med
 * loddrett kappede ender OG utsparte hakk i overkant der taklektene krysser,
 * slik at lektene ligger nedfelt i sperra. `undY(z)` gir underkant sperre,
 * `RH` sperrehøyde, `notchZs` lektsentre, `halfW` halve lektbredden, `nd`
 * hakkdybde. Geometrien translateres til x-posisjonen `xT`.
 *
 * Ved `seatZ` (raftelinje/toppbjelke) lages et fugleneb-utsparing (birdsmouth):
 * en vannrett sits på bjelkens overkant (`undY(seatZ)`) med `seatLen` innover,
 * så sperra ligger an mot toppbjelken i stedet for bare å berøre ytterkanten.
 */
function sperreGeoMedHakk(zStart: number, zEnd: number, undY: (z: number) => number, RH: number, notchZs: number[], halfW: number, nd: number, xT: number, seatZ?: number, seatLen = 0): THREE.ExtrudeGeometry {
  const top = (z: number) => undY(z) + RH
  const sgn = zEnd > zStart ? 1 : -1
  const s = new THREE.Shape()
  s.moveTo(zStart, undY(zStart))
  if (seatZ !== undefined && seatLen > 0.005) {
    const heel = seatZ // ytterkant sits (raftelinje)
    const inner = seatZ - sgn * seatLen // innover mot mønet
    const seatY = undY(heel) // toppbjelkens overkant
    s.lineTo(inner, undY(inner))
    s.lineTo(inner, seatY) // loddrett ned til sitsen
    s.lineTo(heel, seatY) // vannrett sits på bjelken
    s.lineTo(zEnd, undY(zEnd)) // videre ut i utstikket
  } else {
    s.lineTo(zEnd, undY(zEnd))
  }
  s.lineTo(zEnd, top(zEnd))
  const dirDown = zEnd > zStart // går fra zEnd mot zStart langs overkanten
  const lo = Math.min(zStart, zEnd)
  const hi = Math.max(zStart, zEnd)
  const nz = notchZs
    .filter((z) => z - halfW > lo + 1e-4 && z + halfW < hi - 1e-4)
    .sort((a, b) => (dirDown ? b - a : a - b))
  for (const zL of nz) {
    const outer = dirDown ? zL + halfW : zL - halfW
    const inner = dirDown ? zL - halfW : zL + halfW
    s.lineTo(outer, top(outer))
    s.lineTo(outer, top(outer) - nd)
    s.lineTo(inner, top(inner) - nd)
    s.lineTo(inner, top(inner))
  }
  s.lineTo(zStart, top(zStart))
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: KV_B, bevelEnabled: false })
  g.rotateY(-Math.PI / 2)
  g.translate(xT, 0, 0)
  return g
}

/**
 * Gratsperre (valm-hip): parallellogram-profil i sitt eget loddrette plan
 * (LODDRETT kappede ender), ekstrudert 48 mm og dreid til grat-retningen i
 * plan. Fordi graten går diagonalt (45°) blir de loddrette endeflatene stående
 * 45° mot begge veggene og passer inn i takrammen. `yCorner`/`yApex` er
 * underkant sperre ved raftehjørnet og ved mønenden.
 */
export function byggGratsperre(roof: THREE.Group, mat: Mat, cornerX: number, cornerZ: number, apexX: number, apexZ: number, yCorner: number, yApex: number, RH: number, pid: string, navn: string) {
  const dx = apexX - cornerX
  const dz = apexZ - cornerZ
  const Lh = Math.hypot(dx, dz) // horisontal lengde i plan
  if (Lh < 1e-4) return
  const s = new THREE.Shape()
  s.moveTo(0, yCorner)
  s.lineTo(Lh, yApex)
  s.lineTo(Lh, yApex + RH)
  s.lineTo(0, yCorner + RH)
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth: KV_B, bevelEnabled: false })
  g.translate(0, 0, -KV_B / 2) // sentrer tykkelsen om grat-linja
  g.rotateY(Math.atan2(-dz, dx)) // drei lengdeaksen til grat-retningen
  const m = add(roof, g, mat(pid, 0.84), pid, { navn, profil: KV148_PROFIL, lengdeCm: Math.round(Math.hypot(Lh, yApex - yCorner) * 100) })
  m.position.set(cornerX, 0, cornerZ)
}

/**
 * Bjelkelag/gulv: to rammebjelker (langs z) + tverrgående gulvbjelker (langs x,
 * c/c) i bunnen (y 0…98 mm). Alle i 48×98. Returnerer ingenting – legges rett
 * inn i `target`.
 */
export function byggGulv(target: THREE.Group, mat: Mat, w: number, d: number, keyPrefix = 'gulv') {
  const y = KV_H / 2
  // Rammebjelker langs dybden (z).
  ;[-1, 1].forEach((sx, i) => {
    add(target, new THREE.BoxGeometry(KV_B, KV_H, d), mat(`${keyPrefix}-ramme-${i}`, 0.8), `${keyPrefix}-ramme-${i}`, { navn: 'Rammebjelke (gulv)', profil: KV_PROFIL, lengdeCm: Math.round(d * 100) })
      .position.set(sx * (w / 2 - KV_B / 2), y, 0)
  })
  // Tverrgående gulvbjelker (langs x) med senteravstand ≤ 600 mm.
  const n = antallCC(d)
  for (let i = 0; i < n; i++) {
    const z = -d / 2 + KV_H / 2 + (i * (d - KV_H)) / (n - 1)
    add(target, new THREE.BoxGeometry(w - 2 * KV_B, KV_H, KV_B), mat(`${keyPrefix}-bjelke-${i}`, 0.82), `${keyPrefix}-bjelke-${i}`, { navn: 'Gulvbjelke', profil: KV_PROFIL, lengdeCm: Math.round((w - 2 * KV_B) * 100) })
      .position.set(0, y, z)
  }
  // Gulvdekke – terrassebord (langs z), tett tildekket med sprekk, oppå bjelkelaget.
  // Senkes 3 mm ned i bjelkene så bord-underside og bjelke-overkant ikke blir
  // helt sammenfallende (unngår z-fighting/«hår» i visningen).
  const dy = KV_H - 0.003 + DEKKE_T / 2
  const step = DEKKE_B + DEKKE_GAP
  const nb = Math.max(1, Math.floor(w / step))
  const start = -((nb - 1) * step) / 2
  for (let i = 0; i < nb; i++) {
    const m = add(target, new THREE.BoxGeometry(DEKKE_B, DEKKE_T, d), mat(`${keyPrefix}-bord-${i}`, i % 2 ? 0.97 : 1), `${keyPrefix}-bord-${i}`, { navn: 'Terrassebord (gulv)', profil: '28 × 120 mm', lengdeCm: Math.round(d * 100) })
    m.position.set(start + i * step, dy, 0)
    m.userData.part = 'gulv'
  }
}

/**
 * Stenderverk for én vegg: bunnsvill + toppsvill + stendere (c/c). Bygges i
 * lokal x-akse (langs veggen) fra −len/2 til +len/2, med tykkelsen i lokal z.
 * Veggen roteres/plasseres av kalleren via en Group. Toppen kan skrå fra
 * `hStart` (venstre) til `hEnd` (høyre) for skråvegger.
 */
export function byggStendervegg(mat: Mat, len: number, hStart: number, hEnd = hStart, keyPrefix = 'vegg'): THREE.Group {
  const g = new THREE.Group()
  const topY = (x: number) => {
    const t = len > 0 ? (x + len / 2) / len : 0.5
    return hStart + (hEnd - hStart) * t
  }
  // Bunnsvill (liggende, langs x): 98 bred (z) × 48 tykk (y).
  add(g, new THREE.BoxGeometry(len, KV_B, KV_H), mat(`${keyPrefix}-svill-b`, 0.78), `${keyPrefix}-svill-b`, { navn: 'Bunnsvill', profil: KV_PROFIL, lengdeCm: Math.round(len * 100) })
    .position.set(0, KV_B / 2, 0)
  // Toppsvill (følger evt. skråning – deles i to punkter).
  const topGeo = new THREE.BoxGeometry(len, KV_B, KV_H)
  const top = add(g, topGeo, mat(`${keyPrefix}-svill-t`, 0.78), `${keyPrefix}-svill-t`, { navn: 'Toppsvill', profil: KV_PROFIL, lengdeCm: Math.round(len * 100) })
  const midTop = (topY(-len / 2) + topY(len / 2)) / 2
  top.position.set(0, midTop - KV_B / 2, 0)
  if (Math.abs(hEnd - hStart) > 1e-6) top.rotation.z = Math.atan2(hEnd - hStart, len)
  const minTop = Math.min(topY(-len / 2), topY(len / 2))

  // Stendere c/c ≤ 600 mm – kun MELLOM endene (hjørnestolpene er endestendere),
  // så de ikke overlapper stolpene og gir dobbeltvirke/z-fighting.
  const bays = Math.max(1, Math.ceil(len / CC))
  for (let i = 1; i < bays; i++) {
    const x = -len / 2 + (i * len) / bays
    const h = topY(x) - 2 * KV_B // mellom bunn- og toppsvill
    if (h <= 0.02) continue
    add(g, new THREE.BoxGeometry(KV_B, h, KV_H), mat(`${keyPrefix}-stender-${i}`, 0.85), `${keyPrefix}-stender-${i}`, { navn: 'Stender', profil: KV_PROFIL, lengdeCm: Math.round(h * 100) })
      .position.set(x, KV_B + h / 2, 0)
  }

  // Horisontalt spikerslag (lekt) for stående kledning – c/c ≤ 600 mm, utenpå
  // stenderne mot kledningen. Gir feste og støtte for spilene.
  const LEKT = 0.036
  const battenZ = KV_H / 2 + LEKT / 2
  const nRow = Math.max(1, Math.ceil((minTop - KV_B) / CC) - 1)
  for (let r = 1; r <= nRow; r++) {
    const y = KV_B + (r * (minTop - 2 * KV_B)) / (nRow + 1)
    add(g, new THREE.BoxGeometry(len, LEKT, LEKT), mat(`${keyPrefix}-spikerslag-${r}`, 0.8), `${keyPrefix}-spikerslag-${r}`, { navn: 'Spikerslag (kledning)', profil: '36 × 48 mm', lengdeCm: Math.round(len * 100) })
      .position.set(0, y, battenZ)
  }

  // Vindavstiving: ett skråband hjørne-til-hjørne (innfelt), i veggplanet.
  sperreMellom(g, mat, [-len / 2 + KV_B, KV_B, 0], [len / 2 - KV_B, minTop - KV_B, 0], `${keyPrefix}-band`, 'Vindavstiver (skråband)', 0.048)

  return g
}

/**
 * Valmtak (hip) – bygges opp på nytt, steg for steg.
 * STEG 1: «stretcher» – en stående 48 mm plank lagt OPPÅ toppbjelkene, sentrert
 * langs langsiden, m/utstikk (oh) i hver ende. HØYDEN på stretcheren settes av
 * takvinkelen (= takhøyden i midten): MH = (korteste halvspenn) · tan(vinkel).
 */
export function byggValmtak(target: THREE.Group, mat: Mat, w: number, d: number, topY: number, angleDeg: number, oh = 0.1, tekke: string = 'kryssfiner') {
  const roof = new THREE.Group()
  // Stretcheren legges langs den lengste aksen. Roter 90° hvis dybden er størst.
  const alongX = w >= d
  const W = alongX ? w : d // lengste side
  const D = alongX ? d : w // korteste side (bestemmer takhøyden)
  const rotY = alongX ? 0 : Math.PI / 2

  // Takvinkelen bestemmer takhøyden. Overkanten på stretcher og tverrbjelker
  // kappes i takvinkelen: fra fasciaens overkant ved raftet, stigende mot midten.
  const ang = (angleDeg * Math.PI) / 180
  const pitch = Math.tan(ang)
  const len = W + 2 * oh
  const ridgeEnd = Math.max(0, W / 2 - D / 2) // der gratene møter stretcheren
  const FASC_H = 0.05
  const fascTop = topY + FASC_H // overkant fasciabord (raftehøyde)
  const ridgeTop = fascTop + (D / 2 + oh) * pitch // takhøyde i midten
  const MH = ridgeTop - topY
  const hl = 0.04 // halvt-i-halvt-dybde (nedre, flate del)
  const topZ = (z: number) => fascTop + (D / 2 + oh - Math.abs(z)) * pitch // tverrbjelke-overkant
  const topXs = (x: number) => (Math.abs(x) <= ridgeEnd ? ridgeTop : fascTop + (W / 2 + oh - Math.abs(x)) * pitch) // stretcher-overkant
  // Tverrbjelke-posisjoner = veggens stenderdeling (unntatt endene ved gavlveggene).
  const baysX = Math.max(1, Math.ceil(W / CC))
  const xs: number[] = []
  for (let i = 1; i < baysX; i++) xs.push(-W / 2 + (i * W) / baysX)
  const profil = `48 Ã ${Math.round(MH * 1000)} mm`

  // STEG 2: Stretcher + tverrbjelker med skråkuttet overkant (takvinkel), halvt-
  // i-halvt sammenføyd: nedre del (flat, hl) med spor, øvre del skråkuttet.

  // Stretcher – nedre del i segmenter (spor ved hver tverrbjelke).
  let prev = -len / 2
  let sIdx = 0
  const addLowerSeg = (a: number, b: number) => {
    if (b - a < 0.004) return
    add(roof, new THREE.BoxGeometry(b - a, hl, KV_B), mat(`stretcher-n${sIdx}`, 0.76), `stretcher-n${sIdx}`, { navn: 'Stretcher', profil, lengdeCm: Math.round((b - a) * 100) })
      .position.set((a + b) / 2, topY + hl / 2, 0)
    sIdx++
  }
  for (const xi of xs) {
    addLowerSeg(prev, xi - KV_B / 2)
    prev = xi + KV_B / 2
  }
  addLowerSeg(prev, len / 2)
  // Stretcher – øvre del med skråkuttet overkant (møne flatt i midten, faller mot valmendene).
  {
    const s = new THREE.Shape()
    s.moveTo(-len / 2, topY + hl)
    s.lineTo(len / 2, topY + hl)
    s.lineTo(len / 2, topXs(len / 2))
    if (ridgeEnd > 0.01) {
      s.lineTo(ridgeEnd, ridgeTop)
      s.lineTo(-ridgeEnd, ridgeTop)
    } else {
      s.lineTo(0, ridgeTop)
    }
    s.lineTo(-len / 2, topXs(-len / 2))
    s.closePath()
    const g = new THREE.ExtrudeGeometry(s, { depth: KV_B, bevelEnabled: false })
    g.translate(0, 0, -KV_B / 2)
    add(roof, g, mat('stretcher-o', 0.76), 'stretcher-o', { navn: 'Stretcher', profil, lengdeCm: Math.round(len * 100) })
  }

  // Tverrbjelker – nedre del (flat) hel, øvre del skråkuttet og delt i to ved z=0.
  xs.forEach((xi, i) => {
    const inRidge = Math.abs(xi) <= ridgeEnd + 1e-9
    const zEnd = inRidge ? D / 2 + oh : Math.abs(xi) - ridgeEnd
    if (zEnd < KV_B) return
    const cLen = 2 * zEnd
    add(roof, new THREE.BoxGeometry(KV_B, hl, cLen), mat(`tverr-${i}-l`, 0.78), `tverr-${i}-l`, { navn: 'Tverrbjelke', profil, lengdeCm: Math.round(cLen * 100) })
      .position.set(xi, topY + hl / 2, 0)
    // Skråkuttet øvre del – KUN i møne-lengden. I valmendene følger takflaten
    // valm-planet (grat), så der bygges ingen indre øvre del (ellers stikker den
    // opp gjennom taket); der er det bare nedre del + utstikk-bjelken (lookout).
    if (inRidge) {
      ;[1, -1].forEach((sd, k) => {
        const zi = KV_B / 2
        const zo = zEnd
        if (zo - zi < 0.01) return
        const s = new THREE.Shape()
        s.moveTo(sd * zi, topY + hl)
        s.lineTo(sd * zo, topY + hl)
        s.lineTo(sd * zo, topZ(zo))
        s.lineTo(sd * zi, topZ(zi))
        s.closePath()
        const g = new THREE.ExtrudeGeometry(s, { depth: KV_B, bevelEnabled: false })
        g.rotateY(-Math.PI / 2)
        g.translate(xi + KV_B / 2, 0, 0)
        add(roof, g, mat(`tverr-${i}-u${k}`, 0.78), `tverr-${i}-u${k}`, { navn: 'Tverrbjelke', profil, lengdeCm: Math.round((zo - zi) * 100) })
      })
    }
    // Valmenden: utstikk-bjelke (lookout) fra gratlinja ut til front-/bak-fascia,
    // med SAMME skråkutt som resten (overkant følger takflaten).
    if (!inRidge) {
      const zo = D / 2 + oh
      if (zo - zEnd > 0.03) {
        ;[1, -1].forEach((sz, k) => {
          const s = new THREE.Shape()
          s.moveTo(sz * zEnd, topY)
          s.lineTo(sz * zo, topY)
          s.lineTo(sz * zo, topZ(zo)) // ytre (fascia) = fasciahøyde
          s.lineTo(sz * zEnd, topZ(zEnd)) // indre (grat) = takflatens høyde der
          s.closePath()
          const g = new THREE.ExtrudeGeometry(s, { depth: KV_B, bevelEnabled: false })
          g.rotateY(-Math.PI / 2)
          g.translate(xi + KV_B / 2, 0, 0)
          add(roof, g, mat(`tverr-${i}-oh${k}`, 0.78), `tverr-${i}-oh${k}`, { navn: 'Tverrbjelke (utstikk)', profil, lengdeCm: Math.round((zo - zEnd) * 100) })
        })
      }
    }
  })

  // Hjørnebjelker (grat) – 45° i plan fra stretcher-enden (M) ut til hjørnet (P),
  // med SAMME skråkutt: overkanten faller fra mønehøyden ved stretcheren til
  // fasciaens overkant ved hjørnet. Flat underkant på veggtoppen.
  const Lc = (D / 2 + oh) * Math.SQRT2 // planlengde M → P
  ;[1, -1].forEach((sx) => {
    ;[1, -1].forEach((sz) => {
      const mx = sx * ridgeEnd
      const ux = (sx * (W / 2 + oh) - mx) / Lc
      const uz = (sz * (D / 2 + oh)) / Lc
      // Sideoppriss (X = grat-akse 0…Lc, Y = høyde): flat underkant, skrå overkant.
      const shape = new THREE.Shape()
      shape.moveTo(0, topY)
      shape.lineTo(Lc, topY)
      shape.lineTo(Lc, fascTop) // ytre (hjørne) = fasciahøyde
      shape.lineTo(0, ridgeTop) // indre (stretcher) = mønehøyde
      shape.closePath()
      const g = new THREE.ExtrudeGeometry(shape, { depth: KV_B, bevelEnabled: false })
      g.translate(0, 0, -KV_B / 2) // sentrer bredden om grat-linja
      g.rotateY(Math.atan2(-uz, ux)) // pek langs 45°-diagonalen
      const m = add(roof, g, mat(`hjorne-${sx}-${sz}`, 0.8), `hjorne-${sx}-${sz}`, { navn: 'Hjørnebjelke', profil, lengdeCm: Math.round(Math.hypot(Lc, ridgeTop - fascTop) * 100) })
      m.position.set(mx, 0, 0)
    })
  })

  roof.children.forEach((ch) => (ch.userData.part = 'konstruksjon'))
  // Split-visning: løft stretcheren over tverrbjelkene så halvt-i-halvt-sporet vises.
  const strLift = new THREE.Vector3(0, MH + 0.06, 0)
  roof.children.forEach((ch) => {
    const pid = ch.userData.pid
    if (typeof pid === 'string' && pid.startsWith('stretcher')) ch.userData.explode = strLift.clone()
  })

  // Fasciebord rundt hele raftet – fast 50 mm høyt, 20 mm tykt, fra bunnen (topY).
  const FASC_T = 0.02
  const yF = topY + FASC_H / 2
  const perFascia = (dx: number, dy: number, dz: number, x: number, z: number, pid: string) => {
    const m = add(roof, new THREE.BoxGeometry(dx, dy, dz), mat(pid, 0.66), pid, { navn: 'Fasciebord', profil: '20 × 50 mm', lengdeCm: Math.round(Math.max(dx, dz) * 100) })
    m.position.set(x, yF, z)
    m.userData.part = 'tak'
  }
  const lenX = W + 2 * oh + 2 * FASC_T // front/bak kapper over sidene i hjørnene
  const lenZ = D + 2 * oh
  perFascia(lenX, FASC_H, FASC_T, 0, D / 2 + oh + FASC_T / 2, 'fascia-front')
  perFascia(lenX, FASC_H, FASC_T, 0, -(D / 2 + oh) - FASC_T / 2, 'fascia-bak')
  perFascia(FASC_T, FASC_H, lenZ, W / 2 + oh + FASC_T / 2, 0, 'fascia-hoyre')
  perFascia(FASC_T, FASC_H, lenZ, -(W / 2 + oh) - FASC_T / 2, 0, 'fascia-venstre')

  // Taktekking: 18 mm kryssfiner (+ evt. takpapp) – KUTTET i sømmene (separate
  // plater per takflate, med søm langs møne og grater). Platene strekkes helt ut
  // til fasciabordet (utstikk + FASC_T).
  const yR = ridgeTop + TAK_PLY
  const yE = fascTop + TAK_PLY
  const eaveOh = oh + FASC_T // helt ut til fasciaens ytterkant
  const RE = (sx: number): number[] => [sx * ridgeEnd, yR, 0]
  const EC = (sx: number, sz: number): number[] => [sx * (W / 2 + eaveOh), yE, sz * (D / 2 + eaveOh)]
  // For-trapes
  const front: number[] = [...RE(-1), ...EC(-1, 1), ...EC(1, 1)]
  if (ridgeEnd > 0.01) front.push(...RE(-1), ...EC(1, 1), ...RE(1))
  byggTaktekke(roof, mat, front, tekke, '-front')
  // Bak-trapes
  const bak: number[] = [...RE(1), ...EC(1, -1), ...EC(-1, -1)]
  if (ridgeEnd > 0.01) bak.push(...RE(1), ...EC(-1, -1), ...RE(-1))
  byggTaktekke(roof, mat, bak, tekke, '-bak')
  // Høyre og venstre valmflate
  byggTaktekke(roof, mat, [...RE(1), ...EC(1, 1), ...EC(1, -1)], tekke, '-h')
  byggTaktekke(roof, mat, [...RE(-1), ...EC(-1, -1), ...EC(-1, 1)], tekke, '-v')

  // Gesimsbord langs de fire raftene – dekker sperre-/bjelke-sonen mellom
  // kledningstoppen (topY) og takflaten. Høyden følger takets faktiske underkant
  // ved veggflukten (fascTop + utstikk·fall), så den ikke stikker opp over
  // tekkingen på slake tak.
  const gH = Math.max(0.03, FASC_H + oh * pitch - 0.01)
  const gesimsV = (dx: number, dz: number, x: number, z: number, pid: string) => {
    const m = add(roof, new THREE.BoxGeometry(dx, gH, dz), mat(pid, 0.72), pid, { navn: 'Gesimsbord', profil: `20 × ${Math.round(gH * 1000)} mm`, lengdeCm: Math.round(Math.max(dx, dz) * 100) })
    m.position.set(x, topY + gH / 2, z)
    m.userData.part = 'tak'
  }
  gesimsV(W, GESIMS_T, 0, D / 2 - GESIMS_T / 2, 'gesims-front')
  gesimsV(W, GESIMS_T, 0, -(D / 2 - GESIMS_T / 2), 'gesims-bak')
  gesimsV(GESIMS_T, D, W / 2 - GESIMS_T / 2, 0, 'gesims-hoyre')
  gesimsV(GESIMS_T, D, -(W / 2 - GESIMS_T / 2), 0, 'gesims-venstre')

  // Soffitt KUN under takutstikket (flat ring ved veggtopp, ingen innvendig himling).
  soffittRing(roof, mat, () => topY, W, D, oh)

  roof.rotation.y = rotY
  target.add(roof)
}

/** Enkelt skråtak-sperrelag (pulttak/flatt tak) – sperrer c/c fra front til bak. */
export function byggSkraatak(target: THREE.Group, mat: Mat, w: number, d: number, frontH: number, backH: number, drop = 0.06) {
  const n = antallCC(w)
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + KV_H / 2 + (i * (w - KV_H)) / (n - 1)
    sperreMellom(target, mat, [x, frontH - drop, d / 2], [x, backH - drop, -d / 2], `sperre-flat-${i}`, 'Sperre (skråtak)')
  }
}

/**
 * Pulttak-konstruksjon (enkeltfall). Sperrer i 48×148 c/c ≤ 600 mm som HVILER
 * på toppbjelkene, med opplenger (korte stendere + hevet rem) på høysiden så
 * taket får fall mens det bæres av de eksisterende toppdragerne. `topY` er
 * overkant toppbjelke, `oh` er takutstikk (m).
 *
 * Taket bygges kanonisk (høyt foran +z, fall mot bak −z) i en egen gruppe som
 * roteres etter `retning` – 'bak' | 'front' | 'venstre' | 'hoyre'. For
 * venstre/høyre byttes bredde/dybde slik at taket fyller fotavtrykket.
 */
export function byggPulttak(target: THREE.Group, mat: Mat, w: number, d: number, topY: number, angleDeg: number, oh = 0.1, retning: string = 'bak', tekke: string = 'kryssfiner') {
  const roof = new THREE.Group()
  let ww = w
  let dd = d
  let rotY = 0
  if (retning === 'front') rotY = Math.PI
  else if (retning === 'venstre') { ww = d; dd = w; rotY = Math.PI / 2 }
  else if (retning === 'hoyre') { ww = d; dd = w; rotY = -Math.PI / 2 }

  const ang = (angleDeg * Math.PI) / 180
  const rise = Math.max(0, dd * Math.tan(ang))
  // Sperra graderes etter HELE fallspennet (Byggforsk/EC5 spenntabell): bredere
  // tak → kraftigere sperre (48×148 → 198 → 223). Stiverne avstiver i tillegg.
  const raf = gradSperre(Math.hypot(dd + 2 * oh, rise))
  const RH = raf.h
  const plateH = KV_B // 48 mm hevet rem
  // Underkant sperre: front (z=+dd/2) = topY + rise (høy), bak (z=−dd/2) = topY (lav).
  const undY = (z: number) => topY + rise * ((z + dd / 2) / dd)

  // Opplenger på høy side (front): korte stendere + hevet rem oppå fremre toppbjelke.
  const nPony = antallCC(ww)
  const ponyH = rise - plateH
  for (let i = 0; i < nPony; i++) {
    const x = -ww / 2 + KV_B / 2 + (i * (ww - KV_B)) / (nPony - 1)
    if (ponyH > 0.02) {
      add(roof, new THREE.BoxGeometry(KV_B, ponyH, KV_H), mat(`pony-${i}`, 0.84), `pony-${i}`, { navn: 'Opplenger (stender)', profil: KV_PROFIL, lengdeCm: Math.round(ponyH * 100) })
        .position.set(x, topY + ponyH / 2, dd / 2 - KV_H / 2)
    }
  }
  if (rise > 0.02) {
    add(roof, new THREE.BoxGeometry(ww, plateH, KV_H), mat('opp-rem', 0.8), 'opp-rem', { navn: 'Hevet rem (opplenger)', profil: KV_PROFIL, lengdeCm: Math.round(ww * 100) })
      .position.set(0, topY + rise - plateH / 2, dd / 2 - KV_H / 2)
  }

  // Lekt-posisjoner langs fallet – regnes ut FØRST så sperrene kan hakkes ut.
  const zB = -(dd / 2 + oh)
  const zF = dd / 2 + oh
  const LEKT = LEKT_T
  const halfW = LEKT / 2
  const lektLen = ww + 2 * oh
  const nL = antallCC(dd + 2 * oh)
  const lektZs: number[] = []
  for (let j = 0; j < nL; j++) lektZs.push(zB + LEKT / 2 + (j * (dd + 2 * oh - LEKT)) / (nL - 1))

  // Sperrer c/c ≤ 600 – MELLOM veggene (x innenfor bredden) så de hviler på
  // for-/bakre toppbjelke + hevet rem. Utstikk foran/bak; endene kappes loddrett,
  // og overkant har utsparte hakk der lektene krysser (parallellogram-profil).
  const nR = antallCC(ww)
  for (let i = 0; i < nR; i++) {
    const x = -ww / 2 + KV_B / 2 + (i * (ww - KV_B)) / (nR - 1)
    const g = sperreGeoMedHakk(zB, zF, undY, RH, lektZs, halfW, LEKT_HAKK, x + KV_B / 2)
    add(roof, g, mat(`sperre-${i}`, 0.84), `sperre-${i}`, { navn: 'Sperre (pulttak)', profil: raf.profil, lengdeCm: Math.round(Math.hypot(dd + 2 * oh, rise) * 100) })
  }

  // Kryss-lekt 48×48 – nedfelt i sperrehakkene (LEKT_HAKK dyp), c/c ≤ 600 langs
  // fallet, med sideutstikk. Hver lekt vippes til takvinkelen.
  const cosA = Math.cos(ang)
  const sinA = Math.sin(ang)
  const off = LEKT / 2 - LEKT_HAKK // senter-offset langs flatenormal (nedfelt)
  for (let j = 0; j < nL; j++) {
    const z = lektZs[j]
    const surfaceY = undY(z) + RH // sperre-overkant på denne z
    const m = add(roof, new THREE.BoxGeometry(lektLen, LEKT, LEKT), mat(`lekt-${j}`, 0.88), `lekt-${j}`, { navn: 'Taklekt (kryss)', profil: '48 × 48 mm', lengdeCm: Math.round(lektLen * 100) })
    // Taket stiger mot +z → flatenormal (0, cosA, −sinA); lekt roteres −ang.
    m.position.set(0, surfaceY + cosA * off, z - sinA * off)
    m.rotation.x = -ang
  }

  // Takstoler (SINTEF Byggforsk – triangulert fagverk): hver sperre gjøres til
  // en pulttak-takstol med UNDERGURT (hanebjelke mellom raftveggene), en loddrett
  // midtstav og diagonaler, c/c ≤ 600 som sperrene. Overgurt = sperra; høyre-
  // (høye) endestav = opplengeren (pony). Undergurten binder rafta og hindrer
  // utspenning.
  // Takstol-stavene har samme tverrsnitt som sperrene (48 × min. 148 mm).
  const trussH = Math.max(KV148_H, RH)
  for (let i = 0; i < nR; i++) {
    const xc = -ww / 2 + KV_B / 2 + (i * (ww - KV_B)) / (nR - 1) + KV_B / 2
    // Undergurt (hanebjelke) langs z, overkant i flukt med veggtoppen.
    add(roof, new THREE.BoxGeometry(KV_B, trussH, dd), mat(`ug-${i}`, 0.82), `ug-${i}`, { navn: 'Undergurt (takstol)', profil: `48 × ${Math.round(trussH * 1000)} mm`, lengdeCm: Math.round(dd * 100) })
      .position.set(xc, topY - trussH / 2, 0)
    // Stavene (stiverne) står LODDRETT fra undergurten opp til sperra: bunn
    // vannrett på undergurten, topp kappet parallelt med sperra så den butter
    // flust under. c/c ≤ ~1,2 m langs dybden.
    const rL = Math.hypot(dd, rise) || 1
    const cRaf: [number, number] = [dd / rL, rise / rL] // sperreretning (lav→høy)
    const nProp = Math.max(2, Math.ceil(dd / 1.2))
    for (let k = 1; k < nProp; k++) {
      const z = -dd / 2 + (k * dd) / nProp
      beam2D(roof, mat, xc, KV_B, [z, topY], [z, undY(z)], trussH, [1, 0], cRaf, `web-v-${i}-${k}`, 'Takstolstav (loddrett)')
    }
  }

  // Konstruksjonen (sperrer/lekt/opplenger) er 'konstruksjon' – alltid synlig.
  roof.children.forEach((ch) => (ch.userData.part = 'konstruksjon'))
  // Taktekking oppå lektene – egen 'tak'-flate som «Tak»-toggelen styrer.
  const yS = (z: number) => undY(z) + RH + TAK_PLY
  // Gavlene (x) + fremre høykant (zF): tekkingen stopper mot vindskiens innside.
  // Bakre lave raft (zB): tekkingen lapper litt ut som dryppkant.
  const xLc = -(ww / 2 + oh - FASCIA_T / 2)
  const xRc = ww / 2 + oh - FASCIA_T / 2
  const zBc = zB - FASCIA_T
  const zFc = zF - FASCIA_T / 2
  const BL = [xLc, yS(zBc), zBc]
  const BR = [xRc, yS(zBc), zBc]
  const FL = [xLc, yS(zFc), zFc]
  const FR = [xRc, yS(zFc), zFc]
  byggTaktekke(roof, mat, [...BL, ...FL, ...FR, ...BL, ...FR, ...BR], tekke)
  // Soffitt KUN under takutstikket (ingen innvendig himling).
  soffittRing(roof, mat, undY, ww, dd, oh)

  // Fascia/vindski (dekker sperre-/lekt-ender) – merkes 'tak' (styres av Tak-toggel).
  const fasc = (geo: THREE.BufferGeometry, pid: string, len: number, x = 0, y = 0, z = 0) => {
    const m = add(roof, geo, mat(pid, 0.66), pid, { navn: 'Vindski/fascia', profil: '22 × 170 mm', lengdeCm: Math.round(len * 100) })
    m.position.set(x, y, z)
    m.userData.part = 'tak'
  }
  const coverTopP = (z: number) => undY(z) + RH + TAK_PLY
  // Sømløs ramme: side-vindskiene løper langs gavlene med utstikk BAK (lav side)
  // og butter mot den fremre vindskien FORAN. Bakre fascia legges MELLOM
  // sidevindskiene, mens fremre vindski KAPPER over sidenes ender.
  const rzB = zB - BARGE_OVER // bakre utstikk
  const rzF = zF - FASCIA_T / 2 // butter mot fremre vindskis innside
  const slopeLenP = (rzF - rzB) / cosA
  ;[-1, 1].forEach((sx, i) => {
    fasc(rakeGeo(rzB, rzF, undY, RH, sx * (ww / 2 + oh) + FASCIA_T / 2), `fascia-rake-${i}`, slopeLenP)
    // Kappe (vannbord) oppå sidevindskien – butter mot fremre kappe.
    const czF = zF - TOPPBORD_B / 2
    const capLen = (czF - rzB) / cosA
    const g = new THREE.BoxGeometry(TOPPBORD_B, TOPPBORD_T, capLen)
    const m = add(roof, g, mat(`toppbord-${i}`, 0.6), `toppbord-${i}`, { navn: 'Toppbord (vindski)', profil: '22 × 120 mm', lengdeCm: Math.round(capLen * 100) })
    m.position.set(sx * (ww / 2 + oh), (coverTopP(rzB) + coverTopP(czF)) / 2 + TOPPBORD_LOFT + TOPPBORD_T / 2, (rzB + czF) / 2)
    m.rotation.x = -ang
    m.userData.part = 'tak'
  })
  // Bakre (lav) raft-fascia MELLOM sidevindskiene (flukt, dryppkant).
  const backLen = ww + 2 * oh - FASCIA_T
  fasc(new THREE.BoxGeometry(backLen, FASCIA_H, FASCIA_T), 'fascia-bak', backLen, 0, undY(zB) + RH - FASCIA_H / 2, zB - FASCIA_T / 2)
  // Fremre (høy) vindski KAPPER over sidevindskienes ytterside, med kappe oppå.
  const frontTop = coverTopP(zF) + TOPPBORD_LOFT
  const frontLen = ww + 2 * oh + FASCIA_T
  fasc(new THREE.BoxGeometry(frontLen, FASCIA_H, FASCIA_T), 'fascia-front', frontLen, 0, frontTop - FASCIA_H / 2, zF)
  {
    const capLen = ww + 2 * oh + TOPPBORD_B
    const g = new THREE.BoxGeometry(capLen, TOPPBORD_T, TOPPBORD_B)
    const m = add(roof, g, mat('toppbord-front', 0.6), 'toppbord-front', { navn: 'Toppbord (vindski)', profil: '22 × 120 mm', lengdeCm: Math.round(capLen * 100) })
    m.position.set(0, frontTop + TOPPBORD_T / 2, zF)
    m.rotation.x = -ang // samme fall som taket (ikke flat)
    m.userData.part = 'tak'
  }

  // Gesimsbord: dekker sperre-sonen (undY → undY+RH) over kledningen langs alle
  // fire vegger. Rakene (sidene) følger fallet; for-/bakvegg er vannrette bord.
  const gRH = Math.max(0.05, RH - 0.005) // nesten hele sperrehøyden (dekker sperre/lekt); minimal klaring
  const gesims = (geo: THREE.BufferGeometry, pid: string, len: number) => {
    const m = add(roof, geo, mat(pid, 0.72), pid, { navn: 'Gesimsbord', profil: `20 × ${Math.round(gRH * 1000)} mm`, lengdeCm: Math.round(len * 100) })
    m.userData.part = 'tak'
  }
  ;[-1, 1].forEach((sx, i) => gesims(friezeGeo(-dd / 2, dd / 2, undY, gRH, sx * (ww / 2 - GESIMS_T / 2)), `gesims-rake-${i}`, (dd) / Math.cos(ang)))
  ;[dd / 2, -dd / 2].forEach((zw, i) => {
    const m = add(roof, new THREE.BoxGeometry(ww, gRH, GESIMS_T), mat(`gesims-eave-${i}`, 0.72), `gesims-eave-${i}`, { navn: 'Gesimsbord', profil: `20 × ${Math.round(gRH * 1000)} mm`, lengdeCm: Math.round(ww * 100) })
    m.position.set(0, undY(zw) + gRH / 2, zw - Math.sign(zw) * GESIMS_T / 2)
    m.userData.part = 'tak'
  })

  roof.rotation.y = rotY
  target.add(roof)
}

export interface RidgeGrade {
  /** Visningsprofil (kan være sammensatt, f.eks. «2 × 48 × 198 mm»). */
  profil: string
  /** Enkeltbord-profil til kapplista. */
  boardProfil: string
  /** Bjelkehøyde (m). */
  h: number
  /** Prisnøkkel (per bord). */
  pris: string
  /** Antall bord side-om-side. */
  count: number
}

export interface BjelkeGrade {
  h: number
  profil: string
  pris: string
}

/** C24-dimensjoner (48 × h) i stigende styrke. */
const C24_DIM: BjelkeGrade[] = [
  { h: 0.098, profil: '48 × 98 mm', pris: 'bjelke-48x98' },
  { h: 0.148, profil: '48 × 148 mm', pris: 'bjelke-48x148' },
  { h: 0.198, profil: '48 × 198 mm', pris: 'bjelke-48x198' },
  { h: 0.223, profil: '48 × 223 mm', pris: 'bjelke-48x223' },
]

/**
 * SPENNTABELLER (maks fritt spenn i m) for C24-virke, i tråd med SINTEF
 * Byggforskserien: 522.351 (trebjelkelag/gulv) og 525-serien (tak/sperrer).
 * Verdiene er konservative standard-spenn (Eurokode 5 / NS-EN 1995-1-1) og bør
 * verifiseres mot gjeldende Byggforsk-blad før endelig plan.
 *
 * GULVBJELKE – nyttelast ~2 kN/m² (bod/terrasse). [c/c 600, c/c 450].
 */
const GULV_SPENN: Record<string, [number, number]> = {
  '48 × 98 mm': [1.4, 1.6],
  '48 × 148 mm': [2.15, 2.45],
  '48 × 198 mm': [2.85, 3.2],
  '48 × 223 mm': [3.2, 3.6],
}
/** SPERRE/TAKBJELKE – snølast sk ≈ 3,0 kN/m², c/c 600. Maks spenn (m). */
const SPERRE_SPENN: Record<string, number> = {
  '48 × 98 mm': 1.8,
  '48 × 148 mm': 2.7,
  '48 × 198 mm': 3.5,
  '48 × 223 mm': 4.0,
}

/**
 * Velg minste C24-gulvbjelke som bærer det frie spennet `spanM` (m) ved gitt
 * senteravstand `cc` (0.6 eller 0.45). Byggforsk 522.351 (se `GULV_SPENN`).
 */
export function gradBjelke(spanM: number, cc = 0.6): BjelkeGrade {
  const col = cc <= 0.5 ? 1 : 0
  return C24_DIM.find((p) => GULV_SPENN[p.profil][col] >= spanM) ?? C24_DIM[C24_DIM.length - 1]
}

/** Maks gulvbjelke-spenn (m) for største C24-profil ved gitt c/c. */
export function maksGulvSpenn(cc = 0.6): number {
  const col = cc <= 0.5 ? 1 : 0
  return GULV_SPENN[C24_DIM[C24_DIM.length - 1].profil][col]
}

/** Velg minste C24-sperre som bærer takfall-spennet `spanM` (m), c/c 600. */
export function gradSperre(spanM: number): BjelkeGrade {
  return C24_DIM.find((p) => SPERRE_SPENN[p.profil] >= spanM) ?? C24_DIM[C24_DIM.length - 1]
}

/**
 * Dimensjonerer den bærende mønebjelken (C24) etter takstørrelsen – forenklet
 * bøyekontroll (NS 3478 / EC5) med snølast. Velger minste tverrsnitt som
 * holder og dobler/tredobler ved store spenn. `w` er spennet mellom gavlene,
 * `d` gir lastbredden (mønet bærer halve takflaten).
 */
export function gradMonebjelke(w: number, d: number): RidgeGrade {
  const SNO = 3.0 // kN/m² karakteristisk snølast (moderat)
  const EGEN = 0.5 // kN/m² egenlast tak
  const q = 1.35 * EGEN + 1.5 * SNO // ULS flatelast
  const trib = d / 2 // lastbredde mønet bærer (halve takflaten)
  const M = ((q * trib * w * w) / 8) * 1.1 // kN·m (10 % margin)
  const fmd = 14800 // kN/m² (fm,d ≈ 14,8 N/mm² for C24, snølast/kmod)
  const Wx = (b: number, h: number) => (b * h * h) / 6 // m³
  const opts: RidgeGrade[] = [
    { profil: '48 × 148 mm', boardProfil: '48 × 148 mm', h: 0.148, pris: 'bjelke-48x148', count: 1 },
    { profil: '48 × 198 mm', boardProfil: '48 × 198 mm', h: 0.198, pris: 'bjelke-48x198', count: 1 },
    { profil: '2 × 48 × 198 mm', boardProfil: '48 × 198 mm', h: 0.198, pris: 'bjelke-48x198', count: 2 },
    { profil: '3 × 48 × 198 mm', boardProfil: '48 × 198 mm', h: 0.198, pris: 'bjelke-48x198', count: 3 },
  ]
  return opts.find((o) => Wx(o.count * KV_B, o.h) * fmd >= M) ?? opts[opts.length - 1]
}

/**
 * Saltak – symmetrisk sadeltak med møne (ridge) langs bredden (x). To
 * takflater faller mot front (+z) og bak (−z). Sperrene (48×148) hviler på
 * de fremre/bakre toppbjelkene ved raftet og på en bærende MØNEBJELKE i toppen.
 *
 * Mønebjelken er «toppbjelken», dimensjonert etter takstørrelsen (se
 * `gradMonebjelke`) – dobles ved store spenn. Den bæres av kingposts
 * (opplenger) på gavlveggene. Kryss-lekt 48×48 med 10 cm gavl-/sideutstikk,
 * vippet til takvinkelen på hver takflate.
 */
export function byggSaltak(target: THREE.Group, mat: Mat, w: number, d: number, topY: number, angleDeg: number, oh = 0.1, retning: string = 'bredde', tekke: string = 'kryssfiner') {
  const roof = new THREE.Group()
  // Kanonisk: møne langs bredden (x), takflater faller mot front/bak. For
  // 'dybde' byttes bredde/dybde og taket roteres 90° (møne langs dybden).
  let ww = w
  let dd = d
  let rotY = 0
  if (retning === 'dybde') { ww = d; dd = w; rotY = Math.PI / 2 }

  const ang = (angleDeg * Math.PI) / 180
  const halfD = dd / 2
  const rise = Math.max(0, halfD * Math.tan(ang))
  const raf = gradSperre(Math.hypot(halfD + oh, halfD > 1e-6 ? (rise / halfD) * (halfD + oh) : 0)) // sperre gradert etter fall-spenn
  const RH = raf.h
  const slope = halfD > 1e-6 ? rise / halfD : 0
  // Underkant sperre: møne (z=0) = topY + rise (høyest), rafter (z=±dd/2) = topY.
  const undY = (z: number) => topY + rise - slope * Math.abs(z)

  // Møne = lett MØNEBORD (takstolene under bærer selv – ingen bærende
  // mønebjelke). Sperreapexene festes til mønebordet i hver takstol.
  const grade = gradMonebjelke(CC, dd)
  const ridgeH = grade.h
  const ridgeW = grade.count * KV_B
  const ridgeTopY = topY + rise
  add(roof, new THREE.BoxGeometry(ww, ridgeH, ridgeW), mat('mone', 0.76), 'mone', { navn: 'Mønebord', profil: grade.profil, lengdeCm: Math.round(ww * 100) })
    .position.set(0, ridgeTopY - ridgeH / 2, 0)

  // Lekt-posisjoner per takflate – regnes ut FØRST så sperrene kan hakkes ut.
  const LEKT = LEKT_T
  const halfW = LEKT / 2
  const lektLen = ww + 2 * oh
  const nL = antallCC(halfD + oh)
  const sideZs = (sd: number) => {
    const arr: number[] = []
    for (let j = 0; j < nL; j++) arr.push(sd * (LEKT / 2 + (j * (halfD + oh - LEKT)) / (nL - 1)))
    return arr
  }

  // Sperrer c/c ≤ 600 – to per x-posisjon (fram/bak fra mønet), endene kappes
  // loddrett, overkant har lekt-hakk, og de får fugleneb-sits på toppbjelken.
  const seatLen = Math.min(0.098, halfD * 0.6)
  const nR = antallCC(ww)
  for (let i = 0; i < nR; i++) {
    const x = -ww / 2 + KV_B / 2 + (i * (ww - KV_B)) / (nR - 1)
    ;[1, -1].forEach((sd) => {
      const zE = sd * (halfD + oh)
      const g = sperreGeoMedHakk(0, zE, undY, RH, sideZs(sd), halfW, LEKT_HAKK, x + KV_B / 2, sd * halfD, seatLen)
      add(roof, g, mat(`sperre-${sd}-${i}`, 0.84), `sperre-${sd}-${i}`, { navn: 'Sperre (saltak)', profil: raf.profil, lengdeCm: Math.round(Math.hypot(halfD + oh, slope * (halfD + oh)) * 100) })
    })
  }

  // Takstoler (SINTEF Byggforsk – triangulert fagverk): hvert sperrepar gjøres
  // til en king-post-takstol med UNDERGURT (mellom raftveggene), kingpost opp
  // til mønet og to Fink-diagonaler, c/c ≤ 600 som sperrene. Undergurten binder
  // rafta og tar strekket, så det ikke trengs en bærende mønebjelke.
  if (rise > 0.05) {
    // Takstol-stavene har samme tverrsnitt som sperrene (48 × min. 148 mm).
    const trussH = Math.max(KV148_H, RH)
    for (let i = 0; i < nR; i++) {
      const xc = -ww / 2 + KV_B / 2 + (i * (ww - KV_B)) / (nR - 1) + KV_B / 2
      add(roof, new THREE.BoxGeometry(KV_B, trussH, dd), mat(`ug-${i}`, 0.82), `ug-${i}`, { navn: 'Undergurt (takstol)', profil: `48 × ${Math.round(trussH * 1000)} mm`, lengdeCm: Math.round(dd * 100) })
        .position.set(xc, topY - trussH / 2, 0)
      strut(roof, mat, [xc, topY, 0], [xc, ridgeTopY - ridgeH, 0], `king-${i}`, 'Kingpost (takstol)', KV_B, trussH)
      // Fink-diagonaler: fra undergurt-senter (kingpost-foten) opp til sperras
      // midt, topp kappet parallelt med sperra (flust under), bunn loddrett mot
      // kingposten. rafDir = sperreretningen i [z, y] for hver takflate.
      const rL = Math.hypot(halfD, rise) || 1
      ;[1, -1].forEach((sd) => {
        const zq = (sd * halfD) / 2
        const rafDir: [number, number] = [(sd * halfD) / rL, -rise / rL]
        beam2D(roof, mat, xc, KV_B, [0, topY], [zq, undY(zq)], trussH, [0, 1], rafDir, `diag-${sd}-${i}`, 'Takstoldiagonal')
      })
    }
  }

  // Kryss-lekt 48×48 – nedfelt i sperrehakkene, c/c ≤ 600 langs fallet, med
  // gavlutstikk. Hver takflate vippes til takvinkelen.
  const cosA = Math.cos(ang)
  const sinA = Math.sin(ang)
  const off = LEKT / 2 - LEKT_HAKK
  ;[1, -1].forEach((sd) => {
    sideZs(sd).forEach((z, j) => {
      const surfaceY = undY(z) + RH
      const m = add(roof, new THREE.BoxGeometry(lektLen, LEKT, LEKT), mat(`lekt-${sd}-${j}`, 0.88), `lekt-${sd}-${j}`, { navn: 'Taklekt (kryss)', profil: '48 × 48 mm', lengdeCm: Math.round(lektLen * 100) })
      // Hver takflate vippes til takvinkelen: flatenormal (0, cosA, sd·sinA).
      m.position.set(0, surfaceY + cosA * off, z + sd * sinA * off)
      m.rotation.x = sd * ang
    })
  })

  // Konstruksjonen er 'konstruksjon' – alltid synlig. Taktekking = egen 'tak'-flate.
  roof.children.forEach((ch) => (ch.userData.part = 'konstruksjon'))
  const yS = (z: number) => undY(z) + RH + TAK_PLY
  // Gavlene (x): tekkingen stopper mot vindskiens innside (ikke gjennom vindskien).
  // Raftet (z): lapper litt ut over fasciaen.
  const xL = -(ww / 2 + oh - FASCIA_T / 2)
  const xR = ww / 2 + oh - FASCIA_T / 2
  const verts: number[] = []
  ;[1, -1].forEach((sd) => {
    const zE = sd * (halfD + oh + FASCIA_T)
    const RLp = [xL, yS(0), 0]
    const RRp = [xR, yS(0), 0]
    const ELp = [xL, yS(zE), zE]
    const ERp = [xR, yS(zE), zE]
    verts.push(...RLp, ...ELp, ...ERp, ...RLp, ...ERp, ...RRp)
  })
  byggTaktekke(roof, mat, verts, tekke)
  // Soffitt KUN under takutstikket (ingen innvendig himling).
  soffittRing(roof, mat, undY, ww, dd, oh)

  // Fascia langs raftet (front/bak) + vindski langs gavlene – merkes 'tak'.
  const fasc = (geo: THREE.BufferGeometry, pid: string, len: number, x = 0, y = 0, z = 0) => {
    const m = add(roof, geo, mat(pid, 0.66), pid, { navn: 'Vindski/fascia', profil: '22 × 170 mm', lengdeCm: Math.round(len * 100) })
    m.position.set(x, y, z)
    m.userData.part = 'tak'
  }
  const eY = undY(halfD + oh) + RH // raftehøyde (front/bak)
  fasc(new THREE.BoxGeometry(ww + 2 * oh, FASCIA_H, FASCIA_T), 'fascia-front', ww + 2 * oh, 0, eY - FASCIA_H / 2, halfD + oh + FASCIA_T / 2)
  fasc(new THREE.BoxGeometry(ww + 2 * oh, FASCIA_H, FASCIA_T), 'fascia-bak', ww + 2 * oh, 0, eY - FASCIA_H / 2, -(halfD + oh) - FASCIA_T / 2)
  const coverTopS = (z: number) => undY(z) + RH + TAK_PLY
  const slopeLenS = (halfD + oh + BARGE_OVER) / cosA
  ;[-1, 1].forEach((sx, ix) => {
    ;[1, -1].forEach((sd) => {
      // Vindski langs gavlen – sentrert på gavlkanten, m/utstikk forbi raftet.
      const zE = sd * (halfD + oh + BARGE_OVER)
      fasc(rakeGeo(0, zE, undY, RH, sx * (ww / 2 + oh) + FASCIA_T / 2), `fascia-rake-${ix}-${sd}`, slopeLenS)
      // Toppbord (vannbord) sentrert over vindskien, hevet over taket (litt utstikk).
      const g = new THREE.BoxGeometry(TOPPBORD_B, TOPPBORD_T, slopeLenS)
      const m = add(roof, g, mat(`toppbord-${ix}-${sd}`, 0.6), `toppbord-${ix}-${sd}`, { navn: 'Toppbord (vindski)', profil: '22 × 120 mm', lengdeCm: Math.round(slopeLenS * 100) })
      m.position.set(sx * (ww / 2 + oh), (coverTopS(0) + coverTopS(zE)) / 2 + TOPPBORD_LOFT + TOPPBORD_T / 2, zE / 2)
      m.rotation.x = sd * ang
      m.userData.part = 'tak'
    })
  })

  // Gesimsbord: gavlene (x=±ww/2) er trekantede (to fall som møtes i mønet),
  // raftene (z=±dd/2) er vannrette. Dekker sperre-sonen over kledningen.
  const gRHs = Math.max(0.05, RH - 0.005)
  const gesimsS = (geo: THREE.BufferGeometry, pid: string, len: number) => {
    const m = add(roof, geo, mat(pid, 0.72), pid, { navn: 'Gesimsbord', profil: `20 × ${Math.round(gRHs * 1000)} mm`, lengdeCm: Math.round(len * 100) })
    m.userData.part = 'tak'
  }
  ;[-1, 1].forEach((sx, i) => {
    gesimsS(friezeGeo(-dd / 2, 0, undY, gRHs, sx * (ww / 2 - GESIMS_T / 2)), `gesims-gavl-${i}a`, halfD / Math.cos(ang))
    gesimsS(friezeGeo(0, dd / 2, undY, gRHs, sx * (ww / 2 - GESIMS_T / 2)), `gesims-gavl-${i}b`, halfD / Math.cos(ang))
  })
  ;[dd / 2, -dd / 2].forEach((zw, i) => {
    const m = add(roof, new THREE.BoxGeometry(ww, gRHs, GESIMS_T), mat(`gesims-raft-${i}`, 0.72), `gesims-raft-${i}`, { navn: 'Gesimsbord', profil: `20 × ${Math.round(gRHs * 1000)} mm`, lengdeCm: Math.round(ww * 100) })
    m.position.set(0, undY(zw) + gRHs / 2, zw - Math.sign(zw) * GESIMS_T / 2)
    m.userData.part = 'tak'
  })

  roof.rotation.y = rotY
  target.add(roof)
}

/**
 * Setter `userData.explode` på hvert direkte barn (mesh/gruppe) som ikke
 * allerede har det, slik at split-/eksplosjonsvisningen sprer delene. Retningen
 * beregnes fra delens senter ut fra modellsenteret, med rolle-basert bias:
 * tak løftes opp, gulv/bjelkelag senkes, dunker/postkasser skyves fram.
 */
export function settSplitt(root: THREE.Group, amount = 0.4) {
  const box = new THREE.Box3().setFromObject(root)
  const senter = new THREE.Vector3()
  box.getCenter(senter)
  const h = Math.max(0.01, box.max.y - box.min.y)
  root.children.forEach((child) => {
    if (child.userData.explode) return
    const cb = new THREE.Box3().setFromObject(child)
    if (cb.isEmpty()) return
    const cc = new THREE.Vector3()
    cb.getCenter(cc)
    let part = child.userData.part as string | undefined
    if (!part) child.traverse((o) => { if (!part && o.userData.part) part = o.userData.part as string })

    // Vifter delene ut vannrett fra senter, og trekker konstruksjonen fra
    // hverandre loddrett etter høyde-laget (bunn ned, topp opp) – full
    // strukturell «eksplosjon».
    const relY = (cc.y - box.min.y) / h
    const dirH = new THREE.Vector3(cc.x - senter.x, 0, cc.z - senter.z)
    if (dirH.lengthSq() < 1e-6) dirH.set(0.001, 0, 0.001)
    dirH.normalize()
    const out = dirH.clone().multiplyScalar(amount * 0.75)
    const vy = (relY - 0.5) * amount * 2.8 // konstruksjonen trekkes fra hverandre etter høyde

    let e: THREE.Vector3
    if (part === 'fundament') e = new THREE.Vector3(out.x * 0.2, -amount * 2.4, out.z * 0.2) // fundament nederst
    else if (part === 'gulv') e = new THREE.Vector3(0, 0, amount * 2.4) // dekke skyves rett fram (kun vannrett)
    else if (part === 'kledning') e = dirH.clone().multiplyScalar(amount * 1.6) // vegg/kledning ut til siden (vannrett)
    else if (part === 'tak') e = new THREE.Vector3(out.x * 0.3, amount * 2.6, out.z * 0.3) // taket høyest
    else if (part === 'dunk' || part === 'postkasse') e = new THREE.Vector3(out.x, vy, out.z + 0.35)
    else if (part === 'bins') e = new THREE.Vector3(0, 0, amount * 3.0) // dunkene trilles samlet ut fronten
    else e = new THREE.Vector3(out.x, vy, out.z)

    child.userData.explode = e
  })
}

/** Takplate: 18 mm kryssfiner. */
export const TAK_PLY = 0.018

/**
 * Bygger taket som en solid 18 mm kryssfinerplate ut fra topp-flatens
 * trekanter (`topVerts` = flat liste med [x,y,z]-tripler). Legger til en
 * underside 18 mm under toppen slik at platen får tykkelse og ingen
 * konstruksjon skinner gjennom. Kantene dekkes av vindski/fascia.
 */
export function byggTakplate(target: THREE.Group, mat: THREE.MeshStandardMaterial, topVerts: number[], pid = 'tak', navn = 'Takplate (18 mm kryssfiner)', tykk = TAK_PLY, part = 'tak', profil = '18 mm kryssfiner') {
  const all = topVerts.slice()
  for (let i = 0; i < topVerts.length; i += 9) {
    // Underside – samme trekant speilet i vinding, senket `tykk`.
    const a = [topVerts[i], topVerts[i + 1] - tykk, topVerts[i + 2]]
    const b = [topVerts[i + 3], topVerts[i + 4] - tykk, topVerts[i + 5]]
    const c = [topVerts[i + 6], topVerts[i + 7] - tykk, topVerts[i + 8]]
    all.push(...a, ...c, ...b)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(all, 3))
  g.computeVertexNormals()
  mat.side = THREE.DoubleSide
  const m = new THREE.Mesh(g, mat)
  m.castShadow = true
  m.receiveShadow = true
  m.userData.part = part
  m.userData.pid = pid
  m.userData.info = { navn, profil, lengdeCm: 0 }
  target.add(m)
  return m
}

/** Takpapp-tykkelse (visuelt lag oppå kryssfineren). */
export const TAKPAPP_T = 0.006

/**
 * Taktekking oppå lektene: alltid 18 mm kryssfiner, med valgfri takpapp oppå.
 * `topVerts` er takflatens topp-trekanter. Begge lag merkes 'tak' slik at de
 * skjules samlet av «Tak»-toggelen, mens konstruksjonen blir stående.
 */
export function byggTaktekke(target: THREE.Group, _mat: Mat, topVerts: number[], tekke = 'kryssfiner', key = '') {
  // Egen kryssfiner-look: lys, gyllen platefarge (ikke samme som konstruksjonsvirket).
  const plyMat = new THREE.MeshStandardMaterial({ color: 0xd6b97f, roughness: 0.82, metalness: 0.02 })
  byggTakplate(target, plyMat, topVerts, `takflate${key}`, 'Taktekking (18 mm kryssfiner)')
  if (tekke === 'takpapp') {
    const pappVerts = topVerts.map((v, i) => (i % 3 === 1 ? v + TAKPAPP_T : v)) // hev y en papptykkelse
    const pappMat = new THREE.MeshStandardMaterial({ color: 0x33333a, roughness: 0.96, metalness: 0.03 })
    byggTakplate(target, pappMat, pappVerts, `takpapp${key}`, 'Takpapp', TAKPAPP_T, 'tak', 'takpapp')
  }
}

/** Sperre (bjelke) mellom to punkter i rommet, med rektangulært tverrsnitt. */
export function sperreMellom(target: THREE.Group, mat: Mat, a: [number, number, number], b: [number, number, number], pid: string, navn: string, secH = KV_H, profil = KV_PROFIL): THREE.Mesh {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const len = dir.length()
  const m = add(target, new THREE.BoxGeometry(len, secH, KV_B), mat(pid, 0.84), pid, { navn, profil, lengdeCm: Math.round(len * 100) })
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  if (len > 1e-6) {
    // Styr rullen: lengden langs dir, høyden (secH) i det loddrette planet som
    // inneholder bjelken, tykkelsen (KV_B) vannrett. Ellers får skrå bjelker
    // (gratsperrer o.l.) en tilfeldig vridning fra setFromUnitVectors.
    const xAxis = dir.clone().normalize()
    const up = Math.abs(xAxis.y) > 0.99 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)
    const zAxis = new THREE.Vector3().crossVectors(xAxis, up).normalize()
    const yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize()
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis))
  }
  return m
}
