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
          En terrasse som vedlikeholdes jevnlig holder seg pen og sterk i mange år lenger enn en
          som får stå urørt. Grunnrutinen er enkel: vask om våren, inspiser skruer og beslag,
          og behandle overflaten på nytt hvert 2–4 år avhengig av produkt og eksponering.
        </P>
        <P>
          Det viktigste er å fange opp råte, løse skruer og skader tidlig – da er det raskt
          og billig å utbedre.
        </P>
        <Callout variant="tip" title="Start sesongen riktig">
          Bruk litt tid på terrassen i april–mai. En grundig vask og rask inspeksjon tar
          en ettermiddag og forebygger dyre reparasjoner.
        </Callout>
      </>
    ),
  },
  {
    id: 'arlig-rutine',
    heading: 'Den årlige vedlikeholdsrutinen',
    content: (
      <>
        <P>
          Disse oppgavene bør du gjøre én gang i året, helst tidlig på våren etter at frosten
          har gitt seg:
        </P>
        <Ul>
          <li>Fei og spyl terrassen ren for vintersmuss, mose og løv</li>
          <li>Vask med terrasserens eller trevasker for å fjerne alger og grønske</li>
          <li>Kontroller alle skruer og beslag – stram til løse, bytt ut rustne</li>
          <li>Inspiser stendere og stolper nær bakken for tegn på råte</li>
          <li>Se etter sprekker, klyving og skader i bordene</li>
          <li>Sjekk dreneringen under terrassen – frigjør gjenstoppede hulrom</li>
          <li>Vurder om overflatebehandling er nødvendig (se eget avsnitt)</li>
        </Ul>
        <P>
          En slik runde tar 2–4 timer på en gjennomsnittlig terrasse og er den beste
          investeringen du kan gjøre for levetiden til konstruksjonen.
        </P>
      </>
    ),
  },
  {
    id: 'vask',
    heading: 'Vask og rengjøring',
    content: (
      <>
        <H3>Enkel vårrengjøring</H3>
        <P>
          Start med å feie bort løst smuss og blader. Bland terrasserens etter anvisning
          (typisk 1:4 eller 1:5 med vann), påfør på tørr eller lett fuktet flate og la
          det virke i 10–15 minutter. Skrubb langs treretningen med en god terrass-kost,
          og skyll grundig med hageslange.
        </P>
        <Callout variant="warn" title="Vær forsiktig med høytrykksspyler">
          Høytrykk kan åpne trefibrene og gjøre overflaten mer porøs og sårbar for
          fuktinntrengning. Bruk lav til middels trykk, og hold dysen minst 30 cm fra
          overflaten. Unngå høytrykk på myke treslag som gran og furu.
        </Callout>
        <P>
          Etter vask må overflaten tørke i minst 48 timer før eventuell overflatebehandling.
          Se mer om rengjøring og behandling i artikkelen om{' '}
          <a href="/byggeguider/vedlikehold">vedlikehold</a>.
        </P>
      </>
    ),
  },
  {
    id: 'overflatebehandling',
    heading: 'Når trenger terrassen ny behandling?',
    content: (
      <>
        <P>
          Vedlikeholdsintervallet avhenger av produkttypen, tresortet og exponeringen.
          Sørvendte terrasser i full sol krever hyppigere behandling enn nordfasader i skyggen.
        </P>
        <DataTable>
          <caption>Anbefalt vedlikeholdsintervall etter behandlingstype</caption>
          <thead>
            <tr>
              <th>Behandling</th>
              <th>Intervall</th>
              <th>Tegn på at det er på tide</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Trealje/olje</td>
              <td>1–2 år</td>
              <td>Treverket ser tørt og matt ut, begynner å grå</td>
            </tr>
            <tr>
              <td>Klarbeis</td>
              <td>2–3 år</td>
              <td>Fargen blekner, vannet trekker ikke lenger inn</td>
            </tr>
            <tr>
              <td>Dekkbeis</td>
              <td>3–4 år</td>
              <td>Fargen blekner, overflaten er ru</td>
            </tr>
            <tr>
              <td>Maling</td>
              <td>5–8 år</td>
              <td>Avflassing, blemmer, krakkelering</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Enkel test: drypp vann på terrassebordet. Perler vannet seg opp, holder beisen
          fortsatt. Trekker det rett inn, er det tid for ny behandling. Les mer om
          produktvalg i{' '}
          <a href="/byggeguider/beis-olje-maling">beis vs. olje vs. maling</a>.
        </P>
      </>
    ),
  },
  {
    id: 'skruer-beslag',
    heading: 'Skruer, beslag og konstruksjon',
    content: (
      <>
        <P>
          Rust og løse festemidler er en vanlig årsak til at terrasser slutter å bære som
          de skal. Inspiser alle synlige skruer og beslag hvert år:
        </P>
        <Ul>
          <li>Stram til løse skruer med skrutrekker – ikke overtrekk, da sprekker treverket</li>
          <li>
            Finn rustne skruer ved å se etter brune striper langs treverket under hodet
          </li>
          <li>Bytt rustne skruer med rustfrie (A4-stål eller galvaniserte)</li>
          <li>Kontroller at beslag ved stolpefot ikke har samlet seg vann og jord</li>
          <li>
            Stikk en spikkel eller skrutrekker inn i stolpefoten og stenderfoten – gir
            den etter, er det råte
          </li>
        </Ul>
        <P>
          Råte i bærende konstruksjoner er alvorlig og må utbedres raskt. Overfladisk råte
          i bordene kan du skrape og behandle med råtestopp-impregnering.
        </P>
      </>
    ),
  },
  {
    id: 'sesong-sjekkliste',
    heading: 'Sesong-sjekkliste',
    content: (
      <>
        <DataTable>
          <caption>Vedlikeholdsplan gjennom året</caption>
          <thead>
            <tr>
              <th>Tidspunkt</th>
              <th>Oppgave</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>April–mai</td>
              <td>Vårrengjøring, inspeksjon, ev. overflatebehandling</td>
            </tr>
            <tr>
              <td>Juni–august</td>
              <td>Rask visuell sjekk, fei bort smuss, løv og grener etter storm</td>
            </tr>
            <tr>
              <td>September–oktober</td>
              <td>Fei løv jevnlig, kontroller drenering, vinterklargjøring av møbler</td>
            </tr>
            <tr>
              <td>November–mars</td>
              <td>Skuff av snø etter kraftige fall, unngå å la is stå mot konstruksjonen</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Les mer om konkrete tiltak i artiklene om{' '}
          <a href="/byggeguider/vedlikehold-terrasse">vedlikehold av terrasse</a> og{' '}
          <a href="/byggeguider/vedlikehold">generelt vedlikehold</a>. Planlegger du ny
          terrasse? Bruk{' '}
          <a href="/planleggere/terrasse">terrasseplanneren</a> for å beregne materialbehov.
        </P>
      </>
    ),
  },
]

export default function VedlikeholdTerrassePage() {
  return (
    <GuideArticleLayout
      slug="vedlikehold-terrasse"
      readingTime="5 min"
      lead="Komplett guide til vedlikehold av terrasse: vask, inspeksjon av skruer og råte, riktig beisingsintervall og sesongrutiner som forlenger levetiden."
      sections={sections}
    />
  )
}
