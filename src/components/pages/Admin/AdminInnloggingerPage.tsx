import { useEffect, useMemo, useState } from 'react'
import styled from 'styled-components'
import { getInnlogginger } from '../../../services/kontaktService'
import type { Innlogging, Innloggingsmetode } from '../../../types/kontakt'
import { AdminPageHead, LasterListe, Stat, StatGrid, Tab, Tabs } from './adminUi'
import AdminAktivitet from './AdminAktivitet'
import { bp, t } from './adminTokens'

/**
 * Innloggingsstatistikk – økter og unike brukere over tid.
 *
 * Lå før øverst på kontaktsiden, og dyttet selve lista så langt ned at man
 * måtte rulle forbi to grafer hver gang man skulle slå opp én adresse. Det er
 * to ulike jobber: lista slår man opp i, tallene ser man på en gang i uka.
 */

const PERIODER = [7, 30, 90] as const
type Periode = (typeof PERIODER)[number]

function tilDato(verdi: unknown): Date | undefined {
  return (verdi as { toDate?: () => Date } | undefined)?.toDate?.()
}

export default function AdminInnloggingerPage() {
  /**
   * Øktene lagres SAMMEN MED perioden de gjelder for. Da er «laster» noe som
   * utledes (`hentet.periode !== periode`) i stedet for en egen tilstand som
   * må settes i en effekt – og et raskt bytte fra 7 til 90 dager kan ikke
   * lenger ende med at det trege 7-dagerssvaret lander sist og vinner.
   */
  const [hentet, settHentet] = useState<{ periode: Periode; liste: Innlogging[] } | null>(null)
  const [periode, settPeriode] = useState<Periode>(30)

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

  const okter = useMemo(() => hentet?.liste ?? [], [hentet])
  const laster = hentet?.periode !== periode

  const tidspunkter = useMemo(
    () => okter.map((o) => tilDato(o.tidspunkt)).filter((d): d is Date => Boolean(d)),
    [okter],
  )

  const fordeling = useMemo(() => {
    const kart = new Map<Innloggingsmetode, number>()
    for (const o of okter) kart.set(o.metode, (kart.get(o.metode) ?? 0) + 1)
    return kart
  }, [okter])

  const unike = useMemo(() => new Set(okter.map((o) => o.uid)).size, [okter])

  return (
    <>
      <AdminPageHead
        title="Innlogginger"
        subtitle="Én økt per nettleserøkt, ikke per sidevisning. Registreres fra 27. november 2026 – Firebase har ingen historikk fra før det."
      />

      <Periodevalg>
        {PERIODER.map((p) => (
          <Tab key={p} $active={periode === p} onClick={() => settPeriode(p)}>
            {p} dager
          </Tab>
        ))}
      </Periodevalg>

      <StatGrid>
        <Stat label={`Økter siste ${periode} d.`} value={laster ? '–' : okter.length} />
        <Stat label={`Unike brukere siste ${periode} d.`} value={laster ? '–' : unike} />
        <Stat
          label="Fordeling"
          value={laster ? '–' : (fordeling.get('google') ?? 0)}
          under={
            laster
              ? undefined
              : `Google · E-post ${fordeling.get('epost') ?? 0} · Gjenopptatt ${fordeling.get('gjenopptatt') ?? 0}`
          }
        />
      </StatGrid>

      <Seksjon>
        <h2>Aktivitet</h2>
        {laster ? <LasterListe antall={2} /> : <AdminAktivitet tidspunkter={tidspunkter} dager={periode} />}
      </Seksjon>
    </>
  )
}

const Periodevalg = styled(Tabs)`
  margin-bottom: 1rem;
`

const Seksjon = styled.section`
  margin-top: 2rem;

  h2 {
    margin: 0 0 0.9rem;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${t.svak};
  }

  @media (max-width: ${bp.smal}) {
    margin-top: 1.4rem;
  }
`
