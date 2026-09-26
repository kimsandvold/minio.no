import { useEffect, useRef, useState } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import { useSEO } from '../../../hooks/useSEO'
import { trackEvent } from '../../../utils/analytics'
import { blueprintGrid, blueprintGridVignette } from '../../../styles/blueprintGrid'
import { opprettProsjektIde } from '../../../services/prosjektIdeService'
import type { Byggeregler } from '../../../designer/types'
import {
  PROSJEKTTYPER,
  GJENNOMFORING,
  TIDSRAMME,
  formatKr,
  type ProsjektType,
  type Storrelse,
} from './prosjektKompass'

const SITE_URL = 'https://minio.no'

const STEG = [
  {
    ikon: 'faHandPointer',
    tittel: '1. Velg prosjekt',
    tekst: 'Tre trykk gir deg et anslag på materialkostnad, tidsbruk og søknadsplikt – med en gang, uten å oppgi noe.',
  },
  {
    ikon: 'faPaperPlane',
    tittel: '2. Send det til meg',
    tekst: 'Vil du ha en personlig vurdering, legger du igjen e-post. Prosjektet ditt følger med automatisk.',
  },
  {
    ikon: 'faComments',
    tittel: '3. Du får et ekte svar',
    tekst: 'Jeg ser på akkurat ditt prosjekt og svarer på e-post. Resten bestemmer du – i ditt tempo.',
  },
]

const FAQ = [
  {
    q: 'Hva koster det å spørre?',
    a: 'Ingenting. Å fortelle om prosjektet og få et svar er gratis og helt uforpliktende. Vil du senere ha tegninger, byggeplan eller praktisk hjelp, avtaler vi det tydelig – med pris – før noe koster noe.',
  },
  {
    q: 'Hvor kommer tallene fra?',
    a: 'Materialanslaget regnes ut av den samme materialmotoren som designverktøyet bruker: bord, bjelker, stolper, beslag og skruer for akkurat de målene du velger, inkludert svinn. Tid og vanskelighetsgrad er hentet fra byggeguidene. Arbeid er ikke med, og anslaget er veiledende – ikke et tilbud.',
  },
  {
    q: 'Må jeg ha mål eller tegninger klare?',
    a: 'Nei. Velg den størrelsen som ligger nærmest, eller «vet ikke». Har du mål, bilder eller en skisse, kan du nevne det i meldingen – da blir svaret mer presist.',
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
      'Få et øyeblikkelig anslag på materialkostnad, tidsbruk og søknadsplikt for terrasse, pergola, carport, levegg og mer – og et gratis, personlig svar om hvordan du kommer i gang.',
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

type Steg = 'type' | 'storrelse' | 'gjennomforing' | 'resultat'
type SkjemaStatus = 'idle' | 'sender' | 'sendt' | 'feil'

interface Anslag {
  kr: number
  regel?: Byggeregler
}

/** «Vet ikke»-valget på størrelsessteget. */
const USIKKER_STORRELSE: Storrelse = { id: 'usikker', navn: 'Vet ikke ennå', maal: 'Vi finner ut av det sammen' }

// Designverktøyets templates drar med seg three.js – lastes først når
// brukeren viser interesse, og deles med designverktøyets chunk.
const lastRegistry = () => import('../../../designer/registry')

/**
 * Regner materialanslag + byggeregler for alle størrelsene til en
 * prosjekttype med designverktøyets egne templates.
 */
function useAnslag(type: ProsjektType | undefined) {
  const [resultat, setResultat] = useState<{ typeId: string; data: Record<string, Anslag> | null } | null>(null)

  useEffect(() => {
    if (!type?.templateId) return
    let aktiv = true
    lastRegistry()
      .then(({ getTemplate }) => {
        const tpl = getTemplate(type.templateId!)
        if (!tpl) throw new Error(`Ukjent template ${type.templateId}`)
        const data: Record<string, Anslag> = {}
        for (const s of type.storrelser) {
          const cfg = { ...tpl.defaultConfig, ...s.config }
          data[s.id] = { kr: tpl.beregn(cfg).estimatKr, regel: tpl.byggeregler?.(cfg) }
        }
        if (aktiv) setResultat({ typeId: type.id, data })
      })
      .catch(() => {
        if (aktiv) setResultat({ typeId: type.id, data: null })
      })
    return () => {
      aktiv = false
    }
  }, [type])

  if (!type?.templateId) return { laster: false, data: null }
  if (resultat?.typeId !== type.id) return { laster: true, data: null }
  return { laster: false, data: resultat.data }
}

export default function ProsjekthjelpPage() {
  // ?type=terrasse (fra forsiden) hopper rett til størrelsessteget.
  const [params] = useSearchParams()
  const startType = PROSJEKTTYPER.find((t) => t.id === params.get('type'))
  const [steg, setSteg] = useState<Steg>(startType ? (startType.id === 'annet' ? 'resultat' : 'storrelse') : 'type')
  const [typeId, setTypeId] = useState(startType?.id ?? '')
  const [storrelseId, setStorrelseId] = useState('')
  const [gjennomforingId, setGjennomforingId] = useState('')
  const [tidsrammeId, setTidsrammeId] = useState('')

  const [melding, setMelding] = useState('')
  const [navn, setNavn] = useState('')
  const [epost, setEpost] = useState('')
  const [sted, setSted] = useState('')
  // Honningkrukke mot skjema-boter: skjult felt som mennesker aldri fyller ut.
  const [nettside, setNettside] = useState('')
  const [status, setStatus] = useState<SkjemaStatus>('idle')
  const [feilmelding, setFeilmelding] = useState('')

  const kompassRef = useRef<HTMLDivElement>(null)
  const forsteRender = useRef(true)

  const type = PROSJEKTTYPER.find((t) => t.id === typeId)
  const storrelse = storrelseId === USIKKER_STORRELSE.id
    ? USIKKER_STORRELSE
    : type?.storrelser.find((s) => s.id === storrelseId)
  const gjennomforing = GJENNOMFORING.find((g) => g.id === gjennomforingId)
  const tidsramme = TIDSRAMME.find((t) => t.id === tidsrammeId)
  const { laster, data: anslagData } = useAnslag(type)
  const anslag = storrelse ? anslagData?.[storrelse.id] : undefined
  const erAnnet = typeId === 'annet'

  useSEO({
    title: 'Prosjekthjelp – hva koster uteprosjektet ditt? | Minio',
    description:
      'Velg terrasse, pergola, carport, levegg eller bod og få et øyeblikkelig anslag på materialkostnad, tidsbruk og søknadsplikt. Gratis personlig svar på e-post.',
    keywords:
      'prosjekthjelp, hva koster terrasse, hva koster carport, pris pergola, søknadsplikt, hjelp til uteprosjekt, gratis byggerådgivning',
    jsonLd: JSONLD,
  })

  // Hold kompasset i synsfeltet når steget byttes (viktig på mobil).
  useEffect(() => {
    if (forsteRender.current) {
      forsteRender.current = false
      return
    }
    const el = kompassRef.current
    if (el && el.getBoundingClientRect().top < 72) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [steg])

  const gaTil = (neste: Steg, label?: string) => {
    setSteg(neste)
    trackEvent('prosjektkompass_steg', 'prosjekthjelp', label ?? neste)
  }

  const velgType = (t: ProsjektType) => {
    setTypeId(t.id)
    setStorrelseId('')
    gaTil(t.id === 'annet' ? 'resultat' : 'storrelse', `type:${t.id}`)
  }

  const velgStorrelse = (id: string) => {
    setStorrelseId(id)
    gaTil('gjennomforing', `storrelse:${typeId}:${id}`)
  }

  const velgGjennomforing = (id: string) => {
    setGjennomforingId(id)
    gaTil('resultat', `gjennomforing:${id}`)
  }

  const tilbake = () => {
    if (steg === 'resultat') gaTil(erAnnet ? 'type' : 'gjennomforing')
    else if (steg === 'gjennomforing') gaTil('storrelse')
    else gaTil('type')
  }

  const byggMelding = () => {
    const linjer: string[] = []
    if (type && !erAnnet) {
      const storr = storrelse ? ` – ${storrelse.navn} (${storrelse.maal})` : ''
      linjer.push(`Prosjekt: ${type.navn}${storr}`)
      if (anslag) linjer.push(`Materialanslag (designmotor): ca. ${formatKr(anslag.kr)}`)
      if (anslag?.regel) linjer.push(`Søknad: ${anslag.regel.tittel}`)
    }
    if (gjennomforing) linjer.push(`Ønsker: ${gjennomforing.navn}`)
    if (tidsramme) linjer.push(`Tidsramme: ${tidsramme.navn}`)
    const hode = linjer.join('\n')
    const fritekst = melding.trim()
    const rom = 4000 - hode.length - 40
    const tekst = fritekst ? `\n\nKundens beskrivelse:\n${fritekst.slice(0, Math.max(0, rom))}` : ''
    return `${hode}${tekst}`.trim()
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (nettside) return // bot
    if (erAnnet && melding.trim().length < 10) {
      setFeilmelding('Fortell litt om idéen din – noen setninger holder.')
      return
    }
    setFeilmelding('')
    setStatus('sender')
    try {
      await opprettProsjektIde({
        navn: navn.trim(),
        epost: epost.trim(),
        sted: sted.trim(),
        prosjektType: type?.navn ?? '',
        melding: byggMelding(),
      })
      setStatus('sendt')
      trackEvent('prosjektkompass_sendt', 'prosjekthjelp', typeId || 'ukjent')
    } catch {
      setStatus('feil')
    }
  }

  const stegNr = { type: 1, storrelse: 2, gjennomforing: 3, resultat: 4 }[steg]

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <Stage>
            <StageInner>
              <Intro>
                <Eyebrow>Prosjekthjelp · gratis</Eyebrow>
                <h1>Hva koster drømmeprosjektet ditt?</h1>
                <p>
                  Tre trykk – så får du anslag på materialkostnad, tidsbruk og søknadsplikt,
                  regnet ut med samme motor som designverktøyet. Vil du ha mer, svarer jeg deg
                  personlig.
                </p>
              </Intro>

              <Kompass ref={kompassRef} aria-live="polite">
                <KompassTopp>
                  {steg !== 'type' && status !== 'sendt' ? (
                    <TilbakeKnapp type="button" onClick={tilbake}>
                      <Icon name="faArrowLeft" /> Tilbake
                    </TilbakeKnapp>
                  ) : <span />}
                  <Fremdrift aria-label={`Steg ${stegNr} av 4`}>
                    {[1, 2, 3, 4].map((n) => (
                      <FremdriftPrikk key={n} $aktiv={n <= stegNr} />
                    ))}
                  </Fremdrift>
                </KompassTopp>

                {type && steg !== 'type' && status !== 'sendt' && (
                  <Valgt>
                    <ValgtChip type="button" onClick={() => gaTil('type')}>{type.navn}</ValgtChip>
                    {storrelse && steg !== 'storrelse' && (
                      <ValgtChip type="button" onClick={() => gaTil('storrelse')}>
                        {storrelse.id === 'usikker' ? 'Størrelse: vet ikke' : `${storrelse.navn} · ${storrelse.maal}`}
                      </ValgtChip>
                    )}
                    {gjennomforing && steg === 'resultat' && (
                      <ValgtChip type="button" onClick={() => gaTil('gjennomforing')}>{gjennomforing.navn}</ValgtChip>
                    )}
                  </Valgt>
                )}

                <StegFlate key={steg}>
                  {steg === 'type' && (
                    <>
                      <StegTittel>Hva drømmer du om?</StegTittel>
                      <TypeGrid>
                        {PROSJEKTTYPER.map((t) => (
                          <TypeKort
                            key={t.id}
                            type="button"
                            onClick={() => velgType(t)}
                            onPointerEnter={() => { if (t.templateId) void lastRegistry() }}
                            $valgt={t.id === typeId}
                          >
                            {t.bilde ? (
                              <img src={t.bilde} alt="" loading="lazy" />
                            ) : (
                              <TypeIkon><Icon name={t.ikon} /></TypeIkon>
                            )}
                            <span>{t.navn}</span>
                          </TypeKort>
                        ))}
                      </TypeGrid>
                    </>
                  )}

                  {steg === 'storrelse' && type && (
                    <>
                      <StegTittel>Omtrent hvor stort?</StegTittel>
                      <StegUndertekst>Velg det som ligger nærmest – du kan justere alt senere.</StegUndertekst>
                      <ValgGrid $kolonner={3}>
                        {type.storrelser.map((s) => {
                          const a = anslagData?.[s.id]
                          return (
                            <StorrelseKort key={s.id} type="button" onClick={() => velgStorrelse(s.id)} $valgt={s.id === storrelseId}>
                              <strong>{s.navn}</strong>
                              <Maal>{s.maal}</Maal>
                              {type.templateId && (
                                <Pris>
                                  {laster ? <Skjelett /> : a ? <>≈ {formatKr(a.kr)}<small> i materialer</small></> : null}
                                </Pris>
                              )}
                              {a?.regel && <RegelMerke $ok={a.regel.sokfri}>{a.regel.tittel}</RegelMerke>}
                            </StorrelseKort>
                          )
                        })}
                      </ValgGrid>
                      <UsikkerKnapp type="button" onClick={() => velgStorrelse(USIKKER_STORRELSE.id)}>
                        Vet ikke ennå – hjelp meg å finne riktig størrelse
                      </UsikkerKnapp>
                    </>
                  )}

                  {steg === 'gjennomforing' && (
                    <>
                      <StegTittel>Hvordan vil du få det gjort?</StegTittel>
                      <ValgGrid $kolonner={2}>
                        {GJENNOMFORING.map((g) => (
                          <ValgKort key={g.id} type="button" onClick={() => velgGjennomforing(g.id)} $valgt={g.id === gjennomforingId}>
                            <ValgIkon><Icon name={g.ikon} /></ValgIkon>
                            <span>
                              <strong>{g.navn}</strong>
                              <small>{g.tekst}</small>
                            </span>
                          </ValgKort>
                        ))}
                      </ValgGrid>
                    </>
                  )}

                  {steg === 'resultat' && status === 'sendt' && (
                    <Kvittering>
                      <Icon name="faCheckCircle" />
                      <h2>Takk, {navn.trim().split(' ')[0] || 'du'}!</h2>
                      <p>
                        Prosjektet ditt er sendt. Jeg ser på det og svarer deg personlig på{' '}
                        <strong>{epost.trim()}</strong>.
                      </p>
                      <KvitteringLenker>
                        {type?.templateId && (
                          <PrimaerLenke to={`/designverktoy/${type.templateId}`}>
                            <Icon name="faCube" /> Tegn prosjektet i 3D mens du venter
                          </PrimaerLenke>
                        )}
                        <SekundaerLenke to="/byggeguider">Les byggeguidene</SekundaerLenke>
                      </KvitteringLenker>
                    </Kvittering>
                  )}

                  {steg === 'resultat' && status !== 'sendt' && (
                    <Resultat>
                      {type && !erAnnet && (
                        <Sammendrag>
                          <Eyebrow $mork>{type.navn}</Eyebrow>
                          <h2>
                            {storrelse && storrelse.id !== 'usikker'
                              ? <>{storrelse.navn} <span>· {storrelse.maal}</span></>
                              : 'Ditt prosjekt'}
                          </h2>

                          <Nokkeltall>
                            <Tall>
                              <small>Materialer</small>
                              {anslag ? (
                                <>
                                  <strong>≈ {formatKr(anslag.kr)}</strong>
                                  <em>veiledende, impregnert</em>
                                </>
                              ) : laster && storrelse?.id !== 'usikker' ? (
                                <Skjelett />
                              ) : (
                                <>
                                  <strong className="liten">Anslag i svaret</strong>
                                  <em>{storrelse?.id === 'usikker' ? 'når vi vet størrelsen' : 'regnes ut for ditt prosjekt'}</em>
                                </>
                              )}
                            </Tall>
                            <Tall>
                              <small>Tidsbruk</small>
                              <strong className="liten">{storrelse?.tid ?? type.tid ?? 'Vurderes i svaret'}</strong>
                            </Tall>
                            <Tall $status={anslag?.regel ? (anslag.regel.sokfri ? 'ok' : 'obs') : undefined}>
                              <small>Søknad</small>
                              {anslag?.regel ? (
                                <>
                                  <strong className="liten">{anslag.regel.tittel}</strong>
                                  {anslag.regel.punkter[0] && <em>{anslag.regel.punkter[0]}</em>}
                                </>
                              ) : type.regler ? (
                                <strong className="liten tekst">{type.regler}</strong>
                              ) : (
                                <strong className="liten">Sjekkes i svaret</strong>
                              )}
                            </Tall>
                          </Nokkeltall>

                          {anslag && (
                            <Grunnlag>
                              Regnet ut av designverktøyets materialmotor for akkurat disse målene: bord,
                              bjelker, stolper, beslag og skruer inkl. svinn. Arbeid er ikke med.
                              {type.templateNote && ` ${type.templateNote}`}
                            </Grunnlag>
                          )}

                          <Neste>
                            {type.templateId && (
                              <PrimaerLenke to={`/designverktoy/${type.templateId}`}>
                                <Icon name="faCube" /> Tegn den i 3D og få kappliste
                              </PrimaerLenke>
                            )}
                            {type.guider.map((g) => (
                              <SekundaerLenke key={g.til} to={g.til}>{g.tekst} <Icon name="faArrowRight" /></SekundaerLenke>
                            ))}
                          </Neste>
                        </Sammendrag>
                      )}

                      <Fangst onSubmit={submit} $alene={erAnnet}>
                        <h2>{erAnnet ? 'Fortell om idéen din' : 'Få en personlig vurdering'}</h2>
                        <p>
                          {erAnnet
                            ? 'Skriv noen setninger – det trenger ikke være gjennomtenkt. Jeg svarer deg personlig på e-post.'
                            : 'Jeg ser på akkurat dette prosjektet og svarer på e-post: hva jeg ville gjort, hva det kan koste totalt og hva du bør passe på. Prosjektet ditt følger med automatisk.'}
                        </p>

                        <Felt>
                          <label htmlFor="ph-melding">
                            {erAnnet ? 'Idéen din *' : <>Noe mer jeg bør vite? <span>(valgfritt)</span></>}
                          </label>
                          <textarea
                            id="ph-melding"
                            required={erAnnet}
                            rows={erAnnet ? 5 : 3}
                            maxLength={3500}
                            value={melding}
                            onChange={(e) => setMelding(e.target.value)}
                            placeholder={erAnnet
                              ? '«Jeg vil lage en benk rundt bålpannen, men vet ikke hvor jeg skal begynne …»'
                              : '«Tomta heller litt mot sør, og jeg lurer på fundamentet …»'}
                          />
                        </Felt>

                        <Felt>
                          <label>Når vil du i gang? <span>(valgfritt)</span></label>
                          <Chips role="group" aria-label="Tidsramme">
                            {TIDSRAMME.map((t) => (
                              <Chip
                                key={t.id}
                                type="button"
                                $valgt={tidsrammeId === t.id}
                                aria-pressed={tidsrammeId === t.id}
                                onClick={() => setTidsrammeId(tidsrammeId === t.id ? '' : t.id)}
                              >
                                {t.navn}
                              </Chip>
                            ))}
                          </Chips>
                        </Felt>

                        <ToKolonner>
                          <Felt>
                            <label htmlFor="ph-navn">Navn *</label>
                            <input id="ph-navn" required maxLength={120} value={navn} onChange={(e) => setNavn(e.target.value)} autoComplete="name" />
                          </Felt>
                          <Felt>
                            <label htmlFor="ph-epost">E-post *</label>
                            <input id="ph-epost" type="email" required maxLength={200} value={epost} onChange={(e) => setEpost(e.target.value)} autoComplete="email" />
                          </Felt>
                        </ToKolonner>

                        <Felt>
                          <label htmlFor="ph-sted">
                            Hvor bor du?{' '}
                            <span>
                              {gjennomforingId === 'ferdig' || gjennomforingId === 'materialpakke'
                                ? '(avgjør hva vi kan levere og hvem som kan bygge)'
                                : '(valgfritt)'}
                            </span>
                          </label>
                          <input id="ph-sted" maxLength={120} value={sted} onChange={(e) => setSted(e.target.value)} placeholder="F.eks. Lillehammer" autoComplete="address-level2" />
                        </Felt>

                        {/* Honningkrukke – skjult for mennesker, boter fyller den ut. */}
                        <Honning aria-hidden="true">
                          <label htmlFor="ph-nettside">Nettside</label>
                          <input id="ph-nettside" tabIndex={-1} autoComplete="off" value={nettside} onChange={(e) => setNettside(e.target.value)} />
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
                            : <><Icon name="faPaperPlane" /> {erAnnet ? 'Send idéen min' : 'Send meg en vurdering'}</>}
                        </SendKnapp>
                        <PersonvernNote>
                          Gratis og uforpliktende. E-posten brukes bare til å svare deg – aldri til
                          nyhetsbrev. Se <Link to="/personvern">personvernerklæringen</Link>.
                        </PersonvernNote>
                      </Fangst>
                    </Resultat>
                  )}
                </StegFlate>
              </Kompass>

              <Tillit>
                <li><Icon name="faCheck" /> Helt gratis</li>
                <li><Icon name="faCheck" /> Ingen konto</li>
                <li><Icon name="faCheck" /> Svar fra et menneske</li>
                <li><Icon name="faCheck" /> Aldri nyhetsbrev</li>
              </Tillit>
            </StageInner>
          </Stage>

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

const inn = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`

const pulser = keyframes`
  0%, 100% { opacity: 0.45; }
  50% { opacity: 1; }
`

const Stage = styled.section`
  position: relative;
  overflow: hidden;
  ${blueprintGrid}
  color: ${({ theme }) => theme.colors.inkInverted};
  padding: 6.5rem 2rem 3.5rem;

  &::after {
    ${blueprintGridVignette}
  }

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 5.5rem 1rem 2.5rem;
  }
`

const StageInner = styled.div`
  position: relative;
  z-index: 1;
  max-width: 1040px;
  margin: 0 auto;
`

const Intro = styled.div`
  text-align: center;
  max-width: 720px;
  margin: 0 auto 2.25rem;

  h1 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
    line-height: 1.02;
    letter-spacing: -0.045em;
    margin: 0.6rem 0 1rem;
    font-weight: 700;

    /* «drømmeprosjektet» er ett langt ord – må få plass på 360 px. */
    @media (max-width: 560px) {
      font-size: 2.05rem;
    }
  }

  p {
    font-size: ${({ theme }) => theme.fontSizes.lg};
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
    line-height: 1.55;
    margin: 0;
  }
`

const Eyebrow = styled.span<{ $mork?: boolean }>`
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: ${({ theme, $mork }) => ($mork ? theme.colors.accent : theme.colors.accentLight)};
`

const Kompass = styled.div`
  scroll-margin-top: 88px;
  background: ${({ theme }) => theme.colors.surface};
  color: ${({ theme }) => theme.colors.ink};
  border-radius: 22px;
  padding: 1.5rem 2rem 2rem;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45), 0 2px 0 rgba(255, 255, 255, 0.04) inset;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.1rem 1rem 1.4rem;
    border-radius: 18px;
  }
`

const KompassTopp = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2rem;
  margin-bottom: 0.5rem;
`

const TilbakeKnapp = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  color: ${({ theme }) => theme.colors.inkMuted};
  background: none;
  border: none;
  padding: 0.35rem 0.1rem;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`

const Fremdrift = styled.div`
  display: flex;
  gap: 0.35rem;
`

const FremdriftPrikk = styled.span<{ $aktiv: boolean }>`
  width: 28px;
  height: 4px;
  border-radius: 999px;
  background: ${({ theme, $aktiv }) => ($aktiv ? theme.colors.accent : theme.colors.border)};
  transition: background 0.3s ease;
`

const Valgt = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-bottom: 0.75rem;
`

const ValgtChip = styled.button`
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accentInk};
  background: ${({ theme }) => theme.colors.accentSoft};
  border: none;
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }
`

const StegFlate = styled.div`
  animation: ${inn} 0.35s cubic-bezier(0.2, 0.7, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`

const StegTittel = styled.h2`
  font-family: ${({ theme }) => theme.fonts.display};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};
  font-weight: 700;
  margin: 0.25rem 0 1.25rem;
  text-align: center;
`

const StegUndertekst = styled.p`
  text-align: center;
  color: ${({ theme }) => theme.colors.inkMuted};
  margin: -0.75rem 0 1.4rem;
`

const kortBase = css<{ $valgt?: boolean }>`
  font: inherit;
  color: inherit;
  text-align: left;
  background: ${({ theme }) => theme.colors.surface};
  border: 1.5px solid ${({ theme, $valgt }) => ($valgt ? theme.colors.accent : theme.colors.border)};
  border-radius: 16px;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;

  &:hover {
    transform: translateY(-3px);
    border-color: ${({ theme }) => theme.colors.accent};
    box-shadow: 0 14px 30px rgba(60, 42, 28, 0.12);
  }

  &:focus-visible {
    outline: 3px solid ${({ theme }) => theme.colors.focus};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover {
      transform: none;
    }
  }
`

const TypeGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.9rem;

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }
`

const TypeKort = styled.button<{ $valgt?: boolean }>`
  ${kortBase}
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;

  img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    background: ${({ theme }) => theme.colors.sunken};
  }

  span {
    padding: 0.75rem 0.9rem 0.85rem;
    font-weight: 600;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.3;
  }
`

const TypeIkon = styled.div`
  width: 100%;
  aspect-ratio: 4 / 3;
  display: grid;
  place-items: center;
  font-size: 2rem;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentSoft};
`

const ValgGrid = styled.div<{ $kolonner: number }>`
  display: grid;
  grid-template-columns: repeat(${({ $kolonner }) => $kolonner}, 1fr);
  gap: 0.9rem;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
    gap: 0.6rem;
  }
`

const StorrelseKort = styled.button<{ $valgt?: boolean }>`
  ${kortBase}
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
  padding: 1.25rem 1.25rem 1.1rem;

  strong {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }
`

const Maal = styled.span`
  font-family: ${({ theme }) => theme.fonts.mono};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkMuted};
`

const Pris = styled.span`
  display: block;
  margin-top: 0.8rem;
  min-height: 1.6rem;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.accent};

  small {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 500;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const RegelMerke = styled.span<{ $ok: boolean }>`
  margin-top: 0.45rem;
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: 600;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  color: ${({ theme, $ok }) => ($ok ? theme.colors.success : theme.colors.warning)};
  background: ${({ theme, $ok }) => ($ok ? theme.colors.successSoft : theme.colors.warningSoft)};
`

const Skjelett = styled.span`
  display: inline-block;
  width: 7.5rem;
  height: 1.1rem;
  border-radius: 6px;
  background: ${({ theme }) => theme.colors.sunken};
  animation: ${pulser} 1.2s ease-in-out infinite;
`

const UsikkerKnapp = styled.button`
  display: block;
  margin: 1.1rem auto 0;
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkMuted};
  background: none;
  border: none;
  text-decoration: underline;
  text-underline-offset: 0.2em;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.ink};
  }
`

const ValgKort = styled.button<{ $valgt?: boolean }>`
  ${kortBase}
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.1rem 1.2rem;

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.md};
  }

  small {
    display: block;
    margin-top: 0.15rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const ValgIkon = styled.span`
  flex: none;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 12px;
  font-size: 1.1rem;
  color: ${({ theme }) => theme.colors.accent};
  background: ${({ theme }) => theme.colors.accentSoft};
`

const Resultat = styled.div`
  display: flex;
  gap: 1.75rem;
  align-items: flex-start;

  @media (max-width: 900px) {
    flex-direction: column;
  }
`

const Sammendrag = styled.div`
  flex: 1.15;
  min-width: 0;

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    margin: 0.3rem 0 1.1rem;

    span {
      color: ${({ theme }) => theme.colors.inkMuted};
      font-weight: 500;
    }
  }
`

const Nokkeltall = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.6rem;
`

const Tall = styled.div<{ $status?: 'ok' | 'obs' }>`
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.95rem 1.1rem;
  border-radius: 14px;
  background: ${({ theme, $status }) =>
    $status === 'ok' ? theme.colors.successSoft : $status === 'obs' ? theme.colors.warningSoft : theme.colors.sunken};

  small {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  strong {
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    font-weight: 700;
    color: ${({ theme }) => theme.colors.ink};

    &.liten {
      font-size: ${({ theme }) => theme.fontSizes.md};
      line-height: 1.4;
    }

    &.tekst {
      font-weight: 500;
    }
  }

  em {
    font-style: normal;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.45;
  }
`

const Grunnlag = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: 1.55;
  color: ${({ theme }) => theme.colors.inkSubtle};
  margin: 0.75rem 0 0;
`

const Neste = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.55rem;
  margin-top: 1.25rem;
`

const PrimaerLenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.surface};
  background: ${({ theme }) => theme.colors.ink};
  border-radius: 999px;
  padding: 0.75rem 1.25rem;
  text-decoration: none;
  transition: background 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.accentHover};
  }
`

const SekundaerLenke = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 600;
  color: ${({ theme }) => theme.colors.accent};
  text-decoration: none;

  svg {
    font-size: 0.75em;
  }

  &:hover {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
`

const Fangst = styled.form<{ $alene: boolean }>`
  flex: 1;
  min-width: 0;
  width: 100%;
  max-width: ${({ $alene }) => ($alene ? '640px' : 'none')};
  margin: ${({ $alene }) => ($alene ? '0 auto' : '0')};
  background: ${({ theme }) => theme.colors.paper};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 18px;
  padding: 1.5rem;

  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    padding: 1.2rem 1rem;
  }

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: ${({ theme }) => theme.fontSizes.xl};
    margin: 0 0 0.4rem;
  }

  > p {
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.55;
    color: ${({ theme }) => theme.colors.inkMuted};
    margin: 0 0 1.2rem;
  }
`

const Felt = styled.div`
  margin-bottom: 1rem;

  label {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: 600;
    margin-bottom: 0.4rem;

    span {
      font-weight: 400;
      color: ${({ theme }) => theme.colors.inkMuted};
    }
  }

  input,
  textarea {
    width: 100%;
    font: inherit;
    font-size: 0.98rem;
    color: ${({ theme }) => theme.colors.ink};
    background: ${({ theme }) => theme.colors.surface};
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: 10px;
    padding: 0.7rem 0.85rem;
    transition: border-color 0.15s ease;

    &:focus {
      outline: none;
      border-color: ${({ theme }) => theme.colors.accent};
    }
  }

  textarea {
    resize: vertical;
    line-height: 1.55;
  }
`

const ToKolonner = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 0;
  }
`

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
`

const Chip = styled.button<{ $valgt: boolean }>`
  font: inherit;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: 500;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  border: 1px solid ${({ $valgt, theme }) => ($valgt ? theme.colors.accent : theme.colors.borderStrong)};
  background: ${({ $valgt, theme }) => ($valgt ? theme.colors.accent : theme.colors.surface)};
  color: ${({ $valgt, theme }) => ($valgt ? '#fff' : theme.colors.ink)};
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
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.error};
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
  background: ${({ theme }) => theme.colors.accent};
  color: #fff;
  border: none;
  border-radius: 999px;
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
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.inkMuted};
  line-height: 1.55;
  margin: 0.8rem 0 0;
  text-align: center;

  a {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.15em;
  }
`

const Kvittering = styled.div`
  text-align: center;
  padding: 1.5rem 0.5rem 1rem;

  > svg {
    font-size: 2.6rem;
    color: ${({ theme }) => theme.colors.success};
    margin-bottom: 1rem;
  }

  h2 {
    font-family: ${({ theme }) => theme.fonts.display};
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
    margin: 0 0 0.75rem;
  }

  p {
    font-size: 1rem;
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted};
    max-width: 46ch;
    margin: 0 auto 1.4rem;
  }
`

const KvitteringLenker = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8rem;
`

const Tillit = styled.ul`
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1.6rem;
  margin: 1.6rem 0 0;
  padding: 0;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.inkInvertedMuted};

  svg {
    color: ${({ theme }) => theme.colors.accentLight};
    margin-right: 0.35rem;
  }
`

const Steps = styled.section`
  background: ${({ theme }) => theme.colors.paper};
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
    color: ${({ theme }) => theme.colors.ink};
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
    color: ${({ theme }) => theme.colors.accent};
    margin-bottom: 0.75rem;
  }

  strong {
    display: block;
    font-size: 1.05rem;
    color: ${({ theme }) => theme.colors.ink};
    margin-bottom: 0.35rem;
  }

  span {
    font-size: 0.92rem;
    color: ${({ theme }) => theme.colors.inkMuted};
    line-height: 1.55;
  }
`

const FaqSeksjon = styled.section`
  background: ${({ theme }) => theme.colors.surface};
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
    color: ${({ theme }) => theme.colors.ink};
    margin: 0 0 1.75rem;
  }

  details {
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 1rem 1.25rem;
    margin-bottom: 0.75rem;
    background: ${({ theme }) => theme.colors.surface};

    summary {
      font-weight: 600;
      color: ${({ theme }) => theme.colors.ink};
      cursor: pointer;
    }

    p {
      font-size: 0.95rem;
      line-height: 1.65;
      color: ${({ theme }) => theme.colors.inkMuted};
      margin: 0.75rem 0 0;
    }
  }
`

const CrossNote = styled.p`
  margin: 2rem auto 0;
  text-align: center;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.inkMuted};
  line-height: 1.6;

  a {
    color: ${({ theme }) => theme.colors.accent};
    font-weight: 600;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }
`
