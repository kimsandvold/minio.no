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
          En levegg gir le, privatliv og et ryddig uterom – og er et av de mer overkommelige gjør-det-selv-prosjektene. En standard levegg på 5–6 m kan stå ferdig på én god arbeidsdag. Vanskelighetsgrad: lav til middels.
        </P>
        <P>
          Denne guiden tar deg gjennom høyderegler, valg av stolper og fundament, ulike kledningsmønstre og riktig innfesting. God planlegging gir en levegg som tåler norsk vind i mange år.
        </P>
        <Callout variant="tip" title="Sjekk regelverket før du begynner">
          Høyde og plassering av levegg er regulert. Les <a href="/byggeguider/levegg-gjerde-regler">guiden om levegger og gjerder</a> grundig før du setter spade i jord.
        </Callout>
      </>
    ),
  },
  {
    id: 'regelverk-hoyde',
    heading: 'Høyderegler og plassering',
    content: (
      <>
        <P>
          Reglene for levegger og gjerder er satt i plan- og bygningsloven, men kommunene kan ha egne bestemmelser i reguleringsplanene. Les den fulle gjennomgangen i <a href="/byggeguider/levegg-gjerde-regler">guiden om levegg og gjerder</a>.
        </P>
        <DataTable>
          <caption>Veiledende høyderegler for levegger (sjekk kommunens regler)</caption>
          <thead>
            <tr>
              <th>Situasjon</th>
              <th>Maks høyde (veiledende)</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Inntil nabogrense</td>
              <td>1,8 m</td>
              <td>Normalt søknadsfritt</td>
            </tr>
            <tr>
              <td>1 m fra nabogrense</td>
              <td>1,8 m</td>
              <td>Inntil 10 m lengde</td>
            </tr>
            <tr>
              <td>Mot vei/sti</td>
              <td>0,5 m (synlighetssone)</td>
              <td>Trafikkfarlig sikt må ivaretas</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Er leveggen over 1,8 m, i strid med reguleringsplan, eller nærmere enn 1 m fra nabogrensen, kan det utløse søknadsplikt. Snakk alltid med naboen og gjerne kommunen på forhånd.
        </P>
        <Callout variant="warn" title="Nabosamtykke er smart">
          Selv om leveggen er søknadsfri, er det god naboskikk å informere naboen på forhånd. Uenigheter om gjerder og levegger er en vanlig kilde til nabokonflikt.
        </Callout>
      </>
    ),
  },
  {
    id: 'stolper-og-fundament',
    heading: 'Stolper og fundament',
    content: (
      <>
        <P>
          Stolpene er det bærende elementet i leveggen. De må fundamenteres godt nok til å tåle vindlast – en 1,8 m høy levegg kan utsettes for betydelige krefter i sterk vind.
        </P>
        <Ol>
          <li>
            <H3>Velg stolpetype og avstand</H3>
            <P>
              Bruk trykkimpregnert furu minimum 70×70 mm (gjerne 95×95 mm) for levegger over 1,5 m høyde. Stolpeavstand bør ikke overstige 2,4 m for 25 mm kledning, eller 1,8 m for spiler og lettere konstruksjoner. Se <a href="/byggeguider/stolpeavstand">stolpeavstand-guiden</a> for detaljer.
            </P>
          </li>
          <li>
            <H3>Fundamenter stolpene</H3>
            <P>
              For en varig levegg: grav ned minimum 80 cm (gjerne til frostfri dybde), hell betong rundt stolpen og avslutt litt over bakkenivå med skrå kant for avrenning. Alternativt bruk stolpebeskyttere i metall som holder stolpen over bakken – dette forlenger levetiden betraktelig siden treet ikke er i direkte jordforbindelse.
            </P>
          </li>
          <li>
            <H3>Still stolpene i lodd</H3>
            <P>
              Bruk hyssing mellom første og siste stolpe for å sikre rett linje. Kontroller lodd i begge retninger og stiv av midlertidig til betongen har herdet.
            </P>
          </li>
        </Ol>
      </>
    ),
  },
  {
    id: 'kledning-monster',
    heading: 'Kledningsmønstre',
    content: (
      <>
        <P>
          Kledningen gir leveggen utseende og kan varieres etter smak. Her er de tre vanligste mønstrene:
        </P>
        <H3>Liggende kledning (overligger)</H3>
        <P>
          Klassisk utseende. Bord legges vannrett med overlapp (25–35 mm) eller med avstand. Nedre bord festes med én skrue per stolpe, øvre bord holdes av tyngden. Lett å skifte ut enkeltbord ved skade.
        </P>
        <H3>Stående kledning</H3>
        <P>
          Moderne og rent utseende. Bord settes loddrette med spalter (spil-vegg) eller tett. Krever et vandrette reglar (lister) foran stolpene som kledningen festes til. Gir god luftsirkulasjon.
        </P>
        <H3>Spilekledning</H3>
        <P>
          Åpen konstruksjon med spiler satt med mellomrom. Gir delvis innsyn og le for vind, men ikke tett skjerming. Stilig og moderne, og god mot vindlast siden vinden passerer delvis gjennom. Bruk 45×70 mm eller 28×70 mm spiler med 30–60 mm åpning.
        </P>
        <Callout variant="tip" title="Spilelevegg tåler vinden bedre">
          En tett levegg fungerer som et seil i sterk vind. Spilelevegg med 30–40 % åpning reduserer vindlasten dramatisk og gir faktisk bedre le-effekt lengre inn enn en tett vegg.
        </Callout>
      </>
    ),
  },
  {
    id: 'innfesting',
    heading: 'Innfesting og kledning',
    content: (
      <>
        <Ol>
          <li>
            <H3>Monter reguler</H3>
            <P>
              For stående kledning monteres vannrette reguler (lekter 36×48 mm) foran stolpene c/c 600 mm. For liggende kledning festes bordene direkte på stolpene.
            </P>
          </li>
          <li>
            <H3>Bruk riktige skruer</H3>
            <P>
              Alltid A4 rustfrie skruer – aldri galvaniserte i trykkimpregnert tre. 3,5×50 mm for tynne bord, 4,5×70 mm for tykkere. Se <a href="/byggeguider/riktig-skrue">guiden for riktig skrue</a> for komplett oversikt.
            </P>
          </li>
          <li>
            <H3>Avslutning topp og bunn</H3>
            <P>
              Legg et topplist over øverste bord for å beskytte kappkantene mot vann. Hold alle kledningsbord minst 50 mm over bakkenivå – direkte jordkontakt akselererer råte dramatisk selv i impregnert tre.
            </P>
          </li>
        </Ol>
        <P>
          For informasjon om riktige beslag til innfesting av leveggen mot terrasse, se <a href="/byggeguider/beslag-oversikt">beslag-oversikten</a>.
        </P>
      </>
    ),
  },
  {
    id: 'overflatebehandling',
    heading: 'Overflatebehandling og vedlikehold',
    content: (
      <>
        <P>
          En levegg er svært eksponert – vann og sol treffer alle flater. God overflatebehandling er nøkkelen til lang levetid.
        </P>
        <Ul>
          <li>Behandle alle kappkanter med endetreolje under bygging</li>
          <li>Første strøk beis eller olje etter at treverket har tørket (4–6 uker for trykkimpregnert)</li>
          <li>Behandle på nytt hvert 2–3 år, eller når overflaten begynner å grånne</li>
          <li>Kontroller stolpefundamentene hvert år for råte og frosthev</li>
        </Ul>
        <P>
          En gjennomtenkt og godt utført levegg er et fint tilskudd til uterommet – og et prosjekt du kan fullføre på én dag. Lykke til!
        </P>
      </>
    ),
  },
]

export default function ByggeLeveggPage() {
  return (
    <GuideArticleLayout
      slug="bygge-levegg"
      readingTime="8 min"
      lead="Slik bygger du levegg selv – høyderegler, stolper og fundament, kledningsmønstre og riktig innfesting steg for steg."
      sections={sections}
    />
  )
}
