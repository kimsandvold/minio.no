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
          Riktig oppmåling er halvparten av jobben. En enkel vater koster under hundre
          kroner og er nok for de fleste prosjekter. For terrassebygg og større
          konstruksjoner er diagonal-måling og 3-4-5-metoden uunnværlige verktøy som
          ikke krever noe annet enn et målebånd.
        </P>
        <Callout variant="tip" title="Start alltid med å sjekke">
          Mål to ganger, kutt én gang – det gamle rådet gjelder fortsatt. Bruk ti
          sekunder ekstra på å bekrefte målet med et nytt uttak fra et annet punkt.
        </Callout>
      </>
    ),
  },
  {
    id: 'vater',
    heading: 'Vateret – det enkleste nivåverktøyet',
    content: (
      <>
        <P>
          Et vater har en eller flere ampuller fylt med farget væske og ei luftboble.
          Når boblen er sentrert mellom de to merkene, er flaten i vater (horisontal)
          eller i lodd (vertikal). Et 60 cm vater er det mest allsidige for hobbybruk;
          lengre vatere gir bedre presisjon over lange strekk.
        </P>
        <H3>Slik bruker du vateret riktig</H3>
        <Ul>
          <li>Legg vateret direkte mot overflaten, ikke på et skjevt underlag.</li>
          <li>Les ampullen i øyenhøyde – vinkelen du ser ned eller opp fra gir feil avlesning.</li>
          <li>Sjekk vateret selv: legg det på en flat flate, noter posisjonen, snu det 180° og les igjen. Begge lesninger skal stemme.</li>
        </Ul>
        <P>
          For kortere avstander (30–50 cm) holder et billig vater. Over en meter bør du
          ha et godt merke-vater eller bruke vannvateret.
        </P>
      </>
    ),
  },
  {
    id: 'vannvater',
    heading: 'Vannvater og slangevater',
    content: (
      <>
        <P>
          Et slangevater er en lang gjennomsiktig slange fylt med vann. Når begge endene
          holdes rolige, vil vannstanden alltid være identisk i begge ender uavhengig av
          avstand. Det er fysikk, og det er gratis.
        </P>
        <P>
          Bruk slangevater for å overføre høydemål mellom to punkter som er langt fra
          hverandre – for eksempel fra ett hjørne av terrassen til det andre, eller fra
          husveggen til en frittstående stolpe. Kjøp en ferdig slangevater med graduerte
          markeringer, eller lag din egen av klar hageslange og to transparente rørende.
        </P>
        <Callout variant="warn" title="Pass på luftbobler">
          Luftbobler i slangen gir feil avlesning. Fyll sakte og la vannet renne ut
          begge ender til slangen er fri for luft.
        </Callout>
      </>
    ),
  },
  {
    id: 'krysslaser',
    heading: 'Krysslaser – raskt og nøyaktig',
    content: (
      <>
        <P>
          En krysslaser projiserer et horisontalt og vertikalt laserplan på vegger og
          flater. Den erstatter vateret for mange oppgaver og er særlig nyttig når du
          jobber alene: sett laseren, og du har en referanselinje på tvers av hele rommet.
        </P>
        <P>
          Til utendørsbruk mister de fleste lasere synlighet i sterkt sollys. Sjekk at
          laseren er IP54 (støv- og vannsikker) og at den har et synlig rød- eller grønstråle.
          Grønn laser synes bedre enn rød i dagslys.
        </P>
        <P>
          For hobbybruk holder et nivellerende krysslaser til 300–600 kr. Profesjonelle
          rotasjonslasere er langt dyrere og nødvendig kun ved store flater.
        </P>
      </>
    ),
  },
  {
    id: 'tre-fire-fem',
    heading: '3-4-5-metoden for rette vinkler',
    content: (
      <>
        <P>
          Pythagoras' teorem forteller oss at en trekant med sider 3, 4 og 5 alltid
          har en rett vinkel (90°) mellom de to korteste sidene. Det er din billigste
          vinkelmåler.
        </P>
        <DataTable>
          <caption>Eksempler på 3-4-5-kombinasjoner (skaler opp ved behov)</caption>
          <thead>
            <tr>
              <th>Side A</th>
              <th>Side B</th>
              <th>Hypotenuse C</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>300 mm</td>
              <td>400 mm</td>
              <td>500 mm</td>
            </tr>
            <tr>
              <td>600 mm</td>
              <td>800 mm</td>
              <td>1000 mm</td>
            </tr>
            <tr>
              <td>900 mm</td>
              <td>1200 mm</td>
              <td>1500 mm</td>
            </tr>
          </tbody>
        </DataTable>
        <H3>Slik gjør du det i praksis</H3>
        <Ol>
          <li>Merk et punkt langs den ene siden, 300 mm (eller 600, 900) fra hjørnet.</li>
          <li>Merk et punkt langs den andre siden, 400 mm (eller 800, 1200) fra hjørnet.</li>
          <li>Mål avstanden mellom de to merkede punktene. Er den 500 mm (eller 1000, 1500) er vinkelen nøyaktig 90°.</li>
          <li>Juster konstruksjonen til målet stemmer, deretter fest den.</li>
        </Ol>
        <P>
          Bruk så store tall som mulig – jo lengre strekk, jo mer tydelig er avviket.
          Til en terrassekonstruksjon på 4×5 m er det fornuftig å bruke 3000–4000–5000 mm.
        </P>
      </>
    ),
  },
  {
    id: 'diagonal-maling',
    heading: 'Diagonal-måling for firkantet konstruksjon',
    content: (
      <>
        <P>
          En firkant der alle vinkler er 90° har like lange diagonaler. Mål begge
          diagonalene i konstruksjonen din: er de like lange, er alt i lodd. Er de
          ulike, juster inntil de stemmer.
        </P>
        <P>
          Diagonal-måling er raskere enn 3-4-5 for store rektangler og fungerer
          utmerket til å sjekke terrasserammen, et dørfelt eller en bygningsskalle.
          Kombiner gjerne begge metodene: 3-4-5 for å lage første vinkel, og
          diagonalmåling for å bekrefte hele rammen.
        </P>
        <Callout variant="tip" title="For terrassen din">
          Se <a href="/planleggere/terrasse">terrasseplannleggeren</a> for å beregne
          materialbehovet – men husk at alle mål i planen forutsetter en firkantet,
          rett konstruksjon. Bruk diagonal-målingen for å bekrefte det på stedet.
        </Callout>
      </>
    ),
  },
  {
    id: 'vanlige-feil',
    heading: 'Vanlige målingsfeil',
    content: (
      <>
        <P>
          Selv erfarne snekkere gjør disse feilene. Vit om dem, og du unngår dem:
        </P>
        <Ul>
          <li>
            <strong>Målebåndets krok:</strong> Kroken i enden av målebåndet beveger seg
            litt med vilje – den kompenserer for om du haker eller presser. Ikke klem den
            fast til materialet.
          </li>
          <li>
            <strong>Blyant i vinkel:</strong> En skrå blyant mot et lineål gir et mål
            som er forskjøvet. Hold alltid blyanten loddrett.
          </li>
          <li>
            <strong>Akkumulerte feil:</strong> Ikke mål steg-for-steg fra én kant av et
            brett. Flytt alltid nullpunktet til målebåndet til neste mål fra
            samme referansepunkt.
          </li>
          <li>
            <strong>Varme og kulde:</strong> Tre endrer dimensjon med fukt og temperatur.
            Mål materialet etter at det har ligget på stedet noen timer.
          </li>
        </Ul>
      </>
    ),
  },
]

export default function VaterLaserOppmalingPage() {
  return (
    <GuideArticleLayout
      slug="vater-laser-oppmaling"
      readingTime="6 min"
      lead="Lær å bruke vater, slangevater og krysslaser, og behersk 3-4-5-metoden og diagonal-måling for nøyaktige, rette konstruksjoner."
      sections={sections}
    />
  )
}
