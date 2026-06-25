import GuideArticleLayout, {
  Callout,
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
          Tre som gråner ute er et naturlig fenomen forårsaket av UV-stråling og vær – ikke av
          råte. Gråfargen sitter i de ytterste trefibrene og er i seg selv ufarlig for
          konstruksjonen. Du kan enten omfavne den som patina, eller bruke en treoppfrisker
          og ny overflatebehandling for å hente tilbake den varme trefaren.
        </P>
        <Callout variant="tip" title="Gråning er ikke råte">
          Grånet tre er ikke nødvendigvis skadet. Sjekk konstruksjonen ved å stikke en
          spikkel inn i treverket – gir det ikke etter, er det friskt.
        </Callout>
      </>
    ),
  },
  {
    id: 'hvorfor-graner',
    heading: 'Hvorfor gråner tre?',
    content: (
      <>
        <P>
          Ubehandlet tre som utsettes for sol og regn gråner gradvis over 1–3 år. Prosessen
          skjer i to trinn:
        </P>
        <Ul>
          <li>
            <strong>UV-nedbrytning:</strong> Sollys bryter ned lignin – bindemidlet som holder
            trefibrene sammen og gir treet farge. De ytterste fibrene blekner og løsner.
          </li>
          <li>
            <strong>Fukt og sølvgrå patina:</strong> Vekslingen mellom vått og tørt sprekker
            overflaten, og tanniner vaskes ut. Resultatet er den karakteristiske sølvgrå fargen.
          </li>
        </Ul>
        <P>
          Gråningen foregår kun i de øverste 0,5–2 mm av treverket. Under det grå sjiktet
          er treet i de fleste tilfeller helt friskt. Nordisk furu og gran gråner raskere
          enn harde tropiske treslag som teak og ipe, som gråner langsommere og jevnere.
        </P>
      </>
    ),
  },
  {
    id: 'gråning-vs-råte',
    heading: 'Gråning vs. råte – hvordan skille dem?',
    content: (
      <>
        <P>
          Det er viktig å skille mellom kosmetisk gråning og faktisk råteskade. Her er de
          viktigste tegnene:
        </P>
        <H3>Tegn på gråning (kosmetisk)</H3>
        <Ul>
          <li>Jevn grå eller sølvgrå farge over hele flaten</li>
          <li>Treverket er hardt når du trykker eller stikker i det</li>
          <li>Ingen mørke, fuktige flekker eller svampaktig konsistens</li>
        </Ul>
        <H3>Tegn på råte (strukturell skade)</H3>
        <Ul>
          <li>Treverket er mykt, svampaktig eller gir etter ved trykk</li>
          <li>Mørke, misfargte flekker som lukter mugg</li>
          <li>Sprekker og klyving som går dypere enn overflaten</li>
          <li>Treverket smuler mellom fingrene</li>
        </Ul>
        <Callout variant="warn" title="Sjekk stolpefotene nøye">
          Råte starter oftest der tre møter bakken eller vann samler seg – ved stolpeføtter,
          under beslag og langs endeved. Inspiser disse stedene grundig hvert år.
        </Callout>
      </>
    ),
  },
  {
    id: 'omfavne-patina',
    heading: 'La gråneten stå – naturlig patina',
    content: (
      <>
        <P>
          Mange velger å la treet gråne naturlig. Dette er en legitim estetisk retning som
          krever minimalt vedlikehold. Teak, ipe og western red cedar ser spesielt pene ut
          med patina, og det er en grunn til at ubehandlet kledning og terrasser er populære
          i skandinavisk arkitektur.
        </P>
        <P>
          Husk at selv om du lar treet gråne, bør du fortsatt:
        </P>
        <Ul>
          <li>Vaske terrassen hvert år for å fjerne alger og mose</li>
          <li>Inspiser konstruksjonen for råte og løse festemidler</li>
          <li>Sørge for god drenering under og rundt terrassen</li>
        </Ul>
        <P>
          Ubehandlet, grånet tre er ikke et fravalg av vedlikehold – det er et bevisst
          estetisk valg som fortsatt krever jevnlig oppfølging av konstruksjonen.
        </P>
      </>
    ),
  },
  {
    id: 'gjenopprette',
    heading: 'Gjenopprette fargen – slik gjør du det',
    content: (
      <>
        <P>
          Ønsker du å hente tilbake den varme trefaren, bruker du en treoppfrisker eller
          gråtrefjerner. Disse produktene inneholder milde syrer som løser opp det grå
          overflatesjiktet og åpner porene for ny behandling.
        </P>
        <Ol>
          <li>Vask terrassen grundig med terrasserens og la tørke i 24 timer.</li>
          <li>
            Bland treoppfrisker etter anvisning og påfør jevnt med kost eller sprøyte.
          </li>
          <li>La virke i 10–20 minutter – overflaten vil lysne synlig.</li>
          <li>Skrubb lett med en kost langs treretningen.</li>
          <li>Skyll grundig med hageslange, fjern alt restprodukt.</li>
          <li>La tørke i minst 48 timer.</li>
          <li>
            Påfør beis eller olje mens treverket er åpent og suger godt – dette gir
            best inntrengning og feste.
          </li>
        </Ol>
        <P>
          For svært værbitt tre med ru overflate kan du i tillegg pusse lett med 80–100
          korn slipepapir langs treretningen etter treoppfriskeren og før beising. Støv
          grundig av etterpå.
        </P>
        <Callout variant="tip" title="Rett etter treoppfrisker er ideelt">
          Tre som nettopp har fått treoppfrisker suger olje og beis ekstra godt. Beise
          innen 24–48 timer etter skylling gir det beste resultatet.
        </Callout>
        <P>
          Se også artikkelen om{' '}
          <a href="/byggeguider/vedlikehold-terrasse">vedlikehold av terrasse</a> og{' '}
          <a href="/byggeguider/beis-olje-maling">beis vs. olje vs. maling</a> for
          produktvalg og påføring.
        </P>
      </>
    ),
  },
]

export default function GranetTrePage() {
  return (
    <GuideArticleLayout
      slug="granet-tre"
      readingTime="4 min"
      lead="Grånet tre er ikke råte – lær hvorfor tre gråner, når du bør reagere, og hvordan du enkelt gjenoppretter den varme trefaren med treoppfrisker og beis."
      sections={sections}
    />
  )
}
