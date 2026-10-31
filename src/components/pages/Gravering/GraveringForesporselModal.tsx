import { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import {
  fraktFor,
  graveringKampanje,
  oppsettMal,
  produkt,
  PRIS_ER_ENDELIG,
  ordreAntall,
  ordreSum,
  type Ordrelinje,
} from '../../../data/gravering'
import { lagreGravering } from '../../../services/graveringService'
import { trackEvent } from '../../../utils/analytics'
import Icon from '../../shared/Icon'
import GraveringPreview from './GraveringPreview'
import { byggGraveringSvg } from './graveringSvg'

// Samme Formspree-skjema som kontakt og designforespørsler bruker.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwpwragr'

/**
 * Hvor lenge vi venter på at én vare skal lagres i Firestore.
 *
 * Firestore-klienten gir ikke opp av seg selv – ved nettverksproblemer eller
 * blokkerte forespørsler prøver den i det uendelige. Uten denne fristen ville
 * hele innsendingen hengt, og kunden hadde sittet igjen med en «Sender …»-knapp
 * uten at e-posten til verkstedet gikk ut. Firestore-klienten køer skrivingen
 * lokalt, så dataene lander gjerne likevel når nettet er tilbake – derfor sier
 * e-posten «ikke bekreftet lagret», ikke «tapt».
 */
const LAGRINGSFRIST_MS = 6000

/**
 * Alle varene lagres samtidig, og fristen starter for alle i samme øyeblikk.
 * En bedriftsordre med tjue fjøler ville derfor fått de siste varene merket
 * som «ikke lagret» bare fordi køen tok tid – selv om de gikk fint gjennom.
 * Derfor vokser fristen med ordren, med et tak så en død forbindelse ikke
 * holder kunden fast i mer enn et halvt minutt.
 */
function lagringsfrist(antallVarer: number): number {
  return Math.min(30000, LAGRINGSFRIST_MS + antallVarer * 800)
}

function medTidsfrist<T>(lofte: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    lofte,
    new Promise<never>((_, avvis) => setTimeout(() => avvis(new Error('Tidsavbrudd mot Firestore')), ms)),
  ])
}

interface Props {
  /** Varene som sendes inn. Hver linje lagres som sitt eget dokument. */
  ordre: Ordrelinje[]
  onClose: () => void
}

const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

/** Samme ord som i konfiguratorens plasseringsrutenett. */
const PLASSERING_ORD: Record<string, string> = {
  venstre: 'venstre',
  midt: 'midten',
  hoyre: 'høyre',
  topp: 'øverst',
  bunn: 'nederst',
  auto: 'midten',
}

/**
 * Spesifikasjonen for én vare – alt verkstedet trenger for å gravere den på
 * nytt uten å åpne konfiguratoren, og alt fakturaen trenger for å stemme.
 */
function spesifikasjon(linje: Ordrelinje, nummer: number, av: number): string {
  const { valg, maal, sum, antall } = linje
  const p = produkt(valg.produkt)
  const variant = p.varianter.find((v) => v.id === valg.variant)
  const flate = p.flater.find((f) => f.id === valg.flate)
  const kant = p.kanter?.find((k) => k.id === valg.kant)
  const tekst = valg.linjer.slice(0, p.maksLinjer).filter((l) => l.trim())
  // Variantnavnet er ofte selve målet («Ø 50 × 250 mm») – da er to linjer støy.
  const maalLinje = variant?.navn === maal ? [] : [`Mål: ${maal}`]
  const plassering =
    valg.juster || valg.loddrett
      ? [`Plassering: ${PLASSERING_ORD[valg.loddrett ?? 'midt']} ${PLASSERING_ORD[valg.juster ?? 'midt']}`]
      : []

  return [
    `— Vare ${nummer} av ${av}: ${p.navn}${antall > 1 ? ` × ${antall}` : ''} —`,
    `${p.variantEtikett}: ${variant?.navn}${variant && variant.antall > 1 ? ` (${variant.antall} stk, lik gravering)` : ''}`,
    ...maalLinje,
    `${p.flateEtikett}: ${flate?.navn}`,
    ...(kant ? [`Kant: ${kant.navn}`] : []),
    `Oppsett: ${oppsettMal(valg.oppsett).navn}`,
    ...plassering,
    `Skrift: ${valg.font}`,
    `Symbol: ${valg.symbol ?? 'ingen'}`,
    `Tekst: ${tekst.length ? tekst.map((l) => `«${l}»`).join(' / ') : 'ingen'}`,
    // Oppdelingen er det fakturaen skal bygge på.
    ...linje.linjer.map((l) => `  ${l.etikett}: ${kr(l.kroner)}`),
    antall > 1 ? `  Sum: ${kr(sum)} × ${antall} = ${kr(sum * antall)}` : `  Sum: ${kr(sum)}`,
  ].join('\n')
}

/** Hele bestillingen: hver vare for seg, og frakten til slutt. */
function bestillingstekst(ordre: Ordrelinje[]): string {
  const sum = ordreSum(ordre)
  const frakt = fraktFor(sum)
  // Ved større bestillinger – typisk en bedrift med ett navn per ansatt – står
  // navnelista samlet øverst, så den kan kopieres rett inn i produksjonen uten
  // å plukkes ut av ti separate blokker.
  const navn = ordre.map((l) => l.valg.linjer.find((t) => t.trim())).filter(Boolean)
  const sammeProdukt = new Set(ordre.map((l) => l.valg.produkt)).size === 1
  const topp =
    ordre.length > 2 && sammeProdukt
      ? [
          `${ordreAntall(ordre)} × ${produkt(ordre[0].valg.produkt).navn}, samme oppsett – ulike navn:`,
          navn.map((n, i) => `${i + 1}. ${n}`).join('\n'),
          '',
        ].join('\n')
      : ''

  return [
    ...(topp ? [topp] : []),
    ordre.map((l, i) => spesifikasjon(l, i + 1, ordre.length)).join('\n\n'),
    [
      '— Å fakturere —',
      `Varer: ${kr(sum)}`,
      frakt.gratis
        ? `Frakt: 0 kr (kampanje: fri frakt over ${graveringKampanje.grense} kr)`
        : `Frakt: ${kr(frakt.kroner)}`,
      `Totalt: ${kr(sum + frakt.kroner)}`,
      'Ingen mva – foretaket er ikke mva-registrert. Faktureres når varen sendes.',
    ].join('\n'),
  ].join('\n\n')
}

/**
 * Forespørsel på en gravert fjøl. Krever ingen innlogging – dette er et
 * gavekjøp, og en Google-pålogging her ville kostet oss kunden.
 *
 * Ved innsending bygges produksjonsfila (SVG med teksten som kurver) og lagres
 * sammen med valgene i Firestore, slik at graveringen kan kjøres rett fra
 * /admin/graveringer. E-postvarselet går til Formspree som før; de to veiene er
 * uavhengige, og forespørselen regnes som sendt om minst én av dem går gjennom.
 */
export default function GraveringForesporselModal({ ordre, onClose }: Props) {
  const varesum = ordreSum(ordre)
  const frakt = fraktFor(varesum)
  const antall = ordreAntall(ordre)
  const [navn, settNavn] = useState('')
  const [epost, settEpost] = useState('')
  const [telefon, settTelefon] = useState('')
  // Leveringsadressen er påkrevd: varen sendes i posten og faktureres ved
  // utsending, så vi trenger den før vi kan gi et endelig tilbud.
  const [adresse, settAdresse] = useState('')
  const [postnr, settPostnr] = useState('')
  const [sted, settSted] = useState('')
  const [melding, settMelding] = useState('')
  const [status, settStatus] = useState<'idle' | 'sender' | 'ok' | 'feil'>('idle')
  const boks = useRef<HTMLDivElement>(null)
  // `status` i closuren er utdatert ved et raskt dobbeltklikk – uten denne
  // ble bestillingen lagret og sendt to ganger (med hver sin ordre-id).
  const sender = useRef(false)

  useEffect(() => {
    const lukkPaEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', lukkPaEscape)
    boks.current?.focus()
    return () => document.removeEventListener('keydown', lukkPaEscape)
  }, [onClose])

  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    if (sender.current) return
    sender.current = true
    settStatus('sender')

    const spek = bestillingstekst(ordre)
    // Én felles id binder varene i bestillingen sammen i admin. Dato + tilfeldig
    // hale holder: id-en skal bare gruppere, ikke være hemmelig.
    const ordreId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

    // Produksjonsfilene lagres først: de er det vi faktisk graverer etter.
    // Én vare som feiler skal ikke ta med seg resten.
    const lagret = await Promise.all(
      ordre.map(async (linje) => {
        try {
          const fil = await byggGraveringSvg(linje.valg)
          await medTidsfrist(
            lagreGravering({
              ordreId,
              antall: linje.antall,
              navn,
              epost,
              telefon,
              adresse,
              postnr,
              sted,
              melding: melding.trim(),
              produktId: linje.valg.produkt,
              produktNavn: produkt(linje.valg.produkt).navn,
              sammendrag: spesifikasjon(linje, ordre.indexOf(linje) + 1, ordre.length),
              maal: linje.maal,
              prisSum: linje.sum * linje.antall,
              valg: linje.valg,
              svg: fil.svg,
              filnavn: fil.filnavn,
            }),
            lagringsfrist(ordre.length),
          )
          return true
        } catch (feil) {
          // Kunden skal ikke stoppes av dette – spesifikasjonen i e-posten er
          // nok til å bygge motivet på nytt i konfiguratoren.
          console.error('Kunne ikke lagre graveringen', feil)
          return false
        }
      }),
    )
    const antallLagret = lagret.filter(Boolean).length

    const navnPaVarer = [...new Set(ordre.map((l) => produkt(l.valg.produkt).navn))].join(', ')
    const fd = new FormData()
    fd.append('_subject', `Gravering: ${navnPaVarer} – ${navn}`)
    fd.append('name', navn)
    fd.append('email', epost)
    fd.append('phone', telefon)
    fd.append('Leveringsadresse', `${adresse}, ${postnr} ${sted}`)
    fd.append('subject', `Gravering – ${navnPaVarer}`)
    fd.append('Bestilling', spek)
    fd.append(
      'Produksjonsfil',
      antallLagret === ordre.length
        ? `${antallLagret} SVG lagret – last ned på ${window.location.origin}/admin/graveringer (ordre ${ordreId})`
        : `BARE ${antallLagret} av ${ordre.length} SVG bekreftet lagret (ordre ${ordreId}). Sjekk /admin/graveringer – mangler den, bygg motivet på nytt i konfiguratoren etter spesifikasjonen over.`,
    )
    fd.append('message', melding.trim() || '(ingen melding)')

    let varslet = false
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        body: fd,
        headers: { Accept: 'application/json' },
      })
      varslet = res.ok
    } catch {
      varslet = false
    }

    sender.current = false
    if (antallLagret > 0 || varslet) {
      settStatus('ok')
      trackEvent('gravering_foresporsel', 'gravering')
    } else {
      settStatus('feil')
    }
  }

  return (
    <Overlegg onClick={onClose}>
      <Boks
        ref={boks}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="gravering-tittel"
        onClick={(e) => e.stopPropagation()}
      >
        <Lukk type="button" onClick={onClose} aria-label="Lukk">
          <Icon name="faXmark" />
        </Lukk>

        {status === 'ok' ? (
          <Kvittering role="status">
            <KvitteringIkon>
              <Icon name="faCheckCircle" />
            </KvitteringIkon>
            <h2 id="gravering-tittel">Forespørselen er sendt</h2>
            <p>
              Takk! Vi har fått hele spesifikasjonen og tar kontakt på <strong>{epost}</strong> med et
              uforpliktende tilbud og en korrektur før vi graverer. Faktura kommer først når varen
              sendes.
            </p>
            <Primaer type="button" onClick={onClose}>
              Lukk
            </Primaer>
          </Kvittering>
        ) : (
          <>
            <Topp>
              <Miniatyr>
                <GraveringPreview dekorativ utenSkygge valg={ordre[0].valg} />
              </Miniatyr>
              <div>
                <h2 id="gravering-tittel">
                  {ordre.length > 1
                    ? `Send ${antall} graverte varer til verkstedet`
                    : `Send ${produkt(ordre[0].valg.produkt).navn.toLowerCase()} til verkstedet`}
                </h2>
                <p>
                  Vi går gjennom designet, sender deg en korrektur og et uforpliktende tilbud. Ingenting
                  graveres før du har godkjent, og du betaler ingenting nå – fakturaen sendes når den
                  graverte varen går i posten. {PRIS_ER_ENDELIG}
                </p>
              </div>
            </Topp>

            <Spek>
              {ordre.map((linje) => (
                <li key={linje.id}>
                  <span>
                    {produkt(linje.valg.produkt).navn}
                    {linje.antall > 1 ? ` × ${linje.antall}` : ''}
                    {linje.valg.linjer.find((t) => t.trim()) ? ` – «${linje.valg.linjer.find((t) => t.trim())}»` : ''}
                  </span>
                  <span>{kr(linje.sum * linje.antall)}</span>
                </li>
              ))}
              <li className={frakt.gratis ? 'frakt gratis' : 'frakt'}>
                <span>Frakt</span>
                <span>{frakt.gratis ? 'fri frakt' : kr(frakt.kroner)}</span>
              </li>
              <li className="sum">
                <span>Totalt levert</span>
                <span>{kr(varesum + frakt.kroner)}</span>
              </li>
            </Spek>

            <Skjema onSubmit={send}>
              <Rad>
                <Felt>
                  <label htmlFor="gravering-navn">Navn *</label>
                  <input id="gravering-navn" required maxLength={120} value={navn} onChange={(e) => settNavn(e.target.value)} />
                </Felt>
                <Felt>
                  <label htmlFor="gravering-epost">E-post *</label>
                  <input
                    id="gravering-epost"
                    type="email"
                    required
                    maxLength={200}
                    value={epost}
                    onChange={(e) => settEpost(e.target.value)}
                  />
                </Felt>
              </Rad>
              <Felt>
                <label htmlFor="gravering-telefon">Telefon</label>
                <input id="gravering-telefon" type="tel" maxLength={40} value={telefon} onChange={(e) => settTelefon(e.target.value)} />
              </Felt>
              <Felt>
                <label htmlFor="gravering-adresse">Leveringsadresse *</label>
                <input
                  id="gravering-adresse"
                  required
                  maxLength={200}
                  autoComplete="street-address"
                  placeholder="Gate og husnummer"
                  value={adresse}
                  onChange={(e) => settAdresse(e.target.value)}
                />
              </Felt>
              <Rad $smalForst>
                <Felt>
                  <label htmlFor="gravering-postnr">Postnr. *</label>
                  <input
                    id="gravering-postnr"
                    required
                    inputMode="numeric"
                    autoComplete="postal-code"
                    pattern="[0-9]{4}"
                    maxLength={4}
                    title="Fire siffer"
                    value={postnr}
                    onChange={(e) => settPostnr(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  />
                </Felt>
                <Felt>
                  <label htmlFor="gravering-sted">Sted *</label>
                  <input
                    id="gravering-sted"
                    required
                    maxLength={120}
                    autoComplete="address-level2"
                    value={sted}
                    onChange={(e) => settSted(e.target.value)}
                  />
                </Felt>
              </Rad>
              <Felt>
                <label htmlFor="gravering-melding">Melding</label>
                <textarea
                  id="gravering-melding"
                  rows={3}
                  maxLength={4000}
                  placeholder="Skal den rekke en bestemt dato? Ønsker du flere like?"
                  value={melding}
                  onChange={(e) => settMelding(e.target.value)}
                />
              </Felt>

              {status === 'feil' && (
                <Feil role="alert">
                  Noe gikk galt under sendingen. Prøv igjen, eller ta kontakt via kontaktskjemaet.
                </Feil>
              )}

              <Primaer type="submit" disabled={status === 'sender'}>
                {status === 'sender' ? (
                  <>
                    <Icon name="faSpinner" spin /> Sender …
                  </>
                ) : (
                  <>
                    <Icon name="faPaperPlane" /> Send forespørsel
                  </>
                )}
              </Primaer>
            </Skjema>
          </>
        )}
      </Boks>
    </Overlegg>
  )
}

const Overlegg = styled.div`
  position: fixed;
  inset: 0;
  z-index: 1200;
  display: grid;
  place-items: center;
  padding: 1.25rem;
  background: rgba(28, 26, 24, 0.6);
  backdrop-filter: blur(4px);
  overflow-y: auto;
`

const Boks = styled.div`
  position: relative;
  width: min(620px, 100%);
  max-height: 92vh;
  overflow-y: auto;
  padding: clamp(1.5rem, 4vw, 2.25rem);
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  h2 {
    margin: 0 0 0.4rem;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Lukk = styled.button`
  position: absolute;
  top: 0.9rem;
  right: 0.9rem;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: 50%;
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;

  &:hover {
    background: ${({ theme }) => theme.colors.border};
  }
`

const Topp = styled.div`
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 1.25rem;
  align-items: center;
  margin-bottom: 1.25rem;
  padding-right: 2.5rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const Miniatyr = styled.div`
  padding: 0.6rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.sunken};

  svg {
    display: block;
    width: 100%;
  }
`

const Spek = styled.ul`
  list-style: none;
  margin: 0 0 1.5rem;
  padding: 1rem 1.1rem;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.sunken};

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.25rem 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  li.sum {
    margin-top: 0.4rem;
    padding-top: 0.6rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    font-weight: 600;
    color: ${({ theme }) => theme.colors.ink};
  }

  li.frakt {
    font-style: italic;
    opacity: 0.8;
  }

  li.gratis {
    font-style: normal;
    opacity: 1;
  }

  li.gratis span:last-child {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
  }
`

const Skjema = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
`

const Rad = styled.div<{ $smalForst?: boolean }>`
  display: grid;
  grid-template-columns: ${({ $smalForst }) => ($smalForst ? '7rem 1fr' : '1fr 1fr')};
  gap: 0.85rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const Felt = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;

  label {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  input,
  textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.surface};
    font-family: inherit;
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.ink};
    resize: vertical;

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.focus};
      outline-offset: 1px;
    }
  }
`

const Feil = styled.p`
  margin: 0;
  padding: 0.7rem 0.9rem;
  border-radius: 10px;
  background: ${({ theme }) => theme.colors.errorSoft};
  color: ${({ theme }) => theme.colors.error};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`

const Primaer = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 48px;
  margin-top: 0.25rem;
  padding: 0 1.5rem;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`

const Kvittering = styled.div`
  text-align: center;
  padding: 1rem 0;

  h2 {
    margin-top: 0.75rem;
  }

  p {
    max-width: 44ch;
    margin: 0 auto 1.5rem;
  }
`

const KvitteringIkon = styled.div`
  font-size: 2.5rem;
  color: ${({ theme }) => theme.colors.success};
`
