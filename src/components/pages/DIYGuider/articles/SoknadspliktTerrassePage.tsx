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
          En lav platting rett på bakken er som hovedregel unntatt søknadsplikt, mens en hevet
          terrasse med rekkverk ofte utløser krav om nabovarsling og søknad til kommunen. Grensen
          går ikke alltid på størrelse alene – høyde over terreng, plassering på tomten og om
          konstruksjonen er bærende for boligen spiller alle inn.
        </P>
        <P>
          Per 2026 er et vanlig utgangspunkt at platting med maksimal høyde 0,5 m over ferdig
          planert terreng, uten rekkverk, kan bygges uten søknad – forutsatt at reguleringsplanen
          ikke sier noe annet.
        </P>
        <Callout variant="tip" title="Tommelfingerregel">
          Platting på bakkenivå (under 0,5 m høy) = som regel søknadsfri. Hevet terrasse med
          rekkverk = sannsynligvis søknadspliktig. Sjekk alltid reguleringsplanen din.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-forskjellen',
    heading: 'Platting vs. terrasse – hva er forskjellen?',
    content: (
      <>
        <P>
          I dagligtalen brukes «platting» og «terrasse» om hverandre, men i byggesakssammenheng
          skiller regelverket på høyde over terrenget og om konstruksjonen er bærende. En platting
          ligger typisk direkte på eller svært nær bakken og regnes som et enklere tiltak. En
          terrasse er hevet fra bakken, kan ha rekkverk og er gjerne koblet til husets bærende
          konstruksjon.
        </P>
        <P>
          Høyde over terrenget er det mest avgjørende kriteriet. Jo høyere over bakken, desto mer
          sannsynlig er det at tiltaket er søknadspliktig. En terrasse i 2. etasjenivå vil nesten
          alltid kreve søknad.
        </P>
      </>
    ),
  },
  {
    id: 'naar-trenger-du-soknad',
    heading: 'Når trenger du søknad?',
    content: (
      <>
        <P>
          Byggesaksforskriften SAK10 lister opp tiltak som er unntatt søknadsplikt. For terrasser
          og plattinger gjelder unntak i mange tilfeller når følgende er oppfylt:
        </P>
        <Ul>
          <li>Konstruksjonen er ikke høyere enn ca. 0,5 m over ferdig planert terreng</li>
          <li>Den er ikke innebygget eller overdekket på en måte som gjør den til et rom</li>
          <li>Den er ikke i strid med reguleringsplan, kommuneplan eller annen tillatelse</li>
          <li>Tiltaket oppfyller avstandskrav til nabogrense</li>
        </Ul>
        <P>
          Har du terrassen høyere oppe – for eksempel utenfor stue i 2. etasje – eller ønsker du
          rekkverk, tak eller veggkledning, bør du alltid avklare med kommunen om søknad kreves.
          Noen kommuner har egne lokale bestemmelser som stramme inn unntaksreglene.
        </P>
        <Callout variant="warn" title="Sjekk med kommunen">
          Reglene for søknadsfrihet varierer fra kommune til kommune og kan innskrenkes av
          reguleringsplanen. Bekreft alltid tiltaket ditt med kommunens byggesaksavdeling eller via{' '}
          <a href="https://dibk.no" target="_blank" rel="noopener noreferrer">
            dibk.no
          </a>{' '}
          før du bygger.
        </Callout>
      </>
    ),
  },
  {
    id: 'situasjonsoversikt',
    heading: 'Situasjonsoversikt',
    content: (
      <>
        <P>
          Tabellen under gir en grov veiledning basert på vanlige situasjoner. Husk at lokale
          regler kan avvike.
        </P>
        <DataTable>
          <caption>Vanlige situasjoner og søknadsplikt (generell veiledning, ikke juridisk bindende)</caption>
          <thead>
            <tr>
              <th>Situasjon</th>
              <th>Vanligvis søknad?</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Lav platting, maks 0,5 m over terreng, uten rekkverk</td>
              <td>Nei</td>
              <td>Forutsatt at reguleringsplan tillater det</td>
            </tr>
            <tr>
              <td>Platting 0,5–1 m over terreng, uten rekkverk</td>
              <td>Kanskje</td>
              <td>Avhenger av kommunens tolkning og reguleringsplan</td>
            </tr>
            <tr>
              <td>Hevet terrasse med rekkverk, 1. etasje</td>
              <td>Ja</td>
              <td>Rekkverk og høyde utløser som regel søknadsplikt</td>
            </tr>
            <tr>
              <td>Terrasse i 2. etasjenivå</td>
              <td>Ja</td>
              <td>Nesten alltid søknadspliktig</td>
            </tr>
            <tr>
              <td>Overdekket terrasse / veranda</td>
              <td>Ja</td>
              <td>Kan regnes som tilbygg og utløse strengere krav</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'avstand-og-utnyttingsgrad',
    heading: 'Avstand til nabogrense og utnyttingsgrad',
    content: (
      <>
        <P>
          Selv om terrassen er søknadsfri, må du forholde deg til avstandsreglene. Som hovedregel
          gjelder en avstand på minst 4 m til nabogrensen, men for mindre konstruksjoner kan det
          finnes unntak ned mot 1 m – forutsatt at naboen samtykker skriftlig og konstruksjonen er
          under visse grenser.
        </P>
        <P>
          Terrassen teller også med i beregningsgrunnlaget for bebygd areal (BYA) på tomten. Mange
          reguleringsplaner setter en maksimumsgrense for BYA, og store terrasser kan spise opp
          denne kvoten. Les mer om avstandsregler i vår guide om{' '}
          <a href="/byggeguider/avstand-til-nabogrense">avstand til nabogrense</a>.
        </P>
      </>
    ),
  },
  {
    id: 'nabovarsel-og-prosess',
    heading: 'Nabovarsel og søknadsprosess',
    content: (
      <>
        <P>
          Dersom terrassen er søknadspliktig, må du i de fleste tilfeller sende nabovarsel til
          berørte naboer og gjenboere minst 2 uker før du sender søknaden til kommunen. Naboen har
          da mulighet til å komme med merknader.
        </P>
        <P>
          For enklere søknadspliktige tiltak som ikke krever ansvarlig foretak, kan du sende
          søknaden selv (selvbygger). Kommunen har da 3 ukers frist til å behandle søknaden, med
          mindre den utløser innsigelser. Byggesaksgebyrene varierer mellom kommuner.
        </P>
        <H3>Tips før du søker</H3>
        <Ul>
          <li>
            Last ned situasjonskartet for tomten din fra kommunens kartportal – du trenger det i
            søknaden
          </li>
          <li>Sjekk reguleringsplanen for tomten din på kommunens nettsider</li>
          <li>Mål nøyaktig avstand fra planlagt terrasse til nabogrense</li>
          <li>Ta kontakt med kommunens byggesaksavdeling for en uformell forhåndskonferanse</li>
        </Ul>
        <P>
          Er du usikker på om terrassen din er søknadspliktig? Bruk gjerne{' '}
          <a href="/planleggere/terrasse">terrassepalnleggeren vår</a> for å visualisere prosjektet
          og få bedre oversikt over mål og plassering.
        </P>
      </>
    ),
  },
]

export default function SoknadspliktTerrassePage() {
  return (
    <GuideArticleLayout
      slug="soknadsplikt-terrasse"
      readingTime="5 min"
      lead="Når trenger du å søke om terrasse eller platting – og når er du unntatt? Her er en praktisk oversikt over de viktigste reglene."
      sections={sections}
    />
  )
}
