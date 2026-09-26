import { useState, type MouseEvent } from 'react'
import styled from 'styled-components'
import { Link } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { Eyebrow, Hode, Ingress, Knapp, Reveal, Seksjon, SideHode, Tittel, Wrap } from '../../editorial'
import { TEMPLATES, KOMMER_SNART } from '../../../designer/registry'
import type { ProductTemplate } from '../../../designer/types'

/* ── Data ─────────────────────────────────────────────────────────────── */

// Samme default som DesignerPage: utelatt `leveranser` = ['ferdig', 'plan'].
const kanBestillesFerdig = (t: ProductTemplate) => (t.leveranser ?? ['ferdig', 'plan']).includes('ferdig')

/** Korte énlinjere til galleriet. Faller tilbake på templatets egen beskrivelse. */
const KORT: Record<string, string> = {
  plantekasse: 'Fire former, med eller uten ben, topplist og espalier.',
  varmepumpehus: 'Skrå spjeld som slipper ut varmluften og skygger for regn.',
  carport: 'Frittstående eller inntil huset – flatt tak, pulttak eller saltak.',
  terrasse: 'Rektangel, L- eller U-form, med rekkverk og trapp.',
  pergola: 'Frittstående eller veggmontert, med åpne spær eller tett tak.',
  utekjokken: 'Fra enkel benk til overbygd kjøkken med vask, skap og hyller.',
  soppelboder: 'Pulttak, saltak eller valmtak – bygget opp steg for steg.',
  vedskjul: 'Med frontdører og bærende skillevegger.',
  postkassestativer: 'Pulttak, saltak eller valmtak, med rom under postkassene.',
  utedo: 'Pulttak, saltak eller valmtak – bygget opp steg for steg.',
  garasje: 'Enkel eller dobbel, på betongplate, med seksjonsport og takstoler.',
}

type Filter = 'alle' | 'store' | 'sma'

const FILTRE: Array<{ id: Filter; navn: string; passer: (t: ProductTemplate) => boolean }> = [
  { id: 'alle', navn: 'Alle', passer: () => true },
  { id: 'store', navn: 'Store prosjekter', passer: (t) => !kanBestillesFerdig(t) },
  { id: 'sma', navn: 'Små produkter', passer: kanBestillesFerdig },
]

const GRATIS = TEMPLATES.filter((t) => t.gratis)
const BETALTE = TEMPLATES.filter((t) => !t.gratis)
const LAVESTE_PLANPRIS = BETALTE.length ? Math.min(...BETALTE.map((t) => t.fraPris)) : null
const kr = (n: number) => `${n.toLocaleString('nb-NO')} kr`

const FAKTA = [
  { tall: String(TEMPLATES.length), tekst: 'modeller å tegne' },
  { tall: '0 kr', tekst: 'å designe og se pris' },
  ...(LAVESTE_PLANPRIS !== null ? [{ tall: `fra ${kr(LAVESTE_PLANPRIS)}`, tekst: 'for ferdig byggeplan' }] : []),
]

const STEG = [
  {
    ikon: 'faHandPointer',
    tittel: 'Velg en modell',
    tekst: 'Start fra et gjennomtenkt oppsett – eller et av de ferdige forslagene i verktøyet.',
  },
  {
    ikon: 'faUpDownLeftRight',
    tittel: 'Tilpass i 3D',
    tekst: 'Dra i målene, bytt treslag, tak og farge. Materiallisten og prisen regnes ut mens du tegner.',
  },
  {
    ikon: 'faFilePdf',
    tittel: 'Last ned byggeplanen',
    tekst: 'Når du er fornøyd, låser du opp planen som PDF – klar til å handle inn og bygge.',
  },
]

// Speiler innholdet i byggeplanen fra src/designer/pdf.ts.
const INNHOLD = [
  { ikon: 'faClipboardList', tittel: 'Materialliste', tekst: 'Alt du trenger å handle, med dimensjoner og antall.' },
  { ikon: 'faRulerCombined', tittel: 'Kappliste', tekst: 'Hver del med lengde og profil – kapp rett første gang.' },
  { ikon: 'faPencilRuler', tittel: 'Målsatt arbeidstegning', tekst: 'Plan og oppriss i 2D med mål og målestokk.' },
  { ikon: 'faCubes', tittel: 'Monteringsanvisning', tekst: 'Rekkefølgen, steg for steg, med råd om sammenføyninger.' },
  { ikon: 'faCube', tittel: '3D-visning', tekst: 'Se designet fra alle kanter – også delt opp i enkeltdeler.' },
  { ikon: 'faPrint', tittel: 'PDF og utskrift', tekst: 'Last ned eller skriv ut og ta med til byggeplassen.' },
]

const VEIER = [
  {
    ikon: 'faHammer',
    tittel: 'Bygg selv',
    tekst: 'Med materialliste, kappliste og arbeidstegning har du det du trenger for å gjøre jobben selv.',
    til: '#modeller',
    cta: 'Velg modell',
  },
  {
    ikon: 'faTruck',
    tittel: 'Bestill ferdig',
    tekst: 'Mindre produkter som plantekasser, varmepumpehus og vedskjul kan du be oss bygge etter designet ditt.',
    til: '/produkter',
    cta: 'Se produktene',
  },
  {
    ikon: 'faComments',
    tittel: 'Få hjelp',
    tekst: 'Carport, terrasse, pergola eller garasje? Vi hjelper deg videre – også med å finne en snekker.',
    til: '/prosjekthjelp',
    cta: 'Gå til prosjekthjelp',
  },
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

/* ── Side ─────────────────────────────────────────────────────────────── */

export default function DesignerLandingPage() {
  const [filter, setFilter] = useState<Filter>('alle')

  useSEO({
    title: 'Designverktøy – tegn uteprosjektet ditt i 3D | Minio',
    description: 'Gratis 3D-designverktøy fra Minio. Tegn carport, terrasse, pergola, plantekasse, utekjøkken eller varmepumpekasse – tilpass mål og materialer, og få komplett byggeplan med materialliste og arbeidstegning.',
    keywords: '3d designverktøy, tegne selv, carport, terrasse, pergola, plantekasse, utekjøkken, byggeplan, materialliste',
    ogImage: '/images/designer/plantekasse-3d.webp',
    ogImageAlt: 'Minios 3D-designverktøy for uteprosjekter i tre',
    jsonLd: JSONLD,
  })

  const aktivt = FILTRE.find((f) => f.id === filter) ?? FILTRE[0]
  const synlige = TEMPLATES.filter(aktivt.passer)

  const tilModeller = (e: MouseEvent<HTMLAnchorElement>) => {
    const mal = document.getElementById('modeller')
    if (!mal) return
    e.preventDefault()
    const redusert = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    mal.scrollIntoView({ behavior: redusert ? 'auto' : 'smooth', block: 'start' })
  }

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <SideHode
            eyebrow="Designverktøy"
            tittel="Tegn det selv i 3D."
            ingress={
              <>
                Velg en modell, sett dine egne mål og se prosjektet fra alle kanter. Du får
                materialliste, kappliste og målsatt byggeplan – gratis å designe.
              </>
            }
            handlinger={
              <>
                <AnkerKnapp href="#modeller" onClick={tilModeller}>
                  Velg modell <Icon name="faArrowDown" />
                </AnkerKnapp>
                <Knapp to="/prosjekthjelp" $variant="glass">Få hjelp med prosjektet</Knapp>
              </>
            }
          >
            <Fakta>
              {FAKTA.map((f) => (
                <li key={f.tekst}>
                  <strong>{f.tall}</strong>
                  <span>{f.tekst}</span>
                </li>
              ))}
            </Fakta>
          </SideHode>

          {/* ── Modellgalleri ── */}
          <Seksjon id="modeller">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Modeller</Eyebrow>
                    <Tittel>Hva vil du tegne?</Tittel>
                  </div>
                  <Filterrad role="group" aria-label="Filtrer modeller">
                    {FILTRE.map((f) => (
                      <FilterKnapp
                        key={f.id}
                        type="button"
                        aria-pressed={filter === f.id}
                        $aktiv={filter === f.id}
                        onClick={() => setFilter(f.id)}
                      >
                        {f.navn}
                        <small>{TEMPLATES.filter(f.passer).length}</small>
                      </FilterKnapp>
                    ))}
                  </Filterrad>
                </Hode>
              </Reveal>

              <Galleri aria-live="polite">
                {synlige.map((t, i) => (
                  <Reveal key={`${filter}-${t.id}`} forsinkelse={(i % 3) * 70}>
                    <Modell to={`/designverktoy/${t.id}`}>
                      <Render>
                        {t.bilde
                          ? <img src={t.bilde} alt={`${t.navn} tegnet i Minios 3D-designverktøy`} loading="lazy" />
                          : <Icon name={t.ikon} />}
                        <Pris $gratis={t.gratis}>
                          {t.gratis ? 'Gratis byggeplan' : `Plan fra ${kr(t.fraPris)}`}
                        </Pris>
                      </Render>
                      <ModellTekst>
                        <ModellNavn>
                          {t.navn}
                          <Icon name="faArrowRight" />
                        </ModellNavn>
                        <p>{KORT[t.id] ?? t.beskrivelse}</p>
                        {kanBestillesFerdig(t) && (
                          <Ferdig><Icon name="faCheck" /> Kan bestilles ferdig</Ferdig>
                        )}
                      </ModellTekst>
                    </Modell>
                  </Reveal>
                ))}

                {filter === 'alle' && KOMMER_SNART.map((k) => (
                  <Snart key={k.id}>
                    <Render><Icon name={k.ikon} /></Render>
                    <ModellTekst>
                      <ModellNavn as="h3">{k.navn}</ModellNavn>
                      <p>{k.beskrivelse}</p>
                      <Ferdig>Kommer snart</Ferdig>
                    </ModellTekst>
                  </Snart>
                ))}
              </Galleri>

              <Fotnote>
                Alle modeller er gratis å tegne. Byggeplanen kjøper du først når du er fornøyd
                {GRATIS.length > 0 && <> – for {listeNavn(GRATIS.map((t) => t.navn.toLowerCase()))} er også planen gratis</>}.
              </Fotnote>
            </Wrap>
          </Seksjon>

          {/* ── Slik fungerer det ── */}
          <Seksjon $flate="surface">
            <Wrap>
              <Reveal>
                <Eyebrow>Slik fungerer det</Eyebrow>
                <Tittel>Tre steg fra idé til plan.</Tittel>
              </Reveal>
              <Steg>
                {STEG.map((s, i) => (
                  <Reveal key={s.tittel} forsinkelse={i * 90}>
                    <StegKort>
                      <StegTopp>
                        <StegNr>{String(i + 1).padStart(2, '0')}</StegNr>
                        <StegIkon><Icon name={s.ikon} /></StegIkon>
                      </StegTopp>
                      <h3>{s.tittel}</h3>
                      <p>{s.tekst}</p>
                    </StegKort>
                  </Reveal>
                ))}
              </Steg>
            </Wrap>
          </Seksjon>

          {/* ── Dette får du ── */}
          <Seksjon>
            <Wrap>
              <InnholdGrid>
                <Reveal>
                  <Klebrig>
                    <Eyebrow>Byggeplanen</Eyebrow>
                    <Tittel>Alt du trenger for å bygge selv.</Tittel>
                    <Ingress>
                      Planen lages ut fra nøyaktig det du har tegnet – dine mål, ditt treslag, ditt tak.
                      Ingen standardtegning du må regne om.
                    </Ingress>
                  </Klebrig>
                </Reveal>
                <InnholdListe>
                  {INNHOLD.map((d, i) => (
                    <Reveal key={d.tittel} forsinkelse={(i % 2) * 80}>
                      <InnholdPunkt>
                        <InnholdIkon><Icon name={d.ikon} /></InnholdIkon>
                        <h3>{d.tittel}</h3>
                        <p>{d.tekst}</p>
                      </InnholdPunkt>
                    </Reveal>
                  ))}
                </InnholdListe>
              </InnholdGrid>
            </Wrap>
          </Seksjon>

          {/* ── Veien videre ── */}
          <Seksjon $flate="surface">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Når tegningen er klar</Eyebrow>
                    <Tittel>Du velger hvordan det blir bygget.</Tittel>
                  </div>
                  <Ingress>
                    Større prosjekter bygger du selv med byggeplanen – eller får hjelp til å finne en
                    snekker. Mindre produkter kan du bestille ferdig fra oss.
                  </Ingress>
                </Hode>
              </Reveal>
              <Veier>
                {VEIER.map((v, i) => (
                  <Reveal key={v.tittel} forsinkelse={i * 90}>
                    <Vei to={v.til} onClick={v.til.startsWith('#') ? tilModeller : undefined}>
                      <VeiInnhold {...v} />
                    </Vei>
                  </Reveal>
                ))}
              </Veier>

              <Reveal>
                <Avslutning>
                  <div>
                    <h2>Usikker på hvor du skal begynne?</h2>
                    <p>Svar på tre spørsmål, så peker vi deg i riktig retning.</p>
                  </div>
                  <Knapp to="/prosjekthjelp" $variant="aksent">
                    Start prosjekthjelp <Icon name="faArrowRight" />
                  </Knapp>
                </Avslutning>
              </Reveal>
            </Wrap>
          </Seksjon>
        </main>
      </PageTransition>
      <Footer />
    </>
  )
}

function VeiInnhold({ ikon, tittel, tekst, cta }: { ikon: string; tittel: string; tekst: string; cta: string }) {
  return (
    <>
      <VeiIkon><Icon name={ikon} /></VeiIkon>
      <h3>{tittel}</h3>
      <p>{tekst}</p>
      <VeiCta>{cta} <Icon name="faArrowRight" /></VeiCta>
    </>
  )
}

function listeNavn(navn: string[]) {
  if (navn.length <= 1) return navn.join('')
  return `${navn.slice(0, -1).join(', ')} og ${navn[navn.length - 1]}`
}

/* ── Stiler ───────────────────────────────────────────────────────────── */

const AnkerKnapp = styled.a`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  min-height: 48px;
  padding: 0 1.5rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: 500;
  text-decoration: none;
  white-space: nowrap;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  transition: background ${({ theme }) => theme.transitions.default}, transform ${({ theme }) => theme.transitions.default};

  svg {
    font-size: 0.8em;
  }

  &:hover {
    background: ${({ theme }) => theme.colors.neutral[200]};
  }

  &:active {
    transform: scale(0.98);
  }
`

const Fakta = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2rem;
  margin: 0;
  padding: 2rem 0 0;
  border-top: 1px solid ${({ theme }) => theme.colors.borderInverted};

  li {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-width: 0;
  }

  strong {
    font-size: clamp(1.9rem, 3.4vw, 2.8rem);
    font-weight: 600;
    letter-spacing: -0.04em;
    line-height: 1;
    white-space: nowrap;
  }

  span {
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }

  @media (max-width: 640px) {
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem 1rem;

    li:last-child:nth-child(odd) {
      grid-column: 1 / -1;
    }

    strong {
      font-size: 1.7rem;
    }

    span {
      font-size: ${({ theme }) => theme.fontSizes.sm};
      line-height: 1.35;
    }
  }
`

const Filterrad = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.sunken};

  @media (max-width: 480px) {
    display: flex;
    flex-wrap: nowrap;
    width: 100%;
  }
`

const FilterKnapp = styled.button<{ $aktiv: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-height: 40px;
  padding: 0 1rem;
  border: 0;
  border-radius: 999px;
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  cursor: pointer;
  color: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.ink : theme.colors.inkMuted)};
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.surface : 'transparent')};
  box-shadow: ${({ theme, $aktiv }) => ($aktiv ? theme.shadows.sm : 'none')};
  transition: background ${({ theme }) => theme.transitions.default}, color ${({ theme }) => theme.transitions.default};

  small {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.inkSubtle};
    font-variant-numeric: tabular-nums;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 2px;
  }

  @media (max-width: 480px) {
    flex: 1 1 auto;
    padding: 0 0.6rem;
    white-space: nowrap;

    small {
      display: none;
    }
  }
`

const Galleri = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2.75rem 1.5rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2.25rem 1rem;
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const Render = styled.div`
  position: relative;
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  overflow: hidden;
  border-radius: 24px;
  /* Renderne har designverktøyets lyse scene som bakgrunn – fyll hele flisen. */
  background: ${({ theme }) => theme.colors.sunken};
  box-shadow: none;
  transition: box-shadow ${({ theme }) => theme.transitions.soft};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  }

  > svg {
    font-size: 2.4rem;
    color: ${({ theme }) => theme.colors.inkSubtle};
  }
`

const Pris = styled.span<{ $gratis?: boolean }>`
  position: absolute;
  top: 0.9rem;
  left: 0.9rem;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme, $gratis }) => ($gratis ? theme.colors.success : theme.colors.accentInk)};
  background: ${({ theme, $gratis }) => ($gratis ? theme.colors.successSoft : theme.colors.accentSoft)};
`

const ModellTekst = styled.div`
  padding: 1.1rem 0.25rem 0;

  > p {
    margin: 0.35rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const ModellNavn = styled.h3`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: 600;
  letter-spacing: -0.03em;

  svg {
    flex: none;
    font-size: 0.7em;
    color: ${({ theme }) => theme.colors.inkSubtle};
    transition: transform ${({ theme }) => theme.transitions.default}, color ${({ theme }) => theme.transitions.default};
  }
`

const Ferdig = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin-top: 0.75rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkSubtle};

  svg {
    color: ${({ theme }) => theme.colors.success};
  }
`

const Modell = styled(Link)`
  display: block;
  color: inherit;
  text-decoration: none;
  border-radius: 24px;

  &:hover ${Render} {
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }

  &:hover ${Render} img {
    transform: scale(1.05);
  }

  &:hover ${ModellNavn} svg {
    transform: translateX(4px);
    color: ${({ theme }) => theme.colors.accent};
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 6px;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover ${Render} img,
    &:hover ${ModellNavn} svg {
      transform: none;
    }
  }
`

const Snart = styled.div`
  opacity: 0.7;
`

const Fotnote = styled.p`
  margin: clamp(2.5rem, 5vw, 4rem) 0 0;
  padding-top: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Steg = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
  margin: clamp(2rem, 4vw, 3rem) 0 0;
  padding: 0;

  > div {
    height: 100%;
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`

const StegKort = styled.div`
  height: 100%;
  padding: 2rem;
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.paper};

  h3 {
    margin: 2.5rem 0 0.5rem;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: 600;
    letter-spacing: -0.035em;
  }

  p {
    margin: 0;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 38ch;
  }

  @media (max-width: 860px) {
    padding: 1.5rem;

    h3 {
      margin-top: 1.5rem;
    }
  }
`

const StegTopp = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`

const StegNr = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkSubtle};
`

const StegIkon = styled.span`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentSoft};
`

const InnholdGrid = styled.div`
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  gap: clamp(2.5rem, 6vw, 6rem);
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const Klebrig = styled.div`
  position: sticky;
  top: 7rem;

  @media (max-width: 960px) {
    position: static;
  }
`

const InnholdListe = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0 2rem;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const InnholdPunkt = styled.div`
  padding: 1.75rem 0;
  border-top: 1px solid ${({ theme }) => theme.colors.border};

  h3 {
    margin: 1rem 0 0.35rem;
    font-size: ${({ theme }) => theme.fontSizes.lg};
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const InnholdIkon = styled.span`
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 12px;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.ink};
  background: ${({ theme }) => theme.colors.sunken};
`

const Veier = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;

  > div {
    height: 100%;
  }

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`

const VeiIkon = styled.span`
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  border-radius: 14px;
  font-size: 1.1rem;
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
  background: ${({ theme }) => theme.colors.paper};
  color: inherit;
  text-decoration: none;
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
    box-shadow: 0 24px 48px rgba(28, 26, 24, 0.08);
  }

  &:hover ${VeiCta} svg {
    transform: translateX(4px);
  }

  &:focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.accent};
    outline-offset: 4px;
  }

  @media (max-width: 560px) {
    padding: 1.5rem;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
    }
  }
`

const Avslutning = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem 2rem;
  margin-top: clamp(2.5rem, 5vw, 4rem);
  padding: clamp(1.75rem, 4vw, 2.5rem) clamp(1.5rem, 4vw, 3rem);
  border-radius: 24px;
  background: ${({ theme }) => theme.colors.accentSoft};

  h2 {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: 600;
    letter-spacing: -0.035em;
    color: ${({ theme }) => theme.colors.ink};
  }

  p {
    margin: 0.4rem 0 0;
    color: ${({ theme }) => theme.colors.accentInk};
  }

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: flex-start;
  }
`
