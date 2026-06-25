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
          Å bygge terrasse er et av de mest givende prosjektene du kan gjøre selv – resultatet bruker du hver eneste sommer. En standard terrasse på 20–30 m² tar typisk én til to helger for en erfaren gjør-det-selv-er, men planlegg godt og du unngår dyre omveier. Vanskelighetsgrad: middels.
        </P>
        <P>
          Denne guiden tar deg gjennom hele prosessen: fra mål og planlegging, via fundament og bjelkelag, til legging av bord, rekkverk og overflatebehandling. Bruk <a href="/planleggere/terrasse">terrasseplanneren</a> til å beregne materialmengder og dimensjoner før du starter.
        </P>
        <Callout variant="tip" title="Start med planneren">
          Tegn terrassen i <a href="/planleggere/terrasse">terrasseplanneren</a> og print ut materiallisten før du drar på byggvarehandelen. Det sparer deg for minst én ekstratur.
        </Callout>
      </>
    ),
  },
  {
    id: 'planlegging-og-mal',
    heading: 'Planlegging og mål',
    content: (
      <>
        <P>
          Begynn med å markere terrassen på tomten. Bruk hyssing og pinner for å sette opp en nøyaktig rektangel – mål diagonalene og juster til de er like lange (pythagoras-kontroll). Tenk på:
        </P>
        <Ul>
          <li>Avstand fra hus til nabogrense og eiendomsgrense (sjekk kommunens regler)</li>
          <li>Fall bort fra huset – minimum 1:50 (2 cm per meter) for avrenning</li>
          <li>Terrassenivå i forhold til innedørterskel – helst 2–5 cm lavere</li>
          <li>Tilgang for vedlikehold under terrassen</li>
        </Ul>
        <P>
          Husk at terrasser over 0,5 m over bakkenivå kan utløse søknadsplikt. Sjekk med kommunen din hvis du er usikker. En terrasse inntil husveggen og under 15 m² er vanligvis fritatt.
        </P>
        <Callout variant="warn" title="Sjekk tomtegrensene">
          Terrassen skal normalt ikke plasseres nærmere enn 1 m fra nabogrensen uten naboens samtykke. Er du usikker, ta en prat med kommunen før du begynner å grave.
        </Callout>
      </>
    ),
  },
  {
    id: 'materialliste',
    heading: 'Materialliste – eksempel 4×6 m terrasse',
    content: (
      <>
        <P>
          Listen under er et utgangspunkt for en frittliggende terrasse på 24 m². Juster mengdene etter din plantegning fra <a href="/planleggere/terrasse">terrasseplanneren</a>.
        </P>
        <DataTable>
          <caption>Veiledende materialliste – 4×6 m terrasse</caption>
          <thead>
            <tr>
              <th>Materiale</th>
              <th>Dimensjon / type</th>
              <th>Omtrentlig mengde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Punktfundament (betong)</td>
              <td>Ø200 mm rørform, 80 cm dype</td>
              <td>6–9 stk</td>
            </tr>
            <tr>
              <td>Stolper</td>
              <td>Trykkimpregnert 98×98 mm</td>
              <td>6–9 stk, lengde etter høyde</td>
            </tr>
            <tr>
              <td>Hovedbjelker (bærende)</td>
              <td>Trykkimpregnert 48×198 mm</td>
              <td>4 stk à 6 m</td>
            </tr>
            <tr>
              <td>Tverrbjelker (joist)</td>
              <td>Trykkimpregnert 48×148 mm</td>
              <td>13 stk à 4 m, c/c 400 mm</td>
            </tr>
            <tr>
              <td>Terrassebord</td>
              <td>28×120 mm eller 28×145 mm</td>
              <td>Ca. 27 m² (med 5 % kapp)</td>
            </tr>
            <tr>
              <td>Skruer / fester</td>
              <td>A4 rustfri 4,5×70 mm</td>
              <td>Ca. 800 stk</td>
            </tr>
            <tr>
              <td>Stolpesko / beslag</td>
              <td>Justerbare eller faste</td>
              <td>6–9 sett</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Les mer om bjelkedimensjoner og spennvidder i guiden for <a href="/byggeguider/spennvidder-bjelker">spennvidder og bjelkedimensjoner</a>, og om valg av terrassebord i <a href="/byggeguider/terrassebord-guide">terrassebord-guiden</a>.
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
          Fundamentet er det viktigste steget. Velg riktig fundamenttype basert på grunnforhold og terrassens høyde. Les vår oversikt over <a href="/byggeguider/fundamenttyper">fundamenttyper</a> for å velge riktig løsning.
        </P>
        <Ol>
          <li>
            <H3>Marker fundamentpunktene</H3>
            <P>
              Bruk hyssing og snorline til å merke nøyaktig hvor hvert fundament skal stå. Kontroller med diagonal-måling. Punkter plasseres under alle hjørner og under bærende bjelker – typisk c/c 1,5–2,0 m.
            </P>
          </li>
          <li>
            <H3>Grav til frostfri dybde</H3>
            <P>
              I de fleste av Norge kreves det minimum 80–120 cm dybde. Sjekk <a href="/byggeguider/frostfri-dybde">guiden for frostfri dybde</a> for anbefalt dybde i din region. Grav litt dypere enn nødvendig og legg 10–15 cm pukk i bunnen for drenering.
            </P>
          </li>
          <li>
            <H3>Støp punktfundamentene</H3>
            <P>
              Sett ned rørform (papp- eller plastrør, Ø200 mm), blander betong og hell ned. Stikk inn anker- eller stolpeskobolt mens betongen er fersk. La herdes minimum 48 timer – gjerne 5–7 dager – før du belaster. Se detaljert fremgangsmåte i <a href="/byggeguider/stope-punktfundament">guiden for å støpe punktfundament</a>.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Justerbare stolpesko sparer deg for hodebry">
          Bruk <a href="/byggeguider/justerbar-stolpesko">justerbare stolpesko</a> så kan du korrigere opp til 40 mm etter at betongen har herdet. Det gjør det mye enklere å få bjelkelaget i vater.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-2-bjelkelag',
    heading: 'Fase 2 – Bjelkelag og bæring',
    content: (
      <>
        <P>
          Bjelkelaget er skjelettet terrassen hvilerdepå. Riktige dimensjoner er avgjørende for stivhet og levetid. Sjekk anbefalte dimensjoner for din spennvidde i <a href="/byggeguider/spennvidder-bjelker">spennvidde-guiden</a>.
        </P>
        <Ol>
          <li>
            <H3>Monter stolper eller stolpesko</H3>
            <P>
              Sett opp stolpene i stolpeskoene. Bruk et vater på begge sider og stiv av midlertidig med diagonale lekter. Riktig <a href="/byggeguider/stolpeavstand">stolpeavstand</a> er avhengig av bjelkedimensjoner og last.
            </P>
          </li>
          <li>
            <H3>Monter lederbjelke mot hus</H3>
            <P>
              Festes direkte i murverk eller syllstokk med ekspansjonsbolter c/c 600 mm. Legg membranpapp eller butyl-tape mellom bjelke og vegg for å hindre fuktinntrenging. Bjelken skal stå 2–3 cm lavere enn ferdig gulvnivå for å sikre fall.
            </P>
          </li>
          <li>
            <H3>Monter ytterbjelker og bærebjelker</H3>
            <P>
              Sett opp ytterbjelkene (rammen) og kontroller at alt er i vater og i lodd. Fest med beslag i hjørnene. Monter deretter indre tverrbjelker med joist-hangere c/c 400 mm for 28 mm bord, eller c/c 600 mm for 45 mm bord.
            </P>
          </li>
          <li>
            <H3>Kontroller fall og vater</H3>
            <P>
              Juster alle bjelker slik at terrassen faller minimum 1:50 bort fra huset. Bruk et langt vater eller laser-nivå. Et bjelkelag som ikke er i lodd vil gi skjevt liggende bord og problemer med avrenning.
            </P>
          </li>
        </Ol>
        <P>
          Se vår oversikt over <a href="/byggeguider/beslag-oversikt">beslag og innfestinger</a> for å velge riktige konnektorer for din konstruksjon.
        </P>
      </>
    ),
  },
  {
    id: 'fase-3-terrassebord',
    heading: 'Fase 3 – Legge terrassebord',
    content: (
      <>
        <P>
          Bordleggingen er den synlige delen av jobben. Gjøres det riktig, ser terrassen fantastisk ut og varer i mange tiår.
        </P>
        <Ol>
          <li>
            <H3>Velg leggemetode</H3>
            <P>
              Du kan legge bord med synlige skruer ovenfra, eller bruke <a href="/byggeguider/skjult-terrassefeste">skjulte festesystemer</a> (clips) for et renere utseende. Clips er dyrere men gir et vesentlig penere resultat. Les om fordeler og ulemper i <a href="/byggeguider/skjult-terrassefeste">guiden for skjult terrassefeste</a>.
            </P>
          </li>
          <li>
            <H3>Start ved husveggen</H3>
            <P>
              Legg første bord nøyaktig parallelt med veggen og fest det. Mål opp regelmessig for å sikre at bordene holder lik avstand til enden. Sett av 5–6 mm mellomrom mellom hvert bord for drenering (to skruer mellom bordene som avstandsholdere fungerer greit).
            </P>
          </li>
          <li>
            <H3>Skru fast etter anbefalinger</H3>
            <P>
              Bruk alltid A4 rustfrie skruer – aldri galvaniserte på trykkimpregnert tre. Les om riktig skruetype i <a href="/byggeguider/riktig-skrue">guiden for riktig skrue</a>. Skru i en vinkel på 45° fra kanten for best hold og minst sprekking.
            </P>
          </li>
          <li>
            <H3>Kappe kantbord</H3>
            <P>
              Snap en kridtline langs kanten og kappe alle bordene i ett strekk med sirkelsag. Jobb sakte og hold sagen stødig. Monter kantbord (fascia) over enden for et pent avsluttet utseende.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="La treverket akklimatisere">
          Legg terrassebordene løst utendørs et par dager før du fester dem, så de kan ta opp fukt og arbeide seg til lokal luftfuktighet. Det reduserer risikoen for skjevhet etter montering.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-4-rekkverk',
    heading: 'Fase 4 – Rekkverk',
    content: (
      <>
        <P>
          Rekkverk er påkrevd der terrassen er høyere enn 0,5 m over bakkenivå. Sjekk den komplette guiden for <a href="/byggeguider/bygge-rekkverk">å bygge rekkverk</a> for høydekrav, spileavstand og innfestingsmetoder.
        </P>
        <Ol>
          <li>
            <H3>Planlegg rekkverk og inngang</H3>
            <P>
              Bestem plassering av åpning for trapp og sørg for at rekkverksstolpene havner over bjelker – ikke bare i dekket. Stolpene skal inn til bjelke eller monteres utenpå med solide konsollfester.
            </P>
          </li>
          <li>
            <H3>Monter rekkverksstolper</H3>
            <P>
              Stolpene (minimum 70×70 mm) festes med gjennomgående bolt til bjelke, eller med godkjente konsollfester. Test hvert feste ved å dra og riste kraftig – rekkverket skal ikke gi seg.
            </P>
          </li>
          <li>
            <H3>Monter overligger og spiler</H3>
            <P>
              Overligger festes øverst på stolpene. Spiler (33×58 mm) settes inn med maks 10 cm åpning for barnesikkerhet. Fest øverst og nederst – ikke bare på midten.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-5-overflatebehandling',
    heading: 'Fase 5 – Overflatebehandling',
    content: (
      <>
        <P>
          Ny terrasse bør behandles innen de første ukene etter ferdigstillelse for best mulig vern. Les den komplette guiden for <a href="/byggeguider/beise-ny-terrasse">beising av ny terrasse</a> for produktvalg, fremgangsmåte og vedlikeholdsplan.
        </P>
        <Ol>
          <li>
            <H3>Vent på riktig tidspunkt</H3>
            <P>
              Ny trykkimpregnert furu bør tørke 4–8 uker før du overflatebehandler. Termotre og hardtre (Bangkirai, Cumaru) kan behandles etter 2–4 uker. Tre som er lagt i tørt vær tørker raskere.
            </P>
          </li>
          <li>
            <H3>Rens og slip overflaten</H3>
            <P>
              Fei av løst skitt, vask med terrasse-rens og la tørke helt. Slip forsiktig på tvers av kornet med 80-korn papir for å åpne treporene og gi bedre feste for olje eller beis.
            </P>
          </li>
          <li>
            <H3>Påfør første strøk</H3>
            <P>
              Arbeid langs treets korn. Påfør tynt og jevnt. Første strøk trekker dypt inn – la tørke 24 timer og påfør et andre strøk for full beskyttelse. Husk undersiden og endene av alle bord.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Ikke glem undersiden">
          Mye fukt trenger inn nedenfra. Behandle undersiden av alle bord og ender med minst ett strøk endetreolje eller impregneringsmiddel allerede under byggingen – det er mye enklere da enn etterpå.
        </Callout>
      </>
    ),
  },
  {
    id: 'vedlikehold',
    heading: 'Vedlikehold og levetid',
    content: (
      <>
        <P>
          En terrasse som vedlikeholdes riktig holder lett 20–30 år. Nøkkelen er regelmessig overflatebehandling og god drenering under konstruksjonen.
        </P>
        <Ul>
          <li>Sjekk årlig at ingen bord er råtne eller løse – bytt enkeltbord ved behov</li>
          <li>Rens dreneringsspalter mellom bord hvert år for å unngå oppsamling av organisk materiale</li>
          <li>Behandle overflaten hvert 2.–3. år avhengig av eksponering og produkt</li>
          <li>Kontroller innfestingen av rekkverk hvert år</li>
          <li>Hold vegetasjon unna – planter mot treverket holder det fuktig</li>
        </Ul>
        <P>
          Med god planlegging fra starten og riktig vedlikehold underveis vil terrassen din være et sted du er stolt av – sesong etter sesong. Lykke til med byggingen!
        </P>
      </>
    ),
  },
]

export default function ByggeTerrassePage() {
  return (
    <GuideArticleLayout
      slug="bygge-terrasse"
      readingTime="12 min"
      lead="Komplett guide til å bygge terrasse selv – fra planlegging og fundament til bjelkelag, terrassebord, rekkverk og overflatebehandling."
      sections={sections}
    />
  )
}
