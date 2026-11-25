/**
 * Oversetter Firebase-feilkoder til noe en kunde kan gjøre noe med.
 *
 * Firebase svarer med engelske tekniske meldinger («Firebase: Error
 * (auth/invalid-credential).»). Vises de rått, får kunden en melding hun
 * verken forstår eller kan handle på.
 *
 * MERK at `auth/invalid-credential` dekker BÅDE ukjent e-post og feil passord.
 * Det er med vilje fra Firebase: skilte vi dem, kunne hvem som helst prøve seg
 * fram og kartlegge hvilke adresser som har konto hos oss. Derfor er teksten
 * her også bevisst upresis.
 */
export function authFeilmelding(feil: unknown): string {
  const kode =
    typeof feil === 'object' && feil !== null && 'code' in feil ? String((feil as { code: unknown }).code) : ''

  switch (kode) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Feil e-post eller passord.'
    case 'auth/invalid-email':
      return 'E-postadressen ser ikke riktig ut.'
    case 'auth/email-already-in-use':
      return 'Det finnes allerede en konto med denne e-posten. Prøv å logge inn i stedet.'
    case 'auth/weak-password':
      return 'Passordet må være minst 6 tegn.'
    case 'auth/missing-password':
      return 'Du må fylle inn et passord.'
    case 'auth/too-many-requests':
      return 'For mange forsøk. Vent noen minutter, eller tilbakestill passordet.'
    case 'auth/network-request-failed':
      return 'Fikk ikke kontakt med nettet. Sjekk tilkoblingen og prøv igjen.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Innloggingsvinduet ble lukket før du ble logget inn.'
    case 'auth/popup-blocked':
      return 'Nettleseren blokkerte innloggingsvinduet. Tillat popup for minio.no, eller logg inn med e-post.'
    case 'auth/operation-not-allowed':
      // Denne betyr nesten alltid at e-post/passord ikke er skrudd på i
      // Firebase-konsollen under Authentication → Sign-in method.
      return 'Innlogging med e-post er ikke aktivert. Ta kontakt, så ordner vi det.'
    case 'auth/requires-recent-login':
      return 'Av sikkerhetsgrunner må du logge inn på nytt før du gjør dette.'
    default:
      return 'Noe gikk galt under innloggingen. Prøv igjen.'
  }
}
