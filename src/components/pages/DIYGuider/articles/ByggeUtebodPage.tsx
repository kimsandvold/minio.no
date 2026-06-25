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
          En utebod er et krevende men svært nyttig prosjekt – du bygger i realiteten et lite hus med gulv, vegger, tak, dør og vindu. En bod på 6–8 m² tar typisk tre til fem helger for én person. Vanskelighetsgrad: middels til høy.
        </P>
        <P>
          Guiden dekker hele prosessen: fra fundament og gulv, via bindingsverk og vegger, til takkonstruksjon, kledning, dør og vindu, og taktekking. Sjekk regelverket i <a href="/byggeguider/bod-uten-soknad">guiden om bod uten søknad</a> før du starter.
        </P>
        <Callout variant="tip" title="Tegn boden på forhånd">
          Lag en enkel tegning med mål av alle fire vegger, tak og gulv. Det avslører problemer og gjør det langt enklere å bestille riktige materialmengder.
        </Callout>
      </>
    ),
  },
  {
    id: 'regelverk',
    heading: 'Regelverk og søknadsplikt',
    content: (
      <>
        <P>
          En bod inntil 15 m² bebygd areal kan i mange tilfeller bygges uten søknad. Les detaljene i <a href="/byggeguider/bod-uten-soknad">guiden om bod uten søknad</a>. Kortversjonen:
        </P>
        <Ul>
          <li>Maks 15 m² bebygd areal (BYA)</li>
          <li>Maks gesimshøyde 3 m, mønehøyde 4 m</li>
          <li>Minimum 1 m fra nabogrense</li>
          <li>Ikke til beboelse</li>
          <li>I tråd med kommunens reguleringsplan</li>
        </Ul>
        <P>
          Er boden over 15 m², nærmere nabogrensen eller i strid med reguleringsplanen, kreves søknad. Noen kommuner har strengere krav – sjekk alltid med kommunen.
        </P>
      </>
    ),
  },
  {
    id: 'materialliste',
    heading: 'Materialliste – 2,5×3 m bod',
    content: (
      <>
        <DataTable>
          <caption>Veiledende materialliste – utebod 2,5×3 m</caption>
          <thead>
            <tr>
              <th>Materiale</th>
              <th>Dimensjon / type</th>
              <th>Mengde</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sylbjelker (bunn)</td>
              <td>Trykkimpregnert 48×148 mm</td>
              <td>Ca. 12 lm</td>
            </tr>
            <tr>
              <td>Gulvbord</td>
              <td>Trykkimpregnert 28×120 mm</td>
              <td>Ca. 8 m²</td>
            </tr>
            <tr>
              <td>Stendere (bindingsverk)</td>
              <td>48×98 mm, c/c 600 mm</td>
              <td>Ca. 30 lm</td>
            </tr>
            <tr>
              <td>Kledning ute</td>
              <td>Trykkimpregnert 19×148 mm</td>
              <td>Ca. 35 m²</td>
            </tr>
            <tr>
              <td>Taksperrer</td>
              <td>48×148 mm</td>
              <td>7 stk à 3,5 m</td>
            </tr>
            <tr>
              <td>Takpapp / undertak</td>
              <td>2-lags asfaltpapp</td>
              <td>Ca. 12 m²</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          For valg av fundamenttype til boden, se <a href="/byggeguider/fundamenttyper">oversikten over fundamenttyper</a>.
        </P>
      </>
    ),
  },
  {
    id: 'fase-1-fundament-gulv',
    heading: 'Fase 1 – Fundament og gulv',
    content: (
      <>
        <P>
          Grunnlaget for boden må være stabilt og frostfritt. Velg en løsning som passer grunnforholdene dine – se <a href="/byggeguider/fundamenttyper">fundamenttyper</a> for en komplett gjennomgang.
        </P>
        <Ol>
          <li>
            <H3>Velg og støp fundament</H3>
            <P>
              For en liten bod er punktfundament eller nedgravde stolper i betong de vanligste løsningene. Grav til frostfri dybde (80–120 cm avhengig av region) og støp. Alternativt: legg et bærebjelkelag direkte på et godt drenert pukk-fundament om grunnforholdene er gode. Se <a href="/byggeguider/frostfri-dybde">guiden om frostfri dybde</a>.
            </P>
          </li>
          <li>
            <H3>Monter sylbjelker</H3>
            <P>
              Sylbjelkene (48×148 mm, klasse NTR/A) legges på fundamentet og danner bunnrammen for vegger og gulv. Sjekk at de er i vater og rett vinkel (diagonal-kontroll). Legg butyl-tape eller membranpapp under sylbjelkene mot betong for å hindre fuktinntrenging.
            </P>
          </li>
          <li>
            <H3>Legg gulvbjelker og gulvbord</H3>
            <P>
              Legg gulvbjelker (48×98 mm) c/c 400–600 mm på tvers mellom sylbjelkene. Skru fast med vinkler. Legg ut trykkimpregnerte gulvbord (28×120 mm) med 5 mm spalte for drenering. For ekstra isolasjon i bakken: legg mineralull mellom gulvbjelkene og dekk til med dampsperre innenfra.
            </P>
          </li>
        </Ol>
        <Callout variant="tip" title="Hev gulvet over bakken">
          Sørg for minimum 20–30 cm luft under gulvet for sirkulasjon og enkel inspeksjon. Fukt som samler seg under en bod er den vanligste årsaken til råteskader.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-2-bindingsverk',
    heading: 'Fase 2 – Bindingsverk og vegger',
    content: (
      <>
        <P>
          Bindingsverket er veggskjelettet. Det bygges av stendere (48×98 mm) c/c 600 mm med ovanligger og underliner øverst og nederst.
        </P>
        <Ol>
          <li>
            <H3>Bygg veggrammer på bakken</H3>
            <P>
              Det er mye lettere å bygge en hel veggram flat på gulvet og reise den enn å sette opp stendere én og én. Mål opp underligger og overligger, plasser stendere c/c 600 mm og spiker/skru sammen. Husk å planlegge åpninger for dør og vindu.
            </P>
          </li>
          <li>
            <H3>Reis veggrammene</H3>
            <P>
              Reis én og én vegg, hjelper alltid å være to. Kontroller lodd i begge retninger og stiv av midlertidig. Skru underliggeren fast i sylbjelken med tæringer eller vinkler.
            </P>
          </li>
          <li>
            <H3>Forsterking rundt åpninger</H3>
            <P>
              Dør- og vindusåpninger trenger ekstra forsterkning (doble stendere på sidene og en overligger av dobbel 48×98 mm) for å overføre lasten rundt åpningen. Størrelsen på åpningen bestemmer din dør- og vindusramme – kjøp disse først og mål opp nøyaktig.
            </P>
          </li>
          <li>
            <H3>Diagonal avstiving</H3>
            <P>
              Veggene må stives av mot racking (rotasjon). Bruk enten spikringsplater i hjørnene, knivlekter diagonalt, eller – best – legg en vindavstivende plate (OSB eller kryssfiner) utvendig på hjørnefeltene.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-3-tak',
    heading: 'Fase 3 – Takkonstruksjon',
    content: (
      <>
        <P>
          Pulttak er den enkleste taktypen for en bod – én skrånende flate uten møne. Sal-tak ser penere ut men er mer krevende å bygge.
        </P>
        <Ol>
          <li>
            <H3>Bestem takfallet</H3>
            <P>
              Minimum 1:7 (ca. 8°) for pulttak med takpapp. 14–20° gir bedre avrenning og lengre levetid. Høydeforskjellen mellom fremre og bakre vegg skaper fallet.
            </P>
          </li>
          <li>
            <H3>Monter taksperrer</H3>
            <P>
              Taksperrene (48×148 mm) hviler på ytterveggens overliggere. Bruk sperrehaker (metallvinkler) for å forhindre at sperrene skyves ut. C/c 600 mm er standard.
            </P>
          </li>
          <li>
            <H3>Legg undertak (bordkledning)</H3>
            <P>
              Legg panelbord (19 mm) tett over sperrebunnen som underlaget for takpapp. Legg bordene i lengderetningen (vinkelrett på sperrene) med tett stump mot hverandre.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-4-kledning-dor',
    heading: 'Fase 4 – Kledning, dør og vindu',
    content: (
      <>
        <Ol>
          <li>
            <H3>Legg vindsperremembran</H3>
            <P>
              Rull ut vindsperre-membran utenpå bindingsverket og fest med stiftemaskin. Overlapp med minimum 100 mm og tape alle skjøter. Vindsperren hindrer trekk og øker isolasjonsevnen.
            </P>
          </li>
          <li>
            <H3>Monter bordkledning</H3>
            <P>
              Stå- eller liggende kledning festes på horisontale lekter (36×48 mm) foran vindsperren. Hold bordene minst 50 mm over ferdig terreng. Bruk A4 rustfrie spiker eller skruer.
            </P>
          </li>
          <li>
            <H3>Monter dør og vindu</H3>
            <P>
              Sett inn rammen i åpningen og kil den i vater og lodd. Skum rundt rammen innvendig og dekk til med listverk utvendig. Dørens hengsler skal helst sitte mot vinden for å forhindre at vinden river opp døren.
            </P>
          </li>
        </Ol>
        <Callout variant="warn" title="Tett godt rundt åpninger">
          Fuktinntrengning skjer hyppigst rundt dør- og vindusåpninger. Legg alltid vindsperre omhyggelig rundt åpningene og dekk til med vannbord (bredder) og tetningslister.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-5-taktekking',
    heading: 'Fase 5 – Taktekking',
    content: (
      <>
        <P>
          Takpapp er den vanligste taktekkeingen for boder og er relativt enkel å legge selv.
        </P>
        <Ol>
          <li>
            <H3>Legg underlagspapp</H3>
            <P>
              Start fra bunnen og arbeid deg opp. Legg pappbaner vannrett med minimum 100 mm overlapp. Fest midlertidig med pappspiker.
            </P>
          </li>
          <li>
            <H3>Legg topppapp</H3>
            <P>
              Brenn fast topppapp med gass-fakkel (schweisepapp) over underlagspappen, eller bruk selvklebende papp. Avslutt ved møne og kanter med et 200 mm overlapp som bøyes ned over kantene.
            </P>
          </li>
          <li>
            <H3>Monter takrenne</H3>
            <P>
              Legg takrenne langs den nedre kanten med fall mot nedløp. Led vannet bort fra fundamentet med et nedløpsrør til avsrenningsgrop eller hagesluk.
            </P>
          </li>
        </Ol>
        <P>
          En velbygget utebod vil vare i 30–40 år med godt vedlikehold. Med en solid bod på plass har du også arbeidsrum for neste prosjekt. God byggelykke!
        </P>
      </>
    ),
  },
]

export default function ByggeUtebodPage() {
  return (
    <GuideArticleLayout
      slug="bygge-utebod"
      readingTime="11 min"
      lead="Komplett guide til å bygge utebod selv – fundament og gulv, bindingsverk, takkonstruksjon, kledning, dør, vindu og taktekking steg for steg."
      sections={sections}
    />
  )
}
