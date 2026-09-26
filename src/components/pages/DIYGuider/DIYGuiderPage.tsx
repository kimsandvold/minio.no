import { useEffect, useRef, useState, type FormEvent, type MouseEvent, type RefObject } from 'react'
import styled, { css } from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { Eyebrow, Hode, Ingress, Reveal, Seksjon, SideHode, Tittel, Wrap } from '../../editorial'
import {
  guidePhases,
  guideHref,
  guideTopics,
  guideProjects,
  projectHref,
  topicsByPhase,
  topicMatchesQuery,
} from '../../../data/byggeguider'

const SITE_URL = 'https://minio.no'

/** Kort beskrivelse av hver fase – vises over listen. */
const FASE_TEKST: Record<string, string> = {
  planlegg: 'Tegning, regler og søknadsplikt, fundament og materialberegning – før du kjøper noe.',
  velg: 'Trevirke, skruer, beslag og verktøy – hva du trenger, og hvorfor.',
  bygg: 'Måling, kutt og sammenføyninger – og steg for steg for terrasse, pergola, carport og mer.',
  finish: 'Sliping, beis og olje, og vedlikehold som får treverket til å vare.',
}

/** Søkeforslag under søkefeltet. Hvert ord treffer minst én guide. */
const FORSLAG = ['terrasse', 'fundament', 'søknad', 'skrue', 'beis']

const faseId = (key: string) => `fase-${key}`

const TILGJENGELIGE_GUIDER = guideTopics.filter((t) => t.available).length

const reduserBevegelse = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

function rullTil(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: reduserBevegelse() ? 'auto' : 'smooth', block: 'start' })
}

/** Hvilken fase er i bildet nå? Brukes til å markere riktig fane i hoppmenyen. */
function useAktivFase(nokler: string[]) {
  const [aktiv, setAktiv] = useState<string | null>(null)
  const noklerKey = nokler.join('|')

  useEffect(() => {
    const keys = noklerKey ? noklerKey.split('|') : []
    const elementer = keys
      .map((k) => document.getElementById(faseId(k)))
      .filter((el): el is HTMLElement => el !== null)
    if (elementer.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const synlige = entries.filter((e) => e.isIntersecting)
        if (synlige.length === 0) return
        const overst = synlige.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        setAktiv(overst.target.id.replace('fase-', ''))
      },
      { rootMargin: '-35% 0px -55% 0px' },
    )
    elementer.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [noklerKey])

  return aktiv
}

/**
 * Hoppmenyen flyter under navbaren mens man ruller gjennom guidene. (position: sticky
 * virker ikke her fordi body har overflow-x: hidden, så vi viser en fast kopi i stedet.)
 */
function useFlytendeMeny(
  menyRef: RefObject<HTMLElement | null>,
  seksjonRef: RefObject<HTMLElement | null>,
  /** Endres når innholdet endres (f.eks. ved søk), så posisjonen sjekkes på nytt. */
  innhold: string,
) {
  const [synlig, setSynlig] = useState(false)

  useEffect(() => {
    let ramme = 0
    const sjekk = () => {
      ramme = 0
      const meny = menyRef.current
      const seksjon = seksjonRef.current
      if (!meny || !seksjon) {
        setSynlig(false)
        return
      }
      const grense = window.innerWidth <= 768 ? 74 : 90
      const menyTopp = meny.getBoundingClientRect().top
      const seksjonBunn = seksjon.getBoundingClientRect().bottom
      setSynlig(menyTopp < grense && seksjonBunn > grense + 360)
    }
    const planlegg = () => {
      if (!ramme) ramme = window.requestAnimationFrame(sjekk)
    }
    sjekk()
    window.addEventListener('scroll', planlegg, { passive: true })
    window.addEventListener('resize', planlegg)
    return () => {
      window.removeEventListener('scroll', planlegg)
      window.removeEventListener('resize', planlegg)
      if (ramme) window.cancelAnimationFrame(ramme)
    }
  }, [menyRef, seksjonRef, innhold])

  return synlig
}

export default function DIYGuiderPage() {
  useSEO({
    title: 'Byggeguider – bygg det selv | Minio',
    description:
      'Gratis byggeguider for deg som vil bygge selv. Lær planlegging, valg av trevirke og verktøy, byggeteknikk, sliping og overflatebehandling – steg for steg.',
    ogImage: '/images/diy_header.png',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: 'Byggeguider', item: `${SITE_URL}/byggeguider` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        name: 'Byggeguider fra Minio',
        itemListElement: guideTopics.map((t, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          name: t.title,
          url: `${SITE_URL}/byggeguider/${t.slug}`,
        })),
      },
    ],
  })

  const [query, setQuery] = useState('')
  const sokRef = useRef<HTMLInputElement>(null)
  const soker = query.trim().length > 0

  const filteredPhases = guidePhases
    .map((phase) => ({
      phase,
      topics: topicsByPhase(phase.key).filter((t) => topicMatchesQuery(t, query)),
    }))
    .filter((p) => p.topics.length > 0)

  const antallTreff = filteredPhases.reduce((sum, p) => sum + p.topics.length, 0)
  const aktivFase = useAktivFase(filteredPhases.map((p) => p.phase.key))
  const menyRef = useRef<HTMLElement>(null)
  const guiderRef = useRef<HTMLElement>(null)
  const flytende = useFlytendeMeny(menyRef, guiderRef, query)
  const sporRef = useRef<HTMLDivElement>(null)

  // Hold aktiv fane synlig i den flytende menyen på smale skjermer.
  useEffect(() => {
    const spor = sporRef.current
    const fane = spor?.querySelector<HTMLElement>('[aria-current="location"]')
    if (!spor || !fane || spor.scrollWidth <= spor.clientWidth) return
    const venstre = fane.offsetLeft - (spor.clientWidth - fane.offsetWidth) / 2
    spor.scrollTo({ left: Math.max(0, venstre), behavior: reduserBevegelse() ? 'auto' : 'smooth' })
  }, [aktivFase])

  // Direktelenker som /byggeguider#fase-bygg: rull til fasen etter at useSEO har rullet til toppen.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (!id.startsWith('fase-')) return
    const t = window.setTimeout(() => rullTil(id), 60)
    return () => window.clearTimeout(t)
  }, [])

  const hoppTil = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault()
    rullTil(id)
    window.history.replaceState(window.history.state, '', `#${id}`)
  }

  const faner = filteredPhases.map(({ phase, topics }) => (
    <FaseFane
      key={phase.key}
      href={`#${faseId(phase.key)}`}
      onClick={(e) => hoppTil(e, faseId(phase.key))}
      $aktiv={aktivFase === phase.key}
      aria-current={aktivFase === phase.key ? 'location' : undefined}
    >
      {phase.label}
      <small>{topics.length}</small>
    </FaseFane>
  ))

  const visResultater = (e: FormEvent) => {
    e.preventDefault()
    sokRef.current?.blur()
    rullTil('guider-start')
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <SideHode
            eyebrow="Gratis byggeguider"
            tittel="Bygg det selv."
            ingress={
              <>
                {TILGJENGELIGE_GUIDER} guider fra plan til ferdig overflate – med mål, tabeller og
                fremgangsmåte. Gratis og uten innlogging.
              </>
            }
          >
            <SokSkjema role="search" onSubmit={visResultater}>
              <SokFelt>
                <Icon name="faSearch" />
                <input
                  ref={sokRef}
                  type="search"
                  placeholder="Søk i guidene"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Søk i byggeguidene"
                  enterKeyHint="search"
                />
                {soker && (
                  <Tom type="button" onClick={() => { setQuery(''); sokRef.current?.focus() }} aria-label="Tøm søket">
                    <Icon name="faXmark" />
                  </Tom>
                )}
              </SokFelt>
              <SokStatus aria-live="polite">
                {soker ? (
                  <span>
                    {antallTreff === 0 ? 'Ingen treff' : `${antallTreff} ${antallTreff === 1 ? 'guide' : 'guider'}`}
                  </span>
                ) : (
                  <>
                    <span>Populære søk:</span>
                    {FORSLAG.map((f) => (
                      <Forslag key={f} type="button" onClick={() => setQuery(f)}>
                        {f}
                      </Forslag>
                    ))}
                  </>
                )}
              </SokStatus>
            </SokSkjema>
          </SideHode>

          {!soker && guideProjects.length > 0 && (
            <Seksjon>
              <Wrap>
                <Reveal>
                  <Hode>
                    <div>
                      <Eyebrow>Bygg et prosjekt</Eyebrow>
                      <Tittel>Fra start til slutt.</Tittel>
                    </div>
                    <Ingress>
                      Komplette byggeguider med mål, materialliste og fremgangsmåte – små prosjekter
                      du kan bli ferdig med på en dag.
                    </Ingress>
                  </Hode>
                </Reveal>
                <Prosjekter>
                  {guideProjects.map((p, i) => (
                    <Reveal key={p.slug} forsinkelse={i * 80}>
                      {p.available ? (
                        <ProsjektKort to={projectHref(p)}>
                          <ProsjektInnhold prosjekt={p} />
                        </ProsjektKort>
                      ) : (
                        <ProsjektKortSnart>
                          <ProsjektInnhold prosjekt={p} />
                        </ProsjektKortSnart>
                      )}
                    </Reveal>
                  ))}
                </Prosjekter>
              </Wrap>
            </Seksjon>
          )}

          <Seksjon $flate="surface" id="guider" ref={guiderRef}>
            <Wrap>
              <div id="guider-start" />
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>{soker ? 'Søkeresultat' : 'Alle byggeguider'}</Eyebrow>
                    <Tittel>
                      {!soker
                        ? 'Fase for fase.'
                        : antallTreff === 0
                          ? 'Ingen treff.'
                          : `${antallTreff} treff på «${query.trim()}».`}
                    </Tittel>
                  </div>
                  {!soker && (
                    <Ingress>
                      Følg guidene i rekkefølge, eller hopp rett til det du lurer på.
                    </Ingress>
                  )}
                </Hode>
              </Reveal>

              {filteredPhases.length === 0 ? (
                <IngenTreff>
                  <h3>Ingen guider matcher «{query.trim()}»</h3>
                  <p>
                    Prøv et annet ord, eller se alle guidene. Finner du ikke svaret, kan du beskrive
                    prosjektet ditt og få et personlig svar.
                  </p>
                  <IngenTreffHandlinger>
                    <button type="button" onClick={() => setQuery('')}>
                      Vis alle guider
                    </button>
                    <Link to="/prosjekthjelp">
                      Få prosjekthjelp <Icon name="faArrowRight" />
                    </Link>
                  </IngenTreffHandlinger>
                </IngenTreff>
              ) : (
                <>
                  {filteredPhases.length > 1 && (
                    <>
                      <FaseMeny ref={menyRef} aria-label="Hopp til fase">
                        <FaseSpor>{faner}</FaseSpor>
                      </FaseMeny>
                      <FlytendeMeny aria-label="Hopp til fase" aria-hidden={!flytende} $synlig={flytende}>
                        <FaseSpor ref={sporRef} $flytende>{faner}</FaseSpor>
                      </FlytendeMeny>
                    </>
                  )}

                  {filteredPhases.map(({ phase, topics }) => {
                    const nr = guidePhases.findIndex((p) => p.key === phase.key) + 1
                    return (
                      <Fase key={phase.key} id={faseId(phase.key)} aria-labelledby={`${faseId(phase.key)}-tittel`}>
                        <FaseHode>
                          <span className="nr">{String(nr).padStart(2, '0')}</span>
                          <div>
                            <h3 id={`${faseId(phase.key)}-tittel`}>{phase.label}</h3>
                            {!soker && FASE_TEKST[phase.key] && <p>{FASE_TEKST[phase.key]}</p>}
                          </div>
                          <span className="antall">
                            {topics.length} {topics.length === 1 ? 'guide' : 'guider'}
                          </span>
                        </FaseHode>
                        <Liste>
                          {topics.map((topic) => (
                            <li key={topic.slug}>
                              {topic.available ? (
                                <Rad to={guideHref(topic)}>
                                  <RadTekst>
                                    <strong>{topic.title}</strong>
                                    <span>{topic.teaser}</span>
                                  </RadTekst>
                                  <Pil aria-hidden="true">
                                    <Icon name="faArrowRight" />
                                  </Pil>
                                </Rad>
                              ) : (
                                <RadSnart>
                                  <RadTekst>
                                    <strong>{topic.title}</strong>
                                    <span>{topic.teaser}</span>
                                  </RadTekst>
                                  <Snart>Kommer snart</Snart>
                                </RadSnart>
                              )}
                            </li>
                          ))}
                        </Liste>
                      </Fase>
                    )
                  })}
                </>
              )}
            </Wrap>
          </Seksjon>

          <Seksjon>
            <Wrap>
              <Reveal>
                <Eyebrow>Klar til å bygge?</Eyebrow>
                <Tittel>Tegn det selv, eller spør oss.</Tittel>
              </Reveal>
              <Veier>
                <Reveal>
                  <Vei to="/designverktoy">
                    <VeiIkon><Icon name="faCube" /></VeiIkon>
                    <h3>Design i 3D</h3>
                    <p>Tegn terrasse, pergola, carport og mer med dine mål – og få materialliste og byggeplan.</p>
                    <VeiCta>
                      Åpne designverktøyet <Icon name="faArrowRight" />
                    </VeiCta>
                  </Vei>
                </Reveal>
                <Reveal forsinkelse={90}>
                  <Vei to="/prosjekthjelp">
                    <VeiIkon><Icon name="faComments" /></VeiIkon>
                    <h3>Usikker på prosjektet?</h3>
                    <p>
                      Beskriv hva du vil bygge, så får du et personlig svar – og hjelp til å finne en
                      snekker om du trenger det.
                    </p>
                    <VeiCta>
                      Få prosjekthjelp <Icon name="faArrowRight" />
                    </VeiCta>
                  </Vei>
                </Reveal>
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

function ProsjektInnhold({ prosjekt }: { prosjekt: (typeof guideProjects)[number] }) {
  return (
    <>
      <ProsjektBilde>
        {prosjekt.image ? (
          <img src={prosjekt.image} alt={prosjekt.title} loading="lazy" />
        ) : (
          <span>Bilde kommer</span>
        )}
        {!prosjekt.available && <Merke>Kommer snart</Merke>}
      </ProsjektBilde>
      <h3>{prosjekt.title}</h3>
      <p>{prosjekt.teaser}</p>
      <ProsjektMeta>
        <span>{prosjekt.difficulty}</span>
        <span aria-hidden="true">·</span>
        <span>{prosjekt.time}</span>
      </ProsjektMeta>
    </>
  )
}

/* ---------- Søk (i sidehodet) ---------- */

const SokSkjema = styled.form`
  max-width: 680px;
`

const SokFelt = styled.div`
  position: relative;

  > svg {
    position: absolute;
    left: 1.4rem;
    top: 50%;
    transform: translateY(-50%);
    font-size: 1rem;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    pointer-events: none;
  }

  input {
    width: 100%;
    height: 60px;
    padding: 0 3.5rem 0 3.4rem;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.borderInverted};
    background: rgba(255, 255, 255, 0.07);
    color: ${({ theme }) => theme.colors.inkInverted};
    font: inherit;
    font-size: ${({ theme }) => theme.fontSizes.md};
    transition: background ${({ theme }) => theme.transitions.default}, border-color ${({ theme }) => theme.transitions.default};
    -webkit-appearance: none;
    appearance: none;

    &::placeholder {
      color: ${({ theme }) => theme.colors.inkInvertedMuted};
    }

    &::-webkit-search-cancel-button {
      display: none;
    }

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    &:focus {
      outline: none;
      background: rgba(255, 255, 255, 0.12);
      border-color: ${({ theme }) => theme.colors.focusInverted};
      box-shadow: 0 0 0 3px rgba(224, 137, 95, 0.25);
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    input {
      height: 54px;
      font-size: 16px;
    }
  }
`

const Tom = styled.button`
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ theme }) => theme.colors.inkInvertedMuted};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default}, color ${({ theme }) => theme.transitions.default};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: ${({ theme }) => theme.colors.inkInverted};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusInverted};
    outline-offset: 2px;
  }
`

const SokStatus = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  min-height: 34px;
  margin-top: 1rem;
  padding-left: 0.25rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkInvertedMuted};

  > span {
    margin-right: 0.25rem;
  }
`

const Forslag = styled.button`
  min-height: 34px;
  padding: 0 0.9rem;
  border-radius: 999px;
  border: 1px solid ${({ theme }) => theme.colors.borderInverted};
  background: transparent;
  color: ${({ theme }) => theme.colors.inkInverted};
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  cursor: pointer;
  transition: background ${({ theme }) => theme.transitions.default}, border-color ${({ theme }) => theme.transitions.default};

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(250, 247, 242, 0.3);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focusInverted};
    outline-offset: 2px;
  }
`

/* ---------- Prosjekter ---------- */

const Prosjekter = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3rem 1.5rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 2.5rem 1rem;
  }

  @media (max-width: 560px) {
    display: flex;
    gap: 0.9rem;
    margin: 0 -1rem;
    padding: 0 1rem 0.25rem;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    scroll-padding: 0 1rem;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }

    > * {
      flex: 0 0 80%;
      scroll-snap-align: start;
    }
  }
`

const ProsjektBilde = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 20px;
  overflow: hidden;
  background: ${({ theme }) => theme.colors.sunken};
  display: grid;
  place-items: center;
  color: ${({ theme }) => theme.colors.inkSubtle};
  font-size: ${({ theme }) => theme.fontSizes.sm};

  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }
`

const Merke = styled.span`
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
  z-index: 1;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.inkMuted};
`

const prosjektKortStil = css`
  display: block;
  color: inherit;
  text-decoration: none;

  h3 {
    margin: 1.1rem 0 0.35rem;
    font-size: 1.3rem;
    font-weight: 600;
    letter-spacing: -0.025em;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 44ch;
  }
`

const ProsjektKort = styled(Link)`
  ${prosjektKortStil}

  &:hover img {
    transform: scale(1.04);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover img {
      transform: none;
    }
  }
`

const ProsjektKortSnart = styled.div`
  ${prosjektKortStil}
  cursor: default;

  img {
    filter: grayscale(0.4);
    opacity: 0.8;
  }
`

const ProsjektMeta = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkSubtle};
`

/* ---------- Guider per fase ---------- */

const FaseMeny = styled.nav`
  display: flex;
  justify-content: center;
  margin: 0 0 clamp(2.5rem, 5vw, 3.5rem);

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin-left: -1rem;
    margin-right: -1rem;
    justify-content: flex-start;
  }
`

const FlytendeMeny = styled.nav<{ $synlig: boolean }>`
  position: fixed;
  top: 5.85rem;
  left: 0;
  right: 0;
  z-index: ${({ theme }) => theme.zIndex.nav - 1};
  display: flex;
  justify-content: center;
  padding: 0 1rem;
  pointer-events: none;
  opacity: ${({ $synlig }) => ($synlig ? 1 : 0)};
  visibility: ${({ $synlig }) => ($synlig ? 'visible' : 'hidden')};
  transform: translateY(${({ $synlig }) => ($synlig ? '0' : '-10px')});
  transition: opacity ${({ theme }) => theme.transitions.default}, transform ${({ theme }) => theme.transitions.default},
    visibility 0s linear ${({ $synlig }) => ($synlig ? '0s' : '0.22s')};

  > div {
    pointer-events: auto;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    top: 4.9rem;
    padding: 0;
    justify-content: flex-start;
  }

  @media (prefers-reduced-motion: reduce) {
    transform: none;
    transition: none;
  }
`

const FaseSpor = styled.div<{ $flytende?: boolean }>`
  display: flex;
  gap: 0.25rem;
  max-width: 100%;
  padding: 0.3rem;
  border-radius: 999px;
  background: ${({ theme, $flytende }) => ($flytende ? 'rgba(244, 239, 232, 0.86)' : theme.colors.sunken)};
  backdrop-filter: ${({ $flytende }) => ($flytende ? 'blur(18px) saturate(140%)' : 'none')};
  -webkit-backdrop-filter: ${({ $flytende }) => ($flytende ? 'blur(18px) saturate(140%)' : 'none')};
  box-shadow: ${({ theme, $flytende }) => ($flytende ? theme.shadows.md : 'none')};
  overflow-x: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    margin: 0 1rem;
  }
`

const FaseFane = styled.a<{ $aktiv: boolean }>`
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 40px;
  padding: 0 1.1rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  white-space: nowrap;
  text-decoration: none;
  color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.inkInverted : theme.colors.ink)};
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.ink : 'transparent')};
  transition: background ${({ theme }) => theme.transitions.default}, color ${({ theme }) => theme.transitions.default};

  small {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-family: ${({ theme }) => theme.fonts.mono};
    color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.inkInvertedMuted : theme.colors.inkSubtle)};
  }

  &:hover {
    background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.ink : theme.colors.surface)};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 0 0.9rem;
  }
`

const Fase = styled.section`
  /* Legges oppå html sin scroll-padding-top (6rem) – gir plass til navbar + flytende meny. */
  scroll-margin-top: 4rem;

  & + & {
    margin-top: clamp(3.5rem, 7vw, 5.5rem);
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    scroll-margin-top: 3.5rem;
  }
`

const FaseHode = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: baseline;
  gap: 0.5rem 1.25rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.ink};

  .nr {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.accent};
  }

  h3 {
    margin: 0;
    font-size: clamp(1.6rem, 2.6vw, 2.1rem);
    font-weight: 600;
    letter-spacing: -0.035em;
    line-height: 1.1;
  }

  p {
    margin: 0.5rem 0 0;
    max-width: 60ch;
    font-size: ${({ theme }) => theme.fontSizes.base};
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  .antall {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkSubtle};
    white-space: nowrap;
  }

  @media (max-width: 560px) {
    grid-template-columns: auto 1fr;

    .antall {
      grid-column: 2;
    }
  }
`

const Liste = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  column-gap: 2.5rem;

  li {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    min-width: 0;
  }

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    column-gap: 2rem;
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const Pil = styled.span`
  flex: none;
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.inkSubtle};
  transition: background ${({ theme }) => theme.transitions.default}, color ${({ theme }) => theme.transitions.default},
    transform ${({ theme }) => theme.transitions.default};
`

const RadTekst = styled.span`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  strong {
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: 500;
    letter-spacing: -0.015em;
    line-height: 1.3;
    color: ${({ theme }) => theme.colors.ink};
    transition: color ${({ theme }) => theme.transitions.default};
  }

  span {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.45;
    color: ${({ theme }) => theme.colors.inkMuted};
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  @media (max-width: 640px) {
    span {
      -webkit-line-clamp: 1;
    }
  }
`

const radStil = css`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  height: 100%;
  padding: 1.15rem 0;
  color: inherit;
  text-decoration: none;

  @media (max-width: 640px) {
    padding: 0.95rem 0;
  }
`

const Rad = styled(Link)`
  ${radStil}

  &:hover strong {
    color: ${({ theme }) => theme.colors.accent};
  }

  &:hover ${Pil} {
    background: ${({ theme }) => theme.colors.accent};
    color: #fff;
    transform: translateX(3px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 4px;
    border-radius: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover ${Pil} {
      transform: none;
    }
  }
`

const RadSnart = styled.div`
  ${radStil}

  strong {
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Snart = styled.span`
  flex: none;
  padding: 0.25rem 0.6rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  white-space: nowrap;
  color: ${({ theme }) => theme.colors.inkMuted};
  background: ${({ theme }) => theme.colors.sunken};
`

const IngenTreff = styled.div`
  padding: clamp(2rem, 5vw, 3rem);
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.paper};

  h3 {
    margin: 0 0 0.6rem;
    font-size: ${({ theme }) => theme.fontSizes.xl};
    font-weight: 600;
    letter-spacing: -0.025em;
    overflow-wrap: anywhere;
  }

  p {
    margin: 0;
    max-width: 56ch;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.55;
  }
`

const IngenTreffHandlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.5rem;

  button,
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 44px;
    padding: 0 1.25rem;
    border-radius: 999px;
    font: inherit;
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: 500;
    text-decoration: none;
    cursor: pointer;
    transition: background ${({ theme }) => theme.transitions.default};
  }

  button {
    border: 0;
    background: ${({ theme }) => theme.colors.ink};
    color: ${({ theme }) => theme.colors.inkInverted};

    &:hover {
      background: ${({ theme }) => theme.colors.neutral[700]};
    }
  }

  a {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.ink};
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};

    svg {
      font-size: 0.8em;
    }

    &:hover {
      background: ${({ theme }) => theme.colors.sunken};
    }
  }
`

/* ---------- Avslutning ---------- */

const Veier = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
  margin-top: clamp(2rem, 4vw, 3rem);

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
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

const Vei = styled(Link)`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 2rem;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.surface};
  color: inherit;
  text-decoration: none;
  box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border};
  transition: transform ${({ theme }) => theme.transitions.soft}, box-shadow ${({ theme }) => theme.transitions.soft};

  h3 {
    margin: 1.5rem 0 0.5rem;
    font-size: 1.6rem;
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  p {
    margin: 0 0 1.75rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 44ch;
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: inset 0 0 0 1px ${({ theme }) => theme.colors.border}, 0 24px 48px rgba(28, 26, 24, 0.08);
  }

  &:hover ${VeiCta} svg {
    transform: translateX(4px);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
    }
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.5rem;
  }
`
