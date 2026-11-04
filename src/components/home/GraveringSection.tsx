import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { Eyebrow, Hode, Ingress, Knapp, PilLenke, Reveal, Seksjon, Tittel, Wrap } from '../editorial'
import Icon from '../shared/Icon'
import GraveringPreview from '../pages/Gravering/GraveringPreview'
import { fraPris, graveringKampanje, produkt, type ProduktId, type Valg } from '../../data/gravering'
import { erJulegavesesong, graveringInnhold } from '../../data/sesong'

/**
 * Tre produkter tegnet live med samme komponent som konfiguratoren bruker – da
 * er forsidebildet alltid i takt med hva verktøyet faktisk kan lage, og vi
 * slipper å fotografere på nytt hver gang utvalget endres. Må være produkter
 * som faktisk er i salg (`tilgjengelig: true`), ellers lokker forsiden med noe
 * konfiguratoren ikke tilbyr.
 *
 * Hvert kort lenker med `?produkt=` rett inn i konfiguratoren med det produktet
 * valgt. Før dette landet alle tre på samme side, og kunden måtte finne fram
 * til produktet hun nettopp hadde trykket på.
 */
const SMAKEBITER: Array<{ valg: Valg; merkelapp: string }> = [
  {
    merkelapp: 'Til kjøkkenet',
    valg: {
      produkt: 'fjol-rekt',
      ...produkt('fjol-rekt').start,
      linjer: ['Familien Berg', 'Lillehammer', ''],
      font: 'Cormorant Garamond',
      symbol: null,
    },
  },
  {
    merkelapp: 'Til turen',
    valg: {
      produkt: 'drikkeflaske',
      ...produkt('drikkeflaske').start,
      flate: 'lysegronn',
      linjer: ['Solheim', 'Sjusjøen', ''],
      font: 'Bebas Neue',
      symbol: 'pine',
    },
  },
  {
    merkelapp: 'Til julebaksten',
    valg: {
      produkt: 'kjevle',
      ...produkt('kjevle').start,
      oppsett: 'monster',
      linjer: ['God jul', '', ''],
      font: 'Cormorant Garamond',
      symbol: 'gingerbread',
    },
  },
]

const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

export default function GraveringSection() {
  const tekst = graveringInnhold()
  const jul = erJulegavesesong()

  return (
    <Seksjon $flate="surface" id="gravering">
      <Wrap>
        <Reveal>
          <Hode>
            <div>
              <Eyebrow>{tekst.eyebrow}</Eyebrow>
              <Tittel>{tekst.tittel}</Tittel>
            </div>
            <div>
              <Ingress>{tekst.ingress}</Ingress>
              {jul && (
                <Julestripe>
                  <Icon name="faSnowflake" />
                  <span>
                    <strong>Bestill innen 1. desember</strong> for trygg julelevering
                    {graveringKampanje.aktiv && (
                      <> · {graveringKampanje.merke} til og med {graveringKampanje.frist}</>
                    )}
                  </span>
                </Julestripe>
              )}
            </div>
          </Hode>
        </Reveal>

        <Rad>
          {SMAKEBITER.map(({ valg, merkelapp }, i) => {
            const p = produkt(valg.produkt as ProduktId)
            return (
              <Reveal key={valg.produkt} forsinkelse={i * 90}>
                <Kort to={`/gravering?produkt=${valg.produkt}`}>
                  <Rute>
                    <GraveringPreview dekorativ valg={valg} />
                  </Rute>
                  <Fot>
                    <div>
                      <span className="merkelapp">{merkelapp}</span>
                      <strong>{p.navn}</strong>
                    </div>
                    <span className="pris">fra {kr(fraPris(p))}</span>
                  </Fot>
                  <Handling aria-hidden="true">
                    Skriv din tekst <Icon name="faArrowRight" />
                  </Handling>
                </Kort>
              </Reveal>
            )
          })}
        </Rad>

        <Reveal>
          <Bunn>
            <Knapp to="/gravering#konfigurator" $variant="mork">
              {jul ? 'Lag julegaven' : 'Design din egen'}
            </Knapp>
            <small>
              Ferdig gravert og sendt hjem · faktura følger med varen
              {jul && <> · 7–10 virkedager fra godkjent korrektur</>}
            </small>
            <PilLenke til="/gravering">Se alt vi graverer</PilLenke>
          </Bunn>
        </Reveal>
      </Wrap>
    </Seksjon>
  )
}

const Julestripe = styled.p`
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  margin: 1.1rem 0 0;
  padding: 0.7rem 1.1rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.accentSoft};
  box-shadow: inset 0 0 0 1px rgba(168, 81, 44, 0.22);
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.45;

  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.accent};
  }

  /*
   * Helt runde ender kler bare én tekstlinje. Når teksten brytes på smal
   * skjerm, blir pilla et avrundet felt i stedet – og snøfnugget flytter opp
   * til første linje så det leser som et merke, ikke som en punktliste.
   */
  @media (max-width: 760px) {
    align-items: flex-start;
    border-radius: 16px;

    svg {
      margin-top: 0.2em;
    }
  }
`

const Rad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

/**
 * Hele kortet er lenka – ikke bare en liten «velg»-knapp. Forhåndsvisningen er
 * det folk sikter på, så den skal være trykkflaten.
 */
const Kort = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.paper};
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  transition:
    transform 0.25s ease,
    box-shadow 0.25s ease;

  &:hover,
  &:focus-visible {
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;

    &:hover,
    &:focus-visible {
      transform: none;
    }
  }
`

const Rute = styled.div`
  display: grid;
  place-items: center;
  flex: 1;
  padding: clamp(1.25rem, 3vw, 2.25rem) clamp(1.25rem, 3vw, 2.25rem) 0.75rem;

  svg {
    width: 100%;
    max-height: 240px;
    overflow: visible;
  }
`

const Fot = styled.div`
  display: flex;
  /* Prisen skal stå på linje med produktnavnet, ikke med kategorimerket over. */
  align-items: flex-end;
  justify-content: space-between;
  gap: 1rem;
  padding: 0 clamp(1.25rem, 3vw, 2.25rem);

  .merkelapp {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xs};
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: 600;
  }

  .pris {
    flex: none;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
    font-variant-numeric: tabular-nums;
  }
`

const Handling = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.9rem clamp(1.25rem, 3vw, 2.25rem) 1.15rem;
  color: ${({ theme }) => theme.colors.accent};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;

  svg {
    transition: transform 0.25s ease;
  }

  ${Kort}:hover & svg {
    transform: translateX(3px);
  }

  @media (prefers-reduced-motion: reduce) {
    svg {
      transition: none;
    }
  }
`

const Bunn = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem 1.5rem;
  margin-top: 2.5rem;

  small {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  a:last-child {
    margin-left: auto;
  }

  @media (max-width: 560px) {
    a:last-child {
      margin-left: 0;
    }
  }
`
