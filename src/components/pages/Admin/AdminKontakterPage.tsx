import { useEffect, useMemo, useRef, useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAlleKontakter, settNyhetsbrev } from '../../../services/kontaktService'
import { kildeLabel, metodeLabel, type Kontakt } from '../../../types/kontakt'
import { byggCsv, datostempel, lastNedCsv } from '../../../utils/csv'
import { AdminPageHead, Empty, LasterListe, Tab, Tabs } from './adminUi'
import { Liste, Radhandlinger, Rad, Statusmerke } from './AdminListe'
import { Sekundaer } from './AdminKort'
import { bp, t } from './adminTokens'

/**
 * Kontaktlista – Minios egen e-postliste. Statistikken over innlogginger
 * ligger på en egen underside (AdminInnloggingerPage).
 *
 * Adressene ble før samlet inne i Brevo. Da fantes lista et sted vi ikke
 * eide, den kunne ikke sees sammen med bestillinger og forespørsler, og
 * innloggede kunder dukket ikke opp noe sted før de kjøpte noe. Nå er
 * Firestore kilden; Brevo er kanalen vi eksporterer TIL.
 *
 * To ting må holdes fra hverandre, og gjør det:
 *   kontakt   – en adresse vi kjenner (innlogget, eller påmeldt)
 *   samtykke  – et aktivt ja til markedsføring
 *
 * Nyhetsbrev-eksporten tar bare de med samtykke. Innlogging er ikke samtykke
 * – det står også i `useAuth` – og en liste som later som om det er det, er
 * en liste man ikke kan sende fra uten å bryte både GDPR og Brevos vilkår.
 */

type Utvalg = 'alle' | 'samtykke' | 'uten'

/**
 * Ett søkefelt i stedet for en regelbygger. Hvert ord må treffe et sted i
 * adresse, navn, kilde eller status – «gmail kim» finner Kim med
 * Gmail-adresse, «nyhetsbrev» de påmeldte og «ikke påmeldt» resten.
 * Statusordene er valgt så de ikke overlapper: en påmeldt rad inneholder
 * aldri «ikke», en ikke-påmeldt aldri «nyhetsbrev» eller «samtykke».
 * Regelbyggeren kunne mer, men ingen trenger «domene inneholder ikke» for
 * en liste på noen hundre adresser; man trenger å finne én person fort.
 */
function treffer(k: Kontakt, ord: string[]): boolean {
  if (ord.length === 0) return true
  const status = k.nyhetsbrev ? 'nyhetsbrev påmeldt samtykke' : 'ikke påmeldt ikke-påmeldt uten'
  const hoystakk = `${k.epost} ${k.navn ?? ''} ${kildeLabel[k.kilde] ?? k.kilde ?? ''} ${status}`.toLowerCase()
  return ord.every((o) => hoystakk.includes(o))
}


function tilDato(verdi: unknown): Date | undefined {
  return (verdi as { toDate?: () => Date } | undefined)?.toDate?.()
}

function datoTekst(verdi: unknown): string {
  const d = tilDato(verdi)
  return d ? d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' }) : '–'
}

function datoIso(verdi: unknown): string {
  const d = tilDato(verdi)
  return d ? datostempel(d) : ''
}

/**
 * Brevo deler navnet i FIRSTNAME og LASTNAME. Vi lagrer det som én streng,
 * fordi det er sånn folk skriver det inn. Siste ordet blir etternavn – det
 * treffer «Ola Nordmann» og «Ola Berg Nordmann», og bommer på de få som har
 * dobbelt etternavn uten bindestrek. Alternativet er to felter i hvert eneste
 * skjema for å vinne de tilfellene, og det koster mer enn det smaker.
 */
function delNavn(navn: string): [string, string] {
  const deler = (navn ?? '').trim().split(/\s+/).filter(Boolean)
  if (deler.length === 0) return ['', '']
  if (deler.length === 1) return [deler[0], '']
  return [deler.slice(0, -1).join(' '), deler[deler.length - 1]]
}

/**
 * Slår sammen rader med samme adresse.
 *
 * Samme person kan ha både en anonym påmelding (rad på adressen) og en konto
 * (rad på uid-en). Brevo ville behandlet dem som én kontakt uansett, siden
 * EMAIL er nøkkelen – da er det bedre at eksporten allerede har bestemt seg
 * for hvilken rad som gjelder enn at importen gjør det for oss.
 *
 * Raden med samtykke vinner; står begge likt, vinner den eldste, fordi det er
 * den som har den riktige «kunde siden»-datoen.
 */
function slaaSammen(liste: Kontakt[]): Kontakt[] {
  const kart = new Map<string, Kontakt>()
  for (const k of liste) {
    // Et dokument uten adresse er verdiløst her, og ville dessuten slått
    // sammen alle de andre adresseløse til én rad.
    if (!k.epost) continue
    const fins = kart.get(k.epost)
    if (!fins) {
      kart.set(k.epost, k)
      continue
    }
    const vinner =
      fins.nyhetsbrev !== k.nyhetsbrev
        ? fins.nyhetsbrev
          ? fins
          : k
        : (tilDato(fins.opprettet)?.getTime() ?? 0) <= (tilDato(k.opprettet)?.getTime() ?? 0)
          ? fins
          : k
    const taper = vinner === fins ? k : fins
    kart.set(k.epost, {
      ...vinner,
      navn: vinner.navn || taper.navn,
      uid: vinner.uid || taper.uid,
      antallOkter: (vinner.antallOkter ?? 0) + (taper.antallOkter ?? 0),
    })
  }
  return [...kart.values()]
}

export default function AdminKontakterPage() {
  const [kontakter, settKontakter] = useState<Kontakt[]>([])
  const [laster, settLaster] = useState(true)
  const [utvalg, settUtvalg] = useState<Utvalg>('alle')
  const [sok, settSok] = useState('')
  const [kopiert, settKopiert] = useState(false)
  const sokefelt = useRef<HTMLInputElement>(null)

  // «/» hopper til søket, som i de fleste verktøy med en liste.
  useEffect(() => {
    const tast = (e: KeyboardEvent) => {
      const mal = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(mal.tagName)) {
        e.preventDefault()
        sokefelt.current?.focus()
      }
    }
    window.addEventListener('keydown', tast)
    return () => window.removeEventListener('keydown', tast)
  }, [])

  useEffect(() => {
    getAlleKontakter()
      .then(settKontakter)
      .catch(() => settKontakter([]))
      .finally(() => settLaster(false))
  }, [])

  const samlet = useMemo(() => slaaSammen(kontakter), [kontakter])

  const iUtvalg = useMemo(
    () =>
      samlet.filter((k) =>
        utvalg === 'alle' ? true : utvalg === 'samtykke' ? k.nyhetsbrev : !k.nyhetsbrev,
      ),
    [samlet, utvalg],
  )

  const synlige = useMemo(
    () => {
      const ord = sok.toLowerCase().split(/\s+/).filter(Boolean)
      return iUtvalg.filter((k) => treffer(k, ord))
    },
    [iUtvalg, sok],
  )

  const medSamtykke = samlet.filter((k) => k.nyhetsbrev).length

  const byttSamtykke = async (k: Kontakt) => {
    if (!k.id) return
    const nyVerdi = !k.nyhetsbrev
    settKontakter((f) => f.map((x) => (x.id === k.id ? { ...x, nyhetsbrev: nyVerdi } : x)))
    try {
      await settNyhetsbrev(k.id, nyVerdi)
    } catch {
      settKontakter((f) => f.map((x) => (x.id === k.id ? { ...x, nyhetsbrev: !nyVerdi } : x)))
    }
  }

  /**
   * Eksporterer NØYAKTIG det som står i lista.
   *
   * At knappen følger filteret er hele poenget: «eksporter alle» og så luke i
   * Excel etterpå er der feilene oppstår – det er slik man ender med å sende
   * nyhetsbrev til sine egne testkontoer. Ser du 34 rader, får du 34 rader.
   */
  const eksporter = () => {
    const rader = synlige.map((k) => {
      const [fornavn, etternavn] = delNavn(k.navn)
      return [
        k.epost,
        fornavn,
        etternavn,
        k.nyhetsbrev ? 'ja' : 'nei',
        k.nyhetsbrevKilde ? kildeLabel[k.nyhetsbrevKilde] : '',
        datoIso(k.nyhetsbrevDato),
        kildeLabel[k.kilde] ?? k.kilde,
        datoIso(k.opprettet),
        datoIso(k.sistSett),
        k.antallOkter ?? 0,
      ]
    })

    const csv = byggCsv(
      [
        'EMAIL',
        'FIRSTNAME',
        'LASTNAME',
        'SAMTYKKE',
        'SAMTYKKE_KILDE',
        'SAMTYKKE_DATO',
        'KILDE',
        'OPPRETTET',
        'SIST_SETT',
        'ANTALL_OKTER',
      ],
      rader,
    )

    const merkelapp =
      utvalg === 'samtykke' ? 'nyhetsbrev' : utvalg === 'uten' ? 'uten-samtykke' : 'alle'
    lastNedCsv(`minio-kontakter-${merkelapp}-${datostempel()}.csv`, csv)
  }

  const kopierAdresser = async () => {
    await navigator.clipboard.writeText(synlige.map((k) => k.epost).join(', '))
    settKopiert(true)
    setTimeout(() => settKopiert(false), 2200)
  }

  const utenSamtykkeIUtvalg = synlige.filter((k) => !k.nyhetsbrev).length

  return (
    <>
      <AdminPageHead
        title="Kontakter"
        subtitle="Minios egen e-postliste. Eksporter utvalget som CSV og importer det i Brevo når det skal sendes ut."
      />

      <Seksjon>
        {laster ? (
          <LasterListe antall={4} />
        ) : (
          <>
            <Sokefelt>
              <Icon name="faSearch" />
              <input
                ref={sokefelt}
                type="search"
                value={sok}
                onChange={(e) => settSok(e.target.value)}
                placeholder="Søk i navn, e-post, «nyhetsbrev» eller «ikke påmeldt»"
                aria-label="Søk i kontakter"
                autoComplete="off"
              />
              {sok ? (
                <button type="button" onClick={() => settSok('')} aria-label="Tøm søket">
                  <Icon name="faXmark" />
                </button>
              ) : (
                <kbd>/</kbd>
              )}
            </Sokefelt>

            <Tabs>
              <Tab $active={utvalg === 'alle'} onClick={() => settUtvalg('alle')}>
                Alle <em>({samlet.length})</em>
              </Tab>
              <Tab $active={utvalg === 'samtykke'} onClick={() => settUtvalg('samtykke')}>
                Nyhetsbrev <em>({medSamtykke})</em>
              </Tab>
              <Tab $active={utvalg === 'uten'} onClick={() => settUtvalg('uten')}>
                Uten samtykke <em>({samlet.length - medSamtykke})</em>
              </Tab>
            </Tabs>

            <Eksportlinje>
              <Eksportknapp type="button" onClick={kopierAdresser} disabled={synlige.length === 0}>
                <Icon name={kopiert ? 'faCheck' : 'faCopy'} />
                {kopiert
                  ? 'Kopiert'
                  : `Kopier ${synlige.length} ${synlige.length === 1 ? 'adresse' : 'adresser'}`}
              </Eksportknapp>
              <Sekundaer as="button" type="button" onClick={eksporter} disabled={synlige.length === 0}>
                <Icon name="faFileExport" /> CSV
              </Sekundaer>
              <Eksporttekst>
                {sok ? `${synlige.length} av ${iUtvalg.length} treff. ` : ''}
                Adressene kopieres kommaseparert – klare for Blindkopi i Mail.
              </Eksporttekst>
            </Eksportlinje>

            {/*
             * Advarselen dukker bare opp når utvalget FAKTISK inneholder noen
             * uten samtykke. En permanent liten tekst leses ikke etter tredje
             * gang; denne står der bare når den betyr noe.
             */}
            {utenSamtykkeIUtvalg > 0 && (
              <Varsel role="note">
                <Icon name="faBan" />
                <p>
                  <strong>
                    {utenSamtykkeIUtvalg} av {synlige.length} i dette utvalget har ikke samtykket
                  </strong>{' '}
                  til nyhetsbrev. Send dem ikke markedsføring. Velg «Nyhetsbrev» over for bare dem som
                  har sagt ja.
                </p>
              </Varsel>
            )}

            {synlige.length === 0 ? (
              <Empty>
                <h2>Ingen treff</h2>
                <p>
                  {sok
                    ? `Ingen kontakter matcher «${sok}».`
                    : 'Ingen kontakter i dette utvalget ennå.'}
                </p>
              </Empty>
            ) : (
              <Liste>
                {synlige.map((k) => (
                  <Rad
                    key={k.id}
                    tittel={k.epost}
                    undertittel={`${k.navn || 'Uten navn'} · ${kildeLabel[k.kilde] ?? k.kilde}`}
                    status={
                      k.nyhetsbrev ? (
                        <Statusmerke $tone="ny">Nyhetsbrev</Statusmerke>
                      ) : (
                        <Statusmerke>Ikke påmeldt</Statusmerke>
                      )
                    }
                    kolonner={[{ merkelapp: 'Økter', verdi: k.antallOkter ?? 0 }]}
                    dato={datoTekst(k.opprettet)}
                  >
                    <Detaljer>
                      <div>
                        <dt>Samtykke</dt>
                        <dd>
                          {k.nyhetsbrev
                            ? `Ja – gitt i ${k.nyhetsbrevKilde ? kildeLabel[k.nyhetsbrevKilde].toLowerCase() : 'ukjent kilde'} ${datoTekst(k.nyhetsbrevDato)}`
                            : k.avmeldtDato
                              ? `Avmeldt ${datoTekst(k.avmeldtDato)}`
                              : 'Ikke gitt'}
                        </dd>
                      </div>
                      <div>
                        <dt>Konto</dt>
                        <dd>
                          {k.uid
                            ? `${metodeLabel[k.metode] ?? k.metode}${k.epostVerifisert ? ' · bekreftet' : ' · ikke bekreftet'}`
                            : 'Ingen konto – kun påmeldt'}
                        </dd>
                      </div>
                      <div>
                        <dt>Sist sett</dt>
                        <dd>{datoTekst(k.sistSett)}</dd>
                      </div>
                    </Detaljer>

                    <Radhandlinger>
                      <Sekundaer as="button" type="button" onClick={() => byttSamtykke(k)}>
                        <Icon name={k.nyhetsbrev ? 'faBan' : 'faCheck'} />
                        {k.nyhetsbrev ? 'Meld av nyhetsbrev' : 'Meld på nyhetsbrev'}
                      </Sekundaer>
                      <Sekundaer href={`mailto:${k.epost}`}>
                        <Icon name="faEnvelope" /> Send e-post
                      </Sekundaer>
                      <Sekundaer
                        as="button"
                        type="button"
                        onClick={() => navigator.clipboard?.writeText(k.epost)}
                      >
                        <Icon name="faCopy" /> Kopier adresse
                      </Sekundaer>
                    </Radhandlinger>
                  </Rad>
                ))}
              </Liste>
            )}
          </>
        )}
      </Seksjon>
    </>
  )
}

const Seksjon = styled.section`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`

const Sokefelt = styled.label`
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 0.9rem;

  > svg {
    position: absolute;
    left: 1rem;
    font-size: 0.9rem;
    color: ${t.svak};
    pointer-events: none;
  }
  input {
    width: 100%;
    height: 50px;
    padding: 0 3rem 0 2.75rem;
    border: 1px solid ${t.kant};
    border-radius: 14px;
    background: ${t.flate};
    box-shadow: ${t.skygge};
    font-family: inherit;
    font-size: 1rem;
    color: ${t.blekk};
    -webkit-appearance: none;
  }
  input::-webkit-search-cancel-button {
    display: none;
  }
  input::placeholder {
    color: ${t.svak};
  }
  input:focus {
    outline: none;
    border-color: ${t.aksent};
    box-shadow: 0 0 0 4px ${t.aksentSvak};
  }
  kbd,
  button {
    position: absolute;
    right: 0.75rem;
  }
  kbd {
    padding: 0.1rem 0.45rem;
    border: 1px solid ${t.kant};
    border-radius: 6px;
    background: ${t.senket};
    font-family: inherit;
    font-size: 0.75rem;
    color: ${t.svak};
  }
  button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    border: none;
    border-radius: 50%;
    background: ${t.senket};
    color: ${t.dempet};
    cursor: pointer;
  }

  @media (hover: none) {
    kbd {
      display: none;
    }
  }
`

const Eksportlinje = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 1rem;

  @media (max-width: ${bp.mobil}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
`

const Eksportknapp = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  flex-shrink: 0;
  padding: 0.6rem 1.1rem;
  border: none;
  border-radius: ${t.radiusRund};
  background: ${t.blekk};
  color: #fff;
  font-family: inherit;
  font-size: 0.86rem;
  font-weight: 700;
  cursor: pointer;

  svg {
    font-size: 0.8rem;
  }
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  @media (max-width: ${bp.mobil}) {
    min-height: 46px;
  }
`

const Eksporttekst = styled.p`
  margin: 0;
  font-size: 0.78rem;
  line-height: 1.5;
  color: ${t.dempet};
`

const Varsel = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  padding: 0.75rem 0.9rem;
  margin-bottom: 1rem;
  border: 1px solid ${t.venter};
  border-radius: ${t.radiusLiten};
  background: ${t.venterSvak};

  > svg {
    flex-shrink: 0;
    margin-top: 0.15rem;
    font-size: 0.85rem;
    color: ${t.venter};
  }
  p {
    margin: 0;
    font-size: 0.82rem;
    line-height: 1.55;
    color: ${t.blekk};
  }
`

const Detaljer = styled.dl`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.6rem 1.4rem;
  margin: 0;

  dt {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${t.svak};
  }
  dd {
    margin: 0.12rem 0 0;
    font-size: 0.86rem;
    color: ${t.blekk};
    overflow-wrap: anywhere;
  }
`
