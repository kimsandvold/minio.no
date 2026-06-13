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
    id: 'hvorfor-tegne',
    heading: 'Hvorfor tegne før du bygger?',
    content: (
      <>
        <P>
          En tegning tvinger deg til å ta avgjørelsene <em>før</em> du står med materialet. Hvor høyt,
          hvor bredt, hvordan delene møtes – alt dette er gratis å endre på et ark, men dyrt å endre
          når bordet allerede er kappet.
        </P>
        <P>
          Du trenger ikke være flink til å tegne. Målet er ikke et kunstverk, men et arbeidsdokument
          du selv forstår – noe å regne mål ut fra og handle etter.
        </P>
      </>
    ),
  },
  {
    id: 'papir-eller-digitalt',
    heading: 'Papir eller digitalt?',
    content: (
      <>
        <P>
          Begge deler funker. Valget handler om hvor stort og presist prosjektet er, og hva du er
          komfortabel med.
        </P>
        <DataTable>
          <caption>Kort oppsummert</caption>
          <thead>
            <tr>
              <th>Metode</th>
              <th>Passer til</th>
              <th>Fordel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Papir &amp; blyant</td>
              <td>De fleste hageprosjekter</td>
              <td>Raskt, enkelt, alltid for hånden</td>
            </tr>
            <tr>
              <td>Ruteark</td>
              <td>Når mål skal stemme</td>
              <td>Hver rute = et fast mål, lett å skalere</td>
            </tr>
            <tr>
              <td>Digitalt (3D)</td>
              <td>Større eller mer presise bygg</td>
              <td>Ser det ferdig, fanger feil før du bygger</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="tip" title="Start på papir">
          Selv om du ender opp digitalt, er en rask håndskisse den beste måten å få idéen ut av hodet
          på. Tegn først, rentegn etterpå.
        </Callout>
      </>
    ),
  },
  {
    id: 'slik-tegner-du',
    heading: 'Slik tegner du prosjektet',
    content: (
      <>
        <P>
          Tegn prosjektet fra flere sider, ikke bare forfra. Det er først når du ser det fra siden og
          ovenfra at du oppdager hvordan delene egentlig møtes.
        </P>
        <Ul>
          <li>
            <strong>Forfra</strong> – høyde og bredde, det folk ser.
          </li>
          <li>
            <strong>Fra siden</strong> – dybde, vinkler og hvordan beina står.
          </li>
          <li>
            <strong>Ovenfra</strong> – hvordan delene ligger i forhold til hverandre.
          </li>
        </Ul>
        <P>
          Tegn i målestokk på ruteark – la for eksempel én rute være 5 cm. Da blir tegningen riktig i
          proporsjonene, og du ser med en gang om noe blir for spinkelt eller for massivt.
        </P>
      </>
    ),
  },
  {
    id: 'malsetting',
    heading: 'Sett på mål',
    content: (
      <>
        <P>
          En tegning uten mål er bare en skisse. Skriv på lengde, bredde og høyde for hver del, og
          mål for avstandene mellom dem. Husk å tegne med den faktiske tykkelsen på bordene – det er
          her de fleste regnestykkene ryker.
        </P>
        <Callout variant="warn" title="Innvendig vs. utvendig mål">
          Vær tydelig på om et mål er utvendig eller innvendig. En kasse på 40 cm utvendig med 2 cm
          tykke vegger blir bare 36 cm innvendig. Marker hva målene gjelder, så slipper du
          overraskelser.
        </Callout>
      </>
    ),
  },
  {
    id: 'fra-tegning-til-kappeliste',
    heading: 'Fra tegning til kappeliste',
    content: (
      <>
        <P>
          Når tegningen har mål, er du nesten ferdig med planleggingen. Gå gjennom hver del og før den
          opp i en kappeliste:
        </P>
        <Ol>
          <li>Noter hver del med lengde, bredde og antall.</li>
          <li>Grupper like deler – fire like bein, to like sider.</li>
          <li>Regn om til hvor mange hele bord du trenger å kjøpe.</li>
        </Ol>
        <P>
          Denne lista er fasiten du sager etter, og grunnlaget for handleturen. Mer om hvordan du
          bygger lista og handler smart finner du i guiden om planlegging.
        </P>
      </>
    ),
  },
]

export default function DesignTegningPage() {
  return (
    <GuideArticleLayout
      slug="design-og-tegning"
      readingTime="5 min"
      lead="En enkel tegning gjør avgjørelsene før du kapper det første bordet. Slik skisser du prosjektet – på papir eller digitalt – og gjør det om til mål du kan bygge etter."
      sections={sections}
    />
  )
}
