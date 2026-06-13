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
    id: 'hvorfor-planlegge',
    heading: 'Hvorfor planlegge?',
    content: (
      <>
        <P>
          De fleste prosjekter som stopper opp, gjør det ikke fordi noen mangler ferdigheter – men
          fordi de manglet en plan. Du oppdager at materialet ikke strekker til midt i jobben, at de
          to delene ikke passer sammen, eller at du må kjøre til byggevarehuset for tredje gang på en
          lørdag.
        </P>
        <P>
          En halvtime med planlegging på kjøkkenbordet sparer deg for timer med frustrasjon i
          garasjen. Du trenger ikke en perfekt tegning – du trenger å ha tenkt gjennom{' '}
          <em>hva</em> du skal lage, <em>hvor stort</em> det skal være, og <em>hva</em> som skal til
          for å komme i mål.
        </P>
      </>
    ),
  },
  {
    id: 'fra-ide-til-skisse',
    heading: 'Fra idé til skisse',
    content: (
      <>
        <P>
          Start med å gjøre idéen konkret. Still deg selv tre spørsmål før du tegner en eneste strek:
        </P>
        <Ul>
          <li>
            <strong>Hva skal det brukes til?</strong> En benk du skal sitte på stiller andre krav enn
            en hylle som skal holde noen krukker.
          </li>
          <li>
            <strong>Hvor skal det stå?</strong> Ute eller inne, i sol eller skygge, på flatt eller
            skrått underlag – det påvirker både materialvalg og mål.
          </li>
          <li>
            <strong>Hvor stort kan det være?</strong> Mål plassen der det skal stå før du bestemmer
            størrelsen på selve prosjektet.
          </li>
        </Ul>
        <P>
          Tegn deretter en enkel skisse. Den trenger ikke være pen – en blyantstrek på et ark holder
          lenge. Poenget er å se for deg delene og hvordan de henger sammen, før du står med kappsaga.
        </P>
        <Callout variant="tip" title="Papir eller digitalt?">
          For de fleste hageprosjekter er en håndtegnet skisse mer enn nok. Skal du bygge noe større
          eller mer presist, kan et digitalt verktøy hjelpe deg å se det i 3D og unngå feil. Mer om
          dette i den egne guiden om design &amp; tegning.
        </Callout>
      </>
    ),
  },
  {
    id: 'mal-og-dimensjoner',
    heading: 'Mål og dimensjoner',
    content: (
      <>
        <P>
          Når formen er klar, må du sette tall på den. Her gjør de fleste én av to feil: de gjetter på
          målene, eller de glemmer å regne med tykkelsen på materialet. Begge deler gir deler som ikke
          passer sammen.
        </P>
        <H3>Bruk komfortable standardmål</H3>
        <P>
          Du slipper å finne opp hjulet på nytt. For ting du skal bruke med kroppen finnes det mål som
          bare kjennes riktige ut:
        </P>
        <DataTable>
          <caption>Vanlige, komfortable mål å ta utgangspunkt i</caption>
          <thead>
            <tr>
              <th>Element</th>
              <th>Typisk mål</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Sittehøyde (benk, krakk)</td>
              <td>45 cm</td>
            </tr>
            <tr>
              <td>Bordhøyde</td>
              <td>72–75 cm</td>
            </tr>
            <tr>
              <td>Sittedybde</td>
              <td>40–45 cm</td>
            </tr>
            <tr>
              <td>Hyllehøyde, fri</td>
              <td>30–35 cm</td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="warn" title="Husk materialtykkelsen">
          Skal en kasse være 40 cm bred på utsiden og veggene er 2 cm tykke, blir det bare 36 cm
          innvendig. Tegn alltid med den faktiske tykkelsen på bordene – ellers stemmer ikke
          regnestykket når du setter delene sammen.
        </Callout>
      </>
    ),
  },
  {
    id: 'materialliste',
    heading: 'Materialliste og kappeliste',
    content: (
      <>
        <P>
          Nå gjør du skissen om til en handleliste. Gå gjennom hver del og noter lengde, bredde og
          hvor mange du trenger. Dette kalles en <strong>kappeliste</strong> – fasiten du jobber etter
          når du sager.
        </P>
        <Ol>
          <li>List opp alle delene med mål og antall (f.eks. «4 bein – 45 cm»).</li>
          <li>Regn om til hvor mange hele bord du må kjøpe, ut fra lengdene i butikken.</li>
          <li>Legg til skruer, beslag, lim og eventuell overflatebehandling.</li>
        </Ol>
        <Callout variant="tip" title="Kjøp 10 % ekstra trevirke">
          Et bord kan ha en kvist på feil sted, en sprekk eller en skjev ende. Kjøper du litt mer enn
          du strengt tatt trenger, slipper du å stoppe opp – og du har materiale til å øve et kutt på
          først.
        </Callout>
      </>
    ),
  },
  {
    id: 'verktoy-og-tid',
    heading: 'Verktøy og tid',
    content: (
      <>
        <P>
          Gå gjennom kappelista og spør: har jeg det som skal til for å lage hver del? De fleste
          hageprosjekter krever lite – en sag, en drill/skrutrekker, tommestokk, blyant og en vinkel
          kommer du langt med. Mangler du noe, er det bedre å vite det nå enn midt i jobben.
        </P>
        <P>
          Vær ærlig med deg selv om tid. Et lite prosjekt tar gjerne en ettermiddag, men maling og lakk
          trenger tørketid mellom strøkene. Del jobben i økter du faktisk får tid til, så mister du
          ikke motivasjonen underveis.
        </P>
      </>
    ),
  },
  {
    id: 'budsjett',
    heading: 'Budsjett',
    content: (
      <>
        <P>
          Når materiallista er klar, har du nesten budsjettet ferdig. Summer opp trevirke, skruer og
          overflatebehandling, så vet du hva prosjektet koster før du begynner – ikke etterpå.
        </P>
        <P>
          Et godt råd: spar på mengden, ikke på kvaliteten der det teller. Billige skruer som ruster,
          eller trevirke som ikke tåler vær, koster deg mer i lengden enn det du sparte i kassa.
        </P>
      </>
    ),
  },
  {
    id: 'sjekkliste',
    heading: 'Kort sjekkliste før du starter',
    content: (
      <>
        <P>Har du krysset av på disse, er du klar til å bygge:</P>
        <Ul>
          <li>Jeg vet hva prosjektet skal brukes til og hvor det skal stå.</li>
          <li>Jeg har en skisse med mål – og har regnet med materialtykkelsen.</li>
          <li>Jeg har en kappeliste over alle delene.</li>
          <li>Jeg har handlet trevirke (+ 10 %), skruer og overflatebehandling.</li>
          <li>Jeg har verktøyet som trengs, og satt av nok tid.</li>
        </Ul>
        <P>
          Da er den vanskeligste delen allerede unnagjort. Resten er den morsomme biten – å se det bli
          til.
        </P>
      </>
    ),
  },
]

export default function PlanleggingPage() {
  return (
    <GuideArticleLayout
      slug="planlegging"
      readingTime="6 min"
      lead="God planlegging er forskjellen på et prosjekt som flyter, og ett som stopper opp halvveis. Slik går du fra løs idé til en konkret plan og en materialliste som stemmer."
      sections={sections}
    />
  )
}
