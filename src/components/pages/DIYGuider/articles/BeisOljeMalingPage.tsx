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
          Beis, olje og maling beskytter alle tre utendørs, men gjør det på forskjellige måter og
          passer til ulike situasjoner. Olje trenger inn i treverket og fremhever naturlig struktur,
          beis er tynnflytende og gir farge samtidig som det puster, mens maling legger et tett
          dekke som gir sterkest beskyttelse mot vær og vind.
        </P>
        <P>
          Valget avhenger av treslag, eksponering og hvor mye vedlikehold du vil drive med.
          Ubehandlet trykkimpregnert furu tåler beis og olje godt, mens hardere treslag som
          bankirai og teak gjerne foretrekker olje.
        </P>
        <Callout variant="tip" title="Tommelfingerregel">
          Olje til hardtre og møbler, beis til terrasse og kledning, maling der du vil ha et
          solid, dekkende overflatesjikt som tåler slitasje og hard UV-belastning.
        </Callout>
      </>
    ),
  },
  {
    id: 'olje',
    heading: 'Olje – fremhever og nærer treverket',
    content: (
      <>
        <P>
          Treoljer trenger ned i fibrene og metter treverket innenfra. Overflaten forblir matt og
          naturlig, og du ser trestrukturen tydelig. Olje er spesielt godt egnet for tette,
          harde treslag som teak, ipe og bankirai, fordi disse treslagene inneholder naturlige
          oljer som gjør at filmbaserte produkter ikke fester seg like godt.
        </P>
        <P>
          Ulempene er at olje krever hyppigere påføring enn maling – typisk hvert 1–2 år på
          terrasse, avhengig av slitasje og soleksponering. Du får heller ikke veldig kraftige
          fargevalg; produktene er som regel klare, lyse eller brune toner som følger treets
          naturlige farge.
        </P>
        <H3>Påføring av olje</H3>
        <P>
          Påfør olje på rent, tørt tre med kost, rull eller klut. La det trekke inn i 15–30
          minutter, og tørk deretter av overskuddet med en ren klut. Oljefylte kluter kan
          selvantenne – legg dem flatt utendørs til tørk, eller legg dem i vann i en bøtte
          og kast dem innpakket.
        </P>
        <Callout variant="warn" title="Brannfare med oljekluter">
          Kluter mettet med linolje eller treoljer kan selvantenne ved kompostering av varme.
          Legg alltid brukte kluter flatt til tørk i friluft, aldri sammenbrette.
        </Callout>
      </>
    ),
  },
  {
    id: 'beis',
    heading: 'Beis – farge og pustende beskyttelse',
    content: (
      <>
        <P>
          Beis er tynnflytende og trenger ned i overflaten uten å danne en tett film. Det gir
          farge og UV-beskyttelse, men slipper gjennom fuktighet slik at treverket kan "puste".
          Dermed slipper du problemer med avflassing og blemmedannelse som kan oppstå med
          filmbaserte produkter på utendørs tre.
        </P>
        <P>
          Beis kommer i to varianter: dekkbeis (pigmentert, delvis dekkende) og klarbeis
          (gjennomsiktig, fremhever trestrukturen). Dekkbeis gir sterkere fargepåvirkning og
          lengre vedlikeholdsintervall enn klarbeis.
        </P>
        <P>
          Terrasser, gjerder, kledning og hagegjerder er typiske bruksområder. Beis egner seg
          godt på trykkimpregnert tre etter at treverket er ferdig tørket ut. Les mer om
          dette i artikkelen om{' '}
          <a href="/byggeguider/trykkimpregnert-vs-royalimpregnert">
            trykkimpregnert vs. royalimpregnert
          </a>
          .
        </P>
      </>
    ),
  },
  {
    id: 'maling',
    heading: 'Maling – sterkest dekning, men krever forarbeid',
    content: (
      <>
        <P>
          Utendørs maling danner en tett film på overflaten som stenger ute fukt og UV-stråling
          svært effektivt. Det gir de lengste vedlikeholdsintervallene – opptil 5–8 år på godt
          forberedte flater – og det bredeste fargespekteret.
        </P>
        <P>
          Utfordringen er at filmmaling krever grundig forarbeid, og hvis fukt trenger inn under
          filmen – via umalte kanter, sprekker eller fuktighet i treverket ved påføring –
          vil malingen blemme og flasse. Vedlikehold av malt tre er dermed mer arbeidskrevende
          enn beis, fordi du gjerne må skrape og slipe bort gammel maling før nytt strøk.
        </P>
        <P>
          Maling passer best på treverk som er godt beskyttet fra undersiden og kantene, som
          kledning, vinduskarmer og møbler som lagres innendørs om vinteren.
        </P>
      </>
    ),
  },
  {
    id: 'sammenligning',
    heading: 'Sammenligning: beis, olje og maling',
    content: (
      <>
        <DataTable>
          <caption>Behandlingstype – egenskaper og bruksområder</caption>
          <thead>
            <tr>
              <th>Behandling</th>
              <th>Egenskaper</th>
              <th>Best til</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Olje</td>
              <td>Trenger inn, naturlig utseende, mat finish, 1–2 års intervall</td>
              <td>Hardtre (teak, ipe, bankirai), møbler</td>
            </tr>
            <tr>
              <td>Klarbeis</td>
              <td>Gjennomsiktig, fremhever trestruktur, pustende, 1–3 år</td>
              <td>Ny terrasse, kledning der du vil beholde trefarge</td>
            </tr>
            <tr>
              <td>Dekkbeis</td>
              <td>Pigmentert, delvis dekkende, pustende, 2–4 år</td>
              <td>Terrasse, gjerder, kledning med fargeønske</td>
            </tr>
            <tr>
              <td>Maling</td>
              <td>Tett film, bredt fargespekter, 5–8 år, flassrisiko</td>
              <td>Kledning, vinduskarmer, møbler med lagring innendørs</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Vedlikeholdsintervallene er veiledende og avhenger av eksponering, treslag og
          produktkvalitet. Sørvendte terrasser i solen krever hyppigere behandling enn
          nordfasader i skyggen.
        </P>
      </>
    ),
  },
  {
    id: 'nar-velge-hva',
    heading: 'Når velger du hva?',
    content: (
      <>
        <P>
          Har du en ny trykkimpregnert terrasse og vil beholde det naturlige preget, er klarbeis
          eller en lys treoljebeis et godt valg. Vil du ha en varm brunfarge, velg dekkbeis.
          Har du teak- eller ipemøbler, er ren trealje riktig.
        </P>
        <P>
          Skal du male kledning eller vil du ha full kontroll over fargen, velg utendørs
          maling med god grunningsmiddel på ubehandlede kanter. Husk alltid å male
          endeved og baksider før montering.
        </P>
        <Ul>
          <li>Ny terrasse i furu/gran: dekkbeis eller klarbeis</li>
          <li>Hardtre-møbler: trealje eller hardtre-olje</li>
          <li>Kledning med fargevalg: utendørs maling eller dekkbeis</li>
          <li>Gammel, grånet terrasse: rengjør, puss lett, deretter ny beis</li>
          <li>Pergola eller carport: beis eller maling avhengig av ønsket uttrykk</li>
        </Ul>
        <P>
          Les mer om konkrete påføringsteknikker og produktvalg i vår guide om{' '}
          <a href="/byggeguider/overflatebehandling">overflatebehandling</a>, og se{' '}
          <a href="/planleggere/terrasse">terrasseplanneren</a> hvis du planlegger å bygge
          ny terrasse.
        </P>
      </>
    ),
  },
  {
    id: 'forberedelse',
    heading: 'Forberedelse er halve jobben',
    content: (
      <>
        <P>
          Uansett om du velger beis, olje eller maling, er rengjøring og tørking det viktigste
          forarbeidet. Smuss, alger, gammel beis og fukt hindrer produktet i å feste seg og
          trenge inn. Bruk terrasserens eller trevasker, skyll godt og la treverket tørke
          i minst 48 timer ved pent vær.
        </P>
        <P>
          Puss overflaten lett med slipepapir (80–120 korn) langs treretningen hvis du bytter
          produkttype, eller hvis overflaten er ru og værbitt. Støv av grundig etterpå.
          Påfør alltid produktet ved temperaturer mellom 10 og 25 °C, og unngå direkte sol
          og regn under og rett etter påføring.
        </P>
        <Callout variant="tip" title="Test fuktinnholdet">
          Drypp noen vanndrpåer på overflaten. Trekker vannet raskt inn, er treverket tørt
          nok. Perler vannet seg opp, må du vente noen dager til.
        </Callout>
      </>
    ),
  },
]

export default function BeisOljeMalingPage() {
  return (
    <GuideArticleLayout
      slug="beis-olje-maling"
      readingTime="6 min"
      lead="Lær forskjellen på beis, olje og maling til utendørs tre – og hvilket produkt som passer best til din terrasse, kledning eller møbler."
      sections={sections}
    />
  )
}
