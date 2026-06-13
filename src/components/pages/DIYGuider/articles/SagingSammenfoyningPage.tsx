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
    id: 'rett-kapp',
    heading: 'Slik sager du rett',
    content: (
      <>
        <P>
          Et rett kutt handler mindre om kraft og mer om ro. La sagen gjøre jobben – press den
          forsiktig framover og la tennene skjære, i stedet for å mase den gjennom.
        </P>
        <Ol>
          <li>Fest bordet godt med tvinger, med kappestedet fritt utenfor underlaget.</li>
          <li>Start kuttet med noen rolige, korte drag for å lage et spor å følge.</li>
          <li>Følg streken med blikket, og hold sagbladet loddrett.</li>
          <li>Senk tempoet mot slutten og støtt avkappet, så det ikke flekker av.</li>
        </Ol>
        <Callout variant="warn" title="Støtt det som faller av">
          Mot slutten av kuttet kan avkappet brekke ned av egen vekt og rive med seg en flis. Hold
          eller støtt den løse enden de siste centimeterne.
        </Callout>
      </>
    ),
  },
  {
    id: 'velg-sag',
    heading: 'Velg sag etter jobben',
    content: (
      <>
        <P>
          Hvilken sag som er best avhenger av hva du skal gjøre. Kort oppsummert:
        </P>
        <Ul>
          <li>
            <strong>Håndsag</strong> – presis nok for det meste, og helt stillegående.
          </li>
          <li>
            <strong>Stikksag</strong> – til kurver og utsparinger.
          </li>
          <li>
            <strong>Sirkelsag</strong> – raske, rette kutt når det er mange av dem.
          </li>
          <li>
            <strong>Kapp-/gjærsag</strong> – nøyaktige vinkelkutt på rekke og rad.
          </li>
        </Ul>
        <P>Mer om utvalget finner du i guiden om verktøy.</P>
      </>
    ),
  },
  {
    id: 'enkle-sammenfoyninger',
    heading: 'Enkle sammenføyninger',
    content: (
      <>
        <P>
          Du trenger ikke avansert snekkerhåndverk for å lage solide skjøter. Disse tre tar deg
          gjennom nesten alle hageprosjekter:
        </P>
        <Ul>
          <li>
            <strong>Buttskjøt med skruer</strong> – to bord ende mot flate, skrudd sammen. Enkelt og
            sterkt nok til det meste, særlig med lim i tillegg.
          </li>
          <li>
            <strong>Lim + skruer</strong> – limet gir styrke, skruene holder mens det herder.
            Standardvalget for varige skjøter.
          </li>
          <li>
            <strong>Vinkelbeslag</strong> – metallbeslag som forsterker hjørnet uten tilpasning.
            Trygt og raskt.
          </li>
        </Ul>
      </>
    ),
  },
  {
    id: 'montere-i-vinkel',
    heading: 'Montere i vinkel',
    content: (
      <>
        <P>
          Det nytter ikke med rette kutt hvis delene settes skjevt sammen. To grep gir et bygg i
          vinkel:
        </P>
        <H3>Tørrmonter først</H3>
        <P>
          Sett delene sammen uten lim og skruer først, og se at alt passer. Det er nå du oppdager
          eventuelle feil – mens de fortsatt er enkle å rette.
        </P>
        <Callout variant="tip" title="Sjekk diagonalene">
          For å se om en firkant er i rett vinkel, mål de to diagonalene fra hjørne til hjørne. Er de
          like lange, er firkanten i vinkel. Et raskt og presist triks helt uten vinkelhake.
        </Callout>
      </>
    ),
  },
  {
    id: 'skru-uten-sprekk',
    heading: 'Skru uten å sprekke treet',
    content: (
      <>
        <P>
          Forbor før du skrur, særlig nær endene. Hold delene sammen med tvinger mens du skrur den
          første skruen, så ingenting forskyver seg. Bruk to skruer i hver skjøt der det er plass – én
          enkelt skrue lar delen vri seg rundt skruen.
        </P>
        <P>Mer om skruevalg, lim og forboring finner du i guiden om lim &amp; festemidler.</P>
      </>
    ),
  },
]

export default function SagingSammenfoyningPage() {
  return (
    <GuideArticleLayout
      slug="saging-og-sammenfoyning"
      readingTime="6 min"
      lead="Her blir bordene til et bygg. Slik kapper du rett, velger riktig skjøt og setter delene sammen i vinkel – grepene som gir et stødig, pent resultat."
      sections={sections}
    />
  )
}
