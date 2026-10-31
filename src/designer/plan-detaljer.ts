/**
 * Typiske konstruksjonsdetaljer (målestokk 1:5) for byggeplanen.
 *
 * Detaljene er parametriske: tverrsnittene hentes fra modellens faktiske
 * deler (stolpe 98×98, sperre 48×198 …) og takvinkelen fra geometrien, så
 * detaljen viser de samme dimensjonene som tegningene og kapplista.
 * Koordinater i mm, y nedover, ferdig terreng ved y = 0.
 */
import type { Del3D } from './plan-modell'
import type { P, Tegning, TElement } from './plan-tegning'

const PROFIL_RE = /(\d+(?:[.,]\d+)?)\s*[×xX]\s*(\d+(?:[.,]\d+)?)/

function profilMm(p: string): [number, number] | null {
  const m = p.match(PROFIL_RE)
  if (!m) return null
  const a = Number(m[1].replace(',', '.'))
  const b = Number(m[2].replace(',', '.'))
  return [Math.min(a, b), Math.max(a, b)]
}

const rekt = (x: number, y: number, w: number, h: number): P[] => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]]

/** Bruddlinje (sikksakk) – markerer at et element er kortet av på tegningen. */
function brudd(x0: number, x1: number, y: number): TElement {
  const m = (x0 + x1) / 2
  const a = Math.min(18, (x1 - x0) * 0.12)
  return { t: 'poly', pts: [[x0 - 8, y], [m - a, y], [m - a / 2, y - a], [m + a / 2, y + a], [m + a, y], [x1 + 8, y]], lukket: false, linje: 'tynn' }
}
function bruddV(x: number, y0: number, y1: number): TElement {
  const m = (y0 + y1) / 2
  const a = Math.min(18, (y1 - y0) * 0.12)
  return { t: 'poly', pts: [[x, y0 - 8], [x, m - a], [x - a, m - a / 2], [x + a, m + a / 2], [x, m + a], [x, y1 + 8]], lukket: false, linje: 'tynn' }
}

function geo(el: TElement[]): [number, number, number, number] {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity
  for (const e of el) {
    if (e.t !== 'poly') continue
    for (const [x, y] of e.pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y) }
  }
  return [x0, y0, x1, y1]
}

export interface DetaljKontekst {
  deler: Del3D[]
  /** Kvalitetstekst for konstruksjonsvirke, f.eks. «C24 · NTR AB». */
  kvalitet: string
  takvinkel?: number
}

function finnProfil(deler: Del3D[], test: (d: Del3D) => boolean): { profil: [number, number]; navn: string } | null {
  const tell = new Map<string, { n: number; d: Del3D }>()
  for (const d of deler) {
    if (!d.tre || !test(d)) continue
    const e = tell.get(d.profil)
    if (e) e.n++
    else tell.set(d.profil, { n: 1, d })
  }
  const best = [...tell.values()].sort((a, b) => b.n - a.n)[0]
  if (!best) return null
  const p = profilMm(best.d.profil)
  return p ? { profil: p, navn: best.d.navn } : null
}

const fmt = (p: [number, number]) => `${p[0]}×${p[1]}`

// ── D: Stolpefot ────────────────────────────────────────────────────────

function stolpefot(post: [number, number], kvalitet: string): Tegning {
  const b = post[1]
  const el: TElement[] = []
  const pilarB = Math.max(250, b + 100)
  const topBet = -50
  const bunn = 520
  // Jord rundt pilaren.
  el.push({ t: 'poly', pts: rekt(-pilarB / 2 - 220, 0, 220, bunn), lukket: true, linje: 'tynn', fyll: 'jord' })
  el.push({ t: 'poly', pts: rekt(pilarB / 2, 0, 220, bunn), lukket: true, linje: 'tynn', fyll: 'jord' })
  el.push({ t: 'terreng', y: 0, x0: -pilarB / 2 - 240, x1: pilarB / 2 + 240 })
  // Betongpilar (sonorør).
  el.push({ t: 'poly', pts: rekt(-pilarB / 2, topBet, pilarB, bunn - topBet), lukket: true, linje: 'snitt', fyll: 'betong' })
  el.push(brudd(-pilarB / 2 - 230, pilarB / 2 + 230, bunn))
  // Stolpesko: bunnplate, gjengestag, U-beslag.
  const plate = 6
  const stag = 32
  el.push({ t: 'poly', pts: rekt(-b / 2 - 20, topBet - plate, b + 40, plate), lukket: true, linje: 'snitt', fyll: 'stal' })
  el.push({ t: 'poly', pts: rekt(-8, topBet - plate - stag, 16, stag), lukket: true, linje: 'synlig', fyll: 'hvit' })
  const yBunnStolpe = topBet - plate - stag
  el.push({ t: 'poly', pts: rekt(-b / 2 - 4, yBunnStolpe - 5, b + 8, 5), lukket: true, linje: 'synlig', fyll: 'stal' })
  el.push({ t: 'poly', pts: rekt(-b / 2 - 4, yBunnStolpe - 140, 4, 140), lukket: true, linje: 'synlig', fyll: 'stal' })
  el.push({ t: 'poly', pts: rekt(b / 2, yBunnStolpe - 140, 4, 140), lukket: true, linje: 'synlig', fyll: 'stal' })
  // Stolpen.
  const topp = yBunnStolpe - 5 - 420
  el.push({ t: 'poly', pts: rekt(-b / 2, topp, b, 420), lukket: true, linje: 'synlig', fyll: 'tone' })
  el.push(brudd(-b / 2 - 10, b / 2 + 10, topp))
  // Bolter.
  for (const y of [yBunnStolpe - 45, yBunnStolpe - 105]) {
    el.push({ t: 'poly', pts: [[-b / 2 - 14, y], [b / 2 + 14, y]], lukket: false, linje: 'skjult' })
  }
  el.push({ t: 'paaskrift', x: 0, y: topp + 120, tekst: `Stolpe ${fmt(post)} ${kvalitet}`, dx: 22, dy: -10 })
  el.push({ t: 'paaskrift', x: b / 2 + 2, y: yBunnStolpe - 75, tekst: 'Justerbar stolpesko, varmforsinket\n2 gjennomgående bolter M12', dx: 20, dy: -2 })
  el.push({ t: 'paaskrift', x: 0, y: topBet - plate - stag / 2, tekst: 'Luftespalte min. 20 mm – endeved\nfri for vann (forsegl endeveden)', dx: -22, dy: -14 })
  el.push({ t: 'paaskrift', x: -pilarB / 2 + 40, y: 200, tekst: `Betongfundament Ø${pilarB} (sonorør)\ntil frostfri dybde, se merknad`, dx: -18, dy: 10 })
  el.push({ t: 'paaskrift', x: pilarB / 2 + 120, y: 0, tekst: 'Ferdig terreng', dx: 14, dy: 8 })
  el.push({ t: 'maal', retning: 'h', punkter: [-pilarB / 2, pilarB / 2], fra: bunn, side: 1, niva: 0 })
  el.push({ t: 'maal', retning: 'v', punkter: [topBet, 0], fra: pilarB / 2, side: 1, niva: 0 })
  return { id: 'd-stolpefot', navn: 'Detalj 1 – Stolpefot', type: 'detalj', el, geo: geo(el), undertittel: 'Typisk detalj, snitt' }
}

// ── D: Bjelkelag på punktfundament ──────────────────────────────────────

function bjelkelagFundament(bjelke: [number, number], kvalitet: string): Tegning {
  const el: TElement[] = []
  const blokkB = 300
  const blokkH = 250
  el.push({ t: 'poly', pts: rekt(-blokkB / 2 - 200, 0, 200, 300), lukket: true, linje: 'tynn', fyll: 'jord' })
  el.push({ t: 'poly', pts: rekt(blokkB / 2, 0, 200, 300), lukket: true, linje: 'tynn', fyll: 'jord' })
  el.push({ t: 'poly', pts: rekt(-blokkB / 2 - 40, 0, blokkB + 80, 120), lukket: true, linje: 'tynn', fyll: 'grus' })
  el.push({ t: 'terreng', y: 0, x0: -blokkB / 2 - 220, x1: blokkB / 2 + 220 })
  el.push({ t: 'poly', pts: rekt(-blokkB / 2, -blokkH + 120, blokkB, blokkH), lukket: true, linje: 'snitt', fyll: 'betong' })
  el.push(brudd(-blokkB / 2 - 210, blokkB / 2 + 210, 300))
  const yTopp = -blokkH + 120
  // Sylldekke.
  el.push({ t: 'poly', pts: rekt(-bjelke[0] / 2 - 10, yTopp - 4, bjelke[0] + 20, 4), lukket: true, linje: 'synlig', fyll: 'tett' })
  // Bjelke i snitt (dobbel drager).
  const n = 2
  for (let i = 0; i < n; i++) {
    const x = -bjelke[0] * n / 2 + i * bjelke[0]
    el.push({ t: 'poly', pts: rekt(x, yTopp - 4 - bjelke[1], bjelke[0], bjelke[1]), lukket: true, linje: 'snitt', fyll: 'tre' })
  }
  el.push({ t: 'paaskrift', x: bjelke[0] / 2, y: yTopp - 4 - bjelke[1] / 2, tekst: `Drager 2×${fmt(bjelke)} ${kvalitet}\nskrudd sammen c/c 400`, dx: 26, dy: -8 })
  el.push({ t: 'paaskrift', x: bjelke[0], y: yTopp - 2, tekst: 'Sylldekke/fuktsperre', dx: 30, dy: 6 })
  el.push({ t: 'paaskrift', x: -blokkB / 2 + 30, y: yTopp + 60, tekst: 'Fundamentblokk/pilar i betong\npå drenerende, komprimert grus', dx: -22, dy: 8 })
  el.push({ t: 'paaskrift', x: blokkB / 2 + 120, y: 0, tekst: 'Ferdig terreng', dx: 14, dy: 10 })
  el.push({ t: 'maal', retning: 'v', punkter: [yTopp, 0], fra: blokkB / 2, side: 1, niva: 0 })
  return { id: 'd-fundament', navn: 'Detalj 1 – Bjelkelag på fundament', type: 'detalj', el, geo: geo(el), undertittel: 'Typisk detalj, snitt' }
}

// ── D: Sperre/bjelke på drager ──────────────────────────────────────────

function sperreopplegg(sperre: [number, number], drager: [number, number], vinkel: number, kvalitet: string, dobbelDrager: boolean): Tegning {
  const el: TElement[] = []
  const nD = dobbelDrager ? 2 : 1
  const dw = drager[0] * nD
  const dh = drager[1]
  // Drager i snitt (topp ved y = 0).
  for (let i = 0; i < nD; i++) el.push({ t: 'poly', pts: rekt(-dw / 2 + i * drager[0], 0, drager[0], dh), lukket: true, linje: 'snitt', fyll: 'tre' })
  el.push(brudd(-dw / 2 - 10, dw / 2 + 10, dh + 40))
  // Sperra stiger mot venstre (mønet), takfoten er til høyre. Fugleskjæret
  // gir vannrett opplegg på dragerens topp og loddrett hæl mot ytterkanten;
  // hælen begrenses til 1/3 av sperrehøyden.
  const a = (vinkel * Math.PI) / 180
  const t = Math.tan(a)
  const hv = sperre[1] / Math.cos(a)
  const x0 = -dw / 2 - 360
  const x1 = dw / 2 + 300
  const hakkMaks = hv / 3
  const xs = t > 0.01 ? Math.max(-dw / 2, dw / 2 - hakkMaks / t) : -dw / 2
  const yu = (x: number) => (x - xs) * t
  const hael = t > 0.01 ? yu(dw / 2) : 0
  const pts: P[] = t > 0.01
    ? [[x0, yu(x0) - hv], [x1, yu(x1) - hv], [x1, yu(x1)], [dw / 2, hael], [dw / 2, 0], [xs, 0], [x0, yu(x0)]]
    : [[x0, -sperre[1]], [x1, -sperre[1]], [x1, 0], [x0, 0]]
  el.push({ t: 'poly', pts, lukket: true, linje: 'synlig', fyll: 'tone' })
  el.push(bruddV(x0, pts[0][1] - 12, pts[pts.length - 1][1] + 12))
  // Sperrebeslag over skjøten (på sideflaten).
  el.push({ t: 'poly', pts: rekt(dw / 2 - 34, -36, 26, 84), lukket: true, linje: 'tynn', fyll: 'hvit' })
  el.push({ t: 'poly', pts: [[dw / 2 - 34, 0], [dw / 2 - 8, 0]], lukket: false, linje: 'tynn' })
  const midt = (x0 + xs) / 2
  el.push({ t: 'paaskrift', x: midt, y: yu(midt) - hv / 2, tekst: `Sperre ${fmt(sperre)} ${kvalitet}`, dx: -18, dy: -22 })
  el.push({ t: 'paaskrift', x: 0, y: dh * 0.6, tekst: `Drager ${dobbelDrager ? '2×' : ''}${fmt(drager)} ${kvalitet}`, dx: -26, dy: 12 })
  el.push({ t: 'paaskrift', x: dw / 2 - 21, y: 30, tekst: 'Sperrebeslag i hver sperre,\nbegge sider (vindsug)', dx: 34, dy: 18 })
  if (t > 0.01) {
    el.push({ t: 'paaskrift', x: dw / 2, y: hael / 2, tekst: `Fugleskjær – hæl ${Math.round(hael)} mm\n(maks 1/3 av sperrehøyden)`, dx: 30, dy: -30 })
    el.push({ t: 'tekst', x: x1 - 90, y: yu(x1 - 90) + 34, tekst: `${vinkel.toFixed(1).replace('.', ',')}°`, kursiv: true })
    el.push({ t: 'poly', pts: [[x1 - 200, yu(x1 - 200)], [x1, yu(x1 - 200)]], lukket: false, linje: 'hjelp' })
  }
  el.push({ t: 'maal', retning: 'h', punkter: [-dw / 2, dw / 2], fra: dh, side: 1, niva: 0 })
  return { id: 'd-sperre', navn: 'Detalj 2 – Sperre på drager', type: 'detalj', el, geo: geo(el), undertittel: 'Typisk detalj, snitt gjennom drager' }
}

// ── D: Takfot ───────────────────────────────────────────────────────────

function takfot(sperre: [number, number], vinkel: number, kvalitet: string): Tegning {
  const el: TElement[] = []
  const a = (Math.max(vinkel, 0) * Math.PI) / 180
  const t = Math.tan(a)
  const h = sperre[1]
  const hv = h / Math.cos(a)
  const L = 700
  // Sperre: underkant y = x·t (stiger mot venstre = inn mot bygget).
  const uk = (x: number) => -(L - x) * t
  const sperrePts: P[] = [[0, uk(0) - hv], [L, uk(L) - hv], [L, uk(L)], [0, uk(0)]]
  // Loddrett kapp i enden (x = L).
  el.push({ t: 'poly', pts: sperrePts, lukket: true, linje: 'synlig', fyll: 'tone' })
  el.push(bruddV(0, uk(0) - hv - 20, uk(0) + 20))
  // Takplate 18 mm + tekking 6 mm på oversiden.
  const lag = (tykk: number, off: number): P[] => [[0, uk(0) - hv - off - tykk / Math.cos(a)], [L + 30, uk(L + 30) - hv - off - tykk / Math.cos(a)], [L + 30, uk(L + 30) - hv - off], [0, uk(0) - hv - off]]
  el.push({ t: 'poly', pts: lag(18, 0), lukket: true, linje: 'synlig', fyll: 'tre' })
  el.push({ t: 'poly', pts: lag(5, 18 / Math.cos(a)), lukket: true, linje: 'synlig', fyll: 'tett' })
  // Vindski/fascia 21×148 loddrett i enden.
  const fx = L
  const fTop = uk(L) - hv - 30
  el.push({ t: 'poly', pts: rekt(fx, fTop, 21, 148), lukket: true, linje: 'snitt', fyll: 'tre' })
  el.push({ t: 'paaskrift', x: L * 0.45, y: uk(L * 0.45) - hv / 2, tekst: `Sperre ${fmt(sperre)} ${kvalitet}`, dx: -26, dy: 22 })
  el.push({ t: 'paaskrift', x: L * 0.3, y: uk(L * 0.3) - hv - 9, tekst: 'Takplate 18 mm kryssfiner/rupanel', dx: -20, dy: -16 })
  el.push({ t: 'paaskrift', x: L * 0.6, y: uk(L * 0.6) - hv - 18 / Math.cos(a) - 3, tekst: 'Taktekking iht. leverandørens\nleggeanvisning (min. takfall)', dx: 10, dy: -22 })
  el.push({ t: 'paaskrift', x: fx + 21, y: fTop + 74, tekst: 'Vindski/fascia 21×148\nskrudd til sperreendene', dx: 18, dy: 6 })
  el.push({ t: 'maal', retning: 'v', punkter: [fTop, fTop + 148], fra: fx + 21, side: 1, niva: 0 })
  if (vinkel > 0.5) el.push({ t: 'tekst', x: L * 0.75, y: uk(L * 0.75) + 40, tekst: `${String(vinkel.toFixed(1)).replace('.', ',')}°`, kursiv: true })
  return { id: 'd-takfot', navn: 'Detalj 3 – Takfot', type: 'detalj', el, geo: geo(el), undertittel: 'Typisk detalj, snitt' }
}

// ── D: Terrassedekke ────────────────────────────────────────────────────

function terrassedekke(bord: [number, number], bjelke: [number, number], kvalitet: string, tittel = 'Detalj 4 – Terrassedekke'): Tegning {
  const el: TElement[] = []
  const spalte = 6
  const n = 5
  const len = n * (bord[1] + spalte)
  // Bjelke langs tegningen (oppriss), bord i snitt oppå.
  el.push({ t: 'poly', pts: rekt(0, 0, len, bjelke[1]), lukket: true, linje: 'synlig', fyll: 'tone' })
  el.push(bruddV(0, -10, bjelke[1] + 10))
  el.push(bruddV(len, -10, bjelke[1] + 10))
  for (let i = 0; i < n; i++) {
    const x = i * (bord[1] + spalte) + spalte / 2
    el.push({ t: 'poly', pts: rekt(x, -bord[0], bord[1], bord[0]), lukket: true, linje: 'snitt', fyll: 'tre' })
    // Skruer (2 pr. bord).
    for (const sx of [x + bord[1] * 0.22, x + bord[1] * 0.78]) el.push({ t: 'poly', pts: [[sx, -bord[0] + 3], [sx, 40]], lukket: false, linje: 'skjult' })
  }
  // Drager i snitt under bjelken.
  const dx = len * 0.62
  for (let i = 0; i < 2; i++) el.push({ t: 'poly', pts: rekt(dx + i * bjelke[0], bjelke[1], bjelke[0], bjelke[1]), lukket: true, linje: 'snitt', fyll: 'tre' })
  el.push({ t: 'paaskrift', x: bord[1] * 1.5, y: -bord[0] / 2, tekst: `Gulv-/terrassebord ${fmt(bord)}, spalte ${spalte} mm`, dx: -8, dy: -14 })
  el.push({ t: 'paaskrift', x: bord[1] * 2.7, y: 20, tekst: '2 skruer pr. bord pr. bjelke\nrustfri A4, forbor nær endene', dx: 12, dy: -26 })
  el.push({ t: 'paaskrift', x: len * 0.25, y: bjelke[1] / 2, tekst: `Bjelke ${fmt(bjelke)} ${kvalitet}`, dx: -20, dy: 18 })
  el.push({ t: 'paaskrift', x: dx + bjelke[0], y: bjelke[1] * 1.5, tekst: `Drager 2×${fmt(bjelke)} – bjelker festes\nmed bjelkesko eller vinkelbeslag`, dx: 22, dy: 10 })
  el.push({ t: 'maal', retning: 'h', punkter: [spalte / 2, spalte / 2 + bord[1], spalte / 2 + bord[1] + spalte], fra: -bord[0], side: -1, niva: 0 })
  return { id: 'd-dekke', navn: tittel, type: 'detalj', el, geo: geo(el), undertittel: 'Typisk detalj, snitt gjennom dekket' }
}

// ── Velg detaljer for modellen ──────────────────────────────────────────

export function velgDetaljer(k: DetaljKontekst): Tegning[] {
  const { deler, kvalitet } = k
  const ut: Tegning[] = []
  // Stolpefot bare når stolpene faktisk står på fundament/stolpesko ved bakken.
  const post = finnProfil(deler, (d) => d.loddrett && /stolpe|søyle/i.test(d.navn) && d.min[1] < 250)
  const harFundament = deler.some((d) => d.trinn === 0 && !d.tre)
  const bjelke = finnProfil(deler, (d) => d.trinn === 1)
  const sperre = finnProfil(deler, (d) => d.trinn === 4 && !d.loddrett && /sperre|spær|bjelke|overgurt/i.test(d.navn))
  const drager = finnProfil(deler, (d) => !d.loddrett && /drager|toppsvill|bærebjelke|rem/i.test(d.navn))
  const dekke = finnProfil(deler, (d) => d.trinn === 2 && /terrassebord|gulvbord|dekke/i.test(d.navn))
  const tekking = deler.some((d) => d.trinn === 4 && !d.tre)

  if (post && post.profil[1] >= 70) ut.push(stolpefot(post.profil, kvalitet))
  else if (harFundament && bjelke) ut.push(bjelkelagFundament(bjelke.profil, kvalitet))
  if (sperre && drager) {
    const dragerNavn = deler.filter((d) => /drager/i.test(d.navn))
    const dobbel = dragerNavn.length > 0 && dragerNavn.some((d) => {
      const b = Math.min(d.max[0] - d.min[0], d.max[2] - d.min[2])
      return b > (drager.profil[0] * 1.6)
    })
    ut.push(sperreopplegg(sperre.profil, drager.profil, k.takvinkel ?? 0, kvalitet, dobbel))
  }
  if (sperre && tekking) ut.push(takfot(sperre.profil, k.takvinkel ?? 0, kvalitet))
  if (dekke && bjelke) ut.push(terrassedekke(dekke.profil, bjelke.profil, kvalitet, deler.some((d) => d.trinn === 4) ? 'Detalj 4 – Gulv på bjelkelag' : 'Detalj 4 – Terrassedekke'))
  ut.forEach((t, i) => { t.navn = t.navn.replace(/Detalj \d/, `Detalj ${i + 1}`) })
  return ut
}

/** Takvinkel (grader) målt fra sperrene i modellen (vanligste helning). */
export function takvinkelFraModell(deler: Del3D[]): number | undefined {
  const tell = new Map<number, number>()
  for (const d of deler) {
    if (d.trinn !== 4 || !d.tre || !d.akse) continue
    const a = d.akse
    const h = Math.hypot(a[0], a[2])
    if (h < 0.2) continue
    const v = Math.round((Math.atan2(Math.abs(a[1]), h) * 180) / Math.PI * 10) / 10
    if (v < 0.5 || v > 70) continue
    tell.set(v, (tell.get(v) ?? 0) + (d.lengdeMm ?? 1))
  }
  const best = [...tell.entries()].sort((a, b) => b[1] - a[1])[0]
  return best?.[0]
}
