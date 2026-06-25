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
          Frostfri dybde er det dypeste nivået i bakken der temperaturen aldri synker under null,
          uansett vinter. Fundamenter som graves dypere enn dette unngår å løftes av{' '}
          <a href="/byggeguider/telehiv">telehiv</a>. I Norge varierer dybden fra ca. 40 cm langs
          milde kyststrøk til 150–200 cm i kalde innlands- og fjelltraktene.
        </P>
        <Callout variant="warn" title="Alltid sjekk lokale tall">
          Tabellene under er veiledende nasjonale anslag. Faktisk frostfri dybde varierer med
          lokal topografi, snødekke og grunnvann. For bærende konstruksjoner bør du sjekke med
          kommunen eller konsultere en fagperson.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-betyr-det',
    heading: 'Hva betyr frostfri dybde i praksis?',
    content: (
      <>
        <P>
          Når bakken fryser, ekspanderer isen og trykker oppover. Et fundament som sitter i det
          telefarlige sjiktet vil bli løftet – gjerne ujevnt – og konstruksjonen over blir skadet.
          Fundamentets bunn må alltid ligge dypere enn der kulda rekker ned.
        </P>
        <P>
          Frostfri dybde er altså ikke en egenskap ved fundamentet selv, men ved bakken på
          stedet der du bygger. Den bestemmes av to ting: hvor kald vinteren er (målt som
          «frostmengde» i °Ctimer) og hva slags jordmasse du har.
        </P>
        <H3>Hva er frostmengde?</H3>
        <P>
          Frostmengde er summen av grader under null ganget med antall timer – for eksempel
          holder det –5 °C i 100 timer, gir det 500 °Ctime. Jo høyere frostmengde, desto
          dypere trenger kulda. Meteorologisk institutt og kommunens tekniske etat har historiske
          frostmengdedata for de fleste kommuner.
        </P>
      </>
    ),
  },
  {
    id: 'dybder-i-norge',
    heading: 'Veiledende frostfri dybde i Norge',
    content: (
      <>
        <P>
          Tabellen under viser typiske veiledende dybder for ulike regioner. Tallene tar
          utgangspunkt i moderat telefarlig jord (finkornet sand, silt). I leire kan dybden
          være noe større; på fjell og grovpukk kan du klare deg med mindre.
        </P>
        <DataTable>
          <caption>Veiledende frostfri dybde per region – typisk telefarlig jord</caption>
          <thead>
            <tr>
              <th>Region / områdetype</th>
              <th>Veiledende dybde</th>
              <th>Eksempler</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Kyst Sør-Vest (milde vintre)</td>
              <td>40–60 cm</td>
              <td>Stavanger, Bergen, Ålesund</td>
            </tr>
            <tr>
              <td>Kyst Sør-Øst og Oslofjord</td>
              <td>60–90 cm</td>
              <td>Oslo, Fredrikstad, Tønsberg</td>
            </tr>
            <tr>
              <td>Innlandet Sør-Norge</td>
              <td>90–120 cm</td>
              <td>Hamar, Lillehammer, Kongsberg</td>
            </tr>
            <tr>
              <td>Trøndelag og kyst Midt-Norge</td>
              <td>80–110 cm</td>
              <td>Trondheim, Molde</td>
            </tr>
            <tr>
              <td>Innlandet Nord-Norge og fjell</td>
              <td>120–200 cm</td>
              <td>Røros, Finnmark innland, høyfjell</td>
            </tr>
            <tr>
              <td>Kyst Nord-Norge</td>
              <td>60–100 cm</td>
              <td>Tromsø, Bodø, Harstad</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Disse tallene er veiledende">
          Tallene over er typiske anslag og ikke bindende. Lokale forhold som høyde over havet,
          terrenghelling, nærhet til vann og snødekketykkelse kan endre bildet vesentlig. Sjekk
          alltid med kommunen eller en geotekniker for bærende konstruksjoner.
        </Callout>
      </>
    ),
  },
  {
    id: 'faktorer',
    heading: 'Faktorer som påvirker frostinntrenging',
    content: (
      <>
        <P>
          Frostfri dybde er ikke bare et spørsmål om geografi. Disse lokale faktorene kan
          endre behovet betydelig:
        </P>
        <Ul>
          <li>
            <strong>Jordtype:</strong> Leire og silt er telefarlige fordi de holder på vann og
            danner islinser. Grov sand og pukk er nesten telefri.
          </li>
          <li>
            <strong>Snødekke:</strong> Snø isolerer bakken. En sommer-hytte på et sted der
            snøen aldri blåser bort kan ha bedre frostsikring enn antatt. Det motsatte – åpen
            jord uten snø og ekstrem kulde – er verst.
          </li>
          <li>
            <strong>Grunnvann:</strong> Høy grunnvannstand gir mer vann tilgjengelig for
            isvekst, noe som øker telerisikoen.
          </li>
          <li>
            <strong>Skygge og terreng:</strong> Nordvendte skråninger og områder med lite sol
            kan holde seg kalde lenger og kreve ekstra dybde.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'sjekk-kommunen',
    heading: 'Slik sjekker du frostfri dybde for din tomt',
    content: (
      <>
        <H3>Kommunens tekniske etat</H3>
        <P>
          Mange kommuner har egne retningslinjer for frostfri dybde basert på lokale
          klimadata. Kontakt plan- og bygningsetaten og spør etter veiledende fundamentdybder
          for din adresse.
        </P>
        <H3>NVE og Meteorologisk institutt</H3>
        <P>
          Frostmengdedata er tilgjengelig gjennom Meteorologisk institutts klimastatistikk.
          NVE har også temakart for frostindeks som er åpent tilgjengelig på nett.
        </P>
        <H3>Geotekniker eller rådgiver</H3>
        <P>
          For større byggeprosjekter – garasje, carport med tung konstruksjon, tilbygg –
          anbefales en geoteknisk rapport som slår fast grunnforhold og nødvendig fundamentdybde.
          Det er relativt rimelig for det sikkerhetsbidraget det gir.
        </P>
        <P>
          Se guiden <a href="/byggeguider/telehiv">Telehiv forklart</a> for mer om hvordan du
          beskytter fundamentet med drenering og pukk, og{' '}
          <a href="/byggeguider/fundamenttyper">Fundamenttyper</a> for oversikt over
          hvilken fundamenttype som passer best til ditt prosjekt.
        </P>
      </>
    ),
  },
]

export default function FrostfriDybdePage() {
  return (
    <GuideArticleLayout
      slug="frostfri-dybde"
      readingTime="5 min"
      lead="Frostfri dybde varierer fra 40 cm på kysten til 200 cm i kalde innlandsstrøk. Her er en regionvis oversikt og tips til å finne riktig dybde for din tomt."
      sections={sections}
    />
  )
}
