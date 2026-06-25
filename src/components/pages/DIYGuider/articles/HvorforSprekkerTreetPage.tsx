import GuideArticleLayout, {
  Callout,
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
          Tre sprekker fordi det beveger seg – det sveller når det tar til seg fukt og krymper
          når det tørker. Denne bevegelsen er ujevn: radialt (fra bark til marg) og tangentielt
          (langs årringsretningen) krymper treet mye, mens langs fiberen krymper det nesten ikke.
          Resultatet er spenninger inne i veden som til slutt frigjøres som sprekker.
        </P>
        <Callout variant="tip" title="Du kan ikke unngå det helt – men du kan redusere det">
          Velg tørket virke, la det akklimatisere på stedet, forbor i endene og bruk overflatebehandling
          som bremser fuktopptaket. Da holder treet seg langt bedre.
        </Callout>
      </>
    ),
  },
  {
    id: 'arringer-og-bevegelse',
    heading: 'Årrringer, fiberretning og hvorfor det sprekker',
    content: (
      <>
        <P>
          Treet består av celler som ble lagt på hvert år treet vokste – det er det vi ser som
          årrringer. Celleveggene inneholder cellulose og hemicellulose som binder vann. Når treet
          tørker ut, slipper cellene vannet og krymper. Problemet er at tangentiell krymping (langs
          ringene) er nesten dobbelt så stor som radiell krymping (på tvers av ringene). Det skaper
          indre spenninger.
        </P>
        <P>
          I et plank fra yteveden vil yttersiden tørke raskere enn innsiden. Yttersiden vil ville
          krympe, men er «holdt igjen» av den fuktige kjernen. Spenningene fordeles som sprekker –
          enten på flaten eller, typisk, i endene av planken der spenningene er størst.
        </P>
      </>
    ),
  },
  {
    id: 'fuktig-vs-tort',
    heading: 'Ferskt og fuktig virke vs. tørket virke',
    content: (
      <>
        <P>
          Fersk trykkimpregnert furu leveres gjerne med fuktinnhold på 25–40 % – langt over den
          likevektsfuktigheten utendørs (typisk 12–18 %). Det betyr at bordene vil tørke og bevege
          seg markant det første året. Sprekker er nærmest uunngåelig i fersk furu, men de er
          normalt overfladiske og påvirker ikke styrken.
        </P>
        <P>
          Tørket konstruksjonsvirke (stemplet med «KD» for kiln-dried eller «AD» for air-dried)
          har lavere startfuktighet og beveger seg mindre. Det er dyrere, men gir mer stabile
          dimensjoner og færre sprekker, særlig innendørs og under tak.
        </P>
        <Callout variant="warn" title="Ikke legg fuktig impregnert tre rett på plass">
          Fersk trykkimpregnert trelast med høyt fuktinnhold kan bule, vri seg og sprekke kraftig
          hvis du skrur den fast uten å la den tørke. Stabel det opp med luftspalte mellom bordene
          i 2–4 uker før bruk, særlig om sommeren.
        </Callout>
      </>
    ),
  },
  {
    id: 'lagring-og-akklimatisering',
    heading: 'Riktig lagring og akklimatisering',
    content: (
      <>
        <P>
          Trelast som lagres feil beveger seg mer enn den trenger. Stabelen bør ligge flatt på
          underlag som er plant – helst avstandsklossere med 40–60 cm senteravstand. Legg en
          kloss for kloss rett over hverandre i høyden slik at bordene ikke henger og bøyer seg.
          La luft sirkulere mellom bordene.
        </P>
        <H3>Lagring utendørs</H3>
        <P>
          Dekk til stabelen med presenning eller tak for å hindre direkte regn, men la sidene
          stå åpne for ventilasjon. Et tett plastdekke hele veien rundt holder på fukt og kan
          gjøre vondt verre – særlig for allerede fuktig trykkimpregnert virke.
        </P>
        <H3>Akklimatisering innendørs</H3>
        <P>
          Skal du legge parkett eller gulv innendørs, la treet ligge inne i rommet i minst
          48–72 timer (helst en uke) slik at fuktinnholdet utjevnes mot rommets luftfuktighet.
          Det samme prinsippet gjelder terrassebord: legg det ut en dag eller to i skyggen på
          stedet der det skal legges.
        </P>
      </>
    ),
  },
  {
    id: 'reduser-sprekker',
    heading: 'Slik reduserer du sprekker i praksis',
    content: (
      <>
        <Ul>
          <li>
            <strong>Forbor i endene:</strong> Sprekker starter nesten alltid i endene der
            fuktighetsgradienten er størst. Forbor med en 3–4 mm bor 5–10 cm inn fra enden og
            skru skruen i hullet – da fordeles spenningen i stedet for å konsentreres.
          </li>
          <li>
            <strong>Forsegl endene:</strong> Endene av planken tørker 10–15 ganger raskere enn
            flaten. Mal endene med tykkflytende maling, endekorn-impregnering eller enkel
            kalk/lim for å bremse uttørkingen.
          </li>
          <li>
            <strong>Overflatebehandling:</strong> Olje eller maling bremser fuktopptaket og
            -avgangen og demper de raske svingningene som forårsaker sprekker. Ikke ett perfekt
            skjold – men en buffer.
          </li>
          <li>
            <strong>Velg riktig orientering:</strong> Bord med årrringer tilnærmet parallelt med
            overflaten («tangential sawn») buler mer enn bord der ringene er vinkelrette på
            overflaten («radial sawn» eller kvistfritt). Velg radialskåret virke der stabilitet
            teller.
          </li>
          <li>
            <strong>Ikke stram skruene for hardt:</strong> Treet trenger rom til å bevege seg.
            Overstrammede skruer kan rive av treet rundt hullet eller tvinge en sprekk gjennom
            bordet.
          </li>
        </Ul>
        <P>
          Vil du lære mer om trevirke generelt? Se guiden om{' '}
          <a href="/byggeguider/trevirke">trevirke og trelast</a>.
        </P>
      </>
    ),
  },
]

export default function HvorforSprekkerTreetPage() {
  return (
    <GuideArticleLayout
      slug="hvorfor-sprekker-treet"
      readingTime="5 min"
      lead="Hvorfor sprekker og slår treet seg? Forstå hvordan tre jobber med fukt – og grepene som hindrer sprekker og kuving."
      sections={sections}
    />
  )
}
