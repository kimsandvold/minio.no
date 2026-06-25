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
          Å beregne riktig antall skruer og beslag hindrer at du løper til butikken midt i
          jobben. Grunnregelen er to skruer per bord per bjelke – og ca. 14–16 skruer per
          kvadratmeter terrasse med bjelker på 60 cm senter. Legg alltid til 10 % ekstra for
          feilskjæring og støvet ned i sprekkene.
        </P>
        <Callout variant="tip" title="Rund opp">
          Kjøp én pakning ekstra. Skruer som blir til overs koster lite; et nytt butikkbesøk
          koster time og humør.
        </Callout>
      </>
    ),
  },
  {
    id: 'grunnregler',
    heading: 'Grunnregler for skruer',
    content: (
      <>
        <P>
          To skruer per bord per bjelke er standard. Det gir god holde styrke og hindrer at
          bordene vrir seg. For bord bredere enn 150 mm kan du vurdere én ekstra skrue midt på
          om bordene har tendens til å kupe seg.
        </P>
        <Ul>
          <li>Bjelker på 60 cm senter: ca. 16 skruer per m²</li>
          <li>Bjelker på 45 cm senter: ca. 22 skruer per m²</li>
          <li>Bjelker på 90 cm senter: ca. 11 skruer per m²</li>
        </Ul>
        <P>
          Legg til ca. 10 % buffer for bortskjæringer, skruer som glir av og de som du mister
          bak bjelken.
        </P>
        <DataTable>
          <caption>Estimat skruer per m²</caption>
          <thead>
            <tr>
              <th>Bjelkeavstand</th>
              <th>Skruer per m²</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>45 cm</td>
              <td>ca. 22 stk.</td>
            </tr>
            <tr>
              <td>60 cm</td>
              <td>ca. 16 stk.</td>
            </tr>
            <tr>
              <td>90 cm</td>
              <td>ca. 11 stk.</td>
            </tr>
          </tbody>
        </DataTable>
      </>
    ),
  },
  {
    id: 'eksempel',
    heading: 'Eksempel: 20 m² terrasse',
    content: (
      <>
        <P>
          La oss si du bygger en 4 × 5 m terrasse (20 m²) med bjelker på 60 cm senter og
          90 mm brede bord.
        </P>
        <Ul>
          <li>Bjelker i lengderetning: 5 m ÷ 0,6 m = ca. 9 bjelker</li>
          <li>Bord på tvers: 4 m ÷ 0,09 m (bord + 5 mm spalte) ≈ 42 bord</li>
          <li>Skruer totalt: 42 bord × 9 bjelker × 2 skruer = 756 skruer</li>
          <li>Med 10 % buffer: 756 × 1,1 ≈ 832 skruer</li>
        </Ul>
        <P>
          Kjøp to pakker à 500 stk. (1000 stk. totalt). Det gir god margin og lar deg bruke
          resten til beams og endekapping.
        </P>
        <Callout variant="tip" title="Bruk terrasseplanleggeren">
          <a href="/planleggere/terrasse">Terrasseplanleggeren</a> regner ut bjelkefordeling,
          antall bord og materialestimater automatisk. Bruk den som grunnlag og legg til
          skruer etter tabellen over.
        </Callout>
      </>
    ),
  },
  {
    id: 'beslag',
    heading: 'Beslag: kamspiker og beslagskruer',
    content: (
      <>
        <P>
          Beslag krever egne festemidler – ikke vanlige treskruer. Her er tommelfingerreglene:
        </P>
        <Ul>
          <li>
            <strong>Bjelkesko</strong> – typisk 8–12 kamspiker per sko (4–6 per side). For en
            20 m² terrasse med 9 lengdebjelker og 2 ytterbjelker: ca. 11 skopar × 10 spiker =
            110 kamspiker minimum.
          </li>
          <li>
            <strong>Vinkelbeslag</strong> – 4–8 beslagskruer per beslag, avhengig av størrelse.
            Tell opp beslag i konstruksjonen din og ganger med 6 som snitt.
          </li>
          <li>
            <strong>Stolpesko</strong> – 8–16 kamspiker per sko pluss én ekspansjonsbolt per sko.
          </li>
        </Ul>
        <P>
          Les mer om riktig valg av beslag og festemidler i{' '}
          <a href="/byggeguider/beslag-oversikt">beslag-oversikten</a>.
        </P>
      </>
    ),
  },
  {
    id: 'innkjopsrad',
    heading: 'Praktiske innkjøpsråd',
    content: (
      <>
        <P>
          Skruer selges i pakker på 100, 200 eller 500 stk. For en gjennomsnittsterrasse er en
          pakke på 500 stk. det beste kjøpet per enhet. Kjøper du to pakker slipper du å stresse
          om antallet.
        </P>
        <Ul>
          <li>Kjøp alt av skruer i samme dimensjon og materiale – du vil ikke ha to typer å
            holde styr på.</li>
          <li>For beslag: tell opp alle beslag i konstruksjonstegningen din, summer spiker,
            og kjøp en boks à 1 kg (ca. 200–300 kamspiker).</li>
          <li>Husk bor-bit i riktig Torx-størrelse (T20 eller T25 til de fleste terrasseskruer)
            – biten slites og bør byttes etter 300–400 skruer.</li>
        </Ul>
        <P>
          Vil du vite mer om valg av riktig skruetype og materiale? Se{' '}
          <a href="/byggeguider/riktig-skrue">Riktig skrue til riktig jobb</a> og{' '}
          <a href="/byggeguider/syrefast-vs-galvanisert">Syrefast (A4) vs. galvanisert</a>.
        </P>
      </>
    ),
  },
]

export default function HvorMangeSkruerPage() {
  return (
    <GuideArticleLayout
      slug="hvor-mange-skruer"
      readingTime="4 min"
      lead="To skruer per bord per bjelke og 10 % buffer – slik beregner du riktig antall skruer og beslag til terrassen, og slipper å løpe til butikken midt i jobben."
      sections={sections}
    />
  )
}
