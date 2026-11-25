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
  /** Reply-To – f.eks. kundens adresse i varsler til admin, så «Svar» går rett til kunden. */
  svarTil?: string
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
        ...(input.svarTil ? { reply_to: input.svarTil } : {}),
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
  const belop = `${opts.belopKr.toLocaleString('nb-NO')} kr`
  const emne = `Tilgangskode for ${opts.designNavn} – Minio`

  const tekst = [
    `Takk for kjøpet!`,
    ``,
    `Design: ${opts.designNavn}`,
    `Du har kjøpt: ${linjer.join(', ')}`,
    `Beløp: ${belop}`,
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
      <p style="margin:0 0 20px"><strong>Beløp:</strong> ${esc(belop)}</p>
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

/**
 * Kvittering til kunden etter en graveringsbestilling.
 *
 * Graveringsbestillinger krever ingen innlogging – vi har bare adressen kunden
 * selv skrev inn. Derfor er kvitteringen også det eneste sporet hun sitter
 * igjen med, og den må si tydelig hva som skjer videre: ingenting graveres før
 * hun har godkjent korrekturen, og det kommer ingen faktura før varen sendes.
 *
 * Summen er veiledende, aldri et betalingskrav – endelig pris settes i
 * tilbudet. Ordrseferansen tas med så en henvendelse kan spores uten at hun
 * må beskrive motivet på nytt.
 */
export async function sendGraveringKvittering(opts: {
  til: string
  navn: string
  ordreId: string
  sammendrag: string
  levering: string
  sumKr: number
  fraktKr: number
}): Promise<boolean> {
  const sum = `${opts.sumKr.toLocaleString('nb-NO')} kr`
  const frakt = `${opts.fraktKr.toLocaleString('nb-NO')} kr`
  const fornavn = opts.navn.trim().split(/\s+/)[0] || 'du'

  const tekst = [
    `Hei ${fornavn}!`,
    ``,
    `Vi har fått graveringsbestillingen din. Her er det du sendte inn:`,
    ``,
    opts.sammendrag,
    ``,
    `Leveres til: ${opts.levering}`,
    `Veiledende sum: ${sum} (frakt ${frakt} kommer i tillegg)`,
    `Ordrereferanse: ${opts.ordreId}`,
    ``,
    `SLIK GÅR VI VIDERE`,
    `1. Vi tegner korrektur og sender deg et tilbud på e-post.`,
    `2. Ingenting graveres før du har sagt ja til korrekturen.`,
    `3. Normalt 7-10 virkedager fra du har godkjent den.`,
    `4. Faktura følger med varen - du betaler ingenting før den er på vei.`,
    ``,
    `Prisen er endelig: Minio er et enkeltpersonforetak under grensen for`,
    `mva-registrering, så det legges ikke merverdiavgift på beløpet.`,
    ``,
    `Svar på denne e-posten hvis noe skal endres.`,
    ``,
    `Minio - minio.no`,
  ].join('\n')

  const html = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:560px;color:#1c1917">
      <h2 style="margin:0 0 16px">Takk, ${esc(fornavn)} – vi har fått bestillingen!</h2>
      <p style="margin:0 0 20px;color:#57534e">
        Ingenting graveres før du har sett og godkjent en korrektur. Du betaler ingenting nå.
      </p>
      <div style="background:#f5f5f4;border-radius:12px;padding:18px;margin:0 0 20px">
        <div style="font-size:13px;text-transform:uppercase;letter-spacing:.08em;color:#57534e;margin-bottom:10px">Bestillingen din</div>
        <pre style="margin:0;font-family:inherit;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(opts.sammendrag)}</pre>
      </div>
      <p style="margin:0 0 6px"><strong>Leveres til:</strong> ${esc(opts.levering)}</p>
      <p style="margin:0 0 6px"><strong>Veiledende sum:</strong> ${esc(sum)} <span style="color:#78716c">(frakt ${esc(frakt)} kommer i tillegg)</span></p>
      <p style="margin:0 0 20px"><strong>Ordrereferanse:</strong> ${esc(opts.ordreId)}</p>
      <h3 style="margin:0 0 10px;font-size:16px">Slik går vi videre</h3>
      <ol style="margin:0 0 20px;padding-left:20px;color:#44403c;line-height:1.7">
        <li>Vi tegner korrektur og sender deg et tilbud på e-post.</li>
        <li>Ingenting graveres før du har sagt ja til korrekturen.</li>
        <li>Normalt 7–10 virkedager fra du har godkjent den.</li>
        <li>Faktura følger med varen – du betaler ingenting før den er på vei.</li>
      </ol>
      <p style="margin:0 0 20px;color:#57534e;font-size:14px">
        Prisen er endelig: Minio er et enkeltpersonforetak under grensen for mva-registrering,
        så det legges ikke merverdiavgift på beløpet.
      </p>
      <p style="margin:0 0 20px;color:#57534e;font-size:14px">Svar på denne e-posten hvis noe skal endres.</p>
      <p style="margin:0;color:#78716c;font-size:13px">Minio – <a href="https://minio.no">minio.no</a></p>
    </div>`

  return sendEpost({ til: opts.til, emne: 'Vi har fått graveringsbestillingen din – Minio', html, tekst })
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
export async function varsleAdmin(opts: {
  til?: string
  emne: string
  tekst: string
  html: string
  svarTil?: string
}): Promise<boolean> {
  if (opts.til && (await sendEpost({ til: opts.til, emne: opts.emne, html: opts.html, tekst: opts.tekst, svarTil: opts.svarTil }))) {
    return true
  }
  try {
    const res = await fetch(FORMSPREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // `email` er feltet Formspree bruker som Reply-To.
      body: JSON.stringify({ _subject: opts.emne, Melding: opts.tekst, ...(opts.svarTil ? { email: opts.svarTil } : {}) }),
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
