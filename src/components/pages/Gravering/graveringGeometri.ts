import type { FormId, OppsettId } from '../../../data/gravering'

/**
 * Geometri for de graverbare produktene. Alle mål er i millimeter, og viewBox-en
 * er mm direkte – da kan vi skrive virkelige mål i koden uten omregning.
 *
 * Formene bygges av primitiver som overlapper hverandre. Siden alle har samme
 * fyll smelter de visuelt sammen til én silhuett, og vi slipper å regne ut
 * sammensatte konturer. Derfor har produktene skygge på gruppen og ikke omriss
 * – et omriss ville avslørt skjøtene.
 */

export type Primitiv =
  | { form: 'rect'; x: number; y: number; w: number; h: number; r: number }
  | { form: 'circle'; cx: number; cy: number; r: number }
  | { form: 'path'; d: string }

export interface Hull {
  cx: number
  cy: number
  r: number
}

export interface Geometri {
  /** viewBox-bredde og -høyde i mm, inkludert kork, lokk og hank. */
  bredde: number
  hoyde: number
  /** Silhuetten, tegnet i rekkefølge. */
  primitiver: Primitiv[]
  /** Opphengshull, hvis formen har det. */
  hull: Hull | null
  /**
   * Innfelt detalj i overflaten, tegnet som midtlinje i en avrundet firkant:
   * saftrillen på fjøla, og stålringen mellom lokk og kropp på drikkeflaska
   * (da med høyde 0, altså en rett strek). Begge er der fra før – derfor
   * geometri, ikke et tilvalg.
   */
  rille: { x: number; y: number; w: number; h: number; r: number; bredde: number } | null
  /** Syhull langs kanten – bare på skinnlappen. */
  syhull: Hull[]
  /**
   * Deler av produktet som IKKE har samme farge som flaten, og derfor ikke kan
   * være en del av silhuetten: bærestroppen og den gjennomsiktige klaffen på
   * drikkeflaska. De tegnes oppå kroppen, under graveringen.
   */
  detaljer: Array<{ rolle: 'stropp' | 'klar'; x: number; y: number; w: number; h: number; r: number }>
  /** Flaten graveringen skal holde seg innenfor. */
  felt: { x: number; y: number; w: number; h: number }
  /** Målet vi oppgir til kunden, f.eks. «350 × 220 mm». */
  maal: string
  /**
   * Sylindriske produkter (flaske, kopp) skyggelegges på tvers for å lese som
   * runde. Flate produkter får bare et mykt lysfall.
   */
  sylinder: boolean
  /** Sylinderen ligger med aksen vannrett (kjevla) – da må lysfallet snus. */
  liggende?: boolean
  /**
   * Trykkflaten til et rullende produkt, brettet ut i planet. Motivet tegnes i
   * dette rommet – `lengde × omkrets` – fordi det må gå sømløst hele veien
   * rundt. Forhåndsvisningen viser båndet som er synlig forfra; eksporten
   * tegner hele utbrettet.
   */
  wrap: { lengde: number; omkrets: number; x: number; diameter: number } | null
}

/**
 * Feltet motivet skal bygges i.
 *
 * Flate produkter bruker graveringsflaten som den er. Rullende produkter har to
 * moduser: et mønster skal fylle HELE utbrettet, så det går sømløst rundt, mens
 * tekst bare skal fylle båndet man ser av gangen – ellers ville et navn blitt
 * skalert mot hele omkretsen og havnet på baksiden av kjevla.
 */
export function motivFelt(geo: Geometri, oppsett: OppsettId): { x: number; y: number; w: number; h: number } {
  if (!geo.wrap) return geo.felt
  const { lengde, omkrets, diameter } = geo.wrap
  if (oppsett === 'monster' || oppsett === 'monstertekst') {
    return { x: 0, y: 0, w: lengde, h: omkrets }
  }
  // Det synlige båndet: like høyt som kjevla er tykk, midt i utbrettet.
  return { x: 0, y: (omkrets - diameter) / 2, w: lengde, h: diameter }
}

/** Hjørneradius på skjærefjøla, målt av den faktiske fjøla. */
const HJORNE = 14
/** Avstand fra ytterkant inn til midten av saftrillen. */
const RILLE_INN = 13
const RILLE_BREDDE = 3.5
/** Luft fra ytterkant inn til graveringsfeltet – god klaring innenfor rillen. */
const KANT = 42

/** Håndtakslengden på kjevla, i mm. Resten av lengden er trykkflate. */
const HANDTAK = 90

/** Avrundet rektangel som path – brukes der vi trenger skrå sider. */
function konisk(toppB: number, bunnB: number, y0: number, y1: number, midt: number, r: number): string {
  const tx0 = midt - toppB / 2
  const tx1 = midt + toppB / 2
  const bx0 = midt - bunnB / 2
  const bx1 = midt + bunnB / 2
  return [
    `M ${tx0 + r} ${y0}`,
    `H ${tx1 - r}`,
    `Q ${tx1} ${y0} ${tx1 - (tx1 - bx1)} ${y0 + r}`,
    `L ${bx1} ${y1 - r}`,
    `Q ${bx1} ${y1} ${bx1 - r} ${y1}`,
    `H ${bx0 + r}`,
    `Q ${bx0} ${y1} ${bx0} ${y1 - r}`,
    `L ${tx0} ${y0 + r}`,
    `Q ${tx0} ${y0} ${tx0 + r} ${y0}`,
    'Z',
  ].join(' ')
}

/**
 * Dreid kjevlehåndtak som path: hals inn mot kroppen, en lett midje, og en
 * kule ytterst. Profilen er halvhøyder langs skaftet, speilet om senterlinja –
 * samme formspråk som på en ekte dreid kjevle.
 */
function handtak(xInnerst: number, xYtterst: number, cy: number, H: number): string {
  const L = xYtterst - xInnerst
  const hals = H * 0.11
  const midje = H * 0.085
  const kule = H * 0.185
  // Punktene langs skaftet, som andel av lengden.
  const x = (a: number) => xInnerst + L * a
  return [
    `M ${xInnerst} ${cy - hals}`,
    `C ${x(0.3)} ${cy - hals} ${x(0.3)} ${cy - midje} ${x(0.5)} ${cy - midje}`,
    `C ${x(0.68)} ${cy - midje} ${x(0.66)} ${cy - kule} ${x(0.8)} ${cy - kule}`,
    `C ${x(0.93)} ${cy - kule} ${xYtterst} ${cy - kule * 0.8} ${xYtterst} ${cy}`,
    `C ${xYtterst} ${cy + kule * 0.8} ${x(0.93)} ${cy + kule} ${x(0.8)} ${cy + kule}`,
    `C ${x(0.66)} ${cy + kule} ${x(0.68)} ${cy + midje} ${x(0.5)} ${cy + midje}`,
    `C ${x(0.3)} ${cy + midje} ${x(0.3)} ${cy + hals} ${xInnerst} ${cy + hals}`,
    'Z',
  ].join(' ')
}

/**
 * Rektangel med rette hjørner øverst og avrundede nederst – flaskekroppen.
 * En vanlig `rect` gir samme radius i alle fire hjørner, og da buer toppen seg
 * bort fra stålringen i stedet for å møte den rett, slik den gjør på flaska.
 */
function rettTopp(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M ${x} ${y}`,
    `H ${x + w}`,
    `V ${y + h - r}`,
    `A ${r} ${r} 0 0 1 ${x + w - r} ${y + h}`,
    `H ${x + r}`,
    `A ${r} ${r} 0 0 1 ${x} ${y + h - r}`,
    'Z',
  ].join(' ')
}

/** Syhull jevnt fordelt langs kanten av skinnlappen. */
function syhullRundt(b: number, h: number, innrykk: number, avstand: number): Hull[] {
  const hull: Hull[] = []
  const r = 1.1
  const langs = (fra: number, til: number, fast: number, vannrett: boolean) => {
    const lengde = til - fra
    const antall = Math.max(2, Math.round(lengde / avstand))
    for (let i = 0; i <= antall; i++) {
      const t = fra + (lengde * i) / antall
      hull.push(vannrett ? { cx: t, cy: fast, r } : { cx: fast, cy: t, r })
    }
  }
  langs(innrykk, b - innrykk, innrykk, true)
  langs(innrykk, b - innrykk, h - innrykk, true)
  langs(innrykk + avstand, h - innrykk - avstand, innrykk, false)
  langs(innrykk + avstand, h - innrykk - avstand, b - innrykk, false)
  return hull
}

export function graveringGeometri(form: FormId, B: number, H: number): Geometri {
  switch (form) {
    case 'rund': {
      const r = B / 2
      // Graveringsfeltet er den største firkanten som får plass godt innenfor
      // sirkelen – 0.62 × diameter gir luft til kanten hele veien rundt.
      const side = B * 0.62
      return {
        bredde: B,
        hoyde: B,
        primitiver: [{ form: 'circle', cx: r, cy: r, r }],
        hull: { cx: r, cy: 20, r: 8 },
        rille: null,
        syhull: [],
        detaljer: [],
        felt: { x: r - side / 2, y: r - side / 2 + B * 0.04, w: side, h: side * 0.72 },
        maal: `Ø ${B} mm`,
        sylinder: false,
        wrap: null,
      }
    }

    case 'brikke': {
      // Glassbrikke: ingen opphengshull, og hele flaten er graverbar.
      const r = B / 2
      const side = B * 0.66
      return {
        bredde: B,
        hoyde: B,
        primitiver: [{ form: 'circle', cx: r, cy: r, r }],
        hull: null,
        rille: null,
        syhull: [],
        detaljer: [],
        felt: { x: r - side / 2, y: r - (side * 0.8) / 2, w: side, h: side * 0.8 },
        maal: `Ø ${B} mm`,
        sylinder: false,
        wrap: null,
      }
    }

    case 'flaske': {
      // Drikkeflaske: rett sylindrisk kropp med et klaff-lokk som er litt
      // BREDERE enn kroppen og legger seg utenpå den, slik lokket på den
      // faktiske flaska gjør. Mellom dem går en tynn stålring.
      const lokkH = H * 0.105
      const lokkB = B * 1.02
      const kroppY = lokkH * 0.92
      return {
        bredde: B,
        hoyde: H,
        primitiver: [
          // Hempa til bærestroppen, i samme flate som lokket.
          { form: 'rect', x: (B - lokkB) / 2 - B * 0.06, y: lokkH * 0.3, w: B * 0.16, h: lokkH * 0.5, r: B * 0.05 },
          { form: 'rect', x: (B - lokkB) / 2, y: 0, w: lokkB, h: lokkH, r: B * 0.1 },
          { form: 'path', d: rettTopp(0, kroppY, B, H - kroppY, B * 0.2) },
        ],
        hull: null,
        // Stålringen der lokket møter kroppen.
        rille: { x: 0, y: kroppY + B * 0.035, w: B, h: 0, r: 0, bredde: B * 0.045 },
        syhull: [],
        detaljer: [
          // Den gjennomsiktige klaffen øverst på lokket – smal og lav, slik
          // den ligger på den faktiske flaska.
          {
            rolle: 'klar',
            x: (B - lokkB) / 2 + lokkB * 0.24,
            y: lokkH * 0.06,
            w: lokkB * 0.52,
            h: lokkH * 0.34,
            r: B * 0.04,
          },
          // Bærestroppen: et smalt bånd festet under lokket, ned langs høyre
          // side og brettet tilbake. Den henger utenpå, så den holder seg i
          // ytterkant og legger seg ikke oppå graveringen.
          {
            rolle: 'stropp',
            x: B * 0.7,
            y: kroppY + B * 0.09,
            w: B * 0.13,
            h: H * 0.48,
            r: B * 0.065,
          },
        ],
        // Graveringsfeltet ligger på den rette delen av kroppen, godt under
        // lokket og over bunnavrundingen.
        felt: { x: B * 0.13, y: H * 0.3, w: B * 0.74, h: H * 0.42 },
        maal: `Ø ${B} × ${H} mm`,
        sylinder: true,
        wrap: null,
      }
    }

    case 'kopp': {
      // Lokk på toppen, lett konisk kropp – smalere i bunnen, som en reisekopp.
      const lokkH = H * 0.13
      const lokkB = B * 0.96
      const kroppY = lokkH * 0.8
      return {
        bredde: B,
        hoyde: H,
        primitiver: [
          { form: 'rect', x: (B - lokkB) / 2, y: 0, w: lokkB, h: lokkH + H * 0.04, r: B * 0.1 },
          { form: 'path', d: konisk(B, B * 0.8, kroppY, H, B / 2, 9) },
        ],
        hull: null,
        rille: null,
        syhull: [],
        detaljer: [],
        felt: { x: B * 0.14, y: H * 0.34, w: B * 0.72, h: H * 0.42 },
        maal: `Ø ${B} × ${H} mm`,
        sylinder: true,
        wrap: null,
      }
    }

    case 'kjevle': {
      // B er hele lengden med håndtak, H er diameteren på kroppen.
      const kroppL = B - HANDTAK * 2
      const kroppX = HANDTAK
      const midt = H / 2
      return {
        bredde: B,
        hoyde: H,
        primitiver: [
          // Skaftene stikker inn under kroppen, så skjøtene ikke synes.
          { form: 'path', d: handtak(kroppX + 4, 0, midt, H) },
          { form: 'path', d: handtak(B - kroppX - 4, B, midt, H) },
          { form: 'rect', x: kroppX, y: 0, w: kroppL, h: H, r: H * 0.12 },
        ],
        hull: null,
        rille: null,
        syhull: [],
        detaljer: [],
        felt: { x: kroppX + 8, y: 6, w: kroppL - 16, h: H - 12 },
        maal: `Ø ${H} × ${kroppL} mm`,
        sylinder: true,
        liggende: true,
        wrap: { lengde: kroppL, omkrets: Math.PI * H, x: kroppX, diameter: H },
      }
    }

    case 'lapp': {
      const innrykk = 3.5
      return {
        bredde: B,
        hoyde: H,
        primitiver: [{ form: 'rect', x: 0, y: 0, w: B, h: H, r: 5 }],
        hull: null,
        rille: null,
        syhull: syhullRundt(B, H, innrykk, 5.5),
        detaljer: [],
        felt: { x: 8, y: 7, w: B - 16, h: H - 14 },
        maal: `${B} × ${H} mm`,
        sylinder: false,
        wrap: null,
      }
    }

    // 'rekt' – skjærefjøla: avrundede hjørner og saftrille hele veien rundt.
    default:
      return {
        bredde: B,
        hoyde: H,
        primitiver: [{ form: 'rect', x: 0, y: 0, w: B, h: H, r: HJORNE }],
        hull: null,
        rille: {
          x: RILLE_INN,
          y: RILLE_INN,
          w: B - RILLE_INN * 2,
          h: H - RILLE_INN * 2,
          r: Math.max(2, HJORNE - RILLE_INN / 2),
          bredde: RILLE_BREDDE,
        },
        syhull: [],
        detaljer: [],
        felt: { x: KANT, y: KANT, w: B - KANT * 2, h: H - KANT * 2 },
        maal: `${B} × ${H} mm`,
        sylinder: false,
        wrap: null,
      }
  }
}

/**
 * Liten, rask PRNG (mulberry32). Teksturen må se tilfeldig ut, men være
 * identisk mellom hver render – ellers flimrer produktet hver gang du skriver
 * en bokstav. Derfor frø, ikke Math.random().
 */
export function fro(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Vannrette årer som bølger lett – tegnet langs produktets lengderetning. */
export function aarer(bredde: number, hoyde: number, seed: number): string[] {
  const rnd = fro(seed)
  const linjer: string[] = []
  const antall = Math.round(hoyde / 7)

  for (let i = 0; i < antall; i++) {
    const y = (i / antall) * hoyde + rnd() * 6
    const amp = 1.5 + rnd() * 5
    const bolger = 1 + Math.floor(rnd() * 3)
    let d = `M -10 ${y.toFixed(1)}`
    const steg = (bredde + 20) / (bolger * 2)
    for (let s = 0; s < bolger * 2; s++) {
      const x = -10 + steg * (s + 1)
      const ctrlY = y + (s % 2 === 0 ? amp : -amp)
      d += ` Q ${(x - steg / 2).toFixed(1)} ${ctrlY.toFixed(1)} ${x.toFixed(1)} ${y.toFixed(1)}`
    }
    linjer.push(d)
  }
  return linjer
}

/** Loddrette børstestriper på stål. Tettere og rettere enn treårer. */
export function borsting(bredde: number, hoyde: number, seed: number): string[] {
  const rnd = fro(seed)
  const linjer: string[] = []
  const antall = Math.round(bredde / 2.5)
  for (let i = 0; i < antall; i++) {
    const x = (i / antall) * bredde + rnd() * 1.5
    linjer.push(`M ${x.toFixed(1)} -10 V ${(hoyde + 10).toFixed(1)}`)
  }
  return linjer
}

/** Narv i skinn – korte, tilfeldige streker som gir overflaten tekstur. */
export function narv(bredde: number, hoyde: number, seed: number): string[] {
  const rnd = fro(seed)
  const linjer: string[] = []
  const antall = Math.round((bredde * hoyde) / 14)
  for (let i = 0; i < antall; i++) {
    const x = rnd() * bredde
    const y = rnd() * hoyde
    const lengde = 0.5 + rnd() * 1.4
    const vinkel = rnd() * Math.PI
    linjer.push(
      `M ${x.toFixed(1)} ${y.toFixed(1)} l ${(Math.cos(vinkel) * lengde).toFixed(1)} ${(Math.sin(vinkel) * lengde).toFixed(1)}`,
    )
  }
  return linjer
}
