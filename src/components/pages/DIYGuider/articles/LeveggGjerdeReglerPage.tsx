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
          En levegg inntil ca. 1,8 m høy og begrenset lengde kan i mange tilfeller settes opp
          uten søknad. Vanlige gjerder langs nabogrensen eller mot vei er også som regel søknadsfrie,
          så lenge de ikke er for høye. Det er imidlertid viktig å skille mellom levegg, gjerde og
          støyskjerm – de behandles ulikt i regelverket.
        </P>
        <Callout variant="tip" title="Tommelfingerregel">
          Levegg inntil 1,8 m høy og maks 10 m lang = som regel søknadsfri (forutsatt riktig
          plassering). Gjerde langs vei/nabo: normalt søknadsfritt opp til 1,8 m. Sjekk alltid
          reguleringsplan.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-hva',
    heading: 'Levegg, gjerde og støyskjerm – hva er forskjellen?',
    content: (
      <>
        <P>
          Begrepene brukes om hverandre i dagligtalen, men i byggesakssammenheng er det
          viktige forskjeller:
        </P>
        <H3>Levegg</H3>
        <P>
          En levegg er en frittstående vegg eller skjerm som primært brukes for å gi ly, skape
          privatsone eller avskjerme fra innsyn. Den er typisk tett (kledning, plater) og kan
          plasseres i eller nær nabogrensen. En levegg regnes som et bygningsteknisk tiltak og er
          underlagt plan- og bygningsloven.
        </P>
        <H3>Gjerde</H3>
        <P>
          Et gjerde er et innhegningsanlegg som markerer grenser, typisk mer åpent enn en levegg
          (flettverksgjerde, stakittgjerde, bøkehekk er ikke gjerde i lovens forstand). Enkle
          gjerder langs vei og nabogrense er som regel søknadsfrie opp til en viss høyde.
        </P>
        <H3>Støyskjerm</H3>
        <P>
          En støyskjerm er et tettere og høyere anlegg beregnet for å dempe trafikk- eller
          industristøy. Disse er nesten alltid søknadspliktige og krever i mange tilfeller
          godkjenning fra vei- eller jernbanemyndigheter.
        </P>
      </>
    ),
  },
  {
    id: 'levegg-uten-soknad',
    heading: 'Levegg uten søknad – vilkår',
    content: (
      <>
        <P>
          SAK10 § 4-1 bokstav f angir at levegg kan være unntatt søknadsplikt dersom visse
          betingelser er oppfylt. Per 2026 er det vanlige utgangspunktet:
        </P>
        <Ul>
          <li>Høyde inntil 1,8 m</li>
          <li>Lengde inntil 10 m ved nabogrense, eller inntil 5 m ved eller i nabogrense</li>
          <li>Leveggen er ikke i strid med reguleringsplanen</li>
          <li>
            Den plasseres inntil 1 m fra nabogrense (kan settes i grensen dersom lengde ikke
            overstiger 5 m, i mange kommuner)
          </li>
        </Ul>
        <P>
          Kombinasjoner av levegg med tak, åpne sider eller integrering i andre konstruksjoner kan
          endre vurderingen og utløse søknadsplikt. Er du usikker, ta kontakt med kommunen.
        </P>
        <Callout variant="warn" title="Sjekk med kommunen">
          Regelverket for levegg er komplekst og tolkes forskjellig av kommunene. Reguleringsplanen
          kan sette strengere høyde- eller lengdekrav. Verifiser alltid tiltaket ditt hos kommunens
          byggesaksavdeling eller på{' '}
          <a href="https://dibk.no" target="_blank" rel="noopener noreferrer">
            dibk.no
          </a>{' '}
          før du bygger.
        </Callout>
      </>
    ),
  },
  {
    id: 'gjerde-uten-soknad',
    heading: 'Gjerde uten søknad',
    content: (
      <>
        <P>
          Vanlige gjerder (flettverksgjerde, stakitt, bord-på-bord) langs nabogrense eller mot
          vei er i utgangspunktet søknadsfrie, forutsatt at:
        </P>
        <Ul>
          <li>Gjerdet ikke er for høyt – normalt opp til 1,5–1,8 m (kommunen avgjør)</li>
          <li>Det ikke blokkerer sikt i frisiktsoner ved vei, avkjørsler og kryss</li>
          <li>Tiltaket ikke er i strid med reguleringsplan</li>
        </Ul>
        <P>
          Grannelova (lov om grannehegn) regulerer forholdet mellom naboer om hva slags hegn som
          kan settes opp, og kan gi nabo rett til å kreve fjerning dersom gjerdet er unødig
          sjenerende. Dette er en privatrettslig lov uavhengig av plan- og bygningsloven.
        </P>
      </>
    ),
  },
  {
    id: 'avstand-og-plassering',
    heading: 'Avstand og plassering',
    content: (
      <>
        <DataTable>
          <caption>Typiske regler for levegg og gjerde (per 2026, generell veiledning)</caption>
          <thead>
            <tr>
              <th>Tiltak</th>
              <th>Vanlig høydegrense</th>
              <th>Avstand til grense</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Levegg (søknadsfri)</td>
              <td>Maks 1,8 m</td>
              <td>Kan plasseres i grense ved maks 5 m lengde</td>
            </tr>
            <tr>
              <td>Gjerde mot nabo/vei (søknadsfri)</td>
              <td>Normalt inntil 1,5–1,8 m</td>
              <td>I grensen tillatt</td>
            </tr>
            <tr>
              <td>Støyskjerm</td>
              <td>Over 1,8 m = nesten alltid søknadspliktig</td>
              <td>Avhenger av søknad og tillatelse</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Les mer om de generelle avstandskravene i vår guide om{' '}
          <a href="/byggeguider/avstand-til-nabogrense">avstand til nabogrense</a>.
        </P>
      </>
    ),
  },
  {
    id: 'praktiske-tips',
    heading: 'Praktiske tips',
    content: (
      <>
        <H3>Dialog med naboen</H3>
        <P>
          Selv om en levegg er søknadsfri, er det lurt å informere naboen om planene dine på
          forhånd. En levegg som kaster skygge på naboens hage eller blokkerer utsikten kan skape
          konflikter selv om den er lovlig. Tidlig dialog kan spare deg for mye bry.
        </P>
        <H3>Siktlinjer ved avkjørsel og vei</H3>
        <P>
          Husk at både gjerde og levegg ikke kan plasseres i frisiktsoner ved vei, avkjørsel og
          gangveier. Kommunen og Statens vegvesen har egne krav til fri sikt i disse sonene. Er du
          i tvil, mål opp siktlinjene eller kontakt kommunen.
        </P>
        <H3>Vedlikehold og varighetsansvar</H3>
        <P>
          Du er ansvarlig for at leveggen og gjerdet holdes i forsvarlig stand. Konstruksjoner
          som forfaller og utgjør en fare, kan kommunen pålegge deg å utbedre eller rive.
        </P>
        <Ul>
          <li>Bruk trykkimpregnert eller overflatebehandlet trevirke for lang levetid</li>
          <li>
            Sett fundament/stolper dypt nok (under frostfri dybde) for å unngå setninger
          </li>
          <li>Vurder å bruke justerbare stolpesko for enklere montering</li>
        </Ul>
      </>
    ),
  },
]

export default function LeveggGjerdeReglerPage() {
  return (
    <GuideArticleLayout
      slug="levegg-gjerde-regler"
      readingTime="5 min"
      lead="Hva er forskjellen på levegg og gjerde – og når trenger du søknad? Her er en oversikt over vanlige regler for innhegning og avskjerming på privat tomt."
      sections={sections}
    />
  )
}
