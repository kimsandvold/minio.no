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
          Et rekkverk skal se bra ut – men fremfor alt skal det holde deg og andre trygge. Riktig innfesting av stolper og korrekte åpninger mellom spiler er de to kritiske faktorene. Et rekkverk rundt en 20 m² terrasse tar typisk en arbeidsdag. Vanskelighetsgrad: middels.
        </P>
        <P>
          Denne guiden dekker veiledende høydekrav, spileavstand for barnesikkerhet, innfesting av rekkverksstolper og valg av materialer. Les alt nøye – og sjekk alltid gjeldende krav med kommunen din.
        </P>
        <Callout variant="warn" title="Verifiser kravene mot gjeldende regler">
          Mål og krav i denne guiden er veiledende og basert på vanlig praksis. Reglene kan variere med kommunen din og terrassens bruk. Sjekk alltid med kommunen eller en byggesakskyndig for bindende krav som gjelder din situasjon.
        </Callout>
      </>
    ),
  },
  {
    id: 'hoydekrav',
    heading: 'Veiledende høydekrav',
    content: (
      <>
        <P>
          Høydekrav til rekkverk er knyttet til terrassens høyde over bakken. Jo høyere terrassen er, desto viktigere er rekkverket – og desto strengere er de veiledende kravene.
        </P>
        <DataTable>
          <caption>Veiledende høyder og avstandskrav for rekkverk (privatpersoner)</caption>
          <thead>
            <tr>
              <th>Situasjon</th>
              <th>Veiledende krav</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Terrasse 0,5–1,0 m over bakken</td>
              <td>Rekkverk anbefalt, min. 0,9 m høyt</td>
              <td>Veiledende for privatbolig</td>
            </tr>
            <tr>
              <td>Terrasse over 1,0 m over bakken</td>
              <td>Rekkverk påkrevd, min. 1,0 m høyt</td>
              <td>Sjekk lokale forskrifter</td>
            </tr>
            <tr>
              <td>Spileavstand (barnesikkerhet)</td>
              <td>Maks 10 cm åpning (veiledende)</td>
              <td>Hindrer barn fra å sette hodet fast</td>
            </tr>
            <tr>
              <td>Minste klatrehøyde for spiler</td>
              <td>Unngå horisontale spiler under 0,9 m</td>
              <td>Horisontale spiler er lette å klatre på</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Tabellen over er veiledende basert på vanlig norsk praksis og tidligere Teknisk forskrift (TEK). Gjeldende krav kan ha endret seg – verifiser alltid mot oppdatert regelverk for din situasjon.
        </P>
      </>
    ),
  },
  {
    id: 'materialer',
    heading: 'Materialvalg',
    content: (
      <>
        <P>
          Rekkverk kan lages i tre, aluminium, glass eller kombinasjoner. Tre er det mest populære for private terrasser.
        </P>
        <H3>Tre</H3>
        <P>
          Trykkimpregnert furu, termotre, lerk eller hardtre (Bangkirai) er de vanligste valgene. Stolper minimum 70×70 mm, gjerne 70×90 mm. Spiler typisk 33×58 mm eller 28×58 mm. Krevende vedlikehold, men vakreste utseende.
        </P>
        <H3>Aluminium</H3>
        <P>
          Svært holdbart, vedlikeholdsfritt og tilgjengelig i systemer der alt er ferdigmålt. Noe dyrere, men sparer tid og gir et moderne uttrykk.
        </P>
        <H3>Glass</H3>
        <P>
          Gir maksimal utsikt. Krever gjerne godkjente festesystemer og herdet sikkerhetsglass. Relativt kostbart, men eksklusivt.
        </P>
      </>
    ),
  },
  {
    id: 'fase-1-stolper',
    heading: 'Fase 1 – Innfesting av rekkverksstolper',
    content: (
      <>
        <P>
          Stolpene er det kritiske punktet. En rekkverksstolpe som ikke er solid festet er direkte farlig. Det finnes tre godkjente metoder:
        </P>
        <Ol>
          <li>
            <H3>Metode 1: Gjennomgående bolt til bjelke</H3>
            <P>
              Stolpen bores gjennom og festes med M12 bolt (eller to M10 bolter) til sidebjelken (ytterbjelken). Dette er den sterkeste metoden. Hullene bores gjennom stolpe og bjelke, bolten tres gjennom og trekkes til med skiver og mutter. Krever at stolpen plasseres nøyaktig over bjelken.
            </P>
          </li>
          <li>
            <H3>Metode 2: Konsollfeste på utsiden</H3>
            <P>
              Godkjente konsollfester (U-profil i rustfritt stål) boltes til utsiden av bjelken og stolpen settes ned i konsollen. Praktisk og pent – men bruk kun godkjente systemer. Billigste varianter fra hagesenter har ofte for liten kapasitet.
            </P>
          </li>
          <li>
            <H3>Metode 3: Feste i dekket (ikke anbefalt)</H3>
            <P>
              Stolper som bare er skrudd ned gjennom terrassebordene og inn i en bjelke gir for svak innfesting. Denne metoden anbefales ikke for rekkverk – benytt alltid metode 1 eller 2.
            </P>
          </li>
        </Ol>
        <Callout variant="warn" title="Test alltid stolpene etter montering">
          Grip tak i toppen av hver stolpe og dra og riste kraftig i alle retninger. Stolpen skal ikke vingle, gi etter eller knake. Godkjenn ikke montasjen før alle stolper er absolutt stive.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-2-overligger-spiler',
    heading: 'Fase 2 – Overligger og spiler',
    content: (
      <>
        <Ol>
          <li>
            <H3>Monter overligger</H3>
            <P>
              Overliggeren (håndlist) festes på toppen av alle stolpene. Kontroller at den er rett og i vater. Skru fast med to skruer per stolpe. En brei overligger (90×45 mm) er komfortabel å gripe og ser solid ut.
            </P>
          </li>
          <li>
            <H3>Monter underligger</H3>
            <P>
              En underligger (likt tverrsnitt som overliggeren) settes ca. 50–80 mm over terrassegulvet. Spilene festes mellom overliggeren og underliggeren.
            </P>
          </li>
          <li>
            <H3>Del opp og monter spiler</H3>
            <P>
              Mål total lengde mellom stolpene, trekk fra én spile-bredde og del på (spilebredde + ønsket åpning). Eksempel: 150 cm seksjon, 33 mm spile, 67 mm åpning = 150 ÷ (33+67) = 15 spiler per seksjon. Maksimal åpning: 100 mm (veiledende).
            </P>
          </li>
          <li>
            <H3>Fest spilene</H3>
            <P>
              Fest med to skruer i topp og to i bunn av hver spile. Bruk en avstandskloss for å holde nøyaktig jevn åpning gjennom hele rekkverket. A4 rustfrie 3,5×45 mm skruer er standard. Se <a href="/byggeguider/riktig-skrue">guiden for riktig skrue</a> for valg av skruetype.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Bruk mal for spileavstand">
          Lag en enkel avstandsmal i tre med nøyaktig riktig bredde (f.eks. 67 mm). Bruk den mellom hver spile – da går jobben ti ganger raskere og resultatet blir perfekt jevnt.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-3-finish',
    heading: 'Fase 3 – Finish og overflatebehandling',
    content: (
      <>
        <P>
          Rekkverket er mer eksponert enn terrassegulvet – vind og vær treffer alle flater. God overflatebehandling er ekstra viktig.
        </P>
        <Ul>
          <li>Behandle alle kappkanter umiddelbart med endetreolje</li>
          <li>La trykkimpregnert tre tørke 4–6 uker, deretter olje eller beis</li>
          <li>Påfør to strøk for full beskyttelse</li>
          <li>Behandle på nytt hvert 2–3 år</li>
          <li>Kontroller alle bolter og fester hvert år</li>
        </Ul>
        <P>
          Et solid og pent rekkverk tilfører stor trygghet og verdi til terrassen. Se også den komplette guiden for <a href="/byggeguider/bygge-terrasse">å bygge terrasse</a> og <a href="/planleggere/terrasse">terrasseplanneren</a> for hjelp til dimensjonering.
        </P>
      </>
    ),
  },
]

export default function ByggeRekkverkPage() {
  return (
    <GuideArticleLayout
      slug="bygge-rekkverk"
      readingTime="7 min"
      lead="Slik bygger du rekkverk til terrassen – veiledende høydekrav, spileavstand for barnesikkerhet, solid innfesting av stolper og materialvalg."
      sections={sections}
    />
  )
}
