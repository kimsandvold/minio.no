/**
 * Eksakt kappe-/vinkelgeometri for tre (sperrer, fuglemunn, grat/valm, trapp).
 *
 * AVRUNDINGSREGLER (gjelder alle templater):
 * - Regn ALLTID i mm som flyttall. Avrund kun ved presentasjon.
 * - Kappelengder i kapplista: rund OPP til nærmeste 5 mm (`rundOppKapp`).
 *   Begrunnelse: en for kort del kan ikke reddes, mens 0–5 mm ekstra pusses/
 *   kappes til ved tilpasning; sagsnitt (≈ 3 mm) og vinkelkutt «spiser» også
 *   litt. 5 mm er samtidig hva man realistisk merker med tommestokk/blyant.
 * - Vinkler: vis med 1 desimal (`fmtGrader`, «18,4°»). Gjæringssager kan
 *   stilles på 0,5°, men 1 desimal gjør tegninger og kontrollmål entydige.
 * - Mål på tegning: hele mm (`fmtMm`).
 *
 * Koordinater i 2D-snitt: x horisontalt (mm, fra ytterliv nedre vegg og
 * innover mot møne/øvre vegg), y vertikalt (mm, 0 = overkant nedre toppsvill).
 */

export const KAPP_AVRUNDING_MM = 5
const RAD = Math.PI / 180

/** Rund opp til nærmeste `trinn` mm (kappliste). */
export function rundOppKapp(mm: number, trinn = KAPP_AVRUNDING_MM): number {
  return Math.ceil(mm / trinn - 1e-9) * trinn
}
/** Vinkel avrundet til 0,1°. */
export function rundVinkel(grader: number): number {
  return Math.round(grader * 10) / 10
}
/** «18,4°» */
export function fmtGrader(grader: number): string {
  return `${rundVinkel(grader).toFixed(1).replace('.', ',')}°`
}
/** «1234 mm» (hele mm). */
export function fmtMm(mm: number): string {
  return `${Math.round(mm)} mm`
}

// ── Kutt-innstillinger ─────────────────────────────────────────────

export interface Kuttinnstilling {
  /** Gjæringsvinkel på kapp-/gjæringssag (grader fra 90°-kutt). */
  gjaeringGrader: number
  /** Skråsnitt (bevel) – bladets helning fra loddrett (grader). */
  skraasnittGrader: number
  /** Vinkel mellom kuttlinja og vinkelrett-strek på OVERKANTEN (til oppmerking). */
  overkantGrader: number
  /** Vinkel mellom kuttlinja og vinkelrett-strek på SIDEFLATEN (til oppmerking). */
  sideGrader: number
  beskrivelse: string
}

/**
 * Loddkutt (plumb cut) på sperre med takvinkel α: loddrett kutt når sperra
 * ligger på plass. På sideflaten står streken α fra vinkelrett (90° − α mot
 * kanten). Kappsag med sperra liggende på sideflaten: gjæring = α, skråsnitt 0.
 */
export function loddkutt(vinkelGrader: number): Kuttinnstilling {
  const a = vinkelGrader
  return {
    gjaeringGrader: a,
    skraasnittGrader: 0,
    overkantGrader: 0,
    sideGrader: a,
    beskrivelse: `Loddkutt: ${fmtGrader(a)} fra vinkelrett (${fmtGrader(90 - a)} mot sperrekanten)`,
  }
}

/** Vannrett kutt (setet i fuglemunn, fotkutt): 90° − α fra vinkelrett på sideflaten. */
export function vannrettKutt(vinkelGrader: number): Kuttinnstilling {
  const a = 90 - vinkelGrader
  return { gjaeringGrader: a, skraasnittGrader: 0, overkantGrader: 0, sideGrader: a, beskrivelse: `Vannrett kutt: ${fmtGrader(a)} fra vinkelrett (${fmtGrader(vinkelGrader)} mot sperrekanten)` }
}

/**
 * Sammensatt kinnkutt (cheek/side cut): sperre med helning α som butter mot et
 * LODDRETT plan som i plan danner vinkelen φ med sperras retning (φ = 90° er
 * vanlig loddkutt; skiftesperre mot 45°-grat: φ = 45°).
 *
 * Utledning (vektorer): sperreakse a = (cos α, 0, sin α), tverrretning w =
 * (0, 1, 0), kuttplanets normal n = (sin φ, −cos φ, 0).
 * - Sideflaten: kuttlinja blir loddrett → α fra vinkelrett (loddkutt).
 * - Overkanten: linja v = cos φ·a + sin φ·cos α·w →
 *   vinkel fra vinkelrett = atan(1/(tan φ·cos α)) … for φ = 45°: atan(1/cos α).
 * - Kappsag, sperra liggende på sideflaten mot anlegget: gjæring = α,
 *   skråsnitt = 90° − φ (45° for vanlige skiftesperrer).
 */
export function kinnkutt(vinkelGrader: number, planvinkelGrader = 45): Kuttinnstilling {
  const a = vinkelGrader * RAD
  const phi = planvinkelGrader * RAD
  const overkant = Math.atan(1 / (Math.tan(phi) * Math.cos(a))) / RAD
  return {
    gjaeringGrader: vinkelGrader,
    skraasnittGrader: 90 - planvinkelGrader,
    overkantGrader: overkant,
    sideGrader: vinkelGrader,
    beskrivelse: `Kinnkutt: loddkutt ${fmtGrader(vinkelGrader)} + sidekutt ${fmtGrader(overkant)} på overkant (kappsag: gjæring ${fmtGrader(vinkelGrader)}, skråsnitt ${fmtGrader(90 - planvinkelGrader)})`,
  }
}

// ── Sperre med fuglemunn ───────────────────────────────────────────

export interface Fuglemunn {
  /** Vannrett setelengde (anlegg på svill), mm. */
  seteMm: number
  /** Loddrett hælhøyde (loddkuttet i fuglemunnen), mm. */
  haelMm: number
  /** Utsparingsdybde målt vinkelrett på sperra, mm. */
  dybdeMm: number
  /** Maks tillatt dybde = h/3 (Byggforsk/god praksis; EC5 6.5 for utsparing ved opplegg). */
  maksDybdeMm: number
  ok: boolean
  /** Andel av svillbredden setet dekker (1 = fullt anlegg). */
  anleggsandel: number
}

export type SperreTopp =
  | { type: 'mone'; /** Horisontalt fra ytterliv nedre vegg til senter møne, mm. */ lopMm: number; moneTykkelseMm?: number }
  | { type: 'vegg'; /** Horisontalt fra ytterliv nedre vegg til ytterliv øvre vegg, mm. */ lopMm: number; svillBreddeMm?: number; utstikkMm: number; toppkutt?: 'lodd' | 'vinkelrett' }

export interface SperreGeometriInput {
  vinkelGrader: number
  sperreHoydeMm: number
  /** Bredde på nedre toppsvill (anlegg), mm. Standard 98. */
  svillBreddeMm?: number
  /** Horisontalt utstikk fra ytterliv nedre vegg, mm. */
  utstikkMm: number
  fotkutt?: 'lodd' | 'vinkelrett'
  topp: SperreTopp
}

export interface SperreGeometri {
  vinkelGrader: number
  /** Eksakt lengde på emnet (lengste punkt til lengste punkt langs sperra), mm. */
  lengdeMm: number
  /** Kappelengde til kapplista (rundet opp til 5 mm). */
  kappLengdeMm: number
  fuglemunn: Fuglemunn
  /** Øvre fuglemunn (pultsperre over to vegger). */
  ovreFuglemunn?: Fuglemunn
  /** Høyde over svill (HAP): fra svilloverkant til sperreoverkant i ytterliv vegg, mm. */
  hapMm: number
  /** Pulttak: overkant øvre toppsvill over overkant nedre toppsvill, mm (sett veggens høyde eksakt etter dette). */
  ovreSvillHoydeMm?: number
  /** Saltak: høyde fra nedre svilloverkant til sperreoverkant i mønelinja, mm. */
  moneOverkantMm?: number
  loddkutt: Kuttinnstilling
  vannrettKutt: Kuttinnstilling
  /** Sperrens omriss i snittet [x, y] mm (til 2D-detaljtegning). */
  omriss: Array<[number, number]>
  /** Anbefalt opplegglengde til trykk ⊥-kontroll (= setelengden), mm. */
  opplegglengdeMm: number
  merknader: string[]
}

function fuglemunnFor(vinkelGrader: number, h: number, svillB: number): Fuglemunn {
  const a = vinkelGrader * RAD
  const maks = h / 3
  const sin = Math.sin(a)
  // Setet så langt som svilla, begrenset av h/3-dybden.
  const sete = sin < 1e-6 ? svillB : Math.min(svillB, maks / sin)
  const dybde = sete * sin
  return { seteMm: sete, haelMm: sete * Math.tan(a), dybdeMm: dybde, maksDybdeMm: maks, ok: dybde <= maks + 1e-6, anleggsandel: sete / svillB }
}

/**
 * Komplett geometri for en sperre med fuglemunn på nedre vegg, og enten
 * loddkutt mot mønebord/mønebjelke (saltak) eller fuglemunn på øvre vegg +
 * utstikk (pulttak). Alle mål er eksakte flyttall i mm.
 */
export function sperreGeometri(inn: SperreGeometriInput): SperreGeometri {
  const aG = inn.vinkelGrader
  const a = aG * RAD
  const tan = Math.tan(a)
  const cos = Math.cos(a)
  const sin = Math.sin(a)
  const h = inn.sperreHoydeMm
  const merknader: string[] = []
  const fm = fuglemunnFor(aG, h, inn.svillBreddeMm ?? 98)
  const s = fm.seteMm
  const bunn = (x: number) => (x - s) * tan
  const topp = (x: number) => bunn(x) + h / cos
  const pts: Array<[number, number]> = []
  const o = inn.utstikkMm
  // Fot (utstikk).
  if ((inn.fotkutt ?? 'lodd') === 'lodd') {
    pts.push([-o, topp(-o)], [-o, bunn(-o)])
  } else {
    const T: [number, number] = [-o, topp(-o)]
    pts.push(T, [T[0] + h * sin, T[1] - h * cos])
  }
  // Fuglemunn nedre vegg: hæl i x = 0, sete til x = s.
  pts.push([0, bunn(0)], [0, 0], [s, 0])
  let ovre: Fuglemunn | undefined
  let ovreSvill: number | undefined
  let moneOverkant: number | undefined
  if (inn.topp.type === 'mone') {
    const xr = inn.topp.lopMm - (inn.topp.moneTykkelseMm ?? 0) / 2
    pts.push([xr, bunn(xr)], [xr, topp(xr)])
    moneOverkant = topp(inn.topp.lopMm)
  } else {
    const bu = inn.topp.svillBreddeMm ?? inn.svillBreddeMm ?? 98
    ovre = fuglemunnFor(aG, h, bu)
    const xu = inn.topp.lopMm
    const xInner = xu - bu // innerliv øvre svill: loddkutt her
    const xSete = xInner + ovre.seteMm // setet ender der bunnlinja krysser svilltoppen
    ovreSvill = bunn(xSete)
    pts.push([xInner, bunn(xInner)], [xInner, ovreSvill], [xSete, ovreSvill])
    const xe = xu + inn.topp.utstikkMm
    if ((inn.topp.toppkutt ?? 'lodd') === 'lodd') pts.push([xe, bunn(xe)], [xe, topp(xe)])
    else {
      const B: [number, number] = [xe, bunn(xe)]
      pts.push(B, [B[0] - h * sin, B[1] + h * cos])
    }
  }
  // Lengde = utstrekning langs sperreaksen.
  const proj = pts.map(([x, y]) => x * cos + y * sin)
  const lengde = Math.max(...proj) - Math.min(...proj)
  if (!fm.ok) merknader.push('Fuglemunnen er dypere enn h/3 – bruk sperrebeslag i stedet for dyp utsparing.')
  if (fm.anleggsandel < 0.999) merknader.push(`Setet dekker ${Math.round(fm.anleggsandel * 100)} % av svillbredden (begrenset av h/3) – kontroller trykk ⊥ fiber med opplegglengde ${fmtMm(fm.seteMm)}, og sikre med sperrebeslag.`)
  return {
    vinkelGrader: aG,
    lengdeMm: lengde,
    kappLengdeMm: rundOppKapp(lengde),
    fuglemunn: fm,
    ovreFuglemunn: ovre,
    hapMm: topp(0),
    ovreSvillHoydeMm: ovreSvill,
    moneOverkantMm: moneOverkant,
    loddkutt: loddkutt(aG),
    vannrettKutt: vannrettKutt(aG),
    omriss: pts,
    opplegglengdeMm: fm.seteMm,
    merknader,
  }
}

// ── Valmtak: grat- og skiftesperrer ────────────────────────────────

export interface ValmGeometri {
  /** Helning på gratsperra β = atan(tan α / √2), grader. */
  gratVinkelGrader: number
  /** Gratens planvinkel mot veggene (likt fall): 45°. */
  planvinkelGrader: number
  /** Horisontalt løp for grat (= løp·√2), mm. */
  gratLopMm: number
  /** Linjelengde gratsperre fra hjørne (ytterliv) til møtepunkt, langs senterlinja, mm. */
  gratLinjeMm: number
  gratLoddkutt: Kuttinnstilling
  /** Kinnkutt der grata møter mønebjelken/andre grater. */
  gratKinnkutt: Kuttinnstilling
  /** Kinnkutt på skiftesperre mot grata. */
  skiftesperreKinnkutt: Kuttinnstilling
  /** Senking av grata (dropping) så overkanten ikke stikker opp over takflatene, mm. */
  senkingMm: number
  /** Lengdeforskjell mellom nabo-skiftesperrer ved gitt c/c, mm (langs sperra). */
  skiftesperreTrinnMm: number
  /** Skiftesperrer: horisontalt løp og linjelengde (til gratens sideflate), mm. */
  skiftesperrer: Array<{ avstandFraHjorneMm: number; lopMm: number; linjeMm: number; kappLengdeMm: number }>
}

/**
 * Valmtak med likt fall α på alle flater (grat 45° i plan).
 * @param lopMm   horisontalt løp for vanlig sperre (ytterliv vegg → mønelinje)
 * @param ccMm    c/c skiftesperrer langs veggen
 * @param gratTykkelseMm  tykkelse gratsperre (48)
 */
export function valmGeometri(inn: { vinkelGrader: number; lopMm: number; ccMm?: number; gratTykkelseMm?: number; utstikkMm?: number }): ValmGeometri {
  const a = inn.vinkelGrader * RAD
  const beta = Math.atan(Math.tan(a) / Math.SQRT2)
  const bG = beta / RAD
  const t = inn.gratTykkelseMm ?? 48
  const cc = inn.ccMm ?? 600
  const gratLop = inn.lopMm * Math.SQRT2
  const skifte: ValmGeometri['skiftesperrer'] = []
  // Skiftesperre i avstand d fra hjørnet: løp = d, minus halv gratbredde målt langs sperra i plan (t/2 / sin 45° = t/√2).
  for (let d = cc; d < inn.lopMm - 1e-6; d += cc) {
    const lop = d - t / Math.SQRT2
    const linje = (lop + (inn.utstikkMm ?? 0)) / Math.cos(a)
    skifte.push({ avstandFraHjorneMm: d, lopMm: lop, linjeMm: linje, kappLengdeMm: rundOppKapp(linje) })
  }
  return {
    gratVinkelGrader: bG,
    planvinkelGrader: 45,
    gratLopMm: gratLop,
    gratLinjeMm: gratLop / Math.cos(beta),
    gratLoddkutt: loddkutt(bG),
    gratKinnkutt: kinnkutt(bG, 45),
    skiftesperreKinnkutt: kinnkutt(inn.vinkelGrader, 45),
    senkingMm: (t / 2) * Math.tan(beta),
    skiftesperreTrinnMm: cc / Math.cos(a),
    skiftesperrer: skifte,
  }
}

// ── Trapp ──────────────────────────────────────────────────────────

export interface TrappGeometri {
  antallOpptrinn: number
  /** Antall inntrinn (trinnplater) – øverste opptrinn går til dekket. */
  antallInntrinn: number
  stigningMm: number
  inntrinnMm: number
  /** 2s + i (trinnformel), mm. */
  trinnformelMm: number
  /** Horisontal lengde (fra nederste trinnforkant til dekkekant), mm. */
  lopMm: number
  /** Trappens helning, grader. */
  vinkelGrader: number
  /** Teoretisk lengde langs trinnlinja (nese–nese, inkl. nederste opptrinn), mm. Kjøp vange ≥ +200 mm. */
  vangeLinjeMm: number
  /** Kutt på vange: vannrett fotkutt og loddrett toppkutt. */
  vangeFotkutt: Kuttinnstilling
  vangeToppkutt: Kuttinnstilling
  ok: boolean
  merknader: string[]
}

/**
 * Utvendig trapp til terrasse. Veiledende (TEK17 § 12-16 med veiledning,
 * Byggforsk 122.xxx): stigning ≤ 180 mm, inntrinn ≥ 250 mm, trinnformel
 * 2s + i ≈ 600–640 mm (gangkomfort). Alle opptrinn like høye.
 */
export function trappGeometri(inn: { hoydeMm: number; maksStigningMm?: number; minInntrinnMm?: number; trinnformelMm?: number }): TrappGeometri {
  const maksS = inn.maksStigningMm ?? 180
  const minI = inn.minInntrinnMm ?? 250
  const formel = inn.trinnformelMm ?? 620
  const n = Math.max(1, Math.ceil(inn.hoydeMm / maksS - 1e-9))
  const s = inn.hoydeMm / n
  const i = Math.max(minI, formel - 2 * s)
  const nInn = Math.max(0, n - 1)
  const vinkel = Math.atan(s / i) / RAD
  const merknader: string[] = []
  const tf = 2 * s + i
  if (tf < 600 || tf > 640) merknader.push(`Trinnformel 2s + i = ${Math.round(tf)} mm er utenfor 600–640 mm.`)
  if (n === 1) merknader.push('Bare ett opptrinn – vurder et trinn/rampe i stedet for vange.')
  return {
    antallOpptrinn: n,
    antallInntrinn: nInn,
    stigningMm: s,
    inntrinnMm: i,
    trinnformelMm: tf,
    lopMm: nInn * i,
    vinkelGrader: vinkel,
    vangeLinjeMm: n * Math.hypot(s, i),
    vangeFotkutt: vannrettKutt(vinkel),
    vangeToppkutt: loddkutt(vinkel),
    ok: s <= maksS + 1e-9 && i >= minI - 1e-9,
    merknader,
  }
}
