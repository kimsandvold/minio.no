# Designer-motoren – hvordan produktene er bygd

Referanse for hvordan et parametrisk 3D-produkt (carport, bod, terrasse …) er
satt sammen i `src/designer`. Les denne før du legger til et nytt hus/produkt.

Alt drives av **én kontrakt**: `ProductTemplate` (`types.ts`). Skallet
(`components/pages/Designer/DesignerPage.tsx` + `DesignerViewport.tsx`) er helt
produktuavhengig – det kjenner bare kontrakten. Et produkt = én fil i
`templates/` som eksporterer et `ProductTemplate`, registrert i `registry.ts`.

> **⚠️ Norsk standard er et krav, ikke en preferanse.** Alt bærende trevirke
> (bjelkelag, stenderverk, sperrer, dragere, dør-/åpningskarmer) SKAL følge
> **SINTEF Byggforsk** byggdetaljblader og norsk **Eurocode** (NS-EN 1990–1995
> med nasjonale tillegg): C24-virke, c/c ≤ 600 mm, span-gradering etter snø-/
> egenlast, og **opplegg (bæringsstender) i hver side av enhver åpning** – ingen
> fritt spennende drager over flere fag. Dagens span-gradering i
> `konstruksjon.ts` er en forenklet tilnærming til dette (se memory
> `designer-eurocode-compliance`); nye produkter skal ikke gå UNDER dette nivået.

---

## 1. Konvensjoner (gjelder ALLE templater)

| Ting | Regel |
|------|-------|
| **Enheter i config** | cm (heltall). `bredde: 300` = 3 m. |
| **Enheter i 3D (three.js)** | meter. Konverter med `scale = 0.01` / `cm(v) = v/100`. |
| **Origo** | modellen er sentrert i x og z; y = 0 er bakken, bygget går oppover. |
| **Akser** | x = bredde, z = dybde/lengde, y = høyde. |
| **Virke** | norsk C24 skurlast: 48×98 («2×4»), 48×148, 48×198, 48×223 mm. |
| **Senteravstand** | `CC = 0.6` (600 mm) er standard c/c for bjelker/stendere/sperrer. |
| **Svinn** | materiallista legger på ~10 % (`SVINN = 1.1`). |

---

## 2. `ProductTemplate`-kontrakten (`types.ts`)

Et template fyller ut:

- **Metadata**: `id`, `navn`, `ikon` (FontAwesome), `beskrivelse`, `bilde`,
  `tilgjengelig`, `fraPris`, `leveranser` (`'ferdig' | 'materialpakke' | 'plan'`).
- **UI-kontroller** (skallet bygger sidepanelet av disse):
  - `dimensjoner: DimensionSpec[]` – slidere + dra-håndtak i 3D (`axis`, `min/max/step`, `markers`, `visibleWhen`).
  - `alternativer: OptionGroup[]` – enum-knapper (taktype, fallretning …). Et valg kan sette flere felt samtidig via `patch`.
  - `materialer: MaterialGroup[]` – treslag + farge (fra `materials.ts`).
  - `valg: ToggleSpec[]` – av/på (takpapp, åpning …).
  - `presets` – ferdige utgangspunkt.
- **Beregning** (rene funksjoner av config):
  - `beregn(c) → Bom` – materialliste + `estimatKr` + `arbeidstimer`.
  - `kappliste(c)` – unike deler m/ mål og antall.
  - `tegning2D(c)` / `soknadTegning(c)` – 2D-riss.
  - `montering(c)`, `raad(c)`, `byggeregler(c)`.
- **3D**: `buildMesh(c, opts) → THREE.Group` og `bounds(c)` (kamera/håndtak).
- `parts: PartSpec[]` – malbare lag (paint bucket + delevisning).

> Kontrakten er bevisst løst koblet – motoren skal senere kunne trekkes ut som
> eget domene. Ikke la et template gripe inn i skallet.

---

## 3. Part-tagging – KRITISK

Hver mesh får `userData`:

```js
m.userData.part = 'konstruksjon'   // hvilket LAG delen hører til
m.userData.pid  = 'stud-b-3'        // unik del-id (paint override + explode)
m.userData.info = { navn, profil, lengdeCm }  // hover/utplukk + kappliste-kobling
```

`userData.part` styrer **synlighet, paint bucket og delevisning**. Standard-lag:

| part | Betydning |
|------|-----------|
| `konstruksjon` | bærende virke (bjelkelag, stenderverk, sperrer) |
| `kledning` | utvendig bordkledning |
| `vegg` | carportens vegg-/akrylpaneler (eget lag, samme rolle som kledning) |
| `gulv` | terrassebord/dekke |
| `tak` | takplate, tekking, fascia/vindski |
| `fundament` | betongklosser/stolpesko |
| `bins`, `gjerde`, `beslag`, `kneband`, `spaer` … | produktspesifikke lag |

**Toppknappene «Kledning / Tak / Gulv»** (`DesignerPage.tsx`) skjuler faste
part-nøkler: `hideKledning → 'kledning,vegg'`, `hideTak → 'tak'`,
`hideGulv → 'gulv'`. Bruker du et NYTT skall-lag som skal kunne skjules av en av
disse knappene, må parten stå i den lista – ellers forblir delen synlig.
(Dette var carport-buggen: veggpaneler var tagget `'vegg'`, men knappen skjulte
bare `'kledning'`.)

`parts: PartSpec[]` i templatet gir egne, per-produkt lag i **Delevisning** og
paint bucket – uavhengig av toppknappene.

---

## 4. Delt konstruksjon (`konstruksjon.ts`)

Bibliotek av bærende trevirke som legges i BÅDE 3D og materiallista, så
produktene selges som reelle byggeplaner. Alle bygg-funksjoner tar en
`mat: (pid, darken?) => MeshStandardMaterial`-fabrikk (fra templatet, så
paint/treslag/farge følger med).

### Dimensjonering – gamle gradere (bakoverkompatible, @deprecated)
`gradBjelke`, `maksGulvSpenn`, `gradSperre`, `gradMonebjelke` finnes fortsatt,
men er nå tynne innpakninger rundt beregningskjernen (§ 4b) med faste
standardlaster (bod-gulv 3,0 kN/m² TK 3; tak sk 3,5, shingel). De returnerer
det STERKESTE av gammel spenntabell og EC5-kontroll – aldri svakere enn før.
Nye/migrerte templater skal bruke § 4b direkte.
- `antallCC(len, cc)` → antall medlemmer så c/c aldri > cc (uendret).

---

## 4b. Beregningskjernen (laster + Eurokode 5) – BRUK DENNE

Rene TS-moduler uten three.js (kan testes med `npx tsx`). Enheter: m, kN,
kN/m, kN/m²; geometri i mm. Alt er konservativt og transparent – hver kontroll
gir **utnyttelse** (≤ 1,00 = OK) og en klartekst-utregning til PDF-vedlegget.

| Modul | Innhold |
|---|---|
| `laster.ts` | `LASTFAKTOR`, `LASTTYPER` (ψ, varighet), `TAKTEKKE`/`taktekkeFra()`, `NYTTELAST`, `vedlast()`, `mu1()`, `snolastTak()`, `snolastTerrasse()`, `snoFonnInntilHoyereTak()`, `vindlast()`, `vindOppdrift()`, `vindHorisontal()`, `fmt()` |
| `snolast-data.ts` | `snolastPaMark({kommune, hoydeMoh, skManuell})`, `SK_STANDARD` (3,5), `SK_RESERVE` (4,5), utdrag `SNOLAST_KOMMUNER` |
| `dimensjonering.ts` | materialer (C18/C24/C30/GL28c/GL30c), `KMOD`/`KDEF`, tverrsnittslister, `kontrollerBjelke`, `velgBjelke`, `maksSpenn`, `kontrollerSoyle`, `velgSoyle`, høynivå `dimensjonerGulvbjelke/Sperre/Drager/Stolpe/Stender`, `taklaster`, `gulvlaster`, `forklarKontroll` |
| `geometri.ts` | `sperreGeometri` (lengde, fuglemunn ≤ h/3, HAP, øvre svillhøyde for pult, omriss), `valmGeometri` (grat β, kinnkutt, senking, skiftesperrer), `trappGeometri`, `loddkutt`/`vannrettKutt`/`kinnkutt`, `rundOppKapp` (5 mm), `fmtGrader` (1 des.), `fmtMm` |
| `fundament.ts` | `frostdybde({sone|F10, grunn, snofri?})` (Stefan med n-faktor: snødekt 0,5 / snøfri 0,9 – carport/garasje/tett tak/brøytet ⇒ `snofri: true`), `dimensjonerPunktfundament` (bæreevne: betong + jordprisme rett over sålen; oppløft: betong + jordkjegle 15°, 16 kN/m³), `jordvektPrisme`, `FUNDAMENTER` (pilarrør, såler 400–1000), `BETONGBLOKKER`, `FUNDAMENTER_MED_BLOKKER`, `betongvekt`, `jordvektOverSaale`, `saalebredde`, `forankringsraad`, `GRUNN`, `FROSTSONER` |
| `byggesak.ts` | `vurderByggesak(ByggesakInput)` (SAK10 § 4-1 a/b/c, § 3-1), `rekkverkKrav` (TEK17 § 12-17), `tilByggeregler()` → `Byggeregler`. Rekkverkslast `REKKVERK_LAST_KAT_A` = 1,0 kN/m (laster.ts) og `kontrollerRekkverkstolpe` (dimensjonering.ts) |
| `fagverk.ts` | `losFagverk` (2D stivhetsmetode) og `dimensjonerTakstol` (Fink/pult, EC5 6.23 i overgurt). `templates/felles-fagverk.ts` re-eksporterer |
| `beregningsgrunnlag.ts` | `lagBeregningsrapport(...)` → `Beregningsrapport`; `tilPlanVedlegg(rapport)` → PDF-ens `Beregningsgrunnlag` (`plan-typer.ts`); `ANSVARSFRASKRIVELSE`, `STANDARDER` |

**Grunnlag/valg** (se kommentarer i koden for kilder og usikkerhet):
- NS-EN 1990 NA: 6.10a (1,35G + 1,5ψ0Q) og 6.10b (1,2G + 1,5Q1 + 1,5ψ0Qi). Snø ψ0/ψ2 = 0,7/0,2.
- NS-EN 1995-1-1 NA: γM 1,25 heltre / 1,15 limtre; snø = korttidslast; nyttelast = middels.
  kmod/kdef etter tjenesteklasse: **2 = overdekket ute** (tak, bod), **3 = værutsatt** (terrassebjelkelag, frie stolper).
- Kontroller: bøying (k_h, vipping for dragere), skjær (k_cr 0,67), trykk ⊥ ved opplegg (k_c,90 = 1,0),
  nedbøyning: gulv L/400 (Q) og L/200 (fin); tak/drager L/300 og L/200. Søyler: k_c (βc 0,2/0,1), trykk mot svill; med `MQk` (moment fra vind/kneband) trykk + bøying etter EC5 6.23/6.24. `dimensjonerDrager` tar `vinkelGrader` for skrå dragere/åser.
- Snø og nyttelast på terrasse virker ikke samtidig (NS-EN 1991-1-1 3.3.2) → envelope.
- Snølast-tabellen er et UTDRAG med usikkerhet – alltid skriv ut `snolastPaMark().merknader`, og la kunden overstyre sk.

**Typisk bruk i et template**
```ts
const sk = snolastPaMark({ kommune: c.kommune, hoydeMoh: c.moh, skManuell: c.sk }) // eller { skManuell: SK_STANDARD }
const tekke = taktekkeFra(c.taktekke)
const sperre = dimensjonerSperre({ spennHorisontalM, vinkelGrader: c.takvinkel, ccM: 0.6, tekke, sk: sk.sk, opplegglengdeMm: geo.opplegglengdeMm })
const drager = dimensjonerDrager({ spennM: stolpeAvstand, lastbreddeM: dybde / 2 + oh, flatelaster: taklaster({ sk: sk.sk, vinkelGrader: c.takvinkel, tekke }) })
const geo = sperreGeometri({ vinkelGrader: c.takvinkel, sperreHoydeMm: sperre.valgt.h, utstikkMm: 300, topp: { type: 'vegg', lopMm: 3000, utstikkMm: 300 } })
// kappliste: geo.kappLengdeMm, vinkler: fmtGrader(geo.loddkutt.gjaeringGrader)
beregningsgrunnlag: (c) => tilPlanVedlegg(lagBeregningsrapport({ produkt: 'carport', tittel: '…', snolast: { mark: sk, tak: snolastTak(sk.sk, c.takvinkel) }, deler: { Sperre: sperre, Drager: drager }, byggesak }))
```
`velg*`/`dimensjoner*` returnerer `Dimensjonering { valgt: Tverrsnitt, kontroll: Medlemskontroll, ok, vurdert, melding }`.
`ok = false` betyr at ingen standarddimensjon holder → legg inn mellomstøtte/drager eller kortere c/c (vis `melding`).
`Tverrsnitt.h` er i **mm** (gamle `BjelkeGrade.h` er i meter).

> ⚠️ Kjernen erstatter ikke RIB. `ANSVARSFRASKRIVELSE` skal alltid med i planen.
> Håndregnede tester: se `designer-core/kjerne.test.mts` i agentens scratchpad (kopier inn i repoet ved behov).

### Framing-byggere
- `byggGulv(target, mat, w, d)` – bjelkelag (48×98) + terrassebord-dekke.
- `byggStendervegg(mat, len, hStart, hEnd)` – stenderverk med svill/toppsvill (returnerer en gruppe; kan skrå topp for pulttak).
- `sperreMellom(...)`, `byggGratsperre(...)` – enkeltsperrer/gratsperrer.

### Tak-byggere (kanoniske; roterer selv etter retning)
- `byggPulttak(target, mat, w, d, topY, vinkel, oh, retning, tekke)`
- `byggSaltak(...)` – møne + gradert mønebjelke + kingposts.
- `byggValmtak(...)` – stretcher + tverrbjelker + 4 gratsperrer.
- `byggSkraatak(...)` – enkelt skråtak (front/bak-høyde).
- Tekking: `byggTakplate` (18 mm kryssfiner) + `byggTaktekke` (papp/shingel/stål/polykarbonat).
- Detaljer: fascia/vindski (`rakeGeo`), gesimsbord (`friezeGeo`), soffitt under
  utstikk (`soffittRing`), taklekt-hakk. Konstanter: `FASCIA_*`, `TOPPBORD_*`,
  `TAK_PLY = 0.018`.

### Takstoler (trusses – SINTEF Byggforsk)
Sal- og pulttak bygges som ekte **triangulerte takstoler** c/c ≤ 600 (én per
sperre, på samme x som sperra), ikke fritt spennende ås/møne. To hjelpere:
- `strut(a, b, thick, depth)` – rett stav mellom to 3D-punkter (til kingpost o.l.).
- `beam2D(xc, thick, p0, p1, depth, cutA, cutB, …)` – stav i takstolplanet med
  **vinklede endekutt**: hver ende kappes parallelt med retningen den butter mot
  (typisk sperreretningen), så diagonalene ligger flust under sperrene i stedet
  for rette kutt som spriker/stikker gjennom. Dette er «cut angles»-kravet.

Alle gurt-/web-staver har **samme tverrsnitt som sperrene (48 × min. 148 mm)**:
- **Saltak** – king-post-takstol: eksisterende sperrepar = overgurter,
  **undergurt** (tverrbjelke mellom raftveggene, tar strekket) + **kingpost** opp
  til mønet + to **Fink-diagonaler** fra undergurt-senter opp til sperras midt.
  Mønet er et lett **mønebord**.
- **Pulttak** – mono-takstol: sperre = overgurt, **undergurt** ved veggtoppen +
  **loddrette stivere** (straight up) fra undergurt opp til sperra, c/c ≤ 1,2 m;
  toppen kappes parallelt med sperra. Sperra graderes for halvt fallspenn.
- **Valmtak** – stretcheren hviler allerede på tverrbjelkene (c/c 600); ikke
  konvertert til takstol ennå.

> ⚠️ Takstol-stavene (undergurt/kingpost/diagonaler) bygges i 3D
> (`konstruksjon.ts`), men templatenes `deler()` (materialliste) teller dem IKKE
> ennå – synk `deler()` før byggeplanen for et takstol-tak selges.

### Explode / splittvisning
`settSplitt(root, amount)` leser `userData.explode` (en retningsvektor per
del) og sprer delene ut. Sett `m.userData.explode = new THREE.Vector3(...)` på
deler som skal fly ut i splittvisning.

---

## 5. Fire byggeteknikker (mønstre å kopiere)

**Gulv** – bjelkelag på betongklosser + terrassebord-dekke som fyller rammen
(siste bord «rippes» smalere). Se `soppelbod.ts` `geo/deler/buildMesh` eller
`byggGulv`. c/c 450 for 21×98-bord, 600 for 28×120.

**Framing (vegg)** – bunnsvill + doble hjørnestolper (L av to 48×98) + dobbel
toppdrager (gradert etter spenn) + mellomstendere c/c ≤ 600 + horisontal losholt
c/c 600. Toppdrageren bærer taket. Se `soppelbod.ts:456+`.

**Åpninger og bæringsstender (SINTEF Byggforsk)** – enhver dør/luke/åpning i en
bærevegg MÅ ha opplegg i hver side: en gjennomgående **bæringsstender** som
fører lasten fra dragerbjelken/toppdrageren («header») ned til svill/bjelkelag.
Del aldri opp en bærende drager over flere fag uten stender under hvert opplegg.
Mønster i `vedskjul.ts`: fronten deles i N dørfag; den doble toppdrageren er
headeren, og den bæres av hjørnestolpene + én bæringsstender ved hver skillevegg.
Innvendige **skillevegger** (svill + toppsvill + stendere c/c ≤ 600) deler
rommene og gir samtidig opplegg for headeren.

**Kledning – to metoder:**
1. *Bord for bord* (`soppelbod`, `plantekasse`): løkke som legger enkeltbord med
   luftesprekk, hvert bord kappet til takfallet. Tagg `part = 'kledning'`.
   Materialliste teller totale løpemeter.
2. *Panel* (`carport`): store flater via `BoxGeometry`/`ExtrudeGeometry` (trapes
   som følger takflaten). Tagg `part = 'vegg'`. Materialliste teller m².

**Tak** – velg builder etter `c.taktype`, send veggtoppen (`yTopPlate`) og
utstikket (`oh`). Builderen lager sperrer, tekking, fascia og legger alt i
`part = 'tak'`.

---

## 6. Materialer, farger, priser

- `materials.ts`: `TRESLAG` (impregnert/gran/royal/lerk/kebony, hver med
  `prisFaktor`) og `FARGER`. `resolveColor(treslag, farge)` blander treslagets
  varme inn i beisen. Templatet velger utvalget med `treslagValg([...])` /
  `fargeValg([...])`.
- `priser.ts`: sentral `PRISER`-tabell (NOK per lm/stk/m², impregnert som basis,
  norske byggevarehus juli 2026). `prisFor(id)` slår opp. Objektet er **mutbart**
  – UI-et kan justere en pris live og templatene leser gjeldende verdi.
- BOM-pris = løpemeter × `prisFor(mat)` × treslag-faktor × svinn + beslag/skruer/tekke.

---

## 7. Pris, arbeidstid og leveranser

`beregn()` returnerer `estimatKr` (veiledende materialkost) + valgfri
`arbeidstimer`. Skallet regner tre leveransepriser (`DesignerPage.tsx` ~L645):

```
materialPris = estimatKr × 1.3            (MATERIAL_PAASLAG)
arbeidPris   = arbeidstimer × 800 kr/t    (BYGGE_TIMEPRIS)
prisFerdig   = materialPris + arbeidPris        → «Ferdig bygget»
prisPakke    = materialPris + kappPris          → «Materialpakke»
```

Setter templatet `bom.arbeidstimer`, brukes det direkte; ellers skaleres en
standardtid ut fra materialmengden. `leveranser` bestemmer hvilke kort som
tilbys (utelatt = alle). Se memory `designer-pricing-dual-source`.

---

## 8. 2D-tegninger og byggeplanen (PDF)

`tegning2D(c)` / `soknadTegning(c)` returnerer rene `Riss2D` (plan/fasade/snitt)
tegnet fra de SAMME parametrene som 3D – ikke en projeksjon av mesh-en. Enheter
cm, y nedover (SVG). `Riss2D.type` klassifiserer arket. Valgfrie tillegg
(akser, snittmarkører, skravur, påskrifter, fast målestokk) ligger i
`plan-typer.ts` (`Riss2DPlan`). Måltekster i cm gjøres om til mm automatisk.

Byggeplanen er en **vektor-PDF** (jsPDF-primitiver, ingen skjermbilder):

| Modul | Innhold |
|---|---|
| `plan-typer.ts` | Valgfrie plan-typer: `Beregningsgrunnlag` (vedlegg), `KapplisteDelPlan` (pos, mm, kappvinkler), `BomLinePlan` (kategori, kvalitet, pris), `Riss2DPlan`, `MonteringSteg`, `hentBeregningsgrunnlag()` |
| `plan-flate.ts` | Tegneflate med to bakender: `PdfDok` (jsPDF) og `SvgDok` (forhåndsvisning). Tekst saneres til WinAnsi |
| `plan-tegning.ts` | Tegnings-scene i mm + renderer: målekjeder, akser, snitt, nivåer, skravur, bobler; `rissTilTegning()` |
| `plan-modell.ts` | 3D-modellen → konstruksjonstegninger (plan/oppriss/snitt via projeksjon + malerens algoritme), kappvinkler målt i geometrien, `kontrollerModell()` (QA 3D ↔ kappliste) |
| `plan-detaljer.ts` | Parametriske detaljer (stolpefot, fundament, sperre på drager, takfot, dekke) |
| `plan-kapp.ts` | Kappeplan: standardlengder å kjøpe (best fit, sagsnitt) |
| `plan-ark.ts` | Sidene: forside, prosjektinfo/tegningsliste, tegningsark med tegningshode, materialliste, kappliste, montering, beregningsvedlegg, råd |
| `byggetrinn.ts` | Klassifiserer deler i byggetrinn (fundament → … → kledning) – brukes av «Bygg steg for steg» i 3D og illustrasjonene i monteringen |
| `byggested.ts` | Felles config-felt `kommune`/`moh`/`sk`/`frostsone`/`grunn` + `snolastForConfig(c)`, `frostForConfig(c, { snofri })`, `frostsoneForConfig(c)`, `grunnForConfig(c)` (standard 'ukjent' = konservativ telefarlig, 100 kPa), `skrivByggested`/`overforByggested` |

**Hold 3D, kappliste og tegninger i takt:** konstruksjonstegningene og
kappvinklene leses fra `buildMesh()`. `userData.info` (navn|profil|lengdeCm)
kobler 3D-delene til kapplista (posisjonsbokstaver A, B …). Kjør
`kontrollerModell(lesModell(t.buildMesh(c)), t.kappliste(c))` for å finne avvik.

---

## 9. Sjekkliste – legg til et nytt produkt

1. Kopiér nærmeste template i `templates/` (bod/hus → `soppelbod.ts`).
2. Definer `<Navn>Config` + `defaultConfig`.
3. Bygg `deler(c)` (materialliste-kilde) og `buildMesh(c)` (3D) fra SAMME geometri.
   Gjenbruk `konstruksjon.ts` – ikke skriv 3D på nytt (memory `reuse-existing-3d-models`).
4. Tagg hver mesh med riktig `part`/`pid`/`info`. Vil du at «Kledning/Tak/Gulv»-
   knappene skal virke, bruk de part-nøklene (eller legg nye i `DesignerPage.tsx`).
5. Fyll ut `dimensjoner`, `alternativer`, `materialer`, `valg`, `presets`, `parts`.
6. Implementer `beregn` (+ `arbeidstimer`), `kappliste`, `bounds`, `tegning2D`, `montering`, `raad`.
7. Registrer i `registry.ts` (`TEMPLATES`).
8. Ny prispost? Legg den i `priser.ts`.
9. Test i `/designverktoy/<id>`: splittvisning, alle lag-knapper, paint bucket, 2D, materialliste.

---

## Relaterte notater (auto-memory)

- `designer-engine` – overordnet mål (gratis design, gated BOM/tegninger).
- `valmtak-ns3478-spec` – framing-geometri for valmtak.
- `designer-eurocode-compliance` – status på lastberegning.
- `reuse-existing-3d-models` – port geometri fra eksisterende visualizere.
- `designer-pricing-dual-source` – hvor byggeplan-pris bor.
