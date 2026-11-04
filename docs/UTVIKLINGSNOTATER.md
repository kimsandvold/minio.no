# Utviklingsnotater

Notater for videre utvikling av minio.no. Ikke påbegynt — idéstadiet.

## Lav-terskel lead-skjema og verdikommunikasjon (2026-09-15)

**Mål:** Gjøre det enkelt for potensielle kunder å knytte kontakt og starte en diskusjon — uten at de må kjøpe noe.

1. **Lav-terskel lead-skjema**
   - Et skjema/kontaktpunkt med minimal friksjon som senker terskelen for å ta kontakt og starte diskusjoner.
   - Må finne en god løsning på formatet (skjema, chat, "book en prat", e.l.).

2. **Vise besparelser**
   - Trenger en måte å vise/fortelle at man sparer **penger, tid og arbeid** ved å bruke Minio.

3. **Merverdi-budskap**
   - Noe som forteller at Minio gir **merverdi for deg som bruker**.

4. **Gratis inngang til nettverket**
   - Kjerneprinsipp: man skal **ikke trenge å kjøpe noe** for å bli en del av nettverket.

## Nettverk = trygghet (2026-09-19)

Diskusjon rundt punktene over. Konklusjon: **nettverkets innhold er trygghet for
sluttbrukeren.** Det gir ordet en referent det manglet.

### Det strukturelle argumentet

SEO-motoren (50+ byggeguider) skaper etterspørsel i **hele Norge**.
Produksjonskapasiteten er **ett verksted på Lillehammer** — se
`src/utils/leveringsavstand.ts`, som bokstavelig talt måler radiusen.
Nettverket er ikke branding, det er den eneste måten å betjene trafikken
som allerede finnes.

Følge: etterspørselssiden er dekket. **Hele cold-start-problemet ligger på
tilbudssiden** (utførere/leverandører).

### Tryggheten finnes allerede i koden — den kalles bare noe annet

| Finnes i dag | Hvor | Egentlig betydning |
|---|---|---|
| `ferdig` \| `materialpakke` | `src/types/foresporsel.ts` | «Klarer du ikke selv, tar vi over» |
| Rådgivning + gjennomgang av tegning | `/byggehjelp` | «Du kan spørre noen» |
| Eurocode / NS 3478 / kappliste | `src/designer/konstruksjon.ts` | «Planen holder» |

Alle tre ligger som produktvalg bak innlogging, langt nede i trakten. Ingen av
dem møter brukeren i **tvilsøyeblikket** (i planleggeren, når hen lurer på om
bjelkene bærer). Billigste store endring: flytt dem dit tvilen oppstår, og
formuler dem som løfte i stedet for prisliste.

### Trygghetsstigen

1. **Planen er kvalitetssikret** — finnes, må bare vises på artefaktet. Nær gratis.
2. **Du mister ikke arbeidet ditt** — prosjektet lagres. Billig.
3. **Du kan spørre om ditt prosjekt** — én async kanal, hengt på konfigurasjonen. Billig, stor effekt.
4. **Noen kan ta over** — `ferdig` / `materialpakke`. Finnes; må kommuniseres, ikke bygges.
5. **Noen i nærheten kan ta over** — krever utførernettverk. Dyrt, senere — og *det* er nettverket.

**Trinn 1–4 er uavhengige av hvilken nettverksform som velges, og kan bygges nå.**

### Designprinsipp for lead-fangsten

Ikke «et lead-skjema». Brukeren har allerede gjort jobben — konfigurasjonen *er*
leadet. Spørsmålet er aldri «vil du kontakte oss?» (salgsgest, høy terskel), men
«vil du ha denne med deg?» (servicegest, ingen terskel). E-post blir middelet til
å få sin egen ting tilbake, ikke en bomstasjon.

Ett felt, kontekstuelt, overalt hvor det finnes et artefakt (planleggere,
designer, kalkulatorer). Payload henger på automatisk: produkt, mål, BOM, estimat.

Avvist: chat (skaper svartidsforventning én person ikke kan holde) og «book en
prat» (for stor forpliktelse for privatperson; B2B-format).

### Innlogging

Google-innlogging beholdes — et nettverk krever identitet, og anonyme brukere er
ikke medlemmer. Men **når**, ikke **om**: innlogging *før* verdi er bunnpropp;
innlogging *som innmelding*, etter at de har laget noe de vil beholde, leser som
medlemskap.

- **Arbeidet må overleve innloggingen.** Planleggerne bruker allerede
  localStorage — lagre lokalt først, migrer til Firestore ved innlogging.
  Enklere enn anonym auth, og Google-kravet beholdes.
- **Google-only koster rekkevidde.** Målgruppa (huseiere 45–65) bruker mye
  Hotmail/Outlook/iCloud. Firebase e-postlenke er ~samme kodemengde og dekker
  resten. Ikke avgjort.

### Om besparelser (punkt 2 over)

Tallene finnes allerede: `estimatKr`, `prisEstimatKr`, kapplista. Besparelsen bør
**utledes fra brukerens eget design**, ikke påstås i markedsføringstekst.

Ikke gå på «billigere enn snekker» — uprøvbart, og inviterer til prisshopping.
Vinkling: planen hindrer de dyre feilene. «Kapplista gir eksakt antall bord.
Typisk overkjøp uten kappliste er 10–15 % → ~1 500 kr på ditt prosjekt.»

NB: udokumenterte besparelsespåstander mot forbruker er regulert
(markedsføringsloven). Bare tall som kan utledes eller kildes, med grunnlaget synlig.

### Svartid

Null stress på *volum* er ikke null stress på *svartid*. Trygghet dør hvis
spørsmålskanalen går tom. Regel: **lov bare det som er automatisk, la menneskelig
svar være en bonus.** Aldri et «svarer innen 24t»-løfte som ikke holder i fellesferien.

### ÅPENT — må avgjøres før trinn 5

Hvem er medlemmene utover sluttbrukerne?

- **A. Utførernettverk** — snekkere/småbedrifter/leverandører som tar jobber
  utenfor Lillehammer-radiusen. Passer businessmodellen (config → produksjon) og
  løser rekkevidde. Krever rekruttering + kvalitetssikring, men kan starte med
  2–3 stk uten at brukeren merker at det er lite.
- **B. Byggernettverk (peers)** — privatpersoner som deler prosjekter og erfaring.
  Sterk trygghetseffekt («342 har bygget denne»), men brutal cold start og krever
  moderering.
- **C. Minio som garantist** — ingen tredjepart. Ærlig MVP (= trinn 1–4), men
  skalerer ikke utover kjøreavstand, og er strengt tatt støtte, ikke nettverk.

Status: til vurdering.

## Sidegesjeft: nettsider/verktøy for bedrifter (2026-11-03)

Diskusjon om å starte et sideprosjekt ved siden av Minio. Utgangspunktet var
«headless hjemmesider til bedrifter med Supabase/Firebase». Ikke besluttet —
notert her fordi to av konklusjonene berører minio.no direkte.

### Omformuleringen

«Headless med Supabase/Firebase» er rørlegging, ikke et produkt. Ingen kunde
etterspør en arkitektur. Og «hjemmesider til bedrifter» er en vare som ikke lar
seg skille fra Squarespace, Framer, nevøen eller «nettside fra 4 900,-» —
konkurransen blir på pris, og priskonkurranse er spesielt ille som bigeskjeft:
kundene som betaler minst krever mest, og supportbyrden varer i årevis.

Men valget av Supabase/Firebase røper hva som egentlig er ønsket: å bygge
**applikasjoner**, ikke brosjyresider. En brosjyreside trenger ikke database,
auth eller backend.

### Det faktiske fortrinnet

`src/designer/` er en parametrisk konstruksjonsmotor: lastberegning etter
Eurokode, snølast per kommune, kappeoptimalisering mot lagerlengder, SVG-/PDF-
generering av arbeidstegninger, femten produktmaler. Svært få norske
solo-utviklere kan bygge det, og nesten ingen byråer vil bygge det for
budsjettet til en liten produsent.

**Nisjen:** konfiguratorer og regneverktøy for bedrifter som selger «etter mål»
— trapper, kjøkken, garasjeporter, markiser, persienner, peiser. Bedrifter som
i dag tar imot forespørsler på e-post og regner pris manuelt. Én slik kunde
betaler som femten brosjyresider og genererer langt mindre support.

### Merkevare: separat, men med Minio som referanse

**Beslutning (foreløpig): eget domene og merkenavn, ikke under Minio.**

- En bedriftseier som leter etter utvikler og lander på minio.no, ser
  plantekasser og skjærefjøler. Minios posisjonering (konfigurasjon først,
  håndverk, Lillehammer) blir uklar hvis den også skal selge integrasjoner.
- Koblingen skal likevel ikke skjules — den er salgsargumentet. **Pilen går én
  vei:** utviklersiden lenker til minio.no som flaggskip-referanse
  («dette bygde jeg selv, inkludert beregningsmotoren»). Minio lenker ikke
  tilbake og forblir ren.
- Dette er en referanse andre frilansere ikke kan matche, fordi det ikke er et
  kundeoppdrag, men egen drift.

Navnevalg: ikke lås det til «web»/«nettsider» (dytter mot priskonkurransen), og
ikke avled det av Minio-navnet (`minio-web.no` e.l. arver forvirringen). Eget
navn eller noe nøytralt som tåler at tilbudet dreier mot verktøy og produkt.

### Feilmodusen å passe på

Utviklere erstatter salg med bygging. Konkret risiko: domenet kjøpes, så skal
det jo være en side der, og siden blir et designsystem med prerendering og 100 i
Lighthouse. Tre helger går, det føles som framdrift, og det gir null kunder.

**Derfor: kjøp domenet (billig, reversibelt, navn blir tatt), men ikke bygg
siden ennå.** Første kunde kommer fra nettverk — Innlandet, ECIT, leverandører
Minio allerede snakker med — ikke fra en nettside. Beviset i den samtalen er
minio.no, som allerede finnes. Bygg siden når første kunde er i havn; da vet du
hva den skal si, i stedet for å gjette.

Første oppdrag bør være lite nok til å bli ferdig: én konfigurator for ett
produkt, fast pris, fast omfang.

### Tripwire mot Minio

**Betingelse før første oppdrag tas: Minio må kunne ta imot en betaling.**

Kundefrister vinner alltid over egne produktfrister. Blir ikke inntektsrøret
koblet først, blir det aldri koblet. Konkret står det på DKIM og SPF for
minio.no (se notatet om e-postinfrastruktur) — en kveldsjobb, ikke et prosjekt.

### ÅPENT — avgjør før noe startes

Hva er målet med sidegesjeften? Svaret endrer strategien vesentlig:

- **A. Ekstra inntekt** — rent tjenestesalg. Ta oppdrag, fakturer timer, ikke
  tenk produkt. Enklest, skalerer ikke.
- **B. Mer interessant arbeid enn jobben gir** — vær kresen fra dag én, ta bare
  konfiguratorjobber selv om det betyr færre kunder.
- **C. Ut av ansettelse på sikt** — da er tjenestesalg feil vei; det skalerer
  ikke uten flere timer. Konfiguratormotoren som allerede finnes er en bedre
  kandidat: samme motor, mange kunder.

Status: ubesvart.

### Parkert

Mva og selskapsform ble diskutert, men er ikke problemstillingen nå. Kort for
senere: grensen er 50 000 kr avgiftspliktig omsetning over rullerende tolv
måneder, og den gjelder **juridisk enhet** — ikke merkevare. Webutvikling er
fullt avgiftspliktig, så ett–to oppdrag passerer grensen, og da må minio.no
legge 25 % på byggeplaner og gravering (salgsbetingelsene § 3 og
`PRIS_ER_ENDELIG` lover i dag at prisen er endelig). Eget merkenavn skiller
ikke mva; bare egen juridisk enhet gjør det. Mot B2B er mva nøytralt, mot
forbruker er det ren prisøkning — så på sikt hører de to hjemme i hver sin
enhet. Ikke aktuelt før det finnes omsetning.
