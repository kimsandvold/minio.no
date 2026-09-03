import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'
import { TEMPLATES, KOMMER_SNART } from '../../../designer/registry'

const STEG = [
  { icon: 'faHandPointer', tittel: 'Velg produkt', tekst: 'Start fra et ferdig oppsett – carport, terrasse, plantekasse og mer.' },
  { icon: 'faArrowsUpDownLeftRight', tittel: 'Tilpass i 3D', tekst: 'Dra i målene, bytt treslag og farge, og se resultatet rotere i sanntid.' },
  { icon: 'faFilePdf', tittel: 'Få byggeplanen', tekst: 'Materialliste, kappliste og målsatt arbeidstegning – klar til å bygge eller bestille.' },
]

const JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': 'https://minio.no/designverktoy#page',
    name: 'Designverktøy – tegn uteprosjektet i 3D',
    url: 'https://minio.no/designverktoy',
    inLanguage: 'nb-NO',
    description: 'Minios gratis 3D-designverktøy. Tegn carport, terrasse, pergola, plantekasse, utekjøkken eller varmepumpekasse i 3D og få komplett byggeplan.',
    isPartOf: { '@id': 'https://minio.no/#website' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Produkter i Minios designverktøy',
    itemListElement: TEMPLATES.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.navn, url: `https://minio.no/designverktoy/${t.id}` })),
  },
]

export default function DesignerLandingPage() {
  useSEO({
    title: 'Designverktøy – tegn uteprosjektet ditt i 3D | Minio',
    description: 'Gratis 3D-designverktøy fra Minio. Tegn carport, terrasse, pergola, plantekasse, utekjøkken eller varmepumpekasse – tilpass mål og materialer, og få komplett byggeplan med materialliste og arbeidstegning.',
    keywords: '3d designverktøy, tegne selv, carport, terrasse, pergola, plantekasse, utekjøkken, byggeplan, materialliste',
    ogImage: '/images/designer/plantekasse-3d.webp',
    ogImageAlt: 'Minios 3D-designverktøy for uteprosjekter i tre',
    jsonLd: JSONLD,
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <Kicker><span>Gratis</span> Designverktøy i 3D</Kicker>
            <h1>Tegn det selv i 3D</h1>
            <p>
              Velg et produkt, dra i målene og bytt materialer i sanntid – og få en komplett
              byggeplan med materialliste og arbeidstegning. Helt gratis å designe.
            </p>
            <Chips>
              <li><Icon name="faCube" /> Se og roter i 3D</li>
              <li><Icon name="faRulerCombined" /> Live mål &amp; prisestimat</li>
              <li><Icon name="faFilePdf" /> Byggeplan &amp; materialliste</li>
              <li><Icon name="faHammer" /> Bestill bygging</li>
            </Chips>
          </Hero>

          <Content>
            <SectionHead>
              <h2>Velg hva du vil bygge</h2>
              <p>Alle er gratis å tegne. Byggeplanen kjøper du når du er fornøyd.</p>
            </SectionHead>

            <Grid>
              {TEMPLATES.map((t) => (
                <Card key={t.id} to={`/designverktoy/${t.id}`}>
                  <Thumb className="thumb">
                    {t.bilde ? <img src={t.bilde} alt={`${t.navn} tegnet i Minios 3D-designverktøy`} loading="lazy" /> : <Icon name={t.ikon} />}
                    {t.gratis ? <Free>Helt gratis</Free> : <Paid>Plan fra kr {t.fraPris}</Paid>}
                  </Thumb>
                  <Body>
                    <h3>{t.navn}</h3>
                    <p>{t.beskrivelse}</p>
                  </Body>
                  <Start>
                    <span>Design gratis</span>
                    <Icon name="faArrowRight" />
                  </Start>
                </Card>
              ))}

              {KOMMER_SNART.map((k) => (
                <SoonCard key={k.id}>
                  <Thumb className="thumb" $soon><Icon name={k.ikon} /></Thumb>
                  <Body>
                    <h3>{k.navn}</h3>
                    <p>{k.beskrivelse}</p>
                  </Body>
                  <SoonBadge>Kommer snart</SoonBadge>
                </SoonCard>
              ))}
            </Grid>

            <Steps>
              {STEG.map((s, i) => (
                <Step key={s.tittel}>
                  <StepNo>{i + 1}</StepNo>
                  <StepIco><Icon name={s.icon} /></StepIco>
                  <div>
                    <h3>{s.tittel}</h3>
                    <p>{s.tekst}</p>
                  </div>
                </Step>
              ))}
            </Steps>
          </Content>
        </main>
      </PageTransition>
      <Footer />
    </>
  )
}

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  ${blueprintGrid}
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3.25rem;

  &::after { ${blueprintGridVignette} }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 5rem 1rem 2.25rem;
  }

  h1 {
    position: relative;
    z-index: 1;
    font-size: 2.9rem;
    margin: 0 0 1rem;
    font-weight: 800;
    letter-spacing: -0.015em;
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) { font-size: 2rem; }
  }

  p {
    position: relative;
    z-index: 1;
    font-size: 1.15rem;
    max-width: 640px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.6;
    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) { font-size: 1rem; }
  }
`

const Kicker = styled.div`
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.74rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #c1c8d1;
  margin-bottom: 1rem;
  span {
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.4);
    border-radius: 999px;
    padding: 0.2rem 0.6rem;
    letter-spacing: 0.08em;
  }
`

const Chips = styled.ul`
  position: relative;
  z-index: 1;
  list-style: none;
  margin: 1.75rem 0 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.6rem 0.7rem;
  li {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #e7eaef;
    background: rgba(255, 255, 255, 0.07);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 999px;
    padding: 0.45rem 0.9rem;
  }
  svg { color: #c1c8d1; font-size: 0.8rem; }
`

const Content = styled.section`
  padding: 4rem 2rem 5rem;
  background: ${({ theme }) => theme.colors.lightBg};
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) { padding: 2.5rem 1rem 3.5rem; }
`

const SectionHead = styled.div`
  max-width: 1040px;
  margin: 0 auto 1.75rem;
  text-align: center;
  h2 { font-size: 1.7rem; margin: 0 0 0.4rem; color: ${({ theme }) => theme.colors.textDark}; font-weight: 800; }
  p { margin: 0; color: #626a74; font-size: 1rem; }
`

const Grid = styled.div`
  max-width: 1040px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
`

const Thumb = styled.div<{ $soon?: boolean }>`
  position: relative;
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  overflow: hidden;
  background: ${({ $soon }) => ($soon ? '#f2f4f7' : 'linear-gradient(135deg, #f7f8fa 0%, #e7eaef 100%)')};
  img { width: 100%; height: 100%; object-fit: contain; padding: 0.75rem; transition: transform 0.35s ease; }
  svg { font-size: 2.4rem; color: #a8afb9; }
`

const Card = styled(Link)`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  background: #fff;
  border: 1px solid #ececec;
  text-decoration: none;
  color: inherit;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s ease, box-shadow 0.25s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.13);
    border-color: #dce0e6;
  }
  &:hover .thumb img { transform: scale(1.05); }
  &:hover a, &:hover span { }
`

const Free = styled.span`
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #1a1d21;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(26, 29, 33, 0.25);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
`

const Paid = styled(Free)`
  color: #475569;
  border-color: rgba(71, 85, 105, 0.28);
  text-transform: none;
  letter-spacing: 0.02em;
`

const Body = styled.div`
  flex: 1;
  padding: 1.15rem 1.25rem 0.6rem;
  h3 { margin: 0 0 0.35rem; font-size: 1.2rem; font-weight: 700; color: ${({ theme }) => theme.colors.textDark}; }
  p { margin: 0; font-size: 0.9rem; line-height: 1.55; color: #626a74; }
`

const Start = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1.25rem 1.2rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: #1a1d21;
  svg { transition: transform 0.2s ease; }
  ${Card}:hover & svg { transform: translateX(4px); }
`

const SoonCard = styled.div`
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: 18px;
  background: #fbfcfd;
  border: 1px dashed #dce0e6;
`

const SoonBadge = styled.span`
  align-self: flex-start;
  margin: 0.3rem 1.25rem 1.2rem;
  font-size: 0.66rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #7c848e;
  background: #eaedf1;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
`

const Steps = styled.div`
  max-width: 1040px;
  margin: 3.5rem auto 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) { grid-template-columns: 1fr; }
`

const Step = styled.div`
  position: relative;
  display: flex;
  gap: 0.9rem;
  padding: 1.4rem 1.4rem 1.4rem 1.25rem;
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 16px;
  h3 { margin: 0 0 0.3rem; font-size: 1.05rem; color: ${({ theme }) => theme.colors.textDark}; }
  p { margin: 0; font-size: 0.88rem; line-height: 1.55; color: #626a74; }
`

const StepNo = styled.span`
  position: absolute;
  top: -12px;
  right: 16px;
  font-size: 2.4rem;
  font-weight: 800;
  color: #f2f4f7;
  line-height: 1;
`

const StepIco = styled.span`
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  background: rgba(26, 29, 33, 0.1);
  color: #1a1d21;
  font-size: 1.05rem;
`
