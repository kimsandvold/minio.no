import GuideArticleLayout, {
  Callout,
  DataTable,
  P,
  Ul,
  type ArticleSection,
} from '../GuideArticleLayout'

const sections: ArticleSection[] = [
  {
    id: 'hvorfor',
    heading: 'Litt stell, mange år',
    content: (
      <>
        <P>
          Et uteprosjekt er aldri helt ferdig – men det krever lite. En liten innsats nå og da holder
          treverket pent og forlenger levetiden med mange år. Det handler mest om å oppdage små ting
          før de blir store.
        </P>
      </>
    ),
  },
  {
    id: 'arlig-sjekk',
    heading: 'Den årlige sjekken',
    content: (
      <>
        <P>
          Ta en runde rundt prosjektet en gang i året – gjerne om våren. Se etter de vanlige
          tegnene på slitasje:
        </P>
        <Ul>
          <li>Løse skruer eller beslag – trekk dem til.</li>
          <li>Sprekker i treet der vann kan samle seg.</li>
          <li>Steder der behandlingen er slitt bort eller flasser.</li>
          <li>Mørke flekker eller mykt tre – tidlige tegn på råte.</li>
          <li>Tre i direkte bakkekontakt som har begynt å trekke fukt.</li>
        </Ul>
        <Callout variant="tip" title="Sjekk om våren">
          Etter vinteren er treet på sitt mest utsatte. En sjekk tidlig på sesongen lar deg ta tak i
          småting før sol og regn gjør dem verre.
        </Callout>
      </>
    ),
  },
  {
    id: 'rengjoring',
    heading: 'Rengjøring',
    content: (
      <>
        <P>
          Vask vekk skitt, pollen og grønske med vann, en myk børste og eventuelt litt mildt
          rengjøringsmiddel. Hold treet rent, så holder behandlingen lenger og du ser tilstanden
          tydeligere.
        </P>
        <Callout variant="warn" title="Forsiktig med høytrykksspyler">
          En høytrykksspyler kan rive opp trefibrene og presse vann inn i treet. Brukes den, hold god
          avstand og lavt trykk – ofte er en børste og vann et tryggere valg.
        </Callout>
      </>
    ),
  },
  {
    id: 'nytt-strok',
    heading: 'Nytt strøk i tide',
    content: (
      <>
        <P>
          Behandlingen tæres gradvis av sol og vær. Et nytt strøk før den er helt borte er enkelt – å
          vente til treet er grått og oppsprukket betyr mye mer arbeid. Hvor ofte avhenger av
          behandlingstype og hvor utsatt prosjektet står:
        </P>
        <DataTable>
          <caption>Veiledende intervall – sjekk alltid tilstanden</caption>
          <thead>
            <tr>
              <th>Behandling</th>
              <th>Friskes opp ca.</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Olje</td>
              <td>Hvert år eller annethvert år</td>
            </tr>
            <tr>
              <td>Beis</td>
              <td>Hvert 2.–4. år</td>
            </tr>
            <tr>
              <td>Maling</td>
              <td>Når den begynner å flasse, ofte 5–8 år</td>
            </tr>
          </tbody>
        </DataTable>
        <P>Mer om valg og påføring av behandling finner du i guiden om overflatebehandling.</P>
      </>
    ),
  },
  {
    id: 'reparasjoner',
    heading: 'Småreparasjoner',
    content: (
      <>
        <P>
          De fleste reparasjoner er raske: trekk til løse skruer, bytt et bord som har sprukket, og
          fyll mindre sprekker så vann ikke blir stående. Et bord som byttes i tide, redder ofte
          resten av konstruksjonen.
        </P>
      </>
    ),
  },
  {
    id: 'vinter',
    heading: 'Gjennom vinteren',
    content: (
      <>
        <P>
          Det som kan flyttes, har godt av å settes under tak eller dekkes til om vinteren. Står
          prosjektet ute, hjelp det med å holde seg tørt: hold treet unna direkte bakkekontakt, og
          sørg for at vann og snø kan renne av i stedet for å bli liggende. Da møter du våren med et
          prosjekt som fortsatt ser nytt ut.
        </P>
      </>
    ),
  },
]

export default function VedlikeholdPage() {
  return (
    <GuideArticleLayout
      slug="vedlikehold"
      readingTime="5 min"
      lead="Litt stell nå og da holder prosjektet pent år etter år. Slik gjør du den årlige sjekken, rengjør riktig og frisker opp behandlingen før slitasjen får tak."
      sections={sections}
    />
  )
}
