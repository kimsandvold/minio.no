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
          Terrassebord kommer i en rekke mål, overflater og treslag. De vanligste dimensjonene er
          28 × 120 mm og 28 × 145 mm – brede nok til å legge raskt, smale nok til å tørke godt.
          Velg rillet overflate mot solen og glatt side ned, riktig spalte mellom bordene (3–6 mm)
          og enten toppsikret eller skjult feste avhengig av ønsket utseende.
        </P>
        <Callout variant="tip" title="Det viktigste valget er treslaget">
          Dimensjonene er standardiserte – det er treslaget og overflaten som avgjør levetid og
          vedlikeholdsbehov. Se guiden om{' '}
          <a href="/byggeguider/kebony-lerk-furu-gran">Kebony, lerk, furu og gran</a> for
          full sammenligning.
        </Callout>
      </>
    ),
  },
  {
    id: 'dimensjoner',
    heading: 'Vanlige dimensjoner og hva de passer til',
    content: (
      <>
        <P>
          Tykkelsen på terrassebord er nesten alltid 28 mm – tykt nok til å bære uten å gi seg,
          lett nok til å arbeide med. Bredden varierer mer, og det påvirker både utseende og
          praktisk arbeid. Smalere bord gir mer naturlig variasjon, tørker raskere og beveger seg
          mindre, men krever mer tid å legge. Bredere bord går raskere.
        </P>
        <DataTable>
          <caption>Vanlige terrassebord-dimensjoner</caption>
          <thead>
            <tr>
              <th>Dimensjon</th>
              <th>Typisk bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>28 × 95 mm</td>
              <td>Smal, naturlig look, tørker raskt – populær til lerk og Kebony</td>
            </tr>
            <tr>
              <td>28 × 120 mm</td>
              <td>Mest solgt – god bredde-til-pris-ratio, standard trykkimpregnert</td>
            </tr>
            <tr>
              <td>28 × 145 mm</td>
              <td>Bredt bord, færre skjøter, raskere å legge</td>
            </tr>
            <tr>
              <td>28 × 120 mm (4-sidig høvlet)</td>
              <td>Jevnere overflate, brukes til premium-terrasser</td>
            </tr>
            <tr>
              <td>21 × 120 mm</td>
              <td>Tynn variant, kun til lettere konstruksjoner med tette bjelker</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Lengdene er typisk 3,0 m, 3,6 m, 4,2 m og 4,8 m. Planlegg slik at du får minst mulig
          svinn – et bord på 4,2 m gir deg to stykker à 2,1 m uten kapp-svinn.
        </P>
      </>
    ),
  },
  {
    id: 'riller-vs-glatt',
    heading: 'Riller eller glatt overflate?',
    content: (
      <>
        <P>
          De fleste terrassebord er produsert med riller på én side og glatt på den andre. Rillene
          bryter opp vannfilm og gir bedre grep når underlaget er vått – særlig viktig rundt
          basseng og i skygge. Den glatte siden er penere å se på, men kan bli glatt når den er
          våt.
        </P>
        <P>
          Tradisjonelt anbefaler man riller opp, men mange foretrekker glatt side opp for finere
          utseende og enklere renhold. Olje og maling fester seg lettere på glatt side. Valget er
          ditt – begge er korrekte.
        </P>
        <Callout variant="warn" title="Ikke legg bordene med feil side ned">
          Rillesiden bør alltid vende bort fra bæreverket (altså opp), ikke ned mot bjelkene.
          Riller mot bjelkene samler fuktighet og kan gi råte i kontaktpunktet mye raskere.
        </Callout>
      </>
    ),
  },
  {
    id: 'spalte',
    heading: 'Spalte mellom bordene',
    content: (
      <>
        <P>
          Spalte mellom bordene er viktig for drening og ventilasjon – uten luft stagnerer fukt
          under dekket og fremskynder råte. Samtidig er for stor spalte upraktisk: heelspisser
          setter seg fast og småsaker faller ned.
        </P>
        <P>
          En spalte på <strong>3–5 mm</strong> er det vanligste rådet for tørr, ferdig trelast.
          Legger du våt, fersk trykkimpregnert furu bør du redusere til 2–3 mm – tørkingen vil
          trekke bordene fra hverandre og du ender opp med 4–6 mm uansett. Lerk og Kebony er mer
          dimensjonsstabile og kan legges med 3–4 mm fra start.
        </P>
        <H3>Praktisk tips for jevn spalte</H3>
        <P>
          Bruk en stukkat-spiker (2,5–3 mm) som avstandholdermal når du fester bordene. Det gir
          mer konsistent resultat enn å anslå for hånd, særlig på lange løp.
        </P>
      </>
    ),
  },
  {
    id: 'festing',
    heading: 'Festing: skruer ovenfra eller skjult feste?',
    content: (
      <>
        <P>
          Du kan feste terrassebord på to måter: med synlige skruer ovenfra, eller med skjulte
          festeklemmer nedenfra. Begge fungerer godt – valget handler mest om utseende og tid.
        </P>
        <Ul>
          <li>
            <strong>Toppsikring (synlige skruer):</strong> raskt, billig og enkelt å reparere
            enkeltbord. Skru med to skruer per bjelke, sett inn i vinkel (45°) for å trekke bordet
            ned. Bruk rustfrie skruer – aldri vanlig stål.
          </li>
          <li>
            <strong>Skjult feste:</strong> renere look, ingen hoder å trå på og ingen innganger
            for vann. Krevende å bytte enkeltbord i ettertid. Passer best til Kebony og lerk der
            du ønsker ren overflate.
          </li>
        </Ul>
        <P>
          Les mer om metoder, klemmetyper og avstand i guiden om{' '}
          <a href="/byggeguider/skjult-terrassefeste">skjult terrassefeste</a>.
        </P>
      </>
    ),
  },
  {
    id: 'treslag-til-terrassebord',
    heading: 'Treslag – hva passer best?',
    content: (
      <>
        <P>
          Trykkimpregnert furu er suverent mest solgt i Norge fordi det er billig og tilgjengelig
          overalt. Det fungerer godt, men krever etterbehandling og beveger seg mye det første
          året. Royalimpregnert furu er et steg opp: mer stabilt, ferdigfarget og mindre arbeid.
        </P>
        <P>
          Lerk er det beste naturlige alternativet – holdbart, vakkert og uten kjemisk behandling.
          Kebony er det mest dimensjonsstabile og holdbare, men koster mest. Planlegger du en
          terrasse med lang levetid og lite vedlikehold, er lerk eller Kebony den beste
          investeringen.
        </P>
        <P>
          Se full sammenligning i{' '}
          <a href="/byggeguider/kebony-lerk-furu-gran">guiden om treslag for utendørsbruk</a>.
          Bruk <a href="/planleggere/terrasse">terrasseplanleggeren</a> for å beregne nøyaktig
          hvor mange bord du trenger.
        </P>
      </>
    ),
  },
]

export default function TerrassebordGuidePage() {
  return (
    <GuideArticleLayout
      slug="terrassebord-guide"
      readingTime="6 min"
      lead="Terrassebord-guide: dimensjoner, riller, spalte og festemetoder – alt du må vite før du kjøper bord til terrassen."
      sections={sections}
    />
  )
}
