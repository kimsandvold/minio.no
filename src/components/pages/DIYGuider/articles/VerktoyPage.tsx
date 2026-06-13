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
    id: 'grunnutstyret',
    heading: 'Grunnutstyret',
    content: (
      <>
        <P>
          Du trenger overraskende lite for å komme i gang. Med denne lille samlingen kommer du i mål
          med de aller fleste hageprosjekter:
        </P>
        <Ul>
          <li>
            <strong>Tommestokk eller målebånd</strong> – til å måle.
          </li>
          <li>
            <strong>Blyant</strong> – til å merke.
          </li>
          <li>
            <strong>Vinkelhake</strong> – til å tegne rette vinkler og sjekke at noe er i vinkel.
          </li>
          <li>
            <strong>Håndsag</strong> – til å kappe.
          </li>
          <li>
            <strong>Drill/skrutrekker</strong> – til å forbore og skru.
          </li>
          <li>
            <strong>Et par tvinger</strong> – til å holde delene mens du jobber.
          </li>
        </Ul>
        <P>Har du dette, kan du bygge. Resten er bekvemmelighet og tempo.</P>
      </>
    ),
  },
  {
    id: 'mal-og-merke',
    heading: 'Måle- og merkeverktøy',
    content: (
      <>
        <P>
          Presisjonen i prosjektet starter her. En vinkelhake og en blyant med fin spiss gjør mer for
          resultatet enn dyrt elektroverktøy. Et vater er også greit å ha for alt som skal stå rett.
        </P>
        <Callout variant="tip" title="Én tommestokk hele veien">
          Bruk samme måleverktøy gjennom hele prosjektet. To tommestokker kan vise ørlite forskjellig,
          og da slutter delene å passe. Mer om dette i guiden om måling &amp; merking.
        </Callout>
      </>
    ),
  },
  {
    id: 'saging',
    heading: 'Saging – hånd eller elektrisk?',
    content: (
      <>
        <P>
          En god håndsag tar deg langt og koster lite. Skal du kappe mye, sparer elektrisk verktøy
          deg for tid og gir jevnere kutt:
        </P>
        <Ul>
          <li>
            <strong>Håndsag</strong> – billig, stillegående, alltid klar. Perfekt for små prosjekter.
          </li>
          <li>
            <strong>Stikksag</strong> – allsidig, fin til kurver og utsparinger.
          </li>
          <li>
            <strong>Sirkelsag</strong> – raske, rette kutt i mange bord.
          </li>
          <li>
            <strong>Kapp- og gjærsag</strong> – luksus for nøyaktige, gjentatte kapp i vinkel.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'drill-og-skru',
    heading: 'Drill og skruing',
    content: (
      <>
        <P>
          En batteridrill er det elektroverktøyet du får mest igjen for. Den både forborer og skrur,
          og gjør jobben langt raskere enn en manuell skrutrekker.
        </P>
        <H3>Gode bits og bor</H3>
        <P>
          Invester i ordentlige skrubits og et lite sett trebor. Slitte bits sklir ut av skruehodet og
          ødelegger både skrue og humør. Et bor til forboring hindrer at treet sprekker.
        </P>
      </>
    ),
  },
  {
    id: 'tvinger',
    heading: 'Tvinger – det undervurderte verktøyet',
    content: (
      <>
        <P>
          Tvinger (klemmer) er som «ekstra hender». De holder delene på plass mens limet tørker og
          mens du skrur, så alt blir der du vil ha det. Nesten alle som bygger, oppdager at de har for
          få.
        </P>
        <Callout variant="tip" title="Kjøp flere enn du tror">
          Du trenger nesten alltid én tvinge til enn du har. Et par stykker rekker langt i starten,
          men de er billige – og uvurderlige når du limer.
        </Callout>
      </>
    ),
  },
  {
    id: 'kjekt-a-ha',
    heading: 'Basis vs. kjekt å ha',
    content: (
      <>
        <DataTable>
          <caption>Bygg opp verktøykassa etter behov</caption>
          <thead>
            <tr>
              <th>Til å begynne med</th>
              <th>Neste steg</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tommestokk, blyant, vinkelhake</td>
              <td>Vater, krittsnor</td>
            </tr>
            <tr>
              <td>Håndsag</td>
              <td>Stikksag eller sirkelsag</td>
            </tr>
            <tr>
              <td>Batteridrill</td>
              <td>Egen skrumaskin + drill</td>
            </tr>
            <tr>
              <td>2–3 tvinger</td>
              <td>Flere tvinger i ulike lengder</td>
            </tr>
            <tr>
              <td>Slipepapir for hånd</td>
              <td>Eksentersliper</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Ikke kjøp alt på en gang. Start med grunnutstyret, og suppler etter hvert som prosjektene
          dine krever det.
        </P>
      </>
    ),
  },
]

export default function VerktoyPage() {
  return (
    <GuideArticleLayout
      slug="verktoy"
      readingTime="6 min"
      lead="Du trenger ikke et fullt verksted for å bygge fint. Her er grunnutstyret som tar deg langt – og hva som er verdt å supplere med etter hvert."
      sections={sections}
    />
  )
}
