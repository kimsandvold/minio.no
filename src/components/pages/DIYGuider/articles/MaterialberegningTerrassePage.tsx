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
          Materialberegning for terrasse handler om å finne antall terrassebord, bjelker,
          fundamenter og festemidler – før du drar i butikken. Grunnformelen er enkel: areal
          delt på (bordbredde + spalte) gir deg antall bord, og bjelkeantallet styres av c/c-avstand.
          Legg alltid til 10 % svinn for kapp og feilskjæring.
        </P>
        <Callout variant="tip" title="Spar tid med planleggeren">
          <a href="/planleggere/terrasse">Terrasseplanleggeren</a> gjør alle utregningene
          automatisk. Bruk artikkelen her for å forstå hva som skjer bak tallene.
        </Callout>
      </>
    ),
  },
  {
    id: 'terrassebord',
    heading: 'Beregn antall terrassebord',
    content: (
      <>
        <P>
          Terrassebord legges vanligvis med en spalte på 5–8 mm mellom hvert bord for drenering
          og bevegelse. Effektiv bredde per bord er altså bordbredden pluss spalten.
        </P>
        <H3>Formel</H3>
        <P>
          Antall bord = terrassebredde ÷ (bordbredde + spalte)
        </P>
        <P>
          Lengden på hvert bord velger du etter retningen bordene legges. Legg bordene
          på tvers av terrassen for enklest kapp og minst svinn. Husk at du bestiller
          meter, ikke antall – gang antall bord med bordlengde for å få løpende meter.
        </P>
        <Ul>
          <li>90 mm bord + 6 mm spalte = 96 mm per bord</li>
          <li>120 mm bord + 6 mm spalte = 126 mm per bord</li>
          <li>145 mm bord + 6 mm spalte = 151 mm per bord</li>
        </Ul>
        <Callout variant="tip" title="Legg til svinn">
          Bestill 10–15 % ekstra for kapp, skjeve bord og skader under transport.
          For impregnert furu eller terrassefuru er 10 % vanligvis nok; for eksotisk
          treverk kan du nøye deg med 8 % siden prisene er høyere.
        </Callout>
      </>
    ),
  },
  {
    id: 'bjelker',
    heading: 'Bjelker og c/c-avstand',
    content: (
      <>
        <P>
          Bjelkene bærer bordene og plasseres på tvers av bordretningen. C/c-avstand
          (senter til senter) avhenger av bordtykkelse og treslag:
        </P>
        <Ul>
          <li>28 mm bord: maks 45–60 cm c/c</li>
          <li>34 mm bord: maks 60 cm c/c</li>
          <li>45 mm bord: maks 90 cm c/c</li>
        </Ul>
        <P>
          Antall bjelker = (terrasselengde ÷ c/c-avstand) + 1 (husk alltid en ekstra
          for endebjelken). Legg til ytterbjelker og eventuelle dobbeltbjelker rundt åpninger.
        </P>
        <P>
          Se mer om dimensjoner og spennvidder i{' '}
          <a href="/byggeguider/spennvidder-bjelker">guiden om spennvidder for bjelker</a> og{' '}
          <a href="/byggeguider/trelast-dimensjoner">trelastdimensjoner</a>.
        </P>
      </>
    ),
  },
  {
    id: 'fundamenter',
    heading: 'Antall fundamentpunkter',
    content: (
      <>
        <P>
          Fundamentene bærer bjelkene og må plasseres slik at ingen bjelke henger fritt
          over for lang spenn. Tommelfingerregelen er at bjelker med 48×98 mm tverrsnitt
          kan spenne 1,8–2,4 m mellom støttepunkter. Bruk lavere tall for tyngre last
          (tett møblering, snø).
        </P>
        <P>
          Antall fundamentrekker = antall bjelker (eller annenhver, avhengig av bjelkespenn).
          Innen hver rekke plasseres fundamenter med maks 1,8–2,4 m avstand langs bjelken.
        </P>
        <Callout variant="warn" title="Frostfri dybde">
          I Norge må fundamenter ned til frostfri dybde – typisk 80–120 cm avhengig av
          sted. Bruk rørstolper av betong eller justerbare stolpesko. Et for grunt fundament
          vil heve seg og vri hele konstruksjonen.
        </Callout>
      </>
    ),
  },
  {
    id: 'eksempel',
    heading: 'Regneeksempel: 4 × 5 m terrasse',
    content: (
      <>
        <P>
          Vi bygger en terrasse på 4 × 5 m = 20 m². Bordene er 28 × 120 mm impregnert furu,
          lagt på tvers (4 m lengde). Bjelker i lengderetning med 60 cm c/c.
        </P>
        <H3>Steg 1 – Terrassebord</H3>
        <Ol>
          <li>Effektiv bordbredde: 120 mm + 6 mm spalte = 126 mm = 0,126 m</li>
          <li>Antall bord: 5 m ÷ 0,126 m ≈ 40 bord</li>
          <li>Med 10 % svinn: 40 × 1,1 = 44 bord</li>
          <li>Lengde per bord: 4 m → 44 × 4 m = 176 lm terrassebord</li>
        </Ol>
        <H3>Steg 2 – Bjelker</H3>
        <Ol>
          <li>Bjelker langs 5 m-siden, 60 cm c/c: (5 ÷ 0,6) + 1 ≈ 10 bjelker</li>
          <li>Bjelkelengde: 4 m → 10 × 4 m = 40 lm bjelker (48 × 148 mm)</li>
        </Ol>
        <H3>Steg 3 – Fundamenter</H3>
        <Ol>
          <li>Bjelkespenn maks 1,8 m → fundamenter langs 4 m: (4 ÷ 1,8) + 1 ≈ 4 punkter per rekke</li>
          <li>10 bjelkerekker × 4 punkter = 40 fundamentpunkter</li>
          <li>I praksis kan annenhver bjelke ha egne fundamenter; sjekk konstruksjonen nøye</li>
        </Ol>
        <H3>Steg 4 – Skruer</H3>
        <P>
          To skruer per bord per bjelke: 40 bord × 10 bjelker × 2 = 800 skruer + 10 % = 880 stk.
          Se <a href="/byggeguider/hvor-mange-skruer">Hvor mange skruer trenger jeg?</a> for full
          beregningsguide.
        </P>
      </>
    ),
  },
  {
    id: 'materialliste',
    heading: 'Oppsummering – materialliste',
    content: (
      <>
        <DataTable>
          <caption>Materialliste for 4 × 5 m terrasse (20 m²)</caption>
          <thead>
            <tr>
              <th>Materiale</th>
              <th>Mengde</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Terrassebord 28 × 120 mm</td>
              <td>ca. 176 lm</td>
              <td>inkl. 10 % svinn</td>
            </tr>
            <tr>
              <td>Bjelker 48 × 148 mm</td>
              <td>ca. 40 lm</td>
              <td>c/c 60 cm, 10 stk. à 4 m</td>
            </tr>
            <tr>
              <td>Fundamenter / stolpesko</td>
              <td>ca. 40 stk.</td>
              <td>frostfri dybde, justerbar type</td>
            </tr>
            <tr>
              <td>Terrasseskruer 4,5 × 60 mm</td>
              <td>ca. 900 stk.</td>
              <td>inkl. 10 % buffer</td>
            </tr>
            <tr>
              <td>Bjelkesko / vinkelbeslag</td>
              <td>etter konstruksjon</td>
              <td>se konstruksjonstegning</td>
            </tr>
          </tbody>
        </DataTable>
        <P>
          Vil du ha en ferdig beregnet materialliste på sekunder? Bruk{' '}
          <a href="/planleggere/terrasse">terrasseplanleggeren</a> – legg inn mål og
          bjelkeavstand, og last ned listen. Se også{' '}
          <a href="/byggeguider/planlegging">planleggingsguiden</a> for tips om
          prosjektforberedelse.
        </P>
      </>
    ),
  },
]

export default function MaterialberegningTerrassePage() {
  return (
    <GuideArticleLayout
      slug="materialberegning-terrasse"
      readingTime="6 min"
      lead="Slik beregner du antall terrassebord, bjelker, fundamenter og skruer for terrassen din – med et gjennomarbeidet regneeksempel for en 4 × 5 m terrasse."
      sections={sections}
    />
  )
}
