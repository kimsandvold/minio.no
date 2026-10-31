/**
 * Byggeplan (PDF) – vektorbasert.
 *
 * Planen tegnes direkte med jsPDF-primitiver (linjer, polygoner, tekst) via
 * `plan-ark.ts`, så tegningene er skarpe i ekte målestokk, teksten er søkbar
 * og filen blir liten. Den samme komposisjonen tegnes som SVG til
 * forhåndsvisningen i designverktøyet (`planForhandsvisning`).
 *
 * jsPDF (~350 kB) lastes først når noen faktisk lager en PDF. html2canvas
 * brukes bare av det (midlertidig avsluttede) byggesøknad-heftet nederst.
 */
async function lastPdfBiblioteker() {
  const [{ jsPDF }, { default: html2canvas }] = await Promise.all([import('jspdf'), import('html2canvas')])
  return { jsPDF, html2canvas }
}
import type { Bom, Byggeregler, DesignConfig, KapplisteDel, ProductTemplate, Riss2D, Tegning2D, Tittelfelt } from './types'
import { T2D, rissSvg, skalastavSvg, tittelfeltHtml } from './tegningSvg'
import { PdfDok, SvgDok } from './plan-flate'
import { byggPlan, lagPlanId, type PlanInn } from './plan-ark'
import { lesModell } from './plan-modell'
import { hentBeregningsgrunnlag, type MonteringSteg, type ProductTemplateMedPlan } from './plan-typer'

export interface PlanArgs {
  template: ProductTemplate
  config: DesignConfig
  bom: Bom
  /** Brukerens navn på designet (vises på forsiden + i tegningshodet). */
  designNavn?: string
  /** Tiltakshaver (kundens navn) til forside og tegningshode. */
  kunde?: string
  montering?: string[]
  deler?: KapplisteDel[]
  raad?: string[]
  byggeregler?: Byggeregler
  images?: {
    assembled?: string
    exploded?: string
    /** Modellen etter hvert byggetrinn (fra DesignerViewport.snapshotTrinn). */
    trinn?: Array<{ trinn: number; bilde: string }>
  }
  /** Templatets riss (søknadssettet foretrekkes). */
  tegning?: Tegning2D
  /** «Etikett: verdi»-linjer med alle valg (konfigTekst). */
  konfig?: string[]
  arbeidstimer?: number
}

// ── Bilder ──────────────────────────────────────────────────────────────

let logoCache: Promise<{ data: string; forhold: number } | null> | null = null

/** Minio-logoen i mørk utgave som PNG (navbar-logoen er lys grå). */
function hentLogo(): Promise<{ data: string; forhold: number } | null> {
  if (logoCache) return logoCache
  logoCache = (async () => {
    try {
      const svg = await (await fetch('/images/branding/logo_navbar.svg')).text()
      const mork = svg.replace(/#C4C4C4/gi, '#26282c')
      const url = URL.createObjectURL(new Blob([mork], { type: 'image/svg+xml' }))
      const img = new Image()
      await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('logo')); img.src = url })
      const w = 1090
      const h = Math.round((w * (img.naturalHeight || 148)) / (img.naturalWidth || 545))
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d')!.drawImage(img, 0, 0, w, h)
      URL.revokeObjectURL(url)
      return { data: c.toDataURL('image/png'), forhold: w / h }
    } catch {
      return null
    }
  })()
  return logoCache
}

/**
 * Gjør et PNG-snapshot (gjennomsiktig bakgrunn) om til JPEG på lys flate,
 * nedskalert – holder PDF-en liten uten synlig kvalitetstap.
 */
async function tilJpeg(data: string | undefined, maksBredde = 1500, bakgrunn = '#f2f1ee', lysOpp = true): Promise<string | undefined> {
  if (!data) return undefined
  try {
    const img = new Image()
    await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = () => rej(new Error('bilde')); img.src = data })
    const s = Math.min(1, maksBredde / (img.naturalWidth || maksBredde))
    const c = document.createElement('canvas')
    c.width = Math.max(1, Math.round(img.naturalWidth * s))
    c.height = Math.max(1, Math.round(img.naturalHeight * s))
    const ctx = c.getContext('2d')!
    ctx.drawImage(img, 0, 0, c.width, c.height)
    if (lysOpp) eksponer(ctx, c.width, c.height)
    // Legg den (ev. lysnede) modellen på lys bakgrunn.
    ctx.globalCompositeOperation = 'destination-over'
    ctx.fillStyle = bakgrunn
    ctx.fillRect(0, 0, c.width, c.height)
    ctx.globalCompositeOperation = 'source-over'
    return c.toDataURL('image/jpeg', 0.86)
  } catch {
    return undefined
  }
}

/**
 * Automatisk eksponering for PDF-renderet: mørkbeisede modeller (f.eks. svart
 * vedskjul) blir nesten svarte på papir. Måler snitt-luminansen til de synlige
 * (ikke-gjennomsiktige) pikslene og løfter mellomtonene med en gamma-kurve
 * til snittet er ca. 0,35. Lyse modeller røres ikke. Påvirker bare PDF-bildet.
 */
function eksponer(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const d = ctx.getImageData(0, 0, w, h)
  const p = d.data
  let sum = 0
  let n = 0
  for (let i = 0; i < p.length; i += 16) {
    if (p[i + 3] < 200) continue
    sum += (0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2]) / 255
    n++
  }
  if (n < 100) return
  const snitt = sum / n
  const MAAL = 0.35
  if (snitt >= MAAL - 0.02) return
  const g = Math.max(0.5, Math.log(MAAL) / Math.log(Math.max(0.02, snitt)))
  const lut = new Uint8ClampedArray(256)
  for (let v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(v / 255, g))
  for (let i = 0; i < p.length; i += 4) {
    if (p[i + 3] === 0) continue
    p[i] = lut[p[i]]
    p[i + 1] = lut[p[i + 1]]
    p[i + 2] = lut[p[i + 2]]
  }
  ctx.putImageData(d, 0, 0)
}

// ── Komposisjon ─────────────────────────────────────────────────────────

async function lagPlanInn(a: PlanArgs, laast: boolean): Promise<PlanInn> {
  const { template, config, bom } = a
  const cfg = { ...template.defaultConfig, ...config }
  const [logo, forside, ...trinn] = await Promise.all([
    hentLogo(),
    tilJpeg(a.images?.assembled, 1800),
    ...(a.images?.trinn ?? []).map((t) => tilJpeg(t.bilde, 1000)),
  ])
  const modellRot = template.buildMesh(cfg)
  const modell = lesModell(modellRot)
  // Frigjør GPU-ressurser som ble laget (geometri/materialer) – modellen er bare lest.
  modellRot.traverse((o) => {
    const m = o as unknown as { geometry?: { dispose(): void }; material?: { dispose(): void } | Array<{ dispose(): void }> }
    m.geometry?.dispose()
    const mats = Array.isArray(m.material) ? m.material : m.material ? [m.material] : []
    mats.forEach((x) => x.dispose())
  })
  const monteringPlan: MonteringSteg[] | undefined = (template as ProductTemplateMedPlan).monteringPlan?.(cfg)
  return {
    template,
    config: cfg,
    bom,
    tittel: a.designNavn?.trim() || template.navn,
    kunde: a.kunde,
    planId: lagPlanId(template.id, cfg),
    revisjon: 'A',
    dato: new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' }),
    deler: a.deler ?? template.kappliste?.(cfg) ?? [],
    montering: a.montering ?? template.montering?.(cfg) ?? [],
    monteringPlan,
    raad: a.raad ?? template.raad?.(cfg) ?? [],
    byggeregler: a.byggeregler ?? template.byggeregler?.(cfg),
    beregning: hentBeregningsgrunnlag(template, cfg),
    tegning: a.tegning ?? template.soknadTegning?.(cfg) ?? template.tegning2D?.(cfg),
    modell,
    bilder: {
      forside,
      trinn: (a.images?.trinn ?? []).map((t, i) => ({ trinn: t.trinn, bilde: trinn[i] ?? '' })).filter((t) => t.bilde),
      logo: logo?.data,
      logoForhold: logo?.forhold,
    },
    konfig: a.konfig ?? [],
    arbeidstimer: a.arbeidstimer ?? bom.arbeidstimer,
    laast,
  }
}

const filnavn = (a: PlanArgs, planId: string) => `byggeplan-${String(a.template.id)}-${planId}.pdf`

async function lagPdf(a: PlanArgs) {
  const [{ jsPDF }, inn] = await Promise.all([import('jspdf'), lagPlanInn(a, false)])
  const { dok } = byggPlan(() => new PdfDok(jsPDF), inn)
  dok.doc.setProperties({
    title: `Byggeplan – ${inn.tittel}`,
    subject: `${a.template.navn} · ${inn.planId}`,
    author: 'Minio designverktøy',
    creator: 'minio.no',
    keywords: 'byggeplan, materialliste, kappliste, tegninger',
  })
  return { doc: dok.doc, inn }
}

/** Lager byggeplanen som PDF og laster den ned. */
export async function planPdf(a: PlanArgs) {
  const { doc, inn } = await lagPdf(a)
  doc.save(filnavn(a, inn.planId))
}

/** Byggeplanen som Blob (til vedlegg/opplasting og automatiske tester). */
export async function planPdfBlob(a: PlanArgs): Promise<{ blob: Blob; filnavn: string }> {
  const { doc, inn } = await lagPdf(a)
  return { blob: doc.output('blob'), filnavn: filnavn(a, inn.planId) }
}

/**
 * Åpner PDF-en i ny fane for utskrift. Fanen åpnes synkront (før PDF-en er
 * ferdig) så nettleseren ikke blokkerer den som popup.
 */
export function planUtskrift(a: PlanArgs) {
  const win = window.open('', '_blank')
  void (async () => {
    const { doc, inn } = await lagPdf(a)
    const url = URL.createObjectURL(doc.output('blob'))
    if (win) win.location.href = url
    else doc.save(filnavn(a, inn.planId))
    setTimeout(() => URL.revokeObjectURL(url), 120000)
  })()
}

/**
 * Forhåndsvisning: de samme sidene som SVG-strenger. `laast` skjuler tall
 * (mengder, lengder, mål) så kunden ser hva hun får uten å få planen gratis.
 */
export interface ForhandsvisningSide {
  svg: string
  navn: string
  type: 'forside' | 'info' | 'ark' | 'tekst'
}

export async function planForhandsvisning(a: PlanArgs, laast: boolean): Promise<ForhandsvisningSide[]> {
  const inn = await lagPlanInn(a, laast)
  const { dok, res } = byggPlan(() => new SvgDok(), inn)
  return dok.svgSider().map((svg, i) => ({ svg, navn: res.sider[i]?.navn ?? `Side ${i + 1}`, type: res.sider[i]?.type ?? 'tekst' }))
}

// ═══════════════════════════════════════════════════════════════════
// Byggesøknad – tegningshefte
// Selvstendig, søknadsklart hefte: forside, byggeregel-sammendrag,
// situasjonsplan-veiledning og ett målsatt riss (plan/fasade/snitt) per
// side med tittelfelt og grafisk målestokk. Minio er ikke ansvarlig søker –
// tiltakshaver fyller ut, signerer og sender inn selv.
// ═══════════════════════════════════════════════════════════════════

export interface SoknadArgs {
  template: ProductTemplate
  config: DesignConfig
  /** Søknadssettet fra `template.soknadTegning()`. */
  tegning: Tegning2D
  byggeregler?: Byggeregler
  arealM2?: number
  designNavn?: string
  images?: { assembled?: string }
  /** Forhåndsutfylte tittelfelt-data (blanke felt tegnes som utfyllingslinje). */
  felt?: Partial<Pick<Tittelfelt, 'tiltakshaver' | 'adresse' | 'gnrBnr' | 'kommune'>>
}

const ANSVAR =
  'Veiledende tegninger. Minio er ikke ansvarlig søker. Du er selv ansvarlig for at mål, areal og høyder stemmer, og for at tiltaket følger kommunens krav, reguleringsplan og TEK17. Kontroller alt før innsending.'

/** Skala som fyller en A4-side for ett enkelt riss. */
function arkScale(riss: Riss2D): number {
  return Math.min(720 / (riss.bredde + 2 * T2D.MARGIN), 900 / (riss.hoyde + 2 * T2D.MARGIN))
}

function buildSoknadHtml(a: SoknadArgs, forPrint: boolean): string {
  const { template, tegning } = a
  const tittel = a.designNavn?.trim() || template.navn
  const tiltak = `${template.navn}${a.arealM2 ? ` ${a.arealM2.toFixed(1)} m²` : ''}`
  const origin = window.location.origin
  const logo = `${origin}/images/branding/logo_navbar.webp`
  const dato = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  const b = a.byggeregler
  const felt = a.felt ?? {}

  const stempel = (riss: Riss2D, i: number) =>
    tittelfeltHtml({
      tiltak,
      tegningstype: riss.navn,
      malestokk: 'Grafisk (se linjal)',
      dato,
      tegningsnr: `A-${String(i + 1).padStart(2, '0')}`,
      tiltakshaver: felt.tiltakshaver,
      adresse: felt.adresse,
      gnrBnr: felt.gnrBnr,
    })

  // Ett riss per side med tittelfelt + målestokk-linjal.
  const rissArk = tegning.riss
    .map((r, i) => {
      const scale = arkScale(r)
      const svg = rissSvg(r, scale, { terreng: r.type === 'fasade' || r.type === 'snitt' })
      const stav = skalastavSvg(scale, r.bredde)
      return `
  <section class="ark">
    <div class="ark-inner">
      <div class="ark-tegn">${svg}</div>
      <div class="ark-bunn">
        <div class="skalastav"><span>Grafisk målestokk</span>${stav}</div>
        ${stempel(r, i)}
      </div>
    </div>
  </section>`
    })
    .join('')

  const byggeregelArk = b
    ? `
  <section class="ark">
    <div class="ark-inner info">
      <div class="ark-head"><img src="${logo}" alt="Minio" /><span>Byggesøknad · sammendrag</span></div>
      <h2 class="ark-h2">Mål mot byggereglene</h2>
      <div class="status ${b.sokfri ? 'ok' : 'krev'}">${b.sokfri ? '✓ ' : '⚠ '}${b.tittel}</div>
      <ul class="punkter">${b.punkter.map((p) => `<li>${p}</li>`).join('')}</ul>
      <div class="fakta">
        ${a.arealM2 ? `<div><small>Grunnflate</small><b>${a.arealM2.toFixed(1)} m²</b></div>` : ''}
        <div><small>Tiltak</small><b>${tiltak}</b></div>
        <div><small>Dato</small><b>${dato}</b></div>
      </div>
      <p class="ansvar">${ANSVAR}</p>
    </div>
  </section>`
    : ''

  const situasjonArk = `
  <section class="ark">
    <div class="ark-inner info">
      <div class="ark-head"><img src="${logo}" alt="Minio" /><span>Byggesøknad · situasjonsplan</span></div>
      <h2 class="ark-h2">Situasjonsplan – slik lager du den</h2>
      <p class="brod">Situasjonsplanen viser bygget plassert på din eiendom, med avstand til nabogrenser. Den kan ikke lages automatisk – du henter et kartutsnitt fra kommunen selv:</p>
      <ol class="steg">
        <li><span class="stegnr">1</span><span>Gå til kommunens kartløsning (f.eks. <b>kommunekart.com</b> eller <b>seeiendom.kartverket.no</b>) og finn din eiendom.</span></li>
        <li><span class="stegnr">2</span><span>Skriv ut / lagre et kartutsnitt i målestokk <b>1:500</b> og lim det inn i feltet under.</span></li>
        <li><span class="stegnr">3</span><span>Tegn inn bygget (${tiltak}) der det skal stå, og før på <b>avstand til nabogrense</b> på alle sider – minst <b>1,0 m</b> for å være unntatt søknad.</span></li>
        <li><span class="stegnr">4</span><span>Marker nord-pil og eksisterende bygninger på tomta.</span></li>
      </ol>
      <div class="kartboks"><span>Lim inn kartutsnitt (1:500) her</span></div>
      <p class="ansvar">${ANSVAR}</p>
    </div>
  </section>`

  const forside = `
  <section class="ark">
    <div class="ark-inner cover">
      <img class="cover-logo" src="${logo}" alt="Minio" />
      <div class="cover-kicker">Byggesøknad · tegningshefte</div>
      <h1 class="cover-title">${tittel}</h1>
      <div class="cover-sub">${tiltak}</div>
      ${a.images?.assembled ? `<img class="cover-hero" src="${a.images.assembled}" alt="${template.navn}" />` : ''}
      <div class="cover-rule"></div>
      <div class="cover-innhold">
        Heftet inneholder: sammendrag mot byggereglene · situasjonsplan-veiledning · plan · fasader · snitt.
        Fyll ut tittelfeltene (tiltakshaver, adresse, gnr/bnr) før innsending.
      </div>
      <div class="cover-foot"><span>${dato}</span><span>minio.no</span></div>
      <p class="ansvar cover-ansvar">${ANSVAR}</p>
    </div>
  </section>`

  return `<!doctype html>
<html lang="nb"><head><meta charset="utf-8" /><title>Byggesøknad – ${template.navn} – Minio</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; background: #6b6f76; }
  .ark { width: 794px; min-height: 1123px; margin: 0 auto; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .ark-inner { box-sizing: border-box; height: 1123px; border: 2px solid #161616; margin: 24px; padding: 28px; display: flex; flex-direction: column; }
  .ark-tegn { flex: 1; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .ark-tegn svg { max-width: 100%; height: auto; }
  .ark-bunn { flex-shrink: 0; }
  .skalastav { display: flex; align-items: center; gap: 10px; margin: 8px 0; }
  .skalastav span { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; }
  .ark-head { display: flex; align-items: center; justify-content: space-between; border-bottom: 2px solid #161616; padding-bottom: 12px; margin-bottom: 20px; }
  .ark-head img { height: 30px; }
  .ark-head span { font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; color: #6b6860; font-weight: 700; }
  .ark-h2 { font-size: 26px; margin: 0 0 18px; }
  .status { display: inline-block; font-weight: 800; font-size: 16px; padding: 10px 16px; border-radius: 10px; margin-bottom: 18px; }
  .status.ok { background: rgba(123,156,123,0.16); color: #3f6b3f; }
  .status.krev { background: rgba(200,120,60,0.16); color: #9a5a20; }
  .punkter { padding-left: 20px; margin: 0 0 22px; } .punkter li { font-size: 14px; padding: 5px 0; line-height: 1.5; }
  .fakta { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 20px; }
  .fakta div { border: 1px solid #e5e5e5; border-radius: 10px; padding: 10px 16px; }
  .fakta small { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #999; }
  .fakta b { font-size: 17px; }
  .brod { font-size: 14px; color: #333; line-height: 1.6; margin: 0 0 16px; }
  ol.steg { list-style: none; padding: 0; margin: 0 0 22px; }
  ol.steg li { display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  .stegnr { flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; background: #202020; color: #fff; font-size: 13px; font-weight: 700; display: flex; align-items: center; justify-content: center; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .kartboks { flex: 1; min-height: 380px; border: 2px dashed #b4b1a8; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 18px; }
  .kartboks span { font-size: 13px; letter-spacing: 0.1em; text-transform: uppercase; color: #b4b1a8; }
  .ansvar { font-size: 10.5px; color: #8a877e; line-height: 1.55; border-top: 1px solid #eee; padding-top: 10px; margin: auto 0 0; }
  .cover { align-items: center; justify-content: center; text-align: center; }
  .cover-logo { height: 60px; margin-bottom: 36px; }
  .cover-kicker { font-size: 12px; letter-spacing: 0.42em; text-transform: uppercase; color: rgba(0,0,0,0.5); margin-bottom: 14px; }
  .cover-title { font-size: 46px; font-weight: 800; margin: 0 0 12px; }
  .cover-sub { font-size: 16px; color: rgba(0,0,0,0.6); margin-bottom: 26px; }
  .cover-hero { width: 92%; max-height: 460px; object-fit: contain; }
  .cover-rule { width: 54px; height: 3px; background: #7b9c7b; border-radius: 3px; margin: 28px 0 20px; }
  .cover-innhold { font-size: 13px; color: #555; max-width: 520px; line-height: 1.6; margin-bottom: 22px; }
  .cover-foot { display: flex; gap: 26px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(0,0,0,0.45); }
  .cover-ansvar { max-width: 560px; text-align: center; border-top: none; }
  @media print { body { background: #fff; } .ark { margin: 0; } .ark-inner { margin: 12mm; height: auto; min-height: calc(297mm - 24mm); } .ark { break-after: page; } }
</style></head>
<body>
  ${forside}
  ${byggeregelArk}
  ${situasjonArk}
  ${rissArk}
  ${forPrint ? '<script>window.onload = function () { window.focus(); window.print(); };</script>' : ''}
</body></html>`
}

/** Åpner søknadsheftet i ny fane og starter utskrift. */
export function byggesoknadUtskrift(a: SoknadArgs) {
  const html = buildSoknadHtml(a, true)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) { URL.revokeObjectURL(url); return }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/** Genererer søknadsheftet som PDF – én A4-side per ark. */
export async function byggesoknadPdf(a: SoknadArgs) {
  const biblioteker = lastPdfBiblioteker()
  const html = buildSoknadHtml(a, false)
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:820px;height:1160px;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html)
  doc.close()

  await new Promise<void>((res) => {
    const imgs = Array.from(doc.images)
    let pending = imgs.filter((im) => !im.complete).length
    if (pending === 0) { res(); return }
    imgs.forEach((im) => {
      if (im.complete) return
      im.addEventListener('load', () => { if (--pending === 0) res() })
      im.addEventListener('error', () => { if (--pending === 0) res() })
    })
    setTimeout(res, 4000)
  })

  const { jsPDF, html2canvas } = await biblioteker
  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pw = 210
  const ph = 297
  const opts = { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 820 } as const
  const arks = Array.from(doc.querySelectorAll('.ark')) as HTMLElement[]
  for (let i = 0; i < arks.length; i++) {
    if (i > 0) pdf.addPage()
    const c = await html2canvas(arks[i], opts)
    const img = c.toDataURL('image/jpeg', 0.92)
    const imgH = (c.height * pw) / c.width
    if (imgH <= ph) pdf.addImage(img, 'JPEG', 0, (ph - imgH) / 2, pw, imgH)
    else { const w = (c.width * ph) / c.height; pdf.addImage(img, 'JPEG', (pw - w) / 2, 0, w, ph) }
  }
  document.body.removeChild(iframe)
  pdf.save(`byggesoknad-${String(a.template.id)}.pdf`)
}
