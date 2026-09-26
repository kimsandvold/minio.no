import { useState } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'
import { opprettProsjektIde } from '../../../services/prosjektIdeService'

const SITE_URL = 'https://minio.no'

const PROSJEKTTYPER = [
  'Terrasse eller platting',
  'Pergola',
  'Levegg',
  'Bod eller skjul',
  'Utekjøkken',
  'Carport',
  'Noe annet',
]

const HJELP = [
  {
    ikon: 'faLightbulb',
    tittel: 'Kom i gang',
    tekst: 'Hvor starter man? Jeg hjelper deg å gjøre idéen konkret: plassering, størrelse og hva som er lurt å tenke på først.',
  },
  {
    ikon: 'faClipboardList',
    tittel: 'Kostnad og materialer',
    tekst: 'Et ærlig anslag på hva prosjektet vil koste i materialer, og hvilke verktøy du faktisk trenger – ikke mer.',
  },
  {
    ikon: 'faPencilRuler',
    tittel: 'Tegninger og 3D-modell',
    tekst: 'Trenger du tegninger, kan jeg lage målsatte tegninger og 3D-modell av prosjektet ditt – eller vise deg de gratis planleggerne.',
  },
  {
    ikon: 'faComments',
    tittel: 'Råd underveis',
    tekst: 'Fundament, bæring, festemidler – de kritiske detaljene. Spør så mye du vil, så svarer jeg så godt jeg kan.',
  },
]

const STEG = [
  {
    ikon: 'faPaperPlane',
    tittel: '1. Fortell om idéen din',
    tekst: 'Skriv noen setninger i skjemaet under. Det trenger ikke være gjennomtenkt – «en platting utenfor soveromsdøra» holder lenge.',
  },
  {
    ikon: 'faEnvelope',
    tittel: '2. Du får et personlig svar',
    tekst: 'Jeg leser idéen din og svarer deg på e-post – et ekte svar fra et menneske, som regel i løpet av et par dager.',
  },
  {
    ikon: 'faComments',
    tittel: '3. Vi tar det videre i ditt tempo',
    tekst: 'Kanskje holder svaret. Kanskje vil du ha tegninger, materialliste eller hjelp. Det bestemmer du – når du vil.',
  },
]

const FAQ = [
  {
    q: 'Hva koster det å spørre?',
    a: 'Ingenting. Å fortelle om prosjektet og få et svar er gratis og helt uforpliktende. Vil du senere ha tegninger, byggeplan eller praktisk hjelp, avtaler vi det tydelig – med pris – før noe koster noe.',
  },
  {
    q: 'Må jeg ha mål eller tegninger klare?',
    a: 'Nei. En løs idé er nok. Har du mål, bilder eller en skisse, blir svaret mer presist – men det kan vi like gjerne finne ut av sammen.',
  },
  {
    q: 'Må jeg opprette en konto?',
    a: 'Nei. Du trenger bare å oppgi en e-postadresse, så jeg har et sted å svare deg. Adressen brukes ikke til noe annet.',
  },
]

const JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${SITE_URL}/prosjekthjelp#service`,
    name: 'Prosjekthjelp for uteprosjekter',
    serviceType: 'Gratis rådgivning og prosjekthjelp for uteprosjekter i tre',
    description:
      'Fortell om uteprosjektet ditt – terrasse, pergola, levegg eller noe annet – og få et gratis, personlig svar om kostnad, materialer og hvordan du kommer i gang.',
    url: `${SITE_URL}/prosjekthjelp`,
    areaServed: { '@type': 'Country', name: 'Norge' },
    provider: { '@type': 'Organization', name: 'Minio', url: `${SITE_URL}/` },
    inLanguage: 'nb-NO',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'NOK' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: 'nb-NO',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
      { '@type': 'ListItem', position: 2, name: 'Prosjekthjelp', item: `${SITE_URL}/prosjekthjelp` },
    ],
  },
]

type SkjemaStatus = 'idle' | 'sender' | 'sendt' | 'feil'

export default function ProsjekthjelpPage() {
  const [prosjektType, setProsjektType] = useState('')
  const [melding, setMelding] = useState('')
  const [navn, setNavn] = useState('')
  const [epost, setEpost] = useState('')
  const [sted, setSted] = useState('')
  // Honningkrukke mot skjema-boter: skjult felt som mennesker aldri fyller ut.
  const [nettside, setNettside] = useState('')
  const [status, setStatus] = useState<SkjemaStatus>('idle')
  const [feilmelding, setFeilmelding] = useState('')

  useSEO({
    title: 'Prosjekthjelp – fortell om uteprosjektet ditt | Minio',
    description:
      'Fortell om uteprosjektet ditt – gratis og uforpliktende. Få et personlig svar på e-post om kostnad, materialer, tegninger og hvordan du kommer i gang.',
    keywords:
      'prosjekthjelp, hjelp til uteprosjekt, bygge terrasse hjelp, hva koster terrasse, komme i gang med byggeprosjekt, gratis byggerådgivning',
    jsonLd: JSONLD,
  })

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nettside) return // bot
    if (melding.trim().length < 10) {
      setFeilmelding('Fortell litt mer om idéen din – noen setninger holder.')
      return
    }
    setFeilmelding('')
    setStatus('sender')
    try {
      await opprettProsjektIde({
        navn: navn.trim(),
        epost: epost.trim(),
        sted: sted.trim(),
        prosjektType,
        melding: melding.trim(),
      })
      setStatus('sendt')
    } catch {
      setStatus('feil')
    }
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Hero>
            <h1>Har du en idé til et uteprosjekt?</h1>
            <p>
              Fortell meg om den – helt gratis og uforpliktende. Du får et personlig svar på
              e-post om hvordan du kommer i gang, hva det kan koste og hva du trenger.
            </p>
          </Hero>

          <Intro>
            <IntroInner>
              <h2>Du trenger ikke vite hvor du skal starte</h2>
              <p>
                Kanskje drømmer du om en platting utenfor soveromsdøra, en levegg mot naboen
                eller en pergola over uteplassen – men vet ikke hva det vil koste, hvilke
                materialer du trenger, eller om du klarer det selv. <strong>Det er akkurat der
                de fleste prosjekter stopper.</strong>
              </p>
              <p>
                Derfor er terskelen her så lav som den kan bli: skriv noen setninger om idéen
                din, så svarer jeg deg personlig. Ingen konto, ingen forpliktelser, ingen
                selgere – bare et ærlig svar fra en som bygger i tre til daglig.
              </p>
            </IntroInner>
          </Intro>

          <SkjemaSeksjon id="skjema">
            <SkjemaInner>
              {status === 'sendt' ? (
                <Kvittering>
                  <Icon name="faCheckCircle" />
                  <h2>Takk, {navn.trim().split(' ')[0] || 'du'}!</h2>
                  <p>
                    Idéen din er sendt. Jeg leser den og svarer deg personlig på{' '}
                    <strong>{epost.trim()}</strong> – som regel i løpet av et par dager.
                  </p>
                  <p>
                    I mellomtiden kan du kikke på de gratis{' '}
                    <Link to="/byggeguider">byggeguidene</Link> eller prøve{' '}
                    <Link to="/designverktoy">designverktøyet i 3D</Link>.
                  </p>
                </Kvittering>
              ) : (
                <>
                  <SkjemaHode>
                    <h2>Fortell om prosjektet ditt</h2>
                    <p>Gratis og uforpliktende. Feltene merket med * er obligatoriske.</p>
                  </SkjemaHode>
                  <form onSubmit={submit}>
                    <Felt>
                      <label>Hva slags prosjekt er det?</label>
                      <Chips role="group" aria-label="Prosjekttype">
                        {PROSJEKTTYPER.map((t) => (
                          <Chip
                            key={t}
                            type="button"
                            $valgt={prosjektType === t}
                            onClick={() => setProsjektType(prosjektType === t ? '' : t)}
                            aria-pressed={prosjektType === t}
                          >
                            {t}
                          </Chip>
                        ))}
                      </Chips>
                    </Felt>

                    <Felt>
                      <label htmlFor="ph-melding">Fortell om idéen din *</label>
                      <textarea
                        id="ph-melding"
                        required
                        rows={6}
                        maxLength={4000}
                        value={melding}
                        onChange={(e) => setMelding(e.target.value)}
                        placeholder="F.eks.: «Jeg vil lage en liten platting utenfor soveromsdøra, kanskje 3 × 4 meter. Vet ikke hvor jeg skal begynne, hva det koster eller hvilke verktøy jeg trenger …»"
                      />
                    </Felt>

                    <ToKolonner>
                      <Felt>
                        <label htmlFor="ph-navn">Navn *</label>
                        <input
                          id="ph-navn"
                          required
                          maxLength={120}
                          value={navn}
                          onChange={(e) => setNavn(e.target.value)}
                          autoComplete="name"
                        />
                      </Felt>
                      <Felt>
                        <label htmlFor="ph-epost">E-post *</label>
                        <input
                          id="ph-epost"
                          type="email"
                          required
                          maxLength={200}
                          value={epost}
                          onChange={(e) => setEpost(e.target.value)}
                          autoComplete="email"
                        />
                      </Felt>
                    </ToKolonner>

                    <Felt>
                      <label htmlFor="ph-sted">Hvor i landet? <span>(valgfritt – aktuelt hvis du vil ha hjelp på stedet)</span></label>
                      <input
                        id="ph-sted"
                        maxLength={120}
                        value={sted}
                        onChange={(e) => setSted(e.target.value)}
                        placeholder="F.eks. Lillehammer"
                      />
                    </Felt>

                    {/* Honningkrukke – skjult for mennesker, boter fyller den ut. */}
                    <Honning aria-hidden="true">
                      <label htmlFor="ph-nettside">Nettside</label>
                      <input
                        id="ph-nettside"
                        tabIndex={-1}
                        autoComplete="off"
                        value={nettside}
                        onChange={(e) => setNettside(e.target.value)}
                      />
                    </Honning>

                    {feilmelding && <Feil role="alert">{feilmelding}</Feil>}
                    {status === 'feil' && (
                      <Feil role="alert">
                        Noe gikk galt ved innsending. Prøv igjen – eller send idéen via{' '}
                        <Link to="/kontakt">kontaktskjemaet</Link>.
                      </Feil>
                    )}

                    <SendKnapp type="submit" disabled={status === 'sender'}>
                      {status === 'sender'
                        ? <><Icon name="faSpinner" spin /> Sender …</>
                        : <><Icon name="faPaperPlane" /> Send idéen min</>}
                    </SendKnapp>
                    <PersonvernNote>
                      E-postadressen brukes bare til å svare deg – ikke til nyhetsbrev eller
                      markedsføring. Se <Link to="/personvern">personvernerklæringen</Link>.
                    </PersonvernNote>
                  </form>
                </>
              )}
            </SkjemaInner>
          </SkjemaSeksjon>

          <HjelpSeksjon>
            <HjelpInner>
              <h2>Dette kan du få hjelp til</h2>
              <HjelpGrid>
                {HJELP.map((h) => (
                  <HjelpKort key={h.tittel}>
                    <div className="ikon"><Icon name={h.ikon} /></div>
                    <h3>{h.tittel}</h3>
                    <p>{h.tekst}</p>
                  </HjelpKort>
                ))}
              </HjelpGrid>
            </HjelpInner>
          </HjelpSeksjon>

          <Steps>
            <StepsInner>
              <h2>Slik foregår det</h2>
              <StepGrid>
                {STEG.map((s) => (
                  <Step key={s.tittel}>
                    <Icon name={s.ikon} />
                    <strong>{s.tittel}</strong>
                    <span>{s.tekst}</span>
                  </Step>
                ))}
              </StepGrid>
            </StepsInner>
          </Steps>

          <FaqSeksjon>
            <FaqInner>
              <h2>Vanlige spørsmål</h2>
              {FAQ.map((f) => (
                <details key={f.q}>
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
              <CrossNote>
                Vil du utforske på egen hånd først? Prøv de gratis{' '}
                <Link to="/planleggere">planleggerne</Link>, tegn prosjektet i{' '}
                <Link to="/designverktoy">designverktøyet i 3D</Link>, eller les{' '}
                <Link to="/byggeguider">byggeguidene</Link>.
              </CrossNote>
            </FaqInner>
          </FaqSeksjon>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
    </>
  )
}

const Hero = styled.section`
  position: relative;
  overflow: hidden;
  ${blueprintGrid}
  color: ${({ theme }) => theme.colors.textLight};
  text-align: center;
  padding: 6rem 2rem 3rem;

  &::after {
    ${blueprintGridVignette}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 5rem 1rem 2rem;
  }

  h1 {
    position: relative;
    z-index: 1;
    font-size: 2.6rem;
    margin: 0 0 1rem;
    font-weight: 700;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.8rem;
    }
  }

  p {
    position: relative;
    z-index: 1;
    font-size: 1.15rem;
    max-width: 680px;
    margin: 0 auto;
    color: rgba(255, 255, 255, 0.82);
    line-height: 1.6;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1rem;
    }
  }
`

const Intro = styled.section`
  background: #fff;
  padding: 4rem 2rem 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem 0.5rem;
  }
`

const IntroInner = styled.div`
  max-width: 820px;
  margin: 0 auto;

  h2 {
    font-size: 1.85rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 1.25rem;

    @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
      font-size: 1.5rem;
    }
  }

  p {
    font-size: 1.08rem;
    line-height: 1.75;
    color: #3f3f3f;
    margin: 0 0 1.1rem;
  }

  strong {
    color: ${({ theme }) => theme.colors.textDark};
  }
`

const SkjemaSeksjon = styled.section`
  background: #fff;
  padding: 2rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1rem 2rem;
  }
`

const SkjemaInner = styled.div`
  max-width: 720px;
  margin: 0 auto;
  background: ${({ theme }) => theme.colors.lightBg};
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 2.25rem;
  box-shadow: 0 4px 20px rgba(60, 42, 28, 0.04);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem 1.1rem;
  }
`

const SkjemaHode = styled.div`
  margin-bottom: 1.5rem;

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.4rem;
  }

  p {
    font-size: 0.92rem;
    color: #6b6157;
    margin: 0;
  }
`

const Felt = styled.div`
  margin-bottom: 1.2rem;

  label {
    display: block;
    font-size: 0.92rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.45rem;

    span {
      font-weight: 400;
      color: #6b6157;
    }
  }

  input,
  textarea {
    width: 100%;
    font: inherit;
    font-size: 0.98rem;
    color: ${({ theme }) => theme.colors.textDark};
    background: #fff;
    border: 1px solid #ddd6cf;
    border-radius: 10px;
    padding: 0.75rem 0.9rem;
    transition: border-color 0.15s ease;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accent};
    }
  }

  textarea {
    resize: vertical;
    line-height: 1.6;
  }
`

const ToKolonner = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`

const Chip = styled.button<{ $valgt: boolean }>`
  font: inherit;
  font-size: 0.88rem;
  font-weight: 500;
  padding: 0.45rem 0.95rem;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  border: 1px solid ${({ $valgt, theme }) => ($valgt ? theme.colors.accent : '#ddd6cf')};
  background: ${({ $valgt, theme }) => ($valgt ? theme.colors.accent : '#fff')};
  color: ${({ $valgt, theme }) => ($valgt ? '#fff' : theme.colors.textDark)};
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.accent};
  }
`

const Honning = styled.div`
  position: absolute;
  left: -9999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
`

const Feil = styled.p`
  font-size: 0.92rem;
  color: #a8352c;
  margin: 0 0 1rem;

  a {
    color: inherit;
    font-weight: 600;
  }
`

const SendKnapp = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  font: inherit;
  font-size: 1rem;
  font-weight: 600;
  background: ${({ theme }) => theme.colors.textDark};
  color: #fff;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.pill};
  padding: 0.95rem 1.5rem;
  cursor: pointer;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    background: ${({ theme }) => theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.7;
    cursor: default;
  }
`

const PersonvernNote = styled.p`
  font-size: 0.82rem;
  color: #6b6157;
  line-height: 1.55;
  margin: 0.9rem 0 0;
  text-align: center;

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
`

const Kvittering = styled.div`
  text-align: center;
  padding: 1.5rem 0.5rem;

  svg {
    font-size: 2.4rem;
    color: ${({ theme }) => theme.colors.accent};
    margin-bottom: 1rem;
  }

  h2 {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.75rem;
  }

  p {
    font-size: 1rem;
    line-height: 1.65;
    color: #3f3f3f;
    max-width: 46ch;
    margin: 0 auto 0.9rem;
  }

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
  }
`

const HjelpSeksjon = styled.section`
  background: #fff;
  padding: 1.5rem 2rem 3rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1rem 1rem 2rem;
  }
`

const HjelpInner = styled.div`
  max-width: 1000px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.6rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 2rem;
  }
`

const HjelpGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1.25rem;
`

const HjelpKort = styled.div`
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 16px;
  padding: 1.6rem;
  box-shadow: 0 4px 20px rgba(60, 42, 28, 0.04);

  .ikon {
    font-size: 1.4rem;
    color: ${({ theme }) => theme.colors.textDark};
    opacity: 0.7;
    margin-bottom: 0.75rem;
  }

  h3 {
    font-size: 1.08rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 0.5rem;
  }

  p {
    font-size: 0.92rem;
    line-height: 1.6;
    color: #5a5249;
    margin: 0;
  }
`

const Steps = styled.section`
  background: ${({ theme }) => theme.colors.lightBg};
  padding: 3.5rem 2rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem;
  }
`

const StepsInner = styled.div`
  max-width: 1000px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.6rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 2rem;
  }
`

const StepGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`

const Step = styled.div`
  text-align: center;

  svg {
    font-size: 1.5rem;
    color: ${({ theme }) => theme.colors.textDark};
    opacity: 0.7;
    margin-bottom: 0.75rem;
  }

  strong {
    display: block;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.textDark};
    margin-bottom: 0.35rem;
  }

  span {
    font-size: 0.92rem;
    color: #6b6157;
    line-height: 1.55;
  }
`

const FaqSeksjon = styled.section`
  background: #fff;
  padding: 3.5rem 2rem 4rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 2.5rem 1rem 3rem;
  }
`

const FaqInner = styled.div`
  max-width: 720px;
  margin: 0 auto;

  h2 {
    text-align: center;
    font-size: 1.6rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textDark};
    margin: 0 0 1.75rem;
  }

  details {
    border: 1px solid #ececec;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
    background: #fff;

    summary {
      font-weight: 600;
      color: ${({ theme }) => theme.colors.textDark};
      cursor: pointer;
    }

    p {
      font-size: 0.95rem;
      line-height: 1.65;
      color: #5a5249;
      margin: 0.75rem 0 0;
    }
  }
`

const CrossNote = styled.p`
  margin: 2rem auto 0;
  text-align: center;
  font-size: 1rem;
  color: #5a5249;
  line-height: 1.6;

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
`
