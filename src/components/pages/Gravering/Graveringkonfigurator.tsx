import { useState } from 'react'
import styled from 'styled-components'
import { useAuthContext } from '../../../context/AuthContext'
import { useMediaQuery } from '../../../hooks/useMediaQuery'
import { designerSymbols } from '../../../data/designerSymbols'
import { erJulegavesesong } from '../../../data/sesong'
import {
  fraPris,
  graveringFonter,
  fraktFor,
  graveringKampanje,
  ordreAntall,
  ordreSum,
  graveringOppsett,
  graveringSymbolKategorier,
  prisFor,
  produkt,
  PRIS_ER_ENDELIG,
  synligeProdukter,
  type Ordrelinje,
  type ProduktId,
  type Valg,
} from '../../../data/gravering'
import { malKategorier, motivMaler, type MalKategori } from '../../../data/graveringMaler'
import Icon from '../../shared/Icon'
import GraveringPreview from './GraveringPreview'
import { graveringGeometri } from './graveringGeometri'
import GraveringForesporselModal from './GraveringForesporselModal'
import { byggGraveringSvg, lastNedSvg } from './graveringSvg'
import { standardPlassering } from './graveringMotiv'
import { sokSymboler } from './symbolsok'
import { fyllLinjer, usePersonligTekst } from './usePersonligTekst'

/** Startvalget for et produkt, slik det er definert i produktdataene. */
function startValg(id: ProduktId): Valg {
  const p = produkt(id)
  return { produkt: id, ...p.start }
}

/** Klipper tekstlinjene til det produktet har plass til. */
function klipp(linjer: Valg['linjer'], maks: number): Valg['linjer'] {
  return linjer.map((l, i) => (i < maks ? l : '')) as Valg['linjer']
}

// Sorteres etter kategorirekkefølgen i `graveringSymbolKategorier`, ikke etter
// rekkefølgen i symbolfilen – mat og natur er det folk vil ha gravert.
const SYMBOLER = designerSymbols
  .filter((s) => graveringSymbolKategorier.includes(s.category))
  .sort((a, b) => graveringSymbolKategorier.indexOf(a.category) - graveringSymbolKategorier.indexOf(b.category))

/** Mappenavnene i symbolfila er uten norske tegn – her er de lesbare. */
const SYMBOLKATEGORI_NAVN: Record<string, string> = {
  Verktoy: 'Verktøy',
  Trearbeid: 'Trearbeid',
  Villmark: 'Villmark',
  Former: 'Former',
}

const PLASSERING_VANNRETT = ['venstre', 'midt', 'hoyre'] as const
const PLASSERING_LODDRETT = ['topp', 'midt', 'bunn'] as const
const PLASSERING_ORD: Record<string, string> = {
  venstre: 'venstre',
  midt: 'midten',
  hoyre: 'høyre',
  topp: 'øverst',
  bunn: 'nederst',
}

const LINJEETIKETTER = ['Linje 1', 'Linje 2', 'Linje 3']

/** Hvor mange navn vi tar imot i én masseinnlegging. */
const FLERE_MAKS = 60

/**
 * Id for en ordrelinje. Den brukes som React-nøkkel og til å fjerne riktig
 * linje, så to linjer må aldri kunne få samme id – heller ikke når du legger
 * til det samme designet to ganger, eller limer inn to navnelister rett etter
 * hverandre. Derfor tid + tilfeldig hale, ikke innholdet.
 */
let linjeteller = 0
function nyLinjeId(suffiks: number | string = ''): string {
  linjeteller += 1
  return `linje-${Date.now().toString(36)}-${linjeteller}-${suffiks}`
}

/**
 * Panelet er delt i faner i stedet for én lang spalte. Før måtte man rulle
 * forbi hele malbiblioteket for å komme til symbolene, og oppsettkortene med
 * full forhåndsvisning tok en skjermhøyde alene. Nå ligger hver oppgave på sin
 * egen fane, og forhåndsvisningen står stille ved siden av.
 */
type FaneId = 'motiv' | 'tekst' | 'symbol' | 'oppsett'

const FANER: Array<{ id: FaneId; navn: string; ikon: string }> = [
  { id: 'motiv', navn: 'Motiv', ikon: 'faWandMagicSparkles' },
  { id: 'tekst', navn: 'Tekst', ikon: 'faFont' },
  { id: 'symbol', navn: 'Symbol', ikon: 'faStar' },
  { id: 'oppsett', navn: 'Oppsett', ikon: 'faBorderAll' },
]

/**
 * Oppsettene tegnes som små diagrammer, ikke som fulle forhåndsvisninger.
 * En miniatyr av fjøla på 80 piksler sier ingenting; to streker og en bjelke
 * sier alt om hvor teksten havner – og tar en tiendedel av plassen.
 */
function OppsettIkon({ id }: { id: Valg['oppsett'] }) {
  const bjelke = (x: number, y: number, w: number, h: number, key?: string) => (
    <rect key={key} x={x} y={y} width={w} height={h} rx={h / 2} fill="currentColor" />
  )
  const prikker = (rader: number[], antall: number, r: number) =>
    rader.flatMap((y, i) =>
      Array.from({ length: antall }, (_, k) => (
        <circle key={`${i}-${k}`} cx={5 + k * ((30 / (antall - 1)) || 1) + (i % 2 ? 1.6 : 0)} cy={y} r={r} fill="currentColor" />
      )),
    )

  const innhold = {
    senter: [bjelke(10, 9, 20, 3.6, 'a'), bjelke(14, 15.5, 12, 2.2, 'b')],
    linjer: [bjelke(7, 7, 26, 1, 'a'), bjelke(11, 11, 18, 3.4, 'b'), bjelke(7, 18, 26, 1, 'c')],
    monogram: [
      <circle key="a" cx="20" cy="10.5" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.4" />,
      bjelke(13, 18.5, 14, 2.2, 'b'),
    ],
    hjorne: [bjelke(21, 16, 13, 2.8, 'a'), bjelke(25, 20.5, 9, 1.8, 'b')],
    venstre: [bjelke(6, 7, 7, 1.4, 'a'), bjelke(6, 11, 17, 3.4, 'b'), bjelke(6, 18, 11, 2.2, 'c')],
    monster: prikker([7, 13, 19], 6, 1.5),
    monstertekst: [...prikker([6, 20], 6, 1.5), bjelke(10, 11.5, 20, 3, 'tekst')],
  }[id]

  return (
    <svg viewBox="0 0 40 26" aria-hidden="true" focusable="false">
      <rect x="0.6" y="0.6" width="38.8" height="24.8" rx="3.5" fill="none" stroke="currentColor" strokeOpacity="0.3" />
      {innhold}
    </svg>
  )
}

/**
 * Kategorirekkefølgen. I julegavesesongen står Jul først – det er den folk er
 * ute etter da – ellers ligger den der den hører hjemme i årshjulet.
 */
const KATEGORIER = erJulegavesesong()
  ? [...malKategorier].sort((a, b) => Number(b.id === 'jul') - Number(a.id === 'jul'))
  : malKategorier

const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

/**
 * Graveringskonfiguratoren. Bevisst mye enklere enn skiltdesigneren: her skal
 * man ikke tegne fritt, men velge produkt og se resultatet med én gang. Den som
 * vil tegne fra bunnen sendes videre til skiltdesigneren.
 */
export default function Graveringkonfigurator() {
  const personlig = usePersonligTekst()
  const [kategori, settKategori] = useState<MalKategori>(() => (erJulegavesesong() ? 'jul' : 'klassisk'))
  /**
   * Malens rå tekst, med tokens. Vi tar vare på den ved siden av den utfylte
   * teksten: når stedsnavnet kommer inn etterpå (posisjonsoppslaget er
   * asynkront), kan vi fylle ut på nytt – men bare så lenge kunden ikke har
   * skrevet noe selv. Da er teksten deres, ikke vår.
   */
  const [malLinjer, settMalLinjer] = useState<Valg['linjer']>(() => produkt('fjol-rekt').start.linjer)
  const [egenTekst, settEgenTekst] = useState(false)
  const [valg, settValg] = useState<Valg>(() => startValg('fjol-rekt'))
  /**
   * Masseinnlegging: ett navn per linje. En bedrift som skal gi ti fjøler med
   * hvert sitt ansattnavn skal lime inn lista, ikke konfigurere ti ganger.
   */
  const [flereNavn, settFlereNavn] = useState('')
  const [symbolsok, settSymbolsok] = useState('')
  const [symbolkategori, settSymbolkategori] = useState<string | null>(null)
  const [fane, settFane] = useState<FaneId>('motiv')
  /**
   * Bestillingen. Konfiguratoren viser én vare om gangen, men folk kjøper
   * gjerne to gaver – og fri frakt-terskelen er uoppnåelig uten. Listen ligger
   * bare i minnet: et halvferdig design er ikke verdt en localStorage-bug.
   */
  const [ordre, settOrdre] = useState<Ordrelinje[]>([])
  /**
   * På mobil klistrer forhåndsvisningen og prisen seg øverst, og da kan ikke
   * bestillingslisten og knappene ligge der – de ville spist skjermen og vokst
   * for hver vare. Innholdet FLYTTES ned i stedet for å rendres to ganger.
   */
  const mobil = useMediaQuery('(max-width: 1024px)')
  const [visOmriss, settVisOmriss] = useState(false)
  const [foresporsel, settForesporsel] = useState(false)
  // Produksjonsfila er verkstedets, ikke kundens: knappen vises bare for admin.
  const { isAdmin } = useAuthContext()
  const [filstatus, settFilstatus] = useState<'idle' | 'bygger' | 'feil'>('idle')

  const p = produkt(valg.produkt)
  const variant = p.varianter.find((v) => v.id === valg.variant) ?? p.varianter[0]
  const oppsettValg = graveringOppsett.filter((o) => p.oppsett.includes(o.id))
  /**
   * Teksten som faktisk vises. Så lenge kunden ikke har skrevet noe selv,
   * utledes den av malen ved hver render – da henger den med når navnet kommer
   * med innloggingen og stedet kommer fra posisjonsoppslaget etterpå. Første
   * tastetrykk gjør teksten til kundens, og da rører vi den ikke mer.
   */
  const linjer = egenTekst
    ? klipp(valg.linjer, p.maksLinjer)
    : klipp(fyllLinjer(malLinjer, personlig), p.maksLinjer)
  const aktivt: Valg = { ...valg, linjer }

  const symboltreff = sokSymboler(SYMBOLER, symbolsok, symbolkategori)
  const standard = standardPlassering(valg.oppsett)

  // Geometrien er ren regning og memoiseres av React-kompilatoren.
  const geo = graveringGeometri(p.form, variant.bredde, variant.hoyde)
  const pris = prisFor(aktivt, geo.maal)
  // Står noe i bestillingen, er det den som gjelder for frakt og sum.
  const varesum = ordre.length ? ordreSum(ordre) : pris.sum
  const frakt = fraktFor(varesum)

  const sett = <K extends keyof Valg>(nokkel: K, verdi: Valg[K]) =>
    settValg((v) => ({ ...v, [nokkel]: verdi }))

  /**
   * Et mønster er symbolet gjentatt – uten symbol er det ingenting å gjenta.
   * Velger kunden et mønsteroppsett uten å ha valgt symbol, låner vi produktets
   * eget startsymbol i stedet for å vise en tom kjevle.
   */
  const byttOppsett = (id: Valg['oppsett']) =>
    settValg((v) => ({
      ...v,
      oppsett: id,
      symbol: v.symbol ?? ((id === 'monster' || id === 'monstertekst') ? p.start.symbol : null),
    }))

  const settLinje = (i: number, tekst: string) => {
    // Første redigering arver det som står på skjermen, ikke den rå malen.
    const nye = [...linjer] as Valg['linjer']
    nye[i] = tekst
    settEgenTekst(true)
    settValg((v) => ({ ...v, linjer: nye }))
  }

  /**
   * Bytte av produkt beholder teksten, skriften, symbolet og oppsettet – det er
   * kundens arbeid. Flate, variant og kant må derimot nullstilles, siden en
   * drikkeflaska ikke har «eik» og kjevla ikke har «saftrille». Oppsettet
   * følger bare med hvis det nye produktet kler det.
   */
  const byttProdukt = (id: ProduktId) =>
    settValg((v) => {
      const ny = produkt(id)
      const oppsett = ny.oppsett.includes(v.oppsett) ? v.oppsett : ny.start.oppsett
      return {
        ...startValg(id),
        linjer,
        font: v.font,
        oppsett,
        // Mønsteroppsettene trenger et symbol for å ha noe å gjenta.
        symbol: v.symbol ?? ((oppsett === 'monster' || oppsett === 'monstertekst') ? ny.start.symbol : null),
        // Behold bare tekst som får plass på det nye produktet.
        ...(ny.maksLinjer < 3 ? { linjer: klipp(linjer, ny.maksLinjer) } : {}),
      }
    })

  /**
   * Henter produksjonsfila for det som står på skjermen nå – samme SVG som
   * lagres når kunden sender inn, med teksten konvertert til kurver.
   */
  const lastNed = async () => {
    if (filstatus === 'bygger') return
    settFilstatus('bygger')
    try {
      lastNedSvg(await byggGraveringSvg(aktivt))
      settFilstatus('idle')
    } catch (feil) {
      console.error('Kunne ikke bygge produksjonsfila', feil)
      settFilstatus('feil')
    }
  }

  const leggTil = () => {
    settOrdre((v) => [
      ...v,
      {
        id: nyLinjeId(),
        valg: aktivt,
        maal: geo.maal,
        linjer: pris.linjer,
        sum: pris.sum,
        antall: 1,
      },
    ])
  }

  /** Navnene i masseinnleggingen, rensket og begrenset. */
  const flereListe = flereNavn
    .split('\n')
    .map((n) => n.trim())
    .filter(Boolean)
    .slice(0, FLERE_MAKS)

  /**
   * Én vare per navn. Alt annet – produkt, oppsett, skrift, symbol og de andre
   * tekstlinjene – er felles, så ti like gaver med hvert sitt navn tar ett
   * klikk i stedet for ti runder i konfiguratoren.
   */
  const leggTilFlere = () => {
    if (!flereListe.length) return
    settOrdre((v) => [
      ...v,
      ...flereListe.map((navn, i) => {
        const valg: Valg = { ...aktivt, linjer: klipp([navn, linjer[1], linjer[2]], p.maksLinjer) }
        const egenPris = prisFor(valg, geo.maal)
        return {
          id: nyLinjeId(i),
          valg,
          maal: geo.maal,
          linjer: egenPris.linjer,
          sum: egenPris.sum,
          antall: 1,
        }
      }),
    ])
    settFlereNavn('')
  }

  const settAntall = (id: string, antall: number) =>
    settOrdre((v) => v.map((l) => (l.id === id ? { ...l, antall: Math.min(50, Math.max(1, antall)) } : l)))

  const fjernLinje = (id: string) => settOrdre((v) => v.filter((l) => l.id !== id))

  const brukMal = (id: string) => {
    const mal = motivMaler.find((m) => m.id === id)
    if (!mal) return
    settMalLinjer(mal.linjer)
    settEgenTekst(false)
    settValg((v) => ({
      ...v,
      font: mal.font,
      symbol: mal.symbol,
      // Malen bærer komposisjonen sin, men bare der produktet har den.
      oppsett: p.oppsett.includes(mal.oppsett) ? mal.oppsett : p.oppsett[0],
    }))
  }

  const bestillingsliste = ordre.length > 0 && (
    <Bestilling>
      <BestillingTittel>
        I bestillingen
        <span>
          {ordreAntall(ordre)} stk
          {ordre.length > 1 && (
            <>
              {' · '}
              <TomListe type="button" onClick={() => settOrdre([])}>
                tøm
              </TomListe>
            </>
          )}
        </span>
      </BestillingTittel>
      <Ordreliste>
        {ordre.map((linje) => (
        <Ordrekort key={linje.id}>
          <OrdreBilde>
            <GraveringPreview dekorativ utenSkygge valg={linje.valg} />
          </OrdreBilde>
          <div>
            <strong>{produkt(linje.valg.produkt).navn}</strong>
            <small>{linje.valg.linjer.find((t) => t.trim()) || 'uten tekst'}</small>
          </div>
          <Antall>
            <button
              type="button"
              aria-label="Færre"
              onClick={() => settAntall(linje.id, linje.antall - 1)}
              disabled={linje.antall <= 1}
            >
              −
            </button>
            <span>{linje.antall}</span>
            <button type="button" aria-label="Flere" onClick={() => settAntall(linje.id, linje.antall + 1)}>
              +
            </button>
          </Antall>
          <OrdrePris>{kr(linje.sum * linje.antall)}</OrdrePris>
          <Fjern type="button" aria-label="Fjern varen" onClick={() => fjernLinje(linje.id)}>
            <Icon name="faXmark" />
          </Fjern>
          </Ordrekort>
        ))}
      </Ordreliste>
    </Bestilling>
  )

  const fraktvink = graveringKampanje.aktiv && !frakt.gratis && (
    <Fraktvink>
      {kr(graveringKampanje.grense - varesum)} igjen til fri frakt – legg til en gave til, så tar vi frakten
      til og med {graveringKampanje.frist}.
    </Fraktvink>
  )

  const prisdetaljer = (
    <Prisdetaljer>
      <summary>Hva er inkludert?</summary>
      <SumLinjer>
        {pris.linjer.map((l) => (
          <li key={l.etikett}>
            <span>{l.etikett}</span>
            <span>{kr(l.kroner)}</span>
          </li>
        ))}
        <Fraktlinje $gratis={frakt.gratis}>
          <span>Frakt</span>
          <span>{frakt.gratis ? 'fri frakt' : kr(frakt.kroner)}</span>
        </Fraktlinje>
      </SumLinjer>
      <SumNote>
        Prisen er veiledende og inkluderer produktet, graveringen og etterarbeidet. {PRIS_ER_ENDELIG}{' '}
        Eventuelle tilpasninger legges på fakturaen – du får endelig pris i tilbudet.{' '}
        <strong>Du betaler ingenting nå: faktura sendes når den graverte varen går i posten.</strong>
      </SumNote>
    </Prisdetaljer>
  )

  const handlinger = (
    <>
      <LeggTil type="button" onClick={leggTil}>
        <Icon name="faPlus" /> Legg til i bestillingen
      </LeggTil>
      <SendKnapp type="button" onClick={() => settForesporsel(true)}>
        <Icon name="faPaperPlane" />{' '}
        {ordre.length ? `Send bestillingen (${ordreAntall(ordre)})` : 'Send til verkstedet'}
      </SendKnapp>
      {ordre.length > 0 && <Ikkelagt>Varen du ser nå er ikke lagt til ennå.</Ikkelagt>}
      {isAdmin && (
        <Verkstedfil
          type="button"
          onClick={lastNed}
          disabled={filstatus === 'bygger'}
          title="Tekst som kurver, mål i mm – klar for laseren"
        >
          <Icon name={filstatus === 'bygger' ? 'faSpinner' : 'faDownload'} spin={filstatus === 'bygger'} />
          {filstatus === 'bygger'
            ? 'Bygger fila …'
            : filstatus === 'feil'
              ? 'Kunne ikke bygge fila – prøv igjen'
              : 'Last ned SVG (admin)'}
        </Verkstedfil>
      )}
    </>
  )

  return (
    <>
      <Produktvelger role="tablist" aria-label="Velg produkt">
        {synligeProdukter.map((kandidat) => {
          const aktiv = kandidat.id === valg.produkt
          return (
            <Produktfane
              key={kandidat.id}
              type="button"
              role="tab"
              aria-selected={aktiv}
              $aktiv={aktiv}
              onClick={() => byttProdukt(kandidat.id)}
            >
              <Faneboks $aktiv={aktiv}>
                <GraveringPreview
                  dekorativ
                  utenSkygge
                  valg={{ ...startValg(kandidat.id), linjer: ['', '', ''], symbol: null }}
                />
              </Faneboks>
              <strong>{kandidat.navn}</strong>
              <small>fra {kr(fraPris(kandidat))}</small>
            </Produktfane>
          )
        })}
      </Produktvelger>

      <Arbeidsbord>
        <Scene>
          <Visning $portrett={geo.hoyde / geo.bredde > 1.4}>
            <GraveringPreview valg={aktivt} visOmriss={visOmriss} />
            <Omrissknapp
              type="button"
              aria-pressed={visOmriss}
              $aktiv={visOmriss}
              title={visOmriss ? 'Skjul målelinja' : 'Vis målelinja – emnets kant og graveringsfeltet'}
              aria-label={visOmriss ? 'Skjul målelinja' : 'Vis målelinja'}
              onClick={() => settVisOmriss((v) => !v)}
            >
              <Icon name="faBorderAll" />
            </Omrissknapp>
          </Visning>
          <Maal>
            <span>{geo.maal}</span>
            <span>{p.spesifikasjon}</span>
          </Maal>
          {variant.antall > 1 && (
            <Settnote>
              Alle {variant.antall} graveres likt. Vil du ha forskjellig navn på hver, skriv det i meldingen
              når du sender inn.
            </Settnote>
          )}

          <Prisboks>
            {!mobil && bestillingsliste}
            <Prisrad>
              <span>{ordre.length ? 'Varer' : 'Veiledende pris'}</span>
              <strong>{kr(varesum)}</strong>
            </Prisrad>
            {/* Frakten står synlig med beløp allerede før detaljene åpnes –
                et ukjent tillegg i siste steg er det folk hopper av på. */}
            <Fraktnotat $gratis={frakt.gratis}>
              {frakt.gratis
                ? `Fri frakt · ${kr(varesum)} ferdig levert`
                : `+ ${kr(frakt.kroner)} frakt · ${kr(varesum + frakt.kroner)} ferdig levert`}
            </Fraktnotat>
            {!mobil && (
              <>
                {fraktvink}
                {prisdetaljer}
                {handlinger}
              </>
            )}
          </Prisboks>
        </Scene>

        <Panel>
          <Faner role="tablist" aria-label="Rediger graveringen">
            {FANER.map((f) => (
              <Fane
                key={f.id}
                type="button"
                role="tab"
                aria-selected={fane === f.id}
                $aktiv={fane === f.id}
                onClick={() => settFane(f.id)}
              >
                <Icon name={f.ikon} />
                <span>{f.navn}</span>
              </Fane>
            ))}
          </Faner>

          <Faneinnhold role="tabpanel">
            {fane === 'motiv' && (
              <>
                <Kategorier role="tablist" aria-label="Anledning">
                  {KATEGORIER.map((k) => (
                    <Kategorifane
                      key={k.id}
                      type="button"
                      role="tab"
                      aria-selected={kategori === k.id}
                      $aktiv={kategori === k.id}
                      onClick={() => settKategori(k.id)}
                    >
                      {k.navn}
                    </Kategorifane>
                  ))}
                </Kategorier>
                <Maler>
                  {motivMaler
                    .filter((mal) => mal.kategori === kategori)
                    .map((mal) => (
                      <MalKort key={mal.id} type="button" title={mal.beskrivelse} onClick={() => brukMal(mal.id)}>
                        <MalBilde>
                          <GraveringPreview
                            dekorativ
                            utenSkygge
                            valg={{
                              ...aktivt,
                              linjer: klipp(fyllLinjer(mal.linjer, personlig), p.maksLinjer),
                              font: mal.font,
                              symbol: mal.symbol,
                              oppsett: p.oppsett.includes(mal.oppsett) ? mal.oppsett : p.oppsett[0],
                            }}
                          />
                        </MalBilde>
                        <strong>{mal.navn}</strong>
                      </MalKort>
                    ))}
                </Maler>
                {personlig.kanSpoerreOmSted && (
                  <Stedsknapp type="button" onClick={personlig.spoerOmSted}>
                    <Icon name="faMap" /> Bruk stedet mitt i malene
                  </Stedsknapp>
                )}
              </>
            )}

            {fane === 'tekst' && (
              <Felter>
                {LINJEETIKETTER.slice(0, p.maksLinjer).map((etikett, i) => (
                  <Felt key={etikett}>
                    <label htmlFor={`gravering-linje-${i}`}>{etikett}</label>
                    <input
                      id={`gravering-linje-${i}`}
                      type="text"
                      maxLength={32}
                      value={linjer[i]}
                      placeholder={i === 0 ? 'Navn, hilsen eller hyttenavn' : 'Valgfritt'}
                      onChange={(e) => settLinje(i, e.target.value)}
                    />
                  </Felt>
                ))}
                <Felt>
                  <label htmlFor="gravering-font">Skrift</label>
                  <select id="gravering-font" value={valg.font} onChange={(e) => sett('font', e.target.value)}>
                    {graveringFonter.map((f) => (
                      <option key={f} value={f} style={{ fontFamily: f }}>
                        {f}
                      </option>
                    ))}
                  </select>
                </Felt>
                <Skriftprove style={{ fontFamily: `"${valg.font}", Georgia, serif` }}>
                  {linjer[0]?.trim() || 'Slik blir skriften'}
                </Skriftprove>

                <Flerenavn>
                  <summary>Flere med ulike navn</summary>
                  <p>
                    Til bedriften, laget eller hele familien: lim inn ett navn per linje, så lager vi én
                    vare per navn.{' '}
                    {linjer[1]?.trim()
                      ? `Alle får «${linjer[1].trim()}» på linje 2, samme oppsett og samme skrift.`
                      : 'Alle får samme oppsett, skrift og symbol.'}
                  </p>
                  <textarea
                    rows={5}
                    value={flereNavn}
                    onChange={(e) => settFlereNavn(e.target.value)}
                    placeholder={'Ola Nordmann\nKari Hansen\nPer Olsen'}
                    aria-label="Ett navn per linje"
                  />
                  <FlereKnapp type="button" onClick={leggTilFlere} disabled={!flereListe.length}>
                    <Icon name="faPlus" />{' '}
                    {flereListe.length
                      ? `Legg til ${flereListe.length} ${flereListe.length === 1 ? 'vare' : 'varer'}`
                      : 'Legg til i bestillingen'}
                  </FlereKnapp>
                  {flereNavn.split('\n').filter((n) => n.trim()).length > FLERE_MAKS && (
                    <Flerenote>Maks {FLERE_MAKS} om gangen – legg inn resten i en ny runde.</Flerenote>
                  )}
                </Flerenavn>
              </Felter>
            )}

            {fane === 'symbol' && (
              <>
                <Sokefelt>
                  <Icon name="faSearch" />
                  <input
                    type="search"
                    value={symbolsok}
                    onChange={(e) => settSymbolsok(e.target.value)}
                    placeholder="Søk – juletre, øl, hjerte, fjell, mekk …"
                    aria-label="Søk i symboler"
                  />
                  {symbolsok && (
                    <TomSok type="button" onClick={() => settSymbolsok('')} aria-label="Tøm søket">
                      <Icon name="faXmark" />
                    </TomSok>
                  )}
                </Sokefelt>
                <Kategorier role="tablist" aria-label="Symbolkategori">
                  <Kategorifane
                    type="button"
                    role="tab"
                    aria-selected={!symbolkategori}
                    $aktiv={!symbolkategori}
                    onClick={() => settSymbolkategori(null)}
                  >
                    Alle
                  </Kategorifane>
                  {graveringSymbolKategorier.map((k) => (
                    <Kategorifane
                      key={k}
                      type="button"
                      role="tab"
                      aria-selected={symbolkategori === k}
                      $aktiv={symbolkategori === k}
                      onClick={() => settSymbolkategori(k)}
                    >
                      {SYMBOLKATEGORI_NAVN[k] ?? k}
                    </Kategorifane>
                  ))}
                </Kategorier>
                {symboltreff.length ? (
                  <Symbolrute>
                    {symboltreff.map((sym) => (
                      <SymbolKnapp
                        key={sym.id}
                        type="button"
                        $valgt={valg.symbol === sym.id}
                        title={sym.name}
                        aria-label={sym.name}
                        aria-pressed={valg.symbol === sym.id}
                        onClick={() => sett('symbol', valg.symbol === sym.id ? null : sym.id)}
                      >
                        <svg viewBox="0 0 100 100" aria-hidden="true">
                          <path d={sym.path} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </SymbolKnapp>
                    ))}
                  </Symbolrute>
                ) : (
                  <Ingentreff>
                    Ingen symboler på «{symbolsok}». Prøv et annet ord – eller send oss ditt eget motiv når
                    du sender inn, så graverer vi etter din fil.
                  </Ingentreff>
                )}
                {valg.symbol && (
                  <Fjernsymbol type="button" onClick={() => sett('symbol', null)}>
                    <Icon name="faXmark" /> Fjern symbolet
                  </Fjernsymbol>
                )}
              </>
            )}

            {fane === 'oppsett' && (
              <>
                {oppsettValg.length > 1 && (
                  <Underbolk>
                    <Undertittel>Komposisjon</Undertittel>
                    <Oppsettvalg>
                      {oppsettValg.map((o) => (
                        <Oppsettknapp
                          key={o.id}
                          type="button"
                          title={o.beskrivelse}
                          aria-pressed={valg.oppsett === o.id}
                          $valgt={valg.oppsett === o.id}
                          onClick={() => byttOppsett(o.id)}
                        >
                          <OppsettIkon id={o.id} />
                          <span>{o.navn}</span>
                        </Oppsettknapp>
                      ))}
                    </Oppsettvalg>
                    <Hjelpetekst>
                      {oppsettValg.find((o) => o.id === valg.oppsett)?.beskrivelse}
                    </Hjelpetekst>
                  </Underbolk>
                )}

                <Underbolk>
                  <Undertittel>
                    Plassering
                    {(valg.juster || valg.loddrett) && (
                      <Nullstill
                        type="button"
                        onClick={() => settValg((v) => ({ ...v, juster: undefined, loddrett: undefined }))}
                      >
                        Automatisk
                      </Nullstill>
                    )}
                  </Undertittel>
                  <Plassering>
                    <Rutenett role="group" aria-label="Plassering av motivet">
                      {PLASSERING_LODDRETT.map((l) =>
                        PLASSERING_VANNRETT.map((v) => {
                          const valgt =
                            (valg.juster ?? standard.juster) === v && (valg.loddrett ?? standard.loddrett) === l
                          const automatisk = !valg.juster && !valg.loddrett
                          return (
                            <Rute
                              key={`${l}-${v}`}
                              type="button"
                              aria-label={`${PLASSERING_ORD[l]} ${PLASSERING_ORD[v]}`}
                              aria-pressed={valgt}
                              $valgt={valgt}
                              $auto={valgt && automatisk}
                              onClick={() => settValg((gjeldende) => ({ ...gjeldende, juster: v, loddrett: l }))}
                            >
                              <span />
                            </Rute>
                          )
                        }),
                      )}
                    </Rutenett>
                    <Hjelpetekst>
                      {valg.juster || valg.loddrett
                        ? 'Du har satt plasseringen selv.'
                        : 'Følger oppsettet. Trykk i rutenettet for å flytte motivet.'}
                    </Hjelpetekst>
                  </Plassering>
                </Underbolk>

                {/* Ett alternativ er ikke et valg – da står fakta i spesifikasjonen
                    under forhåndsvisningen i stedet for som et kort du må trykke på. */}
                {p.varianter.length > 1 && (
                  <Underbolk>
                    <Undertittel>{p.variantEtikett}</Undertittel>
                    <Valgrad>
                      {p.varianter.map((v) => (
                        <Valgkort
                          key={v.id}
                          type="button"
                          $valgt={valg.variant === v.id}
                          onClick={() => sett('variant', v.id)}
                        >
                          <strong>{v.navn}</strong>
                          <small>{v.beskrivelse}</small>
                        </Valgkort>
                      ))}
                    </Valgrad>
                  </Underbolk>
                )}

                {p.flater.length > 1 && (
                  <Underbolk>
                    <Undertittel>{p.flateEtikett}</Undertittel>
                    <Valgrad>
                      {p.flater.map((f) => (
                        <Valgkort
                          key={f.id}
                          type="button"
                          $valgt={valg.flate === f.id}
                          onClick={() => sett('flate', f.id)}
                        >
                          <Prove style={{ background: f.farge, borderColor: f.areFarge }} />
                          <strong>{f.navn}</strong>
                          <small>{f.beskrivelse}</small>
                        </Valgkort>
                      ))}
                    </Valgrad>
                  </Underbolk>
                )}

                {p.kanter && (
                  <Underbolk>
                    <Undertittel>Kant</Undertittel>
                    <Valgrad>
                      {p.kanter.map((k) => (
                        <Valgkort
                          key={k.id}
                          type="button"
                          $valgt={valg.kant === k.id}
                          onClick={() => sett('kant', k.id)}
                        >
                          <strong>{k.navn}</strong>
                          <small>{k.beskrivelse}</small>
                        </Valgkort>
                      ))}
                    </Valgrad>
                  </Underbolk>
                )}
              </>
            )}
          </Faneinnhold>
        </Panel>
      </Arbeidsbord>

      {/* På mobil står forhåndsvisningen og prisen klistret øverst mens du
          redigerer, og innsendingen ligger her nede der arbeidet er ferdig. */}
      {mobil && (
        <Mobilavslutning>
          {bestillingsliste}
          {fraktvink}
          {prisdetaljer}
          {handlinger}
        </Mobilavslutning>
      )}

      {foresporsel && (
        <GraveringForesporselModal
          ordre={
            ordre.length
              ? ordre
              : [{ id: 'na', valg: aktivt, maal: geo.maal, linjer: pris.linjer, sum: pris.sum, antall: 1 }]
          }
          onClose={() => settForesporsel(false)}
        />
      )}
    </>
  )
}

const Verkstedfil = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  min-height: 42px;
  margin-top: 0.6rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.colors.inkInverted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  &:hover:not(:disabled) {
    border-color: rgba(255, 255, 255, 0.55);
  }

  &:disabled {
    cursor: wait;
    opacity: 0.7;
  }
`

const Sokefelt = styled.div`
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.55rem 0.85rem;
  margin-bottom: 0.7rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.inkMuted};

  &:focus-within {
    border-color: ${({ theme }) => theme.colors.accent};
  }

  input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: none;
    font: inherit;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.ink};

    &:focus {
      outline: none;
    }

    &::-webkit-search-cancel-button {
      display: none;
    }
  }
`

const TomSok = styled.button`
  display: inline-flex;
  padding: 0.15rem;
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.inkMuted};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Symbolrute = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(2.75rem, 1fr));
  gap: 0.4rem;
  max-height: 22rem;
  padding-right: 0.2rem;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: 1024px) {
    max-height: 16rem;
  }
`

const Ingentreff = styled.p`
  margin: 0.4rem 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.6;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Rutenett = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 2.4rem);
  gap: 0.3rem;
`

const Rute = styled.button<{ $valgt: boolean; $auto: boolean }>`
  display: grid;
  place-items: center;
  height: 2.4rem;
  border: 1px solid
    ${({ theme, $valgt, $auto }) => ($valgt && !$auto ? theme.colors.accent : theme.colors.border)};
  border-radius: 10px;
  background: ${({ theme, $valgt, $auto }) =>
    $valgt && !$auto ? theme.colors.accentSoft : theme.colors.surface};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  span {
    width: ${({ $valgt }) => ($valgt ? '0.65rem' : '0.4rem')};
    height: ${({ $valgt }) => ($valgt ? '0.65rem' : '0.4rem')};
    border-radius: 50%;
    background: ${({ theme, $valgt, $auto }) =>
      $valgt ? ($auto ? theme.colors.inkMuted : theme.colors.accent) : theme.colors.border};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`


const Kategorier = styled.div`
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.2rem;
  padding-bottom: 0.3rem;
  overflow-x: auto;
  scrollbar-width: thin;

  > * {
    flex: none;
  }
`

const Kategorifane = styled.button<{ $aktiv: boolean }>`
  padding: 0.35rem 0.75rem;
  border: 1px solid ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accent : theme.colors.border)};
  border-radius: 999px;
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accentSoft : 'transparent')};
  color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accentInk : theme.colors.inkMuted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ $aktiv }) => ($aktiv ? 600 : 400)};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};
`

const Stedsknapp = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 0.85rem;
  padding: 0.4rem 0.8rem;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.colors.inkMuted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accent};
  }
`


const Produktvelger = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7.5rem, 1fr));
  gap: 0.6rem;
  margin-bottom: 1.5rem;

  @media (max-width: 640px) {
    /* Vannrett rulling slår fem rader med halve kort på en liten skjerm. */
    display: flex;
    overflow-x: auto;
    padding-bottom: 0.4rem;
    scroll-snap-type: x mandatory;

    > * {
      flex: 0 0 7rem;
      scroll-snap-align: start;
    }
  }
`

const Produktfane = styled.button<{ $aktiv: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.85rem 0.6rem 0.9rem;
  border: 1px solid ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accent : theme.colors.border)};
  border-radius: 16px;
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accentSoft : theme.colors.surface)};
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default}, background ${({ theme }) => theme.transitions.default};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    line-height: 1.25;
    text-align: center;
    color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accentInk : theme.colors.ink)};
  }

  small {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Faneboks = styled.div<{ $aktiv: boolean }>`
  display: grid;
  place-items: center;
  width: 100%;
  height: 6.5rem;
  margin-bottom: 0.55rem;
  padding: 0.4rem;
  border-radius: 12px;
  /* Varm bakgrunn, ikke hvit: en hvit flaske på hvitt kort forsvinner. */
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.paper : theme.colors.sunken)};

  svg {
    /* Fyller boksen i sin lengste retning, så hvert produkt får samme
       visuelle vekt uansett om det er liggende eller stående. */
    width: 100%;
    height: 100%;
  }
`

const Arbeidsbord = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 2rem;
  align-items: start;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.25rem;
  }
`

const Omrissknapp = styled.button<{ $aktiv: boolean }>`
  position: absolute;
  top: 0;
  right: 0;
  display: grid;
  place-items: center;
  width: 2.1rem;
  height: 2.1rem;
  border: 1px solid ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accent : theme.colors.border)};
  border-radius: 50%;
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accentSoft : theme.colors.paper)};
  color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accent : theme.colors.inkMuted)};
  font-size: 0.85rem;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
    color: ${({ theme }) => theme.colors.accent};
  }
`

const Faner = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.3rem;
  padding: 0.3rem;
  border-radius: 14px;
  background: ${({ theme }) => theme.colors.sunken};
  position: relative;
  z-index: 1;
`

const Fane = styled.button<{ $aktiv: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.6rem 0.3rem;
  border: 0;
  border-radius: 11px;
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.paper : 'transparent')};
  box-shadow: ${({ $aktiv }) => ($aktiv ? '0 1px 3px rgba(46, 42, 38, 0.12)' : 'none')};
  color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accent : theme.colors.inkMuted)};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ $aktiv }) => ($aktiv ? 600 : 400)};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  svg {
    font-size: 1rem;
  }
`

const Faneinnhold = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 1.1rem;
`

const Underbolk = styled.section`
  & + & {
    padding-top: 1rem;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }
`

const Undertittel = styled.h4`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin: 0 0 0.6rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const Oppsettvalg = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(5rem, 1fr));
  gap: 0.45rem;
`

const Oppsettknapp = styled.button<{ $valgt: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  padding: 0.55rem 0.35rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.border)};
  border-radius: 12px;
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.inkMuted)};
  font-family: inherit;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  svg {
    width: 100%;
    max-width: 3rem;
    height: auto;
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: ${({ $valgt }) => ($valgt ? 600 : 400)};
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Plassering = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
`

const Hjelpetekst = styled.p`
  flex: 1 1 10rem;
  margin: 0.5rem 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Flerenavn = styled.details`
  margin-top: 0.3rem;
  padding: 0.9rem 1rem;
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: 14px;

  summary {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    cursor: pointer;
  }

  p {
    margin: 0.6rem 0 0.7rem;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  textarea {
    width: 100%;
    padding: 0.7rem 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    background: ${({ theme }) => theme.colors.surface};
    font: inherit;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.ink};
    resize: vertical;

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.accent};
      outline-offset: 1px;
    }
  }
`

const FlereKnapp = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 42px;
  margin-top: 0.6rem;
  border: 1px solid ${({ theme }) => theme.colors.accent};
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    border-color: ${({ theme }) => theme.colors.border};
    background: transparent;
    color: ${({ theme }) => theme.colors.inkMuted};
    cursor: default;
  }
`

const Flerenote = styled.p`
  margin: 0.5rem 0 0 !important;
  color: ${({ theme }) => theme.colors.accent} !important;
`

const Skriftprove = styled.p`
  margin: 0.2rem 0 0;
  padding: 0.9rem 1rem;
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.sunken};
  font-size: 1.6rem;
  line-height: 1.3;
  text-align: center;
  color: ${({ theme }) => theme.colors.ink};
  overflow-wrap: anywhere;
`

const Fjernsymbol = styled.button`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.35rem 0.8rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.colors.inkMuted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Prisboks = styled.div`
  margin-top: 0.25rem;
  padding: 1rem 1.1rem 1.1rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};

  @media (max-width: 1024px) {
    /* Her oppe trengs bare tallet – listen og knappene ligger nederst. */
    padding: 0.6rem 0.9rem;
  }
`

const Prisrad = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.6rem;

  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  strong {
    font-size: 1.5rem;
    letter-spacing: -0.02em;
  }
`

const Prisdetaljer = styled.details`
  margin-bottom: 0.8rem;

  summary {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    cursor: pointer;
  }

  summary::marker {
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  > *:not(summary) {
    margin-top: 0.7rem;
  }
`

const Mobilavslutning = styled.div`
  margin-top: 1.25rem;
  padding: 1rem 1.1rem 1.1rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.deep};
  color: ${({ theme }) => theme.colors.inkInverted};

  @media (min-width: 1025px) {
    display: none;
  }
`



const Scene = styled.div`
  position: sticky;
  top: 5.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: clamp(1rem, 2.5vw, 1.75rem);
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.sunken};

  @media (max-width: 1024px) {
    top: 4.75rem;
    z-index: 2;
    gap: 0.6rem;
    padding: 0.75rem;
    /* Skyggen skiller den fra innholdet som ruller under. */
    box-shadow: 0 10px 20px -16px rgba(46, 42, 38, 0.55);
  }
`


const Visning = styled.div<{ $portrett: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 100%;
    /* Stående emner (drikkeflaska) får bruke høyden – ellers blir de små og
       graveringen uleselig i en bred spalte. */
    max-height: ${({ $portrett }) => ($portrett ? '62vh' : '42vh')};
    overflow: visible;
  }

  @media (max-width: 1024px) {
    svg {
      max-height: ${({ $portrett }) => ($portrett ? '40vh' : '22vh')};
    }
  }
`

const Maal = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 0.3rem 1rem;
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.inkMuted};

  span {
    white-space: nowrap;
  }

  @media (max-width: 420px) {
    font-size: 0.68rem;
  }
`

const Settnote = styled.p`
  margin: 0;
  padding-top: 0.9rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Panel = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`


const Nullstill = styled.button`
  border: 0;
  background: none;
  padding: 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  text-transform: none;
  letter-spacing: 0;
  color: ${({ theme }) => theme.colors.accent};
  cursor: pointer;

  &:disabled {
    color: ${({ theme }) => theme.colors.neutral[400]};
    cursor: default;
  }
`

const Maler = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(7rem, 1fr));
  gap: 0.5rem;
  max-height: 26rem;
  padding-right: 0.2rem;
  overflow-y: auto;
  overscroll-behavior: contain;

  @media (max-width: 1024px) {
    max-height: none;
    overflow: visible;
  }
`

const MalKort = styled.button`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 0.45rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 12px;
  background: ${({ theme }) => theme.colors.surface};
  text-align: center;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    line-height: 1.3;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const MalBilde = styled.div`
  display: grid;
  place-items: center;
  height: 62px;
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.sunken};
  padding: 0.3rem;

  svg {
    width: 100%;
    height: 100%;
  }
`

const Felter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
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
  select {
    width: 100%;
    min-height: 46px;
    padding: 0 0.85rem;
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 10px;
    background: ${({ theme }) => theme.colors.surface};
    font-family: inherit;
    font-size: ${({ theme }) => theme.fontSizes.base};
    color: ${({ theme }) => theme.colors.ink};

    &:focus-visible {
      outline: 2px solid ${({ theme }) => theme.colors.focus};
      outline-offset: 1px;
    }
  }
`

const Valgrad = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.6rem;

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`

const Valgkort = styled.button<{ $valgt: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.border)};
  border-radius: 12px;
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  text-align: left;
  cursor: pointer;
  transition: border-color ${({ theme }) => theme.transitions.default}, background ${({ theme }) => theme.transitions.default};

  strong {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    color: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.ink)};
  }

  small {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Prove = styled.span`
  width: 100%;
  height: 18px;
  margin-bottom: 0.35rem;
  border: 1px solid;
  border-radius: 5px;
`


const SymbolKnapp = styled.button<{ $valgt: boolean }>`
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  padding: 0.5rem;
  border: 1px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.border)};
  border-radius: 10px;
  background: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentSoft : theme.colors.surface)};
  cursor: pointer;

  svg {
    width: 100%;
    height: 100%;
    /* Strekfargen må settes her også – strek-tegnede symboler som sol og
       snøfnugg har ingen flate å fylle og blir usynlige uten den. */
    fill: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.neutral[600])};
    stroke: ${({ theme, $valgt }) => ($valgt ? theme.colors.accentInk : theme.colors.neutral[600])};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`



const SumLinjer = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.35rem 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }
`


const Bestilling = styled.div`
  margin-bottom: 0.9rem;
  padding-bottom: 0.7rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
`

/** Ti navn fra en bedrift skal ikke skyve knappene ut av skjermen. */
const Ordreliste = styled.div`
  max-height: 17rem;
  padding-right: 0.3rem;
  overflow-y: auto;
  overscroll-behavior: contain;
`

const TomListe = styled.button`
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-decoration: underline;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

const BestillingTittel = styled.h4`
  display: flex;
  justify-content: space-between;
  margin: 0 0 0.6rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Ordrekort = styled.div`
  display: grid;
  grid-template-columns: 2.6rem 1fr auto auto auto;
  align-items: center;
  gap: 0.6rem;
  padding: 0.35rem 0;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
  }

  small {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 11rem;
  }
`

const OrdreBilde = styled.div`
  display: grid;
  place-items: center;
  height: 2.6rem;
  border-radius: 7px;
  /* Lys brikke på mørk boks: fjøl og kjevle i lys bøk forsvant mot deep. */
  background: ${({ theme }) => theme.colors.sunken};
  padding: 0.2rem;

  svg {
    width: 100%;
    height: 100%;
  }
`

const Antall = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;

  button {
    width: 1.4rem;
    height: 1.4rem;
    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 50%;
    background: transparent;
    color: inherit;
    font-size: 0.9rem;
    line-height: 1;
    cursor: pointer;

    &:disabled {
      opacity: 0.35;
      cursor: default;
    }
  }

  span {
    min-width: 1rem;
    text-align: center;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`

const OrdrePris = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`

const Fjern = styled.button`
  border: 0;
  background: none;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

const LeggTil = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 44px;
  margin-bottom: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.colors.inkInverted};
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accentLight};
  }
`

const Ikkelagt = styled.p`
  margin: 0.5rem 0 0;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-align: center;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const Fraktnotat = styled.p<{ $gratis: boolean }>`
  margin: -0.3rem 0 0.7rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme, $gratis }) => ($gratis ? theme.colors.accentLight : theme.colors.inkInvertedMuted)};
  font-weight: ${({ $gratis }) => ($gratis ? 600 : 400)};
`

const Fraktvink = styled.p`
  margin: -0.35rem 0 0.75rem;
  padding: 0.5rem 0.7rem;
  border-radius: 10px;
  background: rgba(224, 137, 95, 0.14);
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.accentLight};
`

const Fraktlinje = styled.li<{ $gratis: boolean }>`
  border-top: 1px dashed rgba(255, 255, 255, 0.18);
  font-style: ${({ $gratis }) => ($gratis ? 'normal' : 'italic')};
  opacity: ${({ $gratis }) => ($gratis ? 1 : 0.85)};

  span:last-child {
    color: ${({ theme, $gratis }) => ($gratis ? theme.colors.accentLight : 'inherit')};
    font-weight: ${({ $gratis }) => ($gratis ? 600 : 400)};
  }
`

const SumNote = styled.p`
  margin: 0.75rem 0 1.25rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.5;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
`

const SendKnapp = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  min-height: 48px;
  border: 0;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  font-family: inherit;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 500;
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default};

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`
