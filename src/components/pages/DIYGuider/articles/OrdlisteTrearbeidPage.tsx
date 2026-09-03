import GuideArticleLayout, {
  Callout,
  DataTable,
  P,
  type ArticleSection,
} from '../GuideArticleLayout'

const sections: ArticleSection[] = [
  {
    id: 'kort-fortalt',
    heading: 'Kort fortalt',
    content: (
      <>
        <P>
          Når du leser bygguider, tegninger eller pakksedler fra trelasthandelen, møter du
          ord som c/c-avstand, forsenking og kjerneved. Her er en ordliste med de 30
          vanligste begrepene i trearbeid og utendørsbygging – forklart på norsk og uten
          fagsjargong.
        </P>
      </>
    ),
  },
  {
    id: 'ordliste',
    heading: 'Ordliste A–Ø',
    content: (
      <>
        <DataTable>
          <caption>Begreper i trearbeid og bygging</caption>
          <thead>
            <tr>
              <th>Begrep</th>
              <th>Forklaring</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Anlegg</td>
              <td>Flaten der to elementer hviler mot hverandre, f.eks. bjelke mot stolpesko.</td>
            </tr>
            <tr>
              <td>Bjelkelag</td>
              <td>Systemet av parallelle bjelker som bærer gulv eller terrassebord.</td>
            </tr>
            <tr>
              <td>BYA</td>
              <td>Bebygd areal – fotavtrykket til bygget inkl. veggtykkelse, brukt i byggesøknader.</td>
            </tr>
            <tr>
              <td>c/c-avstand</td>
              <td>
                Senter-til-senter-avstand – avstand målt mellom midtpunktene av to
                elementer (f.eks. bjelker). Se{' '}
                <a href="/byggeguider/spennvidder-bjelker">spennviddeguiden</a> for
                typiske verdier.
              </td>
            </tr>
            <tr>
              <td>Dimensjon</td>
              <td>
                Tverrsnittsmål for trelast, oppgitt som bredde × høyde i mm, f.eks. 48 × 148.
                Se <a href="/byggeguider/trelast-dimensjoner">trelastdimensjoner</a>.
              </td>
            </tr>
            <tr>
              <td>Fall</td>
              <td>Bevisst helning i konstruksjonen for å lede regnvann bort – typisk 1–2 cm per meter.</td>
            </tr>
            <tr>
              <td>Forboring</td>
              <td>
                Å bore et hull i forveien for å hindre at treet sprekker når skruen strammes.
                Spesielt viktig nær ender og i hardtre.
              </td>
            </tr>
            <tr>
              <td>Forsenking</td>
              <td>
                Å senke skruehodet ned i materialet med et konisk bor, slik at overflaten
                blir jevn. Kalles også «forsinking» eller «fasing».
              </td>
            </tr>
            <tr>
              <td>Frostfri dybde</td>
              <td>
                Dybden man må gå ned til i grunnen for å komme under telelinja.
                I Norge typisk 80–120 cm avhengig av klimasone.
              </td>
            </tr>
            <tr>
              <td>Gering</td>
              <td>
                Et gjæringsskjær – et kutt i en vinkel annen enn 90° sett ovenfra, f.eks.
                45° i hjørnet på et rekkverk. Kalles også «gjæring».
              </td>
            </tr>
            <tr>
              <td>Gesimshøyde</td>
              <td>Høyde fra ferdig terreng til underkant takutstikk / takkant (gesims).</td>
            </tr>
            <tr>
              <td>Gjæring</td>
              <td>
                Skjær i 45° (eller annen vinkel) på to tilstøtende bord slik at de møtes
                i en sømløs hjørnefuge.
              </td>
            </tr>
            <tr>
              <td>Høvlet / justert</td>
              <td>
                Høvlet tre har jevne, plane flater og er kuttet til nøyaktig dimensjon.
                Uhøvlet («saget») tre er mer råfibrete og kan ha litt større variasjon i mål.
              </td>
            </tr>
            <tr>
              <td>Impregnert</td>
              <td>
                Tre som er trykkimpregnert med biocidet for å motstå råte, sopp og insekter.
                Grønnfargen bleikner men beskyttelsen sitter i.
              </td>
            </tr>
            <tr>
              <td>Inntrinn</td>
              <td>Den horisontale flaten du trår på i en trapp (selve trinnet).</td>
            </tr>
            <tr>
              <td>Kamspiker</td>
              <td>
                Spiker med riflet skaft for ekstra holdeevne. Standard festemiddel i
                metallbeslag (bjelkesko, vinkelbeslag).
              </td>
            </tr>
            <tr>
              <td>Kapping</td>
              <td>Å sage materialet til riktig lengde eller vinkel.</td>
            </tr>
            <tr>
              <td>Kjerneved</td>
              <td>
                Den mørke, tette kjernen i treet – mer naturlig råtebestandig enn yteved.
                Ettertraktet i utendørs konstruksjoner.
              </td>
            </tr>
            <tr>
              <td>Kløyv</td>
              <td>
                Et kutt langs trefibrenes lengderetning, som deler et bord på langs.
                Gjøres med sirkelsag med rettskinneguide.
              </td>
            </tr>
            <tr>
              <td>Lekt</td>
              <td>
                Smalt, tynt stykke trelast (typisk 23 × 48 mm eller 36 × 48 mm), brukt til
                kleding, undertak og luftespalter.
              </td>
            </tr>
            <tr>
              <td>Lodd</td>
              <td>
                Verktøy (snor med lodd) for å kontrollere at noe er loddrett (vertikalt).
                Brukes til stolper og kanter.
              </td>
            </tr>
            <tr>
              <td>Mønehøyde</td>
              <td>Høyeste punkt på taket – målt fra ferdig gulv (1. etasje) eller ferdig terreng.</td>
            </tr>
            <tr>
              <td>Opptrinn</td>
              <td>Den vertikale flaten mellom to inntrinn i en trapp (fronten på trinnet).</td>
            </tr>
            <tr>
              <td>Sløyfe</td>
              <td>
                Tynt bord (typisk 19–23 mm tykt) lagt oppå bjelkene som underlag for
                terrassebord eller kledning – gir luftspalte og flat overflate.
              </td>
            </tr>
            <tr>
              <td>Spalte</td>
              <td>
                Mellomrommet mellom terrassebord, typisk 5–8 mm, for drenering og
                trevirkets bevegelse ved fuktendring.
              </td>
            </tr>
            <tr>
              <td>Uhøvlet</td>
              <td>Saget, men ikke høvlet trelast – grovere overflate og noe større dimensjonsvariasjon.</td>
            </tr>
            <tr>
              <td>Vange</td>
              <td>Sidebjelkene i en trapp som bærer trinnene. Kan være åpen (trinnene synlige) eller lukket.</td>
            </tr>
            <tr>
              <td>Vater</td>
              <td>
                Verktøy for å sjekke om noe er vannrett (horisontalt) eller loddrett.
                Brukes til bjelker, bord og stolper.
              </td>
            </tr>
            <tr>
              <td>Yteved</td>
              <td>
                Den lyse, ytre delen av trestammen – mindre tett og mer utsatt for råte
                enn kjerneved.
              </td>
            </tr>
          </tbody>
        </DataTable>
        <Callout variant="tip" title="Finn mer">
          Mange av begrepene er forklart i praksis i{' '}
          <a href="/byggeguider/lese-byggetegning">Slik leser du en byggetegning</a> og{' '}
          <a href="/byggeguider/bygge-terrasse">Slik bygger du terrasse</a>.
          Se også <a href="/byggeguider/trelast-dimensjoner">trelastdimensjoner</a> for
          dimensjonsforklaringer.
        </Callout>
      </>
    ),
  },
]

export default function OrdlisteTrearbeidPage() {
  return (
    <GuideArticleLayout
      slug="ordliste-trearbeid"
      readingTime="4 min"
      lead="Ordliste med 30 vanlige begreper innen trearbeid – fra bjelkelag og c/c-avstand til kjerneved, forsenking og frostfri dybde, forklart på enkel norsk."
      sections={sections}
    />
  )
}
