import GuideArticleLayout, {
  Callout,
  DataTable,
  H3,
  Ol,
  P,
  type ArticleSection,
} from '../GuideArticleLayout'

const sections: ArticleSection[] = [
  {
    id: 'hvorfor-behandle',
    heading: 'Hvorfor behandle overflaten?',
    content: (
      <>
        <P>
          Ubehandlet tre ute er utsatt: sola gjør det grått og sprøtt, vann trenger inn og gir sopp og
          råte. Overflatebehandling er det som avgjør om prosjektet ditt holder seg pent i to år eller
          i tjue. Det er den billigste forsikringen du kan gi arbeidet ditt.
        </P>
      </>
    ),
  },
  {
    id: 'typer',
    heading: 'Beis, olje, maling eller lakk?',
    content: (
      <>
        <P>De fire vanligste behandlingene har hver sine styrker:</P>
        <DataTable>
          <caption>Velg etter ønsket uttrykk og vedlikehold</caption>
          <thead>
            <tr>
              <th>Type</th>
              <th>Uttrykk</th>
              <th>Vedlikehold</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Beis</td>
              <td>Tonet, lar åren skinne gjennom</td>
              <td>Enkelt – nytt strøk ved behov</td>
            </tr>
            <tr>
              <td>Olje</td>
              <td>Naturlig, matt, fremhever treet</td>
              <td>Oftere, men lett å pusse opp</td>
            </tr>
            <tr>
              <td>Maling</td>
              <td>Dekkende farge, skjuler treet</td>
              <td>Holder lenge, men flasser til slutt</td>
            </tr>
            <tr>
              <td>Lakk</td>
              <td>Klar, blank/matt film</td>
              <td>Krevende ute – kan sprekke og flasse</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          For de fleste uteprosjekter i hagen er beis eller olje et trygt og takknemlig valg – de
          slites pent og er enkle å friske opp.
        </P>
      </>
    ),
  },
  {
    id: 'forarbeid',
    heading: 'Forarbeid',
    content: (
      <>
        <P>
          Et godt resultat avgjøres før du åpner boksen. Overflaten må være ren, tørr og ferdig
          slipt. Børst bort alt slipestøv – behandling over støv fester dårlig og blir ru.
        </P>
        <Callout variant="warn" title="Impregnert tre må tørke først">
          Nyinnkjøpt trykkimpregnert tre er ofte fuktig. Det må tørke i flere uker – gjerne en hel
          sesong – før det kan beises eller males. Maler du for tidlig, slipper behandlingen taket og
          flasser av.
        </Callout>
      </>
    ),
  },
  {
    id: 'pafoning',
    heading: 'Påføring',
    content: (
      <>
        <P>Når underlaget er klart, er selve påføringen grei – ta deg tid og jobb systematisk:</P>
        <Ol>
          <li>Rør godt i boksen, og underveis, så fargen holder seg jevn.</li>
          <li>Påfør tynt og jevnt med pensel eller rull, i fiberretningen.</li>
          <li>Stryk ut «renninger» med en gang, før de tørker.</li>
          <li>Flere tynne strøk gir et bedre og mer holdbart resultat enn ett tykt.</li>
        </Ol>
        <Callout variant="tip" title="Test fargen først">
          Prøv beisen eller malingen på et avkapp av samme tre før du går løs på selve prosjektet.
          Fargen ser ofte annerledes ut på treet enn på lokket.
        </Callout>
      </>
    ),
  },
  {
    id: 'forhold-og-torketid',
    heading: 'Forhold og tørketid',
    content: (
      <>
        <H3>Vær og temperatur</H3>
        <P>
          Mal i tørt, mildt vær – ikke i sterk sol, ikke når det er meldt regn, og ikke når det er
          kaldt. Sterk sol tørker overflaten for raskt og gir striper; regn vasker vekk fersk
          behandling.
        </P>
        <P>
          Følg tørketiden på boksen mellom strøkene. En lett mellomsliping med fint papir før neste
          strøk gir et glattere sluttresultat. Når alt er tørt, er det vedlikeholdet som holder det
          pent videre.
        </P>
      </>
    ),
  },
]

export default function OverflatebehandlingPage() {
  return (
    <GuideArticleLayout
      slug="overflatebehandling"
      readingTime="6 min"
      lead="Riktig behandling avgjør om treet holder seg pent i to år eller tjue. Slik velger du mellom beis, olje og maling – og påfører det så det varer ute."
      sections={sections}
    />
  )
}
