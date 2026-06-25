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
          En pergola er en åpen trekonstruksjon som gir skygge og struktur i hagen – og er overraskende enkel å bygge selv. En standard pergola på 3×4 m tar én til to helger for én til to personer. Vanskelighetsgrad: middels, men krever nøyaktighet ved fundamentering og avstiving.
        </P>
        <P>
          Denne guiden tar deg gjennom hele prosessen: fra planlegging og valg av fundament, via stolper og dragere, til taksperrer og overflatebehandling. Bruk <a href="/planleggere/pergola">pergolaplanneren</a> for å beregne dimensjoner og materialmengder.
        </P>
        <Callout variant="tip" title="Tegn opp i planneren først">
          Bruk <a href="/planleggere/pergola">pergolaplanneren</a> til å finne riktige dimensjoner og materialmengder for akkurat din pergola – det tar bare noen minutter og sparer deg for unødige feil.
        </Callout>
      </>
    ),
  },
  {
    id: 'planlegging',
    heading: 'Planlegging og regelverk',
    content: (
      <>
        <P>
          En pergola er i utgangspunktet søknadsfri dersom den er åpen (uten tak eller med åpen spilekonstruksjon) og ikke for stor. Lukkes den med tak og vegger, kan det utløse søknadsplikt – sjekk med kommunen din. For pergola inntil husveggen gjelder andre regler enn for frittstående.
        </P>
        <P>
          Tenk gjennom disse spørsmålene i planleggingsfasen:
        </P>
        <Ul>
          <li>Skal pergoloen stå frittstående eller festes mot husveggen?</li>
          <li>Ønsker du åpen spilekonstruksjon oppe, eller tett tak med takplater?</li>
          <li>Hvilke dimensjoner passer i hagen og gir riktig skygge?</li>
          <li>Skal klatreplanter vokse opp langs konstruksjonen?</li>
        </Ul>
      </>
    ),
  },
  {
    id: 'materialliste',
    heading: 'Materialliste – eksempel 3×4 m pergola',
    content: (
      <>
        <DataTable>
          <caption>Veiledende materialliste – frittstående pergola 3×4 m</caption>
          <thead>
            <tr>
              <th>Materiale</th>
              <th>Dimensjon</th>
              <th>Mengde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Stolper</td>
              <td>Trykkimpregnert 98×98 mm</td>
              <td>4 stk, lengde etter høyde</td>
            </tr>
            <tr>
              <td>Dragere (lengderetning)</td>
              <td>Trykkimpregnert 48×198 mm</td>
              <td>2 stk à 4 m</td>
            </tr>
            <tr>
              <td>Taksperrer/tverrgående bjelker</td>
              <td>Trykkimpregnert 48×148 mm</td>
              <td>5 stk à 3 m, c/c 600 mm</td>
            </tr>
            <tr>
              <td>Spiler (dekorativt oppe)</td>
              <td>28×70 mm, høvlet</td>
              <td>Ca. 15 stk à 4 m</td>
            </tr>
            <tr>
              <td>Justerbare stolpesko</td>
              <td>Til 98 mm stolpe</td>
              <td>4 sett</td>
            </tr>
            <tr>
              <td>Skruer og beslag</td>
              <td>A4 rustfri</td>
              <td>Assortert</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'fase-1-fundament',
    heading: 'Fase 1 – Fundament og stolpesko',
    content: (
      <>
        <P>
          Fundamentet holder stolpene i lodd og mot frosthev. For en pergola er punktfundament i betong med justerbare stolpesko den vanligste løsningen – det er raskt, pent og enkelt å justere.
        </P>
        <Ol>
          <li>
            <H3>Marker stolpepunktene nøyaktig</H3>
            <P>
              Stikk opp hyssing og mål diagonalene for å sikre at alle fire hjørner er rett vinkel. Korrekt plassering her sparer deg for mye frustrasjon seinere. Bruk vater og lodd for å sjekke.
            </P>
          </li>
          <li>
            <H3>Grav og støp punktfundament</H3>
            <P>
              Grav ned til frostfri dybde (minst 80 cm i de fleste av landet). Legg 10–15 cm pukk i bunnen. Bruk Ø200 mm pappform, bland betong og støp til ca. 10 cm over bakkenivå. Sett inn ankerbolt mens betongen er fersk. La herdes 48 timer minimum.
            </P>
          </li>
          <li>
            <H3>Monter justerbare stolpesko</H3>
            <P>
              Bruk <a href="/byggeguider/justerbar-stolpesko">justerbare stolpesko</a> som lar deg flytte stolpen opp til 40 mm etter at betongen har herdet. Det gjør det mye enklere å stille alle fire stolpene i nøyaktig samme høyde. Se veiledning i <a href="/byggeguider/stolpeavstand">stolpeavstand-guiden</a> for plassering.
            </P>
          </li>
        </Ol>
        <Callout variant="warn" title="Ikke gå på betongen for tidlig">
          Vent minimum 48 timer – helst 5–7 dager – før du belaster fundamentet med vekt fra stolper og konstruksjon. Herder betongen i kaldt vær, øk ventetiden.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-2-stolper',
    heading: 'Fase 2 – Stolper',
    content: (
      <>
        <P>
          Stolpene bærer hele konstruksjonen. De må stå i lodd og festes sikkert i fundamentet.
        </P>
        <Ol>
          <li>
            <H3>Kapp stolpene til riktig lengde</H3>
            <P>
              Ønsket høyde på pergoloen er typisk 2,2–2,5 m i underkant av drageren. Legg til stolpeskoens høyde og kapp alle stolpene like lange. Det er lettere å kapse toppen etter montering enn å prøve å få dem nøyaktig riktige på forhånd.
            </P>
          </li>
          <li>
            <H3>Sett stolpene i lodd og stiv av midlertidig</H3>
            <P>
              Sett én stolpe i skoene, kontroller med vater i to retninger og stiv av med midlertidige diagonale lekter. Gjenta for alle fire stolper. Ikke fjern avkivingen før dragerne er montert.
            </P>
          </li>
          <li>
            <H3>Finjuster med justerbare sko</H3>
            <P>
              Bruk justeringen i stolpeskoene til å stille alle stolpetoppene til nøyaktig samme høyde. En langslekt (bred lekt) lagt på tvers over to stolper og et vater er et enkelt kontrollverktøy.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-3-dragere',
    heading: 'Fase 3 – Dragere',
    content: (
      <>
        <P>
          Dragerne er de lengdegående bjelkene som hviler på stolpene og bærer taksperrene. De monteres utenpå stolpene med gjennomgående bolter eller hjørnefester.
        </P>
        <Ol>
          <li>
            <H3>Løft dragerne på plass</H3>
            <P>
              To personer gjør dette mye enklere. Legg dragerne i ønsket posisjon på stolpene – enten på toppen eller litt ned fra toppen for et rammende utseende. Merk og kontroller at dragerne stikker like langt ut på begge sider (estetisk overstanderseffekt).
            </P>
          </li>
          <li>
            <H3>Fest med gjennomgående bolter</H3>
            <P>
              Bruk M12 gjennomgående bolter med skiver på begge sider. Bore rett gjennom drager og stolpe. Trekk til godt, men ikke så hardt at treverket knuses. Sjekk <a href="/byggeguider/beslag-oversikt">beslag-oversikten</a> for alternativer.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-4-taksperrer',
    heading: 'Fase 4 – Taksperrer og spiler',
    content: (
      <>
        <P>
          Taksperrene er de tverrgående bjelkene som gir pergoloen det karakteristiske gitterutseendet og skaper skygge. Over taksperrene kan du legge dekorative spiler for mer skygge og en enda vakrere konstruksjon.
        </P>
        <Ol>
          <li>
            <H3>Marker og sett opp taksperrene</H3>
            <P>
              Del opp mellomrommet jevnt – c/c 500–700 mm er vanlig. Marker plasseringen med blyant på dragerne. Taksperrene kan enten hvile i utsparinger (hakk) i dragerne, eller festes med joist-hangere. Hakk-metoden ser penere ut.
            </P>
          </li>
          <li>
            <H3>Skjær hakk i dragerne (valgfritt)</H3>
            <P>
              Hakk ca. 1/3 dypt inn i drageren (ikke mer – det svekker drageren). En kombinasjon av sirkelsag og stemmejern gir rene kanter. Pass på at alle hakk er like dype.
            </P>
          </li>
          <li>
            <H3>Legg spiler over taksperrene</H3>
            <P>
              Smale spiler (28×70 mm) lagt diagonalt eller rett over taksperrene gir et ekstra sjikt med skygge og et dekorativt preg. Fest med én skrue i hvert krysningspunkt.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Profil-kapping på endene">
          Kappe en buet eller skrå profil på endene av dragere og taksperrer (dekorativt avkapp) er en enkel måte å løfte det visuelle uttrykket på. En mal av papp gjør det enkelt å holde formen lik på alle.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-5-avstiving',
    heading: 'Fase 5 – Avstiving og stabilisering',
    content: (
      <>
        <P>
          En pergola uten god avstiving vil rakle i vinden. Diagonale stag eller fasade-kledning på sidene er de vanligste løsningene.
        </P>
        <Ul>
          <li>Diagonale stag (48×98 mm) mellom stolpe og drager i 45° gir god stivhet og ser dekorativt ut</li>
          <li>Halvpaneler eller spiler på sidene gir både stabilitet og le mot vind</li>
          <li>Festes pergoloen mot husveggen, gir dette naturlig stivhet i én retning</li>
        </Ul>
        <P>
          Hvis pergoloen festes til husveggen, se veiledning for innfesting i teglstein eller bindingsverk i <a href="/byggeguider/beslag-oversikt">beslag-oversikten</a>.
        </P>
      </>
    ),
  },
  {
    id: 'overflatebehandling',
    heading: 'Overflatebehandling og finish',
    content: (
      <>
        <P>
          En pergola er eksponert for vær og vind fra alle kanter. God overflatebehandling er avgjørende for levetiden.
        </P>
        <Ul>
          <li>Trykkimpregnert tre: la tørke 4–8 uker, deretter olje eller beis</li>
          <li>Behandle alle kappkanter med endetreolje umiddelbart etter kapping</li>
          <li>Et første strøk under monteringen – og et andre strøk etter ferdigstillelse</li>
          <li>Behandle på nytt hvert 2.–3. år for full beskyttelse</li>
        </Ul>
        <P>
          Med riktig fundament, god konstruksjon og jevnlig vedlikehold vil pergoloen din bli et populært samlingspunkt i hagen. Lykke til!
        </P>
      </>
    ),
  },
]

export default function ByggePergolaPage() {
  return (
    <GuideArticleLayout
      slug="bygge-pergola"
      readingTime="10 min"
      lead="Steg-for-steg guide til å bygge pergola selv – fra fundament og stolper til dragere, taksperrer og overflatebehandling."
      sections={sections}
    />
  )
}
