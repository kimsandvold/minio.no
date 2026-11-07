import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import styled from 'styled-components'
import Navbar from '../../layout/Navbar'
import Footer from '../../layout/Footer'
import ProductModal from '../../shared/ProductModal/ProductModal'
import NewsletterModal from '../../shared/NewsletterModal/NewsletterModal'
import SignDesignerModal from '../SignDesigner/SignDesignerModal'
import PageTransition from '../../shared/PageTransition'
import Icon from '../../shared/Icon'
import VimzoAnnonse from '../../shared/VimzoAnnonse'
import { Eyebrow, Handlingsknapp, Hode, Ingress, Knapp, PilLenke, Reveal, Seksjon, SideHode, Tittel, Wrap } from '../../editorial'
import {
  FRAKT,
  fraPris,
  graveringFraPris,
  graveringKampanje,
  graveringTjenester,
  graveringTreslag,
  PRIS_ER_ENDELIG,
  synligeProdukter,
} from '../../../data/gravering'
import { erJulegavesesong } from '../../../data/sesong'
import { useSEO } from '../../../hooks/useSEO'
import Graveringkonfigurator from './Graveringkonfigurator'
import EgetEmne from './EgetEmne'

const TRESLAG = graveringTreslag

/** Anledningene folk faktisk graverer til, i den rekkefølgen de spør om dem. */
const ANLEDNINGER = [
  {
    ikon: 'faStar',
    tittel: 'Gaver',
    tekst: 'Bryllup, innflytting, bursdag og jul. En gravert fjøl koster lite, men blir stående framme på kjøkkenet i stedet for i en skuff.',
  },
  {
    ikon: 'faSeedling',
    tittel: 'Konfirmasjon',
    tekst: 'Navn og dato på noe som skal være med videre – fjøl, drikkeflaske eller kjevle til den første egne leiligheten.',
  },
  {
    ikon: 'faBriefcase',
    tittel: 'Bedriftsgaver',
    tekst: 'Logo på kundegaver, jubileer og julegaver til de ansatte. Vi graverer like gjerne én som hundre, med samme motiv på alle.',
  },
  {
    ikon: 'faUser',
    tittel: 'Personlige ting',
    tekst: 'Fjøla du bruker hver dag, kjevla til julebaksten eller drikkeflaska som alltid blir forvekslet. Ting du bruker selv, merket så de er dine.',
  },
]

const LEVERING = [
  { tittel: 'Du tegner', tekst: 'Velg produkt, materiale og motiv i konfiguratoren og se resultatet bli til mens du skriver.' },
  { tittel: 'Vi tegner korrektur', tekst: 'Du får et tilbud og en siste korrektur på e-post. Ingenting graveres før du har sagt ja.' },
  { tittel: 'Vi graverer', tekst: 'Laseren brenner motivet i tre og skinn, og tar vekk lakken på stål så blankt metall kommer fram.' },
  { tittel: 'Du får den i posten', tekst: 'Vanligvis 7–10 virkedager fra godkjent korrektur. Faktura med frakt følger med når varen sendes – du betaler ingenting før den er på vei. Gaveeske på forespørsel.' },
]

/** Ruller til konfiguratoren uten å legge en hash i historikken. */
function tilKonfigurator() {
  document.getElementById('konfigurator')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * FAQ-en er skrevet som søk, ikke som overskrifter: hvert spørsmål er en
 * formulering folk faktisk taster inn, og svaret står ferdig i første setning.
 * Google viser dem både som utvidet søketreff og i «Folk spør også».
 */
const FAQ = [
  {
    '@type': 'Question',
    name: 'Hva er en god personlig julegave?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Noe de bruker, med navnet på. En gravert skjærefjøl i bøk, en pregekjevle til pepperkakene eller en drikkeflaske med navn koster fra 448 kroner, og blir stående framme på kjøkkenet i stedet for i en skuff. Du designer motivet selv og ser det ferdig før vi graverer.',
    },
  },
  {
    '@type': 'Question',
    name: 'Rekker jeg å få en gravert julegave før jul?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Ja, hvis du bestiller innen 1. desember. Vi bruker normalt 7–10 virkedager fra du har godkjent korrekturen, pluss frakt. Fri frakt på ordre over 700 kroner gjelder til og med 15. desember.',
    },
  },
  {
    '@type': 'Question',
    name: 'Hva koster en gravert julegave?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Skjærefjøl i bøk koster 448 kroner ferdig gravert, pregekjevle 548 kroner og drikkeflaske fra 299 kroner. Frakt er 139 kroner, og fri på ordre over 700 kroner til og med 15. desember. Prisen er endelig – vi beregner ikke merverdiavgift.',
    },
  },
  {
    '@type': 'Question',
    name: 'Hvor lang tid tar en gravert gave?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Normalt 7–10 virkedager fra du har godkjent korrekturen. I ukene før jul bør du bestille i god tid.',
    },
  },
  {
    '@type': 'Question',
    name: 'Hvordan virker en pregekjevle?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Mønsteret graveres inn i kjevla, speilvendt og sømløst hele veien rundt, slik at det trykkes opphøyd i deigen når du kjevler. Den er i massiv bøk, Ø 50 × 250 mm trykkflate, og passer til pepperkaker, kjeks og mørdeig.',
    },
  },
  {
    '@type': 'Question',
    name: 'Når betaler jeg for graveringen?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Du betaler ingenting når du sender inn designet. Du får først et uforpliktende tilbud og en korrektur, og faktura sendes når den graverte varen går i posten. Frakt kommer i tillegg til den veiledende prisen og legges på samme faktura. Prisen er endelig: Minio er et enkeltpersonforetak under grensen for mva-registrering, så det legges ikke merverdiavgift på beløpet.',
    },
  },
  {
    '@type': 'Question',
    name: 'Kan dere gravere på noe jeg har selv?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Ja. Vi graverer både flate emner (fjøler, brett, skilt, lær) og sylindriske (termoser, flasker, krus, knivskaft) som du sender inn. Fyll ut skjemaet under «Ditt eget emne» med materiale, mål og hva som skal graveres, så sier vi fra om det lar seg gjøre og hva det koster.',
    },
  },
  {
    '@type': 'Question',
    name: 'Graverer dere bedriftsgaver med logo?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Ja. Vi graverer logo på kundegaver, jubileumsgaver og julegaver til ansatte – fra ett eksemplar til store serier med samme motiv. Send logoen som SVG, PDF eller høyoppløst PNG, så tilpasser vi den til flaten.',
    },
  },
  {
    '@type': 'Question',
    name: 'Tåler en gravert skjærefjøl oppvaskmaskin?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Nei. Fjøler i massivt tre skal vaskes for hånd og tørkes stående. Oppvaskmaskin sprekker treet og sliter ned graveringen. Olje fjøla med matolje et par ganger i året.',
    },
  },
  {
    '@type': 'Question',
    name: 'Hvilket treslag er best til en skjærefjøl?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Skjærefjøla og kjevla vår er i massiv bøk. Bøk er lyst og tett, hardt nok til kniv, og graveringen står skarpt. Har du et annet treslag selv – eik, ask eller valnøtt – graverer vi gjerne på det du sender inn.',
    },
  },
  {
    '@type': 'Question',
    name: 'Hvordan ser gravering på en drikkeflaske ut?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Drikkeflaska er i pulverlakkert stål med klaff-lokk og bærestropp, og kommer i hvit, lysegrønn og lyserosa. Laseren tar vekk lakken i stedet for å brenne, så motivet kommer fram som blankt stål – en matt, mørkere strek mot den lyse lakken.',
    },
  },
  {
    '@type': 'Question',
    name: 'Kan dere gravere en logo eller min egen tegning?',
    acceptedAnswer: {
      '@type': 'Answer',
      text: 'Ja. Send oss filen i kontaktskjemaet, helst som SVG, PDF eller en høyoppløst PNG med ren bakgrunn, så tilpasser vi den til flaten.',
    },
  },
]

/**
 * Søkeordene folk faktisk bruker når de leter etter en gravert gave.
 *
 * Tittel og beskrivelse byttes i julegavesesongen: «julegave med gravering» er
 * et helt annet søk enn «gravering i tre», og desember er det eneste tidsrommet
 * i året der det søket har volum. Resten av året står den generelle varianten.
 *
 * Lengder: tittel under 60 tegn og beskrivelse under 155, ellers klipper Google
 * teksten midt i en setning.
 */
function seo(jul: boolean) {
  const fjol = synligeProdukter.find((p) => p.id === 'fjol-rekt')
  /**
   * Delingsbildet er et eget kort i 1200 × 630 – formatet Facebook, LinkedIn
   * og X vil ha. Produktfotoene er stående (1024 × 1280) og ble beskåret til
   * en smal stripe når de ble delt. Kortene er generert fra den samme
   * forhåndsvisningen konfiguratoren tegner, så de aldri viser noe vi ikke
   * leverer.
   */
  const bilde = jul
    ? '/images/featured/gravering-deling.webp'
    : '/images/featured/gravering-deling-generell.webp'

  /** Ett produkt som Product-markup, med pris og frakt slik siden viser det. */
  const produktData = (id: string, navn: string, beskrivelse: string, materiale: string, foto?: string) => {
    const p = synligeProdukter.find((x) => x.id === id)
    if (!p) return null
    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      '@id': `https://minio.no/gravering#${id}`,
      name: navn,
      description: beskrivelse,
      // Eget produktfoto når vi har det, ellers delingskortet.
      image: [`https://minio.no${foto ?? bilde}`],
      material: materiale,
      brand: { '@type': 'Brand', name: 'Minio' },
      category: 'Personlige gaver',
      offers: {
        '@type': 'Offer',
        url: 'https://minio.no/gravering#konfigurator',
        priceCurrency: 'NOK',
        price: fraPris(p),
        // Prisen er uten mva fordi foretaket ikke er mva-registrert.
        valueAddedTaxIncluded: false,
        availability: 'https://schema.org/InStock',
        itemCondition: 'https://schema.org/NewCondition',
        seller: { '@id': 'https://minio.no/#business' },
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingRate: { '@type': 'MonetaryAmount', value: FRAKT, currency: 'NOK' },
          shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'NO' },
        },
      },
    }
  }

  return {
    title: jul
      ? 'Julegave med gravering – fjøl, kjevle og flaske | Minio'
      : 'Gravering i tre og stål – personlige gaver | Minio',
    description: jul
      ? `Personlig julegave gravert i Lillehammer: skjærefjøl i bøk, pregekjevle til pepperkakene eller drikkeflaske. Design den selv – fri frakt over ${graveringKampanje.grense} kr.`
      : 'Design din egen gravering i nettleseren: skjærefjøl i bøk, pregekjevle og drikkeflaske. Navn, dato eller logo – gravert på bestilling i Lillehammer.',
    keywords: jul
      ? 'julegave med gravering, personlig julegave, julegave med navn, gravert skjærefjøl, pepperkakekjevle, kjevle med mønster, gravert drikkeflaske, drikkeflaske med navn, julegave til mamma, julegave til pappa, bedriftsgaver jul, personlige julegaver, julegave kjøkken'
      : 'gravering, gravert skjærefjøl, pregekjevle, kjevle med mønster, gravert drikkeflaske, drikkeflaske med navn, personlig gave, konfirmasjonsgave, bedriftsgaver gravering, logo gravering, gravering på eget emne, navn på gave',
    ogImage: bilde,
    ogImageAlt: jul
      ? 'Gravert skjærefjøl i bøk – personlig julegave fra Minio'
      : 'Skjærefjøl i bøk med personlig gravering',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Hjem', item: 'https://minio.no/' },
          { '@type': 'ListItem', position: 2, name: 'Gravering', item: 'https://minio.no/gravering' },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': 'https://minio.no/gravering#service',
        name: jul ? 'Graverte julegaver' : 'Gravering og laserskjæring',
        serviceType: 'Lasergravering i tre og stål',
        description: jul
          ? 'Personlige julegaver gravert på bestilling i Lillehammer: skjærefjøl i bøk, pregekjevle og drikkeflaske, med navn, dato eller logo.'
          : 'Graverte skjærefjøler, pregekjevler, drikkeflasker og skilt, laget på bestilling i Lillehammer.',
        provider: { '@id': 'https://minio.no/#business' },
        areaServed: { '@type': 'Country', name: 'Norge' },
        offers: {
          '@type': 'Offer',
          priceCurrency: 'NOK',
          price: graveringFraPris,
          availability: 'https://schema.org/InStock',
        },
      },
      produktData(
        'fjol-rekt',
        'Gravert skjærefjøl i bøk',
        `Skjærefjøl i massiv bøk, ${fjol?.varianter[0].navn ?? '350 × 240 mm'} med saftrille, gravert med navn, dato eller eget motiv. Personlig gave til kjøkkenet.`,
        'Bøk',
      ),
      produktData(
        'kjevle',
        'Pregekjevle i bøk – kjevle med mønster',
        'Kjevle i massiv bøk med mønsteret gravert inn, så det preges i deigen. Til pepperkaker, kjeks og mørdeig – med navn eller julemotiv.',
        'Bøk',
      ),
      produktData(
        'drikkeflaske',
        'Gravert drikkeflaske i stål',
        'Drikkeflaske i pulverlakkert stål – hvit, lysegrønn eller lyserosa – med klaff-lokk og bærestropp, gravert med navn eller logo. Laseren tar vekk lakken, så motivet blir blankt stål.',
        'Rustfritt stål',
        '/images/products/drikkeflaske-lysegronn-gravering.webp',
      ),
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': 'https://minio.no/gravering#faq',
        mainEntity: FAQ,
      },
    ].filter(Boolean) as Array<Record<string, unknown>>,
  }
}

export default function GraveringPage() {
  const [skiltdesigner, settSkiltdesigner] = useState(false)
  const jul = erJulegavesesong()
  const [sokeparametre] = useSearchParams()
  const direkteProdukt = sokeparametre.get('produkt')

  useSEO(seo(jul))

  /**
   * Kommer kunden fra et produktkort på forsiden, har hun allerede valgt hva
   * hun vil ha – da skal hun ikke lande på toppen og måtte bla ned igjen.
   * `useSEO` ruller til toppen ved montering, så vi venter én frame på den.
   */
  useEffect(() => {
    if (!direkteProdukt) return
    const frame = requestAnimationFrame(tilKonfigurator)
    return () => cancelAnimationFrame(frame)
  }, [direkteProdukt])

  return (
    <>
      <Navbar />
      <PageTransition>
        <main id="main-content">
          <SideHode
            eyebrow={jul ? 'Gravering · julegavesesong' : 'Gravering'}
            tittel={jul ? 'Julegaver gravert i tre, med navnet på.' : 'Gravert i tre, med ditt navn på.'}
            ingress={
              jul
                ? 'Personlige julegaver fra verkstedet på Lillehammer: skjærefjøl i bøk, pregekjevle til pepperkakene og drikkeflaske med navn. Tegn motivet ferdig her i nettleseren, så ser du nøyaktig hva du får før vi skrur på laseren. Har du emnet selv, graverer vi på det.'
                : 'Gaver, konfirmasjon, bedriftsgaver og dine egne ting – gravert i verkstedet på Lillehammer. Tegn motivet ferdig her i nettleseren, så ser du nøyaktig hva du får før vi skrur på laseren. Har du emnet selv, flatt eller sylindrisk, graverer vi på det.'
            }
            handlinger={
              <>
                <Handlingsknapp type="button" $variant="hvit" onClick={tilKonfigurator}>
                  Design din egen
                </Handlingsknapp>
                <Knapp to="/kontakt?subject=Gravering" $variant="glass">
                  Ta kontakt
                </Knapp>
              </>
            }
          >
            {jul && (
              <Julestripe>
                <Icon name="faSnowflake" />
                <span>
                  {graveringKampanje.aktiv ? (
                    <>
                      <strong>{graveringKampanje.merke}:</strong> {graveringKampanje.tekst} Bestill innen
                      1. desember for trygg julelevering.
                    </>
                  ) : (
                    <>
                      <strong>Skal den rekke julen?</strong> Bestill innen 1. desember, så rekker vi gravering
                      og frakt i god tid.
                    </>
                  )}
                </span>
              </Julestripe>
            )}
          </SideHode>

          <Seksjon id="konfigurator">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Konfigurator</Eyebrow>
                    <Tittel>Tegn den ferdig før vi graverer.</Tittel>
                  </div>
                  <div>
                    <Ingress>
                      Tre produkter, egne valg for hvert. Forhåndsvisningen er tegnet i riktige mål, så
                      det du ser er det du får. Fra {graveringFraPris} kr. {PRIS_ER_ENDELIG}
                    </Ingress>
                  </div>
                </Hode>
              </Reveal>
              <Graveringkonfigurator />
            </Wrap>
          </Seksjon>

          <Seksjon $flate="deep">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow $lys>Fra verkstedet</Eyebrow>
                    <Tittel>Slik ser det ut ferdig.</Tittel>
                  </div>
                  <div>
                    <Ingress $lys>
                      Forhåndsvisningen over er tegnet i riktige mål. Her er noe av det som har gått
                      ut av verkstedet.
                    </Ingress>
                  </div>
                </Hode>
              </Reveal>
              <Galleri>
                <Reveal>
                  <Bilde>
                    <img
                      src="/images/featured/minio_curringb_engrave_1.webp"
                      alt="Gravert skjærefjøl i bøk med familienavn – personlig gave fra Minio"
                      loading="lazy"
                    />
                    <figcaption>Skjærefjøl i eik og valnøtt, gravert og oljet med hardvoksolje.</figcaption>
                  </Bilde>
                </Reveal>
                <Reveal forsinkelse={90}>
                  <Bilde>
                    <img
                      src="/images/featured/minio_gravering_3.webp"
                      alt="Graverte skjærefjøler og drikkeflasker – personlige gaver fra verkstedet på Lillehammer"
                      loading="lazy"
                    />
                    <figcaption>
                      Vi graverer også på metall, glass, stein og lær – flasker, kopper og
                      bedriftsgaver.
                    </figcaption>
                  </Bilde>
                </Reveal>
              </Galleri>
            </Wrap>
          </Seksjon>

          <Seksjon>
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Til hva</Eyebrow>
                    <Tittel>Gaver, konfirmasjon, bedrift – og dine egne ting.</Tittel>
                  </div>
                  <div>
                    <Ingress>
                      Det meste vi graverer er noe som skal gis bort eller merkes som sitt. Her er de fire
                      anledningene folk kommer til oss med.
                    </Ingress>
                  </div>
                </Hode>
              </Reveal>
              <Tjenester>
                {ANLEDNINGER.map((a, i) => (
                  <Reveal key={a.tittel} forsinkelse={(i % 4) * 70}>
                    <Tjenestekort>
                      <TjenesteIkon>
                        <Icon name={a.ikon} />
                      </TjenesteIkon>
                      <h3>{a.tittel}</h3>
                      <p>{a.tekst}</p>
                    </Tjenestekort>
                  </Reveal>
                ))}
              </Tjenester>
            </Wrap>
          </Seksjon>

          <Seksjon $flate="surface">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Fra tegning til postkasse</Eyebrow>
                    <Tittel>Fire steg, ingen overraskelser.</Tittel>
                  </div>
                </Hode>
              </Reveal>
              <Steg>
                {LEVERING.map((s, i) => (
                  <Reveal key={s.tittel} forsinkelse={i * 80}>
                    <Stegkort>
                      <span>{String(i + 1).padStart(2, '0')}</span>
                      <h3>{s.tittel}</h3>
                      <p>{s.tekst}</p>
                    </Stegkort>
                  </Reveal>
                ))}
              </Steg>
            </Wrap>
          </Seksjon>

          <Seksjon id="eget-emne">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Ditt eget emne</Eyebrow>
                    <Tittel>Har du tingen selv, graverer vi på den.</Tittel>
                  </div>
                  <div>
                    <Ingress>
                      Kniven fra farfar, brettet du har snekret, flaska, krusene til laget – send oss emnet
                      og designet, så graverer vi. Vi trenger bare å vite om tingen er flat eller sylindrisk,
                      hva den er laget av, og hvor stor den er.
                    </Ingress>
                  </div>
                </Hode>
              </Reveal>
              <EgetEmne />
            </Wrap>
          </Seksjon>

          <Seksjon $flate="surface">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Skilt og dekor</Eyebrow>
                    <Tittel>Vi graverer skilt også.</Tittel>
                  </div>
                  <div>
                    <Ingress>
                      Husnummer, hytteskilt, adresseskilt til postkassestativet eller en logo rett på
                      varmepumpehuset. Alt skjæres og graveres i samme verksted.
                    </Ingress>
                  </div>
                </Hode>
              </Reveal>
              <Tjenester>
                {graveringTjenester.map((t, i) => (
                  <Reveal key={t.tittel} forsinkelse={(i % 3) * 80}>
                    <Tjenestekort>
                      <TjenesteIkon>
                        <Icon name={t.ikon} />
                      </TjenesteIkon>
                      <h3>{t.tittel}</h3>
                      <p>{t.tekst}</p>
                      {t.lenke && <PilLenke til={t.lenke.til}>{t.lenke.tekst}</PilLenke>}
                    </Tjenestekort>
                  </Reveal>
                ))}
              </Tjenester>
            </Wrap>
          </Seksjon>

          <Seksjon>
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Materialer</Eyebrow>
                    <Tittel>Treet avgjør hvor skarp graveringen blir.</Tittel>
                  </div>
                  <div>
                    <Ingress>
                      Lyse, tette treslag gir størst kontrast; mørke gir et dempet preg. På stål tas
                      lakken vekk så blankt metall kommer fram, og i skinn brenner motivet mørkere.
                    </Ingress>
                  </div>
                </Hode>
              </Reveal>
              <Treslagsrad>
                {TRESLAG.map((t, i) => (
                  <Reveal key={t.id} forsinkelse={i * 70}>
                    <Treslagskort>
                      <Flis style={{ background: t.farge }}>
                        <FlisStrek style={{ background: t.areFarge }} />
                        <FlisStrek style={{ background: t.areFarge }} />
                        <FlisStrek style={{ background: t.areFarge }} />
                      </Flis>
                      <h3>{t.navn}</h3>
                      <p>{t.beskrivelse}</p>
                    </Treslagskort>
                  </Reveal>
                ))}
              </Treslagsrad>
              <Stell>
                <h3>Slik holder fjøla seg</h3>
                <p>
                  Alle fjøler leveres pusset og behandlet med matolje. Vask for hånd og sett den på høykant
                  til tørk – oppvaskmaskin sprekker treet og sliter ned graveringen. Olje den med matolje et
                  par ganger i året, så holder både treet og motivet seg i mange år.
                </p>
              </Stell>
            </Wrap>
          </Seksjon>

          <Seksjon $flate="surface">
            <Wrap>
              <Reveal>
                <Hode>
                  <div>
                    <Eyebrow>Spørsmål og svar</Eyebrow>
                    <Tittel>{jul ? 'Rekker den til jul?' : 'Det folk lurer på.'}</Tittel>
                  </div>
                  <div>
                    <Ingress>
                      Finner du ikke svaret, <PilLenke til="/kontakt?subject=Gravering">spør oss</PilLenke> – vi
                      svarer samme dag.
                    </Ingress>
                  </div>
                </Hode>
              </Reveal>
              <Sporsmal>
                {FAQ.map((f, i) => (
                  <Reveal key={f.name} forsinkelse={(i % 3) * 60}>
                    <Sporsmalskort>
                      <summary>{f.name}</summary>
                      <p>{f.acceptedAnswer.text}</p>
                    </Sporsmalskort>
                  </Reveal>
                ))}
              </Sporsmal>
            </Wrap>
          </Seksjon>

          <AnnonseSeksjon>
            <Wrap>
              <VimzoAnnonse plassering="gravering" />
            </Wrap>
          </AnnonseSeksjon>

          <Seksjon $flate="deep">
            <Wrap>
              <Reveal>
                <Avslutning>
                  <div>
                    <Eyebrow $lys>Har du en egen idé?</Eyebrow>
                    <Tittel>Tegn skiltet selv, eller send oss skissen.</Tittel>
                    <Ingress $lys>
                      Skiltdesigneren lar deg plassere tekst, former og symboler fritt og eksportere resultatet
                      som SVG – klar for laseren. Har du allerede en fil eller en tegning på papir, tar vi den
                      like gjerne.
                    </Ingress>
                  </div>
                  <Handlinger>
                    <Handlingsknapp type="button" $variant="hvit" onClick={() => settSkiltdesigner(true)}>
                      <Icon name="faPencilRuler" /> Åpne skiltdesigner
                    </Handlingsknapp>
                    <Knapp to="/kontakt?subject=Gravering" $variant="glass">
                      Send oss en skisse
                    </Knapp>
                  </Handlinger>
                </Avslutning>
              </Reveal>
            </Wrap>
          </Seksjon>
        </main>
      </PageTransition>
      <Footer />
      <ProductModal />
      <NewsletterModal />
      <SignDesignerModal isOpen={skiltdesigner} onClose={() => settSkiltdesigner(false)} />
    </>
  )
}

const Julestripe = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.8rem 1.2rem;
  border-radius: 999px;
  background: rgba(224, 137, 95, 0.14);
  box-shadow: inset 0 0 0 1px rgba(224, 137, 95, 0.3);
  color: ${({ theme }) => theme.colors.inkInverted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.45;

  svg {
    flex: none;
    color: ${({ theme }) => theme.colors.accentLight};
  }
`

const Galleri = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

const Bilde = styled.figure`
  margin: 0;

  img {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: 20px;
  }

  figcaption {
    margin-top: 0.85rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkInvertedMuted};
  }
`

const Steg = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const Stegkort = styled.div`
  height: 100%;
  padding: 1.5rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.paper};

  span {
    font-family: ${({ theme }) => theme.fonts.mono};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    color: ${({ theme }) => theme.colors.accent};
  }

  h3 {
    margin: 0.5rem 0 0.4rem;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Tjenester = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.25rem;

  @media (max-width: 960px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`

const Tjenestekort = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%;
  padding: 1.75rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.surface};

  h3 {
    margin: 0;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0 0 auto;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.65;
    color: ${({ theme }) => theme.colors.inkMuted};
  }

  a {
    margin-top: 1rem;
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }
`

const TjenesteIkon = styled.div`
  font-size: 1.4rem;
  color: ${({ theme }) => theme.colors.accent};
`

const Treslagsrad = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.25rem;
  margin-bottom: 2.5rem;

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, 1fr);
  }
`

const Treslagskort = styled.div`
  h3 {
    margin: 0.9rem 0 0.3rem;
    font-size: 1.1rem;
    letter-spacing: -0.02em;
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.6;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const Flis = styled.div`
  position: relative;
  aspect-ratio: 3 / 2;
  border-radius: 14px;
  overflow: hidden;
`

const FlisStrek = styled.span`
  position: absolute;
  left: -10%;
  width: 120%;
  height: 2px;
  opacity: 0.45;

  &:nth-child(1) {
    top: 26%;
    transform: rotate(-1.2deg);
  }

  &:nth-child(2) {
    top: 52%;
    height: 3px;
    transform: rotate(0.8deg);
  }

  &:nth-child(3) {
    top: 76%;
    transform: rotate(-0.6deg);
  }
`

const Stell = styled.div`
  max-width: 62ch;
  padding: 1.75rem;
  border-radius: 20px;
  background: ${({ theme }) => theme.colors.accentSoft};

  h3 {
    margin: 0 0 0.5rem;
    font-size: 1.2rem;
    letter-spacing: -0.02em;
    color: ${({ theme }) => theme.colors.accentInk};
  }

  p {
    margin: 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.accentInk};
  }
`

const Sporsmal = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`

/**
 * Spørsmålene står synlig på siden, ikke bare i strukturerte data: Google
 * krever at FAQ-markup har dekning i innholdet, og svarene er uansett det
 * folk leter etter før de bestiller.
 */
const Sporsmalskort = styled.details`
  height: 100%;
  padding: 1.1rem 1.25rem;
  border-radius: 16px;
  background: ${({ theme }) => theme.colors.paper};

  summary {
    font-size: ${({ theme }) => theme.fontSizes.base};
    font-weight: 600;
    letter-spacing: -0.01em;
    cursor: pointer;
  }

  p {
    margin: 0.7rem 0 0;
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: 1.7;
    color: ${({ theme }) => theme.colors.inkMuted};
  }
`

const AnnonseSeksjon = styled.section`
  padding: clamp(2.5rem, 5vw, 4rem) 0;
  background: ${({ theme }) => theme.colors.paper};
`

const Avslutning = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 2.5rem;
  align-items: end;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`

const Handlinger = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
`
