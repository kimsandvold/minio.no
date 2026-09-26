import { useId, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { MINIO_PUBLISHER } from '../../../utils/seo'
import { company } from '../../../data/company'
import ContactForm from '../../sections/Contact/ContactForm'
import Leveringskart from '../../shared/Leveringskart/Leveringskart'
import { Eyebrow, Reveal, Seksjon, SideHode, Tittel, Wrap } from '../../editorial'

const SITE_URL = 'https://minio.no'

const FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61576010648640&locale=nb_NO'
const INSTAGRAM_URL = 'https://www.instagram.com/minio2624'

const VEIER = [
  {
    ikon: 'faLightbulb',
    tittel: 'Har du en prosjektidé?',
    tekst: 'Terrasse, pergola, carport eller noe helt eget – få prisanslag på tre trykk og et personlig svar.',
    til: '/prosjekthjelp',
    cta: 'Få prisanslag',
  },
  {
    ikon: 'faCube',
    tittel: 'Vil du tegne selv?',
    tekst: 'Tegn prosjektet i 3D med dine mål og få materialliste og byggeplan.',
    til: '/designverktoy',
    cta: 'Åpne designverktøyet',
  },
]

const FAQ = [
  {
    q: 'Hvor lang er leveringstiden?',
    a: 'Leveringstiden varierer avhengig av produkt og ordremengde, men normalt leverer vi innen 2–4 uker etter bekreftet bestilling.',
  },
  {
    q: 'Leverer dere utenfor Lillehammer-området?',
    a: 'Vi leverer inntil 200 km fra Lillehammer. For lengre avstander kan vi avtale frakt via transportør – ta kontakt for et tilbud.',
  },
  {
    q: 'Kan jeg velge farge og finish selv?',
    a: 'Ja. Du kan velge mellom ubehandlet, grunnet eller ferdig malt/beiset i ønsket farge.',
  },
  {
    q: 'Hvordan fungerer bestillingsprosessen?',
    a: 'Send oss en melding med dine ønsker og mål. Du får et tilbud, og etter godkjenning betaler du 50 % forskudd før produksjonen starter. Resterende 50 % betales ved ferdigstilling.',
  },
  {
    q: 'Tilbyr dere montering?',
    a: 'Ja, vi tilbyr montering som tilleggstjeneste innenfor leveringsområdet. Pris avhenger av produkt og kompleksitet.',
  },
  {
    q: 'Kan dere bygge terrassen eller carporten min?',
    a: 'Større prosjekter som terrasse, pergola og carport bygger du selv eller med en snekker. I prosjekthjelpen får du prisanslag og et personlig svar – og hjelp til å finne en snekker hvis du trenger det.',
  },
  {
    q: 'Hva om produktet ikke passer?',
    a: 'Siden alle produkter lages etter mål, jobber vi tett med deg gjennom hele prosessen. Du får alltid detaljerte mål og illustrasjoner før produksjon.',
  },
]

const JSONLD = [
  {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE_URL}/kontakt#page`,
    url: `${SITE_URL}/kontakt`,
    name: 'Kontakt Minio',
    inLanguage: 'nb-NO',
    about: {
      ...MINIO_PUBLISHER,
      sameAs: [FACEBOOK_URL.split('&')[0], INSTAGRAM_URL],
    },
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
      { '@type': 'ListItem', position: 2, name: 'Kontakt', item: `${SITE_URL}/kontakt` },
    ],
  },
]

function FaqListe() {
  const [apen, setApen] = useState<number | null>(null)
  const id = useId()

  return (
    <Liste>
      {FAQ.map((item, i) => {
        const erApen = apen === i
        return (
          <Rad key={item.q}>
            <Sporsmal
              type="button"
              aria-expanded={erApen}
              aria-controls={`${id}-${i}`}
              onClick={() => setApen(erApen ? null : i)}
            >
              <span>{item.q}</span>
              <Pluss $apen={erApen} aria-hidden="true" />
            </Sporsmal>
            <Svar id={`${id}-${i}`} $apen={erApen} role="region" aria-hidden={!erApen}>
              <div><p>{item.a}</p></div>
            </Svar>
          </Rad>
        )
      })}
    </Liste>
  )
}

export default function KontaktPage() {
  const [searchParams] = useSearchParams()
  const emne = searchParams.get('subject') ?? undefined

  useSEO({
    title: 'Ta kontakt – Minio',
    description:
      'Kontakt Minio om produkter, bestillinger og levering. Send en melding, så får du et personlig svar på e-post. Levering inntil 200 km fra Lillehammer.',
    jsonLd: JSONLD,
  })

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <SideHode
            eyebrow="Spørsmål og bestilling"
            tittel="Ta kontakt."
            ingress={
              <>
                Spørsmål om et produkt, en bestilling eller levering? Send en melding, så får du et
                personlig svar på e-post – helt uforpliktende.
              </>
            }
          />

          <SkjemaSeksjon>
            <Wrap>
              <Oppsett>
                <Reveal>
                  <SkjemaKort>
                    <ContactForm emne={emne} />
                  </SkjemaKort>
                </Reveal>

                <Reveal forsinkelse={120}>
                  <Info aria-label="Andre veier og kontaktinformasjon">
                    <Eyebrow>Finn riktig vei</Eyebrow>
                    <Veier>
                      {VEIER.map((v) => (
                        <Vei key={v.til} to={v.til}>
                          <VeiIkon><Icon name={v.ikon} /></VeiIkon>
                          <div>
                            <h3>{v.tittel}</h3>
                            <p>{v.tekst}</p>
                            <VeiCta>
                              {v.cta} <Icon name="faArrowRight" />
                            </VeiCta>
                          </div>
                        </Vei>
                      ))}
                    </Veier>

                    <Fakta>
                      <div>
                        <dt>Levering</dt>
                        <dd>Produkter leveres inntil 200 km fra Lillehammer.</dd>
                      </div>
                      <div>
                        <dt>Foretak</dt>
                        <dd>{company.brand} · org.nr {company.orgNr}</dd>
                      </div>
                      <div>
                        <dt>Følg oss</dt>
                        <dd>
                          <Sosiale>
                            <Sosial
                              href={FACEBOOK_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              $platform="facebook"
                              aria-label="Minio på Facebook (åpnes i nytt vindu)"
                            >
                              <span><Icon name="faFacebookF" /></span> Facebook
                            </Sosial>
                            <Sosial
                              href={INSTAGRAM_URL}
                              target="_blank"
                              rel="noopener noreferrer"
                              $platform="instagram"
                              aria-label="Minio på Instagram (åpnes i nytt vindu)"
                            >
                              <span><Icon name="faInstagram" /></span> Instagram
                            </Sosial>
                          </Sosiale>
                        </dd>
                      </div>
                    </Fakta>
                  </Info>
                </Reveal>
              </Oppsett>
            </Wrap>
          </SkjemaSeksjon>

          <Seksjon $flate="surface">
            <Wrap>
              <Reveal>
                <Leveringskart />
              </Reveal>
            </Wrap>
          </Seksjon>

          <Seksjon>
            <Wrap>
              <FaqOppsett>
                <Reveal>
                  <FaqHode>
                    <Eyebrow>Vanlige spørsmål</Eyebrow>
                    <Tittel>Kort fortalt.</Tittel>
                    <p>
                      Finner du ikke svaret? <a href="#contactName" onClick={tilSkjema}>Send oss en melding</a>.
                    </p>
                  </FaqHode>
                </Reveal>
                <Reveal forsinkelse={100}>
                  <FaqListe />
                </Reveal>
              </FaqOppsett>
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

/** Ruller til skjemaet og setter fokus i første felt. */
function tilSkjema(e: React.MouseEvent) {
  e.preventDefault()
  const felt = document.getElementById('contactName')
  if (!felt) return
  const redusert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  felt.scrollIntoView({ behavior: redusert ? 'auto' : 'smooth', block: 'center' })
  felt.focus({ preventScroll: true })
}

/* ---------- Oppsett ---------- */

/** Skjemaet skal ligge tett under headeren – mindre luft over enn en vanlig seksjon. */
const SkjemaSeksjon = styled(Seksjon)`
  padding-top: clamp(2.5rem, 5vw, 4.5rem);
`

const Oppsett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  gap: clamp(2.5rem, 5vw, 5rem);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const SkjemaKort = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 24px;
  padding: clamp(1.25rem, 3.5vw, 2.5rem);
  box-shadow: ${({ theme }) => theme.shadows.sm};
`

/* ---------- Infokolonne ---------- */

const Info = styled.aside`
  @media (min-width: 961px) {
    position: sticky;
    top: 6.5rem;
  }
`

const Veier = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`

const Vei = styled(Link)`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  padding: 1.35rem 1.4rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.sunken};
  color: inherit;
  text-decoration: none;
  transition: transform ${({ theme }) => theme.transitions.soft}, box-shadow ${({ theme }) => theme.transitions.soft},
    background ${({ theme }) => theme.transitions.soft};

  h3 {
    margin: 0.1rem 0 0.35rem;
    font-size: 1.15rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0 0 0.8rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  &:hover {
    background: ${({ theme }) => theme.colors.surface};
    transform: translateY(-3px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &:hover svg:last-child {
    transform: translateX(4px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 3px;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
    }
  }
`

const VeiIkon = styled.span`
  flex: none;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentSoft};
`

const VeiCta = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.accent};

  svg {
    font-size: 0.8em;
    transition: transform ${({ theme }) => theme.transitions.default};
  }
`

const Fakta = styled.dl`
  margin: 2rem 0 0;

  > div {
    display: grid;
    grid-template-columns: 6.5rem minmax(0, 1fr);
    gap: 1rem;
    padding: 1rem 0;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
  }

  dt {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkSubtle};
  }

  dd {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.ink};
  }

  @media (max-width: 380px) {
    > div {
      grid-template-columns: minmax(0, 1fr);
      gap: 0.35rem;
    }
  }
`

const Sosiale = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: -0.3rem;
`

const Sosial = styled.a<{ $platform: 'facebook' | 'instagram' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0 0.95rem 0 0.35rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  font-weight: 500;
  text-decoration: none;
  transition: border-color ${({ theme }) => theme.transitions.default};

  span {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 0.85rem;
    color: #fff;
    background: ${({ theme, $platform }) => ($platform === 'facebook' ? theme.colors.facebook : theme.colors.instagramInk)};
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.ink};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }
`

/* ---------- FAQ ---------- */

const FaqOppsett = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: minmax(0, 1fr);
  }
`

const FaqHode = styled.div`
  > p {
    margin: 1.25rem 0 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    font-size: ${({ theme }) => theme.fontSizes.md};

    a {
      color: ${({ theme }) => theme.colors.accent};
      text-decoration: underline;
      text-underline-offset: 0.18em;
    }
  }

  @media (min-width: 961px) {
    position: sticky;
    top: 6.5rem;
  }
`

const Liste = styled.div`
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`

const Rad = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`

const Sporsmal = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
  padding: 1.4rem 0;
  background: none;
  border: none;
  cursor: pointer;
  font: inherit;
  text-align: left;
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: -0.015em;
  line-height: 1.35;
  color: ${({ theme }) => theme.colors.ink};
  transition: color ${({ theme }) => theme.transitions.default};

  &:hover {
    color: ${({ theme }) => theme.colors.accent};
  }

  &:focus {
    outline: none;
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 4px;
    border-radius: 6px;
  }
`

/** Pluss som roterer til minus. */
const Pluss = styled.span<{ $apen: boolean }>`
  position: relative;
  flex: none;
  width: 14px;
  height: 14px;

  &::before,
  &::after {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 100%;
    height: 1.5px;
    margin-top: -0.75px;
    border-radius: 1px;
    background: currentColor;
    transition: transform ${({ theme }) => theme.transitions.soft};
  }

  &::after {
    transform: rotate(${({ $apen }) => ($apen ? '0deg' : '90deg')});
  }

  @media (prefers-reduced-motion: reduce) {
    &::before,
    &::after {
      transition: none;
    }
  }
`

const Svar = styled.div<{ $apen: boolean }>`
  display: grid;
  grid-template-rows: ${({ $apen }) => ($apen ? '1fr' : '0fr')};
  transition: grid-template-rows ${({ theme }) => theme.transitions.soft};

  > div {
    overflow: hidden;
  }

  p {
    margin: 0;
    padding: 0 2.5rem 1.5rem 0;
    max-width: 62ch;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`
