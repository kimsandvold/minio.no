import GuideArticleLayout, {
  Callout,
  DataTable,
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
          En byggetegning forteller deg hvordan konstruksjonen ser ut – før du slår en eneste
          spiker. Plan viser rommet ovenfra, snitt viser hva som skjer inni veggen, og fasade
          viser utsiden. Når du forstår målestokk og de vanligste symbolene, kan du lese enhver
          tegning uten å gjette deg frem.
        </P>
        <Callout variant="tip" title="Tegning først">
          Lag alltid en enkel skisse eller bruk{' '}
          <a href="/byggeguider/planlegging">planleggingsguiden</a> før du starter.
          En god tegning avslører problemer på papiret, ikke på tomten.
        </Callout>
      </>
    ),
  },
  {
    id: 'malestokk',
    heading: 'Målestokk – fra papir til virkelighet',
    content: (
      <>
        <P>
          Målestokk angir forholdet mellom tegningen og virkeligheten. 1:50 betyr at én
          centimeter på papiret tilsvarer 50 cm i virkeligheten, eller én meter = 2 cm på
          tegningen.
        </P>
        <DataTable>
          <caption>Vanlige målestokker og bruksområder</caption>
          <thead>
            <tr>
              <th>Målestokk</th>
              <th>1 cm på papir =</th>
              <th>Brukes til</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1:20</td>
              <td>20 cm</td>
              <td>Detaljtegninger, konstruksjonsdetaljer</td>
            </tr>
            <tr>
              <td>1:50</td>
              <td>50 cm</td>
              <td>Plantegninger, snitt og fasader</td>
            </tr>
            <tr>
              <td>1:100</td>
              <td>1 m</td>
              <td>Situasjonsplaner, oversiktstegninger</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Bruk alltid en tegnestokk (linjal med innbygde målestokker) når du leser mål fra
          en utskrift. Digitale tegninger som er skalert opp eller ned gir feil mål hvis du
          måler direkte på skjermen.
        </P>
      </>
    ),
  },
  {
    id: 'tegningstyper',
    heading: 'Plan, snitt og fasade',
    content: (
      <>
        <H3>Plan</H3>
        <P>
          Plantegningen viser bygget sett rett ovenfra, som om du sager av taket i ca. 1,2 m
          høyde og ser ned. Du ser rommenes form, veggtykkelser, dører og vinduer. De fleste
          søknader til kommunen krever en plan i 1:50 eller 1:100.
        </P>
        <H3>Snitt</H3>
        <P>
          En snitttegning viser det indre tverrsnittet av bygget, som om du sager rett gjennom
          det langs en angitt linje (markert A–A eller lignende i planen). Her ser du etasjehøyder,
          takkonstruksjonen, gulvoppbygning og frostfri dybde på fundamenter.
        </P>
        <H3>Fasade</H3>
        <P>
          Fasadetegningen viser én side av bygget utenfra – nord, sør, øst og vest. Her leser
          du gesimshøyde, mønehøyde og vindusplassering. Fasaden hjelper deg å visualisere
          sluttresultatet og er ofte påkrevd i byggesøknaden.
        </P>
      </>
    ),
  },
  {
    id: 'mal-og-koter',
    heading: 'Mål og koter',
    content: (
      <>
        <P>
          Mål på tegningen skrives enten direkte (f.eks. 3600) eller som en kotehøyde.
          I Norge angis mål vanligvis i millimeter uten enhet – 3600 betyr 3 600 mm = 3,6 m.
        </P>
        <P>
          Koter angir høyder over et referansenivå, vanligvis NN2000 (Normalnull). På
          situasjonsplaner ser du kotehøyder for terrenget rundt bygget, ferdig gulvnivå
          og fundamentdybde. Koten skrives gjerne som +2,45 eller NN +2,45 m.
        </P>
        <Callout variant="warn" title="Mål alltid opp selv">
          Tegninger kan inneholde feil eller være laget med avrundede mål. Mål alltid opp
          tomten og eksisterende konstruksjoner selv, og noter avvik før du bestiller materialer.
        </Callout>
      </>
    ),
  },
  {
    id: 'symboler',
    heading: 'Vanlige symboler og begreper',
    content: (
      <>
        <DataTable>
          <caption>Symbol / begrep og betydning</caption>
          <thead>
            <tr>
              <th>Symbol / begrep</th>
              <th>Betydning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Skravur (krysslinjer)</td>
              <td>Snittflate – viser hva som er kappet gjennom (betong, mur, tre osv.)</td>
            </tr>
            <tr>
              <td>Stiplet linje</td>
              <td>Skjult kant eller konstruksjon bak/under snittet</td>
            </tr>
            <tr>
              <td>Pil med tall</td>
              <td>Bjelkeretning og dimensjon, f.eks. "48×148 c/c 600"</td>
            </tr>
            <tr>
              <td>Ø</td>
              <td>Diameter, f.eks. Ø16 = 16 mm armering</td>
            </tr>
            <tr>
              <td>UK / OK</td>
              <td>Underkant / Overkant – høydereferanser for bjelker og dekker</td>
            </tr>
            <tr>
              <td>BYA</td>
              <td>Bebygd areal – fotavtrykket til bygget (inkl. veggtykkelse)</td>
            </tr>
            <tr>
              <td>c/c</td>
              <td>Senter til senter – avstand målt mellom midtpunktene</td>
            </tr>
            <tr>
              <td>Mønehøyde</td>
              <td>Høyde fra ferdig gulv (eller terreng) til topp møne</td>
            </tr>
            <tr>
              <td>Gesimshøyde</td>
              <td>Høyde fra terreng til takkant/takfot</td>
            </tr>
            <tr>
              <td>A–A / B–B</td>
              <td>Snittlinje – viser hvor snitttegningen er tatt</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'praktiske-tips',
    heading: 'Praktiske tips når du leser tegninger',
    content: (
      <>
        <Ul>
          <li>Start alltid med plantegningen for å forstå romplan og orientering.</li>
          <li>Finn snittlinjene i planen og les snitttegningene for høyder og konstruksjonsdetaljer.</li>
          <li>Sjekk om tegningen har revisjonsdato – bruk alltid siste versjon.</li>
          <li>Skriv av kritiske mål på en arbeidsbok og dobbeltsjekk mot faktisk tomt.</li>
          <li>
            Lurer du på hva noe betyr? Se{' '}
            <a href="/byggeguider/ordliste-trearbeid">ordlisten for trearbeid</a> for
            definisjoner av vanlige begreper.
          </li>
        </Ul>
        <P>
          Klar til å planlegge prosjektet ditt? Gå til{' '}
          <a href="/byggeguider/planlegging">planleggingsguiden</a> for neste steg.
        </P>
      </>
    ),
  },
]

export default function LeseByggetegningPage() {
  return (
    <GuideArticleLayout
      slug="lese-byggetegning"
      readingTime="5 min"
      lead="Forstå plan, snitt og fasade – lær å lese målestokk, koter og symboler på byggetegninger slik at du vet nøyaktig hva du skal bygge."
      sections={sections}
    />
  )
}
