import {
  type CarportConfig,
  type BeregnetResultat,
  type Byggeregler,
  MONTERING_INFO,
  TAK_INFO,
  TAKTEKKE_INFO,
  VEGG_INFO,
  SIDE_INFO,
  formatKr,
} from './carportModel'

interface MatRad {
  navn: string
  spec: string
  antall: string
  lengde: string
}

/**
 * Bygger en utskriftsvennlig materialliste (HTML) med Minio-logo og åpner
 * nettleserens utskrift/«Lagre som PDF». Inkluderer byggeregler-sammendrag.
 */
export function lastNedMaterialliste(
  config: CarportConfig,
  r: BeregnetResultat,
  reg: Byggeregler,
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

  const trevirke: MatRad[] = [
    { navn: 'Stolper', spec: `${stolpeStr} mm · trykkimpregnert`, antall: `${r.stolpeAntall} stk`, lengde: `${r.stolpeLøpemeter.toFixed(1)} lm` },
    { navn: 'Dragere', spec: `${bjelkeStr} mm · trykkimpregnert`, antall: `${r.dragerAntall} stk`, lengde: `${r.dragerLøpemeter.toFixed(1)} lm` },
    { navn: 'Spær', spec: `${bjelkeStr} mm · trykkimpregnert`, antall: `${r.spærAntall} stk`, lengde: `${r.spærLøpemeter.toFixed(1)} lm` },
    { navn: 'Tverrbjelker', spec: `${bjelkeStr} mm · strekkbånd`, antall: `${r.tverrbjelkeAntall} stk`, lengde: `${r.tverrbjelkeLøpemeter.toFixed(1)} lm` },
    { navn: 'Knebånd / avstiving', spec: '73×73 mm · skråstivere', antall: `${r.knebåndAntall} stk`, lengde: `${r.knebåndLøpemeter.toFixed(1)} lm` },
  ]

  const tak: MatRad[] = [
    { navn: `Taktekke (${TAKTEKKE_INFO[config.taktekke].navn.toLowerCase()})`, spec: `takvinkel ${config.takvinkel}°`, antall: '—', lengde: `${r.takAreal.toFixed(1)} m²` },
  ]
  if (r.sutakAreal != null) tak.push({ navn: 'Sutak / undertak', spec: 'bord/plater', antall: '—', lengde: `${r.sutakAreal.toFixed(1)} m²` })
  tak.push({ navn: 'Takrenne', spec: 'med endebunner', antall: '—', lengde: `${r.takrenneLøpemeter.toFixed(1)} lm` })
  tak.push({ navn: 'Nedløp', spec: 'med bend og feste', antall: `${r.nedløpAntall} stk`, lengde: '—' })
  tak.push({ navn: 'Vindski', spec: '22 mm', antall: '—', lengde: `${r.vindskiLøpemeter.toFixed(1)} lm` })

  if (r.veggFormattert) {
    const sider = config.veggSider.map((s) => SIDE_INFO[s].toLowerCase()).join(', ')
    if (r.veggPanelAreal != null) tak.push({ navn: `Veggpanel (${sider})`, spec: VEGG_INFO[config.veggtype].navn, antall: '—', lengde: `${r.veggPanelAreal.toFixed(1)} m²` })
    if (r.veggAkrylAreal != null) tak.push({ navn: `Akrylplater (${sider})`, spec: 'klare vindusplater', antall: '—', lengde: `${r.veggAkrylAreal.toFixed(1)} m²` })
  }

  const festemateriell: MatRad[] = [
    { navn: 'Stolpesko / beslag', spec: 'galvanisert', antall: `${r.stolpeskoAntall} stk`, lengde: '—' },
    { navn: 'Skruer / bolter / takfeste', spec: 'rustfri/syrefast', antall: `${r.skrueAntall} stk`, lengde: '—' },
  ]

  const rad = (m: MatRad) => `
    <tr>
      <td><strong>${m.navn}</strong></td>
      <td>${m.spec}</td>
      <td class="num">${m.antall}</td>
      <td class="num">${m.lengde}</td>
    </tr>`

  const regBadge = reg.søknadsfri
    ? '<span class="ok">Trolig søknadsfri</span>'
    : '<span class="warn">Søknad kreves</span>'

  const html = `<!doctype html>
<html lang="nb">
<head>
<meta charset="utf-8" />
<title>Materialliste – carport – Minio</title>
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
  .reg { border: 1.5px solid #ccc; border-radius: 10px; padding: 12px 14px; margin: 14px 0; font-size: 12px; }
  .reg .ok { color: #2e7d32; font-weight: 700; }
  .reg .warn { color: #b8860b; font-weight: 700; }
  .reg ul { margin: 8px 0 0; padding-left: 18px; color: #666; }
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
    <div class="meta">Materialliste – carport<br/>${dato}<br/>minio.no</div>
  </div>

  <h1>Materialliste for carport</h1>
  <div class="summary">
    <div>Montering<span>${MONTERING_INFO[config.montering].navn}</span></div>
    <div>Tak<span>${TAK_INFO[config.taktype].navn} ${config.taktype !== 'flatt' ? config.takvinkel + '°' : ''}</span></div>
    <div>Mål<span>${config.bredde.toFixed(1)} × ${config.lengde.toFixed(1)} m</span></div>
    <div>Areal<span>${r.arealFormattert}</span></div>
    <div>Snølast<span>${config.snølast.toFixed(1)} kN/m²</span></div>
  </div>

  <div class="reg">
    Byggeregler (veiledende): ${regBadge} ·
    areal ${reg.areal.toFixed(1)} m² · gesims ${reg.gesimshøyde.toFixed(1)} m · møne ${reg.mønehøyde.toFixed(1)} m
    <ul>${reg.merknader.map((m) => `<li>${m}</li>`).join('')}</ul>
  </div>

  ${modelImg ? `<div class="model"><img src="${modelImg}" alt="3D-modell av carporten" /></div>` : ''}

  <h2>Trevirke / bæring</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Dimensjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${trevirke.map(rad).join('')}</tbody>
  </table>

  <h2>Tak, avvanning og vegger</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Spesifikasjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${tak.map(rad).join('')}</tbody>
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
    Veiledende materialliste og forenklet dimensjonering generert med carportplanleggeren på minio.no.
    Vurderingen mot byggeregler er kun veiledende – sjekk alltid lokal snølast og kommunens regler,
    og få statisk beregning ved store spenn. Kontakt Minio for et konkret tilbud på ferdig bygget carport.
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
