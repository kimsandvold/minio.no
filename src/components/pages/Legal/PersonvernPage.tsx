import { useSEO } from '../../../hooks/useSEO'
import { company } from '../../../data/company'
import ObfuscatedEmail from '../../shared/ObfuscatedEmail'
import LegalLayout from './LegalLayout'

export default function PersonvernPage() {
  useSEO({
    title: 'Personvernerklæring – Minio',
    description:
      'Slik behandler Minio personopplysninger: hva vi samler inn, hvorfor, hvem vi deler med (Vipps, Google, Firebase, Brevo) og hvilke rettigheter du har etter GDPR.',
  })

  return (
    <LegalLayout
      title="Personvernerklæring"
      intro="Slik behandler Minio personopplysningene dine."
      updated="13. juli 2026"
    >
      <h2>1. Behandlingsansvarlig</h2>
      <p>
        {company.legalName} ({company.orgForm}), org.nr {company.orgNr}, er behandlingsansvarlig for
        personopplysningene som samles inn gjennom nettsiden {company.site}. Har du spørsmål om
        hvordan vi behandler personopplysninger, kan du kontakte oss på{' '}
        <ObfuscatedEmail user={company.emailUser} domain={company.emailDomain} />.
      </p>

      <h2>2. Hvilke opplysninger vi samler inn</h2>
      <ul>
        <li>
          <strong>Design og bestillinger:</strong> prosjektene du lager i designverktøyet, og
          opplysninger knyttet til kjøp av byggeplaner og underlag.
        </li>
        <li>
          <strong>Kontaktopplysninger:</strong> navn, e-post og innhold du selv oppgir når du bruker
          kontaktskjemaet eller sender oss e-post.
        </li>
        <li>
          <strong>Nyhetsbrev:</strong> e-postadressen din dersom du melder deg på nyhetsbrevet.
        </li>
        <li>
          <strong>Bruksdata:</strong> teknisk informasjon om besøket (f.eks. sidevisninger, nettleser
          og enhet) via analyseverktøy og informasjonskapsler.
        </li>
      </ul>

      <h2>3. Formål og behandlingsgrunnlag</h2>
      <p>Vi behandler personopplysninger for å:</p>
      <ul>
        <li>
          levere og fakturere de digitale ytelsene du kjøper (behandlingsgrunnlag: oppfyllelse av
          avtale),
        </li>
        <li>svare på henvendelser gjennom kontaktskjema og e-post (berettiget interesse),</li>
        <li>sende nyhetsbrev når du har samtykket (samtykke),</li>
        <li>forbedre nettsiden gjennom anonymisert/aggregert statistikk (berettiget interesse/samtykke),</li>
        <li>oppfylle rettslige forpliktelser, som regnskaps- og bokføringsplikt.</li>
      </ul>

      <h2>4. Databehandlere og deling</h2>
      <p>
        Vi selger aldri personopplysningene dine. For å drifte tjenesten benytter vi utvalgte
        leverandører som behandler opplysninger på våre vegne:
      </p>
      <table>
        <thead>
          <tr>
            <th>Leverandør</th>
            <th>Formål</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vipps MobilePay AS</td>
            <td>Betalingsløsning</td>
          </tr>
          <tr>
            <td>Google (Firebase)</td>
            <td>Lagring av design/bestillinger og drift av nettsiden</td>
          </tr>
          <tr>
            <td>Google Analytics</td>
            <td>Anonymisert besøksstatistikk</td>
          </tr>
          <tr>
            <td>Brevo (Sendinblue)</td>
            <td>Utsendelse av nyhetsbrev</td>
          </tr>
        </tbody>
      </table>
      <p>
        Opplysninger kan for øvrig bli utlevert til offentlige myndigheter når vi er rettslig
        forpliktet til det.
      </p>

      <h2>5. Informasjonskapsler (cookies)</h2>
      <p>
        Nettsiden bruker informasjonskapsler for at tjenesten skal fungere og for å måle bruk. Du kan
        selv styre og slette informasjonskapsler i nettleseren din. Merk at enkelte funksjoner kan
        slutte å fungere dersom du blokkerer nødvendige informasjonskapsler.
      </p>

      <h2>6. Lagringstid</h2>
      <p>
        Vi lagrer personopplysninger så lenge det er nødvendig for formålet de ble samlet inn for.
        Opplysninger knyttet til kjøp lagres så lenge bokføringsloven krever. Nyhetsbrevpåmelding
        lagres til du melder deg av.
      </p>

      <h2>7. Dine rettigheter</h2>
      <p>
        Du har rett til innsyn i, retting av og sletting av personopplysningene vi har om deg, samt
        rett til å begrense eller protestere mot behandlingen og til dataportabilitet. Du kan når som
        helst trekke tilbake et samtykke. For å bruke rettighetene dine, kontakt oss på{' '}
        <ObfuscatedEmail user={company.emailUser} domain={company.emailDomain} />.
      </p>
      <p>
        Mener du at vi behandler personopplysninger i strid med regelverket, kan du klage til{' '}
        <a href="https://www.datatilsynet.no" target="_blank" rel="noopener noreferrer">
          Datatilsynet
        </a>
        .
      </p>
    </LegalLayout>
  )
}
