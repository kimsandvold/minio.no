import GuideArticleLayout, {
  Callout,
  DataTable,
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
          Konstruksjonsvirke er trelast som er styrkesortet og stemplet – du vet hva du får. C24
          er den vanligste klassen for bærende konstruksjoner i Norge og angir en garantert
          karakteristisk bøyestyrke på 24 N/mm². C18 er et steg lavere og brukes der kravene er
          mindre. Til enkle hageprosjekter som terrasser og levegger er det ofte ikke lovpålagt
          med C24, men det er alltid tryggere.
        </P>
        <Callout variant="tip" title="Huskeregel">
          Kravkrafter bjelker, åser og dragere i et bygg: C24. Terrassebjelker, stolper og
          enklere utendørskonstruksjoner: C24 er anbefalt, C18 er akseptabelt for lett last.
        </Callout>
      </>
    ),
  },
  {
    id: 'hva-er-styrkesortering',
    heading: 'Hva er styrkesortering?',
    content: (
      <>
        <P>
          Trelast varierer naturlig i styrke – kvist, fiberretning og veksthastighet påvirker alle
          hvor sterkt et bord eller en bjelke er. Styrkesortering er en prosess der hvert stykke
          enten måles maskinelt (maskinsortering) eller vurderes visuelt og merkes med en klasse.
          Klassen forteller deg minimumsegenskapene du kan planlegge med.
        </P>
        <P>
          C-klassen (C for Conifer, altså bartre) bruker et tall som representerer karakteristisk
          bøyestyrke i N/mm². Jo høyere tall, desto sterkere. Vanlig sortiment i norske
          byggevarehus er C14, C18 og C24. C30 finnes men er sjeldnere.
        </P>
      </>
    ),
  },
  {
    id: 'c18-vs-c24',
    heading: 'C18 og C24 – hva er forskjellen?',
    content: (
      <>
        <P>
          C24 er betraktelig sterkere enn C18, men det er ikke bare bøyestyrken som skiller dem.
          C24 har strengere krav til kvistmengde, fiberretning og fuktinnhold. Det betyr at du kan
          bruke mindre dimensjoner eller lengre spenn med C24 enn med C18 – noe som kan spare
          materialer og vekt hvis du dimensjonerer nøye.
        </P>
        <DataTable>
          <caption>C18 vs. C24 – nøkkelforskjeller</caption>
          <thead>
            <tr>
              <th>Egenskap</th>
              <th>C18</th>
              <th>C24</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Bøyestyrke (fm,k)</td>
              <td>18 N/mm²</td>
              <td>24 N/mm²</td>
            </tr>
            <tr>
              <td>E-modul (E0,mean)</td>
              <td>9 000 N/mm²</td>
              <td>11 000 N/mm²</td>
            </tr>
            <tr>
              <td>Kvistbegrensning</td>
              <td>Noe tillatt</td>
              <td>Strengere krav</td>
            </tr>
            <tr>
              <td>Pris</td>
              <td>Litt lavere</td>
              <td>Standard – bred tilgjengelighet</td>
            </tr>
            <tr>
              <td>Typisk bruk</td>
              <td>Enkle konstruksjoner, terrasse</td>
              <td>Takkonstruksjon, gulvbjelker, dragere</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          I praksis er prisforskjellen liten – de fleste byggevarehus selger mest C24 fordi
          etterspørselen er størst. Kjøper du usortert trelast uten stempel, vet du ikke hva du
          får, og det bør du unngå til bærende konstruksjoner.
        </P>
      </>
    ),
  },
  {
    id: 'dimensjoner',
    heading: 'Vanlige dimensjoner for konstruksjonsvirke',
    content: (
      <>
        <P>
          Konstruksjonsvirke selges i standardiserte dimensjoner. Husk at oppgitt dimensjon er
          nominell – faktisk høvlet dimensjon er gjerne 2–4 mm mindre per side. En «48 × 148»-bjelke
          er i realiteten rundt 45 × 145 mm ferdig høvlet.
        </P>
        <DataTable>
          <caption>Vanlige konstruksjonsvirke-dimensjoner</caption>
          <thead>
            <tr>
              <th>Dimensjon (mm)</th>
              <th>Typisk bruk</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>48 × 48</td>
              <td>Lekter, spikerslag, sekundærkonstruksjon</td>
            </tr>
            <tr>
              <td>48 × 73</td>
              <td>Lett innvendig stenderverk</td>
            </tr>
            <tr>
              <td>48 × 98</td>
              <td>Vegger, lettere bærende bjelker</td>
            </tr>
            <tr>
              <td>48 × 148</td>
              <td>Gulvbjelker, terrasse-bjelker, takstolbind</td>
            </tr>
            <tr>
              <td>48 × 198</td>
              <td>Lange spenn, tunge gulv, takkonstruksjoner</td>
            </tr>
            <tr>
              <td>48 × 248</td>
              <td>Store spenn, kjellerbjelkelag, LVL-alternativ</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'nar-kreves-c24',
    heading: 'Når er C24 faktisk påkrevd?',
    content: (
      <>
        <P>
          I tiltak som krever byggetillatelse, og der Eurokode 5 (treverksdimensjonering) er lagt
          til grunn, forutsettes styrkeklasse i beregningene. For bærende konstruksjoner i hus –
          takkonstruksjon, etasjeskille, bærende vegger – er C24 normalt minimumet du skal bruke.
        </P>
        <P>
          For enkle terrasseprosjekter og uthus under 50 m² der søknadsplikten ikke utløses, er
          det ingen formell kontroll av hvilken klasse du bruker. Det betyr ikke at det er
          likegyldig – en underdirnensjonert terrasse kan kollapse. Bruk C24 til bjelkelag og
          alle bærende elementer som standard.
        </P>
        <Callout variant="warn" title="Ikke bruk usortert virke til bærende konstruksjoner">
          Trelast uten styrkemerking (ofte kalt «gartnertrelast» eller sagbruksvare uten stempel)
          kan ha styrke tilsvarende alt fra C14 til C24. Til en blomsterkasse er det greit. Til
          bjelker over et dekke er det ikke akseptabelt.
        </Callout>
        <Ul>
          <li>Alltid C24 (eller sterkere): takkonstruksjon, gulvbjelker, dragere, bærende vegger</li>
          <li>C18 eller C24: terrassebjelker, stolper i lett konstruksjon</li>
          <li>Ingen krav til klasse: terrassebord, kledning, lekter, ikke-bærende innredning</li>
        </Ul>
      </>
    ),
  },
]

export default function KonstruksjonsvirkeC24Page() {
  return (
    <GuideArticleLayout
      slug="konstruksjonsvirke-c24"
      readingTime="5 min"
      lead="C24 er styrkemerket konstruksjonsvirke – her er hva tallene betyr, forskjellen på C18 og C24, og når du faktisk er nødt til å bruke riktig klasse."
      sections={sections}
    />
  )
}
