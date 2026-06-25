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
          Stolpeavstand er hvor langt det kan gå mellom de bærende stolpene i en pergola, carport
          eller levegg. For stor avstand betyr for store spennkrefter i åsene over, og risiko for
          at konstruksjonen deformeres under snø eller vind. Typisk anbefalt stolpeavstand for
          frittstående trekonstruksjoner er 2,4–3,6 m, men dette varierer sterkt med dimensjoner,
          tak­belastning og lokale vindforhold.
        </P>
        <Callout variant="warn" title="Veiledende tall – kontroller for din situasjon">
          Tabellene under er veiledende og forutsetter standard snø- og vindlast. For carporter
          og pergola med tung overdekning i snørike strøk, bør en fagperson dimensjonere
          konstruksjonen.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-pavirker-stolpeavstand',
    heading: 'Hva påvirker stolpeavstanden?',
    content: (
      <>
        <P>
          Stolpeavstanden bestemmes av hva bjelkene og åsene over klarer å bære over det aktuelle
          spennet. Fire faktorer er avgjørende:
        </P>
        <Ul>
          <li>
            <strong>Snølast:</strong> Norges byggeforskrifter deler landet inn i snøsoner med
            karakteristisk snølast fra 1,5 til over 4,5 kN/m². Jo mer snø, jo kortere bør
            stolpeavstanden eller jo kraftigere bjelker.
          </li>
          <li>
            <strong>Vind:</strong> Vindlast gir horisontal kraft på konstruksjonen. Høye, åpne
            konstruksjoner som pergola og carport er spesielt utsatt. Stag og krysskonstruksjoner
            er viktige.
          </li>
          <li>
            <strong>Takvekt:</strong> Et tak av polykarbonat veier lite; et tretak med takstein
            veier mye. Tyngre tak krever kortere stolpeavstand og/eller kraftigere bjelker.
          </li>
          <li>
            <strong>Stolpedimensjon og forbindelser:</strong> Kraftige stolper (for eksempel
            150 × 150 mm) med gode beslag tåler større spenner enn tynne stolper med enkle
            spikerforbindelser.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'veiledende-avstand',
    heading: 'Veiledende stolpeavstander',
    content: (
      <>
        <P>
          Tabellen under viser typisk anbefalt maks. stolpeavstand for vanlige konstruksjonstyper
          med konstruksjonsvirke C24. Tallene er veiledende og gjelder for moderat snølast
          (1,5–2,5 kN/m²) og normale vindforhold.
        </P>
        <DataTable>
          <caption>Veiledende maks. stolpeavstand – moderate laster, C24 trevirke</caption>
          <thead>
            <tr>
              <th>Konstruksjonstype</th>
              <th>Typisk stolpeavstand</th>
              <th>Bjelkedimensjon over</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Pergola (lett tak/åpen)</td>
              <td>2,4–3,0 m</td>
              <td>63 × 148 eller 63 × 198 mm</td>
            </tr>
            <tr>
              <td>Pergola (solid overdekning)</td>
              <td>2,0–2,4 m</td>
              <td>63 × 198 eller 63 × 248 mm</td>
            </tr>
            <tr>
              <td>Carport (lett tak)</td>
              <td>2,4–3,6 m</td>
              <td>63 × 198 eller 63 × 248 mm</td>
            </tr>
            <tr>
              <td>Levegg / skjerm</td>
              <td>1,8–2,4 m</td>
              <td>Horisontale regler 48 × 98 mm</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Snørike strøk og utsatte steder">
          I strøk med snølast over 2,5 kN/m² eller i vindutsatte kyststrøk bør du redusere
          stolpeavstanden med 20–30 % eller gå opp én bjelkedimensjon. Se Eurokode 1 for
          snøsonekart.
        </Callout>
      </>
    ),
  },
  {
    id: 'stolpedimensjoner',
    heading: 'Stolpedimensjoner og tverrsnittsvalg',
    content: (
      <>
        <P>
          Stolpens dimensjon bestemmer hvor mye last den tåler og hvor stiv konstruksjonen
          er mot vindkrefter. For vanlige hagekonstruksjoner gjelder følgende tommelregler:
        </P>
        <Ul>
          <li>
            <strong>98 × 98 mm:</strong> Passer til lette levegger og pergola uten tak. Relativt
            slank og pen, men gir begrenset bæreevne.
          </li>
          <li>
            <strong>98 × 148 mm:</strong> God allroundstolpe for pergola med lett overdekning.
          </li>
          <li>
            <strong>148 × 148 mm:</strong> Standard for carport og større pergola med tung
            overdekning. Gir god stivhet mot vind.
          </li>
          <li>
            <strong>198 × 198 mm:</strong> Tung konstruksjon – større carport, dobbel carport
            eller bygg med stor snølast.
          </li>
        </Ul>
        <H3>Stag og avstivning</H3>
        <P>
          Uavhengig av stolpedimensjon bør en carport eller høy pergola ha diagonal avstivning
          – enten synlige knestag mellom stolpe og bjelke, eller skjulte stålstag. Stag reduserer
          effektivt vindristen og forhindrer at konstruksjonen «romler» seg skjev over tid.
        </P>
      </>
    ),
  },
  {
    id: 'fundamentavstand',
    heading: 'Sammenheng mellom stolpeavstand og fundamentering',
    content: (
      <>
        <P>
          Stolpeavstanden bestemmer direkte hvor fundamentene skal plasseres. Hvert
          fundamentpunkt må ligge rett under en stolpe, og fundamentets kapasitet må tilsvare
          lasten fra tak og snø fordelt på det aktuelle fundamentet.
        </P>
        <P>
          Generelt: jo lengre stolpeavstand, jo mer last samles på hvert fundament, og jo
          større punktfundament (eller mer robust skruepæl) trenger du. Se guiden om{' '}
          <a href="/byggeguider/fundamenttyper">fundamenttyper</a> for valg av fundamentmetode
          og <a href="/byggeguider/stope-punktfundament">støping av punktfundament</a> for
          steg-for-steg-veiledning.
        </P>
        <Callout variant="tip" title="Bruk planleggerne for raskt overslag">
          <a href="/planleggere/pergola">Pergolaplanleggeren</a> og{' '}
          <a href="/planleggere/carport">carportplanleggeren</a> hjelper deg med å bestemme
          stolpeplassering og dimensjoner basert på ønsket størrelse.
        </Callout>
      </>
    ),
  },
  {
    id: 'vind-og-snolast',
    heading: 'Snølast og vindlast – kort om beregning',
    content: (
      <>
        <P>
          Norske byggeforskrifter (TEK17) og Eurokode 1 angir at konstruksjoner skal tåle
          karakteristisk snølast for stedet og relevant vindlast. For frittstående hagebygg under
          15 m² unntatt fra søknadsplikt er kravene de samme – du er selv ansvarlig for at
          konstruksjonen er forsvarlig.
        </P>
        <Ul>
          <li>
            <strong>Snølast (s):</strong> Finn snøsone på Standard.no. Karakteristisk snølast
            varierer fra 1,5 kN/m² (lavsone) til over 4,5 kN/m² (høysone).
          </li>
          <li>
            <strong>Egenlast (G):</strong> Vekten av tak og overdekning. Polykarbonat: ca. 0,05
            kN/m². Trespon: ca. 0,2–0,3 kN/m². Papp/singel: ca. 0,4–0,6 kN/m².
          </li>
          <li>
            <strong>Brukslast (Q):</strong> Inkluderer snø og ev. vedlikehold på taket.
          </li>
        </Ul>
        <P>
          Er du i tvil om laster og dimensjonering, anbefaler vi å ta kontakt med en bygningsingeniør
          eller bruke dimensjonerende beregning etter Eurokode 5. Det er langt billigere enn en
          konstruksjon som må rives opp.
        </P>
      </>
    ),
  },
]

export default function StolpeavstandPage() {
  return (
    <GuideArticleLayout
      slug="stolpeavstand"
      readingTime="6 min"
      lead="Veiledende stolpeavstander for pergola, carport og levegg – hva snø, vind og takvekt betyr for dimensjoneringen, og hvordan du velger riktig stolpedimensjon."
      sections={sections}
    />
  )
}
