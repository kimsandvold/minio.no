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
          En utetrapp er noe av det mest brukte du kan bygge – men også noe av det mest farlige å gjøre feil. Riktig dimensjonering og godt feste er avgjørende. En enkel trapp på 3–5 trinn tar én dag. Vanskelighetsgrad: middels.
        </P>
        <P>
          Guiden dekker beregning av opptrinn og inntrinn, valg og kapping av vanger, innfesting, og sklisikring. Ta deg god tid til beregningene – en trapp som er ubehagelig å gå på er vanskelig å endre i etterkant.
        </P>
        <Callout variant="warn" title="Sikkerhet først">
          Utetrapper er en av de hyppigste årsaker til ulykker på fritidseiendom. Sjekk at alle trinn er identiske, at trappen er godt festet, og at overflaten er sklisikret.
        </Callout>
      </>
    ),
  },
  {
    id: 'beregning',
    heading: 'Beregne opptrinn og inntrinn',
    content: (
      <>
        <P>
          Den grunnleggende formelen for en komfortabel trapp er: <strong>2 × opptrinn + inntrinn ≈ 63 cm</strong>. Dette er trampeformelen, og det finnes god grunn til at den er innarbeidet i alle bygguider.
        </P>
        <DataTable>
          <caption>Komfortable trappemål ute (veiledende)</caption>
          <thead>
            <tr>
              <th>Opptrinn (stigning)</th>
              <th>Inntrinn (dybde)</th>
              <th>Sum-formel</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>14 cm</td>
              <td>35 cm</td>
              <td>2×14+35 = 63 ✓</td>
            </tr>
            <tr>
              <td>16 cm</td>
              <td>31 cm</td>
              <td>2×16+31 = 63 ✓</td>
            </tr>
            <tr>
              <td>18 cm</td>
              <td>27 cm</td>
              <td>2×18+27 = 63 ✓</td>
            </tr>
            <tr>
              <td>20 cm</td>
              <td>23 cm</td>
              <td>2×20+23 = 63 ✓</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          For en utetrapp er et opptrinn på 15–17 cm og inntrinn på 29–33 cm ideelt. Høye opptrinn (over 19 cm) er slitsomme og lite egnet for eldre. Lave opptrinn (under 12 cm) kan man lett snuble over.
        </P>
        <H3>Slik regner du ut antall trinn</H3>
        <P>
          Mål total høydeforskjell fra bakke til overkant terrasse/innerdørterskel. Del på ønsket opptrinns-høyde (f.eks. 170 mm). Rund av til nærmeste hele tall og juster opptrinns-høyden tilbake: total høyde ÷ antall trinn = eksakt opptrinn. Eksempel: 85 cm ÷ 5 trinn = 17 cm opptrinn.
        </P>
        <Callout variant="tip" title="Alle trinn MÅ være like høye">
          Én enkelt trinn som er 5 mm høyere eller lavere enn de andre er nok til å forårsake snubling. Mål og kapp alle vanger og trinnbord med samme mal.
        </Callout>
      </>
    ),
  },
  {
    id: 'fase-1-planlegging',
    heading: 'Fase 1 – Planlegging og materialer',
    content: (
      <>
        <P>
          Tegn trappen på forhånd. Du trenger:
        </P>
        <Ul>
          <li>Antall trinn (beregnet over)</li>
          <li>Total stigning (høydeforskjell)</li>
          <li>Total vandringsplan (antall trinn × inntrinn)</li>
          <li>Trappens bredde (minimum 80 cm, helst 90–120 cm)</li>
        </Ul>
        <P>
          Velg trykkimpregnert furu eller hardtre (Bangkirai, Robinia) for vanger og trinnbord. Unngå løvtre som bøk og eik – de glipper raskt når de er fuktige. Vanger bør være minimum 48×198 mm (helst 63×198 mm) for trapper over 3 trinn.
        </P>
      </>
    ),
  },
  {
    id: 'fase-2-vanger',
    heading: 'Fase 2 – Kapping av vanger',
    content: (
      <>
        <P>
          Vangene er trappens sidesparker. De kapper du med opptrinn og inntrinn risset inn som en serie trappeformer.
        </P>
        <Ol>
          <li>
            <H3>Lag en mal</H3>
            <P>
              Bruk en vinkelhake og sett inn dine eksakte mål for opptrinn og inntrinn. En spesiell trappevinkelhake gjør dette mye enklere. Merk ett trappetrinn på en bit av bord og kontroller at målene er korrekte.
            </P>
          </li>
          <li>
            <H3>Ris inn alle trinn på vangen</H3>
            <P>
              Start fra bunnen av vangen. Ris inn opptrinn (loddrett) og inntrinn (vannrett) for hvert trinn i rekkefølge. Kontroller at du ender opp på riktig høyde og dybde.
            </P>
          </li>
          <li>
            <H3>Kappe vangen</H3>
            <P>
              Kappe forsiktig langs merkene med sirkelsag. Husk at du aldri skal kappe dypere enn 1/3 av vangens bredde – dypere kapping svekker konstruksjonen. Gjør resten med stikksag. Bruk første vange som mal for den andre – det sikrer at begge er identiske.
            </P>
          </li>
          <li>
            <H3>Kapp bunn og topp av vangen</H3>
            <P>
              Bunnen av vangen kappe du i riktig vinkel slik at den hviler flatt mot underlaget. Toppen kappe du slik at den kan festes mot terrasse-bjelken eller stikkontakten.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'fase-3-innfesting',
    heading: 'Fase 3 – Innfesting av trappen',
    content: (
      <>
        <P>
          En trapp som ikke er godt festet er en farlig trapp. Det finnes to ender å feste: øverst mot terrassen og nederst mot underlaget.
        </P>
        <Ol>
          <li>
            <H3>Feste topp av trapp</H3>
            <P>
              Øverst festes vangene mot terrasse-bjelken eller syllstokken med godkjente beslag (trappefester eller vinkelbeslag). Bruk minimum 2 × M10 bolter per vange eller 4 × 5 mm konstruksjons-skruer. Se <a href="/byggeguider/beslag-oversikt">beslag-oversikten</a> for godkjente løsninger.
            </P>
          </li>
          <li>
            <H3>Sikre bunn av trapp</H3>
            <P>
              Bunnen av trappen hviler mot et fundament – aldri bare løst på bakken. Alternativene er: en betong-svill støpt i bakken, to betongstein under hver vange, eller ekspansjonsbolter direkte i eksisterende betonggulv/-plate.
            </P>
          </li>
          <li>
            <H3>Monter trinnbordene</H3>
            <P>
              Trinnbordene (28–45 mm tykke) festes i vangenes inntrinn-flate med skruer fra undersiden eller fra siden. To skruer per vange per trinnbord. Sørg for jevn overstand fremover (nese) på 20–30 mm for komfort.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'sklisikring',
    heading: 'Sklisikring',
    content: (
      <>
        <P>
          En ubehandlet tretrapp er svært glatt når den er fuktig eller dekket av løv. Sklisikring er ikke valgfritt – det er en sikkerhetsnødvendighet.
        </P>
        <Ul>
          <li>Sklisikre gummi- eller aluminiums-profiler i forkant av hvert trinn (festet med skruer)</li>
          <li>Grovkornede klisterremser (anti-skli-tape) lenger inn på trinnet</li>
          <li>Rilleprofil-terrassebord med mønster gir god sklimotstand naturlig</li>
          <li>For hardtre: påfør terrasse-olje med sandtilsetning for struktur</li>
        </Ul>
        <Callout variant="warn" title="Rekkverk ved mer enn 3 trinn">
          Vurder alltid rekkverk på trapper med mer enn 3 trinn – særlig om eldre eller barn bruker trappen. Se guiden for <a href="/byggeguider/bygge-rekkverk">å bygge rekkverk</a> for dimensjonering og innfesting.
        </Callout>
      </>
    ),
  },
  {
    id: 'vedlikehold',
    heading: 'Vedlikehold',
    content: (
      <>
        <P>
          Utetrapper er svært utsatt for vær og slitasje. Jevnlig tilsyn er viktig.
        </P>
        <Ul>
          <li>Sjekk alle fester og bolter hvert år – stram til ved behov</li>
          <li>Kontroller vanger for råte i bunnen – særlig der de berører bakken</li>
          <li>Behandle trinnbordene med olje hvert 2. år for å unngå oppsprekking</li>
          <li>Rens sklisikringen for løv og smuss hver høst</li>
        </Ul>
        <P>
          En solid og riktig dimensjonert utetrapp er trygg og komfortabel i mange tiår. Lykke til med byggingen!
        </P>
      </>
    ),
  },
]

export default function ByggeUtetrappPage() {
  return (
    <GuideArticleLayout
      slug="bygge-utetrapp"
      readingTime="8 min"
      lead="Slik bygger du utetrapp selv – beregn opptrinn og inntrinn riktig, kapp vanger, fest trappen solid og sikre mot glatt underlag."
      sections={sections}
    />
  )
}
