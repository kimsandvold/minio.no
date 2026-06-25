import GuideArticleLayout, {
  Callout,
  DataTable,
  H3,
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
          En frittliggende carport eller garasje på inntil 50 m² BYA kan i mange tilfeller bygges
          uten søknad til kommunen, forutsatt at den er i én etasje, ikke brukes til beboelse og
          plasseres minst 1 m fra nabogrensen. Det er viktig å understreke at dette er en generell
          veiledning – reguleringsplanen og kommunens egne regler kan sette strengere krav.
        </P>
        <Callout variant="tip" title="Tommelfingerregel">
          Frittliggende carport ≤ 50 m² BYA, én etasje, minst 1 m fra grense og ikke til beboelse
          = som regel søknadsfri per 2026. Men sjekk alltid reguleringsplanen din.
        </Callout>
      </>
    ),
  },
  {
    id: 'vilkaar-for-soknadsfrihet',
    heading: 'Vilkår for å bygge uten søknad',
    content: (
      <>
        <P>
          Byggesaksforskriften SAK10 § 4-1 åpner for at visse frittliggende bygninger kan oppføres
          uten søknad og tillatelse. For carporter og garasjer er det typisk disse betingelsene som
          må være oppfylt samlet sett:
        </P>
        <Ul>
          <li>Bebygd areal (BYA) er høyst 50 m²</li>
          <li>Mønehøyde er høyst 4,0 m og gesimshøyde høyst 3,0 m</li>
          <li>Bygningen er i kun én etasje uten kjeller</li>
          <li>Bygningen er ikke beregnet for varig opphold (ikke bolig, ikke hybel)</li>
          <li>Avstanden til nabogrensen er minst 1,0 m</li>
          <li>
            Tiltaket er ikke i strid med plan (reguleringsplan, kommuneplan) eller annen tillatelse
          </li>
          <li>Bygningen er frittliggende – altså ikke direkte forbundet med bolighuset</li>
        </Ul>
        <P>
          Alle betingelsene må være oppfylt samtidig. Mangler du én, er tiltaket søknadspliktig.
          Selv om tiltaket er unntatt søknadsplikt, er du ansvarlig for at konstruksjonen tilfredsstiller
          kravene i TEK17 og er i tråd med gjeldende planer.
        </P>
        <Callout variant="warn" title="Sjekk med kommunen">
          Regler for søknadsfrihet kan innskrenkes av kommunens reguleringsplan eller
          kommuneplanens arealdel. Bekreft alltid om ditt tiltak er unntatt hos kommunens
          byggesaksavdeling eller på{' '}
          <a href="https://dibk.no" target="_blank" rel="noopener noreferrer">
            dibk.no
          </a>{' '}
          før du setter spaden i jorda.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-teller-som-bya',
    heading: 'Hva teller som BYA?',
    content: (
      <>
        <P>
          Bebygd areal (BYA) er ikke det samme som grunnflate. BYA inkluderer areal under
          takkanter og fremspring som stikker mer enn 0,5 m ut fra veggliv. For en carport med
          utstikkende tak betyr dette at taket kan gjøre det samlede BYA-tallet større enn selve
          parkeringsplassen.
        </P>
        <P>
          Husk også at carportens BYA legges til det allerede bebygde arealet på tomten. Mange
          reguleringsplaner har en maksimal BYA-prosent for eiendommen (for eksempel 20–25 % BYA).
          Er denne kvoten allerede brukt opp av boligen og eksisterende bygninger, kan du ikke
          bygge mer – uavhengig av om carport ellers ville vært søknadsfri.
        </P>
      </>
    ),
  },
  {
    id: 'avstand-og-plassering',
    heading: 'Avstand og plassering',
    content: (
      <>
        <P>
          For søknadsfrie frittliggende bygninger gjelder som regel en minimumsavstand på 1,0 m
          til nabogrensen – dette er en lempelse fra den generelle 4 m-regelen som gjelder for
          søknadspliktige tiltak. Men vær oppmerksom på at:
        </P>
        <Ul>
          <li>
            Avstand til nabobyggninger (ikke bare grensen) kan ha egne krav i henhold til
            brann­tekniske regler
          </li>
          <li>
            Noen reguleringsplaner krever likevel 4 m til grensen, selv for søknadsfrie
            konstruksjoner
          </li>
          <li>
            Carport inntil 1 m fra grensen kan i noen tilfeller tillates om naboen gir skriftlig
            samtykke – sjekk dette med kommunen
          </li>
        </Ul>
        <P>
          Les mer om avstandsregler i vår artikkel om{' '}
          <a href="/byggeguider/avstand-til-nabogrense">avstand til nabogrense</a>.
        </P>
        <DataTable>
          <caption>Typiske krav for søknadsfri frittliggende carport/garasje</caption>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Vanlig grenseverdi</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>BYA</td>
              <td>Maks 50 m²</td>
              <td>Inkludert takkant over 0,5 m utkraging</td>
            </tr>
            <tr>
              <td>Mønehøyde</td>
              <td>Maks 4,0 m</td>
              <td>Over ferdig planert terreng</td>
            </tr>
            <tr>
              <td>Gesimshøyde</td>
              <td>Maks 3,0 m</td>
              <td>Over ferdig planert terreng</td>
            </tr>
            <tr>
              <td>Etasjer</td>
              <td>Kun 1 etasje, ingen kjeller</td>
              <td>–</td>
            </tr>
            <tr>
              <td>Avstand til nabogrense</td>
              <td>Minst 1,0 m</td>
              <td>Reguleringsplan kan kreve mer</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'hva-du-fortsatt-ma-folge',
    heading: 'Hva du fortsatt må følge selv uten søknad',
    content: (
      <>
        <P>
          Søknadsfrihet betyr ikke byggefrihet. Du er fortsatt ansvarlig for at carorten er
          forsvarlig konstruert i henhold til TEK17 og at du ikke bryter plan. Typiske punkter å
          passe på:
        </P>
        <Ul>
          <li>Konstruksjonsberegninger for tak og vindlast (spesielt i snøtunge områder)</li>
          <li>Drenering slik at overvann ikke ledes mot naboeiendommen</li>
          <li>Brannteknisk avstand til nabobyggning (minimum 8 m mellom to trebygninger uten tiltak)</li>
          <li>Elektrisk installasjon må utføres av kvalifisert elektriker</li>
        </Ul>
        <P>
          Vil du planlegge carport-prosjektet ditt visuelt? Prøv{' '}
          <a href="/planleggere/carport">carportplanleggeren vår</a> for å finne riktig størrelse og
          plassering.
        </P>
      </>
    ),
  },
  {
    id: 'nar-maa-du-soke',
    heading: 'Når må du likevel søke?',
    content: (
      <>
        <P>
          Selv om mange carporten kan bygges uten søknad, finnes det situasjoner som utløser
          søknadsplikt:
        </P>
        <H3>Søknadspliktig uansett</H3>
        <Ul>
          <li>Carport over 50 m² BYA</li>
          <li>Mer enn én etasje eller med kjeller</li>
          <li>Konstruksjonen er koblet til boligen og danner en sammenhengende bygning</li>
          <li>Carport med leilighet eller hybel over</li>
          <li>Tiltaket er i strid med reguleringsplanen</li>
        </Ul>
        <P>
          Er du i tvil, er det alltid lurt å ringe kommunens byggesaksavdeling. En uformell
          forhåndskonferanse er gratis og kan spare deg for både tid og penger.
        </P>
        <P>
          Se også vår guide om <a href="/byggeguider/bod-uten-soknad">bod og uthus uten søknad</a>{' '}
          for tilgrensende regler.
        </P>
      </>
    ),
  },
]

export default function CarportUtenSoknadPage() {
  return (
    <GuideArticleLayout
      slug="carport-uten-soknad"
      readingTime="5 min"
      lead="Kan du bygge carport uten søknad? Her er de vanligste vilkårene, fallgruvene og hva du fortsatt må passe på – selv uten søknadsplikt."
      sections={sections}
    />
  )
}
