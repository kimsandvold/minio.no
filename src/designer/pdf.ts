import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import type { Bom, Byggeregler, DesignConfig, KapplisteDel, ProductTemplate, Riss2D, Tegning2D, Tittelfelt } from './types'
import { T2D, fellesScale, rissSvg, skalastavSvg, tittelfeltHtml } from './tegningSvg'

const formatKr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

export interface PlanArgs {
  template: ProductTemplate
  config: DesignConfig
  bom: Bom
  /** Brukerens navn på designet (vises på forsiden + i header). */
  designNavn?: string
  montering?: string[]
  deler?: KapplisteDel[]
  raad?: string[]
  images?: { assembled?: string; exploded?: string }
  /** Målsatt 2D-arbeidstegning (plan/oppriss). */
  tegning?: Tegning2D
}

const profilHoyde = (p: string) => {
  const nums = (p.match(/\d+/g) ?? ['48']).map(Number)
  return Math.max(...nums) / 10 // mm → cm (største profilmål)
}

/**
 * Genererer en komplett, utskriftsvennlig byggeplan (PDF via nettleserens
 * «Lagre som PDF»): beskrivelse, mål, 3D-bilde, handleliste, kappliste med
 * målestokk-tegning, monteringsanvisning og sammenføyningsråd. Kjøres kun
 * etter opplåsing – dette er verdien kunden betaler for.
 */
function buildPlanHtml(a: PlanArgs, forPrint: boolean): string {
  const { template, config, bom } = a
  const tittel = a.designNavn?.trim() || template.navn
  const montering = a.montering ?? []
  const deler = a.deler ?? []
  const raad = a.raad ?? []
  const images = a.images ?? {}
  const origin = window.location.origin
  const logo = `${origin}/images/branding/logo_navbar.webp` // mørk/farget – for lys forside
  const logoWhite = `${origin}/images/branding/logo_icon_white.webp` // hvit – for mørk header
  const dato = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })

  // Fallback: bruk gjeldende canvas hvis ingen montert-bilde ble sendt inn.
  let assembledImg = images.assembled ?? ''
  const explodedImg = images.exploded ?? ''
  if (!assembledImg) {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      try { assembledImg = canvas.toDataURL('image/png') } catch { assembledImg = '' }
    }
  }

  // html2canvas dropper enkelte mellomrom i fete tekster (sub-pixel-feil).
  // Fete kolonner med mellomrom (materialnavn) beskyttes med harde mellomrom.
  const nb = (s: string) => s.replace(/ /g, ' ')

  const bomRad = (l: Bom['linjer'][number], i: number) => `
    <tr>
      <td class="nr">${i + 1}</td>
      <td><strong>${nb(l.navn)}</strong></td>
      <td>${l.spesifikasjon ?? '—'}</td>
      <td class="num">${l.antall} ${l.enhet}</td>
      <td class="cmt">${l.kommentar ?? ''}</td>
    </tr>`

  const letter = (i: number) => String.fromCharCode(65 + i)
  const delRad = (d: KapplisteDel, i: number) => `
    <tr>
      <td><span class="merke">${letter(i)}</span></td>
      <td><strong>${nb(d.navn)}</strong></td>
      <td>${d.profil}</td>
      <td class="num">${d.lengdeCm} cm</td>
      <td class="num">${d.antall} stk</td>
    </tr>`

  // Målestokk-tegning av delene (til skala, HTML-barer).
  const maxCm = Math.max(...deler.map((d) => d.lengdeCm), 1)
  const pxPerCm = Math.min(5, 470 / maxCm)
  const delTegning = deler
    .map((d, i) => {
      const w = Math.round(Math.max(10, d.lengdeCm * pxPerCm))
      const h = Math.round(Math.max(6, profilHoyde(d.profil) * pxPerCm))
      const miter = d.navn.toLowerCase().includes('topplist')
      // Inline SVG (html2canvas støtter ikke CSS clip-path) – gjæret = trapes.
      const svgH = miter ? h + 15 : h
      const label = miter && w > 90
        ? `<text x="4" y="${h + 12}" font-size="9" fill="#8a6a3f">45°</text><text x="${w - 24}" y="${h + 12}" font-size="9" fill="#8a6a3f">45°</text>`
        : ''
      const shape = miter
        ? `<polygon points="0,0 ${w},0 ${w - h},${h} ${h},${h}" fill="#bd9563" stroke="#8a6a3f" stroke-width="1" />${label}`
        : `<rect x="0.5" y="0.5" width="${w - 1}" height="${h - 1}" rx="2" fill="#bd9563" stroke="#8a6a3f" stroke-width="1" />`
      return `
        <div class="del">
          <div class="del-topp"><span class="merke">${letter(i)}</span> <strong>${d.navn}</strong> <span>${d.profil} · ${d.lengdeCm} cm · ${d.antall} stk</span></div>
          <svg class="del-bar" width="${w}" height="${svgH}" viewBox="0 0 ${w} ${svgH}">${shape}</svg>
        </div>`
    })
    .join('')

  // Arbeidstegning – målsatte 2D-riss (samme SVG-bygger som skjermvisningen).
  const tegningHtml = (() => {
    const t = a.tegning
    if (!t || t.riss.length === 0) return ''
    const scale = fellesScale(t.riss)
    // Klassifiserte riss (type satt) = søknadsklar mal → terrenglinje på
    // fasader, grafisk målestokk-linjal og tittelfelt. Andre templater beholder
    // det rene arbeidsrisset uendret.
    const byggesok = t.riss.some((r) => r.type)
    const riss = t.riss
      .map((r) => `<figure class="riss"><div class="riss-svg">${rissSvg(r, scale, { terreng: r.type === 'fasade' })}</div><figcaption>${r.navn}</figcaption></figure>`)
      .join('')
    if (!byggesok) {
      return `
  <div class="pblock">
    <h2>Arbeidstegning – plan &amp; oppriss</h2>
    <div class="tegning">${riss}</div>
    <p class="figcap">Målsatt arbeidstegning generert fra dine valgte mål. Alle mål i cm. Kontroller mot faktisk trelast før kapping.</p>
  </div>`
    }
    const maxBredde = Math.max(...t.riss.map((r) => r.bredde), 1)
    const stav = skalastavSvg(scale, maxBredde)
    const stempel = tittelfeltHtml({
      tiltak: tittel,
      tegningstype: 'Plan, fasader & snitt',
      malestokk: 'Grafisk (se linjal)',
      dato,
      tiltakshaver: undefined,
      adresse: undefined,
      gnrBnr: undefined,
      tegningsnr: undefined,
    })
    return `
  <div class="pblock">
    <h2>Plan, fasader &amp; snitt</h2>
    <div class="tegning">${riss}</div>
    <div class="skalastav"><span>Grafisk målestokk</span>${stav}</div>
    ${stempel}
    <p class="figcap">Målsatt tegning generert fra dine valgte mål. Terrenglinjen viser antatt planert terreng. Fyll ut tittelfeltet (tiltakshaver, adresse, gnr/bnr) før innsending. <strong>Veiledende – du er selv ansvarlig for at målene stemmer og at tiltaket følger kommunens krav.</strong></p>
  </div>`
  })()

  const steg = (s: string, i: number) => `<li><span class="stegnr">${i + 1}</span><span>${s}</span></li>`
  const raadPunkt = (s: string) => `<li>${s}</li>`

  // Universelle sammenføyningsteknikker – kunden velger selv metoden.
  const teknikker: Array<[string, string, string]> = [
    ['Skruing', 'Anbefalt', 'Enklest og sterkest for de fleste. Bruk rustfrie A4/syrefaste treskruer og forbor i endene så treet ikke sprekker. Konstruksjonen kan enkelt demonteres eller repareres senere.'],
    ['Skjult skruing / plugging', 'Pent', 'Skru fra innsiden, eller senk skruehodene og lim inn treplugger som slipes ned. Gir rene flater uten synlige skruer – fint på topplist og synlige sider.'],
    ['Lim + skru', 'Sterkest', 'Utendørs D4-/PU-trelim i tillegg til skruene gir den stiveste og mest værbestandige konstruksjonen. Bruk det spesielt på gjærede 45°-hjørner og topplist.'],
    ['Spikring', 'Raskt', 'Kamspiker eller dykkert går raskt, men har mindre uttrekksstyrke enn skruer. Best til lister og innfesting som ikke bærer mye – gjerne kombinert med lim.'],
    ['Vinkelbeslag', 'Ekstra styrke', 'Rustfrie vinkler og beslag i hjørner, og der ben møter kassen, gir stivhet på større prosjekter og tåler tunge laster godt.'],
  ]
  const teknikkBlokk = teknikker
    .map(([navn, tag, tekst]) => `<div class="teknikk"><h3>${navn} <span class="tag">${tag}</span></h3><p>${tekst}</p></div>`)
    .join('')

  // Overflatebehandling tilpasset norsk klima.
  const klima = [
    'La impregnert virke (trykk-/royalimpregnert) tørke noen uker før behandling – ellers fester ikke olje eller beis seg.',
    'Olje / terrasseolje trenger inn i treet, avviser vann og beholder et naturlig treutseende. Frisk opp én gang i året.',
    'Beis eller oljebeis har pigment som beskytter mot UV og gråning, og holder lenger mellom strøk enn ren olje.',
    'Dekkbeis/maling gir tettest beskyttelse og farge, men kan flasse og krever mer vedlikehold over tid.',
    'Forsegl endeveden ekstra – enden av bordet suger mest vann og er der råte gjerne starter.',
    'Hev prosjektet fra bakken med ben, føtter eller klosser, og unngå stående vann. Konstruktivt trevern varer lengst.',
    'Skal prosjektet holde jord: kle innsiden med fiberduk (ikke helt tett plast) så treet puster og vannet dreneres.',
    'Vask rent og se over hvert år. Med en skrudd konstruksjon kan du enkelt bytte ut et enkelt bord hvis det skades.',
  ]

  const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8" />
<title>Byggeplan – ${template.navn} – Minio</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; line-height: 1.55; }
  /* Forside */
  .cover { position: relative; overflow: hidden; background: #fff; color: #1a1a1a; border-radius: 0; padding: 64px 48px; margin-bottom: 30px; min-height: 900px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; break-after: page; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cover::before { content: ''; position: absolute; inset: 0; background: radial-gradient(120% 90% at 50% 0%, rgba(90,120,90,0.10), transparent 60%); }
  .cover > * { position: relative; z-index: 1; }
  .cover-logo { height: 68px; margin-bottom: 40px; opacity: 0.97; }
  .cover-kicker { font-size: 13px; letter-spacing: 0.42em; text-transform: uppercase; color: rgba(0,0,0,0.5); margin-bottom: 14px; }
  .cover-title { font-size: 48px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 14px; }
  .cover-sub { font-size: 16px; color: rgba(0,0,0,0.6); margin-bottom: 34px; }
  .cover-hero { width: 98%; max-height: 560px; object-fit: contain; }
  .cover-rule { width: 54px; height: 3px; background: #7b9c7b; border-radius: 3px; margin: 30px 0 22px; }
  .cover-foot { display: flex; gap: 26px; font-size: 12px; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(0,0,0,0.45); }
  @media print { .cover { min-height: 245mm; margin: 0 0 15mm; } }
  .head { display: flex; justify-content: space-between; align-items: center; background: #202020; color: #fff; padding: 18px 22px; border-radius: 10px; margin-bottom: 26px; }
  .head img { height: 40px; }
  .head .meta { text-align: right; font-size: 12px; color: rgba(255,255,255,0.8); }
  @media print { .head { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .del-bar, .stegnr { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  h1 { font-size: 24px; margin: 0 0 6px; }
  .lead { color: #555; font-size: 13px; margin: 0 0 4px; }
  .desc { font-size: 13px; color: #333; margin: 6px 0 20px; max-width: 640px; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin: 30px 0 10px; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; }
  .summary { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 6px; }
  .chip { border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px 13px; }
  .chip small { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: #999; margin-bottom: 2px; }
  .chip span { font-size: 15px; font-weight: 700; }
  .model { text-align: center; margin: 8px 0; }
  .model img { max-width: 100%; max-height: 340px; border: 1px solid #eee; border-radius: 8px; background: #f7f5ef; }
  .gallery { display: block; margin: 8px 0; }
  .gallery figure { margin: 0 0 18px; text-align: center; break-inside: avoid; }
  .gallery img { width: 100%; max-height: 780px; object-fit: contain; border: 1px solid #eee; border-radius: 10px; background: #f7f5ef; }
  .gallery figcaption { font-size: 12px; color: #777; margin-top: 6px; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #999; border-bottom: 1.5px solid #ddd; padding: 7px 8px; }
  td { padding: 9px 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  td.nr { color: #aaa; width: 24px; }
  td.cmt { color: #777; font-size: 12px; }
  .total { margin-top: 14px; border-top: 2px solid #1a1a1a; padding-top: 10px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; }
  .tegning { display: flex; flex-wrap: wrap; gap: 18px 26px; justify-content: center; align-items: flex-end; padding: 10px 0 4px; }
  .skalastav { display: flex; align-items: center; gap: 10px; margin: 12px 0 2px; }
  .skalastav span { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #999; }
  .riss { margin: 0; text-align: center; break-inside: avoid; }
  .riss-svg { display: flex; justify-content: center; }
  .riss figcaption { margin-top: 6px; padding-top: 5px; border-top: 1.5px solid #161616; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #161616; }
  .del { margin: 10px 0; }
  .del-topp { font-size: 12px; margin-bottom: 4px; } .del-topp span { color: #777; }
  .merke { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; background: #202020; color: #fff; font-size: 11px; font-weight: 700; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .del-bar { display: block; }
  ol.steg, ul.raad { padding: 0; margin: 0; }
  ol.steg { list-style: none; } ol.steg li { display: flex; gap: 12px; align-items: flex-start; padding: 8px 0; border-bottom: 1px solid #f0f0f0; font-size: 13px; }
  .stegnr { flex-shrink: 0; width: 22px; height: 22px; border-radius: 50%; background: #202020; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
  ul.raad { list-style: disc; padding-left: 18px; } ul.raad li { font-size: 13px; padding: 4px 0; }
  .note { margin-top: 24px; font-size: 11px; color: #999; line-height: 1.6; border-top: 1px solid #eee; padding-top: 12px; }
  .figcap { font-size: 11px; color: #999; margin: 8px 0 0; line-height: 1.5; }
  .intro { font-size: 13.5px; color: #2a2a2a; background: #f7f5ef; border-left: 3px solid #7b9c7b; border-radius: 0 8px 8px 0; padding: 14px 16px; margin: 4px 0 4px; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .intro strong { color: #1a1a1a; }
  .tek { display: block; }
  .teknikk { padding: 10px 0; border-bottom: 1px solid #f0f0f0; break-inside: avoid; }
  .teknikk:last-child { border-bottom: none; }
  .teknikk h3 { font-size: 13.5px; margin: 0 0 3px; display: flex; align-items: center; gap: 8px; }
  .teknikk .tag { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; color: #52704f; background: rgba(123,156,123,0.16); border-radius: 999px; padding: 2px 8px; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .teknikk p { margin: 0; font-size: 12.5px; color: #555; line-height: 1.55; }
  @media print { body { padding: 0; } @page { margin: 15mm; } h2 { break-after: avoid; } table, .del, ol.steg li { break-inside: avoid; } }
</style>
</head>
<body>
  <section class="cover">
    <img class="cover-logo" src="${logo}" alt="Minio" />
    <div class="cover-kicker">Byggeplan</div>
    <h1 class="cover-title">${tittel}</h1>
    <div class="cover-sub">${template.navn} · ${bom.sammendrag}</div>
    ${assembledImg ? `<img class="cover-hero" src="${assembledImg}" alt="${template.navn}" />` : ''}
    <div class="cover-rule"></div>
    <div class="cover-foot"><span>${dato}</span><span>Design selv · minio.no</span></div>
  </section>

  <div class="pblock">
    <div class="head">
      <img src="${logoWhite}" alt="Minio" />
      <div class="meta">${tittel}<br/>${dato}<br/>minio.no</div>
    </div>
    <h1>${tittel}</h1>
    <p class="lead">${template.navn} · ${bom.sammendrag}</p>
    <p class="desc">${template.beskrivelse}</p>
    <p class="intro"><strong>Dette er din byggeplan.</strong> «${tittel}» er tegnet av deg, og alle mål, materialer og mengder under er regnet ut fra akkurat dine valg. Bygg den nøyaktig slik den står, eller bruk den som utgangspunkt og tilpass videre – den er din å eie og bygge. Lenger ned finner du flere måter å sette delene sammen på, og hvordan du beskytter treet best mot norsk vær.</p>
    <div class="summary">
      <div class="chip"><small>Bredde</small><span>${config.bredde ?? '–'} cm</span></div>
      ${config.dybde != null ? `<div class="chip"><small>Dybde</small><span>${config.dybde} cm</span></div>` : ''}
      <div class="chip"><small>Høyde</small><span>${config.hoyde ?? '–'} cm</span></div>
      ${config.ben ? `<div class="chip"><small>Ben</small><span>${config.ben} cm</span></div>` : ''}
      <div class="chip"><small>Antall deler</small><span>${deler.reduce((s, d) => s + d.antall, 0) || bom.linjer.length}</span></div>
      <div class="chip"><small>Estimert material</small><span>${formatKr(bom.estimatKr)}</span></div>
    </div>
  </div>

  ${assembledImg ? `<div class="pblock"><div class="gallery"><figure><img src="${assembledImg}" alt="Ferdig modell" /><figcaption>Ferdig montert</figcaption></figure></div></div>` : ''}
  ${explodedImg ? `<div class="pblock"><div class="gallery"><figure><img src="${explodedImg}" alt="Splittvisning" /><figcaption>Splittvisning – slik settes delene sammen</figcaption></figure></div></div>` : ''}

  ${tegningHtml}

  <div class="pblock">
    <h2>Materialer å kjøpe</h2>
    <table>
      <thead><tr><th class="nr">#</th><th>Materiale</th><th>Dimensjon</th><th class="num">Mengde</th><th>Merknad</th></tr></thead>
      <tbody>${bom.linjer.map(bomRad).join('')}</tbody>
    </table>
    <div class="total"><span>Estimert materialkostnad (inkl. 10&nbsp;% kapp)</span><span>${formatKr(bom.estimatKr)}</span></div>
  </div>

  ${deler.length > 0 ? `
  <div class="pblock">
    <h2>Kappliste – deler</h2>
    <table>
      <thead><tr><th>Merke</th><th>Del</th><th>Profil</th><th class="num">Lengde</th><th class="num">Antall</th></tr></thead>
      <tbody>${deler.map(delRad).join('')}</tbody>
    </table>
  </div>
  <div class="pblock">
    <h2>Deletegning (målestokk)</h2>
    <div class="deltegning">${delTegning}</div>
    <p class="figcap">Delene er tegnet i målestokk. Bokstavene (A, B, C …) tilsvarer kapplista over.${deler.some((d) => d.navn.toLowerCase().includes('topplist')) ? ' Topplistens ender kappes i 45° gjæring for tette hjørner.' : ''}</p>
  </div>` : ''}

  ${montering.length > 0 ? `
  <div class="pblock">
    <h2>Monteringsanvisning</h2>
    <ol class="steg">${montering.map(steg).join('')}</ol>
  </div>` : ''}

  ${raad.length > 0 ? `
  <div class="pblock">
    <h2>Sammenføyning &amp; gode råd</h2>
    <ul class="raad">${raad.map(raadPunkt).join('')}</ul>
  </div>` : ''}

  <div class="pblock">
    <h2>Sammenføyning – velg metoden som passer deg</h2>
    <p class="figcap" style="margin:0 0 10px">Du bestemmer selv hvordan delene settes sammen. Her er de vanligste metodene og når de passer best:</p>
    <div class="tek">${teknikkBlokk}</div>
  </div>

  <div class="pblock">
    <h2>Overflatebehandling for norsk klima</h2>
    <ul class="raad">${klima.map(raadPunkt).join('')}</ul>
  </div>

  <div class="pblock">
    <h2>Verktøy du trenger</h2>
    <ul class="raad">
      <li>Drill/skrutrekker + bits, og et forbor/senkebor</li>
      <li>Kapp- eller håndsag (gjærsag hvis du skal ha 45°-hjørner på topplisten)</li>
      <li>Målebånd, blyant og vinkelhake</li>
      <li>Vater</li>
      <li>Tvinger til å holde bordene mens du skrur</li>
      <li>Evt. fiberduk-saks og stiftepistol</li>
    </ul>
  </div>

  <p class="note">
    Byggeplan generert med designverktøyet på minio.no ut fra dine valgte mål. Mengder inkluderer 10&nbsp;% kapp/svinn.
    Priser er veiledende ca-priser – sjekk mot din lokale byggevarehandel. Kontroller alle mål mot faktisk trelast før innkjøp og bygging.
    Kontakt Minio for ferdig materialpakke eller ferdig bygget prosjekt.
  </p>

  ${forPrint ? '<script>window.onload = function () { window.focus(); window.print(); };</script>' : ''}
</body>
</html>`

  return html
}

const filnavn = (a: PlanArgs) => `byggeplan-${String(a.template.id)}.pdf`

/** Åpner planen i ny fane og starter utskrift (kunden kan «Lagre som PDF»). */
export function planUtskrift(a: PlanArgs) {
  const html = buildPlanHtml(a, true)
  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    URL.revokeObjectURL(url)
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

/** Lager en ren, salgbar PDF direkte (uten nettleserens utskrifts-header). */
export async function planPdf(a: PlanArgs) {
  const html = buildPlanHtml(a, false)
  // Rendrer planen skjult i en iframe og fanger den til PDF.
  const iframe = document.createElement('iframe')
  iframe.style.cssText = 'position:fixed;left:-9999px;top:0;width:820px;height:1160px;border:0;'
  document.body.appendChild(iframe)
  const doc = iframe.contentDocument!
  doc.open()
  doc.write(html)
  doc.close()

  // Vent på at bilder (logo + 3D) er lastet.
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

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pw = 210
  const ph = 297
  const margin = 12
  const usableW = pw - margin * 2
  const usableH = ph - margin * 2

  // Rendrer hver blokk for seg og paginerer – gir rene sideskift (ingen kutt midt i tabeller/bilder).
  const cover = doc.querySelector('.cover') as HTMLElement | null
  const blocks = Array.from(doc.querySelectorAll('.pblock')) as HTMLElement[]
  let cursorY = margin
  const opts = { scale: 2, useCORS: true, backgroundColor: '#ffffff', windowWidth: 820 } as const

  const placeBlock = (canvas: HTMLCanvasElement) => {
    const imgH = (canvas.height * usableW) / canvas.width
    if (imgH <= usableH) {
      // Får plass som helhet – ny side hvis den ikke får plass her.
      if (cursorY + imgH > ph - margin) { pdf.addPage(); cursorY = margin }
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', margin, cursorY, usableW, imgH)
      cursorY += imgH + 6
    } else {
      // Høyere enn én side – del i skiver på sidegrensene.
      const pxPerMm = canvas.width / usableW
      let sy = 0
      while (sy < canvas.height) {
        if (cursorY > ph - margin - 12) { pdf.addPage(); cursorY = margin }
        const sliceMm = Math.min(ph - margin - cursorY, (canvas.height - sy) / pxPerMm)
        const sliceH = Math.round(sliceMm * pxPerMm)
        const slice = document.createElement('canvas')
        slice.width = canvas.width
        slice.height = sliceH
        slice.getContext('2d')!.drawImage(canvas, 0, sy, canvas.width, sliceH, 0, 0, canvas.width, sliceH)
        pdf.addImage(slice.toDataURL('image/jpeg', 0.92), 'JPEG', margin, cursorY, usableW, sliceMm)
        cursorY += sliceMm + 6
        sy += sliceH
      }
    }
  }

  if (cover) {
    const c = await html2canvas(cover, opts)
    pdf.addImage(c.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, pw, Math.min(ph, (c.height * pw) / c.width))
    pdf.addPage()
    cursorY = margin
  }
  for (const blk of blocks) {
    const c = await html2canvas(blk, opts)
    placeBlock(c)
  }
  document.body.removeChild(iframe)
  pdf.save(filnavn(a))
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
