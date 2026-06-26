import {
  type UtekjokkenConfig,
  type BeregnetResultat,
  TAK_INFO,
  TAKTEKKE_INFO,
  BENKEPLATE_INFO,
  formatKr,
} from './utekjokkenModel'

interface MatRad {
  navn: string
  spec: string
  antall: string
  lengde: string
}

/**
 * Bygger en utskriftsvennlig materialliste (HTML) med Minio-logo og åpner
 * nettleserens utskrift/«Lagre som PDF».
 */
export function lastNedMaterialliste(
  config: UtekjokkenConfig,
  r: BeregnetResultat,
  bilde?: string,
) {
  const origin = window.location.origin
  const logo = `${origin}/images/branding/logo_icon_white.webp`
  const dato = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })

  let modelImg = bilde ?? ''
  if (!modelImg) {
    const canvas = document.querySelector('canvas')
    if (canvas) {
      try {
        modelImg = canvas.toDataURL('image/png')
      } catch {
        modelImg = ''
      }
    }
  }

  const bjelkeStr = config.bjelkeDim.replace('x', '×')
  const stolpeStr = config.stolpeDim.replace('x', '×')

  const baering: MatRad[] = [
    { navn: 'Stolper', spec: `${stolpeStr} mm · trykkimpregnert`, antall: `${r.stolpeAntall} stk`, lengde: `${r.stolpeLøpemeter.toFixed(1)} lm` },
    { navn: 'Dragere / sidebjelker', spec: `${bjelkeStr} mm`, antall: '—', lengde: `${r.dragerLøpemeter.toFixed(1)} lm` },
    { navn: 'Spær', spec: `${bjelkeStr} mm`, antall: `${r.spærAntall} stk`, lengde: `${r.spærLøpemeter.toFixed(1)} lm` },
    { navn: 'Knebånd / avstiving', spec: '48×48 mm · skråstivere', antall: `${r.knebåndAntall} stk`, lengde: `${r.knebåndLøpemeter.toFixed(1)} lm` },
  ]

  const takOgGulv: MatRad[] = [
    { navn: `Taktekke (${TAKTEKKE_INFO[config.taktekke].navn.toLowerCase()})`, spec: `${TAK_INFO[config.taktype].navn.toLowerCase()} tak`, antall: '—', lengde: `${r.takAreal.toFixed(1)} m²` },
    { navn: 'Platting (dekke + bjelkelag)', spec: `h ${Math.round(config.plattformHøyde * 100)} cm`, antall: '—', lengde: `${r.plattformAreal.toFixed(1)} m²` },
  ]

  const innredning: MatRad[] = [
    { navn: `Benkeplate (${BENKEPLATE_INFO[config.benkeplate].navn.toLowerCase()})`, spec: `dybde ${Math.round(config.benkedybde * 100)} cm · h ${Math.round(config.benkehøyde * 100)} cm`, antall: '—', lengde: `${r.benkeLengde.toFixed(1)} lm` },
  ]
  if (config.harVask) innredning.push({ navn: 'Utslagsvask + kran', spec: 'med avløp', antall: '1 stk', lengde: '—' })
  if (r.skapAntall > 0) innredning.push({ navn: 'Underskap med dør', spec: 'lukket modul', antall: `${r.skapAntall} stk`, lengde: '—' })
  if (config.hyller > 0) innredning.push({ navn: 'Hyller', spec: 'åpen del under benk', antall: `${config.hyller} stk`, lengde: `${r.hyllerLøpemeter.toFixed(1)} lm` })
  if (r.benkLengde > 0) innredning.push({ navn: 'Sittebenk', spec: 'langs siden', antall: '—', lengde: `${r.benkLengde.toFixed(1)} lm` })
  if (r.bakveggAreal > 0) innredning.push({ navn: 'Bakvegg (spiler)', spec: 'stående battens bak benk', antall: '—', lengde: `${r.bakveggAreal.toFixed(1)} m²` })
  if (r.sideveggAreal > 0) innredning.push({ navn: 'Sidevegger (spiler)', spec: 'stående battens, begge sider', antall: '—', lengde: `${r.sideveggAreal.toFixed(1)} m²` })

  const festemateriell: MatRad[] = [
    { navn: 'Stolpesko / beslag', spec: 'galvanisert', antall: `${r.stolpeskoAntall} stk`, lengde: '—' },
    { navn: 'Skruer / bolter', spec: 'rustfri/syrefast', antall: `${r.skrueAntall} stk`, lengde: '—' },
  ]

  const rad = (m: MatRad) => `
    <tr>
      <td><strong>${m.navn}</strong></td>
      <td>${m.spec}</td>
      <td class="num">${m.antall}</td>
      <td class="num">${m.lengde}</td>
    </tr>`

  const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8" />
<title>Materialliste – utekjøkken – Minio</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
  .head { display: flex; justify-content: space-between; align-items: center; background: #202020; color: #fff; padding: 18px 22px; border-radius: 10px; margin-bottom: 24px; }
  .head img { height: 40px; }
  .head .meta { text-align: right; font-size: 12px; color: rgba(255,255,255,0.8); }
  @media print { .head { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.06em; color: #888; margin: 28px 0 8px; }
  .summary { display: flex; gap: 24px; flex-wrap: wrap; margin-bottom: 8px; }
  .summary div { font-size: 13px; }
  .summary span { display: block; font-size: 18px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #999; border-bottom: 1px solid #ddd; padding: 6px 8px; }
  td { padding: 8px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  .model { margin: 18px 0 4px; text-align: center; }
  .model img { max-width: 100%; max-height: 300px; border: 1px solid #eee; border-radius: 8px; background: #fafafa; }
  .total { margin-top: 24px; border-top: 2px solid #1a1a1a; padding-top: 12px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 700; }
  .note { margin-top: 20px; font-size: 11px; color: #999; line-height: 1.5; }
  @media print { body { padding: 0; } @page { margin: 18mm; } }
</style>
</head>
<body>
  <div class="head">
    <img src="${logo}" alt="Minio" />
    <div class="meta">Materialliste – utekjøkken<br/>${dato}<br/>minio.no</div>
  </div>

  <h1>Materialliste for utekjøkken</h1>
  <div class="summary">
    <div>Mål<span>${config.bredde.toFixed(1)} × ${config.dybde.toFixed(1)} m</span></div>
    <div>Høyde<span>${config.høyde.toFixed(1)} m</span></div>
    <div>Tak<span>${TAK_INFO[config.taktype].navn}</span></div>
    <div>Benkeplate<span>${BENKEPLATE_INFO[config.benkeplate].navn}</span></div>
    <div>Areal<span>${r.arealFormattert}</span></div>
  </div>

  ${modelImg ? `<div class="model"><img src="${modelImg}" alt="3D-modell av utekjøkkenet" /></div>` : ''}

  <h2>Bæring / konstruksjon</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Dimensjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${baering.map(rad).join('')}</tbody>
  </table>

  <h2>Tak og platting</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Spesifikasjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${takOgGulv.map(rad).join('')}</tbody>
  </table>

  <h2>Innredning</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Spesifikasjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${innredning.map(rad).join('')}</tbody>
  </table>

  <h2>Festemateriell</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Spesifikasjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${festemateriell.map(rad).join('')}</tbody>
  </table>

  <div class="total">
    <span>Estimert materialkostnad</span>
    <span>${formatKr(r.totalKostnad)}</span>
  </div>

  <p class="note">
    Veiledende materialliste generert med utekjøkkenplanleggeren på minio.no. Vask, kran og avløp
    føres som faste poster – endelig pris avhenger av valgt utstyr. Kontakt Minio for et konkret
    tilbud på et ferdig bygget utekjøkken.
  </p>

  <script>
    window.onload = function () { window.focus(); window.print(); };
  </script>
</body>
</html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (!win) {
    URL.revokeObjectURL(url)
    return
  }
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
