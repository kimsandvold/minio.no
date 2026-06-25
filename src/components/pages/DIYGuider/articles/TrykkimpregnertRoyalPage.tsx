import GuideArticleLayout, {
  Callout,
  DataTable,
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
          Begge er furu som er presset full av impregneringsmiddel for å tåle å stå ute. Forskjellen
          er enkel: <strong>trykkimpregnert</strong> er den klassiske grønnlige (eller brune) typen
          som må tørke og etterbehandles. <strong>Royalimpregnert</strong> er trykkimpregnert som i
          tillegg er kokt i olje – det gir en ferdig brun farge, mindre sprekk og mindre vedlikehold,
          men koster mer.
        </P>
        <Callout variant="tip" title="Skal du velge raskt?">
          Til en terrasse du vil ha minst mulig styr med: <strong>royal</strong>. Til bærende
          konstruksjon, stolper i bakken og det som ikke synes:{' '}
          <strong>vanlig trykkimpregnert</strong>.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-trykkimpregnert',
    heading: 'Hva er trykkimpregnert?',
    content: (
      <>
        <P>
          Trelasten legges i en trykktank der impregneringsmiddel – i dag stort sett kobberbasert –
          presses inn i veden. Det er dette som beskytter mot råte og sopp, og som gjør at materialet
          kan stå ute i mange år. Fersk trykkimpregnert er ofte fuktig og litt grønn i tonen, og bør
          tørke før du beiser eller oljer den.
        </P>
        <P>
          Trykkimpregnert deles inn i <strong>klasser</strong> etter hvor utsatt materialet er. Du
          trenger ikke pugge dem, men det er greit å kjenne hovedskillet:
        </P>
        <DataTable>
          <caption>Impregneringsklasser – forenklet</caption>
          <thead>
            <tr>
              <th>Klasse</th>
              <th>Brukes til</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>AB / klasse 3</td>
              <td>Over bakken: terrassebord, kledning, rekkverk</td>
            </tr>
            <tr>
              <td>A / klasse 4</td>
              <td>I kontakt med jord og vann: stolper, bjelker mot bakken</td>
            </tr>
            <tr>
              <td>M / klasse A</td>
              <td>Ekstra utsatt: brygger, stolper i sjø</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Stolper i bakken trenger sterkere klasse">
          Bruker du terrassebord-kvalitet (klasse 3) til noe som står nede i jorda, råtner det
          raskere enn du tror. Velg klasse 4 til alt som har kontakt med bakken.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-royal',
    heading: 'Hva er royalimpregnert?',
    content: (
      <>
        <P>
          Royalimpregnert starter som vanlig trykkimpregnert, men får en runde til: materialet kokes
          i linolje under vakuum. Oljen fyller veden, presser ut vann og gir en gjennomfarget brun
          (eller gråbrun/sort) overflate. Resultatet er et bord som er mer formstabilt, sprekker
          mindre og er nesten vedlikeholdsfritt de første årene.
        </P>
        <P>
          Til gjengjeld koster royal mer per meter, og fargen gråner den også med tiden hvis du ikke
          frisker den opp. Det er ikke «vedlikeholdsfritt for alltid» – det er «mindre vedlikehold,
          lenger».
        </P>
      </>
    ),
  },
  {
    id: 'sammenligning',
    heading: 'Direkte sammenligning',
    content: (
      <DataTable>
        <caption>Trykkimpregnert vs. royalimpregnert</caption>
        <thead>
          <tr>
            <th></th>
            <th>Trykkimpregnert</th>
            <th>Royalimpregnert</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Farge</td>
            <td>Grønnlig / brun, ujevn</td>
            <td>Gjennomfarget brun, jevn</td>
          </tr>
          <tr>
            <td>Pris</td>
            <td>Lavest</td>
            <td>20–40 % dyrere</td>
          </tr>
          <tr>
            <td>Vedlikehold</td>
            <td>Bør oljes/beises jevnlig</td>
            <td>Lite de første årene</td>
          </tr>
          <tr>
            <td>Sprekk og kuving</td>
            <td>Mer</td>
            <td>Mindre</td>
          </tr>
          <tr>
            <td>Klar til bruk</td>
            <td>Bør tørke først</td>
            <td>Ja</td>
          </tr>
          <tr>
            <td>Best til</td>
            <td>Bæring, stolper, skjult virke</td>
            <td>Terrasse, levegg, det synlige</td>
          </tr>
        </tbody>
      </DataTable>
    ),
  },
  {
    id: 'hva-bor-du-velge',
    heading: 'Hva bør du velge?',
    content: (
      <>
        <Ul>
          <li>
            <strong>Terrassegulv og levegg du ser hver dag:</strong> royal gir finest resultat med
            minst innsats.
          </li>
          <li>
            <strong>Bærebjelker, stolper og det under terrassen:</strong> vanlig trykkimpregnert i
            riktig klasse – ingen grunn til å betale for farge ingen ser.
          </li>
          <li>
            <strong>Stramt budsjett:</strong> trykkimpregnert + en runde olje gir deg langt på vei
            samme beskyttelse for mindre penger.
          </li>
        </Ul>
        <Callout variant="tip" title="Du kan blande">
          Det vanligste er nettopp å blande: royal på dekket og rekkverket, billig trykkimpregnert i
          understellet. Da bruker du pengene der de synes.
        </Callout>
        <P>
          Skal du regne ut hvor mye du trenger av hver type, kan du sette opp prosjektet i{' '}
          <a href="/planleggere/terrasse">terrasseplanleggeren</a> og få en materialliste å ta med på
          byggevarehuset.
        </P>
      </>
    ),
  },
]

export default function TrykkimpregnertRoyalPage() {
  return (
    <GuideArticleLayout
      slug="trykkimpregnert-vs-royalimpregnert"
      readingTime="5 min"
      lead="Trykkimpregnert eller royalimpregnert? Forskjellen forklart – og hva du bør velge til terrasse, levegg eller platting."
      sections={sections}
    />
  )
}
