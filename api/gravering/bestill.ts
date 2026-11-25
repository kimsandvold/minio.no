/**
 * POST /api/gravering/bestill
 *
 * Sender de to e-postene en graveringsbestilling utløser: kvittering til
 * kunden, og varsel til verkstedet.
 *
 * Hvorfor dette ligger på serveren og ikke i nettleseren: før dette postet
 * konfiguratoren rett til Formspree, og falt varselet ut – kvote brukt opp,
 * nede, blokkert av en utvidelse – fikk kunden likevel «Takk!», mens
 * verkstedet aldri hørte om bestillingen. Eneste spor var /admin/graveringer,
 * og det må man huske å se i. Her går varselet via Resend med Formspree som
 * reserve, og svaret sier ærlig hva som faktisk kom fram.
 *
 * Produksjonsfila lagres fortsatt fra klienten rett i Firestore (reglene
 * validerer den). Den er opptil 400 kB SVG, og å sende den gjennom en
 * serverless-funksjon bare for å skrive den videre ville kostet tid og penger
 * uten å gjøre den tryggere.
 *
 * Endepunktet krever innlogging, som bestillingsskjemaet selv gjør
 * (KreverInnlogging). Uten den porten ville dette vært en åpen videresender:
 * hvem som helst kunne fått oss til å sende en Minio-signert e-post med valgfri
 * tekst til en valgfri adresse. Innholdet kappes likevel – en innlogget bruker
 * er identifisert, ikke betrodd.
 *
 * Body: { navn, epost, telefon?, adresse, postnr, sted, melding?, ordreId,
 *         sammendrag, sumKr, fraktKr, varer, antallLagret, antallVarer }
 * Auth: Authorization: Bearer <Firebase ID-token>
 */
import type { VercelRequest } from '@vercel/node'
import { HttpError, postHandler } from '../_lib/http'
import { sendGraveringKvittering, varsleAdmin } from '../_lib/email'

const SITE_URL = (process.env.SITE_URL ?? 'https://minio.no').replace(/\/$/, '')
/** Verkstedets adresse. Mangler den, går varselet til Formspree-reserven. */
const ADMIN_EPOST = process.env.ADMIN_EPOST

/** Kutter kundetekst så et enormt felt ikke havner i e-posten. */
const kort = (v: unknown, maks: number): string => String(v ?? '').trim().slice(0, maks)

/** Tall fra et ukjent legeme: må være endelig og ikke-negativt for å brukes. */
const tall = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

/**
 * Grov sjekk på at adressen i det minste har formen til en e-post. Den
 * strenge valideringen gjør e-posttjenesten; her skal vi bare unngå å bruke
 * endepunktet som en åpen videresender for søppel.
 */
const serUtSomEpost = (s: string): boolean => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)

export default postHandler(async (req: VercelRequest) => {
  const navn = kort(req.body?.navn, 120)
  const epost = kort(req.body?.epost, 200)
  const ordreId = kort(req.body?.ordreId, 40)
  const sammendrag = kort(req.body?.sammendrag, 8000)

  if (!navn) throw new HttpError(400, 'Mangler navn.')
  if (!serUtSomEpost(epost)) throw new HttpError(400, 'E-postadressen ser ikke gyldig ut.')
  if (!ordreId) throw new HttpError(400, 'Mangler ordreId.')
  if (!sammendrag) throw new HttpError(400, 'Mangler spesifikasjon.')

  const telefon = kort(req.body?.telefon, 40)
  const adresse = kort(req.body?.adresse, 200)
  const postnr = kort(req.body?.postnr, 10)
  const sted = kort(req.body?.sted, 120)
  const melding = kort(req.body?.melding, 4000)
  const varer = kort(req.body?.varer, 300) || 'Gravering'
  const sumKr = tall(req.body?.sumKr)
  const fraktKr = tall(req.body?.fraktKr)
  const antallVarer = tall(req.body?.antallVarer)
  const antallLagret = tall(req.body?.antallLagret)

  const levering = [adresse, [postnr, sted].filter(Boolean).join(' ')].filter(Boolean).join(', ')

  // Verkstedet må vite om produksjonsfilene faktisk kom fram. Gjorde de ikke
  // det, kan motivet bygges opp igjen fra spesifikasjonen – men da må det stå
  // her, ikke oppdages når fila skal lastes ned.
  const filstatus =
    antallVarer > 0 && antallLagret === antallVarer
      ? `${antallLagret} produksjonsfil(er) lagret – last ned på ${SITE_URL}/admin/graveringer`
      : `OBS: bare ${antallLagret} av ${antallVarer} produksjonsfiler bekreftet lagret. ` +
        `Sjekk ${SITE_URL}/admin/graveringer – mangler fila, bygg motivet på nytt i konfiguratoren etter spesifikasjonen over.`

  const adminTekst = [
    `Ny graveringsbestilling fra ${navn}.`,
    ``,
    sammendrag,
    ``,
    `Veiledende sum: ${sumKr.toLocaleString('nb-NO')} kr (frakt ${fraktKr.toLocaleString('nb-NO')} kr i tillegg)`,
    ``,
    `KUNDE`,
    `Navn: ${navn}`,
    `E-post: ${epost}`,
    telefon ? `Telefon: ${telefon}` : `Telefon: (ikke oppgitt)`,
    `Leveres til: ${levering || '(ikke oppgitt)'}`,
    ``,
    `Melding: ${melding || '(ingen)'}`,
    ``,
    `Ordrereferanse: ${ordreId}`,
    filstatus,
  ].join('\n')

  const esc = (s: string) =>
    s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string)

  const adminHtml = `
    <div style="font-family:system-ui,-apple-system,sans-serif;max-width:620px;color:#1c1917">
      <h2 style="margin:0 0 4px">Ny graveringsbestilling</h2>
      <p style="margin:0 0 18px;color:#57534e">${esc(navn)} · ${esc(varer)}</p>
      <pre style="background:#f5f5f4;border-radius:12px;padding:18px;margin:0 0 18px;font-family:inherit;font-size:14px;line-height:1.6;white-space:pre-wrap">${esc(sammendrag)}</pre>
      <p style="margin:0 0 18px"><strong>Veiledende sum:</strong> ${esc(sumKr.toLocaleString('nb-NO'))} kr
        <span style="color:#78716c">(frakt ${esc(fraktKr.toLocaleString('nb-NO'))} kr i tillegg)</span></p>
      <h3 style="margin:0 0 8px;font-size:16px">Kunde</h3>
      <p style="margin:0 0 4px">${esc(navn)} · <a href="mailto:${esc(epost)}">${esc(epost)}</a>${telefon ? ` · ${esc(telefon)}` : ''}</p>
      <p style="margin:0 0 18px;color:#57534e">Leveres til: ${esc(levering || '(ikke oppgitt)')}</p>
      ${melding ? `<p style="margin:0 0 18px"><strong>Melding:</strong> «${esc(melding)}»</p>` : ''}
      <p style="margin:0 0 6px;color:#57534e;font-size:14px">Ordrereferanse: <code>${esc(ordreId)}</code></p>
      <p style="margin:0 0 18px;font-size:14px">${esc(filstatus)}</p>
      <p style="margin:0"><a href="${SITE_URL}/admin/graveringer">Åpne i admin</a></p>
    </div>`

  // Varselet til verkstedet er det som ikke får lov til å forsvinne, så det
  // sendes først og har Formspree i bakhånd. Kvitteringen til kunden er
  // hyggelig, men den kan ikke gå via Formspree – det skjemaet leverer kun
  // til skjema-eieren.
  const varslet = await varsleAdmin({
    til: ADMIN_EPOST,
    emne: `Gravering: ${varer} – ${navn}`,
    tekst: adminTekst,
    html: adminHtml,
    svarTil: epost,
  })

  const kvittering = await sendGraveringKvittering({
    til: epost,
    navn,
    ordreId,
    sammendrag,
    levering: levering || 'oppgis senere',
    sumKr,
    fraktKr,
  })

  return { ok: true, varslet, kvittering }
})
