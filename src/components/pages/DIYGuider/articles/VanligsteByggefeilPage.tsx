import GuideArticleLayout, {
  Callout,
  H3,
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
          De fleste byggefeil skyldes ikke manglende håndverkerferdigheter, men manglende
          planlegging. Feil fundament, rustne skruer og bord lagt for tett mot bakken
          er klassikere som raskt ødelegger et ellers godt arbeid. Her er de vanligste
          feilene – og hva du gjør i stedet.
        </P>
        <Callout variant="tip" title="Unngå dem alle med én sjekkliste">
          Gå gjennom <a href="/byggeguider/sjekkliste-for-du-starter">sjekklisten
          før du starter</a> – den dekker de fleste punktene nedenfor.
        </Callout>
      </>
    ),
  },
  {
    id: 'ingen-plan',
    heading: 'Feil 1 – Ingen plan eller tegning',
    content: (
      <>
        <H3>Problemet</H3>
        <P>
          Mange starter rett på byggingen uten tegning og oppdager underveis at bjelkene
          ikke passer, at det mangler materialer, eller at terrassen kolliderer med en
          drensledning. Da stopper jobben opp, kostnadene stiger og motivasjonen synker.
        </P>
        <H3>Løsningen</H3>
        <P>
          Lag alltid en enkel plantegning med mål og bjelkeretning. Bruk{' '}
          <a href="/planleggere/terrasse">terrasseplanleggeren</a> for å visualisere
          konstruksjonen, og les <a href="/byggeguider/planlegging">planleggingsguiden</a>{' '}
          for en strukturert gjennomgang. En time på papir sparer en dag på byggeplassen.
        </P>
      </>
    ),
  },
  {
    id: 'feil-festemidler',
    heading: 'Feil 2 – Feil festemidler som ruster',
    content: (
      <>
        <H3>Problemet</H3>
        <P>
          Vanlige stålskruer ruster, misfarger treverket og svekker holdeevnen over tid.
          Det er spesielt ille med impregnert tre som inneholder kobber og sink – disse
          ionene akselererer korrosjon kraftig.
        </P>
        <H3>Løsningen</H3>
        <P>
          Bruk alltid syrefaste (A4) eller varmgalvaniserte skruer til utendørs bruk.
          Til impregnert tre kreves varmgalvaniserte eller syrefaste skruer – sjekk
          trelastleverandørens anbefaling. Se{' '}
          <a href="/byggeguider/riktig-skrue">riktig skrue til riktig jobb</a> for full
          oversikt over materialer.
        </P>
      </>
    ),
  },
  {
    id: 'feil-fundament',
    heading: 'Feil 3 – For grunt fundament (frostskader)',
    content: (
      <>
        <H3>Problemet</H3>
        <P>
          Fundamenter som ikke er gravd ned til frostfri dybde hever seg om vinteren,
          vrir bjelkene og løfter bordene. Resultatet er en skjev og usikker terrasse
          etter første vinter.
        </P>
        <H3>Løsningen</H3>
        <Ul>
          <li>Grav ned til frostfri dybde – 80–120 cm avhengig av klimasone.</li>
          <li>Legg 10 cm pukk i bunnen for drenering.</li>
          <li>Bruk justerbare stolpesko slik at du kan korrigere etter støp.</li>
        </Ul>
        <Callout variant="warn" title="Jord under betong fryser">
          Selv om fundamentet er dypt nok, kan vannansamling under fundamentet fryse og
          løfte konstruksjonen. God drenering rundt fundamentene er like viktig som dybden.
        </Callout>
      </>
    ),
  },
  {
    id: 'ikke-vater',
    heading: 'Feil 4 – Ikke i vater og ikke i vinkel',
    content: (
      <>
        <H3>Problemet</H3>
        <P>
          En skjev konstruksjon ser dårlig ut og gjør at regnvann samler seg i dammer
          på bordene. En konstruksjon som ikke er i 90°-vinkel gir skjeve gjæringskutt
          og bord som ikke passer inn mot husveggen.
        </P>
        <H3>Løsningen</H3>
        <P>
          Sjekk vater på alle bjelker med et langt vater (80 cm+) og en vaterskrue.
          Kontroller 90°-vinkelen med 3-4-5-regelen: mål 3 m langs én side, 4 m langs
          den andre – diagonalen skal bli nøyaktig 5 m. Bruk snorline for å holde hjørnene
          riktig under bygging.
        </P>
        <P>
          Husk at terrassen bør ha et lite fall fra huset (ca. 1–2 cm per meter) for
          regnvannsdrenering. Det betyr at bjelkene ikke er 100 % vannrette, men
          konstruksjonen heller svakt utover.
        </P>
      </>
    ),
  },
  {
    id: 'glemte-tykkelse',
    heading: 'Feil 5 – Glemt materialtykkelse i målene',
    content: (
      <>
        <H3>Problemet</H3>
        <P>
          Du måler opp 4 m og kutter til 4 m – men glemmer at bjelken er 48 mm tykk.
          Plutselig er ytterbjelken 48 mm for lang eller for kort. Dette høres trivielt
          ut, men er en av de vanligste målefeilene for nybegynnere.
        </P>
        <H3>Løsningen</H3>
        <P>
          Tegn konstruksjonen i målestokk og tenk nøye gjennom om målene er til
          innside, utside eller senter av materialene. Legg dimensjonene inn i
          beregningen fra starten av – ikke etter. Se{' '}
          <a href="/byggeguider/trelast-dimensjoner">trelastdimensjoner</a> for
          oversikt over nominelle og faktiske mål.
        </P>
      </>
    ),
  },
  {
    id: 'for-tett-bakken',
    heading: 'Feil 6 – Bord og bjelker for tett mot bakken',
    content: (
      <>
        <H3>Problemet</H3>
        <P>
          Tre som ligger nær bakken holder på fuktighet, får dårlig luftsirkulasjon
          og råtner raskt – selv om det er impregnert. Bord som nesten berører bakken
          er et eldorado for sopp og råtesopp.
        </P>
        <H3>Løsningen</H3>
        <Ul>
          <li>
            La minimum 30–40 cm klaring mellom underkant bjelke og bakkens overflate
            for god luftsirkulasjon.
          </li>
          <li>Fjern vegetasjon, bark og humus under terrassen.</li>
          <li>Legg fiberduk og pukk under terrassen for å hindre oppvekst og oppfuktning.</li>
        </Ul>
        <Callout variant="warn" title="Impregnert er ikke råtebestandig for alltid">
          Impregnert tre er ikke uforgjengelig. Det trenger luft og drenering for å
          holde seg lenge. Legger du impregnert tre direkte på jord, brekker
          impregnermiddelet ned og råten tar over innen 5–10 år.
        </Callout>
      </>
    ),
  },
  {
    id: 'for-faa-fundamenter',
    heading: 'Feil 7 – For få fundamentpunkter',
    content: (
      <>
        <H3>Problemet</H3>
        <P>
          Bjelker med for langt spenn mellom fundamenter bøyer seg under last, spriker og
          gir en sviktende terrasse. Det er ubehagelig å gå på og kan over tid gi
          strukturelle problemer.
        </P>
        <H3>Løsningen</H3>
        <P>
          For en standard 48 × 148 mm bjelke er maks spenn mellom fundamenter ca. 1,8–2,4 m.
          Planlegg fundamentrekker tidlig og bruk{' '}
          <a href="/byggeguider/spennvidder-bjelker">guiden om spennvidder</a> for å
          dimensjonere riktig. Det er alltid bedre med ett fundamentpunkt for mye enn ett
          for lite.
        </P>
        <P>
          Se{' '}
          <a href="/byggeguider/materialberegning-terrasse">materialberegningsguiden</a>{' '}
          for en gjennomgang av hvordan du regner ut antall fundamentpunkter for din terrasse.
        </P>
      </>
    ),
  },
]

export default function VanligsteByggefeilPage() {
  return (
    <GuideArticleLayout
      slug="vanligste-byggefeil"
      readingTime="6 min"
      lead="Unngå de 7 vanligste byggefeilene på terrasse – fra manglende plan og rustne skruer til for grunt fundament og bord som råtner på grunn av dårlig lufting."
      sections={sections}
    />
  )
}
