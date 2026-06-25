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
          Skruer er ikke like. Feil skrue på feil sted betyr rust, sprekker og løse forbindelser etter
          én sesong ute. Velg riktig type og materiale fra starten, og du slipper unødvendig om igjen.
          Til terrasse og utebruk generelt er terrasseskruer i rustfri A4 eller varmgalvanisert det
          sikreste valget.
        </P>
        <Callout variant="tip" title="Tommelregel for lengde">
          Skruen bør gå minst 2–2,5 ganger tykkelsen på det øverste materialet inn i det underste.
          Skrur du gjennom 28 mm terrassebord, vil du ha minst 56–70 mm inn i bjelken – bruk 90 mm.
        </Callout>
      </>
    ),
  },
  {
    id: 'skruetyper',
    heading: 'Vanlige skruetyper',
    content: (
      <>
        <P>
          Det finnes mange skruetyper, men de fleste amatørprosjekter klarer seg med fire–fem
          varianter. Å kjenne forskjellen sparer deg for feilkjøp og ødelagte materialer.
        </P>
        <DataTable>
          <caption>Oppgave og anbefalt skrue</caption>
          <thead>
            <tr>
              <th>Oppgave</th>
              <th>Anbefalt skrue</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Terrassebord til bjelke</td>
              <td>Terrasseskrue 4,5 × 70–90 mm</td>
            </tr>
            <tr>
              <td>Konstruksjon, bærende rammer</td>
              <td>Konstruksjonsskrue 6 × 120–200 mm</td>
            </tr>
            <tr>
              <td>Generelt trearbeid innendørs</td>
              <td>Treskrue 3,5–5 × varierer</td>
            </tr>
            <tr>
              <td>Gips til stender (innendørs)</td>
              <td>Gipsskrue 3,5 × 35–41 mm</td>
            </tr>
            <tr>
              <td>Beslag og jern til tre</td>
              <td>Beslagskrue eller kamspiker</td>
            </tr>
          </tbody>
        </DataTable>
        <H3>Terrasseskrue</H3>
        <P>
          En terrasseskrue er laget for å montere terrassebord. Den har grovere gjenger i øverste
          del slik at bordet trekkes tett mot bjelken, og spissen er borkalibrert så du slipper
          forboring i de fleste tresorter. Hodet er forsenket og passer rett ned i bordoverflaten.
          Bruk alltid rustfri eller syrefast variant ute.
        </P>
        <H3>Konstruksjonsskrue</H3>
        <P>
          Lange, kraftige skruer med grovt gjengeprofil. Brukes til å feste bjelker til hverandre,
          montere bæreverk og til andre belastede konstruksjoner. Mange varianter har et delvis
          glatt skaft under hodet – det sørger for at den øverste bjelken trekkes tett til den
          underste uten å kile seg fast.
        </P>
        <H3>Treskrue</H3>
        <P>
          Den «vanlige» skruen til alt annet trearbeid innendørs: hyller, møbler, kasser og liknende.
          Finere gjenger og smalere enn terrasseskruer. Ikke egnet ute uten riktig belegg.
        </P>
        <H3>Gipsskrue – ikke ute</H3>
        <P>
          Gipsskruer ser ut som vanlige skruer, men er laget av herdet stål som er sprøtt og
          korrosjonssvakt. De ruster raskt ute og kan brekke under skruing i hardt tre. Hold dem
          strengt innendørs.
        </P>
      </>
    ),
  },
  {
    id: 'materiale',
    heading: 'Skruemateriale og korrosjonsklasse',
    content: (
      <>
        <P>
          Materialet i skruen avgjør hvor lenge den varer ute. Det finnes tre hovedvalg, og prisen
          stiger med bestandigheten. Se en fullstendig gjennomgang i{' '}
          <a href="/byggeguider/syrefast-vs-galvanisert">Syrefast (A4) vs. galvanisert</a>.
        </P>
        <Ul>
          <li>
            <strong>Elektrogalvanisert (blank/hvit)</strong> – tynnt sinkbelegg, holder ikke ute.
            Kun innendørs.
          </li>
          <li>
            <strong>Varmgalvanisert (HDG)</strong> – tykt sinkbelegg, tåler generelt utebruk og
            impregnert tre. Billigste akseptable valg ute.
          </li>
          <li>
            <strong>Rustfri A2</strong> – holder godt ute, synlige overflater, normal kystluft.
          </li>
          <li>
            <strong>Syrefast A4</strong> – tåler saltvann og kjemisk impregnert tre. Velg dette
            nær sjøen eller der treet er trykkimpregnert med kobberbasert middel.
          </li>
        </Ul>
        <Callout variant="warn" title="Impregnert tre reagerer med sink">
          Moderne kobberbasert trykkimpregnering kan tære på galvaniserte skruer. Ved tvil: velg
          syrefast A4 fremfor varmgalvanisert, spesielt i fuktige miljø og nær sjøen.
        </Callout>
      </>
    ),
  },
  {
    id: 'lengde',
    heading: 'Riktig skruelengde',
    content: (
      <>
        <P>
          En for kort skrue gir dårlig grep. En for lang stikker ut på den andre siden eller
          svekker materialet. Regelen er enkel: skruen skal gå 2–2,5 ganger tykkelsen på det
          øverste stykket ned i festematerialet.
        </P>
        <DataTable>
          <caption>Eksempler på riktig skruelengde</caption>
          <thead>
            <tr>
              <th>Øverste stykke</th>
              <th>Anbefalt total lengde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>28 mm terrassebord</td>
              <td>70–90 mm</td>
            </tr>
            <tr>
              <td>48 mm plank</td>
              <td>120–150 mm</td>
            </tr>
            <tr>
              <td>22 mm panel</td>
              <td>55–70 mm</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Skal du feste to bjelker av samme dimensjon mot hverandre, bruk konstruksjonsskruer som
          går 2/3 inn i den andre bjelken – eller bruk gjennom bolt der belastningen er stor.
        </P>
      </>
    ),
  },
  {
    id: 'hode-og-drev',
    heading: 'Torx vs. Phillips',
    content: (
      <>
        <P>
          Drevtypen – sporet i skruehodet – avgjør hvor lett det er å skru uten at biten glir av.
          Phillips (krysspor) er utbredt, men har liten kontaktflate og er beryktet for å «strippe»
          seg selv i hodet. Torx (stjerneprofil) gir langt bedre grep og er standard på
          terrasseskruer og konstruksjonsskruer av kvalitet.
        </P>
        <Ul>
          <li>
            <strong>Torx (T20, T25)</strong> – anbefalt ute og til konstruksjoner. Biten sitter og
            skruen trekkes jevnt ned.
          </li>
          <li>
            <strong>Phillips (PH2)</strong> – OK til innendørs trearbeid, men unngå til harde eller
            lange skruer ute.
          </li>
          <li>
            <strong>Pozi (PZ2)</strong> – bedre enn Phillips, men fortsatt under Torx.
          </li>
        </Ul>
        <P>
          Har du skrudd en skrue med feil bit og stripet hodet, er den svært vanskelig å få ut. Byt
          til riktig bit og kjør ikke skrumaskinen på høyeste innstilling – bruk momentbegrenset
          boring.
        </P>
      </>
    ),
  },
  {
    id: 'forboring',
    heading: 'Når bør du forbore?',
    content: (
      <>
        <P>
          Mange moderne terrasseskruer og konstruksjonsskruer er selvsenkende og trenger ikke
          forboring i vanlig furu og gran. Men i enkelte situasjoner er forboring likevel smart –
          og noen ganger nødvendig.
        </P>
        <Ul>
          <li>Nær enden av et bord (under 5–6 cm fra kanten)</li>
          <li>Harde tresorter som eik, ask eller lerk</li>
          <li>Smale lister der treet lett sprekker</li>
          <li>Når du vil senke skruehodet pent ned i overflaten (bruk forsenkbor)</li>
        </Ul>
        <P>
          Les mer om teknikk og bitervalg i <a href="/byggeguider/forboring-og-senkning">
            guiden om forboring og senkning</a>.
        </P>
        <Callout variant="tip" title="Én boring, to operasjoner">
          Et kombinert forsenkbor lager hull og forsenkingsrom i én operasjon. Tidsbesparende og
          gir et rent, profesjonelt resultat uten synlig skruehode.
        </Callout>
      </>
    ),
  },
]

export default function RiktigSkruePage() {
  return (
    <GuideArticleLayout
      slug="riktig-skrue"
      readingTime="6 min"
      lead="Riktig skrue er halvparten av jobben: feil type ruster, sprekker treet eller slipper tak. Her er hva du trenger å vite om typer, materiale og lengde."
      sections={sections}
    />
  )
}
