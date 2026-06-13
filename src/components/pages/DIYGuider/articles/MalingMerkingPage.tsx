import GuideArticleLayout, {
  Callout,
  H3,
  P,
  Ul,
  type ArticleSection,
} from '../GuideArticleLayout'

const sections: ArticleSection[] = [
  {
    id: 'mal-to-ganger',
    heading: 'Mål to ganger, kapp én gang',
    content: (
      <>
        <P>
          Det gamle ordtaket er den viktigste regelen i hele snekringen. Et kutt tar du ikke tilbake –
          mens en ekstra kontrollmåling koster deg fem sekunder. Gjør det til en vane å sjekke målet på
          nytt rett før du sager.
        </P>
      </>
    ),
  },
  {
    id: 'verktoy',
    heading: 'Verktøyet du trenger',
    content: (
      <>
        <P>God oppmerking krever lite, men det lille må være presist:</P>
        <Ul>
          <li>
            <strong>Tommestokk eller målebånd</strong> – for lengder.
          </li>
          <li>
            <strong>Vinkelhake</strong> – for rette streker på tvers og kontroll av vinkler.
          </li>
          <li>
            <strong>En skarp blyant</strong> – en tykk, sløv strek er upresis. Spiss blyanten ofte.
          </li>
          <li>
            <strong>Vater</strong> – for alt som skal stå loddrett eller i vater.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'referansekant',
    heading: 'Jobb fra én referansekant',
    content: (
      <>
        <P>
          Velg én kant på bordet som «fasit», og mål alltid fra den – ikke fra forrige merke. Måler du
          videre fra hvert merke, legger små feil seg oppå hverandre, og til slutt er siste del helt
          feil.
        </P>
        <Callout variant="tip" title="Samme tommestokk hele veien">
          To måleverktøy kan vise ørlite forskjellig. Bruk det samme gjennom hele prosjektet, så
          stemmer delene med hverandre.
        </Callout>
      </>
    ),
  },
  {
    id: 'merke-riktig',
    heading: 'Merk riktig',
    content: (
      <>
        <P>
          Et lite blyantkryss er lettere å treffe nøyaktig enn enden av en lang strek. Mange bruker et
          «V» som peker presist mot målet.
        </P>
        <H3>Merk vrakssiden</H3>
        <P>
          Sagbladet har bredde og spiser litt av treet (snittfuget). Tegn derfor på hvilken side av
          streken som er avkapp, og sag på vrakssiden – da blir delen akkurat så lang som planlagt.
        </P>
      </>
    ),
  },
  {
    id: 'vinkel-og-vater',
    heading: 'Vinkel og vater',
    content: (
      <>
        <P>
          Bruk vinkelhaken til å føre streken rundt bordet, ikke bare på oversiden – da ser du kuttet
          fra flere sider mens du sager, og holder deg i vinkel. Et vater sikrer at det ferdige bygget
          står rett, ikke bare ser rett ut.
        </P>
        <Callout variant="warn" title="«Omtrent rett» blir skjevt">
          Små vinkelfeil forsterker seg gjennom et helt prosjekt. To deler som hver er en grad skjeve,
          gir en synlig glipe der de møtes. Bruk vinkelhaken – ikke øyemålet.
        </Callout>
      </>
    ),
  },
  {
    id: 'gjentatte-deler',
    heading: 'Like deler – bruk en mal',
    content: (
      <>
        <P>
          Skal du lage flere like deler (fire bein, ti spiler), ikke mål hver enkelt på nytt. Lag den
          første nøyaktig, og bruk den som mal for resten – eller sett et anslag (en kloss) som stopper
          bordet på riktig lengde hver gang. Da blir alle helt like, og jobben går fortere.
        </P>
      </>
    ),
  },
]

export default function MalingMerkingPage() {
  return (
    <GuideArticleLayout
      slug="maling-og-merking"
      readingTime="5 min"
      lead="Nøyaktig oppmerking er der et godt resultat begynner. Mål to ganger, kapp én gang – og lær de små grepene som gir deler som passer perfekt sammen."
      sections={sections}
    />
  )
}
