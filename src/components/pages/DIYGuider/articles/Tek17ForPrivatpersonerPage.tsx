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
          TEK17 er den tekniske byggeforskriften som stiller minimumskrav til alle byggetiltak i
          Norge. SAK10 er saksbehandlingsforskriften som sier hvem som har ansvar og hva som
          krever søknad. Selv om du bygger noe søknadsfritt, gjelder TEK17 fortsatt – du er
          selv ansvarlig for at konstruksjonen tilfredsstiller kravene.
        </P>
        <Callout variant="tip" title="Tommelfingerregel">
          TEK17 gjelder alltid, søknadsfrihet fritar deg bare fra søknaden – ikke fra kravene.
          Fokuser spesielt på rekkverkshøyde, trappesikkerhet og konstruksjonsberegninger.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-tek17-og-sak10',
    heading: 'Hva er TEK17 og SAK10?',
    content: (
      <>
        <H3>TEK17 – teknisk forskrift</H3>
        <P>
          Teknisk forskrift 2017 (TEK17) er hjemlet i plan- og bygningsloven og fastsetter
          minimumskrav til sikkerhet, helse, energi og miljø i byggetiltak. Den gjelder for alt
          fra boliger til garasjer og terrasser. TEK17 er ikke en bruksanvisning, men et sett med
          funksjonskrav – det finnes mange lovlige måter å tilfredsstille hvert krav på.
        </P>
        <H3>SAK10 – saksbehandlingsforskriften</H3>
        <P>
          Byggesaksforskriften 2010 (SAK10) regulerer hvem som har ansvarsrett for byggetiltak,
          hvilke tiltak som krever søknad og nabovarsling, og hva som er unntatt
          søknadsbehandling. SAK10 § 4-1 er den sentrale bestemmelsen for søknadsfrie tiltak
          privatpersoner ofte støter på.
        </P>
        <P>
          Kortversjonen: SAK10 avgjør om du trenger søknad. TEK17 avgjør hva du må bygge.
        </P>
      </>
    ),
  },
  {
    id: 'viktige-krav-for-uteprosjecter',
    heading: 'Viktige TEK17-krav for uteprosjekter',
    content: (
      <>
        <P>
          For vanlige hobbyprosjekter og utearealer er det særlig noen krav i TEK17 du bør kjenne
          til. Tallene nedenfor er veiledende minimumskrav – lokale byggesøknader kan stille
          ytterligere krav.
        </P>
        <DataTable>
          <caption>Utvalgte TEK17-krav relevante for private uteprosjekter</caption>
          <thead>
            <tr>
              <th>Krav</th>
              <th>Vanlig minimumskrav</th>
              <th>Gjelder for</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Rekkverkshøyde (bolig)</td>
              <td>Minst 1,0 m</td>
              <td>Terrasser, balkonger, trapper med fall ≥ 0,5 m</td>
            </tr>
            <tr>
              <td>Rekkverkshøyde (fall ≥ 10 m)</td>
              <td>Minst 1,2 m</td>
              <td>Høyereliggende terrasser og balkonger</td>
            </tr>
            <tr>
              <td>Åpninger i rekkverk</td>
              <td>Maks 0,1 m (10 cm)</td>
              <td>Hindre barn i å klemme seg fast eller falle</td>
            </tr>
            <tr>
              <td>Trappestigning</td>
              <td>Maks 0,19 m per trinn (innendørs)</td>
              <td>Tilkomsttrapp til terrasse/inngang</td>
            </tr>
            <tr>
              <td>Trappetrinndybde</td>
              <td>Minst 0,25 m (innendørs)</td>
              <td>Tilkomsttrapp</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Sjekk med kommunen">
          Kravene i TEK17 kan tolkes ulikt, og kommunen kan stille ytterligere krav i
          reguleringsplan eller ved søknadsbehandling. Bekreft alltid kritiske mål med
          kommunen eller via{' '}
          <a href="https://dibk.no" target="_blank" rel="noopener noreferrer">
            dibk.no
          </a>{' '}
          – spesielt for tiltak der barn og eldre kan falle.
        </Callout>
      </>
    ),
  },
  {
    id: 'rekkverk-og-fall',
    heading: 'Rekkverk og fallsikring',
    content: (
      <>
        <P>
          Rekkverk er ett av de vanligste temaene privatpersoner lurer på i forbindelse med
          terrasser og trapper. TEK17 krever rekkverk ved fall på 0,5 m eller mer. Det betyr at
          en terrasse som er høyere enn 0,5 m over bakken, i praksis alltid skal ha rekkverk.
        </P>
        <H3>Krav til rekkverkskonstruksjonen</H3>
        <Ul>
          <li>Høyde minst 1,0 m ved fall under 10 m, minst 1,2 m ved fall 10 m eller mer</li>
          <li>Skal tåle en horisontalkraft på minst 0,5 kN/m (ca. 50 kg per løpemeter)</li>
          <li>
            Åpninger mellom spiler/bord skal ikke overstige 10 cm – barn skal ikke kunne kile
            seg fast med hodet
          </li>
          <li>Klatrbare utforminger (vannrett spilere som stiger) bør unngås</li>
        </Ul>
        <P>
          Husk at rekkverk på en terrasse gjør tiltaket søknadspliktig i mange tilfeller – les mer
          om dette i artikkelen om{' '}
          <a href="/byggeguider/soknadsplikt-terrasse">søknadsplikt for terrasse</a>.
        </P>
      </>
    ),
  },
  {
    id: 'konstruksjon-og-last',
    heading: 'Konstruksjon og lastberegning',
    content: (
      <>
        <P>
          TEK17 stiller krav til at bygningskonstruksjoner tåler de laster de utsettes for: snø,
          vind, egenlast og brukslast. For privatpersoner er de mest relevante:
        </P>
        <H3>Snølast</H3>
        <P>
          Snølasten varierer enormt i Norge – fra kyststrøk med lite snø til fjellområder med
          svært høy snølast. Standard snølast på tak og platåflater finner du i NS-EN 1991-1-3.
          Bygger du bod eller carport i et snørikt område, er korrekte konstruksjonsberegninger
          avgjørende.
        </P>
        <H3>Brukslast på terrasse</H3>
        <P>
          Terrasser dimensjoneres vanligvis for minst 2,0–4,0 kN/m² brukslast (ca. 200–400 kg/m²).
          Bjelker, stolper og festemidler må beregnes i henhold til dette.
        </P>
        <H3>Vindlast på levegg</H3>
        <P>
          Levegger og gjerder er utsatt for betydelig vindlast, spesielt ved kysten. Stolper og
          fundament må dimensjoneres for de lokale vindforholdene. Bruk trykkimpregnert eller
          rustfritt festemateriell i fundamentene.
        </P>
        <P>
          Se vår guide om{' '}
          <a href="/byggeguider/konstruksjonsvirke-c24">konstruksjonsvirke C24</a> for mer om
          dimensjonering av bærende trevirke.
        </P>
      </>
    ),
  },
  {
    id: 'ansvar-og-dokumentasjon',
    heading: 'Ansvar og dokumentasjon',
    content: (
      <>
        <P>
          Når du bygger søknadsfritt, er du selv ansvarlig for at tiltaket tilfredsstiller TEK17
          og er i tråd med plan. Det finnes ingen kommunal kontroll av søknadsfrie tiltak.
        </P>
        <H3>Hva bør du dokumentere?</H3>
        <Ul>
          <li>
            En enkel tegning som viser plassering på tomten, mål og avstand til grenser – beviser
            at du har sjekket avstandskravene
          </li>
          <li>
            Dokumentasjon på at BYA-kvoten på tomten ikke er overskredet
          </li>
          <li>
            Beregninger (eller innkjøpsdokumentasjon) som viser at konstruksjonen tåler
            relevante laster
          </li>
          <li>
            Kvittering og dokumentasjon fra elektriker dersom det er elektrisk anlegg i
            konstruksjonen
          </li>
        </Ul>
        <P>
          God dokumentasjon er spesielt viktig dersom du skal selge boligen – kjøpers advokat
          eller bank kan spørre etter dette. Et tiltak som ikke er lovlig plassert kan utgjøre et
          prisavslag eller ansvarsforhold ved salg.
        </P>
        <P>
          Se også guidene våre om{' '}
          <a href="/byggeguider/carport-uten-soknad">carport uten søknad</a>,{' '}
          <a href="/byggeguider/bod-uten-soknad">bod uten søknad</a> og{' '}
          <a href="/byggeguider/avstand-til-nabogrense">avstand til nabogrense</a> for mer
          om spesifikke tiltak.
        </P>
      </>
    ),
  },
]

export default function Tek17ForPrivatpersonerPage() {
  return (
    <GuideArticleLayout
      slug="tek17-for-privatpersoner"
      readingTime="6 min"
      lead="Hva er TEK17 og SAK10, og hva betyr de for deg som bygger terrasse, carport eller bod? Her er det viktigste du trenger å vite som privatperson."
      sections={sections}
    />
  )
}
