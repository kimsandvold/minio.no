import { Link } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import Leveringskart from '../../shared/Leveringskart/Leveringskart'
import { useSEO } from '../../../hooks/useSEO'
import { LEVERING_MAKS_KM } from '../../../utils/leveringsavstand'
import { Eyebrow, Hode, Ingress, Knapp, Reveal, Seksjon, SideHode, Tittel, Wrap } from '../../editorial'

/**
 * Samleside for alt Minio gjør *for* kunden, i motsetning til verktøyene
 * kunden bruker selv. Tjenestene lå tidligere bare i footeren, så den som
 * ville at noen andre skulle gjøre jobben hadde ingen inngang i toppmenyen.
 *
 * Minio bygger bare de små produktene ferdig. Større prosjekter (carport,
 * terrasse, pergola, garasje) får egen blokk, så ingen tror vi setter dem opp.
 */

interface Tjeneste {
  id: string
  merke: string
  kortnavn: string
  tittel: string
  ingress: string
  punkter: string[]
  til: string
  lenketekst: string
  bilde: string
  /** Render på hvit bakgrunn – vises hel i stedet for beskåret. */
  render?: boolean
}

const TJENESTER: Tjeneste[] = [
  {
    id: 'prosjekthjelp',
    merke: 'Gratis',
    kortnavn: 'Prosjekthjelp',
    tittel: 'Prosjekthjelp – helt gratis',
    ingress:
      'Har du en idé til et uteprosjekt, men vet ikke hvor du skal starte? Fortell om den, så får du et personlig svar på e-post – uforpliktende.',
    punkter: [
      'Ærlig svar om kostnad og materialer',
      'Ingen konto eller innlogging',
      'Du bestemmer om det blir noe mer',
    ],
    til: '/prosjekthjelp',
    lenketekst: 'Fortell om idéen din',
    bilde: '/images/hero/forside_1.webp',
  },
  {
    id: 'ferdig',
    merke: 'Ferdig bygget',
    kortnavn: 'Ferdig bygget',
    tittel: 'Vi bygger de små tingene',
    ingress:
      'Plantekasser, varmepumpehus, søppelboder, vedskjul, postkassestativ, utedo og utekjøkken bygger vi ferdig på bestilling.',
    punkter: [
      'Massivt tre, håndlaget på bestilling',
      'Ubehandlet, grunnet eller ferdig malt',
      `Levert innenfor ${LEVERING_MAKS_KM} km kjørevei`,
    ],
    til: '/produkter',
    lenketekst: 'Se hva vi bygger',
    bilde: '/images/hero/forside_8.webp',
  },
  {
    id: '3d-design',
    merke: 'Vi tegner',
    kortnavn: '3D-design',
    tittel: '3D-design — vi tegner det for deg',
    ingress:
      'Har du en idé som ikke finnes i designverktøyet? Send mål og bilder, så tegner og renderer vi prosjektet i 3D.',
    punkter: [
      '3D-skisse og fotorealistisk rendering',
      'Målsatt tegning og materialliste',
      'Skisseprisen trekkes fra ved bygg',
    ],
    til: '/3d-design',
    lenketekst: 'Se 3D-design',
    bilde: '/images/products/carport-3d.webp',
    render: true,
  },
  {
    id: 'byggehjelp',
    merke: 'På timen',
    kortnavn: 'Byggehjelp',
    tittel: 'Byggehjelp og rådgivning',
    ingress:
      'Står du fast? Lei en erfaren byggekyndig på timen — på stedet, eller til gjennomgang av tegning og materialliste.',
    punkter: [
      'Gjennomgang av tegning og mål',
      'Praktisk hjelp på byggeplassen',
      'Svar før du kjøper materialer',
    ],
    til: '/byggehjelp',
    lenketekst: 'Les om byggehjelp',
    bilde: '/images/hero/forside_4.webp',
  },
  {
    id: 'skilt',
    merke: 'Design selv',
    kortnavn: 'Skilt og gravering',
    tittel: 'Skilt og gravering',
    ingress:
      'Husskilt, hytteskilt, adresseskilt eller gravering på et produkt — designet i nettleseren og laserskåret hos oss.',
    punkter: [
      'Over 100 symboler og flere skrifttyper',
      'Lagre og del designet med oss',
      'Eksporteres som SVG for laserskjæring',
    ],
    til: '/skilt-og-gravering',
    lenketekst: 'Åpne skiltdesigneren',
    bilde: '/images/featured/minio_gravering_3.webp',
  },
]

const BYGGER_VI = ['Plantekasser', 'Varmepumpehus', 'Søppelboder', 'Vedskjul', 'Postkassestativ', 'Utedo', 'Utekjøkken']
const BYGGER_VI_IKKE = ['Carport', 'Terrasse', 'Pergola', 'Garasje']

const STORE_VEIER = [
  {
    ikon: 'faCube',
    tittel: 'Tegn selv i 3D',
    tekst:
      'Tegn prosjektet med dine egne mål – gratis – og kjøp byggeplanen med materialliste, kappliste og arbeidstegninger når du er klar.',
    til: '/designverktoy',
    cta: 'Åpne designverktøyet',
  },
  {
    ikon: 'faPalette',
    tittel: 'La oss tegne det',
    tekst: 'Passer ikke prosjektet i designverktøyet, tegner vi det i 3D med målsatt tegning og materialliste.',
    til: '/3d-design',
    cta: 'Se 3D-design',
  },
  {
    ikon: 'faHammer',
    tittel: 'Finn en snekker',
    tekst: 'Vil du ikke bygge selv? Fortell om prosjektet, så hjelper vi deg å finne en snekker som kan sette det opp.',
    til: '/prosjekthjelp',
    cta: 'Få gratis prosjekthjelp',
  },
]

const TJENESTER_JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://minio.no/tjenester#page',
    name: 'Tjenester – Minio',
    url: 'https://minio.no/tjenester',
    description:
      'Minios tjenester: gratis prosjekthjelp, ferdig bygde små treprodukter, 3D-design, byggehjelp og rådgivning, samt skilt og gravering.',
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: TJENESTER.map((t, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: t.tittel,
      url: `https://minio.no${t.til}`,
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
      { '@type': 'ListItem', position: 2, name: 'Tjenester', item: 'https://minio.no/tjenester' },
    ],
  },
]

export default function TjenesterPage() {
  useSEO({
    title: 'Tjenester – ferdig bygget, 3D-design, byggehjelp og gravering | Minio',
    description:
      'Skal noen andre gjøre jobben? Gratis prosjekthjelp, små treprodukter bygget ferdig, 3D-tegning av prosjektet ditt, byggehjelp på timen og skilt med gravering.',
    keywords:
      'tjenester, prosjekthjelp, få bygget plantekasse, varmepumpehus på bestilling, 3D-design, byggehjelp, rådgivning, skilt og gravering, finne snekker',
    ogImage: '/images/byggeguider/hagebenk.webp',
    ogImageAlt: 'Minios tjenester',
    jsonLd: TJENESTER_JSONLD,
  })

  const [hoved, ...resten] = TJENESTER

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <SideHode
            eyebrow="Tjenester"
            tittel="Skal noen andre gjøre jobben?"
            ingress={
              <>
                Designverktøyet og byggeguidene er til deg som bygger selv. Her er det motsatte:
                vi tegner prosjektet ditt, går gjennom tegningen din, graverer skiltet – og bygger
                de små produktene ferdig.
              </>
            }
            handlinger={
              <>
                <Knapp to="/prosjekthjelp" $variant="hvit">Få gratis prosjekthjelp</Knapp>
                <Knapp to="/designverktoy" $variant="glass">Bygg selv i 3D</Knapp>
              </>
            }
          >
            <Snarveier aria-label="Tjenester på siden">
              {TJENESTER.map((t) => (
                <a key={t.id} href={`#${t.id}`}>
                  {t.kortnavn}
                </a>
              ))}
              <a href="#storre-prosjekter">Større prosjekter</a>
            </Snarveier>
          </SideHode>

          <Seksjon id="tjenester">
            <Wrap>
              <Reveal>
                <TjenesteKort tjeneste={hoved} bred />
              </Reveal>
              <Grid>
                {resten.map((t, i) => (
                  <Reveal key={t.id} forsinkelse={(i % 2) * 90}>
                    <TjenesteKort tjeneste={t} />
                  </Reveal>
                ))}
              </Grid>
            </Wrap>
          </Seksjon>

          <Seksjon $flate="surface" id="storre-prosjekter">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Større prosjekter?</Eyebrow>
                    <Tittel>Carport eller terrasse? Vi hjelper deg videre.</Tittel>
                  </div>
                  <Ingress>
                    Vi bygger bare de små produktene ferdig. Større prosjekter setter vi ikke opp
                    selv – men du kan få tegningen og byggeplanen, og hjelp til å finne en snekker.
                  </Ingress>
                </Hode>
              </Reveal>

              <StorGrid>
                <Reveal>
                  <Oversikt>
                    <div>
                      <h3>Bygger vi ferdig</h3>
                      <ul>
                        {BYGGER_VI.map((p) => (
                          <li key={p}>
                            <Icon name="faCheck" /> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3>Bygger vi ikke</h3>
                      <ul className="ikke">
                        {BYGGER_VI_IKKE.map((p) => (
                          <li key={p}>
                            <Strek aria-hidden="true" /> {p}
                          </li>
                        ))}
                      </ul>
                      <p>Her får du plan, tegning eller hjelp til å finne en snekker.</p>
                    </div>
                  </Oversikt>
                </Reveal>

                <Veier>
                  {STORE_VEIER.map((v, i) => (
                    <Reveal key={v.tittel} forsinkelse={i * 80}>
                      <Vei to={v.til}>
                        <VeiIkon aria-hidden="true">
                          <Icon name={v.ikon} />
                        </VeiIkon>
                        <div>
                          <h3>{v.tittel}</h3>
                          <p>{v.tekst}</p>
                          <Cta>
                            {v.cta} <Icon name="faArrowRight" />
                          </Cta>
                        </div>
                      </Vei>
                    </Reveal>
                  ))}
                </Veier>
              </StorGrid>
            </Wrap>
          </Seksjon>

          <Seksjon id="levering">
            <Wrap>
              <Reveal>
                <Leveringskart />
              </Reveal>
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

function TjenesteKort({ tjeneste: t, bred }: { tjeneste: Tjeneste; bred?: boolean }) {
  return (
    <Kort to={t.til} id={t.id} $bred={bred}>
      <Bilde $render={t.render} $bred={bred}>
        <img src={t.bilde} alt="" loading={bred ? 'eager' : 'lazy'} />
      </Bilde>
      <Tekst $bred={bred}>
        <Merke>{t.merke}</Merke>
        <h2>{t.tittel}</h2>
        <p>{t.ingress}</p>
        <Punkter>
          {t.punkter.map((p) => (
            <li key={p}>
              <Icon name="faCheck" /> {p}
            </li>
          ))}
        </Punkter>
        <Cta>
          {t.lenketekst} <Icon name="faArrowRight" />
        </Cta>
      </Tekst>
    </Kort>
  )
}

/* ---------- Sidehode ---------- */

const Snarveier = styled.nav`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;

  a {
    display: inline-flex;
    align-items: center;
    min-height: 40px;
    padding: 0 1rem;
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkInverted};
    text-decoration: none;
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.borderInverted};
    transition: background ${({ theme }) => theme.transitions.default};

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }
  }
`

/* ---------- Tjenestekort ---------- */

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-top: 1.25rem;

  > * {
    display: flex;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-top: 1rem;
  }
`

const Kort = styled(Link)<{ $bred?: boolean }>`
  display: flex;
  flex-direction: ${({ $bred }) => ($bred ? 'row-reverse' : 'column')};
  width: 100%;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.surface};
  color: inherit;
  text-decoration: none;
  scroll-margin-top: 6rem;
  box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border};
  transition:
    box-shadow ${({ theme }) => theme.transitions.soft},
    transform ${({ theme }) => theme.transitions.soft};

  img {
    transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow:
      0 0 0 1px ${({ theme }) => theme.colors.borderStrong},
      0 24px 48px rgba(28, 26, 24, 0.1);

    img {
      transform: scale(1.04);
    }
  }

  &:hover svg:last-child {
    transform: translateX(4px);
  }

  @media (max-width: 860px) {
    flex-direction: column;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover,
    &:hover img,
    &:hover svg:last-child {
      transform: none;
    }
  }
`

const Bilde = styled.div<{ $render?: boolean; $bred?: boolean }>`
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: ${({ theme, $render }) => ($render ? theme.colors.surface : theme.colors.sunken)};
  ${({ $render, theme }) => $render && `border-bottom: 1px solid ${theme.colors.border};`}

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: ${({ $render }) => ($render ? 'contain' : 'cover')};
    padding: ${({ $render }) => ($render ? '6% 8% 2%' : '0')};
  }

  ${({ $bred }) =>
    $bred &&
    `
    @media (min-width: 861px) {
      flex: 0 0 52%;
      aspect-ratio: auto;
      min-height: 26rem;
    }
  `}
`

const Tekst = styled.div<{ $bred?: boolean }>`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: ${({ $bred }) => ($bred ? 'clamp(1.75rem, 4vw, 3.25rem)' : '1.75rem 1.75rem 1.6rem')};
  justify-content: ${({ $bred }) => ($bred ? 'center' : 'flex-start')};

  h2 {
    margin: 0.9rem 0 0.7rem;
    font-size: ${({ $bred }) => ($bred ? 'clamp(1.8rem, 3vw, 2.6rem)' : 'clamp(1.45rem, 2vw, 1.75rem)')};
    font-weight: 600;
    line-height: 1.08;
    letter-spacing: -0.035em;
  }

  > p {
    margin: 0 0 1.25rem;
    max-width: 46ch;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ $bred, theme }) => ($bred ? theme.fontSizes.md : theme.fontSizes.base)};
    line-height: 1.55;
  }

  @media (max-width: 560px) {
    padding: 1.5rem 1.35rem 1.4rem;
  }
`

const Merke = styled.span`
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  min-height: 26px;
  padding: 0 0.7rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  background: ${({ theme }) => theme.colors.accentSoft};
  color: ${({ theme }) => theme.colors.accentInk};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
`

const Punkter = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 1.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;

  li {
    display: flex;
    align-items: baseline;
    gap: 0.6rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.ink};

    svg {
      flex-shrink: 0;
      font-size: 0.72rem;
      color: ${({ theme }) => theme.colors.accent};
    }
  }
`

const Cta = styled.span`
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

/* ---------- Større prosjekter ---------- */

const StorGrid = styled.div`
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: 1.25rem;
  align-items: stretch;

  > :first-child {
    display: flex;
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`

const Oversikt = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
  padding: clamp(1.75rem, 3.5vw, 2.5rem);
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.paper};

  h3 {
    margin: 0 0 1.1rem;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: 600;
    letter-spacing: -0.01em;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    font-size: 1.05rem;
    letter-spacing: -0.01em;

    svg {
      font-size: 0.75rem;
      color: ${({ theme }) => theme.colors.accent};
    }
  }

  .ikke li {
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  p {
    margin: 1.25rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  @media (max-width: 420px) {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
`

const Strek = styled.span`
  display: inline-block;
  width: 0.75rem;
  height: 1.5px;
  background: ${({ theme }) => theme.colors.neutral[400]};
`

const Veier = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Vei = styled(Link)`
  display: flex;
  gap: 1.25rem;
  padding: 1.6rem 1.75rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.paper};
  color: inherit;
  text-decoration: none;
  transition:
    transform ${({ theme }) => theme.transitions.soft},
    box-shadow ${({ theme }) => theme.transitions.soft};

  h3 {
    margin: 0.2rem 0 0.4rem;
    font-size: 1.3rem;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0 0 0.9rem;
    max-width: 50ch;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.55;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 20px 40px rgba(28, 26, 24, 0.08);
  }

  &:hover svg:last-child {
    transform: translateX(4px);
  }

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem 1.35rem;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover,
    &:hover svg:last-child {
      transform: none;
    }
  }
`

const VeiIkon = styled.span`
  flex: none;
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 1.15rem;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentSoft};
`
