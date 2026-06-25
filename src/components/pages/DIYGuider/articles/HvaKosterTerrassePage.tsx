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
          En typisk norsk terrasse koster mellom 1 500 og 4 500 kr per m² for materialer alene,
          avhengig av treslag og utforming. For arbeid kommer det ofte like mye til igjen.
          Impregnert furu er billigst, mens kompositt og eksotisk treverk som Bangkirai eller
          Kebony kan koste to til tre ganger mer.
        </P>
        <Callout variant="warn" title="Priser varierer">
          Alle prisene i denne artikkelen er veiledende eksempler fra 2026 og varierer
          etter region, leverandør, materialvalg og markedsforhold. Innhent alltid egne
          tilbud før du budsjetterer.
        </Callout>
      </>
    ),
  },
  {
    id: 'priskomponenter',
    heading: 'Hva inngår i prisen?',
    content: (
      <>
        <P>
          Kostnaden til en terrasse deles gjerne i fem hoveddeler: trelast (bord og bjelker),
          fundament, festemidler og beslag, overflatebehandling og verktøyleie. Husk også
          eventuell søknadskostnad og bortkjøring av overskuddsmasse.
        </P>
        <Ul>
          <li>
            <strong>Trelast</strong> – terrassebord og bjelker, gjerne 50–70 % av
            materialkostnaden.
          </li>
          <li>
            <strong>Fundament</strong> – betongfundamenter, rørstolper eller justerbare
            stolpesko med bunn i frostfri dybde.
          </li>
          <li>
            <strong>Festemidler og beslag</strong> – terrasseskruer, bjelkesko, vinkelbeslag
            og evt. skjulte festesystem. Se{' '}
            <a href="/byggeguider/hvor-mange-skruer">skrueguiden</a> for beregning.
          </li>
          <li>
            <strong>Overflatebehandling</strong> – olje, beis eller maling. Viktig for
            levetid og utseende.
          </li>
          <li>
            <strong>Verktøyleie</strong> – sirkelsag, drill, vinkelsliper, trestempel e.l.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'pris-per-kvm',
    heading: 'Priseksempel per m²',
    content: (
      <>
        <DataTable>
          <caption>Veiledende materialpris per m² (2026)</caption>
          <thead>
            <tr>
              <th>Treslag / type</th>
              <th>Materialpris per m²</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Impregnert furu</td>
              <td>600–900 kr</td>
              <td>Inkl. bord og bjelker, billigst</td>
            </tr>
            <tr>
              <td>Terrasseoljet furu/gran</td>
              <td>800–1 200 kr</td>
              <td>Krever regelmessig vedlikehold</td>
            </tr>
            <tr>
              <td>Kebony / modifisert tre</td>
              <td>1 400–2 200 kr</td>
              <td>Lang levetid, lite vedlikehold</td>
            </tr>
            <tr>
              <td>Bangkirai / hardtre</td>
              <td>1 200–2 000 kr</td>
              <td>Hardt og slitesterkt</td>
            </tr>
            <tr>
              <td>Kompositt</td>
              <td>1 800–3 500 kr</td>
              <td>Lavt vedlikehold, høy startpris</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Legg til fundament (150–500 kr per punkt), festemidler (ca. 50–120 kr per m²)
          og overflatebehandling (40–120 kr per m² per strøk) for totalprisen på materialer.
        </P>
      </>
    ),
  },
  {
    id: 'typisk-terrasse',
    heading: 'Eksempel: 20 m² terrasse i impregnert furu',
    content: (
      <>
        <H3>Materialbudsjett</H3>
        <DataTable>
          <caption>Priseksempel 4 × 5 m terrasse, impregnert furu (veiledende 2026)</caption>
          <thead>
            <tr>
              <th>Post</th>
              <th>Mengde</th>
              <th>Estimert kostnad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Terrassebord 28 × 120 mm</td>
              <td>ca. 176 lm</td>
              <td>3 000–5 000 kr</td>
            </tr>
            <tr>
              <td>Bjelker 48 × 148 mm</td>
              <td>ca. 40 lm</td>
              <td>1 200–1 800 kr</td>
            </tr>
            <tr>
              <td>Fundament (justerbare stolpesko + betong)</td>
              <td>ca. 12–16 stk.</td>
              <td>1 500–3 000 kr</td>
            </tr>
            <tr>
              <td>Skruer og beslag</td>
              <td>900 skruer + beslag</td>
              <td>800–1 400 kr</td>
            </tr>
            <tr>
              <td>Overflatebehandling (olje/beis)</td>
              <td>2 strøk, 20 m²</td>
              <td>600–1 200 kr</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          <strong>Totalsum materialer: ca. 7 000–12 000 kr</strong> (350–600 kr/m²).
          Legg til arbeidskostand på 2 000–5 000 kr per m² inkl. moms hvis du leier
          håndverker for hele jobben.
        </P>
      </>
    ),
  },
  {
    id: 'spare-penger',
    heading: 'Slik holder du kostnadene nede',
    content: (
      <>
        <Ul>
          <li>
            Velg impregnert furu og behandle med god terrasseolje fremfor dyre treslag –
            riktig vedlikeholdt holder det 20–30 år.
          </li>
          <li>
            Bruk{' '}
            <a href="/planleggere/terrasse">terrasseplanleggeren</a> for å beregne
            nøyaktig mengde; unngå å bestille for mye eller for lite.
          </li>
          <li>
            Gjør gravearbeidet selv og kjøp ferdigblandet betongrør til fundamentene.
          </li>
          <li>
            Kjøp i større pakker – 500-pakning med skruer er vesentlig billigere per
            stk. enn 100-pakning.
          </li>
          <li>
            Samkjør bestilling med naboer eller venner som også skal bygge – mange
            byggevarehandler gir rabatt på større bestillinger.
          </li>
        </Ul>
        <Callout variant="tip" title="Husk vedlikehold i budsjettet">
          Sett av 200–500 kr per m² hvert 3.–5. år til slipebehandling og ny olje/beis.
          Et vedlikeholdt trebord holder dobbelt så lenge som ett som aldri behandles.
        </Callout>
      </>
    ),
  },
  {
    id: 'soknad',
    heading: 'Søknad og regulering – en skjult kostnad',
    content: (
      <>
        <P>
          Terrasser under 15 m² som ikke er høyere enn 0,5 m over terreng er normalt
          fritatt søknadsplikt i Norge. Større terrasser eller de med rekkverk over
          1,0 m kan kreve nabovarsling og søknad. Kommunale gebyrer ligger typisk på
          2 000–8 000 kr.
        </P>
        <P>
          Les mer om hva du bør avklare på forhånd i{' '}
          <a href="/byggeguider/sjekkliste-for-du-starter">sjekklisten før du starter</a>{' '}
          og{' '}
          <a href="/byggeguider/planlegging">planleggingsguiden</a>.
        </P>
      </>
    ),
  },
]

export default function HvaKosterTerrassePage() {
  return (
    <GuideArticleLayout
      slug="hva-koster-terrasse"
      readingTime="6 min"
      lead="Hva koster det å bygge terrasse? Veiledende priser per kvadratmeter og hva som faktisk driver kostnaden."
      sections={sections}
    />
  )
}
