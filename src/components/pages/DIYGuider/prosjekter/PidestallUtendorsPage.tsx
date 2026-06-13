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

export default function PidestallUtendorsPage() {
  const pageUrl = `${SITE_URL}/byggeguider/prosjekter/pidestall-utendors`
  const imageUrl = `${SITE_URL}/images/byggeguider/pidestall.webp`

  useSEO({
    title: 'Bygg en pidestall utendørs – byggeguide | Minio',
    description:
      'Gratis byggeguide: bygg en klassisk søyle-pidestall i trykkimpregnert terrassebord. Materialliste, mål og fremgangsmåte for sokkel, søyle og topp – steg for steg.',
    ogImage: '/images/byggeguider/pidestall.webp',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'Bygg en pidestall utendørs',
        description:
          'Steg-for-steg byggeguide for en klassisk søyle-pidestall i trykkimpregnert terrassebord, med bred sokkel, gjæret søyle og speilet topp.',
        image: imageUrl,
        totalTime: 'PT4H',
        estimatedCost: { '@type': 'MonetaryAmount', currency: 'NOK', value: '300' },
        supply: [
          { '@type': 'HowToSupply', name: 'Terrassebord 120 × 28 mm til ytre ramme (sokkel + topp), 4 stk' },
          { '@type': 'HowToSupply', name: 'Terrassebord 90 × 28 mm til indre ramme (sokkel + topp), 4 stk' },
          { '@type': 'HowToSupply', name: 'Terrassebord 120 × 28 mm til gjæret søyle, 4 stk' },
          { '@type': 'HowToSupply', name: 'Utelim (D4)' },
          { '@type': 'HowToSupply', name: 'Rustfrie eller varmgalvaniserte skruer' },
          { '@type': 'HowToSupply', name: 'Beis eller olje til overflatebehandling' },
        ],
        tool: [
          { '@type': 'HowToTool', name: 'Kapp- eller gjærsag' },
          { '@type': 'HowToTool', name: 'Drill/skrutrekker og bor til forboring' },
          { '@type': 'HowToTool', name: 'Tommestokk, blyant og vinkelhake' },
          { '@type': 'HowToTool', name: 'Tvinger' },
          { '@type': 'HowToTool', name: 'Slipepapir' },
        ],
        step: [
          {
            '@type': 'HowToStep',
            name: 'Kapp alle delene',
            text: 'Kapp alle delene etter materiallista. Bruk et anslag så like deler blir nøyaktig like lange.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Gjær søylebordene',
            text: 'Gjær søylebordene 45° langs begge langkantene, slik at de fire bordene møtes i et tett, kvadratisk hjørne og danner en hul 12 × 12 cm søyle.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Lim opp søyla',
            text: 'Sett de fire gjærede bordene sammen til en kasse. Bruk tvinger eller en stropp rundt for å holde hjørnene tette mens limet herder, og kontroller at søyla er i vinkel.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Bygg sokkelen',
            text: 'Legg den ytre ramma (24 × 24 cm) og lim den mindre indre ramma (18 × 18 cm) sentrert oppå, med bordene på tvers av den ytre slik at skjøtene krysser hverandre for en stødigere sokkel.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Monter søyla',
            text: 'Monter søyla sentrert på sokkelen, lim og skru nedenfra opp i søyla.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Bygg og monter toppen',
            text: 'Bygg toppen på samme måte som sokkelen, speilvendt og med indre ramme på tvers av den ytre, og fest den sentrert på toppen av søyla.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Overflatebehandle',
            text: 'La trykkimpregnert tre tørke, og påfør deretter et par strøk beis eller olje når alt er tørt og rent.',
            url: `${pageUrl}#slik-bygger-du`,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Byggeguider', item: `${SITE_URL}/byggeguider` },
          {
            '@type': 'ListItem',
            position: 3,
            name: 'Pidestall utendørs',
            item: pageUrl,
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
                Pidestall utendørs
              </Breadcrumb>
              <Eyebrow>Prosjekt</Eyebrow>
              <Title>Pidestall utendørs</Title>
              <Lead>
                En klassisk søyle-pidestall bygget i trykkimpregnert terrassebord – med en bred sokkel,
                en luftig søyle med gjæret hjørne og en topp i samme stil. En fin sokkel for en
                potteplante, lykt eller skulptur ute.
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
                  <dt>Høyde</dt>
                  <dd>ca. 65 cm</dd>
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
                  src="/images/byggeguider/pidestall.webp"
                  alt="3D-tegning av ferdig pidestall i trykkimpregnert terrassebord"
                />
                <figcaption>Slik ser den ferdige pidestallen ut.</figcaption>
              </Figure>

              <Section>
                <h2>Hva du bygger</h2>
                <P>
                  Pidestallen bygges i tre nivåer: en bred, kvadratisk sokkel, en slank søyle og en
                  topp som speiler sokkelen. Sokkel og topp består hver av en ytre ramme på 24 × 24 cm
                  og en mindre indre ramme på 18 × 18 cm, slik at du får den klassiske, trappede
                  profilen. Den indre ramma legges med bordene på tvers av den ytre, slik at skjøtene
                  krysser hverandre i stedet for å ligge i samme retning – det binder lagene sammen og
                  gir en stødigere sokkel og topp. Søyla er en hul 12 × 12 cm kasse satt sammen av fire
                  terrassebord med gjærede (45°) langkanter som møtes i et tett hjørne. Alt limes og
                  skrus – materialet er trykkimpregnert, så pidestallen tåler å stå ute året rundt.
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
                  Alle delene kappes fra trykkimpregnert terrassebord med tykkelse 28 mm. De fire
                  søylebordene rives/kappes til 12 cm bredde og gjæres 45° langs begge langkantene, slik
                  at de møtes i et kvadratisk hjørne.
                </P>
                <Figure>
                  <HeroImg
                    src="/images/byggeguider/pidestall-deler.webp"
                    alt="Delene til pidestallen med mål og antall: bord 12×2,8×24 cm til ytre sokkel og topp, bord 9×2,8×18 cm til indre sokkel og topp, og fire gjærede søylebord 12×2,8×54 cm"
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
                      <td>1 – Ytre ramme (sokkel + topp), 24 × 24 cm pr. nivå</td>
                      <td>120 × 28 × 240 mm</td>
                      <td>4</td>
                    </tr>
                    <tr>
                      <td>2 – Indre ramme (sokkel + topp), 18 × 18 cm pr. nivå</td>
                      <td>90 × 28 × 180 mm</td>
                      <td>4</td>
                    </tr>
                    <tr>
                      <td>3 – Søylebord (gjæret 45° på begge langkanter)</td>
                      <td>120 × 28 × 540 mm</td>
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
                <P>Du klarer deg med grunnutstyret – men en sag med vinkelinnstilling gjør gjæringen lettere:</P>
                <Ul>
                  <li>Kapp- eller gjærsag (for 45° gjæring av søylebordene)</li>
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

              <Section id="slik-bygger-du">
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
                    <strong>Gjær søylebordene</strong> 45° langs begge langkantene, slik at de fire
                    bordene møtes i et tett, kvadratisk hjørne og danner en hul 12 × 12 cm søyle.
                  </li>
                  <li>
                    <strong>Lim opp søyla</strong>. Sett de fire gjærede bordene sammen til en kasse –
                    bruk tvinger eller en stropp rundt for å holde hjørnene tette mens limet herder.
                    Kontroller at søyla er i vinkel.
                  </li>
                  <li>
                    <strong>Bygg sokkelen</strong>. Legg den ytre ramma (24 × 24 cm) og lim den mindre
                    indre ramma (18 × 18 cm) sentrert oppå – men legg den indre ramma med bordene{' '}
                    <strong>på tvers</strong> av den ytre, slik at skjøtene krysser hverandre. Det
                    låser lagene mot hverandre og gir en stødigere sokkel. Den indre ramma løfter
                    samtidig søyla og gir den trappede profilen.
                  </li>
                  <li>
                    <strong>Monter søyla</strong> sentrert på sokkelen, lim og skru nedenfra opp i
                    søyla.
                  </li>
                  <li>
                    <strong>Bygg og monter toppen</strong> på samme måte som sokkelen, speilvendt –
                    husk å legge den indre ramma på tvers av den ytre her også. Fest toppen sentrert
                    på toppen av søyla.
                  </li>
                  <li>
                    <strong>Overflatebehandle</strong> når alt er tørt og rent.
                  </li>
                </Ol>
                <H3>Tips underveis</H3>
                <P>
                  Forbor nær endene så terrassebordet ikke sprekker, og tørrmonter gjerne hver
                  seksjon før du limer. Mål diagonalene for å sjekke at søyla står i vinkel før limet
                  herder.
                </P>
              </Section>

              <Section>
                <h2>Overflatebehandling</h2>
                <P>
                  Trykkimpregnert tre må tørke før det behandles – ofte flere uker. Deretter gir et
                  par strøk beis eller olje pidestallen et ferdig uttrykk og lengre liv. Se guiden om{' '}
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
