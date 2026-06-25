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
          Som hovedregel skal bygninger plasseres minst 4 m fra nabogrensen. For mindre
          frittliggende bygninger på inntil 50 m² BYA (som bod, garasje og carport) er det i mange
          tilfeller tilstrekkelig med 1 m avstand, forutsatt at en rekke vilkår er oppfylt. Naboen
          kan dessuten gi skriftlig samtykke til plassering nærmere grensen enn det regelverket
          ellers krever.
        </P>
        <Callout variant="tip" title="Tommelfingerregel">
          Søknadspliktige bygninger: minst 4 m til grensen. Søknadsfrie frittliggende bygninger
          ≤ 50 m²: som regel minst 1 m til grensen – men sjekk reguleringsplanen.
        </Callout>
      </>
    ),
  },
  {
    id: '4-meter-regelen',
    heading: '4-meteregelen – utgangspunktet',
    content: (
      <>
        <P>
          Plan- og bygningsloven (PBL) § 29-4 fastslår at bygning som utgangspunkt skal plasseres
          minst 4 m fra nabogrensen, med mindre kommunen i reguleringsplan har fastsatt noe annet.
          Dette gjelder for søknadspliktige bygninger og tilbygg.
        </P>
        <P>
          Avstanden måles horisontalt fra nærmeste del av bygningskroppen (inkludert takoverbygg
          som stikker mer enn 0,5 m ut) til nabogrensen. Det er ikke nok å måle fra veggliv alene
          hvis taket stikker langt ut.
        </P>
        <H3>Unntak fra 4-meteregelen</H3>
        <P>
          4 m er et minstekrav, men regelverket åpner for unntak:
        </P>
        <Ul>
          <li>
            <strong>Nabosamtykke:</strong> Naboen kan gi skriftlig samtykke til plassering
            nærmere grensen. Samtykket bør tinglyses for å følge eiendommen ved et eventuelt salg.
          </li>
          <li>
            <strong>Kommunalt vedtak:</strong> Kommunen kan i reguleringsplan bestemme at kortere
            avstand tillates, for eksempel i tettbygde strøk med byggegrenselinjer.
          </li>
          <li>
            <strong>Bygninger inntil veggen mot nabogrensen:</strong> I noen tilfeller kan
            kommunen tillate bygning plassert i eller helt inntil grensen – typisk ved
            sammenhengende bebyggelse.
          </li>
        </Ul>
        <Callout variant="warn" title="Sjekk med kommunen">
          Reguleringsplaner kan sette både strengere og lempeligere avstandskrav enn
          4-meteregelen. Bekreft alltid gjeldende avstandskrav med kommunens byggesaksavdeling
          eller sjekk din reguleringsplan på kommunens nettside / dibk.no.
        </Callout>
      </>
    ),
  },
  {
    id: '1-meter-regelen',
    heading: '1-meteregelen – for søknadsfrie småbygninger',
    content: (
      <>
        <P>
          Frittliggende bygninger på inntil 50 m² BYA som er unntatt søknadsplikt etter SAK10 § 4-1
          kan i mange tilfeller plasseres med kun 1 m avstand til nabogrensen. Dette er en
          lempelse fra 4-meteregelen, men gjelder kun når samtlige vilkår for søknadsfrihet er
          oppfylt (les mer i artiklene om{' '}
          <a href="/byggeguider/bod-uten-soknad">bod uten søknad</a> og{' '}
          <a href="/byggeguider/carport-uten-soknad">carport uten søknad</a>).
        </P>
        <P>
          Vær oppmerksom på at 1 m-regelen kan begrenses av lokale reguleringsplaner. Noen
          kommuner krever 2 m eller mer selv for søknadsfrie konstruksjoner.
        </P>
      </>
    ),
  },
  {
    id: 'avstandsoversikt',
    heading: 'Avstandsoversikt per tiltakstype',
    content: (
      <>
        <DataTable>
          <caption>Vanlige avstandskrav til nabogrense (generell veiledning per 2026)</caption>
          <thead>
            <tr>
              <th>Tiltak</th>
              <th>Vanlig avstandskrav</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Søknadspliktig bygning / tilbygg</td>
              <td>Minst 4 m</td>
              <td>Grunnregelen etter PBL § 29-4</td>
            </tr>
            <tr>
              <td>Frittliggende bygning ≤ 50 m² (søknadsfri)</td>
              <td>Minst 1 m</td>
              <td>Reguleringsplan kan kreve mer</td>
            </tr>
            <tr>
              <td>Levegg (søknadsfri)</td>
              <td>Minst 1 m, avhengig av plassering</td>
              <td>Se guide om levegg og gjerde</td>
            </tr>
            <tr>
              <td>Gjerde langs vei</td>
              <td>Avhengig av veitype og kommunale regler</td>
              <td>Kan kreve avstand til veikant</td>
            </tr>
            <tr>
              <td>Bygning med nabosamtykke</td>
              <td>Etter avtale</td>
              <td>Bør tinglyses</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'nabosamtykke',
    heading: 'Nabosamtykke – slik gjør du det',
    content: (
      <>
        <P>
          Ønsker du å plassere en bygning nærmere enn det regelverket normalt tillater, kan du
          innhente skriftlig samtykke fra naboen. Samtykket gjelder kun mellom partene og binder
          ikke fremtidige eiere av eiendommen med mindre det er tinglyst.
        </P>
        <H3>Prosessen trinn for trinn</H3>
        <Ul>
          <li>
            Ta kontakt med naboen og forklar hva du planlegger – vis gjerne en skisse eller
            tegning
          </li>
          <li>
            Få samtykket skriftlig, med tydelig beskrivelse av hva det gjelder (plassering,
            størrelse, type bygning)
          </li>
          <li>
            Vurder å tinglyse samtykket hos Kartverket slik at det følger eiendommen
          </li>
          <li>
            Legg samtykket ved søknaden til kommunen dersom tiltaket er søknadspliktig
          </li>
        </Ul>
        <P>
          Merk at nabosamtykke ikke automatisk gir tillatelse – kommunen kan likevel avslå en
          søknad dersom tiltaket er i strid med reguleringsplanen.
        </P>
      </>
    ),
  },
  {
    id: 'brann-og-avstand',
    heading: 'Branntekniske avstandskrav',
    content: (
      <>
        <P>
          I tillegg til plan- og bygningsloven finnes det branntekniske avstandskrav i TEK17. For
          trebygninger er det vanligvis krav om minimum 8 m avstand mellom to separate bygninger
          med trekonstruksjon (såkalt branncelleavstand), med mindre det iverksettes tiltak som
          brannvegg, sprinkler eller lignende.
        </P>
        <P>
          Dette er særlig relevant dersom naboen allerede har en bygning nær grensen. Selv om
          planregelverket tillater 1 m avstand, kan brannkravet effektivt sette en høyere
          minimumsavstand.
        </P>
        <P>
          Les mer om hva TEK17 betyr for deg i vår artikkel om{' '}
          <a href="/byggeguider/tek17-for-privatpersoner">TEK17 for privatpersoner</a>.
        </P>
      </>
    ),
  },
]

export default function AvstandTilNabogrensePage() {
  return (
    <GuideArticleLayout
      slug="avstand-til-nabogrense"
      readingTime="5 min"
      lead="4-meteregelen, 1-meter-unntaket og nabosamtykke – her er en oversikt over avstandskrav til nabogrense for vanlige byggetiltak på privat tomt."
      sections={sections}
    />
  )
}
