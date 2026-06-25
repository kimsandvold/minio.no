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
          God vinterklargjøring handler ikke om å gjøre mye – men om å gjøre de riktige tingene
          i riktig rekkefølge. Vask terrassen, lagre eller dekk til møblene, kontroller
          dreneringen og sørg for at konstruksjonen er klar for snø og is.
        </P>
        <P>
          En ettermiddag i oktober sparer deg for dyre reparasjoner til våren.
        </P>
        <Callout variant="tip" title="Beste tidspunkt">
          Gjør vinterklargjøringen i oktober–november, etter løvfall men før de første
          harde frostene. Da rekker du også å oppdage og utbedre skader mens det fortsatt
          er mulig å jobbe ute.
        </Callout>
      </>
    ),
  },
  {
    id: 'terrassen',
    heading: 'Terrassen – vask og inspeksjon',
    content: (
      <>
        <P>
          Start med en grundig vask for å fjerne løv, alger og smuss som har samlet seg gjennom
          sommeren og høsten. Løv og organisk materiale som ligger mot treverket over vinteren
          holder på fukt og fremmer råte- og algevekst.
        </P>
        <Ol>
          <li>Fei bort alle løv, bar og grener – også i sprekker og langs kanter.</li>
          <li>Vask med terrasserens eller en mild trevasker og skyll grundig.</li>
          <li>
            Inspiser skruer og beslag – stram til løse, bytt ut rustne med rustfrie.
          </li>
          <li>
            Stikk en spikkel inn i stolpeføtter og stenderbaser for å sjekke for råte.
          </li>
          <li>Sjekk at dreneringen under terrassen ikke er blokkert av løv eller jord.</li>
        </Ol>
        <Callout variant="warn" title="Ikke beise om høsten">
          Unngå å påføre beis eller olje sent på høsten ved temperaturer under 10 °C.
          Produktene tørker ikke som de skal og fester seg dårlig. Vent til våren.
        </Callout>
      </>
    ),
  },
  {
    id: 'moblér',
    heading: 'Hagemøbler – lagre eller dekke til?',
    content: (
      <>
        <P>
          Det beste for hagemøbler er å lagre dem innendørs – i garasje, bod eller kjeller.
          Innendørslagring beskytter mot UV, frost, fukt og snølast, og forlenger levetiden
          betraktelig.
        </P>
        <H3>Innendørslagring</H3>
        <Ul>
          <li>Rengjør møblene grundig før lagring – smuss og fukt inne i vinter gir mugg</li>
          <li>Tørk av alle flater, spesielt steder der vann samler seg</li>
          <li>Stabel stoler og brett bord for å spare plass</li>
          <li>Legg puter og tekstiler tørt innendørs – aldri i plastpose uten lufting</li>
        </Ul>
        <H3>Tildekking utendørs</H3>
        <P>
          Har du ikke plass innendørs, kan du dekke møblene ute. Bruk møbeltrekk i
          pustende materiale – ikke plastduk som stenger inne fukt og gir mugg. Sørg for
          at trekkene er festet slik at de ikke blåser av i storm.
        </P>
        <Ul>
          <li>Velg pustende møbeltrekk, ikke plastfolie</li>
          <li>La det være litt lufting i bunn for å unngå kondens</li>
          <li>Forankre trekket – bruk snorer, borrelås eller strikk</li>
          <li>Sjekk at det ikke samler seg vann på toppen av trekket</li>
        </Ul>
        <Callout variant="tip" title="Teak og hardtre tåler mer">
          Møbler i teak, ipe og andre hardtresorter tåler å stå ute over vinteren uten
          tildekking. Det er likevel lurt å oljebehandle dem om høsten og ta inn putene.
        </Callout>
      </>
    ),
  },
  {
    id: 'pergola-carport',
    heading: 'Pergola og carport – snølast og drenering',
    content: (
      <>
        <P>
          Pergola og carport er bygget for å stå ute, men noen enkle tiltak reduserer
          belastningen og forlenger levetiden:
        </P>
        <Ul>
          <li>
            <strong>Snølast:</strong> Skuff av snø etter kraftige snøfall, spesielt på
            flate tak og tette overbygg. Snø veier 100–300 kg per kubikkmeter og kan
            overbelaste lette konstruksjoner.
          </li>
          <li>
            <strong>Is i renner og avrenning:</strong> Fjern is som blokkerer rennene
            for å unngå vanninntrenging når snøen smelter.
          </li>
          <li>
            <strong>Inspiksjon av knutepunkter:</strong> Sjekk beslag, skruer og
            festemidler i bærekonstruksjonen etter vinteren.
          </li>
        </Ul>
        <P>
          Se{' '}
          <a href="/planleggere/terrasse">terrasseplanneren</a> for å planlegge
          utvidelser av uterommet til neste sommer.
        </P>
      </>
    ),
  },
  {
    id: 'sjekkliste',
    heading: 'Komplett sjekkliste for vinterklargjøring',
    content: (
      <>
        <H3>Terrasse</H3>
        <Ul>
          <li>Fei bort løv, bar og smuss</li>
          <li>Vask med terrasserens, skyll grundig</li>
          <li>Inspiser skruer, beslag og stolpeføtter</li>
          <li>Sjekk drenering under konstruksjonen</li>
          <li>Reparer løse bord og skruer</li>
        </Ul>
        <H3>Hagemøbler</H3>
        <Ul>
          <li>Rengjør og tørk alle møbler</li>
          <li>Lagre innendørs eller dekk til med pustende trekk</li>
          <li>Ta inn alle puter og tekstiler</li>
          <li>Oljebehandl hardtremøbler om høsten</li>
        </Ul>
        <H3>Pergola og carport</H3>
        <Ul>
          <li>Sjekk at konstruksjonen er stabil</li>
          <li>Rydd takflaten for greiner og smuss</li>
          <li>Fjern snø etter kraftige snøfall</li>
          <li>Kontroller renner og avrenning</li>
        </Ul>
        <P>
          Les mer om generelt vedlikehold i{' '}
          <a href="/byggeguider/vedlikehold">vedlikeholdsguiden</a> og{' '}
          <a href="/byggeguider/vedlikehold-terrasse">vedlikehold av terrasse</a>.
        </P>
      </>
    ),
  },
]

export default function VinterklargjoringPage() {
  return (
    <GuideArticleLayout
      slug="vinterklargjoring"
      readingTime="4 min"
      lead="Vinterklargjør terrasse, hagemøbler og utebygninger riktig – komplett sjekkliste for rengjøring, tildekking, snølast og lagring før vinteren setter inn."
      sections={sections}
    />
  )
}
