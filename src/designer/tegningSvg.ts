import type { Form2D, Maal2D, Riss2D, Tittelfelt } from './types'

/**
 * Ren SVG-strengbygger for 2D-arbeidstegningen. Brukes både på skjerm
 * (Tegning2DView) og i den kjøpte byggeplanen (pdf.ts), slik at tegningen er
 * identisk begge steder. Enheter er cm; y peker nedover.
 */

export const T2D = {
  MARGIN: 66,
  FIT_W: 300,
  FIT_H: 300,
  STROKE_PX: 1.7,
  THIN_PX: 0.9,
  FONT_PX: 11.5,
}

const DIM = '#2f4b63'
const DIM_EXT = '#9db2c4'
const GEO = '#161616'
const GEO_THIN = '#5c5c5c'

/** Felles målestokk (px per cm) slik at alle riss tegnes likt. */
export function fellesScale(riss: Riss2D[]): number {
  return Math.min(
    ...riss.map((r) => Math.min(T2D.FIT_W / (r.bredde + 2 * T2D.MARGIN), T2D.FIT_H / (r.hoyde + 2 * T2D.MARGIN))),
  )
}

function formSvg(f: Form2D, sw: number, tw: number): string {
  const stroke = f.tynn ? tw : sw
  const dash = f.dashed ? ` stroke-dasharray="${sw * 3} ${sw * 2}"` : ''
  if (f.type === 'rect') {
    return `<rect x="${f.x}" y="${f.y}" width="${f.w}" height="${f.h}" fill="none" stroke="${GEO}" stroke-width="${stroke}"${dash} stroke-linejoin="miter" />`
  }
  const pts = (f.points ?? []).map((p) => p.join(',')).join(' ')
  const col = f.tynn ? GEO_THIN : GEO
  return `<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="${stroke}"${dash} stroke-linejoin="miter" stroke-linecap="square" />`
}

function maalSvg(m: Maal2D, riss: Riss2D, scale: number): string {
  const off = m.offset ?? 22
  const font = T2D.FONT_PX / scale
  const tick = font * 0.55
  const gap = (T2D.THIN_PX * 2) / scale
  const w = T2D.THIN_PX / scale
  const horisontal = Math.abs(m.y1 - m.y2) < 0.001
  const L = m.label

  if (horisontal) {
    const below = m.y1 >= riss.hoyde / 2
    const y = m.y1 + (below ? off : -off)
    const midX = (m.x1 + m.x2) / 2
    return (
      `<line x1="${m.x1}" y1="${m.y1 + (below ? gap : -gap)}" x2="${m.x1}" y2="${y}" stroke="${DIM_EXT}" stroke-width="${w}" />` +
      `<line x1="${m.x2}" y1="${m.y2 + (below ? gap : -gap)}" x2="${m.x2}" y2="${y}" stroke="${DIM_EXT}" stroke-width="${w}" />` +
      `<line x1="${m.x1}" y1="${y}" x2="${m.x2}" y2="${y}" stroke="${DIM}" stroke-width="${w}" />` +
      `<line x1="${m.x1}" y1="${y - tick}" x2="${m.x1 + tick}" y2="${y + tick}" stroke="${DIM}" stroke-width="${w}" />` +
      `<line x1="${m.x2}" y1="${y - tick}" x2="${m.x2 + tick}" y2="${y + tick}" stroke="${DIM}" stroke-width="${w}" />` +
      `<text x="${midX}" y="${y + (below ? font : -font * 0.5)}" font-size="${font}" text-anchor="middle" fill="${DIM}" font-weight="700">${L}</text>`
    )
  }

  const right = m.x1 >= riss.bredde / 2
  const x = m.x1 + (right ? off : -off)
  const midY = (m.y1 + m.y2) / 2
  const tx = x + (right ? font : -font * 0.5)
  return (
    `<line x1="${m.x1 + (right ? gap : -gap)}" y1="${m.y1}" x2="${x}" y2="${m.y1}" stroke="${DIM_EXT}" stroke-width="${w}" />` +
    `<line x1="${m.x2 + (right ? gap : -gap)}" y1="${m.y2}" x2="${x}" y2="${m.y2}" stroke="${DIM_EXT}" stroke-width="${w}" />` +
    `<line x1="${x}" y1="${m.y1}" x2="${x}" y2="${m.y2}" stroke="${DIM}" stroke-width="${w}" />` +
    `<line x1="${x - tick}" y1="${m.y1}" x2="${x + tick}" y2="${m.y1 + tick}" stroke="${DIM}" stroke-width="${w}" />` +
    `<line x1="${x - tick}" y1="${m.y2}" x2="${x + tick}" y2="${m.y2 + tick}" stroke="${DIM}" stroke-width="${w}" />` +
    `<text x="${tx}" y="${midY}" font-size="${font}" text-anchor="middle" transform="rotate(-90 ${tx} ${midY})" fill="${DIM}" font-weight="700">${L}</text>`
  )
}

/**
 * Terrenglinje (planert terreng) med skravur – tegnes i bunnen av fasade-/
 * snittriss. Bakken ligger ved y = riss.hoyde (nedre kant av geometrien), og
 * linja stikker litt utenfor bygget på hver side, slik konvensjonen er.
 */
function terrengSvg(riss: Riss2D, sw: number, tw: number): string {
  const y = riss.hoyde
  const x0 = -T2D.MARGIN * 0.5
  const x1 = riss.bredde + T2D.MARGIN * 0.5
  const span = x1 - x0
  const n = 16
  const step = span / n
  const t = step * 0.7
  const linje = `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${GEO}" stroke-width="${sw}" />`
  let skravur = ''
  for (let i = 0; i < n; i++) {
    const hx = x0 + i * step + step * 0.15
    skravur += `<line x1="${hx + t}" y1="${y}" x2="${hx}" y2="${y + t}" stroke="${GEO_THIN}" stroke-width="${tw}" />`
  }
  return linje + skravur
}

/** Returnerer et komplett `<svg>` for ett riss ved gitt felles målestokk. */
export function rissSvg(riss: Riss2D, scale: number, opts?: { terreng?: boolean }): string {
  const totalW = riss.bredde + 2 * T2D.MARGIN
  const totalH = riss.hoyde + 2 * T2D.MARGIN
  const sw = T2D.STROKE_PX / scale
  const tw = T2D.THIN_PX / scale
  const font = T2D.FONT_PX / scale

  const terreng = opts?.terreng ? terrengSvg(riss, sw, tw) : ''
  const former = riss.former.map((f) => formSvg(f, sw, tw)).join('')
  const maal = riss.maal.map((m) => maalSvg(m, riss, scale)).join('')
  const tekster = (riss.tekster ?? [])
    .map((t) => `<text x="${t.x}" y="${t.y}" font-size="${font}" text-anchor="middle" fill="${DIM}" font-style="italic">${t.tekst}</text>`)
    .join('')

  return (
    `<svg width="${totalW * scale}" height="${totalH * scale}" viewBox="0 0 ${totalW} ${totalH}" style="overflow:visible" xmlns="http://www.w3.org/2000/svg">` +
    `<g transform="translate(${T2D.MARGIN}, ${T2D.MARGIN})">${terreng}${former}${maal}${tekster}</g></svg>`
  )
}

/** Velger et rundt segmentmål (cm) slik at to segmenter ≈ halve tegnebredden. */
function skalaSegmentCm(bredde: number): number {
  const target = bredde / 4
  const nice = [10, 20, 25, 50, 100, 200, 500, 1000]
  return nice.reduce((best, v) => (Math.abs(v - target) < Math.abs(best - target) ? v : best), nice[0])
}

/**
 * Grafisk målestokk-linjal ved samme px/cm som rissene. Tegnet i cm-verden slik
 * at den skaleres identisk med tegningen – forblir korrekt uansett hvor stort
 * arket skrives ut (derfor «grafisk målestokk»). Plasser i samme blokk som
 * rissene så begge resizes med samme faktor.
 */
export function skalastavSvg(scale: number, bredde: number): string {
  const seg = skalaSegmentCm(bredde)
  const n = 2
  const px = (cm: number) => cm * scale
  const pad = 10
  const h = 7
  const w = px(seg * n) + pad * 2
  const rects = Array.from({ length: n }, (_, i) =>
    `<rect x="${pad + px(seg * i)}" y="4" width="${px(seg)}" height="${h}" fill="${i % 2 ? GEO : '#fff'}" stroke="${GEO}" stroke-width="0.8" />`,
  ).join('')
  const fmt = (cm: number) => (cm >= 100 ? `${cm / 100} m` : `${cm} cm`)
  const labels = Array.from({ length: n + 1 }, (_, i) =>
    `<text x="${pad + px(seg * i)}" y="23" font-size="9" text-anchor="${i === 0 ? 'start' : i === n ? 'end' : 'middle'}" fill="${GEO}">${fmt(seg * i)}</text>`,
  ).join('')
  return `<svg width="${w}" height="27" xmlns="http://www.w3.org/2000/svg">${rects}${labels}</svg>`
}

/**
 * Tittelfelt (tegningsstempel) som HTML. Selvstendige inline-stiler så det kan
 * gjenbrukes både i byggeplanen og i søknadsheftet uten ekstern CSS. Tomme felt
 * vises som utfyllingslinje for håndutfylling før innsending.
 */
export function tittelfeltHtml(felt: Tittelfelt): string {
  const celle = (b: string, v?: string) =>
    `<div style="display:flex;flex-direction:column;gap:2px;padding:6px 10px;border-right:1px solid rgba(0,0,0,0.15);border-bottom:1px solid rgba(0,0,0,0.15);">` +
    `<b style="font-size:8px;letter-spacing:0.1em;text-transform:uppercase;color:#8a877e;font-weight:700;">${b}</b>` +
    (v
      ? `<span style="font-size:11px;font-weight:700;color:#161616;">${v}</span>`
      : `<span style="display:block;height:12px;border-bottom:1px dotted #b4b1a8;"></span>`) +
    `</div>`
  return (
    `<div style="display:grid;grid-template-columns:repeat(4,1fr);border-top:2px solid #161616;border-left:1px solid rgba(0,0,0,0.15);font-family:ui-monospace,Menlo,monospace;margin-top:10px;-webkit-print-color-adjust:exact;print-color-adjust:exact;">` +
    celle('Tiltak', felt.tiltak) +
    celle('Tegning', felt.tegningstype) +
    celle('Målestokk', felt.malestokk) +
    celle('Dato', felt.dato) +
    celle('Tiltakshaver', felt.tiltakshaver) +
    celle('Adresse', felt.adresse) +
    celle('Gnr/Bnr', felt.gnrBnr) +
    celle('Tegningsnr', felt.tegningsnr) +
    `</div>`
  )
}
