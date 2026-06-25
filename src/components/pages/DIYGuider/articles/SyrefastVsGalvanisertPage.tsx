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
          Skruer og beslag ute trenger et belegg eller et materiale som motstår fukt og
          korrosjonsangrep. Det finnes fire praktiske nivåer å velge mellom, fra billig
          elektrogalvanisert til syrefast A4. For de fleste terrasseprosjekter er varmgalvanisert
          et greit minimum – men nær sjøen eller mot impregnert tre bør du gå opp til A4.
        </P>
        <Callout variant="tip" title="Enkel huskeregel">
          Vanlig terrasse i innlandet: varmgalvanisert. Kystnært eller impregnert tre: syrefast A4.
          Prisforskjellen er liten – angeren over billig valg er dyr.
        </Callout>
      </>
    ),
  },
  {
    id: 'korrosjonsklasser',
    heading: 'De fire korrosjonsklassene',
    content: (
      <>
        <P>
          Fasteners klassifiseres etter evne til å motstå korrosjon. Jo strengere miljø, jo høyere
          klasse trenger du. Her er en oversikt over det du møter i praksis.
        </P>
        <DataTable>
          <caption>Klasse og bruksområde</caption>
          <thead>
            <tr>
              <th>Klasse</th>
              <th>Belegg / materiale</th>
              <th>Typisk bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Elektrogalvanisert</td>
              <td>Tynt sinkbelegg (5–12 µm)</td>
              <td>Kun innendørs, tørt</td>
            </tr>
            <tr>
              <td>Varmgalvanisert (HDG)</td>
              <td>Tykt sinkbelegg (45–85 µm)</td>
              <td>Generelt utebruk, impregnert tre</td>
            </tr>
            <tr>
              <td>Rustfri A2</td>
              <td>Rustfritt stål (18/8)</td>
              <td>Utsatt ute, synlige detaljer</td>
            </tr>
            <tr>
              <td>Syrefast A4</td>
              <td>Molybden-stål (316)</td>
              <td>Sjønært, impregnert tre, basseng</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Mikronivået (µm) på sinket avgjør levetiden i praksis. Et tykt varmgalvanisert belegg
          kan vare 30+ år i normalt utemiljø, mens elektrogalvanisert begynner å ruste etter
          én–to vintre ute.
        </P>
      </>
    ),
  },
  {
    id: 'varmgalvanisert',
    heading: 'Varmgalvanisert – det praktiske standardvalget',
    content: (
      <>
        <P>
          Varmgalvanisering dypper stålet i smeltet sink ved ~450 °C, noe som gir et langt tykkere
          og mer jevnt belegg enn elektrogalvanisering. Resultatet er en matt, lett ru overflate
          som tåler slag og mekanisk slitasje bedre enn tynne belegg.
        </P>
        <Ul>
          <li>God korrosjonsbestandighet i normalt utemiljø</li>
          <li>Tåler fukt, regn og sporadisk kontakt med ferskvann</li>
          <li>Akseptabel til de fleste trykkimpregnerte tresorter</li>
          <li>Klart billigere enn rustfritt</li>
        </Ul>
        <P>
          Varmgalvanisert er standard på mange byggevarehyllene og et solid valg til terrasser,
          gjerder, carporter og andre utekonstruksjoner i normalt innlandsklima.
        </P>
      </>
    ),
  },
  {
    id: 'rustfri-a2',
    heading: 'Rustfri A2 – for synlige detaljer og mer utsatte steder',
    content: (
      <>
        <P>
          A2 (AISI 304) er det vanligste rustfrie stålet. Det inneholder 18 % krom og 8 % nikkel,
          som danner et passivt oksidlag som beskytter mot korrosjon. Overflaten er blank og pen –
          bra der skruehodene synes.
        </P>
        <P>
          A2 holder godt i de fleste norske utemiljø, men i salt luft nær havet kan det likevel
          prikk-ruste over tid. Her bør du gå opp til A4.
        </P>
      </>
    ),
  },
  {
    id: 'syrefast-a4',
    heading: 'Syrefast A4 – når det virkelig teller',
    content: (
      <>
        <P>
          A4 (AISI 316) tilsetter molybden til A2-sammensetningen. Det gjør materialet langt mer
          bestandig mot klorid – altså saltvann og saltholdige miljø. Prisen er 20–40 % høyere enn
          A2, men for et fastener som skal sitte i 20–30 år er det en liten merkostnad.
        </P>
        <Ul>
          <li>Bruk A4 innen 500 m fra saltvann</li>
          <li>Bruk A4 mot kobberbasert trykkimpregnering (Cu-salt)</li>
          <li>Bruk A4 der det samler seg vann i beslag og spalter</li>
          <li>Bruk A4 rundt basseng og i fuktige kjelleranlegg</li>
        </Ul>
        <Callout variant="warn" title="Billige skruer ødelegger treverket">
          Rustflekker fra dårlige skruer er nesten umulige å fjerne fra tre. De renner ned langs
          treet og setter seg permanent i fiberen. Vær gjerrig på alt annet – ikke på fasteners.
        </Callout>
      </>
    ),
  },
  {
    id: 'impregnert-tre',
    heading: 'Særskilt om impregnert tre',
    content: (
      <>
        <P>
          Trykkimpregnert tre behandlet med kobberbaserte midler (CCA, Cu-HDX og lignende) inneholder
          salter som reagerer elektrokjemisk med sink. Kontakt mellom sink og kobber i fuktig miljø
          akselererer korrosjon – det betyr at varmgalvaniserte skruer kan tæres fortere enn
          normalt mot impregnert tre.
        </P>
        <P>
          Produsenter av impregnert tre anbefaler derfor syrefast A4 som sikker standard. Noen
          godtar varmgalvanisert (HDG klasse C) i tørrere innlandsmiljø, men ved tvil velger du A4.
          Les mer i <a href="/byggeguider/riktig-skrue">guiden om riktig skrue til riktig jobb</a>.
        </P>
      </>
    ),
  },
  {
    id: 'kostnad',
    heading: 'Hva koster det egentlig mer?',
    content: (
      <>
        <P>
          La oss si du bygger en 20 m² terrasse og trenger ca. 400 skruer (se{' '}
          <a href="/byggeguider/hvor-mange-skruer">estimatguiden</a>). En pakke à 200 stk.
          terrasseskruer i varmgalvanisert koster typisk 150–200 kr, mens syrefast A4 koster
          250–350 kr. Differansen for hele terrassen er 200–300 kr.
        </P>
        <P>
          Til sammenligning: å bytte ut rustne skruer og slipe bort rustflekker etter tre–fire år
          koster mange timer arbeid og hundrevis av kroner i materialer. Invester 200 kr nå.
        </P>
        <Callout variant="tip" title="Kjøp riktig første gang">
          Sjekk pakken nøye i butikken. «Rustfri» uten angivelse av A2 eller A4 er ofte bare
          elektrogalvanisert med blank overflate. Se etter ISO 3506 A2 eller A4 på emballasjen.
        </Callout>
      </>
    ),
  },
]

export default function SyrefastVsGalvanisertPage() {
  return (
    <GuideArticleLayout
      slug="syrefast-vs-galvanisert"
      readingTime="5 min"
      lead="Syrefast (A4) eller galvanisert? Slik velger du riktig korrosjonsklasse på skruer og beslag – og unngår rust."
      sections={sections}
    />
  )
}
