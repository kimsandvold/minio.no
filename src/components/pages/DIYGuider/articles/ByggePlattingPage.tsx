import GuideArticleLayout, {
  Callout,
  H3,
  Ol,
  P,
  Ul,
  type ArticleSection,
} from '../GuideArticleLayout'

const sections: ArticleSection[] = [
  {
    id: 'kort-fortalt',
    heading: 'Kort fortalt',
    content: (
      <>
        <P>
          En platting på bakken er det perfekte introduksjonsprosjektet hvis du aldri har bygget noe ute før. Ingen graving, ingen betongstøping, ingen krevende høydeberegninger – du avretter bakken, legger bjelker og skrur fast bord. En 3×4 m platting kan stå ferdig på én dag. Vanskelighetsgrad: lav.
        </P>
        <P>
          Denne guiden tar deg gjennom alt du trenger å vite: fra avretting og drenering, via bjelkelag direkte på bakken, til ferdige bord og tips om overflatebehandling. Du klarer dette!
        </P>
        <Callout variant="tip" title="Perfekt nybegynnerprosjekt">
          Plattingen er søknadsfri, krever minimalt med verktøy og gir deg god erfaring med terrassebord og bjelkelag – kunnskap du kan bruke videre på større prosjekter.
        </Callout>
      </>
    ),
  },
  {
    id: 'planlegging',
    heading: 'Planlegging',
    content: (
      <>
        <P>
          Før du starter, tenk gjennom noen enkle spørsmål:
        </P>
        <Ul>
          <li>Hvor stor skal plattingen være og hvor skal den stå?</li>
          <li>Er bakken relativt flat eller må det jevnes ut en del?</li>
          <li>Vil du ha bord i en bestemt retning (diagonalt ser stilig ut)?</li>
          <li>Trenger du fall bort fra huset eller andre bygninger?</li>
        </Ul>
        <P>
          En platting som hviler direkte på bakken egner seg best på relativt flatt terreng med godt drenert grunn. Har du mye leire i bakken, vurder å legge mer pukk for å bedre dreneringen. Er bakken skrå mer enn 20–30 cm over plattingens lengde, bør du vurdere en hevet terrasse med fundament i stedet.
        </P>
      </>
    ),
  },
  {
    id: 'fase-1-avretting',
    heading: 'Fase 1 – Avretting og drenering',
    content: (
      <>
        <P>
          God forberedelse av bakken er halvparten av jobben. Gjøres dette riktig, slipper du ujevne bjelker og fukt-problemer seinere.
        </P>
        <Ol>
          <li>
            <H3>Stikk opp og merk arealet</H3>
            <P>
              Bruk fire pinner og hyssing for å markere plattingens hjørner. Kontroller med diagonal-måling (pythagoras). Merk gjerne 5–10 cm utenfor der bjelkene skal ligge, så du har slingringsmonn.
            </P>
          </li>
          <li>
            <H3>Fjern vegetasjon og matjord</H3>
            <P>
              Stikk av gress og matjord – ta ned ca. 10–15 cm. Er du for lat til å grave, overlever det gresskaret under og trykker seg opp igjennom på sikt. Bruk en spade og en trillebår – det går raskt.
            </P>
          </li>
          <li>
            <H3>Legg fiberduk</H3>
            <P>
              Legg ut fiberduk (ugressduk) over hele arealet og la den gå 20–30 cm opp på alle sider. Fibrduken holder ugresset borte og stabiliserer pukklaget. Klipp hjørnene og brett ned.
            </P>
          </li>
          <li>
            <H3>Legg og avrett pukklaget</H3>
            <P>
              Legg 8–12 cm knust singel (2–16 mm) eller pukk over fibrduken. Avrett med en planke og vater – dette er det siste steget der du styrer fallet. Legg inn et fall på 1–2 cm per meter bort fra hus eller andre bygninger.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Fall er viktig">
          Selv en platting på bakken bør ha litt fall – minimum 1:100 (1 cm per meter). Det hindrer vann i å samle seg under konstruksjonen og forlenger levetiden på bjelkene.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-2-bjelker',
    heading: 'Fase 2 – Bjelker direkte på bakken',
    content: (
      <>
        <P>
          Bjelkene legges direkte på pukklaget. Bruk alltid trykkimpregnert tre klasse NTR/A (som tåler jordfukt) – aldri uimpregnert furu.
        </P>
        <Ol>
          <li>
            <H3>Velg bjelkedimensjon</H3>
            <P>
              For platting på bakken er 48×98 mm c/c 400–600 mm standard for 28 mm terrassebord. Skal du ha tyngre bord (45 mm) kan du øke c/c til 600–900 mm. Legger du bord diagonalt (45°), reduser c/c til 300–400 mm.
            </P>
          </li>
          <li>
            <H3>Legg ut ytterste bjelker</H3>
            <P>
              Start med de to ytterbjelkene. Legg dem parallelt med ønsket bord-retning. Sjekk at de er i vater på tvers, juster med pukk under ved behov. Mål diagonal mellom hjørnene for å sikre rett vinkel.
            </P>
          </li>
          <li>
            <H3>Legg inn resten av bjelkene</H3>
            <P>
              Fordel bjelkene jevnt mellom ytterbjelkene. Bruk en målekloss for å holde c/c-avstand nøyaktig. Sjekk at alle bjelkene er i vater på tvers – detter én ned, legger du pukk under til den er rett.
            </P>
          </li>
          <li>
            <H3>Valgfritt: fest bjelkene med metall-forbindere</H3>
            <P>
              For en stabil konstruksjon kan du bolte ytterbjelkene til en kortbjelke i front og bak. Dette holder bjelkelaget samlet og forhindrer at enkeltbjelker beveger seg.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-3-terrassebord',
    heading: 'Fase 3 – Legge terrassebord',
    content: (
      <>
        <P>
          Nå begynner den morsomme delen – og fremgangen er umiddelbar synlig!
        </P>
        <Ol>
          <li>
            <H3>Start ved den synligste kanten</H3>
            <P>
              Legg første bord langs den kanten som er mest synlig (typisk mot hus eller inngang). Sjekk at det er parallelt med bjelkene og fest det med to skruer per bjelke.
            </P>
          </li>
          <li>
            <H3>Hold jevn avstand</H3>
            <P>
              Bruk to skruer (3,5 mm skaft) som avstandsholdere mellom hvert bord – det gir ca. 5–6 mm spalte for avrenning. For hardtre (Bangkirai, Ipe) er 3–4 mm ofte nok siden disse arbeider mindre.
            </P>
          </li>
          <li>
            <H3>Skru riktig</H3>
            <P>
              Bruk A4 rustfrie skruer – 4,5×70 mm er et godt valg. Skru i en lett vinkel mot bjelken for bedre hold, og senk hodet 2–3 mm under bordoverflaten. Les mer i <a href="/byggeguider/riktig-skrue">guiden for riktig skrue</a>.
            </P>
          </li>
          <li>
            <H3>Kappe kantene</H3>
            <P>
              Snap en kridtlinje langs begge sider og kappe alle bord i ett strekk med sirkelsag. Jobb stødig og bruk en støttelinje (lekt klamret fast langs kuttelinjen). Avslutt kanten med et kantbord i stående posisjon for et pent avsluttet utseende.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Diagonalt mønster">
          Bord lagt i 45° gir et dynamisk og spennende utseende. Husk å redusere bjelke c/c til 300–400 mm, og legg inn ekstra 10–15 % bord for kapp-svinn.
        </Callout>
      </>
    ),
  },
  {
    id: 'overflatebehandling',
    heading: 'Overflatebehandling',
    content: (
      <>
        <P>
          Ny trykkimpregnert furu bør tørke 4–8 uker utendørs før første strøk olje eller beis. Termotre og hardtre kan behandles etter 2–4 uker.
        </P>
        <Ul>
          <li>Rens overflaten med terrasserens og la tørke helt</li>
          <li>Påfør første strøk olje eller beis langs kornet</li>
          <li>La tørke 24 timer og påfør et andre strøk</li>
          <li>Behandle på nytt hvert 2–3 år</li>
        </Ul>
        <P>
          Gratulerer – du har nå bygget din første utekonstruksjon! Neste steg er kanskje en litt større <a href="/byggeguider/bygge-terrasse">terrasse med fundament</a>?
        </P>
      </>
    ),
  },
]

export default function ByggePlattingPage() {
  return (
    <GuideArticleLayout
      slug="bygge-platting"
      readingTime="8 min"
      lead="Bygge platting på bakken er det perfekte nybegynnerprosjektet – avretting, fiberduk, bjelker og bord uten graving eller betongstøping."
      sections={sections}
    />
  )
}
