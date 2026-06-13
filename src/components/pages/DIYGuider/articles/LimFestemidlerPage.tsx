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
    id: 'skruer',
    heading: 'Skruer',
    content: (
      <>
        <P>
          Skruer er den vanligste måten å sette deler sammen på – sterke, og lette å skru fra hverandre
          igjen om noe må rettes. To ting avgjør om de gjør jobben: lengden og materialet.
        </P>
        <H3>Riktig lengde</H3>
        <P>
          En grei regel er at skruen bør gå minst dobbelt så langt inn i det nederste bordet som
          tykkelsen på det øverste. Skrur du gjennom et 20 mm bord, vil du ha minst 40 mm til i delen
          under – altså en skrue rundt 60 mm.
        </P>
      </>
    ),
  },
  {
    id: 'skruer-for-ute',
    heading: 'Skruer for utebruk',
    content: (
      <>
        <P>
          Dette er feilen som ødelegger flest uteprosjekter: vanlige innendørsskruer ruster og lager
          stygge svarte renner i treet – og mister til slutt grepet. Ute må du bruke skruer laget for
          det.
        </P>
        <DataTable>
          <caption>Velg etter miljø</caption>
          <thead>
            <tr>
              <th>Type</th>
              <th>Passer til</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Varmgalvanisert</td>
              <td>Generelt utebruk, impregnert tre</td>
            </tr>
            <tr>
              <td>Rustfri (A2)</td>
              <td>Utsatt ute, synlige detaljer</td>
            </tr>
            <tr>
              <td>Syrefast (A4)</td>
              <td>Nær sjø og svært fuktige miljø</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Aldri innendørsskruer ute">
          Blanke, ubehandlede skruer hører hjemme innendørs. Brukt ute ruster de fort – og rusten
          renner ut i treverket og setter varige flekker.
        </Callout>
      </>
    ),
  },
  {
    id: 'forboring',
    heading: 'Forboring',
    content: (
      <>
        <P>
          Å forbore et hull før skruen går i, hindrer at treet sprekker – særlig nær endene og i hardt
          eller tørt virke. Det tar noen sekunder ekstra og redder mang en del.
        </P>
        <Callout variant="tip" title="Når det er viktigst">
          Forbor alltid nær enden av et bord og når du skrur i smale lister. Det er akkurat der treet
          ellers slår sprekker.
        </Callout>
      </>
    ),
  },
  {
    id: 'trelim',
    heading: 'Trelim',
    content: (
      <>
        <P>
          Lim og skruer er et radarpar: skruene holder delene sammen mens limet tørker, og limet gir
          en skjøt som ofte blir sterkere enn treet selv. Til utebruk må limet tåle fukt.
        </P>
        <Ul>
          <li>
            <strong>Trelim klasse D3</strong> – tåler fukt og sporadisk vann. Greit til de fleste
            uteprosjekter under tak.
          </li>
          <li>
            <strong>Trelim klasse D4</strong> – mest vannbestandig. Velg dette for ting som står
            værhardt til.
          </li>
        </Ul>
        <P>
          Press delene godt sammen med tvinger mens limet herder, og tørk bort lim som presses ut med
          en fuktig klut – tørket lim tar ikke beis eller olje.
        </P>
      </>
    ),
  },
  {
    id: 'beslag',
    heading: 'Beslag',
    content: (
      <>
        <P>
          Beslag er ferdige metalldeler som forsterker skjøter og forenkler montering. De fordeler
          kreftene over et større område og gir et stødig resultat uten avansert tilpasning.
        </P>
        <Ul>
          <li>
            <strong>Vinkelbeslag</strong> – forsterker hjørner og rette vinkler.
          </li>
          <li>
            <strong>Bjelkesko</strong> – bærer enden av en bjelke.
          </li>
          <li>
            <strong>Stolpesko</strong> – holder en stolpe opp fra bakken, så enden ikke råtner.
          </li>
        </Ul>
        <P>Velg beslag og tilhørende skruer i samme værbestandige kvalitet som ellers ute.</P>
      </>
    ),
  },
]

export default function LimFestemidlerPage() {
  return (
    <GuideArticleLayout
      slug="lim-og-festemidler"
      readingTime="6 min"
      lead="Det som holder delene sammen, avgjør om bygget består. Slik velger du riktige skruer, lim og beslag – så det sitter, og ikke ruster i stykker ute."
      sections={sections}
    />
  )
}
