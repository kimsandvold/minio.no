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
          Skjult terrassefeste er clips eller skinnesystemer som holder bordene fast fra siden
          eller undersiden – slik at overflaten er fri for synlige skruehoder. Resultatet er en
          renere terrasse som er enklere å holde fri for smuss. Ulempen er noe høyere kostnad
          og at du trenger enten ferdigsporfresede bord eller fres spora selv.
        </P>
        <Callout variant="tip" title="Ferdig sporfresede bord sparer tid">
          Kjøp bord med dobbelt spor fra produsenten fremfor å frese selv. Det er mer presist,
          raskere og sparer deg for en ekstra maskin.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-skjult-feste',
    heading: 'Hva er skjult terrassefeste?',
    content: (
      <>
        <P>
          Tradisjonelle terrassebord skrus ovenfra med to skruer per bord per bjelke. Det holder
          godt, men gir et rutete mønster av skruehoder i overflaten som samler vann og skitt,
          og kan se uferdig ut.
        </P>
        <P>
          Skjult feste løser dette ved å klemme boardet fast fra siden. En clip eller klemme
          settes ned i sporet langs kanten av bordet, festes til bjelken med en skrue, og neste
          bord skyves inn og klemmer clipa fast. Resultatet er en ren overflate uten synlige
          festemidler.
        </P>
      </>
    ),
  },
  {
    id: 'systemtyper',
    heading: 'De vanligste systemtypene',
    content: (
      <>
        <H3>Clip-systemer (T-clips og lignende)</H3>
        <P>
          En T-clip er en liten plastklips eller metallklips som plasseres i sporet mellom to
          bord. Den festes til bjelken med én skrue og sørger for avstand mellom bordene
          (typisk 4–6 mm). Billig, enkelt og utbredt – men funker bare med sporfresede bord.
        </P>
        <H3>Skinnefeste</H3>
        <P>
          Her monteres en lang skinne på bjelken, og bordene klikkes fast i skinnen. Gir jevn
          avstand automatisk og er raskere enn enkeltclips over store flater. Høyere kostnad per
          m², men spart tid kan forsvare det.
        </P>
        <H3>Sideskrue (nesten skjult)</H3>
        <P>
          Skruen skyves inn i et vinkel hull fra siden av bordet og ned i bjelken. Hodet er skjult
          bak nabobordets kant. Fungerer uten spor, men krever foretaksboremaskine for 45°-hull
          og er noe mer tidkrevende. Godt valg der du vil ha skjult feste uten å investere i
          sporfresing.
        </P>
        <DataTable>
          <caption>Systemsammenligning</caption>
          <thead>
            <tr>
              <th>System</th>
              <th>Krever spor</th>
              <th>Kostnad (relativt)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>T-clip / plastclips</td>
              <td>Ja, enkelt spor</td>
              <td>Lav</td>
            </tr>
            <tr>
              <td>Metallclips</td>
              <td>Ja, dobbelt spor</td>
              <td>Middels</td>
            </tr>
            <tr>
              <td>Skinnefeste</td>
              <td>Ja, dobbelt spor</td>
              <td>Høy</td>
            </tr>
            <tr>
              <td>Sideskrue (45°)</td>
              <td>Nei</td>
              <td>Lav–middels</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'fordeler-ulemper',
    heading: 'Fordeler og ulemper mot ovenfra-skruer',
    content: (
      <>
        <Ul>
          <li>
            <strong>Fordeler:</strong> Rent utseende uten skruehoder. Ingen vannansamling rundt
            skruene. Enklere rengjøring. Bord kan demonteres uten å skru ut hundrevis av skruer.
          </li>
          <li>
            <strong>Ulemper:</strong> Høyere materialkostnad (clips + sporfresing). Mer tid per
            bord å legge. Krever sporfresede bord eller ekstra verktøy. Ytterste bord langs veggen
            må fortsatt topskrues og maskeres.
          </li>
        </Ul>
        <Callout variant="warn" title="Ytterste bord er alltid et unntak">
          Det første og siste bordet langs kanten av terrassen kan ikke holdes med clips alene –
          de har bare én fri side. Her topskruer du, og bruker eventuelt dybholte plugger for
          å skjule skruehodet.
        </Callout>
      </>
    ),
  },
  {
    id: 'spacing',
    heading: 'Avstand mellom bord',
    content: (
      <>
        <P>
          Riktig spaltebredde er 4–6 mm for de fleste norske tresorter. Spalten lar vann renne av,
          gir plass til at treet sveller i fuktig vær og holder smuss fra å pakke seg. For tett
          (under 3 mm) og vann samler seg; for åpent (over 8 mm) og det er ubehagelig å gå på.
        </P>
        <P>
          De fleste clips-systemer sørger for riktig avstand automatisk. Bruker du sideskrue,
          legg et passende mellomlegg (f.eks. en 5 mm spikerbit) mellom bordene mens du skruer.
        </P>
        <P>
          Planlegger du terrassen fra scratch? Bruk{' '}
          <a href="/planleggere/terrasse">terrasseplanleggeren</a> til å beregne antall bord,
          bjelkefordeling og materialbehovet.
        </P>
      </>
    ),
  },
  {
    id: 'hvilke-bord',
    heading: 'Hvilke bord trenger spor?',
    content: (
      <>
        <P>
          Clips-systemer krever at borda har et fresespor langs begge langsidene. De fleste
          leverandører av terrassebord tilbyr ferdigsporfresede varianter – sjekk at sporet
          passer systemet ditt (bredde og dybde varierer mellom produsenter).
        </P>
        <P>
          Har du kjøpt glatte bord uten spor, kan du frese selv med en bordkantfres og en
          stasjonær router eller et bordkantfresejern. Det krever litt erfaring for å få jevn dybde
          langs hele lengden. Les mer om ulike terrassebordsorter og dimensjoner i{' '}
          <a href="/byggeguider/terrassebord-guide">terrassebord-guiden</a>.
        </P>
        <Callout variant="tip" title="Test systemet på noen testbord">
          Kjøp noen ekstra bord og øv på montering av clips-systemet før du legger den ferdige
          terrassen. Da finner du ut om clipsen sitter og om du har riktig teknikk – uten å risikere
          de gode bordene.
        </Callout>
      </>
    ),
  },
]

export default function SkjultTerrassefestePage() {
  return (
    <GuideArticleLayout
      slug="skjult-terrassefeste"
      readingTime="5 min"
      lead="Skjult terrassefeste gir et rent dekke uten synlige skruer. Slik fungerer systemene og hvilke bord de passer til."
      sections={sections}
    />
  )
}
