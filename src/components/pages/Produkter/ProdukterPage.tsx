import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { useAllProducts } from '../../../hooks/useProducts'
import { useActivePoll } from '../../../hooks/useActivePoll'
import PollCard from '../../sections/Portfolio/PollCard'
import { Eyebrow, Knapp, Reveal, Seksjon, SideHode, Tittel, Wrap } from '../../editorial'
import ProduktKort, { ProduktKortSkjelett } from '../../editorial/ProduktKort'

const ANDRE_VEIER = [
  {
    ikon: 'faCube',
    tittel: 'Design selv i 3D',
    tekst: 'Carport, terrasse, pergola og mer – tegn med dine mål og få materialliste og byggeplan.',
    til: '/designverktoy',
    cta: 'Åpne designverktøyet',
  },
  {
    ikon: 'faLightbulb',
    tittel: 'Har du en egen idé?',
    tekst: 'Få prisanslag på tre trykk og et personlig svar – også på prosjekter som ikke står her.',
    til: '/prosjekthjelp',
    cta: 'Få prisanslag',
  },
]

export default function ProdukterPage() {
  const { data: produkter, loading } = useAllProducts()
  const { activePollId } = useActivePoll()

  useSEO({
    title: 'Alle produkter – Minio',
    description: 'Utforsk Minios sortiment av skreddersydde treløsninger – varmepumpehus, søppelboder, postkassestativer, levegger og mer. Håndlaget i Lillehammer.',
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <SideHode
            eyebrow="Laget på bestilling"
            tittel="Produkter"
            ingress={
              <>
                Plantekasser, varmepumpehus, søppelboder og mer – laget etter dine mål. Velg et
                produkt for å tilpasse størrelse, treslag og finish.
              </>
            }
            handlinger={
              <>
                <Knapp to="/handlaget-i-tre" $variant="glass">Om håndverket</Knapp>
              </>
            }
          />

          <Seksjon>
            <Wrap>
              <Grid aria-busy={loading}>
                {loading
                  ? Array.from({ length: 6 }, (_, i) => <ProduktKortSkjelett key={i} />)
                  : produkter.map((p, i) => (
                      <Reveal key={p.id} forsinkelse={(i % 3) * 80}>
                        <ProduktKort produkt={p} medBeskrivelse />
                      </Reveal>
                    ))}
                {!loading && activePollId && <PollCard pollId={activePollId} />}
              </Grid>
            </Wrap>
          </Seksjon>

          <Seksjon $flate="surface">
            <Wrap>
              <Reveal>
                <Eyebrow>Finner du ikke det du leter etter?</Eyebrow>
                <Tittel>Større prosjekter starter i 3D.</Tittel>
              </Reveal>
              <Veier>
                {ANDRE_VEIER.map((v, i) => (
                  <Reveal key={v.til} forsinkelse={i * 90}>
                    <Vei to={v.til}>
                      <VeiIkon><Icon name={v.ikon} /></VeiIkon>
                      <h3>{v.tittel}</h3>
                      <p>{v.tekst}</p>
                      <VeiCta>
                        {v.cta} <Icon name="faArrowRight" />
                      </VeiCta>
                    </Vei>
                  </Reveal>
                ))}
              </Veier>
            </Wrap>
          </Seksjon>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem 1.5rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem 1rem;
  }

  /* Mobil: to kolonner som i en nettbutikk – bilde, navn og pris er nok. */
  @media (max-width: 520px) {
    gap: 2rem 0.75rem;

    .beskrivelse {
      display: none;
    }
  }
`

const Veier = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-top: clamp(2rem, 4vw, 3rem);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const Vei = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.paper};
  color: inherit;
  text-decoration: none;
  transition: transform ${({ theme }) => theme.transitions.soft}, box-shadow ${({ theme }) => theme.transitions.soft};

  h3 {
    margin: 1.5rem 0 0.5rem;
    font-size: 1.6rem;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0 0 1.75rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 44ch;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 24px 48px rgba(28, 26, 24, 0.08);
  }

  &:hover svg:last-child {
    transform: translateX(4px);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
    }
  }
`

const VeiIkon = styled.span`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 1.15rem;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentSoft};
`

const VeiCta = styled.span`
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};

  svg {
    font-size: 0.8em;
    transition: transform ${({ theme }) => theme.transitions.default};
  }
`
