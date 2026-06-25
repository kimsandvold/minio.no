import GuideArticleLayout, {
  Callout,
  DataTable,
  P,
  type ArticleSection,
} from '../GuideArticleLayout'

const sections: ArticleSection[] = [
  {
    id: 'kort-fortalt',
    heading: 'Kort fortalt',
    content: (
      <>
        <P>
          Trelast selges i nominelle dimensjoner – men det du faktisk får er 2–4 mm mindre per
          side etter høvling. En «48 × 148» bjelke måler typisk 45 × 145 mm ferdig. Tabellene
          under gir deg de vanligste dimensjonene for konstruksjonsvirke og terrassekledning i
          Norge, slik at du kan planlegge riktig fra start.
        </P>
        <Callout variant="tip" title="Bruk nominell dimensjon i planleggingen">
          Oppgi alltid nominell dimensjon (slik det selges) når du bestiller. Juster beregningene
          dine med faktisk dimensjon dersom du dimensjonerer bærekonstruksjoner.
        </Callout>
      </>
    ),
  },
  {
    id: 'nominell-vs-faktisk',
    heading: 'Nominell vs. faktisk dimensjon',
    content: (
      <>
        <P>
          Når et sagbruk kapper tømmeret, er dimensjonen som oppgis den råskårede størrelsen rett
          etter sagingen. Etter tørking og høvling – som fjerner ujevnheter og gir glatt overflate
          – er materialet noe mindre. Hvor mye avhenger av produsenten, men en tommelfingerregel
          er 2–3 mm per høvlet side.
        </P>
        <P>
          Ubehandlet, ru sagflate-trelast («not og fjær-bord», laftekubb, noen konstruksjonsvirketyper)
          kan ligge nærmere nominell dimensjon. Ferdig høvlet konstruksjonsvirke (det du kjøper
          i byggevarehus) er alltid noe under oppgitt mål. Dette er normalt og forventet – det
          er slik bransjen fungerer i hele Europa.
        </P>
      </>
    ),
  },
  {
    id: 'konstruksjonsvirke-dimensjoner',
    heading: 'Konstruksjonsvirke – standarddimensjoner',
    content: (
      <>
        <P>
          Tabellen viser de dimensjonene du oftest finner i norske byggevarehus. Lengder er
          typisk 3,0 m, 3,6 m, 4,2 m, 4,8 m og 5,4 m – noen steder 6,0 m på bestilling.
        </P>
        <DataTable>
          <caption>Vanlige konstruksjonsvirke-dimensjoner</caption>
          <thead>
            <tr>
              <th>Dimensjon (mm)</th>
              <th>Typisk bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>36 × 48</td>
              <td>Lekter, spikerslag under kledning</td>
            </tr>
            <tr>
              <td>48 × 48</td>
              <td>Sekundærkonstruksjon, terrasselekter, avstandsholde</td>
            </tr>
            <tr>
              <td>48 × 73</td>
              <td>Stenderverk innvendige lettvegger</td>
            </tr>
            <tr>
              <td>48 × 98</td>
              <td>Stenderverk, kortere bjelker, rekkverk</td>
            </tr>
            <tr>
              <td>48 × 148</td>
              <td>Gulvbjelker, terrasse-bjelker (500–600 mm c/c)</td>
            </tr>
            <tr>
              <td>48 × 198</td>
              <td>Takkonstruksjon, lange bjelkespenn</td>
            </tr>
            <tr>
              <td>48 × 248</td>
              <td>Svære spenn, kjellerbjelkelag</td>
            </tr>
            <tr>
              <td>73 × 148</td>
              <td>Dragere, bærende bjelker med høy last</td>
            </tr>
            <tr>
              <td>98 × 148</td>
              <td>Tunge dragere, søyler</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          For terrasse-underkonstruksjon er 48 × 148 mm den vanligste bjelkedimensjonen ved
          senteravstand 600 mm. Lengre spenn eller tyngre last krever 48 × 198 mm eller tettere
          c/c-avstand. Les mer om styrkesortering i{' '}
          <a href="/byggeguider/konstruksjonsvirke-c24">guiden om konstruksjonsvirke og C24</a>.
        </P>
      </>
    ),
  },
  {
    id: 'kledning-terrasse-dimensjoner',
    heading: 'Kledning og terrassebord – standarddimensjoner',
    content: (
      <>
        <DataTable>
          <caption>Kledning og terrassebord-dimensjoner</caption>
          <thead>
            <tr>
              <th>Dimensjon (mm)</th>
              <th>Typisk bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>19 × 148 (falset kledning)</td>
              <td>Liggende utvendig kledning, overlappskledning</td>
            </tr>
            <tr>
              <td>23 × 148 (stående panel)</td>
              <td>Stående utvendig kledning, fasade</td>
            </tr>
            <tr>
              <td>21 × 120</td>
              <td>Tynn terrassebord, tett bjelkelag (maks 400 mm c/c)</td>
            </tr>
            <tr>
              <td>28 × 95</td>
              <td>Smal terrassebord, Kebony og lerk – naturlig look</td>
            </tr>
            <tr>
              <td>28 × 120</td>
              <td>Standard terrassebord – mest solgt dimensjon</td>
            </tr>
            <tr>
              <td>28 × 145</td>
              <td>Bred terrassebord – raskere å legge, færre skjøter</td>
            </tr>
            <tr>
              <td>28 × 120 (4-sidig høvlet)</td>
              <td>Premium terrasse – jevnere overflate</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Mer om valg av terrassebord – riller, spalte og festing – finner du i{' '}
          <a href="/byggeguider/terrassebord-guide">guiden om terrassebord</a>. Planlegger du
          et terrasseprosjekt? Bruk <a href="/planleggere/terrasse">terrasseplanleggeren</a> for
          å beregne materialbehov.
        </P>
      </>
    ),
  },
]

export default function TrelastDimensjonerPage() {
  return (
    <GuideArticleLayout
      slug="trelast-dimensjoner"
      readingTime="4 min"
      lead="Komplett oversikt over standard trelast-dimensjoner i Norge – fra 48x48 til terrassebord – og hva de brukes til."
      sections={sections}
    />
  )
}
