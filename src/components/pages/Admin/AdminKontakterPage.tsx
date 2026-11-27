import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { getAlleKontakter, getInnlogginger, settNyhetsbrev } from '../../../services/kontaktService'
import {
  kildeLabel,
  metodeLabel,
  type Innlogging,
  type Innloggingsmetode,
  type Kontakt,
} from '../../../types/kontakt'
import { byggCsv, datostempel, lastNedCsv } from '../../../utils/csv'
import { AdminPageHead, Empty, LasterListe, Stat, StatGrid, Tab, Tabs } from './adminUi'
import { Liste, Radhandlinger, Rad, Statusmerke } from './AdminListe'
import { Sekundaer } from './AdminKort'
import AdminAktivitet from './AdminAktivitet'
import AdminFilter from './AdminFilter'
import {
  filterTekst,
  passererFilter,
  type Filterfelt,
  type Regel,
  type Snarvei,
} from './filterRegler'
import { bp, t } from './adminTokens'

/**
 * Kontaktlista – Minios egen e-postliste, og statistikken over innlogginger.
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

const PERIODER = [7, 30, 90] as const
type Periode = (typeof PERIODER)[number]

type Utvalg = 'alle' | 'samtykke' | 'uten'

const FELTER: Filterfelt[] = [
  { nokkel: 'epost', navn: 'E-post' },
  { nokkel: 'domene', navn: 'Domene' },
  { nokkel: 'navn', navn: 'Navn' },
  { nokkel: 'kilde', navn: 'Kilde' },
]

/**
 * Filtrene man setter opp igjen og igjen. Ett klikk legger regelen i lista,
 * der den kan endres som alle andre – de er en snarvei, ikke en egen modus.
 */
const SNARVEIER: Snarvei[] = [
  { navn: 'Gmail', regel: { felt: 'domene', operator: 'er', verdi: 'gmail.com' } },
  { navn: 'Hotmail/Outlook', regel: { felt: 'domene', operator: 'inneholder', verdi: 'hotmail' } },
  { navn: 'Jobbadresser', regel: { felt: 'domene', operator: 'inneholder-ikke', verdi: 'gmail' } },
  { navn: 'Mangler navn', regel: { felt: 'navn', operator: 'er-tom', verdi: '' } },
  { navn: 'Uten test-adresser', regel: { felt: 'epost', operator: 'inneholder-ikke', verdi: 'test' } },
]

function feltverdi(k: Kontakt, felt: string): string {
  switch (felt) {
    case 'epost':
      return k.epost ?? ''
    case 'domene':
      return (k.epost ?? '').split('@')[1] ?? ''
    case 'navn':
      return k.navn ?? ''
    case 'kilde':
      return kildeLabel[k.kilde] ?? k.kilde ?? ''
    default:
      return ''
  }
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
  /**
   * Øktene lagres SAMMEN MED perioden de gjelder for. Da er «laster» noe som
   * utledes (`hentet.periode !== periode`) i stedet for en egen tilstand som
   * må settes i en effekt – og et raskt bytte fra 7 til 90 dager kan ikke
   * lenger ende med at det trege 7-dagerssvaret lander sist og vinner.
   */
  const [hentet, settHentet] = useState<{ periode: Periode; liste: Innlogging[] } | null>(null)
  const [laster, settLaster] = useState(true)
  const [periode, settPeriode] = useState<Periode>(30)
  const [utvalg, settUtvalg] = useState<Utvalg>('alle')
  const [regler, settRegler] = useState<Regel[]>([])

  useEffect(() => {
    getAlleKontakter()
      .then(settKontakter)
      .catch(() => settKontakter([]))
      .finally(() => settLaster(false))
  }, [])

  useEffect(() => {
    let avbrutt = false
    getInnlogginger(periode)
      .catch(() => [] as Innlogging[])
      .then((liste) => {
        if (!avbrutt) settHentet({ periode, liste })
      })
    return () => {
      avbrutt = true
    }
  }, [periode])

  // Memoisert slik at den tomme lista ikke er et nytt array på hver render –
  // ellers regnes alle utledningene under på nytt hver gang.
  const okter = useMemo(() => hentet?.liste ?? [], [hentet])
  const lasterOkter = hentet?.periode !== periode

  const samlet = useMemo(() => slaaSammen(kontakter), [kontakter])

  const iUtvalg = useMemo(
    () =>
      samlet.filter((k) =>
        utvalg === 'alle' ? true : utvalg === 'samtykke' ? k.nyhetsbrev : !k.nyhetsbrev,
      ),
    [samlet, utvalg],
  )

  const synlige = useMemo(
    () => iUtvalg.filter((k) => passererFilter(k, regler, feltverdi)),
    [iUtvalg, regler],
  )

  const tidspunkter = useMemo(
    () => okter.map((o) => tilDato(o.tidspunkt)).filter((d): d is Date => Boolean(d)),
    [okter],
  )

  const fordeling = useMemo(() => {
    const kart = new Map<Innloggingsmetode, number>()
    for (const o of okter) kart.set(o.metode, (kart.get(o.metode) ?? 0) + 1)
    return kart
  }, [okter])

  const unikeIPerioden = useMemo(() => new Set(okter.map((o) => o.uid)).size, [okter])
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

  const utenSamtykkeIUtvalg = synlige.filter((k) => !k.nyhetsbrev).length

  return (
    <>
      <AdminPageHead
        title="Kontakter"
        subtitle="Minios egen e-postliste og innloggingsstatistikk. Eksporter utvalget som CSV og importer det i Brevo når det skal sendes ut."
      />

      <StatGrid>
        <Stat label="Kontakter totalt" value={laster ? '–' : samlet.length} />
        <Stat
          label="Med nyhetsbrev-samtykke"
          value={laster ? '–' : medSamtykke}
          under={
            samlet.length > 0 ? `${Math.round((medSamtykke / samlet.length) * 100)} % av lista` : undefined
          }
        />
        <Stat
          label={`Økter siste ${periode} d.`}
          value={lasterOkter ? '–' : okter.length}
          under={
            lasterOkter
              ? undefined
              : [
                  ['google', 'Google'],
                  ['epost', 'E-post'],
                  ['gjenopptatt', 'Gjenopptatt'],
                ]
                  .map(([n, navn]) => `${navn} ${fordeling.get(n as Innloggingsmetode) ?? 0}`)
                  .join(' · ')
          }
        />
        <Stat
          label={`Unike brukere siste ${periode} d.`}
          value={lasterOkter ? '–' : unikeIPerioden}
        />
      </StatGrid>

      <Seksjon>
        <SeksjonTopp>
          <h2>Aktivitet</h2>
          <Tabs>
            {PERIODER.map((p) => (
              <Tab key={p} $active={periode === p} onClick={() => settPeriode(p)}>
                {p} dager
              </Tab>
            ))}
          </Tabs>
        </SeksjonTopp>

        {lasterOkter ? (
          <LasterListe antall={2} />
        ) : (
          <AdminAktivitet tidspunkter={tidspunkter} dager={periode} />
        )}
      </Seksjon>

      <Seksjon>
        <SeksjonTopp>
          <h2>Lista</h2>
        </SeksjonTopp>

        {laster ? (
          <LasterListe antall={4} />
        ) : (
          <>
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

            <AdminFilter
              felter={FELTER}
              regler={regler}
              settRegler={settRegler}
              snarveier={SNARVEIER}
              treff={synlige.length}
              totalt={samlet.length}
            />

            <Eksportlinje>
              <Eksportknapp type="button" onClick={eksporter} disabled={synlige.length === 0}>
                <Icon name="faFileExport" />
                Eksporter {synlige.length} {synlige.length === 1 ? 'kontakt' : 'kontakter'} (CSV)
              </Eksportknapp>
              <Eksporttekst>
                {regler.length > 0 && <>Filter: {filterTekst(regler, FELTER) || 'ingen aktive'}. </>}
                Kolonnene heter det Brevo forventer – EMAIL, FIRSTNAME, LASTNAME – resten kommer
                med som egne attributter.
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
                  til nyhetsbrev. De er fine å ha som kontaktliste, men skal ikke lastes inn i en
                  Brevo-liste det sendes markedsføring fra. Velg «Nyhetsbrev» over for bare dem som
                  har sagt ja.
                </p>
              </Varsel>
            )}

            {synlige.length === 0 ? (
              <Empty>
                <h2>Ingen treff</h2>
                <p>
                  {regler.length > 0
                    ? 'Ingen kontakter passer filteret. Prøv å fjerne en regel.'
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

const SeksjonTopp = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.9rem;

  h2 {
    margin: 0;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${t.svak};
  }

  /* Periodevelgeren står på linje med overskriften, ikke under den. */
  > div {
    margin-bottom: 0;
  }

  @media (max-width: ${bp.smal}) {
    flex-direction: column;
    align-items: stretch;
    gap: 0.6rem;
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
