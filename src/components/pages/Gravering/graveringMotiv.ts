import type { OppsettId } from '../../../data/gravering'

/**
 * Motivmotoren: regner ut hvor tekst, streker og symboler havner på flaten.
 *
 * Dette er den eneste kilden til komposisjonen. Forhåndsvisningen tegner
 * elementene som React-SVG, og eksporten (`graveringSvg.ts`) tegner de samme
 * elementene som kurver til graveringsmaskinen – da kan kunden aldri godkjenne
 * noe annet enn det maskinen får.
 *
 * Alle mål er i millimeter, som ellers i graveringen.
 */

export type Anker = 'start' | 'middle' | 'end'

/** Plassering av motivet i flaten. 'auto' = oppsettets egen plassering. */
export type Vannrett = 'auto' | 'venstre' | 'midt' | 'hoyre'
export type Loddrett = 'auto' | 'topp' | 'midt' | 'bunn'

export type MotivElement =
  | {
      slag: 'tekst'
      tekst: string
      /** x tolkes etter `anker`: venstrekant, midten eller høyrekant. */
      x: number
      /** Grunnlinja, som i SVG. */
      y: number
      px: number
      anker: Anker
      /** Sperring mellom tegn, i mm (0 for vanlig tekst). */
      sperring: number
    }
  | { slag: 'strek'; x1: number; y1: number; x2: number; y2: number; bredde: number }
  | { slag: 'ring'; cx: number; cy: number; r: number; bredde: number }
  | { slag: 'symbol'; path: string; x: number; y: number; storrelse: number }

export interface Felt {
  x: number
  y: number
  w: number
  h: number
}

export interface MotivInput {
  /** Flaten graveringen må holde seg innenfor. */
  felt: Felt
  /** Tekstlinjene, allerede klippet til produktets maksLinjer. */
  linjer: string[]
  /** Symbolets path i sitt eget 100 × 100-rutenett, eller null. */
  symbolPath: string | null
  oppsett: OppsettId
  /** Kundens egen plassering. Utelatt eller 'auto' = oppsettets standard. */
  juster?: Vannrett
  loddrett?: Loddrett
  /**
   * Høyden på båndet man ser av gangen på et rullende produkt (= diameteren),
   * målt i utbrettet. Mønster med tekst bruker den til å bygge komposisjonen
   * der kunden faktisk ser den, i stedet for å spre den rundt hele kjevla.
   */
  synlig?: number
  /** Måler tekstbredde i valgt skrift ved gitt punktstørrelse. */
  maal: (tekst: string, px: number) => number
}

/**
 * En rad i motivstabelen. `vekt` er radens høyde i basisenheter – alt skaleres
 * til slutt med samme faktor, slik at komposisjonen holder seg uansett hvor
 * stor flaten er.
 */
type Rad =
  | { slag: 'tekst'; tekst: string; vekt: number; sperring: number }
  | { slag: 'strek'; vekt: number; bredde: number | 'blokk' }
  | { slag: 'ring'; tekst: string; symbolPath: string | null; vekt: number }
  | { slag: 'symbol'; path: string; vekt: number }
  | { slag: 'luft'; vekt: number }

/** Omtrentlig rutestørrelse i mønsteret, i mm. Radtallet rundes til dette. */
const RUTE = 30

/** Strektykkelse som andel av basisstørrelsen. Tynt nok til å lese som en hårstrek. */
const STREK = 0.05
/** Hvor langt ned fra radens topp grunnlinja ligger, som andel av skriftstørrelsen. */
const GRUNNLINJE = 0.76
/** Sperringen oppgis i em og ganges opp med skriftstørrelsen. */
const em = (verdi: number, px: number) => verdi * px

/**
 * Monogrammet skal være initialer, ikke et navn: «Familien Berg» blir «FB».
 * Korte ord («B», «KMS») er allerede et monogram og står som de er.
 */
function initialer(tekst: string): string {
  const ord = tekst.split(/\s+/).filter(Boolean)
  if (!ord.length) return ''
  if (ord.length === 1) return ord[0].length <= 3 ? ord[0].toUpperCase() : ord[0][0].toUpperCase()
  return ord.slice(0, 3).map((o) => o[0]).join('').toUpperCase()
}

/**
 * Mønster til kjevla. Feltet er det utbrettede sylinderplanet, så rutenettet
 * MÅ gå opp på høyden: antall rader regnes ut først, og steget settes til
 * `høyde / rader`. Da møtes mønsteret sømløst der utbrettet lukkes rundt
 * kjevla. Annenhver rad forskyves en halv rute, som på en ekte pregekjevle.
 */
function monster(inn: MotivInput): MotivElement[] {
  const f = inn.felt
  if (!inn.symbolPath) {
    // Uten symbol er det ikke noe mønster – da er det bare teksten igjen.
    return byggMotiv({ ...inn, oppsett: 'senter' })
  }

  // Annenhver rad forskyves, så radtallet må være PARTALL – ellers møtes to
  // like rader der utbrettet lukkes, og skjøten synes på den ferdige kjevla.
  const rader = Math.max(4, Math.round(f.h / RUTE / 2) * 2)
  const steg = f.h / rader
  const storrelse = steg * 0.6
  const kolonner = Math.max(2, Math.round(f.w / steg))
  const stegX = f.w / kolonner

  const ut: MotivElement[] = []
  for (let r = 0; r < rader; r++) {
    const y = f.y + r * steg + (steg - storrelse) / 2
    for (let k = 0; k < kolonner; k++) {
      const x = f.x + stegX * (k + (r % 2 ? 0.5 : 0)) + (stegX - storrelse) / 2
      // Forskyvningen kan skyve siste symbol utenfor enden av trykkflaten.
      if (x + storrelse > f.x + f.w) continue
      ut.push({ slag: 'symbol', path: inn.symbolPath, x, y, storrelse })
    }
  }
  return ut
}

/**
 * Mønster med tekst.
 *
 * Komposisjonen bygges i båndet som vender mot deg: en symbolrad, teksten,
 * en symbolrad til. Resten av omkretsen – baksiden – fylles med jevnt fordelte
 * symbolrader, så kjevla preger noe uansett hvor i omdreiningen den er.
 *
 * Radene bak regnes ut av restbuen og legges modulo omkretsen, slik at ingen
 * rad havner oppå teksten eller blir delt der utbrettet lukkes.
 */
function monsterMedTekst(inn: MotivInput): MotivElement[] {
  const f = inn.felt
  if (!inn.symbolPath) return byggMotiv({ ...inn, oppsett: 'senter' })

  const synlig = Math.min(f.h, inn.synlig ?? f.h * 0.32)
  const topp = f.y + (f.h - synlig) / 2
  const bunn = topp + synlig
  const symbolH = synlig * 0.22
  const luft = synlig * 0.05

  const kolonner = Math.max(2, Math.round(f.w / (symbolH * 1.9)))
  const stegX = f.w / kolonner
  const rad = (y: number, forskyv: boolean): MotivElement[] =>
    Array.from({ length: kolonner }, (_, k) => ({
      slag: 'symbol' as const,
      path: inn.symbolPath as string,
      x: f.x + stegX * (k + (forskyv ? 0.5 : 0)) + (stegX - symbolH) / 2,
      y,
      storrelse: symbolH,
    })).filter((e) => e.x + symbolH <= f.x + f.w)

  const ut: MotivElement[] = [...rad(topp + luft, false), ...rad(bunn - luft - symbolH, false)]

  ut.push(
    ...byggMotiv({
      ...inn,
      symbolPath: null,
      oppsett: 'senter',
      felt: {
        x: f.x + f.w * 0.06,
        y: topp + symbolH + luft * 2,
        w: f.w * 0.88,
        h: synlig - 2 * (symbolH + luft * 2),
      },
    }),
  )

  // Baksiden: jevnt fordelte rader over restbuen, forskjøvet annenhver gang.
  //
  // En rad kan havne oppå skjøten der utbrettet lukkes. Da tegnes den TO
  // ganger – nederst og øverst i planet – slik at halvdelene møtes til ett helt
  // symbol når arket rulles rundt kjevla. Uten dette ble symbolet kuttet på
  // midten akkurat der skjøten går.
  const rest = f.h - synlig
  const raderBak = Math.max(1, Math.round(rest / (symbolH * 1.9)))
  const stegBak = rest / raderBak
  for (let r = 0; r < raderBak; r++) {
    const rått = bunn + stegBak * r + (stegBak - symbolH) / 2
    const y = f.y + (((rått - f.y) % f.h) + f.h) % f.h
    ut.push(...rad(y, r % 2 === 1))
    if (y + symbolH > f.y + f.h) ut.push(...rad(y - f.h, r % 2 === 1))
  }

  return ut
}

interface Stabel {
  rader: Rad[]
  /** Oppsettets egen plassering, før kunden eventuelt overstyrer den. */
  juster: Exclude<Vannrett, 'auto'>
  loddrett: Exclude<Loddrett, 'auto'>
  /**
   * Noen oppsett bruker bare en del av flaten – et hjørnemerke skal være lite.
   * Andelen oppgis av bredde og høyde, og selve plasseringen av boksen følger
   * justeringen, slik at «hjørnemerke øverst til venstre» også er mulig.
   */
  boks: { w: number; h: number } | null
}

function rader(inn: MotivInput): Stabel {
  const [l1 = '', l2 = '', l3 = ''] = inn.linjer.map((l) => l.trim())
  const sym = inn.symbolPath

  switch (inn.oppsett) {
    case 'linjer': {
      const r: Rad[] = []
      if (sym) r.push({ slag: 'symbol', path: sym, vekt: 0.62 }, { slag: 'luft', vekt: 0.3 })
      r.push({ slag: 'strek', vekt: 0.08, bredde: 'blokk' }, { slag: 'luft', vekt: 0.34 })
      if (l1) r.push({ slag: 'tekst', tekst: l1, vekt: 1, sperring: 0.16 })
      if (l2) r.push({ slag: 'luft', vekt: 0.34 }, { slag: 'tekst', tekst: l2, vekt: 0.3, sperring: 0.34 })
      r.push({ slag: 'luft', vekt: 0.34 }, { slag: 'strek', vekt: 0.08, bredde: 'blokk' })
      if (l3) r.push({ slag: 'luft', vekt: 0.34 }, { slag: 'tekst', tekst: l3, vekt: 0.26, sperring: 0.26 })
      return { rader: r, juster: 'midt', loddrett: 'midt', boks: null }
    }

    case 'monogram': {
      // Første linje er initialen. Står den tom, får symbolet ringen i stedet.
      const initial = initialer(l1)
      const r: Rad[] = []
      if (initial || sym) r.push({ slag: 'ring', tekst: initial, symbolPath: initial ? null : sym, vekt: 1 })
      if (l2) r.push({ slag: 'luft', vekt: 0.26 }, { slag: 'tekst', tekst: l2, vekt: 0.3, sperring: 0.14 })
      if (l3) r.push({ slag: 'luft', vekt: 0.2 }, { slag: 'tekst', tekst: l3, vekt: 0.22, sperring: 0.26 })
      return { rader: r, juster: 'midt', loddrett: 'midt', boks: null }
    }

    case 'hjorne': {
      const r: Rad[] = []
      if (sym) r.push({ slag: 'symbol', path: sym, vekt: 0.8 }, { slag: 'luft', vekt: 0.26 })
      if (l1) r.push({ slag: 'tekst', tekst: l1, vekt: 1, sperring: 0.2 })
      if (l2) r.push({ slag: 'luft', vekt: 0.3 }, { slag: 'tekst', tekst: l2, vekt: 0.38, sperring: 0.3 })
      if (l3) r.push({ slag: 'luft', vekt: 0.24 }, { slag: 'tekst', tekst: l3, vekt: 0.32, sperring: 0.3 })
      // Et hjørnemerke skal være lite: det får en knapp halvpart av flaten.
      return { rader: r, juster: 'hoyre', loddrett: 'bunn', boks: { w: 0.54, h: 0.5 } }
    }

    case 'venstre': {
      const r: Rad[] = []
      if (sym) r.push({ slag: 'symbol', path: sym, vekt: 0.7 }, { slag: 'luft', vekt: 0.3 })
      r.push({ slag: 'strek', vekt: 0.08, bredde: 0.26 }, { slag: 'luft', vekt: 0.4 })
      if (l1) r.push({ slag: 'tekst', tekst: l1, vekt: 1, sperring: 0 })
      if (l2) r.push({ slag: 'luft', vekt: 0.3 }, { slag: 'tekst', tekst: l2, vekt: 0.34, sperring: 0.22 })
      if (l3) r.push({ slag: 'luft', vekt: 0.22 }, { slag: 'tekst', tekst: l3, vekt: 0.28, sperring: 0.22 })
      return { rader: r, juster: 'venstre', loddrett: 'midt', boks: { w: 0.64, h: 1 } }
    }

    default: {
      // 'senter' – navnet stort i midten, undertekstene under.
      const r: Rad[] = []
      if (sym) r.push({ slag: 'symbol', path: sym, vekt: 0.82 }, { slag: 'luft', vekt: 0.3 })
      if (l1) r.push({ slag: 'tekst', tekst: l1, vekt: 1, sperring: 0 })
      if (l2) r.push({ slag: 'luft', vekt: 0.3 }, { slag: 'tekst', tekst: l2, vekt: 0.44, sperring: 0.04 })
      if (l3) r.push({ slag: 'luft', vekt: 0.24 }, { slag: 'tekst', tekst: l3, vekt: 0.36, sperring: 0.08 })
      return { rader: r, juster: 'midt', loddrett: 'midt', boks: null }
    }
  }
}

/** Oppsettets egen plassering – til å vise hva «auto» betyr i grensesnittet. */
export function standardPlassering(oppsett: OppsettId): {
  juster: Exclude<Vannrett, 'auto'>
  loddrett: Exclude<Loddrett, 'auto'>
} {
  const tom: MotivInput = { felt: { x: 0, y: 0, w: 1, h: 1 }, linjer: [], symbolPath: null, oppsett, maal: () => 0 }
  const { juster, loddrett } = rader(tom)
  return { juster, loddrett }
}

/** Legger delboksen der justeringen peker, innenfor hele flaten. */
function plasserBoks(felt: Felt, boks: { w: number; h: number }, juster: string, loddrett: string): Felt {
  const w = felt.w * boks.w
  const h = felt.h * boks.h
  const x = juster === 'venstre' ? felt.x : juster === 'hoyre' ? felt.x + felt.w - w : felt.x + (felt.w - w) / 2
  const y = loddrett === 'topp' ? felt.y : loddrett === 'bunn' ? felt.y + felt.h - h : felt.y + (felt.h - h) / 2
  return { x, y, w, h }
}

/**
 * Bygger motivet. Stabelen av rader skaleres med én felles basisstørrelse, som
 * er den største som får både den samlede høyden og den bredeste tekstlinja til
 * å gå opp innenfor feltet.
 */
export function byggMotiv(inn: MotivInput): MotivElement[] {
  if (inn.oppsett === 'monster') return monster(inn)
  if (inn.oppsett === 'monstertekst') return monsterMedTekst(inn)

  const stabelen = rader(inn)
  const stabel = stabelen.rader
  if (!stabel.length) return []

  const vannrett = !inn.juster || inn.juster === 'auto' ? stabelen.juster : inn.juster
  const loddrett = !inn.loddrett || inn.loddrett === 'auto' ? stabelen.loddrett : inn.loddrett
  const juster: Anker = vannrett === 'venstre' ? 'start' : vannrett === 'hoyre' ? 'end' : 'middle'
  const felt = stabelen.boks ? plasserBoks(inn.felt, stabelen.boks, vannrett, loddrett) : inn.felt

  const sumVekt = stabel.reduce((n, r) => n + r.vekt, 0)
  if (sumVekt <= 0) return []

  // Bredden en rad krever ved basis = 1. Måler på 100 px for presisjon og
  // regner om, siden canvas måler unøyaktig på små størrelser.
  const kravBredde = (r: Rad): number => {
    if (r.slag === 'tekst') {
      const tegn = Math.max(0, [...r.tekst].length - 1)
      return (inn.maal(r.tekst, 100) / 100 + r.sperring * tegn) * r.vekt
    }
    if (r.slag === 'ring') return r.vekt
    if (r.slag === 'symbol') return r.vekt
    return 0
  }

  const etterBredde = stabel.reduce((minst, r) => {
    const krav = kravBredde(r)
    return krav > 0 ? Math.min(minst, felt.w / krav) : minst
  }, Number.POSITIVE_INFINITY)
  const basis = Math.min(felt.h / sumVekt, etterBredde)
  if (!(basis > 0) || !Number.isFinite(basis)) return []

  const blokkH = sumVekt * basis
  // Blokkbredden styrer hvor lange «blokk»-strekene blir.
  const blokkB = Math.min(felt.w, stabel.reduce((bred, r) => Math.max(bred, kravBredde(r) * basis), 0))

  const ankerX =
    juster === 'start' ? felt.x : juster === 'end' ? felt.x + felt.w : felt.x + felt.w / 2
  let y =
    loddrett === 'topp' ? felt.y : loddrett === 'bunn' ? felt.y + felt.h - blokkH : felt.y + (felt.h - blokkH) / 2

  const venstreKant = (bredde: number) =>
    juster === 'start' ? ankerX : juster === 'end' ? ankerX - bredde : ankerX - bredde / 2

  const ut: MotivElement[] = []

  for (const r of stabel) {
    const h = r.vekt * basis

    if (r.slag === 'tekst') {
      ut.push({
        slag: 'tekst',
        tekst: r.tekst,
        x: ankerX,
        y: y + h * GRUNNLINJE,
        px: h,
        anker: juster,
        sperring: em(r.sperring, h),
      })
    } else if (r.slag === 'strek') {
      const bredde = r.bredde === 'blokk' ? blokkB : felt.w * r.bredde
      const x1 = venstreKant(bredde)
      ut.push({ slag: 'strek', x1, y1: y + h / 2, x2: x1 + bredde, y2: y + h / 2, bredde: STREK * basis })
    } else if (r.slag === 'symbol') {
      ut.push({ slag: 'symbol', path: r.path, x: venstreKant(h), y, storrelse: h })
    } else if (r.slag === 'ring') {
      const cx = venstreKant(h) + h / 2
      const cy = y + h / 2
      ut.push({ slag: 'ring', cx, cy, r: h / 2 - (STREK * basis) / 2, bredde: STREK * basis * 1.2 })
      if (r.symbolPath) {
        const s = h * 0.46
        ut.push({ slag: 'symbol', path: r.symbolPath, x: cx - s / 2, y: cy - s / 2, storrelse: s })
      } else if (r.tekst) {
        // Initialen fyller ringen så godt den kan uten å røre den.
        const maksB = h * 0.56
        const px = Math.min(h * 0.52, (maksB / Math.max(1, inn.maal(r.tekst, 100) / 100)) * 1)
        ut.push({ slag: 'tekst', tekst: r.tekst, x: cx, y: cy + px * 0.35, px, anker: 'middle', sperring: 0 })
      }
    }

    y += h
  }

  return ut
}
