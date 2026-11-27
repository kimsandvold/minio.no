import { useMemo, useState } from 'react'
import styled from 'styled-components'
import Icon from '../../shared/Icon'
import { bp, t } from './adminTokens'

/**
 * Aktivitetsgrafene under /admin/kontakter.
 *
 * Alle tre er ÉN serie. Det er ikke latskap: admin-aksenten og den dempede
 * grå ligger for tett til å brukes som to kategorier – de skiller seg med
 * ΔE 14 for normalt fargesyn, under grensa på 15, og er altså vanskelige å
 * holde fra hverandre selv for den som ser alle farger. Fordelingen mellom
 * Google, e-post og gjenopptatt økt står derfor som tall over grafen i
 * stedet for som tre farger inni den.
 *
 * Søylelengden bærer verdien. Fargen er konstant og koder ingenting – en
 * søyle som både er lengre OG mørkere sier det samme to ganger, og gjør det
 * vanskeligere å lese av de korte.
 */

export interface Punkt {
  nokkel: string
  /** Teksten under søyla. Tom streng når aksen er for trang til alle. */
  etikett: string
  /** Full beskrivelse – brukes i tipset og i tabellvisningen. */
  navn: string
  verdi: number
}

function Stolpegraf({
  tittel,
  undertittel,
  punkter,
  enhet,
}: {
  tittel: string
  undertittel?: string
  punkter: Punkt[]
  enhet: string
}) {
  const [tabell, settTabell] = useState(false)
  const [peker, settPeker] = useState<Punkt | null>(null)

  const maks = Math.max(1, ...punkter.map((p) => p.verdi))
  const sum = punkter.reduce((s, p) => s + p.verdi, 0)
  // Bare toppen får tall rett på søyla. Et tall på hver søyle blir en
  // tallrekke med litt pynt bak, og da er tabellen et bedre valg.
  const toppNokkel = punkter.find((p) => p.verdi === maks)?.nokkel

  return (
    <Graf>
      <GrafTopp>
        <div>
          <h3>{tittel}</h3>
          {undertittel && <p>{undertittel}</p>}
        </div>
        <Bytt type="button" onClick={() => settTabell((v) => !v)} aria-pressed={tabell}>
          <Icon name={tabell ? 'faChartColumn' : 'faTableList'} />
          {tabell ? 'Graf' : 'Tabell'}
        </Bytt>
      </GrafTopp>

      {sum === 0 ? (
        <Tomt>Ingen registrerte økter i perioden.</Tomt>
      ) : tabell ? (
        <Tabell>
          <caption className="sr">{tittel}</caption>
          <thead>
            <tr>
              <th scope="col">Periode</th>
              <th scope="col">{enhet}</th>
            </tr>
          </thead>
          <tbody>
            {punkter.map((p) => (
              <tr key={p.nokkel}>
                <th scope="row">{p.navn}</th>
                <td>{p.verdi}</td>
              </tr>
            ))}
          </tbody>
        </Tabell>
      ) : (
        <Plott>
          {/* Hjelpelinjer bak søylene: nok til å kunne lese av nivå, svake
              nok til at de ikke konkurrerer med dataene. */}
          <Linjer aria-hidden="true">
            <span />
            <span />
            <span />
          </Linjer>
          <Tak aria-hidden="true">{maks}</Tak>

          <Soyler
            role="img"
            aria-label={`${tittel}. ${punkter.map((p) => `${p.navn}: ${p.verdi}`).join('. ')}`}
            onMouseLeave={() => settPeker(null)}
          >
            {punkter.map((p) => (
              <Spor
                key={p.nokkel}
                onMouseEnter={() => settPeker(p)}
                onFocus={() => settPeker(p)}
                onBlur={() => settPeker(null)}
                tabIndex={0}
                $aktiv={peker?.nokkel === p.nokkel}
              >
                {p.nokkel === toppNokkel && p.verdi > 0 && <Topptall>{p.verdi}</Topptall>}
                <Soyle style={{ height: `${(p.verdi / maks) * 100}%` }} $tom={p.verdi === 0} />
              </Spor>
            ))}
          </Soyler>

          <Akse aria-hidden="true" $tett={punkter.length > 12}>
            {punkter.map((p, i) =>
              p.etikett ? (
                <Merkelapp
                  key={p.nokkel}
                  style={{ left: `${((i + 0.5) / punkter.length) * 100}%` }}
                  $anker={
                    p.etikett.length <= 3
                      ? 'midt'
                      : i === 0
                        ? 'start'
                        : i === punkter.length - 1
                          ? 'slutt'
                          : 'midt'
                  }
                >
                  {p.etikett}
                </Merkelapp>
              ) : null,
            )}
          </Akse>

          <Tips role="status" $synlig={Boolean(peker)}>
            {peker ? (
              <>
                <strong>{peker.verdi}</strong> {enhet.toLowerCase()} · {peker.navn}
              </>
            ) : (
              <span>Hold over en søyle for detaljer</span>
            )}
          </Tips>
        </Plott>
      )}
    </Graf>
  )
}

const UKEDAGER = ['Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag', 'Søndag']
const UKEDAG_KORT = ['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø']

/** `2026-11-27` i lokal tid. `toISOString()` ville gitt UTC og bommet på dagen. */
function dagsnokkel(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Grafene for én periode.
 *
 * `tidspunkter` er alle registrerte økter, allerede avgrenset til perioden av
 * spørringa. Dagene fylles ut med nuller: en graf som bare viser dagene det
 * skjedde noe, lyver om hvor jevn trafikken er.
 */
export default function AdminAktivitet({
  tidspunkter,
  dager,
}: {
  tidspunkter: Date[]
  dager: number
}) {
  const { perDag, perTime, perUkedag } = useMemo(() => {
    const dag = new Map<string, number>()
    const time = new Array<number>(24).fill(0)
    const ukedag = new Array<number>(7).fill(0)

    for (const d of tidspunkter) {
      dag.set(dagsnokkel(d), (dag.get(dagsnokkel(d)) ?? 0) + 1)
      time[d.getHours()] += 1
      // getDay() er 0 = søndag. Norske uker starter på mandag.
      ukedag[(d.getDay() + 6) % 7] += 1
    }

    // Hver n-te dag får etikett, så aksen ikke blir en grå grøt på 90 dager.
    const steg = dager <= 7 ? 1 : dager <= 30 ? 5 : 14
    const perDag: Punkt[] = []
    for (let i = dager - 1; i >= 0; i--) {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      d.setDate(d.getDate() - i)
      const nokkel = dagsnokkel(d)
      perDag.push({
        nokkel,
        etikett: i % steg === 0 ? d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' }) : '',
        navn: d.toLocaleDateString('nb-NO', { weekday: 'long', day: 'numeric', month: 'long' }),
        verdi: dag.get(nokkel) ?? 0,
      })
    }

    return {
      perDag,
      perTime: time.map((v, i) => ({
        nokkel: `t${i}`,
        etikett: i % 3 === 0 ? String(i) : '',
        navn: `kl. ${String(i).padStart(2, '0')}–${String((i + 1) % 24).padStart(2, '0')}`,
        verdi: v,
      })),
      perUkedag: ukedag.map((v, i) => ({
        nokkel: `u${i}`,
        etikett: UKEDAG_KORT[i],
        navn: UKEDAGER[i],
        verdi: v,
      })),
    }
  }, [tidspunkter, dager])

  return (
    <>
      <Stolpegraf
        tittel="Økter per dag"
        undertittel={`Siste ${dager} dager. Én økt = én innlogget nettleserøkt, ikke én sidevisning.`}
        punkter={perDag}
        enhet="Økter"
      />
      <ToGrafer>
        <Stolpegraf
          tittel="Når på døgnet"
          undertittel="Alle økter i perioden, fordelt på klokketime."
          punkter={perTime}
          enhet="Økter"
        />
        <Stolpegraf
          tittel="Hvilken ukedag"
          undertittel="Alle økter i perioden, fordelt på ukedag."
          punkter={perUkedag}
          enhet="Økter"
        />
      </ToGrafer>
    </>
  )
}

const Graf = styled.section`
  padding: 1rem 1.1rem 0.9rem;
  margin-bottom: 1rem;
  background: ${t.flate};
  border: 1px solid ${t.kant};
  border-radius: ${t.radius};
  box-shadow: ${t.skygge};
`

const GrafTopp = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.1rem;

  h3 {
    margin: 0;
    font-size: 0.98rem;
    font-weight: 700;
    color: ${t.blekk};
  }
  p {
    margin: 0.2rem 0 0;
    font-size: 0.79rem;
    line-height: 1.45;
    color: ${t.dempet};
    max-width: 52ch;
  }
`

const Bytt = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.35rem 0.7rem;
  border: 1px solid ${t.kant};
  border-radius: ${t.radiusRund};
  background: ${t.flate};
  color: ${t.dempet};
  font-family: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;

  svg {
    font-size: 0.7rem;
  }
  &:hover {
    border-color: ${t.svak};
    color: ${t.blekk};
  }
`

const Plott = styled.div`
  position: relative;
`

const Linjer = styled.div`
  position: absolute;
  inset: 0 0 2.4rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;

  span {
    height: 1px;
    background: ${t.kantSvak};
  }
`

/** Toppverdien på y-aksen. Uten den vet man ikke hva den høyeste søyla ER. */
const Tak = styled.span`
  position: absolute;
  top: -0.35rem;
  right: 0;
  padding-left: 0.4rem;
  background: ${t.flate};
  font-size: 0.7rem;
  font-weight: 600;
  color: ${t.svak};
  font-variant-numeric: tabular-nums;
`

const Soyler = styled.div`
  position: relative;
  display: flex;
  align-items: flex-end;
  /* 2 px mellomrom er nok til å skille nabosøyler uten å spise bredde. */
  gap: 2px;
  height: 140px;

  @media (max-width: ${bp.smal}) {
    height: 112px;
  }
`

const Spor = styled.div<{ $aktiv: boolean }>`
  position: relative;
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  align-items: flex-end;
  border-radius: 3px;
  /* Treffflata er hele kolonnen, ikke bare søyla – ellers må man treffe en
     3 px høy strek for å se tallet bak en stille dag. */
  background: ${({ $aktiv }) => ($aktiv ? t.senket : 'transparent')};
  cursor: default;

  &:focus-visible {
    outline: 2px solid ${t.aksent};
    outline-offset: 1px;
  }
`

const Soyle = styled.div<{ $tom: boolean }>`
  width: 100%;
  /*
   * Tak på bredden. Ukedagsgrafen har bare sju søyler, og uten dette blir de
   * 100 px brede plater der fargeflata roper høyere enn høydeforskjellen man
   * faktisk skal lese. Dagsgrafen med 90 søyler treffer aldri taket.
   */
  max-width: 46px;
  margin: 0 auto;
  min-height: ${({ $tom }) => ($tom ? '2px' : '3px')};
  /* Runde topper, firkantet fot: søyla er festet til grunnlinja. */
  border-radius: 4px 4px 0 0;
  background: ${({ $tom }) => ($tom ? t.kantSvak : t.aksent)};
`

const Topptall = styled.span`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  padding-bottom: 2px;
  font-size: 0.68rem;
  font-weight: 700;
  color: ${t.dempet};
  font-variant-numeric: tabular-nums;
`

/**
 * Aksen var én <span> per søyle med `flex: 1`. På mobil er hver kolonne da
 * rundt 11 px, mens «27. nov.» er 45 – teksten rant ut over kortkanten og ga
 * hele siden vannrett rulling (402 px innhold i et 390 px vindu).
 *
 * Nå ligger hver merkelapp absolutt plassert over midten av sin egen søyle.
 * Boksen er 0 px bred, så den kan ikke dytte noe; `overflow: hidden` er bare
 * en sikring.
 */
const Akse = styled.div<{ $tett: boolean }>`
  position: relative;
  height: 1rem;
  margin-top: 0.4rem;
  overflow: hidden;

  /*
   * På telefon er det ikke plass til alle merkelappene i de tette grafene –
   * «22. nov.» og «27. nov.» rant inn i hverandre og ble til «22. no27. nov.».
   * Annenhver fjernes.
   *
   * Prisen er at den siste merkelappen kan ryke, så aksen slutter på «22.
   * nov.» selv om søylene går til i dag. Det er greit her: aksen er til for å
   * ane hvor i perioden man er, og den som vil vite nøyaktig dag holder over
   * søyla eller bytter til tabell. Ukedagsgrafen (sju punkter) rører vi ikke.
   */
  @media (max-width: ${bp.smal}) {
    ${({ $tett }) => ($tett ? 'span:nth-of-type(even) { display: none; }' : '')}
  }
`

/**
 * `$anker` holder ytterste merkelapp innenfor kortet.
 *
 * Korte merkelapper (Ma, Sø, 21) sentreres alltid: de er smalere enn sin egen
 * søyle og kan ikke renne ut uansett, og en forskjøvet «Ma» ville bare sett
 * feiljustert ut. Lange datoer i hver ende dyttes innover i stedet.
 */
const Merkelapp = styled.span<{ $anker: 'start' | 'midt' | 'slutt' }>`
  position: absolute;
  top: 0;
  white-space: nowrap;
  font-size: 0.66rem;
  color: ${t.svak};
  transform: translateX(
    ${({ $anker }) => ($anker === 'start' ? '0' : $anker === 'slutt' ? '-100%' : '-50%')}
  );
`

const Tips = styled.p<{ $synlig: boolean }>`
  margin: 0.55rem 0 0;
  min-height: 1.2rem;
  font-size: 0.8rem;
  color: ${({ $synlig }) => ($synlig ? t.blekk : t.svak)};
  font-variant-numeric: tabular-nums;

  strong {
    font-weight: 700;
  }
`

const Tomt = styled.p`
  margin: 0;
  padding: 2rem 0 2.4rem;
  text-align: center;
  font-size: 0.86rem;
  color: ${t.svak};
`

const Tabell = styled.table`
  width: 100%;
  margin-bottom: 0.6rem;
  border-collapse: collapse;
  font-size: 0.84rem;

  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  th,
  td {
    padding: 0.35rem 0.5rem;
    border-bottom: 1px solid ${t.kantSvak};
    text-align: left;
  }
  thead th {
    font-size: 0.68rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${t.svak};
  }
  tbody th {
    font-weight: 500;
    color: ${t.dempet};
  }
  td {
    text-align: right;
    font-weight: 700;
    color: ${t.blekk};
    font-variant-numeric: tabular-nums;
  }
`

const ToGrafer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  > * {
    margin-bottom: 0;
  }

  @media (max-width: ${bp.mobil}) {
    grid-template-columns: 1fr;
    gap: 0;
    > *:first-child {
      margin-bottom: 1rem;
    }
  }
`
