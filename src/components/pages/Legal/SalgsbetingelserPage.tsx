import { Link } from 'react-router-dom'
import { useSEO } from '../../../hooks/useSEO'
import { company } from '../../../data/company'
import LegalLayout from './LegalLayout'

export default function SalgsbetingelserPage() {
  useSEO({
    title: 'Salgsbetingelser – Minio',
    description:
      'Salgsbetingelser for kjøp av digitale byggeplaner og byggesøknadsunderlag fra Minio. Basert på Forbrukertilsynets standard salgsbetingelser for forbrukerkjøp over Internett.',
  })

  return (
    <LegalLayout
      title="Salgsbetingelser"
      intro="Vilkår for kjøp av digitale byggeplaner og byggesøknadsunderlag hos Minio."
      updated="13. juli 2026"
    >
      <h2>Innledning</h2>
      <p>
        Dette kjøpet er regulert av de nedenstående salgsbetingelsene for forbrukerkjøp av varer og
        digitale ytelser over Internett. Forbrukerkjøp over Internett reguleres hovedsakelig av
        avtaleloven, forbrukerkjøpsloven, markedsføringsloven, angrerettloven og ehandelsloven, og
        disse lovene gir forbrukeren ufravikelige rettigheter. Betingelsene er utarbeidet med
        utgangspunkt i Forbrukertilsynets standard salgsbetingelser og legger ikke begrensninger på
        de lovbestemte rettighetene, men opplyser om partenes viktigste rettigheter og plikter for
        handelen.
      </p>
      <p>
        Salgsbetingelsene og øvrig informasjon på nettsiden er tilgjengelig på norsk. Avtalen mellom
        kjøper og selger består av opplysningene selgeren gir om kjøpet i bestillingsløsningen på
        nettsiden (blant annet om ytelsens art og pris), eventuell direkte korrespondanse mellom
        partene (for eksempel e-post), samt disse salgsbetingelsene. Ved motstrid mellom
        opplysningene selgeren har gitt om kjøpet i bestillingsløsningen og det som fremgår av disse
        salgsbetingelsene, går opplysningene gitt i bestillingsløsningen foran, så fremt det ikke
        strider mot ufravikelig lovgivning.
      </p>

      <h2>1. Hva vi selger</h2>
      <p>
        Minio selger <strong>digitale ytelser</strong> knyttet til det gratis 3D-designverktøyet på
        nettsiden. Etter at du har tegnet prosjektet ditt, kan du kjøpe:
      </p>
      <ul>
        <li>
          <strong>Byggeplan</strong> – komplett byggeplan med materialliste, kappliste og målsatt
          arbeidstegning (PDF), tilpasset designet du har laget.
        </li>
        <li>
          <strong>Byggesøknadsunderlag</strong> – dokumentasjon til bruk ved søknad til kommunen.
        </li>
      </ul>
      <p>
        Ytelsene leveres digitalt (som nedlastbar fil / tilgang på nettsiden). Selve designverktøyet
        er gratis å bruke; det er kun byggeplanen og tilhørende underlag som er betalingsbelagt.
        Fysiske treprodukter på nettsiden selges <strong>ikke</strong> direkte i nettbutikk – disse
        prises individuelt etter forespørsel og omfattes ikke av disse salgsbetingelsene.
      </p>

      <h2>2. Partene</h2>
      <p>
        <strong>Selger</strong>
      </p>
      <address>
        {company.brand} ({company.orgForm})<br />
        {company.postal}, {company.country}
        <br />
        Organisasjonsnummer: {company.orgNr}
        <br />
        Kontakt: <Link to="/kontakt">kontaktskjemaet</Link>
        <br />
        Nettside: {company.site}
      </address>
      <p>
        Selgeren blir i det følgende benevnt «selger», «vi» eller «Minio».
      </p>
      <p>
        <strong>Kjøper</strong> er den forbrukeren som foretar bestillingen, og benevnes i det
        følgende «kjøper» eller «du».
      </p>

      <h2>3. Pris</h2>
      <p>
        Den oppgitte prisen for ytelsen er den totale prisen kjøperen skal betale. Prisen fremgår
        tydelig i designverktøyet og i bestillingsløsningen før du bekrefter kjøpet. Prisene er
        oppgitt i norske kroner (NOK).
      </p>
      <p>
        {company.brand} er et enkeltpersonforetak som <strong>ikke er registrert i
        Merverdiavgiftsregisteret</strong>. Prisene inneholder derfor ikke merverdiavgift (MVA), og
        det legges ikke MVA til den oppgitte prisen. Prisen inkluderer alle avgifter forbundet med
        kjøpet. Ettersom ytelsene leveres digitalt, tilkommer ingen frakt- eller leveringskostnader.
      </p>

      <h2>4. Avtaleinngåelse</h2>
      <p>
        Avtalen er bindende for begge parter når kjøperen har sendt sin bestilling til selgeren og
        betalingen er gjennomført. Avtalen er likevel ikke bindende hvis det har forekommet skrive-
        eller tastefeil i tilbudet fra selgeren i bestillingsløsningen eller i kjøperens bestilling,
        og den annen part innså eller burde ha innsett at det forelå en slik feil.
      </p>

      <h2>5. Betaling</h2>
      <p>
        Betaling skjer med <strong>Vipps</strong>. Du sendes til Vipps for å bekrefte og gjennomføre
        betalingen, og beløpet belastes ved bestilling. Selger oppbevarer ikke kort- eller
        betalingsopplysninger; dette håndteres i sin helhet av Vipps MobilePay AS.
      </p>
      <p>
        Ytelsen (byggeplan / underlag) gjøres tilgjengelig for kjøperen umiddelbart etter at
        betalingen er registrert som gjennomført.
      </p>

      <h2>6. Levering</h2>
      <p>
        Ytelsene er digitale og leveres elektronisk. Levering anses skjedd når byggeplanen eller
        underlaget er gjort tilgjengelig for kjøperen på nettsiden og/eller som nedlastbar fil,
        normalt umiddelbart etter fullført betaling. Får du av tekniske årsaker ikke tilgang til det
        du har kjøpt, ta kontakt via{' '}
        <Link to="/kontakt">kontaktskjemaet</Link>, så ordner vi det så raskt som mulig.
      </p>

      <h2>7. Angrerett</h2>
      <p>
        Med mindre avtalen er unntatt fra angrerett, kan kjøperen angre kjøpet i henhold til
        angrerettloven. Angrefristen er som utgangspunkt 14 dager fra avtalen ble inngått.
      </p>
      <p>
        <strong>Viktig unntak for digitalt innhold:</strong> Ytelsene fra Minio er digitalt innhold
        som leveres elektronisk og gjøres tilgjengelig umiddelbart etter kjøp. Ved kjøpet
        samtykker du uttrykkelig til at leveringen starter straks, og du erkjenner at{' '}
        <strong>angreretten dermed bortfaller</strong> når innholdet er gjort tilgjengelig, jf.
        angrerettloven § 22 første ledd bokstav n. Du blir opplyst om dette i bestillingsløsningen
        før du bekrefter kjøpet, og bekreftelsen på kjøpet fungerer som bekreftelse av samtykket.
      </p>
      <p>
        Angreretten er dessuten ikke i behold ved levering av varer som er tilvirket etter
        forbrukerens spesifikasjoner eller som har fått et tydelig personlig preg, jf.
        angrerettloven § 22 første ledd bokstav a. Dette vil kunne gjelde byggeplaner som er
        spesialtilpasset ditt individuelle design.
      </p>
      <p>
        For eventuelle ytelser hvor angrerett gjelder, kan du benytte{' '}
        <a
          href="https://www.forbrukertilsynet.no/skjema/angrerettskjema"
          target="_blank"
          rel="noopener noreferrer"
        >
          Forbrukertilsynets angrerettskjema
        </a>
        . Melding om bruk av angreretten sendes via{' '}
        <Link to="/kontakt">kontaktskjemaet</Link>.
      </p>

      <h2>8. Mangel ved ytelsen – kjøperens rettigheter og reklamasjonsfrist</h2>
      <p>
        Hvis det foreligger en mangel ved ytelsen, må kjøperen innen rimelig tid etter at mangelen
        ble oppdaget eller burde ha blitt oppdaget, gi selgeren melding om at kjøperen vil påberope
        seg mangelen (reklamasjon). Meldingen sendes via{' '}
        <Link to="/kontakt">kontaktskjemaet</Link>.
      </p>
      <p>
        Dersom ytelsen har en mangel og dette ikke skyldes kjøperen eller forhold på kjøperens side,
        kan kjøperen etter omstendighetene holde kjøpesummen tilbake, velge retting (at vi utbedrer
        eller leverer på nytt), kreve prisavslag, kreve avtalen hevet og/eller kreve erstatning fra
        selgeren, i samsvar med forbrukerkjøpslovens regler.
      </p>
      <p>
        Reklamasjon til selgeren bør skje skriftlig.
      </p>

      <h2>9. Forsinkelse og manglende levering</h2>
      <p>
        Dersom selgeren ikke leverer ytelsen, eller leverer den for sent i henhold til avtalen, og
        dette ikke skyldes kjøperen eller forhold på kjøperens side, kan kjøperen etter
        omstendighetene holde kjøpesummen tilbake, kreve oppfyllelse, heve avtalen og/eller kreve
        erstatning fra selgeren, i samsvar med forbrukerkjøpslovens regler.
      </p>

      <h2>10. Selgerens rettigheter ved kjøperens mislighold</h2>
      <p>
        Dersom kjøperen ikke betaler eller på annen måte unnlater å oppfylle sine forpliktelser
        etter avtalen eller loven, og dette ikke skyldes selgeren eller forhold på selgerens side,
        kan selgeren etter omstendighetene holde ytelsen tilbake, kreve oppfyllelse av avtalen, kreve
        avtalen hevet samt kreve erstatning fra kjøperen, i samsvar med forbrukerkjøpslovens regler.
      </p>

      <h2>11. Personopplysninger</h2>
      <p>
        Behandlingsansvarlig for innsamlede personopplysninger er selger. Med mindre kjøperen
        samtykker til noe annet, kan selgeren, i tråd med personopplysningsloven og GDPR, kun
        innhente og lagre de personopplysningene som er nødvendige for at selgeren skal kunne
        gjennomføre forpliktelsene etter avtalen. Kjøperens personopplysninger vil kun bli utlevert
        til andre hvis det er nødvendig for å gjennomføre avtalen med kjøperen, eller i lovbestemte
        tilfeller. Les mer om hvordan vi behandler personopplysninger i vår{' '}
        <a href="/personvern">personvernerklæring</a>.
      </p>

      <h2>12. Konfliktløsning</h2>
      <p>
        Klager rettes til selger innen rimelig tid, jf. punkt 8 og 9. Partene skal forsøke å løse
        eventuelle tvister i minnelighet. Dersom dette ikke lykkes, kan kjøperen ta kontakt med{' '}
        <a href="https://www.forbrukertilsynet.no" target="_blank" rel="noopener noreferrer">
          Forbrukertilsynet
        </a>{' '}
        for mekling. Forbrukertilsynet er tilgjengelig på telefon 23 400 600.
      </p>
    </LegalLayout>
  )
}
