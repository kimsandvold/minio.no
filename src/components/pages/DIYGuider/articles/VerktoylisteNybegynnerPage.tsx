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
          Du trenger ikke et fullt utstyrt snekkerverksted for å bygge terrasse,
          benk eller hagehus. Seks til ti verktøy dekker de aller fleste hobbyprosjekter.
          Start med det nødvendige, og kjøp til ettersom prosjektene krever det.
        </P>
        <Callout variant="tip" title="Prioriter kvalitet der det teller">
          Skru-driver, bor og sirkelsag bruker du til alt. Spar ikke her. Resten –
          klemmer, malertape, tilleggsutstyr – kan være billig uten at det merkes i resultatet.
        </Callout>
      </>
    ),
  },
  {
    id: 'maa-ha',
    heading: 'Må-ha-listen',
    content: (
      <>
        <P>
          Disse verktøyene trenger du til nesten alle treprosjekter. Kjøp dem
          før du starter.
        </P>
        <Ul>
          <li>
            <strong>Drill/skrutrekker (18 V batteridrevet):</strong> Den viktigste
            investeringen. Velg et anerkjent merke (Makita, DeWalt, Bosch Professional,
            Milwaukee) – billige drill-sett faller fra hverandre. Sett med to
            batterier anbefales.
          </li>
          <li>
            <strong>Sirkelsag (165 mm):</strong> For alle rette langkutt. Kombiner
            med en enkel sagguide (klemmt planke) for rette linjer.
          </li>
          <li>
            <strong>Målebånd, 5–8 m:</strong> Velg et med bred skinner (25 mm) som
            holder seg stivt utover uten å bøye.
          </li>
          <li>
            <strong>Vater, 60 cm:</strong> For alt horisontalt og vertikalt arbeid.
          </li>
          <li>
            <strong>Stålvinkler, 300 mm:</strong> Til å merke og kontrollere 90°.
          </li>
          <li>
            <strong>Borsett (tre og metall):</strong> Komplett HSS-sett 1–10 mm og
            et treborsett 3–10 mm holder lenge.
          </li>
          <li>
            <strong>Klemmer, 2 × F-klemme 200 mm:</strong> Du kan aldri ha for mange
            klemmer. Start med to gode og legg til etter behov.
          </li>
          <li>
            <strong>Hammer, 500 g:</strong> Til spiking, beslag og justering.
          </li>
          <li>
            <strong>Kniv og blyant:</strong> Markeringskniv for presise merker,
            blyant for grovmerking.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'greit-aa-ha',
    heading: 'Greit å ha – men ikke dag én',
    content: (
      <>
        <P>
          Disse verktøyene gjør jobben enklere, men du kan klare deg uten dem i
          starten. Kjøp dem når du vet at du skal bruke dem til et konkret prosjekt.
        </P>
        <Ul>
          <li>
            <strong>Stikksag:</strong> Nødvendig for kurver og utskjæringer, unødvendig
            til enkle rette konstruksjoner.
          </li>
          <li>
            <strong>Kappingsag (gjærsag):</strong> Gjør korte tverrsnitt og gjæringssnitt
            raskt og presist. Dyrt, men uvurderlig for listverk.
          </li>
          <li>
            <strong>Slipemaskin (excentersliperд):</strong> Sparer mye tid sammenlignet
            med håndslip. Kjøp den når du skal slipe mer enn én overflate.
          </li>
          <li>
            <strong>Stemmejern, 3-delt sett:</strong> For halvt-i-halvt-overlapp,
            justering og rens av spor. Enkelt og billig.
          </li>
          <li>
            <strong>Lommehullsjig (pocket hole kit):</strong> 300–500 kr og du kan
            lage sterke, rene rammesammenføyninger uten synlige skruer.
          </li>
          <li>
            <strong>Ekstra lange klemmer (600–900 mm):</strong> Til liming av brede plater
            og holde rammer under montering.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'prisklasser',
    heading: 'Hva koster det – og når betaler det seg?',
    content: (
      <>
        <DataTable>
          <caption>Omtrentlig priskategori og råd per verktøytype</caption>
          <thead>
            <tr>
              <th>Verktøy</th>
              <th>Budsjett</th>
              <th>Anbefaling</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Drill/skrutrekker</td>
              <td>1 200–3 000 kr</td>
              <td>Kjøp navn-merke, det lønner seg</td>
            </tr>
            <tr>
              <td>Sirkelsag</td>
              <td>600–2 500 kr</td>
              <td>Mellomklasse holder lenge til hobby</td>
            </tr>
            <tr>
              <td>Stikksag</td>
              <td>400–1 500 kr</td>
              <td>Billig holder til sporadisk bruk</td>
            </tr>
            <tr>
              <td>Kappingsag</td>
              <td>1 500–5 000 kr</td>
              <td>Vent til du virkelig trenger den</td>
            </tr>
            <tr>
              <td>Excentersliperд</td>
              <td>300–1 200 kr</td>
              <td>Billig fungerer fint til hobbybruk</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'budsjett-tips',
    heading: 'Budsjett-tips',
    content: (
      <>
        <H3>Lån eller lei før du kjøper</H3>
        <P>
          Trenger du en kappingsag til ett enkelt prosjekt? Lån av nabo, lei fra
          byggemarkedet (mange tilbyr dagsleiing) eller se etter brukt på Finn.no.
          Kappingssager og excenterslipere i god stand selges brukt til halv pris.
        </P>
        <H3>Unngå billig-sett</H3>
        <P>
          Elektroverktøy-sett som koster 500 kr og inkluderer drill, sag og sliperд er
          tilnærmet ubrukelige. Svake motorer, kort batterilevetid og upresise anlegg
          gjør arbeidet frustrerende. Kjøp heller én god drill enn tre dårlige verktøy.
        </P>
        <H3>Kjøp én gang</H3>
        <P>
          Batteripakker koster nesten like mye som selve verktøyet. Velg ett batteri-plattform
          (for eksempel Makita 18 V) og hold deg til det. Alle nye verktøy du kjøper
          innen samme plattform bruker de samme batteriene.
        </P>
        <Callout variant="tip" title="Start-pakke">
          En 18 V drill + sirkelsag fra samme merke, kjøpt som kombo, koster som
          regel 200–400 kr mer enn drillen alene og inkluderer to batterier og lader.
          Det er den mest budsjettvennlige måten å bygge en plattform på.
        </Callout>
      </>
    ),
  },
  {
    id: 'forbruksmateriell',
    heading: 'Forbruksmateriell – glem ikke disse',
    content: (
      <>
        <P>
          Selve verktøyene er bare halvparten. Sørg for å ha nok forbruksmateriell
          til prosjektet:
        </P>
        <Ul>
          <li>
            <strong>Skruer:</strong> Kjøp 10–20 % mer enn beregnet. Se{' '}
            <a href="/byggeguider/riktig-skrue">guiden om riktig skrue</a> for
            riktig type til ditt materiale.
          </li>
          <li>
            <strong>Sagblad:</strong> Ha et reserveblad. Et sløvt blad kutter dårlig
            og brenner motoren.
          </li>
          <li>
            <strong>Slipepapir:</strong> Grovt (80), middels (120) og fint (220).
            Kjøp pakker med mange ark av hvert.
          </li>
          <li>
            <strong>Malertape:</strong> Til merking og for å hindre splintring ved saging.
          </li>
          <li>
            <strong>Trebeskyttelse/olje:</strong> Nødvendig til alt utendørs virke.
            Se <a href="/byggeguider/verktoy">verktøyoversikten</a> for råd om
            overflatebehandling.
          </li>
        </Ul>
      </>
    ),
  },
]

export default function VerktoylisteNybegynnerPage() {
  return (
    <GuideArticleLayout
      slug="verktoyliste-nybegynner"
      readingTime="6 min"
      lead="Hvilke verktøy trenger du egentlig som nybegynner? Her er en ærlig liste over hva du må ha, hva som er greit å ha, og hvor du bør bruke pengene."
      sections={sections}
    />
  )
}
