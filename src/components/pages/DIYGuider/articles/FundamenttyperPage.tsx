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
          For de fleste hageprosjekter i Norge – terrasse, bod, carport eller pergola – er det tre
          fundamenttyper å velge mellom: punktfundament (enkelt betongfundament), betongsåle
          (helstøpt plate) og skruefundament (stålspiral i jorda). Riktig valg avhenger av
          grunntype, byggets størrelse, tillatt belastning og hvor mye jobb du er villig til å
          legge ned.
        </P>
        <Callout variant="tip" title="Start med grunnforhold">
          Sjekk om du har leire, sand eller fjell i bakken før du bestemmer deg. Grunntypen er
          den enkeltfaktoren som oftest avgjør hvilken fundamenttype som egner seg.
        </Callout>
      </>
    ),
  },
  {
    id: 'sammenligning',
    heading: 'Sammenligning av fundamenttyper',
    content: (
      <>
        <P>
          Tabellen under gir en rask oversikt. Alle verdier er veiledende – se egne seksjoner
          nedenfor for detaljer.
        </P>
        <DataTable>
          <caption>Fundamenttyper – veiledende sammenligning</caption>
          <thead>
            <tr>
              <th>Fundamenttype</th>
              <th>Egnet til</th>
              <th>Relativ innsats</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Punktfundament</td>
              <td>Terrasse, bod, pergola, carport</td>
              <td>Middels</td>
            </tr>
            <tr>
              <td>Betongsåle</td>
              <td>Garasje, større bod, carport</td>
              <td>Høy</td>
            </tr>
            <tr>
              <td>Skruefundament</td>
              <td>Terrasse, lett bod, pergola</td>
              <td>Lav–middels</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Bærende konstruksjoner krever fagvurdering">
          Tabellen over er veiledende. For bærende konstruksjoner som garasje eller større
          carport bør en fagperson vurdere grunnforhold, snølast og dimensjonering.
        </Callout>
      </>
    ),
  },
  {
    id: 'punktfundament',
    heading: 'Punktfundament',
    content: (
      <>
        <P>
          Et punktfundament er en isolert betongkloss eller betongpillar som bærer én stolpe.
          Du graver ned til <a href="/byggeguider/frostfri-dybde">frostfri dybde</a>, legger pukk
          i bunn, støper betong og setter en stolpesko mens betongen er fersk. Resultatet er et
          stabilt, frostsikkert forankringspunkt.
        </P>
        <H3>Fordeler</H3>
        <Ul>
          <li>Lavere kostnad enn helstøpt plate – du bruker bare betong der du trenger det.</li>
          <li>Raskere å grave og støpe enn en betongsåle.</li>
          <li>God løsning på skrå tomter der en plate ville krevd mye sprengning eller fylling.</li>
          <li>Enkelt å tilpasse antall punkter til konstruksjonens størrelse.</li>
        </Ul>
        <H3>Ulemper</H3>
        <Ul>
          <li>Krever nøyaktig oppmåling – punktene må stå i lod og rett linje.</li>
          <li>Justerbar stolpesko er nødvendig for å kompensere for små ujevnheter.</li>
          <li>Passer best til konstruksjoner med stolper, ikke til gulvplater eller vegger.</li>
        </Ul>
        <P>
          Se <a href="/byggeguider/stope-punktfundament">steg-for-steg-guiden for punktfundament</a>{' '}
          og <a href="/byggeguider/justerbar-stolpesko">guiden om justerbar stolpesko</a> for
          detaljer om montering.
        </P>
      </>
    ),
  },
  {
    id: 'betongsale',
    heading: 'Betongsåle (helstøpt plate)',
    content: (
      <>
        <P>
          En betongsåle er en sammenhengende betongplate som dekker hele grunnflaten. Den er
          standard under garasjer, større boder og bygg som skal ha gulv direkte på betong.
          Platen fordeler lasten over et stort areal, noe som reduserer setninger.
        </P>
        <H3>Fordeler</H3>
        <Ul>
          <li>Stivt og stabilt – tåler større laster og er robust mot setninger.</li>
          <li>Gir et ferdig gulv som kan belegges direkte.</li>
          <li>Velegnet der grunnforholdene er vanskelige (myk jord, høy grunnvannstand).</li>
        </Ul>
        <H3>Ulemper</H3>
        <Ul>
          <li>Kostbart – store mengder betong, armering og gravearbeid.</li>
          <li>Krever maskinell hjelp og gjerne fagfolk for forskaling og armering.</li>
          <li>Overkill for enkle terrasser og pergola-konstruksjoner.</li>
          <li>Krever drenerende fyllmasser under platen for å unngå telehiv.</li>
        </Ul>
        <Callout variant="warn" title="Armering og frost">
          En betongsåle som ikke er riktig drenert og armert kan sprekke av telehiv. Frostfri
          dybde og tilstrekkelig dreneringssjikt under platen er obligatorisk.
        </Callout>
      </>
    ),
  },
  {
    id: 'skruefundament',
    heading: 'Skruefundament (stålspiral)',
    content: (
      <>
        <P>
          Skruefundamenter – også kalt jordskruer eller helixpæler – er stålrør med spiralblad
          som skrues ned i jorda. De kan monteres raskt uten graving, og mange modeller er
          justerbare i høyde. Løsningen har blitt populær til terrasser og lette hagebygg.
        </P>
        <H3>Fordeler</H3>
        <Ul>
          <li>Ingen graving, ingen betong – kan monteres på en dag.</li>
          <li>Kan skrues ut igjen og flyttes dersom konstruksjonen fjernes.</li>
          <li>God løsning der grunnvann eller fjell setter grenser for graving.</li>
          <li>Justerbar høyde gjør det enkelt å nivellere på skrå terreng.</li>
        </Ul>
        <H3>Ulemper</H3>
        <Ul>
          <li>Krever jord uten stein – steinrik jord stopper spiralen.</li>
          <li>Dårlig egnet i leire med høy telefare uten spesialtiltak.</li>
          <li>Bæreevne er avhengig av jordkvaliteten og pælens diameter.</li>
          <li>Høyere materialkostnad enn betong for store prosjekter.</li>
        </Ul>
        <P>
          For lette konstruksjoner som pergola anbefales skruefundament med dimensjon tilpasset
          konstruksjonen. Se <a href="/planleggere/pergola">pergolaplanleggeren</a> for tips om
          antall stolper og plassering.
        </P>
      </>
    ),
  },
  {
    id: 'valg',
    heading: 'Hvilket fundament skal du velge?',
    content: (
      <>
        <P>
          Valget mellom de tre typene avhenger av tre faktorer: hva du bygger, hva du har i
          bakken, og hvor mye jobb du vil gjøre selv.
        </P>
        <Ol>
          <li>
            <strong>Terrasse eller pergola</strong> – punktfundament eller skruefundament. Punktfundament
            er rimeligere i materialer, skruefundament er raskere å montere.
          </li>
          <li>
            <strong>Bod eller carport</strong> – punktfundament fungerer godt for lette konstruksjoner.
            Større carport med tung takkonstruksjon kan kreve betongsåle.
          </li>
          <li>
            <strong>Garasje</strong> – betongsåle er standard. Krev gjerne plantegning og
            fagvurdering av armering.
          </li>
          <li>
            <strong>Fjell nær overflaten</strong> – bruk ekspansjonsbolt i fjell eller spesialtilpassede
            festepunkter i stedet for graving.
          </li>
          <li>
            <strong>Leire eller silt</strong> – grav alltid til frostfri dybde og dren godt.
            Vurder geoteknisk rådgivning for tyngre bygg.
          </li>
        </Ol>
        <P>
          Trenger du hjelp med carport? <a href="/planleggere/carport">Carportplanleggeren</a>{' '}
          hjelper deg med dimensjoner og stolpeplassering. For terrasse, se{' '}
          <a href="/planleggere/terrasse">terrasseplanneren</a>.
        </P>
      </>
    ),
  },
]

export default function FundamenttyperPage() {
  return (
    <GuideArticleLayout
      slug="fundamenttyper"
      readingTime="6 min"
      lead="Punktfundament, betongsåle eller skruefundament? Slik velger du riktig fundament til terrasse, bod eller carport."
      sections={sections}
    />
  )
}
