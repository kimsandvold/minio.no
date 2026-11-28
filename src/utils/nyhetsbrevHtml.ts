import type { Blokk, Kort, Nyhetsbrev, Tema } from '../types/nyhetsbrev'

/**
 * Gjør et nyhetsbrev om til e-post-HTML som tåler å bli limt inn i Mail.
 *
 * Brevet sendes ved å kopiere det herfra og lime det inn i en ny e-post i
 * Mail på Mac. Det setter strenge rammer, og hele fila er skrevet rundt dem:
 *
 *   - Mail kaster `<style>`, klasser og media queries ved innliming. ALL
 *     styling står derfor inline på hvert element.
 *   - `<body>` blir ikke med. Bakgrunnsfargen ligger på en ytre tabell.
 *   - Uten media queries kan ingenting «bytte layout» på mobil. To kort side
 *     om side er derfor inline-block med maks-bredde, så de legger seg under
 *     hverandre av seg selv når skjermen er smal.
 *   - Bildeadresser må være absolutte – mottakeren har ingen «minio.no» å
 *     regne relative stier fra.
 *
 * Forhåndsvisningen i editoren bruker samme HTML, med noen få tillegg for å
 * kunne klikke på blokkene. Tilleggene finnes bare der.
 */

export const SIDE = 'https://minio.no'
const BREDDE = 600
const INNRYKK = 32

const FARGE = {
  blekk: '#1c1a18',
  dempet: '#6b6157',
  svak: '#7a6f61',
  kant: '#e8e1d7',
  flate: '#ffffff',
}

const SANS = "-apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif"
const SERIF = "Georgia, 'Times New Roman', Times, serif"

export function absoluttUrl(url: string): string {
  const u = url.trim()
  if (!u) return ''
  if (u.startsWith('/')) return SIDE + u
  if (/^(https?:|mailto:|tel:)/i.test(u)) return u
  return 'https://' + u
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** **fet**, *kursiv*, [lenke](url); blank linje = nytt avsnitt. */
function inline(tekst: string, tema: Tema): string {
  return esc(tekst)
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t: string, u: string) =>
      `<a href="${esc(absoluttUrl(u.replace(/&amp;/g, '&')))}" style="color:${tema.aksent};text-decoration:underline;">${t}</a>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="font-weight:700;">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

function avsnitt(tekst: string, tema: Tema, stil: string): string {
  return tekst
    .trim()
    .split(/\n\s*\n/)
    .filter(Boolean)
    .map((a, i, alle) => `<p style="margin:0 0 ${i === alle.length - 1 ? 0 : 16}px 0;${stil}">${inline(a, tema)}</p>`)
    .join('')
}

const tekstStil = `font-family:${SANS};font-size:16px;line-height:1.6;color:${FARGE.blekk};`

function overskriftStil(tema: Tema, px: number): string {
  const font = tema.overskriftFont === 'serif' ? SERIF : SANS
  const vekt = tema.overskriftFont === 'serif' ? 400 : 700
  return `font-family:${font};font-size:${px}px;line-height:1.2;font-weight:${vekt};color:${FARGE.blekk};letter-spacing:-0.01em;`
}

function knapp(tekst: string, url: string, tema: Tema, stil: 'fylt' | 'omriss' = 'fylt'): string {
  if (!tekst.trim()) return ''
  const fylt = stil === 'fylt'
  // Tabell rundt lenka, fordi padding på <a> alene ikke gir klikkflate i alle klienter.
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="border-radius:999px;background:${fylt ? tema.aksent : 'transparent'};${fylt ? '' : `border:1.5px solid ${tema.aksent};`}"><a href="${esc(absoluttUrl(url))}" style="display:inline-block;padding:13px 26px;font-family:${SANS};font-size:15px;font-weight:600;line-height:1;color:${fylt ? '#ffffff' : tema.aksent};text-decoration:none;border-radius:999px;">${esc(tekst)}</a></td></tr></table>`
}

/**
 * `format` beskjærer bildet til fast sideforhold (aspect-ratio + object-fit).
 * Uten det blir to kort side om side ujevne så snart bildene har ulikt
 * format – og det er det første som får et brev til å se hjemmelaget ut.
 * Et forhold i stedet for en fast høyde gir samme utsnitt på mobil og skjerm.
 * Klienter som ikke kan aspect-ratio viser hele bildet i naturlig høyde.
 */
function bilde(url: string, alt: string, bredde: number, radius = 12, format?: string): string {
  if (!url.trim()) return ''
  const f = format ? `aspect-ratio:${format};object-fit:cover;` : ''
  return `<img src="${esc(absoluttUrl(url))}" alt="${esc(alt)}" width="${bredde}" style="display:block;width:100%;max-width:100%;height:auto;${f}border:0;border-radius:${radius}px;">`
}

function kortHtml(k: Kort, tema: Tema, bredde: number, format: string): string {
  const bildeHtml = k.bilde.trim()
    ? `<a href="${esc(absoluttUrl(k.url))}" style="text-decoration:none;">${bilde(k.bilde, k.tittel, bredde, 10, format)}</a><div style="height:14px;line-height:14px;font-size:14px;">&nbsp;</div>`
    : ''
  const lenke = k.lenkeTekst.trim()
    ? `<p style="margin:12px 0 0 0;font-family:${SANS};font-size:15px;font-weight:600;"><a href="${esc(absoluttUrl(k.url))}" style="color:${tema.aksent};text-decoration:none;">${esc(k.lenkeTekst)} &rarr;</a></p>`
    : ''
  return `${bildeHtml}<p style="margin:0 0 6px 0;${overskriftStil(tema, 20)}">${esc(k.tittel)}</p>${avsnitt(k.tekst, tema, `font-family:${SANS};font-size:15px;line-height:1.55;color:${FARGE.dempet};`)}${lenke}`
}

const INNHOLD = BREDDE - INNRYKK * 2

function blokkInnhold(b: Blokk, tema: Tema): { html: string; luft: [number, number] } {
  switch (b.type) {
    case 'hero':
      return {
        luft: [0, 8],
        html: `${b.bilde.trim() ? bilde(b.bilde, b.tittel, INNHOLD, 14, '16 / 10') + '<div style="height:28px;line-height:28px;font-size:28px;">&nbsp;</div>' : ''}<h1 style="margin:0 0 14px 0;${overskriftStil(tema, 34)}">${esc(b.tittel)}</h1>${avsnitt(b.tekst, tema, `font-family:${SANS};font-size:18px;line-height:1.55;color:${FARGE.dempet};`)}${b.knappTekst.trim() ? `<div style="height:24px;line-height:24px;font-size:24px;">&nbsp;</div>${knapp(b.knappTekst, b.knappUrl, tema)}` : ''}`,
      }
    case 'overskrift':
      return {
        luft: [b.storrelse === 'stor' ? 16 : 8, 0],
        html: b.storrelse === 'stor'
          ? `<h2 style="margin:0;${overskriftStil(tema, 26)}">${esc(b.tekst)}</h2>`
          : `<h3 style="margin:0;font-family:${SANS};font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${tema.aksent};">${esc(b.tekst)}</h3>`,
      }
    case 'tekst':
      return { luft: [0, 0], html: avsnitt(b.tekst, tema, tekstStil) }
    case 'bilde': {
      if (!b.url.trim()) {
        return { luft: [0, 0], html: `<div style="padding:48px 0;text-align:center;border:1.5px dashed ${FARGE.kant};border-radius:12px;font-family:${SANS};font-size:14px;color:${FARGE.svak};">Bilde – lim inn en adresse</div>` }
      }
      const img = bilde(b.url, b.alt, INNHOLD)
      const lenket = b.lenke.trim() ? `<a href="${esc(absoluttUrl(b.lenke))}" style="text-decoration:none;">${img}</a>` : img
      const tekst = b.bildetekst.trim()
        ? `<p style="margin:10px 0 0 0;font-family:${SANS};font-size:13px;line-height:1.5;color:${FARGE.svak};">${inline(b.bildetekst, tema)}</p>`
        : ''
      return { luft: [0, 0], html: lenket + tekst }
    }
    case 'knapp':
      return { luft: [4, 4], html: knapp(b.tekst, b.url, tema, b.stil) }
    case 'kort':
      return {
        luft: [0, 0],
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td style="padding:20px;border:1px solid ${FARGE.kant};border-radius:14px;">${kortHtml(b, tema, INNHOLD - 40, '16 / 9')}</td></tr></table>`,
      }
    case 'kortpar': {
      const halv = Math.floor(INNHOLD / 2)
      /*
       * «Fluid hybrid» uten media queries: bredden regnes ut av calc() til
       * enten et stort negativt tall (bred skjerm → min-width 50 % vinner, to
       * spalter) eller et stort positivt tall (smal skjerm → max-width 100 %
       * vinner, én spalte). Begge spaltene har samme innvendige luft, så de
       * står på linje også når de er stablet. Klienter uten calc() faller
       * tilbake til min-width 50 %, altså to spalter.
       */
      const kol = (k: Kort) =>
        `<div style="display:inline-block;vertical-align:top;box-sizing:border-box;min-width:50%;max-width:100%;width:calc((480px - 100%) * 1000);padding:0 8px 24px 8px;text-align:left;font-size:16px;">${kortHtml(k, tema, halv - 16, '4 / 3')}</div>`
      return {
        luft: [0, 0],
        html: `<div style="font-size:0;text-align:left;margin:0 -8px -24px -8px;">${kol(b.venstre)}${kol(b.hoyre)}</div>`,
      }
    }
    case 'sitat':
      return {
        luft: [8, 8],
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-left:3px solid ${tema.aksent};padding:4px 0 4px 20px;"><p style="margin:0;font-family:${SERIF};font-size:22px;line-height:1.45;font-style:italic;color:${FARGE.blekk};">${inline(b.tekst, tema)}</p>${b.kilde.trim() ? `<p style="margin:10px 0 0 0;font-family:${SANS};font-size:14px;color:${FARGE.svak};">— ${esc(b.kilde)}</p>` : ''}</td></tr></table>`,
      }
    case 'skille':
      return {
        luft: [8, 8],
        html: `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:1px solid ${FARGE.kant};font-size:1px;line-height:1px;height:1px;">&nbsp;</td></tr></table>`,
      }
    case 'avstand':
      return { luft: [0, 0], html: `<div style="height:${b.hoyde}px;line-height:${b.hoyde}px;font-size:${b.hoyde}px;">&nbsp;</div>` }
  }
}

export interface RenderValg {
  /** Legger på data-attributter så forhåndsvisningen kan velge blokker. */
  forhandsvisning?: boolean
  valgt?: string | null
}

/**
 * Selve brevet: én ytre tabell med bakgrunn, og et hvitt ark på 600 px.
 * Det er DETTE som kopieres til Mail.
 */
export function brevHtml(brev: Nyhetsbrev, valg: RenderValg = {}): string {
  const { tema } = brev
  const rader = brev.blokker
    .map((b, i) => {
      const { html, luft } = blokkInnhold(b, tema)
      const topp = (i === 0 ? 0 : 24) + luft[0]
      const attr = valg.forhandsvisning
        ? ` data-blokk="${b.id}"${valg.valgt === b.id ? ' data-valgt="1"' : ''}`
        : ''
      return `<tr${attr}><td style="padding:${topp}px ${INNRYKK}px ${luft[1]}px ${INNRYKK}px;">${html}</td></tr>`
    })
    .join('')

  const logo = tema.visLogo
    ? `<tr><td style="padding:30px ${INNRYKK}px 26px ${INNRYKK}px;"><a href="${SIDE}" style="text-decoration:none;"><img src="${SIDE}/images/branding/logo_epost.png" alt="Minio" width="120" style="display:block;width:120px;height:auto;border:0;"></a></td></tr>`
    : ''

  const bunn = `<tr><td style="padding:24px ${INNRYKK}px 8px ${INNRYKK}px;text-align:center;">${avsnitt(brev.bunntekst, tema, `font-family:${SANS};font-size:12px;line-height:1.6;color:${FARGE.svak};`)}<p style="margin:10px 0 0 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${FARGE.svak};"><a href="${SIDE}" style="color:${FARGE.svak};text-decoration:underline;">minio.no</a></p></td></tr>`

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${tema.bakgrunn}" style="width:100%;background-color:${tema.bakgrunn};border-collapse:collapse;"><tr><td align="center" style="padding:32px 12px;"><table role="presentation" width="${BREDDE}" cellpadding="0" cellspacing="0" border="0" bgcolor="${FARGE.flate}" style="width:100%;max-width:${BREDDE}px;background-color:${FARGE.flate};border-radius:18px;border-collapse:separate;">${logo}${rader}<tr><td style="height:40px;line-height:40px;font-size:40px;">&nbsp;</td></tr></table><table role="presentation" width="${BREDDE}" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${BREDDE}px;">${bunn}</table></td></tr></table>`
}

/** Hele dokumentet – til nedlasting og til forhåndsvisningens iframe. */
export function dokumentHtml(brev: Nyhetsbrev, valg: RenderValg = {}): string {
  const ekstra = valg.forhandsvisning
    ? `<style>
        [data-blokk]{cursor:pointer;transition:box-shadow .12s}
        [data-blokk]:hover>td{box-shadow:inset 0 0 0 1.5px rgba(168,81,44,.35)}
        [data-valgt]>td{box-shadow:inset 0 0 0 2px ${brev.tema.aksent}!important}
        a{pointer-events:none}
      </style>
      <script>
        document.addEventListener('click',function(e){
          var r=e.target.closest('[data-blokk]');
          parent.postMessage({nyhetsbrevBlokk:r?r.getAttribute('data-blokk'):null},'*');
        });
      </script>`
    : ''
  return `<!doctype html><html lang="nb"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(brev.emne)}</title>${ekstra}</head><body style="margin:0;padding:0;background-color:${brev.tema.bakgrunn};">${brevHtml(brev, valg)}</body></html>`
}

/** Ren tekst-versjon. Legges ved på utklippstavla sammen med HTML-en. */
export function brevTekst(brev: Nyhetsbrev): string {
  const ren = (s: string) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1').replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
  const deler: string[] = []
  const kort = (k: Kort) => [k.tittel, ren(k.tekst), k.url ? `${k.lenkeTekst || 'Les mer'}: ${absoluttUrl(k.url)}` : ''].filter(Boolean).join('\n')
  for (const b of brev.blokker) {
    if (b.type === 'hero') deler.push([b.tittel, ren(b.tekst), b.knappTekst ? `${b.knappTekst}: ${absoluttUrl(b.knappUrl)}` : ''].filter(Boolean).join('\n\n'))
    else if (b.type === 'overskrift') deler.push(b.tekst)
    else if (b.type === 'tekst') deler.push(ren(b.tekst))
    else if (b.type === 'bilde' && b.bildetekst) deler.push(ren(b.bildetekst))
    else if (b.type === 'knapp') deler.push(`${b.tekst}: ${absoluttUrl(b.url)}`)
    else if (b.type === 'kort') deler.push(kort(b))
    else if (b.type === 'kortpar') deler.push(kort(b.venstre), kort(b.hoyre))
    else if (b.type === 'sitat') deler.push(`«${ren(b.tekst)}»${b.kilde ? ` — ${b.kilde}` : ''}`)
    else if (b.type === 'skille') deler.push('—')
  }
  deler.push(brev.bunntekst, SIDE)
  return deler.join('\n\n')
}
