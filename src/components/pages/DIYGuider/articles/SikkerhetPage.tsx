import GuideArticleLayout, {
  Callout,
  H3,
  P,
  Ul,
  type ArticleSection,
} from '../GuideArticleLayout'

const sections: ArticleSection[] = [
  {
    id: 'verneutstyr',
    heading: 'Verneutstyr',
    content: (
      <>
        <P>
          Det meste av bygging er trygt – så lenge du beskytter deg mot de få tingene som kan gå galt.
          Litt verneutstyr koster lite og sitter snart i ryggmargen:
        </P>
        <Ul>
          <li>
            <strong>Vernebriller</strong> – flis og spon flyr lenger enn du tror. Bruk dem alltid ved
            saging, boring og sliping.
          </li>
          <li>
            <strong>Hørselvern</strong> – elektrisk verktøy er høyt nok til å skade hørselen over tid.
          </li>
          <li>
            <strong>Støvmaske</strong> – ved sliping og kapping, særlig av impregnert tre.
          </li>
        </Ul>
        <Callout variant="warn" title="Hansker og roterende verktøy">
          Bruk gjerne hansker når du håndterer rått trevirke, men ta dem av ved bormaskin og andre
          roterende verktøy. En hanske som hektes fast, trekker hånden med – det er farligere enn
          flisa du ville unngå.
        </Callout>
      </>
    ),
  },
  {
    id: 'sikre-arbeidsstykket',
    heading: 'Sikre arbeidsstykket',
    content: (
      <>
        <P>
          Den vanligste nybegynnerfeilen er å holde bordet med én hånd og sage eller bore med den
          andre. Da har du verken kontroll på verktøyet eller emnet.
        </P>
        <P>
          Fest alltid det du jobber med – med tvinger til en bukk eller benk. Da har du begge hender
          på verktøyet, kuttet blir bedre, og hendene er trygt unna bladet.
        </P>
      </>
    ),
  },
  {
    id: 'elektrisk-verktoy',
    heading: 'Trygg bruk av elektrisk verktøy',
    content: (
      <>
        <P>
          Elektroverktøy er trygt når det behandles med respekt. Noen enkle vaner holder deg unna de
          fleste uhell:
        </P>
        <Ul>
          <li>Trekk ut kontakten eller ta ut batteriet før du bytter blad eller bor.</li>
          <li>La verktøyet stoppe helt før du legger det fra deg.</li>
          <li>Hold ledningen bak og unna bladet.</li>
          <li>Bruk jordfeilbryter når du jobber ute eller på fuktig underlag.</li>
        </Ul>
        <Callout variant="warn" title="Aldri fjern beskyttelsen">
          Bladvern og skjermer sitter der av en grunn. Frist aldri til å demontere dem for å jobbe
          «litt raskere».
        </Callout>
      </>
    ),
  },
  {
    id: 'orden-og-lys',
    heading: 'Orden, lys og underlag',
    content: (
      <>
        <P>
          Et ryddig og godt opplyst arbeidssted er et tryggere arbeidssted. Du ser hva du gjør, og du
          snubler ikke i ledninger og avkapp.
        </P>
        <H3>Stødig underlag</H3>
        <P>
          Jobb på et stabilt underlag i god arbeidshøyde – en arbeidsbenk eller et par sagbukker.
          Bøyer du deg over noe vaklevorent på bakken, mister du både presisjon og kontroll.
        </P>
      </>
    ),
  },
  {
    id: 'stov-og-kjemikalier',
    heading: 'Støv og kjemikalier',
    content: (
      <>
        <P>
          Støv fra impregnert tre bør du ikke puste inn – bruk maske ved kapping og sliping, og fei
          opp etterpå i stedet for å blåse det rundt. Beis, lim og maling skal brukes med god lufting;
          les anvisningen på boksen.
        </P>
        <P>
          Avkapp av impregnert tre skal ikke brennes i bål eller peis. Lever det som restavfall etter
          kommunens regler.
        </P>
      </>
    ),
  },
  {
    id: 'barn-og-ro',
    heading: 'Barn, dyr og ro',
    content: (
      <>
        <P>
          Hold barn og kjæledyr på avstand når verktøyet er i gang, og rydd vekk skarpe ting og skruer
          når du tar pause. Ikke minst: ikke stress. De fleste uhell skjer når man har dårlig tid
          eller er sliten. Ta en pause heller enn å forsere det siste kuttet.
        </P>
      </>
    ),
  },
]

export default function SikkerhetPage() {
  return (
    <GuideArticleLayout
      slug="sikkerhet"
      readingTime="5 min"
      lead="Bygging skal være hyggelig – og trygt. Med litt verneutstyr og noen gode vaner holder du deg skadefri, så du kan konsentrere deg om å lage noe fint."
      sections={sections}
    />
  )
}
