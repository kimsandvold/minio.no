import GuideArticleLayout, {
  Callout,
  DataTable,
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
          En carport er et av de mer krevende gjør-det-selv-prosjektene, men absolutt gjennomførbart for en strukturert bygger. En standard carport for én bil (3×5 m) tar typisk to til tre helger. Vanskelighetsgrad: middels til høy, særlig på grunn av takkonstruksjonen og behov for korrekte dimensjoner.
        </P>
        <P>
          Denne guiden dekker alt fra regelverk og fundament til stolper, bæredragere, takkonstruksjon og taktekking. Bruk <a href="/planleggere/carport">carportplanneren</a> for å beregne dimensjoner og materialmengder for akkurat din situasjon.
        </P>
        <Callout variant="tip" title="Sjekk reglene først">
          Les <a href="/byggeguider/carport-uten-soknad">guiden om carport uten søknad</a> før du begynner. En carport kan være søknadsfri under visse forutsetninger – men det er viktig å kjenne grensene.
        </Callout>
      </>
    ),
  },
  {
    id: 'regelverk',
    heading: 'Regelverk og søknadsplikt',
    content: (
      <>
        <P>
          En carport kan i mange tilfeller bygges uten søknad, men det avhenger av størrelse, plassering og kommunens reguleringsplan. Generelle tommelfingerregler:
        </P>
        <Ul>
          <li>Maksimalt 50 m² bebygd areal og 70 m² bruksareal (BRA) totalt for frittliggende bygg</li>
          <li>Maks mønehøyde 4 m og gesimshøyde 3 m</li>
          <li>Minimum 1 m fra nabogrense (noen kommuner krever mer)</li>
          <li>Ikke i strid med reguleringsplan eller kommuneplan</li>
        </Ul>
        <P>
          Se detaljene i <a href="/byggeguider/carport-uten-soknad">guiden om carport uten søknad</a>. Er du i tvil, kontakt kommunen – det er gratis og tar bare noen minutter.
        </P>
        <Callout variant="warn" title="Sjekk alltid kommunens regler">
          Regelverket varierer mellom kommuner. Det å bygge uten å ha rett til det kan koste deg dyrt – kommunen kan kreve riving eller lovlighetssøknad.
        </Callout>
      </>
    ),
  },
  {
    id: 'materialliste',
    heading: 'Materialliste – 3×6 m carport',
    content: (
      <>
        <DataTable>
          <caption>Veiledende materialliste – carport for én bil, 3×6 m</caption>
          <thead>
            <tr>
              <th>Materiale</th>
              <th>Dimensjon / type</th>
              <th>Mengde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Stolper</td>
              <td>Trykkimpregnert 98×98 mm</td>
              <td>4–6 stk, lengde etter høyde</td>
            </tr>
            <tr>
              <td>Bæredragere (lengde)</td>
              <td>Trykkimpregnert 48×198 mm</td>
              <td>2 stk à 6 m</td>
            </tr>
            <tr>
              <td>Taksperrer</td>
              <td>Trykkimpregnert 48×148 mm</td>
              <td>7 stk à 3,5 m, c/c 900 mm</td>
            </tr>
            <tr>
              <td>Takplater (polykarbonat)</td>
              <td>10 mm, 2100 mm bred</td>
              <td>Ca. 20 m²</td>
            </tr>
            <tr>
              <td>Punktfundament</td>
              <td>Ø200 mm, 80–120 cm dype</td>
              <td>4–6 stk</td>
            </tr>
            <tr>
              <td>Stolpesko, beslag</td>
              <td>Justerbare til 98 mm</td>
              <td>4–6 sett</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Juster mengdene etter din carports mål ved hjelp av <a href="/planleggere/carport">carportplanneren</a>. Husk å legge til 10 % for kapp og svinn.
        </P>
      </>
    ),
  },
  {
    id: 'fase-1-fundament',
    heading: 'Fase 1 – Fundament',
    content: (
      <>
        <P>
          En carport er tyngre enn en pergola og mer utsatt for vindlast. Fundamente ntes riktig fra starten av.
        </P>
        <Ol>
          <li>
            <H3>Marker stolpepunktene</H3>
            <P>
              Bruk hyssing og mål diagonalene for å sikre rett vinkel. For en carport inntil hus eller garasjevegg er det ofte naturlig å la én side hvile mot eksisterende konstruksjon. Sjekk anbefalte <a href="/byggeguider/stolpeavstand">stolpeavstander</a> for din bjelkedimensjon.
            </P>
          </li>
          <li>
            <H3>Grav til frostfri dybde</H3>
            <P>
              Carporter er utsatt for store snølaster og vindkrefter. Grav minimum til frostfri dybde for din region – i innlandet gjerne 120 cm. Legg 15 cm pukk i bunnen for drenering. Se <a href="/byggeguider/frostfri-dybde">guiden om frostfri dybde</a> for din sone.
            </P>
          </li>
          <li>
            <H3>Støp og monter stolpesko</H3>
            <P>
              Bruk pappformer Ø200 mm. Bland betong og støp. Sett inn ankerbolter eller gjennomgående stålrør mens betongen er fersk – sjekk at de peker rett opp. La herdes 5–7 dager. Monter <a href="/byggeguider/justerbar-stolpesko">justerbare stolpesko</a> på boltene.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-2-stolper',
    heading: 'Fase 2 – Stolper',
    content: (
      <>
        <P>
          Stolpene til en carport bærer snø, vind og egenvekt. Velg minimum 98×98 mm trykkimpregnert furu, og vurder 120×120 mm for store spennvidder eller høy snølast-region.
        </P>
        <Ol>
          <li>
            <H3>Kapp og behandle stolpene</H3>
            <P>
              Kappe stolpene til riktig høyde. Behandle kappkantene umiddelbart med endetreolje. Avfas toppen (45° kapp på alle fire sider) for å lede vann bort.
            </P>
          </li>
          <li>
            <H3>Sett stolpene i lodd</H3>
            <P>
              Sett stolpene i stolpeskoene og kontroller lodd i to retninger. Stiv av med diagonale lekter til dragerne er montert og konstruksjonen er selvstendig stiv.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-3-dragere',
    heading: 'Fase 3 – Bæredragere',
    content: (
      <>
        <P>
          Bæredragerne (de lengdegående bjelkene) overfører lasten fra taksperrene til stolpene. Dimensjoner er avhengig av spennvidde og snølast – bruk tabellen i <a href="/byggeguider/spennvidder-bjelker">spennvidde-guiden</a>.
        </P>
        <Ol>
          <li>
            <H3>Løft dragerne på plass</H3>
            <P>
              Dette er en jobb for minst to personer – gjerne tre. Bruk stillas eller støtteben for å holde dragerne på riktig høyde mens du fester. Dragerne legges utenpå stolpene med et overstander-utstikk på 30–50 cm i hver ende.
            </P>
          </li>
          <li>
            <H3>Fest med gjennomgående bolter</H3>
            <P>
              Bruk M12 bolter gjennom drager og stolpe. Legg en skive mot treverket på begge sider. To bolter per stolpetilkobling gir god motstand mot rotasjon. Sjekk <a href="/byggeguider/beslag-oversikt">beslag-oversikten</a> for godkjente alternativer.
            </P>
          </li>
          <li>
            <H3>Kontroller at dragerne er i vater</H3>
            <P>
              Lagre all fall i takkonstruksjonen – dragerne skal ideelt stå i vater. Bruk justerbare stolpesko til fininnstilling.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-4-tak',
    heading: 'Fase 4 – Takkonstruksjon',
    content: (
      <>
        <P>
          Taket er det mest teknisk krevende steget. Carporter har vanligvis pulttak (ensidig fall) med 5–15° helning, noe som gjør konstruksjonen relativt enkel.
        </P>
        <Ol>
          <li>
            <H3>Bestem takfall og høydeforskjell</H3>
            <P>
              Et takfall på minimum 5° (ca. 8,7 cm fall per meter) er nødvendig for polykarbonat- og stålplater. For profilert stål anbefales minimum 7°. Høydeforskjellen mellom fremre og bakre drager skaper dette fallet – monter bakre drager høyere enn fremre.
            </P>
          </li>
          <li>
            <H3>Monter taksperrer</H3>
            <P>
              Taksperrene (48×148 mm) festes med joist-hangere på dragerne c/c 900 mm for standard takplater. Sørg for at alle sperrer stikker like langt ut i fronten for et pent avsluttet utseende.
            </P>
          </li>
          <li>
            <H3>Monter åser om nødvendig</H3>
            <P>
              For lange spennvidder kan du legge åser tverrgående under taksperrene som ekstra bærestøtte. Særlig aktuelt ved stor snølast.
            </P>
          </li>
        </Ol>
        <Callout variant="warn" title="Dimensjonering for snølast">
          En carport med snøbelastning på 3,0 kN/m² (typisk østnorsk innland) og 3×6 m spennvidde har en totalsnølast på over ett tonn. Undervis dimensjoner for din region – bruk gjerne en konstruktør for store spennvidder.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-5-taktekking',
    heading: 'Fase 5 – Taktekking og avrenning',
    content: (
      <>
        <P>
          Polykarbonat er det mest populære valget for carporter – det slipper inn lys, er lettvektig og enkelt å montere. Profilert stål eller aluminiumsplater er mer robuste men blokkerer lyset.
        </P>
        <Ol>
          <li>
            <H3>Monter takplater</H3>
            <P>
              Legg platene med fallet. Polykarbonat-plater skal alltid ha kanalprofilen vertikalt (langs fallet) for å drenere vann. Bruk spesialskruer med tetningsskive og forhåndsborr alltid – polykarbonat sprekker uten.
            </P>
          </li>
          <li>
            <H3>Overlapp og tetting</H3>
            <P>
              Overlapp plater minimum 200 mm i lengderetning og ett bølge-/ribbe-bredde i bredderetning. Tett enden av polykarbonatprofiler med aluminiumsende-profil eller spesialtape for å hindre smuss og insekter.
            </P>
          </li>
          <li>
            <H3>Monter takrenne og nedløp</H3>
            <P>
              Installer takrenne langs den lave kanten med fall mot nedløp (minimum 1:200 – ca. 5 mm per meter). Led avrenningsvann vekk fra fundament og kjøreunderlag. Unngå å lede det direkte mot nabogrensen.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Overstanderseffekt på taksperrene">
          La taksperrene stikke 40–60 cm ut foran fremre drager. Det gir bedre regnskjerming av bilen og et arkitektonisk penere utseende.
        </Callout>
      </>
    ),
  },
  {
    id: 'finish',
    heading: 'Finish og vedlikehold',
    content: (
      <>
        <P>
          Carporter krever relativt lite vedlikehold, men jevnlig sjekk forlenger levetiden betraktelig.
        </P>
        <Ul>
          <li>Kontroller bolter og fester årlig og stram til ved behov</li>
          <li>Rens takrenne og nedløp vår og høst</li>
          <li>Vask polykarbonatplater med mildt såpevann – aldri løsemidler</li>
          <li>Behandle treoverflater hvert 2.–3. år</li>
          <li>Inspiser fundamenter for tegn på ujevn setning eller frosthev</li>
        </Ul>
        <P>
          En solid carport gir bilen din god beskyttelse og kan enkelt bygges ut med sidevegger eller port i ettertid. God byggelykke!
        </P>
      </>
    ),
  },
]

export default function ByggeCarportPage() {
  return (
    <GuideArticleLayout
      slug="bygge-carport"
      readingTime="10 min"
      lead="Komplett guide til å bygge carport selv – regelverk, fundament, stolper, bæredragere, takkonstruksjon og taktekking steg for steg."
      sections={sections}
    />
  )
}
