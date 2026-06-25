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
          Sirkelsagen kutter rette linjer raskt og presist, dykksagen er sirkelsagens
          roligere storebror med skinnesystem for kabinettmakerkvalitet, og stikksagen
          tar seg av kurver og utskjæringer. Til utendørs terrassebygg og enkel hobbysnekring
          klarer du deg langt med en god sirkelsag og en stikksag.
        </P>
        <Callout variant="tip" title="Råd til deg som skal starte">
          Kjøp en rimelig sirkelsag med 165 mm blad til grovarbeidet, og legg til en
          billig stikksag for kurver. Trenger du kabinettfinish uten støvfres og
          vedlikeholdstid, er en dykksag med skinne investeringen verdt.
        </Callout>
      </>
    ),
  },
  {
    id: 'sirkelsagen',
    heading: 'Sirkelsagen – arbeidshesteн',
    content: (
      <>
        <P>
          Sirkelsagen er standardverktøyet for de fleste trearbeid. Den kutter raskt
          langs rette linjer, takler dimensjonslast og er tilgjengelig i de fleste
          prisklasser. Et 165 mm blad med 24 tenner er allround og passer til alt fra
          terrassebord til bjelker. Ønsker du renere overflate, velger du et blad med
          40–60 tenner.
        </P>
        <P>
          Begrensningen er at sirkelsagen trenger et anlegg eller en rett kant for å
          holde linjen. Uten støtte er det lett å vandre av sporet. Løsningen er enten
          en klemmt rettskjær (en planke fungerer utmerket) eller en føringsskinne.
          Les mer om teknikken i guiden{' '}
          <a href="/byggeguider/rette-fine-kutt">Slik får du rette, fine kutt</a>.
        </P>
        <H3>Sagdybde og skråkutt</H3>
        <P>
          De fleste sirkelsager lar deg stille sagdybden og vinkle skiven til 45°.
          Sett alltid sagdybden til ca. 5–10 mm mer enn materialtykkelsen – bladet
          skal akkurat stikke gjennom, ikke mer. Slik reduserer du splintring og
          forbedrer sikkerheten.
        </P>
        <Callout variant="warn" title="Sikkerhet">
          Hold alltid fri sone under arbeidsstykket. Bruk klemmer, ikke hendene dine,
          til å holde materialet. Vernebriller og hørselvern er påbudt.
        </Callout>
      </>
    ),
  },
  {
    id: 'dykksagen',
    heading: 'Dykksagen – presisjon med skinne',
    content: (
      <>
        <P>
          Dykksagen (også kalt dykkesag eller dykksirkelsag) er konstruert for bruk
          med en aluminium-føringsskinne. Sagen dykker ned i materialet på nøyaktig
          angitt sted og glir langs skinnen. Resultatet er et kutt med nesten null
          splintring på oversiden, parallelt og rett fra første til siste millimeter.
        </P>
        <P>
          Skinnesystemet gjør det enkelt å kutte store plater alene. Du klemmer
          skinnen til platen, legger sagen an og drar. Festemekanismen på sagen
          sikrer at den ikke kan gli av skinnen. Festool, Makita og Mafell har egne
          skinnesystemer, men det finnes også billigere alternativer som fungerer
          godt til hobbybruk.
        </P>
        <H3>Når velger du dykksag?</H3>
        <Ul>
          <li>Du kutter mange plater (kryssfiner, MDF, limt) der splintring er uakseptabelt.</li>
          <li>Du jobber alene med store materialer uten hjelp til å holde.</li>
          <li>Du vil ha gjentakbare, presise lengdekutt uten å sette opp bord og anlegg.</li>
        </Ul>
        <P>
          Ulempen er pris. En komplett dykksag med skinne koster gjerne 3–5 ganger
          mer enn en enkel sirkelsag. Til utendørs terrasseprosjekter og enkle
          konstruksjoner er dykksagen overkill; den skinner (ordspill ment) i
          innendørs møbelarbeid og prefabrikasjonssnekring.
        </P>
      </>
    ),
  },
  {
    id: 'stikksagen',
    heading: 'Stikksagen – for kurver og utskjæringer',
    content: (
      <>
        <P>
          Stikksagen beveger bladet opp og ned med høy hastighet og er eneste
          håndholdte sag som kan følge en kurve. Den er uunnværlig når du skal skjære
          rundt en stolpe, lage buerunder hjørner eller ta hull i et bord for et
          nedsenket rør.
        </P>
        <P>
          For rette kutt er stikksagen tregere og mindre presis enn sirkelsagen.
          Du kan forbedre resultatet med et anlegg, men for lange rette kutt er det
          bedre å bytte sag. Bladvalget er viktig: bruk grove tannblad (T101B) til
          tre og fintennte blad til spor i panel eller laminat.
        </P>
        <H3>Pendelslagsfunksjon</H3>
        <P>
          De fleste stikksager har justerbart pendelslag som styrer bladets
          fremoverrotasjon. Høyt pendelslag gir raskere kutt i grovt tre; null
          pendelslag gir renere kutt i finere materialer. Start på middels og
          juster etter behov.
        </P>
      </>
    ),
  },
  {
    id: 'samligning',
    heading: 'Hvilken sag til hva?',
    content: (
      <>
        <P>
          Her er en oversikt over når du bør velge hvilken sag. Tabellen tar ikke
          stilling til pris – se det som en teknisk veiledning.
        </P>
        <DataTable>
          <caption>Sagtypenes styrker og bruksområder</caption>
          <thead>
            <tr>
              <th>Sag</th>
              <th>Best til</th>
              <th>Ikke ideell til</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sirkelsag</td>
              <td>Rette kutt i bjelkar, planker og bord; terrassebygg</td>
              <td>Kurver, store plater uten anlegg, finéroverflater</td>
            </tr>
            <tr>
              <td>Dykksag + skinne</td>
              <td>Presise kutt i plater (kryssfiner, MDF, laminat)</td>
              <td>Kurver, bjelker, grove konstruksjonsoppgaver</td>
            </tr>
            <tr>
              <td>Stikksag</td>
              <td>Kurver, utskjæringer, hull, trange hjørner</td>
              <td>Lange rette kutt, høy produksjonsrate</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'foeringsskinne',
    heading: 'Føringsskinne – også for vanlig sirkelsag',
    content: (
      <>
        <P>
          Du trenger ikke en dykksag for å bruke føringsskinne. Mange produsenter
          selger adaptere slik at en vanlig sirkelsag kan skyves langs en
          aluminiumsskinne. Resultatet er langt bedre enn å sage fritt eller mot
          en klemt planke, og det koster en brøkdel av en dykksag.
        </P>
        <P>
          Alternativet er å lage en enkel sageguide av to planker skrudd i vinkel.
          Fest den til arbeidsstykket med klemmer, legg sagens anlegg mot kanten og
          dra. Det tar fem minutter å lage, og du kan gjenbruke den mange ganger.
        </P>
        <Callout variant="tip" title="Splintring på oversiden?">
          Lim en stripe malertape langs kuttelinjen på oversiden av materialet.
          Sagen kutter gjennom tapen, og når du drar av tapen, følger ikke trøfiberne med.
          Fungerer spesielt godt med stikksag og sirkelsag på laminat og finér.
        </Callout>
      </>
    ),
  },
  {
    id: 'bladvalg',
    heading: 'Bladvalg gjør halve jobben',
    content: (
      <>
        <P>
          Riktig blad er like viktig som riktig sag. Grovt blad (færre tenner per
          tomme) kutter raskt men grovt. Fintannet blad (mange tenner) kutter sakte
          men rent.
        </P>
        <Ol>
          <li>
            <strong>24 TPI (tann per tomme):</strong> Grovt kutt i konstruksjonsvirke,
            bjelkar, trykkimpregnert. Rask fjerning av materiale.
          </li>
          <li>
            <strong>40 TPI:</strong> Allround til terrassebord og høvlede planker.
            Bra balanse mellom hastighet og overflate.
          </li>
          <li>
            <strong>60+ TPI:</strong> Fin finish i hardtre, laminat og kryssfiner.
            Nødvendig der synlig overflate er viktig.
          </li>
        </Ol>
        <P>
          Se <a href="/byggeguider/verktoy">Verktøyoversikten</a> for anbefalinger
          om merker og innkjøpssted.
        </P>
      </>
    ),
  },
]

export default function SirkelsagDykksagStikksagPage() {
  return (
    <GuideArticleLayout
      slug="sirkelsag-dykksag-stikksag"
      readingTime="7 min"
      lead="Sirkelsag, dykksag eller stikksag? Lær hva hver sag gjør best, når du trenger skinne, og hvordan bladvalget avgjør resultatet."
      sections={sections}
    />
  )
}
