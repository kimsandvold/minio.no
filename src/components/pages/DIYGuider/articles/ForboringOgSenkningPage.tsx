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
          Forboring vil si å lage et hull som er litt smalere enn skruens kjerne, slik
          at treet ikke sprekker når skruen skrues inn. Senkning (forsenking) lager i
          tillegg en grunn kjegle øverst slik at skruehodet sitter plant med eller under
          overflaten. To enkle steg som løfter arbeidets kvalitet betraktelig.
        </P>
        <Callout variant="tip" title="Kjøp et kombinasjonsbor">
          Et kombinasjonsbor for forboring og senkning i ett gjør begge operajonene
          i én drilling. Rimelig, praktisk og tidsbesparende. Juster dybden én gang,
          og bruk det til alle skruene i prosjektet.
        </Callout>
      </>
    ),
  },
  {
    id: 'hvorfor-forbore',
    heading: 'Hvorfor skal du forbore?',
    content: (
      <>
        <P>
          Tre er et fibrøst materiale. Når en skrue presses direkte inn uten hull,
          presser den fibrene fra hverandre. Nær kantene – innen 3–4 ganger materialtykkelsen
          – er det høy risiko for at brettet sprekker langs fiberen. I hardtre og
          trykkimpregnert virke er risikoen enda større fordi materialet er tettere.
        </P>
        <P>
          I tillegg gjør forboringen at skruen går rettere inn og at hodet trekker seg
          lettere ned til overflaten. Uten forboret hull kan skruen vandre til siden
          eller splitte materialet på spissen. Med hull treffer du nøyaktig og unngår
          unødvendig kraft på drillen.
        </P>
        <H3>Nær kanter og ender</H3>
        <P>
          Ender av et bord er de mest utsatte stedene. Fiber løper langs brettets lengde,
          og en skrue som presses inn fra enden presser direkte mot fibrene i lengderetningen.
          Forbor alltid når du skruer nærmere enn ca. 50 mm fra enden, eller dersom
          materialet er hardtre eller tørt og sprøtt.
        </P>
        <Callout variant="warn" title="Impregnert virke">
          Trykkimpregnert tre har høy fuktinnhold og sprekker lett på tvers når det
          tørker med skruer uten forboringshull. Forbor alltid i impregnert – og bruk
          rustfrie eller varmgalvaniserte skruer. Les mer i{' '}
          <a href="/byggeguider/riktig-skrue">guiden om riktig skrue</a>.
        </Callout>
      </>
    ),
  },
  {
    id: 'forsenking',
    heading: 'Forsenking – skruehode i flukt med overflaten',
    content: (
      <>
        <P>
          En forsenking er en kjegleformet fordypning øverst i hullet. Skruehode med
          kjegleunderside (countersunk) trekker seg ned i forsenkingen og blir sittende
          jevnt med eller under overflaten. Det gir et ryddig utseende og forhindrer at
          et stikkende skruehode lager rifter i hender og klær.
        </P>
        <P>
          Forsenkingen lages med et forsenkingsbor (countersink bit), et kombibor som
          gjør begge i ett, eller ved å lage en pilot-boring og bruke en større bit for
          forsenkingen etterpå. Vinkel på forsenkingen er vanligvis 90° for standard
          flathodeskruer (DIN 7996, 7997) og 82° for noen amerikanske spesifikasjoner –
          sjekk at bor og skrue har samme vinkel.
        </P>
        <Callout variant="tip" title="Bruk plugg for skjult skruhode">
          Vil du skjule skruehodet helt, lag en dypere forsenking og dekk med en
          tretapp (plugg) i samme tre. Lim pluggen, la den tørke og trim av med en
          stikkelkniv og slipeplate. Nesten usynlig resultat.
        </Callout>
      </>
    ),
  },
  {
    id: 'bordiameter',
    heading: 'Riktig bordiameter',
    content: (
      <>
        <P>
          Forboringshullet skal ha samme diameter som skruens kjerne (det indre, glatte
          feltet uten gjenger), slik at gjengene biter i treet men treet ikke sprekker.
          Tabellen nedenfor gir anbefalte forboringsdiametrer for vanlige skruestørrelser
          i vanlig furutrelast:
        </P>
        <DataTable>
          <caption>Skruedimensjon og anbefalt forboringsdiameter i furutre</caption>
          <thead>
            <tr>
              <th>Skrue</th>
              <th>Kjernemål (ca.)</th>
              <th>Forboringsbor</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>3,5 × 35 mm</td>
              <td>2,0 mm</td>
              <td>2,0–2,5 mm</td>
            </tr>
            <tr>
              <td>4,0 × 50 mm</td>
              <td>2,4 mm</td>
              <td>2,5 mm</td>
            </tr>
            <tr>
              <td>4,5 × 60 mm</td>
              <td>2,8 mm</td>
              <td>3,0 mm</td>
            </tr>
            <tr>
              <td>5,0 × 70 mm</td>
              <td>3,2 mm</td>
              <td>3,0–3,5 mm</td>
            </tr>
            <tr>
              <td>6,0 × 100 mm</td>
              <td>3,8 mm</td>
              <td>4,0 mm</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          I hardtre (eik, ask) borer du gjerne 0,5 mm større enn i furutre. I MDF og
          sponplate borer du samme størrelse som kjernemål – materialet er mer homogent
          og sprekker sjeldnere.
        </P>
      </>
    ),
  },
  {
    id: 'teknikk',
    heading: 'Teknikk og tips',
    content: (
      <>
        <Ul>
          <li>
            <strong>Sett en dybdestopp på bordet:</strong> Lim en bit malertape rundt
            boret i riktig dybde. Når tapen treffer overflaten, er du i mål. Alternativt
            bruk en borring (depth stop collar).
          </li>
          <li>
            <strong>Boring vinkelrett:</strong> Hold drillen loddrett for at skruen
            skal gå rett inn. En borestativ til lav pris (200–400 kr) er gunstig
            dersom du gjør mye presisjonsboring.
          </li>
          <li>
            <strong>Trykk og fart:</strong> Drill med middels fart og jevnt press.
            For mye fart i hardtre brenner boret og lager et urent hull.
          </li>
          <li>
            <strong>Frigjøringsboring i langt hull:</strong> I hull dypere enn 50 mm,
            trekk boret opp halvveis et par ganger underveis for å fjerne spon. Ellers
            pakkes hullet og boret setter seg fast.
          </li>
        </Ul>
        <P>
          Se <a href="/byggeguider/forboring-og-senkning">guiden om forboring og senkning</a> for
          mer om lommehullsboring (pocket hole), og{' '}
          <a href="/byggeguider/saging-og-sammenfoyning">Saging og sammenføyning</a> for
          konteksten rundt hele monteringsprosessen.
        </P>
      </>
    ),
  },
]

export default function ForboringOgSenkningPage() {
  return (
    <GuideArticleLayout
      slug="forboring-og-senkning"
      readingTime="5 min"
      lead="Forboring hindrer at treet sprekker og skruen vandrer; forsenking gir skruehodet et ryddig, plant sete. To minutter som utgjør stor forskjell."
      sections={sections}
    />
  )
}
