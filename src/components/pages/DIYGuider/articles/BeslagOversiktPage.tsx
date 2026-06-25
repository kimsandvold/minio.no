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
          Beslag er ferdige metalldeler som forsterker skjøter, bærer bjelker og holder stolper på
          plass. De sparer tid, gir presis montering og fordeler kreftene på en måte løse skruer
          ikke klarer alene. Bruk alltid riktige beslagsskruer – og fyll alle hullene.
        </P>
        <Callout variant="tip" title="Fyll alle hull">
          Et beslag er bare like sterkt som festemidlene som sitter i det. Bruk de beslagskruene
          eller kamspikerne produsenten oppgir, og fyll samtlige hull – ikke annenhvert.
        </Callout>
      </>
    ),
  },
  {
    id: 'oversikt',
    heading: 'Oversikt over vanlige beslag',
    content: (
      <>
        <P>
          De fleste byggeprosjekter ute bruker en håndfull standardbeslag. Her er de viktigste
          og hva de løser.
        </P>
        <DataTable>
          <caption>Beslag og bruksområde</caption>
          <thead>
            <tr>
              <th>Beslag</th>
              <th>Typisk bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bjelkesko</td>
              <td>Bære ende av bjelke i ramme</td>
            </tr>
            <tr>
              <td>Vinkelbeslag</td>
              <td>Forsterke hjørner og rette vinkler</td>
            </tr>
            <tr>
              <td>Stolpesko / stolpefot</td>
              <td>Feste stolpe til betong/fundament</td>
            </tr>
            <tr>
              <td>Hulplate / reparasjonsplate</td>
              <td>Forsterke skjøter og svake punkter</td>
            </tr>
            <tr>
              <td>Strekkbånd</td>
              <td>Forankre og avstive konstruksjoner</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Alle beslag til utebruk skal være varmgalvanisert eller syrefast A4 – velg etter miljø,
          som forklart i <a href="/byggeguider/syrefast-vs-galvanisert">Syrefast (A4) vs. galvanisert</a>.
        </P>
      </>
    ),
  },
  {
    id: 'bjelkesko',
    heading: 'Bjelkesko',
    content: (
      <>
        <P>
          En bjelkesko er U-formet og holder enden av en bjelke eller åser nede i en ramme.
          Den lar bjelken hvile på beslag fremfor å bære på en enkelt skrue i endveden –
          endved (tverrsnitt) er det svakeste stedet å skru i tre.
        </P>
        <H3>Montering</H3>
        <Ul>
          <li>Fest bjelkeskoen til bærebjelken eller ledebjelken først, med kamspiker i alle hull.</li>
          <li>Sett bjelken ned i skoen og fest med kamspiker gjennom siden.</li>
          <li>Kontroller at bjelken sitter loddrett og i flukt med resten av ramma.</li>
          <li>Bruk aldri vanlige treskruer som erstatning for beslagskruer – de har for lite
            skjærstyrke.</li>
        </Ul>
        <P>
          Bjelkesko finnes i åpne og lukkede varianter. Åpne (U-form) monteres utenfra; lukkede
          monteres på stedet og bjelken skyves inn. Velg dimensjon etter bjelkens bredde – det
          skal sitte stramt uten å kile seg.
        </P>
      </>
    ),
  },
  {
    id: 'vinkelbeslag',
    heading: 'Vinkelbeslag',
    content: (
      <>
        <P>
          Vinkelbeslag er enkle L-formede plater som forsterker en 90°-skjøt mellom to stykker tre.
          De brukes overalt: i rammer, i hyller, i rekkverksposter og til å feste bjelker til
          vegger.
        </P>
        <P>
          Vanlige størrelser er 40 × 40 mm til 90 × 90 mm. Større beslag gir bedre kraftfordeling;
          bruk de minste bare der det ikke er store laster. For tyngre konstruksjoner finnes kraftige
          byggbeslag med ekstra tykkelse.
        </P>
        <Callout variant="warn" title="Ikke erstatt konstruksjonsskruer med vinkelbeslag alene">
          Et lite vinkelbeslag kan ikke erstatte en lang konstruksjonsskrue i en bærende
          forbindelse. Kombiner gjerne begge der det er last – beslag gir stivhet,
          konstruksjonsskruen gir trekkstyrke.
        </Callout>
      </>
    ),
  },
  {
    id: 'stolpesko',
    heading: 'Stolpesko og stolpefot',
    content: (
      <>
        <P>
          En stolpesko holder en vertikal stolpe festet til et fundament, betongplate eller
          bjelke. Viktigst av alt: den løfter stolpen opp fra underlaget slik at enden ikke
          ligger i vann og råtner. Les en fullstendig gjennomgang i{' '}
          <a href="/byggeguider/justerbar-stolpesko">guiden om stolpesko mot betong</a>.
        </P>
        <Ul>
          <li><strong>Fast stolpesko</strong> – boltes fast i betong, stolpen kiles inn og festes
            med kamspiker.</li>
          <li><strong>Justerbar stolpesko</strong> – låter deg justere vinkel og høyde etter
            montering. Bra der betongen ikke er helt plan.</li>
          <li><strong>Innstøpt stolpefot</strong> – støpes inn i betong før den stivner.
            Gir sterk forbindelse, men er ikke justerbar.</li>
        </Ul>
      </>
    ),
  },
  {
    id: 'hulplate',
    heading: 'Hulplate og strekkbånd',
    content: (
      <>
        <P>
          En hulplate (perforert plate) er en flat metallplate med hull for spiker eller skruer.
          Den brukes til å forsterke skjøter, reparere svake punkter og til å feste parallelle
          bjelker mot hverandre. Hulplaten er fleksibel – du kan kutte den til ønsket lengde med
          en metallsaks.
        </P>
        <P>
          Strekkbånd er smale, perforerte stålbånd som brukes til å forankre og avstive vegger og
          takkonstruksjoner. De monteres diagonalt i veggrammer for å hindre racking – at ramma
          parallellforskyver seg. Fest dem med godkjente spiker gjennom alle hullene langs
          hele lengden.
        </P>
      </>
    ),
  },
  {
    id: 'festemidler-for-beslag',
    heading: 'Riktige festemidler til beslag',
    content: (
      <>
        <P>
          Beslag er dimensjonert for bestemte lastklasser – men bare om du bruker riktige
          festemidler. Kamspiker (ringspikerHvert) og beslagskruer har høy skjærstyrke og
          fyller hullet tett. Vanlige glatte spiker eller treskruer er svakere og kan løsne.
        </P>
        <Ul>
          <li>
            <strong>Kamspiker</strong> – spiralformet profil gir godt grep. Standard til bjelkesko
            og hulplate.
          </li>
          <li>
            <strong>Beslagskrue</strong> – alternativ til kamspiker der du vil kunne demontere.
            Bruk riktig dimensjon (ofte 4 × 40 mm).
          </li>
          <li>
            <strong>Ekspansjonsbolt / kjemisk anker</strong> – til festing mot betong. Se{' '}
            <a href="/byggeguider/justerbar-stolpesko">stolpeskoguiden</a> for detaljer.
          </li>
        </Ul>
        <Callout variant="tip" title="Sjekk produsentens datablad">
          Hvert beslag fra produsenter som Simpson Strong-Tie og Pitzl oppgir tillatt last og
          anbefalt spikermønster i sitt datablad. Følg det – ikke finn opp noe eget.
        </Callout>
      </>
    ),
  },
]

export default function BeslagOversiktPage() {
  return (
    <GuideArticleLayout
      slug="beslag-oversikt"
      readingTime="6 min"
      lead="Bjelkesko, vinkelbeslag og stolpesko forklart: hva hvert beslag brukes til, og hvilke festemidler som gjør at det holder."
      sections={sections}
    />
  )
}
