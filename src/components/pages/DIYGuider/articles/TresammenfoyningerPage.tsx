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
          De fleste hobbyprosjekter og utendørsbygg klarer seg fint med tre-fire enkle
          sammenføyninger. Stuksammenføyningen er rask men svak; halvt-i-halvt-overlapp
          og lommehull er bedre alternativer for de fleste konstruksjoner. Gjæring gir
          pen finish til synlige hjørner.
        </P>
        <Callout variant="tip" title="Beslag hjelper der du tviler">
          For rammehjørner og stolpe-bjelke-forbindelser gir et metallbeslag
          (vinkeljern, stolpesko, U-beslag) raskere og sterkere resultater enn de
          fleste tresammenføyninger. Bruk dem uten dårlig samvittighet.
        </Callout>
      </>
    ),
  },
  {
    id: 'stuksammenfoyning',
    heading: 'Stuksammenføyning – den enkle',
    content: (
      <>
        <P>
          Stuksammenføyning (butt joint) er to stykker tre lagt kant mot kant eller
          ende mot side og skrudd eller naglet fast. Det er den raskeste
          sammenføyningen å lage, men også den svakeste: treskruer i enden av et bord
          trekker lett ut fordi fiberne løper parallelt med skruens akse.
        </P>
        <P>
          Til lett belastning – for eksempel sideplanker på en enkel kasse eller en
          ramme som ikke bærer vekt – er stuksammenføyning fullt tilstrekkelig. Til
          konstruksjoner som skal bære statisk last bør du velge en sterkere løsning
          eller supplere med beslag.
        </P>
        <H3>Forbedre stuksammenføyningen</H3>
        <Ul>
          <li>Bruk lim i tillegg til skruer – det øker styrken vesentlig.</li>
          <li>Bruk to skruer per punkt, ikke én, for å hindre rotasjon.</li>
          <li>Legg forsøk på å koble inn i trevirkre sidegrain, ikke endeved.</li>
        </Ul>
      </>
    ),
  },
  {
    id: 'overlapp',
    heading: 'Halvt-i-halvt overlapp',
    content: (
      <>
        <P>
          Overlapp (eller halvt-i-halvt, lap joint) skjærer bort halvparten av
          materialtykkelsen i begge stykker. De glidende inn i hverandre, og
          kontaktflaten dobles. Resultatet er en langt sterkere forbindel enn
          stuk – og den er også langt mer motstandsdyktig mot skjærkrefter (shear).
        </P>
        <P>
          Den enkleste overlappen lages med sirkelsag og stemmejern. Merk halvdybden
          på begge stykker, gjør parallelle kutt med sag, og rens bort materialet med
          stemmejern eller dykksag. Alternativt bruk en ruter med rett bit.
        </P>
        <Callout variant="tip" title="Kryss-overlapp for rammer">
          Til en firkantet ramme eller rist der to bord krysser hverandre midt i feltet
          lager du en kryss-overlapp. Begge bord beholder full bredde, og overflaten
          er helt plan.
        </Callout>
      </>
    ),
  },
  {
    id: 'skrudd-stuk-med-beslag',
    heading: 'Skrudd stuk med beslag',
    content: (
      <>
        <P>
          En enkel vinkeljern eller L-beslag klaffet inn i et hjørne gir rask og
          sterk 90°-forbinding uten snekkerarbeid. Tre med tre L-beslag i tre størrelser
          i verktøykassen dekker de fleste hjørnerbehov i hobbyprosjekter.
        </P>
        <P>
          Til utendørsarbeid bør du bruke beslag av varmgalvanisert stål eller
          syrefast stål. Bruk skruer som matcher beslaget: for kort kortsider, for lange
          lange sider. Se{' '}
          <a href="/byggeguider/saging-og-sammenfoyning">Saging og sammenføyning</a> for
          oversikt over beslag og når du trenger dem.
        </P>
      </>
    ),
  },
  {
    id: 'lommehull',
    heading: 'Lommehullsskjøt (pocket hole)',
    content: (
      <>
        <P>
          Lommehullsboring bruker en spesialborekasse som borer et skrått hull
          inn i enden av et bord. Skruen skrues gjennom det skrå hullet og inn i
          det liggende brettets sidegrain – en langt sterkere forbinding enn å skrue
          rett inn i endeved.
        </P>
        <P>
          Et enkelt lommehullssett (Kreg R3 eller tilsvarende) koster 300–500 kr og
          dekker de aller fleste situasjoner. Metoden er populær til møbelbygg, men
          fungerer utmerket også til terrasse-ramme, benker og plattinger.
        </P>
        <H3>Bruksveiledning</H3>
        <Ul>
          <li>Still boredybden etter materialtykkelsen (se tabellen på jigen).</li>
          <li>Bor to hull per forbindelsespunkt for å hindre rotasjon.</li>
          <li>Bruk lommehullskruer (coarse thread til mykt tre, fine thread til hardtre og plate-materialer).</li>
          <li>Klem de to stykkene fast mot hverandre med en klemme mens du skruer.</li>
        </Ul>
        <Callout variant="warn" title="Synlig utenfra?">
          Lommehullene er ikke pene å se på. Plasser dem på den siden som er bortvendt
          fra det synlige, eller dekk med plugg.
        </Callout>
      </>
    ),
  },
  {
    id: 'gjaering',
    heading: 'Gjæring – 45° for pene hjørner',
    content: (
      <>
        <P>
          Gjæring er å kutte begge stykker i 45° slik at de møtes i et pent
          hjørne uten at noen ender vises. Brukes mye til listverk, rammer og
          synlige kanter på terrasse og uteplass.
        </P>
        <P>
          En gjæring er vakker men ikke spesielt sterk. Den har lite limflate og
          holder dårlig mot riving. Til dekorative formål holder lim alene; til
          konstruktive formål kombiner du med skjulte skruer, dybler eller spiker
          med spiker-spiker fra innsiden.
        </P>
        <P>
          Nøkkel til pen gjæring er presise kutt. En kappingsag med gjæringsstopp
          er ideell; alternativt bruk sirkelsag med vinkelstopp og en malerboks.
          Les om kutt i{' '}
          <a href="/byggeguider/rette-fine-kutt">Slik får du rette, fine kutt</a>.
        </P>
      </>
    ),
  },
  {
    id: 'oversikt',
    heading: 'Oversikt: skjøt etter bruk og styrke',
    content: (
      <>
        <DataTable>
          <caption>Vanlige skjøttyper, typisk bruksområde og relativ styrke</caption>
          <thead>
            <tr>
              <th>Skjøttype</th>
              <th>Typisk bruk</th>
              <th>Styrke</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Stuksammenføyning</td>
              <td>Enkle kasser, rammer uten last</td>
              <td>Lav</td>
            </tr>
            <tr>
              <td>Halvt-i-halvt overlapp</td>
              <td>Rammer, kryss-forbindelser</td>
              <td>Middels–høy</td>
            </tr>
            <tr>
              <td>Beslag + skruer</td>
              <td>Hjørner, stolpe-bjelke</td>
              <td>Høy</td>
            </tr>
            <tr>
              <td>Lommehull (pocket hole)</td>
              <td>Møbler, rammer, plattinger</td>
              <td>Middels–høy</td>
            </tr>
            <tr>
              <td>Gjæring (45°)</td>
              <td>Listverk, synlige hjørner</td>
              <td>Lav (estetisk)</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Vil du vite mer om skruer og festemidler som holder sammenføyningene dine?
          Se{' '}
          <a href="/byggeguider/riktig-skrue">guiden om riktig skrue</a>{' '}og{' '}
          <a href="/byggeguider/forboring-og-senkning">forboring og senkning</a>.
        </P>
      </>
    ),
  },
]

export default function TresammenfoyningerPage() {
  return (
    <GuideArticleLayout
      slug="tresammenfoyninger"
      readingTime="7 min"
      lead="Stuk, overlapp, lommehull eller gjæring – lær hvilke tresammenføyninger som passer til hobbyprosjekter og utendørsbygg, og hvor sterk hver er."
      sections={sections}
    />
  )
}
