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
          Spennvidde er avstanden en bjelke spenner fritt mellom to støttepunkter uten å bøye
          seg for mye eller knekke. For terrassebjelker avhenger riktig dimensjon av bjelkens
          tverrsnitt, c/c-avstand mellom bjelkene og lasten de skal bære. Tabellene under er
          veiledende – ved tvil, velg heller én dimensjon opp.
        </P>
        <Callout variant="warn" title="Tallene er veiledende">
          Spennvidde-tabeller er beregnet for standard forhold. Last, trehvit, trekvali­tet
          og snøbelastning i ditt område påvirker resultatet. For bærende konstruksjoner
          bør du rådføre deg med en fagperson og/eller beregne etter NS 5 / Eurokode 5.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-spennvidde',
    heading: 'Hva er spennvidde og hva påvirker den?',
    content: (
      <>
        <P>
          Spennvidden er den fri lengden mellom to bærende punkter – for eksempel mellom to
          bjelkesko på en terrasse. Jo lenger bjelken spenner uten støtte, desto mer bøyer den
          seg under belastning. For mye nedbøying ser dårlig ut, lager knirkete gulv og kan over
          tid føre til konstruksjonsskader.
        </P>
        <H3>Faktorer som begrenser spennvidden</H3>
        <Ul>
          <li>
            <strong>Bjelkedimensjon:</strong> Høyden (h) på bjelken er viktigst. En dobbelt så
            høy bjelke tåler ca. fire ganger mer bøyning.
          </li>
          <li>
            <strong>C/c-avstand mellom bjelkene:</strong> Tettere bjelker deler lasten mellom
            flere; hver bjelke bærer mindre.
          </li>
          <li>
            <strong>Last:</strong> Terrassegulv med møbler og mennesker er tyngre enn en
            lett pergolaoverdekning. Snøens egenvekt legger seg oppå.
          </li>
          <li>
            <strong>Trevirke og kvalitet:</strong> C24 konstruksjonsvirke tåler mer enn C18.
            Tørr ved er stivere enn fuktig.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'tabell-bjelkedimensjoner',
    heading: 'Veiledende spennvidder for terrassebjelker',
    content: (
      <>
        <P>
          Tabellene under er basert på lett til middels belastning (terrasse med normalt
          personlast + møbler, uten ekstra snølast lagt på). Trevirke: C24 konstruksjonsvirke.
          Tallene er maksimal anbefalt spennvidde i meter.
        </P>
        <DataTable>
          <caption>Veiledende maks. spennvidde – c/c 60 cm mellom bjelker</caption>
          <thead>
            <tr>
              <th>Bjelkedimensjon</th>
              <th>Maks. spennvidde c/c 60</th>
              <th>Merk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>48 × 148 mm</td>
              <td>ca. 1,8 m</td>
              <td>Lette konstruksjoner</td>
            </tr>
            <tr>
              <td>48 × 198 mm</td>
              <td>ca. 2,5 m</td>
              <td>Vanlig for terrasser</td>
            </tr>
            <tr>
              <td>48 × 248 mm</td>
              <td>ca. 3,2 m</td>
              <td>Lengre spenn</td>
            </tr>
          </tbody>
        </DataTable>
        <DataTable>
          <caption>Veiledende maks. spennvidde – c/c 40 cm mellom bjelker</caption>
          <thead>
            <tr>
              <th>Bjelkedimensjon</th>
              <th>Maks. spennvidde c/c 40</th>
              <th>Merk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>48 × 148 mm</td>
              <td>ca. 2,1 m</td>
              <td>Lette konstruksjoner</td>
            </tr>
            <tr>
              <td>48 × 198 mm</td>
              <td>ca. 2,9 m</td>
              <td>God stivhet</td>
            </tr>
            <tr>
              <td>48 × 248 mm</td>
              <td>ca. 3,7 m</td>
              <td>Store terrasser</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Alltid kontroller for din snøsone">
          Snølast varierer sterkt i Norge – fra nær null på kysten til 3,0 kN/m² eller mer i
          høyfjellet. I snørike strøk bør du redusere maks. spennvidde med 10–20 % eller øke
          bjelkedimensjonen. Bruk snøsonekart fra Standard Norge / Eurokode 1.
        </Callout>
      </>
    ),
  },
  {
    id: 'tommelfingerregler',
    heading: 'Tommelfingerregler for dimensjonering',
    content: (
      <>
        <P>
          Disse enkle huskeglene er nyttige i planleggingsfasen og gir deg et godt utgangspunkt
          før du finjusterer med en tabell eller beregning:
        </P>
        <Ul>
          <li>
            <strong>Bjelkehøyde ≈ spennvidde / 15:</strong> En bjelke som spenner 3 m bør ha
            høyde minst 3000 / 15 = 200 mm. Dette er et grovt anslag som forutsetter standard
            last og c/c 60 cm.
          </li>
          <li>
            <strong>Dobbelt bjelke:</strong> To bjelker side om side («dobbeltbjelke») spenner
            ikke dobbelt så langt – men det gir mye høyere kapasitet og er velegnet på
            langsgående bærebjelker og over åpninger.
          </li>
          <li>
            <strong>Tettere c/c gir mer fleksibilitet:</strong> Reduser c/c fra 60 til 40 cm
            og du kan enten øke spennvidden eller gå ned én dimensjon på bjelkene.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'videre',
    heading: 'Videre planlegging',
    content: (
      <>
        <P>
          Spennviddene på bjelkene henger direkte sammen med stolpeavstand og fundamentplassering.
          Se guiden om <a href="/byggeguider/stolpeavstand">stolpeavstand og dimensjonering</a>{' '}
          for hvordan du bestemmer hvor langt det kan gå mellom stolpene.
        </P>
        <P>
          Når bjelkelengder og dimensjoner er bestemt, hjelper{' '}
          <a href="/planleggere/terrasse">terrasseplanneren</a> deg med den endelige
          materialbestillingen.
        </P>
      </>
    ),
  },
]

export default function SpennvidderBjelkerPage() {
  return (
    <GuideArticleLayout
      slug="spennvidder-bjelker"
      readingTime="5 min"
      lead="Veiledende spennvidder for terrassebjelker – tabeller for 48×148, 48×198 og 48×248 mm ved c/c 40 og 60 cm, med forklaring av hva som påvirker maks. spenn."
      sections={sections}
    />
  )
}
