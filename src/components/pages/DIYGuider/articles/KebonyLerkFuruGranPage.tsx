import GuideArticleLayout, {
  Callout,
  DataTable,
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
          Kebony, lerk, furu og gran er alle brukt utendørs i Norge, men de er ikke like gode på
          alle punkter. Gran er billigst og svakest mot råte, furu er et steg opp, lerk er robust og
          vakker, og Kebony er modifisert furu som nærmer seg tropisk hardved i holdbarhet. Valget
          avhenger av hvor utsatt plassen er, hva du har råd til og hvor mye vedlikehold du orker.
        </P>
        <Callout variant="tip" title="Rask tommelfingerregel">
          Til terrasse: lerk eller Kebony for lite stell, trykkimpregnert furu hvis budsjettet er
          stramt. Gran hører hjemme innendørs eller i skjermet konstruksjon – ikke som terrassebord.
        </Callout>
      </>
    ),
  },
  {
    id: 'gran',
    heading: 'Gran – billig, men krevende utendørs',
    content: (
      <>
        <P>
          Gran er det vanligste konstruksjonsvirket i Norge og kostet minst per meter. Problemet er
          at gran har liten naturlig motstand mot fukt og råte. Ubehandlet ute holder det noen få
          år før det begynner å bli grått, sprekker og til slutt råtner. Gran brukes utendørs først
          og fremst i kledning og konstruksjoner som holdes tørre, godt malt og ventilerte.
        </P>
        <P>
          Skal du bruke gran til noe utsatt – som terrasse eller benkeplater ute – må du mestre
          vedlikehold. Mal eller grunner grundig, hold oppe overflaten hvert andre år, og forvent
          at du må skifte bord etter 10–15 år uansett.
        </P>
      </>
    ),
  },
  {
    id: 'furu',
    heading: 'Furu – allrounderen med innebygd harpiks',
    content: (
      <>
        <P>
          Furu inneholder mer harpiks enn gran, noe som gir litt bedre naturlig motstand mot
          fuktighet og insekter. Det er grunnen til at furu er standard råstoff for trykkimpregnert
          virke – impregneringsmiddelet trenger lettere inn i furuved enn i gran. Ubehandlet furu
          utendørs holder seg heller ikke lenge, men trykkimpregnert furu er svært utbredt til
          terrasser, stolper og understellskonstruksjoner.
        </P>
        <P>
          Kjerneved av furu (gammelvokst, tett ved) er markant mer holdbar enn yngre, kvistfull
          furu fra hurtigvoksende plantasjeskog. Når du kjøper furu i byggevarehus, er det sjelden
          du vet hva du får – og det er ett av argumentene for å velge lerk eller Kebony til
          synlige utendørsflater.
        </P>
        <Callout variant="tip" title="Trykkimpregnert furu er noe annet">
          Trykkimpregnert furu er behandlet med kobberbasert impregnering og er en helt annen
          kategori enn ubehandlet furu. Les mer i guiden om{' '}
          <a href="/byggeguider/trykkimpregnert-vs-royalimpregnert">
            trykkimpregnert vs. royalimpregnert
          </a>
          .
        </Callout>
      </>
    ),
  },
  {
    id: 'lerk',
    heading: 'Lerk – naturlig robust og vakker',
    content: (
      <>
        <P>
          Lerk (særlig sibirsk lerk) er et av de mest holdbare bartrevirke du kan velge til
          utendørsbruk i Norden. Veden er tett, harpiksbrik og naturlig motstandsdyktig mot råte –
          uten at du trenger impregnering. Det brukes til terrassebord, fasadekledning, brygger og
          båter. Forvente 25–40 år levetid uten særlig behandling er realistisk for lerk i god
          kvalitet.
        </P>
        <P>
          Ubehandlet lerk vil gråne til en sølvgrå patina over 2–3 sesonger. Mange synes dette er
          fint – noen vil heller olje for å holde fargen varm. Lerk er dyrere enn furu og gran,
          men rimeligere enn Kebony. Det er det naturlige valget om du vil ha et ekte, lite
          vedlikeholdt trevirke uten kjemisk behandling.
        </P>
      </>
    ),
  },
  {
    id: 'kebony',
    heading: 'Kebony – modifisert furu med tropisk holdbarhet',
    content: (
      <>
        <P>
          Kebony er norskutviklet teknologi der furu (eller radiata pine) varmebehandles med et
          biologisk derivat av sukkerrørprosessen (furfurylalkohol). Prosessen forandrer cellestrukturen
          permanent slik at veden krymper og sveller langt mindre, motstår råte bedre og får en mørk
          brun farge. Kebony er klassifisert som holdbarhetklasse 1–2 – på linje med teakved – uten
          tropisk avvirkning.
        </P>
        <P>
          Kebony gråner til sølv som lerk, men langsommere. Du kan la det gråne eller bruke
          Kebony-olje for å vedlikeholde fargen. Prismessig ligger Kebony over lerk – typisk 20–35 %
          dyrere per meter. Det er det dyreste alternativet her, men også det minst vedlikeholdskrevende
          og mest dimensjonsstabile.
        </P>
      </>
    ),
  },
  {
    id: 'sammenligning',
    heading: 'Sammenligning av tretyper',
    content: (
      <>
        <P>
          Her er de fire treslagene mot hverandre på de egenskapene som betyr mest for deg som
          bygger utendørs. Tabellen er delt i to fordi mobilskjermen bare har plass til tre
          kolonner.
        </P>
        <DataTable>
          <caption>Gran og furu – egenskaper</caption>
          <thead>
            <tr>
              <th>Egenskap</th>
              <th>Gran</th>
              <th>Furu (ubehandlet)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Holdbarhet ute</td>
              <td>Lav (klasse 4–5)</td>
              <td>Middels (klasse 3–4)</td>
            </tr>
            <tr>
              <td>Pris</td>
              <td>Lavest</td>
              <td>Lav</td>
            </tr>
            <tr>
              <td>Vedlikehold</td>
              <td>Høyt – må males</td>
              <td>Høyt – må behandles</td>
            </tr>
            <tr>
              <td>Typisk bruk ute</td>
              <td>Kledning (malt), konstruksjon</td>
              <td>Trykkimpregneres til terrasse</td>
            </tr>
          </tbody>
        </DataTable>
        <DataTable>
          <caption>Lerk og Kebony – egenskaper</caption>
          <thead>
            <tr>
              <th>Egenskap</th>
              <th>Lerk</th>
              <th>Kebony</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Holdbarhet ute</td>
              <td>Høy (klasse 2–3)</td>
              <td>Svært høy (klasse 1–2)</td>
            </tr>
            <tr>
              <td>Pris</td>
              <td>Middels–høy</td>
              <td>Høyest</td>
            </tr>
            <tr>
              <td>Vedlikehold</td>
              <td>Lavt – kan gråne naturlig</td>
              <td>Lavt – olia ved behov</td>
            </tr>
            <tr>
              <td>Typisk bruk ute</td>
              <td>Terrasse, kledning, brygge</td>
              <td>Terrasse, møbler, brygge</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'velg-etter-bruk',
    heading: 'Velg etter bruksområde',
    content: (
      <>
        <Ul>
          <li>
            <strong>Terrassebord du ser og tråkker på:</strong> lerk eller Kebony. Ingen kjemisk
            behandling, lang levetid, naturlig utseende.
          </li>
          <li>
            <strong>Understell og bærebjelker under terrassen:</strong> trykkimpregnert furu i
            klasse 3 (over bakken) eller klasse 4 (i bakken). Ingen grunn til å bruke Kebony her.
          </li>
          <li>
            <strong>Fasadekledning:</strong> lerk (uoljet og naturlig grånende) eller malt gran.
            Kebony til kledning finnes men er kostbart.
          </li>
          <li>
            <strong>Brygge og sjøkant:</strong> sibirsk lerk eller Kebony. Begge tåler vann og
            frostpåkjenning godt.
          </li>
          <li>
            <strong>Stramt budsjett, terrasse:</strong> trykkimpregnert furu (royalimpregnert for
            finere overflate) er den praktiske kompromisset.
          </li>
        </Ul>
        <P>
          Vil du se nøyaktig hvor mye materialer du trenger til terrassen din? Bruk{' '}
          <a href="/planleggere/terrasse">terrasseplanleggeren</a> og få en komplett materialliste.
          Les også den generelle guiden om{' '}
          <a href="/byggeguider/trevirke">trevirke og trelast</a> for mer om valg av virke til
          forskjellige konstruksjoner.
        </P>
      </>
    ),
  },
]

export default function KebonyLerkFuruGranPage() {
  return (
    <GuideArticleLayout
      slug="kebony-lerk-furu-gran"
      readingTime="6 min"
      lead="Kebony, lerk, furu eller gran – hva bør du velge til terrasse og utendørsbruk? Her er en praktisk sammenligning av holdbarhet, pris, vedlikehold og bruksområde."
      sections={sections}
    />
  )
}
