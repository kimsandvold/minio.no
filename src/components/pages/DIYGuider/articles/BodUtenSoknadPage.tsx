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
          En frittliggende bod eller et uthus på inntil 50 m² BYA kan i mange tilfeller oppføres
          uten søknad, forutsatt at bygningen er i én etasje, ikke brukes til beboelse og
          plasseres minst 1 m fra nabogrensen. Planregelverket og reguleringsplanen din kan
          imidlertid sette strengere grenser.
        </P>
        <Callout variant="tip" title="Tommelfingerregel">
          Frittliggende bod ≤ 50 m² BYA, maks 4 m mønehøyde, minst 1 m fra grense, ikke til
          beboelse = som regel søknadsfri. Sjekk alltid reguleringsplanen din først.
        </Callout>
      </>
    ),
  },
  {
    id: 'to-kategorier',
    heading: 'To kategorier av fritatte tiltak',
    content: (
      <>
        <P>
          Det er nyttig å skille mellom to ulike kategorier i regelverket:
        </P>
        <H3>1. Tiltak unntatt søknadsplikt (SAK10 § 4-1)</H3>
        <P>
          Dette er den bredeste kategorien og inkluderer frittliggende bygninger inntil 50 m² BYA.
          Tiltaket er likevel underlagt plan og tekniske krav i TEK17 – du er selv ansvarlig for
          at alt er i orden.
        </P>
        <H3>2. Tiltak unntatt fra byggesaksbehandling (PBL § 20-5)</H3>
        <P>
          En enda smalere kategori for helt enkle konstruksjoner som for eksempel levegg og
          mindre frittliggende bygninger under 15 m². Disse krever heller ingen byggesak, men
          fremdeles plan-samsvar. Les mer i vår guide om{' '}
          <a href="/byggeguider/levegg-gjerde-regler">levegg og gjerde</a>.
        </P>
      </>
    ),
  },
  {
    id: 'vilkaar',
    heading: 'Vilkår for søknadsfri bod inntil 50 m²',
    content: (
      <>
        <P>
          For at en frittliggende bygning skal være unntatt søknadsplikt etter SAK10 § 4-1, må
          typisk alle disse punktene være oppfylt:
        </P>
        <Ul>
          <li>Bebygd areal (BYA) er høyst 50 m²</li>
          <li>Mønehøyde er høyst 4,0 m over ferdig planert terreng</li>
          <li>Gesimshøyde er høyst 3,0 m over ferdig planert terreng</li>
          <li>Bygningen er i én etasje, uten kjeller</li>
          <li>Bygningen er ikke beregnet for varig opphold (ikke beboelse)</li>
          <li>Plassert minst 1,0 m fra nabogrense</li>
          <li>Ikke i strid med reguleringsplan, kommuneplan eller andre tillatelser</li>
          <li>Plasseres på en bebygd eiendom (tomt med eksisterende lovlig bygning)</li>
        </Ul>
        <Callout variant="warn" title="Sjekk med kommunen">
          Reguleringsplaner og kommunale bestemmelser kan innskrenke unntaksreglene i SAK10.
          Bekreft alltid om ditt tiltak er unntatt søknad hos kommunens byggesaksavdeling eller
          via{' '}
          <a href="https://dibk.no" target="_blank" rel="noopener noreferrer">
            dibk.no
          </a>{' '}
          før du bygger.
        </Callout>
      </>
    ),
  },
  {
    id: 'hoyde-og-avstand',
    heading: 'Høyde og avstandskrav',
    content: (
      <>
        <P>
          Høydebegrepene kan være forvirrende. Her er en rask oversikt:
        </P>
        <DataTable>
          <caption>Typiske høyde- og avstandskrav for søknadsfri frittliggende bod</caption>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Vanlig grenseverdi</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>BYA</td>
              <td>Maks 50 m²</td>
              <td>Inkludert fremspring og utkraging over 0,5 m</td>
            </tr>
            <tr>
              <td>Mønehøyde</td>
              <td>Maks 4,0 m</td>
              <td>Målt fra ferdig planert terreng til øverste punkt</td>
            </tr>
            <tr>
              <td>Gesimshøyde</td>
              <td>Maks 3,0 m</td>
              <td>Målt fra ferdig planert terreng til takfot</td>
            </tr>
            <tr>
              <td>Avstand nabogrense</td>
              <td>Minst 1,0 m</td>
              <td>Reguleringsplan kan kreve mer</td>
            </tr>
            <tr>
              <td>Etasjer</td>
              <td>Kun 1</td>
              <td>Ingen kjeller tillatt under søknadsfrihet</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Mønehøyde måles fra ferdig planert terreng til bodens høyeste punkt (mønet). Gesimshøyde
          måles fra ferdig planert terreng til takfoten (der taket møter veggen). Begge måles
          fra det laveste naturlige eller planerte terrenget rundt bygningen.
        </P>
      </>
    ),
  },
  {
    id: 'bya-og-tomt',
    heading: 'BYA og tomtens totale utnyttelse',
    content: (
      <>
        <P>
          Selv om boden er søknadsfri isolert sett, vil den legge beslag på noe av tomtens
          tillatte bebygde areal (BYA-prosent i reguleringsplanen). Mange reguleringsplaner
          tillater for eksempel 20–25 % BYA. Er kvoten allerede brukt av boligen og eventuelle
          andre bygninger, kan du ikke bygge mer – uavhengig av søknadsfrihet.
        </P>
        <P>
          Sjekk din tomtes tillatte BYA i kommunens karttjeneste eller på ByggSøk-portalen. Er du
          i nærheten av grensen, bør du vurdere å søke uansett for å ha alt dokumentert.
        </P>
      </>
    ),
  },
  {
    id: 'tekniske-krav',
    heading: 'Tekniske krav gjelder uansett',
    content: (
      <>
        <P>
          Søknadsfrihet betyr ikke at TEK17 er irrelevant. Boden må fortsatt:
        </P>
        <Ul>
          <li>Ha tilstrekkelig fundamentering for lokale grunnforhold</li>
          <li>
            Tåle relevante laster etter TEK17 (snølast, vindlast) – spesielt viktig i kyst- og
            fjellområder
          </li>
          <li>Ha forsvarlig drenering slik at overvann ikke ledes mot nabo eller bygninger</li>
          <li>
            Elektrisk installasjon i boden må utføres av autorisert elektriker og meldes til
            netteier
          </li>
        </Ul>
        <P>
          Les mer om hva TEK17 betyr for deg som privatperson i vår artikkel om{' '}
          <a href="/byggeguider/tek17-for-privatpersoner">TEK17 for privatpersoner</a>.
        </P>
        <P>
          Planlegger du en carport i tilknytning til boden? Se vår guide om{' '}
          <a href="/byggeguider/carport-uten-soknad">carport uten søknad</a>, og prøv gjerne{' '}
          <a href="/planleggere/carport">carportplanleggeren</a> vår.
        </P>
      </>
    ),
  },
]

export default function BodUtenSoknadPage() {
  return (
    <GuideArticleLayout
      slug="bod-uten-soknad"
      readingTime="5 min"
      lead="Når kan du bygge bod eller uthus uten å søke? Her er de vanligste vilkårene for søknadsfrie frittliggende bygninger og hva du likevel må passe på."
      sections={sections}
    />
  )
}
