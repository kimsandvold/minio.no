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

### Dimensjonering (span-gradering)
Forenklet Eurocode/Byggforsk-tilnærming, snølast ~3 kN/m², c/c 600:

- `gradBjelke(spanM, cc)` → minste C24-gulvbjelke som bærer spennet (Byggforsk 522.351).
- `maksGulvSpenn(cc)` → når spennet er større trengs en midtre bæredrager.
- `gradSperre(spanM)` → minste sperre for takfallslengden.
- `gradMonebjelke(w, d)` → bærende mønebjelke, dobles/tredobles ved store spenn (bøyekontroll).
- `antallCC(len, cc)` → antall medlemmer så c/c aldri > cc.

> ⚠️ Dette er en approksimasjon, ikke full lastberegning. Se memory
> `designer-eurocode-compliance`.

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

## 8. 2D-tegninger

`tegning2D(c)` / `soknadTegning(c)` returnerer rene `Riss2D` (plan/fasade/snitt)
tegnet fra de SAMME parametrene som 3D – ikke en projeksjon av mesh-en. Enheter
cm, y nedover (SVG). `Riss2D.type` klassifiserer arket i søknadsheftet.
Rendering i `tegningSvg.ts`, PDF i `pdf.ts`.

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
