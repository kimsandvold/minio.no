import GuideArticleLayout, {
  Callout,
  H3,
  Ol,
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
          Rette, fine kutt handler om forberedelse mer enn sagferdighet. Riktig merking,
          godt støttet materiale og et blad tilpasset jobben gir deg kasserte kantlinjer
          – uten at du trenger å slipe dem etterpå.
        </P>
        <Callout variant="tip" title="Én ting å huske">
          Bruk alltid en knivridse i stedet for blyant når kuttkvaliteten teller.
          Kniven kapper trefibrene på forhånd, og sagen faller nøyaktig i sporet.
        </Callout>
      </>
    ),
  },
  {
    id: 'merking',
    heading: 'Merking: knivridse slår blyant',
    content: (
      <>
        <P>
          Blyant gir en strek på 0,5–1 mm, og du vet ikke på hvilken side av streken
          sagen skal gå. Knivridse er en tynn, presis linje som forteller sagen nøyaktig
          hvor den skal starte.
        </P>
        <P>
          Trekk kniven langs et stållineål med jevnt press. For krumme kutt bruk en
          markertusj i stedet, men forstå at presisjonen da er lavere. Til blyant-merking
          bruk en skarpspist blyant (0,5 mm) og hold den mot målebåndet fra siden,
          ikke ovenfra.
        </P>
        <H3>Sagspor og mersiden</H3>
        <P>
          Husk at sagbladet har tykkelse – et kerf på ca. 2–3 mm. Sag alltid på
          avfallssiden av streken. Mange glemmer dette og ender opp med et bord som
          er 3 mm for kort. Når det teller, test saginnstillingen på et skrap først.
        </P>
      </>
    ),
  },
  {
    id: 'stotte-materiale',
    heading: 'Støtte materialet riktig',
    content: (
      <>
        <P>
          Et dårlig støttet arbeidsstykke vibrerer, klemmer bladet og gir splintret
          snittflate. Legg alltid materialet på to faste underlag (bukker, planker
          på gulvet) slik at begge sider av kuttelinjen er støttet. La avfallsbiten
          falle fritt – klem den ikke fast.
        </P>
        <Callout variant="warn" title="Klemming av avfallsbit">
          Klemmer du fast avfallsbiten, knipes bladet mot slutten av kuttet og motoren
          bremser. I verste fall sparker sagen bakover. La biten falle.
        </Callout>
        <P>
          For lange plater på sagbukk: plasser bukkene slik at de er 1/3 inn fra
          hver ende av materialet. Det gir optimal støtte og forhindrer at platen
          bøyer seg under kuttet.
        </P>
      </>
    ),
  },
  {
    id: 'foeringsskinne-og-anlegg',
    heading: 'Føringsskinne og anlegg',
    content: (
      <>
        <P>
          En rettskjær klemt til arbeidsstykket er den enkle løsningen: legg
          sagens sko mot kanten av planken og dra langs med jevnt trykk. Målsett
          avstanden mellom sagskoen og bladet på forhånd, og posisjon planken
          deretter.
        </P>
        <P>
          En aluminiumsrail (føringsskinne) er mer fleksibel og gir nøyaktig samme
          avstand hver gang. Dykksager er designet for rail; for vanlige sirkelsager
          finnes det adapter-kits som koster 200–400 kr.
        </P>
        <H3>Gjør det selv: sagguide</H3>
        <P>
          To lister og noen skruer er alt du trenger. Skru en smal liste oppå en bred
          liste i 90° vinkel. Sagskoen går mot den smale listen, og du justerer
          innfestningen første gang du bruker guiden ved å sage gjennom den brede
          listen. Etter det vet du nøyaktig hvor bladet faller.
        </P>
      </>
    ),
  },
  {
    id: 'splintring',
    heading: 'Unngå splintring',
    content: (
      <>
        <P>
          Splintring skjer fordi sagbladet rives oppover på en side av materialet.
          Sirkelsagen splintrer på oversiden (bladet går oppover der), stikksagen
          splintrer på undersiden. Planlegg deretter hvilken side som er synlig.
        </P>
        <Ol>
          <li>
            <strong>Tape:</strong> Lim malertape langs kuttelinjen på synlig side.
            Sagen kutter gjennom tapen som holder fiberne på plass.
          </li>
          <li>
            <strong>Knivridse:</strong> Scorer du fiberne med en kniv i kuttelinjen
            før saging, kapper du fibrene rent og unngår at de rives opp.
          </li>
          <li>
            <strong>Finere blad:</strong> Bytt til et blad med 40+ TPI (tenner per
            tomme). Mer tenner = renere kutt, men tregere fart.
          </li>
          <li>
            <strong>Sagdybde:</strong> Still sirkelsagen slik at bladet stikker
            5–10 mm gjennom materialet – ikke mer. Lavere sagdybde reduserer
            kreftene som river i fiberne.
          </li>
          <li>
            <strong>Skårplate:</strong> Legg materialet på en flat skårplate av
            MDF eller gammelt bord. Sagen kutter gjennom materialet og ned i platen,
            som støtter fiberne helt til siste millimeter.
          </li>
        </Ol>
        <Callout variant="tip" title="Laminat og finér">
          Sagene laminat med fintennet blad og tape alltid. Alternativt sag fra
          baksiden med sirkelsag, slik at den synlige oversiden (som er undersiden
          under saging) holdes intakt.
        </Callout>
      </>
    ),
  },
  {
    id: 'bladvalg-for-fine-kutt',
    heading: 'Bladvalg for fine kutt',
    content: (
      <>
        <P>
          Et grovtannet sagblad kutter fort, men sliter på overflaten. Til
          terrasseplanker og grove konstruksjoner er 24 TPI riktig. Til synlige
          kuttflater i innendørs arbeid vil du ha 40–60 TPI.
        </P>
        <P>
          Bytt blad jevnlig. Et sløvt blad krever mer kraft, gir mer varme og
          splintrer mer enn et nytt. Som tommelregel: bytt blad etter 20–30 timers
          bruk, eller når du merker at motoren jobber hardere enn vanlig.
        </P>
        <P>
          Les mer om sagvalg i{' '}
          <a href="/byggeguider/sirkelsag-dykksag-stikksag">
            Sirkelsag, dykksag eller stikksag
          </a>{' '}
          og om sammenføyning i{' '}
          <a href="/byggeguider/saging-og-sammenfoyning">Saging og sammenføyning</a>.
        </P>
      </>
    ),
  },
]

export default function RetteFineKuttPage() {
  return (
    <GuideArticleLayout
      slug="rette-fine-kutt"
      readingTime="5 min"
      lead="Rette, fine kutt starter med riktig merking, godt støttet materiale og et passe blad – ikke med dyrt utstyr."
      sections={sections}
    />
  )
}
