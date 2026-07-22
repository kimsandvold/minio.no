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

/** Ofte stilte spørsmål – vises både på siden og som FAQPage-schema for rike søkeresultater. */
const FAQ = [
  {
    q: 'Hvor stort skal innflygningshullet i fuglehuset være?',
    a: 'Hullstørrelsen bestemmer hvilke fugler som flytter inn. 28 mm passer blåmeis, 32 mm passer kjøttmeis og svarthvit fluesnapper, mens 45 mm passer større arter som spurv og stær. Vil du ha meiser, er 30–32 mm et trygt allround-mål.',
  },
  {
    q: 'Hvilket tre bør jeg bruke til et fuglehus?',
    a: 'Bruk ubehandlet tre som furu eller gran i 15–20 mm tykkelse. Ikke bruk trykk- eller royalimpregnert virke – impregneringen inneholder stoffer som er skadelige for fugler. Ubehandlet tre puster også bedre og gir et sunnere klima inni kassa.',
  },
  {
    q: 'Bør fuglehuset ha en sittepinne?',
    a: 'En sittepinne er mest til pynt og er ikke nødvendig – fuglene lander fint på kanten av hullet. Noen dropper den bevisst fordi den kan gjøre det lettere for katter og rovfugler å nå inn. Vil du ha den, holder en kort rundstav rett under hullet.',
  },
  {
    q: 'Hvor bør jeg henge opp fuglehuset?',
    a: 'Heng huset 1,5–3 meter over bakken, utenfor rekkevidde for katter, og vend innflygningshullet vekk fra regn og sterkeste vind (gjerne mot øst eller sørøst). Litt skygge midt på dagen hindrer at det blir for varmt inni.',
  },
  {
    q: 'Når bør fuglehuset henges opp?',
    a: 'Heng det opp i god tid før hekkesesongen – seinvinter eller tidlig vår (februar–mars) er ideelt. Da rekker fuglene å finne og godkjenne huset før de begynner å bygge reir.',
  },
  {
    q: 'Hvordan vedlikeholder jeg fuglehuset?',
    a: 'Tøm og rengjør huset én gang i året, helst på høsten etter at ungene har forlatt reiret. Børst ut gammelt reirmateriale og la kassa lufte og tørke. Lag noen dreneringshull i bunnen og luftehull høyt oppe så det holder seg tørt.',
  },
]

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

export default function FuglehusPage() {
  const pageUrl = `${SITE_URL}/byggeguider/prosjekter/fuglehus`
  const imageUrl = `${SITE_URL}/images/byggeguider/fuglehus.webp`

  useSEO({
    title: 'Bygge fuglehus selv – gratis byggeguide med mål og tegning | Minio',
    description:
      'Slik bygger du et fuglehus selv: komplett materialliste med mål, riktig størrelse på innflygningshullet og fremgangsmåte steg for steg. Gratis byggeguide.',
    keywords:
      'bygge fuglehus, fuglehus mål, fuglehus tegning, fuglekasse, lage fuglehus, fuglehus selv, innflygningshull fuglehus, fuglehus materialliste',
    ogImage: '/images/byggeguider/fuglehus.webp',
    ogImageAlt: '3D-tegning av et ferdig fuglehus med saltak, innflygningshull og sittepinne',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: 'Bygge fuglehus',
        inLanguage: 'nb-NO',
        description:
          'Steg-for-steg byggeguide for et fuglehus i ubehandlet tre, med bunnbrett med kant, fire vegger, saltak og sittepinne.',
        image: imageUrl,
        totalTime: 'PT3H',
        estimatedCost: { '@type': 'MonetaryAmount', currency: 'NOK', value: '150' },
        supply: [
          { '@type': 'HowToSupply', name: 'Bunnplate 200 × 200 mm, 1 stk' },
          { '@type': 'HowToSupply', name: 'Kantlister 25 × 200 mm, 4 stk' },
          { '@type': 'HowToSupply', name: 'Sidevegger 120 × 140 mm, 2 stk' },
          { '@type': 'HowToSupply', name: 'Front- og bakvegg 120 × 160 mm, 2 stk' },
          { '@type': 'HowToSupply', name: 'Takplater 140 × 160 mm, 2 stk' },
          { '@type': 'HowToSupply', name: 'Sittepinne Ø16 × 50 mm rundstav, 1 stk' },
          { '@type': 'HowToSupply', name: 'Utelim (D4)' },
          { '@type': 'HowToSupply', name: 'Rustfrie eller varmgalvaniserte skruer eller spiker' },
        ],
        tool: [
          { '@type': 'HowToTool', name: 'Kapp- eller gjærsag' },
          { '@type': 'HowToTool', name: 'Drill/skrutrekker med 16 mm bor og hullsag ca. 32 mm' },
          { '@type': 'HowToTool', name: 'Tommestokk, blyant og vinkelhake' },
          { '@type': 'HowToTool', name: 'Tvinger' },
          { '@type': 'HowToTool', name: 'Slipepapir' },
        ],
        step: [
          {
            '@type': 'HowToStep',
            name: 'Kapp alle delene',
            text: 'Kapp alle delene etter materiallista. Sag 45° på begge topphjørner av front- og bakveggen så de danner et saltak.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Lag innflygningshull og sittepinne',
            text: 'Bor et innflygningshull i frontveggen med hullsag, og bor et Ø16 mm hull litt under til sittepinnen.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Bygg bunnbrettet',
            text: 'Fest de fire kantlistene rundt bunnplata så du får et brett med lav kant.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Reis veggene',
            text: 'Lim og skru sideveggene mellom front- og bakveggen til en kasse, og sentrer kassa på bunnbrettet.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Monter taket',
            text: 'Fest de to takplatene i møne så den ene overlapper den andre, og monter eventuelle dekorlister langs takfoten.',
            url: `${pageUrl}#slik-bygger-du`,
          },
          {
            '@type': 'HowToStep',
            name: 'Lim inn sittepinnen',
            text: 'Lim rundstaven inn i hullet under innflygningshullet.',
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
            name: 'Fuglehus',
            item: pageUrl,
          },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: 'nb-NO',
        mainEntity: FAQ.map(({ q, a }) => ({
          '@type': 'Question',
          name: q,
          acceptedAnswer: { '@type': 'Answer', text: a },
        })),
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
                Fuglehus
              </Breadcrumb>
              <Eyebrow>Prosjekt</Eyebrow>
              <Title>Fuglehus</Title>
              <Lead>
                Slik bygger du et klassisk fuglehus med saltak, innflygningshull og sittepinne, satt
                på et bunnbrett med lav kant. Under finner du komplett materialliste med mål og
                fremgangsmåte steg for steg – et lite, overkommelig prosjekt du bygger på en
                ettermiddag, og en fin start for både nye snekkere og barn som vil være med.
              </Lead>
              <FactsBar>
                <div>
                  <dt>Vanskelighetsgrad</dt>
                  <dd>Nybegynner</dd>
                </div>
                <div>
                  <dt>Tid</dt>
                  <dd>2–3 timer*</dd>
                </div>
                <div>
                  <dt>Bunnbrett</dt>
                  <dd>20 × 20 cm</dd>
                </div>
                <div>
                  <dt>Materiale</dt>
                  <dd>Ubehandlet tre</dd>
                </div>
              </FactsBar>
            </Container>
          </Header>

          <Body>
            <Container>
              <Figure>
                <HeroImg
                  src="/images/byggeguider/fuglehus.webp"
                  alt="3D-tegning av ferdig fuglehus med saltak, innflygningshull og sittepinne på et bunnbrett"
                />
                <figcaption>Slik ser det ferdige fuglehuset ut.</figcaption>
              </Figure>

              <Section>
                <h2>Hva du bygger</h2>
                <P>
                  Fuglehuset består av fire vegger som danner en liten kasse, et saltak av to plater
                  som møtes i mønet, og et bunnbrett med lav kant rundt. Front- og bakveggen er kappet
                  med 45° på begge topphjørner, slik at de danner gavlene taket hviler på. I fronten
                  sitter et rundt innflygningshull med en sittepinne like under. Alt limes og skrus
                  (eller spikres) sammen.
                </P>
                <Callout variant="warn" title="Bruk ubehandlet tre">
                  Bygg fuglehuset i ubehandlet tre – ikke trykk- eller royalimpregnert. Impregnering
                  inneholder stoffer som ikke hører hjemme der fugler hekker. Vil du behandle det,
                  bruk en miljøvennlig, dyrevennlig olje eller beis kun på utsiden – aldri inni.
                </Callout>
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
                  Delene kappes fra ubehandlet bord i ca. 15–18 mm tykkelse. Målene under er bredde ×
                  lengde. Front- og bakveggen sages 45° på begge topphjørner så de danner gavlspiss.
                </P>
                <DataTable>
                  <caption>Deler (mål: bredde × lengde i mm)</caption>
                  <thead>
                    <tr>
                      <th>Del</th>
                      <th>Antall</th>
                      <th>Mål (mm)</th>
                      <th>Kommentar</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Bunnplate</td>
                      <td>1</td>
                      <td>200 × 200</td>
                      <td>Bunn til brett</td>
                    </tr>
                    <tr>
                      <td>Kantlister</td>
                      <td>4</td>
                      <td>25 × 200</td>
                      <td>Ramme rundt brettet</td>
                    </tr>
                    <tr>
                      <td>Sidevegger</td>
                      <td>2</td>
                      <td>120 × 140</td>
                      <td>Rektangulære</td>
                    </tr>
                    <tr>
                      <td>Frontvegg</td>
                      <td>1</td>
                      <td>120 × 160</td>
                      <td>45° kutt på begge topphjørner</td>
                    </tr>
                    <tr>
                      <td>Bakvegg</td>
                      <td>1</td>
                      <td>120 × 160</td>
                      <td>45° kutt på begge topphjørner</td>
                    </tr>
                    <tr>
                      <td>Takplate venstre</td>
                      <td>1</td>
                      <td>140 × 160</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Takplate høyre</td>
                      <td>1</td>
                      <td>140 × 160</td>
                      <td></td>
                    </tr>
                    <tr>
                      <td>Dekorlist tak</td>
                      <td>2</td>
                      <td>10 × 120</td>
                      <td>Valgfritt</td>
                    </tr>
                    <tr>
                      <td>Sittepinne</td>
                      <td>1</td>
                      <td>Ø16 × 50</td>
                      <td>Rundstav</td>
                    </tr>
                  </tbody>
                </DataTable>
                <Callout variant="tip" title="I tillegg trenger du">
                  Utelim (D4), rustfrie eller varmgalvaniserte skruer eller spiker, og eventuelt en
                  dyrevennlig olje eller beis til utsiden.
                </Callout>
              </Section>

              <Section>
                <h2>Verktøy</h2>
                <P>Du klarer deg med grunnutstyret – i tillegg trenger du en hullsag til innflygningshullet:</P>
                <Ul>
                  <li>Kapp- eller gjærsag (for 45° kutt på gavlene)</li>
                  <li>Drill/skrutrekker med hullsag (ca. 32 mm) og 16 mm bor til sittepinnen</li>
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
                    <strong>Kapp alle delene</strong> etter materiallista. Sag 45° på begge
                    topphjørner av front- og bakveggen så de danner gavlspissen taket skal hvile på.
                  </li>
                  <li>
                    <strong>Lag innflygningshull og sittepinne</strong>. Bor innflygningshullet i
                    frontveggen med hullsag, og bor et Ø16 mm hull et lite stykke under til
                    sittepinnen. Slip kantene glatte.
                  </li>
                  <li>
                    <strong>Bygg bunnbrettet</strong>. Fest de fire kantlistene rundt bunnplata så du
                    får et brett med en lav kant hele veien rundt.
                  </li>
                  <li>
                    <strong>Reis veggene</strong>. Lim og skru sideveggene mellom front- og
                    bakveggen til en firkantet kasse. Kontroller at den er i vinkel, og sentrer kassa
                    på bunnbrettet før du fester den nedenfra.
                  </li>
                  <li>
                    <strong>Monter taket</strong>. Fest de to takplatene i mønet slik at den ene
                    overlapper den andre på toppen. Vil du ha det ekstra fint, fest de valgfrie
                    dekorlistene langs takfoten.
                  </li>
                  <li>
                    <strong>Lim inn sittepinnen</strong> i hullet under innflygningshullet.
                  </li>
                </Ol>
                <H3>Tips underveis</H3>
                <P>
                  Forbor nær endene så tynt bord ikke sprekker, og tørrmonter gjerne kassa før du
                  limer. Lag et lite mellomrom eller noen luftehull høyt oppe på veggene for
                  ventilasjon, og et par dreneringshull i bunnen så regn renner ut.
                </P>
              </Section>

              <Section>
                <h2>Overflatebehandling</h2>
                <P>
                  Et fuglehus kan gjerne stå ubehandlet – da holder det seg trygt for fuglene og
                  gråner naturlig. Vil du beskytte det, bruk en dyrevennlig olje eller beis{' '}
                  <strong>kun på utsiden</strong>, og la det lufte godt før huset tas i bruk. Se
                  guiden om <Link to="/byggeguider/overflatebehandling">overflatebehandling</Link> for
                  valg og påføring.
                </P>
                <P>
                  <small>* Tid og mål er anslag og justeres når detaljene er bekreftet.</small>
                </P>
              </Section>

              <Section>
                <h2>Ofte stilte spørsmål</h2>
                {FAQ.map(({ q, a }) => (
                  <div key={q}>
                    <H3>{q}</H3>
                    <P>{a}</P>
                  </div>
                ))}
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
