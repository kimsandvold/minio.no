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
    id: 'vanlige-tretyper',
    heading: 'Vanlige tretyper',
    content: (
      <>
        <P>
          For hage- og uteprosjekter er det noen få typer du møter igjen og igjen. Du trenger ikke
          kjenne hele sortimentet – bare vite hva som passer hvor.
        </P>
        <Ul>
          <li>
            <strong>Gran og furu (ubehandlet)</strong> – billig og lett å jobbe med. Greit innendørs
            og under tak, men må behandles godt for å tåle vær ute.
          </li>
          <li>
            <strong>Trykkimpregnert furu</strong> – det vanligste til ute. Beskyttet mot råte og
            sopp, tåler fukt og jordkontakt langt bedre.
          </li>
          <li>
            <strong>Lerk og sedertre</strong> – har naturlig motstand mot råte og er pene ubehandlet.
            Dyrere, men fine til synlige detaljer.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'impregnert-eller-ikke',
    heading: 'Impregnert eller ubehandlet?',
    content: (
      <>
        <P>
          Hovedregelen er enkel: skal treet stå ute og særlig nær bakken, velg impregnert. Skal det
          stå under tak eller inne, klarer du deg med ubehandlet – ofte til en lavere pris og med et
          renere uttrykk.
        </P>
        <DataTable>
          <caption>Grovt valg etter plassering</caption>
          <thead>
            <tr>
              <th>Plassering</th>
              <th>Anbefaling</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Nær eller i kontakt med bakken</td>
              <td>Trykkimpregnert (gjerne for markkontakt)</td>
            </tr>
            <tr>
              <td>Fritt ute, over bakken</td>
              <td>Impregnert, lerk eller godt behandlet furu</td>
            </tr>
            <tr>
              <td>Under tak / på terrasse</td>
              <td>Ubehandlet furu/gran med overflatebehandling</td>
            </tr>
            <tr>
              <td>Innendørs</td>
              <td>Ubehandlet furu, gran eller løvtre</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Fersk impregnering er våt">
          Nyinnkjøpt trykkimpregnert tre er ofte fuktig og må tørke i flere uker før det kan beises
          eller males. Maler du for tidlig, slipper behandlingen taket. Mer i guiden om
          overflatebehandling.
        </Callout>
      </>
    ),
  },
  {
    id: 'dimensjoner',
    heading: 'Dimensjoner – nominelt vs. faktisk',
    content: (
      <>
        <P>
          En forvirrende, men viktig detalj: målet på prislappen stemmer ikke alltid med det du måler
          hjemme. «48 × 98 mm» er det nominelle målet, men høvlet og tørket er bordet gjerne litt
          mindre. Mål alltid det faktiske bordet når du planlegger.
        </P>
        <DataTable>
          <caption>Noen vanlige dimensjoner (omtrentlig)</caption>
          <thead>
            <tr>
              <th>Kalles ofte</th>
              <th>Typisk bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>48 × 98 mm</td>
              <td>Reisverk, bein, kraftige rammer</td>
            </tr>
            <tr>
              <td>36 × 48 mm</td>
              <td>Lekter, avstivning, lette rammer</td>
            </tr>
            <tr>
              <td>28 × 120 mm</td>
              <td>Kledning, sittebord, plater</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'velg-gode-bord',
    heading: 'Slik velger du gode bord',
    content: (
      <>
        <P>
          To bord med samme dimensjon kan ha svært ulik kvalitet. På byggevarehuset lønner det seg å
          bruke et par minutter på å plukke:
        </P>
        <H3>Sikt langs bordet</H3>
        <P>
          Hold bordet opp og se langs kanten, som når du sikter med et gevær. Da ser du med en gang om
          det er skjevt, vridd eller bøyd. Legg de skjeve tilbake.
        </P>
        <Ul>
          <li>Unngå store, løse kvister – de kan falle ut og svekker bordet.</li>
          <li>Se etter sprekker, særlig i endene.</li>
          <li>Mye kvae (harpiks) kan gjøre det vanskelig å male senere.</li>
          <li>Velg tørre bord – fuktig tre krymper og kan vri seg når det tørker.</li>
        </Ul>
      </>
    ),
  },
  {
    id: 'kjopetips',
    heading: 'Kjøpetips',
    content: (
      <>
        <P>
          Ta med kappelista og kjøp ut fra de lengdene butikken faktisk har – det er ofte mer
          økonomisk å tilpasse prosjektet til standardlengder enn å kappe mye til spille.
        </P>
        <Callout variant="tip" title="Kjøp litt ekstra">
          Regn med rundt 10 % ekstra. Et bord kan ha en feil du ikke så i butikken, og det er greit å
          ha materiale til å øve et kutt på først.
        </Callout>
      </>
    ),
  },
]

export default function TrevirkePage() {
  return (
    <GuideArticleLayout
      slug="trevirke"
      readingTime="6 min"
      lead="Riktig treverk avgjør hvor godt – og hvor lenge – prosjektet holder. Slik velger du mellom tretyper, forstår dimensjoner og plukker gode bord."
      sections={sections}
    />
  )
}
