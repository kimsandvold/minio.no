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
          En god forberedelse er halve jobben. Gå gjennom denne sjekklisten før du sager det
          første bordet, og du unngår de vanligste bomtabbene: feil mål, manglende søknad,
          for lite materialer og dårlig fundament. Det tar én time å sjekke – det sparer deg
          for dager med om-bygging.
        </P>
        <Callout variant="tip" title="Start med planleggingen">
          Les <a href="/byggeguider/planlegging">planleggingsguiden</a> for en grundig
          innføring i prosjektforberedelse. Sjekklisten her er en rask gjennomgang du kan
          huke av punkt for punkt.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase1-ide',
    heading: 'Fase 1 – Idé og mål',
    content: (
      <>
        <H3>Avklar hva du vil bygge</H3>
        <Ol>
          <li>Hva skal terrassen brukes til? (møblering, grilling, bad, lek)</li>
          <li>Ønsket størrelse og form – rektangel, L-form eller tilpasset?</li>
          <li>Høyde over terreng – flat mot bakken eller hevet konstruksjon?</li>
          <li>Materialer – impregnert furu, hardtre, Kebony, kompositt?</li>
          <li>Rekkverk – nødvendig over 0,5 m høyde, ønsket under?</li>
        </Ol>
        <P>
          Bruk <a href="/planleggere/terrasse">terrasseplanleggeren</a> for å
          visualisere og justere størrelse og bjelkeoppsett før du bestemmer deg.
        </P>
      </>
    ),
  },
  {
    id: 'fase2-tegning',
    heading: 'Fase 2 – Tegning og mål',
    content: (
      <>
        <Ol>
          <li>Lag en enkel skisse eller tegning med mål (plan og snitt).</li>
          <li>Mål opp tomten – ikke stol på gammelt kart eller reguleringsplan.</li>
          <li>Sjekk avstand til nabogrense (minimum 1,0 m uten søknad i de fleste kommuner).</li>
          <li>Merk av eksisterende installasjoner: drens, kummer, kabler, rør.</li>
          <li>
            Tegn inn fundamentpunkter og bjelkeretning – se{' '}
            <a href="/byggeguider/materialberegning-terrasse">materialberegningsguiden</a>{' '}
            for hjelp.
          </li>
        </Ol>
        <Callout variant="warn" title="Mål to ganger">
          Feil på tegningen gir feil i materiallisten. Mål alltid to ganger og skriv ned
          målet med blyant før du kapper noe som helst.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase3-soknad',
    heading: 'Fase 3 – Søknad og regulering',
    content: (
      <>
        <Ol>
          <li>
            Sjekk om terrassen er søknadspliktig – se kommunens nettsider eller ring
            teknisk etat. Grunnregel: under 15 m² og maks 0,5 m over bakken er normalt
            fritatt.
          </li>
          <li>
            Er tomten i et regulert område eller vernefelt? Sjekk reguleringsplanen i
            kommunekartene.
          </li>
          <li>
            Nabovarsel – send skriftlig og vent 14 dager om søknad kreves.
          </li>
          <li>Sett av tid for saksbehandling (4–12 uker) hvis søknad er nødvendig.</li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase4-materialer',
    heading: 'Fase 4 – Materialer og bestilling',
    content: (
      <>
        <Ol>
          <li>
            Lag en komplett materialliste: bord (lm), bjelker (lm), fundament (stk.),
            skruer (stk.), beslag (stk.), overflatebehandling (liter).
          </li>
          <li>Legg til 10 % svinn på trelast.</li>
          <li>Legg til 10 % buffer på skruer og festemidler.</li>
          <li>Innhent pristilbud fra minst to leverandører.</li>
          <li>Avklar leveringstid – trelast med spesialdimensjoner kan ta 1–3 uker.</li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase5-verktoey',
    heading: 'Fase 5 – Verktøy og HMS',
    content: (
      <>
        <H3>Verktøyliste</H3>
        <Ul>
          <li>Sirkelsag eller kapp-/gjærsag</li>
          <li>Drill/skrutrekker med Torx-biter (T20/T25)</li>
          <li>Vinkelsliper til avkapping av beslag</li>
          <li>Vater (minst 80 cm) og lodd</li>
          <li>Snorline og pålstikker for oppmåling</li>
          <li>Jordspyd, spade og mengde til fundamentgraving</li>
          <li>Klemmer og oppstillingsbukker</li>
        </Ul>
        <H3>HMS – sikkerhet på byggeplassen</H3>
        <Ul>
          <li>Bruk verneutstyr: vernebriller, hørselsvern og hansker ved saging.</li>
          <li>Sikre alle stilaser og bord mot velting – ikke arbeid alene i høyden.</li>
          <li>Hold arbeidsplassen ryddig; skruejern og bord på bakken skaper snublefare.</li>
          <li>Koble fra strøm til nærliggende installasjoner under graving ved fundament.</li>
        </Ul>
        <Callout variant="tip" title="Sjekk været">
          Planlegg fundamentstøp og limarbeider til tørrvær og over 5 °C.
          Impregnert tre bør monteres på tøre dager for best feste.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase6-fundament',
    heading: 'Fase 6 – Grunn og fundament',
    content: (
      <>
        <Ol>
          <li>Grav ned til frostfri dybde – typisk 80–120 cm i Norge.</li>
          <li>Legg pukk i bunnen (ca. 10 cm) for drenering under fundamentene.</li>
          <li>Still inn justerbare stolpesko i vater og lodd før støp.</li>
          <li>La betongen herdes minst 48 timer (helst 72 h) før belastning.</li>
          <li>Sjekk at alle fundamentpunkter er i samme høydeplant med vater på snor.</li>
        </Ol>
        <P>
          Les mer om bjelkedimensjoner og spennvidder i{' '}
          <a href="/byggeguider/spennvidder-bjelker">guiden om spennvidder for bjelker</a>.
        </P>
      </>
    ),
  },
]

export default function SjekklisteForDuStarterPage() {
  return (
    <GuideArticleLayout
      slug="sjekkliste-for-du-starter"
      readingTime="5 min"
      lead="Sjekkliste før du starter byggeprosjektet: mål, materialer, verktøy, søknad og fundament på plass før første kutt."
      sections={sections}
    />
  )
}
