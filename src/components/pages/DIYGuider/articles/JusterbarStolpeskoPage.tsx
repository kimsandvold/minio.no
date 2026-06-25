import GuideArticleLayout, {
  Callout,
  DataTable,
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
          Stolpesko og stolpefot holder vertikal støtte opp fra bakken eller betongen – og det er
          viktigere enn det høres ut. Tre som hviler direkte på betong trekker til seg fukt, råtner
          nedenfra og er svekket lenge før du oppdager det. En god stolpesko koster lite og varer
          konstruksjonen i 20–30 år ekstra.
        </P>
        <Callout variant="tip" title="Alltid luftgap">
          Enden av stolpen skal aldri røre betong eller jord. Minimum 3–5 cm luftgap under
          stolpen hindrer kapilarsuging og gir ventilasjon som holder treet tørt.
        </Callout>
      </>
    ),
  },
  {
    id: 'hvorfor-stolpesko',
    heading: 'Hvorfor ikke bare grave ned stolpen?',
    content: (
      <>
        <P>
          I gamle dager gravde man ned trestolper direkte i jord – og byttet dem gjerne hvert
          tiende år. Impregnert tre tåler mer, men kontakt med fuktig jord og betong er fortsatt
          den vanligste årsaken til tidlig råte i utekonstruksjoner.
        </P>
        <P>
          Med stolpesko hever du enden opp fra underlaget, luften sirkulerer rundt treet, og
          vann renner bort i stedet for å samle seg rundt trefiberen. I tillegg kan du bytte en
          skadet stolpe uten å bryte opp betongfundamentet.
        </P>
      </>
    ),
  },
  {
    id: 'typer',
    heading: 'Typer stolpesko og stolpefot',
    content: (
      <>
        <P>
          Det finnes tre vanlige systemer, og valget avhenger av om betongen allerede er støpt
          og hvor mye du vil justere i ettertid.
        </P>
        <DataTable>
          <caption>Stolpesko-typer</caption>
          <thead>
            <tr>
              <th>Type</th>
              <th>Fordel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Innstøpt stolpefot</td>
              <td>Sterk, men ingen justering mulig</td>
            </tr>
            <tr>
              <td>Justerbar stolpesko (boltet)</td>
              <td>Monteres etter støp, justerbar vinkel</td>
            </tr>
            <tr>
              <td>H-stolpesko</td>
              <td>Enkel montering, stabil for tyngre stolper</td>
            </tr>
          </tbody>
        </DataTable>
        <Ul>
          <li>
            <strong>Innstøpt stolpefot</strong> – settes i fersk betong og støpes fast. Gir svært
            sterk forbindelse, men du må vite nøyaktig plassering og høyde før betong støpes.
          </li>
          <li>
            <strong>Justerbar stolpesko</strong> – boltes til herdet betong med ekspansjonsbolt
            eller kjemisk anker. Skiven øverst lar deg vri noen grader for å kompensere for
            ujevn betong. Standardvalget for de fleste DIY-prosjekter.
          </li>
          <li>
            <strong>H-stolpesko</strong> – to parallelle plater danner en H rundt stolpebunnen.
            Enkel å montere og god til tyngre konstruksjoner, men krever litt mer plass.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'festing-til-betong',
    heading: 'Festing til betong',
    content: (
      <>
        <P>
          Det finnes to pålitelige metoder for å feste en stolpesko i herdet betong. Valget
          avhenger av betongtykkelsen, laster og hvor permanent monteringen skal være.
        </P>
        <Ul>
          <li>
            <strong>Ekspansjonsbolt</strong> – bores ned i betongen og ekspanderer når du strammes
            til. Rask montering. Velg rustfri A4 for utebruk. Krever at betongen er tykk nok
            (minimum 100–150 mm avhengig av bolt).
          </li>
          <li>
            <strong>Kjemisk anker</strong> – hull bores, rengjøres med trykkluft og børste, og
            epoxy-patron sprøytes inn. Bolten skyves inn og herder i epoxyen. Gir ekstremt god
            utrivningsstyrke og er bedre enn ekspansjonsbolt i tynnere eller sprukken betong.
          </li>
        </Ul>
        <Callout variant="warn" title="Rengjør hullet nøye ved kjemisk anker">
          Støvete hull gir dårlig heft for epoxyen. Blås ut med trykkluft, børst to–tre runder
          og blås igjen. Et skittent hull kan halvere trekkstyrken.
        </Callout>
      </>
    ),
  },
  {
    id: 'steg-for-steg',
    heading: 'Montering steg for steg',
    content: (
      <>
        <P>
          Her er fremgangsmåten for en justerbar stolpesko med ekspansjonsbolt – den vanligste
          varianten for terrasser og carporter.
        </P>
        <Ol>
          <li>Merk opp nøyaktig senterposisjon for stolpen på betongen.</li>
          <li>Bor hullet med hammerbormaskin og riktig borstørrelse (se bolt-spesifikasjon).</li>
          <li>Blås ut støv med trykkluft eller pust kraftig ned i hullet.</li>
          <li>Sett ekspansjonsbolt ned i hullet og stram til med momentnøkkel.</li>
          <li>Plasser stolpeskoen over bolten og sett på mutter og skive.</li>
          <li>Kontroller med vater at skoen er plan; juster litt ved behov.</li>
          <li>Stram mutteren til anbefalt moment (se produsentens tabell).</li>
          <li>Plasser stolpen i skoen og fest med kamspiker gjennom alle hull i begge sider.</li>
          <li>Kontroller loddrett stilling med vater i to retninger.</li>
          <li>Fest eventuell stagekonstruksjon eller ramme før stolpen slipper.</li>
        </Ol>
        <Callout variant="tip" title="Mål to ganger">
          Stolposisjon som er 5 mm feil er nok til at bjelker ikke møtes riktig. Bruk snor mellom
          hjørnepunkter for å plassere mellomstolper i linje – ikke mål fra vegg til stolpe.
        </Callout>
      </>
    ),
  },
  {
    id: 'luftgap',
    heading: 'Høyde og luftgap',
    content: (
      <>
        <P>
          Standard luftgap mellom stolpebunnen og betongen er 3–5 cm. Det er nok til at luft
          sirkulerer, men ikke så mye at skoen ser rar ut eller at enden er utsatt for slag.
        </P>
        <P>
          Justerbare stolpesko lar deg variere høyden ved bestilling eller ved å bruke
          utskiftbare innsatser. Noen modeller har en plate du kan skifte for å stille total
          høyde fra 50 mm til 150 mm over betongen. Er terrassen din på et plan som er nær
          ferdig nivå, velg minimum 50 mm for å sikre nok ventilasjon under gulvkonstruksjonen.
        </P>
        <P>
          Se <a href="/byggeguider/beslag-oversikt">beslag-oversikten</a> for mer om valg av
          festemidler og hvilke beslag som passer til hva.
        </P>
      </>
    ),
  },
]

export default function JusterbarStolpeskoPage() {
  return (
    <GuideArticleLayout
      slug="justerbar-stolpesko"
      readingTime="5 min"
      lead="Stolper som hviler rett på betong råtner nedenfra. En enkel stolpesko hever enden, gir ventilasjon og lar deg bytte stolpen uten å rive opp fundamentet."
      sections={sections}
    />
  )
}
