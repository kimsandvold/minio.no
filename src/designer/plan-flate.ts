/**
 * Tegneflate for byggeplanen – ett API, to bakender:
 *
 *  - `PdfDok` tegner VEKTOR direkte med jsPDF (linjer, polygoner, tekst).
 *    Ingen rasterisering av tegninger → skarpe streker i alle målestokker,
 *    søkbar tekst og liten fil.
 *  - `SvgDok` tegner de samme sidene som SVG-strenger – brukes til
 *    forhåndsvisning av byggeplanen og 2D-tegningene i designverktøyet.
 *
 * Enheter: millimeter på arket, origo øverst til venstre, y nedover.
 * Skriftstørrelser i punkt (pt). All tekst saneres til WinAnsi (Helvetica i
 * PDF har ikke glyfer utenfor Latin-1 + cp1252).
 */
import type { jsPDF as JsPDF } from 'jspdf'

export type Farge = string // '#rrggbb'

export interface Stil {
  /** Strekfarge (null = ingen strek). Standard: svart. */
  strek?: Farge | null
  /** Fyllfarge (null/utelatt = ingen fyll). */
  fyll?: Farge | null
  /** Strektykkelse i mm. Standard 0,25. */
  bredde?: number
  /** Stiplet mønster i mm, f.eks. [2, 1]. */
  stiplet?: number[]
  /** Gjennomsiktighet 0–1 for fyll. */
  opasitet?: number
  /** Linjeender. */
  ende?: 'butt' | 'round' | 'square'
}

export interface TekstStil {
  /** Punktstørrelse. */
  str: number
  vekt?: 'normal' | 'bold'
  kursiv?: boolean
  farge?: Farge
  juster?: 'left' | 'center' | 'right'
  /** Rotasjon mot klokka i grader. */
  vinkel?: number
  /** Vertikal forankring av y. Standard: alphabetic (grunnlinje). */
  grunnlinje?: 'alphabetic' | 'top' | 'middle' | 'bottom'
  /** Bokstavavstand i mm (kun SVG; PDF ignorerer). */
  sperring?: number
}

export interface Flate {
  readonly bredde: number
  readonly hoyde: number
  strek(x1: number, y1: number, x2: number, y2: number, s?: Stil): void
  poly(pts: Array<[number, number]>, lukket: boolean, s?: Stil): void
  rekt(x: number, y: number, w: number, h: number, s?: Stil): void
  sirkel(cx: number, cy: number, r: number, s?: Stil): void
  tekst(t: string, x: number, y: number, s: TekstStil): void
  /** Tekstbredde i mm. */
  maal(t: string, str: number, vekt?: 'normal' | 'bold'): number
  bilde(data: string, x: number, y: number, w: number, h: number): void
}

export interface Dok {
  /** Ny side. 'p' = A4 stående, 'l' = A4 liggende. */
  nySide(orientering: 'p' | 'l'): Flate
  /** Gå tilbake til side i (0-basert) – brukes til topp-/bunntekst til slutt. */
  side(i: number): Flate
  readonly antallSider: number
}

export const PT_MM = 25.4 / 72

// ── Tekst-sanering ──────────────────────────────────────────────────────

const ERSTATT: Record<string, string> = {
  '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~', '→': '->', '←': '<-', '↔': '<->', '⇒': '=>',
  '✓': '', '✔': '', '✗': 'x', '⚠': '!', '★': '*', '•': '•', '∙': '·', '⋅': '·', '−': '-',
  '‑': '-', '‐': '-', '⁄': '/', '√': 'rot ', '∑': 'Sum ', '∞': 'uendelig', '′': "'", '″': '"',
  'γ': 'g', 'Γ': 'G', 'ψ': 'psi', 'Ψ': 'Psi', 'μ': 'µ', 'λ': 'lambda', 'δ': 'd', 'Δ': 'D',
  'φ': 'phi', 'ϕ': 'phi', 'ρ': 'rho', 'σ': 'sigma', 'τ': 'tau', 'α': 'a', 'β': 'b', 'ε': 'e',
  'η': 'eta', 'θ': 'theta', 'ω': 'omega', 'π': 'pi', 'χ': 'chi', 'κ': 'k', 'ξ': 'xi', 'ζ': 'zeta',
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4', '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9',
  'ₖ': 'k', 'ₑ': 'e', 'ₘ': 'm', 'ₙ': 'n', 'ₜ': 't', 'ᵈ': 'd', 'ₐ': 'a', 'ᵢ': 'i', 'ⱼ': 'j', 'ₒ': 'o',
  '⁴': '4', '⁵': '5', '⁶': '6', '⁻': '-', '⁰': '0', '\u00a0': ' ', '\u202f': ' ', '\u2009': ' ', '\u200b': '',
}
// cp1252-tegn utenfor Latin-1 som Helvetica/WinAnsi faktisk har.
const CP1252 = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ')

export function sanerTekst(t: string): string {
  let ut = ''
  for (const ch of t) {
    const k = ch.codePointAt(0) ?? 0
    if (k < 0x100) { ut += ch; continue }
    if (CP1252.has(ch)) { ut += ch; continue }
    const e = ERSTATT[ch]
    if (e !== undefined) { ut += e; continue }
    // Ukjent tegn: dropp det heller enn å ødelegge hele strengen.
  }
  return ut
}

// ── Måling i nettleseren (SVG-bakenden) ─────────────────────────────────

let maaleCtx: CanvasRenderingContext2D | null = null
function maalCanvas(t: string, str: number, vekt: 'normal' | 'bold' = 'normal'): number {
  if (!maaleCtx) {
    const c = typeof document !== 'undefined' ? document.createElement('canvas') : null
    maaleCtx = c?.getContext('2d') ?? null
  }
  if (!maaleCtx) return t.length * str * PT_MM * 0.52
  maaleCtx.font = `${vekt === 'bold' ? 700 : 400} 100px Helvetica, Arial, sans-serif`
  return (maaleCtx.measureText(t).width / 100) * str * PT_MM
}

// ── SVG-bakende ─────────────────────────────────────────────────────────

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const n = (v: number) => (Math.round(v * 100) / 100).toString()

class SvgFlate implements Flate {
  deler: string[] = []
  readonly bredde: number
  readonly hoyde: number
  constructor(bredde: number, hoyde: number) {
    this.bredde = bredde
    this.hoyde = hoyde
  }

  private attr(s: Stil = {}): string {
    const strek = s.strek === undefined ? '#000000' : s.strek
    const a = [
      `fill="${s.fyll ?? 'none'}"`,
      `stroke="${strek ?? 'none'}"`,
      `stroke-width="${n(s.bredde ?? 0.25)}"`,
      `stroke-linecap="${s.ende ?? 'butt'}"`,
      'stroke-linejoin="miter"',
    ]
    if (s.stiplet?.length) a.push(`stroke-dasharray="${s.stiplet.map(n).join(' ')}"`)
    if (s.opasitet !== undefined && s.opasitet < 1) a.push(`fill-opacity="${n(s.opasitet)}"`)
    return a.join(' ')
  }
  strek(x1: number, y1: number, x2: number, y2: number, s?: Stil) {
    this.deler.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" ${this.attr(s)}/>`)
  }
  poly(pts: Array<[number, number]>, lukket: boolean, s?: Stil) {
    if (pts.length < 2) return
    const p = pts.map(([x, y]) => `${n(x)},${n(y)}`).join(' ')
    this.deler.push(lukket ? `<polygon points="${p}" ${this.attr(s)}/>` : `<polyline points="${p}" ${this.attr({ ...s, fyll: null })}/>`)
  }
  rekt(x: number, y: number, w: number, h: number, s?: Stil) {
    this.deler.push(`<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" ${this.attr(s)}/>`)
  }
  sirkel(cx: number, cy: number, r: number, s?: Stil) {
    this.deler.push(`<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" ${this.attr(s)}/>`)
  }
  tekst(t: string, x: number, y: number, s: TekstStil) {
    const tt = sanerTekst(t)
    if (!tt) return
    const anchor = s.juster === 'center' ? 'middle' : s.juster === 'right' ? 'end' : 'start'
    // Samme vertikale forankring som jsPDF (top/middle/bottom regnes fra
    // versalhøyde ~0,72 em – nok til at layouten stemmer visuelt).
    const fs = s.str * PT_MM
    let dy = 0
    if (s.grunnlinje === 'top') dy = fs * 0.76
    else if (s.grunnlinje === 'middle') dy = fs * 0.36
    else if (s.grunnlinje === 'bottom') dy = -fs * 0.22
    const rot = s.vinkel ? ` transform="rotate(${n(-s.vinkel)} ${n(x)} ${n(y)})"` : ''
    const sperr = s.sperring ? ` letter-spacing="${n(s.sperring)}"` : ''
    this.deler.push(
      `<text x="${n(x)}" y="${n(y + dy)}"${rot} font-family="Helvetica, Arial, sans-serif" font-size="${n(fs)}" font-weight="${s.vekt === 'bold' ? 700 : 400}"${s.kursiv ? ' font-style="italic"' : ''} fill="${s.farge ?? '#000000'}" text-anchor="${anchor}"${sperr}>${esc(tt)}</text>`,
    )
  }
  maal(t: string, str: number, vekt?: 'normal' | 'bold') {
    return maalCanvas(sanerTekst(t), str, vekt)
  }
  bilde(data: string, x: number, y: number, w: number, h: number) {
    if (!data) return
    this.deler.push(`<image href="${esc(data)}" x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" preserveAspectRatio="xMidYMid meet"/>`)
  }
  svg(): string {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${n(this.bredde)} ${n(this.hoyde)}" width="${n(this.bredde)}mm" height="${n(this.hoyde)}mm"><rect width="100%" height="100%" fill="#ffffff"/>${this.deler.join('')}</svg>`
  }
}

export class SvgDok implements Dok {
  sider: SvgFlate[] = []
  nySide(o: 'p' | 'l'): Flate {
    const f = o === 'p' ? new SvgFlate(210, 297) : new SvgFlate(297, 210)
    this.sider.push(f)
    return f
  }
  side(i: number): Flate { return this.sider[i] }
  get antallSider() { return this.sider.length }
  /** Én SVG-streng per side. */
  svgSider(): string[] {
    return this.sider.map((s) => s.svg())
  }
}

// ── PDF-bakende (jsPDF, vektor) ─────────────────────────────────────────

const rgb = (hex: string): [number, number, number] => {
  const h = hex.replace('#', '')
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
}

class PdfFlate implements Flate {
  readonly bredde: number
  readonly hoyde: number
  private doc: JsPDF
  constructor(doc: JsPDF, bredde: number, hoyde: number) {
    this.doc = doc
    this.bredde = bredde
    this.hoyde = hoyde
  }

  private bruk(s: Stil = {}): 'S' | 'F' | 'FD' | null {
    const d = this.doc
    const strek = s.strek === undefined ? '#000000' : s.strek
    if (strek) d.setDrawColor(...rgb(strek))
    if (s.fyll) d.setFillColor(...rgb(s.fyll))
    d.setLineWidth(s.bredde ?? 0.25)
    d.setLineDashPattern(s.stiplet?.length ? s.stiplet : [], 0)
    d.setLineCap(s.ende === 'round' ? 'round' : s.ende === 'square' ? 'square' : 'butt')
    d.setLineJoin('miter')
    if (s.fyll && s.opasitet !== undefined && s.opasitet < 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const D = d as any
      D.setGState(new D.GState({ opacity: s.opasitet }))
    }
    return s.fyll && strek ? 'FD' : s.fyll ? 'F' : strek ? 'S' : null
  }
  private nullstillOpasitet(s?: Stil) {
    if (s?.fyll && s.opasitet !== undefined && s.opasitet < 1) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const D = this.doc as any
      D.setGState(new D.GState({ opacity: 1 }))
    }
  }
  strek(x1: number, y1: number, x2: number, y2: number, s?: Stil) {
    if (this.bruk({ ...s, fyll: null })) this.doc.line(x1, y1, x2, y2)
  }
  poly(pts: Array<[number, number]>, lukket: boolean, s?: Stil) {
    if (pts.length < 2) return
    const st = this.bruk(lukket ? s : { ...s, fyll: null })
    if (!st) return
    const deltas: Array<[number, number]> = []
    for (let i = 1; i < pts.length; i++) deltas.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]])
    this.doc.lines(deltas, pts[0][0], pts[0][1], [1, 1], st, lukket)
    this.nullstillOpasitet(s)
  }
  rekt(x: number, y: number, w: number, h: number, s?: Stil) {
    const st = this.bruk(s)
    if (st) this.doc.rect(x, y, w, h, st)
    this.nullstillOpasitet(s)
  }
  sirkel(cx: number, cy: number, r: number, s?: Stil) {
    const st = this.bruk(s)
    if (st) this.doc.circle(cx, cy, r, st)
    this.nullstillOpasitet(s)
  }
  private font(str: number, vekt?: 'normal' | 'bold', kursiv?: boolean) {
    const stil = vekt === 'bold' ? (kursiv ? 'bolditalic' : 'bold') : kursiv ? 'italic' : 'normal'
    this.doc.setFont('helvetica', stil)
    this.doc.setFontSize(str)
  }
  tekst(t: string, x: number, y: number, s: TekstStil) {
    const tt = sanerTekst(t)
    if (!tt) return
    this.font(s.str, s.vekt, s.kursiv)
    this.doc.setTextColor(...rgb(s.farge ?? '#000000'))
    this.doc.text(tt, x, y, {
      align: s.juster ?? 'left',
      angle: s.vinkel ?? 0,
      baseline: s.grunnlinje ?? 'alphabetic',
    })
  }
  maal(t: string, str: number, vekt?: 'normal' | 'bold') {
    this.font(str, vekt)
    return this.doc.getStringUnitWidth(sanerTekst(t)) * str * PT_MM
  }
  bilde(data: string, x: number, y: number, w: number, h: number) {
    if (!data) return
    const fmt = data.startsWith('data:image/png') ? 'PNG' : 'JPEG'
    // Alias = innholdsnøkkel → samme bilde (logo) bygges inn bare én gang.
    const alias = `img${data.length}_${data.slice(-24).replace(/[^a-zA-Z0-9]/g, '')}`
    try {
      this.doc.addImage(data, fmt, x, y, w, h, alias, 'FAST')
    } catch (e) {
      console.warn('Kunne ikke legge inn bilde i PDF', e)
    }
  }
}

export class PdfDok implements Dok {
  private klasse: typeof JsPDF
  private _doc: JsPDF | null = null
  private n = 0
  constructor(JsPDFKlasse: typeof JsPDF) {
    this.klasse = JsPDFKlasse
  }
  /** jsPDF-dokumentet (opprettes ved første side, med riktig orientering). */
  get doc(): JsPDF {
    if (!this._doc) this._doc = new this.klasse({ orientation: 'p', unit: 'mm', format: 'a4', compress: true })
    return this._doc
  }
  nySide(o: 'p' | 'l'): Flate {
    if (!this._doc) this._doc = new this.klasse({ orientation: o, unit: 'mm', format: 'a4', compress: true })
    else this._doc.addPage('a4', o)
    this.n++
    const f = o === 'p' ? new PdfFlate(this._doc, 210, 297) : new PdfFlate(this._doc, 297, 210)
    this.flater.push(f)
    return f
  }
  private flater: PdfFlate[] = []
  side(i: number): Flate {
    this.doc.setPage(i + 1)
    return this.flater[i]
  }
  get antallSider() { return this.n }
}

// ── Hjelpere ────────────────────────────────────────────────────────────

/** Bryter tekst i linjer som får plass i `maks` mm. */
export function brytTekst(f: Flate, t: string, maks: number, str: number, vekt?: 'normal' | 'bold'): string[] {
  const ut: string[] = []
  for (const avsnitt of sanerTekst(t).split('\n')) {
    const ord = avsnitt.split(/\s+/).filter(Boolean)
    let linje = ''
    for (const o of ord) {
      const prov = linje ? `${linje} ${o}` : o
      if (f.maal(prov, str, vekt) <= maks || !linje) linje = prov
      else {
        ut.push(linje)
        linje = o
      }
    }
    ut.push(linje)
  }
  return ut
}
