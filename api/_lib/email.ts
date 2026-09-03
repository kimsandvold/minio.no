/**
 * Utsending av e-post via Resend (https://resend.com).
 *
 * Brukes til å sende tilgangskoden til kunden etter kapret betaling (kalles fra
 * api/vipps/status.ts) og til å varsle admin om nye byggeplan-forespørsler
 * (api/plan/bestill.ts). Admin-varselet har Formspree som reserve, se
 * varsleAdmin() nederst.
 *
 * Miljø:
 *  - RESEND_API_KEY   – API-nøkkel fra Resend (hemmelig, kun server).
 *  - EPOST_FRA        – avsender, f.eks. "Minio <post@minio.no>". Domenet må
 *                       være verifisert i Resend før produksjon.
 *
 * Mangler nøkkelen, logges det og hoppes over: en e-post som ikke gikk ut skal
 * ALDRI velte en betaling som er gjennomført.
 */

const RESEND_URL = 'https://api.resend.com/emails'
// Samme Formspree-skjema som klienten bruker for «ferdig»/«materialpakke»
// (src/services/foresporselService.ts). Brukes som reserve for varsler TIL
// ADMIN når Resend ikke er satt opp – skjemaet leverer kun til skjema-eieren,
// så det kan aldri brukes til å sende e-post til en kunde.
const FORMSPREE_URL = 'https://formspree.io/f/mwpwragr'

interface EpostInput {
  til: string
  emne: string
  html: string
  tekst: string
}

/**
 * Sender én e-post. Returnerer true når Resend tok imot den, false ved
 * manglende konfigurasjon eller feil (feilen logges, men kastes ikke).
 */
export async function sendEpost(input: EpostInput): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY
  const fra = process.env.EPOST_FRA
  if (!apiKey || !fra) {
    console.warn('[epost] RESEND_API_KEY eller EPOST_FRA mangler – hopper over utsending.')
    return false
  }

  try {
    const res = await fetch(RESEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fra,
        to: [input.til],
        subject: input.emne,
        html: input.html,
        text: input.tekst,
      }),
    })
    if (!res.ok) {
      console.error(`[epost] Resend svarte ${res.status}: ${await res.text()}`)
      return false
    }
    return true
  } catch (e) {
    console.error('[epost] Utsending feilet:', e instanceof Error ? e.message : e)
    return false
  }
}

/** Menneskelig navn på leveransene, til bruk i kvitteringen. */
const VARE_NAVN: Record<string, string> = {
  plan: 'Byggeplan (materialliste + tegninger)',
  soknad: 'Byggesøknad-hefte',
  cnc: 'Maskinfiler (DXF/SVG)',
}

/**
 * Kvittering med tilgangskode etter kjøp. Koden låser opp designet også på en
 * annen enhet, og fungerer som referanse i en eventuell henvendelse.
 */
export async function sendTilgangskode(opts: {
  til: string
  designNavn: string
  tilgangskode: string
  leveranser: string[]
  belopKr: number
  designUrl: string
}): Promise<boolean> {
  const linjer = opts.leveranser.map((v) => VARE_NAVN[v] ?? v)
  const emne = `Tilgangskode for ${opts.designNavn} – Minio`

  const tekst = [
    `Takk for kjøpet!`,
    ``,
    `Design: ${opts.designNavn}`,
    `Du har kjøpt: ${linjer.join(', ')}`,
    `Beløp: ${opts.belopKr} kr`,
    ``,
    `Tilgangskode: ${opts.tilgangskode}`,
    ``,
    `Designet er allerede låst opp når du er innlogget: ${opts.designUrl}`,
    `Koden bruker du hvis du åpner designet på en annen enhet.`,
    ``,
    `Ta vare på denne e-posten – koden gjelder dette designet.`,
    ``,
    `Minio – minio.no`,
  ].join('\n')

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:520px;color:#1c1917">
      <h2 style="margin:0 0 16px">Takk for kjøpet!</h2>
      <p style="margin:0 0 8px"><strong>Design:</strong> ${esc(opts.designNavn)}</p>
      <p style="margin:0 0 8px"><strong>Du har kjøpt:</strong> ${esc(linjer.join(', '))}</p>
      <p style="margin:0 0 20px"><strong>Beløp:</strong> ${opts.belopKr} kr</p>
      <div style="background:#f5f5f4;border-radius:12px;padding:20px;text-align:center;margin:0 0 20px">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#57534e">Tilgangskode</div>
        <div style="font-size:34px;font-weight:700;letter-spacing:.18em;margin-top:6px">${esc(opts.tilgangskode)}</div>
      </div>
      <p style="margin:0 0 8px">Designet er allerede låst opp når du er innlogget:</p>
      <p style="margin:0 0 20px"><a href="${esc(opts.designUrl)}">${esc(opts.designUrl)}</a></p>
      <p style="margin:0 0 20px;color:#57534e;font-size:14px">
        Koden bruker du hvis du åpner designet på en annen enhet. Ta vare på denne e-posten – koden gjelder dette designet.
      </p>
      <p style="margin:0;color:#78716c;font-size:13px">Minio – <a href="https://minio.no">minio.no</a></p>
    </div>`

  return sendEpost({ til: opts.til, emne, html, tekst })
}

/** Escaper tekst som settes inn i HTML-en over. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  )
}

/**
 * Varsel til admin som skal fram uansett: prøver Resend først, og faller
 * tilbake til Formspree-skjemaet hvis Resend mangler nøkler eller feiler.
 * Returnerer true når én av dem tok imot varselet.
 */
export async function varsleAdmin(opts: { til?: string; emne: string; tekst: string; html: string }): Promise<boolean> {
  if (opts.til && (await sendEpost({ til: opts.til, emne: opts.emne, html: opts.html, tekst: opts.tekst }))) {
    return true
  }
  try {
    const res = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ _subject: opts.emne, Melding: opts.tekst }),
    })
    if (!res.ok) {
      console.error(`[epost] Formspree svarte ${res.status}: ${await res.text()}`)
      return false
    }
    return true
  } catch (e) {
    console.error('[epost] Formspree-varsel feilet:', e instanceof Error ? e.message : e)
    return false
  }
}
