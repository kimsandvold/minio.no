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
          Et punktfundament er et enkelt betongfundament under én stolpe. Det graves ned til
          frostfri dybde, fylles med drenerende pukk i bunnen, støpes med betong og utstyres med
          en stolpesko mens betongen er fersk. Er du nøyaktig i oppmålingen og herdingen, har du
          et fundament som holder i 30–50 år uten vedlikehold.
        </P>
        <Callout variant="tip" title="Begynn med oppmålingen">
          Det er lett å gå rett på graving, men feil plassering av det første punktet gjør resten
          skjeve. Bruk snor og vinkelmåler for å merke opp alle punktene før du tar opp spaden.
        </Callout>
      </>
    ),
  },
  {
    id: 'verktoy-og-materialer',
    heading: 'Verktøy og materialer du trenger',
    content: (
      <>
        <P>
          Sørg for å ha alt klart før du begynner – spesielt betongen, siden stolpeskoen må settes
          mens betongen fortsatt er fersk.
        </P>
        <H3>Verktøy</H3>
        <Ul>
          <li>Jordspyd eller spade for graving (jordbor/jordborsmaskin sparer tid)</li>
          <li>Trillebår eller bøtte til å frakte masser</li>
          <li>Betongblandemaskin eller stor bøtte for håndblanding</li>
          <li>Vater (helst 60–80 cm) og snor</li>
          <li>Vinkelmåler (90°) og tommestokk / målebånd</li>
          <li>Stamperedskap for å komprimere pukk</li>
          <li>Skje eller spatel for å fordele betong</li>
        </Ul>
        <H3>Materialer per fundament</H3>
        <Ul>
          <li>Betongrørform (plastrør Ø150–200 mm) eller en gjenbrukbar støpeform</li>
          <li>Ferdigbetong (sekkeblanding C20/25) – ca. 0,01–0,02 m³ per punkt avhengig av dybde</li>
          <li>Pukk 8–16 mm, ca. 15–20 cm i bunnlaget</li>
          <li>Justerbar stolpesko eller innstøpt stolpefot</li>
          <li>Ekspansjonsbolt eller kjemisk anker hvis stolpeskoen monteres etter herding</li>
        </Ul>
      </>
    ),
  },
  {
    id: 'merk-ut',
    heading: 'Steg 1 – Merk ut plassering',
    content: (
      <>
        <P>
          Feil plassering av punktfundamentene er den vanligste feilen. Et punkt som er 2–3 cm
          feil gjør at bjelker ikke møtes riktig og at terrassens ytterkontur ikke blir rett.
        </P>
        <Ol>
          <li>
            Finn et hjørnepunkt og slå ned en spiker eller sett en pinner nøyaktig der fundamentets
            senter skal være.
          </li>
          <li>
            Strekk en snor fra første hjørne til neste langs den første siden. Bruk en vinkelmåler
            (3-4-5-metoden) for å sikre 90° hjørner.
          </li>
          <li>
            Mål opp og merk senterposisjon for alle fundamentpunktene langs snorene.
          </li>
          <li>
            Kontroller diagonalene – de to diagonalmålene på et rektangel skal være like.
          </li>
          <li>
            Merk hvert senter med kalkspray eller en liten spiker i bakken.
          </li>
        </Ol>
        <Callout variant="tip" title="3-4-5-metoden gir 90°">
          Mål 3 enheter langs én side og 4 enheter langs den andre. Avstanden mellom disse
          endepunktene skal være nøyaktig 5 enheter for en rett vinkel. Bruk meter for enkle
          mål: 0,9 m – 1,2 m – 1,5 m.
        </Callout>
      </>
    ),
  },
  {
    id: 'grav-og-pukk',
    heading: 'Steg 2 – Grav og legg pukkseng',
    content: (
      <>
        <P>
          Dybden på gropa er avgjørende. Bunnen av betongen skal ligge under frostfri dybde for
          ditt område. Les mer om hva dybden er i din region på{' '}
          <a href="/byggeguider/frostfri-dybde">siden om frostfri dybde</a>.
        </P>
        <Ol>
          <li>
            Grav en rund eller kvadratisk grop med diameter ca. 30–40 cm rundt det merkede senteret.
            Dybde: frostfri dybde + 15–20 cm for pukkseng.
          </li>
          <li>
            Ta bort løs jord i bunnen og tamp gropa jevn.
          </li>
          <li>
            Hell 15–20 cm pukk (8–16 mm) i bunnen og tamp godt. Pukken drener bort vann som ellers
            ville fryse under betongen.
          </li>
          <li>
            Kontroller at pukklaget er horisontalt med vater.
          </li>
        </Ol>
        <Callout variant="warn" title="Aldri bruk original gravemasse som fyll">
          Leire og finkornet jord i bunnen holder på vann og fryser. Bruk alltid drenerende
          pukk – det er den viktigste tiltaket mot <a href="/byggeguider/telehiv">telehiv</a>.
        </Callout>
      </>
    ),
  },
  {
    id: 'sett-form',
    heading: 'Steg 3 – Sett støpeform',
    content: (
      <>
        <P>
          En rund plastrørform (Ø150–200 mm) gir et rent resultat og er enkel å håndtere.
          Alternativt kan du bruke en firkantet trekasse som forskalingen.
        </P>
        <Ol>
          <li>
            Klipp rørformen til riktig lengde med sag. Formen skal gå fra pukklaget og opp til
            ca. 5–10 cm over bakkenivå.
          </li>
          <li>
            Sett formen ned på pukklaget sentrisk over det markerte senterpunktet.
          </li>
          <li>
            Kontroller at formen er loddrett med vater.
          </li>
          <li>
            Fyll rundt formen med jord eller pukk slik at den holder seg i stilling mens du
            blander betong.
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'bland-og-stope',
    heading: 'Steg 4 – Bland og støp betong',
    content: (
      <>
        <P>
          For enkle punktfundamenter er sekkeblanding C20/25 et godt valg. Les pakningens
          veiledning for riktig vann-til-betong-forhold – for mye vann gir svakere betong.
        </P>
        <Ol>
          <li>Bland betong i henhold til anvisning – konsistensen skal ligne tykk grøt.</li>
          <li>
            Hell betong sakte ned i formen i lag på ca. 20 cm om gangen. Stikk med en stang
            eller vibrer forsiktig for å fjerne luftlommer.
          </li>
          <li>
            Fyll formen til ca. 2–3 cm under toppen (som er over bakkenivå). La overflaten
            være flat.
          </li>
          <li>
            Kontroller at formen fortsatt er loddrett med vater. Juster om nødvendig før
            betongen setter seg.
          </li>
        </Ol>
        <Callout variant="tip" title="Støp ikke i frost">
          Fersk betong tåler ikke frost. Støp helst ved temperaturer over +5 °C. Er temperaturen
          nær null, dekk fundamentet med isolerende duk i 24–48 timer etter støp.
        </Callout>
      </>
    ),
  },
  {
    id: 'sett-stolpesko',
    heading: 'Steg 5 – Sett stolpesko mens betongen er fersk',
    content: (
      <>
        <P>
          Den innstøpte stolpeskoen settes direkte i fersk betong. Bruk en justerbar modell slik
          at du kan justere noen millimeter etter herding. Les mer om typer og montering i guiden
          om <a href="/byggeguider/justerbar-stolpesko">justerbar stolpesko</a>.
        </P>
        <Ol>
          <li>
            Plasser stolpeskoen sentrisk på betongen mens den er fersk (innen ca. 30–60 min etter
            støp, avhengig av produkt).
          </li>
          <li>
            Kontroller med vater at skoen er vannrett i begge retninger.
          </li>
          <li>
            Kontroller at senterpinnen eller snoren over gropa stemmer med stolpeskoens senter.
          </li>
          <li>
            Trykk skoen ca. 3–5 cm ned i betongen slik at innfestningen er ordentlig omsluttet.
          </li>
          <li>
            La betongen herde uten å forstyrre skoen. Normalt 24–48 timer før lett belastning,
            og 7–28 dager for full herding.
          </li>
        </Ol>
        <Callout variant="warn" title="Ikke rør stolpeskoen etter at betongen stivner">
          Betongen begynner å stivne etter 20–40 minutter. Beveger du skoen etter det, brytes
          hefte-forbindelsen og fundamentet svekkes. Jobb raskt og nøyaktig.
        </Callout>
      </>
    ),
  },
  {
    id: 'nivelering',
    heading: 'Steg 6 – Kontroller nivå og lodd',
    content: (
      <>
        <P>
          Etter herding (minst 24 timer) er det tid for å sjekke at alle fundamentpunktene er
          i lod og på riktig høyde. Det er langt enklere å korrigere nå enn etter at stolpene
          er på plass.
        </P>
        <Ol>
          <li>
            Bruk et vatervater eller en lasernivellerer for å måle høyde på alle stolpesko.
          </li>
          <li>
            Avvik på inntil 5–10 mm mellom punkter kan kompenseres med en justerbar stolpesko.
            Større avvik bør rettes ved å slipe toppen av betongen eller støpe på et tynt lag.
          </li>
          <li>
            Kontroller at alle senter-punkter er i rett linje og rett avstand fra hverandre.
          </li>
          <li>
            Monter stolpene og bruk vater for å sikre loddrett stilling i to retninger før
            du fester dem permanent.
          </li>
        </Ol>
        <P>
          Nå er fundamentene klare. Neste steg er å montere stolper, bjelkelag og dekke –
          se <a href="/planleggere/terrasse">terrasseplanneren</a> for hjelp med dimensjonering
          og materialvalg.
        </P>
      </>
    ),
  },
]

export default function StopePunktfundamentPage() {
  return (
    <GuideArticleLayout
      slug="stope-punktfundament"
      readingTime="7 min"
      lead="En steg-for-steg-guide til å støpe punktfundamenter for terrasse, bod eller carport – fra oppmåling og graving til støp, stolpesko og nivellering."
      sections={sections}
    />
  )
}
