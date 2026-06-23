import {
  type PergolaConfig,
  type BeregnetResultat,
  MONTERING_INFO,
  TAK_INFO,
  SKJERM_INFO,
  SIDE_INFO,
  formatKr,
} from './pergolaModel'

interface MatRad {
  navn: string
  spec: string
  antall: string
  lengde: string
}

/**
 * Bygger en utskriftsvennlig materialliste (HTML) med Minio-logo og åpner
 * nettleserens utskrift/«Lagre som PDF». Kunden kan ta med listen i butikken.
 */
export function lastNedMaterialliste(config: PergolaConfig, r: BeregnetResultat, bilde?: string) {
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

  const stolpeStr = config.stolpeDim.replace('x', '×')
  const bjelkeStr = config.bjelkeDim.replace('x', '×')

  const trevirke: MatRad[] = [
    {
      navn: 'Stolper',
      spec: `${stolpeStr} mm · trykkimpregnert`,
      antall: `${r.stolpeAntall} stk`,
      lengde: `${r.stolpeLøpemeter.toFixed(1)} lm`,
    },
    {
      navn: 'Dragere',
      spec: `${bjelkeStr} mm · trykkimpregnert`,
      antall: `${r.dragerAntall} stk`,
      lengde: `${r.dragerLøpemeter.toFixed(1)} lm`,
    },
    {
      navn: 'Spær',
      spec: `${bjelkeStr} mm · trykkimpregnert`,
      antall: `${r.spærAntall} stk`,
      lengde: `${r.spærLøpemeter.toFixed(1)} lm`,
    },
  ]

  if (r.lektAntall != null) {
    trevirke.push({
      navn: `Takslekter (${TAK_INFO[config.taktype].navn.toLowerCase()})`,
      spec: '48×48 mm · trykkimpregnert',
      antall: `${r.lektAntall} stk`,
      lengde: `${(r.lektLøpemeter ?? 0).toFixed(1)} lm`,
    })
  } else if (r.takAreal != null) {
    trevirke.push({
      navn: 'Takplater / takduk',
      spec: 'tett tak',
      antall: '—',
      lengde: `${r.takAreal.toFixed(1)} m²`,
    })
  }

  if (r.skjermFormattert) {
    const sider = config.skjermSider.map((s) => SIDE_INFO[s].toLowerCase()).join(', ')
    trevirke.push({
      navn: `Sideskjerm (${SKJERM_INFO[config.skjermtype].navn.toLowerCase()})`,
      spec: sider ? `sider: ${sider}` : '—',
      antall: '—',
      lengde: r.skjermAreal != null ? `${r.skjermAreal.toFixed(1)} m²` : `${(r.skjermLøpemeter ?? 0).toFixed(1)} lm`,
    })
  }

  const festemateriell: MatRad[] = [
    {
      navn: 'Stolpesko / beslag',
      spec: 'galvanisert · til innstøping eller bolt',
      antall: `${r.stolpeskoAntall} stk`,
      lengde: '—',
    },
    {
      navn: 'Skruer / bolter',
      spec: `rustfri/syrefast · ${Math.round(config.skruerPerKryss)} per kryss`,
      antall: `${r.skrueAntall} stk`,
      lengde: '—',
    },
  ]

  const sumLm = r.stolpeLøpemeter + r.dragerLøpemeter + r.spærLøpemeter + (r.lektLøpemeter ?? 0) + (r.skjermLøpemeter ?? 0)

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
<title>Materialliste – pergola – Minio</title>
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
    <div class="meta">Materialliste – pergola<br/>${dato}<br/>minio.no</div>
  </div>

  <h1>Materialliste for pergola</h1>
  <div class="summary">
    <div>Montering<span>${MONTERING_INFO[config.montering].navn}</span></div>
    <div>Areal<span>${r.arealFormattert}</span></div>
    <div>Mål<span>${config.bredde.toFixed(1)} × ${config.dybde.toFixed(1)} m</span></div>
    <div>Sum trevirke<span>${sumLm.toFixed(1)} lm</span></div>
    ${config.svinnProsent > 0 ? `<div>Kapp og svinn<span>inkl. ${config.svinnProsent} %</span></div>` : ''}
  </div>

  ${modelImg ? `<div class="model"><img src="${modelImg}" alt="3D-modell av pergolaen" /></div>` : ''}

  <h2>Trevirke</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Dimensjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${trevirke.map(rad).join('')}</tbody>
  </table>

  <h2>Festemateriell</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Dimensjon</th><th class="num">Antall</th><th class="num">Mengde</th></tr></thead>
    <tbody>${festemateriell.map(rad).join('')}</tbody>
  </table>

  <div class="total">
    <span>Estimert materialkostnad</span>
    <span>${formatKr(r.totalKostnad)}</span>
  </div>

  <p class="note">
    Veiledende materialliste generert med pergolaplanleggeren på minio.no. Mengder er beregnet ut fra dine valgte mål.
    ${config.svinnProsent > 0 ? `Løpemeter inkluderer ${config.svinnProsent} % kapp og svinn.` : 'Husk å legge til kapp og svinn selv.'}
    Kontakt Minio for et konkret tilbud på ferdig bygget pergola.
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
