import { type TerrasseConfig, type BeregnetResultat, FORM_INFO, GJERDE_INFO, formatKr } from './terrasseModel'

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
export function lastNedMaterialliste(config: TerrasseConfig, r: BeregnetResultat, bilde?: string) {
  const origin = window.location.origin
  const logo = `${origin}/images/branding/logo_icon_white.webp`
  const dato = new Date().toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })

  // Bruk helst et bilde tatt fra standard-perspektivet (sendt inn av visualiseringen).
  // Faller tilbake til canvas slik den ser ut nå hvis ingen er gitt.
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

  const trevirke: MatRad[] = [
    {
      navn: 'Terrassebord',
      spec: `${config.bordbredde}×28 mm · trykkimpregnert`,
      antall: `${r.bordAntall} stk`,
      lengde: `${r.bordLøpemeter.toFixed(1)} lm`,
    },
    {
      navn: 'Bjelker (tverrgående)',
      spec: `${config.bjelkeDimensjon.replace('x', '×')} mm · trykkimpregnert`,
      antall: `${r.tverrBjelkeAntall} stk`,
      lengde: `${r.tverrBjelkeLøpemeter.toFixed(1)} lm`,
    },
    {
      navn: 'Kantbjelker (sidebjelker)',
      spec: `${config.bjelkeDimensjon.replace('x', '×')} mm · trykkimpregnert`,
      antall: `${r.sideBjelkeAntall} stk`,
      lengde: `${r.sideBjelkeLøpemeter.toFixed(1)} lm`,
    },
  ]

  if (config.gjerdeType !== 'ingen') {
    trevirke.push({
      navn: `Gjerdebord (${GJERDE_INFO[config.gjerdeType].navn.toLowerCase()})`,
      spec: '28 mm · trykkimpregnert',
      antall: `${r.gjerdeBordAntall ?? 0} stk`,
      lengde: '—',
    })
    trevirke.push({
      navn: 'Lekt til gjerde',
      spec: '48×48 mm · trykkimpregnert',
      antall: '—',
      lengde: `${(r.gjerdeLekt ?? 0).toFixed(1)} lm`,
    })
    trevirke.push({
      navn: 'Stolper til gjerde',
      spec: '98×98 mm · trykkimpregnert',
      antall: `${r.gjerdeStolper ?? 0} stk`,
      lengde: '—',
    })
  }

  if (r.trappTrinnAntall) {
    trevirke.push({
      navn: 'Trappetrinn',
      spec: 'terrassebord',
      antall: `${r.trappTrinnAntall} stk`,
      lengde: '—',
    })
  }

  const festemateriell: MatRad[] = [
    {
      navn: 'Terrasseskruer',
      spec: `rustfri/syrefast · ${Math.round(config.skruerPerKryss)} per kryss`,
      antall: `${r.skrueAntall} stk`,
      lengde: '—',
    },
  ]

  const sumLm = r.bordLøpemeter + r.bjelkeLøpemeter + (r.gjerdeLekt ?? 0)

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
<title>Materialliste – terrasse – Minio</title>
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
    <div class="meta">Materialliste – terrasse<br/>${dato}<br/>minio.no</div>
  </div>

  <h1>Materialliste for terrasse</h1>
  <div class="summary">
    <div>Form<span>${FORM_INFO[config.form].navn}</span></div>
    <div>Areal<span>${r.arealFormattert}</span></div>
    <div>Sum trevirke<span>${sumLm.toFixed(1)} lm</span></div>
    ${config.svinnProsent > 0 ? `<div>Kapp og svinn<span>inkl. ${config.svinnProsent} %</span></div>` : ''}
  </div>

  ${modelImg ? `<div class="model"><img src="${modelImg}" alt="3D-modell av terrassen" /></div>` : ''}

  <h2>Trevirke</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Dimensjon</th><th class="num">Antall</th><th class="num">Løpemeter</th></tr></thead>
    <tbody>${trevirke.map(rad).join('')}</tbody>
  </table>

  <h2>Festemateriell</h2>
  <table>
    <thead><tr><th>Materiale</th><th>Dimensjon</th><th class="num">Antall</th><th class="num">Løpemeter</th></tr></thead>
    <tbody>${festemateriell.map(rad).join('')}</tbody>
  </table>

  <div class="total">
    <span>Estimert materialkostnad</span>
    <span>${formatKr(r.totalKostnad)}</span>
  </div>

  <p class="note">
    Veiledende materialliste generert med terrasseplanleggeren på minio.no. Mengder er beregnet ut fra dine valgte mål.
    ${config.svinnProsent > 0 ? `Løpemeter inkluderer ${config.svinnProsent} % kapp og svinn.` : 'Husk å legge til kapp og svinn selv.'}
    Kontakt Minio for et konkret tilbud på ferdig bygget terrasse.
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
