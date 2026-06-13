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
    id: 'hva-skal-det-tale',
    heading: 'Hva skal det tåle?',
    content: (
      <>
        <P>
          Før du tenker på hvordan noe skal bygges, må du tenke på hva det skal tåle. En blomsterhylle
          som holder noen potter, og en benk tre voksne skal sette seg på samtidig, er to helt
          forskjellige oppgaver – selv om de kan se like ut.
        </P>
        <P>Tenk gjennom belastningen prosjektet faktisk utsettes for:</P>
        <Ul>
          <li>
            <strong>Vekt ovenfra</strong> – mennesker, potter, ved, snø på et tak.
          </li>
          <li>
            <strong>Belastning fra siden</strong> – noen som lener seg, eller vind på en stor flate.
          </li>
          <li>
            <strong>Bruk over tid</strong> – ting som åpnes, lukkes og flyttes svekkes gradvis.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'avstivning',
    heading: 'Avstivning – hemmeligheten bak et stødig bygg',
    content: (
      <>
        <P>
          Den vanligste grunnen til at hjemmesnekrede møbler vakler, er at de mangler avstivning. En
          firkant av fire bord kan vri seg til en skjev rombe uten at en eneste skrue ryker – formen
          i seg selv er ustabil.
        </P>
        <H3>Trekanten er din venn</H3>
        <P>
          En trekant kan ikke vri seg på samme måte. Derfor stabiliserer du en konstruksjon ved å
          innføre trekanter: et diagonalt bord (et «kryss» eller en skråstiver) mellom to bein, eller
          en bakplate som låser hele formen.
        </P>
        <Callout variant="tip" title="Test med hånden">
          Når rammen er skrudd sammen, dytt forsiktig på den fra siden. Vrir den seg? Da mangler den
          avstivning. Et enkelt diagonalbord bak eller under løser som regel problemet.
        </Callout>
      </>
    ),
  },
  {
    id: 'innfesting',
    heading: 'Innfesting – der delene møtes',
    content: (
      <>
        <P>
          En konstruksjon er aldri sterkere enn skjøtene. To bord som bare er skrudd ende mot ende,
          gir et svakt punkt. Du styrker skjøten ved å gi den mer flate å feste i, eller ved å la
          delene støtte hverandre.
        </P>
        <Ul>
          <li>Lim i tillegg til skruer gir en vesentlig sterkere skjøt enn skruer alene.</li>
          <li>To skruer i en skjøt hindrer at delen vrir seg rundt én enkelt skrue.</li>
          <li>En liten kloss eller et vinkelbeslag i hjørnet fordeler kreftene.</li>
        </Ul>
        <P>
          Mer om hvilke skruer, beslag og lim du bør velge, finner du i guiden om lim &amp;
          festemidler.
        </P>
      </>
    ),
  },
  {
    id: 'stabilitet',
    heading: 'Stabilitet og balanse',
    content: (
      <>
        <P>
          Et bygg kan være sterkt og likevel velte. Høye, smale ting (en reol, et fuglebrett på
          stang) trenger en bred eller tung fot for ikke å tippe. Jo høyere tyngdepunktet sitter, jo
          bredere må basen være.
        </P>
        <Callout variant="warn" title="Vingler det på ujevnt underlag?">
          Ute er bakken sjelden helt flat. Et bord med fire stive bein vil vippe på ett av dem.
          Vurder justerbare føtter, eller bygg slik at du kan kile opp ett bein – det sparer deg for
          mye irritasjon senere.
        </Callout>
      </>
    ),
  },
  {
    id: 'bygge-for-ute',
    heading: 'Bygge for vær og vind',
    content: (
      <>
        <P>
          Utendørs kommer det ekstra krefter til: vind tar tak i store flater, og snø er tyngre enn
          mange tror. Står prosjektet fritt, må det enten være tungt nok, festet til bakken, eller
          formet så vinden slipper gjennom.
        </P>
        <P>
          Den viktigste regelen for varige utebygg handler likevel om vann: hold treverket unna
          direkte bakkekontakt, og bygg slik at vann renner av i stedet for å bli stående. Det er den
          klart vanligste grunnen til at utendørs trekonstruksjoner råtner før tiden.
        </P>
      </>
    ),
  },
  {
    id: 'tommelfingerregler',
    heading: 'Noen tommelfingerregler',
    content: (
      <>
        <P>Når du er usikker, er disse gode utgangspunkter:</P>
        <DataTable>
          <caption>Veiledende – tilpass etter belastning</caption>
          <thead>
            <tr>
              <th>Situasjon</th>
              <th>Tommelfingerregel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Noe skal bære vekt</td>
              <td>Heller for kraftig enn for spinkelt – tre er billig, brudd er dyrt</td>
            </tr>
            <tr>
              <td>Rammen vrir seg</td>
              <td>Legg inn en diagonal eller en bakplate</td>
            </tr>
            <tr>
              <td>Lang, ustøttet planke</td>
              <td>Støtt opp på midten, eller bruk tykkere dimensjon</td>
            </tr>
            <tr>
              <td>Høyt og smalt</td>
              <td>Bredere fot, eller fest til vegg/bakke</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Er du i tvil, bygg en bit i full størrelse og belast den forsiktig før du fullfører. Det
          forteller deg mer enn noen regel.
        </P>
      </>
    ),
  },
]

export default function KonstruksjonStyrkePage() {
  return (
    <GuideArticleLayout
      slug="konstruksjon-og-styrke"
      readingTime="6 min"
      lead="Vil det tåle å sittes på? Holder det i vind og vær? Slik tenker du på belastning, avstivning og innfesting – så prosjektet blir stødig og varig."
      sections={sections}
    />
  )
}
