import GuideArticleLayout, {
  Callout,
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
          En ny trykkimpregnert terrasse må tørke ut skikkelig før du behandler den – vanligvis
          4–12 uker avhengig av sesong og vær. Behandler du for tidlig, trenger beisen ikke inn,
          og du risikerer at produktet flasser av allerede første sommer.
        </P>
        <P>
          Når treverket er klart, vasker du det rent, lar det tørke i minst 48 timer og påfører
          beis eller olje langs treretningen i passe temperatur.
        </P>
        <Callout variant="tip" title="Sjekk med et par vanndrpåer">
          Drypp litt vann på terrassebordene. Trekker vannet inn med én gang, er treverket klart.
          Perler vannet seg opp, er det fortsatt for fuktig – vent noen uker til.
        </Callout>
      </>
    ),
  },
  {
    id: 'ventetid',
    heading: 'Hvor lenge må du vente?',
    content: (
      <>
        <P>
          Trykkimpregnert tre er mettet med vann i produksjonsprosessen og selges ofte med høyt
          fuktinnhold. Før overflatebehandling skal fuktigheten i treverket ned til under ca. 20 %.
          I praksis betyr det:
        </P>
        <Ul>
          <li>Lagt om sommeren (juni–august): 4–8 uker er ofte nok</li>
          <li>Lagt om våren eller høsten: 8–12 uker, gjerne over vinteren</li>
          <li>Lagt sent på høsten: vent til neste sommer</li>
        </Ul>
        <P>
          Royalimpregnert tre leveres tørrere og kan behandles raskere – ofte etter 2–4 uker.
          Les mer om forskjellen i artikkelen om{' '}
          <a href="/byggeguider/trykkimpregnert-vs-royalimpregnert">
            trykkimpregnert vs. royalimpregnert
          </a>
          .
        </P>
        <Callout variant="warn" title="Ikke behandle for tidlig">
          Behandler du for tidlig, stenger du inne fukt i treverket. Det kan føre til
          blemmer, avflassing og råteskader langt raskere enn om du hadde ventet. Ta deg
          tiden til å gjøre det riktig.
        </Callout>
      </>
    ),
  },
  {
    id: 'rengjoring',
    heading: 'Rengjøring og forberedelse',
    content: (
      <>
        <P>
          Selv om terrassen er ny, har den gjerne støv, byggesmuss og kanskje begynnende
          algevekst. Vask alltid overflaten grundig før behandling.
        </P>
        <H3>Slik vasker du ny terrasse</H3>
        <Ol>
          <li>Fei bort løst smuss og blader.</li>
          <li>
            Bland terrasserens eller trevasker etter anvisningen (ca. 1 del rens til 4–5 deler
            vann).
          </li>
          <li>Påfør løsningen og la den virke i 10–15 minutter.</li>
          <li>Skrubb langs treretningen med en hard kost eller terraskrubb.</li>
          <li>Skyll grundig med hageslange – lav til middels trykk.</li>
          <li>La terrassebordet tørke i minst 48 timer, gjerne 72 timer ved overskyet vær.</li>
        </Ol>
        <P>
          Unngå høytrykksspyler på ny terrasse – det kan åpne opp trefibrene og gjøre
          overflaten ru. Håndvask med kost gir et bedre resultat.
        </P>
      </>
    ),
  },
  {
    id: 'produktvalg',
    heading: 'Velge riktig produkt',
    content: (
      <>
        <P>
          For ny trykkimpregnert terrasse i gran eller furu anbefales klarbeis eller en
          lett pigmentert dekkbeis. Klarbeis fremhever trestrukturen og gir et naturlig uttrykk,
          mens dekkbeis gir mer farge og litt lengre vedlikeholdsintervall.
        </P>
        <P>
          Unngå rene filmbaserte produkter som maling til terrassegulv – de tåler ikke
          slitasjen fra tråkk og temperatursvingninger like godt som beis. Vil du ha en
          solid farge på rekkverket, kan du bruke dekkbeis der.
        </P>
        <Callout variant="tip" title="Test på en skjult bord">
          Påfør produktet på undersiden av ett terrasse-bord eller et stykke rest-tre først.
          Da ser du fargen og inntrekket før du behandler hele flaten.
        </Callout>
      </>
    ),
  },
  {
    id: 'paforingsteknikk',
    heading: 'Påføring – slik gjør du det',
    content: (
      <>
        <P>
          Påfør beis eller olje langs treretningen. Bruk en bred pensel (10–15 cm), rull
          eller terrass-kost. Arbeid deg baklengs slik at du ikke tråkker i fersk beis.
        </P>
        <Ol>
          <li>Sjekk at alle sprekker og endeved er rene og tørre.</li>
          <li>Rør eller rist produktet grundig.</li>
          <li>
            Pensle endeved og skjøter ekstra godt – disse partiene suger mer og er sårbare
            for fuktinntrengning.
          </li>
          <li>Påfør et jevnt strøk langs treretningen over hele flaten.</li>
          <li>
            La tørke etter produsentens anvisning (vanligvis 4–8 timer), og påfør et
            andre strøk hvis anbefalt.
          </li>
          <li>Unngå direkte sol og regn i 24–48 timer etter påføring.</li>
        </Ol>
        <P>
          To tynne strøk er alltid bedre enn ett tykt. Tykt påstrøk tørker dårlig utenpå
          og kan bli klebrig.
        </P>
      </>
    ),
  },
  {
    id: 'vaer-og-temperatur',
    heading: 'Vær og temperatur',
    content: (
      <>
        <P>
          Påfør beis ved temperaturer mellom 10 og 25 °C. Under 10 °C tørker produktet for
          sakte, og over 25 °C i direkte sol tørker det for fort og gir ujevn finish.
          Overskyet, men tørt vær er ideelt.
        </P>
        <Ul>
          <li>Sjekk værvarsleren – det må ikke komme regn de neste 24 timene</li>
          <li>Unngå å beise tidlig morgen mens det er dugg på bordene</li>
          <li>Unngå direkte sol på flaten under påføring</li>
          <li>Beise i skyggen av huset om kvelden kan fungere godt om sommeren</li>
        </Ul>
        <P>
          Etter første behandling er terrassen klar for normal bruk etter 24–48 timer.
          Fullstendig herding tar gjerne 5–7 dager.
        </P>
      </>
    ),
  },
]

export default function BeiseNyTerrassePage() {
  return (
    <GuideArticleLayout
      slug="beise-ny-terrasse"
      readingTime="5 min"
      lead="Lær når og hvordan du beiser ny terrasse – riktig ventetid, rengjøring, produktvalg og påføring for et resultat som holder."
      sections={sections}
    />
  )
}
