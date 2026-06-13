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
    id: 'hvorfor-slipe',
    heading: 'Hvorfor slipe?',
    content: (
      <>
        <P>
          Sliping er det som skiller et hjemmesnekret preg fra et proft resultat. Det fjerner flis og
          ujevnheter, gjør overflaten behagelig å ta på, og – like viktig – gir beis, olje og maling
          noe å feste seg i. Hopper du over slipingen, vises det med en gang behandlingen er på.
        </P>
      </>
    ),
  },
  {
    id: 'kornethet',
    heading: 'Kornethet – grovt til fint',
    content: (
      <>
        <P>
          Slipepapir merkes med et tall: lavt tall er grovt, høyt tall er fint. Du jobber deg fra
          grovt til fint, og hopper ikke over trinn – det grove fjerner materiale, det fine glatter ut
          riftene det grove etterlot.
        </P>
        <DataTable>
          <caption>Vanlig progresjon</caption>
          <thead>
            <tr>
              <th>Korn</th>
              <th>Bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>60–80 (grovt)</td>
              <td>Fjerne ujevnheter, runde skarpe kanter, grovt utgangspunkt</td>
            </tr>
            <tr>
              <td>120 (middels)</td>
              <td>Hovedslipingen for de fleste prosjekter</td>
            </tr>
            <tr>
              <td>180–240 (fint)</td>
              <td>Finish før behandling, og lett sliping mellom strøk</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Ikke hopp over korn">
          Går du rett fra 80 til 240, blir du aldri kvitt de grove riftene – du bare polerer dem. Ta
          trinnene i rekkefølge, så blir overflaten jevn.
        </Callout>
      </>
    ),
  },
  {
    id: 'teknikk',
    heading: 'Teknikk',
    content: (
      <>
        <P>
          Den gylne regelen: slip alltid <strong>med</strong> fiberretningen i treet, aldri på tvers.
          Riper på tvers av åren er vanskelige å fjerne og blir godt synlige når behandlingen kommer
          på.
        </P>
        <Ul>
          <li>Hold jevnt, lett trykk – la papiret gjøre jobben.</li>
          <li>Beveg deg jevnt over hele flaten, ikke stå på ett sted.</li>
          <li>Bytt papir når det blir slitt; et tett, blankt papir sliper ikke lenger.</li>
        </Ul>
      </>
    ),
  },
  {
    id: 'hand-vs-maskin',
    heading: 'Hånd eller maskin?',
    content: (
      <>
        <H3>Slipekloss for hånd</H3>
        <P>
          Til mindre flater og kanter er en slipekloss med papir rundt helt fint – og du har full
          kontroll. En kloss gir jevnere trykk enn bare fingrene.
        </P>
        <H3>Eksentersliper</H3>
        <P>
          Skal du slipe mye, sparer en eksentersliper deg for både tid og krefter. Den gir en jevn,
          fin overflate – men la den gli, ikke press den ned.
        </P>
      </>
    ),
  },
  {
    id: 'kanter-og-hjorner',
    heading: 'Kanter og hjørner',
    content: (
      <>
        <P>
          Bryt de skarpe kantene lett med litt sliping. En knivskarp kant er lett å få flis av, og
          maling og beis trekker seg tilbake fra helt skarpe hjørner. En liten avrunding kjennes bedre
          og holder behandlingen bedre.
        </P>
        <Callout variant="tip" title="Bryt kantene – ikke rund dem helt">
          Noen få drag med papiret er nok til å «brekke» kanten. Du vil ikke runde den helt av med
          mindre det er meningen – bare ta brodden av.
        </Callout>
      </>
    ),
  },
  {
    id: 'stov-for-behandling',
    heading: 'Fjern støvet før du behandler',
    content: (
      <>
        <P>
          Når slipingen er ferdig, må alt slipestøv vekk før beis eller maling. Børst av, og tørk over
          med en lett fuktig klut. Støv som blir igjen, binder seg inn i behandlingen og gir en ru,
          kornete overflate. Da er du klar for overflatebehandling.
        </P>
      </>
    ),
  },
]

export default function SlipingPage() {
  return (
    <GuideArticleLayout
      slug="sliping"
      readingTime="5 min"
      lead="Sliping er det lille ekstra som gir et proft resultat. Slik velger du riktig kornethet, sliper med teknikk – og forbereder overflaten for behandling."
      sections={sections}
    />
  )
}
