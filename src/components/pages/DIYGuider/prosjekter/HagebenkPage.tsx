import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../../layout/Navbar'
import Footer from '../../../layout/Footer'
import ProductModal from '../../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../../shared/PageTransition'
import { useSEO } from '../../../../hooks/useSEO'
import { Callout, DataTable, H3, Ol, P, Ul } from '../GuideArticleLayout'

const ACCENT = '#9c6b3f'
const SITE_URL = 'https://minio.no'

const Header = styled.header`
  background: linear-gradient(180deg, #fff 0%, ${({ theme }) => theme.colors.lightBg} 100%);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  padding: 7rem 2rem 2.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 6rem 1.25rem 2rem;
  }
`

const Container = styled.div`
  max-width: 880px;
  margin: 0 auto;
`

const Breadcrumb = styled.nav`
  font-size: 0.85rem;
  color: #888;
  margin-bottom: 1.25rem;

  a {
    color: ${ACCENT};
    text-decoration: none;
    font-weight: 600;

    &:hover {
      text-decoration: underline;
    }
  }

  span {
    margin: 0 0.5rem;
    color: #bbb;
  }
`

const Eyebrow = styled.span`
  display: inline-block;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: ${ACCENT};
  margin-bottom: 0.75rem;
`

const Title = styled.h1`
  font-size: 2.6rem;
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: -0.01em;
  color: ${({ theme }) => theme.colors.textDark};
  margin-bottom: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.9rem;
  }
`

const Lead = styled.p`
  font-size: 1.22rem;
  line-height: 1.6;
  color: #4a4a4a;
  max-width: 64ch;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    font-size: 1.08rem;
  }
`

const FactsBar = styled.dl`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1.75rem;
  border-top: 1px solid rgba(0, 0, 0, 0.08);

  @media (max-width: ${({ theme }) => theme.breakpoints.smallMobile}) {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }

  div {
    min-width: 0;
  }

  dt {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #999;
    margin-bottom: 0.3rem;
  }

  dd {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const Body = styled.section`
  padding: 2.75rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2rem 1.25rem 3rem;
  }
`

const Figure = styled.figure`
  margin: 0 0 2.5rem;

  figcaption {
    margin-top: 0.6rem;
    font-size: 0.85rem;
    color: #999;
    text-align: center;
  }
`

const HeroImg = styled.img`
  width: 100%;
  height: auto;
  display: block;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  background: ${({ theme }) => theme.colors.lightBg};
`

const Section = styled.section`
  & + & {
    margin-top: 2.75rem;
  }

  > h2 {
    font-size: 1.55rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 1rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.35rem;
    }
  }
`

const Cta = styled.div`
  margin-top: 3rem;
  padding: 2rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.darkBg};
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;

  h3 {
    font-size: 1.3rem;
    font-weight: 700;
    margin-bottom: 0.5rem;
  }

  p {
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 1.25rem;
    line-height: 1.55;
  }

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.7rem 1.4rem;
    border-radius: ${({ theme }) => theme.borderRadius.pill};
    font-size: 0.95rem;
    font-weight: 600;
    text-decoration: none;
    background: ${ACCENT};
    color: #fff;
    transition: transform 0.2s ease;

    &:hover {
      transform: translateY(-2px);
    }
  }
`

export default function HagebenkPage() {
  useSEO({
    title: 'Bygg en hagebenk – byggeguide | Minio',
    description:
      'Gratis byggeguide: bygg en stilren hagebenk i trykkimpregnert terrassebord, limt og skrudd sammen. Materialliste, mål og fremgangsmåte – steg for steg.',
    ogImage: '/images/byggeguider/hagebenk.webp',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Byggeguider', item: `${SITE_URL}/byggeguider` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Hagebenk',
            item: `${SITE_URL}/byggeguider/prosjekter/hagebenk`,
          },
        ],
      },
    ],
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main>
          <Header>
            <Container>
              <Breadcrumb aria-label="Brødsmulesti">
                <Link to="/byggeguider">Byggeguider</Link>
                <span>›</span>
                Prosjekter
                <span>›</span>
                Hagebenk
              </Breadcrumb>
              <Eyebrow>Prosjekt</Eyebrow>
              <Title>Hagebenk</Title>
              <Lead>
                En stilren, slettet hagebenk bygget i trykkimpregnert terrassebord – limt og skrudd
                sammen. Et takknemlig prosjekt med få deler og et resultat som tåler å stå ute.
              </Lead>
              <FactsBar>
                <div>
                  <dt>Vanskelighetsgrad</dt>
                  <dd>Nybegynner</dd>
                </div>
                <div>
                  <dt>Tid</dt>
                  <dd>3–4 timer*</dd>
                </div>
                <div>
                  <dt>Lengde</dt>
                  <dd>100 cm</dd>
                </div>
                <div>
                  <dt>Materiale</dt>
                  <dd>Terrassebord</dd>
                </div>
              </FactsBar>
            </Container>
          </Header>

          <Body>
            <Container>
              <Figure>
                <HeroImg
                  src="/images/byggeguider/hagebenk.webp"
                  alt="3D-tegning av ferdig hagebenk i trykkimpregnert terrassebord"
                />
                <figcaption>Slik ser den ferdige benken ut.</figcaption>
              </Figure>

              <Section>
                <h2>Hva du bygger</h2>
                <P>
                  Benken er satt sammen av terrassebord i samme tykkelse, der bord på høykant gir det
                  karakteristiske, luftige slette-uttrykket. Alt limes og skrus – ingen kompliserte
                  sammenføyninger. Materialet er trykkimpregnert, så benken tåler å stå ute året
                  rundt.
                </P>
                <Callout variant="tip" title="Ny til bygging?">
                  Les gjerne de grunnleggende guidene først – særlig{' '}
                  <Link to="/byggeguider/trevirke">Trevirke</Link>,{' '}
                  <Link to="/byggeguider/maling-og-merking">Måling &amp; merking</Link> og{' '}
                  <Link to="/byggeguider/saging-og-sammenfoyning">Saging &amp; sammenføyning</Link>.
                </Callout>
              </Section>

              <Section>
                <h2>Materialliste</h2>
                <P>
                  Alle delene kappes fra trykkimpregnert terrassebord med tverrsnitt 120 × 28 mm.
                </P>
                <Figure>
                  <HeroImg
                    src="/images/byggeguider/hagebenk-deler.webp"
                    alt="Delene til hagebenken med mål og antall: 8 klosser 10×2,8×10 cm, 4 bord 12×2,8×28 cm, 10 bord 12×2,8×40 cm og 6 bord 12×2,8×100 cm"
                  />
                  <figcaption>Alle delene i målestokk – med mål og antall.</figcaption>
                </Figure>
                <DataTable>
                  <caption>Deler (mål: bredde × tykkelse × lengde)</caption>
                  <thead>
                    <tr>
                      <th>Del</th>
                      <th>Mål</th>
                      <th>Antall</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1 – Setebord (lange)</td>
                      <td>120 × 28 × 1000 mm</td>
                      <td>6</td>
                    </tr>
                    <tr>
                      <td>2 – Beinbord (lange)</td>
                      <td>120 × 28 × 400 mm</td>
                      <td>10</td>
                    </tr>
                    <tr>
                      <td>3 – Avstandsklosser (bunn av bein)</td>
                      <td>100 × 100 × 28 mm</td>
                      <td>8</td>
                    </tr>
                    <tr>
                      <td>4 – Beinbord (korte)</td>
                      <td>120 × 28 × 280 mm</td>
                      <td>4</td>
                    </tr>
                  </tbody>
                </DataTable>
                <Callout variant="tip" title="I tillegg trenger du">
                  Utelim (D4), rustfrie eller varmgalvaniserte skruer og eventuell
                  overflatebehandling (beis eller olje).
                </Callout>
              </Section>

              <Section>
                <h2>Verktøy</h2>
                <P>Du klarer deg med grunnutstyret:</P>
                <Ul>
                  <li>Sag (hånd-, stikk- eller kappsag)</li>
                  <li>Drill/skrutrekker og bor til forboring</li>
                  <li>Tommestokk, blyant og vinkelhake</li>
                  <li>Tvinger til å holde delene mens limet tørker</li>
                  <li>Slipepapir</li>
                </Ul>
                <P>
                  Usikker på hva du trenger? Se guiden om{' '}
                  <Link to="/byggeguider/verktoy">verktøy</Link>.
                </P>
              </Section>

              <Section>
                <h2>Slik bygger du</h2>
                <Callout variant="tip" title="Detaljert fremgangsmåte kommer">
                  Steg-for-steg med bilder for hvert trinn legges inn så snart byggebildene er klare.
                  Under er hovedtrinnene i rekkefølge.
                </Callout>
                <Ol>
                  <li>
                    <strong>Kapp alle delene</strong> etter materiallista. Bruk et anslag så like
                    deler blir nøyaktig like lange.
                  </li>
                  <li>
                    <strong>Slip</strong> delene og bryt de skarpe kantene lett.
                  </li>
                  <li>
                    <strong>Bygg de to beina</strong> ved å lime og skru beinbordene sammen til to
                    like sideseksjoner. Avstandsklossene settes nederst og holder beinbordene i
                    avstand ved bunnen av beina.
                  </li>
                  <li>
                    <strong>Monter setet</strong> av de seks lange bordene med jevne mellomrom. La
                    annethvert setebord overlappe beinbordene i hver ende, slik at sete og bein griper
                    inn i hverandre og låser hjørnet. Lim og skru hvert møtepunkt, og kontroller at
                    benken står i vinkel før limet herder.
                  </li>
                  <li>
                    <strong>Overflatebehandle</strong> når alt er tørt og rent.
                  </li>
                </Ol>
                <H3>Tips underveis</H3>
                <P>
                  Forbor nær endene så terrassebordet ikke sprekker, og tørrmonter gjerne hver
                  seksjon før du limer. Mål diagonalene for å sjekke at benken står i vinkel.
                </P>
              </Section>

              <Section>
                <h2>Overflatebehandling</h2>
                <P>
                  Trykkimpregnert tre må tørke før det behandles – ofte flere uker. Deretter gir et
                  par strøk beis eller olje benken et ferdig uttrykk og lengre liv. Se guiden om{' '}
                  <Link to="/byggeguider/overflatebehandling">overflatebehandling</Link> for valg og
                  påføring.
                </P>
                <P>
                  <small>* Tid og mål er anslag og justeres når detaljene er bekreftet.</small>
                </P>
              </Section>

              <Cta>
                <h3>Lyst til å bygge mer?</h3>
                <p>Finn flere prosjekter og grunnleggende byggeguider.</p>
                <Link to="/byggeguider">Til byggeguidene</Link>
              </Cta>
            </Container>
          </Body>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}
