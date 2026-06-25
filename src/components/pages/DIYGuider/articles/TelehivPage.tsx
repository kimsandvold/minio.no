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
          Telehiv er kraften som oppstår når vann i jorda fryser og ekspanderer. For utekonstruksjoner
          i Norge – terrasser, boder, carporter, gjerder – betyr det at fundamenter som ikke er gravd
          dypt nok kan løftes, vris og knekke konstruksjonen over vinteren. Løsningen er å grave ned
          til frostfri dybde, bruke drenerende masser og sørge for at vann aldri får stå i ro under
          fundamentet.
        </P>
        <Callout variant="tip" title="Telehiv-frie fundamenter starter med god drenering">
          God drenering er like viktig som dybde. Et fundament i tørr, drenerende pukk på riktig
          dybde tåler norske vintre uten å flytte seg.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-telehiv',
    heading: 'Hva er telehiv?',
    content: (
      <>
        <P>
          Når temperaturen faller under null, fryser fritt vann i bakken og utvider seg med omtrent
          9 prosent. I telefarlig jord – leire, silt og finkornet sand – oppstår det i tillegg
          isvekst der vann suges opp fra dypere lag og danner islinser. Disse islinsene kan skyve
          bakken opp med 5–20 cm per vinter, avhengig av jordtype og temperaturen.
        </P>
        <P>
          Et fundament som bare er gravd 30–40 cm ned vil sitte fast i det øvre jordlaget og bli
          løftet med det. Etter noen fryse-tine-sykluser står konstruksjonen skjevt, skruer løsner
          og bjelker sprekker. Problemet er ikke at betongen er svak – det er at den er forankret
          i en masse som beveger seg.
        </P>
        <H3>Telefarlig vs. ikke-telefarlig jord</H3>
        <DataTable>
          <caption>Jordtype og telefare – veiledende oversikt</caption>
          <thead>
            <tr>
              <th>Jordtype</th>
              <th>Telefare</th>
              <th>Tiltak</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Leire og silt</td>
              <td>Høy</td>
              <td>Grav til frostfri dybde, dren godt</td>
            </tr>
            <tr>
              <td>Finkornet sand</td>
              <td>Middels</td>
              <td>Grav til frostfri dybde, pukkseng</td>
            </tr>
            <tr>
              <td>Grovkornet sand og grus</td>
              <td>Lav</td>
              <td>Pukkseng, kontroller drenering</td>
            </tr>
            <tr>
              <td>Sprengt fjell / grovpukk</td>
              <td>Svært lav</td>
              <td>Minimal risiko, god drenering nok</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Er du usikker på jordtypen på tomten din, er det verdt å grave et prøvehull eller spørre
          en bygningskyndig. Synlig leire eller jord som er tett og klebrig er et tydelig varseltegn.
        </P>
      </>
    ),
  },
  {
    id: 'frostfri-dybde',
    heading: 'Grav til frostfri dybde',
    content: (
      <>
        <P>
          Den viktigste forsvarslinjen mot telehiv er å plassere bunnen av fundamentet under
          frostfri dybde – det nivået der jorda aldri fryser, uansett vinter. I Norge varierer
          denne dybden fra rundt 40–60 cm langs kysten til 150–200 cm i kalde innlandsstrøk og
          fjellet.
        </P>
        <P>
          Les mer om hva frostfri dybde betyr for ditt område på{' '}
          <a href="/byggeguider/frostfri-dybde">siden om frostfri dybde</a>. Der finner du
          veiledende tall fordelt på region og tips om å sjekke kommunens grunnlagsdata.
        </P>
        <Callout variant="warn" title="Sjekk lokale forhold">
          Frostfri dybde er ikke lik overalt, selv innenfor samme kommune. Topografi, snødekke
          og grunnvann påvirker frostinntrenging. Kontakt din kommune eller en geotekniker hvis
          du er usikker, særlig for bærende konstruksjoner.
        </Callout>
      </>
    ),
  },
  {
    id: 'drenering',
    heading: 'Drenering – nøkkelen mot telehiv',
    content: (
      <>
        <P>
          Vann som ikke kan renne bort er den egentlige fienden. Selv om du graver dypt nok, vil
          stående vann ved siden av fundamentet fryse, utvide seg og presse mot betongen. God
          drenering fjerner vannet før det rekker å gjøre skade.
        </P>
        <H3>Tiltak for god drenering</H3>
        <Ul>
          <li>
            <strong>Pukkseng under fundamentet:</strong> Legg 15–20 cm komprimert 8–16 mm pukk i
            bunnen av gropa. Pukk har store porer som vannet renner raskt gjennom.
          </li>
          <li>
            <strong>Drenerende masser rundt fundamentet:</strong> Fyll rundt punktfundament eller
            betongvange med pukk i stedet for å grave den originale jorda tilbake.
          </li>
          <li>
            <strong>Drenrør ved behov:</strong> På tomter med høy grunnvannstand bør det legges
            drenrør i bunn av gropa og ledes bort fra konstruksjonen.
          </li>
          <li>
            <strong>Avrettet terreng:</strong> Sørg for at terrenget heller bort fra konstruksjonen
            slik at overflatevann ikke samler seg ved fundamentet.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'isolasjon',
    heading: 'Isolasjon som alternativ eller supplement',
    content: (
      <>
        <P>
          I noen tilfeller er det vanskelig å grave dypt – for eksempel der det er fjell nær
          overflaten eller ved rehabilitering av eksisterende konstruksjoner. Da kan horisontal
          frostsperre-isolasjon (XPS-plater) legges ut i bakken rundt fundamentet for å hindre
          frost i å nå bunnen.
        </P>
        <P>
          Prinsippet er at isolasjonsplatene holder varmen fra jorda nede, slik at det effektive
          frostnivået forskyves. Metoden er anerkjent i NS 3490 og brukes blant annet under
          veier og parkeringsplasser. For enkle hagekonstruksjoner er det likevel enklest og
          billigst å grave til riktig dybde med god pukkseng.
        </P>
        <Callout variant="tip" title="XPS-isolasjon for grunn jord">
          Skal du bygge der fjellet sitter nært overflaten, kan 50–100 mm XPS lagt horisontalt
          30–50 cm ut fra fundamentet kompensere for manglende dybde. Sjekk alltid med en
          fagperson om metoden er tilstrekkelig for lasten.
        </Callout>
      </>
    ),
  },
  {
    id: 'steg-for-steg',
    heading: 'Slik unngår du telehiv – oppsummert',
    content: (
      <>
        <P>
          Her er trinnene du bør følge for alle utekonstruksjoner med fundamenter i norsk jord:
        </P>
        <Ol>
          <li>Finn frostfri dybde for ditt område (se <a href="/byggeguider/frostfri-dybde">frostfri dybde</a>).</li>
          <li>Grav gropa 10–15 cm dypere enn frostfri dybde for å gi rom til pukkseng.</li>
          <li>Sjekk jordtypen – leire og silt krever ekstra oppmerksomhet på drenering.</li>
          <li>Legg 15–20 cm komprimert pukk (8–16 mm) i bunnen av gropa.</li>
          <li>Fyll rundt fundamentet med pukk, ikke med den originale jorda.</li>
          <li>Sørg for at terrenget heller bort fra konstruksjonen.</li>
          <li>Vurder drenrør der grunnvann er et problem.</li>
          <li>Støp eller sett fundament slik at det ikke sitter fast i det telefarlige jordlaget.</li>
        </Ol>
        <P>
          Planlegger du terrasse? <a href="/planleggere/terrasse">Terrasseplanneren</a> hjelper
          deg med mål og materialvalg. Trenger du hjelp med selve støpingen, se guiden{' '}
          <a href="/byggeguider/stope-punktfundament">Slik støper du et punktfundament</a>.
        </P>
      </>
    ),
  },
]

export default function TelehivPage() {
  return (
    <GuideArticleLayout
      slug="telehiv"
      readingTime="5 min"
      lead="Telehiv forklart: hvorfor norske utebygg må fundamenteres mot frost, og grepene som hindrer at de løftes."
      sections={sections}
    />
  )
}
