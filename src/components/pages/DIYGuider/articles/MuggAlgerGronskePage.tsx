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
          Mugg, alger og grønske er vanlig på utendørs tre, spesielt på skyggelagte og fuktige
          flater. Det er primært et estetisk problem, men over tid kan det holde på fukt og
          akselerere råteprosessen. Løsningen er enkel: riktig rensemiddel, grundig skrubbing
          og god etterskylling – og deretter tiltak som reduserer vekstvilkårene.
        </P>
        <Callout variant="tip" title="Forebygg med jevnlig vask">
          En rask vask med terrasserens hvert år om våren er nok til å holde grønske og
          alger i sjakk på de fleste terrasser.
        </Callout>
      </>
    ),
  },
  {
    id: 'årsaker',
    heading: 'Hvorfor vokser det grønske og alger?',
    content: (
      <>
        <P>
          Alger, mose og grønske trives der det er fuktighet, skygge og lite luftsirkulasjon.
          Typiske risikofaktorer:
        </P>
        <Ul>
          <li>Terrassen er nord- eller øst-vendt og tørker sakte etter regn</li>
          <li>Trær, busker eller bygninger skygger for sol og vind</li>
          <li>Løv, bar og smuss samler seg i sprekker og under møbler</li>
          <li>Dårlig drenering under konstruksjonen holder fuktnivået høyt</li>
          <li>Ubehandlet eller gammel beis som ikke lenger frastøter vann</li>
        </Ul>
        <P>
          Grønske (alger) er den vanligste formen – en grønn, glatt belegg som gjør
          terrassen glatt og farlig å gå på. Mugg er mørkere (grønt, sort, brunt) og
          vokser dypere i trefibrene. Mose er lettere å fjerne mekanisk, men holder godt
          på fukt og bør alltid fjernes.
        </P>
      </>
    ),
  },
  {
    id: 'fjerning',
    heading: 'Slik fjerner du grønske og alger',
    content: (
      <>
        <H3>Steg for steg</H3>
        <Ol>
          <li>Fei bort løst smuss, løv og synlig mose med en hard kost.</li>
          <li>
            Bland terrasserens eller algefjerning etter anvisning – ikke for svak løsning,
            da virker den dårlig.
          </li>
          <li>
            Påfør løsningen på tørr eller lett fuktet flate. Litt opptak i treverket
            hjelper produktet å virke bedre.
          </li>
          <li>La virke i 15–30 minutter. Ikke la det tørke inn.</li>
          <li>Skrubb grundig langs treretningen med en stiv terrasse-kost.</li>
          <li>Skyll godt med hageslange – lav til middels trykk.</li>
          <li>La tørke i minst 48 timer før eventuell overflatebehandling.</li>
        </Ol>
        <Callout variant="warn" title="Unngå høytrykksspyler på mykt tre">
          Høytrykk kan ødelegge overflaten på furu og gran ved å åpne trefibrene og
          fjerne det myke sommerved. Bruk heller god kost og rensemiddel. Vil du bruke
          høytrykk, hold dysen minst 30–40 cm fra overflaten og bruk et viftemønster.
        </Callout>
        <P>
          For hardnakket mugg eller alger som sitter dypt, kan du bruke en sterkere
          konsentrasjon eller et produkt spesifikt for muggfjerning. La virke lenger –
          opptil 45 minutter – men hold flaten fuktig med vanlig vann underveis.
        </P>
      </>
    ),
  },
  {
    id: 'produkter',
    heading: 'Produkter og metoder',
    content: (
      <>
        <DataTable>
          <caption>Rengjøringsmetoder for grønske, alger og mugg</caption>
          <thead>
            <tr>
              <th>Problem</th>
              <th>Produkt/metode</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lett grønske</td>
              <td>Terrasserens + kost</td>
              <td>Fungerer på de fleste terrasser, bruk hvert år</td>
            </tr>
            <tr>
              <td>Kraftig algevekst</td>
              <td>Algefjerning (konsentrert)</td>
              <td>La virke lenger, gjenta ved behov</td>
            </tr>
            <tr>
              <td>Mugg i treverket</td>
              <td>Mugg- og soppmiddel for tre</td>
              <td>Velg produkt godkjent for utendørs bruk</td>
            </tr>
            <tr>
              <td>Mose</td>
              <td>Skrap mekanisk + terrasserens</td>
              <td>Mose løsner lett, men hold det rent etterpå</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Bruk alltid hansker og øyevern ved arbeid med terrasserens og algefjerning.
          Produktene er milde, men unngå sprut i øynene og skyll huden ved kontakt.
        </P>
      </>
    ),
  },
  {
    id: 'forebygging',
    heading: 'Forebygging – slik holder du terrassen ren',
    content: (
      <>
        <P>
          Det beste er å hindre at grønske og alger etablerer seg. Her er de viktigste
          forebyggende tiltakene:
        </P>
        <Ul>
          <li>
            <strong>Hold rent:</strong> Fei terrassen jevnlig og fjern løv, bar og smuss
            som samler seg i sprekker og rundt kanter.
          </li>
          <li>
            <strong>Ventilasjon under terrassen:</strong> Sørg for at det er minst 10–15 cm
            fri luft under konstruksjonen. Fjern vegetasjon, jord og smuss som blokkerer
            luftsirkulasjonen.
          </li>
          <li>
            <strong>Beskjær busker og trær:</strong> Reduser skygge og fukt ved å holde
            vegetasjon unna terrassen.
          </li>
          <li>
            <strong>God overflatebehandling:</strong> Frisk beis og olje frastøter vann og
            gjør det vanskeligere for alger å feste seg.
          </li>
          <li>
            <strong>Flytt på møbler:</strong> La møblene stå på ulike steder, eller løft
            dem jevnlig slik at luften kommer til under.
          </li>
        </Ul>
        <Callout variant="tip" title="Impregneringsmiddel etter vask">
          Etter grundig rengjøring kan du påføre et impregnerende terrasseolje eller
          beis med algehemmende tilsetning. Det gir god beskyttelse mot ny vekst og
          reduserer behovet for rensing de neste sesongene.
        </Callout>
        <P>
          Se artikkelen om{' '}
          <a href="/byggeguider/vedlikehold-terrasse">vedlikehold av terrasse</a> for
          den fullstendige årsrutinen, og{' '}
          <a href="/byggeguider/overflatebehandling">overflatebehandling</a> for
          produktvalg og teknikk.
        </P>
      </>
    ),
  },
]

export default function MuggAlgerGronskePage() {
  return (
    <GuideArticleLayout
      slug="mugg-alger-gronske"
      readingTime="5 min"
      lead="Slik fjerner du grønske, alger og mugg fra terrasse og utendørs tre – riktig rensemiddel, teknikk og tiltak som holder terrassen ren lenger."
      sections={sections}
    />
  )
}
