/**
 * POST /api/plan/bestill
 *
 * Manuell salgsvei for byggeplan, brukt i lanseringsmodus (før Vipps har
 * godkjent salgsavtalen og sluppet produksjonsnøkler).
 *
 * Flyten:
 *  1. Kunden ber om byggeplanen herfra.
 *  2. Serveren lager en 6-sifret tilgangskode og lagrer den på en forespørsel
 *     i `designForesporsler`. Koden ligger BARE der – aldri på designet, som
 *     kunden selv kan lese – slik at den ikke kan plukkes ut av Firestore uten
 *     å betale.
 *  3. Admin ser forespørselen med koden på /admin/foresporsler, tar imot Vipps
 *     manuelt og sender koden til kunden.
 *  4. Kunden løser inn koden via POST /api/vipps/redeem.
 *
 * Body: { prosjektId, melding?, maal?, sammendrag?, arealM2?, estimatKr? }
 * Auth: Authorization: Bearer <Firebase ID-token>
 */
import type { VercelRequest } from '@vercel/node'
import { FieldValue } from 'firebase-admin/firestore'
import { adminAuth, db } from '../_lib/firebaseAdmin'
import { HttpError, postHandler } from '../_lib/http'
import { prisFor } from '../_lib/pricing'
import { alleredeKjopt, eideKjopt, type ProsjektDoc } from '../_lib/entitlements'
import { nyTilgangskode } from '../_lib/kode'
import { varsleAdmin as sendAdminVarsel } from '../_lib/email'

const PROSJEKTER = 'designerProsjekter'
const FORESPORSLER = 'designForesporsler'
const SITE_URL = (process.env.SITE_URL ?? 'https://minio.no').replace(/\/$/, '')

/** Kutter kundetekst så et enormt felt ikke havner i basen eller e-posten. */
const kort = (v: unknown, maks: number): string => String(v ?? '').slice(0, maks)

export default postHandler(async (req: VercelRequest, uid: string) => {
  const prosjektId = String(req.body?.prosjektId ?? '')
  if (!prosjektId) throw new HttpError(400, 'Mangler prosjektId.')

  const ref = db.collection(PROSJEKTER).doc(prosjektId)
  const snap = await ref.get()
  if (!snap.exists) throw new HttpError(404, 'Fant ikke designet.')
  const p = snap.data() as ProsjektDoc
  if (p.userId !== uid) throw new HttpError(403, 'Dette designet tilhører ikke deg.')

  if (alleredeKjopt(eideKjopt(p), 'plan')) {
    return { ok: true, alleredeKjopt: true }
  }

  const belopKr = prisFor(p.templateId, 'plan')
  const epost = await adminAuth
    .getUser(uid)
    .then((u) => u.email ?? '')
    .catch(() => '')

  // Har kunden alt bedt om denne planen, gjenbruk koden i stedet for å lage en
  // ny – ellers blir koden admin allerede har sendt ut ugyldig.
  const finnes = await db
    .collection(FORESPORSLER)
    .where('designId', '==', prosjektId)
    .where('type', '==', 'byggeplan')
    .limit(1)
    .get()

  const eksisterende = finnes.docs[0]
  const tilgangskode = (eksisterende?.get('tilgangskode') as string) || nyTilgangskode()

  const felt = {
    userId: uid,
    userEmail: epost,
    type: 'byggeplan' as const,
    designId: prosjektId,
    produktId: p.templateId,
    produktNavn: p.templateId,
    designNavn: p.navn,
    sammendrag: kort(req.body?.sammendrag, 2000),
    maal: kort(req.body?.maal, 200),
    arealM2: typeof req.body?.arealM2 === 'number' ? req.body.arealM2 : null,
    estimatKr: typeof req.body?.estimatKr === 'number' ? Math.round(req.body.estimatKr) : 0,
    prisEstimatKr: belopKr,
    melding: kort(req.body?.melding, 2000),
    tilgangskode,
  }

  // Varsle admin FØR svaret sendes, slik at `adminVarslet` kan lagres sammen med
  // forespørselen. Feiler e-posten, står forespørselen igjen med adminVarslet:
  // false og /admin/foresporsler viser det som en advarsel på kortet.
  const adminVarslet = await varsleAdmin({ ...felt, belopKr })

  if (eksisterende) {
    await eksisterende.ref.update({
      ...felt,
      adminVarslet,
      status: 'ny',
      updatedAt: FieldValue.serverTimestamp(),
    })
  } else {
    await db.collection(FORESPORSLER).add({
      ...felt,
      adminVarslet,
      status: 'ny',
      createdAt: FieldValue.serverTimestamp(),
    })
  }

  return { ok: true, alleredeKjopt: false, belopKr }
})

/**
 * Varsler admin om forespørselen, med koden som skal sendes til kunden.
 * Sendes med Resend når nøklene finnes, ellers via Formspree-skjemaet (samme
 * som «ferdig»/«materialpakke»-varslene). Returnerer true når varselet gikk
 * ut. Et feilet varsel skal aldri velte bestillingen – koden ligger uansett på
 * forespørselen i /admin/foresporsler.
 */
async function varsleAdmin(f: {
  userEmail: string
  designNavn: string
  produktNavn: string
  maal: string
  melding: string
  tilgangskode: string
  belopKr: number
}): Promise<boolean> {
  // VITE_ADMIN_EMAIL er admin-adressen frontend allerede kjenner; bruk den som
  // fallback slik at Resend-veien virker selv om ADMIN_EPOST ikke er satt.
  const til = process.env.ADMIN_EPOST || process.env.VITE_ADMIN_EMAIL
  const linjer = [
    `Ny forespørsel om byggeplan.`,
    ``,
    `Kunde:    ${f.userEmail || '(ukjent e-post)'}`,
    `Produkt:  ${f.produktNavn}`,
    `Design:   ${f.designNavn}`,
    `Mål:      ${f.maal || '–'}`,
    `Å betale: ${f.belopKr} kr`,
    ``,
    `Tilgangskode å sende kunden når Vipps er mottatt: ${f.tilgangskode}`,
    ``,
    `Melding fra kunden: ${f.melding || '(ingen)'}`,
    ``,
    `${SITE_URL}/admin/foresporsler`,
  ]
  return sendAdminVarsel({
    til,
    emne: `Byggeplan-forespørsel: ${f.designNavn} (${f.belopKr} kr)`,
    tekst: linjer.join('\n'),
    html: `<pre style="font-family:ui-monospace,monospace;font-size:14px">${linjer
      .join('\n')
      .replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string)}</pre>`,
  })
}
