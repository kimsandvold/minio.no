import styled from 'styled-components'
import { Eyebrow, Hode, Ingress, Knapp, PilLenke, Reveal, Seksjon, Tittel, Wrap } from '../editorial'
import GraveringPreview from '../pages/Gravering/GraveringPreview'
import { graveringFraPris, produkt, type Valg } from '../../data/gravering'
import { gjeldendeSesong, sesongInnhold } from '../../data/sesong'

/**
 * Tre produkter tegnet live med samme komponent som konfiguratoren bruker – da
 * er forsidebildet alltid i takt med hva verktøyet faktisk kan lage, og vi
 * slipper å fotografere på nytt hver gang utvalget endres. Må være produkter
 * som faktisk er i salg (`tilgjengelig: true`), ellers lokker forsiden med noe
 * konfiguratoren ikke tilbyr.
 */
const SMAKEBITER: Valg[] = [
  {
    produkt: 'fjol-rekt',
    ...produkt('fjol-rekt').start,
    linjer: ['Familien Berg', 'Lillehammer', ''],
    font: 'Cormorant Garamond',
    symbol: null,
  },
  {
    produkt: 'drikkeflaske',
    ...produkt('drikkeflaske').start,
    flate: 'lysegronn',
    linjer: ['Solheim', 'Sjusjøen', ''],
    font: 'Bebas Neue',
    symbol: 'pine',
  },
  {
    produkt: 'kjevle',
    ...produkt('kjevle').start,
    oppsett: 'monster',
    linjer: ['God jul', '', ''],
    font: 'Cormorant Garamond',
    symbol: 'gingerbread',
  },
]

export default function GraveringSection() {
  const tekst = sesongInnhold[gjeldendeSesong()].gravering

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
            </div>
          </Hode>
        </Reveal>

        <Rad>
          {SMAKEBITER.map((vare, i) => (
            <Reveal key={i} forsinkelse={i * 90}>
              <Rute>
                <GraveringPreview dekorativ valg={vare} />
              </Rute>
            </Reveal>
          ))}
        </Rad>

        <Reveal>
          <Bunn>
            <Knapp to="/gravering" $variant="mork">
              Design din egen
            </Knapp>
            <small>Fra {graveringFraPris} kr · fjøl, kjevle, drikkeflaske og skilt</small>
            <PilLenke til="/gravering">Se alt vi graverer</PilLenke>
          </Bunn>
        </Reveal>
      </Wrap>
    </Seksjon>
  )
}

const Rad = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const Rute = styled.div`
  display: grid;
  place-items: center;
  height: 100%;
  padding: clamp(1.25rem, 3vw, 2.25rem);
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.paper};

  svg {
    width: 100%;
    max-height: 240px;
    overflow: visible;
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
